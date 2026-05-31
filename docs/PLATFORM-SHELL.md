# Platform shell — portfolio + Casebook

**Repo:** `AnimeshPandey.github.io`  
**Live:** https://anmshpndy.com · https://anmshpndy.com/cases/

This document is the contract for shared chrome between the portfolio homepage (`/`) and The Frontend Casebook (`/cases/`).

---

## Single source of truth

| Asset | Canonical path | Casebook consumption |
|-------|----------------|----------------------|
| Platform header | `site/src/_includes/partials/platform-header.njk` | Eleventy Nunjucks search path includes `../site/src/_includes` |
| Icon sprite (nav) | `site/src/_includes/partials/icon-sprite-nav.njk` | Included from `casebook-layout.njk` |
| Mobile nav (Casebook) | `site/src/_includes/partials/mobile-nav-casebook.njk` | Included when `product == 'casebook'` |
| Shell styles | `assets/platform/shell.css` | Both shells, after `prefs-chrome.css` |
| Buttons | `assets/styles/components/button.css` | Both shells, before product CSS |
| Casebook prefs partial | `cases/src/_includes/partials/casebook-preferences.njk` | Casebook only |

**CI rule:** `scripts/verify-platform-shell.sh` fails if `cases/src/_includes/partials/platform-header.njk` exists (forked header).

---

## Stylesheet load order

```text
/assets/styles/foundation.css
/assets/theme.css
/assets/platform/chrome.css
/assets/platform/prefs-chrome.css
/assets/platform/shell.css
/assets/styles/components/button.css   ← both products
[product layer]
  portfolio → /assets/site.css
  casebook  → /cases/assets/css/casebook.css
```

Product CSS owns page content only (hero, hub grid, Casey, recruiter, eggs). Do not re-define `.platform-header` or `.theme-pick-btn` in product layers.

---

## Theme and appearance

| Surface | DOM | Storage | UI |
|---------|-----|---------|-----|
| Portfolio | `data-theme` | `localStorage.theme` | Theme + language pickers (`theme.js`, `i18n.js`) |
| Casebook | `data-casebook-color`, `data-casebook-contrast` | `casebook-color-mode`, `casebook-contrast` | Display settings menu (`casebook-preferences.js`) |

**First visit on Casebook:** FOUC script may infer dark from portfolio dark-family themes when `casebook-color-mode` is unset. `theme-bridge.js` does **not** overwrite stored Casebook prefs on later visits.

**Default contrast on Casebook:** `normal` (high contrast is opt-in).

Casebook does **not** load `theme.js`, `i18n.js`, `visuals.js`, recruiter, or eggs.

---

## Features by surface

| Feature | Portfolio | Casebook |
|---------|-----------|----------|
| Section rail / hash nav | Yes | No |
| Recruiter briefing | Homepage | No |
| i18n (en / hi / es) | Yes | No |
| Theme picker (6 themes) | Yes | No (appearance menu only) |
| Mobile drawer | `mobile-nav.njk` | `mobile-nav-casebook.njk` |
| Service worker | Yes (`sw.js`) | Same origin; platform assets network-first |
| Casey / demos / tone | No | Yes |

---

## Local preview (deploy-shaped)

```bash
cd site && npm run build
cd ../cases && npm run build
mkdir -p ../site/_site/cases && rsync -a ../cases/_site/ ../site/_site/cases/
cp ../index.html ../site/_site/index.html
cd ../site/_site && python3 -m http.server 8200
```

Open http://127.0.0.1:8200/ and http://127.0.0.1:8200/cases/

---

## Verification

```bash
./scripts/verify-platform-shell.sh
```

See [ARCHITECTURE.md](./ARCHITECTURE.md) for full system detail.
