/* ==========================================================================
   CGM v8 Enhancements — Round-4 behaviour layer
   Issues: 1 (menu drag), 2 (map scroll), 3 (search popup), 4 (compare modal),
   7 (category nav), 10 (multi-select form).
   ========================================================================== */
(function () {
  'use strict';

  function ready(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else { fn(); }
  }

  /* ----- ISSUE 1: Mobile menu finger-drag scrolling -----
     Allow user to touch-drag the menu content up and down, with a visible
     scrollbar, even when content fits within the viewport. ----- */
  function wireMenuTouchDrag() {
    var mobileMenu = document.getElementById('mobileMenu');
    if (!mobileMenu || mobileMenu.dataset.dragWired === 'true') return;
    mobileMenu.dataset.dragWired = 'true';

    var startY = 0;
    var startScroll = 0;
    var dragging = false;

    mobileMenu.addEventListener('touchstart', function (e) {
      if (e.touches.length !== 1) return;
      // Only enable drag when the touch is on the menu background or a
      // non-interactive element (not on a link or button)
      var target = e.target;
      if (target.closest('a, button, input, select, textarea, summary')) return;
      startY = e.touches[0].clientY;
      startScroll = mobileMenu.scrollTop;
      dragging = true;
    }, { passive: true });

    mobileMenu.addEventListener('touchmove', function (e) {
      if (!dragging) return;
      var deltaY = e.touches[0].clientY - startY;
      var newScroll = startScroll - deltaY;
      mobileMenu.scrollTop = newScroll;
      // Prevent page scroll behind the menu
      if (e.cancelable) e.preventDefault();
    }, { passive: false });

    mobileMenu.addEventListener('touchend', function () {
      dragging = false;
    }, { passive: true });

    // Also enable mouse-drag for desktop testing of the mobile menu
    var mouseDown = false;
    var mouseStartY = 0;
    var mouseStartScroll = 0;

    mobileMenu.addEventListener('mousedown', function (e) {
      var target = e.target;
      if (target.closest('a, button, input, select, textarea, summary')) return;
      mouseDown = true;
      mouseStartY = e.clientY;
      mouseStartScroll = mobileMenu.scrollTop;
      mobileMenu.style.cursor = 'grabbing';
      e.preventDefault();
    });

    window.addEventListener('mousemove', function (e) {
      if (!mouseDown) return;
      var deltaY = e.clientY - mouseStartY;
      mobileMenu.scrollTop = mouseStartScroll - deltaY;
    });

    window.addEventListener('mouseup', function () {
      if (mouseDown) {
        mouseDown = false;
        mobileMenu.style.cursor = '';
      }
    });
  }

  /* ----- ISSUE 2: Map town click — auto-scroll to town intelligence ----- */
  function wireMapTownScroll() {
    // The map dispatches 'cgm:map-state' events with mode 'town' when a town
    // is clicked. Listen for it and scroll to #townIntel.
    document.addEventListener('cgm:map-state', function (e) {
      var detail = e.detail || {};
      if (detail.mode !== 'town') return;
      var townIntel = document.getElementById('townIntel');
      if (!townIntel) return;
      // Small delay to let the town panel render
      setTimeout(function () {
        townIntel.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 250);
    });
  }

  /* ----- ISSUE 3: Search town popup with "Select town" button ----- */
  function wireSearchPopup() {
    var searchInput = document.getElementById('locSearch') || document.getElementById('searchInput');
    if (!searchInput) return;
    if (searchInput.dataset.popupWired === 'true') return;
    searchInput.dataset.popupWired = 'true';

    // Find the parent wrapper of the search input
    var wrapper = searchInput.closest('.loc-search, .search-wrap, .loc-search-wrap, form, div');
    if (!wrapper) wrapper = searchInput.parentNode;
    // Make wrapper positioned if it isn't
    if (getComputedStyle(wrapper).position === 'static') {
      wrapper.style.position = 'relative';
    }

    // Create the popup element
    var popup = document.createElement('div');
    popup.className = 'town-search-popup';
    popup.hidden = true;
    popup.innerHTML =
      '<h3 class="town-search-popup__name"></h3>' +
      '<p class="town-search-popup__county"></p>' +
      '<p class="town-search-popup__intro"></p>' +
      '<button type="button" class="town-search-popup__btn">Select town &rarr;</button>';
    wrapper.appendChild(popup);

    var nameEl = popup.querySelector('.town-search-popup__name');
    var countyEl = popup.querySelector('.town-search-popup__county');
    var introEl = popup.querySelector('.town-search-popup__intro');
    var btn = popup.querySelector('.town-search-popup__btn');

    var currentSlug = null;
    var townsData = window.townsData || [];

    // Try to get townsData from the locations page global
    function getTownBySlug(slug) {
      if (window.townsData) {
        return window.townsData.find(function (t) { return t.slug === slug; });
      }
      // Fallback: dispatch a custom event to request town data
      return null;
    }

    function getTownByName(name) {
      if (window.townsData) {
        var lower = name.toLowerCase();
        return window.townsData.find(function (t) {
          return t.name.toLowerCase() === lower || t.slug === lower;
        });
      }
      return null;
    }

    function showPopup(town) {
      if (!town) return;
      currentSlug = town.slug;
      nameEl.textContent = town.name;
      countyEl.textContent = town.county + (town.region ? ' · ' + town.region : '');
      introEl.textContent = town.intro || 'Click "Select town" to view full local garden data.';
      popup.hidden = false;
    }

    function hidePopup() {
      popup.hidden = true;
      currentSlug = null;
    }

    // Listen for the existing selectSearchResult / selectTown flow
    // The locations page calls window.CGMSelectTown(slug, source) when a
    // search result is selected. Intercept that to show the popup first.
    var originalSelectTown = window.CGMSelectTown;
    if (typeof originalSelectTown === 'function') {
      window.CGMSelectTown = function (slug, source) {
        var town = getTownBySlug(slug);
        if (town && source === 'search') {
          showPopup(town);
          // Don't immediately navigate — let the user click "Select town"
          return;
        }
        // For other sources (map, swiper), call the original
        return originalSelectTown.apply(this, arguments);
      };
    }

    // Also intercept Enter key on search to show popup
    searchInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        var query = searchInput.value.trim();
        if (query.length >= 2) {
          var town = getTownByName(query);
          if (town) {
            e.preventDefault();
            e.stopPropagation();
            showPopup(town);
            return;
          }
        }
      }
    }, true); // capture phase

    // Popup button click — navigate to town intelligence
    btn.addEventListener('click', function () {
      if (!currentSlug) return;
      hidePopup();
      // Call the original selectTown (not our intercepted version)
      if (typeof originalSelectTown === 'function') {
        originalSelectTown(currentSlug, 'search');
      }
      // Scroll to town intelligence
      var townIntel = document.getElementById('townIntel');
      if (townIntel) {
        setTimeout(function () {
          townIntel.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    });

    // Hide popup on outside click
    document.addEventListener('click', function (e) {
      if (!popup.hidden && !popup.contains(e.target) && e.target !== searchInput) {
        hidePopup();
      }
    });

    // Hide popup on Escape
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !popup.hidden) {
        hidePopup();
      }
    });
  }

  /* ----- ISSUE 4: Compare modal — add body class when open so CSS can
     hide the compare-drawer overlay ----- */
  function wireCompareModalClass() {
    var modal = document.getElementById('compareModal');
    if (!modal) return;

    var observer = new MutationObserver(function () {
      var isOpen = !modal.hidden;
      document.body.classList.toggle('compare-modal-open', isOpen);
    });
    observer.observe(modal, { attributes: true, attributeFilter: ['hidden'] });
  }

  /* ----- ISSUE 7: Category left/right navigation for desktop ----- */
  function wireCategoryNav() {
    // Only on the gardening knowledge page
    var tipSections = document.querySelectorAll('.tip-category-section');
    if (!tipSections.length) return;
    if (window.matchMedia('(max-width: 768px)').matches) return; // desktop only

    // Find the tip-featured-section and insert nav after it (or before first category)
    var firstSection = tipSections[0];
    if (!firstSection) return;
    if (document.querySelector('.tip-category-nav')) return; // already added

    var nav = document.createElement('div');
    nav.className = 'tip-category-nav';
    nav.innerHTML =
      '<button type="button" class="tip-category-nav__btn tip-category-nav__btn--prev" disabled>' +
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>' +
        'Previous' +
      '</button>' +
      '<span class="tip-category-nav__label">Category 1 of ' + tipSections.length + '</span>' +
      '<button type="button" class="tip-category-nav__btn tip-category-nav__btn--next">' +
        'Next' +
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>' +
      '</button>';

    firstSection.parentNode.insertBefore(nav, firstSection);

    var prevBtn = nav.querySelector('.tip-category-nav__btn--prev');
    var nextBtn = nav.querySelector('.tip-category-nav__btn--next');
    var label = nav.querySelector('.tip-category-nav__label');
    var currentIdx = 0;

    function updateNav() {
      prevBtn.disabled = currentIdx <= 0;
      nextBtn.disabled = currentIdx >= tipSections.length - 1;
      label.textContent = 'Category ' + (currentIdx + 1) + ' of ' + tipSections.length;
    }

    function scrollToSection(idx) {
      if (idx < 0 || idx >= tipSections.length) return;
      currentIdx = idx;
      var target = tipSections[idx];
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      updateNav();
    }

    prevBtn.addEventListener('click', function () { scrollToSection(currentIdx - 1); });
    nextBtn.addEventListener('click', function () { scrollToSection(currentIdx + 1); });

    // Update current index based on scroll position
    var scrollTimer = null;
    window.addEventListener('scroll', function () {
      if (scrollTimer) clearTimeout(scrollTimer);
      scrollTimer = setTimeout(function () {
        var viewportMid = window.innerHeight / 2;
        var bestIdx = 0;
        var bestDist = Infinity;
        tipSections.forEach(function (section, idx) {
          var rect = section.getBoundingClientRect();
          var center = rect.top + rect.height / 2;
          var dist = Math.abs(center - viewportMid);
          if (dist < bestDist) {
            bestDist = dist;
            bestIdx = idx;
          }
        });
        if (bestIdx !== currentIdx) {
          currentIdx = bestIdx;
          updateNav();
        }
      }, 100);
    }, { passive: true });

    updateNav();
  }

  /* ----- ISSUE 10: "What do you need?" multi-select with numbered ordering ----- */
  function wireMultiSelectForm() {
    var serviceRadios = document.querySelectorAll('input[name="service"][type="radio"]');
    if (!serviceRadios.length) return;
    if (serviceRadios[0].dataset.multiWired === 'true') return;

    // Convert radio buttons to checkboxes with multi-select + ordering
    var selectedOrder = []; // array of values in selection order
    var wrapper = serviceRadios[0].closest('.calc-options');
    if (!wrapper) return;

    // Build the summary chip element
    var stepWrapper = wrapper.closest('.calc-step');
    var summary = document.createElement('div');
    summary.className = 'service-multi-summary';
    summary.innerHTML =
      '<span class="service-multi-summary__label">Selected services (in order):</span>' +
      '<div class="service-multi-summary__list"></div>';
    stepWrapper.appendChild(summary);
    var summaryList = summary.querySelector('.service-multi-summary__list');

    function updateSummary() {
      summaryList.innerHTML = '';
      selectedOrder.forEach(function (value, idx) {
        var chip = document.createElement('span');
        chip.className = 'service-multi-summary__chip';
        chip.innerHTML =
          '<span class="service-multi-summary__chip-num">' + (idx + 1) + '</span>' +
          value;
        summaryList.appendChild(chip);
      });
    }

    // Convert each radio to a checkbox
    serviceRadios.forEach(function (radio) {
      radio.dataset.multiWired = 'true';
      radio.setAttribute('type', 'checkbox');
      radio.setAttribute('name', 'service[]'); // array name for form submission
      radio.removeAttribute('checked');

      // Find the label and add an order badge
      var label = document.querySelector('label[for="' + radio.id + '"]');
      if (label) {
        var badge = document.createElement('span');
        badge.className = 'order-badge';
        badge.textContent = '0';
        label.appendChild(badge);

        radio.addEventListener('change', function () {
          if (radio.checked) {
            selectedOrder.push(radio.value);
          } else {
            selectedOrder = selectedOrder.filter(function (v) { return v !== radio.value; });
          }
          // Update badges on all labels
          serviceRadios.forEach(function (r) {
            var lbl = document.querySelector('label[for="' + r.id + '"]');
            if (lbl) {
              var b = lbl.querySelector('.order-badge');
              if (b) {
                var idx = selectedOrder.indexOf(r.value);
                b.textContent = idx >= 0 ? String(idx + 1) : '0';
              }
            }
          });
          updateSummary();
        });
      }
    });

    // Add the multi-select class to the wrapper for CSS
    wrapper.classList.add('calc-options--multi');

    // Override the form submit to send the ordered services
    var form = document.getElementById('quoteForm');
    if (form) {
      form.addEventListener('submit', function () {
        // Create a hidden input with the ordered services (comma-separated)
        var existing = form.querySelector('input[name="services_ordered"]');
        if (existing) existing.remove();
        var hidden = document.createElement('input');
        hidden.type = 'hidden';
        hidden.name = 'services_ordered';
        hidden.value = selectedOrder.join(' | ');
        form.appendChild(hidden);
      }, true); // capture phase, runs before the existing submit handler
    }
  }

  /* ----- Run all on ready ----- */
  ready(function () {
    wireMenuTouchDrag();
    wireMapTownScroll();
    wireSearchPopup();
    wireCompareModalClass();
    wireCategoryNav();
    wireMultiSelectForm();

    // Re-run category nav on resize
    var resizeTimer = null;
    window.addEventListener('resize', function () {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(wireCategoryNav, 300);
    });
  });

  // Expose for re-running
  window.CGMv8 = {
    wireMenuTouchDrag: wireMenuTouchDrag,
    wireMapTownScroll: wireMapTownScroll,
    wireSearchPopup: wireSearchPopup,
    wireCompareModalClass: wireCompareModalClass,
    wireCategoryNav: wireCategoryNav,
    wireMultiSelectForm: wireMultiSelectForm
  };
})();
