#!/usr/bin/env python3
"""Pre-install validation for Casey AI exports in CASEY_SRC."""
from __future__ import annotations

import os
import sys
from pathlib import Path

from PIL import Image

DEFAULT_SRC = Path.home() / ".cursor/projects/Users-animeshpandey-Desktop-Codebases/assets"
TIERS = ("junior", "mid", "staff")
CORE = ("idle", "blink", "perk", "point", "think", "celebrate", "sleep", "wave")
GUIDE = ("welcome", "present", "proud", "support", "read")
COMPANION = ("curious", "nod", "focus")
ALL_POSES = CORE + GUIDE + COMPANION

# Opaque near-white studio floor pixels allowed in bottom 25% band
MAX_FLOOR_PIXELS = 500


def is_warm_fur(r: int, g: int, b: int) -> bool:
    return r >= 244 and g >= 244 and b >= 238 and abs(r - g) <= 6


def count_floor_band(im: Image.Image) -> int:
    im = im.convert("RGBA")
    w, h = im.size
    y0 = int(h * 0.75)
    band = im.crop((0, y0, w, h))
    floor_px = 0
    for r, g, b, a in band.get_flattened_data():
        if a < 200:
            continue
        if is_warm_fur(r, g, b):
            continue
        if r >= 248 and g >= 248 and b >= 248:
            floor_px += 1
    return floor_px


def main() -> None:
    src = Path(os.environ.get("CASEY_SRC", DEFAULT_SRC))
    if not src.is_dir():
        print(f"ERROR: CASEY_SRC not found: {src}", file=sys.stderr)
        sys.exit(1)

    errors: list[str] = []
    checked = 0
    for tier in TIERS:
        for pose in ALL_POSES:
            path = src / f"casey-{tier}-{pose}.png"
            if not path.is_file():
                continue
            checked += 1
            try:
                im = Image.open(path)
            except OSError as e:
                errors.append(f"{path.name}: cannot open — {e}")
                continue
            floor_px = count_floor_band(im)
            if floor_px > MAX_FLOOR_PIXELS:
                errors.append(
                    f"{path.name}: {floor_px} opaque floor pixels in bottom band (max {MAX_FLOOR_PIXELS}) — regen with NO floor"
                )

    if checked == 0:
        print(f"WARN: no casey-{{tier}}-{{pose}}.png files in {src}", file=sys.stderr)
        sys.exit(0)

    if errors:
        print("Casey source validation FAILED:", file=sys.stderr)
        for e in errors:
            print(f"  ✗ {e}", file=sys.stderr)
        sys.exit(1)

    print(f"OK: {checked} Casey source PNGs passed validation ({src})")


if __name__ == "__main__":
    main()
