# Claude Prompt — Premium Recruiter Mode (“AI Briefing” Experience)

**Repo:** `AnimeshPandey.github.io`  
**Canonical site:** https://anmshpndy.com  
**Stack:** Static HTML · CSS · vanilla JS · GitHub Pages (no build step)

**Related:** `docs/portfolio-architecture-prompt.md`, `docs/portfolio-visuals-implement-prompt.md`

---

## Your role

You are a **principal product engineer + interaction designer** upgrading **Recruiter Mode** on a static portfolio. The experience must feel like a **premium AI briefing** — fast, confident, scannable — while remaining **honest** (curated synthesis, not a live LLM unless explicitly wired later).

**Primary user:** Hiring manager / recruiter with **90 seconds** to decide: contact, download resume, or leave.

**Success:** They see role fit, scale, stack, availability, and proof — without reading the full page linearly.

---

## Current state (analyze before coding)

| Piece | Location | Behavior today |
|-------|----------|----------------|
| Toggle | `#rm-hero-toggle`, `#recruiter-toggle` | `aria-pressed`, persists `localStorage.recruiter` |
| Strip | `#rm-strip` in `index.html` | 44px bar; typewriter on 4 fields (`data-rm`); `profile.scan` aesthetic |
| Logic | `initRecruiterMode()` in `assets/visuals.js` | Toggle body class, open/close strip |
| Page effects | `body.recruiter-mode` in `assets/site.css` | Highlight contact/resume/stats; dim `#writing` + `.faq-section`; sage accents |

**Gaps vs goal:**

- Summary is **4 tokens**, not a real briefing.
- No staged “analysis”, no structured sections, no copy/export.
- `visuals.js` is already large — recruiter logic should **split out**.
- Mobile strip truncates fields; no dedicated recruiter layout.
- Nothing explains this is a **synthesized brief** (avoid implying live ChatGPT unless true).

**Phase 0 deliverable:** confirm DOM hooks, list files to touch, propose keep vs replace strip.

---

## Product vision — “Recruiter Briefing”

### Experience arc (premium, scripted — not a real API by default)

```text
[User clicks “Recruiter briefing”]
     → Backdrop dims (subtle)
     → Panel slides in (drawer desktop / bottom sheet mobile)
     → Phase 1 (0.8–1.2s): “Scanning profile…” + checklist animates
           ✓ Experience   ✓ Projects   ✓ Skills   ✓ Metrics
     → Phase 2: Narrative streams in (typewriter or line-by-line reveal)
     → Phase 3: Structured cards populate (staggered fade, 40–80ms apart)
     → Ready: CTAs pinned — Resume · Email · Jump to contact
```

**Tone:** Calm copilot / terminal intelligence — **sage + ink palette**, not neon Matrix. Match existing warm editorial design (`theme.css` tokens).

**Honesty copy (required somewhere in panel footer):**

> *Synthesized from this portfolio’s public content — not a live AI model.*

Optional later: real LLM via API is **out of scope** unless user adds keys; do not block v1 on it.

---

## Non-negotiable constraints

1. **Zero build step** — vanilla JS, deploy on push.
2. **No fake “Powered by GPT-4”** badges or chat UI implying live inference.
3. **WCAG 2.1 AA** — `role="dialog"`, focus trap, `Escape` closes, focus return to trigger, `aria-modal="true"`, visible focus rings.
4. **`prefers-reduced-motion: reduce`** — skip scan animation + typewriter; show final content immediately.
5. **Progressive enhancement** — toggles still apply `body.recruiter-mode` page highlights if panel JS fails.
6. **Performance** — lazy-load recruiter module on **first** toggle click; target &lt; 15KB gzipped for new JS+data.
7. **Homepage only** — do not load on article/404 pages.
8. **Architecture** — extract from `visuals.js` into dedicated files (see below).

---

## Recommended architecture

### New files

| File | Responsibility |
|------|----------------|
| `assets/recruiter-data.js` | Single source of truth: brief copy, metrics, role tags, scan steps, section anchors |
| `assets/recruiter.js` | Orchestrator: open/close, phases, typewriter, focus trap, copy brief, URL `?recruiter=1` |
| `assets/recruiter.css` | Panel, backdrop, cards, scan UI, animations (optional split from `site.css` if large) |

