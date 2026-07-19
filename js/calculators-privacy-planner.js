/* Calculator: calcPrivacyPlanner */

window.calcPrivacyPlanner = function () {
  var height = radioValue('pp-height');
  var issue = radioValue('pp-issue');
  var view = radioValue('pp-view');
  var light = radioValue('pp-light');
  var soil = radioValue('pp-soil');
  var style = radioValue('pp-style');
  var evergreen = radioValue('pp-evergreen');
  var growth = radioValue('pp-growth');
  var width = radioValue('pp-width');
  var maintenance = radioValue('pp-maintenance');
  var safe = radioValue('pp-safe');
  var wildlife = radioValue('pp-wildlife');
  var root = radioValue('pp-root');
  var look = radioValue('pp-look');

  if (!height || !issue || !view || !light || !soil || !style || !evergreen || !growth || !width || !maintenance || !safe || !wildlife || !root || !look) {
    alert("Please answer all the questions to get your privacy plan.");
    return;
  }

  // --- PLANT DATABASE ---
  // Each plant has attributes used for scoring and display.
  var plants = [
    {
      name: "Portuguese Laurel", latin: "Prunus lusitanica", evergreen: true,
      maxHeight: "4m+", growthHabit: "Dense upright hedge", maintenance: "Low",
      privacyStrength: 9, wildlifeValue: 6, growthSpeed: "medium",
      soilFit: ["clay","chalk","loam"], lightFit: ["full-sun","partial-shade","heavy-shade"],
      minWidth: "medium", toxicToPets: true, rootRisk: "medium",
      warning: "All parts toxic to pets and livestock if eaten.",
      badges: ["Evergreen","Low Maintenance","Premium Look"],
      why: "Dense evergreen that clips beautifully into a formal hedge. Tolerates shade and chalk, and holds a crisp shape year-round."
    },
    {
      name: "Cherry Laurel", latin: "Prunus laurocerasus", evergreen: true,
      maxHeight: "5m+", growthHabit: "Large spreading hedge", maintenance: "Low",
      privacyStrength: 9, wildlifeValue: 5, growthSpeed: "fast",
      soilFit: ["clay","chalk","loam"], lightFit: ["full-sun","partial-shade","heavy-shade"],
      minWidth: "wide", toxicToPets: true, rootRisk: "medium",
      warning: "Fast-growing and wide. Needs space. All parts toxic if eaten.",
      badges: ["Evergreen","Fast Growth","Wildlife Friendly"],
      why: "One of the fastest evergreen screens available. Large glossy leaves, excellent for blocking views quickly on wider borders."
    },
    {
      name: "Photinia Red Robin", latin: "Photinia x fraseri", evergreen: true,
      maxHeight: "3m", growthHabit: "Upright shrub with red new growth", maintenance: "Medium",
      privacyStrength: 7, wildlifeValue: 5, growthSpeed: "medium",
      soilFit: ["clay","loam","chalk"], lightFit: ["full-sun","partial-shade"],
      minWidth: "medium", toxicToPets: false, rootRisk: "low",
      warning: "Can suffer leaf spot in very wet or exposed sites.",
      badges: ["Evergreen","Premium Look","Seasonal Colour"],
      why: "Vibrant red new growth in spring gives seasonal interest while still providing a solid evergreen screen. Great for modern and cottage styles."
    },
    {
      name: "Yew", latin: "Taxus baccata", evergreen: true,
      maxHeight: "4m+", growthHabit: "Dense formal hedge", maintenance: "Low",
      privacyStrength: 10, wildlifeValue: 7, growthSpeed: "slow",
      soilFit: ["chalk","loam","clay"], lightFit: ["full-sun","partial-shade","heavy-shade"],
      minWidth: "medium", toxicToPets: true, rootRisk: "low",
      warning: "All parts toxic to pets and livestock except the red berry flesh. Slow to establish.",
      badges: ["Evergreen","Low Maintenance","Premium Look","Narrow Space"],
      why: "The finest formal evergreen hedge. Dense, dark green, clips to a crisp edge and lasts for decades. Tolerates shade and chalk."
    },
    {
      name: "Hornbeam", latin: "Carpinus betulus", evergreen: false,
      maxHeight: "5m+", growthHabit: "Formal hedge, holds dead leaves in winter", maintenance: "Medium",
      privacyStrength: 7, wildlifeValue: 8, growthSpeed: "medium",
      soilFit: ["clay","loam","chalk"], lightFit: ["full-sun","partial-shade"],
      minWidth: "medium", toxicToPets: false, rootRisk: "low",
      warning: "Deciduous, but holds brown leaves through winter providing partial screening.",
      badges: ["Fast Growth","Wildlife Friendly","Winter Interest"],
      why: "Holds its russet leaves through winter, giving near-evergreen screening. Excellent on clay and a top wildlife hedge."
    },
    {
      name: "Beech", latin: "Fagus sylvatica", evergreen: false,
      maxHeight: "5m+", growthHabit: "Formal hedge, holds dead leaves in winter", maintenance: "Medium",
      privacyStrength: 7, wildlifeValue: 7, growthSpeed: "medium",
      soilFit: ["chalk","loam"], lightFit: ["full-sun","partial-shade"],
      minWidth: "medium", toxicToPets: false, rootRisk: "low",
      warning: "Dislikes heavy wet clay. Deciduous but holds brown leaves through winter.",
      badges: ["Fast Growth","Wildlife Friendly","Winter Interest"],
      why: "Classic formal hedge on well-drained chalk and loam. Holds copper leaves through winter for partial off-season screening."
    },
    {
      name: "Pleached Hornbeam", latin: "Carpinus betulus (pleached)", evergreen: false,
      maxHeight: "2.5m clear stem, 1.5m head", growthHabit: "Elevated screen on bare trunk", maintenance: "Medium",
      privacyStrength: 8, wildlifeValue: 7, growthSpeed: "slow",
      soilFit: ["clay","loam","chalk"], lightFit: ["full-sun","partial-shade"],
      minWidth: "narrow", toxicToPets: false, rootRisk: "medium",
      warning: "Premium option. Needs specialist pruning to maintain the pleached frame. Deciduous.",
      badges: ["Premium Look","Narrow Space","Elevated Screen"],
      why: "Screens above fence line without taking up border width. The premium choice for overlooking-window issues in narrow spaces."
    },
    {
      name: "Pleached Photinia", latin: "Photinia x fraseri (pleached)", evergreen: true,
      maxHeight: "2.5m clear stem, 1.5m head", growthHabit: "Elevated evergreen screen on bare trunk", maintenance: "Medium",
      privacyStrength: 8, wildlifeValue: 5, growthSpeed: "medium",
      soilFit: ["clay","loam","chalk"], lightFit: ["full-sun","partial-shade"],
      minWidth: "narrow", toxicToPets: false, rootRisk: "medium",
      warning: "Premium option. Needs specialist pruning. Can suffer leaf spot in wet sites.",
      badges: ["Evergreen","Premium Look","Narrow Space","Elevated Screen","Seasonal Colour"],
      why: "Year-round elevated screening with red new growth. Solves upstairs-window overlooking without a wide border."
    },
    {
      name: "Star Jasmine", latin: "Trachelospermum jasminoides", evergreen: true,
      maxHeight: "3m on support", growthHabit: "Climber on trellis or wire", maintenance: "Low",
      privacyStrength: 6, wildlifeValue: 7, growthSpeed: "slow",
      soilFit: ["loam","chalk","sandy"], lightFit: ["full-sun","partial-shade"],
      minWidth: "narrow", toxicToPets: false, rootRisk: "low",
      warning: "Slow to establish. Needs a sturdy trellis or wire support. Scented flowers in summer.",
      badges: ["Evergreen","Low Maintenance","Narrow Space","Scented","Premium Look"],
      why: "Scented evergreen climber for narrow spaces. Covers a trellis or fence with glossy leaves and white jasmine-scented flowers."
    },
    {
      name: "Clematis armandii", latin: "Clematis armandii", evergreen: true,
      maxHeight: "4m on support", growthHabit: "Evergreen climber", maintenance: "Low",
      privacyStrength: 5, wildlifeValue: 6, growthSpeed: "medium",
      soilFit: ["loam","chalk"], lightFit: ["full-sun","partial-shade"],
      minWidth: "narrow", toxicToPets: false, rootRisk: "low",
      warning: "Needs a support. Can be vigorous once established. Scented spring flowers.",
      badges: ["Evergreen","Fast Growth","Narrow Space","Scented","Seasonal Colour"],
      why: "Fast evergreen climber with scented white spring flowers. Good for screening on a trellis in sun or partial shade."
    },
    {
      name: "Pyracantha", latin: "Pyracantha species", evergreen: true,
      maxHeight: "3m", growthHabit: "Spiny shrub, trainable on wall", maintenance: "Medium",
      privacyStrength: 7, wildlifeValue: 10, growthSpeed: "medium",
      soilFit: ["clay","chalk","loam","sandy"], lightFit: ["full-sun","partial-shade"],
      minWidth: "narrow", toxicToPets: false, rootRisk: "low",
      warning: "Vicious thorns. Wear thick gloves when pruning. Berries mildly toxic to humans.",
      badges: ["Evergreen","Wildlife Friendly","Narrow Space","Security","Seasonal Colour"],
      why: "Spiny evergreen that can be trained flat against a fence. Masses of berries in autumn loved by birds. Double duty as a security barrier."
    },
    {
      name: "Viburnum tinus", latin: "Viburnum tinus", evergreen: true,
      maxHeight: "3m", growthHabit: "Dense rounded shrub", maintenance: "Low",
      privacyStrength: 7, wildlifeValue: 7, growthSpeed: "medium",
      soilFit: ["loam","chalk","clay"], lightFit: ["full-sun","partial-shade","heavy-shade"],
      minWidth: "medium", toxicToPets: false, rootRisk: "low",
      warning: "Can get large if not pruned. Berries mildly toxic to humans if eaten.",
      badges: ["Evergreen","Low Maintenance","Wildlife Friendly","Shade Tolerant","Seasonal Colour"],
      why: "Versatile evergreen that tolerates shade. White winter flowers and blue berries. Excellent middle-layer plant in a mixed screen."
    },
    {
      name: "Bamboo (Phyllostachys)", latin: "Phyllostachys species", evergreen: true,
      maxHeight: "5m+", growthHabit: "Upright canes, dense screen", maintenance: "Medium",
      privacyStrength: 8, wildlifeValue: 4, growthSpeed: "fast",
      soilFit: ["loam","clay"], lightFit: ["full-sun","partial-shade"],
      minWidth: "medium", toxicToPets: false, rootRisk: "high",
      warning: "Running bamboo can spread aggressively. A root barrier is essential. Do not plant near boundaries without containment.",
      badges: ["Evergreen","Fast Growth","Narrow Space"],
      why: "Fast, dramatic, and excellent for modern and Mediterranean styles. However, running bamboo MUST be planted with a root barrier to prevent spread."
    },
    {
      name: "Holly", latin: "Ilex aquifolium", evergreen: true,
      maxHeight: "4m+", growthHabit: "Dense spiny hedge or tree", maintenance: "Low",
      privacyStrength: 8, wildlifeValue: 9, growthSpeed: "slow",
      soilFit: ["loam","chalk","clay","sandy"], lightFit: ["full-sun","partial-shade","heavy-shade"],
      minWidth: "medium", toxicToPets: false, rootRisk: "low",
      warning: "Slow-growing. Berries toxic to humans if eaten. Spiny leaves make pruning painful without gloves.",
      badges: ["Evergreen","Low Maintenance","Wildlife Friendly","Shade Tolerant","Seasonal Colour"],
      why: "Native evergreen with year-round screening, red winter berries loved by birds, and tolerance of shade. A slow but premium choice."
    },
    {
      name: "Griselinia", latin: "Griselinia littoralis", evergreen: true,
      maxHeight: "3m", growthHabit: "Upright hedge, apple-green leaves", maintenance: "Low",
      privacyStrength: 7, wildlifeValue: 4, growthSpeed: "medium",
      soilFit: ["loam","sandy","chalk"], lightFit: ["full-sun","partial-shade"],
      minWidth: "medium", toxicToPets: false, rootRisk: "low",
      warning: "Can suffer frost damage in very cold inland gardens. Not ideal for heavy clay.",
      badges: ["Evergreen","Low Maintenance","Coastal Look"],
      why: "Light apple-green evergreen leaves give a softer look than laurel. Good for coastal and modern styles on well-drained soil."
    },
    {
      name: "Elaeagnus", latin: "Elaeagnus x ebbingei", evergreen: true,
      maxHeight: "3m", growthHabit: "Dense shrub, silvery foliage", maintenance: "Low",
      privacyStrength: 7, wildlifeValue: 6, growthSpeed: "fast",
      soilFit: ["sandy","chalk","loam","clay"], lightFit: ["full-sun","partial-shade","heavy-shade"],
      minWidth: "medium", toxicToPets: false, rootRisk: "low",
      warning: "Can become leggy if not pruned. Some species are invasive in the wild, but x ebbingei is a safe garden hybrid.",
      badges: ["Evergreen","Fast Growth","Shade Tolerant","Coastal Look","Wildlife Friendly"],
      why: "Tough, fast-growing evergreen with silvery undersides to the leaves. Tolerates shade, wind, salt and poor soil. Fragrant autumn flowers."
    },
    {
      name: "Osmanthus", latin: "Osmanthus x burkwoodii", evergreen: true,
      maxHeight: "2.5m", growthHabit: "Dense rounded shrub", maintenance: "Low",
      privacyStrength: 6, wildlifeValue: 7, growthSpeed: "slow",
      soilFit: ["loam","chalk"], lightFit: ["full-sun","partial-shade"],
      minWidth: "medium", toxicToPets: false, rootRisk: "low",
      warning: "Slow-growing. Needs patience but rewards with scent and dense habit.",
      badges: ["Evergreen","Low Maintenance","Scented","Premium Look","Shade Tolerant"],
      why: "Glossy evergreen with clusters of jasmine-scented white flowers in spring. A refined choice for medium-height screening near seating areas."
    },
    {
      name: "Bay Laurel", latin: "Laurus nobilis", evergreen: true,
      maxHeight: "3m+", growthHabit: "Upright cone or hedge", maintenance: "Medium",
      privacyStrength: 7, wildlifeValue: 5, growthSpeed: "slow",
      soilFit: ["loam","chalk","sandy"], lightFit: ["full-sun","partial-shade"],
      minWidth: "narrow", toxicToPets: false, rootRisk: "low",
      warning: "Can suffer frost damage in cold gardens. Needs well-drained soil.",
      badges: ["Evergreen","Premium Look","Narrow Space","Scented","Mediterranean"],
      why: "Aromatic evergreen that can be clipped into a formal cone or narrow hedge. Classic Mediterranean choice for structure and scent."
    }
  ];

  // --- SCORING ---
  // Score each plant based on how well it matches the user's inputs.
  var scored = plants.map(function(p) {
    var score = 50; // baseline
    var reasons = [];

    // Evergreen requirement
    if (evergreen === 'yes' && p.evergreen) { score += 15; reasons.push("evergreen, year-round privacy"); }
    if (evergreen === 'yes' && !p.evergreen) { score -= 25; }
    if (evergreen === 'mixed') { score += 5; }

    // Height suitability
    if (height === '3m+' && p.maxHeight.includes('5m')) { score += 10; }
    if (height === '3m+' && p.maxHeight.includes('4m')) { score += 7; }
    if (height === '3m+' && p.maxHeight.includes('3m') && !p.maxHeight.includes('4')) { score -= 5; }
    if (height === '2m' && p.maxHeight.includes('3m')) { score += 8; }
    if (height === '2m' && p.maxHeight.includes('5m')) { score += 5; }
    if (height === '1m' && (p.maxHeight.includes('3m') || p.maxHeight.includes('4m') || p.maxHeight.includes('5m'))) { score += 3; }

    // Light fit
    if (p.lightFit.indexOf(light) !== -1) { score += 10; reasons.push("suited to your light level"); }
    else { score -= 15; }

    // Soil fit
    if (p.soilFit.indexOf(soil) !== -1) { score += 8; reasons.push("suited to your soil"); }
    else if (soil === 'unknown') { score += 2; }
    else { score -= 10; }

    // Growth speed
    if (growth === 'fast' && p.growthSpeed === 'fast') { score += 10; reasons.push("fast screening"); }
    if (growth === 'fast' && p.growthSpeed === 'slow') { score -= 8; }
    if (growth === 'balanced' && p.growthSpeed === 'medium') { score += 8; }
    if (growth === 'slow-premium' && p.growthSpeed === 'slow') { score += 12; reasons.push("premium slow-growing"); }
    if (growth === 'slow-premium' && p.growthSpeed === 'fast') { score -= 5; }

    // Width
    if (width === 'narrow' && p.minWidth === 'narrow') { score += 12; reasons.push("fits a narrow bed"); }
    if (width === 'narrow' && p.minWidth === 'wide') { score -= 20; }
    if (width === 'medium' && (p.minWidth === 'narrow' || p.minWidth === 'medium')) { score += 5; }
    if (width === 'wide') { score += 3; }

    // Maintenance
    if (maintenance === 'low' && p.maintenance === 'Low') { score += 10; reasons.push("low maintenance"); }
    if (maintenance === 'low' && p.maintenance === 'Medium') { score -= 5; }
    if (maintenance === 'medium' && p.maintenance === 'Medium') { score += 5; }

    // Pet/child safety
    if (safe === 'important' && p.toxicToPets) { score -= 20; }
    if (safe === 'important' && !p.toxicToPets) { score += 8; reasons.push("pet/child safe"); }

    // Wildlife
    if (wildlife === 'important' && p.wildlifeValue >= 7) { score += 10; reasons.push("wildlife-friendly"); }
    if (wildlife === 'important' && p.wildlifeValue < 5) { score -= 5; }

    // Root concern
    if (root === 'near-house' && p.rootRisk === 'high') { score -= 25; }
    if (root === 'near-patio' && p.rootRisk === 'high') { score -= 20; }
    if (root === 'near-fence' && p.rootRisk === 'high') { score -= 10; }
    if (root === 'open-border' && p.rootRisk === 'high') { score -= 3; }
    if (p.rootRisk === 'low') { score += 3; }

    // Issue-based adjustments (Feature A: Privacy Problem Type Matcher)
    if (issue === 'overlooking-window' || view === 'upstairs-window') {
      if (p.name.indexOf('Pleached') !== -1) { score += 15; reasons.push("elevated screen for overlooking"); }
      if (p.maxHeight.includes('5m') || p.maxHeight.includes('4m')) { score += 5; }
    }
    if (issue === 'low-fence' || view === 'through-fence') {
      if (p.growthHabit.indexOf('Climber') !== -1 || p.growthHabit.indexOf('trellis') !== -1) { score += 10; }
      if (p.name === 'Pyracantha') { score += 5; }
    }
    if (issue === 'exposed-patio') {
      if (p.badges && p.badges.indexOf('Scented') !== -1) { score += 8; reasons.push("scented near seating"); }
    }

    // Look preference
    if (look === 'pleached-trees' && p.name.indexOf('Pleached') !== -1) { score += 20; }
    if (look === 'climbers' && (p.growthHabit.indexOf('Climber') !== -1 || p.growthHabit.indexOf('trellis') !== -1)) { score += 20; }
    if (look === 'hedge' && (p.growthHabit.indexOf('hedge') !== -1)) { score += 10; }
    if (look === 'bamboo-screen' && p.name.indexOf('Bamboo') !== -1) { score += 20; }
    if (look === 'layered-border' && p.growthHabit.indexOf('shrub') !== -1) { score += 5; }

    // Garden style
    if (style === 'formal' && p.badges && p.badges.indexOf('Premium Look') !== -1) { score += 8; }
    if (style === 'cottage' && p.wildlifeValue >= 7) { score += 5; }
    if (style === 'modern' && (p.name === 'Bamboo (Phyllostachys)' || p.name === 'Bay Laurel' || p.name === 'Griselinia')) { score += 5; }
    if (style === 'wildlife' && p.wildlifeValue >= 8) { score += 8; }
    if (style === 'mediterranean' && (p.name === 'Bay Laurel' || p.name === 'Star Jasmine')) { score += 8; }
    if (style === 'woodland' && p.lightFit.indexOf('heavy-shade') !== -1) { score += 5; }
    if (style === 'low-maintenance' && p.maintenance === 'Low') { score += 5; }

    // Clamp score
    if (score < 0) score = 0;
    if (score > 100) score = 100;

    return { plant: p, score: score, reasons: reasons };
  });

  // Sort by score descending
  scored.sort(function(a, b) { return b.score - a.score; });

  // Take top 4-6
  var topResults = scored.slice(0, Math.min(6, scored.length));

  // --- BUILD OUTPUT ---

  // 1. Best Privacy Options
  var optionsHtml = '<div class="pp-section"><h4>Best Privacy Options</h4>';
  topResults.forEach(function(item, i) {
    var p = item.plant;
    var badgesHtml = (p.badges || []).map(function(b) {
      return '<span class="pp-badge pp-badge--' + b.toLowerCase().replace(/\s+/g, '-') + '">' + b + '</span>';
    }).join('');
    var warningHtml = p.warning ? '<div class="pp-warning">' + p.warning + '</div>' : '';
    var whyText = item.reasons.length > 0
      ? "Suits your situation because: " + item.reasons.join(", ") + "."
      : p.why;
    optionsHtml += '<div class="pp-plant-card">' +
      '<div class="pp-plant-card__header">' +
        '<span class="pp-plant-card__rank">#' + (i+1) + '</span>' +
        '<div><h5>' + p.name + '</h5><em class="pp-plant-card__latin">' + p.latin + '</em></div>' +
        '<span class="pp-plant-card__score">' + item.score + '/100</span>' +
      '</div>' +
      '<div class="pp-plant-card__badges">' + badgesHtml + '</div>' +
      '<p class="pp-plant-card__why">' + whyText + '</p>' +
      '<div class="pp-plant-card__grid">' +
        '<div><strong>Type:</strong> ' + (p.evergreen ? 'Evergreen' : 'Deciduous') + '</div>' +
        '<div><strong>Mature height:</strong> ' + p.maxHeight + '</div>' +
        '<div><strong>Habit:</strong> ' + p.growthHabit + '</div>' +
        '<div><strong>Maintenance:</strong> ' + p.maintenance + '</div>' +
        '<div><strong>Privacy strength:</strong> ' + p.privacyStrength + '/10</div>' +
        '<div><strong>Wildlife value:</strong> ' + p.wildlifeValue + '/10</div>' +
      '</div>' +
      warningHtml +
    '</div>';
  });
  optionsHtml += '</div>';

  // 2. Recommended Arrangement
  var arrangementType = "Mixed evergreen screen";
  var backLayer = "Portuguese Laurel or Hornbeam";
  var middleLayer = "Viburnum tinus, Osmanthus, Photinia";
  var frontLayer = "Lavender, Nepeta, Geranium, ferns or grasses depending on sun/shade";
  var spacing = "Stagger plants in a zig-zag pattern rather than a single straight line";
  var visualCharacter = "Layered, naturalistic screen with year-round structure";
  var seasonalInterest = "Spring: Photinia red growth. Summer: Osmanthus scent. Autumn: berries. Winter: evergreen structure.";

  // Determine arrangement based on inputs
  if (look === 'pleached-trees' || issue === 'overlooking-window' || view === 'upstairs-window') {
    arrangementType = "Pleached tree line";
    backLayer = "Pleached Hornbeam or Pleached Photinia (elevated head at 2m+)";
    middleLayer = "Viburnum tinus or Osmanthus below the pleached heads";
    frontLayer = "Low evergreens: Lavender, Hebe, or prostrate Rosemary";
    spacing = "Plant pleached trees at 1.2 to 1.5m centres along the boundary";
    visualCharacter = "Elevated formal screen with clear stems and structured heads";
    seasonalInterest = "Spring: Photinia red growth. Summer: dappled shade below. Autumn: hornbeam colour. Winter: evergreen heads hold leaves.";
  } else if (look === 'climbers' || width === 'narrow' || issue === 'low-fence') {
    arrangementType = "Fence-and-climber screen";
    backLayer = "Star Jasmine or Clematis armandii on a 2m trellis fixed to the fence";
    middleLayer = "Pyracantha trained flat against the fence";
    frontLayer = "Low growing: Lavender, Catmint, or Heuchera";
    spacing = "Plant climbers at 1.5 to 2m centres along the trellis";
    visualCharacter = "Vertical screen using existing fence as support, minimal ground footprint";
    seasonalInterest = "Spring: Clematis armandii flowers. Summer: Star Jasmine scent. Autumn: Pyracantha berries. Winter: evergreen foliage.";
  } else if (style === 'wildlife' || wildlife === 'important') {
    arrangementType = "Wildlife privacy border";
    backLayer = "Holly, Hornbeam or Yew for structure";
    middleLayer = "Pyracantha, Viburnum tinus, Berberis";
    frontLayer = "Lavender, Geranium, ornamental grasses, Bergenia";
    spacing = "Plant in groups of 3 or 5 of each species, staggered";
    visualCharacter = "Mixed native and wildlife-friendly planting, naturalistic";
    seasonalInterest = "Spring: flowers. Summer: berries forming. Autumn: berry colour. Winter: evergreen structure and berries for birds.";
  } else if (width === 'narrow') {
    arrangementType = "Narrow-space vertical screen";
    backLayer = "Bay Laurel cones or Portuguese Laurel (kept narrow)";
    middleLayer = "Star Jasmine on wall wires";
    frontLayer = "Trailing Rosemary or prostatic Juniper";
    spacing = "Plant at 60 to 80cm centres for a tight columnar screen";
    visualCharacter = "Tight, vertical, architectural screening for slim borders";
    seasonalInterest = "Spring: Bay new growth. Summer: Jasmine scent. Autumn: Bay aromatic leaves. Winter: evergreen structure.";
  } else if (evergreen === 'yes' && growth === 'fast') {
    arrangementType = "Instant evergreen screen";
    backLayer = "Cherry Laurel or Portuguese Laurel";
    middleLayer = "Photinia, Viburnum tinus";
    frontLayer = "Lavender, Hebe, Nepeta";
    spacing = "Plant at 80cm to 1m centres for rapid fill";
    visualCharacter = "Solid green wall within 2 growing seasons";
    seasonalInterest = "Spring: Photinia red tips. Summer: Viburnum flowers. Autumn: berries. Winter: solid evergreen.";
  }

  var arrangementHtml = '<div class="pp-section">' +
    '<h4>Recommended Arrangement: ' + arrangementType + '</h4>' +
    '<div class="pp-arrangement">' +
      '<div class="pp-arrangement__layer pp-arrangement__layer--back">' +
        '<span class="pp-arrangement__label">BACK LAYER</span>' +
        '<span class="pp-arrangement__plants">' + backLayer + '</span>' +
      '</div>' +
      '<div class="pp-arrangement__layer pp-arrangement__layer--middle">' +
        '<span class="pp-arrangement__label">MIDDLE LAYER</span>' +
        '<span class="pp-arrangement__plants">' + middleLayer + '</span>' +
      '</div>' +
      '<div class="pp-arrangement__layer pp-arrangement__layer--front">' +
        '<span class="pp-arrangement__label">FRONT LAYER</span>' +
        '<span class="pp-arrangement__plants">' + frontLayer + '</span>' +
      '</div>' +
    '</div>' +
    '<div class="pp-arrangement__details">' +
      '<p><strong>Spacing:</strong> ' + spacing + '.</p>' +
      '<p><strong>Visual character:</strong> ' + visualCharacter + '.</p>' +
      '<p><strong>Seasonal interest:</strong> ' + seasonalInterest + '</p>' +
    '</div>' +
  '</div>';

  // 3. Privacy Score
  var avgScore = Math.round(topResults.reduce(function(sum, item) { return sum + item.score; }, 0) / topResults.length);
  var privacyScoreLabel = avgScore >= 80 ? "Excellent" : avgScore >= 60 ? "Strong" : avgScore >= 40 ? "Moderate" : "Limited";
  var scoreHtml = '<div class="pp-section">' +
    '<h4>Privacy Score</h4>' +
    '<div class="pp-score-gauge">' +
      '<div class="pp-score-gauge__bar" style="width:' + avgScore + '%"></div>' +
      '<div class="pp-score-gauge__label">' + avgScore + '/100 <span>(' + privacyScoreLabel + ')</span></div>' +
    '</div>' +
    '<p class="pp-score-breakdown">Based on speed of screening, year-round privacy, site suitability, maintenance fit, root risk and visual quality for your specific inputs.</p>' +
  '</div>';

  // 4. Time to Screening
  var timeText = "";
  if (growth === 'fast') {
    timeText = "Likely to feel noticeably more private within 1 to 2 growing seasons, depending on plant size, soil, watering and maintenance.";
  } else if (growth === 'balanced') {
    timeText = "Immediate visual improvement on planting. Noticeable privacy within 2 to 3 growing seasons. Strong privacy within 4 to 5 years.";
  } else {
    timeText = "Immediate visual improvement on planting. Noticeable privacy within 3 to 5 years. Strong privacy within 6 to 8 years, but a premium result.";
  }
  var timeHtml = '<div class="pp-section">' +
    '<h4>Time to Screening</h4>' +
    '<p>' + timeText + '</p>' +
    '<div class="pp-timeline">' +
      '<div class="pp-timeline__step"><strong>Immediate</strong><span>Visual improvement on planting</span></div>' +
      '<div class="pp-timeline__step"><strong>1 to 2 seasons</strong><span>Noticeable privacy (fast-growing options)</span></div>' +
      '<div class="pp-timeline__step"><strong>3 to 5 years</strong><span>Strong privacy established</span></div>' +
    '</div>' +
  '</div>';

  // 5. Premium Design Enhancements
  var enhancements = [
    "Mixed-height planting: stagger heights to avoid a flat wall effect",
    "Evergreen backbone with seasonal flowering layer for year-round interest",
    "Scented privacy screen near seating areas using Star Jasmine or Osmanthus",
    "Wildlife corridor hedge: include berrying plants like Pyracantha and Holly",
    "Pleached trees above fence height to screen upper-storey views",
    "Climbers on trellis for narrow spaces where border width is limited",
    "Staggered planting to avoid a flat, regimented wall effect",
    "Low-voltage lighting within planting to highlight texture at night",
    "QR plant tags on each plant linking to care guides in the Plant Library",
    "Plan for seasonal colour gaps: include a late-autumn or winter-flowering plant"
  ];
  var enhancementsHtml = '<div class="pp-section">' +
    '<h4>Premium Design Enhancements</h4>' +
    '<ul class="pp-enhancements">' +
    enhancements.map(function(e) { return '<li>' + e + '</li>'; }).join('') +
    '</ul></div>';

  // 6. Risk Warnings
  var warnings = [];
  if (look === 'bamboo-screen' || scored.some(function(s) { return s.plant.name.indexOf('Bamboo') !== -1 && s.score > 40; })) {
    warnings.push("Bamboo root spread: running bamboo can invade neighbouring gardens. A root barrier is essential.");
  }
  warnings.push("Laurel width: Cherry Laurel can spread to 3m+ wide. Ensure you have the space.");
  if (scored.some(function(s) { return s.plant.name === 'Yew' && s.score > 40; })) {
    warnings.push("Yew toxicity: all parts toxic to pets and livestock except the red berry flesh.");
  }
  if (evergreen === 'no' || evergreen === 'mixed') {
    warnings.push("Deciduous plants lose leaves in winter, reducing screening. Hornbeam and Beech hold dead leaves for partial cover.");
  }
  if (width === 'narrow') {
    warnings.push("Shallow planting beds limit success. Consider climbers on trellis or pleached trees for narrow spaces.");
  }
  if (light === 'heavy-shade') {
    warnings.push("Heavy shade reduces flowering. Prioritise Yew, Holly, Viburnum tinus or Elaeagnus which tolerate shade.");
  }
  warnings.push("Watering during establishment is critical for the first 1 to 2 years, especially in dry Chiltern chalk soils.");
  var warningsHtml = '<div class="pp-section">' +
    '<h4>Risk Warnings</h4>' +
    '<ul class="pp-warnings">' +
    warnings.map(function(w) { return '<li>' + w + '</li>'; }).join('') +
    '</ul></div>';

  // Feature B: Screening Style Generator
  var styleName = "The Instant Evergreen Screen";
  if (evergreen === 'yes' && growth === 'fast') styleName = "The Instant Evergreen Screen";
  else if (style === 'cottage') styleName = "The Soft Cottage Privacy Border";
  else if (look === 'pleached-trees') styleName = "The Premium Pleached Boundary";
  else if (style === 'wildlife' || wildlife === 'important') styleName = "The Wildlife Shield";
  else if (width === 'narrow') styleName = "The Narrow Garden Privacy Wall";
  else if (style === 'mediterranean') styleName = "The Mediterranean Scented Screen";
  else if (maintenance === 'low') styleName = "The Low-Maintenance Evergreen Backdrop";

  // Feature C: Seasonal Privacy Calendar
  var calendarHtml = '<div class="pp-section">' +
    '<h4>Seasonal Privacy Calendar</h4>' +
    '<div class="pp-calendar">' +
      '<div class="pp-calendar__season"><strong>Spring</strong><span>' + (evergreen === 'yes' ? 'Full' : 'Partial') + '</span></div>' +
      '<div class="pp-calendar__season"><strong>Summer</strong><span>Full</span></div>' +
      '<div class="pp-calendar__season"><strong>Autumn</strong><span>' + (evergreen === 'yes' ? 'Full' : 'Partial') + '</span></div>' +
      '<div class="pp-calendar__season"><strong>Winter</strong><span>' + (evergreen === 'yes' ? 'Full' : 'Reduced') + '</span></div>' +
    '</div></div>';

  // Feature D: Mistake Detector
  var mistakeHtml = "";
  var mistakes = [];
  if (maintenance === 'low' && width === 'narrow' && growth === 'fast') {
    mistakes.push("You selected low maintenance, narrow bed and fast growth. Fast-growing screens often need more pruning to stay narrow, so a balanced evergreen mix may be better.");
  }
  if (safe === 'important' && evergreen === 'yes' && look === 'hedge') {
    mistakes.push("You want pet-safe, evergreen and hedge. Many classic evergreen hedges (Laurel, Yew, Box) are toxic. Consider Griselinia, Elaeagnus or Viburnum tinus instead.");
  }
  if (light === 'heavy-shade' && style === 'mediterranean') {
    mistakes.push("Heavy shade and Mediterranean style are a difficult combination. Mediterranean plants like sun. Consider a Woodland style instead with Holly, Yew and Viburnum.");
  }
  if (root === 'near-house' && look === 'bamboo-screen') {
    mistakes.push("Bamboo near house foundations is high-risk. Root barriers are essential, or choose a non-invasive alternative like pleached trees.");
  }
  if (mistakes.length > 0) {
    mistakeHtml = '<div class="pp-section pp-mistakes">' +
      '<h4>Compatibility Check</h4>' +
      '<ul class="pp-warnings">' +
      mistakes.map(function(m) { return '<li>' + m + '</li>'; }).join('') +
      '</ul></div>';
  }

  // Feature F: Privacy Gap Finder
  var gapHtml = '<div class="pp-section">' +
    '<h4>Privacy Gap Analysis</h4>' +
    '<p>The view you identified is coming from <strong>' + view.replace(/-/g, ' ') + '</strong>. ';
  if (view === 'above-fence' || view === 'upstairs-window') {
    gapHtml += 'This means you need screening above fence height. Pleached trees, tall evergreen shrubs (3m+) or a climber on a tall trellis are the right solutions.';
  } else if (view === 'through-fence') {
    gapHtml += 'This means your fence has gaps. Climbers on trellis, a low evergreen hedge, or mixed shrub planting in front of the fence will fill the gaps.';
  } else if (view === 'from-side') {
    gapHtml += 'Side views need an angled or L-shaped planting. Extend your screen at 90 degrees from the boundary to block the side angle.';
  }
  gapHtml += '</p></div>';

  // Feature H: QR Plaque Integration
  var qrHtml = '<div class="pp-section pp-qr">' +
    '<h4>QR Plant Care Plaques</h4>' +
    '<p>For each recommended plant, consider adding a QR care plaque. The client can scan each plant to see pruning, watering and seasonal care guidance from the CGM Plant Library.</p>' +
  '</div>';

  // 7. Final Recommendation
  var topPlant = topResults[0].plant;
  var finalHtml = '<div class="pp-section pp-final">' +
    '<h4>Final Recommendation</h4>' +
    '<p>Based on your answers, the best overall privacy approach is <strong>' + styleName + '</strong> using <strong>' + topPlant.name + '</strong> (' + topPlant.latin + ') as the primary screening plant' +
    (arrangementType !== "Mixed evergreen screen" ? ', arranged as a <strong>' + arrangementType.toLowerCase() + '</strong>' : '') +
    '.</p>' +
    '<p>' + topPlant.why + '</p>' +
    '<p class="pp-disclaimer">Plant performance depends on soil, light, watering, planting size and ongoing care.</p>' +
  '</div>';

  // CTAs
  var ctaHtml = '<div class="pp-ctas">' +
    '<a class="btn btn-primary btn-lg" href="/chilterngardenmaintenance-updatedsite/booking/">Request a Privacy Planting Visit</a>' +
    '<a class="btn btn-ghost btn-lg" href="/chilterngardenmaintenance-updatedsite/plants/">View Plant Library</a>' +
  '</div>';

  // Assemble full result
  var resultHeading = styleName;
  var fullSummary = optionsHtml + arrangementHtml + scoreHtml + calendarHtml + timeHtml + enhancementsHtml + warningsHtml + mistakeHtml + gapHtml + qrHtml + finalHtml + ctaHtml;

  showResult('privacy-planner', resultHeading, fullSummary);
};


/* ============================================================
   LAWN RECOVERY PREDICTOR
   Premium diagnostic tool for lawn condition assessment.
   ============================================================ */
