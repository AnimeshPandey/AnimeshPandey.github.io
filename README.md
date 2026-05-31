# anmshpndy.com

Personal portfolio of Animesh Pandey, Senior Frontend Engineer.

- Live (canonical): **https://anmshpndy.com**
- GitHub Pages origin: **https://animeshpandey.github.io**

---

## Documentation

| Path | Purpose |
|------|---------|
| **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** | Exhaustive technical reference (layers, files, subsystems, deploy, SW, maintainer workflows) |
| **[docs/README.md](docs/README.md)** | Documentation index |
| **[.claude/prompts/](.claude/prompts/)** | Claude/Cursor **implementation prompts** (not under `docs/`) |

---

## Stack

- **Pure HTML / CSS / vanilla JS** — zero build step, zero npm dependencies, repo root = deployable artifact
- **Fonts:** DM Serif Display + Plus Jakarta Sans + JetBrains Mono (Google Fonts)
- **Theming:** dark / light with FOUC prevention (inline `<head>` script + `localStorage`)
- **Navigation:** mobile-first hamburger nav with focus trap, Escape-to-close, and `IntersectionObserver` scroll-spy
- **Hero:** 2D particle canvas (capability-gated), animated fact ticker, card tilt on desktop
- **Recruiter briefing:** lazy-loaded 5-section panel; single source of truth in `profile-facts.js`; `?recruiter=1` deep link
- **Easter eggs:** device-tiered (mobile / tablet / desktop); lazy-loaded per tier; capability-gated Canvas 2D
- **Contact:** Web3Forms POST; in-page success / error only — no programmatic `mailto:` on submit
- **Offline caching:** service worker (`sw.js`) — HTML network-first, assets cache-first
- **Hosting:** GitHub Pages static artifact deploy (no Jekyll, no build)
- **Secrets:** Web3Forms key + Cloudflare beacon token injected by CI at deploy; never committed to repo

---

## Features at a glance

| Feature | Entry point | Notes |
|---------|-------------|-------|
| Dark / light theme | `#theme-toggle` (header) | FOUC-free; persists in `localStorage` |
| Mobile nav | `#hamburger` | Focus trap, Escape closes, overlay dimmer |
| Hero canvas | `visuals.js` | Skipped on `prefers-reduced-motion`, `saveData`, or no `canvas2d` |
| Card tilt | `.pc`, `.sv-card`, `.edu-card` | Fine-pointer only |
| Impact lens | `.pc[data-impact]` | Bar-chart reveal on hover / tap |
| Hire shortcut | Type `hire` (outside inputs) | Scrolls to `#contact` |
| Recruiter mode | Header icon or `?recruiter=1` | Lazy loads 4 JS files; icon-only toggle at all breakpoints |
| Easter egg — M1 | Tap `.badge` (mobile) | Slide-up career snapshot card |
| Easter egg — M2 | Long-press `.stat-n` (mobile) | Canvas 2D sparkline popup |
| Easter egg — T2 | Tap `#skills-heading` (tablet) | Full-screen Canvas 2D skill orbit |
| Easter egg — D1 | Press `?` (desktop) | Skills constellation sphere; 12 s auto-close |
| Easter egg — D2 | Type `npm test` (desktop) | Faux terminal with sequential test output |
| Easter egg — X2 | 5 rapid theme toggles | One-line wink toast (all tiers) |
| Contact form | `#contactForm` | Web3Forms POST; in-page feedback only |

---

## File structure

