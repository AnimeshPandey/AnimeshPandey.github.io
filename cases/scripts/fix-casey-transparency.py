#!/usr/bin/env python3
"""
Remove baked white/checkerboard backgrounds from Casey PNGs.
Ensures true RGBA transparency for web. Run after install or on src/assets/casey/**/*.png.
"""
from __future__ import annotations

import sys
from collections import deque
from pathlib import Path

from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
CASEY = ROOT / "src/assets/casey"

# Known AI export background colours (checkerboard + white)
BG_SWATCHES = [
    (255, 255, 255),
    (254, 254, 254),
    (253, 253, 253),
    (252, 252, 252),
    (251, 251, 251),
    (250, 250, 250),
    (247, 247, 247),
    (246, 246, 246),
    (245, 245, 245),
    (240, 240, 240),
    (235, 235, 235),
    (234, 234, 234),
    (232, 232, 232),
    (204, 204, 204),
    (192, 192, 192),
]

# Casey character fills — never flood to transparent (see style-anchor/PALETTE.md)
CHARACTER_SWATCHES = [
    (250, 250, 248),  # fur #FAFAF8
    (237, 232, 223),  # fur shadow #EDE8DF
    (242, 196, 196),  # blush / inner ear #F2C4C4
    (240, 160, 160),  # nose #F0A0A0
    (91, 175, 240),   # eye iris #5BADF0
    (26, 111, 196),   # limbus #1A6FC4
    (26, 26, 46),     # pupil #1A1A2E
    (124, 168, 151),  # collar / mid hoodie #7CA897
    (139, 175, 159),  # junior hoodie #8BAF9F
    (212, 197, 176),  # sweater #D4C5B0
    (232, 213, 176),  # tag #E8D5B0
    (94, 143, 114),   # tag text #5E8F72
    (90, 90, 110),    # headphones #5A5A6E
    (139, 115, 85),   # glasses #8B7355
    (200, 191, 181),  # whisker #C8BFB5
    (45, 42, 62),     # outline #2D2A3E
]


def color_close(r: int, g: int, b: int, ref: tuple[int, int, int], tol: int) -> bool:
    return abs(r - ref[0]) <= tol and abs(g - ref[1]) <= tol and abs(b - ref[2]) <= tol


def is_character_pixel(r: int, g: int, b: int, tol: int = 22) -> bool:
    """Protect fur, garments, and face fills from matte removal."""
    for ref in CHARACTER_SWATCHES:
        if color_close(r, g, b, ref, tol):
            return True
    # Warm off-white fur (AI export may drift slightly from #FAFAF8)
    if r >= 244 and g >= 244 and b >= 238 and abs(r - g) <= 6 and abs(g - b) <= 10:
        return True
    return False


def is_background_pixel(r: int, g: int, b: int, refs: list[tuple[int, int, int]], tol: int) -> bool:
    if is_character_pixel(r, g, b, tol):
        return False
    for ref in refs:
        if color_close(r, g, b, ref, tol):
            return True
    # Checkerboard neutrals only — not warm fur (#FAFAF8)
    if abs(r - g) <= 10 and abs(g - b) <= 10 and 190 <= r <= 246:
        return True
    return False


def flood_background_to_alpha(im: Image.Image, tol: int = 20) -> Image.Image:
    im = im.convert("RGBA")
    w, h = im.size
    px = im.load()
    refs = list(BG_SWATCHES)
    for corner in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]:
        c = px[corner][:3]
        if is_background_pixel(c[0], c[1], c[2], refs, tol) and c not in refs:
            refs.append(c)

    q: deque[tuple[int, int]] = deque()
    seen: set[tuple[int, int]] = set()

    def seed(x: int, y: int) -> None:
        if 0 <= x < w and 0 <= y < h:
            q.append((x, y))

    # Seeds: corners + thin outer rim only (avoids eating interior via full-edge flood)
    for x in range(w):
        seed(x, 0)
        seed(x, h - 1)
    for y in range(h):
        seed(0, y)
        seed(w - 1, y)

    while q:
        x, y = q.popleft()
        if (x, y) in seen:
            continue
        seen.add((x, y))
        r, g, b, a = px[x, y]
        if not is_background_pixel(r, g, b, refs, tol):
            continue
        px[x, y] = (r, g, b, 0)
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if 0 <= nx < w and 0 <= ny < h:
                q.append((nx, ny))

    return im


