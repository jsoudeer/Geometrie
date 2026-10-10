# Valeur des personnages : constat et propositions (à décider, 10/10/2026)

Rien n'est encore codé. Ce document sert à choisir. Objectifs : un **plus grand sentiment de progression** et des moyens de
**faire monter le niveau de son équipe** (en particulier pour l'Aventure : 30 ❤️ au niveau 1, +3 par victoire).

## 1. Aujourd'hui (mesuré dans le jeu)

| Rareté | Combien (par clan) | Points de base | Après 2 évolutions (Ultime) | Prix d'achat | Prix d'une évolution |
|---|---|---|---|---|---|
| Commun | Kawaii 1, Brainrots 13 | 5 à 7 | 9 à 11 | 10 ⭐ | 10 ⭐ |
| Rare | Kawaii 19, Brainrots 7 | 9 à 11 | 13 à 15 | 20 ⭐ | 20 ⭐ |
| Défi | 15 | 8 à 17 | 12 à 23 | (défi) | 12 ⭐ |

- Une évolution = +20 % des points de base, **au moins +2** : en pratique +2 par évolution pour presque tout le monde.
- Gains d'étoiles : 1 ⭐ par bonne réponse, 3 ⭐ par victoire en bataille, bonus de chrono.
- Équipe type (5 cartes) : ≈ 45-55 ❤️ au début, ≈ 70-90 ❤️ toute en Ultime ; 6-7 cartes : jusqu'à ≈ 110-130 ❤️.

**Ce qui coince**
1. **Écarts minuscules** : un commun Ultime (11) vaut un rare de base (11) ; une évolution à 20 ⭐ ne donne que +2. L'enfant
   dépense beaucoup pour un changement presque invisible.
2. **Pas de progression entre deux achats** : jouer des combats ne fait rien gagner à la carte elle-même.
3. **Aventure** : à +3 par victoire, une équipe Ultime à 7 cartes (≈ 130) est dépassée vers le niveau 34 ; une équipe de
   départ (≈ 50) dès le niveau 7. Il manque des paliers intermédiaires pour « rattraper ».

## 2. Propositions (combinables)

### A. Agrandir l'échelle et creuser les écarts (recommandé)
Des nombres plus grands donnent l'impression de progresser, et restent dans le programme du CE1 (nombres jusqu'à 1 000,
additions et comparaisons).

| Rareté | Base | Évolué (×1,4) | Ultime (×2) |
|---|---|---|---|
| Commun | 10 à 14 | 14 à 20 | 20 à 28 |
| Rare | 18 à 22 | 25 à 31 | 36 à 44 |
| Défi | 20 à 34 | 28 à 48 | 40 à 68 |

- Une évolution devient **visible** (+40 %, puis encore +43 %) : un commun Ultime dépasse un rare de base, ce qui
  récompense l'attachement à une carte.
- Soutien : +5 à l'arrivée et +2 par tour → à passer à **+10 / +4** (même proportion).
- Les compétences (×2, ×2,5) et le « Doubler ou fixe » gardent leurs règles ; les calculs deviennent un peu plus durs
  (ex. 22 × 2) : c'est l'occasion de travailler les doubles jusqu'à 50.
- Aventure à recaler sur la même échelle : **60 ❤️ au niveau 1, +6 par victoire**.

### B. Expérience des cartes (progression continue)
- Chaque carte qui **participe à une victoire** gagne 1 point d'expérience ; tous les 3 points : **+1 ❤️** (plafonné, ex.
  +10 par rareté). Affiché sur la carte : « ✨ 4/6 ».
- Avantage : l'enfant voit ses cartes préférées grandir **sans dépenser** ; ça pousse à varier l'équipe (les cartes qui
  ne jouent pas ne progressent pas).
- Coût : une sauvegarde de plus par carte (`geo_xp_cats` / `_brainrot`), à remettre à zéro avec la progression.

### C. Évolutions plus lisibles
- Prix d'une évolution = **prix d'achat** (inchangé) mais **Ultime = 2 × ce prix** : l'Ultime devient un vrai objectif.
- Afficher avant d'acheter : « ❤️ 20 → 28 » (au lieu de « +2 »).

### D. Aventure : paliers de rattrapage
- Tous les 10 niveaux (combat de palier 👑), une **récompense** : 15 ⭐, ou une **évolution offerte** sur une carte de
  l'équipe. Ça relance l'équipe juste avant que la difficulté ne la rattrape.
- Option : afficher la **puissance d'équipe** (somme des ❤️) face à celle des adversaires sur l'écran de préparation,
  avec une jauge « 💪 Ton équipe peut gagner / 😬 Serré / 🏋️ Trop fort pour l'instant ».

### E. Économie d'étoiles (à recaler si A est retenu)
- Garder les prix actuels (10 / 20 ⭐) : seule la valeur des cartes change, pas l'effort pour les obtenir.
- Repère à vérifier par simulation (`tools/tests/sim.js`) : une équipe de départ complète (5 cartes) en ≈ 60-80 bonnes
  réponses ; une première Ultime en ≈ 40 bonnes réponses de plus.

## 3. Ce qu'il faudrait faire (une fois le choix fait)
1. Valeurs : `RARITY_META` (pts), `evoGain` / `spritePts` (boutique.js), points des défis (`mkReward`), soutien
   (`BT_SUPPORT_BONUS`, `BT_SUPPORT_TURN`), Aventure (`BT_ADV_BASE`, `BT_ADV_STEP`).
2. Pas de migration de sauvegarde : les points se calculent depuis la rareté et l'évolution (l'enfant garde ses cartes et
   ses évolutions). Le niveau d'Aventure atteint reste valable (la cible est recalculée).
3. Tests à adapter : `competences_check`, `skills_check`, `bataille_diff_check`, `aventure_check`, `bataille_ia_check`,
   `kawaii_check` ; simulation d'équilibre (`sim.js`).
4. `cours.md` (tableau des raretés, évolutions, soutien, Aventure).

**Recommandation** : A + C tout de suite (le plus visible pour l'enfant), puis D (récompenses de palier), puis B si l'on veut
une progression continue.
