#!/usr/bin/env python3
"""Grande fournée de personnages (images nommées « NN-animal-objet.jpg » + « NN-animal-objet-vK.jpg ») :
le carré (1408 px) est le VISAGE, le portrait « -vK » le personnage EN PIED.

    python3 tools/persos.py            découpe les personnages choisis -> assets/<clan>/<id>.png + <id>_full.png
                                       et les autres -> wip/plus-tard/<nom>.png + <nom>_full.png (originaux déplacés à côté)
Ensuite : python3 tools/embed.py. Visage : 256 px. En pied : détouré (rembg), plus gros morceau gardé, trous rebouchés,
hauteur 560 px (voir cutout, commun avec tools/kawaii.py)."""
import glob, os, shutil, sys
from PIL import Image
from rembg import new_session
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from kawaii import cutout

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WIP = os.path.join(ROOT, 'wip')
LATER = os.path.join(WIP, 'plus-tard')
# id du jeu -> nom de l'image (sans numéro ni variante)
CHOIX = {
    # Team Kawaii : Céleste (achat) puis les 15 personnages de défi
    'cat20': 'chat-peintre', 'cat21': 'glace-ours-givre', 'cat22': 'chat-barista', 'cat23': 'lapin-chevalier',
    'cat24': 'air-hibou-magie', 'cat25': 'lapin-archeologue', 'cat26': 'chien-detective', 'cat27': 'cristal-chinchilla-quartz',
    'cat28': 'lapin-plongeur', 'cat29': 'lumiere-lionceau-eclat', 'cat30': 'terre-hamster-galet', 'cat31': 'chat-mecanicien',
    'cat32': 'chien-scientifique', 'cat33': 'chien-astronaute', 'cat34': 'lapin-apiculteur', 'cat35': 'chien-pompier',
    # Brainrots : br08 à br20 (achat) puis br23 à br35 (défis)
    'br08': 'grenouille-smartphone', 'br09': 'axolotl-amanite', 'br10': 'castor-brosse-dents', 'br11': 'requin-basket',
    'br12': 'crabe-clavier', 'br13': 'tortue-laptop', 'br14': 'pingouin-gelato', 'br15': 'cerf-routeur',
    'br16': 'cameleon-cactus', 'br17': 'poule-reveil', 'br18': 'raton-pizza', 'br19': 'souris-souris-ordi',
    'br20': 'colibri-tournesol', 'br23': 'hamster-usb', 'br24': 'crocodile-bombardier', 'br25': 'renard-joystick',
    'br26': 'escargot-imprimante-3d', 'br27': 'koala-tablette', 'br28': 'paresseux-walkman', 'br29': 'perroquet-webcam',
    'br30': 'suricate-appareil-photo', 'br31': 'herisson-grille-pain', 'br32': 'hibou-gramophone', 'br33': 'baleine-vague',
    'br34': 'singe-enceinte', 'br35': 'panthere-glacier',
}


def pairs(folder):
    """{nom: (visage, en pied)} pour les images « NN-nom.jpg » / « NN-nom-vK.jpg » d'un dossier."""
    out = {}
    for f in glob.glob(os.path.join(folder, '[0-9][0-9]-*.jpg')):
        b = os.path.basename(f)[3:-4]
        if b[-3:-1] == '-v' and b[-1].isdigit():
            out.setdefault(b[:-3], [None, None])[1] = f
        else:
            out.setdefault(b, [None, None])[0] = f
    return out


def cut(face, full, dest, sess):
    Image.open(face).convert('RGB').resize((256, 256), Image.LANCZOS).save(dest + '.png', optimize=True)
    cutout(Image.open(full).convert('RGB'), sess).save(dest + '_full.png', optimize=True)


if __name__ == '__main__':
    P = pairs(WIP)
    sess = new_session('isnet-general-use')
    used = set(CHOIX.values())
    for cid, name in CHOIX.items():
        if name not in P:
            print('déjà fait ou absent :', cid, name); continue
        side = 'cats' if cid.startswith('cat') else 'brainrot'
        cut(P[name][0], P[name][1], os.path.join(ROOT, 'assets', side, cid), sess)
        print(cid, name, flush=True)
    os.makedirs(LATER, exist_ok=True)
    for name, (face, full) in sorted(P.items()):
        if name in used or not face or not full:
            continue
        cut(face, full, os.path.join(LATER, name), sess)
        for f in (face, full):
            shutil.move(f, os.path.join(LATER, os.path.basename(f)))
        print('plus tard :', name, flush=True)
