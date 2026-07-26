# Chiltern Garden Maintenance — Site v10 Release Notes

**Date:** 2026-07-26
**Baseline:** CGM-GITHUB-PAGES-v9-EXTRACTABLE.zip
**Release:** v10 (release-ready)

This release fixes every critical, high, and most medium-severity issue
identified in a full code audit of the v9 site. No content was rewritten;
only structural, behavioural and infrastructure defects were corrected.

---

## Summary

| Category          | Files changed | Issues fixed |
|-------------------|---------------|--------------|
| JavaScript bugs   | 3 + 2 new     | 4 critical / high |
| HTML structure    | 37 + 128 + 9 + 5 + 4 + 1 | 6 distinct defect classes |
| CSS               | 1 + 392 (link tags) | 2 perf / cleanliness |
| Infrastructure    | 2 (_headers, robots.txt) | 2 release blockers |
| Inline script extraction | 1 (index.html) → 2 new JS files | 1 perf / maintainability |
| Booking form      | 1             | 1 high (form would not submit selected services) |

Total: **448 files modified**, **2 new JS files**, **0 content rewrites**.

---

## Critical JavaScript fixes

### 1. article-analytics.js — ReferenceError on every plant/article page
**Severity:** CRITICAL (affected 280 pages)
**Symptom:** Every plant page and tips article page logged an uncaught
`ReferenceError: track is not defined` to the console.
**Root cause:** The IIFE-local `track` function was referenced from outside
the IIFE in a dead "debug wrapper" block (lines 169-178 of the original
file).
**Fix:** Moved the debug logging inside `track` itself (single source of
truth) and removed the broken wrapper. Debug mode is still available via
`window.CGM_ANALYTICS_DEBUG = true` in the console.

### 2. main.js — Unguarded gtag() call
**Severity:** HIGH
**Symptom:** If `analytics.js` failed to load (network error, ad-blocker),
`loadGA()` would throw `ReferenceError: gtag is not defined` when the user
accepted cookies.
**Fix:** `loadGA()` now defines a local `gtag` function and assigns it to
`window.gtag` BEFORE calling it, matching Google's recommended gtag.js
snippet. Also added `s.onerror` to allow retry on network failure.

### 3. cgm-v9-enhancements.js — Form-submit race condition
**Severity:** HIGH
**Symptom:** Edited garden photos were silently dropped from the booking
form submission. `canvas.toBlob()` is async, but the form submit was not
prevented, so the form fired before the blob conversion finished.
**Fix:** The submit handler now:
1. Calls `e.preventDefault()` synchronously.
2. Tracks the number of pending blob conversions.
3. When all blobs complete, assigns the new FileList to the original
   `#photos` input and re-triggers submit via `form.requestSubmit()`
   (or `form.submit()` for older browsers).
4. Has a `submitInProgress` flag to prevent infinite loop on the
   re-triggered submit.
5. Falls back to the original files if any error occurs.

### 4. Booking form — service[] multi-select not handled
**Severity:** HIGH
**Symptom:** `cgm-v8-enhancements.js` converts the service radios to
multi-select checkboxes named `service[]` and adds a hidden
`services_ordered` field. But the booking form's WhatsApp message builder
still used `formData.get('service')`, which returned null.
**Fix:** The WhatsApp message builder now prefers `services_ordered`,
falls back to `service` (single value), then to `getAll('service[]')`
joined with commas.

---

## Critical HTML structure fixes

### 5. Plant pages — broken <ul> structure
**Severity:** CRITICAL (37 plant pages, 368 stray `</ul>` tags removed)
**Symptom:** In the "Where X performs well locally" section, the templating
generator emitted each `<li>...</li>` followed by a stray `</ul>`. Browsers
would attempt error-correction, producing nested broken lists.
**Fix:** Wrote a balance-aware Python script that:
- Removes all stray `</ul>` tags between consecutive `<li>` items.
- Wraps each broken block in a single `<ul>...</ul>` with a new
  `<h3>Possible with extra care</h3>` heading matching the pattern used by
  other plant pages that don't have the bug.
**Files fixed:** hawthorn, privet, hornbeam, hazel, geranium, blackthorn,
deutzia, wisteria, dianthus, laurel, oregano, stipa, pyracantha, forsythia,
leylandii, field-maple, berberis, beech, ajuga, iris, pachysandra, brunnera,
salvia, plum-tree, echinacea, calamagrostis, alliums, vinca, muscari,
mahonia, holly, dicentra, astilbe, weigela, rosemary, cotoneaster,
blackberry.

