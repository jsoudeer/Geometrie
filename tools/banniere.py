#!/usr/bin/env python3
"""Génère assets/branding/banniere.png (1920×640) : 3 chats kawaii à gauche, 3 brainrots à droite,
titre et « VS » au centre. Utilise les images en pied déjà présentes dans assets/ (aucune nouvelle image).
Usage : python3 tools/banniere.py"""
import math, random
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageChops

ROOT = __file__.rsplit('/tools/', 1)[0]
W, H = 1920, 640
FONT = '/usr/share/fonts/truetype/google-fonts/Poppins-Bold.ttf'
random.seed(7)

def font(size): return ImageFont.truetype(FONT, size)

# --- fond : deux moitiés séparées par une diagonale ---
def vgrad(size, top, bottom):
    g = Image.new('RGB', size); d = ImageDraw.Draw(g)
    for y in range(size[1]):
        t = y / (size[1] - 1)
        d.line([(0, y), (size[0], y)], fill=tuple(int(top[i] + (bottom[i] - top[i]) * t) for i in range(3)))
    return g
left = vgrad((W, H), (255, 224, 238), (233, 214, 255))
right = vgrad((W, H), (46, 24, 78), (12, 30, 28))
mask = Image.new('L', (W, H), 0)
ImageDraw.Draw(mask).polygon([(0, 0), (1010, 0), (910, H), (0, H)], fill=255)
bg = Image.composite(left, right, mask).convert('RGBA')

# halos de couleur
def glow(img, cx, cy, r, color, alpha):
    layer = Image.new('RGBA', img.size, (0, 0, 0, 0)); ImageDraw.Draw(layer).ellipse([cx - r, cy - r, cx + r, cy + r], fill=color + (alpha,))
    img.alpha_composite(layer.filter(ImageFilter.GaussianBlur(r / 2.2)))
glow(bg, 380, 330, 330, (255, 255, 255), 170); glow(bg, 330, 600, 260, (255, 150, 200), 120)
glow(bg, 1540, 330, 330, (120, 255, 120), 90); glow(bg, 1600, 600, 260, (200, 60, 255), 120)

d = ImageDraw.Draw(bg)
# symboles de maths en filigrane
SYM = ['+', '−', '×', '÷', '=', 'π', '½', '7', '3', '%', '12', '∞']
for i in range(34):
    s = random.choice(SYM); x = random.randint(10, W - 80); y = random.randint(5, H - 70); sz = random.randint(34, 80)
    onleft = (x + 40) < (1010 - 100 * y / H)
    col = (255, 255, 255, 120) if onleft else (190, 150, 255, 70)
    if onleft: col = (214, 120, 190, 70)
    layer = Image.new('RGBA', bg.size, (0, 0, 0, 0)); ImageDraw.Draw(layer).text((x, y), s, font=font(sz), fill=col)
    bg.alpha_composite(layer.rotate(random.randint(-25, 25), center=(x, y)))
d = ImageDraw.Draw(bg)
# côté chats : étoiles et cœurs
def star(cx, cy, r, fill, pts=4):
    p = []
    for k in range(pts * 2):
        a = -math.pi / 2 + k * math.pi / pts; rr = r if k % 2 == 0 else r * 0.38
        p.append((cx + rr * math.cos(a), cy + rr * math.sin(a)))
    d.polygon(p, fill=fill)
for i in range(26):
    x = random.randint(20, 860); y = random.randint(20, H - 40); star(x, y, random.randint(8, 20), random.choice([(255, 255, 255, 230), (255, 204, 61, 230), (255, 143, 193, 230)]))
# côté brainrots : éclairs et barres « glitch »
for i in range(9):
    x = random.randint(1090, 1860); y = random.randint(20, H - 160); h = random.randint(60, 120)
    pts = [(x, y), (x - 18, y + h * .45), (x + 4, y + h * .45), (x - 14, y + h)]
    d.line(pts, fill=(184, 255, 90, 200), width=6, joint='curve')
for i in range(14):
    x = random.randint(1060, 1880); y = random.randint(10, H - 20)
    d.rectangle([x, y, x + random.randint(40, 160), y + random.randint(4, 9)], fill=random.choice([(61, 220, 151, 120), (255, 61, 224, 110), (184, 255, 90, 100)]))
# ligne de séparation lumineuse
sep = Image.new('RGBA', (W, H), (0, 0, 0, 0)); ImageDraw.Draw(sep).line([(1010, 0), (910, H)], fill=(255, 226, 122, 255), width=10)
bg.alpha_composite(sep.filter(ImageFilter.GaussianBlur(14))); bg.alpha_composite(sep)
# sol
ground = Image.new('RGBA', (W, H), (0, 0, 0, 0)); ImageDraw.Draw(ground).rectangle([0, H - 70, W, H], fill=(0, 0, 0, 40))
bg.alpha_composite(ground.filter(ImageFilter.GaussianBlur(20)))

