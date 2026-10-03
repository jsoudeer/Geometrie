#!/usr/bin/env python3
"""Génère, à partir des images en pied déjà présentes dans assets/ (aucune nouvelle image) :
  assets/branding/banniere.png  1920×640 : 3 chats kawaii | 3 brainrots, titre, « VS » et bandeau au centre ;
  assets/branding/splash.png    1280×720 : même duel, sans titre (le titre est en HTML), coupé droit au milieu
                                (l'écran d'accueil scinde l'image en deux moitiés qui s'entrechoquent).
Usage : python3 tools/banniere.py   (puis python3 tools/embed.py pour embarquer l'image d'accueil)
Les personnages se changent dans les listes CATS_* / BRAINS_* ci-dessous."""
import math, random
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = __file__.rsplit('/tools/', 1)[0]
FONT = '/usr/share/fonts/truetype/google-fonts/Poppins-Bold.ttf'

# (image, hauteur, centre x) ; le plus grand au milieu de chaque groupe
CATS_BANNER = [('cats/cat03_full.png', 350, 640), ('cats/cat02_full.png', 440, 410), ('cats/cat01_full.png', 360, 175)]
BRAINS_BANNER = [('brainrot/br05_full.png', 370, 1290), ('brainrot/br22_full.png', 450, 1510), ('brainrot/br02_full.png', 370, 1750)]
CATS_SPLASH = [('cats/cat03_full.png', 400, 545), ('cats/cat02_full.png', 500, 330), ('cats/cat01_full.png', 410, 112)]
BRAINS_SPLASH = [('brainrot/br05_full.png', 420, 735), ('brainrot/br22_full.png', 520, 950), ('brainrot/br02_full.png', 420, 1170)]


def font(size): return ImageFont.truetype(FONT, size)

def vgrad(size, top, bottom):
    g = Image.new('RGB', size); d = ImageDraw.Draw(g)
    for y in range(size[1]):
        t = y / (size[1] - 1)
        d.line([(0, y), (size[0], y)], fill=tuple(int(top[i] + (bottom[i] - top[i]) * t) for i in range(3)))
    return g

def glow(img, cx, cy, r, color, alpha):
    layer = Image.new('RGBA', img.size, (0, 0, 0, 0)); ImageDraw.Draw(layer).ellipse([cx - r, cy - r, cx + r, cy + r], fill=color + (alpha,))
    img.alpha_composite(layer.filter(ImageFilter.GaussianBlur(r / 2.2)))

def star(d, cx, cy, r, fill, pts=4):
    p = []
    for k in range(pts * 2):
        a = -math.pi / 2 + k * math.pi / pts; rr = r if k % 2 == 0 else r * 0.38
        p.append((cx + rr * math.cos(a), cy + rr * math.sin(a)))
    d.polygon(p, fill=fill)

def sprite(path, height, outline):
    im = Image.open(f'{ROOT}/assets/{path}').convert('RGBA'); im = im.crop(im.getbbox())
    w = round(im.width * height / im.height); im = im.resize((w, height), Image.LANCZOS)
    pad = 14
    base = Image.new('RGBA', (w + 2 * pad, height + 2 * pad), (0, 0, 0, 0)); base.paste(im, (pad, pad), im)
    a = base.split()[3].point(lambda v: 255 if v > 40 else 0).filter(ImageFilter.MaxFilter(9)).filter(ImageFilter.GaussianBlur(1.2))
    halo = Image.new('RGBA', base.size, outline + (255,)); halo.putalpha(a)
    return Image.alpha_composite(halo, base)

def place(canvas, spr, cx, bottom):
    sh = Image.new('RGBA', canvas.size, (0, 0, 0, 0))
    ImageDraw.Draw(sh).ellipse([cx - spr.width * .42, bottom - 16, cx + spr.width * .42, bottom + 16], fill=(0, 0, 0, 120))
    canvas.alpha_composite(sh.filter(ImageFilter.GaussianBlur(8)))
    canvas.alpha_composite(spr, (int(cx - spr.width / 2), int(bottom - spr.height + 14)))

def text_outline(img, xy, txt, size, fill, stroke, sw=10):
    layer = Image.new('RGBA', img.size, (0, 0, 0, 0))
    ImageDraw.Draw(layer).text((xy[0], xy[1] + 5), txt, font=font(size), fill=(0, 0, 0, 90), anchor='mm', stroke_width=sw, stroke_fill=(0, 0, 0, 90))
    img.alpha_composite(layer.filter(ImageFilter.GaussianBlur(5)))
    ImageDraw.Draw(img).text(xy, txt, font=font(size), fill=fill, anchor='mm', stroke_width=sw, stroke_fill=stroke)

