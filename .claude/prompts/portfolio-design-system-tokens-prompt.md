# Claude Prompt — Design System, Tokens & Reusable Components

**Repo:** `AnimeshPandey.github.io`  
**Canonical site:** https://anmshpndy.com  
**Stack:** Static HTML · CSS custom properties · vanilla JS · **no build step** (unless user explicitly approves a minimal bundler)

**Architecture:** `.claude/prompts/portfolio-architecture-prompt.md` — update when file layout changes

**Related:**

- `portfolio-premium-ux-sections-prompt.md` — chrome, spacing, resume UX (consumes this system)
- `portfolio-layout-responsive-themes-prompt.md` — breakpoints, multi-theme (merge token work here, don’t duplicate)
- `portfolio-i18n-localization-prompt.md` — strings move to locale JSON; components stay dumb

---

## Your role

You are a **staff frontend engineer + design systems lead** restructuring the portfolio so **one change updates everywhere**: color/spacing/type tokens, shared UI components, and JS constants. The site should feel maintained by a platform team, not a single 3k-line CSS file.

**North star:** A recruiter toggles accent color or button style in **one file** and sees header, hero CTAs, contact, and articles update consistently.

---

## Current state (audit first)

| Layer | Today | Problem |
|-------|--------|---------|
| Tokens | `assets/theme.css` — colors + some layout per `[data-theme]` | No spacing/type/elevation scale; hardcoded hex in `site.css` (`.hero-card`, shadows) |
| Components | Classes scattered in `site.css` (~1500+ lines) | `.btn`, `.nav-resume`, `.hc-dl`, `.cq-btn`, `.social-btn` overlap but diverge |
| Constants | `profile-facts.js`, inline HTML copy, duplicate `resume.pdf` paths | Resume URL in 8+ places; theme IDs in HTML + `theme.js` |
| SVG icons | Sprite in `index.html` | Articles duplicate mini-sprites |

Deliver **Phase 0 inventory table** before moving files.

---

## Target architecture (no framework)

```
assets/
├── styles/
│   ├── tokens/
│   │   ├── foundation.css      # spacing, radius, type scale, z-index, motion (theme-agnostic)
│   │   ├── themes/
│   │   │   ├── light.css       # or keep single theme.css with [data-theme] blocks
│   │   │   └── …               # light, dark, sage, slate, dusk, high-contrast
│   │   └── semantic.css        # --color-text-primary maps to --ink, etc.
│   ├── components/
│   │   ├── button.css
│   │   ├── card.css
│   │   ├── chip.css
│   │   ├── nav.css
│   │   ├── form.css
│   │   ├── modal.css           # resume preview, theme picker shell
│   │   └── section.css         # .section-label, h2 rhythm
│   ├── layouts/
│   │   ├── page.css            # .page-wrap, section grid
│   │   └── hero.css
│   └── site.css                # thin imports only @layer order
├── js/
│   ├── constants.js            # ROUTES, RESUME, THEMES, BREAKPOINTS, SELECTORS
│   ├── components/
│   │   ├── resume-actions.js   # single module: download + preview + toast
│   │   └── icon-sprite.js      # optional: inject shared sprite
│   └── …existing modules
```

**Constraint:** GitHub Pages must work with **plain `<link>` / `<script>`** — use `@import` in `site.css` or multiple link tags in HTML (prefer explicit link order in `index.html` for cache clarity).

**Service worker:** bump `sw.js` precache list when paths change.

---

## Phase 1 — Token library (`foundation.css` + themes)

### Spacing scale (example — tune to existing rhythm)

```css
:root {
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 24px;
  --space-6: 32px;
  --space-7: 48px;
  --space-8: 64px;
  --space-section-y: clamp(56px, 8vw, 96px); /* replaces ad-hoc 80/96/112 jumps */
}
```

### Typography scale

```css
:root {
  --text-xs: 0.6875rem;   /* 11px mono labels */
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: clamp(1rem, 2vw, 1.0625rem);
  --text-h2: clamp(1.75rem, 5vw, 3.25rem);
  --leading-tight: 1.15;
  --leading-body: 1.75;
}
```

### Elevation / border / focus (shared)

```css
:root {
  --shadow-sm: 0 2px 8px rgba(28,23,20,.06);
  --shadow-md: 0 8px 24px rgba(28,23,20,.10);
  --focus-ring: 2px solid var(--sage);
  --focus-offset: 2px;
}
```

### Semantic aliases (theme files only override primitives)

| Semantic | Maps to |
|----------|---------|
| `--color-bg` | `--bg` |
| `--color-surface-elevated` | `--surface` |
| `--color-text-muted` | `--ink-3` |
| `--color-interactive` | `--accent` |

Every **theme block** in `themes/*.css` sets primitives only; components use semantic tokens.

### Migration rules

1. Grep `site.css` for `#`, `rgba(`, `rgb(` outside tokens — replace with variables.
2. Per-theme: `--hero-card-bg`, `--header-bg`, `--hero-glow-*` already started — complete set.
3. Document tokens in a **comment index** at top of `foundation.css` (not a separate markdown file unless user asks).

---

## Phase 2 — Component library (CSS + HTML partials)

### Component contract

Each component file documents:

- **Variants:** `.btn--primary`, `.btn--ghost`, `.btn--sage`
- **Sizes:** default + `--sm` (nav) + `--lg` (hero)
- **States:** hover, focus-visible, active, disabled, `[aria-pressed="true"]`
- **Touch:** `min-height: 44px` on interactive targets

