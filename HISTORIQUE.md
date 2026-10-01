# HISTORIQUE — résumé du travail réalisé avec Claude

Document de reprise : il permet de repartir d'une conversation neuve sans rien perdre. À lire en premier si le contexte a été compressé.

## 1. Le projet
Jeu de géométrie pour une élève de **CE1**, en français, livré en **un seul fichier** `index.html` (HTML + CSS + JS, aucune dépendance), **généré** à partir des sources de `src/` (voir §4). Deux clans : **Chats kawaii** (Géo Miaou) et **Brainrot** (Geo Chaos 9000).

- Dépôt : `jsoudeer/geometrie` (branche `main`).
- Aperçu publié : artifact Claude `https://claude.ai/artifact/77Awfhh3EpPUAUGj2XgaVs` (à republier après chaque changement ; version 28 au moment de l'écriture).
- `PROJETS.md` : projets d'avenir (ce qui reste à faire). `cours.md` : liste des exercices, niveaux, défis. `README.md` : présentation. `src/README.md` : organisation des sources et comment ajouter un thème. `assets/MANIFEST.md` : noms de fichiers des personnages.

## 2. Règle de travail convenue
À chaque évolution : **modifier `src/` → `python3 tools/build.py` → tester dans un vrai navigateur → commit → push → republier l'aperçu → rendre compte en français** (court, l'essentiel d'abord). L'utilisateur n'est pas développeur : pas de jargon.

## 3. Ce qui a été construit (par grandes étapes)

**Base** : mesurer à la règle, déformer une forme, patron → solide (animation 3D), quizz (21 types), horloge (lire / régler), boutique de personnages, bataille, modes Aléatoire / Chronométré / Manuel, effets sonores et visuels (mode Overload), écran de démarrage.

**Corrections notables** : le buste générique restait visible derrière une mascotte en pied (`.hidden` ne marche pas sur un `<svg>` → attribut posé à la main) ; la pyramide ne se refermait pas (angle de pliage 127,98° calculé, triangles enfants de la base) ; patrons à 5 et 7 faces ajoutés ; explication Patron → Solide non cliquable (corrigé, toucher = question suivante).

**Allègement de l'interface** : en chronométré, écran compact sans défilement + bouton 🏠 pour quitter ; boutique limitée au clan actif, personnages débloqués et à obtenir côte à côte ; bouton de thème à gauche des ⭐ ; bouton ☰ Menu sous l'image de la mascotte (la ligne Facile / Moyen / Difficile / Manuel / Boutique est repliée) ; mascotte : image en haut à gauche, plein pied en bas à droite, **sous** les boutons de réponse et légèrement transparent.

**Bataille refondue** : une seule caractéristique (points = attaque et énergie) ; Soutien +5 aux alliés ; Archer sans dégâts en retour ; équipe 3 classiques + 1 Soutien + 1 Archer ; 3 cartes sur le terrain avec remplacement ; on joue avec le clan actif ; victoire +3 ⭐. Équilibrage vérifié par simulation (`tools/tests/sim.js`) : au hasard ≈ 50 % de victoires, en jouant bien ≈ 70 %.

**Défis** : 15 personnages par clan non achetables. 12 défis chronométrés (seuils dans `cours.md`) + 3 séries de 20 bonnes réponses sans erreur (mode Aléatoire). Un défi débloque le chat **et** le brainrot du même numéro (`cat21–35` / `br21–35`). Clic sur une carte verrouillée = explication.

**Accessibilité (RGAA)** : contrastes vérifiés automatiquement dans les deux thèmes, focus visible, libellés pour lecteurs d'écran, boîtes de dialogue fermées par Échap, coins de la forme déplaçables au clavier, ✔ / ✘ en plus de la couleur, police Rubik pour le Brainrot (la police décorative n'est gardée que pour le titre).

**Ordre des boutons** (01/10/2026) : « Nouvelle activité » toujours à gauche, « Vérifier » à sa droite (rangé par `registerFamily`, ordre du clavier identique).

