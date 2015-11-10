#include "CodecBoxDecoder.h"

#include <emscripten/bind.h>

using namespace emscripten;

EMSCRIPTEN_BINDINGS(codecbox)
{
    enum_<CodecBoxDecoderState>("CodecBoxDecoderState")
        .value("Init", CodecBoxDecoderState::Init)
        .value("Failed", CodecBoxDecoderState::Failed)
        .value("Ended", CodecBoxDecoderState::Ended)
        .value("Metadata", CodecBoxDecoderState::Metadata)
        .value("Audio", CodecBoxDecoderState::Audio)
        .value("Video", CodecBoxDecoderState::Video)
        ;

    class_<CodecBoxDecoder>("CodecBoxDecoder")
        .constructor<const std::string&>()
        .function("decode", &CodecBoxDecoder::decode)
        .property("state", &CodecBoxDecoder::get_state)
        .property("duration", &CodecBoxDecoder::get_duration)
        .property("startTime", &CodecBoxDecoder::get_startTime)
        .property("width", &CodecBoxDecoder::get_width)
        .property("height", &CodecBoxDecoder::get_height)
        .property("frameRate", &CodecBoxDecoder::get_frameRate)
        .property("sampleRate", &CodecBoxDecoder::get_sampleRate, &CodecBoxDecoder::set_sampleRate)
        .property("channels", &CodecBoxDecoder::get_channels)
        .property("bufferPresentationTime", &CodecBoxDecoder::get_bufferPresentationTime)
        .property("bufferDuration", &CodecBoxDecoder::get_bufferDuration)
        .property("bufferSampleCount", &CodecBoxDecoder::get_bufferSampleCount)
        //.property("buffer", &CodecBoxDecoder::get_buffer, allow_raw_pointer<ret_val>())
        .property("buffer", &CodecBoxDecoder::get_buffer)
        .property("hasVideo", &CodecBoxDecoder::get_hasVideo)
        .property("hasAudio", &CodecBoxDecoder::get_hasAudio)
        .property("videoEnabled", &CodecBoxDecoder::get_videoEnabled, &CodecBoxDecoder::set_videoEnabled)
        .property("audioEnabled", &CodecBoxDecoder::get_audioEnabled, &CodecBoxDecoder::set_audioEnabled)
        ;
}

