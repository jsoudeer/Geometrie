  /* ===================== FICHES D'ACTIVITÉS : heure et calendrier =====================
     Lire l'heure, Choisir l'horloge, Calendrier : décrits par des données (moteur : gabarits.js).
     Scènes : `clock` (horloge à aiguilles) ; banques de textes JOURS / MOIS ; réponses de texte (`wrong`) ;
     choix d'une figure (`figures`). Les fonctions ci-dessous sont les seuls calculs que les fiches ne savent pas écrire. */

  TEMPLATE_FNS.clockLabel = minutesToClockLabel;                 // 90 -> « 1 h 30 » (cadran : 1 à 12)
  TEMPLATE_FNS.clockLabel24 = minutesToLabel24;                   // 1050 -> « 17 h 30 » (0 h à 23 h)
  TEMPLATE_FNS.clockExplain = clockExplain;                       // clockExplain(h, m, « 3 h 30 »)
  TEMPLATE_FNS.periodPhrase = function(h){ return periodOfDay(h).phrase; };
  TEMPLATE_FNS.periodEmoji = function(h){ return periodOfDay(h).emoji; };
  // trois fausses heures voisines (au pas des minutes du niveau) pour un cadran de 12 h
  TEMPLATE_FNS.heureWrong12 = function(total, step){
    var seen = {}, pool = []; seen[minutesToClockLabel(total)] = true;
    [-3,-2,-1,1,2,3].forEach(function(k){
      var l = minutesToClockLabel(((total + k*step) % 720 + 720) % 720);
      if(!seen[l]){ seen[l] = true; pool.push(l); }
    });
    return shuffle(pool).slice(0, 3);
  };
  // 24 h : le piège classique (oublier d'ajouter ou de retirer 12 h) et deux heures voisines à 5, 10 ou 15 minutes près
  TEMPLATE_FNS.heureWrong24 = function(total){
    var seen = {}, near = [], shifted = minutesToLabel24((total + 720) % 1440);
    seen[minutesToLabel24(total)] = true; seen[shifted] = true;
    [-3,-2,-1,1,2,3].forEach(function(k){
      var l = minutesToLabel24(((total + k*5) % 1440 + 1440) % 1440);
      if(!seen[l]){ seen[l] = true; near.push(l); }
    });
    return [shifted].concat(shuffle(near).slice(0, 2));
  };
  TEMPLATE_FNS.heure24Explain = function(hour, m){
    var total = hour*60 + m, label = minutesToLabel24(total), period = periodOfDay(hour);
    var ex = clockExplain(hour, m, minutesToClockLabel(total) + ' sur l\'horloge');
    if(hour === 0) return ex + ' Juste après minuit, l\'horloge montre 12 mais on dit 0 h : il est ' + label + '.';
    if(hour >= 13) return ex + ' Comme c\'est ' + period.phrase + ', on ajoute 12 h : ' + (hour-12) + ' + 12 = ' + hour + '. Il est donc ' + label + '.';
    return ex + ' Comme c\'est ' + period.phrase + ', l\'heure ne change pas : on garde ' + label + '.';
  };
  // 4 horloges [h, m] dont la première est la bonne ; les autres sont des pièges : aiguilles échangées, heure ou minutes d'à côté
  TEMPLATE_FNS.clockOptions = function(h, m, level){
    var options = [[h, m]], used = {};
    function key(hh, mm){ return ((hh%12)*60 + mm) + ''; }
    used[key(h, m)] = true;
    function add(hh, mm){
      hh = ((hh-1+12)%12)+1; mm = ((mm%60)+60)%60;
      if(used[key(hh, mm)]) return false;
      used[key(hh, mm)] = true; options.push([hh, mm]); return true;
    }
    if(m % 5 === 0) add(m===0 ? 12 : m/5, h*5 % 60);
    add(h+1, m); add(h-1, m);
    var tries = 0;
    while(options.length < 4 && tries++ < 50){ add(h, m + pick(level===0 ? [30] : [15,30,45,5,10])); if(options.length < 4) add(h + pick([-2,2,3]), m); }
    if(options.length < 4) throw new Error('horloges : pas assez de pièges différents');
    var good = options[0], rest = options.slice(1);
    return [good].concat(rest.slice(0, 3));      // la bonne en tête ; le moteur mélange
  };

  // -- Lire l'heure (cadran de 12 h ; en Difficile, 0 h à 23 h avec le moment de la journée) --
  registerTemplateType({ id:'heure', domain:'temps', label:'Lire l\'heure', longLabel:'Lire l\'heure (QCM)', defaultLevels:[0,1,2], tag:'Lire l\'heure',
    levels:[ { mins:[0,30], step:30 }, { mins:[0,15,30,45], step:15 }, {} ],
    forms:[
      { levels:[0,1], vars:{ hour:{int:[1,12]}, m:{pick:'mins'}, total:'(hour%12)*60+m', lab:'clockLabel(total)' }, answer:'lab', wrong:'heureWrong12(total,step)',
        question:'Quelle heure indique cette horloge ?', sub:'Regarde bien la petite aiguille (les heures) et la grande (les minutes).',
        explain:'{clockExplain(hour,m,lab)}', scene:{ type:'clock', h:'hour', m:'m' } },
      { levels:[2], vars:{ hour:{int:[0,23]}, m:{pick:[0,5,10,15,20,25,30,35,40,45,50,55]}, total:'hour*60+m' }, answer:'clockLabel24(total)', wrong:'heureWrong24(total)',
        question:'C\'est {periodPhrase(hour)} {periodEmoji(hour)}. Quelle heure indique cette horloge ?',
        sub:'Les heures vont de 0 h à 23 h (l\'après-midi : 13 h, 14 h, 15 h…). Regarde bien les deux aiguilles.',
        explain:'{heure24Explain(hour,m)}', scene:{ type:'clock', h:'hour', m:'m' } }
    ],
    note:'L\'heure affichée est tirée au hasard. C\'est le NIVEAU qui fixe la précision autorisée : à l\'heure pile/demie en Facile, + quarts d\'heure en Moyen, en Difficile toutes les 5 min ET les heures de 0 h à 23 h (l\'énoncé donne le moment de la journée : nuit, matin, après-midi, soir ; le piège : oublier d\'ajouter 12 h l\'après-midi).' });

  // -- Choisir la bonne horloge parmi 4 dessins --
  registerTemplateType({ id:'horlogeChoix', domain:'temps', label:'Choisir l\'horloge (visuel)', longLabel:'Choisir la bonne horloge (dessins)', defaultLevels:[0,1,2], tag:'Lire l\'heure',
    levels:[ { steps:[0,30] }, { steps:[0,15,30,45] }, { steps:[0,5,10,15,20,25,30,35,40,45,50,55] } ],
    forms:[
      { vars:{ h:{int:[1,12]}, m:{pick:'steps'}, lab:'clockLabel(h*60+m)', opts:'clockOptions(h,m,level)' }, answer:'0',
        question:'Quelle horloge indique {lab} ?', sub:'La petite aiguille montre l\'heure, la grande aiguille les minutes.',
        explain:'{clockExplain(h,m,lab)}', eq:'{lab}', figures:{ scene:'clock', items:'opts', label:'Horloge' } }
    ],
    note:'L\'heure est écrite en chiffres ; on choisit parmi 4 horloges dessinées. Les mauvaises réponses sont des pièges : aiguilles échangées, heure d\'à côté, minutes d\'à côté. Facile : heures pile et demies ; Moyen : + quarts ; Difficile : toutes les 5 minutes.' });

  // -- Calendrier : jours de la semaine et mois (banques JOURS et MOIS) --
  var CAL_SUB = 'Réfléchis à l\'ordre des jours ou des mois.';
  var CAL_SCENE = { type:'emoji', icon:"'📅'", caption:'' };
  registerTemplateType({ id:'calendrier', domain:'temps', label:'Calendrier', longLabel:'Calendrier (jours, mois)', defaultLevels:[0,1,2], tag:'Calendrier',
    levels:[ {}, {}, {} ],
    forms:[
      { levels:[0,1], vars:{ i:{int:[0,6]} }, answer:'at(JOURS,i+1)', wrong:'others(JOURS,at(JOURS,i+1),3)',
        question:'Quel jour vient juste après {at(JOURS,i)} ?', sub:CAL_SUB, explain:'Après {at(JOURS,i)} vient {at(JOURS,i+1)}.', scene:CAL_SCENE },
      { levels:[0,1], vars:{ i:{int:[0,6]} }, answer:'at(JOURS,i-1)', wrong:'others(JOURS,at(JOURS,i-1),3)',
        question:'Quel jour vient juste avant {at(JOURS,i)} ?', sub:CAL_SUB, explain:'Avant {at(JOURS,i)} il y a {at(JOURS,i-1)}.', scene:CAL_SCENE },
      { levels:[0], vars:{}, answer:"'7 jours'", wrong:"others(['5 jours','6 jours','7 jours','8 jours','10 jours'],'7 jours',3)",
        question:'Combien y a-t-il de jours dans une semaine ?', sub:CAL_SUB, explain:'La semaine a 7 jours : lundi, mardi, mercredi, jeudi, vendredi, samedi, dimanche.', scene:CAL_SCENE },
      { levels:[1], vars:{}, answer:"'12 mois'", wrong:"others(['10 mois','11 mois','12 mois','13 mois','52 mois'],'12 mois',3)",
        question:'Combien y a-t-il de mois dans une année ?', sub:CAL_SUB, explain:'L\'année a 12 mois, de janvier à décembre.', scene:CAL_SCENE },
      { levels:[1,2], vars:{ m:{int:[0,11]} }, answer:'at(MOIS,m+1)', wrong:'others(MOIS,at(MOIS,m+1),3)',
        question:'Quel mois vient juste après {at(MOIS,m)} ?', sub:CAL_SUB, explain:'Après {at(MOIS,m)} vient {at(MOIS,m+1)}.', scene:CAL_SCENE },
      { levels:[1,2], vars:{ m:{int:[0,11]} }, answer:'at(MOIS,m-1)', wrong:'others(MOIS,at(MOIS,m-1),3)',
        question:'Quel mois vient juste avant {at(MOIS,m)} ?', sub:CAL_SUB, explain:'Avant {at(MOIS,m)} il y a {at(MOIS,m-1)}.', scene:CAL_SCENE },
      { levels:[2], vars:{ a:{int:[0,6]}, gap:{int:[2,5]} }, answer:"gap+' jours'", wrong:"others(['2 jours','3 jours','4 jours','5 jours','6 jours'],gap+' jours',3)",
        question:'Combien de jours passent de {at(JOURS,a)} à {at(JOURS,a+gap)} ?', sub:'Compte les jours qui passent, un par un.',
        explain:'De {at(JOURS,a)} à {at(JOURS,a+gap)}, on avance de {gap} jours.', scene:CAL_SCENE },
      { levels:[2], w:2, vars:{ i:{int:[0,6]}, n:{int:[2,6]}, fwd:'rand()<0.6' }, answer:'at(JOURS,i+(fwd?n:-n))', wrong:'others(JOURS,at(JOURS,i+(fwd?n:-n)),3)',
        question:"Aujourd'hui, c'est {at(JOURS,i)}. Quel jour {fwd ? 'sera-t-on dans '+n+' jours ?' : 'était-on il y a '+n+' jours ?'}",
        sub:"Compte les jours un par un, en {fwd ? 'avançant' : 'reculant'}.",
        explain:"À partir de {at(JOURS,i)}, on {fwd ? 'avance' : 'recule'} de {n} jours : on arrive à {at(JOURS,i+(fwd?n:-n))}.", scene:CAL_SCENE }
    ],
    note:'Facile : jour d\'avant / d\'après, jours dans la semaine. Moyen : + mois d\'avant / d\'après, mois dans l\'année. Difficile : « dans 4 jours / il y a 3 jours », nombre de jours entre deux jours, mois.' });
