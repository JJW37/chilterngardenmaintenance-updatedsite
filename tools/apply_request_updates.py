from __future__ import annotations

"""Apply the requested CGM website revision to the repaired static build.

The script is intentionally kept in the package so the bulk edits are
repeatable.  It changes existing text in place, adds shared progressive
enhancements, and leaves the source articles and plant notes intact.
"""

from datetime import date, timedelta
from pathlib import Path
import html as html_lib
import re
import sys


ROOT = Path(__file__).resolve().parents[1]
BASE = "/chilterngardenmaintenance-updatedsite/"
SCRIPT_TAGS = """
  <script src="/chilterngardenmaintenance-updatedsite/js/card-tilt.js?v=20260719b"></script>
  <script src="/chilterngardenmaintenance-updatedsite/js/custom-scrollbar.js?v=20260719b"></script>
  <script src="/chilterngardenmaintenance-updatedsite/js/predictive-search.js?v=20260719b"></script>
  <script src="/chilterngardenmaintenance-updatedsite/js/mobile-dock.js?v=20260719b"></script>
""".strip()


def write_if_changed(path: Path, text: str) -> None:
    old = path.read_text(encoding="utf-8")
    if old != text:
        path.write_text(text, encoding="utf-8")


def inject_shared_scripts(text: str) -> str:
    if "js/card-tilt.js?v=20260719b" in text:
        return text
    if "</body>" not in text:
        return text
    return text.replace("</body>", f"{SCRIPT_TAGS}\n</body>", 1)


def clean_common_language(text: str) -> str:
    # Long dash characters and their HTML entities were used heavily in the
    # generated copy.  Replace them with commas, while keeping normal hyphenated
    # words such as low-maintenance and hands-on intact.
    text = text.replace("&mdash;", ",").replace("&ndash;", ",")
    text = text.replace("—", ",").replace("–", ",")
    text = text.replace("Mon-Fri", "Mon-Sun")
    text = text.replace("within one day", "within 12 to 36 hours, Monday to Sunday")
    text = text.replace("within a day", "within 12 to 36 hours, Monday to Sunday")
    text = text.replace("within one working day", "within 12 to 36 hours, Monday to Sunday")
    # A spaced hyphen was being used as a sentence break throughout the
    # generated copy.  Keep real hyphenated words and numeric ranges intact,
    # but use commas for this punctuation style.
    text = text.replace(" - ", ", ")
    text = text.replace("From overgrown to ongoing - in six weeks.", "From overgrown to ongoing, in six weeks.")
    text = text.replace("From overgrown to ongoing - in six weeks", "From overgrown to ongoing, in six weeks")
    return text


def replace_article_dates(text: str, published: date) -> str:
    published_iso = published.isoformat()
    published_visible = f"{published.day} {published.strftime('%B %Y')}"
    text = re.sub(r'("datePublished"\s*:\s*")[^"]+("\s*,)', rf"\g<1>{published_iso}\g<2>", text, count=1)
    text = re.sub(r'("dateModified"\s*:\s*")[^"]+("\s*,)', r'\g<1>2026-07-19\g<2>', text, count=1)
    text = re.sub(r'(<p[^>]*>)(\d{1,2} [A-Za-z]+ \d{4})(\s*&middot;)', rf"\g<1>{published_visible}\g<3>", text, count=1)
    text = re.sub(r'(<p[^>]*>)(\d{1,2} [A-Za-z]+ 2026)(</p>)', rf"\g<1>19 July 2026\g<3>", text, count=1)
    return text


def article_level(index: int) -> tuple[str, str, str]:
    levels = [
        ("easy", "Easy Read", "Easy read"),
        ("intermediate", "Intermediate Read", "Intermediate read"),
        ("hard", "Hard Read", "Hard read"),
    ]
    return levels[index % len(levels)]


