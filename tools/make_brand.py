"""Generates the Hand of GOD brand assets.

Everything here is drawn from the same pixel grid the game uses, so the logo,
the social card and the in-game hand can never drift apart.

Outputs:
  site/logo.svg   favicon + header mark (vector, tiny)
  site/og.png     1200x630 social preview card
  site/fonts.css  the pixel font inlined as a data URI
"""

import base64
import math
import os

SPR_W, SPR_H = 56, 68

GOLD = {1: "#ffd257", 2: "#fff4b8", 3: "#df9b1a", 4: "#fffce0", 5: "#3b1d08"}

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = os.path.join(ROOT, "site")


# --------------------------------------------------------------------------
# the hand, ported from game.js / site.js
# --------------------------------------------------------------------------

def build_hand(extended=False):
    grid = [[0] * SPR_W for _ in range(SPR_H)]

    def setc(x, y, v):
        if 0 <= x < SPR_W and 0 <= y < SPR_H:
            grid[y][x] = v

    def rnd(x, y, w, h, r, v):
        for j in range(h):
            for i in range(w):
                cx0, cy0 = x + i, y + j
                near_l, near_r = i < r, i >= w - r
                near_t, near_b = j < r, j >= h - r
                cx = cy = None
                if near_l and near_t:
                    cx, cy = x + r - 0.5, y + r - 0.5
                elif near_r and near_t:
                    cx, cy = x + w - 0.5 - r, y + r - 0.5
                elif near_l and near_b:
                    cx, cy = x + r - 0.5, y + h - 0.5 - r
                elif near_r and near_b:
                    cx, cy = x + w - 0.5 - r, y + h - 0.5 - r
                ok = True
                if cx is not None:
                    dx, dy = cx0 - cx, cy0 - cy
                    if dx * dx + dy * dy > (r - 0.1) ** 2:
                        ok = False
                if ok:
                    setc(cx0, cy0, v)

    def capsule(x0, y0, x1, y1, r, v):
        vx, vy = x1 - x0, y1 - y0
        len2 = vx * vx + vy * vy or 1
        for y in range(int(math.floor(min(y0, y1) - r)), int(math.ceil(max(y0, y1) + r)) + 1):
            for x in range(int(math.floor(min(x0, x1) - r)), int(math.ceil(max(x0, x1) + r)) + 1):
                cxp, cyp = x + 0.5, y + 0.5
                t = ((cxp - x0) * vx + (cyp - y0) * vy) / len2
                t = 0 if t < 0 else 1 if t > 1 else t
                dx = cxp - (x0 + vx * t)
                dy = cyp - (y0 + vy * t)
                if dx * dx + dy * dy <= r * r:
                    setc(x, y, v)

    profile = [
        [23, 11, 44], [26, 9, 45], [32, 8, 46], [39, 9, 45], [44, 10, 44],
        [49, 12, 42], [54, 14, 40], [59, 15, 39], [64, 17, 37], [67, 20, 34],
    ]
    for i in range(len(profile) - 1):
        y0, l0, r0 = profile[i]
        y1, l1, r1 = profile[i + 1]
        for y in range(y0, y1):
            t = (y - y0) / (y1 - y0)
            left = round(l0 + (l1 - l0) * t)
            right = round(r0 + (r1 - r0) * t)
            for x in range(left, right + 1):
                setc(x, y, 1)

    rnd(10, 20, 10, 16, 5, 1)   # index
    rnd(31, 21, 9, 14, 5, 1)    # ring
    rnd(40, 25, 8, 14, 4, 1)    # pinky
    if extended:
        rnd(20, 2, 11, 12, 5, 1)
        rnd(21, 8, 9, 24, 4, 1)
    else:
        rnd(20, 18, 11, 18, 5, 1)
    capsule(8, 48, 25, 41, 5.5, 1)

    solid = [row[:] for row in grid]

    def is_solid(x, y):
        return 0 <= x < SPR_W and 0 <= y < SPR_H and solid[y][x] != 0

    for y in range(SPR_H):
        for x in range(SPR_W):
            v = solid[y][x]
            if not v:
                if (is_solid(x - 1, y) or is_solid(x + 1, y)
                        or is_solid(x, y - 1) or is_solid(x, y + 1)):
                    grid[y][x] = 5
                continue
            if v == 4:
                continue
            bottom = not is_solid(x, y + 1)
            right = not is_solid(x + 1, y)
            top = not is_solid(x, y - 1)
            left = not is_solid(x - 1, y)
            if bottom or right:
                grid[y][x] = 3
            elif top or left:
                grid[y][x] = 2
            else:
                grid[y][x] = 1

    def paint(x, y, v, allowed):
        if not (0 <= x < SPR_W and 0 <= y < SPR_H):
            return
        if allowed and grid[y][x] not in allowed:
            return
        grid[y][x] = v

    for y in range(21, 31):
        paint(19, y, 3, (1, 2))
    for y in range(20, 31):
        paint(30, y, 3, (1, 2))
    for y in range(26, 35):
        paint(39, y, 3, (1, 2))

    for x0, x1, fold in ((11, 18, 27), (32, 38, 28), (41, 46, 32)):
        for x in range(x0 + 1, x1):
            paint(x, fold, 3, (1, 2))
    if not extended:
        for x in range(21, 29):
            paint(x, 25, 3, (1, 2))

    for i in range(0, 18):
        paint(8 + i, 43 - round(i * 0.35), 3, (1, 2))
    for i in range(1, 16):
        paint(9 + i, 52 - round(i * 0.28), 3, (1, 2))

    for x in range(17, 38):
        y = 57 + round(1.5 * math.sin((x - 17) / 5.6))
        paint(x, y, 3, (1, 2))
    for x in range(19, 36):
        paint(x, 63, 3, (1, 2))

    return grid


