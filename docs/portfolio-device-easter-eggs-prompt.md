# Claude Prompt — Device-Specific Easter Eggs (Flows, Animations, Micro-Games)

**Repo:** `AnimeshPandey.github.io`  
**Canonical site:** https://anmshpndy.com  
**Stack:** Static HTML · CSS · vanilla JS · GitHub Pages (no build step)  
**Homepage only** — do not load egg modules on articles or `404.html`.

**Related:** `docs/cross-device-visuals-claude-prompt.md`, `docs/portfolio-visuals-implement-prompt.md`, `docs/portfolio-architecture-prompt.md`, `docs/portfolio-recruiter-mode-ux-refinement-prompt.md`

---

## Your role

You are a **principal frontend engineer + playful interaction designer**. Extend the portfolio with **device-appropriate easter eggs** — hidden flows, short animations, or micro-games — that feel **intentional and on-brand**, not arcade clutter.

**North star:** A visitor on phone, tablet, or desktop discovers something **different and delightful** on their device class, without breaking core UX, SEO, accessibility, or performance.

---

## What already exists (do not break — extend or refine)

Audit `assets/visuals.js` + `assets/site.css` (VISUALS / egg block) before coding.

| Tier | Trigger | Experience | File |
|------|---------|------------|------|
| **Mobile** | Tap `#hero .badge` (+ hint “Tap badge…”) | Slide-up **career snapshot** card | `initMobileEgg()` |
| **Desktop** | `?` key + `#egg-key-hint` (≥820px) | Fullscreen **Canvas 2D skills sphere** (drag rotate, 12s auto-close) | `initDesktopEgg()` |
| **Keyboard (all)** | Type `hire` | Scroll to `#contact`, focus first field | `initHireShortcut()` |
| **Recruiter** | Header / panel (separate product) | Briefing panel — **not** a hidden egg; don’t merge | `recruiter.js` |

**Capability gates today** (`visuals.js` boot):

```js
caps = {
  reducedMotion, finePointer, coarsePointer, saveData,
  canvas2d, iob  // IntersectionObserver
}
```

**Gaps to address in this project:**

- **Tablet** (touch + ~640–1024px) often gets **only** mobile *or* desktop egg — needs a **dedicated** experience.
- Mobile egg skips when `finePointer && !coarsePointer` — iPad + trackpad edge cases need explicit tier rules.
- No micro-games yet; no “flow” eggs beyond snapshot / constellation.

---

## Non-negotiable constraints

1. **Zero build step** — vanilla JS; optional lazy-loaded egg modules (like recruiter).
2. **Progressive enhancement** — site fully usable if all egg JS fails.
3. **WCAG 2.1 AA** — keyboard path for every egg; `Escape` closes overlays; focus return; `aria-live` for state; no hover-only discovery.
4. **`prefers-reduced-motion: reduce`** — static or instant reward (no rAF games, no typewriter loops).
5. **No UA sniffing** — tier = `matchMedia` + pointer/hover capabilities + optional width bands.
6. **Performance** — Lighthouse mobile: Perf ≥ 90, A11y ≥ 95; lazy-load game code; cap rAF work; pause when `document.hidden`.
7. **Honesty** — no fake “AI” chat eggs; no sound/vibration by default; no `cursor: none`; no full-page traps without exit.
8. **Discoverability** — subtle hint (fades after 7s) OR documented in README for owners; **no** Konami-only secrets.
9. **Conflict avoidance** — don’t fight recruiter panel, contact form, mobile nav, or `?` desktop egg (reuse `?` only if enhancing same overlay).

**Kill switch:** `window.__VISUALS_DISABLED = true` before `visuals.js` (eggs must respect this).

---

## Device tier model (implement explicitly)

Define once in `assets/eggs-tier.js` or top of `assets/eggs.js`:

