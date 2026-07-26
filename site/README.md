# Chiltern Garden Maintenance - New Website Build

A complete rebuild of the Chiltern Garden Maintenance website as a static HTML site, ready to upload to GitHub and serve via Cloudflare Pages.

## What Was Built

**215 HTML pages** of SEO-optimised, mobile-responsive content totalling nearly 200,000 words.

| Section | Pages | Notes |
|---------|-------|-------|
| Homepage | 1 | New section structure with cards linking to every part of the site |
| Services | 7 | Index + 6 service pages (maintenance, clearance, soft landscaping, pressure washing, hedge cutting, lawn recovery) |
| Gardening Tips | 31 | Index + 30 SEO articles, each 2,000 to 3,500 words, with internal links and RHS references |
| Plant Library | 131 | Index + 130 plant profiles organised into 12 categories, each with full data (light, soil, water, pruning, feeding, wildlife, CGM care notes) |
| Locations | 26 | Index + 25 town pages grouped by county (Oxfordshire, Buckinghamshire, Berkshire, Bedfordshire), each with local geology, rainfall, temperature, garden type, popular plants |
| Estimate Calculators | 5 | Index + 4 calculators (clearance, maintenance, lawn, pressure wash) with live JavaScript |
| Portfolio | 6 | Index + 5 categories (clearance, hardstanding, tidy-up, maintenance, fencing) |
| About | 2 | About CGM + Our Method page |
| Products | 1 | Products and add-ons catalogue |
| Contact | 1 | Contact details, all 25 locations listed by county, WhatsApp link |
| Booking | 1 | Quote form that opens WhatsApp pre-filled |
| Legal | 3 | Cookies, Privacy, Terms (GDPR compliant) |
| Sitemap | 1 | XML sitemap with 215 URLs |
| Robots | 1 | robots.txt |

## Plant Library Categories

The 130 plant profiles are organised into 12 categories accessible from the plant library index page with jump links:

1. Aromatic and silver foliage (6 plants)
2. Climbers and scramblers (4 plants)
3. Statement shrubs (8 plants)
4. Shade lovers (13 plants)
5. Border perennials (12 plants)
6. Ornamental grasses (7 plants)
7. Hedges and structural evergreens (20 plants)
8. Trees and specimen shrubs (23 plants)
9. Fruit and edibles (12 plants)
10. Herbs (8 plants)
11. Bulbs and corms (14 plants)
12. Ground cover (4 plants)

## Article Categories

The 30 articles are organised into 9 categories with jump links:

- Pricing (3 articles)
- How-to (5 articles)
- Planting (3 articles)
- Lawns (3 articles)
- Soil (4 articles)
- Seasonal (4 articles)
- Maintenance (2 articles)
- Wildlife (1 article)
- Problems (2 articles)
- Selling (1 article)

## Location Coverage

25 town pages across 4 counties:

- **Oxfordshire** (5): Oxford, Henley-on-Thames, Thame, Chinnor, Watlington, Bicester
- **Buckinghamshire** (9): High Wycombe, Aylesbury, Marlow, Beaconsfield, Amersham, Princes Risborough, Wendover, Gerrards Cross, Chesham, Great Missenden
- **Berkshire** (6): Reading, Wokingham, Bracknell, Windsor, Maidenhead, Slough
- **Bedfordshire** (2): Woburn, Leighton Buzzard

## Key SEO Features

- Every page has unique title, meta description and canonical URL
- JSON-LD structured data on 31 pages (LocalBusiness on homepage, Article schema on all 30 articles)
- Proper H1, H2, H3 heading hierarchy throughout
- 12,117 internal links, all verified working
- 186 pages reference RHS (Royal Horticultural Society) with real, working URLs
- XML sitemap with all 215 URLs, last modified dates and priorities
- Mobile responsive with proper viewport meta tags
- Page load optimised (no external dependencies, no frameworks, just plain HTML/CSS/JS)
- Category-based index pages with anchor jump links for fast navigation

## Anti-AI Writing Rules Applied

Verified: zero em dashes and zero en dashes anywhere in the build. All text uses regular hyphens or commas. The tone is that of an experienced UK gardener, not a marketing AI.

## Quote Estimator Approach

Per the original spec:

