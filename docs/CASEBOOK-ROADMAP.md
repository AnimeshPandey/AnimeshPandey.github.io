# Casebook roadmap — The Frontend Casebook

**Repo:** `AnimeshPandey/AnimeshPandey.github.io`  
**Live:** https://anmshpndy.com/cases/  
**Tracking doc:** `ideas/projects/case-studies/frontendcs-corpus/NEXT-BUILD-PLAN.md`  
**Last updated:** June 2026

This document covers features that are **planned but not yet built** for The Frontend Casebook — organized by theme with enough implementation detail to pick up and build directly.

---

## Current baseline (June 2026)

| Layer | State |
|-------|-------|
| 31 live cases with interactive demos | ✅ Done |
| 779-article reading library + faceted filters | ✅ Done |
| 187 company index pages | ✅ Done |
| Pro tier stubs (80+ badges, unlock CTA) | ✅ Done — payments off |
| Casey companion — FSM, hub motion, voice, prefs | ✅ Done |
| Casey library strip (`read` pose) | ✅ Done |
| Progression (`casebook-companion-v1`) | ✅ Done |
| Email sign-in beta (copy-link) | ✅ Done — email provider not wired |
| Regression test suite (69+ e2e) | ✅ Done |
| Content polish — 22 MVP cases | 🔄 In progress |

---

## 1 · Content polish (highest leverage)

**What:** 22 cases in the MVP roster are missing chapters. Each complete case needs four chapters: `story`, `ui-strip`, `fe-depth`, `references`.

**Gap summary (as of June 2026):**

| Case | Missing |
|------|---------|
| key-prop-identity | ui-strip |
| abort-controller-ghost-updates | ui-strip |
| closure-stale-state | ui-strip |
| z-index-stacking-context | ui-strip |
| lcp-not-hero-image | story, ui-strip |
| fake-loading-progress + 16 others | story, ui-strip, fe-depth, refs |

**~62 chapter additions across 19 cases.**

**Prompt to run:** `frontendcs-corpus/prompt-mvp-cases-polish.md` Slices 3–4 (Batch A), Slice 4 (Batch B), Slice 5 (images), Slice 6 (casey.json), Slice 8 (manifest gating).

**Implementation notes:**
- `story` chapter: 2–3 paragraphs, anonymised, production-grounded scenario
- `ui-strip` chapter: annotated before/after HTML or `<figure>` with caption
- `fe-depth` chapter: implementation snippet + 3–5 pitfalls + known patterns
- `references` chapter: ≥3 links from `REFERENCES.md` mid-tier pool
- After all 22 polished → set `mvpLaunch: true` in `manifest.json` entries and gate behind that flag

---

## 2 · Casey smart guide / suggestion system

**What:** An intelligent companion recommendation layer on top of the existing `casebook-companion-v1` progress store. The current system records progress passively; this system makes proactive suggestions.

**Files to create:**
- `cases/src/assets/js/casey-guide.js` — `CaseyGuide` module
- `cases/src/_data/guide-lines.json` — all tier-aware hub/case/library copy variants

**Files to modify:**
- `cases/src/_includes/layouts/casebook-layout.njk` — inject guide-lines + `data-case-slug`
- `cases/src/assets/js/casey-hub.js` — use `CaseyGuide.suggest()` for greeting line
- `cases/src/assets/js/casey-coach.js` — call `CaseyGuide.recordEvent('case-started' | 'case-completed')`

**`CaseyGuide` API shape:**
```js
CaseyGuide.suggest(context)     // → { line, pose } based on progress + history
CaseyGuide.recordEvent(type)    // 'case-started' | 'case-completed' | 'library-visit'
CaseyGuide.getProgress()        // { completedCount, streak, firstVisit }
```

**Suggestion logic (rules, not ML):**
- First visit (0 completed) → `present` pose + welcome copy
- Return visit, < 3 completed → `welcome` + "Pick up where you left off"
- Streak ≥ 3 → `celebrate` + streak callout
- Library visit → `read` + count of reading articles
- Filtered to 0 results → `curious` pose (already wired in hub FSM; CaseyGuide enriches the copy)

**Prompt:** `frontendcs-corpus/prompt-casey-memory.md`

---

## 3 · Email auth — transactional provider wiring

**What:** The beta sign-in at `/account/` generates a magic link locally but doesn't send an email. Real auth requires wiring a transactional email provider (Resend or Postmark).

**Current state:** `casebook-auth.js` builds the magic link URL and puts it in the clipboard. The user must paste the link manually in the same browser — functional but rough.

**Implementation plan:**
1. Choose provider: **Resend** (developer-friendly, free tier generous) or Postmark
2. Create a minimal serverless function (Netlify Function or Cloudflare Worker) that:
   - Accepts `{ email }` POST
   - Generates a signed JWT token (short TTL — 15 min)
   - Sends magic-link email via provider API
