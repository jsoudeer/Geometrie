# Géo Miaou / GEO CHAOS 9000 — app de géométrie CE1

Application de géométrie pour le CE1 (thème kawaii chats vs. brainrot),
en un seul fichier HTML autonome (`index.html`), sans dépendance externe.

## Modules

1. **Mesurer** — lecture de règle
2. **Déformer** — manipulation de formes
3. **Patron → Cube** — pliage de patron en 3D
4. **QCM Formes** — quiz multi-types (formes, repérage, solides, énigmes...)
5. **Horloge** — lecture et réglage de l'heure
6. **Boutique** — personnages du clan actif (débloqués et à obtenir côte à
   côte), achat avec les étoiles, personnages « Défi » à débloquer
7. **Bataille** — combat d'équipes de cartes (voir plus bas)

## Utiliser tes propres images de personnages

Les 70 personnages (35 chats + 35 brainrots) sont dessinés par le code (SVG
généré en JavaScript), et **chacun a aussi son fichier `.svg` dans
`assets/cats/` et `assets/brainrot/`** — un export exact de ce que le jeu
affiche actuellement. Tu peux remplacer n'importe lequel par ta propre
image :

1. Regarde `assets/MANIFEST.md` pour trouver l'identifiant du personnage
   (ex. `cat01` pour Lavandou) et l'ordre de priorité des formats.
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
combattants montrent leur **tête** (portrait) ou leur **corps en pied** — avec
la même logique de substitution en deux temps (asset `_full` si présent, sinon
buste générique + tête du personnage).

Le personnage en pied est affiché en bas à droite de l'écran, **sous** les
boutons de réponse et légèrement transparent, pour ne jamais gêner la lecture ;
la petite image de la mascotte est en haut à gauche, avec le bouton **Menu**
juste en dessous (il ouvre/ferme la ligne Facile · Moyen · Difficile · Manuel ·
Boutique).

## Bataille

Tu joues avec le **clan actif** (le bouton à gauche des étoiles bascule entre
Chats Kawaii et Brainrot) contre l'autre clan.

- Une seule caractéristique par personnage : ses **points ❤️**, qui sont à la
  fois sa force d'attaque et son énergie.
- Quand A attaque B : B perd autant de points que A en a, et A perd autant de
  points que B en avait. Une carte à 0 est battue.
- 💖 **Soutien** : donne +5 points à tous ses alliés (ceux déjà sur le terrain
  quand il arrive, puis chaque allié qui arrive ensuite tant qu'il est là).
- 🏹 **Archer** : attaque sans jamais perdre de points en retour.
- Équipe : **3 classiques + 1 soutien + 1 archer**. 3 cartes tirées au hasard
  sont posées sur le terrain ; quand une carte est battue, une carte de la
  réserve la remplace. Le camp qui n'a plus aucune carte a perdu (+3 ⭐ pour
  une victoire).

L'adversaire est choisi pour rester du même niveau que ta meilleure carte
(équilibrage mesuré par simulation : ~50 % de victoires en tapant au hasard,
~70 % en jouant attentivement).

## Personnages « Défi » (15 par clan)

Non achetables, ils se débloquent en relevant des défis — un défi réussi
débloque **le chat ET le brainrot** du même numéro :

| Niveau | 1 min | 2 min | 3 min | 5 min | Série sans faute |
|---|---|---|---|---|---|
| Facile | 5 | 8 | 10 | 15 | 20 d'affilée |
| Moyen | 4 | 6 | 8 | 12 | 20 d'affilée |
| Difficile | 3 | 5 | 7 | 10 | 20 d'affilée |

Les 4 premières colonnes : nombre de **bonnes réponses** à atteindre en mode
**Chronométré** avant la fin du temps. La dernière : 20 bonnes réponses
d'affilée, sans aucune erreur, en mode **Aléatoire** (un compteur 🔥 s'affiche
au-dessus de la question). Un clic sur la carte d'un personnage « Défi » dans la
Boutique explique comment le débloquer. **⚙️ Réglages → « Effacer ma
progression »** remet à zéro étoiles, personnages débloqués et mascotte.

## Accessibilité (RGAA / WCAG AA)

Contrastes texte/fond ≥ 4,5:1 dans les deux thèmes (mesurés par un audit
automatique), bordures des contrôles ≥ 3:1, focus clavier visible, boutons
nommés, boîtes de dialogue (`role="dialog"`, Échap pour fermer), retours de
réponse annoncés (`aria-live`), déformation des formes utilisable au clavier
(flèches), état correct/incorrect signalé aussi par un symbole ✔ / ✘. Le thème
Brainrot utilise une police de lecture (Rubik) pour les questions.

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

## Développement

`index.html` est **généré** à partir des sources du dossier `src/` (un fichier par thème :
géométrie, horloge, calcul, patron/3D, puis orchestrateur, boutique, bataille). Après une
modification de `src/` : `python3 tools/build.py`. Organisation détaillée et façon d'ajouter
un thème ou des questions : `src/README.md`. Tests : `tools/tests/` (dont `golden.js`, la
comparaison « avant / après »).

## Suite prévue

- Empaquetage en application Windows (Tauri) et Android (Capacitor), pour un
  usage 100% hors-ligne.
