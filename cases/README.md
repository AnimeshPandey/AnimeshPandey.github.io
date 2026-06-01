# The Frontend Casebook

Growth.Design-style scrollable case studies for frontend engineers.  
Live at **[anmshpndy.com/cases/](https://anmshpndy.com/cases/)**.

## Stack

| Layer | Choice |
|-------|--------|
| SSG | Eleventy 11 (`@11ty/eleventy ^2.0.1`) |
| CSS | Vanilla custom properties (casebook-tokens + casebook-layout + casebook-components) |
| JS | Vanilla ES modules (no bundler, no framework) |
| Deploy | GitHub Actions → GitHub Pages (built in CI, output merged at `/cases/`) |

## Local development

```bash
cd cases
npm install
npm start          # http://localhost:8080/
```

> **Note:** `foundation.css` and `theme.css` are served from the portfolio root (`/assets/`) in production. During local dev those paths resolve to `localhost:8080/assets/...` which won't exist unless you run a second server at the portfolio root. The casebook renders without them (tokens fall back to browser defaults).

## Build

```bash
npm run build      # outputs to cases/_site/
```

In CI, the build runs automatically on push to `main`. The `_site/` output is merged into the portfolio artifact at `_deploy/cases/` by the GitHub Actions workflow.

## Content

- **`src/_data/manifest.json`** — auto-generated master list of all 220+ planned cases. Only entries with `status: "live"` get permalinks, sitemap entries, and RSS items.
- **`src/cases/<slug>/index.njk`** — one Nunjucks file per case; uses `case-layout.njk`
- **`src/cases/<slug>/casey.json`** — tier-aware hints, anecdotes, and voice script for Casey

## Casey mascot assets

Regenerate harmonized SVGs (reference-inspired + character bible):

```bash
node scripts/generate-casey-svgs.mjs
```

Outputs `src/assets/casey/{junior,mid,staff}/*.svg`, `style-anchor/`, and `hub/casey-empty.svg`. See `src/assets/casey/STYLE-GUIDE.md`.

## Architecture decisions

- No portfolio service worker, theme.js, or recruiter scripts on `/cases/*`
- `casebook-color-mode` is independent of portfolio `theme` key (light / dark / system)
- Event bus: `casebook-tone-change` and `casebook-color-change` custom DOM events
- Progressive enhancement: story chapters are readable without JS; demo shows fixed state via `hidden` + JS reveal
- WCAG 2.2 AA target; PRM via `.casebook--reduce-motion`

## Adding a new case

1. Set `status: "live"` and `publishedAt` on the manifest entry
2. Create `src/cases/<slug>/index.njk` (copy from skeleton-screens template)
3. Create `src/cases/<slug>/casey.json` with hints + anecdotes + actions per chapter
4. Create `src/assets/js/demos/<slug>.js` — import and use `wireToggleDemo` from `./_demo-utils.js`
5. Push → CI builds and deploys automatically

**Demo module contract:**

```js
// src/assets/js/demos/<slug>.js
import { wireToggleDemo, PRM } from './_demo-utils.js';

export function initDemo(root, dataset) {
  wireToggleDemo(root, {
    renderBroken: (vp) => { vp.innerHTML = '…'; },
    renderFixed:  (vp) => { vp.innerHTML = '…'; },
  });
}
```

`demo-loader.js` dynamically imports `./demos/${slug}.js` and calls `initDemo(root, root.dataset)`.

## Refreshing the manifest

The manifest is generated from the planning repo track files. After adding cases in `ideas/projects/case-studies/`, regenerate it:

```bash
python3 ../ideas/projects/case-studies/scripts/merge-tracks-to-manifest.py \
  > src/_data/manifest.json
```

Run from the repo root (`AnimeshPandey.github.io/`). Then set `status: "live"` and `publishedAt` on the flagship entry before committing.

## Architecture reference

Full architecture spec: `ideas/projects/case-studies/docs/platform/PLATFORM-ARCHITECTURE.md`

Key contracts:
- `site.json` is the only URL source — all paths use `{{ '/path/' | url }}` (Eleventy pathPrefix-aware)
- `liveCases` collection drives permalinks, sitemap, and RSS — only `status: live` entries
- JS modules communicate via custom events (`casebook-tone-change`, `casebook-color-change`), never direct imports
- `data-asset-base` on `<html>` is the only runtime URL the JS needs

## Current status (2026-06-01)

**Shipped:** 31 live interactive cases with working demos · reading library (779 articles) · faceted filters · company pages · Pro tier stubs · SEO (sitemap, JSON-LD, Lighthouse script) · Casey hub/FSM/guide/breathe/blink

**In progress:** content polish on 22-case MVP set (story, fe-depth, references, images)

## Deferred (not yet built)

- Casey style anchors + premium SVG art regen (SVG body colour has drift — see `frontendcs-corpus/prompt-casey-style-anchors.md`)
- Casey hub hero WebP (currently uses `wave.svg` — see `frontendcs-corpus/prompt-casey-hub-hero.md`)
- Casey memory system / localStorage progress tracking (see `frontendcs-corpus/prompt-casey-memory.md`)
- Casey library strip on `/cases/library/` (see `frontendcs-corpus/prompt-casey-library-strip.md`)
- `/whats-new/` changelog page
- "New" badge on hub cards (< 14 days since `publishedAt`)
- `case-share.njk` Web Share API
- Track hub pages (`/cases/tracks/{id}/`)
- Pagefind static search
- Buttondown newsletter CI send on publish
- `payments.enabled: true` → flip at 100 MAU
