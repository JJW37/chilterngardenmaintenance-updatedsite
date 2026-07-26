/* Homepage popular-articles pool + rendering logic.
   Extracted from index.html for caching. */
  (function() {
    var articlePool = [
    {"title": "How Much Does Garden Clearance Cost in the UK?", "category": "Garden Prices & Costs", "intro": "Garden clearance prices in the UK vary more than almost any other garden service. A small back garde", "slug": "garden-clearance-cost"},
    {"title": "How Much Does Regular Garden Maintenance Cost in 2026?", "category": "Garden Prices & Costs", "intro": "Regular garden maintenance is the most cost effective way to keep your garden looking good without s", "slug": "garden-maintenance-cost"},
    {"title": "When Should Hedges Be Cut in the UK?", "category": "Hedges, Pruning & Cutting Times", "intro": "Hedge cutting timing matters more than most people realise. Cut at the wrong time and you can lose a", "slug": "when-to-cut-hedges-uk"},
    {"title": "How to Restore an Overgrown Garden: A Step by Step Guide", "category": "Garden Clearance & Tidy-Up Guides", "intro": "An overgrown garden can feel overwhelming. Whether you have just moved into a property with a jungle", "slug": "restore-overgrown-garden"},
    {"title": "Best Low-Maintenance Plants for Chiltern Gardens", "category": "Plants, Borders & Planting Ideas", "intro": "Chiltern gardens sit on chalk, with free-draining alkaline soil that suits some plants perfectly and", "slug": "low-maintenance-plants-chilterns"},
    {"title": "Why Is My Lawn Full of Moss? Causes and Solutions", "category": "Lawn Care & Lawn Repair", "intro": "Moss in lawns is one of the most common complaints we hear from UK garden owners. The good news is t", "slug": "why-is-my-lawn-full-of-moss"},
    {"title": "What to Do With a Neglected Garden Before Selling a House", "category": "Gardens for Selling or Renting", "intro": "When you are selling a house, the garden is the first thing buyers see from the outside and the last", "slug": "neglected-garden-before-selling"},
    {"title": "Garden Tidy-Up Checklist Before Summer", "category": "Seasonal Garden Jobs", "intro": "Spring is the time to get the garden ready for summer. A few focused weekends of work in March, Apri", "slug": "garden-tidy-checklist-summer"},
    {"title": "How Often Should a Gardener Visit?", "category": "Regular Garden Maintenance", "intro": "One of the most common questions we get asked is how often a gardener should visit. The answer depen", "slug": "how-often-should-gardener-visit"},
    {"title": "Is It Cheaper to Clear a Garden Yourself or Hire Someone?", "category": "Garden Prices & Costs", "intro": "It is tempting to think that doing garden clearance yourself will save money. Sometimes it does. Oft", "slug": "diy-vs-professional-garden-clearance"},
    {"title": "Best Time to Plant Hedges in the UK", "category": "Hedges, Pruning & Cutting Times", "intro": "Planting a hedge is one of the most rewarding things you can do in a UK garden, but getting the timi", "slug": "best-time-to-plant-hedges-uk"},
    {"title": "How to Improve Clay Soil in Your Garden", "category": "Soil, Compost & Mulch", "intro": "Clay soil gets a bad press, but it is actually one of the most fertile soil types in the UK. The cha", "slug": "how-to-improve-clay-soil-garden"},
    {"title": "Composting in the UK: A Complete Beginner Guide", "category": "Soil, Compost & Mulch", "intro": "Composting is the single most useful thing you can do in a UK garden. It turns kitchen and garden wa", "slug": "composting-guide-uk"},
    {"title": "Winter Garden Tasks Checklist for UK Gardens", "category": "Seasonal Garden Jobs", "intro": "Winter is not a time to forget the garden. From December to February there is plenty to do that sets", "slug": "winter-garden-tasks-checklist"},
    {"title": "Autumn Garden Checklist: What to Do in October and November", "category": "Seasonal Garden Jobs", "intro": "Autumn is the busiest season in a UK garden. The transition from summer growth to winter dormancy cr", "slug": "autumn-garden-checklist"},
    {"title": "Spring Garden Checklist: February to May Jobs", "category": "Seasonal Garden Jobs", "intro": "Spring is the most exciting and demanding season in a UK garden. From the first signs of life in Feb", "slug": "spring-garden-checklist"},
    {"title": "Container Gardening Tips for UK Gardens", "category": "Garden Clearance & Tidy-Up Guides", "intro": "Container gardening is the answer for small gardens, rented properties, paved areas and anyone who w", "slug": "container-gardening-tips-uk"},
    {"title": "Best Plants for Shade Gardens in the UK", "category": "Plants, Borders & Planting Ideas", "intro": "Shade is one of the most common garden challenges in the UK, whether from buildings, fences, trees o", "slug": "shade-garden-plants-uk"},
    {"title": "How to Create a Wildlife Garden in the UK", "category": "Wildlife & Wildflower Gardens", "intro": "A wildlife garden is one of the most rewarding things you can create. By providing food, shelter and", "slug": "wildlife-garden-guide-uk"},
    {"title": "How to Prevent Weeds in Garden Beds Long Term", "category": "Regular Garden Maintenance", "intro": "Weeds are the number one frustration for UK gardeners. They seem to appear from nowhere, grow faster", "slug": "preventing-weeds-garden-beds"},
    {"title": "How to Prepare Your Lawn for Summer", "category": "Lawn Care & Lawn Repair", "intro": "A British summer can mean six weeks of drought followed by a thunderstorm, and your lawn has to cope", "slug": "how-to-prepare-lawn-for-summer"},
    {"title": "Autumn Lawn Care Guide for UK Gardens", "category": "Lawn Care & Lawn Repair", "intro": "Autumn is when you do the serious work on a UK lawn. The grass is still growing, the soil is warm, a", "slug": "autumn-lawn-care-guide"},
    {"title": "When to Plant Trees and Shrubs in the UK", "category": "Plants, Borders & Planting Ideas", "intro": "Plant a tree at the right time and it will establish in a single season. Plant at the wrong time and", "slug": "when-to-plant-trees-shrubs-uk"},
    {"title": "Mulching Guide: Benefits, Types and How to Apply", "category": "Soil, Compost & Mulch", "intro": "Mulch is the single most useful thing you can do for your garden soil. A layer of organic material o", "slug": "mulching-guide-benefits-types"},
    {"title": "Common UK Garden Pests and How to Control Them", "category": "Garden Problems & Weed Control", "intro": "Every UK garden has pests. The aim is not to eliminate them, which is impossible, but to keep them a", "slug": "common-uk-garden-pests-control"},
    {"title": "How to Water Your Garden During UK Droughts", "category": "Regular Garden Maintenance", "intro": "UK summers are getting drier, and hosepipe bans are now a regular feature of garden life in southern", "slug": "watering-garden-drought-uk"},
    {"title": "Choosing the Right Compost Bin for Your Garden", "category": "Soil, Compost & Mulch", "intro": "A compost bin is one of the best investments you can make in your garden. It turns kitchen and garde", "slug": "choosing-right-compost-bin"},
    {"title": "Pruning Guide: When and How to Prune UK Shrubs", "category": "Hedges, Pruning & Cutting Times", "intro": "Pruning is the garden job that worries people most, but the basics are simple. Prune at the right ti", "slug": "pruning-guide-uk-shrubs"},
    {"title": "Raised Bed Gardening Guide for UK Gardens", "category": "Garden Clearance & Tidy-Up Guides", "intro": "Raised beds are one of the most useful features you can add to a UK garden. They improve drainage on", "slug": "raised-bed-gardening-guide-uk"},
    {"title": "How Much Does a Large Garden Tidy-Up Cost in Oxfordshire?", "category": "Garden Prices & Costs", "intro": "Large gardens in Oxfordshire, from the chalk downland around Watlington and Chinnor to the clay vale", "slug": "large-garden-tidy-cost-oxfordshire"},
    {"title": "Garden Clearance Costs in Buckinghamshire: Small, Medium and Large Gardens", "category": "Garden Prices & Costs", "intro": "Buckinghamshire gardens range from compact courtyards in Aylesbury to substantial rural plots in the", "slug": "garden-clearance-costs-buckinghamshire"},
    {"title": "How Much Does Hedge Cutting Cost in the Chilterns?", "category": "Hedges, Pruning & Cutting Times", "intro": "The Chilterns has more hedges per mile than almost anywhere else in southern England. Beech, yew, ho", "slug": "hedge-cutting-cost-chilterns"},
    {"title": "How Much Does Lawn Renovation Cost in the UK?", "category": "Garden Prices & Costs", "intro": "Lawn renovation is the middle ground between a simple feed and a full returf. It is the right job wh", "slug": "lawn-renovation-cost-uk"},
    {"title": "How Much Does It Cost to Clear Brambles, Ivy and Overgrowth?", "category": "Garden Prices & Costs", "intro": "Brambles and ivy are the two plants that take over a neglected garden fastest. A single season of ne", "slug": "clear-brambles-ivy-overgrowth-cost"},
    {"title": "How Much Should You Budget for a Full Garden Reset?", "category": "Garden Prices & Costs", "intro": "A full garden reset is the big one. It is what you do when the garden has been neglected for years, ", "slug": "full-garden-reset-budget"},
    {"title": "One-Off Garden Tidy vs Regular Maintenance: Which Is Better Value?", "category": "Garden Prices & Costs", "intro": "Many garden owners face this choice: pay for a one-off tidy when the garden gets out of hand, or sig", "slug": "one-off-tidy-vs-regular-maintenance"},
    {"title": "Garden Waste Removal Costs: What Affects the Price?", "category": "Garden Prices & Costs", "intro": "Garden waste removal is often the hidden cost of any clearance or tidy-up. The cutting and digging i", "slug": "garden-waste-removal-costs"},
    {"title": "Why Cheap Garden Clearance Quotes Often Cost More Later", "category": "Garden Prices & Costs", "intro": "We have all seen the advertisements. Garden clearance from 99 pounds. Cheapest in the area. No job t", "slug": "cheap-garden-clearance-quotes-hidden-costs"},
    {"title": "How Much Does Estate Garden Maintenance Cost in Buckinghamshire and Oxfordshire?", "category": "Garden Prices & Costs", "intro": "Estate gardens are a different proposition to family gardens. They are larger, more complex, and req", "slug": "estate-garden-maintenance-cost"},
    {"title": "Lawn Renovation in Spring: What UK Gardens Need After Winter", "category": "Lawn Care & Lawn Repair", "intro": "Spring is the natural time for lawn renovation. After a wet UK winter, most lawns have accumulated t", "slug": "lawn-renovation-spring-uk"},
    {"title": "Should You Returf or Reseed Your Lawn?", "category": "Lawn Care & Lawn Repair", "intro": "If your lawn is beyond renovation, the choice is between returfing and reseeding. Both have their pl", "slug": "returf-or-reseed-lawn"},
    {"title": "Why Your Lawn Is Patchy and How to Fix It", "category": "Lawn Care & Lawn Repair", "intro": "A patchy lawn is one of the most common complaints we hear from garden owners across Oxfordshire, Bu", "slug": "why-lawn-patchy-how-to-fix"},
    {"title": "How to Repair a Lawn After Heavy Use, Dogs or Children", "category": "Lawn Care & Lawn Repair", "intro": "Family lawns take a beating. Children playing, dogs running and general foot traffic all damage the ", "slug": "repair-lawn-after-dogs-children"},
    {"title": "Lawn Scarification: When Is It Worth Doing?", "category": "Lawn Care & Lawn Repair", "intro": "Scarification is one of those lawn jobs that looks brutal but is essential for a healthy lawn. It re", "slug": "lawn-scarification-worth-doing"},
    {"title": "Aeration, Overseeding and Top Dressing Explained", "category": "Lawn Care & Lawn Repair", "intro": "Aeration, overseeding and top dressing are the three pillars of lawn renovation. They work together ", "slug": "aeration-overseeding-top-dressing-explained"},
    {"title": "How to Keep a Lawn Green During Dry Summers in Oxfordshire and Buckinghamshire", "category": "Lawn Care & Lawn Repair", "intro": "Dry summers are becoming more common in Oxfordshire and Buckinghamshire, and lawns suffer first. The", "slug": "keep-lawn-green-dry-summers-oxon-bucks"},
    {"title": "Chalk Soil in the Chilterns: What Grows Well and What Struggles", "category": "Soil, Compost & Mulch", "intro": "The Chilterns are made of chalk, and the soil reflects it. Chalky soil is alkaline, free-draining an", "slug": "chalk-soil-chilterns-what-grows-well"},
    {"title": "How to Improve Soil Before Planting a New Border", "category": "Soil, Compost & Mulch", "intro": "The single most important thing you can do for a new border is to improve the soil before you plant.", "slug": "improve-soil-before-planting-border"},
    {"title": "Topsoil vs Compost: What Should You Use in Your Garden?", "category": "Soil, Compost & Mulch", "intro": "Topsoil and compost are both soil improvers, but they do different things. Topsoil adds bulk and str", "slug": "topsoil-vs-compost-garden"},
    {"title": "Should You Use Mushroom Compost, Manure or Bark Mulch?", "category": "Soil, Compost & Mulch", "intro": "Mushroom compost, farmyard manure and bark mulch are the three most common soil improvers, but they ", "slug": "mushroom-compost-manure-bark-mulch"},
    {"title": "How to Take Control of a Large Garden Without Redesigning Everything", "category": "Garden Clearance & Tidy-Up Guides", "intro": "Large gardens can feel overwhelming. If you have inherited a big garden that has got away from you, ", "slug": "control-large-garden-without-redesigning"},
    {"title": "How to Clear Brambles Properly Without Them Coming Back", "category": "Garden Clearance & Tidy-Up Guides", "intro": "Brambles are the gardeners' enemy. They grow fast, tangle into impenetrable thickets, and regrow fro", "slug": "clear-brambles-properly-without-regrowing"},
    {"title": "How to Remove Ivy From Fences, Walls and Trees Safely", "category": "Garden Clearance & Tidy-Up Guides", "intro": "Ivy is a useful plant for wildlife and shade, but it can damage fences, walls and trees if left unch", "slug": "remove-ivy-from-fences-walls-trees"},
    {"title": "How to Tidy a Garden After Building Work", "category": "Garden Clearance & Tidy-Up Guides", "intro": "Building work can devastate a garden. Builders' vehicles compact the soil, rubble gets buried, and p", "slug": "tidy-garden-after-building-work"},
    {"title": "How to Prepare a Garden for Professional Maintenance", "category": "Garden Clearance & Tidy-Up Guides", "intro": "Starting with a professional gardener is a big step. The right preparation means your gardener can f", "slug": "prepare-garden-for-professional-maintenance"},
    {"title": "Best Plants for Chalk Soil in the Chilterns", "category": "Plants, Borders & Planting Ideas", "intro": "Chalk soil is the dominant soil type across the Chilterns, from High Wycombe to Princes Risborough. ", "slug": "best-plants-chalk-soil-chilterns"},
    {"title": "Best Drought-Tolerant Plants for South East England Gardens", "category": "Plants, Borders & Planting Ideas", "intro": "Dry summers are becoming the norm in South East England. Rather than watering constantly, choose pla", "slug": "best-drought-tolerant-plants-south-east-england"},
    {"title": "Best Plants for Privacy Along Fences and Boundaries", "category": "Plants, Borders & Planting Ideas", "intro": "Privacy is one of the most common reasons people plant along boundaries. The right plant can screen ", "slug": "best-plants-privacy-fences-boundaries"},
    {"title": "Best Evergreen Shrubs for Year-Round Structure", "category": "Plants, Borders & Planting Ideas", "intro": "Evergreen shrubs are the backbone of a garden. They provide structure, colour and shelter all year, ", "slug": "best-evergreen-shrubs-year-round-structure"},
    {"title": "Best Flowering Shrubs for Low-Maintenance Borders", "category": "Plants, Borders & Planting Ideas", "intro": "Flowering shrubs are the secret to a low-maintenance border. They provide colour, structure and inte", "slug": "best-flowering-shrubs-low-maintenance-borders"},
    {"title": "Best Hedging Plants for Privacy in Berkshire, Oxfordshire and Buckinghamshire", "category": "Plants, Borders & Planting Ideas", "intro": "Hedging is the most natural way to create privacy in a garden. The right hedge screens out neighbour", "slug": "best-hedging-plants-privacy-berks-oxon-bucks"},
    {"title": "January Garden Jobs for Oxfordshire, Berkshire and Buckinghamshire", "category": "Seasonal Garden Jobs", "intro": "January is the quietest month in the garden, but there is still plenty to do. The garden is dormant,", "slug": "january-garden-jobs-oxon-berks-bucks"},
    {"title": "March Garden Jobs in the Chilterns", "category": "Seasonal Garden Jobs", "intro": "March is when the garden wakes up. The soil is warming, the days are lengthening, and growth is star", "slug": "march-garden-jobs-chilterns"},
    {"title": "June Garden Jobs: What to Cut, Feed and Tidy", "category": "Seasonal Garden Jobs", "intro": "June is the peak growing month. Everything is growing fast, including the lawn, the hedges and the w", "slug": "june-garden-jobs-cut-feed-tidy"},
    {"title": "August Garden Jobs During Dry Weather", "category": "Seasonal Garden Jobs", "intro": "August is often the hottest and driest month in the UK. The garden needs careful management to get t", "slug": "august-garden-jobs-dry-weather"},
    {"title": "September Garden Jobs Before Autumn Takes Over", "category": "Seasonal Garden Jobs", "intro": "September is the transition month. The garden is still growing but starting to slow down. This is th", "slug": "september-garden-jobs-before-autumn"},
    {"title": "December Garden Jobs for Large UK Gardens", "category": "Seasonal Garden Jobs", "intro": "December is the quietest month in the garden, but for large gardens there is still plenty to do. The", "slug": "december-garden-jobs-large-uk-gardens"},
    {"title": "Regular Garden Maintenance for Large Gardens: What Should Be Included?", "category": "Regular Garden Maintenance", "intro": "Large gardens need a different approach to maintenance than small ones. The scale means more plannin", "slug": "regular-maintenance-large-gardens-included"},
    {"title": "Weekly vs Fortnightly Gardening: Which Does Your Garden Need?", "category": "Regular Garden Maintenance", "intro": "One of the first decisions when setting up regular garden maintenance is how often the gardener shou", "slug": "weekly-vs-fortnightly-gardening"},
    {"title": "How to Create a Wildlife-Friendly Garden Without Letting It Look Messy", "category": "Wildlife & Wildflower Gardens", "intro": "Many garden owners want to help wildlife but worry that a wildlife garden means an untidy garden. Th", "slug": "wildlife-friendly-garden-without-looking-messy"},
    {"title": "How to Deal With Brambles in an Overgrown Garden", "category": "Garden Problems & Weed Control", "intro": "Brambles are the most common problem in overgrown UK gardens. They grow fast, tangle into impenetrab", "slug": "deal-with-brambles-overgrown-garden"},
    {"title": "Why Your Garden Keeps Flooding After Heavy Rain", "category": "Garden Problems & Weed Control", "intro": "Garden flooding is becoming more common in the UK as rainfall patterns change and gardens are increa", "slug": "why-garden-flooding-after-heavy-rain"},
    {"title": "How to Fix a Garden That Has Become Unmanageable", "category": "Garden Problems & Weed Control", "intro": "An unmanageable garden is one of the most common problems we help with. Whether it has been neglecte", "slug": "fix-garden-become-unmanageable"},
    {"title": "How Much Should You Spend on the Garden Before Selling a House?", "category": "Gardens for Selling or Renting", "intro": "When selling a house, the garden is the first thing buyers see from the outside and the last thing t", "slug": "how-much-spend-on-garden-before-selling"},
    {"title": "Garden Jobs That Add Kerb Appeal Before a Valuation", "category": "Gardens for Selling or Renting", "intro": "Kerb appeal is the first impression a property makes. The front garden is a big part of that. A tidy", "slug": "garden-jobs-add-kerb-appeal-before-valuation"},
    {"title": "How to Plan a Garden Redesign Without Wasting Money", "category": "Garden Design & Layout Ideas", "intro": "A garden redesign is a significant investment. Done well, it transforms your outdoor space and adds ", "slug": "plan-garden-redesign-without-wasting-money"},
    {"title": "The 2026/27 Chilterns Heatwave Guide: Keeping Your Hillside Garden Lush During a Dry Spell", "category": "Drought & Climate-Resilient Gardens", "intro": "Heatwaves are becoming more frequent and more intense in the Chilterns. The chalky, free-draining so", "slug": "chilterns-heatwave-guide-2026-27"},
    {"title": "Beyond Mulch: How We Use Gravel and Permeable Surfaces to Conserve Water in Local Landscapes", "category": "Drought & Climate-Resilient Gardens", "intro": "Mulch is the first line of defence against drought, but it is not the only one. Gravel gardens and p", "slug": "beyond-mulch-gravel-permeable-surfaces-water-conservation"},
    {"title": "When to Pressure Wash a Patio", "category": "Patio & Pressure Washing", "intro": "Pressure washing transforms a green, slippery patio into a clean, safe surface. But timing matters. ", "slug": "when-to-pressure-wash-a-patio"},
    {"title": "How to Clean Patio Slabs With or Without a Pressure Washer", "category": "Patio & Pressure Washing", "intro": "A green, slippery patio is dangerous and looks terrible. But you do not necessarily need a pressure ", "slug": "how-to-clean-patio-slabs-with-or-without-pressure-washer"},
    {"title": "Why Patios Go Green and Slippery in Wet Weather", "category": "Patio & Pressure Washing", "intro": "A green, slippery patio is one of the most common complaints we hear, especially in autumn and winte", "slug": "why-patios-go-green-and-slippery-wet-weather"},
    {"title": "Rewilding with Intent: How Professional Maintenance Keeps a Wild Garden Looking Refined", "category": "Drought & Climate-Resilient Gardens", "intro": "Rewilding is a popular trend, but an unmanaged wild garden quickly looks messy. The answer is rewild", "slug": "rewilding-with-intent-professional-maintenance-wild-garden"},
    {"title": "Best Wildlife Plants for Chiltern Gardens", "category": "Wildlife & Wildflower Gardens", "intro": "Wildlife gardening is about choosing the right plants. The right plants provide nectar, pollen, berr", "slug": "best-wildlife-plants-chiltern-gardens"},
    {"title": "How to Make a Hedge Better for Birds and Pollinators", "category": "Hedges, Pruning & Cutting Times", "intro": "Hedges are one of the most valuable wildlife features in any garden. A well-managed hedge provides n", "slug": "hedge-better-for-birds-pollinators"},
    {"title": "How to Get Rid of Ivy Without Damaging Fences and Walls", "category": "Garden Problems & Weed Control", "intro": "Ivy can damage fences, walls and trees if left unchecked. But pulling live ivy off a surface can cau", "slug": "get-rid-of-ivy-without-damaging-fences-walls"},
    {"title": "What to Do When Hedges Have Been Left Too Long", "category": "Hedges, Pruning & Cutting Times", "intro": "A hedge that has been left too long is one of the most common problems we deal with. Whether it has ", "slug": "hedges-left-too-long"},
    {"title": "How to Deal With Bindweed in UK Gardens", "category": "Garden Problems & Weed Control", "intro": "Bindweed is one of the most persistent weeds in UK gardens. Its roots can go 3 metres deep, and any ", "slug": "deal-with-bindweed-uk-gardens"},
    {"title": "How to Make a Large Garden Look Manageable to Buyers", "category": "Gardens for Selling or Renting", "intro": "A large garden can be a selling point or a deterrent. Buyers who see an overgrown, complex garden se", "slug": "make-large-garden-look-manageable-to-buyers"},
    {"title": "Garden Design Ideas for Large Gardens in Oxfordshire and Buckinghamshire", "category": "Garden Design & Layout Ideas", "intro": "Large gardens in Oxfordshire and Buckinghamshire offer space and opportunity, but they also need car", "slug": "garden-design-ideas-large-gardens-oxon-bucks"},
    {"title": "Low-Maintenance Garden Design for Busy Professionals", "category": "Garden Design & Layout Ideas", "intro": "If you work long hours, travel frequently, or simply do not want to spend your weekends gardening, a", "slug": "low-maintenance-garden-design-busy-professionals"},
    {"title": "Garden Zoning Ideas: How to Divide a Large Garden Properly", "category": "Garden Design & Layout Ideas", "intro": "A large garden without zones feels empty and unmanageable. A large garden with well-defined zones fe", "slug": "garden-zoning-ideas-divide-large-garden"},
    {"title": "Creating a Pollinator Paradise: Why Native Planting Is the Backbone of the 2026 Chilterns Garden", "category": "Drought & Climate-Resilient Gardens", "intro": "Pollinators are in decline, and gardens are one of the best ways to help. Native plants are the back", "slug": "creating-pollinator-paradise-native-planting-2026-chilterns"},
    {"title": "How to Balance a Tidy Garden With Biodiversity", "category": "Wildlife & Wildflower Gardens", "intro": "Many garden owners want to support wildlife but do not want their garden to look untidy. The good ne", "slug": "balance-tidy-garden-with-biodiversity"},
    {"title": "Best Plants for Driveway Entrances and Front Gardens", "category": "Plants, Borders & Planting Ideas", "intro": "The front garden and driveway entrance are the first thing visitors and passers-by see. The right pl", "slug": "best-plants-driveway-entrances-front-gardens"},
    {"title": "How to Build Better Borders on Chalky Ground", "category": "Soil, Compost & Mulch", "intro": "Chalky soil is the dominant soil type across the Chilterns. It is alkaline, free-draining and often ", "slug": "build-better-borders-chalky-ground"},
    {"title": "How to Control Nettles, Brambles and Self-Seeded Trees", "category": "Garden Problems & Weed Control", "intro": "Nettles, brambles and self-seeded trees are the three most common invaders of neglected UK gardens. ", "slug": "control-nettles-brambles-self-seeded-trees"},
    {"title": "How to Stop a Garden Becoming Overgrown Again", "category": "Regular Garden Maintenance", "intro": "Clearing an overgrown garden is hard work. The last thing you want is for it to get overgrown again ", "slug": "stop-garden-becoming-overgrown-again"},
    {"title": "Soil Improvement for New Build Gardens", "category": "Soil, Compost & Mulch", "intro": "New build gardens are notorious for poor soil. Builders compact the subsoil, bury rubble, and remove", "slug": "soil-improvement-new-build-gardens"},
    {"title": "How to Plan a Garden Renovation in Stages", "category": "Garden Design & Layout Ideas", "intro": "A full garden renovation is expensive and disruptive. But you do not have to do it all at once. Phas", "slug": "plan-garden-renovation-in-stages"},
    {"title": "Why New Turf Fails and How to Prevent It", "category": "Lawn Care & Lawn Repair", "intro": "New turf is an investment, and it is disheartening when it fails. The most common causes are poor so", "slug": "why-new-turf-fails-how-to-prevent"},
    {"title": "What Does a Professional Gardener Actually Do on a Maintenance Visit?", "category": "Regular Garden Maintenance", "intro": "If you have never used a professional gardener before, you may wonder what actually happens during a", "slug": "what-professional-gardener-does-maintenance-visit"},
    {"title": "Garden Drainage Problems: Signs You Need Professional Help", "category": "Garden Problems & Weed Control", "intro": "Poor drainage is one of the most common garden problems in the UK, especially on heavy clay soils. B", "slug": "garden-drainage-problems-signs-professional-help"},
    {"title": "Should You Leave Part of Your Garden Wild?", "category": "Wildlife & Wildflower Gardens", "intro": "Leaving part of your garden wild is one of the best things you can do for wildlife. But it needs to ", "slug": "leave-part-garden-wild"},
    {"title": "How to Create a Wildflower Area in a Large Lawn", "category": "Wildlife & Wildflower Gardens", "intro": "Converting part of a large lawn to a wildflower area is one of the best things you can do for wildli", "slug": "create-wildflower-area-large-lawn"},
    {"title": "How to Create a Luxury-Looking Garden Without a Full Redesign", "category": "Garden Design & Layout Ideas", "intro": "A luxury garden is not about how much money you spend. It is about structure, simplicity and attenti", "slug": "create-luxury-looking-garden-without-full-redesign"},
    {"title": "How to Design a Garden for Privacy Without Making It Feel Closed In", "category": "Garden Design & Layout Ideas", "intro": "Privacy is important in a garden, but a 2 metre wall of leylandii around the whole boundary makes th", "slug": "design-garden-for-privacy-without-closed-in"},
    {"title": "Estate Garden Maintenance: What Makes It Different From Normal Gardening?", "category": "Regular Garden Maintenance", "intro": "Estate garden maintenance is a different discipline from normal garden maintenance. The scale, compl", "slug": "estate-garden-maintenance-different"},
    {"title": "Front Garden Tidy-Up Checklist Before House Viewings", "category": "Gardens for Selling or Renting", "intro": "The front garden is the first thing a buyer sees. A tidy front garden suggests the property has been", "slug": "front-garden-tidy-up-checklist-viewings"},
    {"title": "Garden Design Mistakes That Make Maintenance More Expensive", "category": "Garden Design & Layout Ideas", "intro": "Some gardens are harder to maintain than they need to be. The cause is usually a design mistake made", "slug": "garden-design-mistakes-make-maintenance-expensive"},
    {"title": "Garden Maintenance for Second Homes and Empty Properties", "category": "Regular Garden Maintenance", "intro": "Second homes and empty properties present a particular garden maintenance challenge. The garden is n", "slug": "garden-maintenance-second-homes-empty-properties"},
    {"title": "Best Lawn Care Plan for Large Gardens in the Chilterns", "category": "Lawn Care & Lawn Repair", "intro": "Large lawns in the Chilterns need a structured care plan. The chalky, free-draining soil means lawns", "slug": "lawn-care-plan-large-gardens-chilterns"},
    {"title": "How to Plan Borders That Look Good All Year", "category": "Garden Design & Layout Ideas", "intro": "A border that looks good for two weeks in June and then fades is a common disappointment. The secret", "slug": "plan-borders-look-good-all-year"},
    {"title": "Pressure Washing Patio Cost 2026", "category": "Patio & Pressure Washing", "intro": "Pressure washing transforms a green, slippery patio into a clean, safe surface. But what does it cos", "slug": "pressure-washing-patio-cost-2026"},
    {"title": "How to Turn a Neglected Corner Into a Wildlife Area", "category": "Wildlife & Wildflower Gardens", "intro": "Every garden has a neglected corner. The bit behind the shed, the shady patch by the fence, the area", "slug": "turn-neglected-corner-into-wildlife-area"},
    {"title": "How to Reclaim an Overgrown Lawn and Border Area", "category": "Garden Clearance & Tidy-Up Guides", "intro": "When both the lawn and the borders have been left too long, the job is bigger than either one alone.", "slug": "reclaim-overgrown-lawn-and-border"},
    {"title": "How to Plan a Garden Tidy-Up Weekend Without Getting Overwhelmed", "category": "Garden Clearance & Tidy-Up Guides", "intro": "A garden tidy-up can feel overwhelming if you try to do everything at once. The key is to plan, prio", "slug": "plan-garden-tidy-up-weekend"},
    {"title": "How to Clear a Neglected Rental Property Garden", "category": "Garden Clearance & Tidy-Up Guides", "intro": "Rental property gardens are often neglected between tenancies. Tenants move out and leave the garden", "slug": "clear-neglected-rental-property-garden"},
    {"title": "How to Prepare Your Garden Before a Family Event or Party", "category": "Garden Clearance & Tidy-Up Guides", "intro": "Having a party or family event in the garden? The garden needs to look its best and be safe for gues", "slug": "prepare-garden-for-family-event-party"},
    {"title": "How to Make an Old Garden Look Cared For Again", "category": "Garden Clearance & Tidy-Up Guides", "intro": "Old gardens have character, but they can also look tired and neglected. The mature trees and establi", "slug": "make-old-garden-look-cared-for"},
    {"title": "Best Plants for Large Country Gardens in Oxfordshire and Buckinghamshire", "category": "Plants, Borders & Planting Ideas", "intro": "Large country gardens need different plants from small suburban plots. They need scale, structure an", "slug": "best-plants-large-country-gardens"},
    {"title": "Best Plants for Windy Chiltern Hills Gardens", "category": "Plants, Borders & Planting Ideas", "intro": "Many Chiltern gardens are on exposed hillsides where wind is a real problem. The wrong plants get ba", "slug": "best-plants-windy-chiltern-hills"},
    {"title": "Best Plants for Clay and Chalk Mixed Gardens", "category": "Plants, Borders & Planting Ideas", "intro": "Many Chiltern gardens have both clay and chalk in the same plot. The chalk is on the slopes and the ", "slug": "best-plants-clay-and-chalk-mixed-gardens"},
    {"title": "How to Improve a Lawn Before Selling Your House", "category": "Lawn Care & Lawn Repair", "intro": "A green, healthy lawn is one of the biggest selling points for a garden. A mossy, patchy lawn is one", "slug": "improve-lawn-before-selling-house"},
    {"title": "How to Improve Thin, Dry Soil on Sloping Gardens", "category": "Soil, Compost & Mulch", "intro": "Sloping gardens in the Chilterns often have thin, dry soil. The chalk subsoil is close to the surfac", "slug": "improve-thin-dry-soil-sloping-gardens"},
    {"title": "Why Your Borders Are Dry, Tired and Underperforming", "category": "Soil, Compost & Mulch", "intro": "Tired borders are one of the most common garden problems. The plants are not growing well, the soil ", "slug": "why-borders-dry-tired-underperforming"},
    {"title": "How to Prepare Soil After Garden Clearance", "category": "Soil, Compost & Mulch", "intro": "After clearing an overgrown garden, the soil is often in poor condition. Compacted, depleted and ful", "slug": "prepare-soil-after-garden-clearance"},
    {"title": "How to Improve Soil Around Mature Trees and Hedges", "category": "Hedges, Pruning & Cutting Times", "intro": "Soil around mature trees and hedges is some of the most difficult soil in any garden. The trees and ", "slug": "improve-soil-around-mature-trees-hedges"},
    {"title": "How to Mulch Properly and What to Buy", "category": "Soil, Compost & Mulch", "intro": "Mulching is the single most beneficial thing you can do for your garden. It suppresses weeds, retain", "slug": "how-to-mulch-properly-and-what-to-buy"},
    {"title": "Why Your Garden Looks Tired Even After Mowing", "category": "Garden Problems & Weed Control", "intro": "You have mowed the lawn, but the garden still looks tired. The lawn is green but the borders are lac", "slug": "why-garden-looks-tired-after-mowing"},
    {"title": "How to Rescue a Garden After Tenants Move Out", "category": "Garden Clearance & Tidy-Up Guides", "intro": "When tenants move out, the garden is often the last thing on their mind. The result is an overgrown,", "slug": "rescue-garden-after-tenants-move-out"},
    {"title": "Should You Clear an Overgrown Garden Before Listing Your Property?", "category": "Gardens for Selling or Renting", "intro": "An overgrown garden puts buyers off. It suggests the property has been neglected and makes the garde", "slug": "clear-overgrown-garden-before-listing-property"},
    {"title": "Garden Improvements That Help Sell Homes in Oxfordshire and Buckinghamshire", "category": "Gardens for Selling or Renting", "intro": "The right garden improvements can add thousands to your sale price and speed up the sale. The wrong ", "slug": "garden-improvements-help-sell-homes-oxon-bucks"},
    {"title": "How to Prepare a Garden for Professional Property Photos", "category": "Gardens for Selling or Renting", "intro": "Estate agent photos are the first thing buyers see on Rightmove and Zoopla. The garden needs to look", "slug": "prepare-garden-for-professional-property-photos"},
    {"title": "What Buyers Notice First in a Neglected Garden", "category": "Gardens for Selling or Renting", "intro": "Buyers form an opinion within 8 seconds of arriving at a property. The garden is a big part of that ", "slug": "what-buyers-notice-first-neglected-garden"},
    {"title": "Garden Clearance Before Probate or Inherited Property Sale", "category": "Gardens for Selling or Renting", "intro": "When a property is being sold through probate or as an inherited property, the garden is often overg", "slug": "garden-clearance-before-probate-inherited-sale"},
    {"title": "How to Make a Rental Property Garden Presentable Between Tenants", "category": "Gardens for Selling or Renting", "intro": "When one tenant moves out and another is about to move in, the garden needs to be presentable. A tid", "slug": "rental-property-garden-presentable-between-tenants"},
    {"title": "Country Garden Design Ideas for Chiltern Homes", "category": "Garden Design & Layout Ideas", "intro": "The Chilterns have a distinct rural character, and many homeowners want a garden that reflects it. A", "slug": "country-garden-design-ideas-chiltern-homes"},
    {"title": "Modern Garden Design Ideas for Period Homes", "category": "Garden Design & Layout Ideas", "intro": "Period homes deserve gardens that respect their history but do not feel stuck in the past. A modern ", "slug": "modern-garden-design-ideas-period-homes"},
    {"title": "Garden Design for Entertaining: Seating, Lighting, Privacy and Planting", "category": "Garden Design & Layout Ideas", "intro": "If you love entertaining outdoors, your garden needs to be designed for it. That means comfortable s", "slug": "garden-design-for-entertaining-seating-lighting-privacy"},
    {"title": "Why Your Garden Needs a Maintenance Plan, Not Random Visits", "category": "Regular Garden Maintenance", "intro": "Many garden owners call a gardener when the garden looks bad, then cancel when it looks good. This r", "slug": "why-garden-needs-maintenance-plan-not-random-visits"},
    {"title": "Garden Maintenance for Busy Professionals in Oxfordshire and Buckinghamshire", "category": "Regular Garden Maintenance", "intro": "If you work long hours, travel frequently, or simply value your weekends, garden maintenance is the ", "slug": "garden-maintenance-busy-professionals-oxon-bucks"},
    {"title": "How to Maintain a Mature Garden Without Losing Its Character", "category": "Regular Garden Maintenance", "intro": "Mature gardens have character that new gardens cannot match. The established trees, the clipped hedg", "slug": "maintain-mature-garden-without-losing-character"},
    {"title": "How to Add Wildlife Value to a Formal Garden", "category": "Wildlife & Wildflower Gardens", "intro": "Formal gardens and wildlife gardens are not mutually exclusive. You can have crisp edges, clipped he", "slug": "add-wildlife-value-to-formal-garden"},
    {"title": "Wildlife Pond Maintenance: What to Cut Back and When", "category": "Wildlife & Wildflower Gardens", "intro": "A wildlife pond needs less maintenance than a formal pond, but it still needs some care. The key is ", "slug": "wildlife-pond-maintenance-what-to-cut-back"},
    {"title": "Best Native Shrubs for Birds in UK Gardens", "category": "Wildlife & Wildflower Gardens", "intro": "Garden birds need three things: food, shelter and nesting sites. The right shrubs provide all three.", "slug": "best-native-shrubs-for-birds-uk"},
    {"title": "Pre-Holiday Garden Checklist Before You Go Away", "category": "Seasonal Garden Jobs", "intro": "Going on holiday? The garden needs preparing before you go, especially in summer. Without preparatio", "slug": "pre-holiday-garden-checklist"},
    {"title": "Post-Holiday Garden Rescue: What to Do When Everything Has Overgrown", "category": "Seasonal Garden Jobs", "intro": "Coming back from holiday to an overgrown garden is disheartening. But with the right approach, you c", "slug": "post-holiday-garden-rescue"},
    {"title": "Storm Damage Garden Checklist: What to Inspect First", "category": "Seasonal Garden Jobs", "intro": "After a storm, the garden can be a dangerous place. Fallen branches, damaged fences and loose struct", "slug": "storm-damage-garden-checklist"},
    {"title": "End-of-Tenancy Garden Checklist for Landlords and Tenants", "category": "Seasonal Garden Jobs", "intro": "The garden is one of the most common areas of dispute at the end of a tenancy. Both landlords and te", "slug": "end-of-tenancy-garden-checklist-landlords"}
    ];

    function getSeed() {
      var now = new Date();
      return Math.floor(now.getTime() / (12 * 60 * 60 * 1000));
    }

    function seededRandom(seed) {
      var x = Math.sin(seed) * 10000;
      return x - Math.floor(x);
    }

    function pickRandomArticles(pool, count, seed) {
      var shuffled = pool.slice();
      for (var i = shuffled.length - 1; i > 0; i--) {
        var j = Math.floor(seededRandom(seed + i) * (i + 1));
        var temp = shuffled[i];
        shuffled[i] = shuffled[j];
        shuffled[j] = temp;
      }
      return shuffled.slice(0, count);
    }

    function truncate(text, maxWords) {
      var words = text.split(' ');
      if (words.length <= maxWords) return text;
      return words.slice(0, maxWords).join(' ') + '...';
    }

    function readingLevel(slug) {
      var value = String(slug || '').split('').reduce(function(total, character) {
        return total + character.charCodeAt(0);
      }, 0);
      return ['Easy read', 'Intermediate read', 'Hard read'][value % 3];
    }

    function renderArticles(articles) {
      var container = document.getElementById('popular-articles');
      if (!container) return;
      container.innerHTML = '';
      articles.forEach(function(a) {
        var card = document.createElement('div');
        card.className = 'card article-card-popular';
        // Estimate read time from intro length (rough: 200 words per minute)
        var wordCount = a.intro.split(' ').length;
        var readTime = Math.max(3, Math.round(wordCount / 200 * 8));
        var level = readingLevel(a.slug);
        var levelClass = level.toLowerCase().replace(' ', '-');
        card.innerHTML =
          '<div class="article-card-popular__meta">' +
            '<span class="article-card-popular__tag">' + a.category + '</span>' +
            '<span class="article-card-popular__read">' + readTime + ' min read</span>' +
            '<span class="article-card-popular__level article-card-popular__level--' + levelClass + '">' + level + '</span>' +
          '</div>' +
          '<h3>' + a.title + '</h3>' +
          '<p>' + truncate(a.intro, 12) + '</p>' +
          '<a class="card-link" href="/chilterngardenmaintenance-updatedsite/tips/' + a.slug + '.html">Read the guide</a>';
        container.appendChild(card);
      });
    }

    var seed = getSeed();
    var selected = pickRandomArticles(articlePool, 4, seed);
    renderArticles(selected);

    // Keep a long-open page fresh when a twelve-hour window changes.
    var refreshEvery = 12 * 60 * 60 * 1000;
    var untilNextWindow = refreshEvery - (Date.now() % refreshEvery) + 250;
    window.setTimeout(function() {
      function refreshPopularArticles() {
        renderArticles(pickRandomArticles(articlePool, 4, getSeed()));
      }
      refreshPopularArticles();
      window.setInterval(refreshPopularArticles, refreshEvery);
    }, untilNextWindow);
  })();
