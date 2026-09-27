# Géo Miaou / GEO CHAOS 9000 — app de géométrie CE1

Application de géométrie pour le CE1 (thème kawaii chats vs. brainrot),
en un seul fichier HTML autonome (`index.html`), sans dépendance externe.

## Modules

1. **Mesurer** — lecture de règle
2. **Déformer** — manipulation de formes
3. **Patron → Cube** — pliage de patron en 3D
4. **QCM Formes** — quiz multi-types (formes, repérage, solides, énigmes...)
5. **Horloge** — lecture et réglage de l'heure
6. **Boutique** — achat de personnages avec les étoiles gagnées, et mode
   Bataille (comparaison de statistiques entre un chat et un brainrot)

## Utiliser tes propres images de personnages

Les 40 personnages (20 chats + 20 brainrots) sont dessinés par le code (SVG
généré en JavaScript), et **chacun a aussi son fichier `.svg` dans
`assets/cats/` et `assets/brainrot/`** — un export exact de ce que le jeu
affiche actuellement. Tu peux remplacer n'importe lequel par ta propre
image :

1. Regarde `assets/MANIFEST.md` pour trouver l'identifiant du personnage
   (ex. `cat01` pour Mochi) et l'ordre de priorité des formats.
2. Remplace le fichier existant dans `assets/cats/` ou `assets/brainrot/`
   (ou ajoute un `.png`/`.jpg` du même nom à côté, qui sera prioritaire).
3. Ouvre (ou recharge) `index.html` depuis ce dépôt — la nouvelle image
   apparaît automatiquement, sans toucher au code.

Si le fichier est supprimé, le dessin généré par le code réapparaît tout
seul (rien n'est perdu : le code de dessin original reste dans `index.html`).

**Important** : ce mécanisme fonctionne quand `index.html` est ouvert depuis
ce dépôt (en local, via GitHub Pages, ou une fois empaqueté en app
Windows/Android). Le lien d'aperçu publié séparément sur claude.ai est une
page isolée qui ne voit pas ce dépôt : pour que les images choisies y
apparaissent aussi, il faut les faire republier explicitement dans cette
page-là.

## Mascotte perso et affichage tête / plein pied en Bataille

N'importe quel personnage débloqué (chat ou brainrot) peut devenir **la
mascotte** de l'appli :

1. Dans la **Boutique**, sur une carte de personnage débloquée, clique sur
   **« ☆ Devenir mascotte »**. Elle apparaît alors en tête (petite icône)
   dans la barre du haut, et en pied dans le coin bas-droit de l'écran, à
   la place du buste générique. Reclique sur le même bouton (devenu
   **« ★ Mascotte actuelle »**) pour revenir à la mascotte générique du
   thème.
2. Pour le visuel en bas de l'écran, deux niveaux d'assets perso sont
   possibles, comme pour les personnages :
   - S'il n'existe que le portrait habituel (ex. `assets/brainrot/br02.png`),
     ce portrait est affiché comme « tête » posée sur le buste générique
     déjà dessiné par le code.
   - Si en plus un fichier **`<id>_full.png`** (ou `.svg`/`.jpg`) existe à
     côté, par exemple `assets/brainrot/br02_full.png`, ce fichier est
     utilisé tel quel : il doit représenter le personnage **en pied** (corps
     entier), et remplace complètement le buste générique.

Dans l'onglet **Bataille**, le réglage global **⚙️ Réglages → « Affichage
des personnages en Bataille »** permet de choisir si les cartes des
combattants (Duel rapide et Mode Équipe) montrent leur **tête** (portrait,
comme aujourd'hui) ou leur **corps en pied** — avec la même logique de
substitution en deux temps (asset `_full` si présent, sinon buste générique
+ tête du personnage).

## Écran de démarrage

L'appli s'ouvre sur un écran de présentation ("Géo Miaou VS Geo Chaos 9000")
avec un visuel chat kawaii / brainrot face à face, dessiné par le code (voir
`drawSplashArt` dans `index.html`, même technique que les personnages). Un
export fixe de ce visuel vit dans `assets/branding/splash-cat-vs-brainrot.svg`
pour réutilisation hors appli (icône, réseaux, packaging futur).

### Remplacer l'écran de démarrage par ta propre image (ou vidéo/GIF animé)

Comme pour les personnages, tu peux remplacer ce dessin par ton propre
visuel, animé ou non, sans toucher au code :

1. Dépose un fichier nommé **`splash`** dans `assets/branding/`, avec l'une
   de ces extensions (ordre de priorité si plusieurs sont présents) :
   `.mp4`, `.webm` (vidéo, lue automatiquement en boucle et sans son),
   puis `.gif`, `.webp`, `.png`, `.jpg`/`.jpeg`, `.svg` (image, animée ou non).
2. Ouvre (ou recharge) `index.html` depuis ce dépôt — le nouveau visuel
   apparaît automatiquement au démarrage, à la place du dessin généré.

Si le fichier est supprimé, le dessin procédural réapparaît tout seul.
**Important** : comme pour les personnages, ce mécanisme fonctionne quand
`index.html` est ouvert depuis ce dépôt ; le lien d'aperçu publié séparément
sur claude.ai ne voit pas ce dépôt et affichera toujours le dessin généré,
sauf à republier le fichier directement dans cette page-là (voir plus haut).

## Suite prévue

- Empaquetage en application Windows (Tauri) et Android (Capacitor), pour un
  usage 100% hors-ligne.