### Load strategy

```html
<!-- index.html — do NOT load recruiter.js until needed -->
<script src="/assets/visuals.js" defer></script>
```

In `visuals.js`, replace `initRecruiterMode()` with a thin loader:

```js
function initRecruiterMode() {
  var toggles = document.querySelectorAll('#rm-hero-toggle, #recruiter-toggle');
  toggles.forEach(function (btn) {
    btn.addEventListener('click', function () {
      loadRecruiterModule().then(function (m) { m.toggle(); });
    });
  });
  if (new URLSearchParams(location.search).get('recruiter') === '1') {
    loadRecruiterModule().then(function (m) { m.open(); });
  }
}
```

Dynamic load: `recruiter-data.js` then `recruiter.css` then `recruiter.js` (or bundle data+logic in one file if smaller).

Bump `sw.js` cache when adding assets.

### Data model (`window.__RECRUITER_BRIEF` or IIFE export)

Structure the brief so copy updates in **one place**:

```js
{
  meta: {
    candidate: 'Animesh Pandey',
    title: 'Senior Frontend Engineer',
    location: 'Bangalore, India',
    status: 'Open to senior & staff roles',
    email: 'animeshpandey1909@gmail.com',
    linkedin: 'https://linkedin.com/in/pandeyanimesh',
    resume: '/resume.pdf'
  },
  executiveSummary: [
    'Senior frontend engineer with 7+ years shipping ...',
    'Led microfrontend platform for 50k+ DAU ...',
    'Currently at Lifesight (marketing intelligence SaaS) ...'
  ],
  atAGlance: [
    { label: 'Experience', value: '7+ years' },
    { label: 'Scale', value: '50k+ daily users (Tekion MFE)' },
    { label: 'Core stack', value: 'React · TypeScript · Next.js' },
    { label: 'Domains', value: 'SaaS · MMM/analytics · Automotive retail' },
    { label: 'Education', value: 'B.Tech CSE, IIITDM Jabalpur (2019)' }
  ],
  highlights: [
    { id: 'experience', label: 'Lifesight', detail: 'Unified Measurement OS, SSR dashboards, agentic AI (Mia)', anchor: '#experience' },
    { id: 'tekion', label: 'Tekion', detail: 'Module Federation across 10+ modules, 30% load-time reduction', anchor: '#experience' }
  ],
  topProjects: [
    { name: 'Tekion Microfrontend Platform', metric: '50k+ DAU · 30% faster loads', anchor: '#projects', tags: ['React', 'Module Federation'] },
    { name: 'Lifesight Measurement OS', metric: 'Enterprise MMM / incrementality dashboards', anchor: '#projects', tags: ['Next.js', 'SSR'] }
  ],
  skillsTier: {
    primary: ['React', 'TypeScript', 'Next.js', 'Microfrontends'],
    secondary: ['Playwright', 'Webpack', 'GraphQL', 'Design Systems'],
    also: ['Node.js', 'D3.js', 'Agentic AI', 'WCAG 2.1']
  },
  fitSignals: [
    'Staff-ready: platform architecture + CI perf guardrails',
    'Strong in data-dense dashboards and design systems',
    'Remote-friendly · Bangalore base'
  ],
  scanSteps: ['experience', 'projects', 'skills', 'metrics', 'education']
}
```

**Source of truth rule:** Pull numbers and employers from `index.html` content when building `recruiter-data.js` — do not invent metrics.

---

## UI specification

### A. Minimized chrome (keep or evolve strip)

When mode is **on** and panel is **closed**, show a slim persistent bar (evolve current `#rm-strip`):

- Left: `briefing.active` + pulsing dot  
- Center: one-line status — e.g. `Senior FE · React/TS · Open`  
- Right: `Open briefing` · `Resume ↓` · `✕`

Clicking bar reopens full panel. Strip height via `--strip-h` (already used).

### B. Full briefing panel (main deliverable)

