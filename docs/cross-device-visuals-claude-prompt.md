# Claude Prompt — Cross-Device Visuals (D3/Three.js)

You are a principal frontend engineer + creative interaction designer.  
You are working in my portfolio repo: `AnimeshPandey.github.io` (static HTML/CSS/JS, GitHub Pages).  
Your goal: design and implement **high-quality interactive visuals** (D3 and/or Three.js where justified) with **zero compromise on cross-device support, accessibility, or baseline functionality**.

## Non-negotiable constraints

1. **Cross-device support is mandatory**
   - Must work on: mobile (320px+), tablets, desktop, high-DPI screens.
   - Must support touch, mouse, keyboard.
   - Must not break on low-end devices.
   - Must degrade gracefully if JS is slow/disabled.
2. **Performance cannot regress**
   - Lighthouse mobile targets: Performance >= 90, SEO >= 95, Accessibility >= 95.
   - No layout shift from visual modules (CLS-safe placeholders).
   - Lazy-load heavy visuals (intersection-based).
3. **Accessibility is first-class**
   - Respect `prefers-reduced-motion`.
   - Keyboard navigable interactions.
   - Decorative visuals `aria-hidden`.
   - Informational visuals have text equivalents.
   - Meet WCAG 2.1 AA for color contrast, focus visibility, semantics, and operability.
   - Do not use hover-only interactions without keyboard/touch equivalents.
4. **No baseline UX degradation**
   - All existing navigation, forms, and theme behavior must continue to work.
   - Visuals are enhancements, never dependencies for core content.
5. **Repo discipline**
   - Keep architecture clean and maintainable.
   - Do not introduce unnecessary dependencies.
   - If Three.js is used, justify it with measurable value over CSS/SVG/D3.
   - Preserve existing SEO structure (meta, JSON-LD, canonical, sitemap behavior).

---

## What I want you to produce first (before coding)

1. A deep **design+engineering proposal** with:
   - Visual concept(s)
   - Library choice matrix: CSS/SVG vs D3 vs Three.js
   - Why each visual belongs where
   - Risk assessment
2. A **capability-gating strategy**
   - Device class detection (without fragile UA sniffing)
   - Motion/data/power constraints
   - Fallback paths
3. A **cross-device easter egg strategy**
   - One mobile-only interactive visual micro-experience
   - One desktop-only interactive visual micro-experience
   - Both optional and non-blocking
4. A **phased implementation plan**
   - File-by-file changes
   - Test plan and acceptance checklist
   - Rollback strategy if perf regresses

If any ambiguity exists, ask only critical questions (max 2 at a time), otherwise proceed.

---

## Product direction for visuals

Design intent:
- Feels premium, subtle, memorable.
- Aligns with personal-brand tone (engineering craft + performance + product empathy).
- Avoid gimmicks; every effect should feel intentional.

Candidate zones:
- Hero background/ambient layer
- Experience section timeline enhancement
- Projects impact mini-visuals
- Skills constellation/graph motif

---

## Easter eggs requirement (important)

Create thoughtful, tasteful easter eggs that are discoverable but not distracting.

### Mobile-only easter egg (touch-first)
- Example direction: long-press or multi-tap interaction in hero/stat chip reveals a compact “insight card” animation or hidden metric story.
- Must be discoverable but subtle.
- Must not hijack scroll or cause accidental triggers.
- Must have timeout/reset behavior.

### Desktop-only easter egg (pointer/keyboard-first)
- Example direction: cursor-reactive ambient field, or keyboard sequence revealing a temporary visualization overlay.
- Must work with keyboard alternative (not mouse-only).
- Must not interfere with content interactions.

Both easter eggs must:
- be disabled under reduced-motion unless static alternative exists,
- never block core controls,
- fail safely if scripts fail,
- include clear cleanup logic.

---

## Technical quality bar

- Use progressive enhancement:
  - Base markup + CSS first
  - JS enhancements layered
  - D3/Three lazy loaded only when needed
- Keep code modular:
  - `assets/visuals.js` orchestrator
  - Optional `assets/visuals.d3.js`
  - Optional `assets/visuals.three.js` only if justified
- Add concise comments only where logic is non-obvious.
- Avoid global side effects; namespace listeners and cleanup.

---

## Validation requirements

You must validate:
1. Device matrix:
   - 320x568, 390x844, 412x915, 768x1024, 1280x800, 1440p desktop
2. Interaction matrix:
   - touch, mouse, keyboard
3. Preference matrix:
   - light/dark theme
   - reduced motion
4. Reliability:
   - no-JS fallback still complete
   - slow CPU/network still usable
5. Perf checks:
   - no major increase in JS blocking time
   - no CLS regressions

6. Accessibility checks:
   - Keyboard-only flow for all interactive visual features and easter eggs
   - Screen reader sanity check (VoiceOver/NVDA): meaningful labels, no noisy decorative announcements
   - Focus management and visible focus ring in light/dark themes
   - Color contrast for all text/interactive states meets WCAG 2.1 AA
   - `prefers-reduced-motion` and `prefers-contrast` (where available) produce safe, usable UI

Provide a short report with:
- Before/after metrics
- What was implemented
- What was intentionally deferred and why
- Accessibility results (pass/fail checklist + any residual risks)

---

## Accessibility implementation rules (must follow)

- Use semantic HTML first; avoid non-semantic interactive wrappers.
- For custom interactive visuals:
  - Provide keyboard handlers (`Enter`/`Space` where applicable),
  - Provide ARIA role/state only when native semantics are insufficient,
  - Announce state changes via polite `aria-live` only when user-triggered.
- Mark decorative SVG/canvas/threejs layers as `aria-hidden="true"` and `focusable="false"`.
- Any data visualization must include nearby textual summary (short plain-language equivalent).
- Respect user preferences:
  - `prefers-reduced-motion: reduce` => disable non-essential animation and parallax
  - high-contrast modes => ensure outlines/borders remain visible
- Never trap focus in easter eggs or overlays without Escape/close and focus return.
- Avoid timing-dependent interactions as the only path (no required long-press or hidden gestures for core functionality).

---

## Execution style

Think deeply and challenge assumptions:
- If Three.js is not worth the tradeoff, say so and use D3/CSS/SVG.
- If a visual is cool but harms UX/perf, reject it and propose better alternatives.
- Prioritize robust engineering over novelty.

Now start by giving:
1) a concise architecture proposal,  
2) visual concept shortlist (3 options),  
3) your recommended path with rationale,  
4) phased implementation steps.