**Estimer une longueur** (01/10/2026) : nouvelle activité (`estimate`, `geometrie.js`), groupe 📐 Formes & mesures, aussi en Chronométré : règle de 10 cm avec seulement 0 et 10, estimation à l'œil ; graduations révélées après la réponse ; Difficile : trait décalé, demi-cm. Compte dans la compétence « Mesures » de la progression.

**Zone de réponse en bas** (01/10/2026) : dans toutes les activités, réponses à choisir puis boutons Vérifier / Nouvelle activité sont collés en bas de l'écran (`.q-bottom`, rangée faite par `registerFamily`) ; le retour d'une question fermée prend la place des boutons. L'écran d'entraînement occupe toute la hauteur. Si le contenu dépasse (cas rares), la page défile : à traiter plus tard.

**En-tête, chrono, solides, RGAA** (30/09/2026) : plus de bouton Menu ni de nom du clan ni de titre « Entraînement » (gardés pour les lecteurs d'écran) ; l'icône de la mascotte ouvre le menu en colonne sous elle (Échap, toucher ailleurs, flèches), sa pastille montre le niveau. Chronométré sans plein écran : la barre du haut reste, l'icône (pastille ✕) quitte le défi. Boutons Vérifier / Nouvelle activité de la même couleur partout. **Patron → Solide réécrit** : moteur 3D maison en SVG (patrons = polygones, charnières trouvées seules, angles de pliage calculés), pliage lent face par face, solide posé sur sa face 1 qui tourne sur lui-même, « Revoir le pliage », rotation au doigt/clavier ; détection réelle des faces en trop (hachurées, soulevées) et manquantes (pointillés + « ? ») avec légende ; 28 patrons (11 cubes, pavés, pyramides, tétraèdres, prismes, 9 pièges), réponse déduite du calcul ; couleur = forme de la face. **RGAA** : langue de la page, contraste des explications, aiguilles de « Régler l'heure » au clavier (curseurs), focus conservé quand une question se ferme, sélection visible sans la couleur (✔), mouvement réduit partout. Tests : `a11y_audit.js` (axe-core, 0 défaut sur 42 écrans), `keyboard_check.js`, `net_check.js` et `header_check.js` réécrits.

**Messages et modularité** (30/09/2026) : les retours ont la même forme partout, composée par `makeQuestionFlow` (« ✔ Bravo… » / « ✘ Pas encore. » + indice + essai n sur 3 / « ✘ Ce n'est pas ça. » + solution), les activités ne fournissent que le contenu. Toutes les activités, Quizz compris, se déclarent avec `registerFamily` (écran, ordre, poids, chrono, réglages) : l'orchestrateur ne nomme plus aucune activité et chaque thème peut être retiré du manifeste (test `tools/tests/theme_removal_check.js`). Outils de dessin partagés déplacés dans `noyau.js`. Instantané `golden.js` identique avant/après (hors espaces du HTML déplacé).

**Uniformisation des activités** (30/09/2026) : une seule façon de corriger pour les 9 activités (`makeQuestionFlow` dans `src/js/noyau.js`). Question toujours dans la bulle, consigne en dessous. QCM (Mesurer, Quizz, Lire l'heure, Patron) : 1 tentative ; manipulations (Déformer, Régler l'heure, 3 ateliers) : 3 tentatives, puis la solution est montrée. Toute réponse compte dans la série sans faute et l'historique (Déformer, Régler l'heure et les ateliers ne comptaient pas). Une question fermée masque Vérifier / Nouvelle activité ; toucher le retour = question suivante (le retour de Régler l'heure n'était pas cliquable). « Nouvelle activité » après un raté compte comme une erreur. Test : `tools/tests/uniform_check.js`.

**Horloge Difficile en 24 h** (29/09/2026) : « Lire l'heure » et le type de Quizz « Lire l'heure » tirent les heures de 0 h à 23 h 59 au niveau Difficile ; l'énoncé donne le moment de la journée (nuit, matin, après-midi, soir), la réponse est en format 24 h, et le piège « oublier d'ajouter 12 h » est toujours proposé (`genHeure24Question` dans `src/js/horloge.js`). « Régler l'heure » reste à heure pile ou demie.

**Pédagogie** : chaque question a une explication propre (patrons, horloge, alignement, solides, énigmes, angles) ; plus de « ou alors il y a un trou ».

**Réglages** : effets, avancement automatique, affichage des cartes en bataille, configuration des activités, **Effacer ma progression** (2 étapes), « Tout débloquer » (test).

**Illustrations (Grok)** : 12 personnages ont de vraies images (visage + plein pied détouré) : `cat01–05`, `br01–05`, `br21`, `br22`. Les autres gardent un dessin SVG simple. Voir §5.

## 4. Structure du code (`src/` → `index.html`)
`index.html` est **généré** par `python3 tools/build.py` (jamais modifié à la main ; `--check` vérifie qu'il est à jour). L'ordre d'assemblage est dans `src/manifest.json`. Tout le JS tient dans une seule fonction anonyme (IIFE). Détails et mode d'emploi : `src/README.md`.

- `src/index.template.html` : structure de la page. `src/css/` : `base`, `exercices`, `interface`, `boutique-bataille`.
- `src/js/noyau.js` : outils partagés (`el`, `shuffle`, `pick`, `rand`, `randInt`, `numChoiceSet`, `svgText`), thème (`THEMES`, `applyTheme`, `setMenuOpen`), étoiles, sons et effets (`playSound`, `celebrate`), mascotte du coach, écran de démarrage, et le **registre des types de Quizz** (`QCM_TYPE_DEFS`, `registerQuizType`, `quizTypeById`).
- Thèmes (chacun regroupe ses exercices **et** ses types de Quizz) : `geometrie.js` (Mesurer `M1_LEVELS`, Déformer `M2_LEVELS`/`perturbForLevel`, questions de formes, angles, repérage, symétrie, scènes, énigmes ; niveaux `GEO_LEVELS`), `horloge.js` (`genHeureQuestion`, `clockExplain`, Lire/Régler l'heure), `calcul.js` (`genCalcQuestion`, monnaie, maths de la vie ; niveaux `CALC_LEVELS`), `patron3d.js` (`NET_*`, `NET_DEFS`, `netExplain`, `M3_LEVELS`, solides 3D et leurs questions).
- `orchestrateur.js` : moteur du Quizz (`M4_LEVELS`, `QCM_DISPLAY_ORDER`, `genQuestion`, `newQCM`, `checkQCM`), puis `nextPracticeQuestion`, `setGlobalLevel`, `startCountdown`, `endCountdown`, `onPracticeAnswered` (séries), et la configuration des activités (`renderActivityConfig`, `rebuildM4Types`).
- `images-data.js` : bloc `/*IMG_DATA_START*/ … /*IMG_DATA_END*/` (`CUSTOM_IMG`, base64), **généré** par `tools/embed.py`.
- `boutique.js` : personnages (`mkSprite`, `mkReward`, `ROLE_BY_ID`, `CAT_REWARD_DEFS`, `BRAIN_REWARD_DEFS`, `drawCatSprite`, `drawBrainrotSprite`), images (`tryLoadCustomImage`, `tryLoadFullBodyImage`), défis (`challengeInfo`, `completeChallenge`, `checkTimedChallenge`), boutique (`renderShop`, `buildSpriteShopCard`), mascotte (`renderMascotDock`, `renderTopMascotIcon`).
- `bataille.js` : `btStart`, `btResolveAttack`, `btChooseEnemyMove`, `btCheckEnd`.
- Sauvegarde : `localStorage` (`geo_stars`, `geo_owned_cats`, `geo_owned_brain`, `geo_mascot_id`, `geo_theme`, `geo_bt_team_*`, `geo_fighter_display`, réglages…).
- **Pas encore modulaire** : les activités à écran propre (Mesurer, Déformer, Patron, Lire/Régler l'heure) sont câblées en dur dans l'orchestrateur (`FAMILY_TAGS`, `MANUAL_FAMILY_LIST`, panneaux `fam-*`). Étape suivante possible : un registre de « familles », pour pouvoir publier une appli par thème.

## 5. Ajouter des personnages illustrés (procédure)
1. L'utilisateur dépose les images Grok (fond uni conseillé) dans `wip/`, par paires visage / plein pied.
2. Détourage du plein pied avec `rembg` (`pip install --break-system-packages rembg onnxruntime`) : `tools/proc.py`. Pour les personnages à pelage blanc, `tools/proc2.py` remplit les zones enclavées (le fond blanc trouait le pelage).
3. Déposer la paire `assets/<clan>/<id>.png` (visage 256 px) et `<id>_full.png` (plein pied détouré), puis lancer `python3 tools/embed.py` : il encode toutes les paires en WebP base64 dans `src/js/images-data.js` et reconstruit `index.html`. Les noms de personnages se changent dans `src/js/boutique.js`.
4. Vérifier (boutique, bataille, mascotte, contraste), commit, push, republier.
`proc.py` / `proc2.py` contiennent la correspondance image → personnage : à adapter. Les sorties temporaires vont dans `/tmp/geo_img/`.

Consigne de prompt Grok qui marche bien : « Extend the previous image with full body standing whole body, and imagine more fuze with the same object » (plein pied) ; « A funny "Italian brainrot"-style absurd animal made of a mélange of one specific animal and one specific object, head and shoulders only, square framing, silly, weird but friendly, pixar style, not scary » (visage). Rester sur des personnages originaux, pas des personnages de meme existants.

## 6. Tests (dans `tools/tests/`)
Playwright + Chromium (`/opt/pw-browsers/chromium`). `lib.js` sert le dépôt en local avec le bon encodage (`/index_test.html` expose des fonctions internes via `window.__t`, dont `__eval` qui exécute du code dans la portée de l'appli, sans écrire de fichier). Les tests se lancent directement depuis `tools/tests/` (`node battle_check.js`) ; leurs captures vont dans `/tmp/geo_tests/`.
- `battle_check.js` : boutique, info défi, équipe, combat complet. `challenge_check.js` : défis, séries, effacement. `net_check.js` : explications de patrons. `contrast_audit.js` : contrastes AA (les boutons désactivés sont exemptés). `header_check.js`, `mascot_layer.js` : en-tête et calque de la mascotte. `sim.js` : équilibrage. **`golden.js`** : test « avant / après » pour toute réorganisation (questions de tous les exercices avec hasard fixe, panneaux de réglages, captures d'écran des deux thèmes) : `node golden.js record a.json`, puis après modification `record b.json`, puis `node golden.js diff a.json b.json` (voir `src/README.md`).

## 7. Pièges déjà rencontrés
- `index.html` est un fragment sans `<meta charset>` : le publier tel quel ajoute l'encodage ; en test local, servir avec `charset=utf-8`.
- **Ne jamais modifier `index.html` à la main** : la modification serait écrasée au prochain `build.py`. Modifier `src/`, puis reconstruire.
- Ordre des fichiers JS (`src/manifest.json`) : les thèmes avant `orchestrateur.js`, `images-data.js` avant `boutique.js`.
- Les fonctions définies plus bas dans la fonction anonyme sont utilisables plus tôt, mais pas les variables (`var`) : garder les gardes (`if(!CAT_REWARDS…)`).
- Les `className = …` écrasent les classes : toujours remettre `tappable` dans les retours de réponse.
- Superposition : `.mascot-dock{z-index:1}` et `.card > *{z-index:2}` (les réponses passent au-dessus de la mascotte).
- Ne pas réduire l'opacité du texte (contraste) : griser seulement l'illustration des cartes verrouillées.
- Republier l'aperçu : l'outil exige de relire la version en ligne avant d'écraser (elle était identique à la dernière publication).

## 8. Idées restantes
Déplacées dans **`PROJETS.md`** (projets d'avenir : référentiels à suivre en plus du RGAA, ergonomie, idées en attente).

## 9. Refonte modulaire (29/09/2026)
Du fichier unique éditable à `src/` + `tools/build.py`, en trois étapes vérifiées par `tools/tests/golden.js` (résultat identique à l'avant sur 1650 éléments) : (A) découpe sans changement, `index.html` identique octet pour octet ; (B1) regroupement du JS par thème ; (B2) registre des types de Quizz (`registerQuizType`). Les scripts de migration jetables ont été retirés (voir l'historique git : commits « Découpe index.html… », « Regroupe le JS… », « Registre des types de Quizz… »).

## 10. Variété des exercices (29/09/2026)
Branche `variete-exercices` : horloge 24 h en Difficile ; Régler l'heure à 3 niveaux ; tirage sans remise (`pickFresh` dans `noyau.js`) pour énigmes, illustrations et Maths de la vie ; jamais deux fois le même type de Quizz ni la même famille de suite ; +16 énigmes (46) ; 8 nouveaux types de Quizz (Durées, Suite de formes, Suite de nombres, Soustraction, Doubles et moitiés, Compléments, Tables, Comparer). Vérifié par `golden.js` (seules les clés attendues changent), les tests existants et ~1000 questions tirées par type et par niveau (4 choix distincts, une seule bonne réponse).

## 11. Clans, séries sans répétition, catégories (29/09/2026)
Branche `evolutions-clans` : mémoire des questions déjà posées (`questionSignature`, `seenSigs` dans l'orchestrateur) ; mascotte par clan (`mascotIds`, clés `geo_mascot_cats` / `geo_mascot_brainrot`, l'ancienne clé `geo_mascot_id` est migrée) ; défis limités au clan actif (`completeChallenge`) ; mascotte en pied et aperçu dans la Boutique ; prismes redessinés en 3D complète avec pointillés (`drawSolidPrismeN`) ; sous-catégories de Quizz (`category` dans `registerQuizType`, `QCM_CATEGORIES` dans `noyau.js`) ; 6 nouveaux types (Dizaines et unités, Ordre des nombres, Calendrier, Mesures, Périmètre, Trouve l'intrus). Nouveaux tests : `clan_check.js`, `repeat_check.js`.

## 12. Réponses dessinées et thèmes du mode Manuel (30/09/2026)
Branche `visuel-categories` : une réponse de Quizz peut être un dessin (`choices[i].draw(svg)` + `viewBox`, voir `newQCM`) ; 4 types visuels (Fractions, Dénombrement, Choisir l'horloge, Symétrie : compléter) ; mode Manuel à deux étages (thème → activité, `FAMILY_THEMES`). Piste suivante : une vraie famille interactive (toucher des cases pour compléter une symétrie, colorier une fraction, tangram) avec son propre écran.

## 13. Ateliers interactifs et registre de familles (30/09/2026)
Branche `ateliers` : `registerFamily` (noyau.js) permet à un thème de déclarer une activité à écran propre (`key, tag, theme, note, build, generate, signature`) ; l'orchestrateur l'ajoute aux listes, crée son conteneur `fam-<key>` et l'intègre au tirage, au mode Manuel, au panneau de configuration et à l'anti-répétition. Nouveau thème `src/js/atelier.js` : Compléter la symétrie, Colorier une fraction, Reproduire le modèle. Test : `atelier_check.js` (vrais clics, réussite/échec, une seule étoile). Ergonomie : en mode Manuel, choisir un niveau replie aussitôt la liste des activités. Le Quizz est tiré 3 fois plus souvent que les autres familles en mode Aléatoire. Reste à migrer vers le registre : Mesurer, Déformer, Patron, Lire / Régler l'heure.

## 14. Correctifs horloge (30/09/2026)
Régler l'heure et Déformer donnaient une étoile à CHAQUE clic sur Vérifier : désormais une seule par question (`m5rWon`, `m2Won`). Petite aiguille de Régler l'heure : 24 positions à tous les niveaux (crans de 15°, tolérance 7,5°) au lieu de 48/72 ; indice `hourHandHint` quand elle est mal placée. Test : `regler_check.js`.

## 15. Avancement auto en Aléatoire, difficulté de la Bataille (30/09/2026)
L'avancement automatique de niveau fonctionne aussi en mode Aléatoire (`onPracticeAnswered`, via `freeStreak`). Bataille : difficulté choisie avant le combat (`BT_DIFFS`, `btDiff`, clé `geo_bt_diff`) ; l'équipe adverse est tirée parmi les combinaisons dont le total de points est le plus proche de celui du joueur ×0,8 / ×1 / ×1,2 (`btBuildEnemyTeam`). Tests : `avance_check.js`, `bataille_diff_check.js`.

## 16. Tirage sans remise des activités et des catégories de quiz (30/09/2026)
`pickFamilyFresh` (sac de familles, sans doublon adjacent, retente 4 fois dans la même famille avant d'en changer) ; `genQuestion` tire la catégorie puis le type via `pickFresh`. Test : `fresh_check.js`.

## 17. Bataille : équipe en un clic, cartes persistantes (30/09/2026)
Cartes de choix et cartes de combat créées une seule fois (`btSetupCards`, `bt.cards`) et mises à jour en place (`btReconcile`, `btSyncCard`) au lieu d'être recréées à chaque rendu, cause du clignotement des images. Animations : `btLunge`, chiffres qui défilent (`btAnimatePts`), `btFloat`, `bDie`/`bArrive`. Choix d'équipe : `btToggleSetup` (le plus ancien sort), `btAutoTeam`. Test : `bataille_ui_check.js`.

## 18. Boutique et Bataille sorties du menu ; Soutien à chaque tour (30/09/2026)
Deux panneaux distincts (`tab-shop`, `tab-battle`) ouverts par `#stars-btn` et `#battle-btn` (`showTab`, `toggleSidePanel` dans noyau.js) ; le menu ne garde que les 3 niveaux et Manuel. Le Soutien ajoute `BT_SUPPORT_TURN` (+2) à chaque allié à la fin de chaque tour de son camp (`btSupportTick`), en plus du +5 d'arrivée. Test : `nav_check.js`.

## 19. Reveal des nouveaux personnages (30/09/2026)
`showReveal` (boutique.js) : silhouette (`filter:brightness(0)`) qui grossit et pivote (`rvSpin`), puis dévoilement (`.shown`) ; sons `playRevealWhoosh` / `playRevealSting(side)` (noyau.js), un par clan. Utilisé par l'achat et par `showUnlockAnnouncement` (défis). Test : `reveal_check.js`.

## 20. Bouton +50 étoiles (30/09/2026)
`#shop-plus50` dans la Boutique : `addStar(50)` puis `renderShop()`. Test : `plus50_check.js`.

## 21. Réinitialisation : seul le premier personnage reste (30/09/2026)
`resetProgress` ne garde que le premier personnage de départ de chaque clan, redevenu mascotte. `loadOwned` n'ajoute plus les 5 personnages de départ que s'il n'y a aucune sauvegarde (sinon ils revenaient au rechargement). Test : `reset_check.js`.

## 22. Personnages verrouillés : image « ? » commune à chaque clan (30/09/2026)
Première version en silhouette noire du vrai dessin (`brightness(0)`) : abandonnée (carré noir pour les photos, silhouettes différentes qui trahissent). Remplacée par `drawMysterySprite` / `renderMysteryVisual` (boutique.js) : une même image par clan (chat / brainrot noir avec « ? »), nom visible, rôle « Mystère », pas d'aperçu au toucher, fenêtre de défi avec la même image. Test : `silhouette_check.js`.

## 23. Mode Manuel sans niveau d'office ; détourage des chats (30/09/2026)
- **Manuel** : `rebuildManualLevelRow` ne présélectionne plus de niveau (`-1`) et masque l'épreuve ; `showManualExercise` (appelé au toucher d'un niveau) affiche l'épreuve et replie la liste des activités. La minuterie de 5 s (`armManualCollapse`) est supprimée ; bouton `Afficher / Masquer les activités` (`updateManualToggle`). Changer d'activité, de thème ou de type de quizz demande de rechoisir le niveau. Test : `manual_check.js`.
- **Détourage** : `tools/proc2.py` remplissait tous les trous du masque (`binary_fill_holes`), ce qui gardait le fond d'origine entre la baguette, le bras et le corps d'Étoilou (cat04), et des éclats blancs autour d'Éclairon (cat05) et près de l'oreille de Pétale (cat03). `tools/decoupe_poches.py` retire ces poches de fond (couleur du fond source) et laisse le pelage blanc intact ; cat01 et cat02 sont identiques à l'octet près. Nouvelles images dans `assets/cats/cat0{3,4,5}_full.png`, ré-embarquées par `tools/embed.py`. Les 7 brainrots (détourés sans remplissage) ont été revus : rien à corriger.

## 24. Reveal : balayage lumineux (30/09/2026)
Le personnage n'est plus révélé pendant la dernière rotation : `.rv-spinner` tourne de 720° (s'arrête de face) avec le calque noir `.rv-art.sil`, puis un trait de lumière `.rv-scan` balaie le calque couleur `.rv-art.col` (`clip-path` animé) ; le son du clan part au début du balayage, éclat/étincelles à la fin (`reveal()` puis `burst()` dans `showReveal`). Test : `reveal_check.js`.


## 25. Historique de progression ; série des 20 qui survit à la montée de niveau (30/09/2026)
- **Bug** : en avancement automatique, monter de niveau remettait la série à zéro. `freeStreak` est désormais conservée ; `levelStreak` compte les bonnes réponses du niveau courant pour déclencher la montée (voir §29 pour les paliers).
- **Historique** (`src/js/progression.js`, clé `geo_history`, 3000 réponses max) : `progRecord` enregistre `[date, compétence, famille, type, niveau, juste]` à chaque réponse. Écran **⚙️ Réglages → 📈 Progression** : Synthèse (radar 8 compétences, niveau récent sur 40 réponses vs depuis le début, points forts / à travailler), Détail (par compétence et activité, par niveau), Activité (14 derniers jours). Bouton Effacer séparé de « Effacer ma progression ».
- **Ciblage** : pendant les 18e, 19e et 20e réponses d'une série du défi (mode auto, Aléatoire, défi du niveau non réussi, ≥ 20 réponses enregistrées), `progWeakPick` choisit parmi les compétences les plus faibles (`nextPracticeQuestion`, `forcedQcmCat`) ; étiquette « 🎯 à travailler ». Test : `progress_check.js`.

## 26. Variété des activités : audit, Déformer, Milieu, Axes de symétrie, Trouver l'erreur (01/10/2026)
- **Audit** `AUDIT_VARIETE.md` + `tools/tests/variete_audit.js` : questions et réponses distinctes par type et niveau ; liste priorisée des faiblesses restantes.
- **Déformer** : `M2_LEVELS` passe à 5 formes (+ triangle isocèle `checkIsosceles`, triangle rectangle `checkRightTriangle`), `sidesAndAngles` et le dessin gèrent 3 ou 4 coins ; le départ est retiré tant qu'il réussit déjà le test. Test : `deform_check.js`.
- **Milieu** : `genMilieuFormes` (3/5 formes → une au milieu ; 2/4 formes → « Aucune forme »), `genMilieuCoord` (coordonnées du milieu de [AB]). Test : `milieu_check.js`.
- **Ateliers** : `atelier-erreur` (Trouver l'erreur : case en trop ou manquante) et `atelier-axe` (Axes de symétrie, remplace le QCM `symAxe` supprimé ; figure construite puis vérifiée pour avoir exactement les axes voulus, le pliage entoure les cases sans jumelle). Test : `atelier2_check.js`.
- **Symétrie vrai/faux** : rectangle, carré (diagonales vraies), triangle isocèle, cercle.
- **Tests** : `uniform_check.js` couvre aussi « Trouver l'erreur » et « Axes de symétrie », gère les triangles de Déformer (réponse fausse à 3 coins), et attend la fin de l'animation d'apparition avant de mesurer la position des boutons (la mesure instantanée donnait un écart de 31 px une fois sur quatre).

## 27. Alignement et Angles : de nouvelles variantes (01/10/2026)
- **Alignement** (`genAlignQuestion(level)`) : Facile = 3 points oui/non en ligne ou colonne ; Moyen/Difficile = + `genAlignQuatre` (parmi 4 points A–D, lesquels sont alignés), `genAlignCandidat` (quel point 1–4 est aligné avec A et B), points espacés, diagonales, droites penchées 2:1 (Difficile) et « presque alignés ». `alignedTriple` fabrique les alignements ; l'unicité de la bonne réponse est vérifiée.
- **Angles** (`genAngleQuestion(level)`) : `genAngleClasser` (droit/aigu/obtus, comme avant), `genAngleComparer` (2 ou 3 angles aux branches de longueurs inégales ; Difficile : écart de 10° seulement ou angles égaux), `genAngleDroits` (combien d'angles droits : rectangle, carré, triangles, trapèze rectangle, maison, losange, parallélogramme ; `ANGLE_FIGS`). Le type est maintenant disponible dès Facile (`defaultLevels:[0,1,2]`).
- Test : `align_angle_check.js` relit les réponses sur le DESSIN (positions des points, angles des branches, angles du polygone) et les compare à la bonne réponse annoncée, 250 tirages par niveau.

## 28. Guides (tutoriels) et bataille sans rôle obligatoire (01/10/2026)
- **Moteur** `src/js/guide.js` + `css/guide.css` : une suite d'étapes dont chacune éclaire un élément réel de l'écran (ombre portée géante autour d'un cadre, bulle explicative placée sous/au-dessus, focus piégé dans la bulle, Échap = passer, mouvement réduit respecté). Choix de la surbrillance plutôt que de captures d'écran : les explications suivent l'interface sans rien à refaire.
- **Guides** (`GUIDES`) : `accueil` (premier lancement : menu, modes, série, étoiles, bataille, réglages), `boutique` (≥ 50 étoiles et aucun achat : `geo_bought`), `bataille` (première entrée dans la Bataille). Vérification toutes les 1,5 s par `guideTick`, sans jamais interrompre (pas pendant l'écran d'accueil, un dévoilement, un panneau ouvert, ni hors de l'écran des questions). État « vu » : `geo_guides`. `resetProgress` appelle `guideResetContextual` (l'accueil n'est pas rejoué).
- **Réglages → 📖 Guides** (`#guides-overlay`) : relance chacun des trois.
- **Bataille** : soutien et archer ne sont plus obligatoires (au moins 1 carte) ; l'équipe adverse reprend la même composition (`btBuildEnemyTeam`) ; message « Pas de soutien ni d'archer : c'est ton choix ».
- **Tests** : `guide_check.js` ; `lib.js` marque les guides « vus » par défaut (option `guides:true` pour les tester) ; `a11y_audit.js` couvre l'écran Guides et une étape en cours (axe : 0 défaut).
- **Ajustements (01/10/2026)** : la mascotte du clan actif (`guideDrawMascot`) accompagne chaque bulle ; le guide Bataille se lance désormais à la **première entrée dans la Bataille** (plus au 5e personnage débloqué : `GUIDE_BATTLE_UNLOCKS` supprimé).

## 29. Séries 20/25/30, chaleur Overload, guide Série (01/10/2026)
- **Paliers** : `STREAK_GOALS=[20,25,30]` (orchestrateur.js, remplace `STREAK_TARGET` et `streakLevels`). Atteindre un palier valide le défi `12+rang` (Facile, Moyen, Difficile) quel que soit le niveau joué ; la série continue sans remise à zéro ; une erreur la remet à 0 sans rien retirer. Pastille 🔥 permanente en Aléatoire : « 21 / 25 (20✔ · 25 · 30) » (`nextStreakGoal`). Ciblage des sujets faibles sur les 3 questions avant chaque palier non débloqué (`challengeFocusActive`).
- **Chaleur** (`chaleur.js`, `css/chaleur.css`) : en son Overload et mode Aléatoire, `body[data-heat]` = 1/2/3 à 15/20/25 d'affilée ; halo + particules + son (`heatSting`) à chaque palier. Chats : vignette pêche, arc-en-ciel/cœurs/paillettes, liseré irisé au niveau 3. Brainrot : vignette rouge vacillante, flammes, crânes/éclairs, léger tremblement au niveau 3. Mouvement réduit : halo fixe seulement. `pointer-events:none`.
- **Guide Série** (4e guide, `serie`) : se lance au premier 10 d'affilée (`GUIDE_SERIE_START`), 3 étapes sur la pastille.
- `PROG_SKILLS.formes` inclut `atelier-erreur` et `atelier-axe`.
- **Tests** : `serie_check.js` (nouveau), `progress_check.js` et `guide_check.js` adaptés ; toute la régression et l'audit a11y passent.