### Priority components (dedupe today’s duplicates)

| Component | Replaces | Single source |
|-----------|----------|---------------|
| **Button** | `.btn`, `.btn-dark`, `.btn-outline`, `.nav-resume`, `.hc-dl`, `.cq-btn`, `.form-btn`, `.rm-foot-btn` | `components/button.css` |
| **Chip / pill** | `.htk`, `.tag`, `.sv-chip`, `.hero-fact`, `.wi-badge` | `components/chip.css` (shared base + modifiers) |
| **Card** | `.pc`, `.sv-card`, `.hero-card`, `.article-item` | shared `.ui-card` base + section modifiers |
| **Section header** | `.section-label`, `h2` margins | `components/section.css` |
| **Icon button** | `.theme-pick-btn`, `.hamburger`, `.header-rm-toggle`, `.back-top` | `components/icon-btn.css` |
| **Link row** | `.social-btn`, `.writing-profiles` | optional `components/link-chip.css` |

### HTML partial strategy (static site)

Without a bundler, choose **one**:

**A (recommended):** Documented copy-paste snippets in `docs/components.html` (dev-only, not deployed) + agent updates all call sites.

**B:** `fetch('/partials/button.html')` + `innerHTML` — only if SW/cache OK; adds JS complexity.

**C:** Build step (Eleventy) — **out of scope** unless user requests.

For **resume**, never duplicate markup — see `resume-actions.js` below.

---

## Phase 3 — `constants.js` (single source of truth)

```javascript
// assets/constants.js — no DOM side effects
export const SITE = {
  name: 'Animesh Pandey',
  domain: 'https://anmshpndy.com',
  email: 'animeshpandey1909@gmail.com',
};

export const RESUME = {
  path: '/resume.pdf',
  filename: 'Animesh_Pandey_Resume.pdf', // download attribute
};

export const THEMES = ['light', 'dark', 'sage', 'slate', 'dusk', 'high-contrast'];

export const NAV_SECTIONS = ['about', 'experience', 'skills', 'projects', 'writing', 'contact'];

export const SELECTORS = {
  header: 'header',
  themeMenu: '#theme-menu',
  rmToggle: '#header-rm-toggle',
};
```

**If staying non-module:** attach `window.AP_CONSTANTS = { … }` and read from `theme.js`, `nav.js`, `recruiter.js`, `visuals.js`.

**Align with** `profile-facts.js` — recruiter meta imports resume path from constants or profile-facts only (pick one owner: `profile-facts.js` for person data, `constants.js` for site wiring).

---

## Phase 4 — Refactor `site.css`

1. Move blocks into component/layout files.
2. Leave `site.css` as ordered imports:

```css
@import url('./styles/tokens/foundation.css');
@import url('./styles/tokens/semantic.css');
@import url('./styles/tokens/themes.css'); /* or split files */
@import url('./styles/components/button.css');
/* … */
@import url('./styles/layouts/hero.css');
/* page-specific overrides last */
```

3. Remove dead rules (grep unused classes after HTML pass).
4. Use `@layer reset, tokens, components, utilities, overrides;` if cascade conflicts appear.

---

## Phase 5 — Icons & articles

- Extract **one** `partials/icons.svg` or keep homepage sprite; articles `<link>` or inject once via `nav.js`.
- Article pages load **subset** of components (button, prose, header) — not full `site.css` if size matters (optional split `article.css` importing subset).

---

## Files to touch

| File | Action |
|------|--------|
| `assets/theme.css` | Split → `assets/styles/tokens/*` |
| `assets/site.css` | Shrink to imports + rare overrides |
| `assets/constants.js` | **New** |
| `index.html`, articles | Class renames; single resume component mount points |
| `assets/theme.js` | Import `THEMES` from constants |
| `assets/visuals.js` | Resume toast uses `RESUME.path` |
| `sw.js` | Precache new CSS paths |
| `portfolio-architecture-prompt.md` | New tree |

---

## Acceptance criteria

- [ ] Grep: no duplicate hex for colors defined in theme tokens (except fallbacks in `foundation.css`)
- [ ] Resume path defined **once** in JS constants + one HTML `data-resume` hook if needed
- [ ] All button-like controls share one base class + modifiers
- [ ] Spacing between sections uses `--space-section-y` (or equivalent), not four different media-query literals
- [ ] Six themes still work; FOUC script reads theme list from constants
- [ ] Lighthouse/CSS size: no regression > ~5% transfer size without justification
- [ ] Visual parity at 320 / 820 / 1280 unless UX prompt intentionally changes layout

---

## Anti-patterns

- Tailwind/npm migration without explicit approval
- CSS-in-JS
- Duplicating `profile-facts.js` content into constants (link, don’t copy)
- Per-section one-off button styles “just for this card”
- New markdown design doc in `docs/` unless user asks (update architecture prompt only)

---

## Execution order

1. Phase 0 inventory (grep hex, list resume links, count button classes).
2. Phase 1 foundation + semantic tokens.
3. Phase 3 constants.js.
4. Phase 2 button + chip + section (highest duplication).
5. Phase 4 migrate remaining `site.css`.
6. Phase 5 articles + SW.
7. Hand off to `portfolio-premium-ux-sections-prompt.md` for chrome/resume preview using new modal component.
