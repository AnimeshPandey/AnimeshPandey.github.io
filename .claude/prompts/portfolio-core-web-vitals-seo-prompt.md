# Claude Prompt — Core Web Vitals & SEO (Maximum Practical Gain)

**Repo:** `AnimeshPandey.github.io`  
**Canonical site:** https://anmshpndy.com  
**Stack:** Static HTML · `assets/theme.css` · `assets/site.css` · vanilla JS · GitHub Pages · **no build step**

**Architecture:** [portfolio-architecture-prompt.md](portfolio-architecture-prompt.md) — layers, SW, file contracts  
**Writing / articles SEO:** [portfolio-writing-polish-prompt.md](portfolio-writing-polish-prompt.md) — Article JSON-LD, sitemap rows, canonicals  
**Layout / CLS:** [portfolio-layout-responsive-themes-prompt.md](portfolio-layout-responsive-themes-prompt.md) — hero overflow, spacing, theme tokens  
**Human reference:** [`docs/ARCHITECTURE.md`](../../docs/ARCHITECTURE.md) — SEO & structured data, service worker

**Out of scope unless owner approves:** npm bundler, image CDN, SSR framework, RUM SaaS beyond existing Cloudflare Web Analytics beacon.

---

## Your role

You are a **staff frontend performance engineer + technical SEO lead** optimizing a **zero-build static portfolio** for **real-user Core Web Vitals** and **discoverability** (Google Search, LinkedIn previews, hiring-manager skim).

