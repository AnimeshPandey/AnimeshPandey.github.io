# Claude Prompt — Writing Section & Article Pages (Premium Polish)

**Repo:** `AnimeshPandey.github.io`  
**Canonical site:** https://anmshpndy.com  
**Stack:** Static HTML · `assets/site.css` · article routes `*/index.html` · **no build step**

**Architecture:** `.claude/prompts/portfolio-architecture-prompt.md` (update that file if you add routes or change load order)

**Related backlog:** `docs/portfolio-recruiter-data-premium-prompt.md` (recruiter/contact only — do not mix scope)

**Platform-inspired authoring:** `portfolio-platform-inspired-writing-prompt.md` — research `lifesight-platform-ui`, write original articles with diagrams, strict redaction (no leaks)

---

## Your role

You are a **senior product designer + staff frontend engineer** polishing the **writing** surfaces so they feel as intentional as `#projects` and `#experience` — editorial, calm, premium (Stripe/Linear/Vercel restraint), not a 2021 blog template.

**North star:** A hiring manager skimming `#writing` immediately sees **published proof**, **where to follow you**, and **credible work-in-progress** — without visual noise, broken headers, or misleading “external” icons on on-site articles.

---

## Surfaces in scope

| Surface | Path | Loads |
|---------|------|-------|
| Homepage writing block | `index.html` → `#writing` | `theme.css`, `site.css`, `visuals.js` (tap only) |
| Published list | `.articles-list` → `.article-item` | — |
| Platform row | `.writing-profiles` | — |
| Pipeline | `.drafts-label` + `.writing-list` → `.wi` | — |
| Article pages | `fundamentals-of-functional-javascript/index.html`, `how-well-do-you-know-this/index.html` | `theme.css`, `site.css`, `theme.js`, `nav.js` only |

**Do not** load `visuals.js`, `contact.js`, or recruiter bundles on article pages.

---

## What looks bad today (from live UI — fix these)

| Issue | Evidence | Fix direction |
|-------|----------|---------------|
| **Article header rhythm** | Label, H1, and byline fight for attention; byline can sit awkwardly beside long titles on wide viewports | **Vertical stack only**: label → title → byline; no side-by-side header grid |
| **External icon on on-site links** | Fundamentals + “How Well Do You Know” show ↗ but URLs are `/fundamentals-…/` and `/how-well-do-you-know-this/` | `ext-icon` only when `href` is off-origin or `target="_blank"` |
| **Heavy card hover** | Published rows fill with `var(--accent-bg)` — feels cheap vs project cards | Match `.pc`: subtle `translateY`, border, shadow — **no full-row accent wash** |
| **Read time mismatch** | Index: Fundamentals **6 min**; article page: **21 min** | One truth per article — prefer article page; update index meta |
| **Inline styles on articles** | CTA box + author footer use raw `style=""` | Move to `site.css` (`.article-cta`, `.article-author`, `.article-crosslinks`) |
| **Thin on-site articles** | Long Medium piece summarized as stub + “read on Medium” | Either expand canonical on-site body **or** label clearly as **excerpt** with honest CTA hierarchy |
| **Pipeline feels empty / samey** | Only 3 rows, all “Draft”, weak differentiation | More rows, **status badges** (Draft / Outline / Research / Idea), dashed container, optional “Notify me” copy |
| **Writing block hierarchy** | One flat list inside a box; platforms compete with articles | Subheads: **On this site** · **Published elsewhere** · **In the pipeline** |

---

## Premium direction (match existing tokens)

Reuse only: `--serif`, `--sans`, `--mono`, `--ink`, `--ink-2`, `--ink-3`, `--accent`, `--sage`, `--border`, `--surface`, `--radius`, `--page-pad`.

| Pattern | Apply to writing |
|---------|------------------|
| Mono eyebrows | `// writing`, `// in the pipeline`, `// on this site` |
| Serif titles | Article H1, card titles, pipeline `h3.wi-title` |
| Project-card hover | Published `.article-item` |
| Sage secondary accent | Pipeline container border or badge variant (not competing with accent orange) |
| Tabular nums | Read times, dates where applicable |
| Reduced motion | No required animation; respect `prefers-reduced-motion` |

