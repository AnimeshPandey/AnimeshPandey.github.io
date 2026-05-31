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

## Architecture decisions

- No portfolio service worker, theme.js, or recruiter scripts on `/cases/*`
- `casebook-color-mode` is independent of portfolio `theme` key (light / dark / system)
- Event bus: `casebook-tone-change` and `casebook-color-change` custom DOM events
- Progressive enhancement: story chapters are readable without JS; demo shows fixed state via `hidden` + JS reveal
- WCAG 2.2 AA target; PRM via `.casebook--reduce-motion`

## Adding a new case

1. Set `status: "live"` and `publishedAt` on the manifest entry
2. Create `src/cases/<slug>/index.njk` (copy from skeleton-screens template)
3. Create `src/cases/<slug>/casey.json` with hints for each chapter
4. Create `src/assets/js/demos/<slug>.js` if demo is required
5. Push → CI builds and deploys automatically
