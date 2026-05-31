# Unified prompt — Portfolio + Casebook polish, platformization & Phase 2

**Paste this entire file into Claude Code / Cursor** when fixing UX bugs, aligning portfolio with Casebook, and advancing Phase 2.

| Copy | Path |
|------|------|
| **Canonical** | `ideas/projects/case-studies/prompts/02-portfolio-casebook-polish-and-platform-prompt.md` |
| **Portfolio** | `AnimeshPandey.github.io/.claude/prompts/casebook-portfolio-polish-platform-prompt.md` |
| **Phase 1 baseline** | `00-unified-implementation-prompt.md` · `01-core-platform-generation-prompt.md` |
| **Phase 2 checklist** | `ideas/projects/case-studies/phases/02-casey-assets-and-motion.md` |

**Repos:** `AnimeshPandey.github.io` (code) · `ideas/projects/case-studies/` (specs)

---

## Paste block

```text
You are a staff frontend engineer + inclusive UX lead working on Animesh Pandey's portfolio AND The Frontend Casebook (/cases/).

WORK MODE: Systematic slices. Fix user-reported bugs first. Platformize shared chrome. Then Phase 2 Casebook features. Report evidence after each slice.

REPOS:
- Code: AnimeshPandey.github.io
- Specs: ideas/projects/case-studies/

READ FIRST (do not skip):
1. ideas/projects/case-studies/docs/platform/PLATFORM-ARCHITECTURE.md
2. ideas/projects/case-studies/docs/platform/GLOBAL-FOUNDATION.md
3. ideas/projects/case-studies/docs/platform/UI-UX-AND-PREFERENCES.md
4. ideas/projects/case-studies/docs/platform/AUDIENCE-GROWTH-AND-PUBLISHING.md
5. ideas/projects/case-studies/docs/platform/SHARED-CHROME.md (create/update if missing)
6. ideas/projects/case-studies/phases/02-casey-assets-and-motion.md
7. AnimeshPandey.github.io/cases/README.md — current build status

USER-REPORTED BUGS (must fix):
1. Portfolio top bar too cluttered — too many links + action buttons
2. Portfolio language switcher not working (only en/hi/es JSON exist; other menu locales fail silently)
3. Theme switcher UX — improve picker; DEFAULT theme = high-contrast (portfolio dataset.theme + Casebook contrast default)
4. Hero: "press ?" and "scroll" hints not on same baseline / rail
5. Buttondown subscribe 404 — username "animeshpandey" invalid; gate form until real username in site.json
6. Portfolio vs Casebook UI/UX inconsistencies — platformize shared tokens, chrome, focus, typography
7. Code: scalability + reusability (shared modules, no duplicated picker logic)

CASEBOOK PHASE STATUS (audit before building):
Phase 1 (core platform) — VERIFY in repo:
- [ ] cases/ Eleventy builds
- [ ] Hub + about + skeleton-screens-perceived-speed live
- [ ] casebook-preferences.js, case-scroll.js, casey-coach.js, casey-voice.js, demo-loader.js
- [ ] feed.xml, sitemap, subscribe-cta, RSS link
Mark each pass/fail in your report.

Phase 2 (next) — BUILD after polish slice:
- Full Casey SVG library (24 poses)
- Scheduled publish CI + confirm-publish.py wired
- /whats-new/, case-share.njk, Buttondown when username configured
- See phases/02-casey-assets-and-motion.md

EXECUTION SLICES (in order):

Slice 1 — Portfolio header simplification
- Desktop: nav links + ONE "More" menu (theme, language, recruiter, resume preview)
- Remove duplicate resume buttons from header when inside More
- Mobile: utilities at bottom of mobile nav only
- Files: index.html, assets/site.css, assets/nav.js (or nav-more.js)
- Do NOT load theme.js on /cases/*

Slice 2 — Portfolio hero chrome rail
- Wrap .egg-key-hint + .scroll-cue in .hero-chrome-rail (flex, space-between, align-items: center)
- Same bottom offset; grid-column 1 / -1; align to content column not viewport edge
- Files: index.html, assets/site.css

Slice 3 — i18n repair
- LOCALES in i18n.js MUST match files in assets/i18n/locales/*.json only (en, hi, es today)
- Hide or remove menu options without JSON; OR add stub locale files copied from en.json
- On setLocale: update document.title + meta description from dict.meta when present
- Announce failures to user (aria-live), not silent fallback
- Files: assets/i18n/i18n.js, index.html lang menus

Slice 4 — Theme defaults + picker polish
- Portfolio FOUC + theme.js default: high-contrast (not dark)
- Casebook: default data-casebook-contrast="high"; improve casebook-preferences.njk (grouped Appearance + Contrast)
- casebook-tokens.css: [data-casebook-contrast="high"] token overrides (WCAG AAA targets)
- Sync FOUC inline script in casebook-layout.njk
- Files: index.html head script, assets/theme.js, cases/src/assets/js/casebook-preferences.js, cases/src/assets/css/casebook-tokens.css

Slice 5 — Subscribe fix
- cases/src/_data/site.json: newsletter.username, newsletter.enabled
- subscribe-cta.njk: if !enabled show RSS-only + "Newsletter coming soon" (no broken POST)
- Document: user must create Buttondown newsletter and set username
- Files: site.json, subscribe-cta.njk, ideas AUDIENCE-GROWTH doc cross-link

Slice 6 — Shared platform layer (architecture)
- Create assets/platform/chrome.css + chrome.js (optional thin helpers)
- Shared: .visually-hidden, focus ring, icon-btn 44px, dropdown menu pattern
- Portfolio imports platform/chrome; Casebook imports same (path /assets/platform/)
- Casebook keeps casebook-preferences.js (NOT portfolio theme.js)
- Document in ideas/.../SHARED-CHROME.md
- Eliminate duplicated menu keyboard logic where safe (single initDropdown utility)

Slice 7 — Casebook Phase 2 start (only after 1–6 pass)
- Casey assets per CASEY-GENERATION-PLAYBOOK
- whats-new.njk, scheduled badges, publish workflow stub
- Second case draft OR motion QA on flagship

ARCHITECTURE RULES:
- /cases/* : NO portfolio theme.js, visuals.js, sw.js, recruiter, eggs
- Casebook URLs via site.json + Eleventy url filter only
- Shared code lives under /assets/platform/ — not copy-paste between site.css and casebook.css
- localStorage keys: portfolio theme=, locale=; casebook casebook-color-mode=, casebook-contrast=

QUALITY GATES:
- Lighthouse mobile portfolio + /cases/ flagship: a11y ≥95
- Language switch: visible change on all data-i18n nodes + title
- Subscribe: no 404 POST when disabled; RSS always works
- Hero hints: single horizontal rail, aligned at ≥820px
- Header: ≤3 visible utility controls on desktop besides nav links

OUTPUT PER SLICE: files changed, build command result, screenshots described, deferrals.

OUTPUT FINAL: Phase 1 audit table, Phase 2 remaining checklist, Buttondown setup steps for human.
```

