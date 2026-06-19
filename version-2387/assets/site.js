(function () {
  function ready(callback) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback);
    } else {
      callback();
    }
  }

  function normalize(value) {
    return String(value || '').toLowerCase().trim();
  }

  function initMenu() {
    var toggle = document.querySelector('[data-menu-toggle]');
    var nav = document.querySelector('[data-mobile-nav]');
    if (!toggle || !nav) {
      return;
    }
    toggle.addEventListener('click', function () {
      nav.classList.toggle('is-open');
    });
  }

  function initHero() {
    var root = document.querySelector('[data-hero]');
    if (!root) {
      return;
    }
    var slides = Array.prototype.slice.call(root.querySelectorAll('[data-hero-slide]'));
    var dots = Array.prototype.slice.call(root.querySelectorAll('[data-hero-dot]'));
    if (slides.length <= 1) {
      return;
    }
    var index = 0;
    var timer = null;

    function show(nextIndex) {
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('is-active', slideIndex === index);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('is-active', dotIndex === index);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5000);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
      }
    }

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        show(Number(dot.getAttribute('data-hero-dot')) || 0);
        start();
      });
    });
    root.addEventListener('mouseenter', stop);
    root.addEventListener('mouseleave', start);
    start();
  }

  function initPageSearch() {
    var inputs = Array.prototype.slice.call(document.querySelectorAll('[data-page-search]'));
    inputs.forEach(function (input) {
      input.addEventListener('input', function () {
        var keyword = normalize(input.value);
        var cards = Array.prototype.slice.call(document.querySelectorAll('.movie-card, .ranking-line'));
        cards.forEach(function (card) {
          var haystack = normalize([
            card.getAttribute('data-title'),
            card.getAttribute('data-year'),
            card.getAttribute('data-region'),
            card.getAttribute('data-type'),
            card.getAttribute('data-genre'),
            card.textContent
          ].join(' '));
          card.classList.toggle('is-hidden', keyword && haystack.indexOf(keyword) === -1);
        });
      });
    });
  }

  function initPlayers() {
    var players = Array.prototype.slice.call(document.querySelectorAll('[data-player]'));
    players.forEach(function (player) {
      var video = player.querySelector('video');
      var source = player.getAttribute('data-source');
      var attached = false;
      var hls = null;
      if (!video || !source) {
        return;
      }

      function attachSource() {
        if (attached) {
          return;
        }
        attached = true;
        if (window.Hls && window.Hls.isSupported()) {
          hls = new window.Hls({
            enableWorker: true,
            lowLatencyMode: true
          });
          hls.loadSource(source);
          hls.attachMedia(video);
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = source;
        } else {
          video.src = source;
        }
        video.setAttribute('controls', 'controls');
      }

      function togglePlay() {
        attachSource();
        if (video.paused) {
          var promise = video.play();
          if (promise && typeof promise.catch === 'function') {
            promise.catch(function () {
              player.classList.remove('is-playing');
            });
          }
        } else {
          video.pause();
        }
      }

      Array.prototype.slice.call(player.querySelectorAll('[data-play]')).forEach(function (button) {
        button.addEventListener('click', togglePlay);
      });

      var muteButton = player.querySelector('[data-mute]');
      if (muteButton) {
        muteButton.addEventListener('click', function () {
          video.muted = !video.muted;
          muteButton.textContent = video.muted ? '取消静音' : '静音';
        });
      }

      var fullscreenButton = player.querySelector('[data-fullscreen]');
      if (fullscreenButton) {
        fullscreenButton.addEventListener('click', function () {
          if (document.fullscreenElement) {
            document.exitFullscreen();
          } else if (player.requestFullscreen) {
            player.requestFullscreen();
          }
        });
      }

      video.addEventListener('click', togglePlay);
      video.addEventListener('play', function () {
        player.classList.add('is-playing');
      });
      video.addEventListener('pause', function () {
        player.classList.remove('is-playing');
      });
      window.addEventListener('beforeunload', function () {
        if (hls) {
          hls.destroy();
        }
      });
    });
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function searchCard(movie) {
    return [
      '<article class="movie-card">',
      '  <a class="poster-link" href="' + escapeHtml(movie.url) + '" aria-label="' + escapeHtml(movie.title) + '">',
      '    <img src="' + escapeHtml(movie.cover) + '" alt="' + escapeHtml(movie.title) + '" loading="lazy" onerror="this.style.opacity=\'0\'; this.parentElement.classList.add(\'poster-missing\');" />',
      '    <span class="poster-year">' + escapeHtml(movie.year) + '</span>',
      '    <span class="poster-play">▶</span>',
      '  </a>',
      '  <div class="movie-card-body">',
      '    <h3><a href="' + escapeHtml(movie.url) + '">' + escapeHtml(movie.title) + '</a></h3>',
      '    <p>' + escapeHtml(movie.oneLine) + '</p>',
      '    <div class="movie-meta"><span>' + escapeHtml(movie.region) + '</span><span>' + escapeHtml(movie.type) + '</span></div>',
      '    <div class="movie-tags"><span>' + escapeHtml(movie.category) + '</span><span>' + escapeHtml(movie.year) + '</span></div>',
      '  </div>',
      '</article>'
    ].join('');
  }

  function initSearchPage() {
    var input = document.querySelector('[data-search-input]');
    var results = document.querySelector('[data-search-results]');
    var status = document.querySelector('[data-search-status]');
    if (!input || !results || !status || !window.SEARCH_DATA) {
      return;
    }
    var params = new URLSearchParams(window.location.search);
    var query = params.get('q') || '';
    input.value = query;

    function render(value) {
      var keyword = normalize(value);
      if (!keyword) {
        status.textContent = '请输入关键词开始搜索。';
        results.innerHTML = '';
        return;
      }
      var matches = window.SEARCH_DATA.filter(function (movie) {
        var text = normalize([
          movie.title,
          movie.year,
          movie.region,
          movie.type,
          movie.genre,
          movie.category,
          (movie.tags || []).join(' '),
          movie.oneLine
        ].join(' '));
        return text.indexOf(keyword) !== -1;
      }).slice(0, 120);
      status.textContent = '找到 ' + matches.length + ' 条相关影片。';
      results.innerHTML = matches.map(searchCard).join('');
    }

    render(query);
    input.addEventListener('input', function () {
      render(input.value);
    });
  }

  ready(function () {
    initMenu();
    initHero();
    initPageSearch();
    initPlayers();
    initSearchPage();
  });
})();
