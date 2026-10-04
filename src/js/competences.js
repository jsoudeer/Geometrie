  /* ===================== COMPÉTENCES DE PERSONNAGE =====================
     Une compétence est une micro-situation de maths que le joueur résout en Bataille : un bon calcul donne
     de gros dégâts, une erreur donne seulement des dégâts normaux (jamais de pénalité). Elle apparaît
     sur une de ses cartes tous les `every` tours du joueur (un seul déclencheur à la fois) ; la carte
     reste « chargée » tant qu'elle ne l'a pas utilisée.
       - un personnage RARE ou de DÉFI a sa compétence dès le départ ;
       - un personnage COMMUN gagne la sienne quand il atteint le niveau maximal (Ultime) ;
       - monter de niveau l'améliore (SKILL_LEVELS) : dégâts ×2 → ×2,5, puis déclenchement tous les 2 tours.
     Chaque personnage a UNE compétence, attribuée une fois pour toutes (SKILL_BY_ID, tirée au hasard, chaque
     compétence 7 fois). Ajouter une compétence = une entrée dans SKILLS + une ligne par personnage ci-dessous.
     `ask(lvl)` : question de la compétence selon son niveau (0, 1, 2) → { text, options:[{label, ok}], explain }.
     La compétence « boost » (compare ×m et N dégâts fixes) est traitée à part par la Bataille. */
  var SKILL_LEVELS = [
    { every:3, mult:2,   text:'dégâts ×2, tous les 3 tours' },
    { every:3, mult:2.5, text:'dégâts ×2,5, tous les 3 tours' },
    { every:2, mult:2.5, text:'dégâts ×2,5, tous les 2 tours' }
  ];
  var BOOST_FACTORS = [1, 0.7, 1.3];   // « N dégâts fixes » vaut le ×m, 30 % de moins ou 30 % de plus
  function skFmtMult(m){ return '×' + String(m).replace('.', ','); }
  // 3 propositions (la bonne + 2 voisines au hasard), mélangées.
  function skOptions(correct, near, fmt){
    var wrong = [];
    near.concat([correct-1, correct+1, correct-2, correct+2, correct+10]).forEach(function(v){ if(v!==correct && v>=0 && wrong.indexOf(v)===-1) wrong.push(v); });
    var opts = shuffle([{ v:correct, ok:true }].concat(shuffle(wrong).slice(0,2).map(function(v){ return { v:v, ok:false }; })));
    return opts.map(function(o){ return { label: fmt ? fmt(o.v) : String(o.v), ok:o.ok }; });
  }
  function skHour(h){ return ((h - 1 + 12) % 12) + 1; }
  var SKILLS = {
    boost: { id:'boost', icon:'🎁', name:'Doubler ou fixe', theme:'comparer, doubles',
      desc:'Choisis entre les dégâts multipliés et un nombre de dégâts fixes : calcule pour prendre le plus grand.' },
    complement: { id:'complement', icon:'🧩', name:'Complément', theme:'compléments à 10, 20, 100',
      desc:'Trouve ce qu\'il manque pour arriver à 10, puis 20, puis 100.',
      ask:function(lvl){
        var T = [10,20,100][lvl], a = lvl===2 ? randInt(1,19)*5 : randInt(1, T-1), c = T - a;
        return { text:'Pour aller de ' + a + ' à ' + T + ', il manque combien ?', options:skOptions(c, lvl===2 ? [c-5, c+5, c-10] : []), explain:a + ' + ' + c + ' = ' + T + '.' };
      } },
    table: { id:'table', icon:'✖️', name:'Table de multiplication', theme:'tables de multiplication',
      desc:'Retrouve le résultat d\'une table : 2 et 10, puis 5, puis 3, 4 et 5.',
      ask:function(lvl){
        var a = pick([[2,10],[2,5,10],[3,4,5]][lvl]), b = randInt(2,9), c = a * b;
        return { text:'Combien font ' + a + ' × ' + b + ' ?', options:skOptions(c, [c-a, c+a, c+b]), explain:a + ' × ' + b + ' = ' + c + '.' };
      } },
    double: { id:'double', icon:'👯', name:'Doubles', theme:'doubles',
      desc:'Calcule le double d\'un nombre, de plus en plus grand.',
      ask:function(lvl){
        var n = randInt(2, [10,25,50][lvl]), c = n * 2;
        return { text:'Quel est le double de ' + n + ' ?', options:skOptions(c, [c-2, c+2, n+2]), explain:'Le double de ' + n + ', c\'est ' + n + ' + ' + n + ' = ' + c + '.' };
      } },
    moitie: { id:'moitie', icon:'🍰', name:'Moitiés', theme:'moitiés',
      desc:'Trouve la moitié d\'un nombre pair, de plus en plus grand.',
      ask:function(lvl){
        var c = randInt(1, [10,25,50][lvl]), n = c * 2;
        return { text:'Quelle est la moitié de ' + n + ' ?', options:skOptions(c, [c-1, c+1, n]), explain:'La moitié de ' + n + ', c\'est ' + c + ', car ' + c + ' + ' + c + ' = ' + n + '.' };
      } },
    plusgrand: { id:'plusgrand', icon:'🔝', name:'Le plus grand', theme:'comparer des nombres',
      desc:'Reconnais le plus grand de trois nombres (jusqu\'à 20, puis 99, puis 999).',
      ask:function(lvl){
        var lo = [1,10,100][lvl], hi = [20,99,999][lvl], v = [];
        while(v.length < 3){ var x = randInt(lo, hi); if(v.indexOf(x) === -1) v.push(x); }
        var best = Math.max.apply(null, v);
        return { text:'Quel est le plus grand nombre : ' + v.join(', ') + ' ?', options:shuffle(v.map(function(x){ return { label:String(x), ok:x===best }; })), explain:best + ' est le plus grand des trois.' };
      } },
    heure: { id:'heure', icon:'🕐', name:'Dans quelques heures', theme:'lire et calculer l\'heure',
      desc:'Calcule l\'heure qu\'il sera plus tard : heures pile, puis demi-heures, puis 1 h 30 ou 2 h 30 plus tard.',
      ask:function(lvl){
        var h = randInt(1,12), text, c, label = function(hh, half){ return hh + ' h' + (half ? ' 30' : ''); }, k, half = false, ans;
        if(lvl === 0){ k = randInt(1,3); text = 'Il est ' + label(h) + '. Quelle heure sera-t-il dans ' + k + ' h ?'; ans = [skHour(h + k), false]; }
        else if(lvl === 1){ k = randInt(1,3); text = 'Il est ' + label(h, true) + '. Quelle heure sera-t-il dans ' + k + ' h ?'; ans = [skHour(h + k), true]; }
        else if(rnd() < 0.5){ text = 'Il est ' + label(h, true) + '. Quelle heure sera-t-il dans 1 h 30 ?'; ans = [skHour(h + 2), false]; }
        else { text = 'Il est ' + label(h) + '. Quelle heure sera-t-il dans 2 h 30 ?'; ans = [skHour(h + 2), true]; }
        var right = label(ans[0], ans[1]), wrong = [label(skHour(ans[0] + 1), ans[1]), label(skHour(ans[0] - 1), ans[1]), label(ans[0], !ans[1])];
        var opts = shuffle([{ label:right, ok:true }].concat(shuffle(wrong).slice(0,2).map(function(w){ return { label:w, ok:false }; })));
        return { text:text, options:opts, explain:'Il sera ' + right + '.' };
      } },
    monnaie: { id:'monnaie', icon:'💶', name:'Rendre la monnaie', theme:'monnaie, soustraction',
      desc:'Calcule la monnaie rendue sur 10 €, puis 20 €, puis 50 €.',
      ask:function(lvl){
        var P = [10,20,50][lvl], cost = randInt(1, P - 1), c = P - cost;
        return { text:'Tu paies ' + P + ' € un objet à ' + cost + ' €. Combien te rend-on ?', options:skOptions(c, [c-1, c+1, cost], function(v){ return v + ' €'; }), explain:P + ' - ' + cost + ' = ' + c + ' €.' };
      } },
    partage: { id:'partage', icon:'🤝', name:'Partage équitable', theme:'partage, division',
      desc:'Partage des objets entre des amis : 2 amis, puis 2 à 5, puis jusqu\'à 10.',
      ask:function(lvl){
        var k = lvl===0 ? 2 : lvl===1 ? randInt(2,5) : randInt(3,10), q = randInt(2, lvl===0 ? 9 : 10), n = k * q, o = objetAuHasard('jeu');
        return { text:'On partage ' + nbObjet(n, o) + ' entre ' + k + ' amis. Combien en reçoit chacun ?', options:skOptions(q, [q-1, q+1, n - k]), explain:n + ' ÷ ' + k + ' = ' + q + ', car ' + k + ' × ' + q + ' = ' + n + '.' };
      } },
    suite: { id:'suite', icon:'🔢', name:'Suite de nombres', theme:'suites de nombres',
      desc:'Trouve le nombre suivant d\'une suite : de 2 en 2, de 5 en 5, de 10 en 10, puis des pas plus grands.',
      ask:function(lvl){
        var s = pick([[2,5,10],[3,4,5,10,20],[6,7,8,9,25,50]][lvl]), d = randInt(1,4) * s, a = d, c = a + 3 * s;
        if(lvl === 2 && rnd() < 0.5){ a = d + 3 * s; c = a - 3 * s; s = -s; }
        var seq = [a, a + s, a + 2 * s];
        return { text:'Continue la suite : ' + seq.join(', ') + ', … ?', options:skOptions(c, [c + Math.abs(s), c - Math.abs(s), c + 1]), explain:'On avance de ' + Math.abs(s) + (s < 0 ? ' en reculant' : '') + ' à chaque fois : ' + seq.join(', ') + ', ' + c + '.' };
      } }
  };
  var SKILL_BY_ID = {
    cat01:'double', cat02:'complement', cat03:'table', cat04:'table', cat05:'table',
    cat06:'partage', cat07:'plusgrand', cat08:'complement', cat09:'heure', cat10:'monnaie',
    cat11:'partage', cat12:'monnaie', cat13:'plusgrand', cat14:'heure', cat15:'moitie',
    cat16:'suite', cat17:'moitie', cat18:'partage', cat19:'plusgrand', cat20:'table',
    cat21:'table', cat22:'double', cat23:'moitie', cat24:'plusgrand', cat25:'partage',
    cat26:'boost', cat27:'suite', cat28:'suite', cat29:'boost', cat30:'partage',
    cat31:'complement', cat32:'boost', cat33:'heure', cat34:'suite', cat35:'suite',
    br01:'boost', br02:'double', br03:'boost', br04:'double', br05:'monnaie',
    br06:'moitie', br07:'monnaie', br08:'heure', br09:'monnaie', br10:'moitie',
    br11:'double', br12:'complement', br13:'complement', br14:'table', br15:'double',
    br16:'complement', br17:'monnaie', br18:'complement', br19:'suite', br20:'partage',
    br21:'heure', br22:'moitie', br23:'double', br24:'monnaie', br25:'plusgrand',
    br26:'plusgrand', br27:'boost', br28:'boost', br29:'heure', br30:'moitie',
    br31:'plusgrand', br32:'suite', br33:'partage', br34:'heure', br35:'table'
  };
  // Compétence active d'un personnage à un niveau : un commun ne l'a qu'au niveau maximal. Renvoie l'objet SKILLS ou null.
  function skillFor(sprite, level){
    var id = SKILL_BY_ID[sprite.id];
    if(!id) return null;
    if(sprite.rarity === 'commun' && level < EVO_MAX) return null;
    return SKILLS[id];
  }
  function skillOf(sprite){ return SKILLS[SKILL_BY_ID[sprite.id]] || null; }
  // Ligne descriptive pour la Boutique : « 🧩 Complément (×2,5) » ou « 🔒 Compétence : au niveau Ultime ».
  function skillLine(sprite, level){
    var sk = skillFor(sprite, level);
    if(!sk) return '🔒 Compétence au niveau ' + EVO_NAMES[EVO_MAX];
    return sk.icon + ' ' + sk.name + ' (' + skFmtMult(SKILL_LEVELS[Math.min(level, SKILL_LEVELS.length - 1)].mult) + ')';
  }
