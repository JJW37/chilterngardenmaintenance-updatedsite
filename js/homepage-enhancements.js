/* CGM Homepage enhancements - ticker animation + problem diagnosis tool.
   Loaded only on the homepage. */
(function() {
  'use strict';

  // ---- Animated ticker stats ----
  // Animates proof-strip__value numbers from 0 to data-ticker-target
  // when the strip enters the viewport.
  function animateTicker(el) {
    var target = parseInt(el.getAttribute('data-ticker-target'), 10) || 0;
    var prefix = el.getAttribute('data-ticker-prefix') || '';
    var suffix = el.getAttribute('data-ticker-suffix') || '';
    var duration = 1400; // ms
    var startTime = null;
    var suffixSpan = el.querySelector('.proof-strip__value-suffix');
    var suffixHTML = suffixSpan ? suffixSpan.outerHTML : '';

    function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      var progress = Math.min((timestamp - startTime) / duration, 1);
      var eased = easeOutCubic(progress);
      var current = Math.round(target * eased);
      el.innerHTML = prefix + current + suffixHTML;
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.classList.remove('is-ticking');
      }
    }
    el.classList.add('is-ticking');
    requestAnimationFrame(step);
  }

  var tickers = document.querySelectorAll('.proof-strip--ticker .proof-strip__value[data-ticker-target]');
  if (tickers.length && 'IntersectionObserver' in window) {
    var tickerObserver = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          animateTicker(entry.target);
          tickerObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    tickers.forEach(function(t) { tickerObserver.observe(t); });
  } else {
    // Fallback: animate immediately
    tickers.forEach(function(t) { animateTicker(t); });
  }

  // ---- Problem diagnosis tool ----
  var DIAGNOSES = {
    unmanageable: {
      service: 'Garden Clearance - full overgrowth recovery, bramble and ivy removal, waste taken to licensed tip.',
      inspect: 'Access points, waste volume, presence of brambles/ivy/self-seeded trees, soil compaction, hidden structures, drainage.',
      project: 'Half-acre bramble clearance in Totteridge - three days, waste removed, garden left ready for replanting. <a href="/chilterngardenmaintenance-updatedsite/portfolio/clearance.html" style="color:var(--forest);text-decoration:underline;">See clearance portfolio →</a>',
      cost: '<a class="diagnosis-resource" href="/chilterngardenmaintenance-updatedsite/tips/restore-overgrown-garden.html"><img src="/chilterngardenmaintenance-updatedsite/images/project/process-clearance.webp" alt="Garden clearance project"><span><strong>Read the garden recovery guide</strong><small>See what to inspect before clearing an overgrown space.</small><em>Search more →</em></span></a>',
      next: 'Has the garden been left for one season, or several? That determines whether we recover or fully clear.'
    },
    lawn: {
      service: 'Lawn Recovery - scarify, aerate, overseed, top dress. Diagnosis of moss, weeds, bare patches, drainage.',
      inspect: 'Soil compaction, thatch depth, moss percentage, weed types, drainage, shade patterns, mowing height history.',
      project: 'Autumn lawn renovation in Oxford - scarified, aerated, overseeded with shade-tolerant fescue. Eight weeks to full coverage. <a href="/chilterngardenmaintenance-updatedsite/portfolio/lawn-recovery.html" style="color:var(--forest);text-decoration:underline;">See lawn recovery →</a>',
      cost: '<a class="diagnosis-resource" href="/chilterngardenmaintenance-updatedsite/calculators/lawn-recovery.html"><img src="/chilterngardenmaintenance-updatedsite/images/project/portfolio-lawn-recovery.webp" alt="Lawn recovery tool"><span><strong>Use the lawn recovery tool</strong><small>Work out whether moss, compaction or bare patches are the main issue.</small><em>Search more →</em></span></a>',
      next: 'Is the lawn mostly moss, mostly weeds, or mostly bare patches? Each points to a different cause.'
    },
    privacy: {
      service: 'Privacy Plant Planner + Soft Landscaping - structured screening using the right plants for your soil and exposure.',
      inspect: 'Line of sight to be screened, soil type, light, exposure, root competition, boundary ownership, desired screening height.',
      project: 'Mixed evergreen hedge in Beaconsfield - Thuja, Cherry Laurel and Photinia layered for year-round screening. <a href="/chilterngardenmaintenance-updatedsite/calculators/privacy-planner.html" style="color:var(--forest);text-decoration:underline;">Try the Privacy Planner →</a>',
      cost: '<a class="diagnosis-resource" href="/chilterngardenmaintenance-updatedsite/calculators/privacy-planner.html"><img src="/chilterngardenmaintenance-updatedsite/images/project/service-hedge-cutting.webp" alt="Privacy planting planner"><span><strong>Try the privacy plant planner</strong><small>Compare screening styles and choose plants for the conditions you have.</small><em>Search more →</em></span></a>',
      next: 'Do you need year-round screening, or is summer screening enough? That changes the plant choice completely.'
    },
    redesign: {
      service: 'Garden Design - planting plans, layout, structure. Designed for your conditions, not against them.',
      inspect: 'Existing plants worth keeping, soil, light, drainage, how you use the garden, what you want from it, budget.',
      project: 'Country garden redesign near Thame - restructured borders, new lawn, mixed herbaceous planting. Six weeks end-to-end. <a href="/chilterngardenmaintenance-updatedsite/portfolio/" style="color:var(--forest);text-decoration:underline;">See portfolio →</a>',
      cost: '<a class="diagnosis-resource" href="/chilterngardenmaintenance-updatedsite/tips/plan-garden-renovation-in-stages.html"><img src="/chilterngardenmaintenance-updatedsite/images/project/full-width-1-garden-makeover.webp" alt="Garden renovation guide"><span><strong>Read the staged renovation guide</strong><small>Set out the decisions that should come before planting or building.</small><em>Search more →</em></span></a>',
      next: 'Is the garden’s structure wrong, or just the planting? Structure is the harder fix.'
    },
    structure: {
      service: 'Fencing - closeboard, featheredge, post and rail. Repair or full replacement.',
      inspect: 'Post condition, panel damage, concrete or timber posts, gate operation, boundary ownership, ground levels.',
      project: 'Closeboard fence replacement in Aylesbury - 22m run, concrete posts, featheredge boards. Two-day install. <a href="/chilterngardenmaintenance-updatedsite/portfolio/fencing.html" style="color:var(--forest);text-decoration:underline;">See fencing →</a>',
      cost: '<a class="diagnosis-resource" href="/chilterngardenmaintenance-updatedsite/tips/design-garden-for-privacy-without-closed-in.html"><img src="/chilterngardenmaintenance-updatedsite/images/project/service-fencing.webp" alt="Garden boundary guide"><span><strong>Read the boundary planning guide</strong><small>Understand the practical choices before repairing or replacing a fence.</small><em>Search more →</em></span></a>',
      next: 'Are the posts sound, or do they need replacing too? Posts are most of the labour.'
    },
    care: {
      service: 'Regular Garden Maintenance - fortnightly or monthly visits following the CGM Method.',
      inspect: 'Garden size, planting complexity, lawn area, what you want CGM to take responsibility for, access, waste.',
      project: 'Managed garden in Henley - fortnightly visits, full CGM Method. Year 2: visibly better than year 1. <a href="/chilterngardenmaintenance-updatedsite/about/maintenance.html" style="color:var(--forest);text-decoration:underline;">Read the CGM Method →</a>',
      cost: '<a class="diagnosis-resource" href="/chilterngardenmaintenance-updatedsite/calculators/maintenance.html"><img src="/chilterngardenmaintenance-updatedsite/images/project/service-maintenance.webp" alt="Garden care assessment"><span><strong>Use the garden care assessment</strong><small>Build a clearer picture of the visit rhythm your garden needs.</small><em>Search more →</em></span></a>',
      next: 'How often do you realistically want us there - weekly, fortnightly or monthly? That shapes the plan.'
    },
    unsure: {
      service: 'Garden Analysis Report - structured diagnosis of what is actually wrong, before you spend money.',
      inspect: 'Everything: soil, light, drainage, plants, lawn, structures, pests, diseases. A full written report with photos.',
      project: 'Garden analysis in Marlow - identified drainage as the root cause of three years of lawn failure. Fixed the drainage, lawn recovered. <a href="/chilterngardenmaintenance-updatedsite/services/garden-analysis-report.html" style="color:var(--forest);text-decoration:underline;">Request a report →</a>',
      cost: '<a class="diagnosis-resource" href="/chilterngardenmaintenance-updatedsite/services/garden-analysis-report.html"><img src="/chilterngardenmaintenance-updatedsite/images/project/service-garden-analysis.webp" alt="Garden analysis report"><span><strong>See the garden analysis service</strong><small>A structured inspection helps separate causes from symptoms.</small><em>Search more →</em></span></a>',
      next: 'When did the garden last look right? That tells us whether it has declined slowly or suddenly.'
    }
  };

  var options = document.querySelectorAll('.problem-diagnosis__option');
  var resultPanel = document.getElementById('diagnosisResult');
  if (!options.length || !resultPanel) return;

  options.forEach(function(btn) {
    btn.addEventListener('click', function() {
      var key = btn.getAttribute('data-diagnosis');
      var data = DIAGNOSES[key];
      if (!data) return;

      // Mark active
      options.forEach(function(o) { o.classList.remove('is-active'); });
      btn.classList.add('is-active');

      // Populate result
      resultPanel.hidden = false;
      resultPanel.querySelector('[data-result="service"]').innerHTML = data.service;
      resultPanel.querySelector('[data-result="inspect"]').innerHTML = data.inspect;
      resultPanel.querySelector('[data-result="project"]').innerHTML = data.project;
      resultPanel.querySelector('[data-result="cost"]').innerHTML = data.cost;
      resultPanel.querySelector('[data-result="next"]').innerHTML = data.next;
      if (window.matchMedia('(max-width: 768px)').matches) {
        setTimeout(function() { resultPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, 80);
      }

      // Track analytics
      if (typeof gtag === 'function') {
        gtag('event', 'problem_diagnosis_select', {
          diagnosis_key: key,
          page_path: window.location.pathname
        });
      }
    });
  });
})();
