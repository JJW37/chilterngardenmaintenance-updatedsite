/* ==========================================================================
   CGM v7 Enhancements — Round-3 behaviour layer
   Fixes: card lag (remove tilt from service grid), mobile menu scroll-to-top
   on open, compare modal mobile data-labels, nine services hint injection.
   ========================================================================== */
(function () {
  'use strict';

  function ready(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else { fn(); }
  }

  /* ----- ISSUE 4: Remove 3D tilt from service grid cards to fix lag ----- */
  function disableTiltOnServiceCards() {
    // The card-tilt.js adds .cgm-tilt class and pointermove handlers.
    // We remove the class and reset the CSS variables so the cards
    // respond instantly to clicks without render lag.
    var serviceCards = document.querySelectorAll(
      '.editorial-service-grid__cell'
    );
    serviceCards.forEach(function (card) {
      card.classList.remove('cgm-tilt');
      card.removeAttribute('data-tilt');
      card.style.setProperty('--tilt-x', '0deg');
      card.style.setProperty('--tilt-y', '0deg');
      card.style.willChange = 'auto';
      // Mark as tilt-ready so card-tilt.js doesn't re-attach
      card.dataset.tiltReady = 'true';
    });
  }

  /* ----- ISSUE 4: Add "Scroll for more" hint BELOW the nine services grid
     (instead of using the ::after pseudo that bleeds through cards) ----- */
  function addScrollHint() {
    var grid = document.querySelector('.editorial-service-grid');
    if (!grid || grid.dataset.hintAdded === 'true') return;
    grid.dataset.hintAdded = 'true';

    // Only show hint on mobile
    if (window.matchMedia('(max-width: 768px)').matches) {
      var wrap = document.createElement('div');
      wrap.className = 'editorial-service-grid-wrap';
      wrap.style.position = 'relative';
      grid.parentNode.insertBefore(wrap, grid);
      wrap.appendChild(grid);

      var hint = document.createElement('div');
      hint.className = 'editorial-service-grid-wrap__hint';
      hint.textContent = 'Scroll down for more services';
      wrap.appendChild(hint);
    }
  }

  /* ----- ISSUE 9: When mobile menu opens, ensure it starts at the top
     (no gap showing the page behind) ----- */
  function fixMobileMenuOpen() {
    var menuToggle = document.getElementById('mobileMenuToggle');
    var mobileMenu = document.getElementById('mobileMenu');
    if (!menuToggle || !mobileMenu) return;

    // Intercept the menu open to reset scroll position
    menuToggle.addEventListener('click', function () {
      // Use setTimeout to run after the menu becomes visible
      setTimeout(function () {
        if (!mobileMenu.hidden) {
          mobileMenu.scrollTop = 0;
        }
      }, 10);
    }, true); // capture phase to run before main.js handler
  }

  /* ----- ISSUE 10: Add data-label attributes to compare table cells
     so the CSS can render them as stacked cards on mobile ----- */
  function fixCompareModalMobile() {
    // Watch for the compare modal being shown and add data-labels
    var observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        if (m.type === 'childList') {
          var table = document.querySelector('.compare-table');
          if (table && !table.dataset.labelsAdded) {
            table.dataset.labelsAdded = 'true';
            var firstRow = table.querySelector('tbody tr');
            if (firstRow) {
              var labels = firstRow.querySelectorAll('td');
              var labelValues = [];
              labels.forEach(function (td) {
                labelValues.push(td.textContent.trim());
              });
              // Now apply data-label to all rows (skipping the first column)
              var rows = table.querySelectorAll('tbody tr');
              rows.forEach(function (row) {
                var cells = row.querySelectorAll('td');
                for (var i = 1; i < cells.length; i++) {
                  if (labelValues[i]) {
                    cells[i].setAttribute('data-label', labelValues[i]);
                  }
                }
              });
            }
          }
        }
      });
    });
    var modalBody = document.getElementById('compareModalBody');
    if (modalBody) {
      observer.observe(modalBody, { childList: true, subtree: true });
    }
  }

  /* ----- ISSUE 7: Ensure the mobile menu is always scrollable even when
     content doesn't fill it (the CSS overflow-y: scroll handles this,
     but we also make sure touch scrolling works on iOS) ----- */
  function ensureMenuTouchScroll() {
    var mobileMenu = document.getElementById('mobileMenu');
    if (!mobileMenu) return;
    // iOS sometimes needs -webkit-overflow-scrolling: touch explicitly
    mobileMenu.style.webkitOverflowScrolling = 'touch';
  }

  /* ----- Run all on ready ----- */
  ready(function () {
    disableTiltOnServiceCards();
    addScrollHint();
    fixMobileMenuOpen();
    fixCompareModalMobile();
    ensureMenuTouchScroll();

    // Re-run tilt removal after a tick (in case card-tilt.js runs later)
    setTimeout(disableTiltOnServiceCards, 200);
    setTimeout(disableTiltOnServiceCards, 1000);

    // Re-add scroll hint on resize (in case orientation changed)
    var resizeTimer = null;
    window.addEventListener('resize', function () {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(addScrollHint, 200);
    });
  });

  // Expose for re-running
  window.CGMv7 = {
    disableTiltOnServiceCards: disableTiltOnServiceCards,
    addScrollHint: addScrollHint,
    fixCompareModalMobile: fixCompareModalMobile
  };
})();
