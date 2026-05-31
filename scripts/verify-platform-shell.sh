#!/usr/bin/env bash
# verify-platform-shell.sh — guardrails for portfolio + Casebook platform shell
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

FAIL=0

if [[ -f cases/src/_includes/partials/platform-header.njk ]]; then
  echo "FAIL: forked Casebook platform-header.njk must not exist (use site partial)"
  FAIL=1
fi

if ! grep -q 'platform-shell-styles.njk' cases/src/_includes/layouts/casebook-layout.njk; then
  echo "FAIL: casebook-layout must include platform-shell-styles.njk"
  FAIL=1
fi

if ! grep -q 'shell.css' site/src/_includes/partials/platform-shell-styles.njk; then
  echo "FAIL: platform-shell-styles must link shell.css"
  FAIL=1
fi

if ! grep -q 'mobile-nav-casebook.njk' site/src/_includes/partials/platform-header.njk; then
  echo "FAIL: platform-header must include mobile-nav-casebook for Casebook"
  FAIL=1
fi

if grep -q 'casebook-portfolio-themes' cases/src/_includes/partials/casebook-preferences.njk 2>/dev/null; then
  echo "FAIL: Casebook prefs must not expose duplicate portfolio theme list"
  FAIL=1
fi

echo "Building site…"
(cd site && npm run build --silent)

echo "Building cases…"
(cd cases && npm run build --silent)

if [[ "$FAIL" -ne 0 ]]; then
  echo "Platform shell verification failed."
  exit 1
fi

echo "OK: platform shell checks passed."
