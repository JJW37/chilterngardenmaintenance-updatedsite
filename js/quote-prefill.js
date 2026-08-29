(function () {
  'use strict';

  function init() {

  var storageKey = 'cgmAssessmentQuotePrefill';
  var form = document.getElementById('quoteForm');
  if (!form) return;

  function getValue(id) {
    var input = document.getElementById(id);
    return input ? input.value.trim() : '';
  }

  function appendDetails(text) {
    var details = document.getElementById('details');
    if (!details || !text) return;
    details.value = details.value.trim() ? details.value.trim() + '\n\n' + text : text;
  }

  function guideTitle(slug) {
    return slug.split('-').map(function (word) {
      return word ? word.charAt(0).toUpperCase() + word.slice(1) : '';
    }).join(' ');
  }

  function selectService(value) {
    if (!value) return;
    var controls = form.querySelectorAll('input[name="service"], input[name="service[]"]');
    Array.prototype.forEach.call(controls, function (control) {
      if (control.value === value && !control.checked) {
        control.checked = true;
        control.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
  }

  function showNotice(message) {
    var existing = document.getElementById('quotePrefillNotice');
    if (existing) return;
    var notice = document.createElement('p');
    notice.id = 'quotePrefillNotice';
    notice.className = 'quote-prefill-notice';
    notice.textContent = message;
    form.parentNode.insertBefore(notice, form);
  }

  var prefill = null;
  try {
    var saved = sessionStorage.getItem(storageKey);
    if (saved) {
      prefill = JSON.parse(saved);
      sessionStorage.removeItem(storageKey);
    }
  } catch (error) {
    prefill = null;
  }

  var params = new URLSearchParams(window.location.search);
  var guide = params.get('guide');
  if (!prefill && guide && /^[a-z0-9-]+$/.test(guide)) {
    prefill = {
      details: 'Guide interest: ' + guideTitle(guide) + '\nPlease tell me whether this guide is suitable for my garden.',
      source: 'guide-library'
    };
  }
  if (!prefill) return;

  if (prefill.postcode && !getValue('postcode')) {
    document.getElementById('postcode').value = prefill.postcode;
  }
  appendDetails(prefill.details || '');
  selectService(prefill.service || '');

  var source = document.createElement('input');
  source.type = 'hidden';
  source.name = 'assessment_source';
  source.value = prefill.source || 'assessment';
  form.appendChild(source);

  var disclosure = document.getElementById('quoteFormDisclosure');
  if (disclosure) disclosure.open = true;
  showNotice(prefill.source === 'guide-library'
    ? 'Your guide interest has been added to this enquiry so the CGM team can keep the subject in view.'
    : 'Your garden assessment summary has been brought across. You can edit it before sending your enquiry.');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}());
