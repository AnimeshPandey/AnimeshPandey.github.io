# anmshpndy.com

Personal portfolio of Animesh Pandey, Senior Frontend Engineer.

- Live (canonical): **https://anmshpndy.com**
- GitHub Pages origin: **https://animeshpandey.github.io** (redirect target should remain canonicalized to custom domain)

---

## Stack

- Pure HTML / CSS / vanilla JS — zero build step, zero dependencies
- Fonts: DM Serif Display + Plus Jakarta Sans + JetBrains Mono (Google Fonts)
- Dark / light theme with FOUC prevention (inline script + `localStorage`)
- Mobile-first responsive design with hamburger nav and focus trap
- Optional offline caching via `sw.js`
- Hosted on GitHub Pages with a static artifact deploy (no Jekyll)

## File structure

```
.
├── index.html                              # Main portfolio page
├── 404.html                                # Custom 404 with redirect map
├── fundamentals-of-functional-javascript/
│   └── index.html                          # Article page
├── how-well-do-you-know-this/
│   └── index.html                          # Article page
├── assets/
│   ├── theme.css                           # CSS custom properties (light + dark)
│   ├── site.css                            # All layout, components, and article styles
│   ├── theme.js                            # Theme toggle + localStorage persistence
│   ├── nav.js                              # Mobile nav, focus trap, scroll-spy
│   └── og-image.png                        # Open Graph image (1200×630)
├── favicon.svg
├── sw.js                                   # Service worker cache strategy
├── resume.pdf
├── robots.txt
├── sitemap.xml
├── CNAME
└── site.webmanifest
```

## Local development

No build step required. Serve the root directory with any static file server:

```bash
npx serve -l 8181 .
# then open http://localhost:8181
```

## Deploy

Push to `main`. The GitHub Actions workflow (`.github/workflows/static-pages.yml`) uploads the repo root as a static Pages artifact and deploys it — no Jekyll, no build.

## Custom domain

`CNAME` points to `anmshpndy.com`. Configured via **Settings → Pages → Custom domain**.

## SEO and indexing notes

- Keep canonicals, sitemap URLs, and JSON-LD host aligned to `https://anmshpndy.com/`.
- Ensure `robots.txt` continues to expose `Sitemap: https://anmshpndy.com/sitemap.xml`.
- If updating social cards, regenerate and replace `assets/og-image.png`.
- Avoid serving both `anmshpndy.com` and `animeshpandey.github.io` as separately indexable duplicates.

## Testing checklist

- [ ] Light and dark theme toggle works, persists on reload
- [ ] Mobile nav opens/closes, focus is trapped inside the panel
- [ ] Escape key closes mobile nav
- [ ] All touch targets are at least 44×44px
- [ ] iOS: form inputs don't trigger auto-zoom (font-size: 16px on inputs)
- [ ] `prefers-color-scheme: dark` applies correct theme on first load (no FOUC)
- [ ] Breadcrumbs render correctly on article pages
- [ ] 404 redirect map works for URLs without trailing slash
- [ ] Service worker updates correctly after deploy (`sw.js` cache version bump when needed)
