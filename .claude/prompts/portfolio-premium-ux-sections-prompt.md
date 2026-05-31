# Claude Prompt — Premium UX, Section Polish & Chrome Simplification

**Repo:** `AnimeshPandey.github.io`  
**Canonical site:** https://anmshpndy.com  
**Stack:** Static HTML · `assets/site.css` · `theme.js` · `nav.js` · `visuals.js`

**Architecture:** `.claude/prompts/portfolio-architecture-prompt.md`

**Related:**

- `portfolio-layout-responsive-themes-prompt.md` — grids, breakpoints, multi-theme tokens (coordinate; don’t re-litigate grid math here)
- `portfolio-design-system-tokens-prompt.md` — button component, constants, resume module (**do first** or in parallel)
- `portfolio-i18n-localization-prompt.md` — lang switcher fits simplified header

---

## Your role

You are a **senior product designer + staff frontend engineer** delivering a **premium, calm, recruiter-grade** portfolio. The site should feel closer to Stripe / Linear / Vercel than a template — intentional density, few primary actions, no “AI slop” section titles.

**North star:** A hiring manager in 30 seconds: understands who you are, can **preview or download one resume**, toggles theme/language without header chaos, scrolls without awkward gaps or misaligned hints.

---

## Known problems (user-reported + audit)

| # | Issue | Current evidence | Target outcome |
|---|--------|------------------|----------------|
| 1 | **Cluttered top bar** | Nav links + theme picker + recruiter toggle + resume + hamburger | **≤3** visible chrome actions on desktop; links in nav; utilities grouped |
| 2 | **Too many resume touchpoints** | `resume.pdf` in header (×2 mobile), hero CTAs, hero card, contact quick, footer social, recruiter foot | **One primary** + **one secondary** max; same component everywhere |
| 3 | **No resume preview** | Download only | Modal or drawer: embedded PDF / `<object>` + Download CTA |
| 4 | **`?` hint + scroll misaligned** | `.egg-key-hint` + `.scroll-cue` inside `#hero` grid | Shared bottom rail aligned to `.page-wrap` left edge |
| 5 | **Excessive section gaps** | `section` padding 80→96→112px; dividers + large `h2` margins | Unified `--space-section-y`; tighter rhythm mobile |
| 6 | **Themes** | 6 themes exist in `theme.css` | Extend polish: transitions, picker labels, hero canvas per theme (see layout prompt) |
| 7 | **“Built with” feels AI-generated** | `#skills` `h2` = “Built with” + chip wall | Rename,restructure to **credibility-first** skills presentation |
| 8 | **Overall finish** | Inconsistent buttons, generic blocks | Cohesive elevation, typography, micro-interactions |

---

## UX principles (enforce in every section)

1. **One primary action per viewport** — hero: “View experience” or “Contact”; not three equal-weight buttons.
2. **Progressive disclosure** — recruiter mode, theme, language in **overflow / “More”** menu on `<820px` if needed.
3. **Recruiter path** — briefing toggle stays discoverable but not competing with resume (icon + tooltip, not second full button row).
4. **Calm motion** — respect `prefers-reduced-motion`; no gratuitous parallax.
5. **Content over chrome** — reduce dividers; use whitespace + subtle border instead of double separators.
6. **Honest copy** — no “Built with” / “Leveraging synergies”; use “Stack & craft”, “What I work with”, or “Tools & platforms”.

---

## Phase 1 — Header & global chrome

### Desktop (≥820px) target layout

```text
[ AP. ]  about · experience · skills · projects · writing · contact     [ ⋯ More ▾ ]
                                                                              └─ Theme
                                                                                 Language (if i18n)
                                                                                 Recruiter briefing
                                                                                 Resume → Preview | Download
```

**Remove** standalone full “Resume” pill from bar when inside More menu — OR keep **one** outline “Resume” if More feels hidden for recruiters.

### Mobile

- Hamburger → full nav + **grouped utilities** at bottom (theme, lang, recruiter, resume).
- **No duplicate** theme picker in header AND footer unless footer is the only copy.

### Implementation notes

- Add `.nav-utilities` dropdown (CSS `:focus-within` or small `nav.js`).
- When `body.recruiter-mode` or `body.rm-panel-open`, hide nonessential chrome (partially exists — audit `site.css` recruiter header rules).
- Icon-only buttons: consistent `44×44px`, shared `.icon-btn` from design-system prompt.

