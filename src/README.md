# Sources de l'application (`src/`)

`index.html` (à la racine) est un fichier **généré** : ne pas le modifier à la main.
On modifie les fichiers de `src/`, puis on reconstruit :

```
python3 tools/build.py           # écrit index.html
python3 tools/build.py --check   # vérifie que index.html est à jour
```

L'ordre d'assemblage est dans `src/manifest.json`. Tout le JS tient dans une seule
fonction : une fonction peut être appelée avant sa définition, pas une variable `var`.
C'est pourquoi l'ordre des fichiers JS compte (voir ci-dessous).

## Organisation

```
src/
  index.template.html   structure de la page (les lignes @@CSS@@ et @@JS@@ sont remplacées)
  manifest.json         liste ordonnée des fichiers CSS et JS
  css/                  base, exercices, interface (mascotte, effets…), boutique-bataille, evolution (cadres, halo et particules d'évolution), admiration (admirer, cérémonie), bataille-fx (effets sonores, boost), guide, chaleur
  js/
    noyau.js            outils partagés (el, shuffle, pick, rand…), thème, sons, effets,
                        mascotte, registre des types de Quizz
    geometrie.js        Mesurer, Déformer + questions de Quizz de géométrie
    horloge.js          Lire l'heure, Régler l'heure + questions « Lire l'heure » et « Durées »
    vocabulaire.js      bibliothèques PRENOMS / OBJETS / ARTICLES / COULEURS et accords (`phrase`, `accords`) : à utiliser pour tout problème à histoire
    calcul.js           Calcul, Monnaie, Maths de la vie, arithmétique élargie, suites de nombres
    nombres.js          nombres jusqu'à 1000 (blocs, lettres, ±10/100, encadrer, droite graduée) et calcul écrit (additions/soustractions posées, multiplier)
    atelier.js          activités interactives (on touche) : symétrie, fractions, modèle à copier, trouver l'erreur, axes de symétrie
    patron3d.js         Patron → Solide (3D) + questions sur les solides
    orchestrateur.js    moteur du Quizz, niveaux, chrono, séries, configuration des activités
    images-data.js      images des personnages en base64 (GÉNÉRÉ par tools/embed.py)
                        (chargé EN PREMIER : définit CUSTOM_IMG et SPLASH_IMG, lus par noyau.js)
    boutique.js         personnages, évolutions (spritePts, tryEvolve, applyEvoLook), défis, boutique, mascotte
    admiration.js       showAdmire (portrait en grand, inclinaison, particules), showEvolution (cérémonie), sons et particules partagés (fxBurst, fxAmbient)
    bataille.js         combat de cartes (effets sonores btSfx, boost, vitesse BT_SPEED)
    progression.js      historique des réponses, radar, détail, sujets à travailler, tirage du mode Révision (`progReviewPick`)
    guide.js            tutoriels en surbrillance (accueil, boutique, bataille, série) + Réglages → Guides
    chaleur.js          effet « heat » Overload (15/20/25 d'affilée) par clan, + css/chaleur.css
```

Les fichiers de thèmes (`geometrie`, `horloge`, `calcul`, `patron3d`) sont chargés **avant**
`orchestrateur.js`, car ils déclarent leurs types de Quizz au chargement.

## Ajouter des questions à un thème existant

Écrire une fonction qui renvoie une question, puis la déclarer à la fin du fichier du thème :

```js
function genMaQuestion(level){          // level : 0 Facile, 1 Moyen, 2 Difficile
  return {
    tag: 'Calcul',                       // petit titre affiché
    question: 'Combien font 3 + 4 ?',
    sub: 'Calcule le résultat.',         // consigne sous la question
    explain: '3 + 4 = 7.',               // explication après la réponse
    draw: function(){ drawEquation('3 + 4 = ?'); },   // dessine l'illustration (#m4Svg)
    cols3: false,                        // true = 3 boutons de réponse par ligne
    choices: [ { label:'7', ok:true }, { label:'6', ok:false }, { label:'8', ok:false } ]
  };
}
registerQuizType({
  id: 'maQuestion',                      // identifiant unique
  domain: 'calcul',                      // thème (voir DOMAINS dans noyau.js : formes, symetrie, repere, solides, temps, mesures, nombres, calcul, logique)
  label: 'Ma question',                  // nom court (panneau de configuration)
  longLabel: 'Ma question, en détail',   // nom dans la liste du mode Manuel
  defaultLevels: [0,1,2],                // niveaux où elle apparaît par défaut
  randomNote: 'Ce qui est tiré au hasard…',
  generate: genMaQuestion
});
```

Une réponse peut être un **dessin** : `{ label:'Horloge 1', ok:true, viewBox:'0 0 200 200', draw:function(svg){ … } }`
(le libellé ne sert qu'à l'accessibilité).

Elle apparaît alors toute seule dans le Quizz, le mode Manuel et « Configurer les
activités ». Les paramètres propres à un niveau vivent dans le thème (`GEO_LEVELS`,
`CALC_LEVELS`).

## Ajouter un nouveau thème (arithmétique, géographie…)

1. Créer `src/js/mon-theme.js` avec ses questions et ses `registerQuizType(...)`.
2. L'ajouter dans `src/manifest.json`, **avant** `js/orchestrateur.js`.
3. `python3 tools/build.py`, puis vérifier avec les tests (`tools/tests/`).

Un type déjà connu n'a pas besoin d'être ajouté à `QCM_DISPLAY_ORDER` : les nouveaux
types s'affichent à la suite des existants.

## Règle commune pour corriger une réponse

