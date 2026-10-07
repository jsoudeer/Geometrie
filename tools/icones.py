#!/usr/bin/env python3
"""Régénère les icônes de l'appli (docs/icons/) à partir du premier chat du jeu : assets/cats/cat01.png (Lavandou).

    python3 tools/icones.py

Icône « any » : le visage plein cadre. Icône « maskable » (Android) : le visage réduit à 64 % sur le fond uni
de l'image, pour rester entier quel que soit le masque (rond, carré arrondi…). Les icônes sont des fichiers fixes
(le build ne les touche pas) : à relancer seulement si l'image change."""
import os
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src = Image.open(os.path.join(ROOT, 'assets/cats/cat01.png')).convert('RGB')
bg = src.getpixel((2, 2))   # fond uni lavande de l'image
out = os.path.join(ROOT, 'docs/icons')


def plein(size):
    return src.resize((size, size), Image.LANCZOS)


def masque(size, part=0.64):
    img = Image.new('RGB', (size, size), bg)
    c = int(size * part)
    img.paste(src.resize((c, c), Image.LANCZOS), ((size - c) // 2, (size - c) // 2))
    return img


plein(192).save(os.path.join(out, 'icon-192.png'), optimize=True)
plein(512).save(os.path.join(out, 'icon-512.png'), optimize=True)
masque(512).save(os.path.join(out, 'maskable-512.png'), optimize=True)
plein(180).save(os.path.join(out, 'apple-touch-icon.png'), optimize=True)
print('icônes écrites ; couleur de fond : #%02X%02X%02X' % bg)
