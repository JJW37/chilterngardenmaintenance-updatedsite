/* About CGM showroom interaction layer.
   Adds discovery and wayfinding without replacing the original page content. */
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
    var root = document.querySelector('.about-showroom');
    if (!root) return;

    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var $ = function (selector, scope) { return (scope || document).querySelector(selector); };
    var $$ = function (selector, scope) { return Array.prototype.slice.call((scope || document).querySelectorAll(selector)); };
    var scrollTo = function (id) {
      var target = document.getElementById(id);
      if (target) target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    };

    /* Command bar controls point to the real About content. */
    var actionTargets = {
      story: 'about-story',
      standards: 'about-standards',
      contact: 'about-contact'
    };
    $$('[data-about-action]', root).forEach(function (button) {
      button.addEventListener('click', function () {
        scrollTo(actionTargets[button.getAttribute('data-about-action')]);
      });
    });

    /* Keep the project-style chapter rail in sync with the reader's place. */
    var chapters = $$('[data-about-chapter]', root);
    var chapterLinks = $$('[data-about-chapter-link]', root);
    var progressLabel = $('[data-about-progress-label]', root);
    var progressBar = $('[data-about-progress-bar]', root);
    var progressTitle = $('[data-about-progress-title]', root);

    function activateChapter(chapter) {
      if (!chapter) return;
      var chapterKey = chapter.getAttribute('data-about-chapter');
      var index = chapters.indexOf(chapter);
      chapterLinks.forEach(function (link) {
        var active = link.getAttribute('data-about-chapter-link') === chapterKey;
        link.classList.toggle('is-active', active);
        if (active) link.setAttribute('aria-current', 'step');
        else link.removeAttribute('aria-current');
      });
      if (progressLabel && index >= 0) {
        progressLabel.textContent = String(index + 1).padStart(2, '0') + ' / ' + String(chapters.length).padStart(2, '0');
      }
      if (progressBar && index >= 0) progressBar.style.width = (((index + 1) / chapters.length) * 100) + '%';
      if (progressTitle) {
        var link = chapterLinks.filter(function (item) { return item.getAttribute('data-about-chapter-link') === chapterKey; })[0];
        progressTitle.textContent = link ? link.textContent.trim() : 'About CGM';
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

    /* The standards board is a small, useful interaction rather than decoration. */
    var standardControls = $$('.about-standard-lab__control', root);
    var standardDetail = $('[data-about-standard-detail]', root);

    function activateStandard(control, focus) {
      if (!control) return;
      standardControls.forEach(function (item) {
        var active = item === control;
        item.classList.toggle('is-active', active);
        item.setAttribute('aria-selected', String(active));
      });
      root.dataset.aboutStandard = control.getAttribute('data-about-standard') || 'direct';
      if (standardDetail) standardDetail.textContent = control.getAttribute('data-about-copy') || standardDetail.textContent;
      if (focus) control.focus();
    }

    standardControls.forEach(function (control, index) {
      control.addEventListener('click', function () { activateStandard(control, false); });
      control.addEventListener('keydown', function (event) {
        if (!['ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        var next = index;
        if (event.key === 'ArrowDown' || event.key === 'ArrowRight') next = (index + 1) % standardControls.length;
        if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') next = (index - 1 + standardControls.length) % standardControls.length;
        if (event.key === 'Home') next = 0;
        if (event.key === 'End') next = standardControls.length - 1;
        activateStandard(standardControls[next], true);
      });
    });
    activateStandard(standardControls.filter(function (control) { return control.classList.contains('is-active'); })[0] || standardControls[0], false);

    /* Reveal content only after enhancement has attached. It stays readable if JS fails. */
    var revealNodes = [];
    ['[data-about-reveal]', '.about-narrative__chapter'].forEach(function (selector) {
      $$(selector, root).forEach(function (node) {
        if (revealNodes.indexOf(node) === -1) revealNodes.push(node);
      });
    });

    if (!reduceMotion && 'IntersectionObserver' in window && revealNodes.length) {
      root.classList.add('about-showroom--enhanced');
      var revealObserver = new IntersectionObserver(function (entries, observer) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        });
      }, { threshold: .09 });
      revealNodes.forEach(function (node) { revealObserver.observe(node); });
    }

    /* A quiet layer of depth on the opening landscape, matched to the portfolio. */
    var hero = $('.about-hero', root);
    var finePointer = window.matchMedia && window.matchMedia('(pointer: fine)').matches;
    if (hero && finePointer && !reduceMotion) {
      var frame = null;
      hero.addEventListener('pointermove', function (event) {
        var bounds = hero.getBoundingClientRect();
        var x = ((event.clientX - bounds.left) / Math.max(bounds.width, 1) - .5) * -10;
        var y = ((event.clientY - bounds.top) / Math.max(bounds.height, 1) - .5) * -7;
        if (frame) window.cancelAnimationFrame(frame);
        frame = window.requestAnimationFrame(function () {
          hero.style.setProperty('--about-hero-x', x.toFixed(2) + 'px');
          hero.style.setProperty('--about-hero-y', y.toFixed(2) + 'px');
        });
      }, { passive: true });
      hero.addEventListener('pointerleave', function () {
        hero.style.setProperty('--about-hero-x', '0px');
        hero.style.setProperty('--about-hero-y', '0px');
      }, { passive: true });
    }
  });
})();