```js
function getDeviceTier() {
  var rm = window.matchMedia;
  var narrow = rm('(max-width: 639px)').matches;
  var tablet = rm('(min-width: 640px) and (max-width: 1023px)').matches;
  var wide   = rm('(min-width: 1024px)').matches;
  var coarse = rm('(pointer: coarse)').matches;
  var fine   = rm('(pointer: fine)').matches;
  var hover  = rm('(hover: hover)').matches;

  if (narrow || (coarse && !wide)) return 'mobile';
  if (tablet || (coarse && fine))  return 'tablet';  // hybrid devices
  if (wide && fine && hover)       return 'desktop';
  return 'mobile'; // safe default
}
```

| Tier | Typical devices | Primary input | Egg budget |
|------|-----------------|---------------|------------|
| **mobile** | Phone portrait | Touch | 1 primary + 1 optional micro-game |
| **tablet** | iPad, Android tablet, fold cover | Touch + sometimes keyboard | 1 unique flow (not clone of phone/desktop) |
| **desktop** | Laptop, monitor | Mouse + keyboard | 1 primary (enhance `?`) + 1 optional micro-game |

**Rule:** Each tier gets **at least one exclusive** egg; shared eggs (e.g. `hire`) are allowed but don’t count as exclusive.

---

## Phase 0 — Proposal (required before coding)

Deliver in chat:

1. **Tier assignment table** — which eggs run on which tier (including existing mobile/desktop).
2. **Concept shortlist** — 2 options per tier; pick 1 recommended each with rationale.
3. **Library matrix** — CSS only vs Canvas 2D vs lazy chunk (avoid Three.js unless extraordinary).
4. **Risk register** — scroll jank, accidental triggers, z-index vs header/panel.
5. **File plan** — see architecture below.
6. Max **2** questions only if blocked.

---

## Recommended architecture

### Module layout (keep `visuals.js` as orchestrator)

```text
assets/visuals.js          → boot, caps, initEggs() loader
assets/eggs-tier.js        → getDeviceTier() only (tiny, always with visuals OR inlined)
assets/eggs-shared.js      → hint helpers, overlay factory, focus trap, reduced-motion fallback
assets/eggs-mobile.js      → lazy
assets/eggs-tablet.js      → lazy
assets/eggs-desktop.js     → lazy (+ migrate initDesktopEgg here)
assets/eggs-data.js        → copy, game config, jokes, static fallbacks
assets/eggs.css            → lazy (or section in site.css if small)
```

**Load pattern:**

```js
function initEggs() {
  if (window.__VISUALS_DISABLED || caps.reducedMotion && !caps.allowStaticEggs) return;
  var tier = getDeviceTier();
  var file = { mobile: 'eggs-mobile.js', tablet: 'eggs-tablet.js', desktop: 'eggs-desktop.js' }[tier];
  loadCss('/assets/eggs.css').then(function () { return loadScript('/assets/eggs-data.js'); })
    .then(function () { return loadScript(file); })
    .then(function () { window.Eggs && window.Eggs.boot(tier, caps); });
}
```

- Move **existing** `initMobileEgg` / `initDesktopEgg` into tier files during refactor (minimal behaviour change first).
- Bump `sw.js` `CACHE` when adding assets.

### Public API

```js
window.Eggs = {
  boot: function (tier, caps) {},
  closeAll: function () {}  // called if recruiter panel opens — avoid stacked modals
};
```

**Coordination:** When `RecruiterBriefing.open()` runs, call `Eggs.closeAll()` if defined.

---

## Concept menu (pick & implement per tier)

Implement **one primary + one optional** per tier from approved concepts. Defer rest with reasons in final report.

### Mobile-exclusive (touch-first)

