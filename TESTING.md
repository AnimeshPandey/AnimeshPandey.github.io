# Testing — portfolio + Casebook

Regression suite lives in [`tests/`](tests/). It builds the same merged artifact as GitHub Pages (`site/` + `cases/` → `_deploy/`), then runs **static contracts**, **unit tests**, and **Playwright E2E**.

## Run locally

```bash
cd tests
npm install
npm test
```

Layers only:

| Command | What it does |
|---------|----------------|
| `npm run build:deploy` | Build both sites and stage `tests/_deploy/` |
| `npm run test:static` | 8 contract scripts (manifest, assets, HTML, links) |
| `npm run test:unit` | 15+ `node:test` cases (navigation, auth, manifest) |
| `npm run test:e2e` | 38+ browser tests incl. every live case slug |

From `cases/`: `npm test` delegates to `../tests`.

## CI

- **[`.github/workflows/test.yml`](.github/workflows/test.yml)** — full suite on push/PR to `main`
- **[`.github/workflows/static-pages.yml`](.github/workflows/static-pages.yml)** — static + unit on staged artifact before deploy

## When to extend

- New **live case** → automatic via manifest loops in static + `casebook-all-live.spec.ts`
- New **hub/case UI hook** → `tests/static/assert-html-contracts.mjs` + targeted e2e
- New **pure JS logic** → `cases/lib/` + `tests/unit/*.test.mjs`

See [`tests/README.md`](tests/README.md) for the full checklist.
