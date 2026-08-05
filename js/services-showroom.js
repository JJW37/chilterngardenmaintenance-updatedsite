/* Services showroom interaction layer.
   Enhances existing Services content and selector behaviour; it never removes
   service cards, guidance, links, forms or the page's original selector code. */
(function () {
  'use strict';

  function onReady(callback) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback, { once: true });
    } else {
      callback();
    }
  }

  onReady(function () {
    var root = document.querySelector('.services-showroom');
    if (!root) return;

    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var $ = function (selector, scope) { return (scope || document).querySelector(selector); };
    var $$ = function (selector, scope) { return Array.prototype.slice.call((scope || document).querySelectorAll(selector)); };
    var scrollTo = function (id) {
      var target = document.getElementById(id);
      if (target) target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    };

    /* Map the existing service selector into a clear, live route indicator. */
    var options = $$('.svc-selector__option', root);
    var panels = $$('.svc-selector__panel', root);
    var selectedTitle = $('[data-service-selection]', root);
    var selectedNote = $('[data-service-selection-note]', root);

    function panelFor(id) {
      return panels.filter(function (panel) { return panel.getAttribute('data-svc-panel') === id; })[0] || null;
    }

    function updateSelection(option) {
      if (!option) return;
      var id = option.getAttribute('data-svc-option');
      var panel = panelFor(id);
      options.forEach(function (item) {
        var active = item === option;
        item.setAttribute('aria-pressed', String(active));
      });
      root.dataset.serviceFocus = id || 'regular';
      if (!panel) return;
      var title = $('.svc-selector__panel-title', panel);
      var note = $('.svc-selector__panel-blurb', panel);
      if (selectedTitle && title) selectedTitle.textContent = title.textContent.trim();
      if (selectedNote && note) selectedNote.textContent = note.textContent.trim();
    }

    options.forEach(function (option) {
      option.addEventListener('click', function () {
        // main.js switches the original content first; this only mirrors it.
        window.setTimeout(function () { updateSelection(option); }, 0);
      });
    });

    var initialOption = options.filter(function (option) { return option.classList.contains('is-active'); })[0] || options[0];
    updateSelection(initialOption);

    if (window.MutationObserver && panels.length) {
      var selectorObserver = new MutationObserver(function () {
        var visiblePanel = panels.filter(function (panel) { return !panel.hasAttribute('hidden'); })[0];
        if (!visiblePanel) return;
        var correspondingOption = options.filter(function (option) {
          return option.getAttribute('data-svc-option') === visiblePanel.getAttribute('data-svc-panel');
        })[0];
        updateSelection(correspondingOption);
      });
      panels.forEach(function (panel) { selectorObserver.observe(panel, { attributes: true, attributeFilter: ['hidden'] }); });
    }

    /* Command bar controls mirror the portfolio controls but move through
       real Services content rather than an artificial gallery. */
    var actionTargets = {
      finder: 'service-selector',
      index: 'all-services',
      quote: 'service-handover'
    };
    $$('[data-service-action]', root).forEach(function (button) {
      button.addEventListener('click', function () { scrollTo(actionTargets[button.getAttribute('data-service-action')]); });
    });

    /* Make the long-form page navigable like chapters in a client project. */
    var chapters = $$('[data-service-chapter]', root);
    var chapterLinks = $$('[data-service-chapter-link]', root);
    var progressLabel = $('[data-service-progress-label]', root);
    var progressBar = $('[data-service-progress-bar]', root);
    var progressTitle = $('[data-service-progress-title]', root);

    function activateChapter(chapter) {
      if (!chapter) return;
      var chapterKey = chapter.getAttribute('data-service-chapter');
      var index = chapters.indexOf(chapter);
      chapterLinks.forEach(function (link) {
        var active = link.getAttribute('data-service-chapter-link') === chapterKey;
        link.classList.toggle('is-active', active);
        if (active) link.setAttribute('aria-current', 'step');
        else link.removeAttribute('aria-current');
      });
      if (progressLabel && index >= 0) {
        progressLabel.textContent = String(index + 1).padStart(2, '0') + ' / ' + String(chapters.length).padStart(2, '0');
      }
      if (progressBar && index >= 0) progressBar.style.width = (((index + 1) / chapters.length) * 100) + '%';
      if (progressTitle) {
        var link = chapterLinks.filter(function (item) { return item.getAttribute('data-service-chapter-link') === chapterKey; })[0];
        progressTitle.textContent = link ? link.textContent.trim() : 'Service studio';
      }
    }

    if ('IntersectionObserver' in window && chapters.length) {
      var chapterObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) activateChapter(entry.target);
        });
      }, { rootMargin: '-34% 0px -55% 0px', threshold: 0 });
      chapters.forEach(function (chapter) { chapterObserver.observe(chapter); });
    }
    activateChapter(chapters[0]);

    /* Reveal the existing information in a measured way. The page remains
       completely readable when observers or motion are unavailable. */
    var revealTargets = [
      '.svc-stats__grid',
      '.svc-selector__left',
      '.svc-selector__right',
      '.svc-grid-card',
      '.svc-principle',
      '.svc-guide-card',
      '.svc-step',
      '.svc-cta__inner'
    ];
    var revealNodes = [];
    revealTargets.forEach(function (selector) {
      $$(selector, root).forEach(function (node) {
        if (revealNodes.indexOf(node) === -1) revealNodes.push(node);
      });
    });

    if (!reduceMotion && 'IntersectionObserver' in window && revealNodes.length) {
      revealNodes.forEach(function (node) { node.setAttribute('data-service-reveal', ''); });
      root.classList.add('services-showroom--enhanced');
      var revealObserver = new IntersectionObserver(function (entries, observer) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        });
      }, { threshold: .09 });
      revealNodes.forEach(function (node) { revealObserver.observe(node); });
    }

    /* The reference portfolio reacts gently to the visitor's pointer. Use the
       same low-key depth on the garden-services opening frame. */
    var hero = $('.svc-hero--showroom', root);
    var finePointer = window.matchMedia && window.matchMedia('(pointer: fine)').matches;
    if (hero && finePointer && !reduceMotion) {
      var frame = null;
      hero.addEventListener('pointermove', function (event) {
        var bounds = hero.getBoundingClientRect();
        var x = ((event.clientX - bounds.left) / Math.max(bounds.width, 1) - .5) * -10;
        var y = ((event.clientY - bounds.top) / Math.max(bounds.height, 1) - .5) * -7;
        if (frame) window.cancelAnimationFrame(frame);
        frame = window.requestAnimationFrame(function () {
          hero.style.setProperty('--service-hero-x', x.toFixed(2) + 'px');
          hero.style.setProperty('--service-hero-y', y.toFixed(2) + 'px');
        });
      }, { passive: true });
      hero.addEventListener('pointerleave', function () {
        hero.style.setProperty('--service-hero-x', '0px');
        hero.style.setProperty('--service-hero-y', '0px');
      }, { passive: true });
    }
  });
})();
