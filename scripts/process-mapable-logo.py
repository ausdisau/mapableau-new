#!/usr/bin/env python3
"""Process the vertical MapAble lockup PNG for transparent headers.

Source: git show 354b7c52:public/brand/mapable-logo.png (official upload).

Steps:
1. Flood-fill solid black background (preserves full wordmark + tagline).
2. Recolor tagline teal pixels to brand orange (#E8A317).
3. Fix mint anti-alias fringes in the MapAble wordmark band.
4. Paint white circle + black wheelchair in the pin (matches mapable-logo-mark.svg).

Do NOT run rembg on this asset — it crops to the pin only.
"""

from __future__ import annotations

import subprocess
import sys
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / "public/brand/mapable-logo.png"
SOURCE_COMMIT = "354b7c52:public/brand/mapable-logo.png"

BRAND_ORANGE = (232, 163, 23)


def load_source() -> Image.Image:
    raw = subprocess.check_output(["git", "show", SOURCE_COMMIT], cwd=ROOT)
    from io import BytesIO

    return Image.open(BytesIO(raw))


def flood_fill_black(img: Image.Image, tolerance: int = 8) -> np.ndarray:
    arr = np.array(img.convert("RGBA"), dtype=np.uint8)
    h, w = arr.shape[:2]
    r, g, b = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2]

    def is_bg(y: int, x: int) -> bool:
        return r[y, x] <= tolerance and g[y, x] <= tolerance and b[y, x] <= tolerance

    visited = np.zeros((h, w), dtype=bool)
    q: deque[tuple[int, int]] = deque()
    for y, x in ((0, 0), (0, w - 1), (h - 1, 0), (h - 1, w - 1)):
        if is_bg(y, x):
            q.append((y, x))
            visited[y, x] = True

    while q:
        y, x = q.popleft()
        arr[y, x, 3] = 0
        for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and not visited[ny, nx] and is_bg(ny, nx):
                visited[ny, nx] = True
                q.append((ny, nx))

    ys, xs = np.where(arr[:, :, 3] > 20)
    return arr[ys.min() - 4 : ys.max() + 5, xs.min() - 4 : xs.max() + 5]


def fix_tagline_orange(arr: np.ndarray) -> np.ndarray:
    y0 = int(arr.shape[0] * 0.68)
    sl = arr[y0:]
    r, g, b, a = sl[:, :, 0], sl[:, :, 1], sl[:, :, 2], sl[:, :, 3]
    teal = (a > 40) & (r < 45) & (g > 45) & (g < 105) & (b > 75) & (b < 140)
    for i, ch in enumerate(BRAND_ORANGE):
        sl[:, :, i] = np.where(teal, ch, sl[:, :, i])
    arr[y0:] = sl
    return arr


def fix_text_highlights(arr: np.ndarray) -> np.ndarray:
    y0, y1 = int(arr.shape[0] * 0.35), int(arr.shape[0] * 0.62)
    sl = arr[y0:y1]
    r, g, b, a = sl[:, :, 0], sl[:, :, 1], sl[:, :, 2], sl[:, :, 3]
    mint = (a > 40) & (r < 200) & (g > 170) & (b > 170) & (r < g) & (r < b)
    very_light = mint & (g > 200) & (b > 200)
    sl[very_light] = [255, 255, 255, 255]
    green = mint & ~very_light
    sl[green, 0] = 0
    sl[green, 1] = 189
    sl[green, 2] = 107
    sl[green, 3] = 255
    arr[y0:y1] = sl
    return arr


def paint_pin_accessibility_symbol(arr: np.ndarray) -> np.ndarray:
    h, w = arr.shape[:2]
    top = arr[: int(h * 0.35)]
    teal = (
        (top[:, :, 3] > 128)
        & (top[:, :, 0] < 40)
        & (top[:, :, 1] > 50)
        & (top[:, :, 1] < 100)
        & (top[:, :, 2] > 80)
    )
    ys, xs = np.where(teal)
    cx, cy = int(xs.mean()), int(ys.mean())
    dist = np.sqrt((xs - cx) ** 2 + (ys - cy) ** 2)
    outer_r = int(dist.max() * 0.52)
    inner_r = int(outer_r * 0.58)

    overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    draw.ellipse(
        [cx - inner_r, cy - inner_r, cx + inner_r, cy + inner_r],
        fill=(255, 255, 255, 255),
    )

    scale = inner_r / 14.0
    black = (17, 17, 17, 255)
    draw.ellipse(
        [
            cx - 2.5 * scale,
            cy - 10 * scale - 2.5 * scale,
            cx + 2.5 * scale,
            cy - 10 * scale + 2.5 * scale,
        ],
        fill=black,
    )
    draw.polygon(
        [
            (cx - 14 * scale, cy + 4 * scale),
            (cx - 6 * scale, cy + 4 * scale),
            (cx - 3 * scale, cy + 12 * scale),
            (cx + 6 * scale, cy - 9 * scale),
            (cx + 14 * scale, cy - 9 * scale),
            (cx + 4.5 * scale, cy + 13 * scale),
            (cx - 4 * scale, cy + 13 * scale),
            (cx - 4 * scale, cy + 5 * scale),
            (cx - 12 * scale, cy - 9 * scale),
        ],
        fill=black,
    )

    ov = np.array(overlay)
    yy, xx = np.ogrid[:h, :w]
    pin_area = ((xx - cx) ** 2 + (yy - cy) ** 2) <= outer_r**2
    mask = (ov[:, :, 3] > 0) & pin_area
    arr[mask] = ov[mask]
    return arr


def process(source: Image.Image | None = None) -> Image.Image:
    img = source or load_source()
    arr = flood_fill_black(img)
    arr = fix_tagline_orange(arr)
    arr = fix_text_highlights(arr)
    arr = paint_pin_accessibility_symbol(arr)
    return Image.fromarray(arr)


def main() -> None:
    out = TARGET if len(sys.argv) < 2 else Path(sys.argv[1])
    result = process()
    result.save(out)
    print(f"Wrote {out} ({result.size[0]}x{result.size[1]})")


if __name__ == "__main__":
    main()
