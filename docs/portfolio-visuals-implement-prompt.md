# Claude Prompt — Analyze & Implement Portfolio Visuals + Cross-Device Ahas

**Repo:** `AnimeshPandey.github.io`  
**Canonical site:** https://anmshpndy.com  
**Stack:** Static HTML / CSS / vanilla JS · GitHub Pages · no build step  
**Related doc (read-only context):** `docs/cross-device-visuals-claude-prompt.md`

---

## Your role

You are a **principal frontend engineer + interaction designer + accessibility specialist**.

Your job is to **analyze the current codebase**, produce a short implementation plan, then **implement** a cohesive visual layer with:

- memorable, tasteful interactions (CSS/SVG, D3, limited Three.js),
- **device-specific delights** (mobile vs desktop),
- **zero regression** on cross-device support, core UX, SEO, or WCAG 2.1 AA.

Do not treat this as a demo reel. Every effect must earn its place.

---

## Phase 0 — Analyze before coding (required output)

Read and summarize:

| Area | Files to inspect |
|------|------------------|
| Homepage shell | `index.html` |
| Styles | `assets/theme.css`, `assets/site.css` |
| Behavior | `assets/theme.js`, `assets/nav.js` |
| Visual layer (may be unwired) | `assets/visuals.js`, `assets/visuals.d3.js`, `assets/visuals.three.js` |
| Articles / 404 | `fundamentals-of-functional-javascript/index.html`, `how-well-do-you-know-this/index.html`, `404.html` |
| PWA / perf | `sw.js`, `site.webmanifest` |

**Deliver in chat (before edits):**

1. **Current-state audit** — what visual/interaction code exists vs what is actually loaded on `index.html` (note: `visuals*.js` may exist but not be referenced in HTML).
2. **Gap list** — missing wiring, missing CSS for egg UI, broken lazy paths, CDN dependencies.
3. **Risk register** — perf, a11y, scroll jank, focus traps, SEO.
4. **Recommended scope for this PR** — Must-have / Should-have / Defer.
5. **Implementation plan** — ordered steps with file list and verification per step.

Ask at most **2** critical questions only if blocked; otherwise proceed with sensible defaults.

---

## Non-negotiable constraints

### Cross-device (no compromises)

- Works on 320px+ mobile, tablets, desktop, high-DPI.
- Touch, mouse, and keyboard must all work for every interactive feature.
- Low-end devices and `saveData` / slow networks get simplified or static modes.
- No horizontal overflow; touch targets ≥ 44×44px; form inputs ≥ 16px on mobile.

### Accessibility (WCAG 2.1 AA)

- `prefers-reduced-motion: reduce` → disable non-essential motion; keep content complete.
- Decorative layers: `aria-hidden="true"`, not focusable.
- Data visuals: plain-language text equivalent adjacent or in `figcaption`.
- Keyboard: `Enter`/`Space` on custom controls; `Escape` closes overlays; focus returns to trigger.
- No hover-only critical paths; no focus traps without exit.
- `aria-live="polite"` only for user-initiated state changes (not continuous animation).
- Meet contrast requirements in **light and dark** themes.

### Performance & SEO

- Lighthouse mobile targets: **Performance ≥ 90**, **SEO ≥ 95**, **Accessibility ≥ 95**.
- No CLS from visual containers (reserve min-height where needed).
- Lazy-init heavy modules via `IntersectionObserver` + dynamic script load.
- Do not break canonical URLs, JSON-LD, `sitemap.xml`, or meta/OG tags.
- Prefer **Canvas 2D** over Three.js for ambient hero motion unless Three.js is clearly better for a **short, optional** desktop easter egg only.

### Architecture

- Progressive enhancement: HTML + CSS work without JS.
- Modular files:
  - `assets/visuals.js` — orchestrator, capability gates, eggs
  - `assets/visuals.d3.js` — D3 modules (lazy)
  - `assets/visuals.three.js` — desktop egg only (lazy)
- Clean teardown: remove listeners, cancel `requestAnimationFrame`, dispose Three.js on close.
- Minimal comments; self-explanatory code.

---

## Target experience (implement this coherent package)

### Tier A — Wire & harden existing visual layer

If `assets/visuals.js` exists but is not loaded, **wire it** in `index.html` (defer, after `nav.js`).

Verify and polish:

1. **Hero canvas constellation** (2D particles, theme-aware, paused off-screen, reduced particle count on mobile).
2. **Mobile easter egg** — tap/keyboard on hero badge → career snapshot card (discoverable hint, auto-close, focus management).
3. **Desktop easter egg** — visible `[ press ? ]` + `?` key → lazy Three.js overlay (12s auto-close, Escape, focus return).
4. **D3 skills graph** — force-directed graph above `.skills-grid`; **keep existing skills list** as accessible fallback.

Add any missing CSS in `assets/site.css` for: `.egg-hint`, `.egg-card`, `.egg-key-hint`, skills graph container, reduced-motion overrides.

### Tier B — High-impact “ahas” (implement if Tier A is stable)

Pick **all that fit perf budget**; defer rest with explicit note in final report.

