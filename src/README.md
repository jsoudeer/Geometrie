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
  css/                  base, exercices, interface (mascotte, effets…), boutique-bataille
  js/
    noyau.js            outils partagés (el, shuffle, pick, rand…), thème, sons, effets,
                        mascotte, registre des types de Quizz
    geometrie.js        Mesurer, Déformer + questions de Quizz de géométrie
    horloge.js          Lire l'heure, Régler l'heure + questions « Lire l'heure » et « Durées »
    calcul.js           Calcul, Monnaie, Maths de la vie, arithmétique élargie, suites de nombres
    atelier.js          activités interactives (on touche) : symétrie, fractions, modèle à copier
    patron3d.js         Patron → Solide (3D) + questions sur les solides
    orchestrateur.js    moteur du Quizz, niveaux, chrono, séries, configuration des activités
    images-data.js      images des personnages en base64 (GÉNÉRÉ par tools/embed.py)
    boutique.js         personnages, défis, boutique, mascotte
    bataille.js         combat de cartes
    progression.js      historique des réponses, radar, détail, sujets à travailler
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
  category: 'calcul',                    // sous-catégorie (voir QCM_CATEGORIES dans noyau.js)
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

## Ajouter une activité interactive (écran propre)

Voir `src/js/atelier.js` : `registerFamily({ key, tag, theme, note, build(wrap), generate(level), signature() })`.
Elle est ajoutée automatiquement au tirage, au mode Manuel (dans le thème `theme`), au panneau
« Activités & difficulté » et à l'anti-répétition. `makeAtelier()` fournit l'écran commun
(consigne, dessin tactile, retour, boutons Vérifier / Nouvelle activité).

## Ce qui n'est pas encore modulaire

Les activités qui ont leur **propre écran** (Mesurer, Déformer, Patron → Solide, Lire
l'heure, Régler l'heure) restent câblées en dur dans `orchestrateur.js` (listes de
familles, niveaux, panneaux `fam-*` de la page). Retirer `horloge.js` ou `patron3d.js`
du manifeste casse donc l'appli, alors que retirer `calcul.js` fonctionne. Pour pouvoir
publier une appli par thème, il reste à migrer ces familles vers `registerFamily` (déjà utilisé par les ateliers).

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
