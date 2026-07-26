/* Calculator: calcLawnRecovery */

window.calcLawnRecovery = function () {
  var size = radioValue('lr-size');
  var condition = radioValue('lr-condition');
  var moss = radioValue('lr-moss');
  var weed = radioValue('lr-weed');
  var bare = radioValue('lr-bare');
  var shade = radioValue('lr-shade');
  var soil = radioValue('lr-soil');
  var drain = radioValue('lr-drain');
  var traffic = radioValue('lr-traffic');
  var pets = radioValue('lr-pets');
  var children = radioValue('lr-children');
  var feed = radioValue('lr-feed');
  var scarified = radioValue('lr-scarified');
  var desired = radioValue('lr-desired');

  if (!size || !condition || !moss || !weed || !bare || !shade || !soil || !drain || !traffic || !pets || !children || !feed || !scarified || !desired) {
    alert("Please answer all the questions to diagnose your lawn.");
    return;
  }

  // --- RECOVERY SCORE CALCULATION ---
  var score = 75; // baseline

  // Moss severity
  if (moss === 'none') score += 10;
  else if (moss === 'light') score += 5;
  else if (moss === 'moderate') score -= 10;
  else if (moss === 'heavy') score -= 25;

  // Weed severity
  if (weed === 'none') score += 8;
  else if (weed === 'light') score += 3;
  else if (weed === 'moderate') score -= 8;
  else if (weed === 'heavy') score -= 20;

  // Bare patches
  if (bare === 'none') score += 8;
  else if (bare === 'light') score += 2;
  else if (bare === 'moderate') score -= 10;
  else if (bare === 'heavy') score -= 25;

  // Shade
  if (shade === 'full-sun') score += 8;
  else if (shade === 'partial-shade') score += 0;
  else if (shade === 'heavy-shade') score -= 15;

  // Drainage
  if (drain === 'good') score += 8;
  else if (drain === 'slow-draining') score -= 10;
  else if (drain === 'waterlogged') score -= 25;
  else if (drain === 'unknown') score -= 3;

  // Soil
  if (soil === 'clay') score -= 5;
  else if (soil === 'chalk') score -= 3;
  else if (soil === 'sandy') score -= 5;
  else if (soil === 'unknown') score -= 2;

  // Traffic
  if (traffic === 'low') score += 5;
  else if (traffic === 'medium') score += 0;
  else if (traffic === 'heavy') score -= 12;

  // Maintenance history
  if (feed === 'recently') score += 5;
  else if (feed === 'this-year') score += 2;
  else if (feed === 'over-a-year') score -= 8;
  else if (feed === 'never') score -= 12;

  if (scarified === 'recently') score += 5;
  else if (scarified === 'this-year') score += 2;
  else if (scarified === 'over-a-year') score -= 8;
  else if (scarified === 'never') score -= 10;

  // Pets
  if (pets === 'yes') score -= 8;

  // Clamp
  if (score < 0) score = 0;
  if (score > 100) score = 100;

  // --- RECOVERY CATEGORY ---
  var category, categoryClass;
  if (score >= 85) { category = "Strong recovery likely"; categoryClass = "lr-strong"; }
  else if (score >= 65) { category = "Good recovery potential"; categoryClass = "lr-good"; }
  else if (score >= 45) { category = "Recoverable but needs renovation"; categoryClass = "lr-recoverable"; }
  else if (score >= 25) { category = "Difficult recovery"; categoryClass = "lr-difficult"; }
  else { category = "Replacement or alternative lawn likely better"; categoryClass = "lr-replacement"; }

  // --- LAWN PERSONALITY ---
  var personality = "The Recoverable Family Lawn";
  if (score >= 85) personality = "The Premium Lawn Project";
  else if (moss === 'heavy' && shade === 'heavy-shade') personality = "The Moss-Dominant Shade Lawn";
  else if (score >= 65 && score < 85) personality = "The Tired but Saveable Lawn";
  else if (score < 25) personality = "The Replacement Candidate";
  else if (desired === 'wildlife-lawn') personality = "The Wildlife Lawn Opportunity";
  else if (desired === 'premium-lawn' && score >= 65) personality = "The Premium Lawn Project";

  // --- DIAGNOSIS ---
  var diagnoses = [];
  if (moss === 'moderate' || moss === 'heavy') {
    var mossCauses = [];
    if (shade === 'heavy-shade' || shade === 'partial-shade') mossCauses.push("shade");
    if (drain === 'waterlogged' || drain === 'slow-draining') mossCauses.push("damp soil");
    if (scarified === 'never' || scarified === 'over-a-year') mossCauses.push("lack of scarifying");
    if (soil === 'clay') mossCauses.push("compaction");
    diagnoses.push("Moss caused by " + (mossCauses.length > 0 ? mossCauses.join(", ") : "favourable conditions"));
  }
  if (bare === 'moderate' || bare === 'heavy') {
    var bareCauses = [];
    if (traffic === 'heavy') bareCauses.push("heavy use");
    if (pets === 'yes') bareCauses.push("dog urine");
    if (shade === 'heavy-shade') bareCauses.push("lack of light");
    diagnoses.push("Bare patches from " + (bareCauses.length > 0 ? bareCauses.join(" and ") : "wear and thin grass"));
  }
  if (condition === 'yellowing') diagnoses.push("Yellowing from nutrient deficiency or drought stress");
  if (condition === 'patchy') diagnoses.push("Patchiness from poor soil structure or inconsistent growth");
  if (weed === 'moderate' || weed === 'heavy') diagnoses.push("Weed invasion from thin grass coverage allowing weeds to establish");
  if (drain === 'waterlogged') diagnoses.push("Waterlogging preventing healthy root development");
  if (condition === 'compacted') diagnoses.push("Soil compaction restricting root growth and water penetration");
  if (diagnoses.length === 0) diagnoses.push("General thinning and tired appearance from maintenance gaps");

  // --- BEST ROUTE FORWARD ---
  var route, routeDesc;
  if (score >= 85) { route = "Light recovery programme"; routeDesc = "Your lawn is in good shape. A light feed, occasional overseed and regular mowing will keep it healthy."; }
  else if (score >= 65) { route = "Seasonal renovation"; routeDesc = "Your lawn needs a seasonal renovation: scarify, aerate, overseed and feed. Recovery is very achievable."; }
  else if (score >= 45) { route = "Heavy renovation"; routeDesc = "Your lawn needs a full renovation programme. Scarify heavily, aerate, top-dress, overseed and address underlying issues like drainage and shade."; }
  else if (score >= 25) { route = "Partial returfing"; routeDesc = "Parts of your lawn may need returfing after addressing the underlying problems. Focus on the worst areas first."; }
  else { route = "Full lawn replacement or alternative"; routeDesc = "Recovery is unlikely to be cost-effective. Consider full returfing after soil improvement, or switch to an alternative lawn approach like clover or wildflower."; }

  // --- RECOMMENDED ACTIONS ---
  var actions = [];
  if (moss === 'moderate' || moss === 'heavy') { actions.push("Scarify to remove moss and thatch"); actions.push("Apply moss treatment (iron sulphate) before scarifying"); }
  else if (moss === 'light') { actions.push("Light scarify if moss is present"); }
  else { actions.push("Light scarify to remove thatch if needed"); }

  if (condition === 'compacted' || soil === 'clay' || traffic === 'heavy') { actions.push("Aerate using a hollow-tine aerator to relieve compaction"); }
  else { actions.push("Aerate to improve drainage and root growth"); }

  if (bare === 'moderate' || bare === 'heavy') { actions.push("Overseed bare areas with a suitable seed mix"); }
  else { actions.push("Overseed to thicken the sward"); }

  if (soil === 'clay') { actions.push("Top-dress with 70/30 sand/soil mix to improve clay soil"); }
  else { actions.push("Top-dress to level and improve soil surface"); }

  if (feed === 'never' || feed === 'over-a-year') { actions.push("Apply a spring or autumn lawn feed"); }
  else { actions.push("Feed with a balanced lawn fertiliser"); }

  if (drain === 'waterlogged' || drain === 'slow-draining') { actions.push("Improve drainage: install land drains or French drains"); }
  if (shade === 'heavy-shade') { actions.push("Reduce shade where possible: thin tree canopies or prune lower branches"); actions.push("Reseed with a shade-tolerant seed mix (fescue-dominated)"); }
  if (traffic === 'heavy' || children === 'yes') { actions.push("Use a durable family lawn seed mix (ryegrass-dominated)"); }
  if (pets === 'yes') { actions.push("Repair pet damage: rinse urine patches, overseed scorched areas"); }
  if (desired === 'wildlife-lawn') { actions.push("Consider introducing clover to the lawn for nitrogen fixation and wildlife value"); }
  actions.push("Adjust mowing height: raise to 35 to 50mm in summer to reduce stress");

  // --- RECOVERY TIMELINE ---
  var timelineHtml = '<div class="lr-timeline">' +
    '<div class="lr-timeline__step"><strong>Current state</strong><span>' + condition.replace(/-/g, ' ') + ' lawn</span></div>' +
    '<div class="lr-timeline__step"><strong>3 months</strong><span>First visible improvement after scarify, aerate and overseed</span></div>' +
    '<div class="lr-timeline__step"><strong>6 months</strong><span>Stronger grass coverage as new seed establishes</span></div>' +
    '<div class="lr-timeline__step"><strong>12 months</strong><span>More reliable lawn condition with ongoing care</span></div>' +
  '</div>';
  var timelineNote = "Visible improvement is usually possible within one growing season if conditions and aftercare are suitable.";

  // --- LAWN TYPE RECOMMENDATION ---
  var lawnType, lawnTypeDesc;
  if (desired === 'premium-lawn' && score >= 65) { lawnType = "Premium ornamental lawn"; lawnTypeDesc = "Fine fescue and bentgrass mix for a bowling-green finish. Requires cylinder mower and regular feeding."; }
  else if (desired === 'durable-lawn' || traffic === 'heavy' || children === 'yes') { lawnType = "Family durable lawn"; lawnTypeDesc = "Dwarf ryegrass and smooth-stalked meadow grass mix. Tolerates children, dogs and heavy use."; }
  else if (shade === 'heavy-shade' || shade === 'partial-shade') { lawnType = "Shade-tolerant lawn"; lawnTypeDesc = "Fescue-dominated mix that thrives in low light. Avoid ryegrass which thins in shade."; }
  else if (desired === 'wildlife-lawn') { lawnType = "Wildlife/clover lawn"; lawnTypeDesc = "Mix of low-growing wildflowers, clover and fine grasses. Low maintenance, high biodiversity value."; }
  else if (desired === 'low-maintenance') { lawnType = "Low-maintenance meadow-style lawn"; lawnTypeDesc = "Mixed grass and wildflower mix that needs only 1 to 2 cuts per year. Best for larger areas."; }
  else if (score < 25) { lawnType = "Returfed formal lawn"; lawnTypeDesc = "After soil improvement, lay fresh turf for an instant lawn. Best when recovery is unlikely."; }
  else { lawnType = "Mixed-use practical lawn"; lawnTypeDesc = "Balanced ryegrass and fescue mix suitable for family use with reasonable appearance."; }

  // --- RISK FACTORS ---
  var risks = [];
  if (shade === 'heavy-shade') risks.push("Heavy shade will limit grass growth. Consider thinning canopies or using shade-tolerant species.");
  if (drain === 'waterlogged') risks.push("Poor drainage will cause seed and turf to fail unless drainage is improved first.");
  if (soil === 'clay') risks.push("Compacted clay restricts root growth. Aeration and top-dressing are essential.");
  if (pets === 'yes') risks.push("Dog urine causes scorched patches that will need regular overseeding.");
  if (traffic === 'heavy') risks.push("Heavy foot traffic compacts soil and wears the sward. Consider a durable seed mix or stepping stones in high-traffic areas.");
  risks.push("Cutting too short weakens grass and encourages moss and weeds. Keep mowing height above 35mm.");
  risks.push("Lack of watering after seeding is the most common cause of renovation failure.");
  if (moss === 'heavy') risks.push("Moss will return if the underlying conditions (shade, damp, compaction) are not addressed.");
  if (risks.length === 0) risks.push("Few significant risks identified. Maintain regular feeding, mowing and aeration.");

  // --- MOSS RETURN RISK (Feature C) ---
  var mossRisk = "Low";
  if (moss === 'heavy' && shade === 'heavy-shade' && (drain === 'waterlogged' || drain === 'slow-draining')) mossRisk = "High";
  else if (moss === 'moderate' || moss === 'heavy') mossRisk = "Medium";
  else if (shade === 'heavy-shade' || drain === 'waterlogged') mossRisk = "Medium";

  // --- MAINTENANCE ADVICE ---
  var maintenanceHtml = '<div class="lr-maintenance">' +
    '<div class="lr-season"><h5>Spring</h5><ul>' +
      '<li>Scarify lightly if needed</li><li>Feed with spring lawn fertiliser</li><li>Overseed bare areas</li>' +
    '</ul></div>' +
    '<div class="lr-season"><h5>Summer</h5><ul>' +
      '<li>Raise mowing height to 40 to 50mm</li><li>Water during dry spells</li><li>Avoid cutting too short</li>' +
    '</ul></div>' +
    '<div class="lr-season"><h5>Autumn</h5><ul>' +
      '<li>Aerate to relieve compaction</li><li>Overseed and top-dress</li><li>Treat moss if needed</li>' +
    '</ul></div>' +
    '<div class="lr-season"><h5>Winter</h5><ul>' +
      '<li>Avoid heavy traffic on wet lawn</li><li>Plan drainage or renovation work</li><li>Keep leaves off the lawn</li>' +
    '</ul></div>' +
  '</div>';

  // --- PET DAMAGE MODULE (Feature D) ---
  var petHtml = "";
  if (pets === 'yes') {
    petHtml = '<div class="lr-section lr-pet">' +
      '<h4>Pet Damage Advice</h4>' +
      '<ul class="lr-action-list">' +
        '<li>Dog urine scorches grass: rinse affected areas with water within an hour if possible</li>' +
        '<li>Use a hard-wearing ryegrass seed mix that recovers from damage quickly</li>' +
        '<li>Avoid overfeeding damaged patches with nitrogen, which can worsen scorch</li>' +
        '<li>Consider a designated dog toilet area to concentrate damage in one spot</li>' +
        '<li>Overseed scorched patches in spring and autumn</li>' +
      '</ul></div>';
  }

  // --- SHADE PROBLEM DETECTOR (Feature E) ---
  var shadeHtml = "";
  if (shade === 'heavy-shade') {
    shadeHtml = '<div class="lr-section lr-shade">' +
      '<h4>Shade Problem: Alternative Options</h4>' +
      '<p>Heavy shade makes a conventional lawn difficult. Consider these alternatives:</p>' +
      '<ul class="lr-action-list">' +
        '<li>Shade-tolerant grass mix (fescue-dominated)</li>' +
        '<li>Woodland planting with ferns, hostas and hellebores</li>' +
        '<li>Bark mulch area with stepping stones</li>' +
        '<li>Clover lawn (more shade-tolerant than grass)</li>' +
        '<li>Gravel garden with shade-loving plants</li>' +
      '</ul></div>';
  }

  // --- DRAINAGE WARNING (Feature F) ---
  var drainHtml = "";
  if (drain === 'waterlogged') {
    drainHtml = '<div class="lr-section lr-drain">' +
      '<h4>Drainage Warning</h4>' +
      '<p>Your lawn is waterlogged. Grass seed and turf will struggle to establish unless drainage and soil structure improve first. Consider installing land drains, French drains, or improving the soil with organic matter and aeration before attempting lawn renovation.</p>' +
    '</div>';
  }

  // --- ALTERNATIVE SUGGESTIONS (Feature I) ---
  var altHtml = "";
  if (score < 45) {
    var alternatives = [
      "Clover lawn: low maintenance, stays green, tolerates poor soil",
      "Wildflower lawn: colourful, wildlife-friendly, needs 1 to 2 cuts per year",
      "Gravel garden: low maintenance, drought-tolerant plants",
      "Bark woodland area: naturalistic, good under trees, low maintenance",
      "Stepping stone path with ground cover: reduces lawn area",
      "Fern and shade border: ideal for heavy shade where grass fails",
      "Play-resistant hardwearing turf: for high-traffic family areas"
    ];
    altHtml = '<div class="lr-section">' +
      '<h4>Alternative Lawn Approaches</h4>' +
      '<p>Given the low recovery score, consider these alternatives to a conventional lawn:</p>' +
      '<ul class="lr-action-list">' +
      alternatives.map(function(a) { return '<li>' + a + '</li>'; }).join('') +
      '</ul></div>';
  }

  // --- SEASONAL TIMING WARNING (Feature J) ---
  var currentMonth = new Date().getMonth() + 1; // 1-12
  var timingHtml = "";
  var isSpring = (currentMonth >= 3 && currentMonth <= 5);
  var isAutumn = (currentMonth >= 9 && currentMonth <= 11);
  var isSummer = (currentMonth >= 6 && currentMonth <= 8);
  var isWinter = (currentMonth === 12 || currentMonth <= 2);

  if (isSummer) {
    timingHtml = '<div class="lr-section lr-timing">' +
      '<h4>Seasonal Timing Note</h4>' +
      '<p>It is currently summer. The best times for lawn renovation are <strong>mid-spring (April to May)</strong> and <strong>early autumn (September to October)</strong> when soil is warm and rainfall is more reliable. If you proceed now, ensure you water new seed daily until germination.</p>' +
    '</div>';
  } else if (isWinter) {
    timingHtml = '<div class="lr-section lr-timing">' +
      '<h4>Seasonal Timing Note</h4>' +
      '<p>It is currently winter. Lawn renovation is best done in <strong>mid-spring (April to May)</strong> or <strong>early autumn (September to October)</strong>. Use this time to plan your renovation programme, address drainage issues, and order seed and materials for the next season.</p>' +
    '</div>';
  } else if (isSpring) {
    timingHtml = '<div class="lr-section lr-timing">' +
      '<h4>Seasonal Timing Note</h4>' +
      '<p>It is currently spring, which is an ideal time for lawn renovation. Soil is warming up and rainfall is usually reliable. Proceed with scarifying, aerating and overseeding now.</p>' +
    '</div>';
  } else if (isAutumn) {
    timingHtml = '<div class="lr-section lr-timing">' +
      '<h4>Seasonal Timing Note</h4>' +
      '<p>It is currently autumn, which is the best time for lawn renovation. Soil is still warm from summer, rainfall is reliable, and seed germinates well. Proceed with scarifying, aerating and overseeding now.</p>' +
    '</div>';
  }

  // --- BEFORE/AFTER JOURNEY (Feature H) ---
  var beforeAfterHtml = '<div class="lr-section">' +
    '<h4>Before and After Journey</h4>' + timelineHtml +
    '<p class="lr-timeline-note">' + timelineNote + '</p>' +
  '</div>';

  // --- FINAL RECOMMENDATION ---
  var finalHtml = '<div class="lr-section lr-final">' +
    '<h4>Final Recommendation</h4>' +
    '<p>Based on your answers, your lawn is best treated as <strong>' + personality + '</strong>.</p>' +
    '<p>The recommended route forward is a <strong>' + route + '</strong>. ' + routeDesc + '</p>' +
    '<p>Target lawn type: <strong>' + lawnType + '</strong>. ' + lawnTypeDesc + '</p>' +
    '<p class="lr-disclaimer">This is a guidance tool only. Lawn recovery depends on weather, soil, seed choice, watering, drainage and aftercare.</p>' +
  '</div>';

  // CTAs
  var ctaHtml = '<div class="lr-ctas">' +
    '<a class="btn btn-primary btn-lg" href="/chilterngardenmaintenance-updatedsite/booking/">Request a Lawn Assessment</a>' +
    '<a class="btn btn-ghost btn-lg" href="/chilterngardenmaintenance-updatedsite/tips/returf-or-reseed-lawn.html">View Lawn Care Advice</a>' +
  '</div>';

  // --- ASSEMBLE SECTIONS ---
  var scoreHtml = '<div class="lr-section lr-score-section">' +
    '<div class="lr-score-gauge ' + categoryClass + '">' +
      '<div class="lr-score-gauge__bar" style="width:' + score + '%"></div>' +
      '<div class="lr-score-gauge__label">' + score + '%</div>' +
    '</div>' +
    '<div class="lr-score-category ' + categoryClass + '">' + category + '</div>' +
    '<div class="lr-personality">Lawn type: <strong>' + personality + '</strong></div>' +
    '<div class="lr-moss-risk">Moss return risk: <strong>' + mossRisk + '</strong></div>' +
  '</div>';

  var diagnosisHtml = '<div class="lr-section">' +
    '<h4>Lawn Diagnosis</h4>' +
    '<ul class="lr-diagnosis">' +
    diagnoses.map(function(d) { return '<li>' + d + '</li>'; }).join('') +
    '</ul></div>';

  var routeHtml = '<div class="lr-section">' +
    '<h4>Best Route Forward: ' + route + '</h4>' +
    '<p>' + routeDesc + '</p></div>';

  var actionsHtml = '<div class="lr-section">' +
    '<h4>Recommended Actions</h4>' +
    '<ol class="lr-action-list">' +
    actions.map(function(a) { return '<li>' + a + '</li>'; }).join('') +
    '</ol></div>';

  var lawnTypeHtml = '<div class="lr-section">' +
    '<h4>Recommended Lawn Type: ' + lawnType + '</h4>' +
    '<p>' + lawnTypeDesc + '</p></div>';

  var risksHtml = '<div class="lr-section">' +
    '<h4>Risk Factors</h4>' +
    '<ul class="lr-action-list">' +
    risks.map(function(r) { return '<li>' + r + '</li>'; }).join('') +
    '</ul></div>';

  var maintenanceSectionHtml = '<div class="lr-section">' +
    '<h4>Seasonal Maintenance Advice</h4>' +
    maintenanceHtml +
  '</div>';

  // Assemble full result
  var resultHeading = score + '% recovery potential';
  var fullSummary = scoreHtml + diagnosisHtml + routeHtml + actionsHtml + beforeAfterHtml + lawnTypeHtml + risksHtml + maintenanceSectionHtml + petHtml + shadeHtml + drainHtml + altHtml + timingHtml + finalHtml + ctaHtml;

  showResult('lawn-recovery', resultHeading, fullSummary);
};
