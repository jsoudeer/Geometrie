#!/usr/bin/env python3
"""Régénère src/js/images-data.js à partir des illustrations de assets/.

Pour chaque personnage qui a DEUX fichiers dans assets/cats/ ou assets/brainrot/ :
    <id>.png        le visage (carré)
    <id>_full.png   le personnage en pied, détouré
le script les encode en WebP base64 (pour que index.html reste un fichier unique
et autonome), puis relance tools/build.py pour reconstruire index.html.

    python3 tools/embed.py

Procédure complète pour ajouter des personnages : voir HISTORIQUE.md §5
(les images brutes vont dans wip/, tools/proc.py les détoure, puis on dépose
les paires <id>.png / <id>_full.png dans assets/, puis on lance ce script).
"""
import base64, glob, io, os, subprocess, sys
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'src', 'js', 'images-data.js')


def b64(im, **kw):
    bio = io.BytesIO()
    im.save(bio, 'WEBP', **kw)
    return 'data:image/webp;base64,' + base64.b64encode(bio.getvalue()).decode()


def ids_with_pair():
    found = []
    for side in ('cats', 'brainrot'):
        for full in sorted(glob.glob(os.path.join(ROOT, 'assets', side, '*_full.png'))):
            cid = os.path.basename(full)[:-len('_full.png')]
            if os.path.exists(os.path.join(ROOT, 'assets', side, cid + '.png')):
                found.append((cid, side))
    # cats d'abord (cat01…), puis brainrot (br01…), comme dans le catalogue
    return sorted(found, key=lambda t: (t[1] != 'cats', t[0]))


parts, total = [], 0
for cid, side in ids_with_pair():
    base = os.path.join(ROOT, 'assets', side, cid)
    face = Image.open(base + '.png').convert('RGB')
    full = Image.open(base + '_full.png').convert('RGBA')
    full = full.resize((round(full.width * 440 / full.height), 440), Image.LANCZOS)
    fa, fu = b64(face, quality=82), b64(full, quality=86, method=6)
    total += len(fa) + len(fu)
    parts.append('"%s":{f:"%s",u:"%s"}' % (cid, fa, fu))

splash = b64(Image.open(os.path.join(ROOT, 'assets', 'branding', 'splash.png')).convert('RGB'), quality=80, method=6)
total += len(splash)
block = ('/*IMG_DATA_START*/var CUSTOM_IMG={' + ',\n'.join(parts) + '};\n  var SPLASH_IMG="' + splash + '";/*IMG_DATA_END*/')
header = ("  // Images générées (visage 'f' et plein pied détouré 'u'), embarquées en base64\n"
          "  // pour que l'aperçu publié (fichier unique) les affiche aussi.\n"
          "  // FICHIER GÉNÉRÉ par tools/embed.py à partir de assets/ : ne pas modifier à la main.\n")
with open(OUT, 'w', encoding='utf-8', newline='') as f:
    f.write(header + '  ' + block + '\n')
print('%d personnages, %d Ko embarqués -> %s' % (len(parts), total // 1024, os.path.relpath(OUT, ROOT)))
subprocess.run([sys.executable, os.path.join(ROOT, 'tools', 'build.py')], check=True)
