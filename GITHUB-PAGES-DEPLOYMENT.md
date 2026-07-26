# CGM GitHub Pages deployment

This folder is the **repository root** for:

`https://jjw37.github.io/chilterngardenmaintenance-updatedsite/`

Upload the contents of this folder so that `index.html`, `css/`, `js/`,
`images/`, `images-ppt/`, `plants/`, `tips/`, `locations/` and the other directories sit at
the top level of the repository. Do not upload the enclosing folder itself.

`images-ppt/` contains the restored plant photographs. Keep this directory
with the site; the plant index and all 130 plant profiles use it.

## Why the previous upload failed

GitHub's browser uploader placed most files from `plants/` and `tips/` at the
repository root. It also allowed a later `index.html` upload to replace the
real homepage with a truncated plant-library fragment. The browser's 100-file
limit is not a repository limit; use Git, GitHub Desktop, or the GitHub plugin
to upload the whole tree in one commit.

## Recommended upload with GitHub Desktop

1. Clone `JJW37/chilterngardenmaintenance-updatedsite`.
2. Copy everything inside this folder into the cloned repository.
3. Replace the existing files when prompted. Keep the folder structure.
4. In GitHub Desktop, review the changes, commit them, and click **Push origin**.
5. In the repository's Pages settings, use the `main` branch and `/ (root)`.

The result must have this shape:

```text
index.html
css/styles.css
js/main.js
images/plant-header.jpg
images-ppt/a78848e0a320.jpg
plants/index.html
plants/lavender.html
tips/index.html
tips/garden-clearance-cost.html
locations/index.html
```

Do not leave the old flattened copies at the repository root. The cleanest
method is to replace the repository contents from this folder and commit the
deletions and additions together.

## Command-line upload

From a terminal:

```bash
git clone https://github.com/JJW37/chilterngardenmaintenance-updatedsite.git
cd chilterngardenmaintenance-updatedsite
# Copy the contents of this deployment folder into this directory.
git add -A
git commit -m "Restore complete GitHub Pages site structure"
git push origin main
```

The current files are already prefixed for the project-site path. If the site
later moves to a custom domain or a user-site repository, rebuild from the
original root-domain ZIP rather than keeping this prefix.
