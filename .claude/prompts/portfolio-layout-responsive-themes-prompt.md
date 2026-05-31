# Claude Prompt — Responsive Layout, Spacing & Multi-Theme System

**Repo:** `AnimeshPandey.github.io`  
**Canonical site:** https://anmshpndy.com  
**Stack:** Static HTML · `assets/theme.css` · `assets/site.css` · `assets/theme.js` · **no build step**

**Architecture:** `.claude/prompts/portfolio-architecture-prompt.md` (update that file if you change breakpoints, theme IDs, or header controls)

**Related (do not mix scope):**

- `portfolio-writing-polish-prompt.md` — `#writing` / articles only
- `portfolio-recruiter-data-premium-prompt.md` — recruiter + contact only

---

## Your role

You are a **staff frontend engineer + layout specialist** auditing and fixing **alignment, spacing, grid behavior, and layout shift** across **all breakpoints**, and extending the site from a **binary light/dark toggle** to a **curated multi-theme palette** that stays premium and accessible.

**North star:** Every section reads as one intentional grid — no clipped hero type, no orphaned scroll cues, no “floating” right card on ultra-wide viewports, no theme-specific broken contrast (hero card, recruiter, canvas, eggs).

---

## Surfaces in scope

| Surface | Files | Notes |
|---------|-------|-------|
| Global layout tokens | `assets/theme.css` | `--max`, `--page-pad`, `--nav-h`, breakpoints |
| Page layout & grids | `assets/site.css` | Hero, sections, about/contact grids, nav, footer |
| Theme runtime | `assets/theme.js` + inline FOUC script in `index.html` + article `*/index.html` heads | Today: only `light` / `dark` |
| Header chrome | `index.html`, article pages | `#theme-toggle` → theme **picker** |
| Hero visuals | `assets/visuals.js`, `#hero-canvas` | Glow colors may need per-theme tuning |
| Recruiter / eggs | `assets/site.css` recruiter rules, `eggs-*.js` | Contrast after new themes |
| SW cache | `assets/sw.js` | Bump precache version if `theme.css` / `theme.js` change |

**Out of scope unless a layout bug is visible there:** writing copy pipeline (`portfolio-writing-polish-prompt.md`), recruiter data content (`portfolio-recruiter-data-premium-prompt.md`).

---

## Known issues (evidence — fix in implementation)

| Issue | Where | Likely cause | Fix direction |
|-------|-------|--------------|---------------|
| **Hero name clipped** (top of “Animesh Pandey” cut off) | `#hero` `.hero-name` | `line-height: .97` + `overflow: hidden` on `#hero` + tight `padding-top: calc(var(--nav-h) + 40px)` + `translateY` entrance animation | Increase top padding using `clamp()`; set `line-height` ≥ 1.05; avoid clipping ascenders (`overflow: visible` on text column or remove hero-level `overflow: hidden`); verify with `100svh` grid at ≥820px |
| **Dead horizontal gap** (hero left vs info card) | `@media (min-width: 820px)` `#hero` grid | `gap: 48px` → `64px` → `80px` while `--max` caps content | Cap `gap` with `min(gap, 5vw)` or use `justify-content: space-between` with `max-width` on grid; optional `1320px` breakpoint to stop gap growth |
| **Scroll cue misaligned** | `.scroll-cue` `left: var(--page-pad)` | Hero is `max-width: var(--max); margin: 0 auto` but cue is positioned inside hero, not page grid | Align cue to same horizontal rhythm as `.nav-inner` / section content (shared wrapper or `left: 0` within centered column) |
| **Hero card not theme-aware** | `.hero-card { background: #1c1714; … }` | Hardcoded dark card | Drive from tokens: `--hero-card-bg`, `--hero-card-ink`, etc., per theme; keep “inset dark panel” feel in light themes via contrast, not fixed hex |
| **Section padding ladder jumps** | `section` vs `#hero` | Hero uses own padding; sections jump 56→80→96→112px | Document spacing scale; align hero bottom padding with first section; reduce 112px if vertical rhythm feels empty |
| **Nav vs content width drift** | `.nav-inner` and `#hero` both use `--max` but hero is flex/grid inside capped box | OK at 1024+ when `--max` changes — verify logo and H1 share same left edge at 320, 768, 1024, 1280, 1536 |
| **CTA / tag inconsistency** | `.ctas`, `.htk`, `.hero-facts` | Mixed full-width mobile, partial borders on ticker pills | Harmonize: one border token, one pill height, shared `min-height: 44px` on touch targets |
| **Inline layout hack** | `index.html` `style="margin-bottom:20px"` on about FAQ label | Breaks spacing system | Move to `site.css` utility or `.about-cols` child spacing |
| **Binary theme only** | `theme.js`, `theme.css`, FOUC IIFE | Toggle flips `dark` ↔ `light` | Multi-theme registry + picker UI + `localStorage.theme` + `meta theme-color` from `--theme-color-val` |
| **FOUC script ignores new themes** | `index.html` head: `if(t!=='light')` → dark | New IDs like `sage` would flash wrong | FOUC: apply stored theme id if in allowlist; else respect `prefers-color-scheme` or default `dark` |
| **Canvas / glow wrong on non-warm themes** | `#hero::after`, `visuals.js` | Hardcoded `rgba(191,90,50,…)` / `rgba(78,122,104,…)` | Optional CSS variables `--hero-glow-a`, `--hero-glow-b` per theme |