def article_links(slug: str) -> tuple[str, list[tuple[str, str]]]:
    s = slug.lower()
    if any(k in s for k in ("lawn", "moss", "turf", "grass", "scarif", "overseed")):
        calc = ("/calculators/lawn-recovery.html", "Open the lawn recovery tool")
        articles = [
            ("/tips/why-is-my-lawn-full-of-moss.html", "Why is my lawn full of moss?"),
            ("/tips/aeration-overseeding-top-dressing-explained.html", "Aeration, overseeding and top dressing explained"),
        ]
    elif any(k in s for k in ("hedge", "privacy", "prun", "boundary")):
        calc = ("/calculators/privacy-planner.html", "Open the privacy plant planner")
        articles = [
            ("/tips/when-to-cut-hedges-uk.html", "When to cut hedges in the UK"),
            ("/tips/best-plants-privacy-fences-boundaries.html", "Best plants for privacy, fences and boundaries"),
        ]
    elif any(k in s for k in ("plant", "soil", "border", "compost", "mulch", "flower", "wildlife", "pollinator", "tree", "shrub")):
        calc = ("/calculators/privacy-planner.html", "Open the plant planning tool")
        articles = [
            ("/tips/low-maintenance-plants-chilterns.html", "Low-maintenance plants for Chiltern gardens"),
            ("/tips/best-plants-chalk-soil-chilterns.html", "Best plants for chalk soil in the Chilterns"),
        ]
    elif any(k in s for k in ("pressure", "patio", "clean", "wash", "slippery")):
        calc = ("/calculators/pressure-wash.html", "Open the pressure washing tool")
        articles = [
            ("/tips/when-to-pressure-wash-a-patio.html", "When to pressure wash a patio"),
            ("/tips/how-to-clean-patio-slabs-with-or-without-pressure-washer.html", "How to clean patio slabs"),
        ]
    elif any(k in s for k in ("clear", "overgrown", "bramble", "ivy", "neglect", "rescue", "unmanageable")):
        calc = ("/calculators/clearance.html", "Open the garden clearance tool")
        articles = [
            ("/tips/restore-overgrown-garden.html", "How to restore an overgrown garden"),
            ("/tips/clear-brambles-properly-without-regrowing.html", "How to clear brambles without regrowth"),
        ]
    else:
        calc = ("/calculators/maintenance.html", "Open the garden care assessment")
        articles = [
            ("/tips/how-often-should-gardener-visit.html", "How often should a gardener visit?"),
            ("/tips/why-garden-needs-maintenance-plan-not-random-visits.html", "Why a garden needs a maintenance plan"),
        ]
    return calc[0], [calc] + articles


def article_tools_block(slug: str) -> str:
    _, links = article_links(slug)
    links.append(("/plants/", "Explore plants suited to Chiltern gardens"))
    cards = []
    for href, label in links:
        cards.append(
            f'<a class="article-tool-links__card cgm-tilt" href="{BASE.rstrip("/")}{href}">'
            f'<span class="article-tool-links__label">{html_lib.escape(label)}</span>'
            f'<span class="article-tool-links__arrow">Open guide <span aria-hidden="true">&rarr;</span></span></a>'
        )
    return (
        '<section class="article-tool-links" aria-labelledby="article-tools-heading">'
        '<div class="article-tool-links__intro"><span class="editorial-kicker">Useful next steps</span>'
        '<h2 id="article-tools-heading">Put this advice into practice</h2>'
        '<p>Use the relevant CGM tool or follow a related guide, then send us a few photos if you would like a tailored plan.</p></div>'
        '<div class="article-tool-links__grid">' + ''.join(cards) + '</div>'
        f'<a class="btn btn-primary" href="{BASE}booking/">Get a tailored quote <span aria-hidden="true">&rarr;</span></a>'
        '</section>'
    )


