/* CGM Premium Experience — route-aware enhancement layer.
   It only adds presentation and interaction around existing content; it does
   not replace articles, calculator rules, forms, uploads or result logic. */
(function () {
  'use strict';

  var pathname = window.location.pathname;
  var routes = [
    '/about/',
    '/tips/',
    '/calculators/',
    '/guides/',
    '/garden-passport/',
    '/plants/',
    '/services/',
    '/booking/'
  ];
  var isPremiumRoute = routes.some(function (route) { return pathname.indexOf(route) !== -1; });
  if (!isPremiumRoute) return;

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var routeKey = pathname.indexOf('/calculators/') !== -1 ? 'calculator' :
    pathname.indexOf('/services/') !== -1 ? 'service' :
    pathname.indexOf('/booking/') !== -1 ? 'quote' :
    pathname.indexOf('/plants/') !== -1 ? 'plant' :
    pathname.indexOf('/guides/') !== -1 ? 'guide' :
    pathname.indexOf('/tips/') !== -1 ? 'knowledge' :
    pathname.indexOf('/garden-passport/') !== -1 ? 'passport' : 'about';

  var modeLabels = {
    calculator: 'Interactive garden diagnostic',
    service: 'Service studio',
    quote: 'Project enquiry studio',
    plant: 'Chiltern plant library',
    guide: 'Practical garden guide',
    knowledge: 'Garden knowledge',
    passport: 'Garden passport',
    about: 'The CGM method'
  };

  document.documentElement.classList.add('cgm-premium-experience');
  document.documentElement.dataset.cgmExperience = routeKey;

  function ready(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn, { once: true });
    } else {
      fn();
    }
  }

  function addHeroBadge() {
    var hero = document.querySelector('.page-header, .quote-hero, .svc-hero, .plant-hero');
    if (!hero || hero.querySelector('.cgm-experience-badge')) return;
    var badge = document.createElement('p');
    badge.className = 'cgm-experience-badge';
    badge.innerHTML = '<span aria-hidden="true">◆</span> ' + modeLabels[routeKey];
    hero.appendChild(badge);
  }

  function setupReveals() {
    var selectors = [
      'main > .section',
      'main > section',
      '.card',
      '[class*="-card"]',
      '.calc-form',
      '.calc-result',
      '.callout',
      '.svc-selector',
      '.article-body > h2',
      '.article-body > h3'
    ];
    var nodes = Array.prototype.slice.call(document.querySelectorAll(selectors.join(','))).filter(function (node) {
      return !node.closest('.site-footer, .cookie-banner, .photo-editor-modal');
    });
    nodes.forEach(function (node, index) {
      if (index < 36) node.setAttribute('data-cgm-reveal', '');
    });
    if (reduceMotion || !('IntersectionObserver' in window)) return;
    document.documentElement.classList.add('cgm-premium-ready');
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
    nodes.forEach(function (node) { observer.observe(node); });
  }

  function uniqueQuestions(scope) {
    var fields = Array.prototype.slice.call(scope.querySelectorAll('input:not([type="hidden"]), select, textarea'));
    var groups = {};
    fields.forEach(function (field, index) {
      if (field.disabled || field.type === 'file' || field.type === 'submit' || field.type === 'button') return;
      var key = field.type === 'radio' || field.type === 'checkbox' ? (field.name || field.id || ('field-' + index)) : (field.id || field.name || ('field-' + index));
      if (!groups[key]) groups[key] = [];
      groups[key].push(field);
    });
    return Object.keys(groups).map(function (key) { return groups[key]; });
  }

  function answerForGroup(group) {
    var first = group[0];
    if (first.type === 'radio') return group.some(function (field) { return field.checked; });
    if (first.type === 'checkbox') return group.some(function (field) { return field.checked; });
    return String(first.value || '').trim().length > 0;
  }

  function addProgressMeter(scope, title, idleText) {
    if (!scope || scope.querySelector('.cgm-experience-meter')) return;
    var groups = uniqueQuestions(scope);
    if (!groups.length) return;

    var meter = document.createElement('aside');
    meter.className = 'cgm-experience-meter';
    meter.setAttribute('aria-live', 'polite');
    meter.innerHTML =
      '<div class="cgm-experience-meter__ring" data-cgm-progress="0" aria-hidden="true"></div>' +
      '<div class="cgm-experience-meter__copy"><b>' + title + '</b><span>' + idleText + '</span></div>' +
      '<span class="cgm-experience-meter__status">0 of ' + groups.length + ' ready</span>';
    var target = scope.closest('.calc-layout, .article-body, .section') || scope;
    target.parentNode.insertBefore(meter, target);

    var ring = meter.querySelector('.cgm-experience-meter__ring');
    var copy = meter.querySelector('.cgm-experience-meter__copy span');
    var status = meter.querySelector('.cgm-experience-meter__status');
    function update() {
      var answered = groups.filter(answerForGroup).length;
      var pct = Math.round((answered / groups.length) * 100);
      meter.style.setProperty('--cgm-progress', String(pct));
      ring.setAttribute('data-cgm-progress', String(pct));
      status.textContent = answered + ' of ' + groups.length + ' ready';
      copy.textContent = answered === groups.length ? 'Everything is set. Run the diagnostic when you are ready.' : 'Your result sharpens as you answer each prompt.';
    }
    groups.forEach(function (group) {
      group.forEach(function (field) {
        field.addEventListener('input', update);
        field.addEventListener('change', update);
      });
    });
    update();
  }

  function setupCalculatorExperience() {
    if (routeKey !== 'calculator') return;
    var calculator = document.querySelector('.calc-form');
    if (!calculator) return;
    addProgressMeter(calculator, 'Diagnostic progress', 'Your result sharpens as you answer each prompt.');
    calculator.classList.add('cgm-calculator-ready');
  }

  function setupQuoteExperience() {
    if (routeKey !== 'quote') return;
    var quoteForm = document.getElementById('quoteForm');
    if (!quoteForm) return;
    addProgressMeter(quoteForm, 'Quote request progress', 'Add the essentials first; photos and drawing tools remain optional.');
    quoteForm.classList.add('cgm-quote-ready');
  }

  function setupServiceExperience() {
    if (routeKey !== 'service') return;
    var options = Array.prototype.slice.call(document.querySelectorAll('.svc-selector__option'));
    if (!options.length) return;
    function sync(active) {
      options.forEach(function (button) {
        button.setAttribute('aria-pressed', String(button === active));
      });
      document.documentElement.dataset.cgmServiceFocus = active.getAttribute('data-svc-option') || 'service';
    }
    options.forEach(function (button) {
      button.addEventListener('click', function () { sync(button); });
    });
    sync(options.filter(function (button) { return button.classList.contains('is-active'); })[0] || options[0]);
  }

  function setupSectionFocus() {
    var titles = Array.prototype.slice.call(document.querySelectorAll('main h2'));
    titles.forEach(function (heading) {
      if (!heading.id && heading.textContent.trim().length) {
        heading.classList.add('cgm-premium-heading');
      }
    });
  }

  ready(function () {
    addHeroBadge();
    setupReveals();
    setupSectionFocus();
    // cgm-v9 builds the optional photo editor on the same DOM-ready cycle.
    // Defer one tick so the quote meter wraps the final live form cleanly.
    window.setTimeout(function () {
      setupCalculatorExperience();
      setupQuoteExperience();
      setupServiceExperience();
    }, 0);
  });
})();
