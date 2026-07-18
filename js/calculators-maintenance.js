/* Calculator: calcMaintenance */

  window.calcMaintenance = function () {
    var garden = numberValue('garden');
    var planting = radioValue('planting');
    var responsibility = radioValue('responsibility');
    var outcome = radioValue('outcome');
    var improve = radioValue('improve');

    if (!planting || !responsibility || !outcome || !improve) {
      alert("Please answer all the questions to assess your garden.");
      return;
    }
    if (!garden || garden < 1) garden = 150;

    // Get checked specialist features
    var featureCheckboxes = document.querySelectorAll('input[name="feature"]:checked');
    var features = [];
    featureCheckboxes.forEach(function(cb) { features.push(cb.value); });

    // === SCORING SYSTEM ===
    var score = 0;

    // GARDEN AREA
    if (garden < 100) score += 0;
    else if (garden < 250) score += 1;
    else if (garden < 500) score += 2;
    else if (garden < 1000) score += 4;
    else score += 6;

    // PLANTING COMPLEXITY
    var plantingScores = { lawn: 0, few: 1, several: 3, heavily: 5, zones: 7 };
    score += plantingScores[planting];

    // SPECIALIST FEATURES
    var specialistScores = {
      hedges: 1, climbers: 1, roses: 1,
      wisteria: 2, fruit: 2, topiary: 2,
      perennial: 2, kitchen: 2
    };
    features.forEach(function(f) {
      score += specialistScores[f] || 0;
    });

    // RESPONSIBILITY
    var respScores = { self: 0, some: 1, occasional: 2, regular: 3, full: 6 };
    score += respScores[responsibility];

    // DESIRED OUTCOME
    var outcomeScores = { controlled: 0, consistent: 3, detailed: 6, managed: 9 };
    score += outcomeScores[outcome];

    // IMPROVEMENT INTENT
    var improveScores = { maintain: 0, some: 1, identify: 3, actively: 5 };
    score += improveScores[improve];

    // === DETERMINE LEVEL ===
    // Max possible score: 6 + 7 + (8 features * 2 max) + 6 + 9 + 5 = 39
    // Thresholds:
    // Level 1: 0-7
    // Level 2: 8-15
    // Level 3: 16-24
    // Level 4: 25+

    var level, levelName, levelDesc, levelWork, levelFreq;

    if (score < 8) {
      level = "Level 1";
      levelName = "Essential Care";
      levelDesc = "Your garden appears suited to CGM Care Level 1 - Essential Care. " +
        "Your garden has relatively simple maintenance requirements. The main priority is keeping growth controlled, " +
        "lawns presentable and obvious weeds from becoming established.";
      levelWork = "Lawn cutting, basic edging, visible weed control, light seasonal pruning, general tidy.";
      levelFreq = "Every 3 to 4 weeks during the main growing season.";
    } else if (score < 16) {
      level = "Level 2";
      levelName = "Structured Care";
      levelDesc = "Your garden appears suited to CGM Care Level 2 - Structured Care. " +
        "Your garden contains enough planting and seasonal work that occasional tidying alone is unlikely to keep it " +
        "consistently well maintained. A structured programme allows work to be completed at the correct point in the season. " +
        "This directly supports the CGM Method, which emphasises right time, right job and prevention over cure.";
      levelWork = "Lawn maintenance, edging, border care, seasonal pruning, deadheading, hedge management, plant monitoring, seasonal task planning.";
      levelFreq = "Fortnightly to every three weeks.";
    } else if (score < 25) {
      level = "Level 3";
      levelName = "Intensive Garden Care";
      levelDesc = "Your garden appears suited to CGM Care Level 3 - Intensive Garden Care. " +
        "This is a horticulturally complex garden. Different areas will require attention at different points throughout the year. " +
        "We would normally recommend a planned care programme rather than a fixed list of repetitive gardening tasks.";
      levelWork = "Everything in Level 2, plus detailed pruning programme, plant-specific seasonal care, plant health observations, lawn programme, border development, plant support and staking, mulching planning, seasonal improvement recommendations.";
      levelFreq = "Weekly or fortnightly.";
    } else {
      level = "Level 4";
      levelName = "Managed Garden";
      levelDesc = "Your garden appears suited to CGM Care Level 4 - Managed Garden. " +
        "The size, planting complexity and standard expected mean your garden is likely to benefit from active management " +
        "rather than conventional maintenance. CGM would assess seasonal requirements, maintain garden records and plan " +
        "work throughout the year.";
      levelWork = "Full annual garden programme, priority scheduling, plant records, seasonal care calendar, garden condition observations, detailed lawn management, plant replacement recommendations, improvement planning, project identification, Garden Passport, Annual Garden Health Review.";
      levelFreq = "Usually weekly or a tailored schedule.";
    }

    // Build features list for display
    var featuresText = features.length > 0 ? features.join(", ") : "None selected";

    var summary = "<p style='margin-bottom:.8rem;line-height:1.6;'>Based on your answers, your garden contains enough planting complexity and seasonal work to benefit from structured garden management rather than occasional general tidying.</p>" +
      "<p style='margin-bottom:.8rem;line-height:1.6;'>" + levelDesc + "</p>" +
      "<strong>Typical work:</strong> " + levelWork + "<br>" +
      "<strong>Typical frequency:</strong> " + levelFreq + "<br><br>" +
      "<strong>Garden area:</strong> " + garden + " m2<br>" +
      "<strong>Planting:</strong> " + planting.replace('heavily', 'heavily planted').replace('few', 'few borders').replace('lawn', 'mostly lawn').replace('zones', 'multiple zones') + "<br>" +
      "<strong>Specialist features:</strong> " + featuresText + "<br>" +
      "<strong>Responsibility:</strong> " + responsibility.replace('self', 'self-maintained').replace('some', 'some work needed').replace('occasional', 'occasional care').replace('regular', 'regular gardener').replace('full', 'full CGM responsibility') + "<br>" +
      "<strong>Desired outcome:</strong> " + outcome.replace('controlled', 'controlled and presentable').replace('consistent', 'consistently cared for').replace('detailed', 'detailed care').replace('managed', 'fully managed') + "<br>" +
      "<strong>Improvement intent:</strong> " + improve.replace('maintain', 'just maintain').replace('some', 'some improvements').replace('identify', 'identify improvements').replace('actively', 'actively develop') + "<br><br>" +
      "<strong>Best next step:</strong> <a href='/booking/'>Get a quote</a> or read about <a href='/about/maintenance.html'>The CGM Method</a>.";

    showResult('maintenance', level.toUpperCase() + "<br>" + levelName.toUpperCase(), summary);
  };

  /* ---- LAWN PLANNING TOOL ----
     Recommends specific seed species and cultivars.
     First 3 seed varieties are shown clearly, the rest are blurred.
     A "how to" method section shows the first 3 steps, then blurs.
     CTA after blurred content links to quote form + guides.
  */
