(function () {
  function ready(fn) {
    if (document.readyState !== "loading") {
      fn();
    } else {
      document.addEventListener("DOMContentLoaded", fn);
    }
  }

  function initNavigation() {
    var toggle = document.querySelector(".nav-toggle");
    var menu = document.querySelector(".mobile-nav");
    if (!toggle || !menu) {
      return;
    }
    toggle.addEventListener("click", function () {
      menu.classList.toggle("open");
    });
  }

  function initHero() {
    var slides = Array.prototype.slice.call(document.querySelectorAll(".hero-slide"));
    var dots = Array.prototype.slice.call(document.querySelectorAll(".hero-dot"));
    if (!slides.length) {
      return;
    }
    var active = 0;
    var timer;
    function show(index) {
      active = (index + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle("active", i === active);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle("active", i === active);
      });
    }
    function next() {
      show(active + 1);
    }
    dots.forEach(function (dot, i) {
      dot.addEventListener("click", function () {
        show(i);
        clearInterval(timer);
        timer = setInterval(next, 5200);
      });
    });
    show(0);
    timer = setInterval(next, 5200);
  }

  function initSearch() {
    var input = document.querySelector("[data-movie-search]");
    var select = document.querySelector("[data-sort-select]");
    var grid = document.querySelector("[data-movie-grid]");
    if (!grid) {
      return;
    }
    function normalize(value) {
      return String(value || "").toLowerCase().trim();
    }
    function filter() {
      var keyword = normalize(input ? input.value : "");
      var cards = Array.prototype.slice.call(grid.querySelectorAll(".movie-card"));
      cards.forEach(function (card) {
        var text = normalize(card.getAttribute("data-search"));
        card.classList.toggle("hidden-card", keyword && text.indexOf(keyword) === -1);
      });
    }
    function sortCards() {
      if (!select) {
        return;
      }
      var cards = Array.prototype.slice.call(grid.querySelectorAll(".movie-card"));
      var mode = select.value;
      cards.sort(function (a, b) {
        var ay = parseInt(a.getAttribute("data-year") || "0", 10);
        var by = parseInt(b.getAttribute("data-year") || "0", 10);
        var av = parseInt(a.getAttribute("data-views") || "0", 10);
        var bv = parseInt(b.getAttribute("data-views") || "0", 10);
        if (mode === "hot") {
          return bv - av;
        }
        if (mode === "old") {
          return ay - by;
        }
        return by - ay;
      });
      cards.forEach(function (card) {
        grid.appendChild(card);
      });
    }
    if (input) {
      input.addEventListener("input", filter);
    }
    if (select) {
      select.addEventListener("change", function () {
        sortCards();
        filter();
      });
    }
  }

  function initPlayers() {
    var players = Array.prototype.slice.call(document.querySelectorAll(".movie-player"));
    players.forEach(function (player) {
      var video = player.querySelector("video");
      var layer = player.querySelector(".player-layer");
      var button = player.querySelector(".play-trigger");
      var stream = player.getAttribute("data-stream");
      var hls = null;
      function load() {
        if (!video || !stream) {
          return;
        }
        if (layer) {
          layer.classList.add("is-hidden");
        }
        video.controls = true;
        if (video.canPlayType("application/vnd.apple.mpegurl")) {
          if (video.src !== stream) {
            video.src = stream;
          }
        } else if (window.Hls && window.Hls.isSupported()) {
          if (!hls) {
            hls = new window.Hls();
            hls.loadSource(stream);
            hls.attachMedia(video);
          }
        } else if (video.src !== stream) {
          video.src = stream;
        }
        var promise = video.play();
        if (promise && typeof promise.catch === "function") {
          promise.catch(function () {});
        }
      }
      if (button) {
        button.addEventListener("click", function (event) {
          event.preventDefault();
          load();
        });
      }
      if (layer) {
        layer.addEventListener("click", load);
      }
      if (video) {
        video.addEventListener("click", function () {
          if (video.paused) {
            load();
          }
        });
      }
    });
  }

  ready(function () {
    initNavigation();
    initHero();
    initSearch();
    initPlayers();
  });
})();
