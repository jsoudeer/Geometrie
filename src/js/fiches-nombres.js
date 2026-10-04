  /* ===================== FICHES D'ACTIVITÉS : nombres et calcul (suite) =====================
     Numération, ordre, ± 10 / 100, encadrer, nombres en lettres, suites, monnaie : décrits par des données
     (moteur : gabarits.js). Les fonctions ci-dessous sont les seuls calculs que les fiches ne savent pas écrire. */

  // ---- fonctions nommées ----
  TEMPLATE_FNS.enLettres = nombreEnLettres;                        // 71 -> « soixante et onze »
  // trois fausses écritures en lettres (nombres voisins, chiffres inversés)
  TEMPLATE_FNS.lettresWrong = function(n){
    var c = Math.floor(n/100), d = Math.floor(n/10)%10, u = n%10, w = nombreEnLettres(n);
    var pool = [n+10, n-10, c ? c*100 + u*10 + d : u*10 + d, n+1, n-1, n+100, n-100].filter(function(v){ return v > 9 && v < 1000 && v !== n; });   // < 1000 : nombreEnLettres ne sait pas écrire « dix cent »
    var seen = {}, wrong = []; seen[w] = true;
    shuffle(pool).forEach(function(v){ var t = nombreEnLettres(v); if(!seen[t] && wrong.length < 3){ seen[t] = true; wrong.push(t); } });
    return wrong;
  };
  // trois nombres impairs différents de 1 à hi
  TEMPLATE_FNS.impairs = function(hi, k){
    var odd = [], g = 0;
    while(odd.length < k && g++ < 200){ var od = 2*randInt(0, Math.floor(hi/2)-1) + 1; if(odd.indexOf(od) === -1) odd.push(od); }
    return odd;
  };
  // quatre nombres différents de 1 à hi, le premier est n
  TEMPLATE_FNS.quatreNombres = function(n, hi){
    var vals = [n], g = 0;
    while(vals.length < 4 && g++ < 50){ var v = randInt(1, hi); if(vals.indexOf(v) === -1) vals.push(v); }
    return vals;
  };
  TEMPLATE_FNS.plusGrand = function(a){ return Math.max.apply(null, a); };
  TEMPLATE_FNS.plusPetit = function(a){ return Math.min.apply(null, a); };
  TEMPLATE_FNS.croissant = function(a){ return a.slice().sort(function(x, y){ return x - y; }).join(' < '); };
  // suite arithmétique de n termes (en descendant si desc)
  TEMPLATE_FNS.suite = function(first, step, n, desc){ var o = []; for(var i = 0; i < n; i++) o.push(desc ? first - i*step : first + i*step); return o; };
  TEMPLATE_FNS.joindre = function(a, sep){ return a.join(sep); };
  // fausses réponses de « entre quelles dizaines / centaines » (jamais de nombre négatif)
  TEMPLATE_FNS.encadrerWrong = function(lo, base){
    var up = lo + base, lab = function(a, b){ return 'entre ' + a + ' et ' + b; }, okL = lab(lo, up);
    var wr = [lab(lo-base, lo), lab(lo+base, up+base), lab(lo, up+base), lab(lo-base, up), lab(lo+base, up+2*base)].filter(function(t){ return !/entre -/.test(t) && t !== okL; });
    return shuffle(wr).slice(0, 3);
  };

  // -- Numération : chiffre des dizaines / unités / centaines, nombre de dizaines, composer un nombre --
  var NUM_VARS = { n:{int:['lo','hi']}, c:'floor(n/100)', d:'floor(n/10)%10', u:'n%10' };
  function numVars(extra){ var v = JSON.parse(JSON.stringify(NUM_VARS)); for(var k in extra) v[k] = extra[k]; return v; }
  registerTemplateType({ id:'numeration', domain:'nombres', label:'Dizaines et unités', longLabel:'Dizaines et unités (numération)', defaultLevels:[0,1,2], tag:'Nombres',
    levels:[ { lo:11, hi:59 }, { lo:11, hi:99 }, { lo:101, hi:999 } ],
    forms:[
      { vars:NUM_VARS, answer:'d', extras:['c','u','d+1','d-1'], question:'Dans {n}, quel est le chiffre des dizaines ?', sub:'Le chiffre des dizaines est l\'avant-dernier chiffre.',
        explain:"Dans {n}, le chiffre des dizaines est {d} ({d} dizaine{d>1 ? 's' : ''}).", eq:'{n}' },
      { vars:NUM_VARS, answer:'u', extras:['c','d','u+1','u-1'], question:'Dans {n}, quel est le chiffre des unités ?', sub:'Le chiffre des unités est le dernier chiffre.',
        explain:'Dans {n}, le chiffre des unités est {u}.', eq:'{n}' },
      { levels:[2], vars:NUM_VARS, answer:'c', extras:['d','u','c+1','c-1'], question:'Dans {n}, quel est le chiffre des centaines ?', sub:'Le chiffre des centaines est le premier chiffre.',
        explain:'Dans {n}, le chiffre des centaines est {c}.', eq:'{n}' },
      { levels:[1,2], vars:{ t0:{int:[2,9],step:10}, h:{int:[0,9],step:100}, t:'t0 + (level==2 ? h : 0)', nd:'t/10' }, answer:'nd', extras:['nd+1','nd-1','t','nd*10','nd+10'],
        question:'Combien y a-t-il de dizaines dans {t} ?', sub:'Une dizaine = 10.', explain:'{t} = {nd} × 10, donc il y a {nd} dizaines.', eq:'{t}' },
      { vars:numVars({ txt:"level==2 ? (d==0 ? c*100 + ' + ' + u : c*100 + ' + ' + d*10 + ' + ' + u) : d*10 + ' + ' + u" }), answer:'n', extras:['n+10','n-10','n+1','n-1','n+100','d*10+u'],
        question:'Quel nombre obtient-on ?', sub:'Additionne les centaines, dizaines et unités.', explain:'{txt} = {n}.', eq:'{txt} = ?' }
    ],
    note:'Chiffre des dizaines/unités (centaines en Difficile), nombre de dizaines, ou composer un nombre (30 + 4). Facile : jusqu\'à {hi0} ; Moyen : jusqu\'à {hi1} ; Difficile : jusqu\'à {hi2}.' });

  // -- Ordre : suivant, précédent, entre, plus grand, plus petit, pair --
  var ORD_VARS = { n0:{int:[3,'hi-2']}, adj:'level > 0 && rand() < 0.4', off:{pick:[-1,0,9]}, n:'max(3, min(hi-2, adj ? round(n0/10)*10 + off : n0))' };   // frontières de dizaines
  function ordVars(extra){ var v = JSON.parse(JSON.stringify(ORD_VARS)); for(var k in extra) v[k] = extra[k]; return v; }
  registerTemplateType({ id:'ordre', domain:'nombres', label:'Ordre des nombres', longLabel:'Ordre des nombres (avant, après, plus grand, pair)', defaultLevels:[0,1,2], tag:'Nombres',
    levels:[ { hi:20 }, { hi:100 }, { hi:1000 } ],
    forms:[
      { vars:ORD_VARS, answer:'n+1', extras:['n+2','n-1','n+10','n'], question:'Quel nombre vient juste après {n} ?', sub:'Ajoute 1.',
        explain:'{n+1} vient juste après {n} : {n} + 1 = {n+1}.', eq:'{n} → ?' },
      { vars:ORD_VARS, answer:'n-1', extras:['n-2','n+1','n-10','n'], question:'Quel nombre vient juste avant {n} ?', sub:'Retire 1.',
        explain:'{n-1} vient juste avant {n} : {n} - 1 = {n-1}.', eq:'? → {n}' },
      { levels:[1,2], vars:ORD_VARS, answer:'n', extras:['n-2','n+2','n+10','n-10'], question:'Quel nombre est entre {n-1} et {n+1} ?', sub:'Cherche le nombre qui est juste au milieu.',
        explain:'{n-1} < {n} < {n+1}.', eq:'{n-1} … {n+1}' },
      { vars:ordVars({ vals:'quatreNombres(n, hi)', best:'plusGrand(vals)' }), answer:'best', wrong:'others(vals, best, 3)', question:'Quel est le plus grand de ces nombres ?', sub:'Compare-les un par un.',
        explain:'{best} est le plus grand : {croissant(vals)}.', eq:'le plus grand ?' },
      { vars:ordVars({ vals:'quatreNombres(n, hi)', best:'plusPetit(vals)' }), answer:'best', wrong:'others(vals, best, 3)', question:'Quel est le plus petit de ces nombres ?', sub:'Compare-les un par un.',
        explain:'{best} est le plus petit : {croissant(vals)}.', eq:'le plus petit ?' },
      { levels:[1,2], vars:{ ev:{int:[1,'floor(hi/2)-1'],step:2} }, answer:'ev', wrong:'impairs(hi, 3)', question:'Quel est le nombre pair ?', sub:'Un nombre pair se termine par 0, 2, 4, 6 ou 8.',
        explain:'{ev} est pair (il se termine par {ev%10}) ; les autres sont impairs.', eq:'pair ou impair ?' }
    ],
    note:'Nombre juste avant/après, nombre entre deux autres, plus grand / plus petit parmi 4, nombre pair (dès Moyen). Facile : jusqu\'à {hi0} ; Moyen : jusqu\'à {hi1} ; Difficile : jusqu\'à {hi2}, souvent autour des changements de dizaine.' });

  // -- Ajouter ou enlever 10, 100… (jamais de résultat négatif ni au-dessus de 1000) --
  var PM_DIZ = 'Seul le chiffre des dizaines change (attention à la centaine !).', PM_CENT = 'Seul le chiffre des centaines change.';
  function pmForm(levels, w, stp, nVars, sub){
    var v = { sg:{pick:[1,-1]}, stp:stp };
    for(var k in nVars) v[k] = nVars[k];
    v.res = 'n + sg*stp'; v.txt = "n + (sg>0 ? ' + ' : ' - ') + stp";
    return { levels:levels, w:w, vars:v, where:['res >= 0 && res <= 1000'], answer:'res', extras:['res+sg*stp','res-sg*stp*2','n+sg*stp*10','res+10*sg','res-10*sg','res+100*sg'],
      question:'Quel est le résultat de {txt} ?', sub:sub, explain:'{txt} = {res}.', eq:'{txt}' };
  }
  registerTemplateType({ id:'plusMoins', domain:'nombres', label:'Ajouter 10, 100', longLabel:'Ajouter ou enlever 10, 100…', defaultLevels:[0,1,2], tag:'Nombres',
    levels:[ {}, {}, {} ],
    forms:[
      // Facile : ± 10
      pmForm([0], 1, 10, { b:{int:['sg>0 ? 1 : 2', 'sg>0 ? 8 : 9'], step:10}, e:'rand() < 0.5 ? 0 : 1 + floor(rand()*9)', n:'b + e' }, PM_DIZ),
      // Moyen : ± 10 (2 fois sur 3) ou ± 100
      pmForm([1], 2, 10, { n:{int:['sg>0 ? 11 : 20', 'sg>0 ? 89 : 99']} }, PM_DIZ),
      pmForm([1], 1, 100, { n:{int:['sg>0 ? 100 : 200', 'sg>0 ? 899 : 999']} }, PM_CENT),
      // Difficile : ± 1 aux frontières, ± 10 / 20 / 30, ± 100 / 200
      pmForm([2], 1, 1, { n:'at(sg>0 ? [99,199,299,399,499,599,699,799,899,109,119,129,139] : [100,200,300,400,500,600,700,800,900,110,120,130,140], floor(rand()*13))' },
        "{sg>0 ? 'Ajoute 1 : le chiffre des unités passe à 0 et on retient.' : 'Enlève 1 : attention au passage de la dizaine ou de la centaine.'}"),
      pmForm([2], 3, {pick:[10,20,30]}, { n0:{int:['sg>0 ? 100 : 110+stp', 'sg>0 ? 970-stp : 999']}, alt:'rand() < 0.6', r2:'sg>0 ? 10 + floor(rand()*(100-stp)) : floor(rand()*(stp+1))',
        n:'alt ? floor(n0/100)*100 + r2 : n0' }, PM_DIZ),
      pmForm([2], 2, {pick:[100,200]}, { n:{int:['sg>0 ? 100 : 100+stp', 'sg>0 ? 999-stp : 999']} }, PM_CENT)
    ],
    note:'Facile : +10 / -10 jusqu\'à 100 ; Moyen : +10 / -10 jusqu\'à 100 et +100 / -100 jusqu\'à 1000 ; Difficile : aussi +1 / -1 aux frontières (399 + 1), +20, +30, +200, avec passage de la centaine.' });

  // -- Encadrer, arrondir --
  var ENC_N = { n:{int:['lo','hi']} }, ENC_WHERE = ['n % b0 != 0', 'n % 10 != 5', 'b0 != 100 || floor(n/10)%10 != 5'];   // jamais un 5 en dernier chiffre : « arrondis 605 à la dizaine » serait ambigu
  registerTemplateType({ id:'encadrer', domain:'nombres', label:'Encadrer, arrondir', longLabel:'Encadrer et arrondir un nombre', defaultLevels:[0,1,2], tag:'Nombres',
    levels:[ { lo:11, hi:99, b0:10, pArrondi:0 }, { lo:11, hi:999, b0:10, pArrondi:0.5 }, { lo:101, hi:999, b0:100, pArrondi:0.5 } ],
    forms:[
      { w:'1 - pArrondi', vars:{ n:{int:['lo','hi']}, base:'b0', lo2:'floor(n/base)*base', up:'lo2 + base', ok:"'entre ' + lo2 + ' et ' + up" }, where:ENC_WHERE,
        answer:'ok', wrong:'encadrerWrong(lo2, base)',
        question:"Entre quelles {base==100 ? 'centaines' : 'dizaines'} se trouve {n} ?", sub:"Trouve la {base==100 ? 'centaine' : 'dizaine'} juste avant et celle juste après.",
        explain:'{lo2} < {n} < {up} : {n} est {ok}.', eq:'{n}' },
      { w:'pArrondi', vars:{ n:{int:['lo','hi']}, base:'level==2 && rand() < 0.4 ? 10 : b0', lo2:'floor(n/base)*base', up:'lo2 + base', near:'(n-lo2) < (up-n) ? lo2 : up' }, where:ENC_WHERE,
        answer:'near', extras:['lo2','up','lo2-base','up+base','near + (near==lo2 ? 1 : -1)*floor(base/10)'],
        question:"Arrondis {n} à {base==100 ? 'la centaine' : 'la dizaine'} la plus proche.", sub:"Entre quels {base==100 ? 'centaines' : 'dizaines'} est-il ? Duquel est-il le plus proche ?",
        explain:'{n} est entre {lo2} et {up}, plus proche de {near}.', eq:'{n} ≈ ?' }
    ],
    note:'Facile : entre quelles dizaines (jusqu\'à 99) ; Moyen : jusqu\'à 999, et arrondir à la dizaine ; Difficile : entre quelles centaines, arrondir à la centaine ou à la dizaine.' });

  // -- Nombres en lettres : des lettres aux chiffres, ou des chiffres aux lettres --
  registerTemplateType({ id:'lettres', domain:'nombres', label:'Nombres en lettres', longLabel:'Nombres en lettres', defaultLevels:[0,1,2], tag:'Nombres',
    levels:[ { lo:10, hi:69 }, { lo:70, hi:99 }, { lo:101, hi:999 } ],
    forms:[
      { vars:{ n:{int:['lo','hi']}, w:'enLettres(n)', c:'floor(n/100)', d:'floor(n/10)%10', u:'n%10', swap:'c ? c*100 + u*10 + d : u*10 + d' }, where:['level < 2 || n % 100 != 0'],
        answer:'n', extras:['n+10','n-10','swap','n+1','n-1','n%100 >= 70 ? n-20 : n+100'],
        question:'Quel est ce nombre écrit en chiffres ?', sub:'Découpe le mot : cent, vingt, soixante… (quatre-vingt = 4 × 20).', explain:"{w} s'écrit {n}.", scene:{ type:'words', text:'{w}' } },
      { vars:{ n:{int:['lo','hi']}, w:'enLettres(n)' }, where:['level < 2 || n % 100 != 0'], answer:'w', wrong:'lettresWrong(n)',
        question:"Comment s'écrit ce nombre en lettres ?", sub:'Cherche le mot qui correspond exactement au nombre.', explain:"{n} s'écrit « {w} ».", eq:'{n}' }
    ],
    note:'Passer des lettres aux chiffres, ou des chiffres aux lettres. Facile : {lo0} à {hi0} ; Moyen : {lo1} à {hi1} (soixante-dix, quatre-vingts…) ; Difficile : {lo2} à {hi2}.' });

  // -- Suites de nombres : on avance (ou recule) du même nombre à chaque fois --
  registerTemplateType({ id:'suiteNombres', domain:'logique', label:'Suite de nombres', longLabel:'Suite de nombres', defaultLevels:[0,1,2], tag:'Suite de nombres',
    levels:[ { steps:[1,2,5,10], pDesc:0, f0:10, dx:10, hole:4 }, { steps:[2,3,5,10], pDesc:0.4, f0:20, dx:10, hole:0 }, { steps:[3,4,6,7,9,11,20,25], pDesc:0.4, f0:40, dx:30, hole:0 } ],
    forms:[
      { vars:{ step:{pick:'steps'}, desc:'rand() < pDesc', first:'desc ? step*4 + floor(rand()*(dx+1)) : floor(rand()*(f0+1))', seq:'suite(first, step, 5, desc)',
          h:'hole > 0 ? hole : 1 + floor(rand()*4)', ans:'at(seq, h)', shown:'masque(seq, h)' },
        answer:'ans', extras:['ans+step','ans-step','ans+2*step','ans-2*step'], question:'Quel nombre manque dans cette suite ?', sub:'Cherche de combien on avance (ou on recule) à chaque fois.',
        explain:"On {desc ? 'recule' : 'avance'} de {step} à chaque fois : {joindre(seq, ', ')}. Le nombre qui manque est {ans}.", scene:{ type:'cells', items:'shown' } }
    ],
    note:'Une suite où l\'on avance (ou recule) du même nombre à chaque fois ; on trouve le nombre manquant. Facile : de {liste(steps0)} ; Moyen : de {liste(steps1)}, parfois en descendant ; Difficile : de {liste(steps2)}.' });

  // -- Monnaie : combien d'argent en tout ? --
  registerTemplateType({ id:'monnaie', domain:'calcul', label:'Monnaie', longLabel:'Monnaie', defaultLevels:[0,1,2], tag:'Monnaie',
    levels:[ { pool:[1,2,5], cmin:2, cmax:2 }, { pool:[1,2,5,10], cmin:2, cmax:3 }, { pool:[1,2,5,10,20], cmin:3, cmax:4 } ],
    forms:[
      { vars:{ k:{int:['cmin','cmax']}, items:'tirages(pool, k)', s:'total(items)' }, answer:'s', suffix:'€', extras:['s-5','s-2','s-1','s+1','s+2','s+5'],
        question:"Combien d'argent y a-t-il en tout ?", sub:'Additionne la valeur de chaque pièce ou billet.', explain:"{joindre(items, '€ + ')}€ = {s}€.", scene:{ type:'money', items:'items' } }
    ],
    note:'Le nombre de pièces/billets et leurs valeurs sont tirés au hasard. Facile : {cmin0} pièces ou billets de {liste(pool0)} € ; Moyen : {cmin1} à {cmax1}, de {liste(pool1)} € ; Difficile : {cmin2} à {cmax2}, de {liste(pool2)} €.' });

  // -- Problèmes écrits : prénoms (enfants et mascottes), objets et accords viennent de vocabulaire.js --
  function icon(expr){ return { type:'emoji', icon:expr, caption:'' }; }
  var CHOIX_SUB = 'Lis bien l\'énoncé avant de calculer.';
  registerTemplateType({ id:'vie', domain:'calcul', label:'Maths de la vie', longLabel:'Maths de la vie', defaultLevels:[1,2], tag:'Maths de la vie', freshForms:true,
    levels:[ {}, {}, {} ],
    forms:[
      { vars:{ a:{int:[1,10]}, b:{int:[1,10]}, s:'a+b', w:{person:true}, o:{thing:'jeu'}, c1:{color:true}, c2:{color:true} }, where:['c1.m != c2.m'], answer:'s', extras:['s-2','s-1','s+1','s+2','s+3'],
        question:'{w.nom} a {nbc(a, o.sing, o.obj, o.genre, c1.m, c1.f)} et {nbc(b, o.sing, o.obj, o.genre, c2.m, c2.f)}. Combien de {o.obj} {w.at} en tout ?',
        sub:CHOIX_SUB, explain:'{a} + {b} = {s} {o.obj}.', scene:icon('o.icon') },
      { vars:{ a:{int:[2,15]}, b:{int:[1,'a-1']}, d:'a-b' }, answer:'d', extras:['d-2','d-1','d+1','d+2','d+3'],
        question:'Un crayon mesure {a} cm. Un autre mesure {b} cm. Quelle est la différence de longueur ?', sub:CHOIX_SUB, explain:'{a} - {b} = {d} cm.', scene:icon("'📏'") },
      { vars:{ p1:{int:[1,10]}, p2:{int:[1,10]}, s:'p1+p2', f1:{thing:'fruit'}, f2:{thing:'fruit'} }, where:['f1.sing != f2.sing'], answer:'s', extras:['s-2','s-1','s+1','s+2','s+3'],
        question:'Au marché, {f1.un} coûte {p1}€ et {f2.un} coûte {p2}€. Combien coûtent les deux fruits ensemble ?', sub:CHOIX_SUB, explain:'{p1}€ + {p2}€ = {s}€.', scene:icon("'💶'") },
      { vars:{ total:{int:[10,20]}, done:{int:[1,'total-1']}, remain:'total-done', w:{person:true} }, answer:'remain', extras:['remain-2','remain-1','remain+1','remain+2','remain+3'],
        question:'Sur le chemin de l\'école, il y a {total} arbres. {w.nom} en a déjà compté {done}. Combien lui en reste-t-il à compter ?', sub:CHOIX_SUB, explain:'{total} - {done} = {remain}.', scene:icon("'🚶'") },
      { vars:{ boxes:{int:[2,6]}, per:{int:[2,5]}, t:'boxes*per', o:{thing:'gourmand'} }, answer:'t', extras:['t-4','t-2','t+2','t+4','t+6'],
        question:'Il y a {boxes} boîtes de {o.obj}. Chaque boîte contient {per} {o.obj}. Combien de {o.obj} y a-t-il en tout ?', sub:CHOIX_SUB, explain:'{boxes} × {per} = {t} {o.obj}.', scene:icon('o.icon') },
      { vars:{ paid:{int:[10,20]}, cost:{int:[1,'paid-1']}, change:'paid-cost', w:{person:true}, x:{thing:'article'} }, answer:'change', extras:['change-2','change-1','change+1','change+2','change+3'],
        question:'{w.nom} paie avec un billet de {paid}€ {x.un} qui coûte {cost}€. Combien de monnaie va-t-on lui rendre ?', sub:CHOIX_SUB, explain:'{paid}€ - {cost}€ = {change}€.', scene:icon("'💰'") }
    ],
    note:'Le modèle de problème est tiré au hasard parmi 6 scénarios fixes (sans répétition tant qu\'on ne les a pas tous vus), puis les nombres de l\'énoncé sont eux aussi tirés au hasard à l\'intérieur de chaque modèle.' });

  // -- Problèmes à deux étapes --
  var P2_SUB = 'Il y a deux étapes : fais-les l\'une après l\'autre.';
  registerTemplateType({ id:'probleme2', domain:'calcul', label:'Problèmes à 2 étapes', longLabel:'Problèmes à deux étapes', defaultLevels:[1,2], tag:'Problèmes', freshForms:true,
    levels:[ { L:0 }, { L:0 }, { L:1 } ],
    forms:[
      { vars:{ A:{int:['L ? 40 : 10','L ? 90 : 20']}, B:{int:[3,'floor(A/2)']}, C:{int:[3,'L ? 30 : 9']}, r:'A-B+C', w:{person:true}, o:{thing:'jeu'} }, answer:'r', extras:['A-B','A+C','A+B+C','A-B-C'],
        question:'{w.nom} a {A} {o.obj}. {w.Il} en perd {B}, puis {w.il} en gagne {C}. Combien de {o.obj} {w.at} maintenant ?', sub:P2_SUB, explain:'{A} - {B} = {A-B}, puis {A-B} + {C} = {r}.', scene:icon('o.icon') },
      { vars:{ A:{int:['L ? 30 : 8','L ? 70 : 15']}, B:{int:[2,'floor(A/2)']}, C:{int:[3,'L ? 25 : 9']}, r:'A-B+C' }, answer:'r', extras:['A-B','A+C','A+B+C','A-B-C'],
        question:'Dans un bus, il y a {A} personnes. À l\'arrêt, {B} personnes descendent et {C} montent. Combien y a-t-il de personnes dans le bus ?', sub:P2_SUB, explain:'{A} - {B} = {A-B}, puis {A-B} + {C} = {r}.', scene:icon("'🚌'") },
      { vars:{ B:{int:['L ? 12 : 2','L ? 35 : 8']}, C:{int:['L ? 10 : 2','L ? 30 : 8']}, e:{int:[1,'L ? 30 : 8']}, A:'B+C+e', r:'A-B-C', w:{person:true}, x1:{thing:'article'}, x2:{thing:'article'} }, where:['x1.sing != x2.sing'],
        answer:'r', extras:['A-B','A-C','B+C','A+B+C'],
        question:'{w.nom} a {A}€. {w.Il} achète {x1.un} à {B}€ et {x2.un} à {C}€. Combien d\'euros lui reste-t-il ?', sub:P2_SUB, explain:'{B} + {C} = {B+C}, puis {A} - {B+C} = {r}.', scene:icon("'💰'") },
      { vars:{ B:{int:['L ? 20 : 3','L ? 60 : 9']}, C:{int:['L ? 15 : 3','L ? 50 : 9']}, e:{int:[2,'L ? 40 : 9']}, T:'B+C+e', r:'T-B-C', w:{person:true} }, answer:'r', extras:['T-B','T-C','B+C','T+B+C'],
        question:'{w.nom} lit {B} pages lundi et {C} pages mardi. Son livre a {T} pages. Combien de pages lui reste-t-il à lire ?', sub:P2_SUB, explain:'{B} + {C} = {B+C}, puis {T} - {B+C} = {r}.', scene:icon("'📖'") },
      { levels:[0,2], vars:{ b:{int:[3,6]}, p:{int:[3,6]}, e:{int:[2,'b*p-2']}, r:'b*p-e', o:{thing:'gourmand'} }, answer:'r', extras:['b*p','b*p+e','p-e > 0 ? p-e : r+2','b+p-e > 0 ? b+p-e : r+3'],
        question:'Il y a {b} boîtes de {p} {o.obj}. On mange {e} {o.obj}. Combien de {o.obj} reste-t-il ?', sub:P2_SUB, explain:'{b} × {p} = {b*p}, puis {b*p} - {e} = {r}.', scene:icon('o.icon') },
      { levels:[0,2], vars:{ n:{int:[2,5]}, c:{int:[2,5]}, e:{int:[1,15]}, A:'n*c+e', r:'A-n*c', w:{person:true}, x:{thing:'article'} }, answer:'r', extras:['n*c','A-c','A-n','A+n*c'],
        question:'{w.nom} a {A}€. {w.Il} achète {n} {x.obj} à {c}€ {x.chacun}. Combien d\'euros lui reste-t-il ?', sub:P2_SUB, explain:'{n} × {c} = {n*c}, puis {A} - {n*c} = {r}.', scene:icon("'📒'") },
      { levels:[0,2], vars:{ b:{int:[3,6]}, p:{int:[3,6]}, x:{int:[2,9]}, r:'b*p+x', w:{person:true}, o:{thing:'jeu'} }, answer:'r', extras:['b*p','b+p+x','r-x*2 > 0 ? r-x*2 : r+4','r+p'],
        question:'{w.nom} a {b} paquets de {p} {o.obj} et {x} {o.obj} {o.seuls}. Combien de {o.obj} {w.at} en tout ?', sub:P2_SUB, explain:'{b} × {p} = {b*p}, puis {b*p} + {x} = {r}.', scene:icon('o.icon') },
      { levels:[0,2], vars:{ p:{int:[2,5]}, k:{int:[2,5]}, u:{int:[2,5]}, r:'p*(k+u)', o:{thing:'fruit'} }, answer:'r', extras:['k+u','p*k','p*u','r+p'],
        question:'Un panier contient {k} {o.obj}. Un autre en contient {u}. On remplit {p} fois les deux paniers. Combien de {o.obj} en tout ?', sub:P2_SUB, explain:'{k} + {u} = {k+u}, puis {p} × {k+u} = {r}.', scene:icon('o.icon') }
    ],
    note:'Un énoncé qui demande deux calculs à la suite (perdre puis gagner, deux achats, boîtes de gâteaux…). Moyen : additions et soustractions, nombres jusqu\'à environ 30 ; Difficile : nombres jusqu\'à environ 100 et énoncés avec une multiplication. Les modèles sont tirés sans répétition.' });