```
.
├── index.html                          # Homepage (1 236 LOC)
├── 404.html                            # Custom 404 + client redirect map
├── fundamentals-of-functional-javascript/index.html
├── how-well-do-you-know-this/index.html
│
├── assets/
│   ├── theme.css                       # L1 — design tokens (69 LOC)
│   ├── site.css                        # L2 — full site presentation (1 600 LOC)
│   ├── theme.js                        # L3 — theme toggle + FOUC guard (33 LOC)
│   ├── nav.js                          # L3 — mobile nav, scroll-spy, progress bar, #yr (113 LOC)
│   ├── visuals.js                      # L4 — orchestrator, hero canvas, lazy loaders (769 LOC)
│   ├── contact.js                      # L4 — Web3Forms handler, copy-email (184 LOC)
│   ├── profile-facts.js                # L5 data — canonical facts (128 LOC)
│   ├── recruiter-data.js               # L5 data — brief derived from facts (162 LOC)
│   ├── recruiter.js                    # L5 — panel render, focus trap, copy (699 LOC)
│   ├── recruiter.css                   # L5 — panel stylesheet (708 LOC)
│   ├── eggs.css                        # L5 — egg overlay styles, lazy-loaded (241 LOC)
│   ├── eggs-data.js                    # L5 data — sparklines, orbit nodes, terminal (59 LOC)
│   ├── eggs-mobile.js                  # L5 — M1 badge snapshot, M2 sparkline (252 LOC)
│   ├── eggs-tablet.js                  # L5 — T2 skill orbit canvas (264 LOC)
│   ├── eggs-desktop.js                 # L5 — D1 constellation, D2 terminal (330 LOC)
│   ├── og-image.png                    # Social preview raster
│   └── og-image.svg                    # Social preview source art
│
├── sw.js                               # Service worker — CACHE = ap-v21 (75 LOC)
├── resume.pdf · animesh_pandey_resume.tex
├── favicon.svg · site.webmanifest
├── robots.txt · sitemap.xml · CNAME
│
├── .github/
│   └── workflows/static-pages.yml     # Deploy: checkout → inject secrets → upload artifact
│
├── docs/
│   ├── ARCHITECTURE.md                 # Human technical reference
│   └── README.md                       # Docs index
├── .claude/prompts/                    # Agent implementation prompts
└── README.md
```

---

## Local development

```bash
npx serve -l 8181 .
# open http://localhost:8181
```

No build step. HTML / CSS / JS edits are live on browser reload.

---

## Deploy

Push to `main`. GitHub Actions (`.github/workflows/static-pages.yml`) runs in ~60 s:

1. `actions/checkout@v4`
2. `sed` injects `W3F_ACCESS_KEY` into `contact.js` and `CF_BEACON_TOKEN` into all `*.html`
3. Uploads repo root as Pages artifact — no build, no Jekyll

**Repo secrets required:** `W3F_ACCESS_KEY` (Web3Forms; alias `WEB3FORMS_ACCESS_KEY`), `CF_BEACON_TOKEN` (Cloudflare; alias `CLOUDFLARE_BEACON_TOKEN`).  
Keys are injected into `index.html` (meta tag, network-first) and `contact.js`. Service worker uses **network-first** for `contact.js` and bumps `CACHE` on secret-related deploys.  
Missing secrets: deploy warns; contact form shows a config-error message; analytics beacon stays placeholder.

---

## Maintainer notes

- **Factual changes** — edit `index.html` and `assets/profile-facts.js` together; `recruiter-data.js` derives at runtime.
- **Cached asset changes** — bump `CACHE` version in `sw.js`.
- **New easter egg** — add data to `eggs-data.js`, logic to the relevant `eggs-{tier}.js`, styles to `eggs.css`, and the new file to `sw.js` ASSETS.
- **Full design guide** — see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). Agent prompts: [.claude/prompts/](.claude/prompts/).

---

## Testing checklist

- [ ] Light and dark theme toggles; no FOUC on first paint; persists on reload
- [ ] Mobile nav opens / closes; focus trapped; Escape closes; 44 × 44 px targets
- [ ] `prefers-color-scheme: dark` applies correct theme before CSS parses
- [ ] Hero canvas absent with `prefers-reduced-motion`
- [ ] Recruiter briefing: `?recruiter=1` opens mode + panel; `profile-facts.js` drives dates
- [ ] Recruiter data: Lifesight `Sept 2025 – Present`, Vassar Labs visible, education `CPI 7.9`
- [ ] Recruiter entry: header icon only (no hero / footer / mobile-nav toggles)
- [ ] Easter eggs load lazily (network tab: absent until triggered)
- [ ] Contact form: in-page success only — no mail client opens on submit
- [ ] Breadcrumbs render correctly on article pages
- [ ] 404 redirect map works for URLs without trailing slash
- [ ] Service worker `ap-v21` installed; offline loads cached assets
- [ ] iOS: form inputs do not trigger auto-zoom (`font-size: 16px`)
