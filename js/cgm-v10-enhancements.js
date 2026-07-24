/* ==========================================================================
   CGM v10 Consolidated Enhancements
   Addresses: 1 (calendar n/a - CSS only), 2 (section scrollers - CSS only),
   3 (article scroll arrows), 4 (nav fix - HTML), 5 (nav fix - HTML),
   7 (postcode n/a - CSS only), 8 (photo editor), 9 (footer n/a - CSS only),
   10 (swipe-row n/a - CSS only), plus mobile menu drag, compare modal fix.
   ========================================================================== */
(function () {
  'use strict';

  function ready(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else { fn(); }
  }

  /* ----- ISSUE 3: Article sideways scroll arrows on each section -----
     Each section that has a horizontal .editorial-list scroller gets
     left/right arrows that scroll the articles sideways within that section.
     NOT category-skip arrows. ----- */
  function wireArticleScrollArrows() {
    // Find all sections that contain an .editorial-list with horizontal scroll
    var sections = document.querySelectorAll(
      '.tip-featured-section, .tip-newest-section, .tip-popular-section, .tip-category-section'
    );
    if (!sections.length) return;
    if (document.querySelector('.editorial-list-scroll-wrap')) return; // already wired

    sections.forEach(function (section) {
      var list = section.querySelector('.editorial-list');
      if (!list) return;

      // Wrap the list in a positioned container for the arrows
      var wrap = document.createElement('div');
      wrap.className = 'editorial-list-scroll-wrap';
      list.parentNode.insertBefore(wrap, list);
      wrap.appendChild(list);

      // Create arrows
      var prevBtn = document.createElement('button');
      prevBtn.className = 'editorial-list-scroll-wrap__arrow editorial-list-scroll-wrap__arrow--prev';
      prevBtn.type = 'button';
      prevBtn.setAttribute('aria-label', 'Scroll articles left');
      prevBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>';

      var nextBtn = document.createElement('button');
      nextBtn.className = 'editorial-list-scroll-wrap__arrow editorial-list-scroll-wrap__arrow--next';
      nextBtn.type = 'button';
      nextBtn.setAttribute('aria-label', 'Scroll articles right');
      nextBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>';

      wrap.appendChild(prevBtn);
      wrap.appendChild(nextBtn);

      function updateArrows() {
        var maxScroll = list.scrollWidth - list.clientWidth;
        prevBtn.disabled = list.scrollLeft <= 0;
        nextBtn.disabled = list.scrollLeft >= maxScroll - 1;
      }

      prevBtn.addEventListener('click', function () {
        list.scrollBy({ left: -list.clientWidth * 0.8, behavior: 'smooth' });
      });
      nextBtn.addEventListener('click', function () {
        list.scrollBy({ left: list.clientWidth * 0.8, behavior: 'smooth' });
      });

      list.addEventListener('scroll', updateArrows, { passive: true });
      window.addEventListener('resize', updateArrows, { passive: true });
      updateArrows();
    });

    // Remove tilt from tip cards to fix hover scroll-jam
    document.querySelectorAll('.tip-card.editorial-row').forEach(function (card) {
      card.classList.remove('cgm-tilt');
      card.removeAttribute('data-tilt');
      card.dataset.tiltReady = 'true';
      card.style.willChange = 'auto';
    });
  }

  /* ----- ISSUE 8: Photo editor improvements -----
     1. Rename "Label" to "Add label", "Erase" to "Erase" (clearer)
     2. Add a "Done" button in the header
     3. Fix mobile image stretching
     This is handled by the v9 photo editor JS, but we patch it here. ----- */
  function patchPhotoEditor() {
    // Wait for the editor modal to be created by v9 JS, then patch it
    var checkInterval = setInterval(function () {
      var modal = document.querySelector('.photo-editor-modal');
      if (!modal) return;

      // Add Done button to header
      var header = modal.querySelector('.photo-editor-modal__header');
      if (header && !header.querySelector('.photo-editor-modal__done')) {
        var doneBtn = document.createElement('button');
        doneBtn.type = 'button';
        doneBtn.className = 'photo-editor-modal__done';
        doneBtn.textContent = 'Done';
        doneBtn.addEventListener('click', function () {
          var closeBtn = modal.querySelector('.photo-editor-modal__close');
          if (closeBtn) closeBtn.click();
        });
        // Insert before the close button
        var closeBtn = header.querySelector('.photo-editor-modal__close');
        if (closeBtn) {
          header.insertBefore(doneBtn, closeBtn);
        }
      }

      // Rename tool labels
      var labelTool = modal.querySelector('[data-tool="label"]');
      if (labelTool) {
        labelTool.setAttribute('data-label', 'Add Label');
        var labelText = labelTool.querySelector('.photo-editor-modal__tool-label');
        if (labelText) labelText.textContent = 'Add Label';
      }
      var eraseTool = modal.querySelector('[data-tool="erase"]');
      if (eraseTool) {
        eraseTool.setAttribute('data-label', 'Erase');
        var eraseText = eraseTool.querySelector('.photo-editor-modal__tool-label');
        if (eraseText) eraseText.textContent = 'Erase';
      }
      var penTool = modal.querySelector('[data-tool="pen"]');
      if (penTool) {
        penTool.setAttribute('data-label', 'Pen');
      }
      var clearTool = modal.querySelector('[data-action="clear"]');
      if (clearTool) {
        clearTool.setAttribute('data-label', 'Clear');
      }

      clearInterval(checkInterval);
    }, 500);

    // Stop checking after 10 seconds
    setTimeout(function () { clearInterval(checkInterval); }, 10000);
  }

  /* ----- Mobile menu: finger-drag scrolling ----- */
  function wireMenuTouchDrag() {
    var mobileMenu = document.getElementById('mobileMenu');
    if (!mobileMenu || mobileMenu.dataset.dragWired === 'true') return;
    mobileMenu.dataset.dragWired = 'true';

    var startY = 0;
    var startScroll = 0;
    var dragging = false;

    mobileMenu.addEventListener('touchstart', function (e) {
      if (e.touches.length !== 1) return;
      var target = e.target;
      if (target.closest('a, button, input, select, textarea, summary')) return;
      startY = e.touches[0].clientY;
      startScroll = mobileMenu.scrollTop;
      dragging = true;
    }, { passive: true });

    mobileMenu.addEventListener('touchmove', function (e) {
      if (!dragging) return;
      var deltaY = e.touches[0].clientY - startY;
      mobileMenu.scrollTop = startScroll - deltaY;
      if (e.cancelable) e.preventDefault();
    }, { passive: false });

    mobileMenu.addEventListener('touchend', function () {
      dragging = false;
    }, { passive: true });
  }

  /* ----- Mobile menu: reset scroll to top when opened ----- */
  function wireMenuOpenReset() {
    var menuToggle = document.getElementById('mobileMenuToggle');
    var mobileMenu = document.getElementById('mobileMenu');
    if (!menuToggle || !mobileMenu) return;

    menuToggle.addEventListener('click', function () {
      setTimeout(function () {
        if (!mobileMenu.hidden) {
          mobileMenu.scrollTop = 0;
        }
      }, 10);
    }, true);
  }

  /* ----- Compare modal: reliably toggle body class ----- */
  function wireCompareModalClass() {
    var modal = document.getElementById('compareModal');
    if (!modal) return;

    document.body.classList.toggle('compare-modal-open', !modal.hidden);

    var observer = new MutationObserver(function () {
      document.body.classList.toggle('compare-modal-open', !modal.hidden);
    });
    observer.observe(modal, { attributes: true, attributeFilter: ['hidden'] });

    // Also patch the hidden property
    try {
      var origHidden = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'hidden');
      Object.defineProperty(modal, 'hidden', {
        get: function () { return origHidden.get.call(this); },
        set: function (val) {
          origHidden.set.call(this, val);
          document.body.classList.toggle('compare-modal-open', !val);
        },
        configurable: true
      });
    } catch (e) {}
  }

  /* ----- Run all on ready ----- */
  ready(function () {
    wireArticleScrollArrows();
    patchPhotoEditor();
    wireMenuTouchDrag();
    wireMenuOpenReset();
    wireCompareModalClass();

    // Re-run article arrows on resize
    var resizeTimer = null;
    window.addEventListener('resize', function () {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        // Update arrow states
        document.querySelectorAll('.editorial-list-scroll-wrap').forEach(function (wrap) {
          var list = wrap.querySelector('.editorial-list');
          var prevBtn = wrap.querySelector('.editorial-list-scroll-wrap__arrow--prev');
          var nextBtn = wrap.querySelector('.editorial-list-scroll-wrap__arrow--next');
          if (list && prevBtn && nextBtn) {
            var maxScroll = list.scrollWidth - list.clientWidth;
            prevBtn.disabled = list.scrollLeft <= 0;
            nextBtn.disabled = list.scrollLeft >= maxScroll - 1;
          }
        });
      }, 300);
    });
  });

  window.CGMv10 = {
    wireArticleScrollArrows: wireArticleScrollArrows,
    patchPhotoEditor: patchPhotoEditor,
    wireMenuTouchDrag: wireMenuTouchDrag,
    wireCompareModalClass: wireCompareModalClass
  };
})();
