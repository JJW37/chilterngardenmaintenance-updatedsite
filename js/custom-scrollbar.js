/* CGM mobile scrollbar: a subtle, readable progress rail in the brand palette. */
(function () {
  'use strict';
  if (!window.matchMedia || !window.matchMedia('(max-width: 768px)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  function init() {
    if (document.querySelector('.cgm-page-scrollbar')) return;
    document.documentElement.classList.add('has-curved-scrollbar');
    var rail = document.createElement('div');
    rail.className = 'cgm-page-scrollbar';
    rail.setAttribute('aria-hidden', 'true');
    rail.innerHTML = '<span class="cgm-page-scrollbar__thumb"></span>';
    document.body.appendChild(rail);
    var thumb = rail.firstElementChild;
    var dragging = false;

    function update() {
      var max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      var ratio = window.innerHeight / Math.max(window.innerHeight, document.documentElement.scrollHeight);
      thumb.style.height = Math.max(42, ratio * rail.clientHeight) + 'px';
      thumb.style.transform = 'translateY(' + ((rail.clientHeight - thumb.offsetHeight) * (window.scrollY / max)) + 'px)';
    }
    function move(clientY) {
      var rect = rail.getBoundingClientRect();
      var usable = Math.max(1, rect.height - thumb.offsetHeight);
      var progress = Math.max(0, Math.min(1, (clientY - rect.top - thumb.offsetHeight / 2) / usable));
      window.scrollTo({ top: progress * (document.documentElement.scrollHeight - window.innerHeight), behavior: 'auto' });
    }
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    rail.addEventListener('pointerdown', function (event) {
      dragging = true;
      rail.setPointerCapture(event.pointerId);
      move(event.clientY);
    });
    rail.addEventListener('pointermove', function (event) { if (dragging) move(event.clientY); });
    rail.addEventListener('pointerup', function () { dragging = false; });
    rail.addEventListener('pointercancel', function () { dragging = false; });
    update();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