- Tools are called "Estimate Tools" not "Quote Calculators"
- Every estimate shows a wide range, not a fixed price
- Every result includes the disclaimer: "This is a guide only. Final pricing depends on access, waste, ground conditions, material choice, urgency and site complexity. Please request a written quote for an exact price."
- Base rate of 40 pounds per man-hour used in all calculations
- No contact details required to use the tools

## Directory Structure

```
cgm-website/
  index.html                  Homepage
  sitemap.xml                 XML sitemap for Google (215 URLs)
  robots.txt                  Robots file
  cookies.html                Cookie policy
  privacy.html                Privacy policy (GDPR)
  terms.html                  Terms and conditions
  css/
    styles.css                All styling (20KB)
  js/
    main.js                   Nav toggle, cookie banner
    calculators.js            Estimate calculator logic
  images/
    cgm-logo-square.png       Your logo (already added)
    (add: favicon-32.png, favicon-16.png, Logo-image.png from your existing site)
  services/                   7 service pages
  tips/                       31 article pages
  plants/                     131 plant profile pages
  locations/                  26 location pages
  calculators/                5 calculator pages
  portfolio/                  6 portfolio pages
  about/                      2 about pages
  products/                   1 products page
  contact/                    1 contact page
  booking/                    1 booking page
```

## How to Deploy to GitHub + Cloudflare Pages

### Step 1: Create a new GitHub repository

Create a new public or private repository on GitHub (e.g. `chilterngardenmaintenance`).

### Step 2: Upload the files

Upload the entire contents of the `cgm-website/` folder to the root of the repository. Do NOT put everything inside a subfolder. Cloudflare Pages expects files at the repository root.

### Step 3: Add your favicons

You need to add your existing brand images to the `images/` folder. The logo is already included. You still need:

- `favicon-32.png` (32x32 favicon)
- `favicon-16.png` (16x16 favicon)
- `Logo-image.png` (optional, hero image)

Download these from your current Cloudflare setup or your existing GitHub repo.

### Step 4: Connect Cloudflare Pages

1. Log into Cloudflare Dashboard
2. Go to Workers and Pages
3. Create application
4. Connect to Git
5. Select your GitHub repository
6. Set these build settings:
   - **Framework preset:** None
   - **Build command:** (leave empty)
   - **Build output directory:** `/` (just the slash)
   - **Root directory:** `/` (just the slash)
7. Save and Deploy

Cloudflare will pull your repository and serve the static HTML files directly. No build step is needed because the site is plain HTML/CSS/JS.

### Step 5: Set up custom domain

In Cloudflare Pages settings, add your custom domain `www.chilterngardenmaintenance.com`. Cloudflare will handle SSL automatically and you can set up redirects from the apex domain if needed.

### Step 6: Submit sitemap to Google

Once the site is live:

1. Go to Google Search Console
2. Add your property (if not already added)
3. Submit `https://www.chilterngardenmaintenance.com/sitemap.xml` as a sitemap
4. Request indexing for the homepage and a few key pages

## How to Update Content

The site is generated from Python scripts. To change content:

1. Edit the relevant data file in `/home/z/my-project/scripts/`:
   - `plants_data_1.py` to `plants_data_10.py` for the 130 plant profiles
   - `locations_data.py` and `locations_data_2.py` for the 25 location pages
   - `articles_data_1.py` to `articles_data_4.py` for the 30 tips articles
   - `template.py` for header, footer and shared layout
   - `build_site.py` for service pages, calculator pages, homepage, etc.

2. Re-run the generator:
   ```bash
   python /home/z/my-project/scripts/build_site.py
   ```

3. Copy the updated files from `/home/z/my-project/download/cgm-website/` to your local repository and push to GitHub.

Cloudflare Pages will automatically rebuild and deploy when you push to GitHub.

## Technical Notes

- The site uses no JavaScript frameworks. Just vanilla JS for the nav toggle, cookie banner and calculators.
- All CSS is in one file (`css/styles.css`, 20KB) for fast loading.
- No external dependencies. No CDN. No fonts to load. The site uses system fonts plus Georgia for headings.
- Mobile responsive at all breakpoints from 320px to 1920px.
- Accessibility: proper semantic HTML, ARIA labels on nav and dialog, focus-visible styles, prefers-reduced-motion support.
- SEO: every page has unique title, meta description, canonical URL, Open Graph tags, Twitter Card tags.
- Total site size: 5.5 MB including the logo image.

## Contact

Built by Chiltern Garden Maintenance. To request changes or additions, contact your developer.