---

## Progress audit template (fill when starting)

### Phase 1 — Casebook platform

| Item | Status | Evidence |
|------|--------|----------|
| Eleventy `cases/` builds | ☐ | `npm run build` in cases/ |
| Hub `/cases/` | ☐ | |
| About `/cases/about/` | ☐ | |
| Flagship `skeleton-screens-perceived-speed` | ☐ | |
| `liveCases` / sitemap / feed | ☐ | |
| Tone switcher + Casey + demo | ☐ | |
| `casebook-preferences` light/dark/system | ☐ | |
| Subscribe CTA | ☐ | Broken if Buttondown username invalid |
| Portfolio isolation (no SW/theme.js) | ☐ | |

### Phase 2 — Not started until Slice 7

| Item | Status |
|------|--------|
| 24 Casey SVGs | ☐ |
| `confirm-publish.py` + CI workflow | ☐ |
| `/whats-new/` | ☐ |
| Buttondown live send | ☐ |

---

## Root cause notes (for implementer)

| Bug | Likely cause |
|-----|----------------|
| Subscribe 404 | Hardcoded `animeshpandey` — newsletter not created on Buttondown |
| Language "broken" | Menu lists 9 locales; only `en.json`, `hi.json`, `es.json` exist — selecting FR/DE/etc. falls back with almost no `data-i18n` on page |
| Hero misalignment | `.egg-key-hint` (right) and `.scroll-cue` (left) absolutely positioned separately |
| Header clutter | Theme + lang + recruiter + resume + hamburger all visible |
| Casebook vs portfolio drift | Casebook uses subset of tokens; no shared chrome module; different picker UX |

---

## Buttondown setup (human step)

1. Create newsletter at https://buttondown.com  
2. Note exact **username** from embed URL (not display name)  
3. Set in `cases/src/_data/site.json`:

```json
"newsletter": {
  "enabled": true,
  "username": "YOUR_REAL_USERNAME",
  "subscribeUrl": "https://buttondown.com/api/emails/embed-subscribe/YOUR_REAL_USERNAME"
}
```

4. Rebuild and test double opt-in email

---

## Related prompts

| Prompt | Use |
|--------|-----|
| `portfolio-premium-ux-sections-prompt.md` | Header More menu, hero rail detail |
| `portfolio-layout-responsive-themes-prompt.md` | Grid / breakpoint |
| `00-unified-implementation-prompt.md` | Phase 1 from scratch |
| `01-core-platform-generation-prompt.md` | Casebook deep spec |

---

## Definition of done (this engagement)

- [ ] Portfolio header simplified (More menu)  
- [ ] Hero `?` + scroll on one rail, aligned  
- [ ] Language switch works for shipped locales; menu matches files  
- [ ] Default theme high-contrast (portfolio + Casebook contrast)  
- [ ] Subscribe gated or working with real Buttondown username  
- [ ] `SHARED-CHROME.md` + `/assets/platform/` started  
- [ ] Phase 1 audit written; Phase 2 tasks started or queued with estimates  
