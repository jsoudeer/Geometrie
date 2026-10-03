// ===================== Bibliothèques de vocabulaire =====================
// Prénoms, objets, articles et couleurs utilisés par les problèmes écrits
// (`vie`, `probleme2`). Ajouter un élément = une ligne dans la liste ; les accords
// (il/elle, un/une, pluriel, chacun/chacune) se font par les fonctions ci-dessous,
// jamais à la main dans une phrase.
// Chargé après noyau.js (pickFresh, shuffle, pick).

// Prénoms d'enfants. f:true = fille (accord : elle). Un prénom ne doit pas commencer par une voyelle
// seulement si une phrase élide devant lui (« d'Emma ») : aucune ne le fait aujourd'hui.
var PRENOMS = [
  {nom:'Léa',f:true},   {nom:'Tom',f:false},  {nom:'Léo',f:false},   {nom:'Nina',f:true},
  {nom:'Maya',f:true},  {nom:'Emma',f:true},  {nom:'Lucas',f:false}, {nom:'Jade',f:true},
  {nom:'Hugo',f:false}, {nom:'Inès',f:true},  {nom:'Noah',f:false},  {nom:'Zoé',f:true},
  {nom:'Adam',f:false}, {nom:'Lina',f:true}
];

// Objets qu'on compte. genre : 'm' | 'f'. groupe : 'jeu' (paquets de…), 'gourmand' (boîtes de…), 'fruit'.
var OBJETS = [
  {sing:'bille',   plur:'billes',   genre:'f', icon:'🔵', groupe:'jeu'},
  {sing:'carte',   plur:'cartes',   genre:'f', icon:'🃏', groupe:'jeu'},
  {sing:'jeton',   plur:'jetons',   genre:'m', icon:'🪙', groupe:'jeu'},
  {sing:'sticker', plur:'stickers', genre:'m', icon:'⭐', groupe:'jeu'},
  {sing:'gâteau',  plur:'gâteaux',  genre:'m', icon:'🍪', groupe:'gourmand'},
  {sing:'bonbon',  plur:'bonbons',  genre:'m', icon:'🍬', groupe:'gourmand'},
  {sing:'chocolat',plur:'chocolats',genre:'m', icon:'🍫', groupe:'gourmand'},
  {sing:'muffin',  plur:'muffins',  genre:'m', icon:'🧁', groupe:'gourmand'},
  {sing:'pomme',   plur:'pommes',   genre:'f', icon:'🍎', groupe:'fruit'},
  {sing:'poire',   plur:'poires',   genre:'f', icon:'🍐', groupe:'fruit'},
  {sing:'orange',  plur:'oranges',  genre:'f', icon:'🍊', groupe:'fruit'},
  {sing:'banane',  plur:'bananes',  genre:'f', icon:'🍌', groupe:'fruit'},
  {sing:'fraise',  plur:'fraises',  genre:'f', icon:'🍓', groupe:'fruit'},
  {sing:'kiwi',    plur:'kiwis',    genre:'m', icon:'🥝', groupe:'fruit'}
];

// Choses qu'on achète (avec un prix).
var ARTICLES = [
  {sing:'livre',   plur:'livres',   genre:'m'}, {sing:'stylo',   plur:'stylos',   genre:'m'},
  {sing:'cahier',  plur:'cahiers',  genre:'m'}, {sing:'jouet',   plur:'jouets',   genre:'m'},
  {sing:'puzzle',  plur:'puzzles',  genre:'m'}, {sing:'gomme',   plur:'gommes',   genre:'f'},
  {sing:'règle',   plur:'règles',   genre:'f'}, {sing:'trousse', plur:'trousses', genre:'f'},
  {sing:'balle',   plur:'balles',   genre:'f'}, {sing:'peluche', plur:'peluches', genre:'f'}
];

// Couleurs au singulier, par genre de l'objet décrit (le pluriel s'obtient avec un « s »).
var COULEURS = [
  {m:'rouge',f:'rouge'}, {m:'bleu',f:'bleue'}, {m:'vert',f:'verte'}, {m:'jaune',f:'jaune'}
];

// Les mascottes du jeu jouent aussi dans les problèmes : les kawaii sont des filles, les brainrots des garçons.
// (lues dans la boutique à l'appel : le catalogue est défini après ce fichier)
function mascottes(){
  var l = [];
  CAT_SPRITES.forEach(function(sp){ l.push({nom:sp.name, f:true, mascotte:true}); });
  BRAINROT_SPRITES.forEach(function(sp){ l.push({nom:sp.name, f:false, mascotte:true}); });
  return l;
}
function toutesLesPersonnes(){ return PRENOMS.concat(mascottes()); }
// Une fois sur deux un prénom d'enfant, une fois sur deux une mascotte (chaque liste sans remise).
function prenomAuHasard(){
  return Math.random() < 0.5 ? pickFresh('prenom', PRENOMS) : pickFresh('mascotte', mascottes());
}
function objetAuHasard(groupe){
  var l = OBJETS.filter(function(o){ return o.groupe===groupe; });
  return pickFresh('objet|' + groupe, l);
}
function articleAuHasard(){ return pickFresh('article', ARTICLES); }
// Deux éléments différents d'une liste.
function deuxDifferents(liste){ return shuffle(liste.slice()).slice(0,2); }

// « un livre », « une gomme »
function unArticle(a){ return (a.genre==='f' ? 'une ' : 'un ') + a.sing; }
// « 1 bille », « 5 billes »
function nbObjet(n, o){ return n + ' ' + (n>1 ? o.plur : o.sing); }
// « 1 bille rouge », « 5 billes rouges »
function nbObjetCouleur(n, o, c){ return nbObjet(n, o) + ' ' + c[o.genre] + (n>1 ? 's' : ''); }

// Variables d'accord d'un prénom et d'un objet, utilisables dans phrase() :
//  {nom} {il} {Il} {at} (a-t-il / a-t-elle)
//  {obj} (pluriel) {sing} {seuls} (tout seuls / toutes seules) {chacun} (chacun / chacune)
function accords(prenom, objet){
  var v = {};
  if(prenom){
    v.nom = prenom.nom; v.il = prenom.f ? 'elle' : 'il'; v.Il = prenom.f ? 'Elle' : 'Il';
    v.at = 'a-t-' + v.il;
  }
  if(objet){
    v.obj = objet.plur; v.sing = objet.sing;
    v.seuls = objet.genre==='f' ? 'toutes seules' : 'tout seuls';
    v.chacun = objet.genre==='f' ? 'chacune' : 'chacun';
  }
  return v;
}
// Remplace {clé} par vars[clé]. Une clé inconnue est une erreur de gabarit :
// elle est levée tout de suite (les tests parcourent tous les gabarits).
function phrase(tpl, vars){
  return tpl.replace(/\{(\w+)\}/g, function(m, k){
    if(!Object.prototype.hasOwnProperty.call(vars, k)) throw new Error('phrase : {' + k + '} inconnu dans « ' + tpl + ' »');
    return vars[k];
  });
}
