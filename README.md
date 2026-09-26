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

## Suite prévue

- Empaquetage en application Windows (Tauri) et Android (Capacitor), pour un
  usage 100% hors-ligne.
