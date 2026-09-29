  /* ===================== QUIZZ (moteur) + ORCHESTRATEUR + CONFIGURATION DES ACTIVITÉS =====================
     Moteur du Quizz : registre des types, niveaux, tirage, affichage, correction.
     Puis l'orchestrateur (niveaux, chrono, séries) et le panneau de configuration.
  */

  /* ===================== MODULE 4 : QCM FORMES =====================
     Deux familles de questions, comme discuté :
     - "procédural" : la forme est dessinée par le code (SVG), à l'infini,
       aucune image stockée nécessaire.
     - "image" : s'appuie sur une illustration fixe (ici une petite scène
       dessinée à la main en SVG, qui tient lieu de prototype pour une
       vraie image stockée plus tard — voir la réponse ci-dessous).
  */
  var TYPE_LABELS = {
    sides:'Côtés', vertices:'Sommets', name:'Nom', angle:'Angles', image:'Image', calc:'Calcul',
    align:'Alignement', milieu:'Milieu', coord:'Coordonnées', coordFind:'Repérage', codage:'Déplacement',
    decodage:'Trajet', chasse:'Chasse aux formes', symAxe:'Symétrie', symVrai:'Symétrie (vrai/faux)',
    solideNom:'Solides', solideCompte:'Compter les solides', monnaie:'Monnaie', heure:'Lire l\'heure',
    enigme:'Énigme', vie:'Maths de la vie'
  };

  // Chaque type de question du Quizz (module 4) est déclaré une fois ici,
  // avec ses niveaux PAR DÉFAUT (defaultLevels) et une note qui explique ce
  // qui est tiré au hasard vs fixe pour ce type précis. Le panneau de
  // réglages "Activités & difficulté" peut surcharger defaultLevels (voir
  // typeLevelOverrides / rebuildM4Types plus bas dans l'orchestrateur), qui
  // reconstruit alors M4_LEVELS[*].types à partir de ces définitions —
  // qcmTypeLevels() (mode Manuel) lit donc toujours le résultat à jour.
  var QCM_TYPE_DEFS = [
    { id:'sides',        label:TYPE_LABELS.sides,        defaultLevels:[0,1,2],
      randomNote:'La forme est tirée au hasard parmi celles autorisées à ce niveau ; son nombre de côtés en découle de façon fixe (ce n\'est pas lui qui est tiré, seule la forme l\'est).' },
    { id:'vertices',     label:TYPE_LABELS.vertices,     defaultLevels:[0,1,2],
      randomNote:'Même principe que "Côtés" : la forme est tirée au hasard, son nombre de sommets en découle de façon fixe.' },
    { id:'name',         label:TYPE_LABELS.name,         defaultLevels:[0,1,2],
      randomNote:'La forme est tirée au hasard parmi celles du niveau ; son nom est fixe une fois la forme choisie.' },
    { id:'calc',         label:TYPE_LABELS.calc,         defaultLevels:[0,1,2],
      randomNote:'Les nombres de l\'opération sont tirés au hasard. C\'est le NIVEAU qui fixe la plage (jusqu\'à 10 en Facile, jusqu\'à 20 en Moyen/Difficile) et, en Difficile, la possibilité de tirer une variante "trouve le nombre manquant".' },
    { id:'align',        label:TYPE_LABELS.align,        defaultLevels:[0,1,2],
      randomNote:'Les 3 points (alignés ou non) et leur disposition sont tirés au hasard à chaque question.' },
    { id:'milieu',       label:TYPE_LABELS.milieu,       defaultLevels:[0,1,2],
      randomNote:'La position du segment et les formes-repères sont tirées au hasard à chaque question.' },
    { id:'coord',        label:TYPE_LABELS.coord,        defaultLevels:[0,1,2],
      randomNote:'Le point marqué sur le quadrillage est tiré au hasard ; ses coordonnées en découlent de façon fixe.' },
    { id:'solideNom',    label:TYPE_LABELS.solideNom,    defaultLevels:[0,1,2],
      randomNote:'Le solide est tiré au hasard parmi les 6 solides connus ; son nom (la réponse) en découle de façon fixe.' },
    { id:'monnaie',      label:TYPE_LABELS.monnaie,      defaultLevels:[0,1,2],
      randomNote:'Le nombre de pièces/billets et leurs valeurs sont tirés au hasard à chaque question.' },
    { id:'heure',        label:TYPE_LABELS.heure,        defaultLevels:[0,1,2],
      randomNote:'L\'heure affichée est tirée au hasard. C\'est le NIVEAU qui fixe la précision autorisée : à l\'heure pile/demie en Facile, + quarts d\'heure en Moyen, n\'importe quelle tranche de 5 min en Difficile.' },
    { id:'angle',        label:TYPE_LABELS.angle,        defaultLevels:[1,2],
      randomNote:'La catégorie (droit/aigu/obtus) et la valeur en degrés sont tirées au hasard. C\'est le NIVEAU qui resserre l\'écart minimum autour de 90° (14° en Moyen, 7° en Difficile), rendant la distinction plus fine à l\'œil.' },
    { id:'image',        label:TYPE_LABELS.image,        defaultLevels:[1,2],
      randomNote:'La scène est tirée au hasard parmi 5 illustrations fixes (maison, clôture, château, robot, train) ; certaines valeurs (nombre de wagons, présence d\'une fenêtre...) varient aussi au hasard à l\'intérieur d\'une même scène.' },
    { id:'coordFind',    label:TYPE_LABELS.coordFind,    defaultLevels:[1,2],
      randomNote:'Les 4 cases et les formes qui s\'y trouvent sont tirées au hasard à chaque question.' },
    { id:'codage',       label:TYPE_LABELS.codage,       defaultLevels:[1,2],
      randomNote:'Le point de départ et la suite de flèches (2 à 3 déplacements) sont tirés au hasard.' },
    { id:'chasse',       label:TYPE_LABELS.chasse,       defaultLevels:[1,2],
      randomNote:'Le nombre et la disposition des formes affichées sont tirés au hasard à chaque question.' },
    { id:'symAxe',       label:TYPE_LABELS.symAxe,       defaultLevels:[1,2],
      randomNote:'La position des 3 droites candidates est tirée au hasard ; le triangle est toujours isocèle, donc il y a toujours exactement un vrai axe de symétrie parmi elles (règle fixe).' },
    { id:'solideCompte', label:TYPE_LABELS.solideCompte, defaultLevels:[1,2],
      randomNote:'Le solide (cube/pavé/pyramide) et l\'attribut demandé (faces/sommets/arêtes) sont tirés au hasard ; le nombre correspondant est ensuite fixe pour ce solide.' },
    { id:'vie',          label:TYPE_LABELS.vie,          defaultLevels:[1,2],
      randomNote:'Le modèle de problème est tiré au hasard parmi 6 scénarios fixes, puis les nombres de l\'énoncé sont eux aussi tirés au hasard à l\'intérieur de chaque modèle.' },
    { id:'decodage',     label:TYPE_LABELS.decodage,     defaultLevels:[2],
      randomNote:'Les points de départ/arrivée et les propositions de trajet erronées sont tirés au hasard à chaque question.' },
    { id:'symVrai',      label:TYPE_LABELS.symVrai,      defaultLevels:[2],
      randomNote:'La droite proposée est parallèle à un côté (jamais une diagonale, qui prêtait à confusion) : soit exactement au milieu (vrai axe), soit décalée d\'un pourcentage variable (10 à 90%, jamais 50%) tiré au hasard.' },
    { id:'enigme',       label:TYPE_LABELS.enigme,       defaultLevels:[2],
      randomNote:'L\'énigme est tirée au hasard dans une banque FIXE de 24 énigmes (texte non généré : toujours les mêmes formulations).' }
  ];
  // types rempli par rebuildM4Types() (appelée après le chargement des
  // éventuelles surcharges manuelles, voir plus bas) — jamais laissé vide.
  var M4_LEVELS = [
    { name:'Facile',
      shapes:['triangle','carre','rectangle'],
      types:[],
      angleGap:20, calcModes:['add'], calcMax:10 },
    { name:'Moyen',
      shapes:['triangle','carre','rectangle','pentagone','hexagone','cercle'],
      types:[],
      angleGap:14, calcModes:['add'], calcMax:20 },
    { name:'Difficile',
      shapes:['triangle','carre','rectangle','pentagone','hexagone','cercle','losange'],
      types:[],
      angleGap:7, calcModes:['add','missing'], calcMax:20 }
  ];
  var m4TypeFilter = 'random';
  var m4Current = null;

  function genQuestion(){
    var lv = M4_LEVELS[globalLevel];
    var type = (m4TypeFilter!=='random' && lv.types.indexOf(m4TypeFilter)!==-1) ? m4TypeFilter : pick(lv.types);

    if(type==='sides' || type==='vertices'){
      var shapeKey = pick(lv.shapes);
      var meta = SHAPE_META[shapeKey];
      var correct = (type==='sides') ? meta.sides : meta.vertices;
      var choices = numChoiceSet(correct, [0,1,2,3,4,5,6,7,8]);
      return {
        tag: type==='sides' ? 'Côtés' : 'Sommets',
        question: type==='sides' ? 'Combien de côtés a cette forme ?' : 'Combien de sommets (angles) a cette forme ?',
        sub: meta.isCircle ? 'Regarde bien : cette forme est-elle vraiment pointue quelque part ?' : 'Observe bien la forme, puis choisis la bonne réponse.',
        explain: 'Un ' + meta.label + ' a ' + meta.sides + ' côtés et ' + meta.vertices + ' sommets. ' + meta.note,
        draw: function(){ drawShapeGeneric(meta); },
        cols3: false,
        choices: choices.map(function(v){ return { label:String(v), ok: v===correct }; })
      };
    }

    if(type==='name'){
      var shapeKey2 = pick(lv.shapes);
      var meta2 = SHAPE_META[shapeKey2];
      var pool = shuffle(NAME_POOL.filter(function(n){return n!==meta2.label;})).slice(0,3);
      var labels = shuffle([meta2.label].concat(pool));
      return {
        tag: 'Nom de la forme',
        question: 'Quel est le nom de cette forme ?',
        sub: 'Observe bien la forme, puis choisis son nom.',
        explain: 'C\'est un ' + meta2.label + '. ' + meta2.note,
        draw: function(){ drawShapeGeneric(meta2); },
        cols3: false,
        choices: labels.map(function(l){ return { label:l, ok: l===meta2.label }; })
      };
    }

    if(type==='angle'){
      var cat = pick(['droit','aigu','obtus']);
      var gap = lv.angleGap;
      var angleDeg;
      if(cat==='droit') angleDeg = 90;
      else if(cat==='aigu') angleDeg = Math.round(rand(20, 90-gap));
      else angleDeg = Math.round(rand(90+gap, 165));
      var angleExplain = {
        droit: 'Cet angle a exactement la forme du coin d\'une feuille ou d\'un carré : c\'est un angle droit (90°).',
        aigu: 'Compare-le au coin d\'une feuille : cet angle est plus fermé (plus pointu) que le coin, donc c\'est un angle aigu.',
        obtus: 'Compare-le au coin d\'une feuille : cet angle est plus ouvert que le coin, donc c\'est un angle obtus.'
      };
      return {
        tag: 'Angles',
        question: 'Cet angle est-il droit, aigu ou obtus ?',
        sub: 'Regarde bien l\'écart entre les deux traits.',
        explain: angleExplain[cat],
        draw: function(){ drawAngle(angleDeg); },
        cols3: true,
        choices: shuffle(['droit','aigu','obtus']).map(function(c){ return { label:c, ok: c===cat }; })
      };
    }

    if(type==='calc'){
      var mode = pick(lv.calcModes || ['add']);
      var maxV = lv.calcMax || 10;
      if(mode==='missing'){
        // a + x = c : l'enfant retrouve x
        var a = randInt(0, maxV);
        var x = randInt(0, maxV - a);
        var c = a + x;
        return {
          tag: 'Calcul',
          question: 'Trouve x : ' + a + ' + x = ' + c,
          sub: 'Cherche le nombre qui manque pour que l\'égalité soit vraie.',
          explain: 'x = ' + c + ' - ' + a + ' = ' + x + ', car ' + a + ' + ' + x + ' = ' + c + '.',
          draw: function(){ drawEquation(a + ' + x = ' + c); },
          cols3: false,
          choices: numChoiceSet(x, [0,1,2,3,4,5,6,7,8,9,10,x+1,x+2,Math.max(0,x-1),Math.max(0,x-2)]).map(function(v){ return { label:String(v), ok: v===x }; })
        };
      }
      // addition simple : a + b
      var a2 = randInt(0, maxV);
      var b2 = randInt(0, maxV - a2);
      var sum = a2 + b2;
      return {
        tag: 'Calcul',
        question: 'Combien font ' + a2 + ' + ' + b2 + ' ?',
        sub: 'Calcule le résultat de cette addition.',
        explain: a2 + ' + ' + b2 + ' = ' + sum + '.',
        draw: function(){ drawEquation(a2 + ' + ' + b2 + ' = ?'); },
        cols3: false,
        choices: numChoiceSet(sum, [sum-2,sum-1,sum+1,sum+2,sum+3,Math.max(0,sum-3)].filter(function(v){return v>=0;})).map(function(v){ return { label:String(v), ok: v===sum }; })
      };
    }

    if(type==='align')      return genAlignQuestion();
    if(type==='milieu')     return genMilieuQuestion();
    if(type==='coord')      return genCoordQuestion();
    if(type==='coordFind')  return genCoordFindQuestion();
    if(type==='codage')     return genCodageQuestion();
    if(type==='decodage')   return genDecodageQuestion();
    if(type==='chasse')     return genChasseQuestion();
    if(type==='symAxe')     return genSymAxeQuestion();
    if(type==='symVrai')    return genSymVraiQuestion();
    if(type==='solideNom')  return genSolideNomQuestion();
    if(type==='solideCompte') return genSolideCompteQuestion();
    if(type==='monnaie')    return genMonnaieQuestion();
    if(type==='heure')      return genHeureQuestion('m4Svg', globalLevel);
    if(type==='enigme')     return genEnigmeQuestion();
    if(type==='vie')        return genVieQuestion();

    // type === 'image' : question basée sur une illustration fixe, tirée
    // d'un petit pool de scènes (prototype du circuit "images stockées",
    // voir la note sur le stockage d'images à côté du code)
    return pick(IMAGE_QUESTIONS)();
  }

  function newQCM(){
    m4Current = genQuestion();
    document.getElementById('practice-family-tag').textContent = m4Current.tag;
    document.getElementById('m4-question').textContent = m4Current.question;
    document.getElementById('m4-sub').textContent = m4Current.sub;
    m4Current.draw();
    setCoachReaction('neutral');
    var wrap = document.getElementById('m4-choices');
    wrap.className = 'qcm-choices' + (m4Current.cols3 ? ' cols3' : '');
    wrap.innerHTML = "";
    m4Current.choices.forEach(function(c){
      var b = document.createElement('button');
      b.className = 'choice-btn';
      b.type = 'button';
      b.textContent = c.label.charAt(0).toUpperCase()+c.label.slice(1);
      b.addEventListener('click', function(){ checkQCM(c, b); });
      wrap.appendChild(b);
    });
    var fb = document.getElementById('m4-feedback');
    fb.className='feedback'; fb.innerHTML='';
  }

  function checkQCM(choice, btn){
    var buttons = document.querySelectorAll('#m4-choices .choice-btn');
    buttons.forEach(function(b){ b.disabled = true; });
    var fb = document.getElementById('m4-feedback');
    if(choice.ok){
      btn.classList.add('correct');
      fb.className = 'feedback tappable good show';
      fb.innerHTML = '<div>✔ Bravo, c\'est la bonne réponse !</div><div class="explain-line">'+m4Current.explain+'</div>';
      addStar(1);
      setCoachReaction('good');
    } else {
      btn.classList.add('wrong');
      var okLabel = m4Current.choices.filter(function(c){return c.ok;})[0].label;
      buttons.forEach(function(b){ if(b.textContent.toLowerCase()===okLabel.toLowerCase()) b.classList.add('correct'); });
      fb.className = 'feedback tappable bad show';
      fb.innerHTML = '<div>✘ Pas tout à fait, regarde encore.</div><div class="explain-line">'+m4Current.explain+'</div>';
      setCoachReaction('bad');
    }
    playSound(choice.ok?'good':'bad');
    celebrate(choice.ok?'good':'bad', fb);
    onPracticeAnswered(choice.ok);
  }

  document.getElementById('m4-next').addEventListener('click', nextPracticeQuestion);
  enableTapToContinue('m4-feedback', nextPracticeQuestion);

  /* ===================== ENTRAINEMENT : ORCHESTRATEUR =====================
     Fusionne les anciens modules 1 à 5 en un seul menu à 3 niveaux (Facile/
     Moyen/Difficile). Le niveau choisi pilote directement M1_LEVELS,
     M2_LEVELS (via perturbForLevel), M3_LEVELS.pool, M4_LEVELS et
     genHeureQuestion — chacun lisait auparavant sa propre variable de
     niveau (m1Level, m3Level, m4Level...), remplacée ici par un seul
     "globalLevel" partagé. À chaque nouvelle question, une "famille"
     d'exercice est tirée au hasard et affichée dans #practice-exercise ;
     tout le reste (génération, correction, dessin) est inchangé et reste
     dans chaque module. */
  var globalLevel = 0;
  var practiceMode = 'free'; // 'free' | 'countdown'  (utilisé seulement en mode 'auto')
  var appMode = 'auto'; // 'auto' (Facile/Moyen/Difficile) | 'manual' (activité choisie à la main)
  var manualFamily = null;
  var currentFamily = null;
  var countdownScore = { correct:0, total:0 };
  var countdownRunning = false, countdownInterval = null, countdownEndAt = 0, countdownSeconds = 60;

  var FAMILY_TAGS = {
    measure:'Mesurer', deform:'Déformer', net:'Patron → Solide',
    qcm:'Quizz', 'clock-lire':'Lire l\'heure', 'clock-regler':'Régler l\'heure'
  };
  var FAMILY_WRAP_IDS = {
    measure:'fam-measure', deform:'fam-deform', net:'fam-net',
    qcm:'fam-qcm', 'clock-lire':'fam-clock-lire', 'clock-regler':'fam-clock-regler'
  };
  var MANUAL_FAMILY_LIST = ['measure','deform','net','qcm','clock-lire','clock-regler'];
  // "Régler l'heure" est la seule activité qui n'a pas de vrais paliers de
  // difficulté (voir m5rGenTarget) : en mode Manuel, on masque alors le
  // sélecteur de niveau pour cette activité-là.
  var FAMILIES_WITH_LEVELS = {
    measure:true, deform:true, net:true, qcm:true, 'clock-lire':true, 'clock-regler':false
  };
  // La famille "Quizz" (QCM) regroupe à elle seule ~20 types de questions
  // (M4_LEVELS[*].types) qui étaient auparavant sélectionnables un par un.
  // On les réexpose ici en mode Manuel via l'ancien mécanisme m4TypeFilter
  // (déjà lu par genQuestion, mais plus jamais réglé depuis la fusion).
  var QCM_TYPE_LABELS = {
    sides:'Compter les côtés', vertices:'Compter les sommets', name:'Nom de la forme',
    angle:'Angles (droit/aigu/obtus)', calc:'Calcul', align:'Alignement',
    milieu:'Milieu d\'un segment', coord:'Lire des coordonnées',
    coordFind:'Trouver sur le quadrillage', codage:'Déplacement (codage)',
    decodage:'Trajet (décodage)', chasse:'Chasse aux formes',
    symAxe:'Axe de symétrie', symVrai:'Vrai axe de symétrie ?',
    solideNom:'Nom du solide', solideCompte:'Compter faces/sommets/arêtes',
    monnaie:'Monnaie', heure:'Lire l\'heure (QCM)', enigme:'Énigme',
    vie:'Maths de la vie', image:'Photo / illustration'
  };
  var LEVEL_NAMES = ['Facile','Moyen','Difficile'];
  var LEVEL_SHORT = ['Fa','Mo','Di'];

  /* ===================== CONFIGURATION DES ACTIVITÉS =====================
     Panneau de réglages avancé (⚙️ → "Configurer les activités et leur
     difficulté") : pour Quizz (QCM_TYPE_DEFS) et Patron→Solide (NET_DEFS),
     affiche chaque épreuve avec les niveaux où elle apparaît actuellement et
     permet de les cocher/décocher à la main (au moins un niveau doit rester
     coché). Les surcharges sont persistées et fusionnées par-dessus
     defaultLevels via effectiveLevels(), puis rebuildM4Types()/
     rebuildM3Pools() reconstruisent M4_LEVELS[*].types / M3_LEVELS[*].pool à
     partir du résultat — tout le reste du code (qcmTypeLevels, genQuestion,
     pickNetForLevel...) continue de lire ces tableaux normalement, sans
     rien savoir des surcharges. */
  var typeLevelOverrides = {}, netLevelOverrides = {};
  try{ typeLevelOverrides = JSON.parse(localStorage.getItem('geo_qcm_level_overrides') || '{}'); }catch(e){}
  try{ netLevelOverrides = JSON.parse(localStorage.getItem('geo_net_level_overrides') || '{}'); }catch(e){}
  function effectiveLevels(def, kind){
    var overrides = kind==='qcm' ? typeLevelOverrides : netLevelOverrides;
    var lv = overrides[def.id];
    return (lv && lv.length) ? lv : def.defaultLevels;
  }
  function rebuildM4Types(){
    M4_LEVELS.forEach(function(lv, idx){
      lv.types = QCM_TYPE_DEFS.filter(function(d){ return effectiveLevels(d,'qcm').indexOf(idx)!==-1; })
        .map(function(d){ return d.id; });
    });
  }
  function rebuildM3Pools(){
    M3_LEVELS.forEach(function(lv, idx){
      lv.pool = NET_DEFS.filter(function(d){ return effectiveLevels(d,'net').indexOf(idx)!==-1; })
        .map(function(d){ return d.obj; });
    });
  }
  rebuildM4Types();
  rebuildM3Pools();

  var STATIC_FAMILY_NOTES = {
    measure:'Une seule épreuve, sans sous-types. Le niveau fixe les paramètres du tirage : longueur du trait (1 à 9 cm en Facile, avec des plages plus larges et des demi-cm en Difficile), position de départ de la règle (toujours 0 en Facile/Moyen, peut démarrer dans les négatifs en Difficile) et décalage du segment. À l\'intérieur de cette plage, tout est tiré au hasard à chaque question — c\'est la plage elle-même qui est fixée par le niveau, pas les valeurs.',
    deform:'Une seule épreuve avec 3 formes cibles (losange, rectangle, parallélogramme) : la forme est tirée au hasard à CHAQUE question, quel que soit le niveau — le niveau ne choisit jamais la forme. Ce que change le niveau, c\'est la déformation de départ par rapport à la cible : 1 seul coin décalé en Facile, 3 coins en Moyen, les 4 coins en Difficile (avec une amplitude de décalage elle aussi croissante). Tout le reste (quel(s) coin(s), direction, amplitude exacte dans la plage) est tiré au hasard.',
    'clock-lire':'Une seule épreuve. L\'heure affichée est tirée au hasard à chaque question. Le niveau fixe uniquement la précision autorisée : heure pile ou demie en Facile, + quarts d\'heure en Moyen, n\'importe quelle tranche de 5 minutes en Difficile.',
    'clock-regler':'Une seule épreuve, sans paliers de difficulté (identique quel que soit l\'onglet Facile/Moyen/Difficile). L\'heure cible à reproduire est tirée au hasard à chaque question ; c\'est pour ça qu\'elle n\'apparaît pas dans la liste de niveaux du mode Manuel.'
  };
  var ACTIVITY_CONFIG_FAMILIES = ['measure','deform','net','qcm','clock-lire','clock-regler'];
  var currentAconfFamily = 'qcm';
  function flashAconfWarning(){
    var wrap = document.getElementById('activity-config-list');
    wrap.classList.remove('shake');
    void wrap.offsetWidth;
    wrap.classList.add('shake');
    setTimeout(function(){ wrap.classList.remove('shake'); }, 420);
  }
  function toggleAconfLevel(def, kind, idx){
    var overrides = kind==='qcm' ? typeLevelOverrides : netLevelOverrides;
    var current = effectiveLevels(def, kind).slice();
    var pos = current.indexOf(idx);
    if(pos!==-1){
      if(current.length===1){ flashAconfWarning(); return; } // au moins un niveau doit rester coché
      current.splice(pos,1);
    } else {
      current.push(idx);
      current.sort();
    }
    overrides[def.id] = current;
    try{
      localStorage.setItem(kind==='qcm' ? 'geo_qcm_level_overrides' : 'geo_net_level_overrides', JSON.stringify(overrides));
    }catch(e){}
    if(kind==='qcm') rebuildM4Types(); else rebuildM3Pools();
    renderActivityConfig(currentAconfFamily);
  }
  function buildAconfItem(def, kind){
    var item = document.createElement('div');
    item.className = 'aconf-item';
    var head = document.createElement('div'); head.className = 'aconf-item-head';
    var nameSpan = document.createElement('span'); nameSpan.textContent = def.label;
    head.appendChild(nameSpan);
    var toggles = document.createElement('div'); toggles.className = 'aconf-level-toggles';
    var levels = effectiveLevels(def, kind);
    LEVEL_SHORT.forEach(function(short, idx){
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'aconf-level-btn' + (levels.indexOf(idx)!==-1 ? ' active' : '');
      b.textContent = short;
      b.title = LEVEL_NAMES[idx];
      b.setAttribute('aria-label', LEVEL_NAMES[idx]);
      b.addEventListener('click', function(){ toggleAconfLevel(def, kind, idx); });
      toggles.appendChild(b);
    });
    head.appendChild(toggles);
    item.appendChild(head);
    var note = document.createElement('p'); note.className = 'aconf-note'; note.textContent = def.randomNote;
    item.appendChild(note);
    return item;
  }
  function renderActivityConfig(familyKey){
    var wrap = document.getElementById('activity-config-list');
    wrap.innerHTML = '';
    if(familyKey === 'qcm'){
      QCM_TYPE_DEFS.forEach(function(def){ wrap.appendChild(buildAconfItem(def, 'qcm')); });
    } else if(familyKey === 'net'){
      NET_DEFS.forEach(function(def){ wrap.appendChild(buildAconfItem(def, 'net')); });
    } else {
      var card = document.createElement('div'); card.className = 'aconf-static-card';
      var h3 = document.createElement('h3'); h3.textContent = FAMILY_TAGS[familyKey];
      var p = document.createElement('p'); p.textContent = STATIC_FAMILY_NOTES[familyKey];
      card.appendChild(h3); card.appendChild(p);
      wrap.appendChild(card);
    }
  }
  buildLevelRow(
    document.getElementById('activity-config-family-row'),
    ACTIVITY_CONFIG_FAMILIES.map(function(k){ return FAMILY_TAGS[k]; }),
    ACTIVITY_CONFIG_FAMILIES.indexOf('qcm'),
    function(idx){
      currentAconfFamily = ACTIVITY_CONFIG_FAMILIES[idx];
      renderActivityConfig(currentAconfFamily);
    }
  );
  document.getElementById('open-activity-config-btn').addEventListener('click', function(){
    document.getElementById('settings-overlay').hidden = true;
    document.getElementById('activity-config-overlay').hidden = false;
    renderActivityConfig(currentAconfFamily);
  });
  document.getElementById('activity-config-close').addEventListener('click', function(){
    document.getElementById('activity-config-overlay').hidden = true;
  });
  document.getElementById('activity-config-overlay').addEventListener('click', function(e){
    if(e.target.id === 'activity-config-overlay') document.getElementById('activity-config-overlay').hidden = true;
  });
  // Reconstruit le sélecteur de niveau avec UNIQUEMENT les niveaux passés en
  // argument (ex : un type de quizz qui n'existe qu'en Difficile n'affiche
  // qu'un seul bouton) — c'est le choix d'activité qui pilote les niveaux
  // disponibles, jamais l'inverse.
  var manualAvailableLevels = [0,1,2];
  function rebuildManualLevelRow(levels){
    var wrap = document.getElementById('manual-level-wrap');
    manualStreak = 0;
    manualAvailableLevels = levels || [];
    if(!levels || !levels.length){ wrap.hidden = true; return; }
    wrap.hidden = false;
    var labels = levels.map(function(i){ return LEVEL_NAMES[i]; });
    buildLevelRow(document.getElementById('manual-level-row'), labels, 0, function(idx){
      globalLevel = levels[idx];
      manualStreak = 0;
      nextPracticeQuestion();
      armManualCollapse();
    });
    globalLevel = levels[0];
  }
  // Niveaux où un type de quizz donné existe réellement (M4_LEVELS[*].types).
  function qcmTypeLevels(type){
    if(type==='random') return [0,1,2];
    var levels = [];
    for(var i=0;i<M4_LEVELS.length;i++){
      if(M4_LEVELS[i].types.indexOf(type)!==-1) levels.push(i);
    }
    return levels.length ? levels : [0,1,2];
  }
  function refreshManualQcmTypes(){
    var wrap = document.getElementById('manual-qcm-type-wrap');
    if(manualFamily !== 'qcm'){ wrap.hidden = true; m4TypeFilter = 'random'; return; }
    wrap.hidden = false;
    // Union de tous les types sur tous les niveaux, pour qu'une activité ne
    // disparaisse jamais de la liste selon le niveau actuellement choisi.
    var allTypes = [];
    M4_LEVELS.forEach(function(lv){
      lv.types.forEach(function(t){ if(allTypes.indexOf(t)===-1) allTypes.push(t); });
    });
    var labels = ['Aléatoire'].concat(allTypes.map(function(t){ return QCM_TYPE_LABELS[t] || t; }));
    m4TypeFilter = 'random';
    buildLevelRow(document.getElementById('manual-qcm-type-row'), labels, 0, function(idx){
      m4TypeFilter = idx===0 ? 'random' : allTypes[idx-1];
      rebuildManualLevelRow(qcmTypeLevels(m4TypeFilter));
      nextPracticeQuestion();
      armManualCollapse();
    });
    rebuildManualLevelRow(qcmTypeLevels('random'));
  }
  // ---- Repli automatique de la liste d'activités après 5s d'inactivité ----
  var manualCollapseTimer = null;
  function armManualCollapse(){
    clearTimeout(manualCollapseTimer);
    manualCollapseTimer = setTimeout(function(){
      document.getElementById('manual-activity-picker').hidden = true;
      document.getElementById('manual-show-activities-btn').hidden = false;
    }, 5000);
  }
  function expandManualActivities(){
    clearTimeout(manualCollapseTimer);
    document.getElementById('manual-activity-picker').hidden = false;
    document.getElementById('manual-show-activities-btn').hidden = true;
  }
  document.getElementById('manual-show-activities-btn').addEventListener('click', function(){
    expandManualActivities();
    armManualCollapse();
  });
  // Manipulations plus lentes (glisser des coins, régler des aiguilles) sont
  // réservées au mode Aléatoire : un compte à rebours mélange seulement les
  // familles qui se répondent en un tap. Le patron 3D en est exclu aussi :
  // l'animation de pliage n'a pas le temps de se jouer correctement avant
  // l'enchaînement automatique de la question suivante.
  function familyKeys(){
    return practiceMode==='countdown'
      ? ['measure','qcm','clock-lire']
      : ['measure','deform','net','qcm','clock-lire','clock-regler'];
  }
  function showFamily(key){
    currentFamily = key;
    Object.keys(FAMILY_WRAP_IDS).forEach(function(k){
      var wrap = document.getElementById(FAMILY_WRAP_IDS[k]);
      if(wrap) wrap.hidden = (k!==key);
    });
    document.getElementById('practice-family-tag').textContent = FAMILY_TAGS[key];
    updateStreakPill();
    setCoachReaction('neutral');
    bounceMascotTalk();
    // Petite transition d'entrée à chaque nouvelle question, pour une
    // sensation plus soignée qu'un changement de contenu instantané.
    var exWrap = document.getElementById('practice-exercise');
    exWrap.classList.remove('qenter');
    void exWrap.offsetWidth;
    exWrap.classList.add('qenter');
  }
  function nextPracticeQuestion(){
    var key = (appMode==='manual' && manualFamily) ? manualFamily : pick(familyKeys());
    showFamily(key);
    if(key==='measure') newMeasureQuestion();
    else if(key==='deform') newDeformQuestion();
    else if(key==='net') loadNet(pickNetForLevel(globalLevel));
    else if(key==='qcm') newQCM();
    else if(key==='clock-lire') newM5Lire();
    else if(key==='clock-regler') m5rGenTarget();
  }
  function setGlobalLevel(idx){
    globalLevel = idx;
    resetFreeStreak();
    if(appMode!=='auto') return;
    if(practiceMode==='free'){
      nextPracticeQuestion();
    } else if(countdownRunning){
      endCountdown(); // le niveau a changé en pleine partie : on clôt la manche en cours
    }
  }
  function setAppMode(mode){
    appMode = mode;
    resetFreeStreak();
    var isManual = (mode==='manual');
    document.getElementById('practice-mode').hidden = isManual;
    document.getElementById('manual-picker').hidden = !isManual;
    if(isManual){
      // Pas de compte à rebours en mode Manuel : on arrête celui en cours s'il y en a un.
      clearInterval(countdownInterval);
      countdownRunning = false;
      setChronoCompact(false);
      document.getElementById('countdown-hud').hidden = true;
      document.getElementById('countdown-results').hidden = true;
      document.getElementById('countdown-setup').hidden = true;
      document.getElementById('practice-exercise').hidden = !manualFamily;
      expandManualActivities();
      if(manualFamily) nextPracticeQuestion();
    } else {
      // Retour en mode auto (Facile/Moyen/Difficile) : jamais de type QCM
      // forcé, le mélange redevient entièrement aléatoire.
      m4TypeFilter = 'random';
      clearTimeout(manualCollapseTimer);
      if(practiceMode==='free'){
        document.getElementById('countdown-setup').hidden = true;
        document.getElementById('practice-exercise').hidden = false;
      } else if(!countdownRunning){
        document.getElementById('practice-exercise').hidden = true;
        document.getElementById('countdown-setup').hidden = false;
      }
    }
  }
  var manualStreak = 0;
  // Série sans faute en mode Aléatoire (onglets Facile/Moyen/Difficile) :
  // 20 bonnes réponses d'affilée débloquent les personnages du défi "série"
  // du niveau en cours (voir CHALLENGES / completeChallenge).
  var freeStreak = 0;
  function resetFreeStreak(){ freeStreak = 0; updateStreakPill(); }
  function updateStreakPill(){
    var pill = document.getElementById('streak-pill');
    // (au tout premier affichage, le catalogue des personnages n'est pas
    // encore construit : il est défini plus bas dans le script)
    if(!pill || !CAT_REWARDS || !ownedCats) return;
    var show = appMode==='auto' && practiceMode==='free' && !countdownRunning && !isChallengeDone(12 + globalLevel);
    pill.hidden = !show;
    if(show){
      pill.textContent = '🔥 Série sans faute : ' + freeStreak + ' / ' + STREAK_TARGET;
      pill.setAttribute('aria-label', 'Série sans faute : ' + freeStreak + ' bonnes réponses sur ' + STREAK_TARGET + ' pour débloquer un personnage');
    }
  }
  function onPracticeAnswered(correct){
    if(appMode==='auto' && practiceMode==='free'){
      if(correct) freeStreak++; else freeStreak = 0;
      if(correct && freeStreak >= STREAK_TARGET){
        var fresh = completeChallenge(12 + globalLevel);
        if(fresh.length) showUnlockAnnouncement(fresh, 'Série sans faute réussie !');
      }
      updateStreakPill();
    }
    if(appMode==='manual' && manualFamily){
      if(!correct){
        manualStreak = 0;
      } else {
        manualStreak++;
        if(autoAdvanceEnabled && manualStreak >= autoAdvanceThreshold){
          manualStreak = 0;
          var pos = manualAvailableLevels.indexOf(globalLevel);
          if(pos !== -1 && pos < manualAvailableLevels.length - 1){
            var nextLevel = manualAvailableLevels[pos+1];
            setTimeout(function(){ manualAdvanceLevel(nextLevel); }, 700);
          }
        }
      }
    }
    if(practiceMode!=='countdown' || !countdownRunning) return;
    countdownScore.total++;
    if(correct) countdownScore.correct++;
    updateCountdownHud();
    setTimeout(function(){ if(countdownRunning) nextPracticeQuestion(); }, 900);
  }
  function manualAdvanceLevel(newLevel){
    globalLevel = newLevel;
    var pos = manualAvailableLevels.indexOf(newLevel);
    document.querySelectorAll('#manual-level-row .level-btn').forEach(function(b,i){
      b.classList.toggle('active', i===pos);
    });
    showAutoAdvanceToast(LEVEL_NAMES[newLevel]);
    nextPracticeQuestion();
  }
  function showAutoAdvanceToast(levelName){
    var t = document.createElement('div');
    t.className = 'auto-advance-toast';
    t.textContent = '⬆️ Niveau ' + levelName + ' débloqué, bravo !';
    document.body.appendChild(t);
    setTimeout(function(){ t.remove(); }, 2200);
  }

  function updateCountdownHud(remainMs){
    if(remainMs===undefined) remainMs = Math.max(0, countdownEndAt - Date.now());
    document.getElementById('countdown-time-left').textContent = Math.ceil(remainMs/1000) + ' s';
    document.getElementById('countdown-score-live').textContent = countdownScore.correct + ' / ' + countdownScore.total;
  }
  // Bascule l'interface en mode compact PENDANT que le chrono tourne (pas
  // pendant l'écran de réglage de la durée, où on garde la topbar/les
  // onglets pour pouvoir revenir en arrière avant de démarrer) : topbar,
  // sélecteur de thème et onglets de niveau disparaissent, pour qu'on
  // n'ait jamais à scroller entre deux questions.
  function setChronoCompact(active){
    document.body.classList.toggle('chrono-compact', active);
  }
  var countdownLevel = 0; // niveau (0/1/2) sur lequel le défi en cours a été lancé
  function startCountdown(){
    countdownScore = { correct:0, total:0 };
    countdownRunning = true;
    countdownLevel = globalLevel;
    updateStreakPill();
    countdownEndAt = Date.now() + countdownSeconds*1000;
    document.getElementById('countdown-setup').hidden = true;
    document.getElementById('countdown-results').hidden = true;
    document.getElementById('countdown-hud').hidden = false;
    document.getElementById('practice-exercise').hidden = false;
    setChronoCompact(true);
    updateCountdownHud();
    clearInterval(countdownInterval);
    countdownInterval = setInterval(function(){
      var remain = Math.max(0, countdownEndAt - Date.now());
      updateCountdownHud(remain);
      if(remain<=0) endCountdown();
    }, 250);
    nextPracticeQuestion();
  }
  // Quitter le défi en cours (bouton 🏠) : on abandonne sans résultat ni
  // étoiles, et on revient au mode Aléatoire, interface complète.
  function quitCountdown(){
    if(!countdownRunning) return;
    var firstBtn = document.querySelector('#practice-mode .level-btn');
    if(firstBtn) firstBtn.click(); // = repasser sur "Aléatoire" (arrête le chrono et réaffiche l'interface)
  }
  document.getElementById('countdown-home-btn').addEventListener('click', quitCountdown);
  function endCountdown(){
    countdownRunning = false;
    clearInterval(countdownInterval);
    setChronoCompact(false);
    document.getElementById('countdown-hud').hidden = true;
    document.getElementById('practice-exercise').hidden = true;
    document.getElementById('countdown-results').hidden = false;
    var starsWon = Math.max(1, Math.round(countdownScore.correct/2));
    addStar(starsWon);
    var html = 'Tu as répondu correctement à <strong>' + countdownScore.correct + '</strong> question(s) sur ' +
      countdownScore.total + ' ! (+' + starsWon + ' ⭐)';
    // Défi chronométré : assez de bonnes réponses pour ce niveau et cette
    // durée -> les personnages du défi sont débloqués.
    var ch = checkTimedChallenge(countdownLevel, countdownSeconds, countdownScore.correct);
    if(ch.k >= 0){
      if(ch.fresh.length){
        html += '<br>🎉 <strong>Défi réussi !</strong> Tu débloques ' + ch.fresh.map(function(sp){ return sp.name; }).join(' et ') + '.';
        setTimeout(function(){ showUnlockAnnouncement(ch.fresh, 'Défi réussi !'); }, 300);
      } else if(ch.done){
        html += '<br>✅ Défi réussi (personnages déjà débloqués).';
      } else {
        html += '<br>🎯 Pour débloquer les personnages de ce défi, il fallait ' + ch.target + ' bonnes réponses en ' + fmtDuration(countdownSeconds) + '. Encore un essai ?';
      }
    }
    document.getElementById('countdown-results-text').innerHTML = html;
    updateStreakPill();
  }

  buildLevelRow(document.getElementById('practice-mode'), ['Aléatoire','Chronométré'], 0, function(idx){
    practiceMode = idx===0 ? 'free' : 'countdown';
    resetFreeStreak();
    clearInterval(countdownInterval);
    countdownRunning = false;
    setChronoCompact(false);
    document.getElementById('countdown-hud').hidden = true;
    document.getElementById('countdown-results').hidden = true;
    if(practiceMode==='free'){
      document.getElementById('countdown-setup').hidden = true;
      document.getElementById('practice-exercise').hidden = false;
      nextPracticeQuestion();
    } else {
      document.getElementById('practice-exercise').hidden = true;
      document.getElementById('countdown-setup').hidden = false;
    }
  });
  var COUNTDOWN_DURATIONS = [60,120,180,300];
  buildLevelRow(document.getElementById('countdown-time-row'), ['1 min','2 min','3 min','5 min'], 0, function(idx){
    countdownSeconds = COUNTDOWN_DURATIONS[idx];
  });
  document.getElementById('countdown-start-btn').addEventListener('click', startCountdown);
  document.getElementById('countdown-restart-btn').addEventListener('click', function(){
    document.getElementById('countdown-results').hidden = true;
    document.getElementById('countdown-setup').hidden = false;
  });

  // Mode "Manuel" : choix d'une activité précise à répéter en boucle. Le
  // niveau (en dessous) dépend de l'activité choisie : moins de boutons si
  // elle n'existe pas en Facile et/ou en Moyen (voir rebuildManualLevelRow).
  buildLevelRow(
    document.getElementById('manual-family-row'),
    MANUAL_FAMILY_LIST.map(function(k){ return FAMILY_TAGS[k]; }),
    -1,
    function(idx){
      manualFamily = MANUAL_FAMILY_LIST[idx];
      refreshManualQcmTypes(); // gère aussi le niveau quand la famille est 'qcm'
      if(manualFamily !== 'qcm'){
        rebuildManualLevelRow(FAMILIES_WITH_LEVELS[manualFamily] ? [0,1,2] : []);
      }
      document.getElementById('practice-exercise').hidden = false;
      nextPracticeQuestion();
      armManualCollapse();
    }
  );

  setGlobalLevel(0); // charge la toute première question, niveau Facile

