#!/usr/bin/env bash
# Copy AI-generated Casey PNGs into src/assets/casey and resize for web (512px max edge).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CASEY="$ROOT/src/assets/casey"
SRC="${CASEY_SRC:-$HOME/.cursor/projects/Users-animeshpandey-Desktop-Codebases/assets}"
PREVIEW="$CASEY/style-anchor/preview-ai"

CORE_POSES=(idle blink perk point think celebrate sleep wave)
GUIDE_POSES=(welcome proud support read present)
COMPANION_POSES=(curious nod focus)
TIERS=(junior mid staff)

guide_alias() {
  case "$1" in
    welcome|present) echo wave ;;
    proud) echo celebrate ;;
    support|read) echo think ;;
    *) echo idle ;;
  esac
}

install_one() {
  local src="$1" dest="$2"
  if [[ ! -f "$src" ]]; then
    echo "MISSING: $src" >&2
    return 1
  fi
  sips -Z 512 "$src" --out "$dest" >/dev/null
  echo "  $dest"
}

echo "Installing Casey pose PNGs (512px)…"
for tier in "${TIERS[@]}"; do
  mkdir -p "$CASEY/$tier"
  for pose in "${CORE_POSES[@]}"; do
    gen="$SRC/casey-${tier}-${pose}.png"
    anchor="$PREVIEW/casey-${tier}-anchor-preview.png"
    dest="$CASEY/$tier/${pose}.png"
    if [[ -f "$gen" ]]; then
      install_one "$gen" "$dest"
    elif [[ "$pose" == "idle" && "$tier" == "junior" && -f "$anchor" ]]; then
      install_one "$anchor" "$dest"
    elif [[ "$pose" == "think" && "$tier" == "mid" && -f "$anchor" ]]; then
      install_one "$anchor" "$dest"
    elif [[ "$pose" == "wave" && "$tier" == "staff" && -f "$anchor" ]]; then
      install_one "$anchor" "$dest"
    else
      echo "SKIP (no source): $tier/$pose" >&2
    fi
  done
  for pose in "${GUIDE_POSES[@]}"; do
    gen="$SRC/casey-${tier}-${pose}.png"
    dest="$CASEY/$tier/${pose}.png"
    if [[ -f "$gen" ]]; then
      install_one "$gen" "$dest"
    else
      src_pose="$(guide_alias "$pose")"
      src_file="$CASEY/$tier/${src_pose}.png"
      if [[ -f "$src_file" ]]; then
        install_one "$src_file" "$dest"
        echo "  (alias ${pose}←${src_pose}) $dest"
      else
        echo "SKIP guide: $tier/$pose" >&2
      fi
    fi
  done
done

for tier in "${TIERS[@]}"; do
  anchor="$PREVIEW/casey-${tier}-anchor-preview.png"
  [[ -f "$anchor" ]] && install_one "$anchor" "$CASEY/style-anchor/casey-${tier}-front.png"
done

mid_think="$CASEY/mid/think.png"
[[ -f "$mid_think" ]] && install_one "$mid_think" "$CASEY/hub/casey-empty.png"

echo "Companion poses (curious, nod, focus)…"
for tier in "${TIERS[@]}"; do
  for pose in "${COMPANION_POSES[@]}"; do
    gen="$SRC/casey-${tier}-${pose}.png"
    dest="$CASEY/$tier/${pose}.png"
    if [[ -f "$gen" ]]; then
      install_one "$gen" "$dest"
    fi
  done
done
python3 "$ROOT/scripts/casey-images.py" poses
python3 "$ROOT/scripts/casey-images.py" webp
python3 "$ROOT/scripts/casey-images.py" lottie

echo "Done."
