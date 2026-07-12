# The Frontend Casebook

Growth.Design-style scrollable case studies for frontend engineers.  
Live at **[anmshpndy.com/cases/](https://anmshpndy.com/cases/)**.

## Stack

| Layer | Choice |
|-------|--------|
| SSG | Eleventy 11 (`@11ty/eleventy ^2.0.1`) |
| CSS | Vanilla custom properties (casebook-tokens + casebook-layout + casebook-components) |
| JS | Vanilla ES modules (no bundler, no framework) |
| Progress | `localStorage` (`casebook-companion-v1`) + hub/case UI via `casebook-progression.js` |
| Sign-in (beta) | `/account/` — email magic-link flow; `casebook-auth.js` generates client-side link; transactional email provider not yet wired |
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

Casey runtime uses **PNG poses** (`casey-coach.js` / `casey-hub.js`). After AI batch generation, install and resize:

```bash
./scripts/install-casey-pngs.sh
```

Legacy SVG regen (fallback): `node scripts/generate-casey-svgs.mjs`. See `src/assets/casey/STYLE-GUIDE.md`.

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

**Shipped (D0–D7 complete):**
- 31 live interactive cases with working demos (22 demo modules + `_demo-utils.js`)
- Reading library — 779 English articles, faceted filters (category, company, year, sort)
- Company pages — 167 company index pages (`/cases/companies/`)
- Pro tier stubs — 81 Pro badges on hub, honor-system localStorage gate, `payments.enabled: false`
- SEO — sitemap, JSON-LD, CSS/JS route-scoping, Lighthouse check script
- Casey companion — FSM hub/case/library, hub hero motion (float/sparkles/glow), intensity prefs, coach peek, library bounce, confetti, voice v2
- Casey library strip — `casey-library-strip.njk` + `read` pose on `/cases/library/`
- Progression — `casebook-companion-v1` localStorage: case progress, confetti milestones, hub strip, case continue CTAs
- Email sign-in beta — `/account/` with copy-magic-link UX (client-side only)
- Regression tests — `tests/` static, unit, 69+ e2e including all 31 live slugs

**In progress:** content polish on 22-case MVP set (story chapters, UI strips, FE depth, references)

## Deferred (not yet built)

**Content**
- Content polish — chapter additions across the 22-case MVP set (story, ui-strip, fe-depth, references) — tracked in `ideas/projects/case-studies/DEVELOPMENT-PLAN.md` (Phase 4); the original `frontendcs-corpus/NEXT-BUILD-PLAN.md` task tracker no longer exists
- `mvpLaunch: true` manifest gating on polished 22-case set — after content complete

**Casey**
- Casey smart guide / suggestion system (`casey-guide.js` — `suggest()`, `recordEvent()`, `getProgress()`) — distinct from basic progress already in `casebook-companion-v1`
- Casey style anchors + premium art regen (SVG body colour has drift) — see `frontendcs-corpus/prompt-casey-style-anchors.md`
- Casey hub hero WebP (currently uses `wave.svg`) — see `frontendcs-corpus/prompt-casey-hub-hero.md`

**Auth**
- Transactional email for real magic links (Resend / Postmark) — replaces copy-link beta UX
- Server-side progress sync — attach `casebook-companion-v1` to signed-in user

**Discovery & distribution**
- `/whats-new/` changelog page
- "New" badge on hub cards (< 14 days since `publishedAt`)
- Track hub pages (`/cases/tracks/{id}/`) — BreadcrumbList currently proxies `?track={id}`
- Pagefind static search
- Buttondown newsletter CI send on publish

**Monetization**
- `payments.enabled: true` → flip at 100 MAU

**Future UX**
- `case-share.njk` Web Share API (partial built, not wired)
- DotLottie hub idle animations for Casey