# --- personnages (autocollants avec contour clair et ombre au sol) ---
def sprite(path, height, outline):
    im = Image.open(f'{ROOT}/assets/{path}').convert('RGBA'); im = im.crop(im.getbbox())
    w = round(im.width * height / im.height); im = im.resize((w, height), Image.LANCZOS)
    pad = 14
    base = Image.new('RGBA', (w + 2 * pad, height + 2 * pad), (0, 0, 0, 0)); base.paste(im, (pad, pad), im)
    a = base.split()[3].point(lambda v: 255 if v > 40 else 0).filter(ImageFilter.MaxFilter(9)).filter(ImageFilter.GaussianBlur(1.2))
    halo = Image.new('RGBA', base.size, outline + (255,)); halo.putalpha(a)
    out = Image.alpha_composite(halo, base)
    return out
def place(canvas, spr, cx, bottom):
    sh = Image.new('RGBA', canvas.size, (0, 0, 0, 0))
    ImageDraw.Draw(sh).ellipse([cx - spr.width * .42, bottom - 16, cx + spr.width * .42, bottom + 16], fill=(0, 0, 0, 120))
    canvas.alpha_composite(sh.filter(ImageFilter.GaussianBlur(8)))
    canvas.alpha_composite(spr, (int(cx - spr.width / 2), int(bottom - spr.height + 14)))

B = H - 34
cats = [('cats/cat03_full.png', 350, 640), ('cats/cat02_full.png', 440, 410), ('cats/cat01_full.png', 360, 175)]
brains = [('brainrot/br05_full.png', 370, 1290), ('brainrot/br22_full.png', 450, 1510), ('brainrot/br02_full.png', 370, 1750)]
# ordre d'empilement : les plus petits d'abord pour que le grand passe devant
for path, hh, cx in sorted(cats, key=lambda c: c[1]): place(bg, sprite(path, hh, (255, 255, 255)), cx, B)
for path, hh, cx in sorted(brains, key=lambda c: c[1]): place(bg, sprite(path, hh, (232, 255, 214)), cx, B)

# --- centre : titre et VS ---
def text_outline(img, xy, txt, size, fill, stroke, sw=10, anchor='mm'):
    layer = Image.new('RGBA', img.size, (0, 0, 0, 0)); ld = ImageDraw.Draw(layer)
    ld.text((xy[0], xy[1] + 5), txt, font=font(size), fill=(0, 0, 0, 90), anchor=anchor, stroke_width=sw, stroke_fill=(0, 0, 0, 90))
    img.alpha_composite(layer.filter(ImageFilter.GaussianBlur(5)))
    ImageDraw.Draw(img).text(xy, txt, font=font(size), fill=fill, anchor=anchor, stroke_width=sw, stroke_fill=stroke)
cx = 960
text_outline(bg, (cx, 112), 'KAWAII', 108, (255, 143, 193), (255, 255, 255), 12)
# VS
vs = Image.new('RGBA', (W, H), (0, 0, 0, 0)); vd = ImageDraw.Draw(vs)
vd.ellipse([cx - 92, 232 - 92, cx + 92, 232 + 92], fill=(255, 210, 76, 255), outline=(91, 64, 52, 255), width=10)
bg.alpha_composite(vs.filter(ImageFilter.GaussianBlur(0)))
glow(bg, cx, 232, 150, (255, 226, 122), 150)
vd2 = ImageDraw.Draw(bg)
vd2.ellipse([cx - 92, 232 - 92, cx + 92, 232 + 92], fill=(255, 210, 76), outline=(91, 64, 52), width=10)
vd2.text((cx, 238), 'VS', font=font(104), fill=(91, 64, 52), anchor='mm')
text_outline(bg, (cx, 372), 'BRAINROT', 84, (61, 240, 160), (20, 36, 28), 12)
# bandeau
rb = Image.new('RGBA', (W, H), (0, 0, 0, 0)); rd = ImageDraw.Draw(rb)
rd.rounded_rectangle([cx - 300, 456, cx + 300, 526], radius=37, fill=(255, 226, 122, 255), outline=(91, 64, 52, 255), width=6)
bg.alpha_composite(rb)
ImageDraw.Draw(bg).text((cx, 494), 'LE JEU DE MATHS DU CE1', font=font(31), fill=(91, 64, 52), anchor='mm')
bg.convert('RGB').save(f'{ROOT}/assets/branding/banniere.png', optimize=True)
print('assets/branding/banniere.png', W, H)
