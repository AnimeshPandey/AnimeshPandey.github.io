# Agent prompt — Casebook core platform (Phase 1)

**Canonical copy:** `ideas/projects/case-studies/prompts/01-core-platform-generation-prompt.md`  
**Portfolio copy:** `AnimeshPandey.github.io/.claude/prompts/casebook-core-platform-generation-prompt.md`  
**Target repo:** `AnimeshPandey.github.io` · **Output path:** `cases/` · **URL:** `https://anmshpndy.com/cases/`  
**Human checklist:** [../phases/01-core-platform.md](../phases/01-core-platform.md)  
**Architecture:** [../PLATFORM-ARCHITECTURE.md](../PLATFORM-ARCHITECTURE.md)

---

## Your role

You are a **staff frontend engineer + technical architect** implementing **The Frontend Casebook** Phase 1: a **manifest-driven, static Eleventy platform** with one **production-quality flagship case**, built to scale to **223 cases** without architectural rewrites.

**North star:** A visitor on any device can open the hub, launch the skeleton-screens case, switch junior/mid/staff tone, scroll chapters, use the interactive demo, and get hints from **Casey** — with Lighthouse mobile **perf ≥85**, **a11y ≥95**, **SEO ≥95**, and **zero console errors**.

**You are not** bulk-generating 223 cases, adding a backend, or importing React/Next/Astro for the Casebook app.

---

## Read order (before writing code)

1. [../PLATFORM-ARCHITECTURE.md](../PLATFORM-ARCHITECTURE.md) — layers, boundaries, anti-patterns  
2. [../GLOBAL-FOUNDATION.md](../GLOBAL-FOUNDATION.md) — class names, events, storage keys  
3. [../HOSTING-AND-GROWTH.md](../HOSTING-AND-GROWTH.md) — devices, SEO, `site.json`  
4. [../DECISIONS.md](../DECISIONS.md) · [../BRANDING.md](../BRANDING.md)  
5. [../phases/01-core-platform.md](../phases/01-core-platform.md) — scope & DoD  
6. [../ELEVENTY-SCAFFOLD.md](../ELEVENTY-SCAFFOLD.md)  
7. [../CASE-TEMPLATE.md](../CASE-TEMPLATE.md) · [../AUDIENCE-TONE.md](../AUDIENCE-TONE.md)  
8. [../MASCOT-CASEY.md](../MASCOT-CASEY.md) · [../assets/casey/CASEY-GENERATION-PLAYBOOK.md](../assets/casey/CASEY-GENERATION-PLAYBOOK.md) · [../assets/casey/casey-interactions.json](../assets/casey/casey-interactions.json)  
9. [../00-GROWTH-DESIGN-ANALYSIS.md](../00-GROWTH-DESIGN-ANALYSIS.md) — story beat rhythm  
10. Flagship track row: [../tracks/01-psychology-perception.md](../tracks/01-psychology-perception.md)

Copy `manifest.json` into `cases/src/_data/`:

```bash
python3 ideas/projects/case-studies/scripts/merge-tracks-to-manifest.py \
  > AnimeshPandey.github.io/cases/src/_data/manifest.json
```

---

## Paste block (Cursor / Claude Code)

