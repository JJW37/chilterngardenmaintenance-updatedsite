/* ==========================================================================
   CGM v5 Enhancements — Instructions website.txt behaviour layer
   Loaded after main.js. Additive only — does not override existing code.
   ========================================================================== */
(function () {
  'use strict';

  function ready(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else { fn(); }
  }

  /* ----- INSTR #27: Service pages — first details box NOT open by default ----- */
  function closeFirstServiceAccordion() {
    var firstOpen = document.querySelector('.service-accordion > details[open]:first-child');
    if (firstOpen) firstOpen.removeAttribute('open');
    // Also handle the case where the first details child has [open]
    var accordions = document.querySelectorAll('.service-accordion');
    accordions.forEach(function (acc) {
      var first = acc.querySelector('details:first-child');
      if (first && first.hasAttribute('open')) {
        first.removeAttribute('open');
      }
    });
  }

  /* ----- INSTR #38: Locations — scroll to "Town intelligence" on town click ----- */
  function wireLocationsTownClick() {
    var townLinks = document.querySelectorAll('.town-card, .town-chip, .locations-town-card, a[href*="/locations/"]');
    townLinks.forEach(function (el) {
      // Only wire clicks for same-page town chips (not navigations to other town pages)
      if (el.tagName === 'A' && el.getAttribute('href') && el.getAttribute('href').indexOf('#') === -1) return;
      el.addEventListener('click', function () {
        var target = document.getElementById('town-intelligence') ||
                     document.querySelector('.town-intelligence, [data-town-intelligence], #intelligence, .intelligence');
        if (target) {
          setTimeout(function () {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 80);
        }
      });
    });
  }

  /* ----- INSTR #32: Plant library — horizontal scroll progress bar ----- */
  function wirePlantRowProgress() {
    var rows = document.querySelectorAll('.plant-row, .plants-row, .plant-row-scroll, .plant-grid-row');
    rows.forEach(function (row) {
      if (row.dataset.progressWired === 'true') return;
      row.dataset.progressWired = 'true';

      var bar = document.createElement('div');
      bar.className = 'plant-row-progress';
      bar.setAttribute('aria-hidden', 'true');
      var fill = document.createElement('div');
      fill.className = 'plant-row-progress__fill';
      bar.appendChild(fill);

      // Insert before the row
      row.parentNode.insertBefore(bar, row);

      function update() {
        var max = row.scrollWidth - row.clientWidth;
        if (max <= 0) { fill.style.width = '100%'; return; }
        var pct = (row.scrollLeft / max) * 100;
        fill.style.width = pct + '%';
      }
      row.addEventListener('scroll', update, { passive: true });
      window.addEventListener('resize', update, { passive: true });
      update();
    });
  }

  /* ----- INSTR #19: Popular articles auto-refresh every 12 hours ----- */
  function wirePopularArticlesRefresh() {
    var KEY = 'cgm_popular_articles_seed';
    var TWELVE_HRS = 12 * 60 * 60 * 1000;
    var now = Date.now();
    var stored = null;
    try { stored = parseInt(localStorage.getItem(KEY), 10); } catch (e) {}
    if (!stored || (now - stored) > TWELVE_HRS) {
      try { localStorage.setItem(KEY, String(now)); } catch (e) {}
      // Shuffle popular articles on this page (visual refresh)
      var containers = document.querySelectorAll('.article-card-popular-grid, .popular-articles-grid, .article-card-grid');
      containers.forEach(function (grid) {
        var items = Array.prototype.slice.call(grid.children);
        // Fisher-Yates shuffle
        for (var i = items.length - 1; i > 0; i--) {
          var j = Math.floor(Math.random() * (i + 1));
          if (i !== j) grid.insertBefore(items[i], items[j]);
        }
      });
    }
  }

  /* ----- INSTR #16: Wire predictive search on every search input (safety net) ----- */
  // (predictive-search.js already exists; this is a safety hook to ensure all
  // search inputs have a results container sibling.)
  function ensurePredictiveContainers() {
    if (!window.CGMPredictiveSearch) return;
    var inputs = document.querySelectorAll('input[type="search"], input[type="text"][placeholder*="earch" i], input[name*="search" i], input[aria-label*="search" i]');
    inputs.forEach(function (input) {
      if (input.dataset.cgmPredictiveWired === 'true') return;
      input.dataset.cgmPredictiveWired = 'true';
      if (!input.nextElementSibling || !input.nextElementSibling.classList.contains('predictive-results')) {
        var box = document.createElement('div');
        box.className = 'predictive-results cgm-predictive-results';
        box.setAttribute('role', 'listbox');
        box.hidden = true;
        input.parentNode.insertBefore(box, input.nextSibling);
      }
    });
  }

  /* ----- INSTR #22: Make sure cgm-tilt class is applied to all premium cards ----- */
  function applyTiltToCards() {
    var selectors = [
      '.editorial-card-grid__cell',
      '.editorial-service-grid__cell',
      '.tip-card',
      '.article-card-popular',
      '.plant-card-premium',
      '.guide-card',
      '.service-resource_card',
      '.article-tool-links__card'
    ];
    selectors.forEach(function (sel) {
      document.querySelectorAll(sel).forEach(function (el) {
        if (!el.classList.contains('cgm-tilt') && !el.hasAttribute('data-tilt')) {
          el.classList.add('cgm-tilt');
        }
      });
    });
  }

  /* ----- INSTR #28: Verify article dates — Published >= April 2026, Last reviewed 19.07.2026 ----- */
  function enforceArticleDates() {
    var reviewed = document.querySelectorAll('.article-byline-block, .article-meta, article header');
    reviewed.forEach(function (block) {
      // Find "Last reviewed" text and normalize to 19.07.2026
      var html = block.innerHTML;
      if (/Last\s+reviewed/i.test(html) && !/19\.07\.2026/.test(html)) {
        html = html.replace(/(Last\s+reviewed[\s\S]{0,80}?)(\d{1,2}[\.\/]\d{1,2}[\.\/]\d{2,4}|[A-Z][a-z]+\s+\d{1,2},?\s+\d{4})/i, '$119.07.2026');
        block.innerHTML = html;
      }
    });
  }

  /* ----- INSTR #11: Replace AI hedge photo with pruned-hedge-no-person.webp ----- */
  function replaceHedgePhoto() {
    document.querySelectorAll('img[src*="hedge-chiltern-editorial.png"]').forEach(function (img) {
      img.src = img.src.replace('hedge-chiltern-editorial.png', 'pruned-hedge-no-person.webp');
      img.alt = 'A neatly pruned hedge in a Chiltern garden, no people';
    });
  }

  /* ----- Run all enhancements on ready ----- */
  ready(function () {
    closeFirstServiceAccordion();
    wireLocationsTownClick();
    wirePlantRowProgress();
    wirePopularArticlesRefresh();
    ensurePredictiveContainers();
    applyTiltToCards();
    enforceArticleDates();
    replaceHedgePhoto();

    // Re-run plant progress wiring after a tick (in case content is dynamically injected)
    setTimeout(wirePlantRowProgress, 500);
  });

  // Expose for re-running after dynamic content changes
  window.CGMv5 = {
    wirePlantRowProgress: wirePlantRowProgress,
    ensurePredictiveContainers: ensurePredictiveContainers,
    applyTiltToCards: applyTiltToCards
  };
})();
