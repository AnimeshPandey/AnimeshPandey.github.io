# Architecture — anmshpndy.com

**Repo:** `AnimeshPandey/AnimeshPandey.github.io`  
**Live:** https://anmshpndy.com  
**Stack:** Static HTML · CSS custom properties · vanilla JS · GitHub Pages  
**Build step:** none — `git push main` is the entire deploy pipeline  
**Last verified:** May 2026 · `sw.js` cache `ap-v20`

---

## Table of contents

1. [Goals](#goals)
2. [Design principles](#design-principles)
3. [Layer model](#layer-model)
4. [Repository tree](#repository-tree)
5. [File breakdown](#file-breakdown)
6. [Page × asset matrix](#page--asset-matrix)
7. [Load sequence](#load-sequence)
8. [Data layer](#data-layer)
9. [Feature subsystems](#feature-subsystems)
10. [DOM reference](#dom-reference)
11. [Runtime state](#runtime-state)
12. [Deploy & secrets](#deploy--secrets)
13. [SEO & structured data](#seo--structured-data)
14. [Service worker](#service-worker)
15. [Content authority](#content-authority)
16. [Alignment status](#alignment-status)
17. [Extension playbook](#extension-playbook)
18. [Maintainer workflows](#maintainer-workflows)
19. [Verification checklist](#verification-checklist)

---

## Goals

| Goal | How it's achieved |
|------|-------------------|
| **Zero tooling** | No bundler, no `node_modules`, no transpilation. Repo root = deployable artifact |
| **Content-first** | Full copy lives in HTML; JS/CSS are progressive enhancements only |
| **Fast first paint** | Tiny always-on scripts (`theme.js` 33 LOC, `nav.js` 213 LOC); everything heavy is lazy |
| **Offline-tolerant** | Service worker: HTML network-first, assets cache-first |
| **Honest UX** | Recruiter panel discloses synthesized content; eggs are discoverable, never blocking |
| **Accessible by default** | Semantic sections, skip link, focus traps, `aria-*`, 44 px touch targets, reduced-motion paths throughout |
| **Ops-simple secrets** | Web3Forms + Cloudflare tokens live in GitHub Secrets; CI `sed`-injects them at deploy — never committed to the repo |

---

## Design principles

### 1 · Progressive enhancement

```
HTML (always) → theme tokens → layout CSS → chrome JS
  → homepage JS → lazy recruiter → lazy eggs (per device tier)
```

Every layer is optional. If `visuals.js` throws, the portfolio is still fully readable and all links work. If `sw.js` fails to install, the site still loads from origin.

### 2 · Layered separation of concerns

| Layer | Owns | Must not own |
|-------|------|--------------|
| **L0 Markup** | Copy, structure, JSON-LD, feature DOM shells | Business logic, animation timing |
| **L1 Tokens** | CSS custom properties: colours, type, spacing | Component rules |
| **L2 Presentation** | Layout, components, responsive rules, recruiter chrome | Runtime state |
| **L3 Chrome JS** | Theme persistence, mobile nav, scroll-spy | Recruiter render, form POST |
| **L4 Orchestration** | Capability detection, lazy loaders, hero canvas, card UX | Recruiter HTML generation |
| **L5 Feature modules** | One feature end-to-end per file | Cross-feature imports |
| **L5 Data scripts** | Static config on `window` | DOM queries |
| **L6 Edge** | SW caching, CI secret injection | UI logic |

### 3 · Lazy-load optional weight

Heavy features are not in the initial payload:

```
First page load  →  theme.css + site.css + theme.js + nav.js + visuals.js + contact.js
First recruiter  →  recruiter.css → profile-facts.js → recruiter-data.js → recruiter.js
First egg load   →  eggs.css → eggs-data.js → eggs-{mobile|tablet|desktop}.js
```

No eager import of recruiter or egg code on article pages.

### 4 · Capability gating

`visuals.js` builds a `caps` object on boot and passes it everywhere:

| Cap | Gate |
|-----|------|
| `reducedMotion` | Skip canvas, stagger, scan animation, auto-open terminal |
| `saveData` / slow 2G | Skip hero particles |
| `canvas2d` | Skip orbit and constellation eggs |
| `finePointer` | Enable card tilt; desktop-tier assumption |
| `coarsePointer` | Touch paths for eggs and cards |
| `iob` | IntersectionObserver timeline highlight |

Kill switch: `window.__VISUALS_DISABLED = true` before `visuals.js` disables all orchestrator effects.

### 5 · Narrow window contracts

Vanilla IIFEs expose only what the next layer needs:

| Global | Produced by | Consumed by |
|--------|-------------|-------------|
| `window.__PROFILE_FACTS` | `profile-facts.js` | `recruiter-data.js` |
| `window.__RECRUITER_BRIEF` | `recruiter-data.js` | `recruiter.js` |
| `window.RecruiterBriefing` | `recruiter.js` | `visuals.js`, deep links |
| `window.__EGG_DATA` | `eggs-data.js` | `eggs-{tier}.js` |
| `window.Eggs` | `eggs-{tier}.js` | `visuals.js` (boot), `recruiter.js` (closeAll) |
| `window.__rmPromoDismiss` | `visuals.js` | Promo card dismiss hook |

No bundler. No ES modules. New code follows **IIFE + `'use strict'` + file-header comment**.

### 6 · Mobile-first CSS

Base tokens and resets in `theme.css`; components in `site.css`. Desktop nav activates at `--bp-lg` (820 px). All form inputs are `font-size: 16 px` minimum (iOS zoom prevention).

### 7 · Single source of truth for facts

`assets/profile-facts.js` is canonical. `recruiter-data.js` reads `window.__PROFILE_FACTS` at runtime to build dates, roles, and education score — never hand-edited in isolation.

```
index.html  ←→  profile-facts.js  →  recruiter-data.js  →  recruiter.js
```

### 8 · Homepage-only features

`visuals.js`, `contact.js`, the recruiter shell, and all egg modules load **only on `index.html`**. Articles and `404.html` load only the chrome layer (theme + nav + analytics).

---

## Layer model

```
┌─────────────────────────────────────────────────────────────┐
│  L0 · Content                                               │
│  index.html · 404.html · articles/*                         │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│  L1 · Tokens          theme.css (69 LOC)                    │
│  CSS custom properties, font stacks, breakpoints             │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│  L2 · Presentation    site.css (1 438 LOC)                  │
│  Layout, components, responsive, recruiter chrome            │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│  L3 · Chrome (all pages)                                    │
│  theme.js (33) · nav.js (213)                               │
└──────────────────────────┬──────────────────────────────────┘
                           │  homepage only ↓
┌──────────────────────────▼──────────────────────────────────┐
│  L4 · Orchestration (homepage)                              │
│  visuals.js (637) · contact.js (184)                        │
└───────────────┬───────────────────────────┬─────────────────┘
                │ lazy                      │ lazy
┌───────────────▼─────────┐   ┌────────────▼────────────────┐
│  L5 · Recruiter         │   │  L5 · Easter eggs           │
│  recruiter.css (708)    │   │  eggs.css (241)             │
│  profile-facts.js (128) │   │  eggs-data.js (59)          │
│  recruiter-data.js (162)│   │  eggs-mobile.js (252)       │
│  recruiter.js (699)     │   │  eggs-tablet.js (264)       │
└─────────────────────────┘   │  eggs-desktop.js (330)      │
                              └─────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│  L6 · Edge                                                  │
│  sw.js (75) · GitHub Actions CI · Web3Forms · CF Beacon     │
└─────────────────────────────────────────────────────────────┘
```

---

## Repository tree

```
AnimeshPandey.github.io/
│
├── index.html                          # Homepage (1 228 LOC)
├── 404.html                            # Custom 404 + client redirect map (237 LOC)
├── fundamentals-of-functional-javascript/
│   └── index.html                      # Published article
├── how-well-do-you-know-this/
│   └── index.html                      # Published article
│
├── assets/
│   ├── theme.css                       # L1 — design tokens (69 LOC)
│   ├── site.css                        # L2 — full site presentation (1 438 LOC)
│   ├── theme.js                        # L3 — theme toggle + FOUC guard (33 LOC)
│   ├── nav.js                          # L3 — mobile nav, scroll-spy, back-to-top (213 LOC)
│   ├── visuals.js                      # L4 — orchestrator, hero canvas, lazy loaders (637 LOC)
│   ├── contact.js                      # L4 — Web3Forms handler, copy-email (184 LOC)
│   ├── profile-facts.js                # L5 data — canonical facts (128 LOC)
│   ├── recruiter-data.js               # L5 data — brief derived from facts (162 LOC)
│   ├── recruiter.js                    # L5 — panel render, focus trap, copy (699 LOC)
│   ├── recruiter.css                   # L5 — panel stylesheet (708 LOC)
│   ├── eggs.css                        # L5 — egg overlay styles (241 LOC)
│   ├── eggs-data.js                    # L5 data — sparklines, orbit nodes, terminal (59 LOC)
│   ├── eggs-mobile.js                  # L5 — M1 badge snapshot, M2 stat sparklines (252 LOC)
│   ├── eggs-tablet.js                  # L5 — T2 skills orbit canvas overlay (264 LOC)
│   ├── eggs-desktop.js                 # L5 — D1 constellation, D2 npm-test terminal (330 LOC)
│   ├── og-image.png                    # Social preview raster (86 KB)
│   └── og-image.svg                    # Social preview source art
│
├── sw.js                               # L6 — service worker, CACHE = ap-v20 (75 LOC)
├── resume.pdf                          # Downloadable resume
├── animesh_pandey_resume.tex           # Resume source (LaTeX)
├── favicon.svg
├── site.webmanifest
├── robots.txt
├── sitemap.xml
├── CNAME                               # anmshpndy.com
│
├── .github/
│   └── workflows/static-pages.yml     # Deploy: checkout → inject secrets → upload artifact
│
├── docs/
│   ├── ARCHITECTURE.md                 # ← this file (human documentation)
│   └── README.md                       # Docs index
├── .claude/
│   ├── launch.json                     # Local dev server (port 8181)
│   └── prompts/                        # Claude/Cursor implementation prompts only
└── README.md
```

---

## File breakdown

### Styles

| File | LOC | Layer | Responsibility |
|------|----:|-------|----------------|
| `theme.css` | 69 | L1 | `:root` and `[data-theme="dark"]` tokens — `--bg`, `--ink`, `--accent`, `--sage`, `--nav-h`, `--strip-h: 0`, `--bp-*`; Google Fonts import |
| `site.css` | 1 438 | L2 | Reset, a11y utilities, header/nav, hero (mobile-first), about/FAQ, timeline, skills, projects, writing, education, contact form, footer, scroll-reveal, impact lens, egg hint, header recruiter chrome, `.recruiter-mode` body effects, promo card |
| `recruiter.css` | 708 | L5 | Panel sheet (`rm-panel`), scan phase animation, section cards (snapshot/experience/projects/skills/education/explore), footer CTAs |
| `eggs.css` | 241 | L5 | Shared `.egg-hint`, M1 slide-up card, M2 sparkline popup, D1 constellation overlay, T2 orbit overlay, D2 faux terminal |

**`site.css` section map (line order):**

| Lines | Content |
|------:|---------|
| 1–50 | Reset, `.visually-hidden`, icon sizing, focus ring, skip link |
| 51–176 | Header, desktop nav, theme toggle, hamburger, mobile nav panel |
| 177–411 | Hero: mobile-first two-column layout, badge, CTAs, fact strip, hero card, ticker, scroll cue |
| 412–660 | About, stats bar, timeline, skills visual grid, projects, writing, education |
| 661–770 | Contact form, inline validation states, toast, footer, `.fade-up` scroll reveal |
| 771–920 | Visual hooks: hero ticker, skill chips, egg hint, timeline highlight, impact lens, tag stagger |
| 921+ | Header recruiter chrome (icon-only toggle + exit), `.recruiter-mode` effects, promo card, theme crossfade |

### Scripts

| File | LOC | Layer | Loads on | Entry / exports |
|------|----:|-------|----------|-----------------|
| `theme.js` | 33 | L3 | All pages | `#theme-toggle` click handler; reads/writes `localStorage.theme` |
| `nav.js` | 213 | L3 | All pages | Mobile menu (focus trap, Escape, overlay); scroll-spy active link; `#back-top` |
| `visuals.js` | 637 | L4 | Homepage | `boot()` → capability detection → hero canvas, card UX, egg lazy-loader, recruiter mode, hire shortcut, theme wink |
| `contact.js` | 184 | L4 | Homepage | `#contactForm` submit → Web3Forms POST; success/error UI; `#copyEmailBtn` |
| `profile-facts.js` | 128 | L5 data | Lazy | `window.__PROFILE_FACTS` — canonical identity, stats, employment, education, projects, skills |
| `recruiter-data.js` | 162 | L5 data | Lazy | `window.__RECRUITER_BRIEF` — derived from `__PROFILE_FACTS` + editorial prose |
| `recruiter.js` | 699 | L5 | Lazy | `window.RecruiterBriefing.{ open, close, toggle, isOpen, isActive }` |
| `eggs-data.js` | 59 | L5 data | Lazy | `window.__EGG_DATA` — sparkline series, orbit nodes, terminal lines, theme wink messages |
| `eggs-mobile.js` | 252 | L5 | Lazy (mobile tier) | `window.Eggs.{ boot, closeAll }` — M1 badge snapshot card, M2 long-press sparkline |
| `eggs-tablet.js` | 264 | L5 | Lazy (tablet tier) | `window.Eggs.{ boot, closeAll }` — T2 heading-tap canvas skill orbit |
| `eggs-desktop.js` | 330 | L5 | Lazy (desktop tier) | `window.Eggs.{ boot, closeAll }` — D1 `?` constellation sphere, D2 `npm test` faux terminal |

### Static / config

| File | Purpose |
|------|---------|
| `resume.pdf` | Downloadable; linked in header nav, hero, recruiter panel |
| `animesh_pandey_resume.tex` | LaTeX source — must align with `index.html` and `profile-facts.js` |
| `og-image.png` | OG meta image (86 KB raster); SW-precached |
| `favicon.svg` | SVG favicon |
| `site.webmanifest` | PWA manifest |
| `CNAME` | Custom domain `anmshpndy.com` for GitHub Pages |
| `robots.txt` | `Allow: *`, points to `sitemap.xml` |
| `sitemap.xml` | Canonical URLs for all pages |
| `sw.js` | Service worker — `CACHE = 'ap-v20'` |

---

## Page × asset matrix

| Page | CSS | Deferred JS | Recruiter shell | Contact form | SW register | CF Beacon |
|------|-----|-------------|-----------------|--------------|-------------|-----------|
| `index.html` | theme + site | theme, nav, visuals, contact | ✅ `#rm-panel` | ✅ `#contactForm` | ✅ | ✅ |
| Articles | theme + site | theme, nav | ✗ | ✗ | ✗ | ✅ |
| `404.html` | theme + site (+ inline 404 styles) | theme, nav | ✗ | ✗ | ✗ | ✅ |

**Inline scripts on homepage (not separate files):**
- `<head>` FOUC theme bootstrap (applies `data-theme` before CSS parses)
- `IntersectionObserver` on `.fade-up` elements
- `navigator.serviceWorker.register('/sw.js')` on window load

**Third-party:** Google Fonts (preconnect); Cloudflare Web Analytics beacon (token CI-injected, fires on all HTML).

---

## Load sequence

```
Browser requests index.html
  │
  ├── <link> theme.css          (render-blocking, intentional — FOUC prevention)
  ├── <link> site.css           (render-blocking)
  ├── <script> theme.js         (defer)
  ├── <script> nav.js           (defer)
  ├── <script> visuals.js       (defer) ──→ boot()
  │     ├── initHeroCanvas()
  │     ├── initCardExpand / Tilt / TagStagger / ArticleTap / ImpactLens
  │     ├── initTimelineHighlight()
  │     ├── initEggs()          ──→ loadCss(eggs.css)
  │     │                            → loadScript(eggs-data.js)
  │     │                            → loadScript(eggs-{tier}.js)
  │     │                            → Eggs.boot(tier, caps)
  │     ├── initRecruiterMode()
  │     ├── initResumeToast()
  │     ├── initThemeCrossfade()
  │     ├── initThemeWink()
  │     └── initHireShortcut()
  └── <script> contact.js       (defer)

User clicks header recruiter toggle (or ?recruiter=1)
  └── loadCss(recruiter.css)
        → loadScript(profile-facts.js)   → window.__PROFILE_FACTS
        → loadScript(recruiter-data.js)  → window.__RECRUITER_BRIEF
        → loadScript(recruiter.js)       → RecruiterBriefing.open()
```

---

## Data layer

### Authority chain

```
1. index.html         visible copy   — ground truth for content
2. profile-facts.js   structured     — must mirror index.html
3. recruiter-data.js  derived        — reads __PROFILE_FACTS at load time
4. eggs-data.js       decorative     — must not contradict headline stats
5. JSON-LD / FAQ      secondary      — update when (1) changes
```

Never hand-edit dates or the education score in `recruiter-data.js` — change `index.html` and `profile-facts.js` together, then verify the brief inherits correctly.

### `profile-facts.js` shape

```js
window.__PROFILE_FACTS = {
  identity:   { name, publicTitle, currentRole, currentCompany,
                location, status, availability, email, linkedin, github, resume },
  stats:      [ { label, value, unit } ],          // mirrors .stat-n on page
  employment: [ { company, location, role,
                  start, end,           // ISO 'YYYY-MM'
                  display,              // 'Apr 2022 – Sept 2025'
                  detail, anchor,
                  internship? } ],
  education:  [ { school, fullName, degree,
                  score: { value: 7.9, unit: 'CPI', scale: 10 },
                  start, end, anchor } ],
  projects:   [ { name, metric, anchor, tags } ],   // matches .pc-name
  skills:     { primary, secondary, also }
};
```

### `recruiter-data.js` shape

```js
window.__RECRUITER_BRIEF = {
  meta,                 // pulled from __PROFILE_FACTS.identity
  executiveSummary,     // string[] — editorial prose
  atAGlance,           // [{ label, value }]
  fitSignals,          // string[]
  highlights,          // employer cards derived from employment facts
  topProjects,         // 3 items matching profile-facts projects
  skillsTier,          // { primary, secondary, also } from facts
  scanSteps,           // phase labels for the scan animation
  alsoExplore          // article links
};
```

### `eggs-data.js` shape

```js
window.__EGG_DATA = {
  snapshot,        // M1 card rows [ { n, l } ]
  snapshotNote,    // M1 footer line
  sparklines,      // M2 keyed by stat text '7+', '50k+', '30%', '8+'
  orbitNodes,      // T2 [ { label, color } ]
  terminalLines,   // D2 [ { text, delay, cls } ]
  themeWinks       // X2 toast messages string[]
};
```

---

## Feature subsystems

### A · Theme (`theme.js` + `theme.css`)

- **Persistence:** `localStorage.theme` — default dark if absent.
- **DOM:** `document.documentElement.dataset.theme` (`'dark'` | `'light'`).
- **Toggle:** `#theme-toggle` button with `aria-pressed` and screen-reader label swap.
- **Cross-cut:** `initThemeCrossfade()` in `visuals.js` adds `html.theme-transitioning` for a 260 ms colour token transition. `initThemeWink()` fires a one-time toast after 5 rapid toggles (X2 egg).
- **FOUC guard:** Inline `<head>` script applies theme before CSS parses — zero flash.

### B · Navigation (`nav.js`)

- **Mobile menu:** `#hamburger` → `#mobile-nav` + `#nav-overlay` — focus trap, Escape-to-close, `aria-expanded`.
- **Desktop:** In-header `<nav>` with section hash links.
- **Scroll-spy:** `IntersectionObserver` on `<section>` elements updates active nav link.
- **Sticky header:** `.scrolled` on `header` after 8 px scroll.
- **Reading progress:** `.progress-bar` width via `--pct` (homepage only; guarded if element missing).
- **Back to top:** `#back-top` visible after 400 px scroll; smooth scroll + focus `#main-content`.

**Alignment note:** As of May 2026, `nav.js` still contains homepage hero animations and stat count-up — **scheduled for move** to `visuals.js` (see [Alignment status](#alignment-status)). Do not add new homepage-only behaviour here.

### C · Visual orchestration (`visuals.js`)

| Function | Gate | Behaviour |
|----------|------|-----------|
| `initScrollReveal` | `!reducedMotion` (planned) | `.fade-up` → `.in` via IO; today inline in `index.html` (**A3**) |
| `initHeroChrome` | `finePointer && !reducedMotion` (planned) | Rotate tagline, spotlight `--mx/--my`, `.hero-card` tilt, `.hero-float` parallax; today in `nav.js` (**A1**) |
| `initStatCountUp` | `iob && !reducedMotion` (planned) | `.stat-n` count-up; today in `nav.js` (**A1**) |
| `initHeroCanvas` | `!reducedMotion && !saveData && canvas2d` | 2D particle field in `#hero`; mouse-repel on desktop; IO pauses when hero leaves viewport |
| `initCardExpand` | always | `.pc-desc` overflow → "Read more" button |
| `initCardTilt` | `finePointer && !reducedMotion` | Mouse-tracked 3D perspective tilt on `.pc`, `.sv-card`, `.edu-card` |
| `initTagStagger` | always | CSS `--tag-i` index for stagger animation |
| `initArticleTap` | `!finePointer` | Full-row tap on writing cards navigates to article |
| `initTimelineHighlight` | `iob` | Active `.t-item` gets accent ring via IO |
| `initImpactLens` | always | `.pc[data-impact]` → bar-chart reveal on hover/tap |
| `initEggs` | `!__VISUALS_DISABLED` | Detects tier, lazy-loads CSS + data + tier module |
| `initRecruiterMode` | always | Mode state, header icon wiring, promo card, lazy recruiter chain |
| `initResumeToast` | always | `resume.pdf` click → `#copyToast` feedback |
| `initThemeCrossfade` | `!reducedMotion` | Smooth token transition on theme switch |
| `initHireShortcut` | always | Buffer keyboard input; `hire` → scroll to `#contact` |
| `initThemeWink` | once/session | 5 rapid theme toggles → toast wink (X2) |

**Device tier detection** (no UA sniffing):

```js
function getDeviceTier() {
  // narrow OR (coarse AND not wide)  → mobile
  // 640–1023px OR hybrid pointer    → tablet
  // wide AND fine AND hover         → desktop
  // fallback                        → mobile
}
```

Only **one** `eggs-{tier}.js` loads per session. Subsequent opens reuse the already-loaded module.

### D · Recruiter briefing

**Shell (in `index.html`):** `#rm-panel`, `#rm-scan`, `#rm-body`, `#rm-panel-minimize`, `#rm-copy-brief`, panel footer Resume + Email CTAs.

**Lazy load chain:**

```
recruiter.css → profile-facts.js → recruiter-data.js → recruiter.js
```

**State model:**

| Signal | Meaning |
|--------|---------|
| `body.recruiter-mode` | Mode active |
| `localStorage.recruiter = '1'` | Persists across reloads |
| `header.recruiter-active` | Shows exit icon, highlights toggle |
| `body.rm-panel-open` | Panel currently visible |
| `#rm-panel.rm-panel-visible` | Panel slide-in complete |
| `?recruiter=1` URL param | Opens mode + panel on load |

**State transitions:**

```
Toggle click  → enterAndOpen() → set(true) → open()
Exit click    → set(false)     → close()
Deep link     → set(true) + open()
Reload        → set(true) — panel closed (restored from localStorage)
Panel close   → mode STAYS on; only Exit dismisses mode
```

**Render cache:** `_lastRenderMs` timestamp; if panel reopens within 2 minutes the `#rm-body` DOM is reused without re-rendering (smooth reopen, no flicker).

**Entry points:**

| ID | Location | Behaviour |
|----|----------|-----------|
| `#header-rm-toggle` | Header, all breakpoints | Icon-only (`#i-cpu`); opens briefing |
| `#header-rm-exit` | Header, all breakpoints | Icon-only (`#i-close`); exits mode; visible only when `header.recruiter-active` |
| `#rm-promo` | JS-injected, once per session | Promo bar below header; `sessionStorage.rm-promo` prevents repeat |

**Public API:** `window.RecruiterBriefing.{ open(trigger?), close(), toggle(trigger?), isOpen(), isActive() }`

**Coordination:** `recruiter.js open()` calls `window.Eggs.closeAll()` to dismiss any open egg overlay before the panel slides in.

**Removed patterns (do not restore):** `#rm-strip` bar, hero/footer/mobile nav recruiter toggles, `pointer-events: none` on `#writing` or FAQ.

### E · Easter eggs

All eggs are lazy-loaded after `initEggs()` detects the tier. Only one tier module ever loads per session.

| ID | Tier | Trigger | Tech | Behaviour |
|----|------|---------|------|-----------|
| M1 | Mobile | Tap `#hero .badge` | CSS + DOM | Slide-up career snapshot card; 6 s auto-close |
| M2 | Mobile | Long-press (500 ms) `.stat-n` | Canvas 2D | Sparkline popup showing stat trend; keyboard: Space to show |
| T2 | Tablet | Tap `#skills-heading` | Canvas 2D | Full-screen skill orbit; single-finger drag-to-spin; `prefers-reduced-motion` → static word cloud |
| D1 | Desktop | Press `?` | Canvas 2D | Skills constellation sphere; drag-rotate; 12 s auto-close |
| D2 | Desktop | Type `npm test` | DOM animation | Faux terminal slides up; sequential test-pass output; auto-closes after last line |
| X2 | All | 5 rapid theme toggles | Toast | One-line wink message via `#copyToast`; once per session |

**Discovery:** `.egg-hint` elements fade in after 1.5–2 s, then fade out at 7–8 s. `sessionStorage.egg_hint_*` prevents repeat on return visits.

**Coordination:** `window.Eggs.closeAll()` dismisses all open egg overlays — called by `RecruiterBriefing.open()`.

### F · Contact (`contact.js`)

| Element | ID |
|---------|-----|
| Form | `#contactForm` |
| Name field | `#fname` |
| Email field | `#femail` |
| Message field | `#fmsg` |
| Honeypot | `input[name="botcheck"]` |
| Status/feedback | `#formSuccess` (`aria-live="polite"`) |
| Copy email | `#copyEmailBtn` |
| Toast | `#copyToast` |

**Submit paths:**

| Condition | Outcome |
|-----------|---------|
| `W3F_KEY` missing / placeholder | Console error; in-page message with *user-clicked* mailto link |
| API `data.success` | Form reset; in-page success message; **no email client opened** |
| API error or network fail | In-page error; user-clicked mailto link |
| Honeypot checked | Silently no-op |

Manual `mailto:` links remain in quick actions, footer socials, and the recruiter panel — they are user-initiated, not programmatic.

### G · Service worker

See [Service worker](#service-worker) section below.

---

## DOM reference

### Global (all pages)

| ID | Element | Purpose |
|----|---------|---------|
| `theme-toggle` | `<button>` | Light/dark switch |
| `hamburger` | `<button>` | Open mobile nav |
| `mobile-nav` | `<nav>` | Slide-in mobile nav panel |
| `mobile-nav-close` | `<button>` | Close mobile nav |
| `nav-overlay` | `<div>` | Click-outside dimmer for mobile nav |
| `back-top` | `<a>` | Scroll-to-top anchor |

### Homepage only

| ID | Element | Purpose |
|----|---------|---------|
| `header-rm-group` | `<div>` | Flex wrapper for recruiter controls |
| `header-rm-toggle` | `<button>` | Open recruiter briefing (icon only) |
| `header-rm-exit` | `<button>` | Exit recruiter mode (icon only) |
| `rm-panel` | `<div[role=dialog]>` | Briefing panel shell |
| `rm-scan` | `<div>` | Scan phase animation container |
| `rm-body` | `<div>` | Rendered brief content |
| `rm-panel-minimize` | `<button>` | Minimize panel (mode stays on) |
| `rm-copy-brief` | `<button>` | Copy brief as plain text |
| `egg-key-hint` | `<div aria-hidden>` | Desktop `?` key discovery hint |
| `skills-heading` | `<h2>` | Tablet T2 orbit trigger |
| `contactForm` | `<form>` | Web3Forms form |
| `fname`, `femail`, `fmsg` | `<input>`, `<textarea>` | Contact fields |
| `formSuccess` | `<div aria-live>` | Submit feedback |
| `copyEmailBtn` | `<button>` | Copy email to clipboard |
| `copyToast` | `<div>` | Shared toast for copy + resume feedback |
| `shortcut-announce` | `<div aria-live>` | Screen-reader announcement for `hire` shortcut |

**SVG sprite symbols** (inline in `index.html`): `#i-cpu`, `#i-close`, `#i-download`, `#i-menu`, `#i-sun`, `#i-moon`, `#i-mail`, `#i-linkedin`, `#i-github`, `#i-x`, `#i-pin`, `#i-clock`, `#i-users`, `#i-bolt`, `#i-heart`, `#i-code`, `#i-layers`, `#i-sparkle`, `#i-beaker`, `#i-tool`, `#i-chart`, `#i-cloud`, `#i-chevron-down`, `#i-star`.

---

## Runtime state

### `localStorage`

| Key | Values | Owner |
|-----|--------|-------|
| `theme` | `'light'` (absent = dark) | `theme.js` |
| `recruiter` | `'1'` / `'0'` | `visuals.js`, `recruiter.js` |

### `sessionStorage`

| Key | Purpose |
|-----|---------|
| `rm-promo` | `'1'` — promo card dismissed this session |
| `egg_hint_career` | Hint shown for M1 badge egg |
| `egg_hint_sparkline` | Hint shown for M2 stat sparkline |
| `egg_hint_orbit` | Hint shown for T2 orbit egg |
| `egg_hint_terminal` | Hint shown for D2 terminal egg |
| `egg_theme_wink` | `'1'` — theme wink toast fired this session |

### `window` globals

| Name | Producer | Consumers |
|------|----------|-----------|
| `__PROFILE_FACTS` | `profile-facts.js` | `recruiter-data.js` |
| `__RECRUITER_BRIEF` | `recruiter-data.js` | `recruiter.js` |
| `RecruiterBriefing` | `recruiter.js` | `visuals.js`, `?recruiter=1` handler |
| `__EGG_DATA` | `eggs-data.js` | `eggs-{tier}.js` |
| `Eggs` | `eggs-{tier}.js` | `visuals.js` (boot), `recruiter.js` (closeAll) |
| `__VISUALS_DISABLED` | Consumer sets before load | `visuals.js` kill-switch |
| `__rmPromoDismiss` | `visuals.js` promo card | `visuals.js` `set(true)` cleanup |

---

## Deploy & secrets

### Pipeline

```yaml
on: push main   (or workflow_dispatch)

steps:
  1. actions/checkout@v4
  2. Inject secrets
       sed 'YOUR_WEB3FORMS_ACCESS_KEY' → actual key   (assets/contact.js)
       sed 'YOUR_CF_BEACON_TOKEN'      → actual token  (all *.html)
  3. actions/configure-pages@v5
  4. actions/upload-pages-artifact@v3   path: "."
  5. actions/deploy-pages@v5
```

### GitHub Secrets

| Secret name | Used by | Placeholder in repo |
|-------------|---------|---------------------|
| `W3F_ACCESS_KEY` | `contact.js` | `YOUR_WEB3FORMS_ACCESS_KEY` |
| `CF_BEACON_TOKEN` | All `*.html` | `YOUR_CF_BEACON_TOKEN` |

Missing secrets: deploy still succeeds; contact form shows a config-error message (no auto-open email client); analytics beacon is silent.

### Custom domain

`CNAME` contains `anmshpndy.com`. GitHub Pages serves the root under both the custom domain and `animeshpandey.github.io`.

---

## SEO & structured data

| Schema | Where |
|--------|-------|
| `Person` | `index.html` JSON-LD |
| `WebSite` + `SearchAction` | `index.html` JSON-LD |
| `ProfilePage` | `index.html` JSON-LD |
| `FAQPage` | `index.html` JSON-LD — education answer uses **CPI 7.9**, employment dates match timeline |
| `Article` + `BreadcrumbList` | Each article `index.html` |

- Canonical URL: `https://anmshpndy.com/`
- `robots.txt` → `sitemap.xml` → all canonical URLs
- `rel=me` identity links in `<head>` (GitHub, LinkedIn, X)
- OG + Twitter Card meta on all pages; image: `/assets/og-image.png`

---

## Service worker

**File:** `sw.js` · **Cache:** `ap-v20`

```js
// Bump CACHE version in sw.js whenever a precached asset changes.
// Old caches are deleted on activate; clients.claim() takes immediate control.
```

**Precache list:**

```
/
/assets/theme.css          /assets/site.css
/assets/theme.js           /assets/nav.js
/assets/visuals.js         /assets/contact.js
/assets/profile-facts.js
/assets/recruiter-data.js  /assets/recruiter.js  /assets/recruiter.css
/assets/eggs.css           /assets/eggs-data.js
/assets/eggs-mobile.js     /assets/eggs-tablet.js  /assets/eggs-desktop.js
/favicon.svg               /assets/og-image.png
```

| Resource type | Strategy |
|---------------|----------|
| HTML (any `Accept: text/html`) | Network-first; cache updated on success; falls back to cache offline |
| All other same-origin GET | Cache-first; fetched and cached on first miss |
| Cross-origin | Pass-through (not intercepted) |

SW registers on homepage load only; articles and 404 do not register.

---

## Content authority

When sources conflict, this is the resolution order:

```
1. index.html visible copy     ← primary truth; edit this first
2. animesh_pandey_resume.tex   ← must align; owner approval before resume-only changes
3. profile-facts.js            ← structured mirror of (1); must stay in sync
4. recruiter-data.js           ← derived from (3) at runtime; never source of truth
5. eggs-data.js                ← decorative; must not contradict headline metrics
6. JSON-LD / FAQ               ← secondary; update when (1) changes
```

---

## Alignment status

The **documented** layer model is the target; the repo may drift until alignment work lands. Use **[`.claude/prompts/portfolio-architecture-alignment-prompt.md`](../.claude/prompts/portfolio-architecture-alignment-prompt.md)** to implement fixes.

| ID | Status | Issue | Target owner |
|----|--------|-------|--------------|
| A1 | **open** | Hero rotate, spotlight, hero-card tilt, float parallax, stat count-up live in `nav.js` | `visuals.js` (`initHeroChrome`, `initStatCountUp`) |
| A2 | **open** | Duplicate `#hero` mouse handlers (`nav.js` + canvas in `visuals.js`) | Single hero subsystem in `visuals.js` |
| A3 | **open** | Scroll-reveal `IntersectionObserver` inline in `index.html` | `visuals.js` `initScrollReveal()` |
| A4 | **open** | FAQ accordion CSS injected via JS in `index.html` | `site.css` FAQ section |
| A5 | **open** | `site.css` section blocks not strictly ordered | Enforced section map (see alignment prompt Phase 2) |
| A6 | **partial** | Recruiter mode vs panel split across `visuals.js` and `recruiter.js` | Documented; minimize duplicate `syncToggles` |
| A7 | ok | Lazy loaders only in `visuals.js` | — |
| A8 | **open** | Inconsistent `assets/*.js` file headers | Standard header block on every module |
| A9 | **open** | `#yr` year script inline in `index.html` | Optional move to `nav.js` |
| A10 | ok | Progress bar in `nav.js` with DOM guard | Homepage-only element |
| A11 | ok | `initTagStagger()` in `visuals.js` sets `--tag-i` on project tags | — |
| A12 | **open** | LOC table vs `wc -l` after refactors | Re-count after alignment |

When an ID is fixed, set **Status** to `fixed` and add a one-line note with commit or date.

### Target `nav.js` contract (L3)

**Owns:** mobile menu, scroll-spy, sticky header shadow, reading progress bar (if present), back-to-top.

**Must not own:** hero effects, project card tilt, eggs, recruiter panel render, contact POST, scroll-reveal.

### Target `visuals.js` contract (L4)

**Owns:** `caps` detection, `boot()`, hero canvas + hero chrome, scroll reveal, card UX, timeline highlight, impact lens, eggs/recruiter lazy load, hire shortcut, theme crossfade/wink, SW register (if moved from HTML).

**Must not own:** panel HTML generation (delegates to `recruiter.js`).

---

## Extension playbook

| Change type | Files to touch |
|-------------|----------------|
| New homepage section | `index.html`, `site.css`, nav links, `sitemap.xml`, optional JSON-LD |
| New design token | `theme.css` only |
| New always-on behaviour (all pages) | `nav.js` or `theme.js` |
| New homepage-only interaction | `visuals.js` + `site.css`; gate with `caps` |
| New easter egg | `eggs-data.js`, one `eggs-{tier}.js`, `eggs.css`, `sw.js` ASSETS list |
| Recruiter content update | `profile-facts.js` → `recruiter-data.js` (verify derivation) |
| New project | `index.html` `.pc` block + `profile-facts.js` `projects[]` |
| Employment change | `index.html` timeline `<time datetime>` + `profile-facts.js` employment; verify recruiter brief inherits; update resume |
| Contact change | `contact.js` only |
| New secret | Placeholder in repo + GitHub Secret + `sed` step in workflow |
| New precached asset | Add to `sw.js` ASSETS + bump `CACHE` version |

**Anti-patterns — never do these:**

- Adding a bundler or npm dependency without explicit owner decision
- Loading recruiter or egg code on article pages
- Programmatic `mailto:` open on successful form submit
- Inventing metrics, dates, or education scores
- Hand-editing dates in `recruiter-data.js` without updating `index.html` and `profile-facts.js`
- Re-adding `#rm-strip`, hero/footer/mobile recruiter toggles, or section blocking (`pointer-events: none`) in recruiter mode
- Duplicating CSS tokens as hard-coded values in JS

---

## Maintainer workflows

### Update employment or education

1. Edit `index.html` timeline (`<time datetime>`, `.t-role`, `.t-desc`) and/or `.edu-cpi`.
2. Mirror in `assets/profile-facts.js` (same ISO dates, same score).
3. Open `assets/recruiter-data.js`; verify the derivation produces correct `display` strings and education line.
4. Update `animesh_pandey_resume.tex` if dates have changed (owner approval first).
5. Update FAQ JSON-LD in `index.html` if the education or employment answer changes.
6. Bump `sw.js` `CACHE` if any JS file changed.

### Add a project

1. New `.pc` block in `index.html` `#projects`.
2. Entry in `profile-facts.js` `projects[]` (name must match `.pc-name` exactly).
3. If it belongs in top-3 brief, update `recruiter-data.js` `topProjects`.

### Ship a change

1. Push to `main` — GitHub Actions deploys in ~60 s.
2. Hard-refresh the live site after the SW cache version was bumped.
3. Test `?recruiter=1` and a real contact POST on production with secrets set.

### Local development

```bash
npx serve -l 8181 .
open http://localhost:8181
```

No build step. Changes to HTML/CSS/JS are effective on browser reload.

### Bump the service worker cache

Edit `sw.js` first line:

```js
const CACHE = 'ap-v20';   // increment every time a precached asset changes
```

Also add/remove any asset URLs in `ASSETS` before bumping.

---

## Verification checklist

### Functionality

| Check | How to verify |
|-------|--------------|
| Light/dark theme | Toggle → reload; no FOUC on first paint |
| Theme persists | `localStorage.theme` set; survives hard-refresh |
| Mobile nav | Open, Escape closes; focus trapped inside; 44 px targets |
| Scroll-spy | Active nav link updates while scrolling sections |
| Hero particles | Visible on desktop; absent on `prefers-reduced-motion` |
| Impact lens | Hover/tap `.pc[data-impact]` → bar chart reveals |
| Recruiter lazy | Network tab: `recruiter.js` absent until header icon clicked |
| `?recruiter=1` deep link | Loads mode + opens panel immediately |
| Recruiter data | Lifesight `Sept 2025 – Present`; Tekion `Apr 2022 – Sept 2025`; Vassar Labs visible; education `CPI 7.9` |
| Recruiter exit | Header exit icon dismisses mode; toggle icon deactivates |
| Eggs (mobile) | Badge tap → snapshot card; stat long-press → sparkline |
| Eggs (tablet) | "Built with" heading tap → orbit canvas |
| Eggs (desktop) | `?` → constellation; type `npm test` → terminal |
| `hire` shortcut | Type `hire` (not in input) → scroll to contact |
| Contact submit | `data.success` → in-page message only; **no mail client opens** |
| Copy email | `#copyEmailBtn` → toast; clipboard has address |
| Resume download | Header link downloads `resume.pdf` |
| SW installed | Application tab → `ap-v20` (or current) in Storage |
| Offline | SW serves cached assets without network |

### Accessibility

| Check | Standard |
|-------|---------|
| Skip link | Visible on focus; navigates to `#main` |
| Focus trap | Mobile nav and recruiter panel each trap focus; Escape exits |
| Reduced motion | No canvas, no slide animations, no typewriter |
| `aria-live` regions | `#formSuccess`, `#shortcut-announce`, `#copyToast` |
| Icon buttons | All have complete `aria-label` |
| Touch targets | All interactive elements ≥ 44 × 44 px |
| Colour contrast | WCAG AA in both themes |

### Production-only

| Check | Notes |
|-------|-------|
| Contact POST | Requires `W3F_ACCESS_KEY` secret set in GitHub repo settings |
| CF analytics | Requires `CF_BEACON_TOKEN` secret |
| Custom domain | `CNAME` → `anmshpndy.com` resolves |
| OG image | `/assets/og-image.png` serves (not only SVG) |
