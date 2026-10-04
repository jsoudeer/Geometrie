# Démarrage de session (à lire en premier, ne pas relire tout le code)

Jeu de maths CE1 (nombres, calcul, géométrie, mesures, temps) « Kawaii vs Brainrot » (anciennement Géo Miaou vs GEO CHAOS 9000) : HTML5 + CSS + JS pur, sans bibliothèque,
un seul fichier `index.html` **généré**. L'utilisateur parle français, n'est pas développeur, et demande
des évolutions de façon itérative. Toute réponse à l'utilisateur est en français, courte : résultat + une
suggestion de suite.

## Où trouver l'information (dans cet ordre)
1. `src/README.md` : organisation des fichiers, ordre de chargement, comment ajouter une activité.
2. `HISTORIQUE.md` : ce qui a été fait, section par section (dernière section = dernier état).
3. `PROJETS.md` : ce qui reste à faire. `AUDIT_VARIETE.md` : faiblesses de variété des activités.
4. `cours.md` : explication du jeu destinée à l'enfant/parent (à tenir à jour pour toute règle visible).
Ne lire un fichier de `src/js/` qu'au besoin, avec Grep sur le nom de fonction cité dans `HISTORIQUE.md`.

## Règles du dépôt
- **Ne jamais modifier `index.html` à la main** : modifier `src/`, puis `python3 tools/build.py` ; `--check` doit passer.
- Une activité arithmétique simple = une fiche (`registerTemplateType`, `fiches-calcul.js`, `fiches-nombres.js` ou, pour l'heure, `horloge.js`, voir `src/README.md`). Sinon `registerQuizType` (QCM) ou `registerFamily` (écran propre, voir `atelier.js` ; elles passent par
  le déroulé commun `makeQuestionFlow` : 3 essais, solution montrée, série).
- Les `var` d'un JS ne sont pas remontées : l'ordre dans `src/manifest.json` compte.
- Aucun legacy : si une activité est remplacée, supprimer l'ancienne (code, tests, notes, listes).

## Test (Playwright, `tools/tests/`)
- `cd tools/tests && node <nom>_check.js` (page de test `index_test.html`, `window.__t.__eval` donne accès aux variables).
- Avant de valider : lancer les tests du sujet touché + `uniform_check`, `progress_check`, `avance_check`,
  `fresh_check`, `atelier_check`, `atelier2_check`, `challenge_check`, `nav_check`, `audit_check` (47 types × 3 niveaux), `fit_check` (tout tient dans un écran de téléphone), `vocabulaire_check` (+ `skills_check`, `competences_check` pour la Bataille/compétences, `niveaux_check` pour les niveaux Solides/Monnaie, `seed_check` pour le hasard, `gabarits_check` + `nombres_check` + `formes_check` pour les fiches d'activités, `pack_check` pour les paquets d'activités, `patron_check` pour les patrons dessinés ; `a11y_audit` (axe-core, voir son en-tête) quand un écran ou un formulaire change). Les « ✘ » affichés sont souvent des
  messages d'erreur voulus du jeu : se fier à « ÉCHEC »/« AssertionError »/« PAGE ERRORS ».
- Un test instable est un défaut à corriger tout de suite (ex. attendre la fin des animations avant de mesurer).
- `lib.js` marque les guides (tutoriels) comme déjà vus : sinon ils voileraient l'écran ; `withPage({guides:true})` pour les tester.
- Tout nouveau comportement reçoit un `*_check.js`. Captures dans `/tmp/geo_tests/`.

## Déroulé d'une évolution
1. Implémenter dans `src/`, `python3 tools/build.py`.
2. Tester (ci-dessus), regarder les captures pour tout changement visuel.
3. Documenter : `HISTORIQUE.md` (nouvelle section numérotée), `cours.md` si visible, `src/README.md` si fichier/API.
4. Brancher, committer, fusionner dans `main` (`--no-ff`), `build.py --check`, `git push origin main <branche>`.
   `git fetch` avant de fusionner : l'utilisateur peut avoir poussé depuis une autre session.
   Ne pas faire de `git stash` pendant une fusion en cours (cela perd MERGE_HEAD).
5. Republier l'artefact (outil Artifact, fichier `index.html`, URL de l'artefact du projet ; ne pas coller l'URL).
   L'adresse du dépôt a changé : `https://github.com/jsoudeer/Geometrie.git` (l'ancienne redirige, avec un avertissement).
6. Terminer : `git status` propre, branche locale alignée sur `main`.

## Conventions de contenu
- Niveaux : 0 Facile, 1 Moyen, 2 Difficile ; `globalLevel`. Séries sans faute : `STREAK_GOALS=[20,25,30]` (orchestrateur.js) ↔ défis d'index `12 + palier` (Facile/Moyen/Difficile), quel que soit le niveau joué ; chaleur Overload : `chaleur.js` (15/20/25).
- Historique de progression : `progression.js` (clé `geo_history`, 3000 réponses). Un seul découpage en thèmes : `DOMAINS` (noyau.js). Toute activité
  (`registerFamily`) et tout type de quiz (`registerQuizType`) déclare son `domain` ; il sert au mode Manuel, aux réglages,
  à la Progression (compétences) et aux sujets faibles : rien d'autre à déclarer.
- Hasard des questions : toujours `rnd()`/`pick`/`rand`/`randInt`/`shuffle` (jamais `Math.random()` dans un fichier de questions) ; `withSeed(graine, fn)` le rend reproductible ; le dessin (`draw`) ne tire rien : tout est tiré dans `generate`.
- Variété : tirage sans remise (`pickFresh`, `pickFamilyFresh`) ; mesurer avec `tools/tests/variete_audit.js`.
- Pas de texte « Facile/Moyen/Difficile » qui contredit le code : les notes de réglage (`note`, `randomNote`) décrivent
  ce que fait réellement chaque niveau, à tenir à jour.