**Optional (if time, gated):**

- Reading progress bar on article pages (`<div class="article-progress">` + JS in `nav.js` or tiny inline — **only** if &lt; 30 lines and no build step)
- Featured published card (one `.article-item--featured` spanning top — on-site Fundamentals)
- Series footer on both `this` articles: “Part of a series →” cross-links

---

## Phase 0 — Audit (output before coding)

Deliver a short table:

| Article | Index read time | Article read time | Link type (on-site / external) | Has ext-icon? |
|---------|-----------------|-------------------|-------------------------------|---------------|
| Everything You Need… `this` | 8 min | — (HN only) | External | OK |
| Fundamentals… | 6 min | 21 min | On-site | **Wrong icon** |
| How Well Do You Know… | 5 min | 5 min | On-site | **Wrong icon** |

### Reference examples — on-site article pages (layout targets)

Use these live routes as **before/after** references when polishing reading layout. Pair with `portfolio-layout-responsive-themes-prompt.md` for breakpoint/theme QA on the same templates.

| Route | What it demonstrates | Layout issues seen (fix) |
|-------|----------------------|---------------------------|
| `/fundamentals-of-functional-javascript/` | Long-form explainer; serif H1; mono label `JavaScript · Functional Programming`; **21 min** byline | Large dead zone between breadcrumbs and first paragraph; index still says **6 min**; excerpt vs full body unclear; prose column OK at `680px` but header stack needs tighter rhythm |
| `/how-well-do-you-know-this/` | Short technical post; **inline code in H1** (`this`); numbered list (four binding rules) | Breadcrumb may quote `"this"` while title uses backticks — **normalize**; binding-rule list needs consistent `ol` spacing and `code` chips in list items; good candidate for **series** footer linking Fundamentals + HackerNoon sibling |

**Target article shell (reading-first):**

```css
.article-shell {
  max-width: min(680px, 100%);
  margin-inline: auto;
  padding-top: calc(var(--nav-h) + clamp(24px, 4vw, 40px));
  padding-bottom: clamp(64px, 10vw, 96px);
}
/* Header: single column only — label → h1 → byline → prose */
.article-header { margin-bottom: clamp(28px, 5vw, 40px); }
.article-prose { max-width: 65ch; } /* optional — keeps line length stable */
```

**Prose patterns to mirror across new articles:**

| Pattern | Example in existing content | CSS hook |
|---------|----------------------------|----------|
| Eyebrow label | `JavaScript · Functional Programming` | `.article-label` |
| Serif H1 with code token | How Well Do You Know `this`? | `h1` + `code.article-title-code` |
| Numbered rules list | Four binding rules | `.article-prose ol` + `li code` |
| Inline `map` / `filter` / `reduce` | Fundamentals intro | `.article-prose code` |
| Pull quote / callout | (add on new posts) | `.article-prose blockquote` or `.article-callout` |
| Series navigation | (missing today) | `.article-series` between related posts |

**Do not add** a second sticky title bar duplicating H1 in the site header — articles use the **same** `header` as homepage (logo + theme + resume only). All title/byline context lives in `.article-header` inside `.article-shell`.

---

## Phase 1 — Homepage `#writing` structure

### Recommended markup shape

```html
<section id="writing" aria-labelledby="writing-heading">
  <p class="section-label">// writing</p>
  <h2 id="writing-heading">On the craft</h2>
  <p class="writing-intro">…one sentence on why you write…</p>

  <h3 class="writing-subhead">On this site</h3>
  <div class="articles-list articles-list--on-site" role="list">…</div>

  <h3 class="writing-subhead">Published elsewhere</h3>
  <div class="articles-list articles-list--external" role="list">…</div>

  <div class="writing-profiles">…Find me on…</div>

  <h3 class="writing-subhead writing-subhead--pipeline">// in the pipeline</h3>
  <p class="writing-pipeline-note">Essays in progress — topics tied to production work at Tekion and Lifesight.</p>
  <div class="writing-list writing-list--pipeline">…</div>
</section>
```

### Published card rules