def update_homepage(path: Path) -> None:
    text = path.read_text(encoding="utf-8")
    text = text.replace("Garden &amp; Grounds Maintenance &middot; Oxon &middot; Bucks &middot; Berks", "Garden &amp; Grounds Maintenance &middot; OXFD &middot; Bucks &middot; Berks &middot; BEDS")
    text = text.replace("Oxfordshire &middot; Buckinghamshire &middot; Berkshire</p>", "Oxfordshire &middot; Buckinghamshire &middot; Berkshire &middot; Bedfordshire</p>", 1)
    text = text.replace("Gardens restored across the Chilterns &amp; Thames Valley", "Garden projects across the Chilterns and Thames Valley")
    text = text.replace('data-ticker-target="7" data-ticker-prefix="1-"', 'data-ticker-target="36" data-ticker-prefix="12-"')
    text = text.replace("Average response time on WhatsApp, Mon-Fri", "Average response time on WhatsApp, Mon-Sun")
    text = text.replace("Seasonal guides from our Gardening Knowledge library, refreshed daily.", "Seasonal guides from our Gardening Knowledge library, refreshed every 12 hours.")
    text = text.replace("From overgrown to ongoing - in six weeks.", "From overgrown to ongoing, in six weeks.")
    text = text.replace("images/project/floral-garden-interlude.webp", "images/project/interlude-lawn-stripes.webp")
    text = text.replace('alt="Freshly mown lawn with deep stripe pattern in morning light"', 'alt="A calm garden border and lawn maintained with care"')
    text = text.replace("Working method &middot; Lawn care", "PRINCIPLED METHOD &middot; GARDEN CARE")
    text = text.replace("A lawn stripe is not decoration. It is evidence the mower was set right, the blade was sharp, and the visit was on time.", "A garden is much more than decoration. It is the soul of your home, a perfect reflection of your character.")
    text = text.replace("We measure lawn work by what is still true a fortnight later - not by how it looked the day we left.", "We send gardeners that we would only send to our own members of family.")
    text = text.replace("images/project/pruned-hedge-no-person.webp", "images/project/hedge-chiltern-editorial.png")
    text = text.replace('alt="Beautifully pruned yew hedge in an English country garden"', 'alt="A carefully clipped yew hedge beside a gravel path in a Chiltern garden"')
    text = text.replace("<h2 class=\"editorial-h2\">Right plant, right place. Right time, right job.</h2>", '<h2 class="editorial-h2 method-title-premium"><span>Right plant.</span><span>Right place.</span><span>Right time.</span><span>Right job.</span></h2>')

    # Put the tools and diagnosis before the method feature, as requested.
    markers = {
        "photo": "  <!-- ============== PHOTO INTERLUDE",
        "working": "  <!-- ============== EDITORIAL FEATURE: working process",
        "intelligence": "  <!-- ============== GARDENING INTELLIGENCE",
        "problem": "  <!-- ============== PROBLEM DIAGNOSIS",
        "services": "  <!-- ============== SERVICES",
    }
    if all(v in text for v in markers.values()):
        positions = {k: text.index(v) for k, v in markers.items()}
        pieces = {
            "photo": text[positions["photo"]:positions["working"]],
            "working": text[positions["working"]:positions["intelligence"]],
            "intelligence": text[positions["intelligence"]:positions["problem"]],
            "problem": text[positions["problem"]:positions["services"]],
        }
        replacement = pieces["intelligence"] + pieces["problem"] + pieces["photo"] + pieces["working"]
        text = text[:positions["photo"]] + replacement + text[positions["services"]:]

    text = text.replace("Rough cost &amp; timescale", "A useful tool or guide")
    text = text.replace("data-result=\"cost\"", "data-result=\"cost\"")
    text = text.replace("Pick the option that fits. We'll show you the likely service, what we'd inspect, a real project, rough cost and the next question.", "Pick the option that fits. We will show you the likely service, what we would inspect, a relevant project, a useful next step and the question that matters most.")
    text = text.replace("<div class=\"service-list-mobile\" style=\"display:none;\">", '<div class="service-list-mobile" style="display:none;">')
    # Hide the second group of six mobile service cards behind a deliberate control.
    fourth = '<a class="service-card-mobile" href="/chilterngardenmaintenance-updatedsite/services/hedge-cutting.html">'
    if fourth in text and "service-list-mobile-more" not in text:
        text = text.replace(fourth, '<details class="service-list-mobile-more"><summary>View six more services <span aria-hidden="true">+</span></summary><div class="service-list-mobile-more__items">' + fourth, 1)
        close = '      </div>\n    </div>\n  </section>\n\n  <!-- ============== POPULAR RIGHT NOW'
        if close in text:
            text = text.replace(close, '      </div>\n        </div></details>\n      </div>\n    </div>\n  </section>\n\n  <!-- ============== POPULAR RIGHT NOW', 1)

    # Make the JSON-LD coverage statement match the visible coverage.
    text = re.sub(r'("areaServed"\s*:\s*\[)[^\]]+(\])', r'\1"Oxfordshire","Buckinghamshire","Berkshire","Bedfordshire"\2', text, count=1)
    write_if_changed(path, clean_common_language(text))


