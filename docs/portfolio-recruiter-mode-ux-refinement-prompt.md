# Claude Prompt — Recruiter Mode UX Refinement (Placement, Chrome, Usability)

**Repo:** `AnimeshPandey.github.io`  
**Canonical site:** https://anmshpndy.com  
**Stack:** Static HTML · vanilla JS · no build step

**Related:** `docs/portfolio-recruiter-mode-prompt.md` (original briefing spec), `docs/portfolio-architecture-prompt.md`

---

## Your role

You are a **senior product designer + frontend engineer** doing a **usability pass** on Recruiter Mode after v1 shipped. Do not rebuild from scratch — **refine** placement, chrome, and page behaviour so the flow is obvious, non-duplicative, and usable on **all devices**.

**Primary outcome:** A recruiter can open the briefing from a **prominent** entry point, read the brief, take action once (not three times), and browse the full page without broken or “disabled” sections.

---

## Reported problems (must fix)

### P1 — Briefing entry is not prominent enough

**Today:** Toggle lives in **hero** (`#rm-hero-toggle`) and **footer** (`#recruiter-toggle`). User must scroll to discover it. The briefing panel is powerful but the **invitation** is buried.

**Required:**

- Add a **primary, always-visible** entry in the **main header** (desktop nav area or adjacent to Resume).
- Label: **“Recruiter briefing”** (not vague “recruiter view”).
- Visual: sage accent + subtle pulse/dot when mode is off; “active” state when on.
- On **mobile:** entry in hamburger menu **and** one persistent affordance (see P3 — do not rely only on hero).

**Acceptance:** From any scroll position, user can start briefing within **one tap** without hunting in hero/footer.

---

### P2 — Section “disabling” is wrong

**Today** (`assets/site.css` ~1133–1135):

```css
.recruiter-mode #writing { opacity: .28; pointer-events: none; }
.recruiter-mode .faq-section { opacity: .28; pointer-events: none; }
```

Also: `.recruiter-mode .tags { opacity: .35; }` on project tag clouds.

**Why this fails:**

- Looks broken / punitive — recruiters may want writing samples or FAQ answers.
- `pointer-events: none` blocks links and feels like a bug.
- Conflicts with “premium AI brief” — AI should **prioritize**, not **lock**.

**Required — remove all `pointer-events: none` and heavy dimming on content sections.**

**Replace with positive prioritization only:**

| Instead of | Use |
|------------|-----|
| Dim + block `#writing`, `.faq-section` | Optional **“Also explore”** links inside briefing panel; no page mutation |
| Dim `.tags` | Leave tags normal, or slightly muted **without** blocking interaction |
| Heavy contact outline only | Subtle **scroll-margin** + in-panel “Jump to contact” |

**Keep (if subtle):**

- `body.recruiter-mode` left-border on `#experience`, `#projects`, `#skills` (`recruiter.css`) — marks priority, does not block.
- Optional: single **non-blocking** banner under header: *“Briefing mode — full page still available below.”*

**Acceptance:** Every section remains fully readable, clickable, and scrollable in recruiter mode.

---

### P3 — Duplicate top chrome (strip vs header)

**Today:** When recruiter mode is on:

1. **Fixed header** (`<header>`): logo, nav, theme, **Resume**, hamburger  
2. **Fixed strip** (`#rm-strip`, `z-index: 220`, `top: 0`): typewriter fields + **briefing ↗** + **contact** + **resume ↓** + close  

Header is pushed down via `top: var(--strip-h)` — user sees **two bars** with overlapping CTAs (Resume ×2, contact in strip vs nav “contact” anchor).

**Required — single chrome strategy (pick one and implement fully):**

#### Recommended: **Merged recruiter chrome** (replace strip)

| State | Chrome |
|-------|--------|
| **Mode off** | Normal header only |
| **Mode on, panel closed** | Header transforms: compact **recruiter status** (name · role · ● open) + **Open briefing** + **Exit mode** — **no** duplicate Resume/Email in strip |
| **Mode on, panel open** | Header stays minimal; panel has footer CTAs (Resume, Email, Copy brief) |
| **Resume** | Only in: (1) header when mode **off**, (2) panel footer when panel **open** — never both strip + header |

**Remove `#rm-strip` entirely** after merge, or repurpose as a **one-line status** inside header (not a second bar).