```text
Implement The Frontend Casebook — PHASE 1 CORE PLATFORM ONLY.

ROLE: Staff FE architect. Build a scalable static foundation + one flagship case.
Do NOT bulk-generate other cases. Do NOT add backend, React, or Next.js.

READ (in order):
- ideas/projects/case-studies/PLATFORM-ARCHITECTURE.md
- ideas/projects/case-studies/GLOBAL-FOUNDATION.md
- ideas/projects/case-studies/HOSTING-AND-GROWTH.md
- ideas/projects/case-studies/phases/01-core-platform.md
- ideas/projects/case-studies/prompts/01-core-platform-generation-prompt.md (full spec)

TARGET: AnimeshPandey.github.io/cases/ — Eleventy 11, pathPrefix from site.json (/cases/)

FLAGSHIP (only live case):
- slug: skeleton-screens-perceived-speed
- title: Why Skeleton Screens Beat Spinners
- track: psychology-perception
- demoType: animation (spinner vs skeleton, layout stability)

DELIVERABLES:
1. Eleventy project under cases/ per PLATFORM-ARCHITECTURE.md tree
2. Hub /cases/ — manifest grid; ONE live link; coming-soon cards WITHOUT href
3. /cases/about/ — methodology, Casey, Growth.Design credit
4. /cases/skeleton-screens-perceived-speed/ — full Growth.Design-style scroll case
5. Shared: casebook.css (tokens/layout/components), case-scroll.js, casey-coach.js,
   casey-voice.js (module), demo-loader.js + demos/skeleton-screens-perceived-speed.js
6. Casey: 12 SVG placeholders (3 tiers × 4 poses), casey.json for flagship
7. Build outputs: sitemap.xml, feed.xml, robots.txt (live pages only)
8. Portfolio homepage CTA → /cases/
9. Verification report: Lighthouse mobile + device QA summary

ARCHITECTURE RULES (non-negotiable):
- One case-layout.njk for all cases; flagship content in cases/{slug}/index.njk
- site.json drives url/pathPrefix — zero hardcoded canonical hosts in templates
- liveCases collection — only status:live get permalinks and sitemap entries
- Event bus: casebook-tone-change — case-scroll dispatches; casey-coach listens
- Progressive enhancement: demo + story readable without JS
- Mobile-first: casey-coach--dock-bottom <768px; touch targets ≥44px
- No portfolio SW, visuals.js, recruiter, eggs on /cases/*
- CSS class names exactly as GLOBAL-FOUNDATION.md (do not rename)
- BEM partials; no inline business logic in Nunjucks

QUALITY GATES:
- Lighthouse mobile: perf ≥85, a11y ≥95, SEO ≥95
- prefers-reduced-motion honored
- Casey voice opt-in only; cancel speech on tone change
- iOS Safari + Android Chrome smoke-tested

When done: list file tree, note any intentional Phase 2 deferrals, paste Lighthouse scores.
```

---

## Architecture requirements

### Scalability

| Requirement | Implementation |
|-------------|----------------|
| 223 cases | `manifest.json` + pagination collection; one `case-layout.njk` |
| New case = content + optional demo module | No new layout forks |
| Domain migration | Change `site.json` only + 301 rules later |
| Track hubs (Phase 3+) | `groupBy` manifest on `track` — same layout family |

### Readability

| Requirement | Implementation |
|-------------|----------------|
| CSS | Split: `tokens` / `layout` / `components`; single `casebook.css` import |
| JS | One responsibility per file; IIFE or ES module with idempotent `init` |
| Templates | `layouts/` vs `partials/` vs `demos/` markup separation |
| Data | `site.json`, `manifest.json`, `casey.json` — no magic strings in JS |

### Reusability

| Component | Reused on |
|-----------|-----------|
| `casebook-layout.njk` | hub, about, every case |
| `head-seo.njk` | all pages (params: title, description, schema) |
| `case-tone-switcher.njk` | every case |
| `casey-coach.njk` | every case |
| `case-demo-shell.njk` | every case with `demoType` |
| `case-footer.njk` | every case |

### Design principles (enforce in PR)

1. **Static-first** — HTML carries content; JS enhances.  
2. **Data-driven URLs** — `{{ '/…' \| url }}` and `site.url` only.  
3. **Loose coupling** — custom events, not cross-imports between scroll/coach/voice.  
4. **Accessible by default** — skip link, focus rings, `aria-pressed` on tone, `aria-live` on Casey bubble.  
5. **Performance budget** — defer non-critical JS; SVG Casey; WebP images with dimensions.  
6. **Honest indexing** — no `href` for non-live cases; no sitemap entries for stubs.

Full layer diagram: [../PLATFORM-ARCHITECTURE.md](../PLATFORM-ARCHITECTURE.md).

---

## `site.json` (create first)

```json
{
  "name": "The Frontend Casebook",
  "shortName": "Casebook",
  "url": "https://anmshpndy.com/cases/",
  "origin": "https://anmshpndy.com",
  "pathPrefix": "/cases/",
  "subtitle": "Scrollable frontend case studies — junior to staff, with demos and Casey.",
  "tagline": "Visual case studies for frontend and agent UI engineering.",
  "locale": "en",
  "phase": "portfolio-subpath",
  "author": {
    "name": "Animesh Pandey",
    "url": "https://anmshpndy.com/"
  }
}
```

---

## `.eleventy.js` requirements