def update_homepage_js(path: Path) -> None:
    text = path.read_text(encoding="utf-8")
    replacements = {
        "cost: 'Typically £350–£1,500 depending on size, overgrowth density and waste volume. Most jobs done in 1–3 days.'": "cost: '<a class=\"diagnosis-resource\" href=\"/chilterngardenmaintenance-updatedsite/tips/restore-overgrown-garden.html\"><img src=\"/chilterngardenmaintenance-updatedsite/images/project/process-clearance.webp\" alt=\"Garden clearance project\"><span><strong>Read the garden recovery guide</strong><small>See what to inspect before clearing an overgrown space.</small><em>Search more →</em></span></a>'",
        "cost: 'Typically £180–£450 for a standard rear lawn. Larger lawns or those needing full renovation quoted separately.'": "cost: '<a class=\"diagnosis-resource\" href=\"/chilterngardenmaintenance-updatedsite/calculators/lawn-recovery.html\"><img src=\"/chilterngardenmaintenance-updatedsite/images/project/lawn-renovation.webp\" alt=\"Lawn recovery tool\"><span><strong>Use the lawn recovery tool</strong><small>Work out whether moss, compaction or bare patches are the main issue.</small><em>Search more →</em></span></a>'",
        "cost: 'Plants + planting: £400–£2,500 depending on length, height and plant choices. Mature plants cost more but screen immediately.'": "cost: '<a class=\"diagnosis-resource\" href=\"/chilterngardenmaintenance-updatedsite/calculators/privacy-planner.html\"><img src=\"/chilterngardenmaintenance-updatedsite/images/project/hedge-screening.webp\" alt=\"Privacy planting planner\"><span><strong>Try the privacy plant planner</strong><small>Compare screening styles and choose plants for the conditions you have.</small><em>Search more →</em></span></a>'",
        "cost: 'Design: £350–£1,200 depending on garden size. Implementation typically £2,000–£15,000+ phased over seasons.'": "cost: '<a class=\"diagnosis-resource\" href=\"/chilterngardenmaintenance-updatedsite/tips/plan-garden-renovation-in-stages.html\"><img src=\"/chilterngardenmaintenance-updatedsite/images/project/full-width-1-garden-makeover.webp\" alt=\"Garden renovation guide\"><span><strong>Read the staged renovation guide</strong><small>Set out the decisions that should come before planting or building.</small><em>Search more →</em></span></a>'",
        "cost: '£95–£160 per metre installed depending on style, height and ground conditions. Gates quoted separately.'": "cost: '<a class=\"diagnosis-resource\" href=\"/chilterngardenmaintenance-updatedsite/tips/design-garden-for-privacy-without-closed-in.html\"><img src=\"/chilterngardenmaintenance-updatedsite/images/project/fencing-installation.webp\" alt=\"Garden boundary guide\"><span><strong>Read the boundary planning guide</strong><small>Understand the practical choices before repairing or replacing a fence.</small><em>Search more →</em></span></a>'",
        "cost: 'From £35–£55 per visit for a standard rear garden. Larger or more complex gardens quoted per visit.'": "cost: '<a class=\"diagnosis-resource\" href=\"/chilterngardenmaintenance-updatedsite/calculators/maintenance.html\"><img src=\"/chilterngardenmaintenance-updatedsite/images/project/service-maintenance.webp\" alt=\"Garden care assessment\"><span><strong>Use the garden care assessment</strong><small>Build a clearer picture of the visit rhythm your garden needs.</small><em>Search more →</em></span></a>'",
        "cost: 'Analysis report: £180–£350 depending on garden size. Fee credited against any subsequent work.'": "cost: '<a class=\"diagnosis-resource\" href=\"/chilterngardenmaintenance-updatedsite/services/garden-analysis-report.html\"><img src=\"/chilterngardenmaintenance-updatedsite/images/project/garden-analysis.webp\" alt=\"Garden analysis report\"><span><strong>See the garden analysis service</strong><small>A structured inspection helps separate causes from symptoms.</small><em>Search more →</em></span></a>'",
    }
    for old, new in replacements.items():
        text = text.replace(old, new)
    # On a phone the answer should follow the choice, instead of appearing
    # below the fold while the user is still looking at the options.
    needle = "      resultPanel.querySelector('[data-result=\"next\"]').innerHTML = data.next;"
    if "diagnosisResult" in text and "scrollIntoView" not in text:
        text = text.replace(needle, needle + "\n      if (window.matchMedia('(max-width: 768px)').matches) {\n        setTimeout(function() { resultPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, 80);\n      }")
    write_if_changed(path, text)


