#pragma once

#include <stdint.h>
#include <string>

enum class CodecBoxDecoderState
{
    Init,
    Failed,
    Ended,
    Metadata,
    Audio,
    Video
};

class CodecBoxDecoderContext;

class CodecBoxDecoder
{
public:
    //CodecBoxDecoder(const char* filePath);
    CodecBoxDecoder(const std::string& filePath);
    ~CodecBoxDecoder();
    CodecBoxDecoderState get_state() const { return state; }
    double get_duration() const { return duration; }
    double get_startTime() const { return startTime; }
    int get_width() const { return width; }
    int get_height() const { return height; }
    double get_frameRate() const { return frameRate; }
    int get_sampleRate() const { return sampleRate; }
    void set_sampleRate(int sr);
    int get_channels() const { return channels; }
    double get_bufferPresentationTime() const { return bufferPresentationTime; }
    double get_bufferDuration() const { return bufferDuration; }
    int get_bufferSampleCount() const { return bufferSampleCount; }
    // void* get_buffer() const { return buffer; } // embind has problem with getter that returns raw pointer?
    uintptr_t get_buffer() const { return (uintptr_t)buffer; }
    bool get_hasVideo() const { return hasVideo; }
    bool get_hasAudio() const { return hasAudio; }
    bool get_videoEnabled() const { return videoEnabled; }
    void set_videoEnabled(bool enabled) { videoEnabled = enabled; }
    bool get_audioEnabled() const { return audioEnabled; }
    void set_audioEnabled(bool enabled) { audioEnabled = enabled; }
    void decode();

private:
    CodecBoxDecoderState state;
    double duration;
    double startTime;
    int width;
    int height;
    double frameRate;
    int sampleRate;
    int channels;
    double bufferPresentationTime;
    double bufferDuration;
    int bufferSampleCount;
    void* buffer;
    bool hasVideo;
    bool hasAudio;
    bool videoEnabled;
    bool audioEnabled;
    CodecBoxDecoderContext* context;

friend class CodecBoxDecoderContext;
};
