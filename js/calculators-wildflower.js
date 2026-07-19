/* Calculator: calcWildflower */

  window.calcWildflower = function () {
    var area = numberValue('wf-area');
    var soil = radioValue('wf-soil');
    var sun = radioValue('wf-sun');
    var look = radioValue('wf-look');
    var colour = radioValue('wf-colour');
    var established = radioValue('wf-established');

    if (!soil || !sun || !look || !colour || !established) {
      alert("Please answer all the questions to get your wildflower mix.");
      return;
    }
    if (!area || area < 1) area = 50;

    // Build recommendation based on inputs
    var recName = "";
    var recNotes = "";
    var seedParts = [];

    // Determine base mix by soil + look
    if (soil === 'chalk') {
      recName = "Chiltern chalk meadow mix";
      seedParts = [
        {name: "Kidney Vetch (<em>Anthyllis vulneraria</em>)", percent: "15%"},
        {name: "Salad Burnet (<em>Sanguisorba minor</em>)", percent: "12%"},
        {name: "Small Scabious (<em>Scabiosa columbaria</em>)", percent: "10%"},
        {name: "Wild Marjoram (<em>Origanum vulgare</em>)", percent: "8%"},
        {name: "Horseshoe Vetch (<em>Hippocrepis comosa</em>)", percent: "7%"},
        {name: "Birdsfoot Trefoil (<em>Lotus corniculatus</em>)", percent: "7%"},
        {name: "Oxeye Daisy (<em>Leucanthemum vulgare</em>)", percent: "6%"},
        {name: "Field Scabious (<em>Knautia arvensis</em>)", percent: "5%"},
        {name: "Plus 8 more chalk-loving species", percent: "30%"},
      ];
      recNotes = "Calcareous chalk soils support a distinctive flora. This mix thrives on the free-draining alkaline soils of the Chilterns and includes species that host rare butterflies like the Chalkhill Blue.";
    } else if (soil === 'clay' || look === 'wet-tolerant') {
      recName = "Clay and damp meadow mix";
      seedParts = [
        {name: "Meadow Buttercup (<em>Ranunculus acris</em>)", percent: "15%"},
        {name: "Ragged Robin (<em>Lychnis flos-cuculi</em>)", percent: "12%"},
        {name: "Great Burnet (<em>Sanguisorba officinalis</em>)", percent: "10%"},
        {name: "Meadowsweet (<em>Filipendula ulmaria</em>)", percent: "8%"},
        {name: "Devils-bit Scabious (<em>Succisa pratensis</em>)", percent: "7%"},
        {name: "Purple Loosestrife (<em>Lythrum salicaria</em>)", percent: "7%"},
        {name: "Marsh Marigold (<em>Caltha palustris</em>)", percent: "6%"},
        {name: "Gipsywort (<em>Lycopus europaeus</em>)", percent: "5%"},
        {name: "Plus 7 more damp-tolerant species", percent: "30%"},
      ];
      recNotes = "Heavy clay and damp soils need species adapted to wetter conditions. This mix suits low-lying areas, pond edges and gardens with poor drainage.";
    } else if (look === 'annual') {
      recName = "Annual cornfield mix";
      seedParts = [
        {name: "Cornflower (<em>Centaurea cyanus</em>)", percent: "20%"},
        {name: "Corn Poppy (<em>Papaver rhoeas</em>)", percent: "20%"},
        {name: "Corn Marigold (<em>Glebionis segetum</em>)", percent: "15%"},
        {name: "Corncockle (<em>Agrostemma githago</em>)", percent: "10%"},
        {name: "Corn Chamomile (<em>Anthemis arvensis</em>)", percent: "10%"},
        {name: "Sowing rate: 2 to 5 g/m2", percent: "-"},
        {name: "Best sown in autumn or early spring", percent: "-"},
        {name: "Annuals die after flowering, reseed for next year", percent: "-"},
        {name: "Mix with 80% barley or oat seed as a nurse crop", percent: "-"},
      ];
      recNotes = "Bright, reliable first-year colour. Annual cornfield mixes flower within 10 to 12 weeks of sowing and are perfect for new gardeners or temporary displays.";
    } else if (look === 'low-growing') {
      recName = "Low-growing wildflower mix";
      seedParts = [
        {name: "Selfheal (<em>Prunella vulgaris</em>)", percent: "20%"},
        {name: "Birdsfoot Trefoil (<em>Lotus corniculatus</em>)", percent: "15%"},
        {name: "Thyme-leaved Sandwort (<em>Arenaria serpyllifolia</em>)", percent: "12%"},
        {name: "Wild Thyme (<em>Thymus polytrichus</em>)", percent: "10%"},
        {name: "Slender St Johns Wort (<em>Hypericum pulchrum</em>)", percent: "8%"},
        {name: "Sheeps Sorrel (<em>Rumex acetosella</em>)", percent: "7%"},
        {name: "Fairy Flax (<em>Linum catharticum</em>)", percent: "6%"},
        {name: "Plus 5 more low-growing species", percent: "22%"},
        {name: "Sowing rate: 1 to 2 g/m2 of pure wildflower seed", percent: "-"},
      ];
      recNotes = "Compact species that stay under 30cm tall. Ideal for front of borders, paths, rockeries and lawn edges where height would be a problem.";
    } else if (look === 'cottage') {
      recName = "Cottage garden wildflower mix";
      seedParts = [
        {name: "Oxeye Daisy (<em>Leucanthemum vulgare</em>)", percent: "12%"},
        {name: "Red Campion (<em>Silene dioica</em>)", percent: "10%"},
        {name: "Field Scabious (<em>Knautia arvensis</em>)", percent: "8%"},
        {name: "Foxglove (<em>Digitalis purpurea</em>)", percent: "8%"},
        {name: "Ladies Bedstraw (<em>Galium verum</em>)", percent: "7%"},
        {name: "Teasel (<em>Dipsacus fullonum</em>)", percent: "6%"},
        {name: "Verbascum (<em>Verbascum nigrum</em>)", percent: "5%"},
        {name: "Plus 9 more cottage garden species", percent: "44%"},
        {name: "Sowing rate: 3 to 5 g/m2", percent: "-"},
      ];
      recNotes = "A colourful mix of cottage garden favourites and native wildflowers. Taller and more dramatic than a meadow mix, with a long flowering season from May to September.";
    } else {
      // Default: traditional meadow
      recName = "Traditional wildflower meadow mix";
      seedParts = [
        {name: "Oxeye Daisy (<em>Leucanthemum vulgare</em>)", percent: "15%"},
        {name: "Birdsfoot Trefoil (<em>Lotus corniculatus</em>)", percent: "12%"},
        {name: "Selfheal (<em>Prunella vulgaris</em>)", percent: "10%"},
        {name: "Field Scabious (<em>Knautia arvensis</em>)", percent: "8%"},
        {name: "Knapweed (<em>Centaurea nigra</em>)", percent: "7%"},
        {name: "Yarrow (<em>Achillea millefolium</em>)", percent: "7%"},
        {name: "Ribwort Plantain (<em>Plantago lanceolata</em>)", percent: "6%"},
        {name: "Plus 10 more meadow species", percent: "25%"},
        {name: "Grass component: 20% fine fescues and bents", percent: "-"},
        {name: "Sowing rate: 4 g/m2 wildflower + 1 g/m2 grass", percent: "-"},
      ];
      recNotes = "A balanced perennial meadow that comes back year after year. The 80/20 wildflower to grass ratio prevents any single species dominating and gives a naturalistic look.";
    }

    // Adjust notes for colour preference
    var colourNote = "";
    if (colour === 'pink-purple') {
      colourNote = " Pink and purple dominant species emphasised: Knapweed, Field Scabious, Red Campion, Selfheal.";
    } else if (colour === 'yellow-orange') {
      colourNote = " Yellow and orange dominant species emphasised: Birdsfoot Trefoil, Kidney Vetch, Buttercup, Ladys Bedstraw.";
    } else if (colour === 'white-blue') {
      colourNote = " White and blue dominant species emphasised: Oxeye Daisy, Field Scabious, Meadow Cranesbill, Selfheal.";
    }

    // Build the seed list display - first 3 visible, rest blurred
    var mixHtml = '<div class="calc-seed-list">';
    seedParts.forEach(function(part, i) {
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

    // Build the method section - first 3 steps visible, rest blurred
    var methodSteps = [
      "Clear the area of existing vegetation. Use a systemic weedkiller or solarise with black plastic for 6 to 8 weeks in summer.",
      "Cultivate the top 100 to 150mm of soil to a fine tilth. Remove all perennial weed roots, especially couch grass and bindweed.",
      "Firm the soil by rolling or treading, then rake level. A firm seedbed prevents seed washing away and gives even germination.",
      "Mix the seed with dry silver sand at 1 part seed to 4 parts sand. This makes it easier to broadcast evenly and shows where you have sown.",
      "Broadcast by hand in two passes at right angles to each other for even coverage. Do not rake in - wildflower seed needs light to germinate.",
      "Roll or tread the seed in lightly to ensure soil contact. Water gently if no rain is forecast within 48 hours.",
      "Do not fertilise. Wildflowers thrive on poor soil. Rich soil produces lush grass that smothers the wildflowers.",
      "First year: cut to 50mm whenever growth reaches 150mm. This controls annual weeds and lets perennials establish.",
      "Second year onwards: cut once in late July or August after flowering. Leave the cuttings for 3 to 5 days so seed drops, then remove.",
      "Overseed bare patches in autumn at 2 g/m2. Most wildflowers germinate best after a cold winter period (stratification).",
    ];
    var methodHtml = '<div class="calc-method">' +
      '<h4>How to establish your wildflower area (10-step method)</h4>' +
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
          '<p>The remaining 7 steps, full species list, sowing rates and maintenance schedule are available via a detailed quote or our Wildflower Establishment Guide PDF.</p>' +
        '</div>' +
        '<div class="calc-locked-cta__actions">' +
          '<a class="btn btn-primary" href="/chilterngardenmaintenance-updatedsite/booking/">Get a quote</a>' +
          '<a class="btn btn-ghost" href="/chilterngardenmaintenance-updatedsite/guides/">View guides</a>' +
        '</div>' +
      '</div>' +
      '</div>';

    var sunLabel = { 'full-sun': 'full sun', 'partial-shade': 'partial shade', 'full-shade': 'full shade' }[sun];
    var lookLabel = {
      'meadow': 'traditional meadow',
      'cottage': 'cottage garden',
      'annual': 'annual cornfield',
      'low-growing': 'low-growing',
      'wet-tolerant': 'wet-tolerant'
    }[look];
    var colourLabel = {
      'mixed': 'mixed colours',
      'pink-purple': 'pink and purple',
      'yellow-orange': 'yellow and orange',
      'white-blue': 'white and blue'
    }[colour];
    var estLabel = {
      'bare-soil': 'bare soil (new area)',
      'existing-grass': 'existing grass (overseed)',
      'weedy': 'weedy (needs clearing)'
    }[established];

    var summary = "<strong>Recommended seed mix:</strong> " + recName + "<br><br>" +
      "<strong>Seed mix breakdown:</strong><br>" +
      mixHtml +
      "<em style='font-size:.85rem;color:rgba(255,255,255,.7);display:block;margin:.6rem 0 .8rem;'>" + recNotes + colourNote + "</em>" +
      "<strong>Area:</strong> " + area + " m2<br>" +
      "<strong>Soil:</strong> " + soil + "<br>" +
      "<strong>Sun:</strong> " + sunLabel + "<br>" +
      "<strong>Look:</strong> " + lookLabel + "<br>" +
      "<strong>Colour:</strong> " + colourLabel + "<br>" +
      "<strong>Establishment:</strong> " + estLabel + "<br><br>" +
      methodHtml;

    showResult('wildflower', recName, summary);
  };

  /* ---- PRESSURE WASH CALCULATOR ----
     Uses Levels 1-4 instead of hours or cost.
     Level 1 - Smaller Pressure Washing
     Level 2 - Significant Pressure Washing
     Level 3 - Large Pressure Washing
     Level 4 - Major Pressure Washing

     Algorithm: Calculate a raw score from inputs, then divide into quarters.
  */
