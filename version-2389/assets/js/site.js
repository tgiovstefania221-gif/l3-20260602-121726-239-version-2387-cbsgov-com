(function () {
  var navButton = document.querySelector('[data-nav-toggle]');
  var nav = document.querySelector('[data-site-nav]');
  if (navButton && nav) {
    navButton.addEventListener('click', function () {
      nav.classList.toggle('is-open');
    });
  }

  var current = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.site-nav a').forEach(function (link) {
    var href = link.getAttribute('href') || '';
    if (href.split('/').pop() === current) {
      link.classList.add('is-active');
    }
  });

  document.querySelectorAll('[data-hero]').forEach(function (hero) {
    var slides = Array.prototype.slice.call(hero.querySelectorAll('.hero-slide'));
    var dots = Array.prototype.slice.call(hero.querySelectorAll('.hero-dots button'));
    if (!slides.length) {
      return;
    }
    var index = 0;
    var timer = null;

    function show(next) {
      index = (next + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle('is-active', i === index);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle('is-active', i === index);
      });
    }

    function start() {
      stop();
      timer = setInterval(function () {
        show(index + 1);
      }, 5000);
    }

    function stop() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    }

    dots.forEach(function (dot, i) {
      dot.addEventListener('click', function () {
        show(i);
        start();
      });
    });

    hero.addEventListener('mouseenter', stop);
    hero.addEventListener('mouseleave', start);
    show(0);
    start();
  });

  var filterRoot = document.querySelector('[data-filter-root]');
  if (filterRoot) {
    var input = filterRoot.querySelector('[data-filter-input]');
    var region = filterRoot.querySelector('[data-filter-region]');
    var type = filterRoot.querySelector('[data-filter-type]');
    var year = filterRoot.querySelector('[data-filter-year]');
    var cards = Array.prototype.slice.call(filterRoot.querySelectorAll('[data-title]'));
    var empty = filterRoot.querySelector('[data-empty]');
    var params = new URLSearchParams(window.location.search);
    var q = params.get('q');
    if (q && input) {
      input.value = q;
    }

    function read(element) {
      return element ? element.value.trim().toLowerCase() : '';
    }

    function apply() {
      var keyword = read(input);
      var regionValue = read(region);
      var typeValue = read(type);
      var yearValue = read(year);
      var visible = 0;
      cards.forEach(function (card) {
        var haystack = [
          card.dataset.title || '',
          card.dataset.region || '',
          card.dataset.type || '',
          card.dataset.year || '',
          card.dataset.tags || ''
        ].join(' ').toLowerCase();
        var ok = true;
        if (keyword && haystack.indexOf(keyword) === -1) {
          ok = false;
        }
        if (regionValue && (card.dataset.region || '').toLowerCase().indexOf(regionValue) === -1) {
          ok = false;
        }
        if (typeValue && (card.dataset.type || '').toLowerCase().indexOf(typeValue) === -1) {
          ok = false;
        }
        if (yearValue && String(card.dataset.year || '') !== yearValue) {
          ok = false;
        }
        card.style.display = ok ? '' : 'none';
        if (ok) {
          visible += 1;
        }
      });
      if (empty) {
        empty.style.display = visible ? 'none' : '';
      }
    }

    [input, region, type, year].forEach(function (element) {
      if (element) {
        element.addEventListener('input', apply);
        element.addEventListener('change', apply);
      }
    });
    apply();
  }
})();