---

## Breakpoint QA matrix (mandatory before claiming done)

Test **real devices or DevTools** at these widths (height ~700–900 unless noted). Capture **screenshot + one-line note** per failing cell.

| Width | Label | Must verify |
|-------|-------|-------------|
| 320 | small phone | No horizontal scroll; hero name wraps; facts strip scrolls; hamburger; CTAs stack; touch targets ≥44px |
| 375 | iPhone | Same + safe-area insets (`env(safe-area-inset-*)`) on header/footer |
| 480 | large phone | `.ctas` row wrap; contact quick row |
| 640 | phablet | Stats 4-col; projects 2-col; section padding |
| 768 | tablet | Pre-desktop nav still hamburger until 820 |
| 820 | desktop threshold | Hero **2-col grid** appears; `.hero-facts` hidden; card visible; scroll cue visible |
| 1024 | large desktop | `--max: 1100px`; about 2-col; contact 2-col; skills 3-col |
| 1280 | wide | `--max: 1200px`; hero gap 80px — **no excessive void** between columns |
| 1536+ | ultra-wide | Content centered; no stretched typography; ticker full width of hero grid only |

**Layout shift (CLS):** Reserve space for animated stats (`.stat-n` already has `min-width`); ensure hero entrance animations do not leave permanent offset; avoid font swap layout jump (fonts already preconnected).

**Anchor scroll:** `section[id] { scroll-margin-top: calc(var(--nav-h) + 16px); }` — re-test after nav height or strip changes.

---

## Phase 0 — Audit deliverable (before coding)

Output a markdown table:

| Viewport | Section | Issue | Severity (P0–P2) | File:line hint |
|----------|---------|-------|------------------|----------------|
| … | hero | name clipped | P0 | `site.css` `#hero`, `.hero-name` |

Include **computed spacing** notes: hero `padding-top`, `gap`, `min-height: 100svh` yes/no, and whether first section (`#about`) feels double-spaced after hero.

---

## Phase 1 — Layout & spacing fixes

### 1.1 Hero system

- Fix clipping and vertical rhythm (see table above).
- Revisit `min-height: 100svh` at ≥820px: if it forces empty space below CTAs/ticker, use `min-height: min(100svh, 900px)` or `auto` with sufficient padding.
- Grid template: current `1fr 270px` → `340px` → `390px` — ensure **left column** has `min-width: 0` for grid overflow safety.
- `.hero-ticker`: `grid-column: 1 / -1` — confirm margin-top consistent across breakpoints; pause animation under `prefers-reduced-motion` (already partially done — verify).

### 1.2 Page grid consistency

Introduce optional **layout primitive** (CSS only, no framework):

```css
/* Example — align header, hero, sections */
.page-wrap {
  width: 100%;
  max-width: var(--max);
  margin-inline: auto;
  padding-inline: var(--page-pad);
}
```

Use only if it reduces duplication; otherwise align existing selectors so **logo, h1, section labels, and scroll cue** share one left edge.

### 1.3 Section grids (regression pass)

