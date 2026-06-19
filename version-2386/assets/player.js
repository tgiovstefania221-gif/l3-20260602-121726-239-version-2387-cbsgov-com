(function () {
  var shell = document.querySelector("[data-player]");

  if (!shell) {
    return;
  }

  var video = shell.querySelector("video");
  var layer = shell.querySelector(".play-layer");
  var stream = shell.getAttribute("data-stream");
  var loaded = false;
  var hlsInstance = null;

  function attachStream() {
    if (loaded || !video || !stream) {
      return;
    }

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = stream;
    } else if (window.Hls && window.Hls.isSupported()) {
      hlsInstance = new window.Hls({
        enableWorker: true,
        lowLatencyMode: true
      });
      hlsInstance.loadSource(stream);
      hlsInstance.attachMedia(video);
    } else {
      video.src = stream;
    }

    video.load();
    loaded = true;
  }

  function startPlayback() {
    attachStream();
    shell.classList.add("is-playing");
    var result = video.play();

    if (result && typeof result.catch === "function") {
      result.catch(function () {
        shell.classList.remove("is-playing");
      });
    }
  }

  if (layer) {
    layer.addEventListener("click", startPlayback);
  }

  video.addEventListener("click", function () {
    if (video.paused) {
      startPlayback();
    }
  });

  video.addEventListener("play", function () {
    shell.classList.add("is-playing");
  });

  video.addEventListener("ended", function () {
    shell.classList.remove("is-playing");
  });

  window.addEventListener("pagehide", function () {
    if (hlsInstance) {
      hlsInstance.destroy();
    }
  });
})();