| Breakpoint | Layout |
|------------|--------|
| **≥820px** | Right **drawer** (~420–480px), page scrolls behind dimmed backdrop |
| **&lt;820px** | **Bottom sheet** (~85vh max), drag handle, safe-area padding |

**Panel sections (scroll inside panel):**

1. **Header** — “Recruiter briefing” + close + optional minimize  
2. **Scan progress** (collapses after complete) — step list with checkmarks  
3. **Executive summary** — 2–4 sentences, streaming text  
4. **At a glance** — 2-column metric grid  
5. **Why hire** — 3–5 `fitSignals` chips with check icons  
6. **Experience highlights** — 2–3 cards linking to `#experience` (click → close panel + smooth scroll + brief highlight pulse on target)  
7. **Top projects** — 3 cards with metrics from `data-impact` where available  
8. **Skills** — tiered chips (primary / secondary / also)  
9. **Availability** — status, location, work auth if in copy, contact row  
10. **Footer** — honesty line + **Copy plain-text brief** + CTAs  

**Pinned footer actions (always visible):**

- Primary: Download resume  
- Secondary: Email  
- Tertiary: Open contact form (scroll + focus)

### C. Page-level `body.recruiter-mode` (enhance existing)

Keep and extend:

| Effect | Purpose |
|--------|---------|
| Dim `#writing`, `.faq-section` | Reduce noise |
| Sage ring on `#contact` | Draw action |
| Amplify `resume.pdf` links | Fast download |
| Stats glow | Surface proof |
| **New:** `.recruiter-priority` sections get subtle left border or label in margin for `#experience`, `#skills`, `#projects` |
| **New:** optional reading time saved badge in panel (“~2 min brief vs ~8 min full page”) |

Do **not** hide content required for SEO — only de-emphasize visually.

---

## Interaction & motion (premium details)

Implement with taste; respect reduced motion.

| Pattern | Implementation |
|---------|----------------|
| **Staged scan** | Each `scanSteps` item: pending → active (spinner) → done (✓) over ~400ms each |
| **Streaming summary** | Typewriter 18–28ms/char OR reveal by sentence; skip if reduced motion |
| **Card stagger** | `opacity` + `translateY(8px)` with `animation-delay` |
| **Backdrop** | `backdrop-filter: blur(6px)` + `rgba` scrim — disable blur on low-end if janky |
| **Panel enter** | `transform: translateX(100%)` → `0` (desktop); `translateY(100%)` → `0` (mobile) |
| **Section jump** | Close panel → `scrollIntoView` → add `.recruiter-flash` on target for 1.2s |
| **Copy brief** | Build plaintext from `recruiter-data`; toast “Brief copied” |
| **Deep link** | `?recruiter=1` opens panel on load; `history.replaceState` to clean URL on close |
| **Persistence** | `localStorage.recruiter` = `'1'` when mode on |

**Avoid:** chat bubbles, fake typing indicator forever, sound effects, full-screen blocking with no close, auto-open on first visit.

---

## Accessibility requirements

- Panel: `role="dialog"`, `aria-labelledby`, `aria-describedby` (summary id).  
- Focus trap while open; `Escape` closes; restore focus to last toggle.  
- Scan region: `aria-live="polite"` for phase changes (not per-character).  
- All actions keyboard-operable (`Enter`/`Space` on buttons).  
- Copy button announces success via existing `#shortcut-announce` or dedicated live region.  
- Decorative scan graphics: `aria-hidden="true"`.  
- Full brief available as static text in DOM for screen readers (not only typewriter div).  
- Panel scrollable region: focusable, no trap inside scroll area that blocks Escape.

---

## HTML changes (`index.html`)

1. Replace or extend `#rm-strip` markup for minimized chrome.  
2. Add panel skeleton (can be mostly empty — JS fills):

```html
<div id="rm-panel" class="rm-panel" hidden aria-hidden="true" role="dialog" aria-modal="true" aria-labelledby="rm-panel-title">
  <div class="rm-panel-backdrop" data-rm-dismiss tabindex="-1" aria-hidden="true"></div>
  <div class="rm-panel-sheet">
    <header class="rm-panel-head">…</header>
    <div class="rm-panel-scan" id="rm-scan">…</div>
    <div class="rm-panel-body" id="rm-body">…</div>
    <footer class="rm-panel-foot">…</footer>
  </div>
</div>
```