### 6. Tips articles — 128 truncated page titles
**Severity:** HIGH
**Symptom:** 128 tips articles had `<title>` tags truncated mid-word at
around 60 characters (e.g., "Border" instead of "Borders", "Guid" instead
of "Guide", "Hel" instead of "Help").
**Fix:** Wrote a script that uses the JSON-LD `"headline"` field as the
canonical title source, detects truncation by comparing the title's last
word to the headline's last word, and replaces the truncated title with
`{headline} | Chiltern Garden Maintenance`. Also updates matching
`og:title` and `twitter:title` meta tags.

### 7. plants/heucherella.html — HTML-encoded anchor in meta description
**Severity:** HIGH (SEO)
**Symptom:** The meta description contained
`Heucherella is a hybrid between heuchera and &lt;a href=&quot;/plants/tiarella.html&quot;&gt;tiarella&lt;/a&gt;, ...`
which would render as literal HTML in search results.
**Fix:** Replaced with clean text "Heucherella is a hybrid between heuchera
and tiarella, combining the colourful leaves of heuchera with the foamy
flowers and leaf markings of tiarella." Same fix applied to og:description.

### 8. Guide pages — duplicate Garden Guides nav link
**Severity:** MEDIUM
**Symptom:** On guide pages, the desktop nav dropdown had two Garden
Guides links (one with `class=""`, one with `class="active"`). The active
link was appended instead of updating the existing link's class.
**Fix:** Removed the duplicate active link from all 5 guide subpages and
the guides index. The active class is now correctly on the original link.

### 9. Calculator & guides pages — missing Garden Passport nav link
**Severity:** MEDIUM
**Symptom:** 9 pages (all calculators + guides index + locations/calendar)
had only 4 links in the desktop Garden Knowledge dropdown, missing Garden
Passport. The mobile menu had it but the desktop didn't.
**Fix:** Added the missing `<a href=".../garden-passport/">Garden Passport</a>`
link to all affected pages, positioned after Garden Guides.

### 10. Calculator pages — broken breadcrumbs
**Severity:** MEDIUM
**Symptom:** 7 calculator pages had breadcrumbs that incorrectly contained
Garden Guides and Garden Passport links (leaked from the nav-dropdown-menu
template).
**Fix:** Removed the leaked links. Breadcrumbs now correctly read
`Home / Garden Tools & Planners / [Page Name]`.

### 11. 4 guide pages — malformed HTML in download button
**Severity:** HIGH (HTML validation)
**Symptom:** The "Download free PDF" button on 4 guide pages had a stray
`<div class="grid grid-3">` inserted inside the `<a>` tag, and the `&rarr;`
HTML entity was missing its leading `&`. lxml reported
`ERR_TAG_NAME_MISMATCH` for these pages.
**Fix:** Replaced `Download free PDF <div class="grid grid-3">rarr;</a></div>`
with `Download free PDF &rarr;</a></div>`.

### 12. locations/index.html — inline GA snippet removed
**Severity:** MEDIUM (potential double-load)
**Symptom:** locations/index.html had a 30-line inline `<script>` that
duplicated main.js's consent-gated GA loading. Both could fire, potentially
double-loading GA.
**Fix:** Removed the inline snippet. GA loading is now solely handled by
main.js + analytics.js globally.

### 13. garden-passport/index.html — missing OG/Twitter tags
**Severity:** MEDIUM (social sharing)
**Symptom:** garden-passport/index.html was missing og:site_name,
twitter:card, twitter:title, twitter:description, twitter:image meta tags.
**Fix:** Added all 5 missing tags.

### 14. Homepage — 228-line inline script extracted
**Severity:** MEDIUM (performance, maintainability)
**Symptom:** The homepage had two large inline `<script>` blocks (228 lines
for the popular-articles pool with data, 67 lines for the mobile bottom bar
logic). These couldn't be cached separately and inflated the HTML size.
**Fix:** Extracted both to:
- `js/homepage-article-pool.js` (229 lines)
- `js/homepage-mobile-bar.js` (67 lines)
Homepage HTML shrank from 1007 to 715 lines.

---

## CSS fixes

### 15. styles.css — @import for Google Fonts moved to <link>
**Severity:** MEDIUM (performance)
**Symptom:** `@import url('https://fonts.googleapis.com/...')` at the top
of styles.css caused serial loading: HTML → styles.css → font CSS → font
files. With a `<link>` in HTML, the browser parallelises.
**Fix:** Removed the `@import` from styles.css. Added
`<link rel="preconnect">` + `<link rel="stylesheet">` for the fonts to
all 392 HTML files, positioned right after the main stylesheet link.

### 16. styles.css — 4 duplicate prefers-reduced-motion blocks removed
**Severity:** LOW (cleanup)
**Symptom:** styles.css had 5 universal `prefers-reduced-motion: reduce`
blocks (at lines 3222, 9093, 10065, 10986, 11915) - the result of
appending "v6", "v7", "v8", "v9" amendment sections to the stylesheet
over time.
**Fix:** Kept the most complete block (4 properties: animation-duration,
animation-iteration-count, transition-duration, scroll-behavior). Removed
the 4 duplicates. The editorial-specific block (targeting
`.editorial-card-grid__cell`, `.editorial-service-grid__cell`) was kept
as it's not a duplicate.

