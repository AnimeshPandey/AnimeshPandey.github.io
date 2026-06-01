#!/usr/bin/env bash
# Generate hub hero WebP from junior present PNG (requires cwebp or copies PNG fallback).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/src/assets/casey/junior/present.png"
HUB="$ROOT/src/assets/casey/hub"
mkdir -p "$HUB"

if command -v cwebp >/dev/null 2>&1; then
  cwebp -q 85 -resize 400 0 "$SRC" -o "$HUB/casey-companion-hero.webp"
  cwebp -q 82 -resize 800 0 "$SRC" -o "$HUB/casey-companion-hero@2x.webp"
  echo "Wrote WebP hub hero assets"
else
  echo "cwebp not found — skipping WebP (picture falls back to PNG)"
fi