| Block | Breakpoint rules | Check |
|-------|------------------|-------|
| `#about` `.about-cols` | 2-col ≥1024 | Gap 56→64px; FAQ column not narrower than 320px effective |
| `.stats` | 2×2 mobile, 4-col ≥640 | Borders consistent in dark + new themes |
| `.projects-grid` | 1 → 2 → 3 col | `.pc.wide` span correct at 1280 |
| `.sv-grid` | 1 → 2 → 3 col | Card min heights even |
| `#contact` | 2-col ≥1024 | Labels + h2 span full width; form column not squashed at 1024 |
| Recruiter panel | all | No horizontal overflow; header icon group doesn’t wrap badly at 320 |

### 1.4 Remove layout hacks

- Replace inline `style=""` margin hacks in `index.html` with classes.
- Prefer spacing tokens: e.g. `--space-section`, `--space-block` in `theme.css` (optional, 4–6 step scale).

### 1.5 Articles (layout only)

- `fundamentals-of-functional-javascript/index.html`, `how-well-do-you-know-this/index.html`: article body `max-width`, header stack, nav padding — match homepage rhythm; theme picker must work here too.

---

## Phase 2 — Multi-theme system

### 2.1 Design rules

- **Minimum 5 themes**, including existing **light** and **dark** (keep IDs for backward compatibility).
- Additional curated palettes (implement all, adjust hex during QA):

| ID | Name (UI label) | Character |
|----|-----------------|------------|
| `light` | Warm paper | Current default `:root` |
| `dark` | Charcoal | Current `[data-theme="dark"]` |
| `sage` | Sage mist | Light base, deeper green accent, cooler neutrals |
| `slate` | Slate studio | Cool gray-blue dark, cyan-teal accent |
| `dusk` | Dusk editorial | Deep plum-brown bg, gold accent (still readable) |
| `high-contrast` | High contrast | WCAG-first: near #000/#fff, thick borders, optional `prefers-contrast: more` alignment |

Each theme MUST define the full token set used in `theme.css`:

`--bg`, `--surface`, `--surface-2`, `--ink`, `--ink-2`, `--ink-3`, `--accent`, `--accent-bg`, `--accent-dim`, `--sage`, `--sage-bg`, `--border`, `--border-2`, `--theme-color-val`, plus **hero card** tokens if split out.

Use `[data-theme="sage"]` blocks in `theme.css` — do not rely only on `:root` + class toggles without updating FOUC.

### 2.2 Theme picker UI

Replace binary `#theme-toggle` (sun/moon only) with:

- **Primary control:** button opens **popover** or **dropdown** listing themes (icon + short label).
- **Keyboard:** Escape closes; arrow keys navigate options; `aria-expanded`, `role="listbox"` / `role="option"`.
- **Persistence:** `localStorage.setItem('theme', id)`; validate against allowlist on load.
- **Mobile:** picker fits in `.nav-right` without wrapping; if crowded, move picker into mobile nav footer.
- **Reduced motion:** no flashy transitions on theme change (instant token swap OK).

Keep a **quick toggle** optional: cycle favorites or light↔last-dark — only if it doesn’t confuse the picker.

### 2.3 `theme.js` refactor

```javascript
var THEMES = ['light','dark','sage','slate','dusk','high-contrast'];
function applyTheme(id) {
  if (THEMES.indexOf(id) === -1) id = 'dark';
  document.documentElement.dataset.theme = id;
  localStorage.setItem('theme', id);
  // meta theme-color from getComputedStyle(...).getPropertyValue('--theme-color-val')
  // update picker UI aria-selected / checkmarks
}
```

- Remove hardcoded `#141210` / `#FAF8F4` pairs — read `--theme-color-val`.
- Update **inline FOUC** in every HTML head that has it (homepage + both articles) to mirror allowlist.

### 2.4 Hardcoded colors audit

Grep and replace in `site.css` / `visuals.js`:

- `.hero-card` backgrounds and text rgba
- `[data-theme="dark"]` one-offs → generalize to `[data-theme="dark"]` or attribute selectors for dark-family themes
- Header `rgba(20,18,16,.92)` → `color-mix(in srgb, var(--bg) 92%, transparent)` or token `--header-bg`

### 2.5 Subsystems per theme

