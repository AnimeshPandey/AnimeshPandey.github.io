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

- **`src/_data/manifest.json`** — auto-generated master list of all 229 planned cases (check `stats` in that file, it drifts in prose — don't trust a number here). Only entries with `status: "live"` get permalinks, sitemap entries, and RSS items.
- **`src/cases/<slug>/index.njk`** — one Nunjucks file per case; uses `case-layout.njk`
- **`src/cases/<slug>/casey.json`** — tier-aware hints, anecdotes, and voice script for Casey

## Casey mascot assets

Casey runtime uses **PNG poses** (`casey-coach.js` / `casey-hub.js`). After AI batch generation, install and resize:

```bash
./scripts/install-casey-pngs.sh
```

Legacy SVG regen (fallback): `node scripts/generate-casey-svgs.mjs`. See `src/assets/casey/STYLE-GUIDE.md`.

Finishing SVG coverage of the remaining poses, and any real Lottie/vector-animation
work, is intentionally deferred — see `src/assets/casey/ART-GENERATION-HANDOFF.md` for
the current state, researched open-source tool options, and licensing notes before
picking either up.

### Casey voice (per-case audio)

The "Listen with Casey" button (`casey-voice.js`) plays a pre-generated MP3 per case/chapter/tone from `src/assets/casey/voice/<slug>/<chapter>-<tone>.mp3`, falling back to the browser's own `speechSynthesis` if a file is missing or fails to load. The script text lives in each case's `casey.json` under `voice.sections` — see `scripts/content/README.md`'s voice-content section for the boilerplate detector, and `scripts/content/generate-voice-audio.mjs`'s own header comment for how to (re)generate audio after editing that text (requires locally-installed `piper` + `ffmpeg`, not an npm dependency).

## Architecture decisions

- No portfolio service worker, theme.js, or recruiter scripts on `/cases/*`
- `casebook-color-mode` is independent of portfolio `theme` key (light / dark / system)
- Event bus: `casebook-tone-change` and `casebook-color-change` custom DOM events
- Progressive enhancement: story chapters are readable without JS; demo shows fixed state via `hidden` + JS reveal
- WCAG 2.2 AA target; PRM via `.casebook--reduce-motion`

## Adding a new case

**Full reference: [`CASE-AUTHORING-GUIDE.md`](CASE-AUTHORING-GUIDE.md)** — the 3-tier
tone system, Casey hints vs. voice script, all three `demoType`s (including the
gotcha where even a `code-only` demo needs a real JS module or its section stays
hidden forever), ui-strip, references, chapter order/learning path, and the
pre-done quality checklist. Read that before authoring a case; this is just the
command sequence.

1. Scaffold from an existing `idea`-status manifest entry:
   `node scripts/scaffold-case.mjs promote <slug>`
2. Author content per the guide above (chapters, `casey.json` hints + voice +
   actions, ui-strip, references)
3. Create `src/assets/js/demos/<slug>.js` exporting `initDemo()` — required for
   **every** `demoType`, see the guide's "The demo" section
4. Validate: `node scripts/scaffold-case.mjs check <slug>`
5. Build and actually look at the rendered page before considering it done —
   content/visual correctness isn't caught by tests
6. Going live is a separate, human-gated step (`status`/`permalink` flip via
   `confirm-publish.py` in the `ideas` repo) — do not do this as part of authoring

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

## Current status (2026-07-25)

**Shipped:**
- 31 live interactive cases with working demos (22 demo modules + `_demo-utils.js`); 8 more idea-status cases fully authored (content + demo, not yet publish-gated) out of 229 total planned — see `src/_data/manifest.json`'s `stats`, don't trust a case count from prose
- Reading library — 779 English articles, faceted filters (category, company, year, sort)
- Company pages — 167 company index pages (`/cases/companies/`)
- Pro tier stubs — 81 Pro badges on hub, honor-system localStorage gate, `payments.enabled: false`
- SEO — sitemap, JSON-LD, CSS/JS route-scoping, Lighthouse check script
- Casey companion — FSM hub/case/library, hub hero motion (float/sparkles/glow), intensity prefs, coach peek, library bounce, confetti, pre-generated-audio voice with `speechSynthesis` fallback, continuous "listen to whole case" playback
- Casey smart guide (`casey-guide.js`) — hub greeting decision tree: first-visit, streak, high/low completion count, long-absence welcome-back, track-affinity nudge, plus a review-due greeting sourced from the spaced-review ladder
- Casey elsewhere — interview mode (pre-session/reaction/summary lines), a dedicated Casey-led review-session flow at `/review/` (reuses the interview machinery, pool sourced from `dueForReview()`), search page (idle track-affinity suggestion + dynamic zero-results line), a "Casey recommends" chip on case completion, a first-visit onboarding tour (gated, dismissible, keyboard-accessible), an "explain differently" hint-cycle toggle, and milestone tiers through twenty-cases
- Casey preferences panel — tone/intensity radiogroups, live progress + milestones list, motion-status disclosure, reset-memory (fully audited or bug-fixed as of 2026-07-25 — see `CASE-AUTHORING-GUIDE.md`'s sibling PRs, not a stale claim)
- Casey library strip — `casey-library-strip.njk` + `read` pose on `/cases/library/`
- Progression — `casebook-companion-v1` localStorage: case progress, confetti milestones, hub strip, case continue CTAs
- Email sign-in beta — `/account/` with copy-magic-link UX (client-side only)
- Regression tests — `tests/` static, unit (119), 87 e2e across 17 spec files including all 31 live slugs

**In progress:** content polish across the 190 remaining idea-status cases (story chapters, UI strips, FE depth, references, demo modules) — `CASE-AUTHORING-GUIDE.md` is the reference for that pass.

## Deferred (not yet built)

**Content**
- The 190 remaining idea-status cases — full authoring per `CASE-AUTHORING-GUIDE.md`
- `mvpLaunch: true` manifest gating on a polished case set — after content complete

**Casey**
- New pose art (SVG vectorization / AI regeneration) and real Lottie motion — see `src/assets/casey/ART-GENERATION-HANDOFF.md` for current state + researched open-source tool options before picking either up

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
