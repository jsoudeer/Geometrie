#!/usr/bin/env python3
"""Team Kawaii en 2D (17/10/2026) : remplace les images 3D de cat13 à cat35 par leurs versions 2D déposées dans wip/.

    python3 tools/kawaii2d.py      puis      python3 tools/embed.py

Visage : l'image carrée, 256 px. En pied : l'image portrait détourée (voir cutout, tools/kawaii.py). Sans image en pied
(None), l'ancien <id>_full.png est supprimé : le jeu compose alors le visage sur un corps générique."""
import os, sys
from PIL import Image
from rembg import new_session
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from kawaii import cutout, find

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# id, début du nom de l'image visage, début du nom de l'image en pied (ou None)
NEW = [
    ('cat13', '925d9028', None),
    ('cat14', 'de274867', None),
    ('cat15', 'b6e49917', '6a7dfa3e'),
    ('cat16', '74c5e944', None),
    ('cat17', 'ceed7bec', '133648e5'),
    ('cat18', '5b3fb794', 'ee181743'),
    ('cat19', 'cd485da6', 'fbec227d'),
    ('cat20', 'f67f5701', 'dc8f7230'),
    ('cat21', '07a2f359', 'df72cf51'),
    ('cat22', '37d42600', '83b7cf29'),
    ('cat23', '0198616a', '40abbdf1'),
    ('cat24', '522e2778', '6e850311'),
    ('cat25', 'ed907fba', None),
    ('cat26', 'a6247ec5', 'c6d6bc7f'),
    ('cat27', '0e2066e0', '9a2d5976'),
    ('cat28', '2061dfcc', '425695b5'),
    ('cat29', 'dcd8a56a', '5170690b'),
    ('cat30', '62a1c788', '07e35535'),
    ('cat31', '6281925b', '501cfb0f'),
    ('cat32', 'c507221c', '23a03e75'),
    ('cat33', '121896db', '7e08cb94'),
    ('cat34', '4b06fe0f', 'e773a758'),
    ('cat35', '2379d6e4', 'ee95e52c')
]

if __name__ == '__main__':
    sess = new_session('isnet-general-use')
    for cid, face, full in NEW:
        base = os.path.join(ROOT, 'assets', 'cats', cid)
        Image.open(find(face)).convert('RGB').resize((256, 256), Image.LANCZOS).save(base + '.png', optimize=True)
        if full:
            cutout(Image.open(find(full)).convert('RGB'), sess).save(base + '_full.png', optimize=True)
        elif os.path.exists(base + '_full.png'):
            os.remove(base + '_full.png')
        print(cid, 'ok', flush=True)
