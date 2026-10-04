# Audit des activités — préparer l'éditeur d'activités (03/10/2026)

Objectif : savoir **comment les activités sont construites aujourd'hui** (paramètres, part d'aléatoire, plages de
nombres, vocabulaire), pour (1) rationaliser le code en remplaçant les variantes écrites en dur par des
paramètres, et (2) préparer un éditeur qui laisse un adulte créer ses propres activités.
Ce document ne change aucun comportement du jeu : il décrit, mesure et propose. Les défauts trouvés en route
sont corrigés (§8) ; le reste est de la feuille de route (§10). L'audit de variété précédent est dans
`AUDIT_VARIETE.md` (il traite le *contenu* des activités ; celui-ci traite leur *construction*).

## 0. Résumé

- **12 familles d'écran** (Mesurer, Estimer, Déformer, Patron → Solide, Lire l'heure, Régler l'heure, 5 ateliers, Quizz)
  et **47 types de Quizz** (dans 9 thèmes). 27 de ces types ont une réponse numérique.
- **Aucun type n'a de « paramètres » au sens d'un objet de réglage.** Un type est une fonction JavaScript qui contient
  ses plages, ses listes et ses textes. Il y a bien 6 petites tables de niveaux (`CALC_LEVELS`, `M1_LEVELS`,
  `ESTIMATE_LEVELS`, `M2_LEVELS`, `GEO_LEVELS`, `NET_DEFS`…), mais l'essentiel est dans **161 branches `if(level…)`
  et ~110 ternaires `level===0 ? … : …`** répartis dans 5 fichiers, avec ~350 appels au hasard (`randInt`, `pick`, `rand`)
  et 60 `Math.random()` directs. Ordre de grandeur : **400 à 500 valeurs de réglage éparpillées** (plages, pas, listes, seuils).
- **Amplitude des nombres : oui, il y en a une, mais implicite.** Chaque niveau fixe un maximum dans le code
  (ex. addition : total ≤ 10 / 20 / 20 ; soustraction : 10 / 20 / 60 ; additions posées : 99 / 99 / 999), mesuré au §5 et en annexe A.
  Rien n'est modifiable sans toucher au code, et la phrase qui décrit la plage (`randomNote`) est un second texte, écrit à la main.
- **Noms propres : il n'y a pas de bibliothèque.** Cinq prénoms (Léa, Tom, Léo, Nina, Maya) sont écrits en dur dans 14 gabarits
  de problèmes (`vie`, `probleme2`), avec leurs accords (« Elle en perd »). Idem pour les objets (billes, gâteaux, stickers…),
  les lieux, les verbes. Voir §6.
- **L'aléatoire est correct et sans faute de calcul** : 12 776 énoncés recalculés par un code indépendant, 0 écart ; la bonne réponse
  est bien répartie sur les 4 boutons (sauf un défaut corrigé) ; 0 NaN/undefined. Mais il est **non reproductible**
  (aucune graine) et **mélange le fond et la forme** (§4).