| # | Feature | All devices | Notes |
|---|---------|-------------|-------|
| B1 | **Scroll-synced experience timeline** | Yes | Highlight active employer block on scroll (IO); optional desktop focus ring on timeline nodes |
| B2 | **Project “impact lens”** | Yes | Tap (mobile) / focus (desktop) reveals mini SVG bar for metrics already in copy (50k+, 30%, etc.) |
| B3 | **Recruiter mode toggle** | Yes | Footer or hero control: `aria-pressed`, denser emphasis on contact + resume + skills table view (same content, layout shift minimal) |
| B4 | **Resume download feedback** | Yes | Reuse toast pattern on `resume.pdf` click |
| B5 | **Theme cross-fade** | Yes | Smooth token transition on theme toggle; instant if reduced-motion |
| B6 | **Keyboard shortcut `hire`** | Desktop + keyboard users | When not in input: scroll to `#contact`, focus first field; announce via polite live region |

### Tier C — Device-specific (required)

| Platform | Experience |
|----------|------------|
| **Mobile** | Badge snapshot egg (Tier A) + optional **horizontal snap** for project cards below 640px if it does not harm scroll UX |
| **Desktop** | `?` Three.js egg (Tier A) + extend existing hero spotlight/tilt in `nav.js` only if it does not conflict with canvas layer |

**Rule:** Mobile and desktop eggs must be **different** and **discoverable** (visible hint, not Konami-only).

### Explicitly defer (document why)

- Full-page Three.js hero
- Sound, vibration, `cursor: none`
- Autoplay video
- Konami-only secrets
- Visuals that hide text content

---

## Capability gating (implement in `visuals.js`)

```js
// Pseudocode — implement properly
caps = {
  reducedMotion: matchMedia('(prefers-reduced-motion: reduce)'),
  finePointer: matchMedia('(pointer: fine)'),
  coarsePointer: matchMedia('(pointer: coarse)'),
  saveData: navigator.connection?.saveData,
  slowNetwork: /2g|slow-2g/.test(connection?.effectiveType),
  lowEnd: hardwareConcurrency <= 2 || deviceMemory <= 2,
  canvas2d: feature detect,
  iob: 'IntersectionObserver' in window
}
```

| Condition | Behavior |
|-----------|----------|
| reducedMotion OR saveData OR lowEnd | Static SVG/CSS only; no rAF loops; no D3 force simulation |
| Mobile width | Fewer particles; no Three.js egg; simpler D3 (static layout or frozen graph) |
| Fine pointer + capable | Hero canvas + desktop egg + full D3 |
| JS fails | Page identical to pre-enhancement content |

---

## File change expectations

| File | Action |
|------|--------|
| `index.html` | Wire `visuals.js`; add semantic hooks for timeline/projects if needed (`data-timeline-item`, `data-impact`, etc.) |
| `assets/site.css` | Egg styles, graph container, timeline active states, project lens, recruiter mode, CLS-safe placeholders |
| `assets/visuals.js` | Orchestrator, gates, Tier B hooks |
| `assets/visuals.d3.js` | Skills graph + optional project sparklines |
| `assets/visuals.three.js` | Desktop egg only |
| `assets/nav.js` | Resolve conflicts with hero canvas (avoid duplicate heavy hero listeners if redundant) |
| Article pages / `404.html` | No heavy visuals; ensure shared chrome still works |
| `README.md` | Short “Visual layer” section if behavior changes |
| `sw.js` | Bump cache version if new assets added |

---

## Implementation order (commits)

Use **small, deployable commits**:

1. `portfolio: audit and wire visuals orchestrator`
2. `portfolio: add egg and skills graph styles with a11y fallbacks`
3. `portfolio: scroll-synced timeline and project impact lens`
4. `portfolio: recruiter mode and resume download feedback`
5. `portfolio: polish motion, theme transition, and sw cache bump`
6. `portfolio: validation notes and README visual layer`

Do not commit `.claude/` or unrelated docs unless user asks.

---

## Verification matrix (must run and report)

### Devices (Chrome DevTools or real devices)

- 320×568, 390×844, 412×915, 768×1024, 1280×800, 1440×900

### Scenarios

- [ ] Light / dark theme
- [ ] `prefers-reduced-motion: reduce`
- [ ] Keyboard-only navigation through nav, eggs, contact form
- [ ] Mobile: badge egg opens/closes; no scroll hijack
- [ ] Desktop: `?` egg loads, closes, focus returns
- [ ] Skills: graph + list both usable; graph not required to understand skills
- [ ] No horizontal scroll at 320px
- [ ] No-JS: all content readable (disable JS in DevTools)

### Accessibility

- [ ] VoiceOver or NVDA spot-check on eggs and recruiter toggle
- [ ] Focus visible on all interactive controls
- [ ] Contrast check on egg overlays and graph labels

### Performance

- [ ] Lighthouse mobile: Perf ≥ 90, A11y ≥ 95, SEO ≥ 95 (record scores)
- [ ] No obvious jank scrolling experience/projects on mid-tier mobile emulation

---

## Final deliverable format

When done, provide:

1. **Summary** — what shipped vs deferred  
2. **File map** — what each file does  
3. **How to test** — 5-minute manual QA script  
4. **Accessibility checklist** — pass/fail  
5. **Lighthouse before/after** (if you can run locally)  
6. **Known limitations** — honest list  

---

## Execution instruction

Start with **Phase 0 analysis** in your response.  
After I approve (or if no approval needed), **implement Tier A completely**, then Tier B items that pass perf/a11y gates, then Tier C.  
Challenge weak ideas; prefer Canvas 2D + D3 + CSS over Three.js except the short desktop egg.

Think deeply. Ship robust engineering over novelty.
