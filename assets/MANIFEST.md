# Personnages — noms de fichiers attendus

**Chaque personnage a maintenant un fichier `.svg` dans ce dépôt**
(`assets/cats/catNN.svg`, `assets/brainrot/brNN.svg`) : c'est un export exact
du dessin actuellement généré par le code pour ce personnage. Ce ne sont pas
des images "en plus" à côté du dessin procédural — ce sont bien celles que le
jeu affiche aujourd'hui, mises à disposition en fichiers pour pouvoir être
remplacées facilement.

Pour changer un personnage : ouvre/édite ou remplace le fichier `.svg`
correspondant (ou dépose un `.png`/`.jpg` du même nom, voir l'ordre de
priorité ci-dessous), en gardant EXACTEMENT le même nom de fichier.

Priorité si plusieurs formats existent pour le même identifiant :
`.png` > `.svg` > `.jpg`. Exemple : si `assets/cats/cat01.png` ET
`assets/cats/cat01.svg` existent tous les deux, c'est le `.png` qui est
utilisé.

Aucune autre modification n'est nécessaire : le jeu détecte le fichier tout
seul au chargement de la page. Si un fichier est supprimé, le dessin généré
par le code réapparaît automatiquement à sa place (le code de dessin reste
présent, il n'est jamais perdu).

Format conseillé pour une image de remplacement : carrée (par ex. 256x256),
fond transparent de préférence (PNG ou SVG).

Pour régénérer ces 40 fichiers `.svg` à partir du code (par exemple après
avoir demandé à Claude de modifier l'apparence d'un personnage dans le
code), il suffit de redemander l'export : Claude fait tourner le dessin
généré dans un navigateur et réenregistre chaque `.svg` à jour.

## Chats (`assets/cats/`)

| Fichier | Nom |
|---|---|
| cat01.png | Mochi (personnage de départ, débloqué d'office) |
| cat02.png | Fraise |
| cat03.png | Nuage |
| cat04.png | Biscuit |
| cat05.png | Praline |
| cat06.png | Câlin |
| cat07.png | Doudou |
| cat08.png | Pompon |
| cat09.png | Cannelle |
| cat10.png | Réglisse |
| cat11.png | Framboise |
| cat12.png | Sushi |
| cat13.png | Velours |
| cat14.png | Chamallow |
| cat15.png | Pixel |
| cat16.png | Étincelle |
| cat17.png | Câline |
| cat18.png | Nougat |
| cat19.png | Impériale |
| cat20.png | Céleste |

## Brainrots (`assets/brainrot/`)

| Fichier | Nom |
|---|---|
| br01.png | Tarallino Turbo (personnage de départ, débloqué d'office) |
| br02.png | Fettuccino Furioso |
| br03.png | Broccolino Bang |
| br04.png | Salamino Sprint |
| br05.png | Peperoncino Pazzo |
| br06.png | Lasagnone Lampo |
| br07.png | Grissino Ghost |
| br08.png | Cannolotto Caos |
| br09.png | Raviolone Rex |
| br10.png | Basilico Boom |
| br11.png | Tortellino Tornado |
| br12.png | Focacciotto Fury |
| br13.png | Zeppolino Zap |
| br14.png | Panettonio Punch |
| br15.png | Mortadellone Max |
| br16.png | Caprese Comet |
| br17.png | Arancino Alieno |
| br18.png | Struzzolino Strike |
| br19.png | Gnoccotto Gigante |
| br20.png | Biscottino Blitz |
