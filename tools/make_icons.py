"""Draws the Hand of GOD app icon (pixel art, no external assets)."""

from PIL import Image, ImageDraw, ImageFilter, ImageChops

GRID = 32
SCALE = 8
BASE = GRID * SCALE  # 256

SKIN = (240, 189, 139, 255)
SKIN_LIGHT = (255, 220, 174, 255)
SKIN_DARK = (201, 136, 79, 255)
NAIL = (255, 234, 203, 255)
OUTLINE = (41, 20, 32, 255)


def lerp(a, b, t):
    return int(round(a + (b - a) * t))


def make_base():
    img = Image.new("RGBA", (GRID, GRID), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    for y in range(GRID):
        t = y / (GRID - 1)
        d.rectangle(
            [0, y, GRID - 1, y],
            fill=(lerp(16, 62, t), lerp(8, 12, t), lerp(34, 78, t), 255),
        )
    return img


def make_hand_layer():
    layer = Image.new("RGBA", (GRID, GRID), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    d.rounded_rectangle([9, 15, 25, 28], radius=3, fill=SKIN)   # fist
    d.rounded_rectangle([4, 18, 11, 27], radius=2, fill=SKIN)   # thumb
    d.rounded_rectangle([9, 11, 14, 20], radius=2, fill=SKIN)   # folded fingers
    d.rounded_rectangle([20, 12, 25, 21], radius=2, fill=SKIN)
    d.rounded_rectangle([14, 2, 20, 20], radius=2, fill=SKIN)   # the middle finger
    d.rectangle([16, 4, 18, 7], fill=NAIL)

    # cheap pixel shading
    d.rectangle([24, 17, 25, 27], fill=SKIN_DARK)
    d.rectangle([10, 16, 24, 16], fill=SKIN_LIGHT)
    d.rectangle([15, 3, 19, 3], fill=SKIN_LIGHT)
    return layer


def add_outline(img, layer):
    alpha = layer.split()[3]
    grown = alpha.filter(ImageFilter.MaxFilter(3))
    ring = ImageChops.subtract(grown, alpha)
    img.paste(Image.new("RGBA", (GRID, GRID), OUTLINE), (0, 0), ring)
    img.alpha_composite(layer)


def main():
    img = make_base()

    glow = Image.new("RGBA", (GRID, GRID), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    for r in range(12, 1, -2):
        gd.ellipse(
            [16 - r, 17 - r, 16 + r, 17 + r],
            fill=(150, 80, 255, 18),
        )
    img.alpha_composite(glow)

    add_outline(img, make_hand_layer())

    d = ImageDraw.Draw(img)
    for (x, y, c) in [(4, 6, (255, 210, 87, 255)), (27, 4, (255, 122, 194, 255)),
                      (28, 22, (255, 210, 87, 255)), (3, 25, (255, 122, 194, 255))]:
        d.rectangle([x, y, x + 1, y + 1], fill=c)

    mask = Image.new("L", (GRID, GRID), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, GRID - 1, GRID - 1], radius=7, fill=255)
    img.putalpha(mask)

    icon = img.resize((BASE, BASE), Image.NEAREST)

    import os
    os.makedirs("build", exist_ok=True)
    icon.save("build/icon.png")
    icon.save(
        "build/icon.ico",
        sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)],
    )
    print("wrote build/icon.png and build/icon.ico (%dx%d)" % (BASE, BASE))


if __name__ == "__main__":
    main()
