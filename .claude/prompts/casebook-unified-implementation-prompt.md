# Unified implementation prompt — The Frontend Casebook

**Use this file** as the single paste-in prompt for Claude Code / Cursor when starting or continuing the project systematically.

| Copy | Path |
|------|------|
| **Canonical** | `ideas/projects/case-studies/prompts/00-unified-implementation-prompt.md` |
| **Portfolio** | `AnimeshPandey.github.io/.claude/prompts/casebook-unified-implementation-prompt.md` |
| **Phase 1 deep spec** | `ideas/projects/case-studies/prompts/01-core-platform-generation-prompt.md` |
| **Human checklist** | `ideas/projects/case-studies/phases/01-core-platform.md` |

**Planning repo (read-only):** `ideas/projects/case-studies/`  
**Implementation repo:** `AnimeshPandey.github.io/` → output under **`cases/`**  
**Live URL (Phase 1):** `https://anmshpndy.com/cases/`

---

## Paste block (start here)

Copy everything inside the fence below into a new Claude / Cursor session.

```text
You are implementing The Frontend Casebook — a static, Growth.Design-style case study site for frontend engineers.

WORK MODE: Systematic, phased, evidence-based. Complete one slice at a time; verify before the next. Do not skip Phase 1 quality gates.

REPOS:
- Planning/specs: ideas/projects/case-studies/ (do not deploy from here)
- Code: AnimeshPandey.github.io/cases/ (Eleventy 11 → _site/ → /cases/ on GH Pages)

CURRENT PHASE: 1 — Core platform + exactly ONE live flagship case.
Do NOT bulk-generate 223 cases. Do NOT add backend, React, Next.js, or Astro for Casebook.

ROLE: Staff frontend architect + inclusive UX lead.

NORTH STAR (Phase 1 done when):
- Hub at /cases/ with manifest grid (1 live link; coming-soon cards have NO href)
- Flagship case skeleton-screens-perceived-speed: scroll chapters, junior/mid/staff tone, required demo, Casey coach, optional voice (opt-in)
- Light / dark / system appearance (casebook-preferences.js — NOT portfolio theme.js)
- RSS feed + subscribe CTA stub; sitemap/robots; JSON-LD; mobile-first + WCAG 2.2 AA
- Lighthouse mobile: perf ≥85, a11y ≥95, SEO ≥95; zero console errors on case routes
- No portfolio service worker, visuals.js, theme.js, or recruiter scripts on /cases/*

READ BEFORE CODING (in order — open each file):
1. ideas/projects/case-studies/docs/platform/PLATFORM-ARCHITECTURE.md
2. ideas/projects/case-studies/docs/platform/GLOBAL-FOUNDATION.md
3. ideas/projects/case-studies/docs/platform/UI-UX-AND-PREFERENCES.md
4. ideas/projects/case-studies/docs/platform/HOSTING-AND-GROWTH.md
5. ideas/projects/case-studies/docs/platform/AUDIENCE-GROWTH-AND-PUBLISHING.md
6. ideas/projects/case-studies/docs/product/DECISIONS.md
7. ideas/projects/case-studies/docs/product/BRANDING.md
8. ideas/projects/case-studies/phases/01-core-platform.md
9. ideas/projects/case-studies/prompts/01-core-platform-generation-prompt.md (full Phase 1 spec — follow exactly)

MANIFEST (run once per session if missing):
python3 ideas/projects/case-studies/scripts/merge-tracks-to-manifest.py \
  > AnimeshPandey.github.io/cases/src/_data/manifest.json
Then set flagship status to "live" and publishedAt when ready to index.

FLAGSHIP (only live case in Phase 1):
- slug: skeleton-screens-perceived-speed
- title: Why Skeleton Screens Beat Spinners
- track: psychology-perception
- demoType: animation (spinner vs skeleton; layout stability)

EXECUTION SLICES (complete in order; report after each):
Slice A — Scaffold: package.json, .eleventy.js, site.json, manifest, layouts/partials shell, casebook.css imports, CI build
Slice B — Hub + about: index.njk, about.njk (#accessibility, #newsletter), subscribe-cta.njk, feed/sitemap/robots
Slice C — Platform JS: casebook-preferences.js, case-scroll.js (tone + chapters + progress)
Slice D — Casey: 12 SVG placeholders, casey-coach.js, casey.json, casey-voice.js (opt-in)
Slice E — Flagship content: all chapters, three tones, demo-loader + demos/skeleton-screens-perceived-speed.js
Slice F — SEO + QA: JSON-LD, OG, device matrix, Lighthouse, cases/README.md, portfolio CTA → /cases/

ARCHITECTURE RULES (non-negotiable):
- One case-layout.njk for all cases; content in cases/{slug}/index.njk only
- site.json drives url/pathPrefix — no hardcoded anmshpndy.com in templates
- liveCases collection: only status===live get permalinks + sitemap + RSS
- Custom event casebook-tone-change: case-scroll dispatches; casey-coach listens
- Appearance event casebook-color-change: preferences dispatches; cancel speech on change
- Progressive enhancement: story + demo fixed state without JS
- CSS class names per GLOBAL-FOUNDATION.md — do not rename
- BEM partials; no inline business logic in Nunjucks

OUT OF SCOPE (Phase 1):
- Additional cases, BUILD-ONE-SHOT bulk, paywall, track hub pages, backend, scheduled publish CI (Phase 2)

WHEN STUCK: Re-read PLATFORM-ARCHITECTURE anti-patterns section.

OUTPUT AFTER EACH SLICE:
1. Files created/changed (paths)
2. npm run build result
3. Blockers or Phase 2 deferrals

OUTPUT WHEN PHASE 1 COMPLETE:
1. Full file tree under cases/
2. Lighthouse table (hub + flagship, mobile)
3. Device QA pass/fail (iOS Safari, Android Chrome, desktop)
4. Checklist against phases/01-core-platform.md definition of done
5. Explicit list of Phase 2 deferrals

Begin with Slice A only. Read the spec files first, then implement.
```