| ID | Concept | Interaction | Tech | Notes |
|----|---------|-------------|------|-------|
| M1 | **Career snapshot** (existing) | Tap hero badge | CSS + DOM | Polish hint timing; add haptic-free pulse on open |
| M2 | **Stat “perf guard”** | Long-press `.stat-n` (500ms) | CSS + short canvas sparkline | Release to close; don’t block scroll |
| M3 | **Console quip stream** | Triple-tap `AP.` logo | DOM typewriter 3 lines | dev-humor; max 8s |
| M4 | **Bug squash** micro-game | Swipe up from bottom hint | Canvas 2D, 30s max | Tap 5 “a11y bugs”; score → share text copy |

**Recommended:** Keep **M1** + add **M4** or **M2** (not both heavy games).

### Tablet-exclusive (touch, medium width)

| ID | Concept | Interaction | Tech | Notes |
|----|---------|-------------|------|-------|
| T1 | **Timeline scrub** | Horizontal drag on `#experience` rail | CSS + `scroll-snap` + IO | Landscape-preferred; portrait = simplified tap-step |
| T2 | **Skill orbit lite** | Two-finger rotate gesture on `#skills` header | Canvas 2D, 8 nodes max | Falls back to tap-to-rotate one node |
| T3 | **Split persona cards** | Pinch on hero subtitle | CSS flip | “Recruiter view” vs “Builder view” copy swap (not full recruiter mode) |
| T4 | **Article trail** | Draw circle on writing section label | SVG path animation | Unlocks hidden “recommended read” ordering |

**Recommended:** **T1** or **T2** — must feel natural on iPad, useless on phone.

### Desktop-exclusive (fine pointer + keyboard)

| ID | Concept | Interaction | Tech | Notes |
|----|---------|-------------|------|-------|
| D1 | **Skills constellation** (existing) | `?` key | Canvas 2D | Add keyboard help overlay; optional node click → scroll to project |
| D2 | **Terminal buffer** | Type `npm test` (not in inputs) | DOM faux terminal | Shows 3 fake passing tests; compliments real CI ethos |
| D3 | **MMM curve doodle** | Hold `Shift` + hover projects grid | Canvas overlay | Playful fake “attribution curve”; releases on mouseup |
| D4 | **Bundle guess game** | `Ctrl+.` or `cmd+.` opens modal | DOM | Guess bundle size; reveal actual-ish numbers from copy |
| D5 | **Focus mode** | Double-click progress bar | CSS | Hides chrome 10s for reading; `Escape` restores |

**Recommended:** Enhance **D1** + add **D2** or **D4** (keyboard-discoverable).

### Cross-tier (allowed, keep minimal)

| ID | Concept | Tier | Notes |
|----|---------|------|-------|
| X1 | `hire` shortcut | All keyboards | Exists — add subtle `#egg-key-hint`-style hint on desktop only |
| X2 | **Theme wink** | All | 5 rapid theme toggles → one-line joke toast (once per session) |
| X3 | **Reduced-motion gallery** | All | Static “achievement card” instead of animations |

---

## Micro-game design rules

If implementing a game (M4, D4, etc.):

| Rule | Requirement |
|------|-------------|
| Duration | ≤ 45s session; auto-close at 60s |
| Scoring | Local only; optional “Copy score” — no leaderboard API |
| Input | Touch **or** keyboard equivalents |
| Motion | Pause rAF when tab hidden or egg closed |
| Failure | `Escape`, close button, tap outside (if not destructive) |
| Content | Tie to real skills (a11y, perf, React, MMM) — tasteful dev humor |
| SEO | No extra routes; no indexable game-only pages |

**Defer:** Multi-level games, WebAudio, multiplayer, localStorage high scores (unless trivial).

---

## UX & discovery patterns

| Pattern | Use |
|---------|-----|
| Fading hint (7s visible) | Mobile badge, tablet scrub, desktop `?` / `npm test` |
| `aria-hidden` decorative hints | Yes |
| `sessionStorage.egg_hint_seen_*` | Don’t repeat hint every visit |
| First egg per session | Optional confetti **CSS only** (reduced-motion: border flash) |

**Anti-discovery:** No blocking modals on first visit; no cookie banners for eggs.

---

## HTML / CSS / JS touch points