3. Client: replace "copy link" UX with "check your email" confirmation state in `casebook-auth.js`
4. On token verification: store `casebook-auth-v1` in localStorage; attach to future server-side progress sync

**Secrets needed:** `RESEND_API_KEY` (or `POSTMARK_TOKEN`) in GitHub Secrets / Netlify env.

**Consideration:** This requires a server runtime (even serverless). Evaluate whether GitHub Pages + Cloudflare Worker edge function keeps the zero-ops posture, or if Netlify is simpler.

---

## 4 · Server-side progress sync

**What:** Right now `casebook-companion-v1` is pure localStorage. When a signed-in user switches devices, progress resets. Server-side sync attaches progress to the user's email identity.

**Implementation plan:**
1. Auth prerequisite: Task 3 must be done first (email tokens → user identity)
2. After sign-in, POST `casebook-companion-v1` snapshot to a serverless function
3. On sign-in from a new device, fetch and merge server state with local state (server wins on conflicts)
4. Minimal schema: `{ email, caseProgress: {}, confettiSeenSlugs: [], completedAt: ISO }`
5. Storage: Cloudflare KV (free tier: 10M reads/mo) or Turso (SQLite edge)

**Scope note:** Keep this minimal — no accounts dashboard, no email-change flow. Just enough to sync the `casebook-companion-v1` object.

---

## 5 · Premium art pass — Casey style anchors + hub hero WebP

**What:** Two connected visual upgrades that need to happen together.

### 5a · Casey style anchors

**Problem:** The AI-generated Casey PNGs have body-colour drift between poses and tiers — the fur is sometimes greenish or incorrect. Style anchor images constrain future generation.

**Files:** `cases/src/assets/casey/style-anchor/` — approved `casey-{junior,mid,staff}-front.png`

**Process:**
1. Run `prompt-casey-style-anchors.md` to generate locked reference PNGs
2. Place approved anchors in `style-anchor/preview-ai/`
3. Re-run `./scripts/install-casey-pngs.sh` with `CASEY_SRC` pointing to new anchors
4. Run `./scripts/regen-casey-failures.sh` and `npm run verify:live`
5. Human approval gate: confirm catchlight visible at 80px, fur warm off-white, collar tag readable

**Palette contract:** `cases/src/assets/casey/style-anchor/PALETTE.md` (locked — do not change hex values without full regen)

### 5b · Hub hero WebP

**Problem:** The hub hero currently uses `wave.svg` as a placeholder. A proper WebP hero image tied to Casey's visual identity would make the hub feel premium.

**Prerequisite:** Style anchors (5a) must be approved first.

**Files to add:**
- `cases/src/assets/images/casey-hub-hero.webp` (1200×675px, RGBA)
- `cases/src/assets/images/casey-hub-hero@2x.webp` (2400×1350px)

**Template change:** `cases/src/index.njk` — replace `wave.svg` `<img>` with `<picture>` block using `webp` source and `svg` fallback.

**Prompt:** `frontendcs-corpus/prompt-casey-hub-hero.md`

---

## 6 · Pro payments — flip the gate

**What:** Pro tier is pre-built but payments are disabled (`payments.enabled: false` in `site.json`). At 100 MAU, flip the gate.

**Current state:** 81 cases show `case-card__badge--pro`; `pro-gate.js` honors a localStorage key; `unlock-cta.njk` shows a waitlist CTA.

**Steps to enable payments:**
1. Choose payment processor: **Gumroad** (simplest — no custom checkout) or LemonSqueezy
2. Create a "Pro" product listing with a `PRICE_ID`
3. In `pro-gate.js`: replace waitlist CTA with checkout URL; on purchase webhook → set localStorage key (or verify via JWT)
4. In `site.json`: set `"payments": { "enabled": true, "checkoutUrl": "https://..." }`
5. Update `unlock-cta.njk` to show price + checkout CTA instead of waitlist form

**Pricing consideration:** $9/mo or $79/yr targeting individual engineers. Keep Gumroad for zero engineering overhead; avoid building subscription infrastructure.

**MAU tracking:** Cloudflare Web Analytics → Websites → anmshpndy.com/cases. Check monthly unique visitors before flipping.

---

## 7 · Content distribution

### 7a · `/whats-new/` changelog page

A lightweight changelog listing new live cases, feature drops, and content additions. Useful for returning users and newsletter CTAs.

**Implementation:** `cases/src/whats-new/index.njk` — pulls from a `src/_data/changelog.json` file maintained manually. Each entry: `{ date, type: 'case'|'feature'|'content', title, slug? }`.

### 7b · "New" badge on hub cards