**Implementation notes:**

- Delete or gut `.rm-strip` markup in `index.html` if merged into header.
- Update `openStrip` / `closeStrip` in `assets/visuals.js` — logic moves to header state class e.g. `header.recruiter-active`.
- Fix layout: `header { top: 0 }` always; remove `--strip-h` offset **or** set `--strip-h: 0` when strip removed.
- Update `section[id] { scroll-margin-top }` and hero `padding-top` after strip removal.

**Alternative (if merge is too large):** Keep strip but strip **all CTAs** except `Open briefing` + `Exit` — Resume/Contact only in header + panel footer.

**Acceptance:** At most **one** fixed top bar visible; Resume appears at most **once** in the viewport at any time.

---

## Additional UX issues to audit and fix

Run this checklist on **320, 390, 768, 1024, 1280+** widths. Fix anything that fails.

### Flow & state machine

| Issue | Current risk | Fix |
|-------|--------------|-----|
| Toggle on opens **both** strip + panel | Overwhelming on first click | **First click:** open panel (or header “Open briefing”). **Mode** vs **panel open** are separate states if needed |
| Minimize button (`#rm-panel-minimize`) | Unclear vs close | Minimize = close panel, **keep** `recruiter-mode` on page; update header to “Briefing ready — Open” |
| Close panel vs exit mode | Users confuse ✕ on panel vs strip | Panel ✕ = minimize. **Exit recruiter mode** = one labeled control in header |
| `?recruiter=1` deep link | Auto-opens panel + strip | Keep; ensure merged chrome still works |
| `localStorage.recruiter` | Persists strip on reload | On reload with mode on: show header status + **do not** auto-open panel unless `?recruiter=1` |

### Panel (drawer / bottom sheet)

| Issue | Fix |
|-------|-----|
| Panel covers header CTAs on mobile | Sheet should sit **below** header or header z-index stays above sheet handle |
| Double scroll (body + panel) | `body.rm-panel-open { overflow: hidden }` only while panel open — verify iOS |
| Focus trap + scroll inside panel | Tab cycles panel only; panel body scrolls independently |
| Section jump from panel | Close/minimize panel → scroll → `.recruiter-flash` — ensure target not hidden under fixed header |
| Copy brief toast | Reuse `#copyToast` or `.rm-toast` — one toast system |

### Hero & toggles

