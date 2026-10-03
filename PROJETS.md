# Projets d'avenir

Ce qui reste à faire ou à envisager pour Kawaii vs Brainrot. Le travail déjà fait
est dans `HISTORIQUE.md` ; ce fichier-ci ne liste que l'avenir. Cocher (`[x]`) et dater une
ligne quand elle est faite, puis la reporter dans `HISTORIQUE.md`.

## 1. Référentiels et règles à suivre (en plus du RGAA)

Le RGAA est déjà suivi (audit axe-core `tools/tests/a11y_audit.js`, 0 défaut ; contraste,
clavier et mouvement réduit testés). D'autres recueils peuvent concerner l'appli, du plus au
moins pertinent.

### Probablement concernés

- [ ] **RGPD et recommandations de la CNIL sur les mineurs**
  - Aujourd'hui : la progression (étoiles, personnages, historique) reste sur l'appareil
    (`localStorage`), rien n'est envoyé : c'est le cas le plus simple.
  - Si un jour des données partent ailleurs (comptes, statistiques, suivi par un enseignant) :
    information claire, accord des parents, données réduites au minimum, durée de conservation.
  - À faire dès maintenant : une courte mention « ce que l'appli enregistre, et où » dans
    les Réglages (le bouton « Effacer ma progression » existe déjà).
- [ ] **Droits d'auteur et licences des images** (point à surveiller en priorité avant toute diffusion publique)
  - Polices Google Fonts : licence libre (OFL), pas de souci.
  - Personnages « brainrot » : ils reprennent des personnages d'Internet dont les droits
    sont flous.
  - Dossier `wip/` : images générées par IA (noms `grok-image-…`, `imagine-…`), avec les
    conditions d'utilisation propres à chaque outil.
  - Usage familial : sans enjeu. Diffusion publique : faire l'inventaire des images, noter
    leur origine et leur licence (par exemple dans `assets/MANIFEST.md`), remplacer celles
    dont les droits ne sont pas clairs.
- [ ] **Règles des magasins d'applications** (si l'appli est empaquetée pour Android ou iPhone)
  - Google Play, programme « Familles », et App Store, catégorie « Enfants » : pas de
    publicité ciblée, pas d'outils de mesure d'audience tiers, contrôle parental devant les
    liens sortants et les achats.
  - L'appli est déjà dans l'esprit : aucun achat réel (les étoiles se gagnent), aucun traceur.
  - À prévoir : une politique de confidentialité (même courte) exigée par les deux magasins.

### Utiles comme guides de qualité

