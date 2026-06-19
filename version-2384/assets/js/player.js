function initMoviePlayer(config) {
  var video = document.getElementById(config.videoId);
  var button = document.getElementById(config.buttonId);
  var cover = document.getElementById(config.coverId);
  var source = config.source;
  var loaded = false;

  if (!video || !button || !cover || !source) {
    return;
  }

  function attachSource() {
    if (loaded) {
      return;
    }

    loaded = true;

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = source;
      return;
    }

    if (window.Hls && window.Hls.isSupported()) {
      var hls = new window.Hls({
        enableWorker: true,
        lowLatencyMode: true
      });
      hls.loadSource(source);
      hls.attachMedia(video);
      video._hlsInstance = hls;
      return;
    }

    video.src = source;
  }

  function play() {
    attachSource();
    video.controls = true;
    var box = video.closest('.player-box');
    if (box) {
      box.classList.add('playing');
    }
    var promise = video.play();
    if (promise && promise.catch) {
      promise.catch(function () {
        video.controls = true;
      });
    }
  }

  button.addEventListener('click', play);
  cover.addEventListener('click', play);
  video.addEventListener('click', function () {
    if (video.paused) {
      play();
    }
  });
}