GRID = build_hand(False)

bounds = {
    "min_x": min(x for y in range(SPR_H) for x in range(SPR_W) if GRID[y][x]),
    "max_x": max(x for y in range(SPR_H) for x in range(SPR_W) if GRID[y][x]),
    "min_y": min(y for y in range(SPR_H) for x in range(SPR_W) if GRID[y][x]),
    "max_y": max(y for y in range(SPR_H) for x in range(SPR_W) if GRID[y][x]),
}


# --------------------------------------------------------------------------
# logo.svg
# --------------------------------------------------------------------------

# flat three-tone version: reads cleanly at 16px in a browser tab
LOGO_GROUPS = [
    ("#3b1d08", {5, 3}),
    ("#ffd257", {1, 2, 4}),
]


def svg_hand(scale, ox, oy):
    """One ratio-optimised path per tone, built from horizontal runs."""
    paths = []
    for colour, values in LOGO_GROUPS:
        d = []
        for y in range(SPR_H):
            x = 0
            while x < SPR_W:
                if GRID[y][x] not in values:
                    x += 1
                    continue
                start = x
                while x < SPR_W and GRID[y][x] in values:
                    x += 1
                run = x - start
                d.append(
                    "M%.2f %.2fh%.2fv%.2fh-%.2fz"
                    % (ox + start * scale, oy + y * scale, run * scale, scale, run * scale)
                )
        if d:
            paths.append('<path fill="%s" d="%s"/>' % (colour, "".join(d)))
    return "".join(paths)


def write_logo():
    size = 64
    content_w = bounds["max_x"] - bounds["min_x"] + 1
    content_h = bounds["max_y"] - bounds["min_y"] + 1
    scale = 40.0 / content_h
    w = content_w * scale
    ox = (size - w) / 2 - bounds["min_x"] * scale
    oy = 21 - bounds["min_y"] * scale

    svg = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="Hand of GOD logo">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#2a0713"/>
      <stop offset="1" stop-color="#0a0409"/>
    </linearGradient>
    <radialGradient id="aura" cx="50%%" cy="42%%" r="52%%">
      <stop offset="0" stop-color="#ff8a3c" stop-opacity=".55"/>
      <stop offset="1" stop-color="#ff8a3c" stop-opacity="0"/>
    </radialGradient>
    <filter id="glow" x="-50%%" y="-50%%" width="200%%" height="200%%">
      <feGaussianBlur stdDeviation="2.2"/>
    </filter>
  </defs>
  <rect width="64" height="64" rx="14" fill="url(#bg)"/>
  <rect width="64" height="64" rx="14" fill="url(#aura)"/>
  <g opacity=".85" filter="url(#glow)">
    <ellipse cx="32" cy="13" rx="17" ry="4.4" fill="none" stroke="#ffd257" stroke-width="2.2"/>
  </g>
  <ellipse cx="32" cy="13" rx="17" ry="4.4" fill="none" stroke="#fff4b8" stroke-width="1.6"/>
  <g opacity=".75" fill="#ffd257">
    <rect x="13" y="6" width="2" height="5"/>
    <rect x="31" y="3" width="2" height="5"/>
    <rect x="49" y="6" width="2" height="5"/>
  </g>
  <g id="hand" shape-rendering="crispEdges">%s</g>
  <use href="#hand" opacity=".5" filter="url(#glow)"/>
  <use href="#hand"/>
