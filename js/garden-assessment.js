(function () {
  'use strict';

  var form = document.getElementById('gardenAssessmentForm');
  if (!form) return;

  var steps = Array.prototype.slice.call(form.querySelectorAll('[data-assessment-step]'));
  var progress = Array.prototype.slice.call(document.querySelectorAll('[data-assessment-progress]'));
  var error = document.getElementById('assessmentError');
  var result = document.getElementById('assessmentResults');
  var photoInput = document.getElementById('assessmentPhotos');
  var photoList = document.getElementById('assessmentPhotoList');
  var current = 1;

  var routes = {
    lawn: { title: 'Build a lawn recovery plan before spending on seed or turf', text: 'Shade, moss, traffic, soil and drainage can cause similar lawn symptoms. Start with a practical recovery route, not an instant diagnosis.', article: '/chilterngardenmaintenance-updatedsite/tips/why-lawn-patchy-how-to-fix.html', articleLabel: 'Read: Why lawns become patchy', guide: '/chilterngardenmaintenance-updatedsite/guides/lawn-care/', guideLabel: 'Explore Lawn Care Guides', service: '/chilterngardenmaintenance-updatedsite/services/lawn-recovery.html', serviceLabel: 'See Lawn Recovery', quoteService: 'Lawn recovery' },
    borders: { title: 'Match the planting plan to the conditions you have', text: 'Light, soil and the maintenance time available matter before you replace plants. Use this result as a starting point rather than a plant diagnosis.', article: '/chilterngardenmaintenance-updatedsite/tips/build-better-borders-chalky-ground.html', articleLabel: 'Read: Build better borders', guide: '/chilterngardenmaintenance-updatedsite/guides/bedding-themes/', guideLabel: 'Explore Bedding Theme Guides', service: '/chilterngardenmaintenance-updatedsite/services/soft-landscaping.html', serviceLabel: 'See Soft Landscaping', quoteService: 'Soft landscaping' },
    drainage: { title: 'Check the water problem before choosing a fix', text: 'Waterlogging, dry patches and struggling plants have more than one possible cause. A Garden Analysis Report is the safer route when the cause is not clear.', article: '/chilterngardenmaintenance-updatedsite/tips/garden-drainage-problems-signs-professional-help.html', articleLabel: 'Read: Signs of drainage problems', guide: '/chilterngardenmaintenance-updatedsite/guides/gardener-skills/', guideLabel: 'Explore practical garden guides', service: '/chilterngardenmaintenance-updatedsite/services/garden-analysis-report.html', serviceLabel: 'See the Garden Analysis Report', quoteService: 'Other' },
    overgrown: { title: 'Recover an overgrown garden in the right order', text: 'Clearance, access and garden structure should be understood before planting or finishing work. This is a useful route, not a site survey.', article: '/chilterngardenmaintenance-updatedsite/tips/restore-overgrown-garden.html', articleLabel: 'Read: Restore an overgrown garden', guide: '/chilterngardenmaintenance-updatedsite/guides/garden-design/', guideLabel: 'Explore Garden Design Guides', service: '/chilterngardenmaintenance-updatedsite/services/garden-clearance.html', serviceLabel: 'See Garden Clearance', quoteService: 'Garden clearance and seasonal recovery' },
    design: { title: 'Plan the garden changes before buying materials or plants', text: 'A useful layout depends on dimensions, access, existing features and budget as well as the garden goal. Use a guide to explore the route, then choose tailored help if needed.', article: '/chilterngardenmaintenance-updatedsite/tips/plan-garden-renovation-in-stages.html', articleLabel: 'Read: Plan a garden renovation', guide: '/chilterngardenmaintenance-updatedsite/guides/garden-design/', guideLabel: 'Explore Garden Design Guides', service: '/chilterngardenmaintenance-updatedsite/services/garden-design.html', serviceLabel: 'See Garden Design', quoteService: 'Garden Design Plan' },
    hedges: { title: 'Set a practical route for hedges, screening or boundaries', text: 'The garden goal, exposure and access all affect whether the next step is care, restoration or planting. A visit may still be needed before work is specified.', article: '/chilterngardenmaintenance-updatedsite/tips/when-to-cut-hedges-uk.html', articleLabel: 'Read: When to cut hedges', guide: '/chilterngardenmaintenance-updatedsite/guides/gardener-skills/', guideLabel: 'Explore Gardener Skills Guides', service: '/chilterngardenmaintenance-updatedsite/services/hedge-cutting.html', serviceLabel: 'See Hedge Cutting', quoteService: 'Hedge cutting' },
    other: { title: 'Start with a clearer picture of the garden before choosing work', text: 'There is not enough information in a short form for a reliable diagnosis or detailed specification. A Garden Analysis Report is the better route when the cause matters.', article: '/chilterngardenmaintenance-updatedsite/tips/', articleLabel: 'Browse practical garden advice', guide: '/chilterngardenmaintenance-updatedsite/guides/', guideLabel: 'Browse Chiltern Guides', service: '/chilterngardenmaintenance-updatedsite/services/garden-analysis-report.html', serviceLabel: 'See the Garden Analysis Report', quoteService: 'Other' }
  };

  function selectedValue(name) {
    var input = form.querySelector('[name="' + name + '"]:checked');
    return input ? input.value : '';
  }

  function selectedLabel(name) {
    var input = form.querySelector('[name="' + name + '"]:checked');
    return input && input.closest('label') ? input.closest('label').textContent.replace(/\s+/g, ' ').trim() : '';
  }

  function normalisePostcode(value) {
    var compact = String(value || '').toUpperCase().replace(/\s+/g, '');
    return /^[A-Z]{1,2}\d[A-Z\d]?\d[A-Z]{2}$/.test(compact) ? compact.slice(0, -3) + ' ' + compact.slice(-3) : compact;
  }

  function validPostcode(value) {
    return /^[A-Z]{1,2}\d[A-Z\d]?\s\d[A-Z]{2}$/.test(value);
  }

  function showError(message) {
    error.textContent = message || '';
    error.hidden = !message;
  }

  function showStep(number, moveFocus) {
    current = number;
    steps.forEach(function (step) { step.hidden = Number(step.getAttribute('data-assessment-step')) !== number; });
    progress.forEach(function (item) {
      var step = Number(item.getAttribute('data-assessment-progress'));
      item.setAttribute('aria-current', step === number ? 'step' : 'false');
      item.classList.toggle('is-complete', step < number);
    });
    showError('');
    if (moveFocus) {
      var heading = form.querySelector('[data-assessment-step="' + number + '"] h2');
      if (heading) { heading.setAttribute('tabindex', '-1'); heading.focus({ preventScroll: true }); }
      form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function validate() {
    var postcode = form.elements.postcode;
    if (current === 1) {
      postcode.value = normalisePostcode(postcode.value);
      if (!validPostcode(postcode.value)) { showError('Enter a full UK postcode, for example HP11 1AA.'); postcode.focus(); return false; }
      if (!selectedValue('gardenSize')) { showError('Choose the closest garden size.'); return false; }
    }
    if (current === 2 && (!selectedValue('exposure') || !selectedValue('soil'))) { showError('Choose the light or exposure and the soil information you know. “Not sure” is a valid answer.'); return false; }
    if (current === 3 && (!selectedValue('mainProblem') || !selectedValue('desiredResult'))) { showError('Choose the main problem and the result you want from the garden.'); return false; }
    return true;
  }

  function updatePhotoList() {
    photoList.innerHTML = '';
    Array.prototype.slice.call(photoInput.files || []).forEach(function (file) {
      var item = document.createElement('li');
      item.textContent = file.name + ' · ' + (file.size / 1024 / 1024).toFixed(1) + ' MB (not uploaded)';
      photoList.appendChild(item);
    });
    if (!photoList.children.length) {
      var empty = document.createElement('li');
      empty.textContent = 'No photos selected. You can add them later with a quote or in WhatsApp.';
      photoList.appendChild(empty);
    }
  }

  function assessmentSummary(route) {
    var lines = [
      'Garden assessment summary',
      'Postcode: ' + form.elements.postcode.value,
      'Garden size: ' + selectedLabel('gardenSize'),
      'Sun / exposure: ' + selectedLabel('exposure'),
      'Soil: ' + selectedLabel('soil'),
      'Main problem: ' + selectedLabel('mainProblem'),
      'Desired result: ' + selectedLabel('desiredResult'),
      'Recommended route: ' + route.serviceLabel,
      'Recommended guide: ' + route.guideLabel
    ];
    var notes = String(form.elements.notes.value || '').trim().slice(0, 700);
    if (notes) lines.push('Additional notes: ' + notes);
    if (photoInput.files.length) lines.push('Photos selected in assessment: ' + photoInput.files.length + ' (not uploaded; please add them to the quote form or WhatsApp).');
    return lines.join('\n');
  }

  function showResults() {
    var route = routes[selectedValue('mainProblem')] || routes.other;
    document.getElementById('assessmentResultHeading').textContent = route.title;
    document.getElementById('assessmentResultText').textContent = route.text;
    document.getElementById('assessmentArticleLink').href = route.article;
    document.getElementById('assessmentArticleLink').textContent = route.articleLabel;
    document.getElementById('assessmentGuideLink').href = route.guide;
    document.getElementById('assessmentGuideLink').textContent = route.guideLabel;
    document.getElementById('assessmentServiceLink').href = route.service;
    document.getElementById('assessmentServiceLink').textContent = route.serviceLabel;
    document.getElementById('assessmentQuoteLink').onclick = function () {
      try { sessionStorage.setItem('cgmAssessmentQuotePrefill', JSON.stringify({ postcode: form.elements.postcode.value, details: assessmentSummary(route), service: route.quoteService, source: 'assessment' })); } catch (ignore) {}
    };
    form.hidden = true;
    result.hidden = false;
    document.getElementById('assessmentResultHeading').setAttribute('tabindex', '-1');
    document.getElementById('assessmentResultHeading').focus();
    result.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  form.addEventListener('click', function (event) {
    var next = event.target.closest('[data-assessment-next]');
    var back = event.target.closest('[data-assessment-back]');
    if (next) { event.preventDefault(); if (validate()) showStep(Math.min(5, current + 1), true); }
    if (back) { event.preventDefault(); showStep(Math.max(1, current - 1), true); }
  });
  form.addEventListener('submit', function (event) { event.preventDefault(); if (current === 5 && validate()) showResults(); });
  photoInput.addEventListener('change', updatePhotoList);
  document.querySelectorAll('[data-assessment-restart]').forEach(function (button) {
    button.addEventListener('click', function () { form.reset(); updatePhotoList(); result.hidden = true; form.hidden = false; showStep(1, true); });
  });
  updatePhotoList();
  showStep(1, false);
}());
