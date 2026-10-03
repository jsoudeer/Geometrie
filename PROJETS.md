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


## Éditeur d'activités pour adulte
Voir `AUDIT_ACTIVITES.md` (§9 modèle et paquets modulaires, §10 feuille de route P1–P8, §11 décisions). En pause volontaire : on teste d'abord la version actuelle en conditions réelles.
