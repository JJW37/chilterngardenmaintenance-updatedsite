/* Calculator: calcPressureWash */

  window.calcPressureWash = function () {
    var area = numberValue('area');
    var waterTap = radioValue('waterTap');
    var lastWashed = radioValue('lastWashed');
    var algae = radioValue('algae');
    var moss = radioValue('moss');

    if (!waterTap || !lastWashed || !algae || !moss) {
      alert("Please answer all the questions to get your estimate.");
      return;
    }
    if (!area || area < 1) area = 30;

    // Calculate raw score (internal only, not shown to user)
    var scorePerM2 = { light: 0.06, moderate: 0.12, heavy: 0.22 };
    var score = area * scorePerM2[algae];

    var lastWashMult = {
      'less-1-year': 1.0,
      '1-3-years': 1.25,
      '3-plus-years': 1.5,
      'never': 1.75
    };
    score *= lastWashMult[lastWashed];

    var mossScore = { none: 0, some: 2, extensive: 5 };
    score += mossScore[moss];

    if (waterTap === 'no') score += 1.5;

    // Apply minimum (Level 1 threshold)
    score = Math.max(score, 4);

    // Define level thresholds in quarters from minimum to maximum
    // Min = 4, Max = 50 (typical max for very large pressure wash job)
    var minScore = 4;
    var maxScore = 50;
    var range = maxScore - minScore; // 46
    var quarter = range / 4; // 11.5

    var level;
    var levelDesc;
    if (score < minScore + quarter) {
      level = "Level 1";
      levelDesc = "Light Clean";
    } else if (score < minScore + (quarter * 2)) {
      level = "Level 2";
      levelDesc = "Established Build-Up";
    } else if (score < minScore + (quarter * 3)) {
      level = "Level 3";
      levelDesc = "Heavy Restoration";
    } else {
      level = "Level 4";
      levelDesc = "Major Surface Recovery";
    }

    var summary = "<strong>Estimated level:</strong> " + level + " - " + levelDesc + "<br><br>" +
      "<p style='margin-bottom:.8rem;line-height:1.6;'>Based on your answers, your surface has been assessed at this pressure washing level. Contact us for a free site visit.</p>" +
      "<strong>Area:</strong> " + area + " m2<br>" +
      "<strong>Conditions:</strong> " + algae + " algae, " + moss + " moss<br>" +
      "<strong>Last washed:</strong> " + lastWashed.replace(/-/g, ' ') + "<br>" +
      (waterTap === 'no' ? "<strong>Water supply:</strong> we bring our own (buffer tank)<br>" : "<strong>Water supply:</strong> on-site tap<br>") +
      "<strong>Best next step:</strong> contact us for a free site visit.";

    showResult('pressure-wash', level + " - " + levelDesc, summary);
  };

  // Live area value display for range sliders
  document.querySelectorAll('input[type="range"]').forEach(function (slider) {
    var display = document.getElementById(slider.name + '-display');
    if (display) {
      var update = function () { display.textContent = slider.value; };
      slider.addEventListener('input', update);
      update();
    }
  });
/* ============================================================
   PRIVACY PLANT PLANNER
   Premium diagnostic tool for privacy screening plant selection.
   ============================================================ */
