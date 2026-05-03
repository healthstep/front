#!/usr/bin/env python3
"""
Делает фон логотипа прозрачным (старый голубой #~38B0F8), чтобы в шапке
показывался градиент из стилей — как в макете.
"""
from __future__ import annotations

from pathlib import Path

from PIL import Image


def is_old_blue(r: int, g: int, b: int) -> bool:
    return b > 200 and b > r + 50 and g < 220


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    path = root / "public" / "logo.png"
    im = Image.open(path).convert("RGBA")
    data = im.get_flattened_data() if hasattr(im, "get_flattened_data") else im.getdata()
    pixels = list(data)
    out: list[tuple[int, int, int, int]] = []
    for r, g, b, a in pixels:
        if is_old_blue(r, g, b):
            out.append((0, 0, 0, 0))
        else:
            out.append((r, g, b, a))
    im.putdata(out)
    im.save(path, optimize=True)
    print(f"Updated {path} ({im.size[0]}×{im.size[1]})")


if __name__ == "__main__":
    main()