- **12 types sur 47 ignorent le niveau** : leur difficulté se règle seulement en disant « présent en Facile/Moyen/Difficile ».
- **6 défauts réels trouvés et corrigés** dans cette passe (§8), avec un test qui les garde (`tools/tests/audit_check.js`).
- **Recommandation** : un moteur unique « gabarit d'activité » (§9) piloté par des données, migré type par type
  (6 types arithmétiques d'abord), avec des bibliothèques partagées (prénoms, objets, lieux) ; l'éditeur vient *après*
  (§10) ; le jeu lit des **paquets JSON** venant de l'appareil, d'un fichier ou, plus tard, d'un cloud de classe (§9.4). Les patrons 3D sont déjà dans ce style (catalogue de données) : c'est le modèle à suivre.

## 1. Méthode et étendue de la relecture

- **Lu en entier, ligne à ligne, dans cette session** : `calcul.js`, `nombres.js`, `geometrie.js` (2 066 l.), `horloge.js`,
  `atelier.js`, `orchestrateur.js`, `progression.js`, `noyau.js` (registre, flux de question, outils), `patron3d.js`
  (catalogue, moteur de pliage, questions de solides ; le tracé SVG du rendu 3D, l. 330-536 et 605-770, n'a pas été relu : il ne contient pas de paramètre d'activité).
- **Relu par un sous-agent** (lecture seule, rapport vérifié par recoupement sur les points qui touchaient une activité) :
  `bataille.js`, `boutique.js`, `guide.js`, `chaleur.js`, `admiration.js`. Leurs constats sont au §8.3, marqués « non reproduit » quand je ne les ai pas rejoués.
- **Mesuré** (`tools/tests/audit_check.js`) : les 47 types × 3 niveaux × 400 questions = 56 400 questions tirées, avec contrôle de
  structure (4 réponses, exactement 1 bonne, libellés distincts, pas de NaN), amplitude des nombres, répartition de la bonne
  réponse sur les 4 boutons, et **recalcul indépendant** de l'énoncé pour 20 formes de question (additions, soustractions,
  tables, doubles/moitiés, compléments, comparaisons, suivant/précédent, chiffre des dizaines/unités, conversions…).
  Les familles à écran propre (Mesurer, Estimer, Régler l'heure) ont été mesurées à part (600 tirages par niveau).

## 2. Inventaire

### 2.1 Familles d'écran (`registerFamily`)
| Famille | Fichier | Thème | Ce qui se règle aujourd'hui (niveau) | Essais |
|---|---|---|---|---|
| Mesurer | geometrie.js | mesures | `M1_LEVELS` : longueur de la règle visible (10/14/15), début de règle (0 ; 0 ; −4…−1), décalage du trait (0/4/5), demi-cm (non/non/oui), longueur du trait (1-9 / 2-8 / 2-8) | 1 |
| Estimer une longueur | geometrie.js | mesures | `ESTIMATE_LEVELS` : demi-cm, trait décalé, écarts entre propositions (`gaps`) ; règle fixe de 10 cm | 1 |
| Déformer | geometrie.js | formes | 5 formes (tirage sans remise, **indépendant du niveau**) ; `perturbForLevel` : nombre de coins décalés (1 / 3 ou 2 / tous), amplitude (35-55 / 25-45 / 45-75 px) ; tolérances par forme (`tolGreat`, `tolOk`, formats différents d'une forme à l'autre) | 3 |
| Patron → Solide | patron3d.js | solides | **28 patrons en catalogue** (`NET_DEFS`), chacun avec ses niveaux ; réglable dans « Activités & difficulté » | 1 |
| Lire l'heure | horloge.js | temps | pas de la grande aiguille (30 / 15 / 5 min) ; 12 h ou 24 h (Difficile) | 1 |
| Régler l'heure | horloge.js | temps | `M5R_MIN_STEP` (180° / 90° / 30° par cran) ; heures 1-12 / 1-12 / 0-23 ; 2 / 4 / 12 minutes possibles | 3 |
| Atelier symétrie | atelier.js | symétrie | colonnes × lignes (3×4 / 3×5 / 4×5), nb de cases (4/6/9), axe horizontal au niveau 3 | 3 |
| Atelier fraction | atelier.js | nombres | dénominateurs [2,4] / [2,3,4] / [4,6,8], 5 fractions cibles, 40 % « k/8 » en Difficile | 3 |
| Atelier copie | atelier.js | formes | grille 4×4, 5 cases, **Facile seulement** | 3 |
| Atelier erreur | atelier.js | formes | grille 4/5/6, cases 5/8/12, erreurs 1/2/3 (nombre annoncé ou non) | 3 |
| Atelier axes | atelier.js | symétrie | grille 4 / 5 / 5-6, lignes V,H (+2 diagonales en Difficile), jeux d'axes voulus (`wants`) | 3 |
| Quizz | orchestrateur.js | (par type) | voir §2.2 ; poids 3 dans le tirage | 1 |

### 2.2 Types de Quizz (`registerQuizType`) : 47
Chaque type déclare `id, domain, label, longLabel, defaultLevels, randomNote, generate(level)`. Le tableau complet
mesuré est en **annexe A**. Répartition : calcul.js 13, nombres.js 9, geometrie.js 19, horloge.js 4, patron3d.js 2.

Types qui **ignorent le niveau** (`generate()` n'a pas de paramètre `level`) : `monnaie`, `vie`, `coord`, `coordFind`, `codage`,
`chasse`, `solideNom`, `solideCompte`, `image`, `decodage`, `symVrai`, `enigme`. Leur difficulté ne dépend que des niveaux où
ils sont déclarés présents. Conséquence visible : `solideNom` pose un octaèdre ou un prisme octogonal dès le Facile.

## 3. Comment une question est construite

Contrat commun (noyau.js, `registerQuizType`) : `generate(level)` renvoie
`{ tag, question, sub, explain, draw(), cols3, choices:[{label, ok, draw?, viewBox?}] }`.

1. **Choix de l'activité** (orchestrateur.js, `nextPracticeQuestion`) : un « sac » de familles tiré sans remise (le Quizz y pèse 3),
   puis, dans le Quizz, un thème sans remise, puis un type sans remise (`pickFresh`). Mode Manuel / Révision / « sujet à travailler »
   imposent l'unité. Une signature de question évite les doublons sur les 80 dernières (`SEEN_MAX`).
2. **Choix du gabarit** : quand un type contient plusieurs formes de question, une liste est tirée (souvent sans remise) :
   `vie` (6 gabarits), `probleme2` (8), `image` (5), `enigme` (46), `angle` (3 variantes), `align` (3), `symVrai` (4 figures)…
3. **Tirage des valeurs** : `randInt(min,max)` dans des plages écrites dans la fonction, avec *rejet* quand il y a une contrainte
   (retenue obligatoire ou interdite, a < b, 3 points alignés dans la grille, etc. : boucles `do … while`).
4. **Calcul de la bonne réponse** : une expression JavaScript propre à chaque type.
5. **Fabrication des mauvaises réponses** : un « pool » de valeurs voisines (±1, ±2, ±10, ±100, chiffres permutés, autre opération,
   extrémité au lieu du milieu…), filtré puis tiré par `numChoiceSet`/`numChoices` (nombres), `textChoices`/`labelChoices`
   (textes), ou construit à la main (visuels). Si le pool est trop petit, il peut y avoir moins de 4 réponses (voulu pour
   oui/non, 3 signes, 3 trajets).
6. **Texte** : énoncé, consigne, explication écrits en dur dans la fonction, avec concaténation de valeurs.
7. **Dessin** : `draw()` écrit dans `#m4Svg` ; les réponses visuelles dessinent dans leur propre `<svg>`.

Les types **numériques** (27) partagent déjà des outils (`numChoices`, `bigNumQuestion`, `eqQuestion`, `drawEquation`) :
c'est le noyau d'un futur moteur de gabarits.

## 4. Part d'aléatoire

| Couche | Aujourd'hui | Remarque |
|---|---|---|
| Quelle activité | sac sans remise (familles, thèmes, types) | bon ; paramétré par `weight` seulement |
| Quel gabarit | `pickFresh` sur une liste | bon ; listes en dur |
| Quelles valeurs | `randInt` + rejet | plages en dur, différentes à chaque niveau |
| Quelles mauvaises réponses | pool voisin + tirage | recette propre à chaque type, aucune règle partagée |
| Forme visuelle (rotation, couleur, miroir) | `Math.random()` **dans `draw()`** | voir ci-dessous |

Constats mesurés ou lus :
- **Aucune graine** : tout vient de `Math.random()`. On ne peut pas rejouer une question, ni écrire un test de non-régression
  déterministe, ni proposer un « défi du jour » identique pour deux enfants.
- **Le dessin est tiré au hasard à l'affichage** (formes de `sides/vertices/name`, objets de `comptage`, intrus, angles `drawAngleAt`,
  miroir des solides). Tant que `draw()` n'est appelée qu'une fois par question c'est sans effet, mais **redessiner changerait l'image**
  (zoom, rotation de l'écran, « revoir »). Le fond (la question) et la forme (le dessin) devraient être tirés ensemble, au moment de `generate`.
- **Répartition de la bonne réponse** (47 types × 3 niveaux, 400 tirages) : uniforme (chaque bouton 22-28 %) partout, sauf deux
  causes légitimes (types à 2-3 réponses ; signe `< = >` à ordre fixe). Un défaut a été trouvé et corrigé : `milieu` Facile
  mettait la bonne réponse **toujours au 2e bouton** (3 000 sur 3 000).
- **Variété du fond** : voir `AUDIT_VARIETE.md`. Chiffres de cette passe (énoncé + réponses écrites, par niveau F/M/D, sur 400) :
  `symVrai` 10, `enigme` 46 (banque fixe), `mesures` 14 en Facile (14 scènes d'unités), `fraction` ~50 en Facile,
  `complement` ~125 en Facile ; tous les types de calcul posé dépassent 280.

## 5. Amplitudes de nombres

Réponse à la question « a-t-on une amplitude max pour les nombres utilisés ? » : **oui, par niveau et par type, mais seulement
dans le code**. Plages mesurées (plus grand nombre vu dans l'énoncé / dans la bonne réponse) :

| Famille d'opération | Facile | Moyen | Difficile |
|---|---|---|---|
| Addition simple (`calc`) | total ≤ 10 | total ≤ 20 | total ≤ 20 (+ « trouve x ») |
| Soustraction (`soustraction`) | a ≤ 10 | a ≤ 20 | a ≤ 60 |
| Doubles et moitiés | n ≤ 10 (réponse ≤ 20) | n ≤ 20 | n ≤ 50 (réponse ≤ 100) |
| Compléments | à 10 | à 20 | à 100 (multiples de 5) |
| Tables | ×2, ×10 | ×2, ×5, ×10 | + ×3, ×4 (réponse ≤ 100) |
| Additions posées | 2 chiffres, sans retenue, ≤ 99 | ≤ 99, retenue fréquente | ≤ 999 |
| Soustractions posées | ≤ 99, sans emprunt | ≤ 99, emprunt fréquent | ≤ 999 |
| Numération / ordre | ≤ 59 / ≤ 20 | ≤ 99 / ≤ 100 | ≤ 999 / ≤ 1000 |
| Problèmes à 2 étapes | ≤ 30 environ (Moyen) | — | jusqu'à 100 et plus (réponse ≤ 101) |

Ces valeurs vivent dans une soixantaine d'endroits (`randInt(11,89)`, `hi = level===0 ? 10 : …`). Il n'existe pas d'objet
« plage du niveau ». Les phrases d'aide du panneau de réglage (`randomNote`) les répètent à la main : **3 de ces phrases étaient
déjà fausses** (voir §8.2). Un éditeur devra *générer* la note à partir des paramètres plutôt que la recopier.

## 6. Noms et vocabulaire : y a-t-il des bibliothèques ?

**Non.** Tout est écrit dans les gabarits :
- **Prénoms** : Léa, Tom, Léo, Nina, Maya (mesurés : 5 prénoms seulement, sur 14 gabarits dans `calcul.js`/`vie` et `nombres.js`/`PROBLEMES2`). Le genre est
  implicite (« Elle en perd »), rien ne permet d'en ajouter sans réécrire la phrase.
- **Objets et lieux** : billes, crayons, pommes/poires, arbres, gâteaux, stickers, cahiers, pages, bus, marché… avec leur pluriel, leur genre
  et leur emoji écrits dans chaque phrase. Petites listes à part : `COUNT_ICONS` (8), `PART_ICONS` (5), `SUITE_SYMBOLS` (6).
- **Banques de contenu fixes** : `ENIGME_POOL` (46 énigmes, chacune avec sa liste de 4 réponses écrite à la main), `UNITE_SCENES` (14),
  `DUREE_SCENES` (7 : film, match, cuisson…), `JOURS`, `MOIS`, `MARKER_LABELS`, `SOLID_FACTS`, `NAME_POOL`, `SHAPE_META`.
- Le **tutoiement/vouvoiement** et l'accord du verbe ne sont pas gérés : la phrase est un texte, pas un modèle.

Ce qu'il faudrait (voir §9) : une bibliothèque `PRENOMS [{nom, genre}]`, `OBJETS [{sing, plur, genre, emoji, contexte}]`,
`LIEUX`, `PERSONNAGES` (les chats et brainrots du jeu eux-mêmes pourraient être les « prénoms » : l'enfant verrait *ses* personnages dans les problèmes),
et un petit moteur de gabarits de phrase (`{prenom} a {n} {objet:plur}. {il/elle} en perd {m}.`).

## 7. Redondances à rationaliser

Familles de types qui sont **le même moteur avec d'autres réglages** :
1. **Opération à trous** : `calc`, `soustraction`, `doubleMoitie`, `complement`, `tables`, `addition` (posée), `soustractionPosee`,
   `plusMoins`, `multiplier` (« fois »). Même squelette : choisir des opérandes dans des plages, éventuellement avec contrainte
   (retenue), calculer, ajouter des voisins. ≈ 700 lignes remplaçables par un gabarit + 9 fiches de réglage.
2. **Lire une valeur sur un dessin** : `droite`, `comptage`, `blocs1000`, `fraction`, `monnaie`, `chasse`, `image`, `perimetre`.
   `comptage` (Moyen/Difficile) et `blocs1000` dessinent la **même scène** (plaques/barres/cubes) avec deux fonctions différentes :
   à fusionner (ancienne duplication, règle « aucun legacy »).
3. **Questions à banque de texte** : `calendrier`, `enigme`, `mesures` (unités), `duree`, `horlogeChoix`, `solideNom`, `name` :
   « un énoncé, une bonne réponse, un pool de mauvaises ».
4. **Grille 5×5** : `align`, `milieu`, `coord`, `coordFind`, `codage`, `decodage`, `symVrai` partagent `drawGridBase`, `coordLabel`, les marqueurs.
5. **`sides` et `vertices`** : même fonction avec un argument ; **`calc` mode « trouve x »** et **`complement`** : même question (`a + ? = c`).
6. **Trois mécanismes parallèles par type** : le code de `generate`, la liste `defaultLevels`, la phrase `randomNote`. Ils dérivent
   (cf. §8.2). Un seul objet de paramètres doit alimenter les trois.

## 8. Défauts trouvés

### 8.1 Corrigés dans cette passe (test : `tools/tests/audit_check.js`)
| # | Défaut | Mesure | Correction |
|---|---|---|---|
| 1 | `lettres` (Difficile) : un distracteur pouvait être « **dix cent** cinquante-neuf » (n + 100 dépassait 999) | 71 cas sur 3 000 | filtre `< 1000` |
| 2 | `encadrer` (Difficile) : « Arrondis **605** à la dizaine la plus proche » (milieu exact, deux réponses défendables) | 60 cas sur 6 000 | un nombre terminé par 5 n'est plus tiré |
| 3 | `milieu` Facile : la bonne réponse était **toujours le 2e bouton** (les formes étaient listées dans l'ordre du segment) | 3 000 / 3 000 | réponses mélangées |
| 4 | `enigme` : « tout rond, ni côté ni sommet » proposait *cercle* **et** *boule* (deux réponses possibles) ; « roule très loin » proposait *cylindre* et *cercle* | 2 énigmes | texte précisé (« tout plat, tout rond ») et propositions revues |
| 5 | Guide « Boutique » pouvait **s'ouvrir en plein défi chronométré** (6 étoiles sans achat) et emmener l'enfant hors de l'écran de jeu | lu dans `guideCanInterrupt` | refus si un chrono tourne |
| 6 | Texte du guide : les personnages « Défi » « se gagnent avec 20 bonnes réponses d'affilée » (il y a aussi les défis chronométrés ; séries à 20/25/30) | texte | reformulé |

### 8.2 Constatés (petits ; à traiter avec le §10) — **corrigés en P2 (§55)** : notes `solideNom`/`solideCompte`, `QCM_DISPLAY_ORDER`, niveau de `solideNom`/`monnaie` (et 4 pièces), énigmes en double, commentaire « 3 formes cibles ». Restent : `comptage` Facile (corrigé en P3) et les types qui ignorent encore le niveau (P4)
- `randomNote` périmées : `solideNom` annonce « 6 solides » (il y en a 12), `solideCompte` « cube/pavé/pyramide » (il y a 9 polyèdres) ; la liste d'ordre `QCM_DISPLAY_ORDER` (orchestrateur.js) est un reste historique incomplet.
- 12 types ignorent le niveau (§2.2) ; `solideNom` Facile pose des solides très difficiles.
- `monnaie` : dessin prévu pour 4 pièces/billets (`positions`), le tirage n'en donne que 2-3 ; le niveau n'est pas lu.
- `comptage` Facile : la position des objets est tirée **dans `draw()`** (redessin = objets qui bougent).
- Doublons de contenu : `ENIGME_POOL` contient 4 énigmes quasi identiques (cube ×3, cylindre ×2).
- Anciennes consignes : l'en-tête de `geometrie.js` parle de « 3 formes cibles » pour Déformer (il y en a 5) et `M2_LEVELS` est nommé par forme alors que la note parle d'un niveau.

### 8.3 Signalés par la relecture des fichiers « jeu » (sous-agent ; **non reproduits** sauf mention)
- `bataille.js` : des `setTimeout` d'attaque ne sont pas annulés si on quitte puis relance un combat (gravité moyenne, rare).
- `boutique.js` : `tryLoadCustomImage` peut lever une erreur si le conteneur est vidé pendant le chargement ; essais d'images 404 répétés à chaque rendu de la boutique ; `STAT_KEYS`/`STAT_LABELS` semblent inutilisés (reste à supprimer, règle « aucun legacy ») ; JSON `geo_*` corrompu → aucun personnage de départ.
- `admiration.js` : course sur le chargement de l'image « plein pied » quand on enchaîne ◀/▶ très vite ; ambiance sonore non coupée si une 2e cérémonie remplace la 1re.
- Beaucoup de textes d'aide répètent en dur des valeurs qui existent en constantes (`STREAK_GOALS`, `HEAT_STEPS`, coûts de rareté).

## 9. Modèle cible : un « gabarit d'activité » piloté par des données

### 9.1 Principe
Remplacer *une fonction par type* par *une fiche de données par type* + **quelques moteurs** (arithmétique, texte à banque,
lecture sur dessin, grille). Une fiche décrit **quoi tirer, comment calculer, comment fausser, comment dire, comment dessiner**.
Le jeu, les tests et l'éditeur lisent la même fiche.

### 9.2 Fiche d'activité (proposition, JSON)
```json
{
  "id": "addition-retenue",
  "version": 1,
  "domain": "calcul",
  "label": "Additions posées",
  "scene": "equation",
  "levels": {
    "0": { "vars": { "a": {"int":[11,89]}, "b": {"pick":[[1,9],[10,80,10]]} },
           "where": ["a+b<=99", "!carry(a,b)"] },
    "1": { "vars": { "a": {"int":[15,89]}, "b": {"int":[11,60]} },
           "where": ["a+b<=99", "carry(a,b)|rand<0.4"] },
    "2": { "vars": { "a": {"int":[120,899]}, "b": {"int":[11,499]} }, "where": ["a+b<=999"] }
  },
  "answer": "a+b",
  "distractors": ["answer-10", "answer+10", "answer+1", "answer-1", "swap_digits(answer)"],
  "text": {
    "question": "Calcule {a} + {b}.",
    "hint": "Additionne en colonnes{level>=2: , puis centaines}.",
    "explain": "{explain_add(a,b)}"
  }
}
```
Problème à histoire (utilise les bibliothèques) :
```json
{ "id": "perte-gain", "domain": "calcul", "scene": "icon",
  "vars": { "who": {"lib":"prenoms"}, "what": {"lib":"objets", "tag":"comptable"},
            "A": {"int":[40,90]}, "B": {"int":[3,"A/2"]}, "C": {"int":[3,30]} },
  "answer": "A-B+C",
  "text": { "question": "{who} a {A} {what:plur}. {who:il/elle} en perd {B}, puis en gagne {C}. Combien {who:en} a-t-{who:il/elle} maintenant ?",
            "explain": "{A} - {B} = {A-B}, puis {A-B} + {C} = {A-B+C}." } }
```
Éléments du modèle :
- **Variables** : `int[min,max(,pas)]`, `pick[liste]`, `lib` (bibliothèque + filtre), `derived` (formule). Contraintes `where` (rejet borné, comme les `do…while` actuels).
- **Mini-langage d'expressions** (`+ − × ÷ %`, comparaisons, `min/max`, `carry()`, `digits()`) évalué par **notre propre évaluateur**
  (jamais `eval` ni code saisi : un adulte ne peut pas casser le jeu ni exécuter du script).
- **Distracteurs** : liste de *stratégies nommées* (voisin ±k, chiffres permutés, mauvaise opération, erreur de retenue, extrémité, « aucune »),
  réutilisables entre activités (aujourd'hui recopiées dans chaque type).
- **Scènes** (ce qui est dessiné) : `equation`, `icon`, `grid` (5×5 avec points/segments), `numberline`, `blocks`, `clock`, `fraction`,
  `money`, `shapes`. Chaque scène a ses propres réglages ; elles remplacent les ~40 `draw()` actuels.
- **Textes** : gabarits avec accords (`{who:il/elle}`, `{what:plur}`, `{n>1: s}`), la **note de réglage est générée** depuis la fiche.
- **Graine** : `generate(level, seed)` ; sans graine = comportement actuel. Le fond *et* la forme sont tirés ensemble (fin du hasard dans `draw`).
- **Compatibilité** : une fiche produit exactement le contrat actuel `{tag, question, sub, explain, draw, cols3, choices}` ;
  `registerQuizType` n'est pas modifié, l'orchestrateur, la progression (`domain`) et les réglages continuent de fonctionner.

### 9.3 Familles à écran propre : un objet `params` par famille
Mesurer, Estimer, Déformer, Régler l'heure, ateliers : on regroupe leurs constantes dans un objet par niveau (déjà presque le cas :
`M1_LEVELS`, `ESTIMATE_LEVELS`, `M5R_MIN_STEP`…), exposé à l'éditeur sous forme de curseurs/cases. Pas de moteur générique : l'écran est trop spécifique.
**Patron → Solide** est déjà un catalogue de données (motif en grille `'.X../XXXX/.X..'`) avec calcul automatique de la bonne réponse :
l'éditeur peut le proposer tel quel (dessiner un patron en cochant des cases, le jeu dit s'il se plie en cube/pavé/… ou « aucun »).

### 9.4 Architecture modulaire : le « paquet d'activités » (décisions du 04/10/2026)

**Décisions prises avec le propriétaire du projet**
- L'« adulte » est **un parent ou un enseignant, sans différence** : un seul rôle « créateur », un seul éditeur.
- Une activité doit pouvoir être **ajoutée sur un appareil** (sans réseau) **ou venir d'un cloud partagé entre plusieurs élèves**.
- Penser **modulaire** : le jeu ne doit pas savoir d'où vient une activité.
- Les **questions fixes** (énoncé et réponses saisis à la main, sans variables) sont voulues, en plus des gabarits.
- Les **mascottes sont des personnages de problèmes** (kawaii = filles, brainrots = garçons) : fait, voir HISTORIQUE §51.

**Unité d'échange : le paquet (`pack`)**. Un paquet est un fichier JSON autonome, versionné, qui contient une ou plusieurs activités
(et au besoin ses propres listes de vocabulaire). C'est la seule chose que l'éditeur écrit et que le jeu lit.
```json
{ "format": "kvb-pack", "formatVersion": 1,
  "id": "ecole-bellevue.ce1.periode2", "version": 3, "titre": "Période 2 — CE1 B",
  "auteur": "Mme Martin", "créé": "2026-10-04", "modifié": "2026-11-12",
  "vocabulaire": { "prenoms": [{"nom":"Idriss","f":false}], "objets": [] },
  "activités": [ { "id":"tables-7", "type":"gabarit", "...": "fiche du §9.2" },
                 { "id":"capitales-ue", "type":"fixe", "domain":"nombres",
                   "questions":[ { "q":"Combien font 7 × 8 ?", "bonnes":["56"], "fausses":["54","49","63"],
                                   "explication":"7 × 8 = 56", "dessin":null } ],
                   "tirage":"sans remise", "niveaux":[0,1,2] } ] }
```
Trois sortes d'activités dans un paquet : **`gabarit`** (variables + calcul, §9.2), **`fixe`** (liste de questions écrites à la main : le
niveau « adulte débutant », mélange des réponses fait par le jeu, tirage sans remise, nombre de fausses réponses libre de 1 à 3,
image facultative), et **`réglage`** (nouveaux paramètres d'une activité intégrée : « Mesurer de 1 à 5 cm seulement »).

**Sources de paquets (« fournisseurs »)** : une interface unique `PackSource { list(), load(id), save(pack)?, remove(id)? }`, derrière laquelle on branche :
| Fournisseur | Rôle | Réseau | Qui écrit |
|---|---|---|---|
| `integre` | les activités actuelles du jeu (converties peu à peu en fiches) | non | développeur |
| `appareil` | stockage local (IndexedDB ; `localStorage` trop petit pour les images) | non | créateur sur cet appareil |
| `fichier` | import / export d'un fichier `.kvb.json` (mail, clé USB, messagerie de l'école) | non | créateur |
| `lien` | un paquet publié à une adresse (lecture seule, mis en cache hors ligne) | oui, lecture | créateur, hébergé n'importe où |
| `cloud` | espace partagé d'une classe : l'élève s'abonne à un « code de classe », reçoit les paquets, et (option) renvoie sa progression | oui | créateur, via l'éditeur |
Le jeu ne connaît que `PackSource` : ajouter un fournisseur ne change ni l'orchestrateur, ni les tests, ni l'éditeur. **Étape 1 = `appareil` + `fichier`**
(aucun serveur, aucun compte, aucune donnée d'enfant qui sort) ; `lien` ensuite ; `cloud` seulement quand les besoins réels seront connus.

**Cycle de vie** : un paquet est *installé* → *activé* (case par activité et par niveau, comme les réglages actuels) → *mis à jour* (la `version` plus haute
remplace ; l'historique de réponses reste, car il est rangé par `id` d'activité) → *retiré*. Un paquet **ne peut jamais casser le jeu** : validation complète à l'installation
(schéma, bornes, expressions évaluées sur 200 tirages d'essai, une seule bonne réponse, propositions distinctes), refus avec message en français sinon ; une activité qui échoue
à l'exécution est écartée pour la session, le jeu continue.

**Sécurité et vie privée** (importantes dès que des élèves reçoivent des paquets d'un tiers) :
- Un paquet ne contient **jamais de code** : uniquement des données et des expressions arithmétiques évaluées par notre évaluateur (pas de `eval`, pas de `Function`, pas de HTML : le texte est inséré avec `textContent`).
- Les **images** d'un paquet sont limitées (taille, formats `png/jpeg/webp/svg nettoyé`) et embarquées en base64 dans le paquet.
- La **progression de l'enfant reste sur son appareil** par défaut. Le retour vers un cloud de classe (résultats par élève) est une option distincte, explicite, avec prénom ou pseudo seulement ; à cadrer avec le RGPD (données d'enfants) avant toute écriture de code.
- Signature facultative d'un paquet (empreinte SHA-256 affichée) pour vérifier qu'un fichier reçu est celui que le créateur a publié.

**Identifiants** : `id` d'activité = `<paquet>/<activité>` ; l'historique de progression (`geo_history`) garde le `typeId` ; les activités créées sont préfixées `custom:` pour ne jamais entrer en collision avec les types intégrés.

**Où cela se range dans le code** (les fichiers actuels ne bougent pas) : `src/js/paquets.js` (schéma, validation, `PackSource`, registre), `src/js/gabarits.js` (évaluateur d'expressions, variables, distracteurs, scènes),
`src/js/editeur.js` + `src/css/editeur.css` (IHM), `src/activities/*.json` (les activités intégrées converties). `registerQuizType` reste le point d'entrée : un paquet y enregistre ses activités au chargement.

## 10. Feuille de route proposée (chaque étape se livre et se teste seule)

| Étape | Contenu | Test d'acceptation | Taille |
|---|---|---|---|
| P0 ✔ | Correctifs §8.1 + `audit_check.js` (structure, oracles, anti-régression) | `audit_check.js` | fait |
| P1 ✔ (§50-51 de l'historique : prénoms, objets, mascottes) | **Bibliothèques** `PRENOMS`, `OBJETS`, `LIEUX` + petit moteur de phrase (accord genre/nombre) ; migrer `vie` et `probleme2` (14 gabarits) sans changer leur logique | mêmes oracles ; 0 prénom/objet en dur ; ajout d'un prénom = 1 ligne | 1 séance |
| P2 ◐ (§55 de l'historique : notes Solides/énigmes exactes, `solideNom`, `solideCompte` et `monnaie` lisent le niveau, `QCM_DISPLAY_ORDER` retiré ; **reste** : objet `params` unique et `randomNote` générée, avec P4) | **Objet de niveaux** par type (`params`), `randomNote` **générée** ; retirer `QCM_DISPLAY_ORDER`, corriger les notes ; faire lire `level` aux 12 types qui l'ignorent (au moins `solideNom`, `monnaie`) | audit : plus de note fausse ; `solideNom` Facile = 4 solides simples | 1-2 séances |
| P3 ✔ (§56 de l'historique) | **Graine** (PRNG `mulberry32` injectable) et fin du hasard dans `draw()` | deux `generate` à graine égale = même question ; redessiner = même image | 1 séance |
| P4 ✔ (§57-58 de l'historique : 7 types en fiches ; scène de blocs partagée par `comptage` et `blocs1000`) | **Moteur de gabarits arithmétiques** (`registerTemplateType(fiche)`), migration de 6 types (`calc`, `soustraction`, `doubleMoitie`, `complement`, `tables`, `addition`) ; fusion `comptage`/`blocs1000` | oracles identiques ; mêmes plages mesurées (annexe A) ; code ≈ −400 lignes | 2 séances |
| P5 ◐ (§59 de l'historique : scènes `equation`, `blocks`, `scatter`, `grid`, `emoji`, `numberline` ; **reste** : `clock`, `fraction` et la banque de texte) | Scènes réutilisables (`grid`, `numberline`, `blocks`, `clock`, `fraction`) et banque de texte générique (calendrier, énigmes, unités, durées) | `variete_audit` ≥ avant | 2-3 séances |
| P5b ✔ (§61 de l'historique : `paquets.js`, fournisseur `appareil` en localStorage + import/export `fichier`, activités `fixe` et `gabarit`, `pack_check.js` ; IndexedDB à voir avec les images) | **Paquets et fournisseurs** : schéma `kvb-pack`, validation, registre, fournisseurs `appareil` (IndexedDB) et `fichier` (import/export) ; activités `fixe` (questions écrites à la main) lisibles par le jeu, sans éditeur (on dépose un fichier de test) | `pack_check.js` : installer / activer / mettre à jour / retirer ; refus d'un paquet invalide ; une activité `fixe` se joue comme une activité intégrée | 2 séances |
| P6 ◐ (§62 : `editeur.js`, 3 modèles, aperçu de 20 questions, modifier / supprimer ; reste : vocabulaire par fiche, plus de modèles, audit a11y) | **IHM éditeur** (parent ou enseignant, protégée par code) : choisir un modèle, régler plages/niveaux/vocabulaire, **« Tester 20 questions »** (aperçu avec explication), enregistrer, export/import JSON, activer/désactiver dans les niveaux | `editeur_check.js` ; tests a11y (clavier, contraste) | 3 séances |
| P7 | Fournisseurs `lien` puis `cloud` (code de classe, retour de progression optionnel après cadrage RGPD) | tests de hors-ligne (cache), de conflit de versions | à cadrer |
| P8 | Éditeur de **patrons** (grille de cases) et réglages des écrans propres (Mesurer, Horloge, ateliers) | `net_check.js` étendu | 2 séances |

Points d'attention :
- **Progression** : une activité créée doit déclarer son `domain` (déjà la règle) ; l'historique garde `typeId` : prévoir un préfixe `custom:`.
- **Anti-répétition** : la signature `quizSignature` utilise énoncé + explication + propositions : à conserver.
- **Accessibilité** : l'éditeur doit respecter le RGAA comme le reste (audit axe-core, clavier, contraste).
- **Qualité du contenu adulte** : la fiche est validée (bornes, divisions, bonne réponse unique, 4 propositions distinctes) et l'aperçu montre
  les 20 premières questions avant activation ; l'oracle de l'éditeur est la fiche elle-même (le résultat est calculé, pas saisi).
- **Taille du fichier** : le moteur remplace du code (≈ 700 lignes pour l'arithmétique) : le fichier ne grossit pas.

## 11. Décisions et questions restantes

**Tranché (04/10/2026)**
1. *Qui est l'adulte ?* Parent ou enseignant, **même rôle** : un seul éditeur, un seul code adulte.
2. *Stockage* : sur l'appareil **ou** via un cloud partagé entre élèves ; le jeu reste agnostique grâce aux fournisseurs de paquets (§9.4). On commence hors ligne.
3. *Mascottes dans les problèmes* : oui (kawaii = filles, brainrots = garçons) : **livré** (HISTORIQUE §51).
4. *Questions fixes* : oui, activité de type `fixe` dans les paquets.
5. *Modularité* : tout passe par des paquets JSON validés ; aucune activité créée n'embarque de code.

**À trancher plus tard (après les tests en conditions réelles de la version actuelle)**
- Une activité créée rapporte-t-elle des étoiles et compte-t-elle dans la Progression ? (proposition : oui, dans le thème choisi par le créateur, avec un plafond d'étoiles par jour pour éviter de « farmer » une activité trop facile.)
- Cloud : qui l'héberge, qui paie, quel compte pour le créateur, quelles données d'élèves remontent (RGPD, consentement des parents) ? Alternative sans serveur à évaluer d'abord : un simple dossier partagé / une adresse publique de paquets (fournisseur `lien`).
- L'éditeur vit-il **dans** le jeu (mode adulte protégé par code) ou comme **page séparée** (`editeur.html`, même moteur) ? Séparée = plus simple à protéger des enfants et à utiliser sur ordinateur ; intégrée = un seul fichier.
- Langues : le jeu est en français ; les paquets portent un champ `langue` pour ne pas mélanger.
- Droit d'auteur : un enseignant qui importe des images ou des textes d'un manuel (message d'avertissement dans l'éditeur).

**À observer pendant les tests réels** (utile pour dimensionner l'éditeur) : quelles activités les enfants font le plus / le moins ; où ils se trompent (lecture de l'énoncé ou calcul) ; si les plages de nombres par niveau sont bien ajustées ; si l'écran tient bien sur leurs téléphones (HISTORIQUE §51) ; quelles questions le parent voudrait ajouter en premier (c'est la première liste de gabarits à migrer).

## Annexe A — Mesures par type (47 types × 3 niveaux × 400 questions)
Colonnes : niveaux où le type est présent par défaut (F/M/D) ; plus petit…plus grand nombre lu dans l'énoncé ; plus petite…plus grande bonne réponse numérique ;
nombre de questions différentes (énoncé + explication + réponses écrites). « — » : pas de nombre dans l'énoncé / pas de réponse numérique.
Les pourcentages de répartition de la bonne réponse sont tous entre 20 et 30 % hors types à 2-3 réponses (voir `/tmp/geo_tests/audit_quiz.json` après `node audit_check.js`).

| Type | Thème | Niveaux | Énoncé (min…max) F / M / D | Bonne réponse numérique (min…max) F / M / D | Questions distinctes (texte) F / M / D |
|---|---|---|---|---|---|
| `sides` | formes | FMD | — / — / — | 3…4 / 0…6 / 0…6 | 151 / 228 / 255 |
| `vertices` | formes | FMD | — / — / — | 3…4 / 0…6 / 0…6 | 151 / 230 / 255 |
| `name` | formes | FMD | — / — / — | — / — / — | 60 / 116 / 134 |
| `calc` | calcul | FMD | 0…10 / 0…20 / 0…20 | 0…10 / 0…20 / 0…20 | 325 / 375 / 380 |
| `align` | formes | FMD | 3…3 / 1…4 / 1…4 | — / 1…4 / 1…4 | 217 / 176 / 213 |
| `milieu` | formes | FMD | — / — / 1…5 | — / — / — | 30 / 76 / 231 |
| `coord` | repere | FMD | — / — / — | — / — / — | 216 / 220 / 222 |
| `solideNom` | solides | FMD | — / — / — | — / — / — | 371 / 367 / 350 |
| `monnaie` | calcul | FMD | — / — / — | — / — / — | 343 / 365 / 348 |
| `heure` | temps | FMD | — / — / — | — / — / — | 283 / 326 / 378 |
| `angle` | formes | FMD | — / — / — | 0…4 / 0…4 / 0…4 | 42 / 62 / 75 |
| `image` | formes | MD | — / — / — | 2…12 / 2…12 / 2…12 | 154 / 157 / 153 |
| `coordFind` | repere | MD | 1…5 / 1…5 / 1…5 | — / — / — | 276 / 283 / 270 |
| `codage` | repere | MD | — / — / — | — / — / — | 399 / 399 / 400 |
| `chasse` | formes | MD | — / — / — | 1…6 / 1…6 / 1…6 | 225 / 233 / 221 |
| `solideCompte` | solides | MD | — / — / — | 4…24 / 4…24 / 4…24 | 341 / 361 / 343 |
| `vie` | calcul | MD | 1…20 / 1…20 / 1…20 | 1…30 / 1…30 / 1…25 | 380 / 375 / 376 |
| `decodage` | repere | D | — / — / — | — / — / — | 218 / 213 / 212 |
| `symVrai` | symetrie | D | — / — / — | — / — / — | 10 / 10 / 10 |
| `enigme` | logique | D | 1…12 / 1…12 / 1…12 | — / — / — | 46 / 46 / 46 |
| `suiteFormes` | logique | FMD | — / — / — | — / — / — | 220 / 348 / 372 |
| `mesures` | mesures | FMD | — / — / 1…5 | — / — / 100…5000 | 14 / 196 / 132 |
| `perimetre` | mesures | MD | 1…1 / 2…12 / 2…9 | — / — / — | 221 / 354 / 260 |
| `intrus` | logique | FMD | — / — / — | — / — / — | 24 / 48 / 28 |
| `symVisuel` | symetrie | MD | — / — / — | — / — / — | 1 / 1 / 1 |
| `duree` | temps | FMD | 1…12 / 1…45 / 1…55 | — / — / — | 350 / 400 / 390 |
| `calendrier` | temps | FMD | — / — / 2…6 | — / — / — | 175 / 286 / 366 |
| `horlogeChoix` | temps | FMD | 1…30 / 1…45 / 1…55 | — / — / — | 24 / 48 / 136 |
| `soustraction` | calcul | FMD | 1…10 / 1…20 / 6…60 | 1…9 / 1…18 / 1…51 | 298 / 386 / 399 |
| `doubleMoitie` | calcul | FMD | 1…20 / 1…40 / 1…100 | 1…20 / 1…40 / 1…100 | 331 / 380 / 391 |
| `complement` | calcul | FMD | 1…10 / 1…20 / 5…100 | 1…9 / 1…19 / 5…95 | 138 / 229 / 360 |
| `tables` | calcul | MD | 1…10 / 1…10 / 1…100 | 2…100 / 2…100 / 1…100 | 327 / 348 / 379 |
| `compare` | calcul | FMD | 0…20 / 1…30 / 1…99 | — / — / — | 227 / 370 / 388 |
| `suiteNombres` | logique | MD | — / — / — | 4…50 / 0…59 / 0…140 | 370 / 398 / 399 |
| `numeration` | nombres | FMD | 11…59 / 12…99 / 20…999 | 0…59 / 0…99 / 0…963 | 373 / 386 / 398 |
| `ordre` | nombres | FMD | 3…18 / 3…99 / 3…992 | 1…20 / 1…100 / 4…998 | 378 / 397 / 400 |
| `fraction` | nombres | FMD | — / — / — | — / — / — | 49 / 54 / 127 |
| `comptage` | nombres | FMD | — / — / — | 3…12 / 10…59 / 10…259 | 174 / 388 / 398 |
| `blocs1000` | nombres | MD | — / — / — | 100…999 / 100…499 / 104…997 | 400 / 399 / 400 |
| `lettres` | nombres | FMD | — / — / — | 10…69 / 70…99 / 121…999 | 373 / 369 / 398 |
| `plusMoins` | nombres | FMD | 10…99 / 10…997 / 1…997 | 10…99 / 11…992 / 75…990 | 385 / 398 / 400 |
| `encadrer` | nombres | FMD | 11…99 / 12…999 / 101…997 | — / 10…990 / 100…1000 | 308 / 398 / 395 |
| `droite` | nombres | FMD | — / — / — | 1…9 / 10…180 / 10…900 | 238 / 373 / 386 |
| `addition` | calcul | FMD | 1…89 / 11…88 / 11…896 | 13…99 / 32…99 / 134…998 | 398 / 399 / 400 |
| `soustractionPosee` | calcul | FMD | 1…99 / 11…98 / 12…997 | 10…98 / 5…78 / 10…954 | 399 / 400 / 400 |
| `multiplier` | calcul | FMD | 2…10 / 2…50 / 2…80 | 1…40 / 2…30 / 3…50 | 309 / 380 / 397 |
| `probleme2` | calcul | MD | 2…39 / 2…26 / 2…127 | 1…45 / 1…24 / 1…104 | 399 / 398 / 399 |

## Annexe B — Outils de l'audit
- `node tools/tests/audit_check.js [N]` : structure, oracles, anti-régression (échoue avec « ÉCHEC »), écrit le détail dans `/tmp/geo_tests/audit_quiz.json`.
- `node tools/tests/variete_audit.js` : variété (voir `AUDIT_VARIETE.md`).
- Oracles actuels : addition, soustraction, multiplication, trouve x, complément, table à trou, double, moitié, suivant, précédent, ±10/100, signe < = >,
  « k fois n », conversions m/cm et km/m, chiffre des dizaines/unités/centaines, nombre de dizaines. À étendre à chaque type migré (P4).