| File | Changes |
|------|---------|
| `index.html` | Optional `data-egg-hook` attributes; don’t bloat markup |
| `assets/site.css` | Keep shared egg styles or migrate to `eggs.css` |
| `assets/visuals.js` | Replace inline egg inits with `initEggs()` loader; keep caps |
| `assets/eggs-*.js` | Tier implementations |
| `assets/eggs-data.js` | Strings, game levels, static reduced-motion content |
| `assets/recruiter.js` | Call `Eggs.closeAll()` on panel open (one line) |
| `sw.js` | Cache new egg assets; bump version |
| `README.md` | Owner section “Easter eggs (spoilers)” — optional |

---

## Accessibility checklist (per egg)

- [ ] Trigger operable via keyboard where tier allows keyboard
- [ ] `role="dialog"` for overlays; `aria-modal="true"` when blocking
- [ ] Focus trapped only while open; `Escape` exits
- [ ] Focus returns to trigger element
- [ ] Game score changes announced with `aria-live="polite"` once
- [ ] Reduced motion: static card with same information
- [ ] Contrast OK in light/dark theme
- [ ] No seizure-inducing flashes (WCAG 2.3.1)

---

## Verification matrix

### Devices

- [ ] 320×568 mobile — touch eggs only; no desktop overlay
- [ ] 390×844 mobile — long-press doesn’t steal scroll
- [ ] 768×1024 tablet — **tablet-exclusive** egg fires (not phone-only skip)
- [ ] 1024×768 tablet landscape — timeline/scrub usable
- [ ] 1280×800 desktop — `?` egg + keyboard egg
- [ ] Desktop + `prefers-reduced-motion` — static fallbacks

### Regression

- [ ] Recruiter briefing opens without egg overlay stuck
- [ ] Contact form still submittable
- [ ] Mobile nav + focus trap unaffected
- [ ] `__VISUALS_DISABLED` disables all eggs
- [ ] No horizontal scroll introduced
- [ ] Lighthouse mobile still ≥ 90 perf (spot-check)

---

## Implementation phases

### Phase A — Refactor (no new eggs)

1. Extract tier detection + shared helpers.
2. Move existing mobile/desktop eggs into tier modules; behaviour parity.
3. Wire lazy load + `sw.js` cache.

### Phase B — One new egg per tier

1. Mobile: micro-game or long-press stat.
2. Tablet: timeline scrub or skill orbit lite.
3. Desktop: terminal buffer or bundle guess + D1 polish.

### Phase C — Polish

1. Hints + `sessionStorage` dismiss.
2. `Eggs.closeAll()` integration with recruiter.
3. README spoiler section for maintainers.

**Commits (example):**

1. `portfolio: extract egg modules and device tier detection`
2. `portfolio: add tablet-exclusive easter egg`
3. `portfolio: add mobile and desktop micro-games with a11y fallbacks`
4. `portfolio: egg hints, recruiter coordination, sw cache bump`

---

## Anti-patterns

- Same egg on all devices with only CSS scale changes (lazy; not “device-specific”)
- UA string checks (`/iPhone|iPad/`)
- Three.js for a 30s gag
- Autoplay sound, vibration API, fullscreen without exit
- Eggs that fire on scroll without intentional gesture
- Stealing `?` for a different overlay without merging old behaviour
- Loading all tier JS files “just in case”
- Games that mock users or recruiters negatively
- Hidden eggs that block hiring CTAs

---

## Execution instruction

1. Run **Phase 0 proposal** — get tier table + chosen concepts approved (or proceed with recommendations in doc if user absent).
2. **Phase A** refactor with zero behaviour change — verify regression matrix.
3. **Phase B** one exclusive egg per tier — test on real device classes.
4. Report: shipped vs deferred, perf notes, how to trigger each egg (maintainer cheatsheet).

Prioritize **craft and clarity** over quantity. Three great device-specific surprises beat seven mediocre ones.