def background(W, H, edge_top, edge_bottom, scale=1.0):
    """Fond en deux moitiés ; la frontière va de (edge_top, 0) à (edge_bottom, H) (droite si égaux)."""
    random.seed(7)
    left = vgrad((W, H), (255, 224, 238), (233, 214, 255)); right = vgrad((W, H), (46, 24, 78), (12, 30, 28))
    mask = Image.new('L', (W, H), 0)
    ImageDraw.Draw(mask).polygon([(0, 0), (edge_top, 0), (edge_bottom, H), (0, H)], fill=255)
    bg = Image.composite(left, right, mask).convert('RGBA')
    mid = (edge_top + edge_bottom) / 2
    glow(bg, int(mid * .4), int(H * .52), int(H * .52), (255, 255, 255), 170); glow(bg, int(mid * .34), int(H * .94), int(H * .4), (255, 150, 200), 120)
    glow(bg, int(mid + (W - mid) * .55), int(H * .52), int(H * .52), (120, 255, 120), 90); glow(bg, int(mid + (W - mid) * .62), int(H * .94), int(H * .4), (200, 60, 255), 120)
    sym = ['+', '−', '×', '÷', '=', 'π', '½', '7', '3', '%', '12', '∞']
    for _ in range(34 if W > 1500 else 22):
        s = random.choice(sym); x = random.randint(10, W - 80); y = random.randint(5, H - 70); sz = int(random.randint(34, 80) * scale)
        onleft = (x + 40) < (edge_top + (edge_bottom - edge_top) * y / H)
        col = (214, 120, 190, 70) if onleft else (190, 150, 255, 70)
        layer = Image.new('RGBA', bg.size, (0, 0, 0, 0)); ImageDraw.Draw(layer).text((x, y), s, font=font(sz), fill=col)
        bg.alpha_composite(layer.rotate(random.randint(-25, 25), center=(x, y)))
    d = ImageDraw.Draw(bg)
    for _ in range(26 if W > 1500 else 18):   # côté chats : étoiles
        x = random.randint(20, int(min(edge_top, edge_bottom) - 60)); y = random.randint(20, H - 40)
        star(d, x, y, int(random.randint(8, 20) * scale), random.choice([(255, 255, 255, 230), (255, 204, 61, 230), (255, 143, 193, 230)]))
    for _ in range(9 if W > 1500 else 6):     # côté brainrots : éclairs
        x = random.randint(int(max(edge_top, edge_bottom) + 80), W - 60); y = random.randint(20, H - 160); h = int(random.randint(60, 120) * scale)
        d.line([(x, y), (x - 18, y + h * .45), (x + 4, y + h * .45), (x - 14, y + h)], fill=(184, 255, 90, 200), width=6, joint='curve')
    for _ in range(14 if W > 1500 else 9):    # lignes « glitch »
        x = random.randint(int(max(edge_top, edge_bottom) + 40), W - 40); y = random.randint(10, H - 20)
        d.rectangle([x, y, x + random.randint(40, 160), y + random.randint(4, 9)], fill=random.choice([(61, 220, 151, 120), (255, 61, 224, 110), (184, 255, 90, 100)]))
    sep = Image.new('RGBA', (W, H), (0, 0, 0, 0)); ImageDraw.Draw(sep).line([(edge_top, 0), (edge_bottom, H)], fill=(255, 226, 122, 255), width=10)
    bg.alpha_composite(sep.filter(ImageFilter.GaussianBlur(14))); bg.alpha_composite(sep)
    ground = Image.new('RGBA', (W, H), (0, 0, 0, 0)); ImageDraw.Draw(ground).rectangle([0, H - 70, W, H], fill=(0, 0, 0, 40))
    bg.alpha_composite(ground.filter(ImageFilter.GaussianBlur(20)))
    return bg

def characters(bg, cats, brains, bottom):
    for path, hh, cx in sorted(cats, key=lambda c: c[1]): place(bg, sprite(path, hh, (255, 255, 255)), cx, bottom)
    for path, hh, cx in sorted(brains, key=lambda c: c[1]): place(bg, sprite(path, hh, (232, 255, 214)), cx, bottom)

def vs_badge(bg, cx, cy, r):
    glow(bg, cx, cy, int(r * 1.6), (255, 226, 122), 150)
    d = ImageDraw.Draw(bg)
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(255, 210, 76), outline=(91, 64, 52), width=int(r / 9))
    d.text((cx, cy + int(r * .06)), 'VS', font=font(int(r * 1.13)), fill=(91, 64, 52), anchor='mm')

def build_banner():
    W, H = 1920, 640
    bg = background(W, H, 1010, 910)
    characters(bg, CATS_BANNER, BRAINS_BANNER, H - 34)
    cx = 960
    text_outline(bg, (cx, 112), 'KAWAII', 108, (255, 143, 193), (255, 255, 255), 12)
    vs_badge(bg, cx, 232, 92)
    text_outline(bg, (cx, 372), 'BRAINROT', 84, (61, 240, 160), (20, 36, 28), 12)
    rb = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(rb).rounded_rectangle([cx - 300, 456, cx + 300, 526], radius=35, fill=(255, 226, 122, 255), outline=(91, 64, 52, 255), width=6)
    bg.alpha_composite(rb)
    ImageDraw.Draw(bg).text((cx, 494), 'LE JEU DE MATHS DU CE1', font=font(31), fill=(91, 64, 52), anchor='mm')
    bg.convert('RGB').save(f'{ROOT}/assets/branding/banniere.png', optimize=True)
    print('assets/branding/banniere.png', W, H)

def build_splash():
    W, H = 1280, 720
    bg = background(W, H, 640, 640, scale=.8)
    characters(bg, CATS_SPLASH, BRAINS_SPLASH, H - 30)
    vs_badge(bg, 640, 120, 82)
    bg.convert('RGB').save(f'{ROOT}/assets/branding/splash.png', optimize=True)
    print('assets/branding/splash.png', W, H)

if __name__ == '__main__':
    build_banner(); build_splash()
