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
  // Ordre d'affichage historique des types dans les listes (Configurer les
  // activités, mode Manuel). Un type absent de cette liste (nouveau thème)
  // s'affiche à la suite, dans l'ordre d'enregistrement.
  var QCM_DISPLAY_ORDER = ['sides', 'vertices', 'name', 'calc', 'align', 'milieu', 'coord', 'solideNom', 'monnaie', 'heure', 'angle', 'image', 'coordFind', 'codage', 'chasse', 'symAxe', 'solideCompte', 'vie', 'decodage', 'symVrai', 'enigme'];
  QCM_TYPE_DEFS.sort(function(a, b){
    var ia = QCM_DISPLAY_ORDER.indexOf(a.id), ib = QCM_DISPLAY_ORDER.indexOf(b.id);
    if(ia === -1) ia = QCM_DISPLAY_ORDER.length + QCM_TYPE_DEFS.indexOf(a);
    if(ib === -1) ib = QCM_DISPLAY_ORDER.length + QCM_TYPE_DEFS.indexOf(b);
    return ia - ib;
  });

  // Niveaux du Quizz : `types` est rempli par rebuildM4Types() (appelée après le
  // chargement des éventuelles surcharges manuelles, voir plus bas) — jamais laissé
  // vide. Les paramètres propres à un thème (formes, calcul…) vivent dans ce thème.
  var M4_LEVELS = [
    { name:'Facile',    types:[] },
    { name:'Moyen',     types:[] },
    { name:'Difficile', types:[] }
  ];
  var m4TypeFilter = 'random';
  var m4CategoryFilter = 'all';   // mode Manuel : « Aléatoire » se limite à cette sous-catégorie
  var m4Current = null;

  // Jamais deux fois de suite le même type de Quizz (quand il y a le choix).
  var lastQcmType = null;
  var lastFamily = null;
  function pickOther(arr, last){
    if(arr.length>1 && last!==null){
      var rest = arr.filter(function(x){ return x!==last; });
      if(rest.length) return pick(rest);
    }
    return pick(arr);
  }
  function genQuestion(){
    var lv = M4_LEVELS[globalLevel];
    var poolTypes = lv.types;
    if(m4CategoryFilter!=='all'){
      var inCat = lv.types.filter(function(t){ var d = quizTypeById(t); return d && quizCategoryId(d)===m4CategoryFilter; });
      if(inCat.length) poolTypes = inCat;
    }
    var type = (m4TypeFilter!=='random' && lv.types.indexOf(m4TypeFilter)!==-1) ? m4TypeFilter : pickOther(poolTypes, lastQcmType);
    lastQcmType = type;
    // (repli sur « image » comme avant si le niveau n'a plus aucun type actif)
    return (quizTypeById(type) || quizTypeById('image')).generate(globalLevel);
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
      b._ok = !!c.ok;
      if(c.draw){
        // Réponse VISUELLE : le bouton contient un petit dessin (c.draw(svg)) ;
        // c.label ne sert qu'à l'accessibilité.
        b.className += ' visual';
        b.setAttribute('aria-label', c.label);
        var csvg = document.createElementNS(svgNS,'svg');
        csvg.setAttribute('viewBox', c.viewBox || '0 0 200 200');
        b.appendChild(csvg);
        c.draw(csvg);
      } else {
        b.textContent = c.label.charAt(0).toUpperCase()+c.label.slice(1);
      }
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
      buttons.forEach(function(b){ if(b._ok) b.classList.add('correct'); });
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
  // Activités qui ont de vrais paliers de difficulté : en mode Manuel, le
  // sélecteur de niveau est masqué pour les autres (aucune à ce jour).
  var FAMILIES_WITH_LEVELS = {
    measure:true, deform:true, net:true, qcm:true, 'clock-lire':true, 'clock-regler':true
  };
  // La famille "Quizz" (QCM) regroupe à elle seule ~20 types de questions
  // (M4_LEVELS[*].types) qui étaient auparavant sélectionnables un par un.
  // On les réexpose ici en mode Manuel via l'ancien mécanisme m4TypeFilter
  // (déjà lu par genQuestion, mais plus jamais réglé depuis la fusion).
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
    'clock-lire':'Une seule épreuve. L\'heure affichée est tirée au hasard à chaque question. Le niveau fixe uniquement la précision autorisée : heure pile ou demie en Facile, + quarts d\'heure en Moyen. En Difficile : toutes les 5 minutes et les heures de 0 h à 23 h (l\'énoncé précise le moment de la journée).',
    'clock-regler':'Une seule épreuve. L\'heure cible à reproduire est tirée au hasard à chaque question. Le niveau fixe la précision : heure pile ou demie en Facile, + quarts d\'heure en Moyen, toutes les 5 minutes et heure de 0 h à 23 h en Difficile (l\'énoncé donne alors le moment de la journée ; il faut placer la petite aiguille comme sur le cadran, par exemple 15 h se lit 3 h).'
  };
  var ACTIVITY_CONFIG_FAMILIES = ['measure','deform','net','qcm','clock-lire','clock-regler'];
  var currentAconfFamily = 'qcm';
  var aconfOpenCats = {};
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
      // regroupé par sous-catégorie, chaque groupe repliable (le premier ouvert)
      QCM_CATEGORIES.forEach(function(cat, ci){
        var defs = QCM_TYPE_DEFS.filter(function(d){ return quizCategoryId(d)===cat.id; });
        if(!defs.length) return;
        var det = document.createElement('details'); det.className = 'aconf-cat';
        if(aconfOpenCats[cat.id] === undefined ? ci===0 : aconfOpenCats[cat.id]) det.open = true;
        var sum = document.createElement('summary');
        sum.textContent = cat.icon + ' ' + cat.label + ' (' + defs.length + ')';
        det.appendChild(sum);
        det.addEventListener('toggle', function(){ aconfOpenCats[cat.id] = det.open; });
        defs.forEach(function(def){ det.appendChild(buildAconfItem(def, 'qcm')); });
        wrap.appendChild(det);
      });
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
    m4CategoryFilter = 'all';
    if(manualFamily !== 'qcm'){ wrap.hidden = true; m4TypeFilter = 'random'; return; }
    wrap.hidden = false;
    // Union de tous les types sur tous les niveaux, pour qu'une activité ne
    // disparaisse jamais de la liste selon le niveau actuellement choisi.
    var allTypes = [];
    M4_LEVELS.forEach(function(lv){
      lv.types.forEach(function(t){ if(allTypes.indexOf(t)===-1) allTypes.push(t); });
    });
    var cats = QCM_CATEGORIES.filter(function(c){
      return allTypes.some(function(t){ var d = quizTypeById(t); return d && quizCategoryId(d)===c.id; });
    });
    function typesOf(catId){
      return catId==='all' ? allTypes : allTypes.filter(function(t){ var d = quizTypeById(t); return d && quizCategoryId(d)===catId; });
    }
    function buildTypeRow(catId){
      var list = typesOf(catId);
      var labels = ['Aléatoire'].concat(list.map(function(t){ return (quizTypeById(t) && quizTypeById(t).longLabel) || t; }));
      m4TypeFilter = 'random';
      buildLevelRow(document.getElementById('manual-qcm-type-row'), labels, 0, function(idx){
        m4TypeFilter = idx===0 ? 'random' : list[idx-1];
        rebuildManualLevelRow(qcmTypeLevels(m4TypeFilter));
        nextPracticeQuestion();
        armManualCollapse();
      });
    }
    buildLevelRow(document.getElementById('manual-qcm-cat-row'), ['Toutes'].concat(cats.map(function(c){ return c.icon + ' ' + c.label; })), 0, function(idx){
      m4CategoryFilter = idx===0 ? 'all' : cats[idx-1].id;
      buildTypeRow(m4CategoryFilter);
      rebuildManualLevelRow(qcmTypeLevels('random'));
      nextPracticeQuestion();
      armManualCollapse();
    });
    buildTypeRow('all');
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
  // ---- Pas deux fois la même question dans une série ----
  // On garde l'empreinte des ~80 dernières questions (de quoi couvrir une série
  // de 20 ou un chrono) ; une question déjà vue est retirée jusqu'à 15 fois.
  // La mémoire est remise à zéro au changement de niveau, de mode, ou au départ
  // d'un chrono.
  var SEEN_MAX = 80;
  var seenSigs = [];
  function resetSeenQuestions(){ seenSigs = []; }
  function questionSignature(key){
    if(key==='measure') return 'measure|' + globalLevel + '|' + currentLen + '|' + m1RulerStart + '|' + m1SegStart;
    if(key==='deform') return 'deform|' + m2ShapeIdx + '|' + m2StartPts.map(function(p){ return Math.round(p[0]) + ',' + Math.round(p[1]); }).join(';');
    if(key==='net') return 'net|' + NET_DEFS.map(function(n){ return n.obj; }).indexOf(currentNet);
    if(key==='clock-regler') return 'regler|' + m5Target.hour + ':' + m5Target.minute;
    var q = key==='qcm' ? m4Current : m5Current;
    return key + '|' + q.tag + '|' + q.question + '|' + q.explain + '|' + q.choices.map(function(c){ return c.label; }).sort().join('/');
  }
  function generateFamilyQuestion(key){
    showFamily(key);
    if(key==='measure') newMeasureQuestion();
    else if(key==='deform') newDeformQuestion();
    else if(key==='net') loadNet(pickNetForLevel(globalLevel));
    else if(key==='qcm') newQCM();
    else if(key==='clock-lire') newM5Lire();
    else if(key==='clock-regler') m5rGenTarget();
  }
  function nextPracticeQuestion(){
    var sig = null;
    for(var tries=0; tries<15; tries++){
      var key = (appMode==='manual' && manualFamily) ? manualFamily : pickOther(familyKeys(), lastFamily);
      lastFamily = key;
      generateFamilyQuestion(key);
      sig = questionSignature(key);
      if(seenSigs.indexOf(sig) === -1) break;
    }
    seenSigs.push(sig);
    if(seenSigs.length > SEEN_MAX) seenSigs.shift();
  }
  function setGlobalLevel(idx){
    resetSeenQuestions();
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
    resetSeenQuestions();
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
    resetSeenQuestions();
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
  // Deux étages : d'abord un THÈME (Quizz, Formes & mesures, Solides, Horloge),
  // puis, s'il en contient plusieurs, l'activité précise.
  var FAMILY_THEMES = [
    { label:'🧠 Quizz',            families:['qcm'] },
    { label:'📐 Formes & mesures', families:['measure','deform'] },
    { label:'📦 Solides',          families:['net'] },
    { label:'🕒 Horloge',          families:['clock-lire','clock-regler'] }
  ];
  function startManualFamily(key){
    manualFamily = key;
    refreshManualQcmTypes(); // gère aussi le niveau quand la famille est 'qcm'
    if(manualFamily !== 'qcm'){
      rebuildManualLevelRow(FAMILIES_WITH_LEVELS[manualFamily] ? [0,1,2] : []);
    }
    document.getElementById('practice-exercise').hidden = false;
    nextPracticeQuestion();
    armManualCollapse();
  }
  buildLevelRow(
    document.getElementById('manual-family-row'),
    FAMILY_THEMES.map(function(t){ return t.label; }),
    -1,
    function(idx){
      var theme = FAMILY_THEMES[idx];
      var subWrap = document.getElementById('manual-family-sub-wrap');
      if(theme.families.length === 1){
        subWrap.hidden = true;
        startManualFamily(theme.families[0]);
        return;
      }
      subWrap.hidden = false;
      manualFamily = null;
      document.getElementById('manual-qcm-type-wrap').hidden = true;
      m4TypeFilter = 'random'; m4CategoryFilter = 'all';
      document.getElementById('manual-level-wrap').hidden = true;
      buildLevelRow(document.getElementById('manual-family-sub-row'),
        theme.families.map(function(k){ return FAMILY_TAGS[k]; }), -1,
        function(j){ startManualFamily(theme.families[j]); });
      armManualCollapse();
    }
  );

  setGlobalLevel(0); // charge la toute première question, niveau Facile