**North star:** Green or “good” on [PageSpeed Insights](https://pagespeed.web.dev/) mobile for `https://anmshpndy.com/` **without** removing recruiter mode, hero canvas, or writing depth — optimize, gate, and defer instead.

**Success targets (mobile, field + lab where available):**

| Metric | Target | Priority |
|--------|--------|----------|
| **LCP** | ≤ 2.5 s (good) | P0 |
| **INP** | ≤ 200 ms (good) | P0 |
| **CLS** | ≤ 0.1 (good) | P0 |
| **TTFB** | ≤ 800 ms on GitHub Pages + custom domain | P1 |
| **SEO score (Lighthouse)** | ≥ 95 | P1 |
| **Accessibility** | ≥ 95 (do not trade away for perf) | P0 |

Document **before/after** numbers in the PR or session summary. If a change regresses one metric, revert or gate it.

---

## Constraints (non-negotiable)

1. **No build step** — optimizations must work as plain files in repo root (optional: document a *manual* one-off script for image compression; do not require it in CI unless owner asks).
2. **Canonical host** — every URL, OG tag, JSON-LD `@id`, and sitemap `<loc>` use `https://anmshpndy.com/` (trailing slash on directory URLs).
3. **Progressive enhancement** — site readable with JS off; perf work must not break no-JS HTML.
4. **`profile-facts.js` authority** — metrics in JSON-LD / FAQ must match visible copy (see architecture content order).
5. **Service worker** — bump `sw.js` `CACHE` when precached assets change; keep **network-first** for HTML and `contact.js` (deploy-injected secrets).
6. **Third-party budget** — Google Fonts + Cloudflare beacon only; defer or gate anything new.
7. **Minimal diff** — smallest change that moves a metric; no unrelated refactors.

---

## Phase 0 — Baseline audit (required before coding)

Run and paste a summary table (mobile + desktop):

```bash
# From repo root (optional local server for relative checks only)
npx serve -l 8181 .
```

| Tool | URL / command | Capture |
|------|---------------|---------|
| PageSpeed Insights | `https://anmshpndy.com/` | LCP, INP, CLS, opportunities |
| Lighthouse (CLI or DevTools) | Homepage + 1 article + 404 | Performance, SEO, A11y |
| Rich Results Test | Homepage + each article | JSON-LD validity |
| Search Console | Property `anmshpndy.com` | Coverage, CWV report (if owner shares) |

**Per-page inventory:**

| Page | LCP element (likely) | Heavy JS | In sitemap? | Article schema? |
|------|----------------------|----------|-------------|-----------------|
| `/` | `.hero-name` or web font | `visuals.js`, canvas, SW | ✅ | Person, WebSite, FAQPage |
| `/fundamentals-of-functional-javascript/` | H1 / font | `theme.js`, `nav.js` only | ✅ | Article + Breadcrumb |
| `/how-well-do-you-know-this/` | H1 / font | same | ✅ | same |
| `/streaming-agent-ui-without-chatbot-clipart/` | H1 / hero image? | same | ✅ if live | Article |
| `/404.html` | — | chrome only | optional | noindex? |

**Output:** ranked list of top 5 fixes by **impact × effort** before implementation.

---

## Phase 1 — LCP (Largest Contentful Paint)

### Likely LCP on homepage

- `.hero-name` (serif) or `.hero-tagline` — both depend on **Google Fonts** (render-blocking stylesheet today).
- Not the canvas (usually not LCP unless hero text is delayed).

### Fix menu (pick in order until LCP is good)

| # | Change | Files | Notes |
|---|--------|-------|-------|
| 1.1 | **Preconnect** already present — add `rel="preload"` for critical font files (woff2 URLs from CSS) or subset to **one** display + **one** sans weight for above-fold | `index.html`, article heads | Keep total font payload &lt; 100 KB woff2 if possible |
| 1.2 | **`font-display: swap`** on `@font-face` if self-hosting; for Google Fonts use `&display=swap` (verify in link URL) | `theme.css` or font link | Reduces invisible text delay; pair with `size-adjust` fallback stack to limit CLS |
| 1.3 | **Reserve hero space** — explicit `min-height` on `.hero-text` / line-height ≥ 1.05 so layout doesn’t jump when fonts load | `site.css` | Coordinates with layout prompt |
| 1.4 | **`fetchpriority="high"`** on nothing below fold; avoid lazy-loading hero text | `index.html` | |
| 1.5 | **Self-host fonts** (optional, larger diff) — download woff2 to `/assets/fonts/`, `@font-face` in `theme.css`, remove Google CSS link | `theme.css`, `assets/fonts/`, all HTML heads | Best LCP win; update SW precache |
| 1.6 | **Defer non-critical CSS** — split `site.css` only if measured win (usually skip on small site) | — | Last resort |

### Articles

- Same font strategy on `*/index.html` heads — **keep article heads in sync** with homepage.
- LCP target: **article H1** — avoid large images above title without `width`/`height`.

---

## Phase 2 — CLS (Cumulative Layout Shift)

| Source | Fix |
|--------|-----|
| Web fonts | `font-display: swap` + matched fallback metrics (`size-adjust` / fallback stack close to DM Serif / Plus Jakarta) |
| Hero entrance animations (`translateY`, fade) | Disable or shorten when `prefers-reduced-motion`; don’t animate layout-affecting properties on LCP element |
| `#hero-canvas` | Fixed dimensions on container; `aspect-ratio` or explicit `height` so canvas doesn’t collapse |
| Recruiter panel open | Panel is overlay — ensure `body` scroll lock doesn’t shift layout; use `scrollbar-gutter: stable` on `html` if needed |
| Images | `width` + `height` on `og-image` references; any `<img>` gets explicit dimensions |
| Dynamic inserts | Toast, form success, promo card — reserve min-height or use `transform` only |
| Theme change | `theme-transitioning` should not reflow hero grid (opacity/color only) |

**Verify:** Lighthouse CLS + manual slow-3G filmstrip on homepage load and theme toggle.

---

## Phase 3 — INP (Interaction to Next Paint)

Homepage loads **`visuals.js`** (~700+ LOC) + canvas loop + many listeners.

| # | Change | Files |
|---|--------|-------|
| 3.1 | **Gate canvas** — already capability-based; tighten: no `requestAnimationFrame` on `saveData`, low memory, `prefers-reduced-motion` | `visuals.js` |
| 3.2 | **Defer non-critical init** — `requestIdleCallback` or `setTimeout(0)` for eggs, promo card, theme wink after first paint | `visuals.js` |
| 3.3 | **Passive listeners** — `{ passive: true }` on scroll/touch where preventDefault isn’t needed | `nav.js`, `visuals.js` |
| 3.4 | **Break up long tasks** — chunk recruiter scan animation if &gt; 50 ms blocks | `recruiter.js` |
| 3.5 | **Article pages** — keep **no** `visuals.js`; verify nav scroll-spy isn’t over-firing (throttle rAF) | `nav.js` |
| 3.6 | **Third-party** — load CF beacon with `defer` after first paint if INP regresses (measure first) | all `*.html` |

---

## Phase 4 — Technical SEO (crawl, index, snippets)

### 4.1 On-page (all HTML)

| Check | Action |
|-------|--------|
| Unique `<title>` + meta description | Per route; hiring keywords on homepage; article-specific on posts |
| `<link rel="canonical">` | Absolute `https://anmshpndy.com/...` |
| `lang="en-IN"` on `<html>` | Keep consistent |
| Heading hierarchy | One `h1` per page; logical `h2` sections |
| Internal links | Homepage → articles; articles → series cross-links; footer sitemap discipline |
| `rel=me` | GitHub, LinkedIn, X — already in head |
| Avoid keyword stuffing | Trim redundant `meta keywords` if it duplicates title (low SEO value, optional remove) |

### 4.2 Structured data (`application/ld+json`)

| Type | Page | Rules |
|------|------|-------|
| `Person`, `WebSite`, `ProfilePage`, `FAQPage` | `index.html` | FAQ answers match visible FAQ; dates align with timeline |
| `Article` + `BreadcrumbList` | Each article | `headline`, `datePublished`, `dateModified`, `author`, `image`, `mainEntityOfPage` |
| `BlogPosting` vs `Article` | Pick one type site-wide | Be consistent |
| Validate | [Rich Results Test](https://search.google.com/test/rich-results) | Fix all errors |

### 4.3 Discovery files

| File | Action |
|------|--------|
| `sitemap.xml` | All public routes; sensible `lastmod`; include new articles within 24 h of publish |
| `robots.txt` | `Allow: /` + `Sitemap: https://anmshpndy.com/sitemap.xml` |
| `site.webmanifest` | `name`, `short_name`, icons, `theme_color` match tokens |
| `404.html` | Helpful links; `noindex` meta if not already |

### 4.4 Social previews

- OG image: `/assets/og-image.png` — **1200×630**, &lt; 300 KB if possible (compress once).
- `og:url` must match canonical.
- Twitter `summary_large_image` on all indexable pages.

### 4.5 Cross-post / canonical discipline

- On-site canonical wins over Medium/Dev.to for duplicated essays.
- External-only posts: link from `#writing` with `rel="noopener"`; no duplicate full body on-site without canonical strategy (see writing prompt).

---

## Phase 5 — Service worker & caching (perf + SEO)

Current model (`sw.js`):

- HTML: **network-first** (good for freshness + injected meta keys).
- Assets: cache-first (good for repeat visits; risk stale JS — mitigated by `CACHE` bump + `contact.js` network-first).

| Action | When |
|--------|------|
| Bump `CACHE` (`ap-vNN`) | Any precached JS/CSS/font change |
| Do **not** precache huge optional assets | Skip full og-image if &gt; 500 KB unless needed offline |
| Consider **stale-while-revalidate** for CSS only | Optional micro-optimization |
| Articles | **Do not** register SW (already correct) — keeps article LCP simple |

---

## Phase 6 — Images & static assets

| Asset | Action |
|-------|--------|
| `assets/og-image.png` | Compress (pngquant or similar); confirm dimensions in meta |
| `favicon.svg` | Keep small; already SVG |
| Future hero photos | WebP/AVIF + `width`/`height` + `loading="lazy"` except LCP candidate |
| `resume.pdf` | Link from homepage; optional sitemap entry `priority` 0.6 — owner decision |

---

## Phase 7 — Security / crawl hygiene (SEO adjacency)

| Item | Action |
|------|--------|
| HTTPS | Enforced via GitHub Pages + custom domain |
| `mixed content` | None — all `https` assets |
| Honeypot on form | Already present — keep |
| Public Web3Forms key | OK with domain restriction in Web3Forms dashboard |
| Headers | GitHub Pages limited — document reliance on meta tags |

---

## Phase 8 — Measurement & regression guardrails

### Manual checklist (every perf PR)

- [ ] PageSpeed mobile: LCP, INP, CLS documented before/after
- [ ] Lighthouse Performance + SEO on `/` and one article
- [ ] Rich Results Test: no errors on homepage + articles
- [ ] Visual check: hero not clipped; theme toggle works; recruiter mode works
- [ ] `prefers-reduced-motion`: no canvas; reduced animations
- [ ] Form still submits (Web3Forms meta + `contact.js`)
- [ ] `sw.js` `CACHE` bumped if precache list changed
- [ ] `sitemap.xml` updated if new route

### Optional CI (owner approval only)

- Lighthouse CI GitHub Action on PR — **do not add** without explicit ask (ideas repo has `lhci-pr-comment` template for future).

---

## File ownership (what to touch)

| Goal | Primary files |
|------|----------------|
| LCP fonts | `index.html`, `*/index.html`, `theme.css` |
| CLS layout | `site.css` (+ layout prompt) |
| INP / JS weight | `visuals.js`, `nav.js`, `recruiter.js` |
| SEO meta / JSON-LD | `index.html`, article `index.html` |
| Discovery | `sitemap.xml`, `robots.txt`, `site.webmanifest` |
| Caching | `sw.js` |
| Deploy secrets (unchanged) | `.github/workflows/static-pages.yml` |

**Do not** edit `docs/` for agent prompts — update `docs/ARCHITECTURE.md` only when architecture changes materially.

---

## Anti-patterns (reject these)

- Adding React/Vite “for performance”
- Lazy-loading the hero H1 or LCP text
- Removing JSON-LD to shrink HTML
- `display: none` on important content for SEO
- Cloaking keywords in hidden divs
- Blocking crawlers in `robots.txt` except intentional staging
- Infinite `requestAnimationFrame` on battery / reduced-motion
- Precaching third-party font CSS in SW (stale + wrong origin)

---

## Suggested implementation order

1. **Phase 0** baseline → pick top 3 wins  
2. **Fonts + hero CLS** (Phases 1–2) — usually biggest lab + field win  
3. **INP gating** on homepage JS (Phase 3)  
4. **Article + sitemap SEO pass** (Phase 4) — parallel with writing prompt  
5. **SW / image compress** (Phases 5–6)  
6. **Re-measure** (Phase 8) and update `docs/ARCHITECTURE.md` CWV notes if targets met  

---

## Deliverables per session

1. **Metrics table** — before/after (mobile PSI minimum).  
2. **Changelog** — bullet list mapped to phases.  
3. **Follow-ups** — only items that need owner action (Search Console verify, font license, Web3Forms domain list).  

---

## Coordination with other prompts

| If you also need… | Use |
|-------------------|-----|
| Writing cards / article layout | `portfolio-writing-polish-prompt.md` |
| Multi-theme contrast | `portfolio-layout-responsive-themes-prompt.md` |
| Header / resume chrome | `portfolio-premium-ux-sections-prompt.md` |
| i18n hreflang | `portfolio-i18n-localization-prompt.md` (adds SEO scope) |

When done, add one line to [README.md](README.md) prompt index and optionally a “Performance” subsection in `docs/ARCHITECTURE.md` pointing to this prompt.
