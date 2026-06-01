#!/usr/bin/env python3
"""Casey raster utilities: WebP hub hero, OG share card, companion pose derivatives."""
from __future__ import annotations

import json
import math
import shutil
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
CASEY = ROOT / "src/assets/casey"
HUB = CASEY / "hub"
BRAND = ROOT.parent / "brand" / "themes"
LOTTIE = CASEY / "lottie"

TIERS = ("junior", "mid", "staff")
COMPANION_POSES = {
    "curious": "think",
    "nod": "perk",
    "focus": "point",
}


def ensure_rgba(img: Image.Image) -> Image.Image:
    if img.mode != "RGBA":
        return img.convert("RGBA")
    return img


def derive_pose(tier: str, pose: str, source_pose: str) -> None:
    src = CASEY / tier / f"{source_pose}.png"
    dest = CASEY / tier / f"{pose}.png"
    if not src.is_file():
        print(f"SKIP derive {tier}/{pose}: missing {source_pose}")
        return
    img = ensure_rgba(Image.open(src))
    w, h = img.size

    if pose == "curious":
        rotated = img.rotate(-8, resample=Image.Resampling.BICUBIC, expand=True)
        canvas = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        rw, rh = rotated.size
        canvas.paste(rotated, ((w - rw) // 2, (h - rh) // 2 - 4), rotated)
        out = canvas
    elif pose == "nod":
        out = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        shifted = img.resize((w, int(h * 0.96)), resample=Image.Resampling.LANCZOS)
        out.paste(shifted, (0, 10), shifted)
    elif pose == "focus":
        crop = img.crop((int(w * 0.08), int(h * 0.05), int(w * 0.92), int(h * 0.95)))
        out = crop.resize((w, h), resample=Image.Resampling.LANCZOS)
    else:
        out = img

    out.save(dest, optimize=True)
    print(f"  {dest.relative_to(ROOT)}")


def write_webp_hero() -> None:
    HUB.mkdir(parents=True, exist_ok=True)
    src = CASEY / "junior" / "present.png"
    if not src.is_file():
        src = CASEY / "junior" / "wave.png"
    if not src.is_file():
        print("SKIP webp: no present/wave PNG")
        return
    img = Image.open(src).convert("RGBA")
    for name, width in (("casey-companion-hero.webp", 400), ("casey-companion-hero@2x.webp", 800)):
        scaled = img.copy()
        scaled.thumbnail((width, width * 2), Image.Resampling.LANCZOS)
        out = HUB / name
        scaled.save(out, "WEBP", quality=85, method=6)
        print(f"  {out.relative_to(ROOT)}")


def write_og_share() -> None:
    BRAND.mkdir(parents=True, exist_ok=True)
    w, h = 1200, 630
    bg = Image.new("RGB", (w, h), "#0c1210")
    draw = ImageDraw.Draw(bg)
    for y in range(h):
        t = y / h
        r = int(12 + t * 8)
        g = int(18 + t * 28)
        b = int(16 + t * 20)
        draw.line([(0, y), (w, y)], fill=(r, g, b))

    mascot_src = CASEY / "junior" / "present.png"
    if not mascot_src.is_file():
        mascot_src = CASEY / "junior" / "idle.png"
    if mascot_src.is_file():
        mascot = ensure_rgba(Image.open(mascot_src))
        target_h = 420
        ratio = target_h / mascot.height
        mascot = mascot.resize((int(mascot.width * ratio), target_h), Image.Resampling.LANCZOS)
        bg_rgba = bg.convert("RGBA")
        bg_rgba.paste(mascot, (72, (h - target_h) // 2), mascot)
        bg = bg_rgba.convert("RGB")

    draw = ImageDraw.Draw(bg)
    try:
        title_font = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial Bold.ttf", 52)
        sub_font = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial.ttf", 28)
    except OSError:
        title_font = ImageFont.load_default()
        sub_font = title_font

    draw.text((520, 200), "The Frontend Casebook", fill="#FAFAF8", font=title_font)
    draw.text(
        (520, 280),
        "Scrollable case studies · Junior to Staff · Casey guides you",
        fill="#9BB5A8",
        font=sub_font,
    )
    draw.rectangle([(520, 360), (900, 364)], fill="#5E8F72")

    out = BRAND / "casey-share-premium.png"
    bg.save(out, "PNG", optimize=True)
    print(f"  {out.relative_to(ROOT.parent)}")

    # Default OG fallback used by head-seo
    fallback = BRAND / "share-high-contrast.png"
    if not fallback.is_file():
        shutil.copy(out, fallback)
        print(f"  {fallback.relative_to(ROOT.parent)} (copied from casey-share)")


def lottie_idle_json(tier: str, duration_sec: float, bounce_px: float) -> dict:
    """Minimal Lottie 5.7 — vertical breathe on image layer."""
    fr = 30
    frames = int(duration_sec * fr)
    return {
        "v": "5.7.4",
        "fr": fr,
        "ip": 0,
        "op": frames,
        "w": 512,
        "h": 512,
        "nm": f"casey-idle-{tier}",
        "ddd": 0,
        "assets": [
            {
                "id": "image_0",
                "w": 512,
                "h": 512,
                "u": "images/",
                "p": "idle.png",
                "e": 0,
            }
        ],
        "layers": [
            {
                "ddd": 0,
                "ind": 1,
                "ty": 2,
                "nm": "Casey",
                "refId": "image_0",
                "sr": 1,
                "ks": {
                    "o": {"a": 0, "k": 100},
                    "r": {"a": 0, "k": 0},
                    "p": {
                        "a": 1,
                        "k": [
                            {
                                "i": {"x": 0.42, "y": 1},
                                "o": {"x": 0.58, "y": 0},
                                "t": 0,
                                "s": [256, 256 + bounce_px, 0],
                            },
                            {
                                "i": {"x": 0.42, "y": 1},
                                "o": {"x": 0.58, "y": 0},
                                "t": frames // 2,
                                "s": [256, 256 - bounce_px, 0],
                            },
                            {
                                "t": frames,
                                "s": [256, 256 + bounce_px, 0],
                            },
                        ],
                    },
                    "a": {"a": 0, "k": [256, 256, 0]},
                    "s": {"a": 0, "k": [100, 100, 100]},
                },
                "ao": 0,
                "ip": 0,
                "op": frames,
                "st": 0,
                "bm": 0,
            }
        ],
    }


def write_lottie_idle() -> None:
    tier_motion = {
        "junior": (3.5, 6),
        "mid": (4.0, 4),
        "staff": (5.0, 2),
    }
    for tier in TIERS:
        idle_src = CASEY / tier / "idle.png"
        if not idle_src.is_file():
            print(f"SKIP lottie {tier}: no idle.png")
            continue
        tier_dir = LOTTIE / tier
        img_dir = tier_dir / "images"
        img_dir.mkdir(parents=True, exist_ok=True)
        shutil.copy(idle_src, img_dir / "idle.png")
        dur, bounce = tier_motion[tier]
        data = lottie_idle_json(tier, dur, bounce)
        out = tier_dir / "idle.json"
        out.write_text(json.dumps(data, separators=(",", ":")), encoding="utf-8")
        print(f"  {out.relative_to(ROOT)}")


def main() -> None:
    import sys

    cmd = sys.argv[1] if len(sys.argv) > 1 else "all"
    if cmd in ("all", "poses"):
        print("Companion poses (curious, nod, focus)…")
        for tier in TIERS:
            for pose, src in COMPANION_POSES.items():
                derive_pose(tier, pose, src)
    if cmd in ("all", "webp"):
        print("Hub WebP hero…")
        write_webp_hero()
    if cmd in ("all", "og"):
        print("OG share image…")
        write_og_share()
    if cmd in ("all", "lottie"):
        print("Lottie idle loops…")
        write_lottie_idle()


if __name__ == "__main__":
    main()