- **On-site links:** no `target="_blank"`, no `.ext-icon`, optional pill `On site`
- **External:** `rel="noopener noreferrer"`, `.ext-icon`, platform badge (HackerNoon / Medium)
- **Meta line:** `date · platform · read time` on one visual row; crosspost as secondary line (smaller, `ink-3`)
- **Excerpt:** max ~2 lines desktop (`line-clamp` optional); no stale “923 reads” unless verifiable

### Pipeline container (`.writing-list--pipeline`)

- Dashed border `1px dashed var(--border-2)` + slightly muted background `var(--surface)` 
- Badge variants:
  - `.wi-badge--draft` — accent tint
  - `.wi-badge--outline` — sage
  - `.wi-badge--research` — neutral
  - `.wi-badge--idea` — outline only
- Rows are **not** links until published (no `href="#"`); optional `aria-disabled="true"` on title
- Date line: `Coming Q3 2026` / `Outline` / `Researching` — honest, not fake publish dates

---

## Phase 2 — Pipeline copy (paste-ready — 8 rows)

Use existing DOM: `.writing-list` > `.wi` with inner `div`, `.wi-date`, `h3.wi-title`, `.wi-excerpt`, `.wi-badge`.

**Voice:** First person where natural; tie to **real** stack (MFE, Lighthouse CI, Lifesight MMM, agentic UI, 50k+ DAU). No fake employer claims beyond what’s on `#experience`.

| # | Title | Date line | Badge | Excerpt |
|---|-------|-----------|-------|---------|
| 1 | Building Performance Budgets at Scale | Coming Q3 2026 | Draft | How we wired Lighthouse CI, bundle budgets, and PR comments so 10+ microfrontends couldn’t regress Core Web Vitals silently. |
| 2 | Microfrontends: Lessons from Three Years in Production | Coming Q4 2026 | Outline | Module Federation worked until it didn’t — versioning, shared dependencies, and the debugging stories nobody puts in the sales deck. |
| 3 | Agentic AI on the Frontend: Streaming, Tool Calls, and Calm UX | Coming Q3 2026 | Draft | Designing Mia-style interfaces where LLM output is streamed, tool calls are visible, and confidence is progressive — not a chat bubble slapped on a chart. |
| 4 | Data-Dense Dashboards Without Cognitive Overload | Researching | Research | Patterns from MMM and attribution UIs: hierarchy, defaults, and when *not* to add another chart. |
| 5 | From React 16 to 18 Across a Monorepo in Days | Coming 2026 | Outline | The migration playbook we used at Tekion — codemods, feature flags, and the tests that caught what types missed. |
| 6 | Designing Recruiter-First Portfolio UX | Exploring | Idea | Why I built a briefing mode, what I’d do differently, and how static sites can still feel product-grade. |
| 7 | Canvas vs DOM for Marketing Hero Effects | Backlog | Idea | When particles earn their keep (and when `prefers-reduced-motion` should win). |
| 8 | Static Sites That Feel Premium Without a Framework | Backlog | Idea | Tokens, lazy features, and discipline — how this portfolio is structured and why. |
| 9 | Why Your Lighthouse Score Lies on Dashboard Pages | Coming Q4 2026 | Research | Lab vs field data, hydration, and chart-heavy routes that score well in CI but hurt INP in production. |
| 10 | Module Federation Shared Dependencies: A Field Guide | Coming 2026 | Outline | `singleton`, `eager`, version skew, and the debugging checklist after the third “Invalid hook call”. |
| 11 | Streaming LLM UI: Patterns That Don’t Feel Like ChatGPT | Coming Q3 2026 | Draft | Partial tokens, tool-call panels, cancellation, and empty states for Mia-style analytics copilots. |
| 12 | Accessible Data Tables at Enterprise Density | Backlog | Idea | Sorting, virtualization, and screen-reader semantics when every cell is a sparkline. |

**HTML skeleton per row:**

```html
<div class="wi fade-up">
  <div>
    <p class="wi-date">Coming Q3 2026</p>
    <h3 class="wi-title">Building Performance Budgets at Scale</h3>
    <p class="wi-excerpt">How we wired Lighthouse CI, bundle budgets, and PR comments…</p>
  </div>
  <span class="wi-badge wi-badge--draft" aria-label="Status: Draft">Draft</span>
</div>
```

### Optional one-liner under pipeline

