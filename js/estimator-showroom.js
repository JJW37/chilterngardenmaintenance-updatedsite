(function () {
  'use strict';

  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, { once: true });
    else fn();
  }

  ready(function () {
    var root = document.querySelector('.estimator-showroom');
    if (!root) return;

    root.classList.add('estimator-showroom--enhanced');

    var chapterNames = {
      hero: { number: '01 / 05', label: 'Start here' },
      question: { number: '02 / 05', label: 'Find your question' },
      library: { number: '03 / 05', label: 'Tool library' },
      results: { number: '04 / 05', label: 'Use the result' },
      quote: { number: '05 / 05', label: 'Turn it into a plan' }
    };
    var routes = {
      clear: {
        number: '01',
        tag: 'Control & clearance',
        title: 'Garden Clearance Level',
        href: '/chilterngardenmaintenance-updatedsite/calculators/clearance.html',
        cta: 'Open Garden Clearance Level',
        copy: 'For a garden that has become overgrown, hard to access or difficult to reset. Start here to understand the scale of the job before deciding what comes next.',
        signals: ['Size, access and waste', 'Brambles and overgrowth', 'Your intended outcome'],
        note: 'Looks at the practical conditions that turn a tidy-up into a recovery project.',
        filter: 'assess',
        spotlight: 'clear'
      },
      care: {
        number: '02',
        tag: 'Care & maintenance',
        title: 'Garden Care Assessment',
        href: '/chilterngardenmaintenance-updatedsite/calculators/maintenance.html',
        cta: 'Open Garden Care Assessment',
        copy: 'For a garden that needs a realistic, ongoing care rhythm. Start here to understand the responsibility level, planting complexity and type of support that will suit it.',
        signals: ['Area and planting complexity', 'Specialist features', 'Your preferred care level'],
        note: 'Translates the garden you have into a practical level of ongoing care.',
        filter: 'assess',
        spotlight: 'care'
      },
      revive: {
        number: '07',
        tag: 'Recovery & renewal',
        title: 'Lawn Recovery Predictor',
        href: '/chilterngardenmaintenance-updatedsite/calculators/lawn-recovery.html',
        cta: 'Open Lawn Recovery Predictor',
        copy: 'For a lawn or meadow that looks tired, patchy or mossy. Start with a broad health diagnosis, then use the renovation or wildflower tool if the result points that way.',
        signals: ['Moss, weeds and bare patches', 'Shade and drainage', 'Recovery score and action plan'],
        note: 'Uses 14 lawn-health signals to identify the next sensible intervention.',
        filter: 'restore',
        spotlight: 'lawn'
      },
      screen: {
        number: '06',
        tag: 'Privacy & planting',
        title: 'Privacy Plant Planner',
        href: '/chilterngardenmaintenance-updatedsite/calculators/privacy-planner.html',
        cta: 'Open Privacy Plant Planner',
        copy: 'For a boundary that needs screening, softness or a clearer structure. Start here to compare the right plants for the conditions rather than choosing by appearance alone.',
        signals: ['18 screening plants compared', 'Light, soil and desired height', 'A ranked planting recommendation'],
        note: 'Builds a grounded planting route around the conditions of the site.',
        filter: 'plan',
        spotlight: 'screen'
      }
    };
    var filterLabels = {
      all: 'All seven diagnostics',
      assess: 'Assessment & clearance tools',
      restore: 'Lawn, meadow & recovery tools',
      plan: 'Planting & privacy planning tools'
    };

    var cards = Array.prototype.slice.call(root.querySelectorAll('[data-estimator-card]'));
    var filterButtons = Array.prototype.slice.call(root.querySelectorAll('[data-estimator-filter]'));
    var filterLabel = root.querySelector('[data-estimator-filter-label]');
    var routeButtons = Array.prototype.slice.call(root.querySelectorAll('[data-estimator-route]'));
    var routeNumber = root.querySelector('[data-estimator-route-number]');
    var routeTag = root.querySelector('[data-estimator-route-tag]');
    var routeTitle = root.querySelector('[data-estimator-route-title]');
    var routeCopy = root.querySelector('[data-estimator-route-copy]');
    var routeSignals = root.querySelector('[data-estimator-route-signals]');
    var routeLink = root.querySelector('[data-estimator-route-link]');
    var routeNote = root.querySelector('[data-estimator-route-note]');

    function setTabState(buttons, activeButton) {
      buttons.forEach(function (button) {
        var active = button === activeButton;
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-selected', active ? 'true' : 'false');
      });
    }

    function applyFilter(filter, spotlight) {
      var selected = filter || 'all';
      filterButtons.forEach(function (button) {
        var active = button.getAttribute('data-estimator-filter') === selected;
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-selected', active ? 'true' : 'false');
      });
      if (filterLabel) filterLabel.textContent = filterLabels[selected] || filterLabels.all;
      cards.forEach(function (card) {
        var tags = (card.getAttribute('data-estimator-tags') || '').split(/\s+/);
        var utility = tags.indexOf('utility') !== -1;
        var match = selected === 'all' || tags.indexOf(selected) !== -1;
        card.classList.toggle('is-filtered-out', !match && !utility);
        card.classList.toggle('is-spotlight', Boolean(spotlight && tags.indexOf(spotlight) !== -1));
      });
    }

    function setRoute(name) {
      var route = routes[name];
      if (!route) return;
      root.setAttribute('data-estimator-active-route', name);
      var activeButton = routeButtons.filter(function (button) { return button.getAttribute('data-estimator-route') === name; })[0];
      if (activeButton) setTabState(routeButtons, activeButton);
      if (routeNumber) routeNumber.textContent = route.number;
      if (routeTag) routeTag.textContent = route.tag;
      if (routeTitle) routeTitle.textContent = route.title;
      if (routeCopy) routeCopy.textContent = route.copy;
      if (routeLink) {
        routeLink.href = route.href;
        routeLink.childNodes[0].nodeValue = route.cta + ' ';
      }
      if (routeNote) routeNote.textContent = route.note;
      if (routeSignals) {
        routeSignals.innerHTML = '';
        route.signals.forEach(function (signal) {
          var item = document.createElement('li');
          item.textContent = signal;
          routeSignals.appendChild(item);
        });
      }
      applyFilter(route.filter, route.spotlight);
      try { window.sessionStorage.setItem('cgm-estimator-route', name); } catch (error) { /* storage is optional */ }
    }

    routeButtons.forEach(function (button, index) {
      button.addEventListener('click', function () { setRoute(button.getAttribute('data-estimator-route')); });
      button.addEventListener('keydown', function (event) {
        var direction = event.key === 'ArrowDown' || event.key === 'ArrowRight' ? 1 : event.key === 'ArrowUp' || event.key === 'ArrowLeft' ? -1 : 0;
        if (!direction) return;
        event.preventDefault();
        var next = (index + direction + routeButtons.length) % routeButtons.length;
        routeButtons[next].focus();
        setRoute(routeButtons[next].getAttribute('data-estimator-route'));
      });
    });
    filterButtons.forEach(function (button, index) {
      button.addEventListener('click', function () { applyFilter(button.getAttribute('data-estimator-filter')); });
      button.addEventListener('keydown', function (event) {
        var direction = event.key === 'ArrowDown' || event.key === 'ArrowRight' ? 1 : event.key === 'ArrowUp' || event.key === 'ArrowLeft' ? -1 : 0;
        if (!direction) return;
        event.preventDefault();
        var next = (index + direction + filterButtons.length) % filterButtons.length;
        filterButtons[next].focus();
        applyFilter(filterButtons[next].getAttribute('data-estimator-filter'));
      });
    });

    var savedRoute = null;
    try { savedRoute = window.sessionStorage.getItem('cgm-estimator-route'); } catch (error) { savedRoute = null; }
    setRoute(routes[savedRoute] ? savedRoute : 'clear');

    function scrollToSection(id) {
      var target = document.getElementById(id);
      if (!target) return;
      var offset = (document.querySelector('.header') || {}).offsetHeight || 0;
      window.scrollTo({ top: window.scrollY + target.getBoundingClientRect().top - offset - 6, behavior: 'smooth' });
      target.setAttribute('tabindex', '-1');
      window.setTimeout(function () { target.focus({ preventScroll: true }); }, 520);
    }
    root.querySelectorAll('[data-estimator-action]').forEach(function (button) {
      button.addEventListener('click', function () {
        var section = { question: 'estimator-question', library: 'tools', quote: 'estimator-quote' }[button.getAttribute('data-estimator-action')];
        if (section) scrollToSection(section);
      });
    });
    root.querySelectorAll('.estimator-chapter-rail a, .estimator-hero__scroll').forEach(function (link) {
      link.addEventListener('click', function (event) {
        var id = (link.getAttribute('href') || '').replace('#', '');
        if (!id || !document.getElementById(id)) return;
        event.preventDefault();
        scrollToSection(id);
      });
    });

    var chapters = Array.prototype.slice.call(root.querySelectorAll('[data-estimator-chapter]'));
    var chapterLinks = Array.prototype.slice.call(root.querySelectorAll('[data-estimator-chapter-link]'));
    var progressLabel = root.querySelector('[data-estimator-progress-label]');
    var progressTitle = root.querySelector('[data-estimator-progress-title]');
    var progressBar = root.querySelector('[data-estimator-progress-bar]');
    function activateChapter(key) {
      var data = chapterNames[key] || chapterNames.hero;
      if (progressLabel) progressLabel.textContent = data.number;
      if (progressTitle) progressTitle.textContent = data.label;
      if (progressBar) progressBar.style.width = (parseInt(data.number, 10) * 20) + '%';
      chapterLinks.forEach(function (link) {
        var active = link.getAttribute('data-estimator-chapter-link') === key;
        link.classList.toggle('is-active', active);
        if (active) link.setAttribute('aria-current', 'step');
        else link.removeAttribute('aria-current');
      });
    }
    if ('IntersectionObserver' in window) {
      var chapterObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) activateChapter(entry.target.getAttribute('data-estimator-chapter'));
        });
      }, { rootMargin: '-32% 0px -54% 0px', threshold: 0 });
      chapters.forEach(function (chapter) { chapterObserver.observe(chapter); });

      var revealObserver = new IntersectionObserver(function (entries, observer) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        });
      }, { rootMargin: '0px 0px -9% 0px', threshold: 0.08 });
      root.querySelectorAll('[data-estimator-reveal]').forEach(function (element) { revealObserver.observe(element); });
    } else {
      root.querySelectorAll('[data-estimator-reveal]').forEach(function (element) { element.classList.add('is-visible'); });
    }
    activateChapter('hero');

    var hero = root.querySelector('.estimator-hero');
    var heroImage = hero && hero.querySelector('.hero-bg img');
    var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var finePointer = window.matchMedia && window.matchMedia('(pointer: fine)').matches;
    if (hero && heroImage && finePointer && !reducedMotion) {
      hero.addEventListener('pointermove', function (event) {
        var rect = hero.getBoundingClientRect();
        var x = ((event.clientX - rect.left) / rect.width - .5) * 1.4;
        var y = ((event.clientY - rect.top) / rect.height - .5) * 1.2;
        heroImage.style.transform = 'scale(1.075) translate(' + x.toFixed(2) + '%, ' + y.toFixed(2) + '%)';
      });
      hero.addEventListener('pointerleave', function () { heroImage.style.transform = ''; });
    }
  });
}());
