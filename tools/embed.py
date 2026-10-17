#!/usr/bin/env python3
"""Régénère src/js/images-data.js à partir des illustrations de assets/.

Pour chaque personnage qui a DEUX fichiers dans assets/cats/ ou assets/brainrot/ :
    <id>.png        le visage (carré)
    <id>_full.png   le personnage en pied, détouré
(+ facultatif : <id>_evo1.png / <id>_evo1_full.png, <id>_evo2… : images des évolutions, voir tools/evo.py)
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
    """Personnages illustrés : <id>.png (visage) obligatoire, <id>_full.png (en pied) facultatif."""
    found = []
    for side in ('cats', 'brainrot'):
        for face in sorted(glob.glob(os.path.join(ROOT, 'assets', side, '*.png'))):
            cid = os.path.basename(face)[:-4]
            if '_' in cid:
                continue   # _full, _evo1… : rangés avec leur personnage
            found.append((cid, side))
    # cats d'abord (cat01…), puis brainrot (br01…), comme dans le catalogue
    return sorted(found, key=lambda t: (t[1] != 'cats', t[0]))


parts, total = [], 0
for cid, side in ids_with_pair():
    base = os.path.join(ROOT, 'assets', side, cid)
    face = Image.open(base + '.png').convert('RGB')
    fa = b64(face, quality=80, method=6)
    rec = 'f:"%s"' % fa
    total += len(fa)
    if os.path.exists(base + '_full.png'):   # sans image en pied : le jeu compose le visage sur un corps générique
        full = Image.open(base + '_full.png').convert('RGBA')
        full = full.resize((round(full.width * 400 / full.height), 400), Image.LANCZOS)
        fu = b64(full, quality=78, method=6)
        total += len(fu)
        rec += ',u:"%s"' % fu
    # images d'évolution (facultatives) : <id>_evo1.png / <id>_evo1_full.png (Évolué), _evo2 (Ultime) ; voir tools/evo.py
    for lv in (1, 2):
        ef = base + '_evo%d.png' % lv
        if not os.path.exists(ef):
            continue
        eu = base + '_evo%d_full.png' % lv
        e_face = b64(Image.open(ef).convert('RGB'), quality=74, method=6)
        # fond sombre étincelant gardé (bords fondus en CSS : .evo-art-img), sans transparence : bien plus léger
        e_full = Image.open(eu if os.path.exists(eu) else ef).convert('RGB')
        e_full = b64(e_full.resize((round(e_full.width * 400 / e_full.height), 400), Image.LANCZOS), quality=70, method=6)
        total += len(e_face) + len(e_full)
        rec += ',e%d:{f:"%s",u:"%s"}' % (lv, e_face, e_full)
    parts.append('"%s":{%s}' % (cid, rec))

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