```html
<p class="writing-pipeline-footer">
  Want early access? <a href="#contact">Say hi</a> — happy to share drafts with engineers evaluating similar problems.
</p>
```

---

## Phase 3 — Article pages

### Header (fix overlap)

```css
/* Target: vertical stack, generous rhythm */
.article-header {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0;
  margin-bottom: 40px;
}
.article-label { margin-bottom: 12px; }
h1.article-title-main { margin-bottom: 14px; max-width: 100%; }
.article-byline { margin-top: 4px; }
```

- Long titles: `hyphens: none; word-break: normal;` — avoid mid-word breaks on `this`
- Inline `code` in H1: use shared class `.article-title-code` (move off inline styles in how-well page)

### Prose & components

| Element | Class | Notes |
|---------|-------|-------|
| CTA card | `.article-cta` | Replace inline styles; primary button + crosslink chips |
| Author card | `.article-author` | Avatar circle + links; match site footer tone |
| Series nav | `.article-series` | Between two related posts |
| Blockquote | existing `.article-prose blockquote` | Slightly larger left border on desktop |

### Content strategy per article

**Fundamentals of Functional JavaScript**

- Align read time to **~21 min** on index OR trim article estimate if keeping short on-site excerpt
- If staying excerpt-only: add `.article-ledger` mono line: `Canonical version · 21 min read on Medium`
- Expand on-site body **only** if you can carry 2–3 more sections without duplicating entire Medium post

**How Well Do You Know `this`?**

- Good candidate for **full on-site read** (already substantive)
- Add series link to Fundamentals + external HackerNoon sibling piece
- Consider `json-ld` `dateModified` bump when editing

### External CTA hierarchy

1. Primary: on-site reading (default)
2. Secondary: “Also published on Medium / Dev.to” as chips
3. Never imply on-site URL is external

---

## Content backlog — articles worth writing (suggestions)

Prioritize posts that **prove senior/staff judgment** on problems you’ve already shipped (Tekion MFE, Lifesight MMM/agentic UI, GovTech maps). Prefer **one strong on-site canonical** + optional crosspost over thin stubs.

### Tier A — High signal, fits existing on-site voice (JavaScript series)

| Title | Angle | Est. read | Why it helps hiring |
|-------|-------|-----------|---------------------|
| **Closures Without the Magic Trick** | Lexical scope, stale closures in React hooks, fix patterns | 12 min | Complements Fundamentals + `this` — shows depth beyond buzzwords |
| **Immutability in React: When Copying Hurts** | Structural sharing, Immer, when to normalize state | 14 min | Daily React craft; links to dashboard work |
| **Parsing the Event Loop for UI Engineers** | Tasks, microtasks, `requestAnimationFrame`, INP | 10 min | Bridges perf articles and real jank debugging |
| **TypeScript at the Boundaries** | API types, `unknown`, narrowing for MFE contracts | 15 min | Staff-level typing for federated modules |
| **Testing Hooks and Async UI** | RTL, fake timers, streaming partial responses | 12 min | Pairs with Playwright/Lighthouse CI story |

### Tier B — Production war stories (tie to `#projects`)

| Title | Angle | Est. read | Maps to project card |
|-------|-------|-----------|----------------------|
| **Shipping Module Federation to 50k DAU** | Version policy, rollback, observability | 18 min | Microfrontend Architecture |
| **Lighthouse CI That Engineers Don’t Hate** | PR comments, budgets, false positives | 12 min | Performance CI Guard |
| **Design Tokens Across 10 Microfrontends** | Shared package, drift, Storybook | 14 min | Enterprise Component Library |
| **SSR for Charts: What We Cached and What We Didn’t** | Next.js data fetching, waterfall kills | 16 min | Marketing Intelligence Dashboard |
| **Offline-First UX for Dealer Floors** | SQLite sync, conflict UI, optimistic updates | 14 min | Dealer Operations Mobile App |
| **Anomaly Cards vs Alert Fatigue** | Changepoint → LLM copy → inline surfacing | 12 min | Attribution Anomaly Intelligence |

### Tier C — Opinionated / shorter (good for pipeline → quick publish)

