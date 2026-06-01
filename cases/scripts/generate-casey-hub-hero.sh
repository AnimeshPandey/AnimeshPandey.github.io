#!/usr/bin/env bash
# Generate hub hero WebP via Pillow (casey-images.py).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
python3 "$ROOT/scripts/casey-images.py" webp
