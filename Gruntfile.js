module.exports = function (grunt) {

  // You can change items in ffDecoders, ffDemuxers, ffParsers, ffEncoders, ffMuxers and ffFilters to select components of ffmpeg,
  // Only ffmpegCustomConfig is affected, if you use ffmpegFullConfig, it will be a full build, of cause.
  var ffDecoders = [
    'aac',
    'aac_latm',
    'ac3',
    'ac3_fixed',
    'cook',
    'h263',
    'h263i',
    'h263p',
    'h264',
    'hevc',
    'libvpx_vp8',
    'libvpx_vp9',
    'mjpeg',
    'mjpegb',
    'mp2',
    'mp2float',
    'mp3',
    'mp3adu',
    'mp3adufloat',
    'mp3float',
    'mp3on4',
    'mp3on4float',
    'mpeg1video',
    'mpeg2video',
    'mpeg4',
    'mpegvideo',
    'msmpeg4v1',
    'msmpeg4v2',
    'msmpeg4v3',
    'opus',
    'pcm_alaw',
    'pcm_bluray',
    'pcm_dvd',
    'pcm_f32be',
    'pcm_f32le',
    'pcm_f64be',
    'pcm_f64le',
    'pcm_lxf',
    'pcm_mulaw',
    'pcm_s16be',
    'pcm_s16be_planar',
    'pcm_s16le',
    'pcm_s16le_planar',
    'pcm_s24be',
    'pcm_s24daud',
    'pcm_s24le',
    'pcm_s24le_planar',
    'pcm_s32be',
    'pcm_s32le',
    'pcm_s32le_planar',
    'pcm_s8',
    'pcm_s8_planar',
    'pcm_u16be',
    'pcm_u16le',
    'pcm_u24be',
    'pcm_u24le',
    'pcm_u32be',
    'pcm_u32le',
    'pcm_u8',
    'pcm_zork',
    'ra_144',
    'ra_288',
    'ralf',
    'rv10',
    'rv20',
    'rv30',
    'rv40',
    'sipr',
    'vc1',
    'vc1image',
    'vorbis',
    'vp6',
    'vp6a',
    'vp6f',
    'wmalossless',
    'wmapro',
    'wmav1',
    'wmav2',
    'wmavoice',
    'wmv1',
    'wmv2',
    'wmv3',
    'wmv3image',
    'zlib',
  ];

  var ffDemuxers = [
    'aac',
    'ac3',
    'asf', // also for wmv
    'avi',
    'avisynth',
    'flac',
    'flv',
    'm4v',
    'matroska',
    'mjpeg',
    'mov', // demux mov,mp4,m4a,3gp,3g2,mj2, see http://stackoverflow.com/questions/12408526/enabling-mp4-demuxer-in-ffmpeg-configure-command
    'mp3',
    'mpegps',
    'mpegts',
    'mpegtsraw',
    'mpegvideo',
    'ogg',
    'pcm_alaw',
    'pcm_f32be',
    'pcm_f32le',
    'pcm_f64be',
    'pcm_f64le',
    'pcm_mulaw',
    'pcm_s16be',
    'pcm_s16le',
    'pcm_s24be',
    'pcm_s24le',
    'pcm_s32be',
    'pcm_s32le',
    'pcm_s8',
    'pcm_u16be',
    'pcm_u16le',
    'pcm_u24be',
    'pcm_u24le',
    'pcm_u32be',
    'pcm_u32le',
    'pcm_u8',
    'rm',
    'vc1',
    'vc1t',
  ];

  var ffParsers = [
    'aac',
    'aac_latm',
    'h264',
    'hevc',
    'opus',
  ];

  var ffEncoders = [
    'aac',
    'libopus',
    'libvpx_vp8',
    'libvpx_vp9',
    'libx264',
    'vorbis',
    // not listed by ffmpeg
    'libmp3lame',
    'libopenh264',
  ];

  var ffMuxers = [
    'mp3',
    'mp4',
    'oga',
    'ogg',
    'webm',
  ];

  var ffFilters = [
    'adelay',
    'aformat',
    'aresample',
    'ashowinfo',
    'ass',
    'atrim',
    'concat',
    'copy',
    'crop',
    'cropdetect',
    'format',
    'join',
    'pad',
    'rotate',
    'scale',
    'setdar',
    'setsar',
    'showinfo',
    'trim',
    'vflip',
    'volume',
    'volumedetect',
  ];

  var paraMake = 4; // -jN param of make

  var path = require('path');
  var rootPath = path.dirname(module.filename);
  var distPath = path.join(rootPath, 'build/dist');
  var pkgConfigScript = path.join(rootPath, 'pkg_config');

  // TODO seems not useful for disabling iconv support of lame
  // process.env.PKG_CONFIG = pkgConfigScript;

  var ffmpegConfigShared = 
    'emconfigure ./configure' +
    // '-v' enables verbose output during 'make'. Note this may break grunt-exec 
    // (you can run 'emmake make' directly in console instead if you really need verbose).
    //' -v' +
    ' --cc="emcc" --ranlib="emranlib" --prefix=' + distPath +
    ' --pkg-config="' + pkgConfigScript + '" ' +
    ' --optflags="-O3" --extra-cflags="-I' + distPath + '/include -D_POSIX_C_SOURCE=200112 -D_XOPEN_SOURCE=600 -fno-stack-protector " ' +
    ' --extra-ldflags="-L' + distPath + '/lib" ' +
    ' --enable-cross-compile --target-os=none --arch=x86_32 --cpu=generic --disable-debug --disable-runtime-cpudetect ' +
    ' --disable-stripping ' +
    ' --disable-programs ' +
    ' --disable-ffplay --disable-ffprobe --disable-asm --disable-doc --disable-pthreads --disable-w32threads ' + 
    ' --disable-network --disable-iconv --disable-xlib ' +
    ' --enable-gpl --enable-libvpx --enable-libx264 ' + 
    ' --enable-libmp3lame --enable-libopus --enable-libopenh264';

  var ffmpegFullConfig = ffmpegConfigShared + ' --enable-protocol=file ';

  var ffmpegCustomConfig = ffmpegConfigShared + ' --disable-everything --enable-protocol=file ' +
    ffDecoders.map(function(name) { return ' --enable-decoder=' + name }).join('') +
    ffDemuxers.map(function(name) { return ' --enable-demuxer=' + name }).join('') +
    ffParsers.map(function(name) { return ' --enable-parser=' + name }).join('') +
    ffMuxers.map(function(name) { return ' --enable-muxer=' + name }).join('') +
    ffEncoders.map(function(name) { return ' --enable-encoder=' + name }).join('') +
    ffFilters.map(function(name) { return ' --enable-filter=' + name }).join('');

  var nativeRepos = {
    opus: {
      repo: 'https://github.com/xiph/opus.git',
      pre: 'sh autogen.sh',
      configure: 'emconfigure ./configure CFLAGS="-O3" --prefix=' + distPath + ' --enable-shared=no --disable-asm ' + 
        '--disable-rtcd --disable-stack-protector', // --enable-intrinsics'
    },
    lame: {
      repo: 'https://github.com/rbrito/lame.git',
      configure: 'emconfigure ./configure CFLAGS=-O3 --prefix=' + distPath + ' --enable-shared=no --disable-gtktest ' +
        ' --disable-decoder --disable-cpml',
    },
    libvpx: {
      repo: 'https://github.com/webmproject/libvpx.git',
      needPatch: false,
      configure: 'emconfigure ./configure --prefix=' + distPath + ' --disable-examples --disable-docs ' +
        ' --disable-runtime-cpu-detect --disable-multithread --target=generic-gnu --extra-cflags=-O3',
      make: 'emmake make SHELL="/bin/bash -x" -j' + paraMake,
      postMake: 'emranlib libvpx.a', // https://github.com/emscripten-core/emscripten/issues/9705
    },
    x264: {
      repo: 'https://code.videolan.org/videolan/x264.git',
      needPatch: false,
      configure: 'emconfigure ./configure --disable-thread --disable-asm --disable-opencl ' +
        ' --host=i686-pc-linux-gnu --disable-cli --enable-shared --disable-gpl --prefix=' + distPath,
      make: 'emmake make SHELL="/bin/bash -x" -j' + paraMake
    },
    openh264: {
      repo: 'https://github.com/cisco/openh264.git',
      make: 'emmake make SHELL="/bin/bash -x" ARCH=mips CFLAGS="-O3 -fno-stack-protector" -j' + 1, //paraMake,
      install: 'emmake make ARCH=mips PREFIX=' + distPath + ' install-headers install-shared',
    },
    zlib: {
      repo: 'https://github.com/madler/zlib.git',
      configure: 'emconfigure ./configure --prefix=' + distPath + ' --static',
      make: 'emmake make CFLAGS="-O3" SHELL="/bin/bash -x" -j' + paraMake,
    },
    ffmpeg: { 
      repo: 'https://github.com/FFmpeg/FFmpeg.git',
      // select your ffmpeg config
      configure: ffmpegCustomConfig,
      //configure: ffmpegFullConfig,
    },
  };

  var cloneDepth = 50;


  //==================== Add grunt tasks =========================

  function makeCmd(taskName, cmdStr) {
    function cmd() {
      console.log('>>> exec: ' + taskName + ': ' + cmdStr);
      return cmdStr;
    }
    return cmd;
  }

  var execConfigs = {};

  var cloneSourceTasks = [];

  var resetTasks = [];

  var pullTasks = [];

  var patchTasks = [];

  var genPatchTasks = [];

  var configDepsTasks = [];

  var makeDepsTasks = [];

  var cleanTasks = [];

  grunt.registerTask('mkdirs', 'make dirs for build', function() {
    grunt.file.mkdir('build');
  });
  cloneSourceTasks.push('mkdirs');

  for (var repoName in nativeRepos) {
    var localPath = path.join(rootPath, 'build', repoName);
    var repoInfo = nativeRepos[repoName];
    var cloneTask = 'clone-' + repoName;
    execConfigs[cloneTask] = {
      command: makeCmd(cloneTask, 'git clone --depth ' + cloneDepth + ' ' + repoInfo.repo + ' "' + localPath + '"'),
    };
    cloneSourceTasks.push('exec:' + cloneTask);

    var resetTask = 'reset-' + repoName;
    execConfigs[resetTask] = {
      command: makeCmd(resetTask, 'git reset --hard'),
      cwd: localPath,
    };
    resetTasks.push('exec:' + resetTask);

    var pullTask = 'pull-' + repoName;
    execConfigs[pullTask] = {
      command: makeCmd(pullTask, 'git pull'),
      cwd: localPath,
    };
    pullTasks.push('exec:' + pullTask);

    if (repoInfo.needPatch) {
      var patchFile = path.join(rootPath, 'patch', repoName + '.patch');
      var genPatchTask = 'gen-patch-' + repoName;
      execConfigs[genPatchTask] = {
        command: makeCmd(genPatchTask, 'git diff > "' + patchFile + '"'),
        cwd: localPath,
      };
      genPatchTasks.push('exec:' + genPatchTask);

      var applyPatchTask = 'apply-patch-' + repoName;
      execConfigs[applyPatchTask] = {
        command: makeCmd(applyPatchTask, 'patch -p1 -d . ' + '< "' + patchFile + '"'),
        cwd: localPath,
      };
      patchTasks.push('exec:' + resetTask);
      patchTasks.push('exec:' + applyPatchTask);
    }

    if (repoInfo.pre) {
      var preTask = 'pre-' + repoName;
      execConfigs[preTask] = {
        command: makeCmd(preTask, repoInfo.pre),
        cwd: localPath,
      };
      if (repoName !== 'ffmpeg') configDepsTasks.push('exec:' + preTask);
    }

    if (repoInfo.configure) {
      var configTask = 'configure-' + repoName;
      execConfigs[configTask] = {
        command: makeCmd(configTask, repoInfo.configure),
        cwd: localPath,
      };
      if (repoName !== 'ffmpeg') configDepsTasks.push('exec:' + configTask);
    }

    var makeTask = 'make-' + repoName;
    execConfigs[makeTask] = {
      command: makeCmd(makeTask, repoInfo.make || 'emmake make -j' + paraMake),
      cwd: localPath,
    };
    if (repoName !== 'ffmpeg') makeDepsTasks.push('exec:' + makeTask);

    if (repoInfo.postMake) {
      var postMakeTask = 'postMake-' + repoName;
      execConfigs[postMakeTask] = {
        command: makeCmd(postMakeTask, repoInfo.postMake),
        cwd: localPath,
      };
      if (repoName !== 'ffmpeg') makeDepsTasks.push('exec:' + postMakeTask);
    }

    var installTask = 'install-' + repoName;
    execConfigs[installTask] = {
      command: makeCmd(installTask, repoInfo.install || 'emmake make install'),
      cwd: localPath,
    };
    if (repoName !== 'ffmpeg') makeDepsTasks.push('exec:' + installTask);

    var cleanTask = 'clean-' + repoName;
    execConfigs[cleanTask] = {
      command: makeCmd(cleanTask, repoInfo.clean || 'emmake make clean'),
      cwd: localPath,
    };
    cleanTasks.push('exec:' + cleanTask);
  }

  var EM_CPPFLAGS =  ' --bind -O3 -c -v -std=c++11 -I' + distPath + '/include ';
  var EM_LDFLAGS = ' -shared -L'  + distPath + '/lib -lavutil -lavformat -lavcodec -lswscale -lswresample -lavutil ' +
    ' -lz -lmp3lame -lvpx -lx264 -lopus -lopenh264 -lm '; 
  var EM_JSFLAGS = ' --bind -O3 -v -s VERBOSE=1 -s TOTAL_MEMORY=67108864 ' +
    ' -s ERROR_ON_UNDEFINED_SYMBOLS=0 ' + // fix "undefined symbol: pthread_attr_setschedpolicy"
    ' -lworkerfs.js ' // enable WORKERFS
    ;
  var codeboxSrc = ['CodecBoxDecoder', 'embinder'];
  var codeboxTasks = [];
  var srcDir = path.join(rootPath, 'src');

  codeboxSrc.forEach(function(src) {
    var compileTask = 'emcc-' + src;
    execConfigs[compileTask] = {
      command: makeCmd(compileTask, 'emcc -o ' + src + '.o ' + EM_CPPFLAGS + ' ' + src + '.cpp'),
      cwd: srcDir,
    }
    codeboxTasks.push('exec:' + compileTask);
  });

  execConfigs.emld = {
    command: makeCmd('emld', 'emcc -o codecbox.so ' + codeboxSrc.map(function(src) { return src + '.o' }).join(' ') + ' ' + EM_LDFLAGS),
    cwd: srcDir,
  };

  execConfigs.emjs = {
    command: makeCmd('emjs', 'emcc -o codecbox.js ' + EM_JSFLAGS + ' codecbox.so ' +
      distPath + '/lib/libx264.so ' + distPath + '/lib/libopenh264.so '
    ),
    cwd: srcDir,
  };
  codeboxTasks.push('exec:emld', 'exec:emjs');

  execConfigs['clean-codecbox'] = {
    command: makeCmd('clean-codecbox', 'rm -f codecbox.js *.so *.o *.mem *.wasm'),
    cwd: srcDir,
  }
  cleanTasks.push('exec:clean-codecbox');

  grunt.loadNpmTasks('grunt-exec');

  grunt.initConfig({
    exec: execConfigs,
  });

  grunt.registerTask('help', 'help', function () {
    grunt.log.writeln('========= Codecbox build script ==========');
    grunt.log.writeln('For the first time, run "grunt init" (make sure you have good internet connection in this step), and then "grunt build". If all are OK, load src/demo-player.html and have fun!');
    grunt.log.writeln('For available commands, run "grunt --help". Some of them are explained here:');
    grunt.log.writeln('clone-source: run "git clone --depth N" to get sources of ffmpeg etc.');
    grunt.log.writeln('update-source: run "git pull" in sources of ffmpeg etc.');
    grunt.log.writeln('reset-source: run "git reset --hard" in sources of ffmpeg etc., patches will be unapplied.');
    grunt.log.writeln('apply-patch: apply necessary patches (in ./patch dir) to x264 etc.');
    grunt.log.writeln('gen-patch: generate patches from working copy and place them in ./patch dir.');
    grunt.log.writeln('init: clone-source and apply-patch.');
    grunt.log.writeln('configure-deps: run "configure" in ffmpeg\'s dependencies (zlib, x264, etc.)');
    grunt.log.writeln('make-deps: run "make" in ffmpeg\'s dependencies.');
    grunt.log.writeln('build-ffmpeg: configure and build ffmpeg\'s and its dependencies.');
    grunt.log.writeln('build-codecbox: build wrapper codes and produce final production: src/codecbox.js.');
    grunt.log.writeln('build: run "build-ffmpeg" and "build-codecbox".');
    grunt.log.writeln('clean: clean build files. You may want to add "--force" argument to grunt.');
    grunt.log.writeln('exec:configure-*, exec:make-*, exec:install-*: run "configure", "make", or "make install" for a specific library (' +
    '* = ffmpeg, x264, libvpx, zlib, opus, openh264, lame).');
  });

  grunt.registerTask('default', ['help']);

  grunt.registerTask('clone-source', cloneSourceTasks);

  grunt.registerTask('update-source', pullTasks);

  grunt.registerTask('reset-source', resetTasks);

  grunt.registerTask('apply-patch', patchTasks);

  grunt.registerTask('gen-patch', genPatchTasks);

  grunt.registerTask('init', ['clone-source', 'apply-patch']);

  grunt.registerTask('configure-deps', configDepsTasks);

  grunt.registerTask('make-deps', makeDepsTasks);

  grunt.registerTask('build-ffmpeg', ['configure-deps', 'make-deps', 'exec:configure-ffmpeg', 'exec:make-ffmpeg', 'exec:install-ffmpeg']);

  grunt.registerTask('build-codecbox', codeboxTasks);

  grunt.registerTask('build', ['build-ffmpeg', 'build-codecbox']);

  grunt.registerTask('clean', cleanTasks);
}

