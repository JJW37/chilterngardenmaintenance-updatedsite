/* CGM Calculator Results Modal v3.
   The modal always clones the visible calculator result itself. It does not
   calculate, summarise, or invent a second answer, so the popup and the page
   show exactly the same horticultural output. */
(function () {
  'use strict';
  var modal;
  var modalBody;
  var resultEl;
  var isOpen = false;
  var closing = false;

  function buildModal() {
    modal = document.createElement('div');
    modal.className = 'calc-result-modal';
    modal.id = 'calcResultModal';
    modal.innerHTML =
      '<div class="calc-result-modal__inner" role="dialog" aria-modal="true" aria-labelledby="calcModalTitle">' +
        '<div class="calc-result-modal__header">' +
          '<h3 class="calc-result-modal__title" id="calcModalTitle">Your tailored result</h3>' +
          '<button type="button" class="calc-result-modal__close" id="calcModalClose" aria-label="Close result">&times;</button>' +
        '</div>' +
        '<div class="calc-result-modal__body" id="calcModalBody"></div>' +
        '<div class="calc-result-modal__footer">' +
          '<a class="btn btn-primary" href="/chilterngardenmaintenance-updatedsite/booking/">Get a Quote</a>' +
          '<a class="btn btn-whatsapp" href="https://wa.me/447467657459" target="_blank" rel="noopener">WhatsApp</a>' +
          '<a class="btn btn-ghost" href="/chilterngardenmaintenance-updatedsite/guides/">Garden Guides</a>' +
        '</div>' +
      '</div>';
    document.body.appendChild(modal);
    modalBody = modal.querySelector('#calcModalBody');
    modal.addEventListener('click', function (event) {
      if (event.target === modal || event.target.closest('#calcModalClose')) {
        event.preventDefault();
        closeModal();
      }
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && isOpen) closeModal();
    });
  }

  function copyExactResult() {
    if (!resultEl || !modalBody) return false;
    var clone = resultEl.cloneNode(true);
    clone.removeAttribute('id');
    clone.hidden = false;
    clone.style.display = '';
    modalBody.innerHTML = '';
    modalBody.appendChild(clone);
    return !!clone.textContent.trim();
  }

  function openModal() {
    if (!copyExactResult() || isOpen) return;
    isOpen = true;
    modal.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    resultEl.style.display = 'none';
  }

  function closeModal() {
    if (!modal || !isOpen) return;
    closing = true;
    isOpen = false;
    modal.classList.remove('is-open');
    document.body.style.overflow = '';
    if (resultEl) resultEl.style.display = '';
    window.setTimeout(function () { closing = false; }, 350);
  }

  function init() {
    resultEl = document.querySelector('.calc-result[id$="-result"]');
    if (!resultEl) return;
    buildModal();
    var observer = new MutationObserver(function () {
      if (closing || isOpen) return;
      if (!resultEl.hidden && resultEl.textContent.trim().length > 30) openModal();
    });
    observer.observe(resultEl, { childList: true, subtree: true, attributes: true, characterData: true, attributeFilter: ['hidden', 'style'] });
    document.querySelectorAll('button, input[type="submit"], a.btn').forEach(function (button) {
      var label = (button.textContent || button.value || '').toLowerCase();
      if (!/(calculate|get estimate|assess|get my|show result)/.test(label)) return;
      button.addEventListener('click', function () {
        window.setTimeout(function () {
          if (!closing && !isOpen && !resultEl.hidden && resultEl.textContent.trim().length > 30) openModal();
        }, 250);
      });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
