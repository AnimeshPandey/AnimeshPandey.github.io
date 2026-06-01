#!/usr/bin/env bash
# regen-casey-failures.sh — run transparency QA; list paths that need manual regen.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "→ Running fix-casey-transparency.py (normalize + matte QA)…"
if python3 scripts/fix-casey-transparency.py; then
  echo "✓ All Casey PNGs passed transparency QA."
  exit 0
fi

echo ""
echo "⚠ Transparency QA reported issues. Re-export sources then reinstall:"
echo "  export CASEY_SRC=\"\$HOME/.cursor/projects/Users-animeshpandey-Desktop-Codebases/assets\""
echo "  ./scripts/install-casey-pngs.sh"
echo "  python3 scripts/fix-casey-transparency.py"
echo ""
echo "Optional hub DotLottie (desktop spike): export hub/casey-idle.lottie and set data-casey-dotlottie=\"1\" on <html>."
exit 1
