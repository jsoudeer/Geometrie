#!/usr/bin/env python3
"""Nouveaux membres de la Team Kawaii (chiens, lapins…) : wip/ -> assets/cats/<id>.png (visage 256 px) et <id>_full.png
(en pied, détouré). Visage : l'image « visage » si elle existe, sinon un carré recadré dans l'image en pied (boîte en
fractions : x0 et côté en largeur, y0 en hauteur). En pied : détourage rembg, plus gros morceau gardé, trous du pelage
blanc rebouchés (comme tools/proc2.py). Ensuite : python3 tools/embed.py.

    python3 tools/kawaii.py"""
import os
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage as ndi
from rembg import remove, new_session

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# id, image visage (ou None), image en pied, boîte du visage dans l'image en pied si pas d'image visage
NEW = [
    ('cat13', 'bcbe4c14', '0127c005', None),                 # chien facteur
    ('cat14', None, '414f5c82', (0.26, 0.075, 0.62)),        # chien à moto
    ('cat15', None, '7fed5d3b', (0.22, 0.030, 0.58)),        # shiba karaté
    ('cat16', 'b90c36be', '06b5f5bd', None),                 # lapin qui saute
    ('cat17', 'ea10c3c7', '5be0cd34', None),                 # lapine gymnaste
    ('cat18', 'bf2950b5', '653f7b4b', None),                 # lapin à la brosse
    ('cat19', '84333cbd', 'd91d1423', None),                 # lapin jardinier
]


def find(prefix):
    for f in os.listdir(os.path.join(ROOT, 'wip')):
        if f.startswith('grok-image-' + prefix):
            return os.path.join(ROOT, 'wip', f)
    raise SystemExit('image introuvable : ' + prefix)


def cutout(full, sess):
    cut = remove(full, session=sess)
    a = np.array(cut.getchannel('A')); m = a > 40
    lab, k = ndi.label(ndi.binary_closing(m, iterations=6))
    sizes = ndi.sum(m, lab, range(1, k + 1)); keep = lab == (1 + int(np.argmax(sizes)))
    m = m & ndi.binary_dilation(keep, iterations=3)
    filled = ndi.binary_fill_holes(ndi.binary_closing(m, iterations=4))
    alpha = Image.fromarray(np.where(filled, 255, 0).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2))
    out = Image.fromarray(np.dstack([np.array(full), np.array(alpha)]), 'RGBA')
    out = out.crop(out.getchannel('A').point(lambda v: 255 if v > 20 else 0).getbbox())
    return out.resize((max(1, round(out.width * 560 / out.height)), 560), Image.LANCZOS)


if __name__ == '__main__':
    sess = new_session('isnet-general-use')
    for cid, face, full, box in NEW:
        base = os.path.join(ROOT, 'assets', 'cats', cid)
        src = Image.open(find(full)).convert('RGB')
        if face:
            fim = Image.open(find(face)).convert('RGB')
        else:
            w, h = src.size; x0, y0, s = box
            fim = src.crop((int(x0 * w), int(y0 * h), int((x0 + s) * w), int(y0 * h + s * w)))
        fim.resize((256, 256), Image.LANCZOS).save(base + '.png', optimize=True)
        cutout(src, sess).save(base + '_full.png', optimize=True)
        print(cid, 'ok', flush=True)
