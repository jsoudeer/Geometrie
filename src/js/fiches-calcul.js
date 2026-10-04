  /* ===================== FICHES D'ACTIVITÉS : calcul =====================
     12 activités décrites par des données (moteur : gabarits.js). Pour en ajouter une : une fiche + un appel
     à registerTemplateType. Les `levels` sont les réglages Facile / Moyen / Difficile ; la note de réglage
     (« note ») est générée à partir d'eux. */

  // Fonctions nommées que les fiches peuvent appeler (carry(a,b), explainAdd(a,b), tableHint(t)).
  TEMPLATE_FNS.carry = hasCarry;
  TEMPLATE_FNS.explainAdd = addExplain;
  TEMPLATE_FNS.borrow = hasBorrow;
  TEMPLATE_FNS.explainSub = subExplain;
  TEMPLATE_FNS.somme = function(c, r){ r = Math.max(1, Math.min(50, Math.floor(r))); return Array(r+1).join(c + ' + ').slice(0,-3); };   // somme(5,3) -> « 5 + 5 + 5 »
  TEMPLATE_FNS.blocsExplain = function(hu, te, un){
    return (hu ? hu + ' plaque' + (hu>1?'s':'') + ' (' + hu*100 + ') + ' : '') + te + ' barre' + (te>1?'s':'') + ' (' + te*10 + ') + ' + un + ' cube' + (un>1?'s':'') + ' = ' + (hu*100 + te*10 + un) + '.';
  };
  TEMPLATE_FNS.signe = function(x, y){ return x < y ? '<' : x > y ? '>' : '='; };
  TEMPLATE_FNS.compareExplain = function(x, y){
    return x === y ? x + ' est égal à ' + y + ' : =.' : (x > y ? x + ' est plus grand que ' + y : x + ' est plus petit que ' + y) + ' : ' + x + ' ' + (x < y ? '<' : '>') + ' ' + y + '.';
  };
  TEMPLATE_FNS.tableHint = function(t){
    return t===10 ? 'Multiplier par 10 : on ajoute un zéro.' : t===5 ? 'On compte de 5 en 5 : 5, 10, 15, 20…' : t===2 ? 'Multiplier par 2, c\'est le double.' : 'On compte de ' + t + ' en ' + t + '.';
  };

  // -- Calcul : a + b (et, en Difficile, « a + x = c ») --
  registerTemplateType({ id:'calc', domain:'calcul', label:'Calcul', longLabel:'Calcul', defaultLevels:[0,1,2],
    levels:[ { max:10 }, { max:20 }, { max:20 } ],
    forms:[
      { vars:{ a:{int:[0,'max']}, b:{int:[0,'max-a']}, s:'a+b' }, answer:'s',
        question:'Combien font {a} + {b} ?', sub:'Calcule le résultat de cette addition.', explain:'{a} + {b} = {s}.', eq:'{a} + {b} = ?' },
      { w:'level==2 ? 1 : 0', vars:{ a:{int:[0,'max']}, x:{int:[0,'max-a']}, c:'a+x' }, answer:'x',
        question:'Trouve x : {a} + x = {c}', sub:'Cherche le nombre qui manque pour que l\'égalité soit vraie.',
        explain:'x = {c} - {a} = {x}, car {a} + {x} = {c}.', eq:'{a} + x = {c}' }
    ],
    note:'Les nombres de l\'opération sont tirés au hasard. C\'est le NIVEAU qui fixe la plage : a + b jusqu\'à {max0} en Facile, {max1} en Moyen, {max2} en Difficile, où l\'on trouve aussi parfois x dans « a + x = c ».' });

  // -- Soustraction --
  registerTemplateType({ id:'soustraction', domain:'calcul', label:'Soustraction', longLabel:'Soustraction', defaultLevels:[0,1,2],
    levels:[ { aLo:2, aHi:10, bLo:1 }, { aLo:8, aHi:20, bLo:1 }, { aLo:21, aHi:60, bLo:6 } ],
    forms:[
      { vars:{ a:{int:['aLo','aHi']}, b:{int:['bLo','a-1']}, d:'a-b' }, answer:'d', extras:['a+b','d+10','d-10'],
        question:'Combien font {a} - {b} ?', sub:'Calcule le résultat de cette soustraction.',
        explain:'{a} - {b} = {d}. (Vérification : {d} + {b} = {a}.)', eq:'{a} - {b} = ?' }
    ],
    note:'a - b avec b plus petit que a. Facile : nombres jusqu\'à {aHi0} ; Moyen : jusqu\'à {aHi1} ; Difficile : jusqu\'à {aHi2} (avec retenues).' });

  // -- Doubles et moitiés --
  registerTemplateType({ id:'doubleMoitie', domain:'calcul', label:'Doubles et moitiés', longLabel:'Doubles et moitiés', defaultLevels:[0,1,2],
    levels:[ { hi:10 }, { hi:20 }, { hi:50 } ],
    forms:[
      { vars:{ n:{int:[1,'hi']}, r:'2*n' }, answer:'r', extras:['n','r+10','r-10','n*3'],
        question:'Quel est le double de {n} ?', sub:'Le double, c\'est le nombre plus lui-même.',
        explain:'Le double de {n} : {n} + {n} = {r}.', eq:'double de {n} = ?' },
      { vars:{ h:{int:[1,'hi']}, m:'2*h' }, answer:'h', extras:['m','h+10','h-10','m-1'],
        question:'Quelle est la moitié de {m} ?', sub:'La moitié, c\'est partager en deux parts égales.',
        explain:'La moitié de {m} : {h} + {h} = {m}, donc la moitié est {h}.', eq:'moitié de {m} = ?' }
    ],
    note:'Le double ou la moitié d\'un nombre (la moitié porte toujours sur un nombre pair). Facile : jusqu\'à {hi0} ; Moyen : jusqu\'à {hi1} ; Difficile : jusqu\'à {hi2}.' });

  // -- Compléments (à 10, à 20, à 100) --
  var COMPLEMENT_TEXT = {
    question:'{a} + ? = {target}', sub:'Cherche le nombre à ajouter pour arriver à {target}.',
    explain:'{target} - {a} = {x}, car {a} + {x} = {target}.', eq:'{a} + ? = {target}'
  };
  function complementForm(levels, aSpec, extras){
    var f = { levels:levels, vars:{ a:aSpec, x:'target-a' }, answer:'x', extras:extras };
    for(var k in COMPLEMENT_TEXT) f[k] = COMPLEMENT_TEXT[k];
    return f;
  }
  registerTemplateType({ id:'complement', domain:'calcul', label:'Compléments', longLabel:'Compléments (à 10, 20, 100)', defaultLevels:[0,1,2],
    levels:[ { target:10 }, { target:20 }, { target:100 } ],
    forms:[
      complementForm([0,1], {int:[1,'target-1']}, ['x+1','x-1']),
      complementForm([2], {int:[1,19], step:5}, ['x+5','x-5','x+10','x-10'])
    ],
    note:'« a + ? = cible ». Facile : compléments à {target0} ; Moyen : à {target1} ; Difficile : à {target2} (multiples de 5).' });

  // -- Tables de multiplication --
  registerTemplateType({ id:'tables', domain:'calcul', label:'Tables', longLabel:'Tables de multiplication', defaultLevels:[1,2],
    levels:[ { tables:[2,10] }, { tables:[2,5,10] }, { tables:[2,3,4,5,10] } ],
    forms:[
      { w:'level==2 ? 0.6 : 1', vars:{ t:{pick:'tables'}, n:{int:[1,10]}, r:'t*n' }, answer:'r', extras:['r+t','r-t','r+10','r-10'],
        question:'Combien font {t} × {n} ?', sub:'Utilise la table de {t}.', explain:'{t} × {n} = {r}. {tableHint(t)}', eq:'{t} × {n} = ?' },
      { w:'level==2 ? 0.4 : 0', vars:{ t:{pick:'tables'}, n:{int:[1,10]}, r:'t*n' }, answer:'n', extras:['n+t','n-t','n*2'],
        question:'{t} × ? = {r}', sub:'Cherche par combien il faut multiplier {t}.', explain:'{t} × {n} = {r}. {tableHint(t)}', eq:'{t} × ? = {r}' }
    ],
    note:'Facile : tables de {liste(tables0)} ; Moyen : {liste(tables1)} ; Difficile : {liste(tables2)}, avec parfois le facteur manquant (5 × ? = 35).' });

  // -- Additions posées (retenue) --
  var ADDITION_TEXT = {
    answer:'a+b', extras:['carry(a,b) ? s-10 : s+10', 'level==2 ? s+100 : s+20'],
    question:'Calcule {a} + {b}.', sub:'Additionne en colonnes : unités, puis dizaines{hundreds} (n\'oublie pas la retenue).',
    explain:'{explainAdd(a,b)}', eq:'{a} + {b}'
  };
  function additionForm(levels, vars, where){
    var f = { levels:levels, vars:vars, where:where };
    for(var k in ADDITION_TEXT) f[k] = ADDITION_TEXT[k];
    f.answer = 's'; f.vars.s = 'a+b';
    return f;
  }
  registerTemplateType({ id:'addition', domain:'calcul', label:'Additions posées', longLabel:'Additions en colonnes (retenue)', defaultLevels:[0,1,2],
    levels:[ { max:99, hundreds:'' }, { max:99, hundreds:'' }, { max:999, hundreds:', puis centaines' } ],
    forms:[
      additionForm([0], { a:{int:[11,89]}, b:{any:[ {int:[1,9]}, {int:[1,8], step:10} ]} }, ['a+b<=max', '!carry(a,b)']),
      additionForm([1], { a:{int:[15,89]}, b:{int:[11,60]} }, ['a+b<=max', 'carry(a,b) || tries>=100 || rand()>=0.6']),
      additionForm([2], { a:{int:[120,899]}, b:{any:[ {int:[11,99]}, {int:[110,500]} ]} }, ['a+b<=max', 'carry(a,b) || tries>=100 || rand()>=0.5'])
    ],
    note:'Facile : sans retenue, jusqu\'à {max0} ; Moyen : 2 nombres de 2 chiffres jusqu\'à {max1}, souvent avec retenue ; Difficile : jusqu\'à {max2}, souvent avec retenue. L\'explication détaille chaque colonne.' });

  // -- Soustractions posées (emprunt) --
  function soustractionPoseeForm(levels, bSpec, where){
    return { levels:levels, vars:{ a:{int:['aLo','max']}, b:bSpec, r:'a-b' }, where:where, answer:'r',
      extras:['r+10','r-10','r+1','r-1','level==2 ? r+100 : r+20','level>0 ? abs(floor(a/10)%10 - floor(b/10)%10)*10 + abs(a%10 - b%10) : r+2'],
      question:'Calcule {a} - {b}.', sub:'Soustrais en colonnes : unités, puis dizaines{hundreds} (emprunte 1 si le chiffre du haut est trop petit).',
      explain:'{explainSub(a,b)}', eq:'{a} - {b}' };
  }
  registerTemplateType({ id:'soustractionPosee', domain:'calcul', label:'Soustractions posées', longLabel:'Soustractions en colonnes (emprunt)', defaultLevels:[0,1,2],
    levels:[ { aLo:21, max:99, hundreds:'' }, { aLo:31, max:99, hundreds:'' }, { aLo:121, max:999, hundreds:', puis centaines' } ],
    forms:[
      soustractionPoseeForm([0], {any:[ {int:[1,9]}, {int:[1,'floor(a/10)-1'], step:10} ]}, ['a>b', '!borrow(a,b)']),
      soustractionPoseeForm([1], {int:[11,'a-5']}, ['a>b', 'borrow(a,b) || tries>=100 || rand()>=0.6']),
      soustractionPoseeForm([2], {any:[ {int:[11,99]}, {int:[101,'a-10']} ]}, ['a>b', 'borrow(a,b) || tries>=100 || rand()>=0.6'])
    ],
    note:'Facile : sans emprunt, jusqu\'à {max0} ; Moyen : jusqu\'à {max1}, souvent avec emprunt ; Difficile : jusqu\'à {max2}, souvent avec emprunt. L\'explication détaille chaque colonne.' });

  // -- Blocs : « quel nombre est représenté ? » (Dénombrement visuel Moyen/Difficile et Compter jusqu'à 1000) --
  function blocsForm(levels, vars){
    vars.tot = 'hu*100 + te*10 + un'; vars.sw = 'te*100 + hu*10 + un';
    return { levels:levels, vars:vars, answer:'tot',
      extras:['tot+10','tot-10','tot+100','tot-100','sw != tot ? sw : tot+1','tot+1','tot-1'],
      question:'Quel nombre est représenté avec ces blocs ?', sub:'Une plaque = 100, une barre = 10, un petit cube = 1.',
      explain:'{blocsExplain(hu,te,un)}', scene:{ type:'blocks', hu:'hu', te:'te', un:'un' } };
  }
  var COMPTAGE_ICONS = ['🍎','⭐','🐟','🚗','🎈','🐞','🍪','🌸'];
  registerTemplateType({ id:'comptage', domain:'nombres', label:'Dénombrement (visuel)', longLabel:'Dénombrement : compter des objets, des blocs', defaultLevels:[0,1,2],
    levels:[ { icons:COMPTAGE_ICONS, huMax:0 }, { icons:COMPTAGE_ICONS, huMax:0 }, { icons:COMPTAGE_ICONS, huMax:2 } ],
    forms:[
      { levels:[0], vars:{ n:{int:[3,12]}, icon:{pick:'icons'} }, answer:'n', extras:['n+1','n-1','n+2','n-2'],
        question:'Combien y a-t-il d\'objets ?', sub:'Compte-les un par un, sans en oublier ni en compter deux fois.', explain:'Il y a {n} objets.',
        scene:{ type:'scatter', n:'n', icon:'icon' } },
      blocsForm([1,2], { hu:{int:[0,'huMax']}, te:{int:[1,5]}, un:{int:[0,9]} })
    ],
    note:'Facile : compter 3 à 12 objets éparpillés. Moyen : lire des blocs (barres de 10, cubes). Difficile : + plaques de 100.' });
  registerTemplateType({ id:'blocs1000', domain:'nombres', label:'Compter jusqu\'à 1000', longLabel:'Compter des blocs jusqu\'à 999', defaultLevels:[1,2],
    levels:[ { huMax:4 }, { huMax:4 }, { huMax:9 } ],
    forms:[ blocsForm([0,1,2], { hu:{int:[1,'huMax']}, te:{int:[0,9]}, un:{int:[0,9]} }) ],
    note:'Lire un nombre fait de plaques (100), barres (10) et cubes (1). Moyen : 1 à {huMax1} plaques (jusqu\'à {huMax1*100+99}) ; Difficile : jusqu\'à {huMax2} plaques ({huMax2*100+99}), avec des chiffres 0 pièges.' });

  // -- Multiplier et partager (grilles de points, additions répétées, partages, paquets) --
  var PART_ICONS = ['🍬','🍪','⭐','🍎','🎈'];
  function repeteForm(levels, cSpec){
    return { levels:levels, vars:{ c:cSpec, r:{int:[3,'repR']}, total:'r*c' }, answer:'total', extras:['total+c','total-c','r+c','total+1','total-1','c*(r+1)'],
      question:'Combien font {r} fois {c} ?', sub:'Additionne {c} à chaque fois, {r} fois.', explain:'{somme(c,r)} = {total} ({r} × {c}).',
      eq:'{somme(c,r)}' };
  }
  registerTemplateType({ id:'multiplier', domain:'calcul', label:'Multiplier, partager', longLabel:'Multiplier et partager (grilles, paquets)', defaultLevels:[0,1,2],
    levels:[
      { rHi:3, cLo:2, cHi:5,  repR:4, kids:[2],             eachLo:1, eachHi:5, gLo:3, gHi:8, gC:[2,5,10],       icons:PART_ICONS },
      { rHi:5, cLo:2, cHi:5,  repR:5, kids:[2,3,4,5],       eachLo:2, eachHi:5, gLo:2, gHi:5, gC:[2,5,10],       icons:PART_ICONS },
      { rHi:5, cLo:3, cHi:10, repR:5, kids:[2,3,4,5,6,10],  eachLo:3, eachHi:9, gLo:3, gHi:8, gC:[3,4,5,6,10],   icons:PART_ICONS }
    ],
    forms:[
      { vars:{ r:{int:[2,'rHi']}, c:{int:['cLo','cHi']}, total:'r*c' }, answer:'total', extras:['total+c','total-c','total+r','c+r','total+1','total-1'],
        question:'Combien y a-t-il de points en tout ?', sub:'Compte les points d\'une ligne, puis répète : {r} lignes de {c}.',
        explain:'{r} lignes de {c} : {somme(c,r)} = {total} ({r} × {c}).', scene:{ type:'grid', rows:'r', cols:'c' } },
      repeteForm([0], {pick:[2,5,10]}),
      repeteForm([1], {int:[2,6]}),
      repeteForm([2], {int:[3,9]}),
      { vars:{ kids:{pick:'kids'}, each:{int:['eachLo','eachHi']}, total:'kids*each', ic:{pick:'icons'} }, answer:'each', extras:['each+1','each-1','total-kids','kids','each*2','each+2'],
        question:'On partage {total} {ic} en parts égales entre {kids} enfants. Combien chacun en a-t-il ?', sub:'Cherche le nombre qui, répété {kids} fois, fait {total}.',
        explain:'Chacun en a {each} car {kids} × {each} = {total}.', scene:{ type:'emoji', icon:'ic', caption:'{total} pour {kids}' } },
      { w:'level==0 ? 0 : level==1 ? 1 : 2', vars:{ c:{pick:'gC'}, r:{int:['gLo','gHi']}, total:'r*c', ic:{pick:'icons'} }, answer:'r', extras:['r+1','r-1','total-c','c','r*2','r+2'],
        question:'Avec {total} {ic}, on fait des paquets de {c}. Combien de paquets ?', sub:'Combien de fois {c} dans {total} ?',
        explain:'{r} paquets car {r} × {c} = {total}.', scene:{ type:'emoji', icon:'ic', caption:'{total} → paquets de {c}' } }
    ],
    note:'Compter une grille de points, additionner plusieurs fois le même nombre, partager en parts égales (Moyen/Difficile : aussi faire des paquets). Facile : 2 à {rHi0} lignes, partage entre {liste(kids0)} ; Moyen : jusqu\'à {rHi1} lignes de {cHi1} points ; Difficile : jusqu\'à {cHi2} colonnes, partages entre {liste(kids2)}.' });

  // -- Droite graduée : lire le nombre pointé (10 graduations, pas de 1, 10, 20, 50 ou 100) --
  function droiteForm(levels, start, step){
    return { levels:levels, vars:{ start:start, step:step, k:{int:[1,9]}, v:'start + k*step' }, where:['k != 5'], answer:'v',
      extras:['v+step','v-step','v+2*step','v-2*step','start+(10-k)*step','v+10'],
      question:'Quel nombre indique la flèche ?', sub:'Regarde de combien on avance à chaque graduation : {step}.',
      explain:'Chaque graduation vaut {step}. La flèche est à la graduation numéro {k} : {k} × {step}{start ? \' + \' + start : \'\'} = {v}.',
      scene:{ type:'numberline', start:'start', step:'step', nb:10, labelEvery:5, k:'k' } };
  }
  registerTemplateType({ id:'droite', domain:'nombres', tag:'Nombres', label:'Droite graduée', longLabel:'Droite graduée : lire un nombre', defaultLevels:[0,1,2],
    levels:[ { steps:[1] }, { steps:[10,20] }, { steps:[100,50,10] } ],
    forms:[
      droiteForm([0], 0, 1),
      droiteForm([1], 0, 10), droiteForm([1], 0, 20),
      droiteForm([2], 0, 100), droiteForm([2], {int:[0,8], step:100}, 10), droiteForm([2], 0, 50)
    ],
    note:'Lire le nombre pointé par une flèche sur une droite de 10 graduations. Facile : de {liste(steps0)} en {liste(steps0)} ; Moyen : de {liste(steps1)} ; Difficile : de {liste(steps2)} (le pas de 10 se lit entre deux centaines).' });

  // -- Comparer (<, =, >) --
  registerTemplateType({ id:'compare', domain:'calcul', label:'Comparer', longLabel:'Comparer des nombres (<, >, =)', defaultLevels:[0,1,2],
    levels:[ { lo:0, hi:20, pExpr:0 }, { lo:5, hi:30, pExpr:0.6 }, { lo:5, hi:99, pExpr:0.75 } ],
    forms:[
      { w:'1 - pExpr', vars:{ a:{int:['lo','hi']}, b:'rand() < 0.2 ? a : lo + floor(rand()*(hi-lo+1))' }, answer:'signe(a,b)', options:['<','=','>'],
        question:'Quel signe faut-il mettre : {a} … {b} ?', sub:'< veut dire « plus petit que », > « plus grand que », = « égal à ».',
        explain:'{compareExplain(a,b)}', eq:'{a}  ?  {b}' },
      // deux additions à comparer ; une fois sur trois, elles ont la même somme (8 + 5 et 9 + 4)
      { w:'pExpr', vars:{ a:{int:[1,15]}, b:{int:[1,15]}, same:'rand() < 0.34',
          c:{int:['same ? max(1, a+b-15) : 1', 'same ? min(15, a+b-1) : 15']}, d:'same ? a+b-c : 1 + floor(rand()*15)' },
        where:['!same || (c != a && c != b) || tries >= 10'], answer:'signe(a+b, c+d)', options:['<','=','>'],
        question:'Quel signe faut-il mettre : {a} + {b} … {c} + {d} ?', sub:'< veut dire « plus petit que », > « plus grand que », = « égal à ».',
        explain:'{a} + {b} = {a+b} et {c} + {d} = {c+d}. {compareExplain(a+b, c+d)}', eq:'{a} + {b}  ?  {c} + {d}' }
    ],
    note:'Choisir le bon signe. Facile : deux nombres de {lo0} à {hi0} ; Moyen : de {lo1} à {hi1}, et {round(pExpr1*100)} % du temps deux additions à comparer ; Difficile : de {lo2} à {hi2}, {round(pExpr2*100)} % d\'additions. Parfois les deux côtés sont égaux.' });
