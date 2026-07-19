/* Calculator: calcLawn */

  window.calcLawn = function () {
    var size = numberValue('size');
    var sunExposure = radioValue('sunExposure');
    var soilType = radioValue('soilType');
    var problem = radioValue('problem');
    var trafficLevel = radioValue('trafficLevel');

    if (!sunExposure || !soilType || !problem || !trafficLevel) {
      alert("Please answer all the questions to get your lawn plan.");
      return;
    }
    if (!size || size < 1) size = 50;

    // Recommend specific seed species and cultivars based on conditions
    var seedRec = "";
    var seedNotes = "";
    var seedMixParts = [];  // array of {name, percent, note}

    if (sunExposure === 'full-shade') {
      seedRec = "Shade-tolerant fescue blend";
      seedMixParts = [
        {name: "Strong Creeping Red Fescue (<em>Festuca rubra rubra</em>)", percent: "50%"},
        {name: "Chewings Fescue (<em>Festuca rubra commutata</em>)", percent: "30%"},
        {name: "Hard Fescue (<em>Festuca longifolia</em>)", percent: "15%"},
        {name: "Browntop Bent (<em>Agrostis capillaris</em>)", percent: "5%"},
        {name: "Cultivar recommendation: 'Bargena' or 'Viktoria'", percent: "-"},
        {name: "Sowing rate: 25 to 30 g/m2", percent: "-"},
        {name: "Best sowing time: mid-September to mid-October", percent: "-"},
        {name: "First cut: 6 to 8 weeks after germination, remove no more than 1/3 height", percent: "-"},
      ];
      seedNotes = "Fine fescues thrive in low light. The bentgrass fills gaps and adds density. Avoid ryegrass in shade as it thins out within two seasons.";
    } else if (sunExposure === 'partial-shade') {
      seedRec = "Sun and shade blend";
      seedMixParts = [
        {name: "Perennial Ryegrass (<em>Lolium perenne</em>, cultivar 'Pippin')", percent: "40%"},
        {name: "Slender Creeping Red Fescue (<em>Festuca rubra litoralis</em>)", percent: "30%"},
        {name: "Chewings Fescue (<em>Festuca rubra commutata</em>)", percent: "20%"},
        {name: "Smooth-stalked Meadow Grass (<em>Poa pratensis</em>)", percent: "10%"},
        {name: "Cultivar recommendation: 'Pippin' or 'Clementine'", percent: "-"},
        {name: "Sowing rate: 30 to 35 g/m2", percent: "-"},
        {name: "Best sowing time: April or September", percent: "-"},
        {name: "Maintenance mowing height: 35 to 50mm", percent: "-"},
      ];
      seedNotes = "Ryegrass gives durability in the sunny areas, fescues cope with the shade. Smooth-stalked meadow grass fills bare patches via rhizomes.";
    } else if (trafficLevel === 'heavy' || problem === 'compaction') {
      seedRec = "Hard-wearing ryegrass and meadow grass blend";
      seedMixParts = [
        {name: "Dwarf Perennial Ryegrass (<em>Lolium perenne</em>, cultivar 'Clementine' or 'Mascot')", percent: "60%"},
        {name: "Smooth-stalked Meadow Grass (<em>Poa pratensis</em>)", percent: "25%"},
        {name: "Strong Creeping Red Fescue (<em>Festuca rubra rubra</em>)", percent: "15%"},
        {name: "Cultivar recommendation: 'Clementine', 'Mascot' or 'Limousine'", percent: "-"},
        {name: "Sowing rate: 35 to 40 g/m2", percent: "-"},
        {name: "Best sowing time: September", percent: "-"},
        {name: "Maintenance mowing height: 25 to 40mm", percent: "-"},
        {name: "Aerate annually to relieve compaction from foot traffic", percent: "-"},
      ];
      seedNotes = "Dwarf ryegrass tolerates children, dogs and heavy footfall. Smooth-stalked meadow grass repairs damage via underground rhizomes. The fescue adds density and drought tolerance.";
    } else if (problem === 'drought' || soilType === 'chalk') {
      seedRec = "Drought-tolerant deep-rooting blend";
      seedMixParts = [
        {name: "Tall Fescue (<em>Festuca arundinacea</em>, cultivar 'Cochise' or 'Starlet')", percent: "50%"},
        {name: "Sheep's Fescue (<em>Festuca ovina</em>)", percent: "25%"},
        {name: "Hard Fescue (<em>Festuca longifolia</em>)", percent: "15%"},
        {name: "Dwarf Perennial Ryegrass (<em>Lolium perenne</em>)", percent: "10%"},
        {name: "Cultivar recommendation: 'Cochise', 'Starlet' or 'Apache'", percent: "-"},
        {name: "Sowing rate: 30 to 35 g/m2", percent: "-"},
        {name: "Deep root system reaches 60 to 100cm in chalk", percent: "-"},
        {name: "Water deeply once a week rather than lightly every day", percent: "-"},
      ];
      seedNotes = "Tall fescue has deep roots (up to 1 metre) that find water in dry Chiltern chalk. Sheep's and hard fescue are naturally drought-tolerant. A small ryegrass content gives quick germination and repair.";
    } else if (problem === 'moss') {
      seedRec = "Fast-germinating renovation blend";
      seedMixParts = [
        {name: "Perennial Ryegrass (<em>Lolium perenne</em>, cultivar 'Limousine' or 'Axcella')", percent: "70%"},
        {name: "Strong Creeping Red Fescue (<em>Festuca rubra rubra</em>)", percent: "20%"},
        {name: "Chewings Fescue (<em>Festuca rubra commutata</em>)", percent: "10%"},
        {name: "Cultivar recommendation: 'Limousine' or 'Axcella'", percent: "-"},
        {name: "Sowing rate: 35 g/m2", percent: "-"},
        {name: "Germination: 7 to 10 days", percent: "-"},
        {name: "Address shade, compaction or drainage or moss returns", percent: "-"},
        {name: "Apply iron sulphate before scarifying to kill moss first", percent: "-"},
      ];
      seedNotes = "Fast-germinating ryegrass fills bare patches within 10 days of moss removal. The fescues add long-term density and drought tolerance. Address the underlying moss cause (shade, compaction, drainage) or moss will return.";
    } else if (problem === 'weeds') {
      seedRec = "Dense competition blend";
      seedMixParts = [
        {name: "Perennial Ryegrass (<em>Lolium perenne</em>, cultivar 'Clementine')", percent: "50%"},
        {name: "Strong Creeping Red Fescue (<em>Festuca rubra rubra</em>)", percent: "30%"},
        {name: "Smooth-stalked Meadow Grass (<em>Poa pratensis</em>)", percent: "20%"},
        {name: "Cultivar recommendation: 'Clementine' or 'Pippin'", percent: "-"},
        {name: "Sowing rate: 30 to 35 g/m2", percent: "-"},
        {name: "Mow regularly to 40mm to thicken the sward", percent: "-"},
        {name: "Feed in spring to outcompete weed germination", percent: "-"},
        {name: "Spot-treat persistent weeds before overseeding", percent: "-"},
      ];
      seedNotes = "A dense sward outcompetes weeds. Ryegrass germinates fast, fescue fills gaps, meadow grass spreads via rhizomes to block weed germination.";
    } else if (problem === 'drainage') {
      seedRec = "Wet-tolerant blend";
      seedMixParts = [
        {name: "Perennial Ryegrass (<em>Lolium perenne</em>)", percent: "50%"},
        {name: "Smooth-stalked Meadow Grass (<em>Poa pratensis</em>)", percent: "30%"},
        {name: "Tall Fescue (<em>Festuca arundinacea</em>)", percent: "20%"},
        {name: "Cultivar recommendation: 'Clementine' or 'Mascot'", percent: "-"},
        {name: "Sowing rate: 30 to 35 g/m2", percent: "-"},
        {name: "Install land drains or French drains before seeding", percent: "-"},
        {name: "Aerate hollow-tine annually to improve drainage", percent: "-"},
        {name: "Top-dress with 70/30 sand/soil after aeration", percent: "-"},
      ];
      seedNotes = "These species tolerate wetter soils better than fescues. However, fix the drainage problem first, as no grass thrives in standing water. Install land drains or improve soil structure before seeding.";
    } else if (problem === 'bare') {
      seedRec = "Fast-fill repair blend";
      seedMixParts = [
        {name: "Perennial Ryegrass (<em>Lolium perenne</em>, cultivar 'Limousine')", percent: "60%"},
        {name: "Strong Creeping Red Fescue (<em>Festuca rubra rubra</em>)", percent: "25%"},
        {name: "Chewings Fescue (<em>Festuca rubra commutata</em>)", percent: "15%"},
        {name: "Cultivar recommendation: 'Limousine' or 'Axcella'", percent: "-"},
        {name: "Sowing rate: 35 to 40 g/m2", percent: "-"},
        {name: "Germination: 7 to 10 days", percent: "-"},
        {name: "Address dog urine, shade or compaction or patches return", percent: "-"},
        {name: "Water twice daily for first 2 weeks after sowing", percent: "-"},
      ];
      seedNotes = "Fast-germinating ryegrass fills bare patches within 7 to 10 days. The fescues add long-term density. Address the cause of bare patches (dogs, shade, disease, compaction) or they will return.";
    } else {
      seedRec = "Premium ornamental blend";
      seedMixParts = [
        {name: "Browntop Bent (<em>Agrostis capillaris</em>)", percent: "30%"},
        {name: "Chewings Fescue (<em>Festuca rubra commutata</em>)", percent: "30%"},
        {name: "Velvet Bent (<em>Agrostis canina</em>)", percent: "20%"},
        {name: "Slender Creeping Red Fescue (<em>Festuca rubra litoralis</em>)", percent: "20%"},
        {name: "Cultivar recommendation: 'Bargena' or 'Viktoria'", percent: "-"},
        {name: "Sowing rate: 15 to 20 g/m2 (fine seed)", percent: "-"},
        {name: "Requires cylinder mower and 10mm cut", percent: "-"},
        {name: "Feed every 6 weeks through growing season", percent: "-"},
      ];
      seedNotes = "A fine, dense, ornamental sward for a show lawn. Bentgrass gives the bowling-green finish. Fescues add density and drought tolerance. Requires a cylinder mower and regular feeding.";
    }

    var sunLabel = { 'full-sun': 'full sun', 'partial-shade': 'partial shade', 'full-shade': 'full shade' }[sunExposure];

    // Build the seed mix display - first 3 parts visible, rest blurred
    var mixHtml = '<div class="calc-seed-list">';
    seedMixParts.forEach(function(part, i) {
      if (i < 3) {
        mixHtml += '<div class="calc-seed-item">' +
          '<span class="calc-seed-percent">' + part.percent + '</span>' +
          '<span class="calc-seed-name">' + part.name + '</span>' +
          '</div>';
      } else {
        mixHtml += '<div class="calc-seed-item calc-seed-item--blurred">' +
          '<span class="calc-seed-percent">' + part.percent + '</span>' +
          '<span class="calc-seed-name">' + part.name + '</span>' +
          '</div>';
      }
    });
    mixHtml += '</div>';

    // Build the method/how-to section - first 3 steps visible, rest blurred
    var methodSteps = [
      "Scarify the lawn to remove thatch and dead moss. Use a powered scarifier for lawns over 50 m2.",
      "Aerate using a hollow-tine aerator. This relieves compaction and improves drainage and root growth.",
      "Top-dress with a 70/30 sand/soil mix, working it into the holes with a lute or the back of a rake.",
      "Sow the seed at the recommended rate using a broadcast spreader for even coverage.",
      "Lightly rake the seed into the top 5 to 10mm of soil. Do not bury it too deep or it will not germinate.",
      "Water gently with a fine rose. Keep the surface moist for 2 to 3 weeks until germination.",
      "Apply a starter fertiliser high in phosphorus to encourage root development in the new seedlings.",
      "First cut: when grass reaches 75 to 80mm, remove no more than one third of the height.",
      "Keep off the lawn for 4 to 6 weeks after sowing to allow the new roots to establish.",
      "Overseed again in 6 months if any thin patches remain. Autumn establishment is best.",
    ];
    var methodHtml = '<div class="calc-method">' +
      '<h4>How this is done (10-step renovation method)</h4>' +
      '<ol class="calc-method-list">';
    methodSteps.forEach(function(step, i) {
      if (i < 3) {
        methodHtml += '<li>' + step + '</li>';
      } else {
        methodHtml += '<li class="calc-method-step--blurred">' + step + '</li>';
      }
    });
    methodHtml += '</ol>' +
      '<div class="calc-locked-cta">' +
        '<div class="calc-locked-cta__content">' +
          '<strong>' + '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;display:inline-block;vertical-align:middle;margin-right:4px;"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>' + ' Want the full method?</strong>' +
          '<p>The remaining 7 steps, cultivar names, sowing rates and timing are available via a detailed quote or our Lawn Renovation Guide PDF.</p>' +
        '</div>' +
        '<div class="calc-locked-cta__actions">' +
          '<a class="btn btn-primary" href="/chilterngardenmaintenance-updatedsite/booking/">Get a quote</a>' +
          '<a class="btn btn-ghost" href="/chilterngardenmaintenance-updatedsite/guides/">View guides</a>' +
        '</div>' +
      '</div>' +
      '</div>';

    var summary = "<strong>Recommended seed blend:</strong> " + seedRec + "<br>" +
      "<strong>Seed mix breakdown:</strong><br>" +
      mixHtml +
      "<em style='font-size:.85rem;color:rgba(255,255,255,.7);display:block;margin:.6rem 0 .8rem;'>" + seedNotes + "</em>" +
      "<strong>Lawn size:</strong> " + size + " m2<br>" +
      "<strong>Conditions:</strong> " + sunLabel + ", " + soilType + " soil, " + trafficLevel + " traffic<br>" +
      "<strong>Main problem:</strong> " + problem.replace('-', ' ') + "<br><br>" +
      methodHtml;

    showResult('lawn', seedRec, summary);
  };

  /* ---- WILDFLOWER SEED SELECTOR ----
     Recommends specific wildflower seed species based on soil, light,
     look and colour preference. First 3 varieties are shown clearly,
     the rest are blurred. A "how to" method section shows the first 3
     steps, then blurs. CTA after blurred content links to quote form.
  */
