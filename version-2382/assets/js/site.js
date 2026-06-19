(function () {
  'use strict';

  function qs(selector, context) {
    return (context || document).querySelector(selector);
  }

  function qsa(selector, context) {
    return Array.prototype.slice.call((context || document).querySelectorAll(selector));
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function setupMobileNavigation() {
    var button = qs('.mobile-menu-toggle');
    var panel = qs('.mobile-panel');
    if (!button || !panel) {
      return;
    }

    button.addEventListener('click', function () {
      var isOpen = button.getAttribute('aria-expanded') === 'true';
      button.setAttribute('aria-expanded', String(!isOpen));
      panel.hidden = isOpen;
    });
  }

  function setupHeroSlider() {
    var slider = qs('[data-hero-slider]');
    if (!slider) {
      return;
    }

    var slides = qsa('.hero-slide', slider);
    var dots = qsa('[data-hero-dot]', slider);
    if (slides.length <= 1) {
      return;
    }

    var current = 0;
    var timer = null;

    function show(index) {
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('is-active', slideIndex === current);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('is-active', dotIndex === current);
        dot.setAttribute('aria-pressed', dotIndex === current ? 'true' : 'false');
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        show(current + 1);
      }, 5600);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    dots.forEach(function (dot, index) {
      dot.addEventListener('click', function () {
        show(index);
        start();
      });
    });

    slider.addEventListener('mouseenter', stop);
    slider.addEventListener('mouseleave', start);
    show(0);
    start();
  }

  function setupImageFallbacks() {
    qsa('.image-frame img').forEach(function (image) {
      image.addEventListener('error', function () {
        var frame = image.closest('.image-frame');
        if (frame) {
          frame.classList.add('is-missing');
        }
      }, { once: true });
    });
  }

  function setupArchiveFilters() {
    var panel = qs('[data-filter-panel]');
    if (!panel) {
      return;
    }

    var searchInput = qs('[data-filter-search]', panel);
    var typeSelect = qs('[data-filter-type]', panel);
    var yearSelect = qs('[data-filter-year]', panel);
    var sortSelect = qs('[data-filter-sort]', panel);
    var counter = qs('[data-result-count]');
    var grid = qs('[data-card-container]');
    var noResults = qs('[data-no-results]');
    var cards = qsa('[data-movie-card]');

    function normalized(value) {
      return String(value || '').trim().toLowerCase();
    }

    function cardText(card) {
      return [
        card.dataset.title,
        card.dataset.type,
        card.dataset.year,
        card.dataset.region,
        card.dataset.genre,
        card.dataset.tags
      ].join(' ').toLowerCase();
    }

    function applyFilters() {
      var query = normalized(searchInput && searchInput.value);
      var type = normalized(typeSelect && typeSelect.value);
      var year = normalized(yearSelect && yearSelect.value);
      var visible = [];

      cards.forEach(function (card) {
        var matchesQuery = !query || cardText(card).indexOf(query) !== -1;
        var matchesType = !type || normalized(card.dataset.type) === type;
        var matchesYear = !year || normalized(card.dataset.year) === year;
        var shouldShow = matchesQuery && matchesType && matchesYear;
        card.style.display = shouldShow ? '' : 'none';
        if (shouldShow) {
          visible.push(card);
        }
      });

      if (sortSelect && grid) {
        var sortValue = sortSelect.value;
        visible.sort(function (a, b) {
          if (sortValue === 'popular') {
            return Number(b.dataset.views || 0) - Number(a.dataset.views || 0);
          }
          if (sortValue === 'oldest') {
            return Number(a.dataset.index || 0) - Number(b.dataset.index || 0);
          }
          return Number(b.dataset.index || 0) - Number(a.dataset.index || 0);
        });
        visible.forEach(function (card) {
          grid.appendChild(card);
        });
      }

      if (counter) {
        counter.textContent = '当前显示 ' + visible.length + ' 部内容';
      }
      if (noResults) {
        noResults.classList.toggle('is-visible', visible.length === 0);
      }
    }

    [searchInput, typeSelect, yearSelect, sortSelect].forEach(function (control) {
      if (control) {
        control.addEventListener('input', applyFilters);
        control.addEventListener('change', applyFilters);
      }
    });

    applyFilters();
  }

  function movieCardMarkup(movie) {
    var tags = (movie.tags || []).slice(0, 3).map(function (tag) {
      return '<span>' + escapeHtml(tag) + '</span>';
    }).join('');

    return '' +
      '<article class="movie-card">' +
        '<a class="poster image-frame" data-fallback-title="' + escapeHtml(movie.title) + '" href="movie/' + escapeHtml(movie.id) + '.html">' +
          '<img src="' + escapeHtml(movie.cover) + '" alt="' + escapeHtml(movie.title) + ' 海报" loading="lazy">' +
          '<span class="duration">' + escapeHtml(movie.duration) + '</span>' +
          '<span class="play-badge" aria-hidden="true">▶</span>' +
        '</a>' +
        '<div class="movie-card-body">' +
          '<div class="card-kicker"><a href="category/' + escapeHtml(movie.categorySlug) + '.html">' + escapeHtml(movie.category) + '</a><span>' + escapeHtml(movie.year) + '</span></div>' +
          '<h3><a href="movie/' + escapeHtml(movie.id) + '.html">' + escapeHtml(movie.title) + '</a></h3>' +
          '<p>' + escapeHtml(movie.oneLine) + '</p>' +
          '<div class="tag-row">' + tags + '</div>' +
          '<div class="card-meta"><span>' + escapeHtml(movie.region) + '</span><span>' + escapeHtml(movie.viewsText) + '次</span></div>' +
        '</div>' +
      '</article>';
  }

  function setupSearchPage() {
    var searchRoot = qs('[data-search-page]');
    if (!searchRoot || !window.MOVIE_SEARCH_INDEX) {
      return;
    }

    var input = qs('[data-search-input]', searchRoot);
    var button = qs('[data-search-button]', searchRoot);
    var results = qs('[data-search-results]', searchRoot);
    var count = qs('[data-search-count]', searchRoot);
    var params = new URLSearchParams(window.location.search);
    var initialQuery = params.get('q') || '';

    if (input) {
      input.value = initialQuery;
    }

    function normalize(value) {
      return String(value || '').trim().toLowerCase();
    }

    function runSearch() {
      var query = normalize(input && input.value);
      var words = query.split(/\s+/).filter(Boolean);
      var pool = window.MOVIE_SEARCH_INDEX;
      var matched = pool.filter(function (movie) {
        if (!words.length) {
          return movie.isHot;
        }
        var haystack = [
          movie.title,
          movie.category,
          movie.region,
          movie.type,
          movie.year,
          movie.genre,
          (movie.tags || []).join(' '),
          movie.oneLine
        ].join(' ').toLowerCase();
        return words.every(function (word) {
          return haystack.indexOf(word) !== -1;
        });
      }).slice(0, 96);

      if (count) {
        count.textContent = words.length ? '找到 ' + matched.length + ' 条相关结果' : '热门推荐 ' + matched.length + ' 部';
      }
      if (results) {
        results.innerHTML = matched.map(movieCardMarkup).join('');
        setupImageFallbacks();
      }
    }

    if (button) {
      button.addEventListener('click', runSearch);
    }
    if (input) {
      input.addEventListener('keydown', function (event) {
        if (event.key === 'Enter') {
          event.preventDefault();
          runSearch();
        }
      });
      input.addEventListener('input', function () {
        if (input.value.length === 0 || input.value.length > 1) {
          runSearch();
        }
      });
    }

    runSearch();
  }

  function setupPlayers() {
    qsa('[data-player]').forEach(function (player) {
      var video = qs('video', player);
      var startButton = qs('[data-player-start]', player);
      var status = qs('[data-player-status]', player);
      var source = player.dataset.source;
      var hlsInstance = null;
      var isReady = false;

      function showStatus(message) {
        if (!status) {
          return;
        }
        status.textContent = message;
        status.classList.add('is-visible');
      }

      function hideStatus() {
        if (status) {
          status.classList.remove('is-visible');
        }
      }

      function attachSource() {
        if (isReady) {
          return Promise.resolve();
        }
        if (!video || !source) {
          showStatus('播放源暂不可用。');
          return Promise.reject(new Error('Missing video source'));
        }

        showStatus('正在初始化高清播放源…');

        if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = source;
          isReady = true;
          hideStatus();
          return Promise.resolve();
        }

        if (window.Hls && window.Hls.isSupported()) {
          hlsInstance = new window.Hls({
            enableWorker: true,
            lowLatencyMode: false,
            backBufferLength: 90
          });
          hlsInstance.loadSource(source);
          hlsInstance.attachMedia(video);
          hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, function () {
            isReady = true;
            hideStatus();
          });
          hlsInstance.on(window.Hls.Events.ERROR, function (event, data) {
            if (data && data.fatal) {
              showStatus('播放加载失败，请刷新页面或稍后重试。');
              if (hlsInstance) {
                hlsInstance.destroy();
                hlsInstance = null;
              }
              isReady = false;
            }
          });
          return Promise.resolve();
        }

        showStatus('当前浏览器不支持 HLS 播放，请更换现代浏览器。');
        return Promise.reject(new Error('HLS not supported'));
      }

      function play() {
        attachSource().then(function () {
          return video.play();
        }).then(function () {
          player.classList.add('is-playing');
          hideStatus();
        }).catch(function () {
          showStatus('请再次点击播放按钮，或检查浏览器是否允许播放。');
        });
      }

      if (startButton) {
        startButton.addEventListener('click', play);
      }
      if (video) {
        video.addEventListener('play', function () {
          player.classList.add('is-playing');
        });
        video.addEventListener('pause', function () {
          if (!video.ended) {
            player.classList.remove('is-playing');
          }
        });
      }
    });
  }

  function setupShareButtons() {
    qsa('[data-share]').forEach(function (button) {
      button.addEventListener('click', function () {
        var text = document.title + ' ' + window.location.href;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(function () {
            button.textContent = '链接已复制';
            window.setTimeout(function () {
              button.textContent = '分享视频';
            }, 1600);
          });
        } else {
          window.prompt('复制分享链接', text);
        }
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    setupMobileNavigation();
    setupHeroSlider();
    setupImageFallbacks();
    setupArchiveFilters();
    setupSearchPage();
    setupPlayers();
    setupShareButtons();
  });
})();