Hub cards should show a "New" chip when `publishedAt` is within 14 days.

**Implementation:** In `index.njk` case card loop — `{% if case.publishedAt | isRecent(14) %}` — add `case-card__badge--new` chip. Add `isRecent` Eleventy filter in `.eleventy.js`.

### 7c · Buttondown newsletter CI send

On each deploy that flips a case from `upcoming → live`, trigger a Buttondown newsletter broadcast.

**Implementation:**
1. `scripts/notify-newsletter.sh` — diffs `manifest.json` vs last deploy tag; finds newly-live cases; POSTs to Buttondown API
2. Add step to `.github/workflows/static-pages.yml` after deploy succeeds
3. **Requires:** `BUTTONDOWN_API_KEY` secret in GitHub Secrets

---

## 8 · Discovery

### 8a · Track hub pages

URL: `/cases/tracks/{id}/` — one page per track (18 tracks). Shows all cases in that track, progress indicator, and Casey companion.

**Implementation:** `cases/src/tracks/track-hub.njk` — Eleventy pagination over `src/_data/tracks.json`. Each track page renders a filtered case grid + track description.

**Note:** BreadcrumbList JSON-LD in `head-seo.njk` currently proxies `?track={id}` until these pages exist. Switch to absolute URL when built.

### 8b · Pagefind static search

Static full-text search without any server. Pagefind indexes the `_site/` output at build time and serves a pre-built WASM search UI.

**Implementation:**
1. `npm install --save-dev pagefind`
2. Add build step: `npx pagefind --source cases/_site --output-path cases/_site/pagefind`
3. Add search trigger button to `casebook-layout.njk` — opens a `<dialog>` with Pagefind's default UI
4. Scope to case content only: `data-pagefind-body` on `.case-prose` wrapper

---

## 9 · Premium feel — UX polish backlog

Small, independent improvements that collectively raise the quality ceiling.

| Item | Files | Notes |
|------|-------|-------|
| Case OG images | `cases/src/cases/{slug}/og.png` | 1200×630 WebP per case; use UI-strip screenshot as base |
| Hub card hover state | `casebook.css` `.case-card` | Add subtle lift (`translateY(-2px)` + shadow) on hover; match card-tilt feel from portfolio |
| Smooth scroll to next chapter | `case-scroll.js` | Already exists; verify no jank on iOS Safari |
| Casey voice speed control | `casey-voice.js` | Add `playbackRate` slider in `casey-companion-prefs.njk` (0.75× / 1× / 1.25×) |
| Dark/high-contrast toggle shortcut | `casebook-preferences.js` | Keyboard shortcut `D` to toggle dark mode on Casebook (matches portfolio `hire` shortcut pattern) |
| Chapter progress dots | `case-layout.njk` | Show 5 dots (story / demo / depth / takeaway / refs) with `filled` state via `IntersectionObserver`; mirrors Growth.Design pill nav |
| Skeleton on library card load | `hub-filters.js` | Show `.library-grid__item--skeleton` placeholder while filtering (fade in on `transitionend`) |
| Confetti on Pro unlock | `pro-gate.js` | Fire confetti (same system as case completion) when user first unlocks Pro |
| Resume CTA on hub 404 | `cases/src/404.njk` | Add Casey `curious` pose + "Explore all cases" CTA |

---

## 10 · DotLottie hub idle (optional, later)

Replace the CSS `float` animation on the Casey hub hero with a Lottie animation for richer idle motion.

**Implementation:** `casey-lottie.js` already exists as a stub. Wire it to `data-casey-dotlottie="1"` on the hub hero `<img>`. Only loads if `caseyIntensity === 'full'` and `!reducedMotion`.

**Gate:** Build the static experience first; add Lottie only if the CSS animation feels insufficient.

---

## Priority order (recommended)

| # | Task | Effort | Unlocks |
|---|------|--------|---------|
| 1 | Content polish — MVP 22 cases | M | Credible hub; Pro positioning |
| 2 | Casey smart guide | S | Richer return-visit engagement |
| 3 | Hub card premium feel (hover, chapter dots) | S | Immediate visual quality lift |
| 4 | `/whats-new/` + "New" badge | S | Distribution; returning user hook |
| 5 | Premium art pass (style anchors + hub hero) | M | Visual identity locked |
| 6 | Email auth — transactional email | M | Real sign-in; trust signal |
| 7 | Track hub pages + Pagefind | M | SEO; navigation |
| 8 | Pro payments flip | S (config) | Revenue; requires 100 MAU first |
| 9 | Server-side progress sync | L | Requires auth done |
| 10 | Buttondown CI send | S | Requires newsletter account |

See `ideas/projects/case-studies/frontendcs-corpus/NEXT-BUILD-PLAN.md` for the active task tracker.
