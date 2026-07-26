/* ==========================================================================
   CGM Before/After Slider — draggable comparison slider
   Supports: mouse drag, touch drag, keyboard arrows, click-to-position.
   Works on mobile (finger) and desktop (mouse). No dependencies.
   ========================================================================== */
(function () {
  'use strict';

  function ready(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else { fn(); }
  }

  function initSlider(slider) {
    if (!slider || slider.dataset.baReady === 'true') return;
    slider.dataset.baReady = 'true';

    var before = slider.querySelector('.ba-slider__img--before');
    var handle = slider.querySelector('.ba-slider__handle');
    if (!before || !handle) return;

    var pos = 50; // 0..100
    var dragging = false;

    function setPos(p) {
      pos = Math.max(0, Math.min(100, p));
      before.style.clipPath = 'inset(0 ' + (100 - pos) + '% 0 0)';
      handle.style.left = pos + '%';
      slider.setAttribute('aria-valuenow', Math.round(pos));
    }

    function posFromEvent(e) {
      var rect = slider.getBoundingClientRect();
      var clientX = e.touches ? e.touches[0].clientX : e.clientX;
      var x = clientX - rect.left;
      return (x / rect.width) * 100;
    }

    // Mouse
    slider.addEventListener('mousedown', function (e) {
      dragging = true;
      setPos(posFromEvent(e));
      e.preventDefault();
    });
    window.addEventListener('mousemove', function (e) {
      if (!dragging) return;
      setPos(posFromEvent(e));
    });
    window.addEventListener('mouseup', function () { dragging = false; });

    // Touch
    slider.addEventListener('touchstart', function (e) {
      dragging = true;
      setPos(posFromEvent(e));
    }, { passive: true });
    window.addEventListener('touchmove', function (e) {
      if (!dragging) return;
      // Prevent page scroll while dragging horizontally
      if (e.cancelable) e.preventDefault();
      setPos(posFromEvent(e));
    }, { passive: false });
    window.addEventListener('touchend', function () { dragging = false; });

    // Keyboard
    slider.addEventListener('keydown', function (e) {
      var step = 5;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
        setPos(pos - step); e.preventDefault();
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
        setPos(pos + step); e.preventDefault();
      } else if (e.key === 'Home') {
        setPos(0); e.preventDefault();
      } else if (e.key === 'End') {
        setPos(100); e.preventDefault();
      }
    });

    // Click-to-position (when not dragging, e.g. tap on slider)
    slider.addEventListener('click', function (e) {
      // ignore if it was a drag (mouseup already moved the handle)
      // simple heuristic: if the click target is the handle, do nothing
      if (e.target === handle || handle.contains(e.target)) return;
      setPos(posFromEvent(e));
    });

    // Initialize at 50%
    setPos(50);
  }

  function initAll() {
    document.querySelectorAll('.ba-slider').forEach(initSlider);
  }

  ready(initAll);

  // Re-run if content is dynamically injected
  window.CGMbaSlider = { initAll: initAll, init: initSlider };
})();
