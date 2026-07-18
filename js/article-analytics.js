/* CGM Article Analytics - tracks engagement with article features.
   Loaded on tips articles and plant pages.
   All events fire through gtag() which is queued in dataLayer
   before cookie consent and sent to GA4 after consent is granted. */
(function() {
  'use strict';

  // ---- Helpers ----
  function track(eventName, params) {
    if (typeof gtag === 'function') {
      gtag('event', eventName, params);
    }
  }

  // ---- Time-on-page tracking (fires at 10s, 30s, 60s, 120s, 300s) ----
  var MILESTONES = [10, 30, 60, 120, 300];
  var firedMilestones = {};
  MILESTONES.forEach(function(s) {
    setTimeout(function() {
      // Only fire if user hasn't bounced (document is visible)
      if (!document.hidden) {
        firedMilestones[s] = true;
        track('article_time_on_page', {
          seconds: s,
          page_path: window.location.pathname,
          page_type: document.body.dataset.pageType || 'article'
        });
      }
    }, s * 1000);
  });

  // ---- Scroll depth tracking (25%, 50%, 75%, 100%) ----
  var SCROLL_MILESTONES = [25, 50, 75, 100];
  var firedScroll = {};
  function checkScrollDepth() {
    var scrollTop = window.scrollY;
    var docHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (docHeight <= 0) return;
    var pct = Math.round((scrollTop / docHeight) * 100);
    SCROLL_MILESTONES.forEach(function(m) {
      if (pct >= m && !firedScroll[m]) {
        firedScroll[m] = true;
        track('article_scroll_depth', {
          percent: m,
          page_path: window.location.pathname,
          page_type: document.body.dataset.pageType || 'article'
        });
      }
    });
  }
  window.addEventListener('scroll', checkScrollDepth, { passive: true });
  checkScrollDepth();

  // ---- Quick Answer block engagement ----
  var qaBlock = document.querySelector('.editorial-quick-answer');
  if (qaBlock) {
    var qaSeen = false;
    var qaReadTime = null;

    // Track when Quick Answer enters viewport
    if ('IntersectionObserver' in window) {
      var qaObserver = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          if (entry.isIntersecting && !qaSeen) {
            qaSeen = true;
            qaReadTime = Date.now();
            track('quick_answer_seen', {
              page_path: window.location.pathname,
              page_type: document.body.dataset.pageType || 'article'
            });
          }
        });
      }, { threshold: 0.5 });
      qaObserver.observe(qaBlock);
    }

    // Track dwell time on Quick Answer when user scrolls past it
    var qaDwellTracked = false;
    window.addEventListener('scroll', function() {
      if (qaSeen && !qaDwellTracked && qaReadTime) {
        var qaRect = qaBlock.getBoundingClientRect();
        // When user has scrolled past the Quick Answer (bottom is above viewport center)
        if (qaRect.bottom < window.innerHeight * 0.5) {
          qaDwellTracked = true;
          var dwell = Math.round((Date.now() - qaReadTime) / 1000);
          track('quick_answer_dwell', {
            dwell_seconds: dwell,
            page_path: window.location.pathname,
            page_type: document.body.dataset.pageType || 'article'
          });
        }
      }
    }, { passive: true });
  }

  // ---- TOC engagement ----
  var toc = document.querySelector('.article-toc.editorial-toc');
  if (toc) {
    var tocClicked = {};
    toc.addEventListener('click', function(e) {
      var item = e.target.closest('.toc-item, .toc-sub-item');
      if (item) {
        var label = item.textContent.trim().substring(0, 60);
        if (!tocClicked[label]) {
          tocClicked[label] = true;
          track('toc_click', {
            item_label: label,
            is_sub_item: item.classList.contains('toc-sub-item'),
            page_path: window.location.pathname
          });
        }
      }
    });

    // Track TOC expand/collapse
    toc.addEventListener('click', function(e) {
      var toggle = e.target.closest('.toc-toggle');
      if (toggle) {
        var group = toggle.closest('.toc-group');
        var link = group ? group.querySelector('.toc-item--has-subs') : null;
        var label = link ? link.textContent.trim().substring(0, 60) : 'unknown';
        var isOpen = toggle.classList.contains('toc-toggle--open');
        track('toc_toggle', {
          section_label: label,
          action: isOpen ? 'expand' : 'collapse',
          page_path: window.location.pathname
        });
      }
    });
  }

  // ---- Callout engagement (track when callouts are seen) ----
  var callouts = document.querySelectorAll('.callout-editorial');
  if (callouts.length && 'IntersectionObserver' in window) {
    var calloutSeen = {};
    var calloutObserver = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          var idx = Array.from(callouts).indexOf(entry.target);
          if (!calloutSeen[idx]) {
            calloutSeen[idx] = true;
            track('callout_seen', {
              callout_index: idx,
              page_path: window.location.pathname
            });
          }
        }
      });
    }, { threshold: 0.5 });
    callouts.forEach(function(c) { calloutObserver.observe(c); });
  }

  // ---- Plant page fact-grid engagement ----
  var factGrid = document.querySelector('.fact-grid');
  if (factGrid) {
    factGrid.addEventListener('click', function(e) {
      var fact = e.target.closest('.fact');
      if (fact) {
        var label = fact.querySelector('dt') ? fact.querySelector('dt').textContent.trim() : 'unknown';
        track('plant_fact_click', {
          fact_label: label,
          page_path: window.location.pathname
        });
      }
    });
  }
})();

// ---- Debug mode: log all tracked events to console ----
// Set window.CGM_ANALYTICS_DEBUG = true in the console to enable
var originalTrack = track;
track = function(eventName, params) {
  if (window.CGM_ANALYTICS_DEBUG) {
    console.log('[CGM Analytics]', eventName, params);
  }
  originalTrack(eventName, params);
};
console.log('[CGM Analytics] Loaded on', window.location.pathname, '- set CGM_ANALYTICS_DEBUG=true to see events');