```javascript
const site = require("./src/_data/site.json");
const manifest = require("./src/_data/manifest.json");

module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("src/assets");
  eleventyConfig.addPassthroughCopy({ "src/cases/**/images": "cases" });
  eleventyConfig.addPassthroughCopy({ "src/cases/**/casey.json": "cases" });

  eleventyConfig.addCollection("liveCases", () =>
    manifest.cases.filter((c) => c.status === "live")
  );

  eleventyConfig.addFilter("jsonLd", (obj) =>
    JSON.stringify(obj).replace(/</g, "\\u003c")
  );

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data",
    },
    pathPrefix: site.pathPrefix || "/cases/",
    htmlTemplateEngine: "njk",
    dataTemplateEngine: "njk",
  };
};
```

Add `casebookUrl` filter if needed — prefer built-in `url` filter with `pathPrefix`.

---

## Pages specification

### Hub (`src/index.njk`)

- Hero: brand, subtitle, link to about  
- Filter: track `<select>` (client-side filter on `data-track`)  
- Grid: `{% for case in manifest.cases %}`  
  - `live` → `<a href="{{ case.slug | url }}">`  
  - else → `<article class="case-card case-card--soon">` **no anchor**  
- Card meta: title, track label, readMin, flagship ★ if `flagship`  
- JSON-LD: `WebSite` + `SearchAction` pointing to hub filter  

### About (`src/about.njk`)

- Methodology, tone switcher explanation, Casey intro  
- Growth.Design credit ([BRANDING.md](../BRANDING.md))  
- Author E-E-A-T blurb + link to portfolio  

### Flagship case (`src/cases/skeleton-screens-perceived-speed/index.njk`)

**Chapters** (each `section.case-chapter` with `data-chapter="{id}"`):

| `data-chapter` | Content |
|----------------|---------|
| `hook` | User pain — waiting feels endless |
| `concept` | Labor perception / perceived performance |
| `story-1` | Bad pattern: spinner only |
| `story-2` | Better: skeleton preserving layout |
| `ui-strip` | Annotated fake dashboard loading state |
| `demo` | Include `case-demo-shell` + demo partial |
| `fe-depth` | Implementation notes (CSS, React Suspense boundary mention in staff tone) |
| `references` | Links from [REFERENCES.md](../REFERENCES.md) — mid/staff visible by tone |
| `takeaway` | 3 bullets |

**Every chapter:** three blocks `.tone-junior`, `.tone-mid`, `.tone-staff` (mid/staff `hidden` by default; `case-scroll.js` toggles).

**Related:** 2 manifest slugs as stubs (`font-loading-cls`, `fake-loading-progress`) — links only if live, else plain text “Coming soon”.

### `casey.json` (flagship)

Use the sample in [../phases/01-core-platform.md](../phases/01-core-platform.md) — minimum hints for `hook` and `demo`, one anecdote on `concept`, voice on `hook`.

Expose to JS via:

```html
<script type="application/json" id="casey-data">{{ casey | jsonLd | safe }}</script>
```

(passed from 11ty data after reading `casey.json`)

---

## JavaScript specifications

### `case-scroll.js`

- Read `localStorage.casebook-tone` (default `junior`)  
- Wire `.case-tone button[data-tone]` → set `aria-pressed`, show/hide tone blocks, save storage, dispatch `casebook-tone-change`  
- `IntersectionObserver` on `.case-chapter` → add `.is-visible` (skip animations if PRM)  
- Optional thin progress bar `aria-hidden="true"`  
- Export nothing; no global except optional `window.casebook` debug namespace behind `?debug=1` only  

### `casey-coach.js`

- Read `#casey-data` JSON  
- On chapter visible → update bubble from `hints` for active tone  
- On `casebook-tone-change` → swap avatar `src` path `/cases/assets/casey/{tier}/{pose}.svg` via `url` base from `<html data-asset-base>`  
- Implement poses per [casey-interactions.json](../assets/casey/casey-interactions.json): idle, perk on chapter enter, point when demo in view, celebrate on demo fix  
- PRM → `data-casey-state="sleep"`, disable blink timer  
- Mobile: ensure `.casey-coach--dock-bottom` applied under 768px  

### `casey-voice.js` (module)

- Button `.casey-coach__voice` → speak current chapter `voice.sections` for active tone  
- `speechSynthesis.cancel()` on tone change  
- No auto-play  

### `demo-loader.js`

```javascript
const root = document.querySelector('.case-demo[data-demo-slug]');
if (!root) return;
const slug = root.dataset.demoSlug;
import(`./demos/${slug}.js`)
  .then((m) => m.initDemo(root, root.dataset))
  .catch(console.error);
```

### `demos/skeleton-screens-perceived-speed.js`

