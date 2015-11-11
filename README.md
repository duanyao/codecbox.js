# codecbox.js

Codecbox.js is a pure javascript library providing fine-grained APIs for video/audio processing (currently only decoding is supported). Codecbox.js is based on [FFmpeg](http://www.ffmpeg.org/) and related libraries, which are compiled by [emscripten](http://kripken.github.io/emscripten-site/) into [asm.js](http://asmjs.org). Codecbox.js should run reasonably well in browsers with web worker and asm.js support.

View the [demo page](http://duanyao.github.io/codecbox.js/).

Currently codecbox.js is only provided as source code, you have to build it yourself.

## Build
You need a Linux or similar system to build codecbox.js.

1. Install [emscripten](http://kripken.github.io/emscripten-site/docs/getting_started/index.html), the C/C++ to asm.js comipler. Node.js should be installed as well.

2. Install [grunt](http://gruntjs.com/), the build runner for JS.

3. Clone codecbox.js repostory (suppose cloned to `codecbox.js` dir).

4. Go to `codecbox.js` dir in a terminal, execute command `npm install`. Do the following steps in this dir as well.

5. Execute command `grunt init`. This clones repos of ffmpeg and its external libraries (including [x264](git://git.videolan.org/x264.git), [openh264](https://github.com/cisco/openh264.git), [libvpx](https://github.com/webmproject/libvpx.git), [libopus](https://github.com/xiph/opus.git), [lame](https://github.com/rbrito/lame.git), and [zlib](https://github.com/madler/zlib.git)), so make sure you have good internet connection.
   This project try to build the latest master branch of these libraries. If you want to stick to specific versions, go to `build/<lib_name>` and checkout manually. You may also want to adjust and apply patches in `patch` dir.

6. Execute command `grunt build`. This should compile ffmpeg etc. and produces `codecbox.js` and `codecbox.js.mem` in `src` dir.

7. Load `src/demo-player.html` and try to play a media file (most common audio/video formats should be fine).
    This demo uses ffmpeg to decode media files, and renders video frames via HTML Canvas, and plays sound via Web Audio API.

## Customization
You can customize the build of ffmpeg. Open file `Gruntfile.js`, and edit
`ffDecoders`, `ffDemuxers`, `ffParsers`, `ffEncoders`, `ffMuxers` and `ffFilters` to select components of ffmpeg.
You may also toggle comment of the following 2 lines to enable full ffmpeg build:

```
configure: ffmpegCustomConfig,
//configure: ffmpegFullConfig,
```

Currently the full ffmpeg build includes all its buildin components, as well as external libraries. Default custom build also include these external libraries.

## API
Currently `codecbox.js` exposes a class `Module.CodecBoxDecoder` for video/audio decoding. See `src/CodecBoxDecoder.h` for its API. Note that C++ methods `get_XXX()/set_XXX()` are mapped to JS properties `XXX`. See also `src/codecbox-decoder-worker.js` for its usage. We plan to add video/audio encoding feature later on.

## Acknowledgement
A lot of build settings are borrowed from the [videoconverter.js](https://github.com/bgrins/videoconverter.js) project.

