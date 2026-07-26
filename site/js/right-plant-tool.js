/* CGM Right Plant, Right Place - interactive plant finder for /plants/ page.
   Lets visitors enter garden conditions (or postcode for auto-detect) and
   get explained recommendations from the 130-plant library.
   v2.0 (2026-07-18) - adds postcode auto-detect, improved explanations. */
(function() {
  'use strict';

  var PLANTS = [];
  var TOWN_DATA = [];  // loaded from towns.json
  var LOADED = false;

  // UK postcode district centroids for our coverage area (Oxfordshire, Bucks, Berks, Beds)
  // Used to locate the user's garden when they enter a postcode.
  var POSTCODE_DISTRICTS = {
    'OX1':[51.7519,-1.2570],'OX2':[51.7580,-1.2640],'OX3':[51.7620,-1.2300],'OX4':[51.7290,-1.2260],
    'OX11':[51.6040,-1.2410],'OX12':[51.5920,-1.4180],'OX13':[51.6820,-1.3380],'OX14':[51.6680,-1.2790],
    'OX15':[51.9220,-1.4020],'OX16':[52.0620,-1.3400],'OX17':[52.0720,-1.2780],'OX18':[51.7760,-1.5880],
    'OX20':[51.7840,-1.3100],'OX25':[51.9080,-1.1800],'OX26':[51.8960,-1.1180],'OX28':[51.7830,-1.4820],
    'OX29':[51.7800,-1.4100],'OX33':[51.7530,-1.1300],'OX39':[51.7020,-0.8320],'OX44':[51.7200,-1.1000],
    'OX49':[51.6600,-1.0500],
    'HP1':[51.6600,-0.4700],'HP2':[51.6700,-0.4500],'HP3':[51.6400,-0.4900],'HP4':[51.7400,-0.5600],
    'HP5':[51.7000,-0.6000],'HP6':[51.6400,-0.6100],'HP7':[51.6200,-0.6400],'HP8':[51.6200,-0.5800],
    'HP9':[51.6100,-0.6400],'HP10':[51.6000,-0.7000],'HP11':[51.6200,-0.7500],'HP12':[51.6300,-0.7800],
    'HP13':[51.6300,-0.7200],'HP14':[51.6500,-0.8200],'HP15':[51.6500,-0.7100],'HP16':[51.7200,-0.7000],
    'HP17':[51.7700,-0.7800],'HP18':[51.7700,-0.9000],'HP19':[51.8200,-0.8200],'HP20':[51.8200,-0.8100],
    'HP21':[51.8100,-0.8100],'HP22':[51.7800,-0.7700],'HP23':[51.7500,-0.6600],
    'MK1':[51.9900,-0.7100],'MK2':[51.9900,-0.7200],'MK3':[52.0000,-0.7200],'MK4':[52.0000,-0.7800],
    'MK5':[52.0100,-0.7800],'MK6':[52.0300,-0.7600],'MK7':[52.0200,-0.6900],'MK8':[52.0400,-0.8000],
    'MK9':[52.0400,-0.7600],'MK10':[52.0400,-0.6900],'MK11':[52.0400,-0.8300],'MK12':[52.0500,-0.8200],
    'MK13':[52.0500,-0.7900],'MK14':[52.0500,-0.7500],'MK15':[52.0500,-0.7000],'MK16':[52.0900,-0.7200],
    'MK17':[52.0000,-0.6900],'MK18':[51.9900,-0.9800],'MK19':[52.0400,-0.8800],'MK40':[52.1400,-0.4600],
    'MK41':[52.1400,-0.4300],'MK42':[52.1300,-0.4700],'MK43':[52.1300,-0.5300],'MK44':[52.1200,-0.3800],
    'MK45':[52.0300,-0.4200],'MK46':[52.1400,-0.7000],
    'LU1':[51.8800,-0.4200],'LU2':[51.8800,-0.3800],'LU3':[51.9000,-0.4300],'LU4':[51.8900,-0.4500],
    'LU5':[51.9000,-0.5000],'LU6':[51.9000,-0.6000],'LU7':[51.9100,-0.6600],
    'SL0':[51.5100,-0.4900],'SL1':[51.5200,-0.5700],'SL2':[51.5300,-0.5600],'SL3':[51.4800,-0.5600],
    'SL4':[51.4700,-0.6200],'SL5':[51.4100,-0.6600],'SL6':[51.5200,-0.7300],'SL7':[51.5700,-0.7400],
    'SL8':[51.5700,-0.7000],'SL9':[51.6100,-0.5500],
    'RG1':[51.4600,-0.9700],'RG2':[51.4300,-0.9600],'RG4':[51.4800,-0.9300],'RG5':[51.4500,-0.8900],
    'RG6':[51.4400,-0.9100],'RG7':[51.4000,-1.0000],'RG8':[51.5000,-1.1300],'RG9':[51.5200,-0.8700],
    'RG10':[51.4700,-0.8700],'RG12':[51.4100,-0.7500],'RG14':[51.4000,-1.3200],'RG18':[51.4100,-1.2300],
    'RG19':[51.4000,-1.2600],'RG20':[51.3900,-1.3200],'RG21':[51.2600,-1.0900],'RG22':[51.2500,-1.1100],
    'RG24':[51.2800,-1.0800],'RG25':[51.2200,-1.1100],'RG26':[51.3400,-1.1100],'RG27':[51.3000,-0.9000],
    'RG28':[51.2300,-1.3300],'RG29':[51.2500,-0.9400],'RG30':[51.4400,-1.0100],'RG31':[51.4600,-1.0500],
    'RG40':[51.4100,-0.8300],'RG41':[51.4100,-0.8600],'RG42':[51.4000,-0.7700],'RG45':[51.3800,-0.7900]
  };

  function init() {
    var root = document.getElementById('rightPlantTool');
    if (!root) return;
    buildUI(root);
    wireEvents(root);
    loadPlants();
    loadTowns();
  }

  function loadPlants() {
    fetch('/chilterngardenmaintenance-updatedsite/_private-data/plants.json')
      .then(function(r) { return r.json(); })
      .then(function(data) {
        PLANTS = data;
        LOADED = true;
        updateStatus();
      })
      .catch(function(e) { setStatus('Could not load plant data. Please try again later.'); });
  }

  function loadTowns() {
    fetch('/chilterngardenmaintenance-updatedsite/_private-data/towns.json')
      .then(function(r) { return r.json(); })
      .then(function(data) {
        TOWN_DATA = Array.isArray(data) ? data : Object.values(data);
        updateStatus();
      })
      .catch(function(e) { /* Town data optional - postcode lookup will still work with districts */ });
  }

  function updateStatus() {
    var parts = [];
    if (PLANTS.length) parts.push(PLANTS.length + ' plants');
    if (TOWN_DATA.length) parts.push(TOWN_DATA.length + ' towns');
    if (parts.length) {
      setStatus(parts.join(' · ') + ' loaded. Enter your postcode for auto-detect, or pick conditions manually.');
    } else if (LOADED) {
      setStatus(PLANTS.length + ' plants loaded. Pick your conditions below.');
    }
  }

  function setStatus(msg) {
    var s = document.getElementById('rprpStatus');
    if (s) s.textContent = msg;
  }

  function buildUI(root) {
    root.classList.add('rprp-tool');
    root.innerHTML =
      '<div class="rprp-tool__header">' +
        '<span class="editorial-kicker">Right plant, right place</span>' +
        '<h2 class="editorial-h2">Find plants that will actually thrive in your garden.</h2>' +
        '<p class="editorial-lede">Enter your postcode to auto-detect soil type, or pick conditions manually. We\'ll match plants from our 130-strong Chiltern library and explain <em>why</em> each one fits - not just a filtered list.</p>' +
      '</div>' +
      '<details class="rprp-tool__form-wrap" open>' +
        '<summary class="rprp-tool__form-summary">' +
          '<span>Show me the conditions</span>' +
          '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>' +
        '</summary>' +
        '<div class="rprp-tool__form">' +
          '<p id="rprpStatus" class="rprp-tool__status">Loading plant data...</p>' +
          '<div class="rprp-tool__postcode">' +
            '<label for="rprp-postcode">Your postcode (auto-detects soil &amp; conditions)</label>' +
            '<div class="rprp-tool__postcode-row">' +
              '<input type="text" id="rprp-postcode" placeholder="e.g. OX14 4SE" autocomplete="postal-code">' +
              '<button type="button" class="btn btn-primary" id="rprpDetect">Detect</button>' +
            '</div>' +
            '<p id="rprpDetectResult" class="rprp-tool__detect-result" hidden></p>' +
          '</div>' +
          '<div class="rprp-tool__divider"><span>OR pick conditions manually</span></div>' +
          '<div class="rprp-tool__grid">' +
            rprpField('sun', 'Sun exposure', [['','Any'],['full-sun','Full sun (6+ hrs)'],['partial-shade','Partial shade'],['full-shade','Full shade']]) +
            rprpField('moisture', 'Soil moisture', [['','Any'],['fast','Free-draining (dry)'],['moderate','Moderate'],['slow','Moisture-retentive']]) +
            rprpField('chalk', 'Chalk tolerance', [['','Any'],['high','Must tolerate chalk'],['any',"Doesn't matter"]]) +
            rprpField('height', 'Desired height', [['','Any'],['low','Low (under 50cm)'],['mid','Medium (50cm–1.5m)'],['tall','Tall (1.5m+)']]) +
            rprpField('maintenance', 'Maintenance tolerance', [['','Any'],['low','Low - leave it alone'],['medium','Medium - happy to prune'],['high','High - I enjoy pruning']]) +
            rprpField('pets', 'Pets / children', [['','Any'],['safe','Must be non-toxic']]) +
            rprpField('pollinator', 'Pollinator objective', [['','Not specifically'],['yes','Yes - attract bees/butterflies']]) +
            rprpField('screening', 'Screening requirement', [['','No'],['yes','Yes - need screening']]) +
            rprpField('colour', 'Colour preference', [['','Any'],['purple','Purple / blue'],['pink','Pink'],['white','White'],['yellow','Yellow'],['red','Red']]) +
          '</div>' +
          '<div class="rprp-tool__actions">' +
            '<button type="button" class="btn btn-primary" id="rprpFind">Find my plants &rarr;</button>' +
            '<button type="button" class="btn btn-ghost" id="rprpReset" style="border:2px solid var(--forest);color:var(--forest-dark);">Reset</button>' +
          '</div>' +
        '</div>' +
      '</details>' +
      '<div class="rprp-tool__results" id="rprpResults" hidden>' +
        '<p class="rprp-tool__results-intro" id="rprpResultsIntro"></p>' +
        '<div class="rprp-tool__results-list" id="rprpResultsList"></div>' +
      '</div>';
  }

  function rprpField(id, label, options) {
    var opts = options.map(function(o) {
      return '<option value="' + o[0] + '">' + o[1] + '</option>';
    }).join('');
    return '<div class="rprp-tool__field">' +
      '<label for="rprp-' + id + '">' + label + '</label>' +
      '<select id="rprp-' + id + '">' + opts + '</select>' +
    '</div>';
  }

  function wireEvents(root) {
    root.addEventListener('click', function(e) {
      if (e.target.id === 'rprpFind') findPlants();
      else if (e.target.id === 'rprpReset') resetForm();
      else if (e.target.id === 'rprpDetect') detectFromPostcode();
    });
    root.addEventListener('keydown', function(e) {
      if (e.target.id === 'rprp-postcode' && e.key === 'Enter') {
        e.preventDefault();
        detectFromPostcode();
      }
    });
  }

  // ---- Postcode auto-detect ----
  function detectFromPostcode() {
    var input = document.getElementById('rprp-postcode');
    var result = document.getElementById('rprpDetectResult');
    if (!input || !result) return;

    var postcode = input.value.trim().toUpperCase();
    if (!postcode) {
      showDetectResult('Please enter a postcode.', 'error');
      return;
    }

    // Extract postcode district (e.g. "OX14 4SE" → "OX14", "OX1 1AA" → "OX1")
    var match = postcode.match(/^([A-Z]{1,2}\d[A-Z\d]?)\s*\d[A-Z]{2}$/);
    var district;
    if (match) {
      district = match[1];
    } else {
      // Try partial postcode (just the district)
      match = postcode.match(/^([A-Z]{1,2}\d[A-Z\d]?)$/);
      if (match) {
        district = match[1];
      } else {
        showDetectResult('That doesn\'t look like a valid postcode. Try e.g. OX14 4SE or just OX14.', 'error');
        return;
      }
    }

    var coords = POSTCODE_DISTRICTS[district];
    if (!coords) {
      // Try without the trailing letter (e.g. OX1X → OX1)
      var shortDistrict = district.replace(/[A-Z]$/, '');
      coords = POSTCODE_DISTRICTS[shortDistrict];
      district = shortDistrict;
    }
    if (!coords) {
      showDetectResult('Postcode area ' + district + ' is outside our coverage (Oxfordshire, Buckinghamshire, Berkshire, Bedfordshire). Try a different postcode or pick conditions manually below.', 'error');
      return;
    }

    // Find nearest town
    var nearestTown = null;
    var nearestDist = Infinity;
    TOWN_DATA.forEach(function(t) {
      var c = t.coordinates || {};
      var lat = c.latitude, lng = c.longitude;
      if (lat && lng) {
        var dist = Math.sqrt(Math.pow(lat - coords[0], 2) + Math.pow(lng - coords[1], 2));
        if (dist < nearestDist) {
          nearestDist = dist;
          nearestTown = t;
        }
      }
    });

    if (!nearestTown) {
      showDetectResult('Detected ' + district + ' but could not match to a town. Pick conditions manually below.', 'warning');
      return;
    }

    // Extract soil and climate data
    var soil = nearestTown.soil || {};
    var climate = nearestTown.climate || {};
    var primaryTexture = soil.primaryTexture || 'loam';
    var ph = soil.ph || {};
    var drainage = climate.drainage || 'moderate';
    var frostRisk = climate.frostRisk || 'moderate';
    var rainfall = (climate.rainfall || {}).annualMm || 700;

    // Determine chalk tolerance from soil
    var chalkTol = 'any';
    if (primaryTexture === 'chalk' || (soil.secondaryTextures || []).indexOf('chalk') !== -1) {
      chalkTol = 'high';
    }

    // Determine moisture from drainage
    var moisture = 'moderate';
    if (drainage === 'fast' || primaryTexture === 'chalk' || primaryTexture === 'sand') {
      moisture = 'fast';
    } else if (drainage === 'slow' || primaryTexture === 'clay') {
      moisture = 'slow';
    }

    // Auto-fill the manual selects
    setSelect('rprp-moisture', moisture);
    setSelect('rprp-chalk', chalkTol);

    var distKm = (nearestDist * 111).toFixed(1); // approx km
    var phText = ph.min && ph.max ? 'pH ' + ph.min + '-' + ph.max : 'pH unknown';
    var frostText = {high:'high frost risk', moderate:'moderate frost risk', low:'low frost risk'}[frostRisk] || 'moderate frost risk';
    var rainfallText = rainfall + 'mm/year';

    showDetectResult(
      '<strong>Detected: ' + district + '</strong> - nearest town ' + nearestTown.name + ' (' + distKm + 'km). ' +
      'Soil: ' + primaryTexture + ' (' + phText + '). Drainage: ' + drainage + '. ' + frostText + '. ' + rainfallText + '. ' +
      'We\'ve pre-set soil moisture and chalk tolerance. Adjust the other fields below, then find plants.',
      'success'
    );

    // Track
    if (typeof gtag === 'function') {
      gtag('event', 'rprp_postcode_detect', {
        postcode_district: district,
        nearest_town: nearestTown.slug,
        page_path: window.location.pathname
      });
    }
  }

  function setSelect(id, value) {
    var el = document.getElementById(id);
    if (el) el.value = value;
  }

  function showDetectResult(html, type) {
    var result = document.getElementById('rprpDetectResult');
    if (!result) return;
    result.hidden = false;
    result.innerHTML = html;
    result.className = 'rprp-tool__detect-result rprp-tool__detect-result--' + type;
  }

  function getHeightBand(plant) {
    var ms = plant.matureSize || {};
    var txt = (ms.sourceText || '').toLowerCase();
    if (txt.match(/(\d+)\s*(m|metre)/)) {
      var m = parseInt(RegExp.$1, 10);
      if (m >= 2) return 'tall';
      if (m >= 1) return 'mid';
      return 'low';
    }
    if (txt.match(/(\d+)\s*cm/)) {
      var cm = parseInt(RegExp.$1, 10);
      if (cm >= 150) return 'tall';
      if (cm >= 50) return 'mid';
      return 'low';
    }
    return null;
  }

  function getColourBand(plant) {
    var name = (plant.name || '').toLowerCase();
    var tags = (plant.tags || []).join(' ').toLowerCase();
    var text = name + ' ' + tags;
    if (text.match(/lavender|blue|salvia|verbena|agapanthus|geranium|allium|clematis|ceanothus|liriope/)) return 'purple';
    if (text.match(/rose|pink|dianthus|fuchsia|camellia|peony|magnolia/)) return 'pink';
    if (text.match(/white|snowdrop|jasmine|hydrangea|viburnum|choisya|deutzia|philadelphus/)) return 'white';
    if (text.match(/yellow|forsythia|daffodil|rudbeckia|mahonia|primrose/)) return 'yellow';
    if (text.match(/red|crocosmia|poppy|tulip|dahlia/)) return 'red';
    return null;
  }

  function findPlants() {
    if (!LOADED) {
      alert('Plant data still loading - please try again in a moment.');
      return;
    }

    var sun = document.getElementById('rprp-sun').value;
    var moisture = document.getElementById('rprp-moisture').value;
    var chalk = document.getElementById('rprp-chalk').value;
    var height = document.getElementById('rprp-height').value;
    var maintenance = document.getElementById('rprp-maintenance').value;
    var pets = document.getElementById('rprp-pets').value;
    var pollinator = document.getElementById('rprp-pollinator').value;
    var screening = document.getElementById('rprp-screening').value;
    var colour = document.getElementById('rprp-colour').value;

    var matches = [];
    PLANTS.forEach(function(plant) {
      var reasons = [];
      var gc = plant.growingConditions || {};

      // Sun match
      if (sun) {
        var lights = gc.light || [];
        if (lights.indexOf(sun) !== -1) {
          reasons.push({
            priority: 3,
            text: 'Thrives in ' + sun.replace('-', ' ') + ' - exactly what your garden offers.'
          });
        } else if (lights.length === 0) {
          // unknown - neutral
        } else {
          return;
        }
      }

      // Moisture/drainage match
      if (moisture) {
        var drainages = gc.drainage || [];
        if (drainages.indexOf(moisture) !== -1) {
          var moistureText = {fast:'free-draining soil', moderate:'moderate drainage', slow:'moisture-retentive soil'}[moisture];
          reasons.push({
            priority: 3,
            text: 'Suited to ' + moistureText + ' - matches your soil.'
          });
        } else if (drainages.length === 0) {
          // unknown
        } else {
          return;
        }
      }

      // Chalk tolerance
      if (chalk === 'high') {
        var ct = gc.chalkTolerance;
        if (ct === 'high') {
          reasons.push({priority: 3, text: 'Excellent chalk tolerance - ideal for Chilterns chalk soils.'});
        } else if (ct === 'moderate') {
          reasons.push({priority: 2, text: 'Moderate chalk tolerance - will cope with your soil.'});
        } else if (ct === 'low' || ct === 'none') {
          return;
        }
      }

      // Height
      if (height) {
        var band = getHeightBand(plant);
        if (band === height) {
          var heightText = {low:'under 50cm', mid:'50cm–1.5m', tall:'over 1.5m'}[height];
          reasons.push({priority: 2, text: 'Reaches ' + heightText + ' - fits your desired height.'});
        }
      }

      // Pollinator
      if (pollinator === 'yes') {
        var tags = (plant.tags || []).join(' ').toLowerCase();
        var name = (plant.name || '').toLowerCase();
        if (tags.match(/pollinator|bee|butterfly|wildlife/) ||
            name.match(/lavender|salvia|verbena|echinacea|rudbeckia|allium|agapanthus|thyme|rosemary/)) {
          reasons.push({priority: 2, text: 'Excellent for pollinators - bees and butterflies will visit.'});
        }
      }

      // Screening
      if (screening === 'yes') {
        var pt = (plant.plantType || '').toLowerCase();
        var ms = plant.matureSize || {};
        var msText = (ms.sourceText || '').toLowerCase();
        if (pt.match(/hedge|tree|shrub/) || msText.match(/\dm/) || msText.match(/tall/)) {
          reasons.push({priority: 3, text: 'Provides effective screening at maturity.'});
        } else {
          return;
        }
      }

      // Pets/children safety
      if (pets === 'safe') {
        var safety = plant.safety || {};
        if (safety.toxicity === 'none' || safety.toxicity === 'low') {
          reasons.push({priority: 2, text: 'Non-toxic - safe for pets and children.'});
        } else if (safety.toxicity === 'high' || safety.toxicity === 'moderate') {
          return;
        }
      }

      // Colour
      if (colour) {
        var plantColour = getColourBand(plant);
        if (plantColour === colour) {
          reasons.push({priority: 1, text: 'Provides ' + colour + ' colour in season.'});
        }
      }

      // If no reasons at all, default
      if (reasons.length === 0) {
        reasons.push({priority: 1, text: 'Reliably suited to Chiltern conditions.'});
      }

      // Calculate score (sum of priorities)
      var score = reasons.reduce(function(s, r) { return s + r.priority; }, 0);

      matches.push({
        plant: plant,
        reasons: reasons.sort(function(a, b) { return b.priority - a.priority; }),
        score: score
      });
    });

    // Sort by score (best fits first), then alphabetically
    matches.sort(function(a, b) {
      if (b.score !== a.score) return b.score - a.score;
      return a.plant.name.localeCompare(b.plant.name);
    });

    var topMatches = matches.slice(0, 8);
    showResults(topMatches, matches.length);
  }

  function showResults(matches, totalMatched) {
    var results = document.getElementById('rprpResults');
    var intro = document.getElementById('rprpResultsIntro');
    var list = document.getElementById('rprpResultsList');

    if (matches.length === 0) {
      results.hidden = false;
      intro.innerHTML = '<strong>No plants matched your exact conditions.</strong> Try relaxing one or two filters - most Chiltern gardens have at least 30 suitable plants from our library. <a href="/chilterngardenmaintenance-updatedsite/plants/" style="color:var(--forest);text-decoration:underline;">Browse all 130 plants</a> or <a href="/chilterngardenmaintenance-updatedsite/booking/" style="color:var(--forest);text-decoration:underline;">ask us to recommend plants for your garden</a>.';
      list.innerHTML = '';
      return;
    }

    results.hidden = false;
    var matchText = totalMatched === 1 ? '1 plant matched' : totalMatched + ' plants matched';
    var shownText = matches.length === 1 ? 'the best fit' : 'the best ' + matches.length + ' fits';
    intro.innerHTML = '<strong>' + matchText + ' your conditions.</strong> Here are ' + shownText + ', ranked by how well they match - with an explanation of why each one works.';

    var html = matches.map(function(m, idx) {
      var p = m.plant;
      var slug = p.slug;
      var name = p.name;
      var latin = p.scientificName || '';
      var pt = p.plantType || '';
      var reasonsHtml = m.reasons.map(function(r) {
        var icon = r.priority >= 3 ? '★' : (r.priority >= 2 ? '✓' : '·');
        return '<li><span class="rprp-result__reason-icon">' + icon + '</span><span>' + escapeHtml(r.text) + '</span></li>';
      }).join('');
      var rank = String(idx + 1).padStart(2, '0');

      return '<a class="rprp-result" href="/chilterngardenmaintenance-updatedsite/plants/' + slug + '.html">' +
        '<div class="rprp-result__rank">' + rank + '</div>' +
        '<div class="rprp-result__body">' +
          '<div class="rprp-result__header">' +
            '<h3 class="rprp-result__name">' + escapeHtml(name) + '</h3>' +
            '<span class="rprp-result__type">' + escapeHtml(pt) + '</span>' +
          '</div>' +
          '<p class="rprp-result__latin">' + escapeHtml(latin) + '</p>' +
          '<div class="rprp-result__reasons">' +
            '<p class="rprp-result__reasons-label">Why this fits:</p>' +
            '<ul>' + reasonsHtml + '</ul>' +
          '</div>' +
          '<span class="rprp-result__cta">View plant profile &rarr;</span>' +
        '</div>' +
      '</a>';
    }).join('');

    list.innerHTML = html;

    // Track
    if (typeof gtag === 'function') {
      gtag('event', 'rprp_search', {
        results_count: matches.length,
        total_matched: totalMatched,
        page_path: window.location.pathname
      });
    }
  }

  function resetForm() {
    document.querySelectorAll('.rprp-tool__field select').forEach(function(s) { s.value = ''; });
    var postcode = document.getElementById('rprp-postcode');
    if (postcode) postcode.value = '';
    var detectResult = document.getElementById('rprpDetectResult');
    if (detectResult) { detectResult.hidden = true; detectResult.innerHTML = ''; }
    document.getElementById('rprpResults').hidden = true;
  }

  function escapeHtml(s) {
    if (!s) return '';
    return String(s).replace(/[&<>"']/g, function(c) {
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c];
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