def normalize_canvas(im: Image.Image, size: int = 512, fill: float = 0.84) -> Image.Image:
    """Square canvas, consistent scale, feet anchored near bottom (tier/pose swap won't jump)."""
    im = trim_transparent(im, pad=10)
    w, h = im.size
    if w < 1 or h < 1:
        return im
    side = max(w, h)
    scale = (size * fill) / side
    nw, nh = max(1, int(w * scale)), max(1, int(h * scale))
    im = im.resize((nw, nh), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    x = (size - nw) // 2
    y = size - nh - int(size * 0.05)
    canvas.paste(im, (x, y), im)
    return canvas


def should_normalize(path: Path) -> bool:
    parts = path.parts
    if "style-anchor" in parts or "hub" in parts:
        return False
    return any(t in parts for t in ("junior", "mid", "staff")) and path.suffix == ".png"


def trim_transparent(im: Image.Image, pad: int = 8) -> Image.Image:
    bbox = im.getbbox()
    if not bbox:
        return im
    x0, y0, x1, y1 = bbox
    x0 = max(0, x0 - pad)
    y0 = max(0, y0 - pad)
    x1 = min(im.width, x1 + pad)
    y1 = min(im.height, y1 + pad)
    return im.crop((x0, y0, x1, y1))


def polish(im: Image.Image) -> Image.Image:
    """Light sharpen after matte removal."""
    return im.filter(ImageFilter.UnsharpMask(radius=1.2, percent=90, threshold=3))


def process_file(path: Path, tol: int, trim: bool, sharpen: bool, normalize: bool) -> dict:
    before = Image.open(path)
    im = flood_background_to_alpha(before, tol=tol)
    if trim:
        im = trim_transparent(im, pad=10)
    if normalize and should_normalize(path):
        fill = 0.78 if "junior" in path.parts else 0.84
        im = normalize_canvas(im, fill=fill)
    if sharpen:
        rgb = im.convert("RGB")
        alpha = im.split()[-1]
        rgb = polish(rgb)
        im = Image.merge("RGBA", (*rgb.split(), alpha))
    im.save(path, "PNG", optimize=True)
    alpha = im.split()[-1]
    ext = alpha.getextrema()
    transparent_pct = sum(1 for p in alpha.getdata() if p < 128) / (im.width * im.height) * 100
    return {
        "path": str(path.relative_to(ROOT)),
        "size": im.size,
        "alpha": ext,
        "transparent_pct": round(transparent_pct, 1),
    }


def iter_pngs() -> list[Path]:
    out = []
    for p in CASEY.rglob("*.png"):
        if "lottie" in p.parts and "images" in p.parts:
            continue  # refreshed from tier idle after main pass
        out.append(p)
    return sorted(out)


def main() -> None:
    tol = 20
    do_trim = True
    do_sharpen = True
    if len(sys.argv) > 1 and sys.argv[1] == "--strict":
        tol = 16

    paths = iter_pngs()
    print(f"Processing {len(paths)} PNGs (tol={tol})…")
    bad = []
    for p in paths:
        stats = process_file(p, tol, do_trim, do_sharpen, normalize=True)
        ok = stats["alpha"][0] == 0 and stats["transparent_pct"] > 8
        mark = "OK" if ok else "WARN"
        print(f"  [{mark}] {stats['path']} {stats['size']} α{stats['alpha']} {stats['transparent_pct']}% transparent")
        if not ok:
            bad.append(stats)

    # Lottie tier idle copies
    for tier in ("junior", "mid", "staff"):
        idle = CASEY / tier / "idle.png"
        lottie_img = CASEY / "lottie" / tier / "images" / "idle.png"
        if idle.is_file() and lottie_img.parent.is_dir():
            lottie_img.parent.mkdir(parents=True, exist_ok=True)
            Image.open(idle).save(lottie_img, "PNG", optimize=True)

    if bad:
        print(f"\n{len(bad)} files may need manual QA or re-generation.")
        sys.exit(1)
    print("\nAll Casey PNGs have true transparency.")


if __name__ == "__main__":
    main()