---

## Phase 2 — Resume consolidation + preview

### Touchpoint budget (after refactor)

| Priority | Placement | Action |
|----------|-----------|--------|
| Primary | Hero | “View resume” → opens **preview modal** |
| Secondary | More menu + contact | “Download PDF” |
| Optional | Recruiter panel foot | Download only (text link, not button) |
| Remove | Footer social row duplicate | Link to preview instead of fifth download |
| Remove | Hero card giant `resume.pdf` button | Replace with “Preview” text link or merge into hero CTAs |

### Resume preview modal

```html
<dialog id="resume-preview" class="resume-modal" aria-labelledby="resume-modal-title">
  <div class="resume-modal-inner">
    <header>…</header>
    <object data="/resume.pdf" type="application/pdf" …>…</object>
    <!-- fallback -->
    <p><a href="/resume.pdf" download>Download PDF</a></p>
  </div>
</dialog>
```

- Focus trap, `Escape` closes, return focus to trigger.
- Mobile: full-screen sheet; PDF via `<iframe>` or prompt download if iOS Safari blocks embed.
- `resume-actions.js`: `openPreview()`, `download()`, toast (reuse visuals toast logic).
- **Single** `RESUME.path` from `constants.js`.

---

## Phase 3 — Hero bottom rail (`?` + scroll)

**Problem:** `.egg-key-hint` and `.scroll-cue` compete; misaligned vs content column.

**Fix:**

```css
.hero-chrome-rail {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding-top: var(--space-4);
  /* align to hero content box, not viewport edge */
}
```

- Move both hints into **one rail** inside `#hero`.
- `scroll-cue` only `@media (min-width: 820px)` and when hero taller than viewport (optional `scroll-cue--hidden` via JS if `scrollY > 40`).
- `egg-key-hint`: smaller, `ink-3`, don’t overlap ticker — place **above** ticker or hide when ticker visible.

---

## Phase 4 — Section rhythm & spacing

### Spacing scale (apply from design-system prompt)

| Token | Use |
|-------|-----|
| `--space-section-y` | Between major sections (replace 80/96/112 ladder) |
| `--space-section-gap` | Between label → h2 → content |
| `--space-block` | Between paragraphs / cards |

### Dividers

- Replace paired `.divider` + huge padding with **either** divider **or** spacing — not both.
- Target: ~`clamp(48px, 6vw, 72px)` between sections on mobile.

### Section-specific notes

| Section | Premium direction |
|---------|-------------------|
| **Hero** | Fix name clipping; reduce CTA count to 2; card optional on wide only |
| **About** | FAQ column balanced; stats row flush with grid |
| **Experience** | Timeline breathing room without 40px dead gaps |
| **Skills** | See Phase 5 — not “Built with” |
| **Projects** | Cards equal height rhythm; lens interaction subtle |
| **Writing** | Already polished per writing prompt — match card hover |
| **Contact** | Form + quick links; single resume entry |
| **Footer** | Quieter; no wall of equal social buttons |

---

## Phase 5 — Skills section redesign (“Built with”)

**Rename & reframe:**

- Label: `// skills` (keep mono eyebrow)
- H2 options (pick one): **“Stack & craft”** · **“What I ship with”** · **“Tools & platforms”**
- Subcopy (one line): “Production tools from recent platforms — not a buzzword dump.”

**Layout options (choose one in Phase 0 mockup description):**

**A — Grouped competency rows** (less “chip cloud”):

```text
Frontend core     React · TypeScript · Next.js · …
Platform          Module Federation · Storybook · …
```

**B — 3×2 grid** with **max 6 chips visible** per card + “+N more” expand — reduces noise.

**C — Single horizontal “orbit”** (subtle) for featured stack only; full list behind “View full stack” disclosure.

**Remove:** inline `style="--cat:#bf5a32"` on cards → token classes `.sv-card--frontend`, `.sv-card--arch` in CSS.

**Visual:** No neon borders; category accent = 3px top border only; chips use shared `.chip` component.

---

## Phase 6 — Multi-theme premium finish

