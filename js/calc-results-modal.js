/* CGM Calculator Results Modal v2 - shows calculator results in a popup
   with X close button and footer CTAs (Get Quote + PDF guides).
   Works on all 7 calculator pages.
   Fix: X close button wasn't working due to MutationObserver re-opening. */
(function() {
  'use strict';
  
  var modal = null;
  var modalBody = null;
  var resultEl = null;
  var isModalOpen = false;
  var isClosing = false;
  
  function init() {
    // Find the result container
    resultEl = document.querySelector('[id*="result"]:not([hidden])') ||
               document.querySelector('.calc-result') ||
               document.querySelector('#result') ||
               document.querySelector('[class*="result-display"]');
    
    if (!resultEl) return;
    
    // Create modal
    modal = document.createElement('div');
    modal.className = 'calc-result-modal';
    modal.id = 'calcResultModal';
    
    modal.innerHTML =
      '<div class="calc-result-modal__inner">' +
        '<div class="calc-result-modal__header">' +
          '<h3 class="calc-result-modal__title">Your estimate result</h3>' +
          '<button type="button" class="calc-result-modal__close" id="calcModalClose" aria-label="Close">&times;</button>' +
        '</div>' +
        '<div class="calc-result-modal__body" id="calcModalBody"></div>' +
        '<div class="calc-result-modal__footer">' +
          '<a class="btn btn-primary" href="/chilterngardenmaintenance-updatedsite/booking/">Get a Quote</a>' +
          '<a class="btn btn-whatsapp" href="https://wa.me/447467657459" target="_blank" rel="noopener">WhatsApp</a>' +
          '<a class="btn btn-ghost" href="/chilterngardenmaintenance-updatedsite/guides/" style="border:2px solid var(--gold);color:var(--gold-deep);">PDF guides</a>' +
        '</div>' +
      '</div>';
    
    document.body.appendChild(modal);
    
    modalBody = document.getElementById('calcModalBody');
    
    // Close handlers - use event delegation on the modal itself
    modal.addEventListener('click', function(e) {
      // Close if clicking the X button or the backdrop
      if (e.target.id === 'calcModalClose' || e.target.classList.contains('calc-result-modal__close') || e.target === modal) {
        e.preventDefault();
        e.stopPropagation();
        closeModal();
      }
    });
    
    // Also add direct listener to close button
    var closeBtn = document.getElementById('calcModalClose');
    if (closeBtn) {
      closeBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        closeModal();
      });
    }
    
    // ESC key to close
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && isModalOpen) {
        closeModal();
      }
    });
    
    // Intercept result displays with MutationObserver
    var observer = new MutationObserver(function(mutations) {
      if (isClosing || isModalOpen) return; // Don't open while closing or already open
      
      mutations.forEach(function(mutation) {
        if (mutation.type === 'childList' || mutation.type === 'attributes' || mutation.type === 'characterData') {
          var resultContent = resultEl.innerHTML;
          if (resultContent && resultContent.length > 50 && resultEl.style.display !== 'none' && !resultEl.hidden) {
            // Copy result to modal and open
            modalBody.innerHTML = resultContent;
            openModal();
          }
        }
      });
    });
    
    observer.observe(resultEl, { childList: true, attributes: true, subtree: true, characterData: true });
    
    // Also intercept Calculate/Get Estimate buttons
    var calcButtons = document.querySelectorAll('button[type="button"], button[type="submit"], a.btn');
    calcButtons.forEach(function(btn) {
      var text = btn.textContent.toLowerCase();
      if (text.indexOf('calculate') !== -1 || text.indexOf('get estimate') !== -1 || text.indexOf('assess') !== -1 || text.indexOf('get my') !== -1) {
        btn.addEventListener('click', function() {
          // Wait for result to appear, then show modal
          setTimeout(function() {
            if (isClosing || isModalOpen) return;
            var currentResult = resultEl.innerHTML;
            if (currentResult && currentResult.length > 50 && resultEl.style.display !== 'none' && !resultEl.hidden) {
              modalBody.innerHTML = currentResult;
              openModal();
            }
          }, 1500);
        });
      }
    });
  }
  
  function openModal() {
    if (!modal) return;
    isModalOpen = true;
    modal.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    // Hide the original result display
    if (resultEl) resultEl.style.display = 'none';
  }
  
  function closeModal() {
    if (!modal) return;
    isClosing = true;
    isModalOpen = false;
    modal.classList.remove('is-open');
    document.body.style.overflow = '';
    // Restore the original result display
    if (resultEl) resultEl.style.display = '';
    
    // Reset closing flag after a short delay to prevent observer re-opening
    setTimeout(function() {
      isClosing = false;
    }, 500);
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
