extern "C"
{
#include <libavcodec/avcodec.h>
#include <libavformat/avformat.h>
#include <libswscale/swscale.h>
#include <libavutil/opt.h>
#include <libavutil/channel_layout.h>
#include <libavutil/samplefmt.h>
#include <libswresample/swresample.h>
} // end extern "C"

#include <stdio.h>
#include <stdlib.h>
#include <algorithm>

#include "CodecBoxDecoder.h"

#define JIF(expr, ...) if(expr) { fprintf(stderr,  __VA_ARGS__); fputs("\n", stderr); goto err; }

static AVCodecContext* createCodecContext(AVFormatContext* formatContext, int streamId)
{
    AVCodecContext* codecContext = nullptr;
    auto orignalContext = formatContext->streams[streamId]->codec;
    auto codec = avcodec_find_decoder(orignalContext->codec_id);
    JIF(codec == nullptr, "failed avcodec_find_decoder %d", orignalContext->codec_id);
    codecContext = avcodec_alloc_context3(codec);
    JIF(codecContext == nullptr, "failed avcodec_alloc_context3");
    JIF(avcodec_copy_context(codecContext, orignalContext) != 0, "failed avcodec_copy_context");
    JIF(avcodec_open2(codecContext, codec, nullptr) < 0, "failed avcodec_open2");

    return codecContext;
err:
    if (codecContext) avcodec_free_context(&codecContext);
    return nullptr;
}

class CodecBoxDecoderContext
{
public:
    CodecBoxDecoder& host;
    AVFormatContext* formatContext;
    int videoStream;
    int audioStream;
    AVCodecContext* videoCodecContext;
    AVCodecContext* audioCodecContext;
    SwsContext *sws;
    SwrContext *swr;
    AVFrame* decodedFrame;
    AVFrame* videoFrame;
    void* videoBuffer;
    float* audioBuffer;

    CodecBoxDecoderContext(const char* filePath, CodecBoxDecoder& host_):
        host(host_),
        formatContext(nullptr),
        videoStream(-1),
        audioStream(-1),
        videoCodecContext(nullptr),
        audioCodecContext(nullptr),
        sws(nullptr),
        swr(nullptr),
        decodedFrame(nullptr),
        videoFrame(nullptr),
        videoBuffer(nullptr),
        audioBuffer(nullptr)
    {
        host.state = CodecBoxDecoderState::Init;
        JIF(avformat_open_input(&formatContext, filePath, nullptr, nullptr) != 0,
                "failed avformat_open_input: %s", filePath);
        JIF(avformat_find_stream_info(formatContext, nullptr) < 0,
                "failed avformat_find_stream_info: %s", filePath);
        av_dump_format(formatContext, 0, filePath, 0);

        host.duration = (double)formatContext->duration / AV_TIME_BASE;
        host.startTime = (double)formatContext->start_time / AV_TIME_BASE;

        for (int i = 0; i < formatContext->nb_streams; i++)
        {
            auto type = formatContext->streams[i]->codec->codec_type;
            if (videoStream < 0 && type == AVMEDIA_TYPE_VIDEO) videoStream = i;
            else if (audioStream < 0 && type == AVMEDIA_TYPE_AUDIO) audioStream = i;
        }

        JIF(videoStream < 0 && audioStream < 0 , "no audio/video stream found in %s", filePath);

        if (videoStream >= 0)
        {
            videoCodecContext = createCodecContext(formatContext, videoStream);
            JIF(videoCodecContext == nullptr, "video codec not supported");
            host.hasVideo = true;
            host.width = videoCodecContext->width;
            host.height = videoCodecContext->height;
            // videoCodecContext->framerate is usually not useful (0)
            auto fr = formatContext->streams[videoStream]->avg_frame_rate;
            host.frameRate = (double)fr.num / fr.den;
        }
        if (audioStream >= 0)
        {
            audioCodecContext = createCodecContext(formatContext, audioStream);
            JIF(audioCodecContext == nullptr, "audio codec not supported");
            host.hasAudio = true;
            host.sampleRate = audioCodecContext->sample_rate;
            host.channels = 2; // will be re-sampled as AV_CH_LAYOUT_STEREO. // audioCodecContext->channels;
        }
        decodedFrame = av_frame_alloc();
        JIF(!decodedFrame, "faild to alloc decodedFrame");
        host.state = CodecBoxDecoderState::Metadata;
        return;
    err:
        host.state = CodecBoxDecoderState::Failed;
        close();
    }

    ~CodecBoxDecoderContext()
    {
        close();
    }

    void close()
    {
        free(videoBuffer);
        videoBuffer = nullptr;
        free(audioBuffer);
        audioBuffer = nullptr;
        if (swr) swr_free(&swr);
        if (sws) sws_freeContext(sws);
        sws = nullptr;
        if (decodedFrame) av_frame_free(&decodedFrame);
        if (videoFrame) av_frame_free(&videoFrame);
        if (videoCodecContext)
        {
            avcodec_close(videoCodecContext);
            avcodec_free_context(&videoCodecContext);
        }
        if (audioCodecContext)
        {
            avcodec_close(audioCodecContext);
            avcodec_free_context(&audioCodecContext);
        }
        if (formatContext) avformat_close_input(&formatContext);
    }

