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

## Images d'évolution (facultatives)
`<id>_evo1.png` (visage) et `<id>_evo1_full.png` (en pied) : image du personnage **Évolué** ; `<id>_evo2…` : **Ultime**
(sans image propre, Ultime reprend celle d'Évolué ; sans version en pied, le visage sert). Elles gardent leur fond
(flammes, eau, étincelles) : `tools/evo.py` les fabrique depuis `wip/` (recadrage du visage), puis `tools/embed.py`
les embarque. Aujourd'hui : `cat01` à `cat12`, niveau Évolué.

## Team Kawaii (`assets/cats/` : chats, chiens, lapins…)

| Fichier | Nom |
|---|---|
| cat01.png | Lavandou (départ) |
| cat02.png | Cœurette (départ) |
| cat03.png | Pétale (départ) |
| cat04.png | Étoilou (départ, Soutien) |
| cat05.png | Éclairon (départ, Archer) |
| cat06.png | Gouttelette |
| cat07.png | Matchou |
| cat08.png | Capuche |
| cat09.png | Footin |
| cat10.png | Merlinou |
| cat11.png | Fleurette |
| cat12.png | Flammèche |
| cat13.png | Postou (chien facteur) |
| cat14.png | Vroumi (chien à moto) |
| cat15.png | Kimono (shiba karaté) |
| cat16.png | Bondi (lapin) |
| cat17.png | Souplesse (lapine gymnaste) |
| cat18.png | Frisette (lapin à la brosse) |
| cat19.png | Carotin (lapin jardinier) |
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
| br01.png | Baguetto Montone (départ) |
| br02.png | Maiale Cuvetto (départ) |
| br03.png | Waffolo Papero (départ) |
| br04.png | Spaghettino Orsetto (départ, Soutien) |
| br05.png | Televisiogatto (départ, Archer) |
| br06.png | Elefantino Aspiro |
| br07.png | Cagnolino Ventilo |
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
| br21.png | MiaoStation 5 — Défi chrono Facile · 1 min · 5 bonnes réponses |
| br22.png | Leone Spaghettoni — Défi chrono Facile · 2 min · 8 bonnes réponses |
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

## Images générées (Grok) déjà intégrées

21 personnages ont une vraie illustration (visage `<id>.png` 256 px + plein pied
détouré `<id>_full.png`) : cat01–12, br01–07, br21, br22 (cat06–12 et br06–07 préparés par `tools/proc3.py`). Les originaux sont dans
`wip/`. Les images sont aussi embarquées en base64 dans `index.html` (bloc
`IMG_DATA_START … IMG_DATA_END`) pour que l'aperçu publié (fichier unique) les
affiche. Les autres personnages gardent leur dessin procédural en attendant.

## Bannière

`assets/branding/banniere.png` (1920×640) : 3 chats kawaii (cat03, cat02, cat01) à gauche, 3 brainrots (br05, br22, br02) à droite,
titre « KAWAII VS BRAINROT » et bandeau « Le jeu de maths du CE1 » au centre. Générée à partir des images en pied existantes par
`python3 tools/banniere.py` (les personnages se changent en tête du script, tableaux `cats` et `brains`).
