#!/usr/bin/env python3
"""Images d'ÉVOLUTION des personnages : wip/ -> assets/<clan>/<id>_evo<n>.png (visage) et <id>_evo<n>_full.png (en pied).

    python3 tools/evo.py

Les images évoluées gardent leur fond (flammes, eau, étincelles : c'est l'effet « évolué » ; le détourage
automatique le rendait translucide). Visage : carré recadré sur la tête (boîte en fractions de l'image, choisie
à l'œil), 256 px. En pied : l'image entière, 560 px (le jeu fond ses bords à l'affichage : elle se pose sur la
carte sans arête dure). Ensuite : python3 tools/embed.py (encode et reconstruit index.html).
Correspondance : (id, niveau d'évolution, fichier wip, boîte du visage x0, y0, côté)."""
import os
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
W = lambda name: os.path.join(ROOT, 'wip', 'grok-image-' + name + '.jpg')
EVO = [
    ('cat01', 1, '927146f1-acef-4637-9020-b409eb94c7de', 0.10, 0.00, 0.55),
    ('cat02', 1, '1bbc8c8a-35c3-4d57-8a99-30979008326f', 0.18, 0.02, 0.55),
    ('cat03', 1, 'f10fd286-0aa9-4a5c-97a7-a2b72c562e2d', 0.22, 0.00, 0.56),
    ('cat04', 1, 'f7fc1067-1441-4f91-a073-e378f97fa7e6', 0.28, 0.00, 0.52),
    ('cat05', 1, '79ad31c9-478c-47b3-b683-9d2d4d497494', 0.40, 0.00, 0.52),
    ('cat06', 1, '4bb81022-aff2-44ee-82fb-270f309ec73a', 0.27, 0.00, 0.52),
    ('cat07', 1, '28c134a1-9d3a-4a75-bb62-f0a65baafa93', 0.22, 0.00, 0.52),
    ('cat08', 1, '4ebc429e-6d60-4935-84ec-666f2ebadc36', 0.22, 0.02, 0.52),
    ('cat09', 1, '47d9f852-e3ef-4f60-bb08-59cf130bf891', 0.24, 0.00, 0.52),
    ('cat10', 1, '18105a83-24e5-46e5-8f05-98a801ac963f', 0.22, 0.00, 0.54),
    ('cat11', 1, '8799cc6f-4969-4533-83f6-29971c9aba4a', 0.20, 0.04, 0.54),
    ('cat12', 1, '450d596f-6c7f-458e-bc5d-cf6524d4d2f1', 0.26, 0.06, 0.54),
]



if __name__ == '__main__':
    for cid, lv, name, x0, y0, s in EVO:
        side = 'cats' if cid.startswith('cat') else 'brainrot'
        src = Image.open(W(name)).convert('RGB')
        w, h = src.size
        box = (int(x0 * w), int(y0 * h), int((x0 + s) * w), int(y0 * h + s * w))
        base = os.path.join(ROOT, 'assets', side, '%s_evo%d' % (cid, lv))
        src.crop(box).resize((256, 256), Image.LANCZOS).save(base + '.png', optimize=True)
        src.resize((560, round(560 * h / w)), Image.LANCZOS).save(base + '_full.png', optimize=True)   # bords fondus à l'affichage (CSS)
        print(cid, 'évolution', lv, 'ok')