| Title | Angle | Est. read |
|-------|-------|-----------|
| **Stop Calling map() Functional Programming** | Extend Fundamentals thesis — 800 words | 5 min |
| **Recruiter Mode on a Static Site** | Meta post on this portfolio’s `#rm` UX | 8 min |
| **When Canvas Hero Effects Are Worth It** | `visuals.js` decision log | 6 min |
| **Five Questions I Ask Before Adding a Chart** | MMM dashboard product sense | 7 min |
| **Crossposting Without SEO Cannibalization** | canonical, `rel`, on-site vs Medium | 6 min |

### External-only candidates (link from “Published elsewhere”)

| Topic | Platform fit | Note |
|-------|----------------|------|
| Everything You Need to Know About `this` | HackerNoon (live) | Keep as external flagship; series-link to on-site `this` deep-dive |
| MMM for Frontend Engineers (primer) | Medium / Dev.to | High recruiter search volume |
| Building Internal Design Systems That Survive Acquisitions | Medium | Enterprise narrative |
| Geospatial Dashboards at State Scale | Dev.to | Kerala-WRIS angle without leaking sensitive data |

**Series packaging:** Brand on-site posts as **“JavaScript, honestly”** (Fundamentals → Closures → `this` → Event loop). Add `.article-series` footer on every part.

---

## Content backlog — open-source projects worth building

Small, **shippable** repos that reinforce `#projects` claims and give writing something concrete to link. Each should have: README with problem statement, MIT license, one screenshot or terminal GIF, and a demo URL or `npx` entry if applicable.

### Tier 1 — Directly evidences portfolio bullets (build first)

| Project | One-liner | Stack | Proves |
|---------|-----------|-------|--------|
| **`mfe-shared-deps-doctor`** | CLI that scans Module Federation configs for version skew and duplicate React | Node, JSON schema | MFE at scale |
| **`lhci-pr-commenter`** | Reusable GitHub Action: Lighthouse delta table + bundle diff in PR body | GH Actions, Node | Performance CI Guard |
| **`perf-budgets.json`** | Opinionated preset budgets for dashboard/SPA routes (LCP/INP/CLS thresholds) | JSON + docs | Performance culture |
| **`react-streaming-ui`** | Headless hooks + demo UI for token streaming + abort + tool-call steps | React, TS | Mia / agentic UI |
| **`static-recruiter-brief`** | Extract of this site’s recruiter mode as embeddable script + docs | Vanilla JS | Recruiter-first portfolio |

### Tier 2 — Teaching / community (pairs with Tier A articles)

| Project | One-liner | Stack | Pairs with article |
|---------|-----------|-------|-------------------|
| **`fp-js-katas`** | Tiny runnable katas: pure functions, compose, pipe (no framework) | Node or browser | Fundamentals / Closures |
| **`this-binding-lab`** | Interactive page: four rules with live `console` output | Vanilla JS | How Well Do You Know `this` |
| **`hook-closure-lint`** | ESLint rule pack for missing deps / stale closures in hooks | ESLint, TS | Closures article |
| **`event-loop-viz`** | Visual microtask vs macrotask queue for talks | Canvas or DOM | Event loop article |

### Tier 3 — Design systems & a11y (medium effort, high credibility)

| Project | One-liner | Stack | Proves |
|---------|-----------|-------|--------|
| **`dense-table-a11y`** | Reference data table with virtualization + screen reader tests | React, RTL, axe | Enterprise tables |
| **`storybook-contrast-addon`** | Storybook addon: WCAG contrast on token swatches | Storybook, TS | Design system |
| **`focus-trap-audit`** | Dev-only overlay listing focus order in modals/wizards | React | WCAG 2.1 work |

### Tier 4 — Portfolio meta (dogfood)

| Project | One-liner | Stack | Note |
|---------|-----------|-------|------|
| **`portfolio-theme-tokens`** | Export this site’s multi-theme CSS variables as npm package | CSS | After multi-theme ships |
| **`eggs-tier-loader`** | Minimal device-tier lazy loader pattern extracted from `eggs-*.js` | JS | Documented in architecture prompt |
| **`og-resume-validator`** | CLI checks resume.pdf page count, fonts, ATS-parseable text layer | Node | Recruiter polish |

