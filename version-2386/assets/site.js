(function () {
  var navToggle = document.querySelector(".nav-toggle");
  var mainNav = document.querySelector(".main-nav");

  if (navToggle && mainNav) {
    navToggle.addEventListener("click", function () {
      mainNav.classList.toggle("open");
    });
  }

  var hero = document.querySelector("[data-hero]");

  if (hero) {
    var slides = Array.prototype.slice.call(hero.querySelectorAll(".hero-slide"));
    var dots = Array.prototype.slice.call(hero.querySelectorAll(".hero-dot"));
    var current = 0;

    function showSlide(index) {
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle("active", i === current);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle("active", i === current);
      });
    }

    dots.forEach(function (dot) {
      dot.addEventListener("click", function () {
        showSlide(Number(dot.getAttribute("data-slide")) || 0);
      });
    });

    if (slides.length > 1) {
      window.setInterval(function () {
        showSlide(current + 1);
      }, 5600);
    }
  }

  var filterInput = document.querySelector("[data-filter-input]");
  var yearSelect = document.querySelector("[data-filter-year]");
  var typeSelect = document.querySelector("[data-filter-type]");
  var cards = Array.prototype.slice.call(document.querySelectorAll(".movie-card"));
  var emptyState = document.querySelector("[data-empty-state]");

  function queryValue() {
    var params = new URLSearchParams(window.location.search);
    return params.get("q") || "";
  }

  function applyFilter() {
    var q = filterInput ? filterInput.value.trim().toLowerCase() : "";
    var year = yearSelect ? yearSelect.value : "";
    var type = typeSelect ? typeSelect.value : "";
    var visible = 0;

    cards.forEach(function (card) {
      var text = (card.getAttribute("data-tags") || "").toLowerCase();
      var cardYear = card.getAttribute("data-year") || "";
      var cardType = card.getAttribute("data-type") || "";
      var ok = (!q || text.indexOf(q) !== -1) && (!year || cardYear === year) && (!type || cardType === type);
      card.hidden = !ok;
      if (ok) {
        visible += 1;
      }
    });

    if (emptyState) {
      emptyState.hidden = visible !== 0;
    }
  }

  if (filterInput || yearSelect || typeSelect) {
    if (filterInput && queryValue()) {
      filterInput.value = queryValue();
    }

    [filterInput, yearSelect, typeSelect].forEach(function (el) {
      if (el) {
        el.addEventListener("input", applyFilter);
        el.addEventListener("change", applyFilter);
      }
    });

    applyFilter();
  }
})();
