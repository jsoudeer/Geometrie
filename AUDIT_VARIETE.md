# Audit de variété des activités (01/10/2026)

Mesure faite par `tools/tests/variete_audit.js` : pour chaque type de Quizz et chaque niveau, 300 questions sont
générées ; on compte les questions différentes (énoncé + explication + dessin + propositions) et les réponses
justes différentes. Les chiffres « questions » incluent des variations purement visuelles (couleurs, formes) ;
la colonne « réponses » est la vraie mesure de variété de fond.

## Déjà traité dans cette session
| Activité | Avant | Après |
|---|---|---|
| Milieu | toujours 3 formes, toujours une au milieu (5 réponses) | 3 ou 5 formes, ou 2 ou 4 formes → « Aucune forme » ; segment de longueur variable ; variante « coordonnées du milieu de [AB] » (horizontal, vertical, diagonal) |
| Déformer | 3 formes cibles, 4 coins | + triangle isocèle, triangle rectangle (3 coins) ; le départ n'est jamais déjà réussi |
| Axe de symétrie | QCM à 3 droites, toujours un triangle isocèle | Atelier « Axes de symétrie » : on touche les vrais axes (0 à 4), le pliage montre les cases sans jumelle |
| Symétrie vrai/faux | rectangle seul | rectangle, carré (diagonales vraies), triangle isocèle, cercle |
| Ateliers | symétrie, fractions, reproduire | + « Trouver l'erreur » (case en trop / manquante) |

## Faiblesses restantes (par ordre d'intérêt)
| Activité | Questions distinctes (F/M/D) | Réponses distinctes | Constat | Piste |
|---|---|---|---|---|
| Alignement (`align`) | ~265 | 2 | Un seul concept (3 points, oui/non) | 4 ou 5 points : « lesquels sont alignés ? », « où placer le 3e point pour aligner ? », lignes en diagonale |
| Angles (`angle`) | ~90-100 | 3 | droit / aigu / obtus seulement | comparer deux angles, « combien d'angles droits dans la figure ? », angle de l'équerre |
| Nommer une forme (`name`) | 300 mais surtout visuel | 3-7 | Peu de formes différentes | + quadrilatères (parallélogramme, trapèze), orientations, formes « pièges » |
| Côtés / sommets (`sides`, `vertices`) | 300 (visuel) | 2-5 | Compter sur des polygones réguliers | polygones irréguliers, formes composées, « combien de côtés au total ? » |
| Énigme (`enigme`) | 46 | 19 | Réserve très limitée, se répète vite | générateur d'énigmes à partir de propriétés (côtés, angles, symétrie) |
| Mesures (`mesures`) niveau Facile | 14 | 4 | Quasi aucun tirage possible | élargir les longueurs et les points de départ |
| Suite de formes (`suiteFormes`) niveau Facile | ~190 | 6 | Motifs courts | motifs AAB, ABC, croissants, rotation |
| Choix d'horloge (`horlogeChoix`) Facile/Moyen | 24 / 48 | 4 | Peu d'horaires | demi-heures, quarts, « et demie » |
| Fractions (atelier + quizz) | ~90 | 4-25 | Peu de fractions et un seul support | rectangle quadrillé, fractions d'une collection (3/4 de 8 billes) |
| Symétrie visuelle (`symVisuel`) | non mesurable ici | — | Le dessin se redessine hors de l'écran du Quizz | audit dédié à faire |
| Coordonnées (`coord`) | ~185 | 25 | Grille 5×5 uniquement | grille plus grande à Difficile, points négatifs plus tard |
