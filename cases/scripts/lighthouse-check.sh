#!/usr/bin/env bash
# lighthouse-check.sh — Casebook Lighthouse regression runner
#
# Prerequisites:
#   npm install -g lighthouse
#   Local server running at $BASE_URL (default: http://localhost:8200)
#
# Usage:
#   ./scripts/lighthouse-check.sh                  # test all target URLs
#   BASE_URL=http://localhost:4000 ./scripts/lighthouse-check.sh
#
# Targets (mobile, slow-4G throttle — matches CI gate):
#   /cases/            Hub (WebSite schema + SearchAction)
#   /cases/focus-visible-not-outline-none/   Live flagship (LearningResource schema)
#   /cases/library/    Reading library (noindex, hub-filters.js)
#   /cases/about/      AboutPage schema
#
# Quality gates (all required before "done"):
#   Lighthouse SEO          = 100 (hub + case)
#   Lighthouse Performance  >= 90 (hub + case)
#   Lighthouse Accessibility >= 95
#   LCP  <= 2.5s
#   CLS  <= 0.1
#   INP  <= 200ms

set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:8200}"
OUT_DIR="./lighthouse-reports"
THROTTLE="--throttling-method=simulate --throttling.rttMs=150 --throttling.throughputKbps=1600 --throttling.cpuSlowdownMultiplier=4"

mkdir -p "$OUT_DIR"

URLS=(
  "${BASE_URL}/cases/"
  "${BASE_URL}/cases/focus-visible-not-outline-none/"
  "${BASE_URL}/cases/library/"
  "${BASE_URL}/cases/about/"
)

for url in "${URLS[@]}"; do
  slug=$(echo "$url" | sed 's|.*cases/||;s|/|-|g;s|^-||;s|-$||')
  slug="${slug:-hub}"
  out="${OUT_DIR}/${slug}"

  echo "── Running Lighthouse: $url"
  lighthouse "$url" \
    --output html --output json \
    --output-path "$out" \
    --form-factor mobile \
    --screen-emulation.mobile \
    --screen-emulation.width=375 \
    --screen-emulation.height=812 \
    --screen-emulation.deviceScaleFactor=2 \
    $THROTTLE \
    --chrome-flags="--headless --no-sandbox" \
    --quiet || true

  if [ -f "${out}.report.json" ]; then
    perf=$(jq '.categories.performance.score * 100 | round' "${out}.report.json" 2>/dev/null || echo '?')
    seo=$(jq '.categories.seo.score * 100 | round' "${out}.report.json" 2>/dev/null || echo '?')
    a11y=$(jq '.categories.accessibility.score * 100 | round' "${out}.report.json" 2>/dev/null || echo '?')
    lcp=$(jq '.audits["largest-contentful-paint"].numericValue / 1000 | . * 100 | round / 100' "${out}.report.json" 2>/dev/null || echo '?')
    cls=$(jq '.audits["cumulative-layout-shift"].numericValue' "${out}.report.json" 2>/dev/null || echo '?')
    echo "   Performance: ${perf}  SEO: ${seo}  Accessibility: ${a11y}  LCP: ${lcp}s  CLS: ${cls}"

    # Gate checks
    [[ "$perf" =~ ^[0-9]+$ ]] && [ "$perf" -lt 90 ] && echo "   ⚠️  FAIL: Performance < 90 (target: >= 90)"
    [[ "$seo"  =~ ^[0-9]+$ ]] && [ "$seo"  -lt 100 ] && echo "   ⚠️  FAIL: SEO < 100 (target: 100)"
    [[ "$a11y" =~ ^[0-9]+$ ]] && [ "$a11y" -lt 95  ] && echo "   ⚠️  FAIL: Accessibility < 95 (target: >= 95)"
  fi
  echo ""
done

echo "Reports written to $OUT_DIR/"
echo ""
echo "Paste scores into PROGRESS.md > SEO & Performance section after each run."
echo "Validate rich results: https://search.google.com/test/rich-results"
echo "Validate schema.org:   https://validator.schema.org/"
