# HISTORIQUE — résumé du travail réalisé avec Claude

Document de reprise : il permet de repartir d'une conversation neuve sans rien perdre. À lire en premier si le contexte a été compressé.

## 1. Le projet
Jeu de géométrie pour une élève de **CE1**, en français, dans **un seul fichier** `index.html` (HTML + CSS + JS, aucune dépendance). Deux clans : **Chats kawaii** (Géo Miaou) et **Brainrot** (Geo Chaos 9000).

- Dépôt : `jsoudeer/geometrie` (branche `main`).
- Aperçu publié : artifact Claude `https://claude.ai/artifact/77Awfhh3EpPUAUGj2XgaVs` (à republier après chaque changement ; version 28 au moment de l'écriture).
- `cours.md` : liste des exercices, niveaux, défis. `README.md` : présentation. `assets/MANIFEST.md` : noms de fichiers des personnages.

## 2. Règle de travail convenue
À chaque évolution : **tester dans un vrai navigateur → commit → push → republier l'aperçu → rendre compte en français** (court, l'essentiel d'abord). L'utilisateur n'est pas développeur : pas de jargon.

## 3. Ce qui a été construit (par grandes étapes)

**Base** : mesurer à la règle, déformer une forme, patron → solide (animation 3D), quizz (21 types), horloge (lire / régler), boutique de personnages, bataille, modes Aléatoire / Chronométré / Manuel, effets sonores et visuels (mode Overload), écran de démarrage.

**Corrections notables** : le buste générique restait visible derrière une mascotte en pied (`.hidden` ne marche pas sur un `<svg>` → attribut posé à la main) ; la pyramide ne se refermait pas (angle de pliage 127,98° calculé, triangles enfants de la base) ; patrons à 5 et 7 faces ajoutés ; explication Patron → Solide non cliquable (corrigé, toucher = question suivante).

**Allègement de l'interface** : en chronométré, écran compact sans défilement + bouton 🏠 pour quitter ; boutique limitée au clan actif, personnages débloqués et à obtenir côte à côte ; bouton de thème à gauche des ⭐ ; bouton ☰ Menu sous l'image de la mascotte (la ligne Facile / Moyen / Difficile / Manuel / Boutique est repliée) ; mascotte : image en haut à gauche, plein pied en bas à droite, **sous** les boutons de réponse et légèrement transparent.

**Bataille refondue** : une seule caractéristique (points = attaque et énergie) ; Soutien +5 aux alliés ; Archer sans dégâts en retour ; équipe 3 classiques + 1 Soutien + 1 Archer ; 3 cartes sur le terrain avec remplacement ; on joue avec le clan actif ; victoire +3 ⭐. Équilibrage vérifié par simulation (`tools/tests/sim.js`) : au hasard ≈ 50 % de victoires, en jouant bien ≈ 70 %.

**Défis** : 15 personnages par clan non achetables. 12 défis chronométrés (seuils dans `cours.md`) + 3 séries de 20 bonnes réponses sans erreur (mode Aléatoire). Un défi débloque le chat **et** le brainrot du même numéro (`cat21–35` / `br21–35`). Clic sur une carte verrouillée = explication.

**Accessibilité (RGAA)** : contrastes vérifiés automatiquement dans les deux thèmes, focus visible, libellés pour lecteurs d'écran, boîtes de dialogue fermées par Échap, coins de la forme déplaçables au clavier, ✔ / ✘ en plus de la couleur, police Rubik pour le Brainrot (la police décorative n'est gardée que pour le titre).

**Pédagogie** : chaque question a une explication propre (patrons, horloge, alignement, solides, énigmes, angles) ; plus de « ou alors il y a un trou ».

**Réglages** : effets, avancement automatique, affichage des cartes en bataille, configuration des activités, **Effacer ma progression** (2 étapes), « Tout débloquer » (test).

**Illustrations (Grok)** : 12 personnages ont de vraies images (visage + plein pied détouré) : `cat01–05`, `br01–05`, `br21`, `br22`. Les autres gardent un dessin SVG simple. Voir §5.