---

## What this prompt is (and is not)

| Document | Purpose |
|----------|---------|
| **This file (`00-unified-…`)** | **Entry point** — role, phase, read order, execution slices, paste block |
| **`01-core-platform-generation-prompt.md`** | **Deep Phase 1 spec** — file tree, JS APIs, chapter table, code samples |
| **`MASTER.md`** | **Content backlog** (223 cases) — not an implementation prompt |
| **`BUILD-ONE-SHOT.md`** | Bulk case generation — **Phase 3+ only**, after platform ships |

---

## Systematic workflow (all phases)

```text
┌──────────────────────────────────────────────────────────────────┐
│ 0. Orient     DEVELOPMENT-PLAN.md + DECISIONS.md                 │
├──────────────────────────────────────────────────────────────────┤
│ 1. Read       Platform docs (GLOBAL → ARCHITECTURE → UI → HOSTING)│
├──────────────────────────────────────────────────────────────────┤
│ 2. Paste      This file’s paste block (or resume at current slice)│
├──────────────────────────────────────────────────────────────────┤
│ 3. Implement  One slice → build → verify → report                │
├──────────────────────────────────────────────────────────────────┤
│ 4. Ship       Deploy /cases/ · Search Console · update manifest   │
├──────────────────────────────────────────────────────────────────┤
│ 5. Next phase phases/02-….md + prompt listed in roadmap below    │
└──────────────────────────────────────────────────────────────────┘
```

---

## Phase roadmap (after Phase 1)

| Phase | Checklist | Agent / spec |
|-------|-----------|--------------|
| **0** | [phases/00-docs-and-alignment.md](../phases/00-docs-and-alignment.md) | Done — docs + merge script |
| **1** | [phases/01-core-platform.md](../phases/01-core-platform.md) | **This prompt +** [01-core-platform-generation-prompt.md](01-core-platform-generation-prompt.md) |
| **2** | [phases/02-casey-assets-and-motion.md](../phases/02-casey-assets-and-motion.md) | [CASEY-GENERATION-PLAYBOOK.md](../assets/casey/CASEY-GENERATION-PLAYBOOK.md) · scheduled publish CI |
| **3** | [phases/03-wave-1-flagships.md](../phases/03-wave-1-flagships.md) | [BUILD-ONE-SHOT.md](../docs/content/BUILD-ONE-SHOT.md) |
| **4** | [phases/04-content-scale.md](../phases/04-content-scale.md) | BUILD-ONE-SHOT + tracks |
| **5** | [phases/05-monetization-and-launch.md](../phases/05-monetization-and-launch.md) | HOSTING-AND-GROWTH · PAYWALL-TIERS |

**Resume rule:** Tell Claude: *“Continue Casebook Phase N, Slice X”* and point to the phase checklist file.

---

## Phase 1 execution slices (detail)

### Slice A — Scaffold

- Create `AnimeshPandey.github.io/cases/` per [PLATFORM-ARCHITECTURE.md](../docs/platform/PLATFORM-ARCHITECTURE.md) tree  
- `package.json`: `@11ty/eleventy`, `npm run build` / `start`  
- `.eleventy.js`: `liveCases` collection, passthrough, `pathPrefix` from `site.json`  
- `_data/site.json` + `manifest.json` (merge script)  
- `casebook-layout.njk`, empty `case-layout.njk`, `casebook.css` (@import tokens/layout/components)  
- **Verify:** `npm run build` exits 0  