- Export `initDemo(root, { demoType })`  
- Toggle: “Broken (spinner)” vs “Fixed (skeleton)”  
- Broken: centered spinner + delayed content pop-in (intentionally painful)  
- Fixed: skeleton blocks matching final layout → content fade  
- PRM: instant state swap, no spin animation  
- Touch-friendly buttons ≥44px  

---

## CSS specifications

Import portfolio `theme.css` first, then:

```html
<link rel="stylesheet" href="{{ '/assets/css/casebook.css' | url }}" />
```

**`casebook.css`:**

```css
@import 'casebook-tokens.css';
@import 'casebook-layout.css';
@import 'casebook-components.css';
```

**Layout:**

- `.case-scroll` max-width ~65ch on mobile; grid with aside at `min-width: 768px`  
- Hub: CSS grid `repeat(auto-fill, minmax(min(100%, 280px), 1fr))`  
- Safe-area padding on fixed Casey dock  

**Components:**

- `.case-tone` — segmented control; `aria-pressed` styling  
- `.case-demo` — bordered sandbox; clear focus states  
- `.casey-coach--dock-bottom` — `position: fixed; bottom: 0; left: 0; right: 0; z-index: 20`  

Use existing tokens: sage accent `#5a7a5e`, warm paper background.

---

## SEO specifications

Partial `head-seo.njk` accepts:

```njk
{% set seo = {
  title: title + ' · The Frontend Casebook',
  description: description,
  canonical: page.url | url | absoluteUrl(site.url),
  ogImage: ogImage,
  schema: schemaObject
} %}
```

| Page | `schema` type |
|------|----------------|
| Hub | `WebSite` |
| About | `AboutPage` |
| Case | `Article` or `LearningResource` + `BreadcrumbList` |

Generate `sitemap.njk`, `feed.njk`, `robots.njk` per [HOSTING-AND-GROWTH.md](../HOSTING-AND-GROWTH.md).

**Title pattern:** lead with specific problem, not brand alone.

---

## Casey assets (Phase 1 minimum)

12 SVG placeholders (simple vector shapes OK):

- `assets/casey/{junior,mid,staff}/{idle,point,think,celebrate}.svg`  
- `width`/`height` on `<img>`; meaningful `alt`  
- Replace later via [CASEY-GENERATION-PLAYBOOK.md](../assets/casey/CASEY-GENERATION-PLAYBOOK.md)  

---

## CI / deploy

- `npm run build` in `cases/` produces `_site/`  
- Integrate with existing GitHub Actions static deploy  
- Copy or publish `_site` to path served as `/cases/` on `anmshpndy.com`  
- Document build command in `cases/README.md`  

---

## Definition of done (verify before claiming complete)

- [ ] Hub loads; only flagship is clickable; coming-soon has no URL  
- [ ] Flagship: all chapters, three tones, demo, references, related, footer credit  
- [ ] Tone persists on reload; Casey tier + hints + voice follow tone  
- [ ] Demo works on mobile touch; noscript shows fixed state  
- [ ] Casey dock on narrow viewport; aside on desktop  
- [ ] sitemap + feed + robots valid XML  
- [ ] Rich Results Test passes on flagship Article schema  
- [ ] Lighthouse mobile thresholds met  
- [ ] No portfolio SW registered on case pages  
- [ ] `cases/README.md` explains build, manifest refresh, architecture link  

---

## Out of scope (defer explicitly)

- Cases beyond `skeleton-screens-perceived-speed`  
- 24 extra Casey poses (Phase 2)  
- Track hub pages (optional stub only)  
- Paywall / Pro  
- `principles/{slug}` SEO hubs  
- Eleventy bundler / TypeScript / React islands  

---

## Output format (when reporting to user)

1. **File tree** (new/changed under `cases/`)  
2. **Architecture adherence** — one paragraph confirming PLATFORM-ARCHITECTURE patterns  
3. **Lighthouse** table (mobile flagship + hub)  
4. **Device QA** — pass/fail per HOSTING matrix  
5. **Phase 2 deferrals** — bullet list  

---

## Related prompts

| Prompt | When |
|--------|------|
| [BUILD-ONE-SHOT.md](../BUILD-ONE-SHOT.md) | Phase 3+ bulk cases **after** this platform ships |
| Portfolio [portfolio-core-web-vitals-seo-prompt.md](../../../../AnimeshPandey.github.io/.claude/prompts/portfolio-core-web-vitals-seo-prompt.md) | Homepage only — not case routes |
