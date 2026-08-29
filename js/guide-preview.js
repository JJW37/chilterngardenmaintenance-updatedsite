(function () {
  'use strict';

  var guideTitle = document.getElementById('guidePreviewTitle');
  var guideSummary = document.getElementById('guidePreviewSummary');
  var guideFocus = document.getElementById('guidePreviewFocus');
  var guideOutcomes = document.getElementById('guidePreviewOutcomes');
  var guideArticle = document.getElementById('guidePreviewArticle');
  var guideAssessment = document.getElementById('guidePreviewAssessment');
  var guideAnalysis = document.getElementById('guidePreviewAnalysis');
  var guideRequest = document.getElementById('guidePreviewRequest');
  if (!guideTitle || !guideSummary || !guideOutcomes) return;

  var categories = {
    lawn: {
      name: 'Lawn recovery',
      article: '/chilterngardenmaintenance-updatedsite/tips/why-lawn-patchy-how-to-fix.html',
      articleLabel: 'Read the free lawn recovery article',
      assessmentSubject: 'lawn-care',
      analysis: '/chilterngardenmaintenance-updatedsite/services/garden-analysis-report.html',
      summary: 'A practical planning guide for gardeners who want to improve a lawn without assuming every patch, moss problem or thin area has the same cause.',
      outcomes: [
        'Recognise the visible conditions that should change the recovery route.',
        'Choose an appropriate preparation and seed or repair approach before spending on materials.',
        'Plan timing, watering and protection after the work is done.',
        'Avoid common false fixes that make a lawn look better briefly but do not address the cause.',
        'Know when drainage, soil or repeated failure deserves closer on-site analysis.'
      ]
    },
    bedding: {
      name: 'Bedding and borders',
      article: '/chilterngardenmaintenance-updatedsite/tips/build-better-borders-chalky-ground.html',
      articleLabel: 'Read the free border-planning article',
      assessmentSubject: 'bedding-themes',
      analysis: '/chilterngardenmaintenance-updatedsite/services/garden-analysis-report.html',
      summary: 'A practical planning guide for gardeners choosing a border direction that fits the garden, season and maintenance appetite — not just an attractive picture.',
      outcomes: [
        'Compare planting styles against light, soil, season and the time available to maintain them.',
        'Build a palette with height, colour and rhythm rather than a disconnected plant list.',
        'Plan the order of planting and the early-care period that protects the result.',
        'Understand the trade-offs between pollinator value, formality, flowering length and maintenance.',
        'Recognise when a planting decision depends on an on-site soil, shade or drainage review.'
      ]
    },
    design: {
      name: 'Garden design',
      article: '/chilterngardenmaintenance-updatedsite/tips/plan-garden-renovation-in-stages.html',
      articleLabel: 'Read the free staged-renovation article',
      assessmentSubject: 'garden-design',
      analysis: '/chilterngardenmaintenance-updatedsite/services/garden-analysis-report.html',
      summary: 'A practical design guide for gardeners turning an idea into a staged, usable plan before purchasing plants, materials or construction work.',
      outcomes: [
        'Turn a style or aspiration into a sequence of practical garden decisions.',
        'Balance use, circulation, planting, views and maintenance from the outset.',
        'Separate the work that can sensibly be phased from work that should be coordinated together.',
        'Prepare a clearer brief for planting, landscaping or garden construction decisions.',
        'Know when dimensions, levels, access or drainage mean that an on-site review is needed.'
      ]
    },
    skills: {
      name: 'Gardener skills',
      article: '/chilterngardenmaintenance-updatedsite/tips/',
      articleLabel: 'Browse free practical garden knowledge',
      assessmentSubject: 'gardener-skills',
      analysis: '/chilterngardenmaintenance-updatedsite/services/garden-analysis-report.html',
      summary: 'A practical skills guide for gardeners who want to understand a task, prepare properly and recognise the point at which local conditions change the answer.',
      outcomes: [
        'Understand the purpose of the task and the result that realistic good practice can achieve.',
        'Choose suitable timing, tools and preparation before beginning.',
        'Follow a practical sequence rather than relying on a single quick tip.',
        'Spot the common mistakes that create extra work or damage plants and lawns.',
        'Know which observations should lead to a more tailored CGM recommendation.'
      ]
    }
  };

  var guides = {
    'shady-lawn-reseed': { title: 'Shady Lawn Reseed Guide', category: 'lawn', focus: 'Focus: building a lawn recovery route where reduced light changes seed choice, preparation and expectations.' },
    'light-exposed-lawn-reseed': { title: 'Light Exposed Lawn Reseed Guide', category: 'lawn', focus: 'Focus: preparing and protecting a lawn in bright, exposed conditions where moisture loss and wear matter.' },
    'dog-heavy-footfall-lawn-reseed': { title: 'Dog and Heavy Footfall Lawn Reseed Guide', category: 'lawn', focus: 'Focus: creating a recovery plan for a lawn under repeated use, traffic and pet pressure.' },
    'moss-heavy-lawn-reseed': { title: 'Moss Heavy Lawn Reseed Guide', category: 'lawn', focus: 'Focus: planning what to investigate and prepare before treating moss or reseeding.' },
    'cricket-pitch-lawn': { title: 'The Cricket Pitch Lawn', category: 'lawn', focus: 'Focus: aiming for a finer, more intensively cared-for lawn with a realistic maintenance rhythm.' },
    'best-lawn-in-the-street': { title: 'Best Lawn In The Street', category: 'lawn', focus: 'Focus: creating a high-quality lawn plan without treating appearance as a substitute for health.' },
    'cotswold-bedding-design': { title: 'Cotswold Bedding Design Plan', category: 'bedding', focus: 'Focus: translating a Cotswold planting character into a palette and layout that suit the garden.' },
    'cottage-bedding-design': { title: 'Cottage Bedding Design Plan', category: 'bedding', focus: 'Focus: building a cottage-style border with enough structure to remain manageable.' },
    'mediterranean-bedding-design': { title: 'Mediterranean Bedding Design Plan', category: 'bedding', focus: 'Focus: matching dry, sunny planting ideas to the actual drainage, shelter and winter conditions available.' },
    'middle-eastern-bedding-design': { title: 'Middle Eastern Bedding Design Plan', category: 'bedding', focus: 'Focus: creating a warm, textural planting direction while retaining a practical care plan.' },
    'pollinator-attraction-design': { title: 'Pollinator Attraction Design Plan', category: 'bedding', focus: 'Focus: creating a planting plan that gives pollinators continuity through the season.' },
    'vintage-botanical-design': { title: 'Vintage Botanical Design Plan', category: 'bedding', focus: 'Focus: shaping a botanical planting mood with choices that still perform in a working garden.' },
    'traditional-english-design': { title: 'Traditional English Design Plan', category: 'bedding', focus: 'Focus: combining familiar English-garden planting with practical structure and maintenance.' },
    'wildflower-design': { title: 'Wildflower Design Plan', category: 'bedding', focus: 'Focus: deciding whether a wildflower approach fits the site and how to establish it responsibly.' },
    'cottage-garden-design': { title: 'Cottage Garden Design', category: 'design', focus: 'Focus: turning a cottage-garden direction into a staged plan for the actual garden.' },
    'pollinator-garden-design': { title: 'Pollinator Garden Design', category: 'design', focus: 'Focus: designing for pollinator value across the whole garden, not just adding a few flowers.' },
    'english-garden-design': { title: 'English Garden Design', category: 'design', focus: 'Focus: shaping a cohesive English-garden character through layout, planting and sequence.' },
    'wildflower-garden-design': { title: 'Wildflower Garden Design', category: 'design', focus: 'Focus: planning a wildflower area with realistic establishment, management and site expectations.' },
    'topiary-garden-design': { title: 'Topiary Garden Design', category: 'design', focus: 'Focus: planning formal structure and topiary with the maintenance it will require built in.' },
    'lawn-design': { title: 'Lawn Design', category: 'design', focus: 'Focus: making the lawn a useful structural part of the whole garden rather than an afterthought.' },
    'modern-tropical-design': { title: 'Modern Tropical Design', category: 'design', focus: 'Focus: translating a bold tropical style into a viable UK garden plan.' },
    'minimalist-design': { title: 'Minimalist Design', category: 'design', focus: 'Focus: designing a restrained, calm garden where materials, proportion and maintenance do the work.' },
    'year-round-blooming-design': { title: 'Year Round Blooming Garden Design', category: 'design', focus: 'Focus: planning layers of interest across the year without creating a planting list that cannot be sustained.' },
    'scarification-new-lawn': { title: 'Scarification and New Lawn Guide', category: 'skills', focus: 'Focus: understanding when scarification helps, how to do it and how it fits into a recovery plan.' },
    'feeding-lawns-plants-shrubs': { title: 'Feeding Lawns, Plants and Shrubs: How and When', category: 'skills', focus: 'Focus: matching feeding choices and timing to the plant or lawn rather than applying a blanket treatment.' },
    'vegetable-growing': { title: 'Vegetable Growing Guide', category: 'skills', focus: 'Focus: creating a realistic growing plan from site choice to sowing and seasonal care.' },
    'colour-matching': { title: 'Colour Matching Guide', category: 'skills', focus: 'Focus: using colour with foliage, light and flowering sequence to make a border feel intentional.' },
    'organic-gardening': { title: 'Organic Gardening Guide', category: 'skills', focus: 'Focus: building a practical organic-care approach around soil, plant health and prevention.' },
    'wildflower-guide': { title: 'Wildflower Guide', category: 'skills', focus: 'Focus: learning how wildflower planting differs from ordinary border planting and lawn care.' }
  };

  function fallback() {
    return {
      title: 'Chiltern Guide preview',
      category: 'skills',
      focus: 'Choose a guide from the Chiltern Guides library to see the practical outcomes it covers.'
    };
  }

  var params = new URLSearchParams(window.location.search);
  var slug = params.get('guide') || '';
  var guide = guides[slug] || fallback();
  var category = categories[guide.category] || categories.skills;

  guideTitle.textContent = guide.title;
  guideSummary.textContent = category.summary;
  guideFocus.textContent = guide.focus;
  document.title = guide.title + ' | CGM Guide Preview';

  category.outcomes.forEach(function (outcome) {
    var item = document.createElement('li');
    item.textContent = outcome;
    guideOutcomes.appendChild(item);
  });

  if (guideArticle) {
    guideArticle.href = category.article;
    guideArticle.textContent = category.articleLabel;
  }
  if (guideAssessment) guideAssessment.href = '/chilterngardenmaintenance-updatedsite/assessment/?source=guide-preview&subject=' + encodeURIComponent(slug || guide.category);
  if (guideAnalysis) guideAnalysis.href = category.analysis;
  if (guideRequest) guideRequest.href = '/chilterngardenmaintenance-updatedsite/booking/?guide=' + encodeURIComponent(slug || 'guide-library');
}());