## 4. Structure du code (`index.html`)
Tout est dans une fonction anonyme (IIFE). Repères pour s'y retrouver :
- `THEMES`, `applyTheme`, `setMenuOpen` : thème et navigation.
- `M1_LEVELS`… : Mesurer ; `M2_LEVELS`, `perturbForLevel` : Déformer ; `NET_*`, `NET_DEFS`, `netExplain` : patrons ; `QCM_TYPE_DEFS`, `gen*Question` : quizz ; `genHeureQuestion`, `clockExplain` : horloge.
- Orchestrateur : `nextPracticeQuestion`, `setGlobalLevel`, `startCountdown`, `endCountdown`, `onPracticeAnswered` (séries).
- Personnages : `mkSprite`, `mkReward`, `ROLE_BY_ID`, `STARTER_IDS`, `CAT_REWARD_DEFS`, `BRAIN_REWARD_DEFS`, `drawCatSprite`, `drawBrainrotSprite`.
- Images : bloc `/*IMG_DATA_START*/ … /*IMG_DATA_END*/` (`CUSTOM_IMG`, base64), `tryLoadCustomImage`, `tryLoadFullBodyImage`.
- Défis : `challengeInfo`, `completeChallenge`, `checkTimedChallenge`.
- Boutique : `renderShop`, `buildSpriteShopCard` ; mascotte : `renderMascotDock`, `renderTopMascotIcon`.
- Bataille : `btStart`, `btResolveAttack`, `btChooseEnemyMove`, `btCheckEnd`.
- Sauvegarde : `localStorage` (`geo_stars`, `geo_owned_cats`, `geo_owned_brain`, `geo_mascot_id`, `geo_theme`, `geo_bt_team_*`, `geo_fighter_display`, réglages…).

## 5. Ajouter des personnages illustrés (procédure)
1. L'utilisateur dépose les images Grok (fond uni conseillé) dans `wip/`, par paires visage / plein pied.
2. Détourage du plein pied avec `rembg` (`pip install --break-system-packages rembg onnxruntime`) : `tools/proc.py`. Pour les personnages à pelage blanc, `tools/proc2.py` remplit les zones enclavées (le fond blanc trouait le pelage).
3. `tools/embed.py` : écrit `assets/<clan>/<id>.png` (visage 256 px) et `<id>_full.png`, encode en WebP base64 dans `index.html`, renomme les personnages.
4. Vérifier (boutique, bataille, mascotte, contraste), commit, push, republier.
Les scripts contiennent la correspondance image → personnage : à adapter. Les sorties temporaires vont dans `/tmp/geo_img/`.

Consigne de prompt Grok qui marche bien : « Extend the previous image with full body standing whole body, and imagine more fuze with the same object » (plein pied) ; « A funny "Italian brainrot"-style absurd animal made of a mélange of one specific animal and one specific object, head and shoulders only, square framing, silly, weird but friendly, pixar style, not scary » (visage). Rester sur des personnages originaux, pas des personnages de meme existants.

## 6. Tests (dans `tools/tests/`)
Playwright + Chromium (`/opt/pw-browsers/chromium`). `lib.js` sert le dépôt en local avec le bon encodage (`/index_test.html` expose des fonctions internes via `window.__t`, sans écrire de fichier). Copier le dossier vers `/tmp/geo_tests/` avant de lancer (les scripts s'y attendent), ou adapter les chemins.
- `battle_check.js` : boutique, info défi, équipe, combat complet. `challenge_check.js` : défis, séries, effacement. `net_check.js` : explications de patrons. `contrast_audit.js` : contrastes AA (les boutons désactivés sont exemptés). `header_check.js`, `mascot_layer.js` : en-tête et calque de la mascotte. `sim.js` : équilibrage.

## 7. Pièges déjà rencontrés
- `index.html` est un fragment sans `<head>` : le publier tel quel ajoute l'encodage ; en test local, servir avec `charset=utf-8`.
- Les fonctions définies plus bas dans la fonction anonyme sont utilisables plus tôt, mais pas les variables (`var`) : garder les gardes (`if(!CAT_REWARDS…)`).
- Les `className = …` écrasent les classes : toujours remettre `tappable` dans les retours de réponse.
- Superposition : `.mascot-dock{z-index:1}` et `.card > *{z-index:2}` (les réponses passent au-dessus de la mascotte).
- Ne pas réduire l'opacité du texte (contraste) : griser seulement l'illustration des cartes verrouillées.
- Republier l'aperçu : l'outil exige de relire la version en ligne avant d'écraser (elle était identique à la dernière publication).

## 8. Idées restantes
- Illustrer les 58 personnages restants (priorité aux défis difficiles).
- Renard à nœud bleu (deux plein pied sans visage) : à confirmer avec l'utilisateur.
- Pas de réglage général du décor de l'écran de démarrage.