| Subsystem | Requirement |
|-----------|-------------|
| Hero canvas (`visuals.js`) | Readable nodes/edges on all backgrounds |
| Recruiter mode | Sage highlights, toggles, timeline still legible |
| Eggs toasts | Text contrast on `--surface` |
| OG / manifest | Unchanged; theme is client-only |
| `prefers-color-scheme` | Only when **no** stored theme; document behavior in architecture prompt |

### 2.6 `site.webmanifest` / PWA

`theme_color` in manifest is static — OK. Runtime `meta name="theme-color"` must update on `applyTheme`.

---

## Phase 3 — Verification

### Automated / local

```bash
# From repo root — no build; optional lint if added later
# Manual: open file:// or npx serve and test breakpoints
```

### Accessibility

- Each theme: body text **≥ 4.5:1**, large text **≥ 3:1** (spot-check with DevTools contrast)
- `high-contrast` theme: focus rings visible on nav links, buttons, form fields
- `forced-colors` rules in `site.css` still pass smoke test

### Regression checklist

- [ ] Hero name fully visible at 820×700 and 1280×800
- [ ] No horizontal overflow 320–1536
- [ ] Nav active section scroll targets correct (scroll-margin)
- [ ] Theme persists reload + article routes
- [ ] FOUC: no flash of wrong theme
- [ ] Recruiter + eggs readable in every theme
- [ ] `sw.js` cache version bumped if assets changed
- [ ] Update `.claude/prompts/portfolio-architecture-prompt.md` § Theme / Breakpoints if IDs or files change

---

## File touch list (expected)

| File | Changes |
|------|---------|
| `assets/theme.css` | New `[data-theme="…"]` blocks; optional spacing tokens; hero card tokens |
| `assets/site.css` | Hero, grids, scroll-cue, header bg, theme picker styles, hardcoded color removal |
| `assets/theme.js` | Theme registry, picker wiring, meta theme-color |
| `index.html` | FOUC script; theme picker markup; remove inline styles |
| `fundamentals-of-functional-javascript/index.html` | FOUC + picker |
| `how-well-do-you-know-this/index.html` | FOUC + picker |
| `assets/visuals.js` | Optional theme-aware glow |
| `assets/sw.js` | Cache bump |
| `.claude/prompts/portfolio-architecture-prompt.md` | Theme IDs, picker, breakpoint notes |

---

## Acceptance criteria (definition of done)

1. **P0 layout issues resolved** at all widths in the QA matrix (document any deferred P2 with reason).
2. **Single consistent content column** — nav logo, section labels, and hero H1 align within ≤2px subjective tolerance at 1024+.
3. **≥6 themes** available via picker, persisted, accessible, no contrast failures on primary text.
4. **Hero card and header** use tokens on every theme (no orphaned `#1c1714` unless token equals it in dark family).
5. **No new build step**; static hosting compatible.
6. Architecture prompt updated if structure changed.

---

## Agent discipline

- **Implement**, don’t only document — this prompt is the spec for a coding pass.
- **Minimize scope** — no writing copy changes, no recruiter content edits.
- **Match existing conventions** — BEM-ish class names, mobile-first `@media (min-width: …)`, token names in `theme.css`.
- **One commit worth of coherence** — layout + themes ship together only if both are stable; otherwise land layout P0 first, then themes in follow-up (note in PR).

---

## Reference: current breakpoint anchors (from `theme.css` / `site.css`)

```
--bp-sm: 480px   → ctas row, sv-grid 2-col
--bp-md: 640px   → section padding 80px, projects 2-col, stats 4-col
--bp-lg: 820px   → nav links, hero grid, hero card visible
--bp-xl: 1024px  → --max 1100px, about/contact 2-col, skills 3-col
1280px           → --max 1200px, hero gap 80px, projects 3-col
```

Hero selector reference:

```css
#hero {
  max-width: var(--max);
  padding-top: calc(var(--nav-h) + 40px);
  overflow: hidden; /* revisit — clipping risk */
}
@media (min-width: 820px) {
  #hero {
    display: grid;
    grid-template-columns: 1fr 270px;
    gap: 48px;
    min-height: 100svh;
  }
}
```

---

*Generated for cross-breakpoint layout polish and multi-theme expansion. Pair with live screenshots in `assets/` or design review when available.*