| Issue | Fix |
|-------|-----|
| Hero `#rm-hero-toggle` redundant after header entry | Demote to **secondary** text link (“Open briefing”) or remove if header entry exists |
| Footer `#recruiter-toggle` | Keep as secondary **or** remove if header + mobile menu suffice |
| Hero CTAs (Resume, Let's talk) duplicate panel | In recruiter mode, optional subtle hint: “Also in briefing ↑” — do not hide hero CTAs |

### Visual / motion

| Issue | Fix |
|-------|-----|
| Strip typewriter re-runs on every mode toggle | If strip removed, N/A; if status in header, use static text |
| `prefers-reduced-motion` | Panel content instant; no scan animation |
| Dark theme contrast on sage strip/header | Test WCAG on new chrome |

### Mobile nav

| Issue | Fix |
|-------|-----|
| No briefing in mobile menu | Add item: **Recruiter briefing** with `aria-pressed` sync |
| Opening briefing with menu open | Close mobile nav first, then open panel |

### z-index stack (document after changes)

Proposed order (bottom → top):

```text
page content → header (100) → mobile nav (210) → panel backdrop (200) → panel sheet (201) → toast (9999)
```

Resolve any inversion where strip (220) sat above header incorrectly.

---

## Recommended information architecture

```text
┌─────────────────────────────────────────────────────────────┐
│ HEADER: Logo · Nav · [Recruiter briefing ★] · Theme · Resume│  ← single bar
└─────────────────────────────────────────────────────────────┘
┌──────────────────────────┐  (when panel open, desktop)
│ BRIEFING PANEL           │
│  scan → summary → cards  │
│  [Resume] [Email] [Copy] │
└──────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│ FULL PAGE — all sections active, priority markers optional   │
└─────────────────────────────────────────────────────────────┘
```

**Prominent placement options (implement #1 + #2):**

1. **Header button** — primary  
2. **First content in `<main>`** — optional compact “Recruiter? Start here →” card **only when mode off** (dismissible once via `sessionStorage`)  
3. Hero toggle — tertiary  

---

## Files to touch

| File | Changes |
|------|---------|
| `index.html` | Header briefing button; mobile nav item; remove/simplify `#rm-strip`; optional hero promo card |
| `assets/site.css` | Remove recruiter dim/disable rules; header recruiter states; fix `top`/`scroll-margin` without strip |
| `assets/recruiter.css` | Panel/header coordination; z-index; mobile sheet vs header |
| `assets/visuals.js` | Strip logic → header state; sync toggles with `RecruiterBriefing` |
| `assets/recruiter.js` | `open`/`close`/`minimize`; sync header `aria-pressed`; no duplicate `recruiter-mode` side effects |
| `assets/nav.js` | Optional: close mobile nav before opening briefing |
| `README.md` | Short “Recruiter mode” UX note for future editors |

---

## State model (implement explicitly)

```js
// Pseudocode — single source of truth
state = {
  mode: false,      // body.recruiter-mode — prioritization markers
  panelOpen: false  // rm-panel-visible — dialog open
}

// Transitions:
// enterMode()     → mode=true, panelOpen=true (first time) OR panelOpen=false (return visit)
// openPanel()     → panelOpen=true
// minimizePanel() → panelOpen=false, mode=true
// exitMode()      → mode=false, panelOpen=false, clear localStorage
```

Sync: `#rm-hero-toggle`, `#recruiter-toggle`, `#header-rm-toggle` (new), mobile nav item — all `aria-pressed` tied to `mode` or `panelOpen` per design.

---

## Non-negotiable constraints

1. Zero build step; vanilla JS.  
2. WCAG 2.1 AA — no `pointer-events: none` on main content.  
3. Do not remove briefing panel features (scan, summary, copy, section jumps).  
4. Honesty line stays in panel footer.  
5. Homepage only — no recruiter assets on articles/404.  
6. Bump `sw.js` cache if HTML/JS/CSS change.

---

## Verification matrix

### Desktop (1280px)

- [ ] “Recruiter briefing” visible in header without scrolling  
- [ ] One top bar only; no duplicate Resume  
- [ ] Panel open/close/minimize/exit mode all clear  
- [ ] Writing + FAQ fully usable (links work)  
- [ ] Section jump lands below fixed header  

### Mobile (390px)

- [ ] Briefing in hamburger menu  
- [ ] Bottom sheet does not trap user; Escape closes  
- [ ] No horizontal overflow on header chrome  
- [ ] Safe-area insets on sheet and header  

### Keyboard

- [ ] Tab order: header → panel → page  
- [ ] Escape minimizes/closes panel  
- [ ] Exit mode reachable without mouse  

### Regression

- [ ] `?recruiter=1` still works  
- [ ] Theme toggle works in recruiter mode  
- [ ] Scroll-spy nav still accurate (scroll-margin after chrome change)  
- [ ] `prefers-reduced-motion`: no broken empty strip animation  

---

## Deliverables

1. **Phase 0 (short):** Screenshot-level description of current vs proposed chrome (text is fine).  
2. **Implementation** per sections P1–P3 + audit table.  
3. **Changelog** for user: what moved, what was removed, how to open briefing now.  
4. **Before/after** list of removed CSS rules (especially `#writing` / `.faq-section` disables).

---

## Commit plan

1. `portfolio: remove recruiter section disable and tag dimming`  
2. `portfolio: merge recruiter strip into header chrome`  
3. `portfolio: add prominent header and mobile nav briefing entry`  
4. `portfolio: recruiter state machine and panel/header sync`  
5. `portfolio: README recruiter UX notes`

---

## Anti-patterns

- Adding a third fixed bar “fix” on top of strip + header  
- Hiding `#writing` from DOM or `display: none` for recruiters  
- Auto-opening panel on every page load when `localStorage.recruiter=1`  
- Different Resume URLs in strip vs header vs panel (must all be `resume.pdf`)  
- Leaving `--strip-h: 44px` after strip removed (breaks hero padding)  

---

## Execution instruction

Start with **Phase 0**, then implement **P2** (remove disabling) and **P3** (merge chrome) before **P1** (prominent entry) so new buttons land in the correct single bar.

Prioritize **clarity over animation**. The briefing should feel premium because it is **fast and obvious**, not because three bars compete for attention.
