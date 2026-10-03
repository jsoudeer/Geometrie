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
  var QCM_DISPLAY_ORDER = ['sides', 'vertices', 'name', 'calc', 'align', 'milieu', 'coord', 'solideNom', 'monnaie', 'heure', 'angle', 'image', 'coordFind', 'codage', 'chasse', 'solideCompte', 'vie', 'decodage', 'symVrai', 'enigme'];
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
  function rebuildM4Types(overrides){
    M4_LEVELS.forEach(function(lv, idx){
      lv.types = QCM_TYPE_DEFS.filter(function(d){ return effectiveLevels(d, overrides).indexOf(idx)!==-1; })
        .map(function(d){ return d.id; });
    });
  }
  // Le Quizz est une famille comme les autres ; il pèse 3 places dans le
  // tirage aléatoire (il regroupe à lui seul une vingtaine de types).
  registerFamily({
    key:'qcm', tag:'Quizz', order:40, weight:3, timed:true,
    // Chaque type de question se règle niveau par niveau, regroupé par thème.
    config:{
      storageKey:'geo_qcm_level_overrides',
      defs:function(){ return QCM_TYPE_DEFS; },
      groups:function(){
        return DOMAINS.map(function(cat){
          return { id:cat.id, label:cat.icon + ' ' + cat.label, defs:QCM_TYPE_DEFS.filter(function(d){ return quizDomainId(d)===cat.id; }) };
        });
      },
      rebuild:rebuildM4Types
    },
    markup:[
      '<div class="coach-row">',
      '  <div class="coach-bubble" id="m4-question">Combien de côtés a cette forme ?</div>',
      '</div>',
      '<p class="muted" id="m4-sub">Observe la forme, puis choisis la bonne réponse.</p>',
      '<div class="shape-wrap"><svg id="m4Svg" viewBox="0 0 200 200" role="img" aria-label="Illustration de la question"></svg></div>',
      '<div class="qcm-choices" id="m4-choices"></div>',
      '<div class="feedback" id="m4-feedback"></div>',
      '<div class="btn-row">',
      '  <button class="btn primary" id="m4-next" type="button">Nouvelle activité ↻</button>',
      '</div>'
    ].join('\n'),
    generate:function(){ newQCM(); },
    signature:function(){ return quizSignature(m4Current); }
  });
  var m4TypeFilter = 'random';
  var m4Current = null;

  // Jamais deux fois de suite le même type de Quizz (quand il y a le choix).
  var lastQcmType = null;
  var forcedQcmType = null;  // type de quiz imposé pour la prochaine question (mode Révision)
  var forcedQcmDomain = null;   // thème de quiz imposé pour la prochaine question (sujet à travailler)
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
    var typeSel = forcedQcmType || m4TypeFilter;
    var freeType = (typeSel==='random' || lv.types.indexOf(typeSel)===-1);
    var cat = forcedQcmDomain || 'all';     // forcedQcmDomain : sujet à travailler (voir progression.js)
    if(cat==='all' && freeType){
      // Tirage « sans remise » au niveau des thèmes : chacun sort une fois
      // avant qu'aucun ne revienne.
      var cats = [];
      lv.types.forEach(function(t){ var d = quizTypeById(t); var c = d && quizDomainId(d); if(c && cats.indexOf(c)===-1) cats.push(c); });
      if(cats.length) cat = pickFresh('qcmcat|' + globalLevel + '|' + cats.join(','), cats);
    }
    if(cat!=='all'){
      var inCat = lv.types.filter(function(t){ var d = quizTypeById(t); return d && quizDomainId(d)===cat; });
      if(inCat.length) poolTypes = inCat;
    }
    // Idem pour les types au sein du thème (sans remise).
    var type = !freeType ? typeSel : pickFresh('qcmtype|' + globalLevel + '|' + poolTypes.join(','), poolTypes);
    lastQcmType = type;
    // (repli sur « image » comme avant si le niveau n'a plus aucun type actif)
    var qdef = quizTypeById(type) || quizTypeById('image');
    var q = qdef.generate(globalLevel);
    q.typeId = qdef.id; q.domain = quizDomainId(qdef);   // pour l'historique de progression
    return q;
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
    m4Flow.start();
  }

  var m4Flow = makeQuestionFlow({ feedback:'m4-feedback', tries:1 });
  function checkQCM(choice, btn){
    if(m4Flow.closed) return;
    var buttons = document.querySelectorAll('#m4-choices .choice-btn');
    buttons.forEach(function(b){ b.disabled = true; });
    if(choice.ok){
      btn.classList.add('correct');
      m4Flow.answer(true, { success:'Bravo, c\'est la bonne réponse !', explain:m4Current.explain });
    } else {
      btn.classList.add('wrong');
      buttons.forEach(function(b){ if(b._ok) b.classList.add('correct'); });
      m4Flow.answer(false, { solution:'La bonne réponse est en vert.', explain:m4Current.explain });
    }
  }

  document.getElementById('m4-next').addEventListener('click', function(){ m4Flow.skip(); });

  /* ===================== ENTRAINEMENT : ORCHESTRATEUR =====================
     Un seul menu à 3 niveaux (Facile/Moyen/Difficile) : le niveau choisi
     (« globalLevel ») est transmis à la famille tirée. À chaque nouvelle
     question, une famille (registerFamily, noyau.js) est tirée et affichée
     dans #practice-exercise ; génération, correction et dessin restent dans
     le thème qui l'a déclarée. L'orchestrateur ne nomme aucune activité. */
  var globalLevel = 0;
  var practiceMode = 'free'; // 'free' (Aléatoire) | 'review' (Révision) | 'countdown' (Chronométré)  (utilisé seulement en mode 'auto')
  var appMode = 'auto'; // 'auto' (Facile/Moyen/Difficile) | 'manual' (activité choisie à la main)
  var manualFamily = null;
  var currentFamily = null;
  var countdownScore = { correct:0, total:0 };
  var countdownRunning = false, countdownInterval = null, countdownEndAt = 0, countdownSeconds = 60;

  // Tout est calculé à partir du registre (registerFamily, noyau.js) : aucune
  // activité n'est nommée ici. Ordre = champ `order` de chaque famille.
  FAMILIES.sort(function(a, b){ return (a.order || 100) - (b.order || 100); });
  var FAMILY_TAGS = {};
  FAMILIES.forEach(function(f){ FAMILY_TAGS[f.key] = f.tag; });
  var MANUAL_FAMILY_LIST = FAMILIES.map(function(f){ return f.key; });
  var LEVEL_NAMES = ['Facile','Moyen','Difficile'];
  var LEVEL_SHORT = ['Fa','Mo','Di'];
  function familyDef(key){
    for(var i=0;i<FAMILIES.length;i++){ if(FAMILIES[i].key===key) return FAMILIES[i]; }
    return null;
  }
  var extraFamily = familyDef;   // ancien nom, gardé pour les tests

  /* ===================== CONFIGURATION DES ACTIVITÉS =====================
     Panneau de réglages avancé (⚙️ → "Configurer les activités et leur
     difficulté") : pour une famille qui a un `config` (Quizz, Patron →
     Solide…), affiche chaque épreuve avec les niveaux où elle apparaît et
     permet de les cocher/décocher (au moins un niveau reste coché). Les
     surcharges sont enregistrées (config.storageKey), puis config.rebuild()
     reconstruit les tirages de la famille ; le reste du code ne sait rien
     des surcharges. Une famille sans `config` affiche son texte `note`. */
  FAMILIES.forEach(function(f){
    if(!f.config) return;
    f.config.overrides = {};
    try{ f.config.overrides = JSON.parse(localStorage.getItem(f.config.storageKey) || '{}'); }catch(e){}
    f.config.rebuild(f.config.overrides);
  });
  var ACTIVITY_CONFIG_FAMILIES = MANUAL_FAMILY_LIST;
  var currentAconfFamily = 'qcm';
  var aconfOpenCats = {};
  function flashAconfWarning(){
    var wrap = document.getElementById('activity-config-list');
    wrap.classList.remove('shake');
    void wrap.offsetWidth;
    wrap.classList.add('shake');
    setTimeout(function(){ wrap.classList.remove('shake'); }, 420);
  }
  function toggleAconfLevel(def, cfg, idx){
    var current = effectiveLevels(def, cfg.overrides).slice();
    var pos = current.indexOf(idx);
    if(pos!==-1){
      if(current.length===1){ flashAconfWarning(); return; } // au moins un niveau doit rester coché
      current.splice(pos,1);
    } else {
      current.push(idx);
      current.sort();
    }
    cfg.overrides[def.id] = current;
    try{ localStorage.setItem(cfg.storageKey, JSON.stringify(cfg.overrides)); }catch(e){}
    cfg.rebuild(cfg.overrides);
    renderActivityConfig(currentAconfFamily);
  }
  function buildAconfItem(def, cfg){
    var item = document.createElement('div');
    item.className = 'aconf-item';
    var head = document.createElement('div'); head.className = 'aconf-item-head';
    var nameSpan = document.createElement('span'); nameSpan.textContent = def.label;
    head.appendChild(nameSpan);
    var toggles = document.createElement('div'); toggles.className = 'aconf-level-toggles';
    var levels = effectiveLevels(def, cfg.overrides);
    LEVEL_SHORT.forEach(function(short, idx){
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'aconf-level-btn' + (levels.indexOf(idx)!==-1 ? ' active' : '');
      b.textContent = short;
      b.title = LEVEL_NAMES[idx];
      b.setAttribute('aria-label', LEVEL_NAMES[idx]);
      b.addEventListener('click', function(){ toggleAconfLevel(def, cfg, idx); });
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
    var fam = familyDef(familyKey), cfg = fam && fam.config;
    if(cfg && cfg.groups){
      // regroupé par thème, chaque groupe repliable (le premier ouvert)
      cfg.groups().filter(function(g){ return g.defs.length; }).forEach(function(g, gi){
        var det = document.createElement('details'); det.className = 'aconf-cat';
        if(aconfOpenCats[g.id] === undefined ? gi===0 : aconfOpenCats[g.id]) det.open = true;
        var sum = document.createElement('summary');
        sum.textContent = g.label + ' (' + g.defs.length + ')';
        det.appendChild(sum);
        det.addEventListener('toggle', function(){ aconfOpenCats[g.id] = det.open; });
        g.defs.forEach(function(def){ det.appendChild(buildAconfItem(def, cfg)); });
        wrap.appendChild(det);
      });
    } else if(cfg){
      cfg.defs().forEach(function(def){ wrap.appendChild(buildAconfItem(def, cfg)); });
    } else {
      var card = document.createElement('div'); card.className = 'aconf-static-card';
      var h3 = document.createElement('h3'); h3.textContent = FAMILY_TAGS[familyKey];
      var p = document.createElement('p'); p.textContent = (fam && fam.note) || '';
      card.appendChild(h3); card.appendChild(p);
      wrap.appendChild(card);
    }
  }
  buildLevelRow(
    document.getElementById('activity-config-family-row'),
    ACTIVITY_CONFIG_FAMILIES.map(function(k){ return FAMILY_TAGS[k]; }),
    Math.max(0, ACTIVITY_CONFIG_FAMILIES.indexOf('qcm')),
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
  // Mode Manuel : AUCUN niveau n'est sélectionné d'office et aucune épreuve n'est
  // affichée tant qu'on n'a pas touché Facile / Moyen / Difficile. Ce toucher fait
  // apparaître l'épreuve et replier la liste des activités en même temps (plus de
  // minuterie de repli). Une activité sans niveaux (ex : un atelier) démarre tout de suite.
  var manualAvailableLevels = [0,1,2];
  var manualLevelChosen = false;
  function showManualExercise(){
    manualLevelChosen = true;
    document.getElementById('practice-exercise').hidden = false;
    nextPracticeQuestion();
    collapseManualActivities();
  }
  function rebuildManualLevelRow(levels){
    var wrap = document.getElementById('manual-level-wrap');
    manualStreak = 0;
    manualLevelChosen = false;
    manualAvailableLevels = levels || [];
    document.getElementById('practice-exercise').hidden = true;
    expandManualActivities();
    if(!levels || !levels.length){ wrap.hidden = true; return; }
    wrap.hidden = false;
    var labels = levels.map(function(i){ return LEVEL_NAMES[i]; });
    buildLevelRow(document.getElementById('manual-level-row'), labels, -1, function(idx){
      globalLevel = levels[idx];
      manualStreak = 0;
      resetSeenQuestions();
      showManualExercise();
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
  // ---- Liste d'activités : repliée au choix d'un niveau, bouton pour la remontrer/cacher ----
  function updateManualToggle(){
    var btn = document.getElementById('manual-show-activities-btn');
    var hiddenNow = document.getElementById('manual-activity-picker').hidden;
    btn.hidden = !manualLevelChosen;
    btn.textContent = hiddenNow ? '👁 Afficher les activités' : '🙈 Masquer les activités';
  }
  function collapseManualActivities(){
    document.getElementById('manual-activity-picker').hidden = true;
    updateManualToggle();
  }
  function expandManualActivities(){
    document.getElementById('manual-activity-picker').hidden = false;
    updateManualToggle();
  }
  document.getElementById('manual-show-activities-btn').addEventListener('click', function(){
    if(document.getElementById('manual-activity-picker').hidden) expandManualActivities(); else collapseManualActivities();
  });
  // Sac de tirage : chaque famille y figure `weight` fois (1 par défaut).
  // En mode Chronométré, seules les familles `timed` (réponse en un toucher)
  // sont tirées, une fois chacune : les manipulations lentes et le patron 3D
  // (dont l'animation de pliage n'aurait pas le temps de se jouer) en sont exclus.
  function familyKeys(){
    var keys = [];
    FAMILIES.forEach(function(f){
      if(!familyAvailable(f, globalLevel)) return;
      if(practiceMode==='countdown'){ if(f.timed) keys.push(f.key); return; }
      for(var i=0;i<(f.weight || 1);i++) keys.push(f.key);
    });
    return keys;
  }
  function showFamily(key){
    currentFamily = key;
    FAMILIES.forEach(function(f){
      var wrap = document.getElementById('fam-' + f.key);
      if(wrap) wrap.hidden = (f.key!==key);
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
    return key + '|' + familyDef(key).signature();
  }
  function generateFamilyQuestion(key){
    showFamily(key);
    familyDef(key).generate(globalLevel);
  }
  // Choix de la famille « sans remise » : chaque famille sort (le quiz autant de
  // fois que son poids) avant qu'aucune ne revienne ; jamais deux fois de suite
  // la même famille quand il y a le choix.
  var FAM_BAG = { sig:'', bag:[] };
  function pickFamilyFresh(){
    var keys = familyKeys(), sig = keys.join(',');
    if(FAM_BAG.sig!==sig || !FAM_BAG.bag.length){
      var order, ok, guard = 0, distinct = keys.filter(function(k,i){ return keys.indexOf(k)===i; }).length;
      do {
        order = shuffle(keys.slice());
        ok = true;
        if(distinct>1){
          // on lit le sac par la fin (pop) : order[len-1] sort en premier
          if(order[order.length-1]===lastFamily) ok = false;
          for(var i=1;i<order.length && ok;i++){ if(order[i]===order[i-1]) ok = false; }
        }
      } while(!ok && ++guard<200);
      FAM_BAG = { sig:sig, bag:order };
    }
    // on prend la première famille (par le haut du sac) différente de celle affichée
    var bag = FAM_BAG.bag, at = bag.length-1;
    while(at>0 && bag[at]===lastFamily) at--;
    // Il ne reste dans le sac que la famille déjà affichée (des tirages écartés ont vidé le reste) : nouveau sac.
    if(bag[at]===lastFamily && keys.some(function(k){ return k!==lastFamily; })){ FAM_BAG = { sig:'', bag:[] }; return pickFamilyFresh(); }
    var key = bag.splice(at,1)[0];
    return key;
  }
  var STREAK_GOALS = [20, 25, 30];   // paliers de la série sans faute : défis 12 (Facile), 13 (Moyen), 14 (Difficile)
  // Séries sans faute (paliers 20, 25, 30) : les 3 questions qui précèdent un palier non encore
  // débloqué (18e-20e, 23e-25e, 28e-30e) sont posées dans les sujets où l'enfant a le plus de mal
  // (historique de progression).
  function challengeFocusActive(){
    if(appMode!=='auto' || practiceMode!=='free' || countdownRunning) return false;
    return STREAK_GOALS.some(function(g, idx){ return freeStreak >= g - 3 && freeStreak < g && !isChallengeDone(12 + idx); });
  }
  // Montée de niveau automatique : elle est APPLIQUÉE quand l'enfant demande la question suivante
  // (et non après un délai) : sinon elle remplaçait la question qu'il était en train de lire et
  // son toucher tombait sur la nouvelle (réponse comptée fausse, série perdue).
  var pendingAdvance = null;
  function nextPracticeQuestion(){
    if(pendingAdvance){ var adv = pendingAdvance; pendingAdvance = null; if(adv()) return; }
    var sig = null, prevShown = lastFamily;
    var focus = challengeFocusActive() ? progWeakPick() : null;     // {key, domain} ou null
    var review = null;                                               // unité imposée : {key, type, why} (Révision ou « un peu de tout » du mode Manuel)
    var reviewing = (appMode==='auto' && practiceMode==='review');
    var mixing = (appMode==='manual' && manualMix);
    for(var tries=0; tries<15; tries++){
      lastFamily = prevShown;   // on évite la famille réellement affichée, pas un essai rejeté
      if(reviewing) review = progReviewPick();
      else if(mixing) review = manualMixPick();
      var key = focus ? focus.key : (review ? review.key : ((appMode==='manual' && manualFamily) ? manualFamily : pickFamilyFresh()));
      forcedQcmDomain = (focus && focus.key==='qcm') ? focus.domain : null;
      forcedQcmType = (review && review.type) ? review.type : null;
      lastFamily = key;
      // d'abord on retente dans la même famille (elle garde son tour), puis on en change
      var fresh = false;
      for(var again=0; again<4 && !fresh; again++){
        generateFamilyQuestion(key);
        sig = questionSignature(key);
        fresh = seenSigs.indexOf(sig) === -1;
      }
      if(fresh) break;
    }
    forcedQcmDomain = null; forcedQcmType = null;
    if(review && review.why){
      document.getElementById('practice-family-tag').textContent += review.why==='raté' ? ' · 🔁 à revoir' : ' · ✨ pas encore fait';
    }
    if(focus){
      var tagEl = document.getElementById('practice-family-tag');
      tagEl.textContent += ' · 🎯 à travailler';
    }
    seenSigs.push(sig);
    if(seenSigs.length > SEEN_MAX) seenSigs.shift();
  }
  function setGlobalLevel(idx){
    pendingAdvance = null;
    resetSeenQuestions();
    globalLevel = idx;
    resetFreeStreak();
    if(appMode!=='auto') return;
    if(practiceMode!=='countdown'){
      nextPracticeQuestion();
    } else if(countdownRunning){
      endCountdown(); // le niveau a changé en pleine partie : on clôt la manche en cours
    }
  }
  function setAppMode(mode){
    pendingAdvance = null;
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
      var ready = !!manualFamily && (manualLevelChosen || !manualAvailableLevels.length);
      document.getElementById('practice-exercise').hidden = !ready;
      if(ready){ manualLevelChosen = true; collapseManualActivities(); nextPracticeQuestion(); }
      else expandManualActivities();
    } else {
      // Retour en mode auto (Facile/Moyen/Difficile) : jamais de type QCM
      // forcé, le mélange redevient entièrement aléatoire.
      m4TypeFilter = 'random';
      if(practiceMode!=='countdown'){
        document.getElementById('countdown-setup').hidden = true;
        document.getElementById('practice-exercise').hidden = false;
      } else if(!countdownRunning){
        document.getElementById('practice-exercise').hidden = true;
        document.getElementById('countdown-setup').hidden = false;
      }
    }
  }
  var manualStreak = 0;
  // Série sans faute en mode Aléatoire (onglets Facile/Moyen/Difficile), quel que soit le niveau
  // joué : 20 bonnes réponses d'affilée débloquent le personnage du défi Facile, 25 celui du
  // Moyen, 30 celui du Difficile (STREAK_GOALS, voir CHALLENGES / completeChallenge).
  var freeStreak = 0;
  var levelStreak = 0;      // bonnes réponses d'affilée dans le niveau en cours (avancement automatique)
  function resetFreeStreak(){ freeStreak = 0; levelStreak = 0; updateStreakPill(); }
  function nextStreakGoal(){
    for(var i=0;i<STREAK_GOALS.length;i++){ if(STREAK_GOALS[i] > freeStreak && !isChallengeDone(12 + i)) return STREAK_GOALS[i]; }
    return 0;
  }
  function updateStreakPill(){
    var pill = document.getElementById('streak-pill');
    // (au tout premier affichage, le catalogue des personnages n'est pas
    // encore construit : il est défini plus bas dans le script)
    if(!pill || !CAT_REWARDS || !ownedCats) return;
    var show = appMode==='auto' && practiceMode==='free' && !countdownRunning;
    pill.hidden = !show;
    if(show){
      var goal = nextStreakGoal();
      var marks = STREAK_GOALS.map(function(g, i){ return g + (isChallengeDone(12 + i) || freeStreak >= g ? '✔' : ''); }).join(' · ');
      // Texte court (une ligne sur téléphone) ; les paliers « (20 · 25 · 30) » ne s'affichent que sur grand écran.
      pill.textContent = '🔥 Série ';
      var pl = document.createElement('span'); pl.className = 'pill-long'; pl.textContent = 'sans faute ';
      pill.appendChild(pl);
      pill.appendChild(document.createTextNode(': ' + freeStreak + (goal ? ' / ' + goal : '')));
      var pm = document.createElement('span'); pm.className = 'pill-marks'; pm.textContent = '  (' + marks + ')';
      pill.appendChild(pm);
      pill.setAttribute('aria-label', 'Série sans faute : ' + freeStreak + ' bonnes réponses' + (goal ? ', prochain palier ' + goal : '') + '. Paliers : ' + marks.replace(/✔/g, ' obtenu').replace(/ · /g, ', '));
    }
    if(typeof updateHeat === 'function') updateHeat();
  }
  function onPracticeAnswered(correct){
    progRecord(correct);   // historique de progression (progression.js)
    if(appMode==='auto' && practiceMode==='free'){
      if(correct){ freeStreak++; levelStreak++; }
      else { freeStreak = 0; levelStreak = 0; }
      var goalIdx = correct ? STREAK_GOALS.indexOf(freeStreak) : -1;
      if(goalIdx !== -1){
        // palier atteint : 20 → défi Facile, 25 → Moyen, 30 → Difficile (quel que soit le niveau joué)
        var fresh = completeChallenge(12 + goalIdx);
        if(fresh.length) showUnlockAnnouncement(fresh, 'Série de ' + freeStreak + ' sans faute !');
      }
      updateStreakPill();
      // Avancement automatique en mode Aléatoire : après X bonnes réponses d'affilée DANS CE NIVEAU, niveau supérieur.
      // La série sans faute (freeStreak) continue, elle, à travers les niveaux.
      if(correct && levelStreak >= autoAdvanceThreshold && globalLevel < 2 && !countdownRunning){
        var fromLevel = globalLevel;
        pendingAdvance = function(){
          if(appMode!=='auto' || practiceMode!=='free' || globalLevel!==fromLevel) return false;
          var tabName = ['facile','moyen','difficile'][fromLevel+1];
          var tabBtn = document.querySelector('.tab-btn[data-tab="' + tabName + '"]');
          if(!tabBtn) return false;
          var keepStreak = freeStreak;
          tabBtn.click();                                     // change de niveau ET tire la question (remet les séries à zéro...)
          freeStreak = keepStreak;                            // ...sauf la série sans faute
          updateStreakPill();
          showAutoAdvanceToast(LEVEL_NAMES[fromLevel+1]);
          return true;
        };
      }
    }
    if(appMode==='manual' && manualFamily){
      if(!correct){
        manualStreak = 0;
      } else {
        manualStreak++;
        if(manualStreak >= autoAdvanceThreshold){
          manualStreak = 0;
          var pos = manualAvailableLevels.indexOf(globalLevel);
          if(pos !== -1 && pos < manualAvailableLevels.length - 1){
            var nextLevel = manualAvailableLevels[pos+1], fromManual = globalLevel;
            pendingAdvance = function(){
              if(appMode!=='manual' || globalLevel!==fromManual) return false;
              manualAdvanceLevel(nextLevel); return true;
            };
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
      b.setAttribute('aria-pressed', i===pos ? 'true' : 'false');
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
  // Pendant le défi, l'interface reste la même (plus de plein écran) : on
  // masque seulement le choix Aléatoire / Chronométré, et l'icône du menu
  // devient le bouton « quitter » (voir updateMenuButton, noyau.js).
  function setChronoCompact(active){ updateMenuButton(); }
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

  buildLevelRow(document.getElementById('practice-mode'), ['Aléatoire','Révision','Chronométré'], 0, function(idx){
    practiceMode = ['free','review','countdown'][idx];
    resetFreeStreak();
    clearInterval(countdownInterval);
    countdownRunning = false;
    setChronoCompact(false);
    document.getElementById('countdown-hud').hidden = true;
    document.getElementById('countdown-results').hidden = true;
    if(practiceMode!=='countdown'){
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

  // Mode "Manuel" : choix d'un THÈME (DOMAINS, noyau.js) puis d'une activité de ce thème, à répéter
  // en boucle. Un thème réunit les écrans propres (Mesurer, Déformer, Patron…) ET les types de
  // Quizz de même thème (Unités de longueur, Périmètre…), plus « un peu de tout » (tirage sans
  // remise parmi les activités du thème disponibles au niveau choisi). Le niveau (en dessous)
  // dépend de l'activité : moins de boutons si elle n'existe pas en Facile et/ou en Moyen.
  var manualMix = null;   // « un peu de tout » : { id, units } ; manualFamily vaut alors 'mix'
  // Activités d'un thème : [{ key, type, label, levels }] (type = type de Quizz, null pour un écran propre).
  function domainUnits(domainId){
    var units = [];
    FAMILIES.forEach(function(f){
      if(f.key!=='qcm' && domainOrFallback(f.domain)===domainId) units.push({ key:f.key, type:null, label:f.tag, levels:f.levels || [0,1,2] });
    });
    var seen = {};   // union des types de Quizz sur tous les niveaux : une activité ne disparaît jamais selon le niveau en cours
    M4_LEVELS.forEach(function(lv){
      lv.types.forEach(function(t){
        var d = quizTypeById(t);
        if(!d || seen[t] || quizDomainId(d)!==domainId) return;
        seen[t] = true;
        units.push({ key:'qcm', type:t, label:d.label || t, title:d.longLabel || d.label || t, levels:qcmTypeLevels(t) });
      });
    });
    return units;
  }
  function unitAvailable(u, level){
    return u.type ? M4_LEVELS[level].types.indexOf(u.type)!==-1 : u.levels.indexOf(level)!==-1;
  }
  // Activité suivante du « un peu de tout » (appelée par nextPracticeQuestion).
  function manualMixPick(){
    var av = manualMix.units.filter(function(u){ return unitAvailable(u, globalLevel); });
    if(!av.length) av = manualMix.units;
    var u = pickFresh('manualmix|' + manualMix.id + '|' + globalLevel + '|' + av.length, av);
    return { key:u.key, type:u.type, why:'' };
  }
  function startManualUnit(u){
    manualMix = null;
    manualFamily = u.key;
    m4TypeFilter = u.type || 'random';
    rebuildManualLevelRow(u.levels);
    // Sans niveaux à choisir, l'épreuve démarre tout de suite ; sinon elle attend le choix du niveau.
    if(!manualAvailableLevels.length) showManualExercise();
  }
  function startManualMix(domainId, units){
    manualMix = { id:domainId, units:units };
    manualFamily = 'mix';
    m4TypeFilter = 'random';
    rebuildManualLevelRow([0,1,2].filter(function(lv){ return units.some(function(u){ return unitAvailable(u, lv); }); }));
  }
  function resetManualChoice(){
    manualFamily = null; manualMix = null;
    m4TypeFilter = 'random';
    document.getElementById('manual-level-wrap').hidden = true;
    manualLevelChosen = false; manualAvailableLevels = [];
    document.getElementById('practice-exercise').hidden = true;
    updateManualToggle();
  }
  // Choix en tuiles : grille régulière (icône au-dessus du nom) plutôt qu'une file de pastilles de largeurs inégales.
  function tileRow(container, cols, icons, titles){
    container.classList.add('tile-grid', 'tiles-' + cols);
    container.querySelectorAll('.level-btn').forEach(function(b, i){
      var txt = b.textContent;
      if(icons && icons[i]){
        b.textContent = '';
        var ico = document.createElement('span'); ico.className = 'tile-ico'; ico.setAttribute('aria-hidden','true'); ico.textContent = icons[i];
        var nm = document.createElement('span'); nm.textContent = txt;
        b.appendChild(ico); b.appendChild(nm);
      }
      if(titles && titles[i]) b.title = titles[i];
    });
  }
  var MANUAL_DOMAINS = DOMAINS.filter(function(d){ return domainUnits(d.id).length; });
  buildLevelRow(
    document.getElementById('manual-domain-row'),
    MANUAL_DOMAINS.map(function(d){ return d.short; }),
    -1,
    function(idx){
      var dom = MANUAL_DOMAINS[idx], units = domainUnits(dom.id);
      var unitWrap = document.getElementById('manual-unit-wrap');
      if(units.length === 1){
        unitWrap.hidden = true;
        startManualUnit(units[0]);
        return;
      }
      unitWrap.hidden = false;
      resetManualChoice();
      buildLevelRow(document.getElementById('manual-unit-row'),
        ['🎲 Un peu de tout'].concat(units.map(function(u){ return u.label; })), -1,
        function(j){ if(j===0) startManualMix(dom.id, units); else startManualUnit(units[j-1]); });
      tileRow(document.getElementById('manual-unit-row'), 2, null, [''].concat(units.map(function(u){ return u.title || u.label; })));
      document.querySelector('#manual-unit-row .level-btn').classList.add('tile-wide');
    }
  );
  tileRow(document.getElementById('manual-domain-row'), 3, MANUAL_DOMAINS.map(function(d){ return d.icon; }));

  setGlobalLevel(0); // charge la toute première question, niveau Facile

