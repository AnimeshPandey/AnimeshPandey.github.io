# Portfolio + Casebook test suite

Regression harness for **anmshpndy.com** (portfolio at `/`, Casebook at `/cases/`). Mirrors the CI merge in `static-pages.yml`: build both Eleventy sites, stage `_deploy/`, then run static contracts, unit tests, and Playwright E2E against a local server.

## Quick start

```bash
cd tests
npm install
npm test                    # build + static + unit + e2e (≈2–4 min)
```

Individual layers:

```bash
npm run build:deploy        # cases + site → tests/_deploy/
npm run test:static         # HTML/asset/manifest contracts (no browser)
npm run test:unit           # node:test (navigation, auth core, manifest)
npm run test:e2e            # Playwright (starts serve on :8765)
npm run test:e2e:ui         # debug in UI mode
```

## What is covered

### Static contracts (`tests/static/`)

| Script | Checks |
|--------|--------|
| `assert-live-cases.mjs` | Every `manifest` live slug has `cases/_site/{slug}/index.html` |
| `assert-deploy-routes.mjs` | Portfolio + casebook index, account, library, SW, feed |
| `assert-critical-assets.mjs` | Casey, auth, progression JS/CSS and sample PNGs exist |
| `assert-html-contracts.mjs` | Required DOM hooks on hub, sample cases, account |
| `assert-case-continue.mjs` | All 31 live cases have valid next-case CTAs |
| `assert-manifest-consistency.mjs` | manifest ↔ hub-live-cases ↔ source folders |
| `assert-internal-links-sample.mjs` | Sample `/cases/` hrefs resolve on disk |
| `assert-json-embeds.mjs` | Hub JSON scripts parse |

### Unit tests (`tests/unit/`)

- `case-navigation.test.mjs` — next/prev/track indices for all live cases
- `casebook-auth-core.test.mjs` — token mint/parse/tamper
- `manifest-data.test.mjs` — schema sanity for live cases

### E2E (`tests/e2e/`)

- **portfolio.spec.ts** — home, Casebook CTA, theme, SW, 404
- **casebook-hub.spec.ts** — grid, Casey, filters, empty state, progress, clear filter
- **casebook-case.spec.ts** — chapters, continue CTA, tone, progress, sample slugs
- **casebook-account.spec.ts** — email magic link sign-in/out
- **casebook-library.spec.ts** — library, about, companies, feed, sitemap
- **casebook-companion.spec.ts** — APIs, reset companion, coach scroll
- **integration.spec.ts** — cross-navigation portfolio ↔ casebook

## CI

`.github/workflows/test.yml` runs on push/PR to `main`. Deploy workflow runs the same static checks before upload.

## Adding tests

1. **New live case** — manifest + source; static `assert-live-cases` + `assert-case-continue` pick it up automatically.
2. **New hub/case DOM hook** — extend `assert-html-contracts.mjs` and an e2e spec.
3. **New pure logic** — add `cases/lib/*.js` and `tests/unit/*.test.mjs`.

## Artifacts

- Playwright HTML report: `tests/playwright-report/` (after e2e)
- Staged site: `tests/_deploy/` (gitignored)