3. Rename toggle label to **“Recruiter briefing”** (clearer than “recruiter view”).  
4. Update `title` / `aria-label` on toggles to describe AI-style brief without false claims.

---

## CSS guidance (`recruiter.css` or `site.css` RECRUITER block)

- Use existing tokens: `--sage`, `--ink`, `--surface`, `--mono`, `--serif`.  
- Panel background: `--surface` with subtle border; dark theme tested.  
- Scan step: mono font, 11px, uppercase labels.  
- Cards: same radius as `.pc` / `.edu-card` for consistency.  
- Z-index stack: backdrop `200`, panel `201`, strip `202` (above header `100` if needed — check `header` z-index).  
- `body.recruiter-mode` overflow: `hidden` only while panel open (prevent scroll bleed).  

---

## JavaScript API (`assets/recruiter.js`)

Export minimal surface:

```js
window.RecruiterBriefing = {
  open: function () {},
  close: function () {},
  toggle: function () {},
  isOpen: function () { return boolean; },
  isActive: function () { return boolean; } // mode on
};
```

Remove recruiter implementation from `visuals.js` after extraction.

---

## Optional enhancements (Tier B — if Tier A stable)

| Feature | Notes |
|---------|--------|
| **Print / PDF brief** | `window.print()` with `@media print` styles for panel content only |
| **Compare to job description** | Paste textarea → keyword highlight against skills (local string match, no AI) |
| **Share link** | Copy `https://anmshpndy.com/?recruiter=1` |
| **Analytics event** | If Cloudflare/GA exists, one event `recruiter_briefing_open` |

Defer real LLM integration unless user provides API budget and privacy review.

---

## Verification checklist

- [ ] First toggle lazy-loads scripts without console errors  
- [ ] Panel works desktop + mobile (320px)  
- [ ] Reduced motion: instant content, no scan/typewriter  
- [ ] Keyboard: open, tab through, Escape close, focus return  
- [ ] Screen reader: dialog announced; summary readable  
- [ ] Copy brief → clipboard works; toast feedback  
- [ ] Resume + mailto CTAs work  
- [ ] Section jump scrolls and highlights target  
- [ ] `?recruiter=1` deep link opens panel once  
- [ ] `localStorage` persists mode across reload  
- [ ] `body.recruiter-mode` page effects still apply  
- [ ] No horizontal overflow; panel scrolls internally  
- [ ] Lighthouse: no major CLS (panel `hidden` until open)  
- [ ] Light + dark theme both polished  

---

## Commit plan

1. `portfolio: add recruiter-data and briefing panel markup`  
2. `portfolio: implement recruiter.js with scan phases and lazy load`  
3. `portfolio: recruiter panel styles and enhanced body.recruiter-mode`  
4. `portfolio: extract recruiter from visuals.js and bump sw cache`  
5. `portfolio: README recruiter briefing section`  

---

## Anti-patterns

- Claiming live AI when content is static JSON  
- Loading OpenAI/Anthropic SDK on homepage for v1  
- Putting 400+ lines of recruiter UI back inside `visuals.js`  
- Auto-opening briefing on every visit  
- Removing writing/FAQ from DOM (SEO) — dim only  
- Chat UI with send button that does nothing  
- `pointer-events: none` on main content while panel open (blocks scroll on desktop — only backdrop should block)  
- Infinite typewriter loop  

---

## Execution instruction

1. Run **Phase 0** — audit current recruiter code and confirm data against `index.html`.  
2. Implement **Tier A** (data file + panel + scan animation + summary + CTAs + a11y + lazy load).  
3. Polish motion and mobile sheet until it feels **premium** but not gimmicky.  
4. Deliver **operator notes**: how to update brief copy in `recruiter-data.js`, how to test deep link, honesty disclaimer placement.

Challenge weak ideas. Prioritize **recruiter time-to-decision** over visual novelty.