</svg>
""" % svg_hand(scale, ox, oy)

    with open(os.path.join(SITE, "logo.svg"), "w", encoding="utf-8", newline="\n") as f:
        f.write(svg)
    print("site/logo.svg written")


# --------------------------------------------------------------------------
# og.png  (1200x630 social card)
# --------------------------------------------------------------------------

def write_og():
    from PIL import Image, ImageDraw, ImageFont

    W, H = 1200, 630
    img = Image.new("RGB", (W, H), "#08040a")
    d = ImageDraw.Draw(img, "RGBA")

    # vertical ember wash
    for y in range(H):
        t = y / H
        r = int(26 * (1 - t) + 8 * t)
        g = int(6 * (1 - t) + 4 * t)
        b = int(16 * (1 - t) + 10 * t)
        d.line([(0, y), (W, y)], fill=(r, g, b))

    # god rays from the top centre
    for i in range(9):
        a = -math.pi / 2 + (i - 4) * 0.22
        spread = 0.05
        length = 1500
        cx, cy = W / 2, -60
        pts = [
            (cx, cy),
            (cx + math.cos(a - spread) * length, cy + math.sin(a - spread) * length),
            (cx + math.cos(a + spread) * length, cy + math.sin(a + spread) * length),
        ]
        d.polygon(pts, fill=(255, 170, 90, 16))

    # the hand, big, on the right
    scale = 5
    hx = 760 - bounds["min_x"] * scale
    hy = 130 - bounds["min_y"] * scale
    for y in range(SPR_H):
        for x in range(SPR_W):
            v = GRID[y][x]
            if not v:
                continue
            d.rectangle(
                [hx + x * scale, hy + y * scale, hx + (x + 1) * scale - 1, hy + (y + 1) * scale - 1],
                fill=GOLD[v],
            )

    # halo over the hand
    d.ellipse([790, 74, 1030, 116], outline=(255, 210, 87, 220), width=6)
    d.ellipse([790, 74, 1030, 116], outline=(255, 244, 184, 255), width=2)

    font_path = os.path.join(SITE, "PressStart2P.ttf")
    title = ImageFont.truetype(font_path, 62)
    sub = ImageFont.truetype(font_path, 20)
    small = ImageFont.truetype(font_path, 15)

    d.text((70, 140), "HAND", font=title, fill=(246, 230, 210))
    d.text((70, 214), "OF", font=sub, fill=(176, 143, 146))
    d.text((70, 250), "GOD", font=ImageFont.truetype(font_path, 96), fill=(255, 210, 87))
    d.text((70, 380), "A FREE PIXEL-ART DESKTOP GAME", font=sub, fill=(255, 138, 60))
    d.text((70, 420), "FOR WINDOWS 10 / 11", font=sub, fill=(255, 138, 60))

    d.rectangle([70, 492, 470, 556], fill=(255, 210, 87))
    d.text((104, 514), "DOWNLOAD FREE", font=sub, fill=(43, 10, 6))

    d.text((70, 590), "GITHUB.COM/SAZID63/HANDOFGOD", font=small, fill=(156, 127, 131))

    img.save(os.path.join(SITE, "og.png"), optimize=True)
    print("site/og.png written")


# --------------------------------------------------------------------------
# fonts.css (pixel font inlined, so the page needs no extra request)
# --------------------------------------------------------------------------

def write_fonts():
    with open(os.path.join(SITE, "PressStart2P.woff2"), "rb") as f:
        b64 = base64.b64encode(f.read()).decode("ascii")
    css = (
        "@font-face{font-family:'Press Start 2P';font-style:normal;font-weight:400;\n"
        "src:url(data:font/woff2;base64,%s) format('woff2');\n"
        "font-display:swap}\n" % b64
    )
    with open(os.path.join(SITE, "fonts.css"), "w", encoding="utf-8", newline="\n") as f:
        f.write(css)
    print("site/fonts.css written (%d bytes)" % len(css))


if __name__ == "__main__":
    write_logo()
    write_og()
    write_fonts()