Toutes les activités corrigent avec `makeQuestionFlow` (`noyau.js`), jamais à la main :

```js
var flow = makeQuestionFlow({ feedback:'mon-feedback', tries:1 });   // QCM : 1 ; manipulation : MANIP_TRIES (3)
flow.start();                                   // à chaque nouvelle question
flow.answer(ok, html, lastHtml);                // renvoie 'solved', 'retry' ou 'failed'
flow.skip();                                    // bouton « Nouvelle activité »
flow.clearHint();                               // l'enfant recommence à manipuler après un raté
```

Le flux gère seul le retour, le son, les effets, la mascotte, l'étoile, la série sans faute,
l'historique, et masque la rangée `.btn-row` qui suit le retour quand la question se ferme
(réussite, ou dernier essai raté : c'est alors à l'activité d'afficher la solution si
`answer` renvoie `'failed'`). Toucher le retour d'une question fermée = question suivante.
« Nouvelle activité » est neutre avant tout essai, et compte comme une erreur après un raté.
La question se met dans la bulle `.coach-bubble`, la consigne dans le `.muted` en dessous.
`tools/tests/uniform_check.js` vérifie ces règles pour chaque activité.

## Ajouter une activité à écran propre

Toutes les activités (Mesurer, Déformer, Patron, Quizz, Horloge, ateliers) sont déclarées
par leur thème avec `registerFamily` (contrat complet en tête du registre, dans `noyau.js`) :

```js
registerFamily({
  key:'mon-activite', tag:'Mon activité', domain:'formes',   // thème : id de DOMAINS
  order:70,               // rang d'affichage et de tirage
  weight:1,               // places dans le tirage aléatoire (le Quizz en a 3)
  timed:false,            // true : aussi en Chronométré (réponse en un toucher)
  note:'Ce que change le niveau…',            // panneau « Activités & difficulté »
  markup:'<div class="coach-row">…</div>…',   // ou build:function(wrap){ … }
  generate:function(level){ … },
  signature:function(){ return '…'; }         // anti-répétition
});
```

Le conteneur `#fam-mon-activite` existe dès le retour de `registerFamily` : on peut ensuite
brancher ses boutons par leur id. L'activité apparaît alors seule dans le tirage, le
Chronométré (si `timed`), le mode Manuel (sous son `domain`), le panneau de réglages et
l'anti-répétition. Pour des épreuves réglables niveau par niveau (comme les types du Quizz
ou les patrons), ajouter `config:{ storageKey, defs(), groups()?, rebuild(overrides) }`.
`makeAtelier()` (`atelier.js`) fournit un écran tout prêt pour une activité où l'on touche
des cases (question, consigne, dessin tactile, retour, Vérifier / Nouvelle activité).

## Mise en page d'une activité : la zone de réponse est toujours en bas

`registerFamily` range automatiquement, en bas de l'écran et dans cet ordre, les réponses à
choisir (`.choices` / `.qcm-choices`), le retour (`.feedback`) et les boutons (`.btn-row`) :
c'est la `.q-bottom`. Tout le reste (question, consigne, illustration) reste en haut. Une
nouvelle activité n'a rien à faire de plus : il suffit que ces éléments soient au premier
niveau de son écran. Dans la rangée, « Nouvelle activité » (id en `-next` ou `-new`) est placée à gauche et
« Vérifier » à sa droite. `uniform_check.js` vérifie que les boutons sont au même endroit partout.

## Retirer un thème

L'orchestrateur ne nomme aucune activité : retirer `horloge.js`, `patron3d.js`,
`calcul.js`, `atelier.js` ou `geometrie.js` du manifeste retire simplement ses activités
et ses questions de Quizz. Les outils de dessin utilisés par plusieurs thèmes (`palette`,
`isoPoly`, `ngonPoints`, `drawEquation`, `svgText`…) vivent dans `noyau.js`.
`tools/tests/theme_removal_check.js` le vérifie pour chaque thème.

## Ajouter un patron (Patron → Solide)

Dans `src/js/patron3d.js`, ajouter une ligne à `NET_DEFS` avec `netDef(id, groupe, nom, niveaux, polygones, { solid })`.
Les polygones se fabriquent avec `gridPolys('.X../XXXX/.X..')` (carrés ou rectangles, `/` = ligne suivante),
`pyramidPolys`, `prismPolys` ou `tetraPolys`. Les charnières, l'ordre de pliage, les angles et la
bonne réponse (solide ou « Aucun solide ») sont calculés : `node tools/tests/net_check.js` vérifie que
chaque patron du groupe `piege` ne se referme pas, et que tous les autres se referment.

## Accessibilité

`node tools/tests/a11y_audit.js` passe axe-core (WCAG 2.2 A/AA, équivalent RGAA) sur tous les écrans dans
les deux clans (installer d'abord `cd tools/tests && npm install --no-save axe-core@4`) ;
`contrast_audit.js` et `keyboard_check.js` complètent ce qu'un outil automatique ne voit pas.

## Vérifier qu'une modification ne casse rien

```
cd tools/tests
node golden.js record /tmp/avant.json     # à faire AVANT de modifier
# … modifier, reconstruire …
node golden.js record /tmp/apres.json
node golden.js diff /tmp/avant.json /tmp/apres.json
```

`golden.js` compare, avec un hasard fixe, les questions de tous les exercices, les
panneaux de réglages et les captures d'écran des deux thèmes. Pour une réorganisation
sans changement de comportement, le résultat doit être « IDENTIQUE ». Une modification
voulue (nouvelle question, texte changé) fait apparaître des différences : les relire.
