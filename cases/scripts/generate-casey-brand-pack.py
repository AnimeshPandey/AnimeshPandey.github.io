#!/usr/bin/env python3
"""
Generate Casey brand-IP packs from junior pose PNGs (no new AI required).

Outputs under cases/src/assets/casey/brand/:
  reactions/*.png   — 128×128 face stickers
  status/*.png      — empty / error / 404 / loading / email-header scenes
  chrome/*          — favicon-derived PNGs (192 / 512 / apple-touch)
  social/*          — Casey-forward OG 1200×630 + LinkedIn/X variants
  milestones/*.svg  — illustrated stamps

Also refreshes brand/casey-share-premium.png and brand/casebook-favicon.svg.
"""
from __future__ import annotations

import shutil
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[2]  # repo root (worktree)
CASEY = ROOT / "cases" / "src" / "assets" / "casey"
JUNIOR = CASEY / "junior"
BRAND_OUT = CASEY / "brand"
PORTFOLIO_BRAND = ROOT / "brand"


def ensure_rgba(img: Image.Image) -> Image.Image:
    return img.convert("RGBA") if img.mode != "RGBA" else img


def face_crop(pose: str, size: int = 128) -> Image.Image:
    src = JUNIOR / f"{pose}.png"
    img = ensure_rgba(Image.open(src))
    w, h = img.size
    # Casey faces sit in the upper-central region of the framed pose
    left = int(w * 0.18)
    top = int(h * 0.02)
    right = int(w * 0.82)
    bottom = int(h * 0.62)
    crop = img.crop((left, top, right, bottom))
    # Pad to square
    cw, ch = crop.size
    side = max(cw, ch)
    canvas = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    canvas.paste(crop, ((side - cw) // 2, (side - ch) // 2), crop)
    return canvas.resize((size, size), Image.Resampling.LANCZOS)


def write_reactions() -> None:
    out = BRAND_OUT / "reactions"
    out.mkdir(parents=True, exist_ok=True)
    mapping = {
        "yay": "celebrate",
        "hmm": "think",
        "oops": "support",
        "focus": "focus",
        "sleep": "sleep",
        "wave": "wave",
        "proud": "proud",
        "support": "support",
        "curious": "curious",
        "perk": "perk",
        "nod": "nod",
        "point": "point",
    }
    for name, pose in mapping.items():
        if not (JUNIOR / f"{pose}.png").is_file():
            print(f"  skip reaction {name}: missing {pose}.png")
            continue
        face_crop(pose, 128).save(out / f"{name}.png", "PNG", optimize=True)
        print(f"  reactions/{name}.png")


def scene_bg(w: int, h: int, top: str, bottom: str) -> Image.Image:
    img = Image.new("RGB", (w, h), top)
    draw = ImageDraw.Draw(img)

    def hex_to_rgb(hx: str) -> tuple[int, int, int]:
        hx = hx.lstrip("#")
        return tuple(int(hx[i : i + 2], 16) for i in (0, 2, 4))  # type: ignore

    t = hex_to_rgb(top)
    b = hex_to_rgb(bottom)
    for y in range(h):
        k = y / max(h - 1, 1)
        rgb = tuple(int(t[i] + (b[i] - t[i]) * k) for i in range(3))
        draw.line([(0, y), (w, y)], fill=rgb)
    return img


def paste_casey(bg: Image.Image, pose: str, *, height: int, x: int | None = None) -> Image.Image:
    src = JUNIOR / f"{pose}.png"
    if not src.is_file():
        return bg
    mascot = ensure_rgba(Image.open(src))
    ratio = height / mascot.height
    mascot = mascot.resize((int(mascot.width * ratio), height), Image.Resampling.LANCZOS)
    canvas = bg.convert("RGBA")
    px = x if x is not None else (canvas.width - mascot.width) // 2
    py = canvas.height - mascot.height - 24
    canvas.paste(mascot, (px, max(8, py)), mascot)
    return canvas


def write_status() -> None:
    out = BRAND_OUT / "status"
    out.mkdir(parents=True, exist_ok=True)
    specs = [
        ("empty-filter", "curious", "#F4F7F5", "#E2EBE6", 280, 200),
        ("error", "support", "#F8F1F0", "#EDE0DE", 280, 200),
        ("404", "curious", "#F4F7F5", "#DCE8E2", 400, 280),
        ("loading", "think", "#F4F7F5", "#E8F0EC", 280, 200),
        ("email-header", "wave", "#FAFAF8", "#E8F0EC", 600, 200),
    ]
    for name, pose, top, bottom, w, h in specs:
        bg = scene_bg(w, h, top, bottom)
        composed = paste_casey(bg, pose, height=int(h * 0.78))
        composed.convert("RGB").save(out / f"{name}.png", "PNG", optimize=True)
        print(f"  status/{name}.png")


def write_chrome() -> None:
    out = BRAND_OUT / "chrome"
    out.mkdir(parents=True, exist_ok=True)
    face = face_crop("present", 512)
    # Soft sage circle behind face for PWA / apple-touch
    for size, name in ((192, "icon-192.png"), (512, "icon-512.png"), (180, "apple-touch.png")):
        canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        draw = ImageDraw.Draw(canvas)
        pad = int(size * 0.04)
        draw.ellipse([pad, pad, size - pad - 1, size - pad - 1], fill=(124, 168, 151, 255))
        scaled = face.resize((int(size * 0.86), int(size * 0.86)), Image.Resampling.LANCZOS)
        ox = (size - scaled.width) // 2
        oy = (size - scaled.height) // 2 + int(size * 0.02)
        canvas.paste(scaled, (ox, oy), scaled)
        canvas.save(out / name, "PNG", optimize=True)
        print(f"  chrome/{name}")

    # Copy into portfolio brand for deploy passthrough
    PORTFOLIO_BRAND.mkdir(parents=True, exist_ok=True)
    for name in ("icon-192.png", "icon-512.png", "apple-touch.png"):
        shutil.copy(out / name, PORTFOLIO_BRAND / f"casey-{name}")
        print(f"  brand/casey-{name}")


def write_social() -> None:
    out = BRAND_OUT / "social"
    out.mkdir(parents=True, exist_ok=True)
    w, h = 1200, 630
    bg = scene_bg(w, h, "#0c1210", "#1a2a24")
    composed = paste_casey(bg, "present", height=460, x=48)
    draw = ImageDraw.Draw(composed.convert("RGBA") if False else composed)
    # redraw text on RGB
    rgb = composed.convert("RGB")
    draw = ImageDraw.Draw(rgb)
    try:
        title_font = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial Bold.ttf", 54)
        sub_font = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial.ttf", 28)
    except OSError:
        title_font = ImageFont.load_default()
        sub_font = title_font
    draw.text((520, 190), "The Frontend Casebook", fill="#FAFAF8", font=title_font)
    draw.text(
        (520, 270),
        "Real patterns. Live demos. Casey guides you.",
        fill="#9BB5A8",
        font=sub_font,
    )
    draw.rectangle([(520, 350), (920, 354)], fill="#5E8F72")
    rgb.save(out / "og-casey-forward.png", "PNG", optimize=True)
    print("  social/og-casey-forward.png")

    # LinkedIn / X variants — same art, slight crop emphasis
    rgb.save(out / "linkedin-casey.png", "PNG", optimize=True)
    rgb.save(out / "x-casey.png", "PNG", optimize=True)
    print("  social/linkedin-casey.png")
    print("  social/x-casey.png")

    # Hub cover (square-ish crop for social scripts)
    cover = rgb.crop((0, 0, 1200, 630))
    cover.save(out / "hub-cover.png", "PNG", optimize=True)

    # Promote to portfolio brand default OG
    PORTFOLIO_BRAND.mkdir(parents=True, exist_ok=True)
    themes = PORTFOLIO_BRAND / "themes"
    themes.mkdir(parents=True, exist_ok=True)
    shutil.copy(out / "og-casey-forward.png", themes / "casey-share-premium.png")
    print("  brand/themes/casey-share-premium.png (updated)")


def write_milestones() -> None:
    out = BRAND_OUT / "milestones"
    out.mkdir(parents=True, exist_ok=True)
    stamps = [
        ("first-case", "#5E8F72", "1"),
        ("five-cases", "#7CA897", "5"),
        ("streak", "#E8D5B0", "★"),
        ("interview", "#5BADF0", "?"),
    ]
    for name, fill, mark in stamps:
        svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="Casey milestone">
  <circle cx="32" cy="32" r="30" fill="{fill}" stroke="#2D2A3E" stroke-width="2"/>
  <circle cx="32" cy="32" r="24" fill="#FAFAF8" opacity="0.92"/>
  <text x="32" y="40" text-anchor="middle" font-family="Georgia, serif" font-size="22" font-weight="700" fill="#2D2A3E">{mark}</text>
</svg>
'''
        (out / f"{name}.svg").write_text(svg, encoding="utf-8")
        print(f"  milestones/{name}.svg")


def write_favicon_svg() -> None:
    """Simplified Casey-face favicon (reads at 16–32px)."""
    svg = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="#7CA897"/>
  <!-- ears -->
  <path d="M14 28 L10 8 L26 20 Z" fill="#FAFAF8" stroke="#2D2A3E" stroke-width="1.5" stroke-linejoin="round"/>
  <path d="M50 28 L54 8 L38 20 Z" fill="#FAFAF8" stroke="#2D2A3E" stroke-width="1.5" stroke-linejoin="round"/>
  <path d="M14 24 L12 12 L22 20 Z" fill="#F2C4C4"/>
  <path d="M50 24 L52 12 L42 20 Z" fill="#F2C4C4"/>
  <!-- head -->
  <ellipse cx="32" cy="36" rx="22" ry="20" fill="#FAFAF8" stroke="#2D2A3E" stroke-width="1.8"/>
  <!-- eyes -->
  <ellipse cx="24" cy="34" rx="5.5" ry="6.5" fill="#5BADF0" stroke="#1A6FC4" stroke-width="1"/>
  <ellipse cx="40" cy="34" rx="5.5" ry="6.5" fill="#5BADF0" stroke="#1A6FC4" stroke-width="1"/>
  <circle cx="24" cy="35" r="2.4" fill="#1A1A2E"/>
  <circle cx="40" cy="35" r="2.4" fill="#1A1A2E"/>
  <circle cx="22.5" cy="32.5" r="1.1" fill="#FFFFFF"/>
  <circle cx="38.5" cy="32.5" r="1.1" fill="#FFFFFF"/>
  <!-- blush -->
  <ellipse cx="16" cy="40" rx="4" ry="2.2" fill="#F2C4C4" opacity="0.45"/>
  <ellipse cx="48" cy="40" rx="4" ry="2.2" fill="#F2C4C4" opacity="0.45"/>
  <!-- nose + mouth -->
  <ellipse cx="32" cy="40" rx="2.2" ry="1.6" fill="#F0A0A0"/>
  <path d="M28 44 Q32 48 36 44" fill="none" stroke="#B07878" stroke-width="1.4" stroke-linecap="round"/>
</svg>
'''
    target = PORTFOLIO_BRAND / "casebook-favicon.svg"
    target.write_text(svg, encoding="utf-8")
    (BRAND_OUT / "chrome" / "favicon.svg").write_text(svg, encoding="utf-8")
    print("  brand/casebook-favicon.svg (Casey face)")
    print("  brand/chrome/favicon.svg")


def main() -> None:
    if not JUNIOR.is_dir():
        raise SystemExit(f"Missing junior poses at {JUNIOR}")
    BRAND_OUT.mkdir(parents=True, exist_ok=True)
    print("Casey brand pack:")
    write_reactions()
    write_status()
    write_chrome()
    write_social()
    write_milestones()
    write_favicon_svg()
    print("Done.")


if __name__ == "__main__":
    main()