**Portfolio integration when a repo ships:**

1. Add `.pc` card under `#projects` (or subsection “Open source”) with GitHub + demo links.  
2. Move matching pipeline row from **Draft** → published article or **README deep-dive**.  
3. Add npm/GitHub star badge only if real — no vanity counts.

**Anti-patterns for OSS:** todo-app clones, blockchain tutorials, unmaintained “awesome-list” repos, wrappers with no opinion.

---

## Phase 4 — CSS file map (`site.css`)

Add/refactor a dedicated block after `/* ── Writing ── */`:

| Class | Purpose |
|-------|---------|
| `.writing-intro`, `.writing-subhead` | Section hierarchy |
| `.articles-list--on-site`, `.articles-list--external` | Optional modifiers |
| `.article-item--featured` | Featured on-site post |
| `.article-item:hover` | Project-like hover |
| `.ext-icon` | Hide when `a[href^="/"]` without `target="_blank"` (or remove from HTML) |
| `.writing-list--pipeline` | Dashed pipeline container |
| `.wi-badge--draft` etc. | Status colors |
| `.article-cta`, `.article-author`, `.article-series`, `.article-title-code` | Article page |
| `.article-progress` | Optional reading bar |

**Dark theme:** verify pipeline dashed border and badge contrast in `[data-theme="dark"]`.

---

## Files to touch

| File | Changes |
|------|---------|
| `index.html` | `#writing` restructure, pipeline rows, read times, link icons |
| `assets/site.css` | Writing + article premium styles |
| `fundamentals-of-functional-javascript/index.html` | Header, CTA classes, content/ledger |
| `how-well-do-you-know-this/index.html` | Header, remove inline title styles, series nav |
| `assets/nav.js` | Optional: reading progress only |
| `sitemap.xml` | Only if new routes |
| `.claude/prompts/portfolio-architecture-prompt.md` | If routes/sections change |

---

## Verification checklist

### Homepage `#writing`

- [ ] On-site articles: no ↗ icon; internal navigation works
- [ ] External HackerNoon: ↗ + `target="_blank"`
- [ ] Hover matches project cards (no full orange row fill)
- [ ] Pipeline: 6–8 rows, varied badges, readable at 320px
- [ ] “Find me on” chips scroll horizontally on mobile without layout break
- [ ] No horizontal overflow at 320px

### Article pages

- [ ] Header stacks vertically at 320px and 1280px — no overlap
- [ ] Breadcrumb + theme toggle + resume still usable
- [ ] Prose `code` / `pre` readable in dark mode
- [ ] CTA buttons ≥ 44px touch target
- [ ] No inline `style=""` left on article templates (move to CSS)

### SEO / a11y

- [ ] Article JSON-LD unchanged or improved (`dateModified` if content edited)
- [ ] Badge spans have `aria-label="Status: Draft"` (etc.)
- [ ] Heading order: one `h1` per article page

---

## Anti-patterns

- Loading recruiter / visuals / contact on article routes
- Invented publication dates or fake Medium read counts
- Claiming pipeline posts are “published”
- Adding npm/build step for MDX/blog framework without explicit owner request
- Neon gradients, fake “AI writing” tropes, or stock hero images
- Duplicating `#rm-promo` or recruiter chrome on articles

---

## Suggested commit plan

1. `portfolio: restructure writing section with on-site vs external lists`
2. `portfolio: premium writing and pipeline styles; fix article card hover`
3. `portfolio: fix article headers and on-site link affordances`
4. `portfolio: expand pipeline copy and badge variants`
5. `portfolio: replace article inline styles with shared CSS components`

---

## Execution order

1. Run **Phase 0** audit table.  
2. **Phase 1–2** homepage markup + pipeline copy + CSS.  
3. **Phase 3** article pages (headers first, then CTA/author components).  
4. **Phase 4** optional reading progress / featured card.  
5. Update **architecture prompt** if structure changed.

**Quality bar:** Writing section feels like the same product as Projects — a staff engineer would pin one on-site article and respect the pipeline as real work, not placeholder lorem.

**Content bar:** Prefer adding **one** Tier A on-site article or **one** Tier 1 OSS repo per quarter over inflating pipeline rows without shipping.