def update_services() -> None:
    index = ROOT / "services" / "index.html"
    text = index.read_text(encoding="utf-8")
    text = text.replace("<span class=\"svc-stat__value\">130 Plants</span>\n        <span class=\"svc-stat__label\">In our plant library</span>", "<span class=\"svc-stat__value\">100+</span>\n        <span class=\"svc-stat__label\">Garden projects across the Chilterns and Thames Valley</span>")
    text = text.replace("<span class=\"svc-stat__value\">1 Day</span>\n        <span class=\"svc-stat__label\">Typical response time</span>", "<span class=\"svc-stat__value\">12-36 hrs</span>\n        <span class=\"svc-stat__label\">Average response time, Mon-Sun</span>")
    write_if_changed(index, clean_common_language(text))

    service_map = {
        "garden-maintenance": ("/calculators/maintenance.html", "Garden care assessment", "/tips/how-often-should-gardener-visit.html", "How often should a gardener visit?", "/tips/why-garden-needs-maintenance-plan-not-random-visits.html", "Why a garden needs a maintenance plan"),
        "garden-clearance": ("/calculators/clearance.html", "Garden clearance level assessment", "/tips/restore-overgrown-garden.html", "How to restore an overgrown garden", "/tips/clear-brambles-properly-without-regrowing.html", "How to clear brambles without regrowth"),
        "soft-landscaping": ("/calculators/privacy-planner.html", "Privacy plant planner", "/tips/low-maintenance-plants-chilterns.html", "Low-maintenance plants for Chiltern gardens", "/tips/best-plants-chalk-soil-chilterns.html", "Best plants for chalk soil in the Chilterns"),
        "pressure-washing": ("/calculators/pressure-wash.html", "Pressure washing assessment", "/tips/when-to-pressure-wash-a-patio.html", "When to pressure wash a patio", "/tips/how-to-clean-patio-slabs-with-or-without-pressure-washer.html", "How to clean patio slabs"),
        "hedge-cutting": ("/calculators/privacy-planner.html", "Privacy plant planner", "/tips/when-to-cut-hedges-uk.html", "When to cut hedges in the UK", "/tips/pruning-guide-uk-shrubs.html", "Pruning guide for UK shrubs"),
        "lawn-recovery": ("/calculators/lawn-recovery.html", "Lawn recovery assessment", "/tips/why-is-my-lawn-full-of-moss.html", "Why is my lawn full of moss?", "/tips/returf-or-reseed-lawn.html", "Returf or reseed a lawn"),
        "fencing": ("/calculators/privacy-planner.html", "Privacy plant planner", "/tips/design-garden-for-privacy-without-closed-in.html", "Designing a private garden", "/tips/best-plants-privacy-fences-boundaries.html", "Best plants for privacy, fences and boundaries"),
        "garden-design": ("/calculators/privacy-planner.html", "Privacy plant planner", "/tips/modern-garden-design-ideas-period-homes.html", "Modern garden design for period homes", "/tips/garden-design-for-entertaining-seating-lighting-privacy.html", "Garden design for entertaining"),
        "garden-analysis-report": ("/calculators/maintenance.html", "Garden care assessment", "/tips/garden-drainage-problems-signs-professional-help.html", "Garden drainage problems", "/tips/why-garden-looks-tired-after-mowing.html", "Why a garden looks tired after mowing"),
    }
    for path in sorted((ROOT / "services").glob("*.html")):
        if path.name == "index.html":
            continue
        slug = path.stem
        text = path.read_text(encoding="utf-8")
        text = text.replace("<details open>", "<details>")
        if "service-resource-panel" not in text and slug in service_map:
            calc, calc_label, a1, l1, a2, l2 = service_map[slug]
            panel = f'''\n<section class="service-resource-panel" aria-labelledby="service-resource-heading">\n  <div class="service-resource-panel__intro"><span class="editorial-kicker">Plan the next step</span><h2 id="service-resource-heading">Useful tools and reading</h2><p>Start with a practical assessment, then use the related guides to decide what your garden needs next.</p></div>\n  <div class="service-resource-panel__grid">\n    <a class="service-resource-card cgm-tilt" href="{BASE.rstrip('/')}{calc}"><span class="service-resource-card__eyebrow">Tool</span><strong>{calc_label}</strong><span>Open the assessment <span aria-hidden="true">&rarr;</span></span></a>\n    <a class="service-resource-card cgm-tilt" href="{BASE.rstrip('/')}{a1}"><span class="service-resource-card__eyebrow">Guide</span><strong>{l1}</strong><span>Read the guide <span aria-hidden="true">&rarr;</span></span></a>\n    <a class="service-resource-card cgm-tilt" href="{BASE.rstrip('/')}{a2}"><span class="service-resource-card__eyebrow">Guide</span><strong>{l2}</strong><span>Read the guide <span aria-hidden="true">&rarr;</span></span></a>\n  </div>\n</section>\n'''
            text = text.replace("\n</article>", panel + "\n</article>", 1)
        write_if_changed(path, clean_common_language(text))


