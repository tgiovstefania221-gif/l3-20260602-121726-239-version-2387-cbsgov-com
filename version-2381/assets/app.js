(function () {
  function setupMobileNav() {
    var toggle = document.querySelector('[data-mobile-toggle]');
    var nav = document.querySelector('[data-mobile-nav]');

    if (!toggle || !nav) {
      return;
    }

    toggle.addEventListener('click', function () {
      nav.classList.toggle('open');
    });
  }

  function setupHeroSlider() {
    var hero = document.querySelector('[data-hero]');

    if (!hero) {
      return;
    }

    var slides = Array.prototype.slice.call(hero.querySelectorAll('.hero-slide'));
    var thumbs = Array.prototype.slice.call(hero.querySelectorAll('.hero-thumb'));
    var current = 0;
    var timer = null;

    function showSlide(index) {
      current = (index + slides.length) % slides.length;

      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('active', slideIndex === current);
      });

      thumbs.forEach(function (thumb, thumbIndex) {
        thumb.classList.toggle('active', thumbIndex === current);
      });
    }

    function startTimer() {
      stopTimer();
      timer = window.setInterval(function () {
        showSlide(current + 1);
      }, 5200);
    }

    function stopTimer() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    thumbs.forEach(function (thumb, index) {
      thumb.addEventListener('click', function () {
        showSlide(index);
        startTimer();
      });
    });

    hero.addEventListener('mouseenter', stopTimer);
    hero.addEventListener('mouseleave', startTimer);

    if (slides.length > 1) {
      startTimer();
    }
  }

  function normalize(value) {
    return String(value || '').toLowerCase().trim();
  }

  function setupFilters() {
    var filterAreas = Array.prototype.slice.call(document.querySelectorAll('[data-filter-area]'));

    filterAreas.forEach(function (area) {
      var root = area.parentElement || document;
      var input = area.querySelector('[data-filter-input]');
      var typeSelect = area.querySelector('[data-filter-type]');
      var yearSelect = area.querySelector('[data-filter-year]');
      var regionSelect = area.querySelector('[data-filter-region]');
      var cards = Array.prototype.slice.call(root.querySelectorAll('.movie-card, .rank-item'));
      var emptyState = root.querySelector('[data-empty-state]');

      function applyFilter() {
        var keyword = normalize(input ? input.value : '');
        var typeValue = normalize(typeSelect ? typeSelect.value : '');
        var yearValue = normalize(yearSelect ? yearSelect.value : '');
        var regionValue = normalize(regionSelect ? regionSelect.value : '');
        var visibleCount = 0;

        cards.forEach(function (card) {
          var searchText = normalize(card.getAttribute('data-search'));
          var cardType = normalize(card.getAttribute('data-type'));
          var cardYear = normalize(card.getAttribute('data-year'));
          var cardRegion = normalize(card.getAttribute('data-region'));
          var matchesKeyword = !keyword || searchText.indexOf(keyword) !== -1;
          var matchesType = !typeValue || cardType === typeValue;
          var matchesYear = !yearValue || cardYear === yearValue;
          var matchesRegion = !regionValue || cardRegion.indexOf(regionValue) !== -1;
          var isVisible = matchesKeyword && matchesType && matchesYear && matchesRegion;

          card.classList.toggle('is-hidden', !isVisible);

          if (isVisible) {
            visibleCount += 1;
          }
        });

        if (emptyState) {
          emptyState.classList.toggle('show', visibleCount === 0);
        }
      }

      [input, typeSelect, yearSelect, regionSelect].forEach(function (control) {
        if (control) {
          control.addEventListener('input', applyFilter);
          control.addEventListener('change', applyFilter);
        }
      });
    });
  }

  function attachHls(video, source, message) {
    if (!source) {
      if (message) {
        message.textContent = '播放源暂不可用。';
      }
      return;
    }

    if (window.Hls && window.Hls.isSupported()) {
      var hls = new window.Hls({
        enableWorker: true,
        lowLatencyMode: true
      });

      hls.loadSource(source);
      hls.attachMedia(video);

      hls.on(window.Hls.Events.ERROR, function (_, data) {
        if (message && data && data.fatal) {
          message.textContent = '当前网络环境下播放源加载失败，可刷新后重试。';
        }
      });

      video._hlsInstance = hls;
      return;
    }

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = source;
      return;
    }

    video.src = source;

    if (message) {
      message.textContent = '如浏览器无法播放 m3u8，请使用支持 HLS 的浏览器。';
    }
  }

  function setupPlayers() {
    var players = Array.prototype.slice.call(document.querySelectorAll('.js-player'));

    players.forEach(function (video) {
      var source = video.getAttribute('data-src');
      var shell = video.closest('.player-shell');
      var button = shell ? shell.querySelector('[data-player-button]') : null;
      var message = shell ? shell.querySelector('[data-player-message]') : null;

      attachHls(video, source, message);

      if (button) {
        button.addEventListener('click', function () {
          button.classList.add('hidden');
          var playPromise = video.play();

          if (playPromise && typeof playPromise.catch === 'function') {
            playPromise.catch(function () {
              button.classList.remove('hidden');
              if (message) {
                message.textContent = '点击视频控制栏中的播放按钮继续播放。';
              }
            });
          }
        });
      }

      video.addEventListener('play', function () {
        if (button) {
          button.classList.add('hidden');
        }
      });
    });
  }

  function setupImageFallback() {
    var images = Array.prototype.slice.call(document.querySelectorAll('img'));

    images.forEach(function (image) {
      image.addEventListener('error', function () {
        image.classList.add('is-missing');
        if (image.parentElement) {
          image.parentElement.classList.add('poster-empty');
        }
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    setupMobileNav();
    setupHeroSlider();
    setupFilters();
    setupPlayers();
    setupImageFallback();
  });
}());
