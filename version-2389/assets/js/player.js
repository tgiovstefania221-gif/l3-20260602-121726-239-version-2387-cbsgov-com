(function () {
  function mount(config) {
    var video = document.getElementById(config.videoId);
    var trigger = document.getElementById(config.triggerId);
    var sourceUrl = config.source;
    var ready = false;
    var hls = null;

    if (!video || !trigger || !sourceUrl) {
      return;
    }

    function bind() {
      if (ready) {
        return;
      }
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = sourceUrl;
      } else if (window.Hls && window.Hls.isSupported()) {
        hls = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hls.loadSource(sourceUrl);
        hls.attachMedia(video);
      } else {
        video.src = sourceUrl;
      }
      ready = true;
    }

    function start() {
      bind();
      trigger.classList.add('is-hidden');
      var promise = video.play();
      if (promise && promise.catch) {
        promise.catch(function () {
          trigger.classList.remove('is-hidden');
        });
      }
    }

    trigger.addEventListener('click', start);
    video.addEventListener('click', function () {
      if (video.paused) {
        start();
      }
    });
    video.addEventListener('play', function () {
      trigger.classList.add('is-hidden');
    });
    video.addEventListener('pause', function () {
      trigger.classList.remove('is-hidden');
    });
    window.addEventListener('pagehide', function () {
      if (hls) {
        hls.destroy();
      }
    });
  }

  window.MoviePlayer = {
    mount: mount
  };
})();