def update_articles() -> None:
    article_paths = sorted(p for p in (ROOT / "tips").glob("*.html") if p.name != "index.html")
    for index, path in enumerate(article_paths):
        text = path.read_text(encoding="utf-8")
        published = date(2026, 4, 1) + timedelta(days=(index * 2) % 109)
        text = replace_article_dates(text, published)
        new_author = ('Unlike most sites, we do not delegate our written articles to a web developer with no garden experience. '
                      'Each and every article is hand written by our in team gardeners, who have direct hands on experience. '
                      'We write each article when a client asks a question and we feel the answer should be shared with you. ')
        text = re.sub(r'Written by our working gardeners with 5-15 years of hands-on Chilterns experience\.\s*(<a[^>]*>About the team[^<]*</a>)', new_author + r'\1', text)
        text = text.replace("Reviewed by a senior CGM team member with 10+ years of Chilterns field experience.", "Reviewed by a senior CGM team member.")
        level_class, level_label, _ = article_level(index)
        text = re.sub(r'<span class="article-meta-bar__pill article-meta-bar__pill--(?:expert|intermediate|easy|hard)">[^<]+ Read</span>', f'<span class="article-meta-bar__pill article-meta-bar__pill--{level_class}">{level_label}</span>', text, count=1)
        if "article-tool-links" not in text:
            insertion = article_tools_block(path.stem)
            if '<h2 id="sources-and-citations"' in text:
                text = text.replace('<h2 id="sources-and-citations"', insertion + '\n\n              <h2 id="sources-and-citations"', 1)
            else:
                text = text.replace("\n        </article>", insertion + "\n        </article>", 1)
        write_if_changed(path, inject_shared_scripts(clean_common_language(text)))

    # The index and homepage article cards use the same three-way reading
    # labels, so a visitor sees consistent difficulty information everywhere.
    index = ROOT / "tips" / "index.html"
    text = index.read_text(encoding="utf-8")

    def card_level(match: re.Match[str]) -> str:
        block = match.group(0)
        slug_match = re.search(r'data-article-slug="([^"]+)"', block)
        if not slug_match:
            return block
        slug = slug_match.group(1)
        article_index = next((i for i, p in enumerate(article_paths) if p.stem == slug), 0)
        level_class, _, short_label = article_level(article_index)
        block = re.sub(r'editorial-row__pill editorial-row__pill--(?:easy|intermediate|expert|hard)', f'editorial-row__pill editorial-row__pill--{level_class}', block)
        block = re.sub(r'(editorial-row__pill editorial-row__pill--[a-z]+">)[^<]+', rf'\1{short_label}', block, count=1)
        return block

    text = re.sub(r'<a class="editorial-row tip-card"[\s\S]*?</a>', card_level, text)
    write_if_changed(index, inject_shared_scripts(clean_common_language(text)))


def plant_calendar() -> str:
    months = [
        ("January", "Check winter damage and protect vulnerable new growth."),
        ("February", "Prune only where the plant and weather allow; plan spring work."),
        ("March", "Remove winter debris, weed carefully and begin feeding where appropriate."),
        ("April", "Plant in workable soil and water new plants during dry spells."),
        ("May", "Mulch before the ground dries and watch for pests and new disease."),
        ("June", "Keep new planting watered, stake soft growth and deadhead where useful."),
        ("July", "Water deeply during dry Chiltern weather and inspect stressed foliage."),
        ("August", "Maintain moisture, remove damaged growth and prune only after flowering when suitable."),
        ("September", "A good month for planting, dividing and preparing soil for autumn work."),
        ("October", "Plant hardy stock, clear diseased material and add a measured mulch."),
        ("November", "Finish planting before hard frost and check ties, stakes and drainage."),
        ("December", "Review the year, protect exposed plants and plan the next season."),
    ]
    cells = ''.join(f'<div class="plant-calendar__month"><strong>{m}</strong><span>{task}</span></div>' for m, task in months)
    return (
        '<section class="plant-calendar" aria-labelledby="plant-calendar-heading">'
        '<span class="editorial-kicker">Chiltern growing year</span>'
        '<h2 id="plant-calendar-heading">12-month care calendar</h2>'
        '<p>Use this as a seasonal prompt for this plant. Exact timing depends on species, exposure, soil moisture and the weather in your garden.</p>'
        '<div class="plant-calendar__grid">' + cells + '</div></section>'
    )


def add_plant_rank(text: str, label: str, score: int) -> str:
    pattern = rf'(<p><strong>{re.escape(label)}:</strong>)(\s*)(?!<span class="plant-rank")([^<]+)'
    match = re.search(pattern, text)
    if not match:
        return text
    note = match.group(3).strip()
    return text[:match.start()] + f'{match.group(1)} <span class="plant-rank">{score} out of 10</span> <span class="plant-rank-note">{note}</span>' + text[match.end():]


