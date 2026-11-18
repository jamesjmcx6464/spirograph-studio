#!/usr/bin/env python3
"""Generate PWA icons with a brass-gold hypotrochoid on the app's dark canvas."""
from __future__ import annotations

import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
ICONS = PUBLIC / "icons"

# App palette (src/constants/palette.ts)
CANVAS_BG = (10, 13, 16, 255)  # #0A0D10
BRASS_GOLD = (201, 162, 106, 255)  # #C9A26A
BRASS_DIM = (110, 95, 69, 220)  # #6E5F45
BRASS_GLOW = (201, 162, 106, 70)
TEAL = (95, 211, 196, 180)  # #5FD3C4, accent curve


def hypotrochoid(R: float, r: float, d: float, turns: int, steps: int) -> list[tuple[float, float]]:
    pts: list[tuple[float, float]] = []
    t_max = 2 * math.pi * turns
    k = (R - r) / r
    for i in range(steps + 1):
        t = t_max * i / steps
        x = (R - r) * math.cos(t) + d * math.cos(k * t)
        y = (R - r) * math.sin(t) - d * math.sin(k * t)
        pts.append((x, y))
    return pts


def scale_points(
    pts: list[tuple[float, float]], cx: float, cy: float, radius: float
) -> list[tuple[float, float]]:
    max_r = max(math.hypot(x, y) for x, y in pts) or 1.0
    s = radius / max_r
    return [(cx + x * s, cy + y * s) for x, y in pts]


def draw_polyline(
    draw: ImageDraw.ImageDraw,
    pts: list[tuple[float, float]],
    fill: tuple[int, int, int, int],
    width: int,
) -> None:
    if len(pts) < 2:
        return
    draw.line(pts, fill=fill, width=width, joint="curve")
    # Cap the ends so the join looks closed
    r = max(1, width / 2)
    for x, y in (pts[0], pts[-1]):
        draw.ellipse((x - r, y - r, x + r, y + r), fill=fill)


def draw_icon(size: int, art_ratio: float) -> Image.Image:
    base = Image.new("RGBA", (size, size), CANVAS_BG)
    glow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    ink = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    cx = cy = size / 2
    radius = size * art_ratio / 2

    # Soft brass glow behind the curve
    gd = ImageDraw.Draw(glow)
    ring_r = radius * 0.98
    gd.ellipse(
        (cx - ring_r, cy - ring_r, cx + ring_r, cy + ring_r),
        outline=BRASS_GLOW,
        width=max(2, int(size * 0.035)),
    )
    glow = glow.filter(ImageFilter.GaussianBlur(radius=max(2, size * 0.04)))
    img = Image.alpha_composite(base, glow)

    # Faint outer ring, suggesting a fixed gear
    ring = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    rd = ImageDraw.Draw(ring)
    ring_width = max(1, int(round(size * 0.012)))
    rd.ellipse(
        (cx - radius, cy - radius, cx + radius, cy + radius),
        outline=BRASS_DIM,
        width=ring_width,
    )
    img = Image.alpha_composite(img, ring)

    draw = ImageDraw.Draw(ink)

    # Classic 5-lobe hypotrochoid (R:r = 5:3), then a tighter inner curve
    main = scale_points(hypotrochoid(R=105, r=63, d=78, turns=6, steps=3600), cx, cy, radius * 0.92)
    inner = scale_points(hypotrochoid(R=80, r=32, d=48, turns=8, steps=3600), cx, cy, radius * 0.55)

    main_w = max(2, int(round(size * 0.018)))
    inner_w = max(1, int(round(size * 0.012)))
    draw_polyline(draw, main, BRASS_GOLD, main_w)
    draw_polyline(draw, inner, TEAL, inner_w)

    # Center dot (pen / pivot)
    dot = max(2, int(round(size * 0.022)))
    draw.ellipse((cx - dot, cy - dot, cx + dot, cy + dot), fill=BRASS_GOLD)

    return Image.alpha_composite(img, ink)


def main() -> None:
    ICONS.mkdir(parents=True, exist_ok=True)
    specs = {
        ICONS / "icon-192.png": (192, 0.82),
        ICONS / "icon-512.png": (512, 0.82),
        ICONS / "icon-512-maskable.png": (512, 0.62),
        PUBLIC / "apple-touch-icon.png": (180, 0.82),
        PUBLIC / "favicon-32.png": (32, 0.88),
    }
    for path, (size, ratio) in specs.items():
        draw_icon(size, ratio).save(path, "PNG", optimize=True)
        print(f"wrote {path.relative_to(ROOT)} ({size}x{size})")

    ico = draw_icon(256, 0.88)
    ico_path = PUBLIC / "favicon.ico"
    ico.save(ico_path, format="ICO", sizes=[(16, 16), (32, 32), (48, 48)])
    print(f"wrote {ico_path.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
