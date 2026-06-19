(function () {
  'use strict';

  function ready(callback) {
    if (document.readyState !== 'loading') {
      callback();
      return;
    }
    document.addEventListener('DOMContentLoaded', callback);
  }

  function setupMobileMenu() {
    var button = document.querySelector('[data-menu-toggle]');
    var menu = document.querySelector('[data-mobile-menu]');
    if (!button || !menu) {
      return;
    }
    button.addEventListener('click', function () {
      menu.classList.toggle('is-open');
    });
  }

  function setupHeroCarousel() {
    var carousel = document.querySelector('[data-hero-carousel]');
    if (!carousel) {
      return;
    }
    var slides = Array.prototype.slice.call(carousel.querySelectorAll('.hero-slide'));
    var dots = Array.prototype.slice.call(carousel.querySelectorAll('[data-hero-dot]'));
    var prev = carousel.querySelector('[data-hero-prev]');
    var next = carousel.querySelector('[data-hero-next]');
    var index = 0;
    var timer = null;

    function show(nextIndex) {
      if (!slides.length) {
        return;
      }
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle('is-active', i === index);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle('is-active', i === index);
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
        timer = null;
      }
    }

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        show(Number(dot.getAttribute('data-hero-dot')) || 0);
        start();
      });
    });
    if (prev) {
      prev.addEventListener('click', function () {
        show(index - 1);
        start();
      });
    }
    if (next) {
      next.addEventListener('click', function () {
        show(index + 1);
        start();
      });
    }
    carousel.addEventListener('mouseenter', stop);
    carousel.addEventListener('mouseleave', start);
    show(0);
    start();
  }

  function setupFilters() {
    var panels = Array.prototype.slice.call(document.querySelectorAll('[data-filter-panel]'));
    panels.forEach(function (panel) {
      var container = panel.parentElement || document;
      var search = panel.querySelector('[data-filter-search]');
      var type = panel.querySelector('[data-filter-type]');
      var year = panel.querySelector('[data-filter-year]');
      var sort = panel.querySelector('[data-filter-sort]');
      var count = panel.querySelector('[data-filter-count]');
      var cards = Array.prototype.slice.call(container.querySelectorAll('.movie-card'));
      var rows = Array.prototype.slice.call(container.querySelectorAll('.ranking-row'));
      var items = cards.length ? cards : rows;
      var list = container.querySelector('[data-card-list]');
      var tbody = container.querySelector('[data-row-table] tbody');

      function itemText(item) {
        return [
          item.getAttribute('data-title') || '',
          item.getAttribute('data-region') || '',
          item.getAttribute('data-type') || '',
          item.getAttribute('data-genre') || '',
          item.getAttribute('data-tags') || ''
        ].join(' ').toLowerCase();
      }

      function apply() {
        var keyword = search ? search.value.trim().toLowerCase() : '';
        var typeValue = type ? type.value : '';
        var yearValue = year ? year.value : '';
        var visible = 0;

        items.forEach(function (item) {
          var matched = true;
          if (keyword && itemText(item).indexOf(keyword) === -1) {
            matched = false;
          }
          if (typeValue && (item.getAttribute('data-type') || '').indexOf(typeValue) === -1) {
            matched = false;
          }
          if (yearValue && (item.getAttribute('data-year') || '') !== yearValue) {
            matched = false;
          }
          item.classList.toggle('is-hidden', !matched);
          if (matched) {
            visible += 1;
          }
        });

        if (sort) {
          var sorted = items.slice().sort(function (a, b) {
            var ay = Number(a.getAttribute('data-year') || 0);
            var by = Number(b.getAttribute('data-year') || 0);
            return sort.value === 'asc' ? ay - by : by - ay;
          });
          sorted.forEach(function (item) {
            if (list) {
              list.appendChild(item);
            }
            if (tbody) {
              tbody.appendChild(item);
            }
          });
        }

        if (count) {
          count.textContent = '当前显示 ' + visible + ' 条，共 ' + items.length + ' 条';
        }
      }

      [search, type, year, sort].forEach(function (control) {
        if (!control) {
          return;
        }
        control.addEventListener(control.tagName === 'INPUT' ? 'input' : 'change', apply);
      });
      if (search) {
        var params = new URLSearchParams(window.location.search);
        var query = params.get('q');
        if (query) {
          search.value = query;
        }
      }
      apply();
    });
  }

  function setupPlayers() {
    var players = Array.prototype.slice.call(document.querySelectorAll('[data-player]'));
    players.forEach(function (player) {
      var video = player.querySelector('video');
      var button = player.querySelector('[data-play-trigger]');
      var status = player.querySelector('[data-player-status]');
      var source = player.getAttribute('data-src');
      var hlsInstance = null;
      var initialized = false;

      function setStatus(text) {
        if (status) {
          status.textContent = text;
        }
      }

      function initVideo() {
        if (initialized || !video || !source) {
          return;
        }
        initialized = true;
        video.controls = true;
        setStatus('正在加载播放源');

        if (window.Hls && window.Hls.isSupported()) {
          hlsInstance = new window.Hls({
            enableWorker: true,
            lowLatencyMode: true
          });
          hlsInstance.loadSource(source);
          hlsInstance.attachMedia(video);
          hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, function () {
            setStatus('播放源已就绪');
          });
          hlsInstance.on(window.Hls.Events.ERROR, function (event, data) {
            if (data && data.fatal) {
              setStatus('视频加载失败，请稍后重试');
            }
          });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = source;
          video.addEventListener('loadedmetadata', function () {
            setStatus('播放源已就绪');
          }, { once: true });
        } else {
          setStatus('当前浏览器不支持 HLS 播放');
        }
      }

      function play() {
        initVideo();
        if (!video) {
          return;
        }
        var promise = video.play();
        if (promise && typeof promise.catch === 'function') {
          promise.catch(function () {
            setStatus('请再次点击播放');
          });
        }
      }

      if (button) {
        button.addEventListener('click', play);
      }
      if (video) {
        video.addEventListener('click', function () {
          if (video.paused) {
            play();
          } else {
            video.pause();
          }
        });
        video.addEventListener('play', function () {
          player.classList.add('is-playing');
          setStatus('正在播放');
        });
        video.addEventListener('pause', function () {
          player.classList.remove('is-playing');
          setStatus('已暂停');
        });
        video.addEventListener('ended', function () {
          player.classList.remove('is-playing');
          setStatus('播放结束');
        });
      }
      window.addEventListener('beforeunload', function () {
        if (hlsInstance) {
          hlsInstance.destroy();
        }
      });
    });
  }

  ready(function () {
    setupMobileMenu();
    setupHeroCarousel();
    setupFilters();
    setupPlayers();
  });
}());
