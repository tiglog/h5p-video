var H5P = H5P || {};

/**
 * Constructor.
 *
 * @param {object} params Options for this library.
 * @param {string} contentPath The path to our content folder.
 */
H5P.Video = function (params, contentPath) {
  this.params = params;
  this.contentPath = contentPath;

  if (window['H5PEditor'] !== undefined) {
    this.tmpPath = H5PEditor.filesPath + '/h5peditor/';
  }
};

/**
 * Wipe out the content of the wrapper and put our HTML in it.
 *
 * @param {jQuery} $wrapper Our poor container.
 */
H5P.Video.prototype.attach = function ($wrapper) {
  var that = this;

  // Check if browser supports video.
  var video = document.createElement('video');
  if (video.canPlayType === undefined) {
    // Try flash
    this.attachFlash($wrapper);
    return;
  }

  // Add supported source files.
  if (this.params.files !== undefined) {
    for (var i = 0; i < this.params.files.length; i++) {
      var file = this.params.files[i];

      if (video.canPlayType(file.mime)) {
        var source = document.createElement('source');
        // TODO: Clean up tmp stuff.
        source.src = (file.path.substr(0, 7) === 'http://' ? '' : (file.tmp !== undefined && file.tmp ? this.tmpPath : this.contentPath)) + file.path;
        source.type = file.mime;
        video.appendChild(source);
      }
    }
  }

  if (!video.children.length) {
    // Try flash
    this.attachFlash($wrapper);
    return;
  }

  if (this.endedCallback !== undefined) {
    video.addEventListener('ended', this.endedCallback, false);
  }

  video.addEventListener('play', function (e) {
    if (video.readyState === 0) {
      // Jump to flash
      $wrapper[0].removeChild(video);
      that.attachFlash($wrapper);
      that.flowplayer.play();
    }
  }, false);

  video.className = 'h5p-video';
  video.controls = this.params.controls === undefined ? true : this.params.controls;

  if (this.params.fitToWrapper === undefined || this.params.fitToWrapper) {
    video.setAttribute('width', '100%');
    video.setAttribute('height', '100%');
  }

  $wrapper.html(video);

  if (this.params.autoplay !== undefined && this.params.autoplay) {
    video.play();
  }

  this.video = video;
};

/**
 * Attaches a flash video player to the wrapper.
 *
 * @param {jQuery} $wrapper Our dear container.
 * @returns {undefined}
 */
H5P.Video.prototype.attachFlash = function ($wrapper) {
  $wrapper = $('<div class="h5p-video-flash"></div>').appendTo($wrapper);

  if (this.params.files !== undefined) {
    for (var i = 0; i < this.params.files.length; i++) {
      var file = this.params.files[i];
      if (file.mime === 'video/mp4') {
        var videoSource = (file.path.substr(0, 7) === 'http://' ? '' : window.location.protocol + '//' + window.location.host + (file.tmp !== undefined && file.tmp ? this.tmpPath : this.contentPath)) + file.path;
        break;
      }
    }
  }

  if (videoSource === undefined) {
    $wrapper.text('No supported video files found.');
    if (this.endedCallback !== undefined) {
      this.endedCallback();
    }
    return;
  }

  var options = {
    buffering: true,
    clip: {
      url: videoSource,
      autoPlay: this.params.autoplay === undefined ? false : this.params.autoplay,
      autoBuffering: true,
      scaling: 'fit'
    },
    plugins: {
      controls: null
    }
  };

  if (this.params.controls === undefined || this.params.controls) {
    options.plugins.controls = {};
  }

  if (this.endedCallback !== undefined) {
    options.clip.onFinish = this.endedCallback;
    options.clip.onError = this.endedCallback;
  }

  this.flowplayer = flowplayer($wrapper[0], {
    src: "http://releases.flowplayer.org/swf/flowplayer-3.2.16.swf",
    wmode: "opaque"
  }, options);
};

/**
 * Stop the video. TODO: Rename to pause?
 *
 * @returns {undefined}
 */
H5P.Video.prototype.stop = function () {
  if (this.flowplayer !== undefined) {
    this.flowplayer.stop().close().unload();
  }
  if (this.video !== undefined) {
    this.video.pause();
  }
};