def update_plants() -> None:
    plant_paths = sorted(p for p in (ROOT / "plants").glob("*.html") if p.name != "index.html")
    for path in plant_paths:
        text = path.read_text(encoding="utf-8")
        bio_lower = re.search(r'<p><strong>Biodiversity value:</strong>\s*([^<]+)', text, re.I)
        bio_note = bio_lower.group(1).lower() if bio_lower else ""
        bio_score = 8 if "high" in bio_note and "medium" not in bio_note else 7 if "medium to high" in bio_note else 6 if "medium" in bio_note else 4 if "low to medium" in bio_note else 3 if "low" in bio_note else 5
        seasonal = re.search(r'<p><strong>Seasonal highlight:</strong>\s*([^<]+)', text, re.I)
        seasonal_note = seasonal.group(1).lower() if seasonal else ""
        seasonal_score = 9 if "year-round" in seasonal_note or "year round" in seasonal_note else 8 if any(k in seasonal_note for k in ("winter", "early spring", "long", "months")) else 7 if "flower" in seasonal_note else 4 if any(k in seasonal_note for k in ("short", "brief")) else 6
        text = add_plant_rank(text, "Biodiversity value", bio_score)
        text = add_plant_rank(text, "Seasonal highlight", seasonal_score)
        if 'class="plant-relationships"' not in text and 'id="plant-relationships"' in text:
            text = text.replace('                <h2 id="plant-relationships"', '                <section class="plant-relationships">\n                <h2 id="plant-relationships"', 1)
            text = text.replace('          <h2 id="references-and-justification"', '                </section>\n\n          <h2 id="references-and-justification"', 1)
        if 'class="plant-calendar"' not in text:
            marker = '          <h2 id="references-and-justification"'
            if marker in text:
                text = text.replace(marker, plant_calendar() + "\n\n" + marker, 1)
        write_if_changed(path, inject_shared_scripts(clean_common_language(text)))

    index = ROOT / "plants" / "index.html"
    text = index.read_text(encoding="utf-8")
    text = text.replace('aria-label="Search plants by common or Latin name">', 'aria-label="Search plants by common or Latin name" data-predictive-search="plants">')
    write_if_changed(index, inject_shared_scripts(clean_common_language(text)))


def update_locations() -> None:
    index = ROOT / "locations" / "index.html"
    text = index.read_text(encoding="utf-8")
    coverage_note = ('<div class="coverage-village-note"><strong>Live nearby?</strong> If your village or hamlet is not listed, that does not mean we cannot help. '
                     'We regularly work in surrounding areas across Oxfordshire, Buckinghamshire, Berkshire and parts of Bedfordshire. '
                     'Send us your postcode and we will confirm the nearest practical route.</div>')
    if "coverage-village-note" not in text:
        anchor = '<div class="loc-search"'
        if anchor in text:
            text = text.replace(anchor, coverage_note + "\n\n      " + anchor, 1)
    text = text.replace('aria-label="Search locations"', 'aria-label="Search locations" data-predictive-search="locations"')
    # Town selection from search should move to the panel on mobile; card clicks
    # already do this in the existing interaction code.
    text = text.replace("// V2.2: Do NOT scrollIntoView - the visitor stays at the atlas.\n        // The map, right panel, swiper card, and Town Intelligence all update in place.", "if (window.matchMedia('(max-width: 768px)').matches) {\n          document.getElementById('townIntel').scrollIntoView({ behavior: 'smooth', block: 'start' });\n        }")
    text = text.replace("selectTown(card.getAttribute('data-slug'), 'swiper');\n          }\n        });", "selectTown(card.getAttribute('data-slug'), 'swiper');\n            document.getElementById('townIntel').scrollIntoView({ behavior: 'smooth', block: 'start' });\n          }\n        });", 1)
    write_if_changed(index, inject_shared_scripts(clean_common_language(text)))

    for path in (ROOT / "locations").glob("*.html"):
        if path.name == "index.html":
            continue
        text = path.read_text(encoding="utf-8")
        text = re.sub(r'If you are in ([^<]+?) or the surrounding area and need help with your garden, contact us on WhatsApp and we will aim to respond within 12 to 36 hours, Monday to Sunday\.', r'If you are in \1, a nearby village or a surrounding hamlet and need help with your garden, contact us on WhatsApp. We regularly cover the surrounding area and will aim to respond within 12 to 36 hours, Monday to Sunday.', text)
        write_if_changed(path, inject_shared_scripts(clean_common_language(text)))


