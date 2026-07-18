/* Calculator: calcClearance */

  window.calcClearance = function () {
    var area = numberValue('area');
    var overgrowth = radioValue('overgrowth');
    var access = radioValue('access');
    var brambles = radioValue('brambles');
    var wasteRemoval = radioValue('wasteRemoval');
    var goal = radioValue('goal');

    if (!overgrowth || !access || !brambles || !wasteRemoval || !goal) {
      alert("Please answer all the questions to get your estimate.");
      return;
    }
    if (!area || area < 1) area = 50;

    // Calculate raw score (internal only, not shown to user)
    var scorePerM2 = { light: 0.08, medium: 0.18, heavy: 0.32 };
    var score = area * scorePerM2[overgrowth];

    var accessMult = { easy: 1.05, moderate: 1.30, difficult: 1.75 };
    score *= accessMult[access];

    var brambleScore = { none: 0, some: 6, extensive: 16 };
    score += brambleScore[brambles];

    if (wasteRemoval === 'yes') score += 5;
    if (goal === 'transform') score *= 1.5;

    // Apply minimum (Level 1 threshold)
    score = Math.max(score, 15);

    // Define level thresholds in quarters from minimum to maximum
    // Min = 15, Max = 120 (typical max for very large clearance)
    var minScore = 15;
    var maxScore = 120;
    var range = maxScore - minScore; // 105
    var quarter = range / 4; // 26.25

    var level;
    var levelDesc;
    if (score < minScore + quarter) {
      level = "Level 1";
      levelDesc = "Tidy Clearance";
    } else if (score < minScore + (quarter * 2)) {
      level = "Level 2";
      levelDesc = "Overgrown Clearance";
    } else if (score < minScore + (quarter * 3)) {
      level = "Level 3";
      levelDesc = "Major Garden Recovery";
    } else {
      level = "Level 4";
      levelDesc = "Complex Garden Recovery";
    }

    var summary = "<strong>Estimated level:</strong> " + level + " - " + levelDesc + "<br><br>" +
      "<p style='margin-bottom:.8rem;line-height:1.6;'>Based on your answers, your garden has been assessed at this clearance level. Contact us for a free site visit and fixed quote.</p>" +
      "<strong>Garden size:</strong> " + area + " m2, " + overgrowth + " overgrowth<br>" +
      "<strong>Includes:</strong> " +
      (wasteRemoval === 'yes' ? "waste removal, " : "no waste removal, ") +
      brambles + " brambles/ivy, " + access + " access<br>" +
      "<strong>Goal:</strong> " + (goal === 'transform' ? 'full transformation' : 'tidy up') + "<br>" +
      "<strong>Best next step:</strong> contact us for a free site visit and fixed quote.";

    showResult('clearance', level + " - " + levelDesc, summary);
  };

  /* ---- MAINTENANCE CALCULATOR ----
     CGM Care Levels 1-4 based on a scoring system.
     Level 1 - Essential Care (Control)
     Level 2 - Structured Care (Maintain)
     Level 3 - Intensive Garden Care (Horticultural management)
     Level 4 - Managed Garden (Full garden oversight)
  */