    void decode()
    {
        if (host.state < CodecBoxDecoderState::Metadata) return;
        AVPacket packet;
        if(av_read_frame(formatContext, &packet) < 0)
        {
            host.state = CodecBoxDecoderState::Ended; // TODO error?
            close();
            return;
        }

        host.state = CodecBoxDecoderState::Metadata;
        host.buffer = nullptr;
        int frameFinished;
        auto timeBase = formatContext->streams[packet.stream_index]->time_base;
        host.bufferPresentationTime = (double)packet.pts * timeBase.num / timeBase.den;
        host.bufferDuration = (double)packet.duration * timeBase.num / timeBase.den;

        if(host.videoEnabled && (packet.stream_index == videoStream))
        {
            ensureVideoPostProcess();
            if (host.state < CodecBoxDecoderState::Metadata) goto err;
            avcodec_decode_video2(videoCodecContext, decodedFrame, &frameFinished, &packet);
            if(frameFinished)
            {
                sws_scale(sws, decodedFrame->data, decodedFrame->linesize, 0, videoCodecContext->height,
                          videoFrame->data, videoFrame->linesize);
                host.state = CodecBoxDecoderState::Video;
                host.buffer = videoBuffer;
            }
        }
        else if (host.audioEnabled && (packet.stream_index == audioStream))
        {
            host.bufferSampleCount = 0;
            ensureAudioPostProcess();
            if (host.state < CodecBoxDecoderState::Metadata) goto err;

            while (packet.size > 0)
            {
                int len = avcodec_decode_audio4(audioCodecContext, decodedFrame, &frameFinished, &packet);
                if (len <= 0) break;
                packet.size -= len;
                packet.data += len;
                if (!frameFinished) continue;
                int padding = 32;
                int newSize = std::min(2048, host.bufferSampleCount + decodedFrame->nb_samples + padding) *
                        host.channels * sizeof(audioBuffer[0]);
                auto buf = (float*)realloc(audioBuffer, newSize);
                if (buf == nullptr) break; // TODO handle error
                audioBuffer = buf;
                auto tail = audioBuffer + host.bufferSampleCount * host.channels;
                int n = swr_convert(swr, (uint8_t **)(&tail), decodedFrame->nb_samples + padding,
                        (const uint8_t **)decodedFrame->data, decodedFrame->nb_samples);
                if (n < 0) break;
                host.bufferSampleCount += n;
            }
            host.state = CodecBoxDecoderState::Audio;
            host.buffer = audioBuffer;
        }
    err:
        av_free_packet(&packet);
    }

    void ensureVideoPostProcess()
    {
        if (host.state < CodecBoxDecoderState::Metadata) return;
        if (sws) return;
        auto destFmt = AV_PIX_FMT_RGBA;
        int numBytes = avpicture_get_size(destFmt, host.width, host.height);
        videoBuffer = (uint8_t *) av_malloc(numBytes);
        sws = sws_getContext(
                videoCodecContext->width,
                videoCodecContext->height,
                videoCodecContext->pix_fmt,
                host.width,
                host.height,
                AV_PIX_FMT_RGBA, // 也可以是 AV_PIX_FMT_RGBA 等
                SWS_BILINEAR,
                NULL,
                NULL,
                NULL
               );
        videoFrame = av_frame_alloc();
        avpicture_fill((AVPicture*)videoFrame, (uint8_t *)videoBuffer, destFmt, host.width, host.height);

        JIF(!videoBuffer || !sws || !videoFrame, "failed to alloc video buffers.");
        return;
    err:
        host.state = CodecBoxDecoderState::Failed;
        close();
    }

    void ensureAudioPostProcess()
    {
        if (host.state < CodecBoxDecoderState::Metadata) return;
        if (swr) return;
        swr = swr_alloc();
        JIF(!swr, "failed to alloc audio resampler.");
        av_opt_set_channel_layout(swr, "in_channel_layout", audioCodecContext->channel_layout, 0);
        av_opt_set_channel_layout(swr, "out_channel_layout", AV_CH_LAYOUT_STEREO, 0);
        av_opt_set_int(swr, "in_sample_rate", audioCodecContext->sample_rate, 0);
        av_opt_set_int(swr, "out_sample_rate", host.sampleRate, 0);
        av_opt_set_sample_fmt(swr, "in_sample_fmt", audioCodecContext->sample_fmt, 0);
        av_opt_set_sample_fmt(swr, "out_sample_fmt", AV_SAMPLE_FMT_FLT,  0);
        JIF(swr_init(swr), "failed to init audio resampler.");
        return;
    err:
        host.state = CodecBoxDecoderState::Failed;
        close();
    }

    void setSampleRate(int sr)
    {
        if (swr)
        {
            int64_t outSampleRate;
            av_opt_get_int(swr, "out_sample_rate", 0, &outSampleRate);
            if (outSampleRate != host.sampleRate)
            {
                av_opt_set_int(swr, "out_sample_rate", host.sampleRate, 0);
                swr_init(swr);
                JIF(swr_init(swr), "failed to init audio resampler.");
            }
        }
        host.sampleRate = sr;
        return;
    err:
        host.state = CodecBoxDecoderState::Failed;
        close();
    }
};

CodecBoxDecoder::CodecBoxDecoder(const std::string& filePath):
        context(nullptr),
        state(CodecBoxDecoderState::Init),
        duration(0),
        startTime(0),
        width(0),
        height(0),
        frameRate(0),
        sampleRate(0),
        channels(0),
        bufferPresentationTime(0),
        bufferDuration(0),
        bufferSampleCount(0),
        buffer(nullptr),
        hasVideo(false),
        hasAudio(false),
        videoEnabled(true),
        audioEnabled(true)
{
    static bool ffInit = false;
    if (!ffInit)
    {
        av_register_all();
        ffInit = true;
    }

    context = new CodecBoxDecoderContext(filePath.c_str(), *this);
}

CodecBoxDecoder::~CodecBoxDecoder()
{
    delete context;
}

void CodecBoxDecoder::decode()
{
    if (state >= CodecBoxDecoderState::Metadata) context->decode();
}

void CodecBoxDecoder::set_sampleRate(int sr)
{
    context->setSampleRate(sr);
}
