(function () {
  var toggle = document.querySelector('[data-nav-toggle]');
  var nav = document.querySelector('[data-site-nav]');

  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      nav.classList.toggle('open');
    });
  }

  var input = document.querySelector('[data-search-input]');
  var category = document.querySelector('[data-category-filter]');
  var sort = document.querySelector('[data-sort-select]');
  var cards = Array.prototype.slice.call(document.querySelectorAll('.movie-card'));
  var empty = document.querySelector('[data-empty-state]');
  var grid = document.querySelector('[data-movie-grid]');

  function normalize(value) {
    return String(value || '').toLowerCase().trim();
  }

  function applyFilter() {
    var keyword = normalize(input ? input.value : '');
    var cat = category ? category.value : '';
    var visible = 0;

    cards.forEach(function (card) {
      var text = normalize(card.getAttribute('data-search'));
      var cardCat = card.getAttribute('data-category') || '';
      var matchedKeyword = !keyword || text.indexOf(keyword) !== -1;
      var matchedCategory = !cat || cardCat === cat;
      var show = matchedKeyword && matchedCategory;

      card.style.display = show ? '' : 'none';
      if (show) {
        visible += 1;
      }
    });

    if (empty) {
      empty.classList.toggle('show', visible === 0);
    }
  }

  function applySort() {
    if (!grid || !sort) {
      return;
    }

    var value = sort.value;
    var sorted = cards.slice();

    sorted.sort(function (a, b) {
      if (value === 'year-desc') {
        return Number(b.getAttribute('data-year') || 0) - Number(a.getAttribute('data-year') || 0);
      }
      if (value === 'year-asc') {
        return Number(a.getAttribute('data-year') || 0) - Number(b.getAttribute('data-year') || 0);
      }
      if (value === 'title-asc') {
        return normalize(a.getAttribute('data-search')).localeCompare(normalize(b.getAttribute('data-search')), 'zh-Hans-CN');
      }
      return 0;
    });

    sorted.forEach(function (card) {
      grid.appendChild(card);
    });
    applyFilter();
  }

  if (input) {
    input.addEventListener('input', applyFilter);
  }

  if (category) {
    category.addEventListener('change', applyFilter);
  }

  if (sort) {
    sort.addEventListener('change', applySort);
  }
})();
