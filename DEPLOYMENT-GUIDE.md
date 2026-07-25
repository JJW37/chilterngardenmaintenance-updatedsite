# CGM Site v10 - Deployment Guide

## Current situation

The live site at https://jjw37.github.io/chilterngardenmaintenance-updatedsite/ shows:

- ✅ **Round-1 fixes deployed** (you can see these live now):
  - 8-bar cal-strips on all 65 town pages
  - town-link-card grids on town pages
  - Featured section sliding carousel fix (flex-direction: row)
  - Mobile photo upload canvas fix (Math.max guard)
  - 128 truncated tips titles fixed
  - article-analytics.js ReferenceError fixed
  - 37 plant pages broken UL structure fixed
  - heucherella meta description fixed
  - Duplicate nav links removed
  - Missing Garden Passport links added
  - Broken breadcrumbs fixed
  - Inline GA snippet removed from locations/index.html
  - Homepage inline scripts extracted to external JS files
  - CSS @import moved to <link> tags
  - Duplicate prefers-reduced-motion blocks removed
  - Comprehensive _headers file
  - Dual-sitemap robots.txt

- ❌ **Round-2 fixes NOT YET deployed** (in this zip, need to push):
  - portfolio/hardstanding.html rebuilt with modern template
  - tips/dealing-with-japanese-knotweed.html nav modernised
  - Town page soil/exposure text regenerated with clean data (v2 - fixes the "pH 7.." double-period bug)
  - Town page JS interpretation now returns separate paragraphs
  - Premium #102019 dark colour applied across the site
  - Homepage "Popular right now" cards upgraded to premium dark theme
  - Services page cards (svc-guide-card, svc-principle, svc-step) upgraded
  - Plant page CSS upgraded (plant-hero, fact-grid, plant-relationships, editorial-quick-answer)
  - .gitattributes file added for line-ending handling

## Why round-2 isn't live yet

I cannot push to your GitHub repo (JJW37/chilterngardenmaintenance-updatedsite).
You need to deploy the zip yourself.

## How to deploy (3 methods)

### Method 1: GitHub Desktop (easiest)

1. Download `/home/z/my-project/download/CGM-SITE-v10-RELEASE-READY.zip`
2. Extract the zip locally - you'll get a `site/` folder
3. Open GitHub Desktop
4. Clone your repo `JJW37/chilterngardenmaintenance-updatedsite` if not already cloned
5. Select all files in the `site/` folder and copy them into your cloned repo folder (replacing existing files)
6. **Important:** Also copy the hidden files `.gitattributes` and `.nojekyll` (they start with a dot)
7. In GitHub Desktop, you'll see all the changes listed
8. Write a commit message like "Deploy v10 round-2: premium theme, hardstanding rebuild, town text fixes"
9. Click "Commit to main"
10. Click "Push origin"
11. Wait 1-2 minutes for GitHub Pages to rebuild
12. Check https://jjw37.github.io/chilterngardenmaintenance-updatedsite/

### Method 2: Command line (git)

```bash
# Clone your repo
git clone https://github.com/JJW37/chilterngardenmaintenance-updatedsite.git
cd chilterngardenmaintenance-updatedsite

# Extract the zip to a temp location
unzip /path/to/CGM-SITE-v10-RELEASE-READY.zip -d /tmp/cgm-v10

# Copy all files (including hidden ones) from site/ to the repo root
# The trailing slash on the source is important!
cp -a /tmp/cgm-v10/site/. .

# Stage all changes
git add -A

# Commit
git commit -m "Deploy v10 round-2: premium theme, hardstanding rebuild, town text fixes"

# Push
git push origin main
```

### Method 3: GitHub web interface (NOT recommended for this many files)

The GitHub web uploader has a 100-file limit and won't handle 750+ files well.
Use Method 1 or 2 instead.

## Line-endings issue

You mentioned the GitHub docs link about line endings:
https://docs.github.com/en/get-started/git-basics/configuring-git-to-handle-line-endings

I've added a `.gitattributes` file to the zip that:
- Forces all text files (HTML, CSS, JS, JSON, XML, etc.) to use LF line endings
- Marks binary files (PNG, JPG, WebP, PDF, fonts) as binary (no conversion)
- Sets `* text=auto eol=lf` as the default

This means:
- On Windows: Git will check out files with LF (not CRLF)
- On Mac/Linux: Git will check out files with LF (as normal)
- On commit: all line endings are normalised to LF

**Before you commit, if you're on Windows, run:**
```bash
git add --renormalize .
```
This re-stages all files with the correct line endings per the .gitattributes rules.

## Verification after deployment

Once you've pushed, wait 2 minutes then check:

1. **Homepage** - https://jjw37.github.io/chilterngardenmaintenance-updatedsite/
   - "Popular right now" cards should be dark with gold accents
   - Hero and CTA bands should be deeper, more luxurious dark

2. **Amersham** (the URL you linked) - https://jjw37.github.io/chilterngardenmaintenance-updatedsite/locations/amersham.html
   - Soil section should read: "Shallow chalky loam in the valley. pH 7.5-8.0 (alkaline)."
   - No more "pH 7.." double-period bug
   - town-link-card grids instead of plain bullet lists

3. **Hardstanding portfolio** - https://jjw37.github.io/chilterngardenmaintenance-updatedsite/portfolio/hardstanding.html
   - No more top-strip with phone pills at the top
   - Modern nav dropdown with Garden Knowledge
   - Title should be "Permeable Surfaces and Hardstanding Portfolio" (not truncated "Portfoli")

4. **Services page** - https://jjw37.github.io/chilterngardenmaintenance-updatedsite/services/
   - Guide cards should be dark premium with gold icon tiles
   - Principle cards should have subtle gold framing
   - How-we-work steps should be cream/gold cards

5. **Plant page** - https://jjw37.github.io/chilterngardenmaintenance-updatedsite/plants/lavender.html
   - Hero should be dark premium with gold accent stripe
   - Fact grid cards should have hover lift with gold side accent
   - Plant relationships box should have card-grid layout (not plain bullets)

## If the upload fails or looks wrong

1. **Check .gitattributes is in the repo root** - it must be at the top level, not inside a subfolder
2. **Check .nojekyll is in the repo root** - without this, GitHub Pages runs Jekyll and may break
3. **Run `git add --renormalize .`** on Windows to fix any line-ending issues
4. **Check the GitHub Actions tab** for your repo - it shows the Pages build status
5. **Hard refresh** your browser (Ctrl+Shift+R or Cmd+Shift+R) to bypass cache

## Still need from you

- **Logo screenshot** - you mentioned a new logo/brand but no screenshot was attached. Please attach it in your next message so I can apply it everywhere (every page + the PDF guide).
