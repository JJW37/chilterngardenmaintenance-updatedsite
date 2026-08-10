/*
  Content studio interaction layer.
  It is deliberately defensive: navigation and content remain complete with
  JavaScript disabled, reduced motion enabled, or an unavailable observer.
*/
(function () {
  'use strict';

  function ready(callback) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', callback, { once: true });
    else callback();
  }

  ready(function () {
    var root = document.querySelector('.content-studio');
    if (!root) return;

    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var $$ = function (selector, scope) { return Array.prototype.slice.call((scope || root).querySelectorAll(selector)); };
    var $ = function (selector, scope) { return (scope || root).querySelector(selector); };
    var header = document.querySelector('.header');

    function scrollToTarget(id) {
      var target = document.getElementById(id);
      if (!target) return;
      var headerOffset = (header ? header.offsetHeight : 0) + 120;
      var top = window.scrollY + target.getBoundingClientRect().top - headerOffset;
      window.scrollTo({ top: Math.max(0, top), behavior: reduceMotion ? 'auto' : 'smooth' });
    }

    $$('[data-studio-action]').forEach(function (button) {
      button.addEventListener('click', function () { scrollToTarget(button.getAttribute('data-studio-action')); });
    });

    var chapters = $$('[data-studio-chapter]');
    var chapterLinks = $$('[data-studio-chapter-link]');
    var progressLabel = $('[data-studio-progress-label]');
    var progressTitle = $('[data-studio-progress-title]');
    var progressBar = $('[data-studio-progress-bar]');

    function activateChapter(chapter) {
      if (!chapter) return;
      var key = chapter.getAttribute('data-studio-chapter');
      var index = chapters.indexOf(chapter);
      chapterLinks.forEach(function (link) {
        var active = link.getAttribute('data-studio-chapter-link') === key;
        link.classList.toggle('is-active', active);
        if (active) link.setAttribute('aria-current', 'step');
        else link.removeAttribute('aria-current');
      });
      if (index >= 0 && progressLabel) progressLabel.textContent = String(index + 1).padStart(2, '0') + ' / ' + String(chapters.length).padStart(2, '0');
      if (index >= 0 && progressBar) progressBar.style.width = (((index + 1) / chapters.length) * 100) + '%';
      if (progressTitle) {
        var activeLink = chapterLinks.filter(function (link) { return link.getAttribute('data-studio-chapter-link') === key; })[0];
        progressTitle.textContent = activeLink ? activeLink.textContent.trim() : 'Explore';
      }
    }

    chapterLinks.forEach(function (link) {
      link.addEventListener('click', function (event) {
        var id = (link.getAttribute('href') || '').replace(/^#/, '');
        if (!id || !document.getElementById(id)) return;
        event.preventDefault();
        scrollToTarget(id);
      });
    });

    if ('IntersectionObserver' in window && chapters.length) {
      var chapterObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) { if (entry.isIntersecting) activateChapter(entry.target); });
      }, { rootMargin: '-34% 0px -54% 0px', threshold: 0 });
      chapters.forEach(function (chapter) { chapterObserver.observe(chapter); });
    }
    activateChapter(chapters[0]);

    var revealNodes = $$('[data-studio-reveal]');
    if (!reduceMotion && 'IntersectionObserver' in window && revealNodes.length) {
      root.classList.add('content-studio--enhanced');
      var revealObserver = new IntersectionObserver(function (entries, observer) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        });
      }, { rootMargin: '0px 0px -9% 0px', threshold: .08 });
      revealNodes.forEach(function (node) { revealObserver.observe(node); });

      // Never permit decoration to hide useful content in an unusual browser.
      window.setTimeout(function () {
        revealNodes.forEach(function (node) { node.classList.add('is-visible'); });
      }, 950);
    } else {
      revealNodes.forEach(function (node) { node.classList.add('is-visible'); });
    }

    var hero = $('.page-header, .hero');
    var finePointer = window.matchMedia && window.matchMedia('(pointer: fine)').matches;
    if (hero && finePointer && !reduceMotion) {
      var frame = null;
      hero.addEventListener('pointermove', function (event) {
        var bounds = hero.getBoundingClientRect();
        var x = ((event.clientX - bounds.left) / Math.max(bounds.width, 1) - .5) * -10;
        var y = ((event.clientY - bounds.top) / Math.max(bounds.height, 1) - .5) * -7;
        if (frame) window.cancelAnimationFrame(frame);
        frame = window.requestAnimationFrame(function () {
          hero.style.setProperty('--studio-hero-x', x.toFixed(2) + 'px');
          hero.style.setProperty('--studio-hero-y', y.toFixed(2) + 'px');
        });
      }, { passive: true });
      hero.addEventListener('pointerleave', function () {
        hero.style.setProperty('--studio-hero-x', '0px');
        hero.style.setProperty('--studio-hero-y', '0px');
      }, { passive: true });
    }
  });
}());
