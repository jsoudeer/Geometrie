# HISTORIQUE — résumé du travail réalisé avec Claude

Document de reprise : il permet de repartir d'une conversation neuve sans rien perdre. À lire en premier si le contexte a été compressé.

## 1. Le projet
Jeu de géométrie pour une élève de **CE1**, en français, livré en **un seul fichier** `index.html` (HTML + CSS + JS, aucune dépendance), **généré** à partir des sources de `src/` (voir §4). Deux clans : **Chats kawaii** et **Brainrot** (le jeu s'appelle « Kawaii vs Brainrot », anciennement Géo Miaou vs GEO CHAOS 9000).

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

## 30. Glisser des coins (Déformer) et animation de lancement (01/10/2026)
- **Bug** : le glisser d'un coin se perdait après quelques instants. `drawDeform()` reconstruit tout le `<svg>` à chaque mouvement, ce qui détruisait le coin qui avait capturé le pointeur. Le glisser est maintenant capté par le `<svg>` lui-même (`setPointerCapture` sur `deformSvg`, `pointermove`/`pointerup`/`pointercancel` filtrés par `pointerId`). Test : `drag_check.js` (3 s de glisser à la souris, glisser rapide, relâchement) ; il échouait avant le correctif.
- **Écran de lancement** : l'image est scindée en deux moitiés qui arrivent chacune de leur côté et s'entrechoquent (~1,3 s), avec éclair jaune, flash, deux ondes de choc, 22 étincelles aux directions aléatoires, tremblement de la carte et recul des moitiés ; le texte et le bouton apparaissent ensuite (le bouton reste cliquable). Un clic sur l'image rejoue le choc. Deux cas (`noyau.js`, `css/interface.css`, classes `sp-*`) : image perso `assets/branding/splash.*` coupée en deux fonds CSS (`.sp-split`), ou dessin SVG de secours (moitiés `.sp-left`/`.sp-right` + bulle VS qui rebondit). Une vidéo ou un GIF animé restent affichés tels quels. Mouvement réduit : image fixe, sans effet.
- Test : `splash_check.js` (les deux cas, captures `/tmp/geo_tests/splash_*`).

## 31. Le jeu devient « Kawaii vs Brainrot » (01/10/2026)
- Renommage partout (écran de lancement, titre de page et de l'artefact, `README.md`, `PROJETS.md`, `CLAUDE.md`). Le titre par clan (`THEMES[...].title`) est supprimé : le titre masqué `#appTitle` est fixe. Les clans sont nommés par leur univers (kawaii / brainrot) pour accueillir d'autres personnages kawaii (chiens, lapins) sans renommer à nouveau. Les identifiants internes (`cats`, `brainrot`, `cat01`…) ne changent pas.

## 32. Mode Révision (01/10/2026)
- Troisième bouton « Révision » dans `#practice-mode` (Aléatoire · Révision · Chronométré) : `practiceMode='review'`. `nextPracticeQuestion` appelle `progReviewPick` (progression.js) : unités = familles + types de quiz au niveau en cours ; poids = 3 si jamais faite, sinon 0,25 + 4 × (part d'erreurs sur les 10 dernières) + 1 si la dernière était fausse. Tirage en deux étages (famille, puis type de quiz ; le quiz pèse la moyenne de ses types × 1,5), jamais deux fois la même famille de suite. `forcedQcmType` impose le type de quiz choisi. Étiquette « 🔁 à revoir » / « ✨ pas encore fait ».
- Hors série sans faute, hors chaleur, hors montée de niveau automatique (conditions `practiceMode==='free'` conservées) ; les réponses alimentent bien l'historique.
- `cours.md` : ligne du tableau + règle de poids ; correction d'une phrase périmée sur l'avancement automatique et la série. Étape du guide d'accueil mise à jour.
- Test : `revision_check.js`.

## 33. Lancement différé et un seul découpage en thèmes (02/10/2026)
- **Lancement** : la carte d'accueil attend la fin de la recherche d'une image perso (`splashSettle`, classe `sp-wait` : dessin et textes invisibles) avant de jouer l'animation ; image trouvée → moitiés de l'image ; rien → dessin SVG ; vidéo → lue telle quelle. Filet de sécurité à 2,5 s. Plus de double lecture.
- **Thèmes** : `DOMAINS` (noyau.js) remplace `QCM_CATEGORIES`, `PROG_SKILLS`, `FAMILY_THEMES`/`THEME_DISPLAY_ORDER` et les champs `theme`/`category` : 9 thèmes (Formes & angles, Symétrie, Repérage, Solides & patrons, Heure & calendrier, Mesures, Nombres & fractions, Calcul & problèmes, Logique & énigmes). Chaque famille et chaque type de quiz déclare `domain`. Ce même découpage sert au mode Manuel, au panneau de réglages, à la Progression (radar de 9 compétences, `progSkillIndex`) et au ciblage des sujets faibles. Fusions : « Mesures » du Quizz + Mesurer + Estimer ; Problèmes & monnaie → Calcul ; Énigme → Logique ; Symétrie sort de Formes (ateliers Compléter/Axes + Vrai-faux + Visuel).
- **Mode Manuel** : thème (`manual-domain-row`) → activité (`manual-unit-row`) ou « 🎲 Un peu de tout » (`manualMix`, tirage sans remise parmi les activités du thème disponibles au niveau, `manualMixPick`). Les anciens sélecteurs Quizz (catégorie/type) disparaissent ; `m4CategoryFilter` supprimé.
- L'historique de réponses existant n'est pas migré (pas en production).
- Tests : `domaines_check.js` (nouveau), `splash_check.js` (cas « recherche lente »), `manual_check.js`, `progress_check.js`, `mascot_layer.js`, `contrast_audit.js`, `theme_removal_check.js`, `variete_audit.js` adaptés.

## 34. Déformer : angles en direct et forme remise juste ; règle pour « plus grande longueur » (02/10/2026)
- **Mesures en direct** (`drawDeform`, `m2Matches`, `drawAngleMark`) : côtés en cm (virgule française) + angles en degrés pour le rectangle, le parallélogramme et le triangle rectangle (`angles:true` dans `M2_LEVELS`) ; vert (+ carré) dès que l'angle droit ou le côté est dans la tolérance « précise » (`tolGreat`).
- **Après « Vérifier »** : verdict (flux commun), puis `m2MorphTo` anime la forme de l'enfant vers `m2Ideal()` (900 ms, instantané en mouvement réduit) quand elle est approximative (`res.approx`) ou ratée au 3e essai ; `m2Reveal` fige les coins, affiche angles de tous les coins et traits d'égalité (`drawEqualTicks`), et la phrase `m2Describe` (côtés et angles) est ajoutée à l'explication et à l'`aria-label`. `m2Ideal` construit la forme juste la plus proche (parallélogramme : diagonales qui se coupent en leur milieu ; rectangle : diagonales égales ; losange : diagonales perpendiculaires ; isocèle : deux côtés ramenés à leur moyenne ; triangle rectangle : l'angle le plus proche de 90° rendu droit), repli sur `m2Target`.
- **Correctif** : les contrôles des triangles renvoyaient `msg` au lieu de `success/detail/hint` (le retour affichait « undefined ») ; tous les contrôles ont maintenant le format du flux, avec `approx`.
- **Mesures › plus grande longueur** : le dessin n'était qu'un emoji ; il montre maintenant une règle d'1 m graduée (« 1 m = 100 cm »). Je n'ai pas pu reproduire un bouton sans valeur : 400 tirages, 4 valeurs distinctes écrites sur les boutons (`mesures_check.js`).
- Tests : `deform_reveal_check.js` (5 formes × 300 cas ratés/approximatifs : la forme remise juste est toujours juste et dans le cadre), `mesures_check.js` ; `uniform_check.js` attend la fin de l'animation avant de vérifier la solution.

## 35. Neuf nouvelles illustrations et correctif d'une apostrophe (02/10/2026)
- 9 paires portrait (256² RVB) + plein pied détouré (rembg, H = 560) préparées par `tools/proc3.py` (noms de fichiers explicites, plus d'index par position) puis embarquées (`tools/embed.py`) : cat06 Gouttelette (eau), cat07 Matchou (tennis), cat08 Capuche (voleur ; portrait recadré dans le plein pied, l'original avait un damier de transparence incrusté), cat09 Footin (foot), cat10 Merlinou (magicien, soutien), cat11 Fleurette (fleurs, archer), cat12 Flammèche (feu), br06 Elefantino Aspiro (aspirateur), br07 Cagnolino Ventilo (ventilateur). Les noms remplacent ceux des anciens dessins procéduraux (`boutique.js`, `assets/MANIFEST.md`). 21 personnages ont maintenant une vraie illustration.
- **Correctif** : une apostrophe non échappée dans la note du niveau de « Déformer » (`geometrie.js`) cassait le script de toute la page. Corrigée ; `uniform_check.js` (test instable : un QCM très haut dépassait l'écran de test) tire maintenant une autre question dans ce cas.

## 36. Économie, évolutions et bataille remaniée (02/10/2026)
- **Économie** : un seul personnage offert par clan (`STARTER_IDS = ['cat01','br01']`) ; prix 6 / 12 / 24 / 40 ⭐ (commun / rare / épique / légendaire, `RARITY_META`). Équipe de 5 communs ≈ 24 ⭐ (1 à 2 jours), tout acheter ≈ 300 ⭐ par clan. Guide « Boutique » dès 6 ⭐.
- **Évolutions** (`boutique.js`) : `evoCats`/`evoBrain` (clés `geo_evo_cats`/`geo_evo_brain`), `spriteEvo`, `spritePts(sprite, level)` (points de base + 20 % × niveau, minimum +1), `evoCost` (prix d'achat ; 12 pour un personnage de défi), `tryEvolve`. `sprite.pts` reste le point de BASE ; tout affichage/combat du joueur passe par `spritePts`. Bouton « ⬆ Évolué/Ultime · N ⭐ (+X ❤️) » sur les cartes de la boutique, dévoilement à chaque montée. `applyEvoLook(container, sprite, level)` pose les classes `evo-1/evo-2` + `data-evo-clan` + ★/étincelles (CSS `css/evolution.css`) : cadre, aura, étoiles, glitch brainrot niveau 2. `renderSpriteVisual`/`renderCreatureVisual` prennent un niveau optionnel (les adversaires passent 0). « Effacer ma progression » efface les évolutions.
- **Bataille** (`bataille.js`, `css/bataille-fx.css`) : le descriptif central est remplacé par des **effets sonores affichés** (`btSfx`, `#bt-sfx` : POW ! / ZIIIP ! / K.O. ! / HOP ! / +2 ❤️ / boost) avec secousse de l'arène ; `#bt-log` devient une zone `sr-only`. Déroulé ralenti (`BT_SPEED`, `btT(ms)` : préparation, charge/tir, impact, lecture des points, K.O., remplaçants, soutien ; ≈ 8 s attaque + riposte ; les tests mettent `BT_SPEED=0.05`). Les unités portent `base`/`evo` (`btMakeUnit(sprite, own)`) : l'adversaire n'évolue jamais.
- **Boost** : `btStartPlayerTurn` (tour 3, 6, 9…) pose un boost sur une carte du terrain (`bt.boost`), conservé jusqu'à usage ou K.O. du porteur ; touche sur la carte → phase `pick-boost` (panneau `#bt-boost`) : ✖️2 / 🎯 N fixes (N = double × facteur, facteurs `BT_BOOST_FACTORS` = 1, 0,7, 1,3 mélangés par paquet de 3) / sans boost ; verdict après coup (bon calcul / l'autre valait plus / pareil).
- **Tests** : `evolution_check.js`, `boost_check.js` (nouveaux) ; `battle_check`, `bataille_ui_check`, `reset_check` adaptés (un seul personnage offert, vitesse accélérée, boost). Régression et audits a11y/contraste passent.

## 37. Montée de niveau automatique : plus de question remplacée en cours de réponse (02/10/2026)
- **Bug** : l'avancement automatique changeait de niveau 700 ms après la 5e bonne réponse (`setTimeout`) et tirait une nouvelle question ; si l'enfant avait déjà touché le retour et lisait la question suivante, elle était remplacée sous ses doigts : son toucher tombait sur la nouvelle question, comptait faux et la série tombait à 0.
- **Correctif** (`orchestrateur.js`) : `pendingAdvance` mémorise la montée ; elle est appliquée au début de `nextPracticeQuestion` (quand l'enfant demande la suite), en un seul tirage, avec l'annonce « Niveau … débloqué ». Même principe pour le mode Manuel (`manualAdvanceLevel`). La série sans faute est conservée au changement automatique ; un changement de niveau ou de mode choisi à la main annule la montée en attente (et remet la série à 0, comme avant).
- Tests : `avance_check.js` (le niveau ne change pas avant la question suivante, la question affichée reste stable, série conservée), `progress_check.js` adapté.

## 38. Écran rosé après la frénésie, « Reproduire » réservé au Facile (02/10/2026)
- **Chaleur (frénésie)** : après un palier puis une erreur, l'écran restait teinté. Deux causes dans `chaleur.css` : l'éclat de palier (`.heat-layer.surge::after`) revenait à pleine opacité une fois son animation finie (jamais retiré) ; le halo brainrot (`heatFlicker`) animait l'opacité même à chaleur 0. Corrigé (opacité 0 au repos, animations coupées à `data-heat="0"`, classe `surge` retirée). Test : `serie_check.js`.
- **Reproduire le modèle** : réservé au Facile (`levels:[0]`, grille 4×4). Nouveau mécanisme `familyAvailable(f, level)` (noyau.js), appliqué au tirage Aléatoire/Chrono (`familyKeys`), à la Révision et aux sujets faibles ; le mode Manuel utilisait déjà `levels`. « Trouver l'erreur » (déjà présent à 3 niveaux) prend la place en Moyen/Difficile. Test : `copie_niveaux_check.js`.
- **Tirage** : correctif d'un cas rare où la même activité pouvait sortir deux fois de suite (sac de tirage réduit à l'activité déjà affichée → nouveau sac).
- **Régler l'heure** : la petite aiguille a déjà 24 positions (heure pile ou demi-heure) à tous les niveaux, avec « piège » à 0 minute (la position intermédiaire est refusée) : voir §« 24 positions » plus haut et `regler_check.js` (1 200 cas) ; aucune modification.

## 39. Régler l'heure : la petite aiguille suit la grande (02/10/2026)
- **Problème** : à 8 h 10, il fallait poser la petite aiguille « comme si » il y avait 0 minute (crans de 15°) : peu intuitif et peu pédagogique.
- **Modèle** (`horloge.js`) : `m5rHourTick` = l'heure choisie (0–11), position affichée `m5rHourAngle()` = heure × 30° + minutes × 0,5° (`m5rMinutes()` d'après la grande aiguille). Plus de crans de 15° ni de tolérance (`M5R_HOUR_STEP`/`M5R_HOUR_TOL` supprimés) ; au doigt, l'heure retenue est celle dont la position AFFICHÉE est la plus proche ; au clavier, 12 crans. Vérification : bonne heure (`hour % 12`) et bonnes minutes. `hourHandHint` explique où elle doit être (« a dépassé le 8 sans atteindre le 9 »). Annonce lecteur d'écran : « sur le 8 » / « un peu après le 8 ».
- Tests : `regler_check.js` réécrit (angles 245°/255°/265°, trait dessiné, glisser au doigt, indice), `keyboard_check.js` et `uniform_check.js` adaptés. Remplace le §« 24 positions ».

## 40. Avancement automatique toujours actif (03/10/2026)
- Le réglage (case à cocher + choix 3/5/8/10) disparaît des Réglages : la montée de niveau est toujours active, après **5 bonnes réponses d'affilée** dans le niveau (modes Aléatoire et Manuel, jamais en Chronométré ; série sans faute conservée). `autoAdvanceEnabled`, `AUTO_ADVANCE_OPTIONS` et les clés `geo_auto_advance*` sont supprimés ; `autoAdvanceThreshold` (5) reste en variable interne que les tests relèvent pour l'éviter. Tests : `avance_check.js` (défaut 5, plus de réglage) et les tests qui coupaient l'avancement.

## 41. Nombres jusqu'à 1000 et calcul écrit : 8 nouveaux types de Quizz (03/10/2026)
- **Nouveau fichier** `src/js/nombres.js` (après `calcul.js` dans le manifeste) : 46 types de Quizz au total. Nombres (domaine `nombres`) : `blocs1000` (plaques/barres/cubes jusqu'à 999), `lettres` (`nombreEnLettres`, lettres ⇄ chiffres, soixante-dix / quatre-vingts), `plusMoins` (±10, ±100, ±1 aux frontières), `encadrer` (dizaines/centaines, arrondi), `droite` (droite graduée, flèche à lire). Calcul (domaine `calcul`) : `addition` et `soustractionPosee` (retenue / emprunt, explication colonne par colonne : `addExplain`, `subExplain`), `multiplier` (grille de points, addition répétée, partage, paquets).
- Chaque type a 3 niveaux, une `randomNote` décrivant ce que fait réellement chaque niveau, et passe par le tirage sans remise commun (signature = question + explication + choix).
- Test : `nombres_check.js` (250 questions par type et par niveau : une seule bonne réponse, choix distincts, résultat recalculé indépendamment, dessin non coupé ; orthographe des nombres ; domaines). `cours.md` (tableau des Quizz), `src/README.md` mis à jour.

## 42. Problèmes à deux étapes et mode Manuel en tuiles (03/10/2026)
- **Nouveau type** `probleme2` (`nombres.js`, domaine `calcul`, Moyen/Difficile) : 8 modèles d'énoncés à deux calculs (perdre puis gagner, deux achats, boîtes de gâteaux, paquets…), sans répétition (`pickFresh`) ; Moyen : additions/soustractions (≈ 30), Difficile : nombres jusqu'à ≈ 100 et multiplications. L'explication donne les deux étapes. 47 types de Quizz au total.
- **Mode Manuel** (`orchestrateur.js` `tileRow`, `css/base.css` `.tile-grid`) : le choix du thème devient une grille de 3 colonnes de tuiles (icône + nom court), le choix d'activité une grille de 2 colonnes (noms courts `label`, le nom long reste en info-bulle), « Un peu de tout » sur toute la largeur. La sélection garde un ✔ (pas seulement la couleur).
- Tests : `nombres_check.js` étendu à `probleme2` ; `manual_check`, `keyboard_check`, `uniform_check` revus.

## 43. Esthétique : admirer les personnages, cérémonie d'évolution, particules (03/10/2026)
- **Nouveau** `src/js/admiration.js` + `src/css/admiration.css` (après `boutique.js` / `evolution.css`). `showAdmire(sprite)` remplace l'ancien aperçu (`showSpritePreview` supprimé) : portrait en pied, inclinaison au doigt/souris (`--rx`/`--ry`, calques à profondeurs différentes : rayons, halo, ombre au sol, particules derrière/devant), toucher = saut + éclat + son, ◀ ▶ / flèches pour parcourir les personnages possédés, anneau d'étoiles 3D au niveau Ultime. Accès : bouton 🔍 sur chaque carte possédée (`.sp-admire`), toucher la carte, toucher la mascotte du clan (`#shop-mascot-panel`, clavier compris).
- **Cérémonie** `showEvolution(sprite, from, to)` (remplace le reveal pour les évolutions) : phases `charging` (tremblement, lumières qui convergent, `playEvoCharge`) → `boom` (flash, 2 ou 3 ondes de choc, secousse au niveau 2, éclats, `playEvoBoom`) → `shown` (étoiles une à une avec `playStarPing`, points qui montent). Un toucher saute à la fin ; Échap ; mouvement réduit = résultat direct.
- **Visuel permanent** (`applyEvoLook`, `evolution.css`) : 4 particules (niveau 1) ou 7 (niveau 2) qui montent le long du personnage, halo respirant derrière l'image (`.evo-halo`), rayons tournants au niveau 2.
- Piège rencontré : une image `<img>` déclenche un glisser natif (`pointercancel`) → `pointer-events:none` sur les images de la scène ; les `filter: drop-shadow` larges sont rognés dans un contexte 3D → l'aura est un calque à part.
- Tests : `admiration_check.js` (nouveau), `evolution_check.js` adapté (cérémonie, 4/7 particules, halo).

## 44. Révélation d'un nouveau personnage dans le style de la cérémonie d'évolution (03/10/2026)
- `showReveal` (boutique.js) garde ses deux temps (ombre qui tourne → balayage de couleurs) et reçoit, à l'impact (`burst`), la mise en scène de `admiration.js` : rayons tournants (`.rv-rays`), ondes de choc (`.eo-ring`), éclats (`fxBurst`), particules en continu à deux plans (`fxAmbient`, arrêtées à la fermeture ou au personnage suivant), `playRevealBoom`. Intensité `lv0/1/2` selon la rareté (commun / rare / épique et légendaire) ; au plus fort : 3 ondes, secousse, accord final, nom doré.
- Ancien éclat d'émojis (`.rv-spark`, `rvSpark`) supprimé.

## 45. Mode débogage protégé par un code (03/10/2026)
- « Tout débloquer » et « +50 ⭐ » ne sont plus visibles : le bouton « 🔧 Mode débogage » (Réglages) ouvre un champ de code (`#debug-code`, masqué). Le bon code débloque les outils (`debugActive`, variable en mémoire seulement : à ressaisir à chaque session, rechargement compris) ; un mauvais code vide le champ et affiche une alerte. Le bouton « +50 ⭐ » de la Boutique est supprimé (déplacé dans les outils de débogage). `plus50_check.js` remplacé par `debug_check.js`.

## 46. Écran d'accueil : le jeu de maths (03/10/2026)
- Le texte ne parle plus de « géométrie » : badge « Maths · CE1 », accroche « Le grand jeu de maths du CE1 », phrase d'accroche (nombres, calcul, formes, mesures, heure…), les 9 thèmes en pastilles (construites depuis `DOMAINS`, `buildSplashDecor` dans noyau.js, donc toujours à jour), symboles de maths flottants en fond (`#splash-bg`), titre plus grand, bouton dégradé avec reflet qui passe. L'animation du choc chat/brainrot et le chargement de l'image perso (`sp-wait`, `sp-go`, `sp-shake`) sont inchangés ; les nouveaux éléments entrent à la suite (pastilles en cascade).
- Écrans bas (< 680 px de haut) : pastilles masquées pour garder le bouton visible. Mouvement réduit : symboles figés.
- `lib.js` : `withPage({ splash:true })` laisse l'accueil affiché. Test : `accueil_check.js` (nouveau).
- (Résolu au §48 : nouvelle image d'accueil nette.)

## 47. Bannière Kawaii VS Brainrot (03/10/2026)
- `tools/banniere.py` compose `assets/branding/banniere.png` (1920×640) avec les images en pied existantes : 3 chats à gauche (fond rose, étoiles), 3 brainrots à droite (fond sombre, éclairs et lignes « glitch »), diagonale lumineuse, « VS » doré, titre et bandeau « Le jeu de maths du CE1 ». Personnages en autocollants (contour clair, ombre au sol). Non utilisée dans le jeu pour l'instant.

## 48. Image d'accueil nette (03/10/2026)
- `tools/banniere.py` produit maintenant deux images : `banniere.png` (1920×640) et `assets/branding/splash.png` (1280×720, 3 chats | 3 brainrots, coupe droite au milieu, VS centré, sans titre). L'ancienne `splash.jpeg` (128×72, floue) est supprimée.
- `tools/embed.py` encode aussi `splash.png` en WebP base64 (`SPLASH_IMG`, ~160 Ko) : l'image s'affiche donc aussi dans le jeu publié (fichier unique). `images-data.js` passe en premier dans `manifest.json` pour que `noyau.js` la lise.
- `trySplashCustomMedia` : vidéo `assets/branding/splash.mp4/webm` si présente, sinon image embarquée, sinon fichiers image, sinon dessin SVG.
- `splash_check.js` bloque aussi l'image embarquée pour tester le dessin de secours.

## 49. Audit des activités et 6 correctifs (03/10/2026)
- **Nouveau** `AUDIT_ACTIVITES.md` : inventaire des 12 familles et 47 types de Quizz, construction des questions, part d'aléatoire, amplitudes de nombres (annexe A mesurée), absence de bibliothèque de prénoms/objets, redondances, modèle cible « fiche d'activité » et feuille de route P0–P7 vers un éditeur pour adulte.
- **Correctifs** : « dix cent » dans les propositions de `lettres` ; arrondi d'un nombre terminé par 5 (`encadrer`) ; `milieu` Facile (bonne réponse toujours au 2e bouton) ; deux énigmes ambiguës (cercle/boule, cylindre/cercle) ; guide Boutique qui s'ouvrait pendant un chrono (`guideCanInterrupt`) ; texte du guide sur les séries.
- **Test** : `tools/tests/audit_check.js` (47 types × 3 niveaux, structure, ~12 800 recalculs indépendants, anti-régressions).

## 50. Bibliothèques de vocabulaire (P1 de l'audit) (03/10/2026)
- **Nouveau** `src/js/vocabulaire.js` (après `noyau.js`) : `PRENOMS` (14, filles et garçons), `OBJETS` (14, groupes `jeu` / `gourmand` / `fruit`, avec genre et emoji), `ARTICLES` (10 choses à acheter), `COULEURS`, et des fonctions d'accord : `accords(prénom, objet)`, `phrase(gabarit, variables)` (`{nom} {il} {Il} {at} {obj} {seuls} {chacun}` ; une clé inconnue lève une erreur), `unArticle`, `nbObjet`, `nbObjetCouleur`, `prenomAuHasard`, `objetAuHasard`, `deuxDifferents`. Ajouter un prénom ou un objet = une ligne.
- **Migrés** : les 6 gabarits de `vie` (calcul.js) et les 8 de `probleme2` (nombres.js) tirent leurs prénoms, objets, articles et couleurs dans ces listes (plus aucun prénom écrit en dur). Accords corrects (« Elle en perd », « a-t-il », « une gomme », « toutes seules »), et « 1 bille rouge » au lieu de « 1 billes rouges » (défaut ancien de `vie`). La logique de calcul et les plages de nombres ne changent pas.
- Test : `vocabulaire_check.js` (listes, accords, 1 800 énoncés, aucun prénom en dur dans `src/js/`).

## 51. Les mascottes dans les problèmes ; l'écran de question tient sur un téléphone (04/10/2026)
- **Mascottes** : `vocabulaire.js` ajoute `mascottes()` (lues dans le catalogue de la boutique : 35 kawaii = filles, 35 brainrots = garçons) et `toutesLesPersonnes()`. `prenomAuHasard()` tire une fois sur deux un prénom d'enfant, une fois sur deux une mascotte (« Baguetto Montone a 12 billes. Il en perd 3… », « Pétale a-t-elle… »). `vocabulaire_check.js` étendu (accord, noms uniques, 70 mascottes vues).
- **Écran de question sur téléphone** (retour : « je dois scroller pour afficher les boutons ») : la cause était l'illustration carrée (200×200) qui prenait toute la largeur (≈ 320 px de haut) plus un en-tête de 4 rangées. Maintenant :
  - l'illustration (`.shape-wrap`, `.deform-wrap`, `.stage`) est **élastique** : elle prend la place qui reste (au moins 92 px, au plus 260/300 px) et rétrécit pour laisser les réponses et les boutons à l'écran, y compris après une réponse (retour + explication) ;
  - tant qu'une épreuve est affichée, l'appli fait la hauteur de l'écran (`.app:has(…)`, `100dvh`) ; en dernier recours c'est la carte qui défile, pas la page ; la Boutique, la Bataille et les Réglages défilent comme avant ;
  - en-tête resserré sous 780 px de haut (marges, boutons Aléatoire/Révision/Chronométré sur une ligne, consigne plus serrée) ; réponses en dessin plafonnées (`11,5 dvh`) ;
  - la pastille de série devient « 🔥 Série : 3 / 20 » sur petit écran (« sans faute » dès 400 px, paliers « (20 · 25 · 30) » dès 441 px) pour tenir sur la ligne de l'étiquette.
- **Test** : `fit_check.js` (nouveau) mesure, à 360×640, 390×664, 375×667 et 412×760, les 12 familles et les 47 types × 3 niveaux, avant et après une réponse : la page ne défile pas et tous les boutons sont visibles (`--all` : 6 tirages par cas).
- `drag_check.js` rendu stable : il glissait toujours vers la droite et butait parfois sur le bord de la figure ; il glisse maintenant vers le centre.

## 52. Décisions pour l'éditeur d'activités (04/10/2026, documentation seule)
- `AUDIT_ACTIVITES.md` §9.4 / §10 / §11 : architecture **modulaire par paquets JSON** (`kvb-pack`) avec fournisseurs interchangeables (`appareil`, `fichier`, puis `lien` et `cloud`), activités de type `gabarit`, `fixe` (questions écrites à la main) et `réglage` ; aucun code dans un paquet ; validation à l'installation ; progression de l'enfant gardée sur l'appareil par défaut. Parent et enseignant = même rôle. Aucun code de jeu modifié ; chantier en pause jusqu'aux tests en conditions réelles.

## 53. Raretés, points et compétences de personnage (04/10/2026)
- **Demande** : peur de l'effet addictif → pas de gatcha ; on garde l'achat direct et on code le concept de compétences.
- **Raretés** (`boutique.js`) : commun (SVG) / rare (image dans `CUSTOM_IMG`) / défi. Plus de statistiques par rareté : `mkSprite` donne
  5–7 points aux communs et 9–11 aux rares (+ numéro % 3). Achat et évolution : 10 ⭐ un commun, 20 ⭐ un rare (≈ 900 ⭐ par clan, évolutions comprises ; 1 seul personnage offert). Évolution : +20 % (au moins +2).
- **Pas de migration** : les clés de sauvegarde ne changent pas.
- **Reveal** : la couleur de rareté (halo `.rv-aura`, pastille `.rv-rarity`) apparaît à la moitié de l'animation (`REVEAL_TINT_MS`).
- **Compétences** (`competences.js`, nouveau) : 10 compétences (doubler/fixe, complément, table, doubles, moitiés, plus grand, heure,
  monnaie, partage, suite), 7 personnages chacune (`SKILL_BY_ID`). Niveau 0 : ×2 tous les 3 tours ; Évolué : ×2,5 ; Ultime : ×2,5 tous les 2 tours.
  Un commun gagne sa compétence au niveau Ultime (`skillFor`). Remplace le boost global.
- **Bataille** (`bataille.js`) : panneau `#bt-skill` (3 propositions, option « sans la compétence »), `btMakeProc`, `btSkillResult` ; bonne
  réponse = gros dégâts, erreur = dégâts normaux. Cartes : icône de compétence, `.skilled`.
- **Tests** : `skills_check.js` (ex-boost_check), `competences_check.js` (8100 questions vérifiées par oracles), `evolution_check`,
  `reveal_check`, `guide_check`, `battle_check`, `bataille_ui_check` mis à jour.
- **Docs** : `cours.md` (raretés, compétences, évolutions, reveal, guides), `PROJETS.md`, `src/README.md`.

## 54. Boutique à jour des étoiles (04/10/2026)
Bug : les étoiles gagnées s'affichaient en haut mais pas dans la Boutique (compteur et boutons « Acheter » restaient à l'ancien total) tant qu'on ne changeait pas de clan, seul moment où elle était redessinée. Désormais `showTab('shop')` redessine la Boutique à chaque ouverture, et `addStar` la redessine si elle est déjà ouverte. Test : `shop_refresh_check.js` (échoue sur l'ancienne version, passe sur la nouvelle). Au passage : `numChoices` et `bigNumQuestion`, utilisés par le thème Nombres, déplacés de `calcul.js` vers `noyau.js` (retirer Calcul cassait Nombres, vu par `theme_removal_check.js`) ; `golden.js` identique avant/après.

## 55. Audit P2 (partiel) : niveaux réels pour Solides et Monnaie (04/10/2026)
- `solideNom` : Facile = 5 solides simples (cube, pavé, cylindre, cône, boule), Moyen = 8 (+ pyramide, tétraèdre, prisme triangulaire), Difficile = 12 ; les mauvaises réponses sont prises dans le même niveau (`SOLIDE_NOM_LEVELS`).
- `solideCompte` : 3 / 4 / 9 polyèdres selon le niveau (`SOLIDE_COMPTE_LEVELS`).
- `monnaie` : Facile 2 pièces (1, 2, 5 €), Moyen 2-3 (≤ 10 €), Difficile 3-4 (≤ 20 €) (`MONNAIE_LEVELS`) ; le dessin à 4 pièces sert enfin.
- Notes de réglage corrigées (solides, énigmes : 44 après retrait de 2 doublons) ; `QCM_DISPLAY_ORDER` supprimé (ordre = ordre d'enregistrement) ; commentaire des formes cibles de Déformer.
- Test : `niveaux_check.js`. Reste de P2 (objet `params`, `randomNote` générée) rattaché à P4.

## 56. Audit P3 : hasard à graine, dessins reproductibles (04/10/2026)
- `noyau.js` : `rnd()` (hasard des questions), `mulberry32`, `withSeed(graine, fn)` (générateur à graine + sacs « sans remise » vierges, puis tout est remis comme avant). `pick`, `rand`, `randInt`, `shuffle`, `pickFresh` passent par `rnd()` ; les 8 fichiers de questions n'utilisent plus `Math.random()` (les effets visuels, si).
- Le dessin ne tire plus rien : formes (Côtés/Sommets/Nom), orientation des solides, décalages des objets de Dénombrement, couleurs/tailles/rotations de l'Intrus, longueurs des branches d'Angles sont tirés dans `generate` ; redessiner = même image.
- Test : `seed_check.js` (47 types × 3 niveaux × 6 graines : même graine = même question et même image ; graines différentes = questions différentes ; garde-fou contre `Math.random()` dans les fichiers de questions).
- Ouvre la voie aux questions « fixes » et aux aperçus de l'éditeur (P6) : « tester 20 questions » = 20 graines.

## 57. Audit P4 : moteur de fiches et 6 activités de calcul migrées (04/10/2026)
- **`gabarits.js`** : `registerTemplateType(fiche)`. Évaluateur d'expressions maison (priorités, `?:`, fonctions nommées ; ni `eval` ni code saisi), variables (`int`, `pick`, `any`, dérivées), contraintes `where` (rejet borné), formes pondérées par niveau, fausses réponses (`extras`), textes `{expr}`, scène `equation`, **note de réglage générée** depuis les réglages de niveau, **validation de la fiche** à l'enregistrement.
- **`fiches-calcul.js`** : `calc`, `soustraction`, `doubleMoitie`, `complement`, `tables`, `addition` décrits par des fiches ; l'ancien code (fonctions `gen…`, `CALC_LEVELS`, `eqQuestion`) est supprimé. Mêmes plages, mêmes explications, mêmes oracles (`audit_check` inchangé et vert ; `gabarits_check` mesure les plages).
- Le test a trouvé un défaut réel du moteur avant livraison : un nom comme `constructor` était pris pour une expression déjà compilée (cache à prototype) ; corrigé (caches et environnements sans prototype).
- Reste (étapes suivantes) : `soustractionPosee`, `comptage`/`blocs1000` en fiches ; objet de niveaux pour les autres types ; scènes réutilisables (P5).
- Les 6 types s'affichent désormais après les autres types de calcul dans les listes (ordre d'enregistrement).

## 58. Audit P4 (suite) : soustractions posées en fiche, scène de blocs partagée (04/10/2026)
- `soustractionPosee` migrée en fiche (7 activités par fiche) ; ancien code supprimé de `nombres.js` ; fonctions `borrow` et `explainSub` ajoutées aux fonctions nommées des fiches.
- `blocksQuestion(hu, te, un)` (nombres.js) : une seule scène et une seule question « Quel nombre est représenté avec ces blocs ? » pour `blocs1000` et pour le Dénombrement visuel (Moyen/Difficile) ; les deux dessins en double sont fusionnés (les blocs de `comptage` sont un peu plus petits, comme ceux de `blocs1000`). Les identifiants de types ne changent pas : réglages et historique conservés.
- Tests : `gabarits_check.js` étendu (soustractions posées, plages des blocs).

## 59. Audit P5 (début) : scènes réutilisables, 10 activités en fiches (04/10/2026)
- `gabarits.js` : registre `SCENES` (`equation`, `blocks`, `scatter`, `grid`, `emoji`). Chaque scène a `make` (tout le tirage, une fois) et `draw` (aucun tirage : redessiner = même image) ; une fiche l'appelle par `scene:{type, …}` ; la validation refuse une scène ou un paramètre inconnu.
- Migrés en fiches : Dénombrement visuel (`comptage`), Compter jusqu'à 1000 (`blocs1000`), Multiplier/partager (`multiplier` : grille, additions répétées, partages, paquets). Le code des blocs, qui existait en deux exemplaires, est maintenant une seule scène ; `blocksQuestion` disparaît.
- Les 10 activités par fiche : 6 du §57 + soustractions posées + ces 3. Plages inchangées (`gabarits_check`), `audit_check` et `seed_check` verts.
- Reste de P5 : scènes `numberline` (droite graduée), `clock`, `fraction`, banque de texte (calendrier, énigmes, unités, durées).

## 60. Audit P5 (suite) : droite graduée et Comparer en fiches (04/10/2026)
- Moteur : littéraux texte (`'<'`) dans les expressions, `options` (réponses non numériques, 3 boutons) et scène `numberline`.
- `droite` (6 formes : pas 1 ; 10 ou 20 ; 100, 50, ou 10 entre deux centaines) et `compare` en fiches ; anciens `genDroiteQuestion` et `genCompareQuestion` supprimés. 12 activités par fiche.
- **Note corrigée par le code** : « Comparer » annonçait « plus souvent des additions » en Difficile alors que le code tirait 60 % aux deux niveaux ; la part est maintenant un réglage (`pExpr` : 0 / 60 % / 75 %) et la note est générée depuis lui.
- Tests : `gabarits_check.js` (pas et départ de la droite, flèche à la bonne graduation, signe recalculé, proportions d'additions).

## 61. Audit P5b : paquets d'activités (04/10/2026)
- **`paquets.js`** (avant `orchestrateur.js`) : format `kvb-pack` v1 ; deux sortes d'activités, `fixe` (questions écrites à la main, tirage sans remise, réponses mélangées par le jeu) et `gabarit` (une fiche de `gabarits.js`). Aucun code, aucune image (« dessin » doit être `null`) ; limites (300 Ko, 40 activités, 300 questions, textes courts).
- **Validation complète** à l'installation (structure, bornes, noms d'expressions, 200 tirages d'essai à graine par niveau : 2 à 4 propositions distinctes, une seule bonne, pas de « undefined »/« NaN ») ; refus avec message en français. Scènes bornées (`clampInt`), `somme` plafonnée : un paquet ne peut pas faire dessiner des millions d'éléments.
- **Registre** : installer / activer / désactiver / mettre à jour (version plus haute) / retirer ; ids `custom:paquet/activité` ; `refreshQuizTypes()` (orchestrateur) reconstruit niveaux et liste de réglages sans recharger. Une activité qui échoue à l'exécution est écartée et remplacée par une question normale.
- **Fournisseur `appareil`** = localStorage (`geo_packs`), re-validé à chaque démarrage ; **`fichier`** = import / export depuis Réglages → mode débogage (code adulte) → « 📦 Paquets d'activités ». Modèle : `exemples/paquet-exemple.kvb.json`.
- Test `pack_check.js` (≈ 60 contrôles : 20 refus, mise à jour, persistance après rechargement, import par fichier, activité qui plante, HTML dans un paquet reste du texte) ; il a trouvé un vrai défaut avant livraison (un paquet nettoyé n'était pas relu au démarrage).
- Prochaine étape : l'éditeur (P6) : écrire un paquet sans toucher au JSON ; section « Réglages » dédiée (le code adulte est pour l'instant celui du mode débogage).

## 62. Audit P6 : éditeur d'activités (04/10/2026)
- **`editeur.js`** (après `paquets.js`) : Réglages → mode débogage (code adulte) → « ✏️ Mes activités » → « Créer une activité ». Trois modèles : **une table de multiplication** (table de 2 à 12, « jusqu'à × » par niveau), **ajouter ou retirer un nombre** (1 à 99, plage par niveau ; en retrait, jamais de résultat négatif), **mes propres questions** (énoncé, bonne réponse, 1 à 3 mauvaises, explication ; jusqu'à 40).
- Titre, thème et niveaux (Facile / Moyen / Difficile) au choix ; **« 🔍 Tester 20 questions »** montre 20 questions d'essai avec bonne et fausses réponses (à graine fixe, rien d'enregistré) ; **« 💾 Enregistrer »** branche l'activité ; chacune peut être **modifiée** (les réglages d'origine sont gardés dans `meta`) ou **supprimée**.
- Les activités créées vivent dans **un paquet personnel** `perso.moi` (« Mes activités ») : mêmes validation, mêmes 200 tirages d'essai, même stockage (`geo_packs`) et même export que les autres paquets. Aucun nouveau format : `meta` (modèle + réglages, nombres seulement) est la seule addition au schéma `kvb-pack`.
- Logique séparée de l'écran : `editeurBuildAct`, `editeurApercu`, `editeurSave`, `editeurRemove`. Messages d'erreur en français (« Question 2 : écris l'énoncé. »).
- Test `editeur_check.js` (≈ 60 contrôles : réponses justes sur 3 tables et les 2 sens, 14 refus, enregistrer / modifier / supprimer, persistance, écran complet, HTML dans un titre reste du texte).
- Reste de P6 : choix du vocabulaire par fiche, modèles de calcul supplémentaires (doubles, compléments), audit d'accessibilité (axe-core) de l'éditeur.

## 63. Audit P5 (fin) : horloge, fractions, calendrier en fiches (04/10/2026)
- Moteur (`gabarits.js`) : scènes `fraction` (disque ou bande, k parts coloriées sur n) et `clock` (horloge à aiguilles) ; **banques de textes** `JOURS` et `MOIS` ; fonctions `at(liste, i)` (en tournant) et `others(liste, sauf, n)` ; **réponses de texte** (`wrong` : liste des fausses réponses calculée) ; **choix d'une figure** (`figures` : 4 dessins d'une même scène, le premier est le bon, le moteur mélange). Un paquet ou l'éditeur peut s'en servir (validation étendue).
- `fiches-temps.js` (nouveau) : **Lire l'heure** (3 niveaux, dont 0 h à 23 h avec le moment de la journée), **Choisir l'horloge** et **Calendrier** ; `fraction` ajoutée à `fiches-calcul.js`. Anciens `genHeureQuestion`, `genHeure24Question`, `genHorlogeChoixQuestion`, `genCalendrierQuestion`, `genFractionQuestion`, `drawFractionShape`, `textChoices`, `gcd2` supprimés. 16 activités par fiche. L'écran « Lire l'heure » (module 5) appelle la fiche `heure` en lui donnant son propre dessin (`generate(niveau, 'm5Svg')`).
- **Défaut ancien trouvé et corrigé** : en Facile, « Quelle figure a la moitié / le quart coloriée ? » n'était jamais posée (il manquait une 4e fraction différente : la question retombait toujours sur « Quelle fraction est coloriée ? »). La figure toute coloriée sert maintenant de mauvaise réponse en Facile ; la note de réglage disait déjà « demis et quarts ».
- Léger changement d'image : le calendrier et la pizza des fractions sont dessinés par la scène `emoji` (un peu plus petits, plus hauts).
- Tests : `gabarits_check.js` étendu (calendrier recalculé depuis l'énoncé, aiguilles dessinées = réponse, 4 horloges différentes, figure juste = fraction demandée, les deux sortes de fractions à chaque niveau, aucun guillemet parasite) ; `pack_check.js` (un paquet utilise banque, texte, horloge, figures ; scène non numérique refusée).
- Reste hors fiches (dessin propre à chaque activité) : énigmes, mesures, solides, géométrie, durées, monnaie.

## 64. Audit P6 (fin) : « à ma façon » et accessibilité de l'éditeur (04/10/2026)
- Quatrième modèle de l'éditeur : **« Une activité du jeu, à ma façon »** : on part de Calcul, Soustraction, Doubles et moitiés ou Comparer et on change la taille des nombres à chaque niveau (bornes et planchers vérifiés avec des messages clairs, ex. « En Moyen : un nombre de 10 à 100 »). L'activité du jeu n'est jamais modifiée : l'éditeur en enregistre une copie dans « Mes activités ». Changer d'activité de départ recharge ses réglages d'origine.
- **Accessibilité** : `a11y_audit.js` (axe-core, WCAG 2.2 AA, deux clans) couvre maintenant la liste « Mes activités », le choix du modèle, les 4 formulaires, l'aperçu et les messages d'erreur : 0 défaut. Clavier : le curseur arrive sur le titre à l'ouverture d'un formulaire, l'ordre de tabulation suit l'écran, et il revient sur « Créer une activité » après Enregistrer ou Annuler (`editeur_check.js`).
- Le choix du vocabulaire des énoncés n'est pas proposé : les énoncés restent ceux de l'activité (le vocabulaire commun vit dans `vocabulaire.js`, vérifié par `vocabulaire_check`). Les questions écrites à la main sont libres.
- P6 est terminé. Suite possible : P7 (fournisseurs lien / cloud, à cadrer avec le RGPD) ou P8 (éditeur de patrons).

## 65. Audit P8 : patrons de cube dessinés en cases (04/10/2026)
- **Paquets** : nouvelle sorte d'activité `patron` (`grille` « .X../XXXX/.X.. », 6 colonnes × 5 lignes au plus, de 2 à 10 cases d'un seul morceau, niveaux au choix). Le moteur 3D existant (`makeNet`, patron3d.js) calcule seul si le patron se referme : la réponse n'est jamais saisie. Les patrons rejoignent la famille « Patron → Solide » (`NET_DEFS`, groupe « 📐 Mes patrons », réglables niveau par niveau comme les autres) ; désactiver ou retirer le paquet les retire.
- **Éditeur** : 5e modèle « Un patron de cube à dessiner » : grille de cases (boutons à bascule, annonce vocale « Ligne 2, colonne 3 : case du patron », flèches du clavier), « 🔍 Tester le patron » (dit s'il se plie en cube ou pourquoi non, et le dessine), le dessin est recadré sur ses cases à l'enregistrement.
- **Test `patron_check.js`** : oracle indépendant (un dé qui roule sur les cases) comparé au moteur 3D sur **tous les assemblages de 2 à 7 cases** tenant dans la grille : aucun plantage, aucun désaccord, les 11 patrons de cube trouvés dans toutes leurs positions ; ensuite paquet, jeu et pliage d'un patron de paquet, 7 refus, éditeur (souris, clavier, erreurs). `a11y_audit` : 0 défaut.
- Reste de P8 : réglages des écrans propres (Mesurer, Horloge, ateliers) ; patrons de pavés et de pyramides (il faut des dimensions par colonne et par ligne).