- [ ] **RGESN** (Référentiel général d'écoconception de services numériques) : le pendant du
  RGAA pour la sobriété (poids, énergie, vieux appareils).
  - Premier levier : `index.html` pèse 1,25 Mo, surtout à cause des images de personnages
    intégrées en base64 (`src/js/images-data.js`). Pistes : images plus légères (WebP,
    tailles adaptées), chargement seulement quand on en a besoin (Boutique, Bataille).
  - Polices : les embarquer (voir § 3) évite aussi un appel réseau.
  - Vérifier que l'appli reste fluide sur une vieille tablette (animation du pliage des patrons).
- [ ] **Opquast** : recueil français d'environ 240 bonnes pratiques de qualité web, très
  concrètes (contenus, navigation, confidentialité). À parcourir une fois, comme la repasse RGAA.
- [x] **WCAG 2.2 et EN 301 549** : normes internationale et européenne sur lesquelles repose
  le RGAA ; l'audit axe-core les couvre déjà (niveaux A et AA).

### Plutôt pour plus tard, selon la diffusion

- [ ] **Programmes officiels du cycle 2** (Bulletin officiel de l'Éducation nationale) : pas une
  obligation, mais la référence pour aligner le contenu. Utile si l'appli est proposée à des
  enseignants ; `cours.md` pourrait indiquer, pour chaque activité, la compétence du
  programme travaillée.
- [ ] **Environnement numérique de l'Éducation nationale** : une diffusion dans les écoles
  fait entrer dans des cadres propres (connexion via l'ENT, protection des données des élèves).
- [ ] **Directive européenne sur l'accessibilité** (European Accessibility Act, en vigueur
  depuis juin 2025) : elle vise surtout le commerce en ligne, les banques et les livres
  numériques ; une appli éducative gratuite n'y entre a priori pas. À revérifier si l'appli
  devient payante ou vendue.

## 2. Ergonomie

- [ ] **Écrans trop hauts** : la zone de réponse est en bas de l'écran, mais quand le contenu
  dépasse (cas de plus en plus rares), la page défile. À traiter : repérer ces cas (test qui
  mesure la hauteur de chaque activité sur un petit téléphone), puis réduire l'illustration
  ou la consigne.

## 3. Idées en attente (reprises d'`HISTORIQUE.md`)

- [ ] Illustrer les 58 personnages restants (priorité aux défis difficiles).
- [ ] Renard à nœud bleu (deux plein pied sans visage) : à confirmer.
- [ ] Réglage général du décor de l'écran de démarrage (n'existe pas encore).
- [ ] Une appli par thème : le registre des activités est fait (`registerFamily`, chaque thème
  peut être retiré du manifeste) ; reste l'option `--themes` dans `tools/build.py`.
- [ ] Polices Google Fonts chargées depuis Internet : les embarquer pour l'usage hors ligne
  (empaquetage Tauri / Capacitor).
- [ ] Nettoyer `wip/` (11 Mo d'images brutes versionnées).

- [ ] **Boutique en « gatcha »** (idée du 04/10/2026, à étudier après les tests réels) : remplacer l'achat direct
  d'une mascotte par un tirage au sort payé en étoiles (probabilités par rareté) ; **si on tire un doublon, le
  personnage monte de niveau** (réutilise les niveaux d'évolution existants : 0 → 1 → 2 → Ultime, voir `applyEvoLook`,
  `showEvolution`). À décider : prix d'un tirage, probabilités commun/rare/épique/légendaire, « pitié » (garantie
  après N tirages sans nouveauté), que devient un doublon au niveau maximum (étoiles rendues ?), les personnages
  « défi » (non achetables) restent hors tirage, migration des achats déjà faits, équilibrage de la Bataille.

## Raretés, compétences de personnage et gatcha (idées du 04/10/2026 — à valider après les tests réels)

**Règle de rareté à court terme** : un personnage **dessiné en SVG par Claude = commun** ; un personnage **illustré à la main
(image) = rare**. Les raretés épique / légendaire / défi seront redéfinies plus tard (elles ne s'obtiendraient pas par simple
changement d'image). Conséquence : la rareté se déduit du fait d'avoir une image (`CAT_IMAGES`/`BR_IMAGES`), à brancher dans le catalogue
de `boutique.js` ; prix et probabilités du gatcha (voir plus haut) suivent la rareté.

**Compétences (skills)**
- Aujourd'hui, **tous** les personnages ont le BOOST : tous les 3 tours, une carte reçoit un choix « dégâts ×2 » ou « N dégâts fixes »
  (N = double ± 30 %, il faut calculer pour bien choisir). **Ce boost devient la compétence d'un personnage non commun** (rare et plus).
- Un **commun n'a aucune compétence** au départ ; il **gagne une compétence quand il atteint le niveau maximal** (Ultime).
- **Monter de niveau (doublon au gatcha) améliore la compétence** : plus fréquente (tous les 3 tours → 2), plus forte (± 30 % → ± 20 %,
  bonus plus grand), ou plus riche (une option de plus). Niveau maximal d'un commun = débloque *sa* compétence.
- **Idée directrice** : chaque compétence est une **micro-situation de maths** où le calcul juste donne le meilleur résultat, sans punir
  durement l'erreur (l'effet est seulement plus faible). Elle réutilise les générateurs de questions existants (donc les bornes de
  nombres par niveau et, plus tard, les paquets d'activités du §9.4 de `AUDIT_ACTIVITES.md`).

**Variantes pédagogiques proposées** (une compétence = un thème du programme CE1 ; une par personnage, selon son rôle) :
| Compétence | Rôle conseillé | Mécanique | Maths travaillées |
|---|---|---|---|
| **Boost calculé** (existant) | classique | choisir entre ×2 et « N fixes » ; il faut comparer N au double | doubles, comparer, ±30 % |
| **Complément** | archer | une cible affiche « 10 − ? » (puis 20, 100) : le tir fait autant de dégâts que le complément trouvé | compléments à 10/20/100 |
| **Partage** | soutien | « répartis 12 points de soin entre tes 3 cartes » : le soin est maximal si le partage est égal (ou juste demandé) | division, partage équitable |
| **Combo table** | classique | une table (×2, ×5, ×10…) s'affiche : n coups, n étant le résultat choisi parmi 3 propositions | tables de multiplication |
| **Moitié / quart** | classique | « retire la moitié des points de l'ennemi » : l'enfant choisit la bonne moitié parmi 3 valeurs | moitiés, fractions simples |
| **Plus grand, plus petit** | archer | deux nombres : toucher le plus grand pour frapper fort (ou le plus petit pour un tir précis) | comparer, ranger, numération |
| **Miroir** | soutien | compléter une figure symétrique pour renvoyer la moitié des dégâts reçus | symétrie |
| **Arrêt du temps** | soutien | lire l'heure d'une horloge : bonne lecture = l'ennemi passe son tour | lire l'heure, durées |
| **Mesure juste** | archer | estimer une longueur sur une règle : plus c'est proche, plus le tir est précis | mesurer, estimer |
| **Monnaie** | classique | « paie 17 € avec les pièces » : bonus d'étoiles en fin de combat | monnaie, calcul mental |
Amélioration par niveau (exemples) : *Complément* : cibles 10 → 20 → 100 avec bonus croissant ; *Combo table* : tables plus grandes et
coups en plus ; *Arrêt du temps* : heures pile → quarts → minutes ; *Partage* : 2 → 3 → 4 cartes.

**À décider avant de coder** : qui a quelle compétence (une liste par personnage, ou par rôle, ou tirée à la création) ; si une compétence
déjà débloquée peut être changée ; équilibrage de la Bataille (les communs sans compétence sont plus faibles : compenser par un meilleur
prix ou plus de points de base) ; migration des personnages déjà possédés (tous avaient le boost) ; interface (le panneau BOOST actuel
`#bt-boost` devient un panneau « compétence » générique) ; test `skills_check.js` (une compétence par type, bonnes réponses = effet plein, mauvaises = effet réduit, jamais de blocage).

## Éditeur d'activités pour adulte
Voir `AUDIT_ACTIVITES.md` (§9 modèle et paquets modulaires, §10 feuille de route P1–P8, §11 décisions). En pause volontaire : on teste d'abord la version actuelle en conditions réelles.