Themes exist: `light`, `dark`, `sage`, `slate`, `dusk`, `high-contrast`.

Additional polish:

- Theme change: `html.theme-transitioning` brief cross-fade (already partial — extend to surfaces).
- Theme picker: show **checkmark** on active; swatch rings accessible.
- Verify hero canvas + recruiter sage highlights per theme (grep hardcoded rgba).
- **high-contrast:** test focus rings on new modal + More menu.

(Coordinate file list with `portfolio-layout-responsive-themes-prompt.md` — avoid duplicate Phase 2 theme work.)

---

## Phase 7 — “Premium finish” checklist (per component)

| Component | Upgrade |
|-----------|---------|
| Buttons | Shared heights, focus ring, no 3 border styles on hero row |
| Cards | Consistent radius `--radius`, shadow `--shadow-sm` → `--shadow-md` on hover |
| Typography | `h2` em italic secondary; body `ink-2`; labels mono `ink-3` |
| Forms | Floating labels optional; error state contrast all themes |
| Toasts | Copy toast + resume toast unified `.toast` component |
| Footer | Smaller social icons; text links option on desktop |
| Back-to-top | Don’t overlap `?` hint — z-index stack table |

---

## Responsive QA matrix (mandatory)

| Width | Chrome | Hero | Skills | Contact |
|-------|--------|------|--------|---------|
| 320 | More menu; no overflow | 1 CTA column | 1-col cards | stacked form |
| 375 | safe-area | rail aligned | | |
| 820 | nav links visible; More or inline utils | 2-col hero | 2-col sv-grid | |
| 1024 | about 2-col | | 3-col sv | 2-col contact |
| 1280 | max-width centered | gap capped | | |
| 1536 | no excessive void | | | |

**Accessibility:** WCAG 2.1 AA contrast all themes; keyboard entire header; dialog modal focus trap.

**References:** Web Interface Guidelines, Nielsen heuristics (visibility, match real world — “Resume preview” not mystery meat).

---

## Phase 0 deliverable (before code)

1. **Chrome wireframe** (ASCII): before/after header.
2. **Resume touchpoint table**: every `href="resume.pdf"` with keep/remove/modify.
3. **Section spacing table**: current px vs proposed token.
4. **Skills**: chosen layout option A/B/C with rationale.

---

## Files to touch

| File | Changes |
|------|---------|
| `index.html` | Header structure, hero CTAs, skills copy/structure, resume modal, chrome rail |
| `assets/site.css` / component CSS | Layout, modal, nav utilities |
| `assets/nav.js` | More menu, modal open/close, scroll-cue logic |
| `assets/visuals.js` | Delegate resume toast to `resume-actions.js` |
| `assets/js/components/resume-actions.js` | **New** (per design-system prompt) |
| Article pages | Lighter header if full chrome simplified |
| `sw.js` | Cache bump |

---

## Acceptance criteria

- [ ] Header: ≤3 utility icons visible desktop + clear nav (user approves tradeoff)
- [ ] Resume: preview modal works desktop + graceful mobile fallback
- [ ] Resume download count ≤2 prominent + 1 tertiary link
- [ ] `?` + scroll share one aligned rail; no overlap at 820×700
- [ ] Section vertical rhythm uses shared token; visibly tighter than before on mobile
- [ ] Skills section renamed; no “Built with” h2; chip noise reduced
- [ ] All 6 themes: modal, header, hero readable
- [ ] No new horizontal scroll 320–1536
- [ ] Recruiter mode still usable; header exit clear

---

## Anti-patterns

- Adding more header buttons to “fix” clutter
- Fifth resume download button in footer
- Autoplay PDF
- Generic “Made with ❤️ and AI” footer
- Stock illustrations
- Carousels for skills

---

## Execution order

1. Phase 0 wireframes + touchpoint audit.
2. **Design-system** button + constants (if not done).
3. Phase 1 header / More menu.
4. Phase 2 resume modal + dedupe links.
5. Phase 3 hero chrome rail.
6. Phase 4 section spacing.
7. Phase 5 skills redesign.
8. Phase 6 theme polish pass.
9. Full QA matrix + update architecture prompt.

**Quality bar:** You would confidently send this URL to a Staff Frontend hiring manager at Stripe or Vercel without apologizing for the UI.