### Slice B — Hub + about + feeds

- `index.njk`: hero, track filter, manifest grid (live vs coming-soon)  
- `about.njk`: methodology, Casey, Growth.Design credit, `#accessibility`, `#newsletter`  
- `subscribe-cta.njk`, `feed.njk`, `sitemap.njk`, `robots.njk`  
- RSS `<link rel="alternate">` in layout  
- **Verify:** `_site/` contains feed.xml, sitemap.xml; only live URLs in sitemap  

### Slice C — Preferences + scroll

- Inline FOUC script in layout  
- `casebook-preferences.js` + `casebook-preferences.njk`  
- `case-scroll.js`: tone persistence, chapter IO, progress, `casebook-tone-change`  
- **Verify:** tone persists reload; PRM class on `<html>` when reduced motion  

### Slice D — Casey

- 12 SVG placeholders: `assets/casey/{junior,mid,staff}/{idle,point,think,celebrate}.svg`  
- `casey-coach.njk` + `casey-coach.js` + flagship `casey.json`  
- `casey-voice.js` (module, opt-in)  
- **Verify:** mobile bottom dock, desktop aside; hints on chapter enter  

### Slice E — Flagship case

- `cases/skeleton-screens-perceived-speed/index.njk` — chapters per [01-core-platform-generation-prompt.md](01-core-platform-generation-prompt.md)  
- `case-demo-shell.njk` + `demos/skeleton-screens-perceived-speed.js`  
- Related cases (2 slugs, coming-soon text if not live)  
- **Verify:** demo on touch; noscript shows skeleton state  

### Slice F — SEO, deploy, QA

- `head-seo.njk`: canonical, OG, JSON-LD Article + BreadcrumbList  
- Portfolio homepage CTA → `/cases/`  
- Lighthouse + device matrix ([HOSTING-AND-GROWTH.md](../docs/platform/HOSTING-AND-GROWTH.md))  
- `cases/README.md`  
- Ideas manifest: flagship `status: live`, `publishedAt`  
- **Verify:** DoD in [phases/01-core-platform.md](../phases/01-core-platform.md)  

---

## Locked product constants

| Key | Value |
|-----|--------|
| Brand | **The Frontend Casebook** |
| Mascot | **Casey** (junior / mid / staff kitten) |
| Stack | Eleventy 11 + CSS + vanilla JS |
| Backend | **None** (static only) |
| Tones | `junior` · `mid` · `staff` (reading level) |
| Appearance | `light` · `dark` · `system` (color mode) |
| Demo | **Required** on every case (`.case-demo`) |
| Footer | Growth.Design format credit required |

---

## Key file paths (workspace)

```text
ideas/projects/case-studies/
├── DEVELOPMENT-PLAN.md
├── MASTER.md                          # 223-case index (content only)
├── prompts/
│   ├── 00-unified-implementation-prompt.md   ← this file
│   └── 01-core-platform-generation-prompt.md
├── phases/01-core-platform.md
├── docs/platform/PLATFORM-ARCHITECTURE.md
├── docs/platform/GLOBAL-FOUNDATION.md
└── scripts/merge-tracks-to-manifest.py

AnimeshPandey.github.io/
├── cases/                             # implement here
└── .claude/prompts/casebook-unified-implementation-prompt.md
```

---

## Definition of done (Phase 1)

Use the checklist in [phases/01-core-platform.md](../phases/01-core-platform.md) and [01-core-platform-generation-prompt.md](01-core-platform-generation-prompt.md#definition-of-done-verify-before-claiming-complete).

Minimum bar before claiming complete:

- [ ] Only `skeleton-screens-perceived-speed` is `live` in manifest  
- [ ] Hub + about + flagship deployed at `/cases/`  
- [ ] Architecture matches PLATFORM-ARCHITECTURE (one layout, event bus, no portfolio SW)  
- [ ] Lighthouse mobile thresholds met  
- [ ] Verification report with file tree + scores + Phase 2 deferrals  

---

## Continuing in a new session

Paste:

```text
Continue The Frontend Casebook implementation.
Unified prompt: ideas/projects/case-studies/prompts/00-unified-implementation-prompt.md
Current phase: 1
Last completed slice: [A|B|C|D|E|F]
Repo: AnimeshPandey.github.io/cases/
Read 01-core-platform-generation-prompt.md for slice details.
Pick up at the next slice; do not redo completed work unless broken.
```

---

## Related

| Topic | Path |
|-------|------|
| Product playbook | [../21-frontend-casebook.md](../../21-frontend-casebook.md) |
| Doc index | [../README.md](../README.md) |
| Validate doc links | `python3 ideas/projects/case-studies/scripts/validate-doc-links.py` |