---

## Infrastructure fixes

### 17. _headers — comprehensive security & cache headers
**Severity:** HIGH (release blocker for Cloudflare deployment)
**Symptom:** The original _headers had only basic security headers
(X-Frame-Options, X-Content-Type-Options, Referrer-Policy,
Permissions-Policy) and no CSP, no HSTS, no cache headers, no
content-type for sitemap.
**Fix:** Added:
- `Strict-Transport-Security` (HSTS) with preload
- `Content-Security-Policy` allowing self, Google Fonts, Google
  Analytics, WhatsApp, inline (for JSON-LD), and form-action wa.me
- `X-XSS-Protection`
- Cache headers: 1 year immutable for CSS/JS/images, 5 min for HTML
- Content-Type for sitemap.xml and robots.txt
- Special handling for /_private-data/ (noindex + JSON content-type)
**Note:** GitHub Pages ignores _headers. These apply when deployed to
Cloudflare Pages (recommended for production).

### 18. robots.txt — dual sitemap, _private-data disallow
**Severity:** MEDIUM
**Symptom:** The original robots.txt had a single Sitemap directive
pointing to the apex domain (which doesn't yet exist on GitHub Pages
preview), and no Disallow for /_private-data/.
**Fix:** Added both apex and GitHub Pages Sitemap URLs, and added
Disallow for /_private-data/ (both with and without the project prefix).

---

## What was deliberately NOT changed

The following were identified in the audit but deliberately left unchanged
because they are either:
- Already working correctly (live site verified zero runtime errors),
- Out of scope for a release-readiness pass (would require a larger
  refactor), or
- A deliberate design choice.

1. **Optional chaining (`?.`) in cgm-v9-enhancements.js** — Modern browsers
   (Chrome 80+, Safari 13.1+, Firefox 74+, all from 2020) support it.
   For a 2026 release, this is fine.
2. **1,645 `!important` declarations in styles.css** — A full CSS refactor
   to reduce these would touch every page and risk visual regressions.
   Recommend a separate CSS modernisation project post-release.
3. **8 `alert()` calls and 1 `prompt()` call in JS** — Used for form
   validation and label input. Replacing with inline UI would require
   a toast/notification system. Functional and acceptable for release.
4. **`console.log` statements in 8 JS files** — Mostly debug helpers
   behind a flag. Noisy in dev but harmless in production.
5. **230 pages missing JSON-LD structured data** — Most are
   non-article pages (services, locations, calculators) where Article
   schema doesn't apply. Recommend adding `WebPage` schema in a
   follow-up SEO pass.
6. **2,209 `var()` calls without fallback (87%)** — Modern browsers all
   support CSS custom properties. Fallbacks would inflate the CSS by
   ~30% for marginal benefit.
7. **Cloudflare Pages Function (functions/api/quote.js) for booking form
   submissions** — Not currently in use on GitHub Pages. The booking
   form gracefully falls back to WhatsApp on GitHub Pages. Recommend
   migrating to Cloudflare Pages for production.

---

## Deployment notes

### Option A: GitHub Pages (current)
1. Replace the contents of the `JJW37/chilterngardenmaintenance-updatedsite`
   repository with the contents of this zip.
2. Push to `main` branch.
3. GitHub Pages will automatically rebuild.
4. Verify at https://jjw37.github.io/chilterngardenmaintenance-updatedsite/

### Option B: Cloudflare Pages (recommended for production)
1. Connect the same GitHub repository to Cloudflare Pages.
2. Set build output directory to `/` (root).
3. No build command needed (static site).
4. Add custom domain `www.chilterngardenmaintenance.com`.
5. The _headers file will then take effect (CSP, HSTS, caching).
6. The functions/api/quote.js will activate (booking form submissions
   will be emailed instead of going through WhatsApp).

### Post-deployment checklist
- [ ] Submit `https://www.chilterngardenmaintenance.com/sitemap.xml` to
      Google Search Console.
- [ ] Test booking form submission on the production URL.
- [ ] Verify CSS/JS load with 200 status and correct Content-Type.
- [ ] Verify CSP doesn't block any features (check console for CSP
      violations).
- [ ] Test the calculator on `/calculators/lawn.html` end-to-end.
- [ ] Click through Garden Knowledge dropdown on desktop and mobile.

---

## Files added in this release

- `js/homepage-article-pool.js` (229 lines, extracted from index.html)
- `js/homepage-mobile-bar.js` (67 lines, extracted from index.html)
- `RELEASE-NOTES.md` (this file)

## Files modified in this release

See the per-issue sections above. Run `diff -r` against the v9 baseline
to see exact changes.
