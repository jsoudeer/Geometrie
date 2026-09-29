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

Pour régénérer ces 70 fichiers `.svg` à partir du code (par exemple après
avoir demandé à Claude de modifier l'apparence d'un personnage dans le
code), il suffit de redemander l'export : Claude fait tourner le dessin
généré dans un navigateur et réenregistre chaque `.svg` à jour.

## Chats (`assets/cats/`)

| Fichier | Nom |
|---|---|
| cat01.png | Mochi (personnage de départ, débloqué d'office) |
| cat02.png | Fraise (départ) |
| cat03.png | Nuage (départ) |
| cat04.png | Biscuit (départ, Soutien) |
| cat05.png | Praline (départ, Archer) |
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
| cat21.png | Flocon — Défi chrono Facile · 1 min · 5 bonnes réponses |
| cat22.png | Muffin — Défi chrono Facile · 2 min · 8 bonnes réponses |
| cat23.png | Caramel — Défi chrono Facile · 3 min · 10 bonnes réponses |
| cat24.png | Zéphyr — Défi chrono Facile · 5 min · 15 bonnes réponses |
| cat25.png | Saphir — Défi chrono Moyen · 1 min · 4 bonnes réponses |
| cat26.png | Truffe — Défi chrono Moyen · 2 min · 6 bonnes réponses |
| cat27.png | Perle — Défi chrono Moyen · 3 min · 8 bonnes réponses |
| cat28.png | Cookie — Défi chrono Moyen · 5 min · 12 bonnes réponses |
| cat29.png | Aurore — Défi chrono Difficile · 1 min · 3 bonnes réponses |
| cat30.png | Volcan — Défi chrono Difficile · 2 min · 5 bonnes réponses |
| cat31.png | Tonnerre — Défi chrono Difficile · 3 min · 7 bonnes réponses |
| cat32.png | Comète — Défi chrono Difficile · 5 min · 10 bonnes réponses |
| cat33.png | Astro — Série sans faute · Facile · 20 bonnes réponses d'affilée |
| cat34.png | Galaxie — Série sans faute · Moyen · 20 bonnes réponses d'affilée |
| cat35.png | Phénix — Série sans faute · Difficile · 20 bonnes réponses d'affilée |

## Brainrots (`assets/brainrot/`)

| Fichier | Nom |
|---|---|
| br01.png | Tarallino Turbo (personnage de départ, débloqué d'office) |
| br02.png | Fettuccino Furioso (départ) |
| br03.png | Broccolino Bang (départ) |
| br04.png | Salamino Sprint (départ, Soutien) |
| br05.png | Peperoncino Pazzo (départ, Archer) |
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
| br21.png | Gelatino Gagà — Défi chrono Facile · 1 min · 5 bonnes réponses |
| br22.png | Polpettone Pop — Défi chrono Facile · 2 min · 8 bonnes réponses |
| br23.png | Ciabattino Cric — Défi chrono Facile · 3 min · 10 bonnes réponses |
| br24.png | Tiramisù Tuono — Défi chrono Facile · 5 min · 15 bonnes réponses |
| br25.png | Carciofo Comico — Défi chrono Moyen · 1 min · 4 bonnes réponses |
| br26.png | Bruschetta Bum — Défi chrono Moyen · 2 min · 6 bonnes réponses |
| br27.png | Pistacchio Pop — Défi chrono Moyen · 3 min · 8 bonnes réponses |
| br28.png | Cornetto Crash — Défi chrono Moyen · 5 min · 12 bonnes réponses |
| br29.png | Gorgonzolo Gong — Défi chrono Difficile · 1 min · 3 bonnes réponses |
| br30.png | Melanzano Magico — Défi chrono Difficile · 2 min · 5 bonnes réponses |
| br31.png | Prosciutto Pazzo — Défi chrono Difficile · 3 min · 7 bonnes réponses |
| br32.png | Pecorino Pow — Défi chrono Difficile · 5 min · 10 bonnes réponses |
| br33.png | Limoncello Laser — Série sans faute · Facile · 20 bonnes réponses d'affilée |
| br34.png | Mozzarello Mega — Série sans faute · Moyen · 20 bonnes réponses d'affilée |
| br35.png | Tartufo Titano — Série sans faute · Difficile · 20 bonnes réponses d'affilée |

## Personnages « Défi » (n° 21 à 35)

Ces 15 personnages par clan **ne s'achètent pas** : ils se débloquent en
relevant un défi (le même numéro débloque le chat ET le brainrot). Un clic sur
leur carte dans la Boutique explique comment les obtenir.