def update_passport() -> None:
    path = ROOT / "garden-passport" / "index.html"
    text = path.read_text(encoding="utf-8")
    qr_start = text.find('          <div style="background:var(--forest-dark);padding:3rem 2rem;border-radius:2px;text-align:center;">')
    qr_end = text.find('          </div>\n          <p class="editorial-feature__caption">', qr_start)
    if qr_start != -1 and qr_end != -1:
        visual = '''          <div class="passport-plaque-visual">\n            <img src="/chilterngardenmaintenance-updatedsite/images/project/qr-plaque-lavender.jpeg" alt="CGM lavender QR plaque examples with plant care information" loading="lazy" decoding="async">\n            <p class="passport-plaque-visual__label">A weatherproof CGM plant tag, made to stay useful in the garden.</p>\n          </div>\n'''
        text = text[:qr_start] + visual + text[qr_end + len('          </div>\n'):]
    text = text.replace("<p class=\"editorial-feature__caption\">Each tag is laser-engraved on weatherproof anodised aluminium, ~30mm × 20mm, fixed with a discreet stainless stake.</p>", "<p class=\"editorial-feature__caption\">Each tag is a weatherproof QR plaque with a discreet finish, fixed next to the plant so its care record remains easy to find.</p>")
    text = text.replace("Print-your-own tags", "Order QR tags")
    text = text.replace("We send you a PDF of QR-coded tags for every plant in your garden, plus fixing stakes. You print at home (laser printer recommended) or we can print on weatherproof material for £2 per tag.", "Order 20 weatherproof QR tags and we will ship them to you, ready to place beside the plants in your garden. Each tag links to the relevant care profile and remains useful as the garden develops.")
    text = text.replace("£60", "£45 for 20 tags")
    text = text.replace("We need a list of your plants first - we can identify them from photos for £45.", "Additional tags are £4 each. Send us your plant list or photographs and we will prepare the correct profiles.")
    text = text.replace("<li>PDF of QR-coded tags (print at home)</li>\n            <li>Fixing stakes included</li>\n            <li>Per-plant profile registration</li>\n            <li>Plant ID from photos (+&pound;45)</li>\n            <li>Weatherproof printing available (+&pound;2/tag)</li>", "<li>20 weatherproof QR tags shipped to you</li>\n            <li>Per-plant profile registration</li>\n            <li>Plant identification from photographs where needed</li>\n            <li>Additional tags available at £4 each</li>\n            <li>Tags remain live permanently</li>")
    text = text.replace("Get the PDF &rarr;", "Order your tags &rarr;")
    text = text.replace("Yes - see Option 3 above.", "Yes, see the Order QR tags option above.")
    write_if_changed(path, inject_shared_scripts(clean_common_language(text)))


def fix_article_review_dates() -> None:
    for path in (ROOT / "tips").glob("*.html"):
        text = path.read_text(encoding="utf-8")
        text = re.sub(r'(Last reviewed</p>\s*<p[^>]*>)(\d{1,2} [A-Za-z]+ \d{4})(</p>)', r'\g<1>19 July 2026\g<3>', text, count=1)
        write_if_changed(path, text)


def refine_article_copy() -> None:
    old = ('Unlike most sites, we do not delegate our written articles to a web developer with no garden experience. '
           'Each article is written by our own gardeners, who have direct hands on experience. '
           'We write these pieces because clients ask questions and the answers are worth sharing with you. ')
    new = ('Unlike most sites, we do not delegate our written articles to a web developer with no garden experience. '
           'Each and every article is hand written by our in team gardeners, who have direct hands on experience. '
           'We write each article when a client asks a question and we feel the answer should be shared with you. ')
    for path in (ROOT / "tips").glob("*.html"):
        text = path.read_text(encoding="utf-8")
        text = text.replace(old, new)
        write_if_changed(path, text)


def add_plant_links_to_articles() -> None:
    plant_card = ('<a class="article-tool-links__card cgm-tilt" href="/chilterngardenmaintenance-updatedsite/plants/">'
                  '<span class="article-tool-links__label">Explore plants suited to Chiltern gardens</span>'
                  '<span class="article-tool-links__arrow">Open plant library <span aria-hidden="true">&rarr;</span></span></a>')
    pattern = re.compile(r'(<div class="article-tool-links__grid">)(.*?)(</div>\s*</section>)', re.S)
    for path in (ROOT / "tips").glob("*.html"):
        if path.name == "index.html":
            continue
        text = path.read_text(encoding="utf-8")
        if "Explore plants suited to Chiltern gardens" not in text:
            text, count = pattern.subn(r'\1\2' + plant_card + r'\3', text, count=1)
            if count:
                write_if_changed(path, text)


def update_all_html() -> None:
    for path in ROOT.rglob("*.html"):
        text = clean_common_language(path.read_text(encoding="utf-8"))
        write_if_changed(path, inject_shared_scripts(text))


def clean_all_language() -> None:
    for path in ROOT.rglob("*.html"):
        write_if_changed(path, clean_common_language(path.read_text(encoding="utf-8")))


def main() -> None:
    update_all_html()
    update_homepage(ROOT / "index.html")
    update_homepage_js(ROOT / "js" / "homepage-enhancements.js")
    update_services()
    update_articles()
    update_plants()
    update_locations()
    update_passport()
    print("Applied CGM website revision updates")


if __name__ == "__main__":
    if "--fix-review-dates" in sys.argv:
        fix_article_review_dates()
    elif "--fix-copy" in sys.argv:
        refine_article_copy()
    elif "--fix-article-links" in sys.argv:
        add_plant_links_to_articles()
    elif "--clean-language" in sys.argv:
        clean_all_language()
    else:
        main()
