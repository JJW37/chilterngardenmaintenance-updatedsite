/* CGM interaction layer: restrained 3D card tilt for mouse and device motion. */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia && window.matchMedia('(pointer: fine)').matches;
  var cardSelector = [
    '[data-tilt]',
    '.card',
    '.editorial-card-grid__cell',
    '.editorial-service-grid__cell',
    '.service-card-mobile',
    '.article-card-popular',
    '.tip-card',
    '.guide-card',
    '.guide-cat-card',
    '.legal-card',
    '.loc-county-card',
    '.local-plant-card',
    '.sidebar-card',
    '.svc-grid-card',
    '.svc-guide-card',
    '.editorial-calc-card',
    '.town-data-card',
    '.plant-card-premium',
    '.service-resource-card',
    '.article-tool-links__card',
    '.problem-diagnosis__option',
    '.town-card'
  ].join(',');

  function reset(card) {
    card.style.setProperty('--tilt-x', '0deg');
    card.style.setProperty('--tilt-y', '0deg');
    card.style.setProperty('--tilt-glow-x', '50%');
    card.style.setProperty('--tilt-glow-y', '50%');
  }

  function apply(card, x, y, glowX, glowY) {
    card.style.setProperty('--tilt-x', x.toFixed(2) + 'deg');
    card.style.setProperty('--tilt-y', y.toFixed(2) + 'deg');
    card.style.setProperty('--tilt-glow-x', glowX + '%');
    card.style.setProperty('--tilt-glow-y', glowY + '%');
  }

  function initTilt() {
    if (reduceMotion) return;
    document.querySelectorAll(cardSelector).forEach(function (card) {
      if (card.dataset.tiltReady === 'true') return;
      card.dataset.tiltReady = 'true';
      card.classList.add('cgm-tilt');
      reset(card);
      if (!finePointer) return;
      card.addEventListener('pointermove', function (event) {
        var rect = card.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        var px = (event.clientX - rect.left) / rect.width;
        var py = (event.clientY - rect.top) / rect.height;
        apply(card, (0.5 - py) * 5, (px - 0.5) * 5, px * 100, py * 100);
      });
      card.addEventListener('pointerleave', function () { reset(card); });
      card.addEventListener('blur', function () { reset(card); }, true);
    });
  }

  function initOrientation() {
    if (reduceMotion || finePointer || !('DeviceOrientationEvent' in window)) return;
    var cards = [];
    function updateCards() {
      cards = Array.prototype.slice.call(document.querySelectorAll('.cgm-tilt'));
    }
    updateCards();
    window.addEventListener('deviceorientation', function (event) {
      if (event.gamma == null || event.beta == null) return;
      if (!cards.length) updateCards();
      var x = Math.max(-4, Math.min(4, event.gamma / 9));
      var y = Math.max(-4, Math.min(4, (event.beta - 45) / 12));
      cards.forEach(function (card) {
        var rect = card.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > window.innerHeight) return;
        apply(card, -y, x, 50 + x * 8, 50 + y * 8);
      });
    }, { passive: true });
  }

  function initPlantProgress() {
    var chipBar = document.getElementById('plantCatChips');
    var sections = document.querySelectorAll('.plant-category-section');
    if (!chipBar || !sections.length || document.getElementById('plantCategoryProgress')) return;
    var progress = document.createElement('div');
    progress.id = 'plantCategoryProgress';
    progress.className = 'plant-category-progress';
    progress.innerHTML = '<span class="plant-category-progress__label">Category 1 of ' + sections.length + '</span><span class="plant-category-progress__track"><i></i></span>';
    chipBar.parentNode.insertBefore(progress, chipBar.nextSibling);
    var label = progress.querySelector('.plant-category-progress__label');
    var bar = progress.querySelector('i');
    if (!('IntersectionObserver' in window)) return;
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var index = Array.prototype.indexOf.call(sections, entry.target);
        label.textContent = 'Category ' + (index + 1) + ' of ' + sections.length;
        bar.style.width = (((index + 1) / sections.length) * 100).toFixed(2) + '%';
      });
    }, { rootMargin: '-30% 0px -55% 0px', threshold: 0 });
    Array.prototype.forEach.call(sections, function (section) { observer.observe(section); });
  }

  function init() {
    initTilt();
    initOrientation();
    initPlantProgress();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
