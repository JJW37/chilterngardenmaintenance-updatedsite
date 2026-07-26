/* CGM mobile quick-link dock.
   Native scroll-position effects, with no third-party import required. */
(function () {
  'use strict';

  function initDock(dock) {
    if (!dock || dock.dataset.dockReady === 'true') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var items = Array.prototype.slice.call(dock.querySelectorAll('.swipe-row__item'));
    if (!items.length) return;
    dock.dataset.dockReady = 'true';
    dock.classList.add('cgm-scroll-dock');
    var frame = null;

    function update() {
      frame = null;
      var box = dock.getBoundingClientRect();
      var centre = box.left + box.width / 2;
      items.forEach(function (item) {
        var rect = item.getBoundingClientRect();
        var itemCentre = rect.left + rect.width / 2;
        var distance = Math.min(1, Math.abs(itemCentre - centre) / Math.max(box.width * 0.52, 1));
        var focus = 1 - distance;
        var scale = 0.82 + (focus * 0.24);
        var lift = Math.round(focus * -7);
        item.style.setProperty('--dock-scale', scale.toFixed(3));
        item.style.setProperty('--dock-lift', lift + 'px');
        item.style.setProperty('--dock-blur', (distance * 1.1).toFixed(2) + 'px');
        item.style.setProperty('--dock-opacity', (0.62 + focus * 0.38).toFixed(2));
        item.classList.toggle('is-dock-focus', focus > 0.78);
      });
    }

    function requestUpdate() {
      if (frame !== null) return;
      frame = window.requestAnimationFrame(update);
    }

    dock.addEventListener('scroll', requestUpdate, { passive: true });
    dock.addEventListener('pointerdown', requestUpdate, { passive: true });
    dock.addEventListener('focusin', function (event) {
      var item = event.target.closest('.swipe-row__item');
      if (!item) return;
      var offset = item.offsetLeft - (dock.clientWidth - item.offsetWidth) / 2;
      dock.scrollTo({ left: Math.max(0, offset), behavior: 'smooth' });
    });
    window.addEventListener('resize', requestUpdate, { passive: true });
    requestUpdate();
  }

  function init() {
    document.querySelectorAll('.swipe-row').forEach(initDock);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
