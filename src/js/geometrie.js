  /* ===================== THÈME GÉOMÉTRIE =====================
     Mesurer (règle), Estimer une longueur, Déformer (formes) et les questions de Quizz de géométrie :
     côtés, sommets, nom, angles, alignement, milieu, repérage, codage/décodage,
     chasse aux formes, symétrie, scènes illustrées, énigmes.
  */

  /* ===================== MODULE 1 : MESURER ===================== */
  registerFamily({
    key:'measure', tag:'Mesurer', domain:'mesures', order:10, timed:true,
    note:'Une seule épreuve, sans sous-types. Le niveau fixe les paramètres du tirage : longueur du trait (1 à 9 cm en Facile, avec des plages plus larges et des demi-cm en Difficile), position de départ de la règle (toujours 0 en Facile/Moyen, peut démarrer dans les négatifs en Difficile) et décalage du segment. À l\'intérieur de cette plage, tout est tiré au hasard à chaque question — c\'est la plage elle-même qui est fixée par le niveau, pas les valeurs.',
    markup:[
      '<div class="coach-row">',
      '  <div class="coach-bubble" id="m1-question">Combien mesure ce trait ?</div>',
      '</div>',
      '<p class="muted">Regarde bien la règle, puis choisis la bonne longueur.</p>',
      '<div class="ruler-wrap"><svg id="rulerSvg" viewBox="0 0 320 100" role="img" aria-label="Règle graduée avec un segment à mesurer"></svg></div>',
      '<div class="choices" id="m1-choices"></div>',
      '<div class="feedback" id="m1-feedback"></div>',
      '<div class="btn-row">',
      '  <button class="btn primary" id="m1-next" type="button">Nouvelle activité ↻</button>',
      '</div>'
    ].join('\n'),
    generate:function(){ newMeasureQuestion(); },
    signature:function(){ return globalLevel + '|' + currentLen + '|' + m1RulerStart + '|' + m1SegStart; }
  });
  /* ---------------------------------------------------------------
     Le 0 doit toujours être visible sur la règle (demande explicite) :
     - Facile/Moyen : la règle commence à 0, seul le début du trait bouge.
     - Difficile : la règle peut s'étendre dans les négatifs, mais son
       étendue couvre toujours le 0 (startMin/visibleLen le garantissent).
  */
  var M1_LEVELS = [
    { name:'Facile',    visibleLen:10, startMin:0,  startMax:0,  offsetMax:0, half:false, lenMin:1, lenMax:9 },
    { name:'Moyen',     visibleLen:14, startMin:0,  startMax:0,  offsetMax:4, half:false, lenMin:2, lenMax:8 },
    { name:'Difficile', visibleLen:15, startMin:-4, startMax:-1, offsetMax:5, half:true,  lenMin:2, lenMax:8 }
  ];
  var currentLen = 5, m1SegStart = 0, m1SegEnd = 5, m1RulerStart = 0;

  function drawRuler(segStart, segEnd, rulerStart, visibleLen, half){
    var svg = document.getElementById('rulerSvg');
    var scalePx = Math.floor(280/visibleLen);
    var originX = 24;
    var baseY = 46;
    var viewW = originX + visibleLen*scalePx + 16;
    svg.setAttribute('viewBox', '0 0 '+viewW+' 100');
    svg.innerHTML = "";
    function toX(v){ return originX + (v-rulerStart)*scalePx; }

    for(var i=0;i<=visibleLen;i++){
      var value = rulerStart + i;
      var x = originX + i*scalePx;
      var tick = el('line', {x1:x,y1:baseY,x2:x,y2: (value%5===0)? baseY+16 : baseY+10, stroke:'var(--text-soft)', 'stroke-width': value%5===0?2:1.4});
      svg.appendChild(tick);
      var lbl = el('text', {x:x, y:baseY+30, 'text-anchor':'middle', 'font-size':9.5, fill:'var(--text-soft)', 'font-family':'var(--font-body)'});
      lbl.textContent = value;
      svg.appendChild(lbl);
      if(half && i<visibleLen){
        var hx = x + scalePx/2;
        svg.appendChild(el('line',{x1:hx,y1:baseY,x2:hx,y2:baseY+6,stroke:'var(--text-soft)','stroke-width':1}));
      }
    }
    var baseline = el('line', {x1:originX, y1:baseY, x2:originX+visibleLen*scalePx, y2:baseY, stroke:'var(--text-soft)', 'stroke-width':2});
    svg.appendChild(baseline);

    var sx = toX(segStart), ex = toX(segEnd);
    var segY = baseY - 18;
    [sx, ex].forEach(function(x){
      svg.appendChild(el('line',{x1:x,y1:segY-8,x2:x,y2:segY+8,stroke:'var(--accent)','stroke-width':3,'stroke-linecap':'round'}));
    });
    svg.appendChild(el('line',{x1:sx,y1:segY,x2:ex,y2:segY,stroke:'var(--accent)','stroke-width':5,'stroke-linecap':'round'}));
  }

  function newMeasureQuestion(){
    var lv = M1_LEVELS[globalLevel];
    var span = (lv.lenMax - lv.lenMin);
    if(lv.half){
      var steps = span*2;
      currentLen = lv.lenMin + Math.floor(Math.random()*(steps+1))/2;
    } else {
      currentLen = lv.lenMin + Math.floor(Math.random()*(span+1));
    }
    m1RulerStart = randInt(lv.startMin, lv.startMax);
    var offset = lv.offsetMax>0 ? randInt(0, lv.offsetMax) : 0;
    m1SegStart = m1RulerStart + offset;
    m1SegEnd = m1SegStart + currentLen;
    drawRuler(m1SegStart, m1SegEnd, m1RulerStart, lv.visibleLen, lv.half);

    // Génère 3 distracteurs distincts sans boucle infinie : on construit
    // un pool de valeurs candidates puis on en tire 3 au hasard.
    var pool = [];
    var stepUnit = lv.half ? 0.5 : 1;
    for(var k=-4; k<=4; k++){
      if(k===0) continue;
      var v = Math.round((currentLen + k*stepUnit)*2)/2;
      if(v>=lv.lenMin && v<=lv.lenMax && pool.indexOf(v)===-1) pool.push(v);
    }
    shuffle(pool);
    var picks = pool.slice(0, Math.min(3, pool.length));
    while(picks.length<3){
      // filet de sécurité si la plage est très étroite : complète avec des valeurs proches
      var extra = Math.round((currentLen + (Math.random()<0.5?-1:1)*stepUnit*(picks.length+1))*2)/2;
      extra = Math.max(lv.lenMin, Math.min(lv.lenMax, extra));
      if(picks.indexOf(extra)===-1 && extra!==currentLen) picks.push(extra);
      else break; // évite toute boucle infinie, quitte à avoir moins de 4 choix
    }
    var list = shuffle([currentLen].concat(picks));
    var wrap = document.getElementById('m1-choices');
    wrap.innerHTML = "";
    list.forEach(function(v){
      var b = document.createElement('button');
      b.className = 'choice-btn';
      b.type = 'button';
      b.textContent = fmtNum(v) + ' cm';
      b.addEventListener('click', function(){ checkMeasure(v, b); });
      wrap.appendChild(b);
    });
    m1Flow.start();
  }

  function measureExplain(){
    if(m1SegStart===0){
      return 'Compte le nombre de carreaux entre le début et la fin du trait.';
    }
    return 'Le trait va de ' + fmtNum(m1SegStart) + ' à ' + fmtNum(m1SegEnd) + ' : '
      + fmtNum(m1SegEnd) + ' − ' + fmtNum(m1SegStart) + ' = ' + fmtNum(currentLen) + ' cm.';
  }

  var m1Flow = makeQuestionFlow({ feedback:'m1-feedback', tries:1 });
  function checkMeasure(v, btn){
    if(m1Flow.closed) return;
    var buttons = document.querySelectorAll('#m1-choices .choice-btn');
    buttons.forEach(function(b){ b.disabled = true; });
    var ok = Math.abs(v-currentLen)<0.001;
    if(ok){
      btn.classList.add('correct');
      m1Flow.answer(true, { success:'Bravo, ce trait mesure bien ' + fmtNum(currentLen) + ' cm !', explain:measureExplain() });
    } else {
      btn.classList.add('wrong');
      buttons.forEach(function(b){ if(b.textContent === (fmtNum(currentLen)+' cm')) b.classList.add('correct'); });
      m1Flow.answer(false, { solution:'Le trait mesure ' + fmtNum(currentLen) + ' cm : la bonne réponse est en vert.', explain:measureExplain() });
    }
  }

  document.getElementById('m1-next').addEventListener('click', function(){ m1Flow.skip(); });

  /* ===================== MODULE 1 bis : ESTIMER UNE LONGUEUR =====================
     Une règle fixe de 10 cm dont on ne voit que le 0 et le 10 : il faut deviner
     la longueur du trait « au jugé », en s'aidant des repères (la moitié, c'est
     5 cm…). Après la réponse, les graduations apparaissent pour vérifier.
     Facile : trait posé contre le 0, réponses espacées d'au moins 2 cm.
     Moyen : trait posé contre le 0, réponses à 1 cm près.
     Difficile : trait décalé (il ne part pas du 0), demi-centimètres. */
  var ESTIMATE_LEVELS = [
    { name:'Facile',    half:false, offset:false, gaps:[2,3,4,5,6] },
    { name:'Moyen',     half:false, offset:false, gaps:[1,2,3] },
    { name:'Difficile', half:true,  offset:true,  gaps:[1,1.5,2,2.5] }
  ];
  var estLen = 5, estStart = 0;
  registerFamily({
    key:'estimate', tag:'Estimer une longueur', domain:'mesures', order:12, timed:true,
    note:'La règle mesure toujours 10 cm mais seuls le 0 et le 10 sont écrits : on estime la longueur du trait à l\'œil. Facile : le trait part du 0, longueurs de 1 à 9 cm, réponses espacées d\'au moins 2 cm. Moyen : le trait part du 0, réponses à 1 cm près. Difficile : le trait est posé plus bas et ne part pas du 0, longueurs en demi-centimètres. La longueur, la position et les réponses proposées sont tirées au hasard. Après la réponse, les graduations apparaissent pour vérifier.',
    markup:[
      '<div class="coach-row">',
      '  <div class="coach-bubble" id="est-question">À ton avis, combien mesure ce trait ?</div>',
      '</div>',
      '<p class="muted" id="est-sub">La règle mesure 10 cm. Estime la longueur à l\'œil.</p>',
      '<div class="ruler-wrap"><svg id="estSvg" viewBox="0 0 320 110" role="img" aria-label="Règle de 10 cm sans graduations et un trait à estimer"></svg></div>',
      '<div class="choices" id="est-choices"></div>',
      '<div class="feedback" id="est-feedback"></div>',
      '<div class="btn-row">',
      '  <button class="btn primary" id="est-next" type="button">Nouvelle activité ↻</button>',
      '</div>'
    ].join('\n'),
    generate:function(level){ newEstimateQuestion(level); },
    signature:function(){ return globalLevel + '|' + estLen + '|' + estStart; }
  });

  // reveal = true : on montre les graduations (après la réponse)
  function drawEstimate(reveal){
    var svg = document.getElementById('estSvg');
    var scalePx = 28, originX = 20, baseY = 42, W = originX*2 + 10*scalePx;
    svg.setAttribute('viewBox', '0 0 ' + W + ' 110');
    svg.innerHTML = '';
    function toX(v){ return originX + v*scalePx; }
    // corps de la règle
    svg.appendChild(el('rect', { x:originX-8, y:baseY-2, width:10*scalePx+16, height:34, rx:5, fill:'var(--surface2)', stroke:'var(--text-soft)', 'stroke-width':1.5 }));
    [0, 10].forEach(function(v){
      svg.appendChild(el('line', { x1:toX(v), y1:baseY-2, x2:toX(v), y2:baseY+16, stroke:'var(--text)', 'stroke-width':2.2 }));
      var t = el('text', { x:toX(v), y:baseY+28, 'text-anchor':'middle', 'font-size':11, 'font-weight':700, fill:'var(--text)', 'font-family':'var(--font-body)' });
      t.textContent = v; svg.appendChild(t);
    });
    if(reveal){
      for(var i=1;i<10;i++){
        svg.appendChild(el('line', { x1:toX(i), y1:baseY-2, x2:toX(i), y2:baseY + (i===5 ? 14 : 9), stroke:'var(--text-soft)', 'stroke-width':i===5 ? 1.8 : 1.3, class:'est-grad' }));
        var g = el('text', { x:toX(i), y:baseY+26, 'text-anchor':'middle', 'font-size':9, fill:'var(--text-soft)', 'font-family':'var(--font-body)', class:'est-grad' });
        g.textContent = i; svg.appendChild(g);
      }
      for(var h=0; h<10; h++) svg.appendChild(el('line', { x1:toX(h+0.5), y1:baseY-2, x2:toX(h+0.5), y2:baseY+5, stroke:'var(--text-soft)', 'stroke-width':1, class:'est-grad' }));
    }
    // le trait : contre la règle (au-dessus) ou posé plus bas, décalé
    var segY = ESTIMATE_LEVELS[globalLevel].offset ? baseY + 58 : baseY - 16;
    var sx = toX(estStart), ex = toX(estStart + estLen);
    [sx, ex].forEach(function(x){ svg.appendChild(el('line', { x1:x, y1:segY-8, x2:x, y2:segY+8, stroke:'var(--accent)', 'stroke-width':3, 'stroke-linecap':'round' })); });
    svg.appendChild(el('line', { x1:sx, y1:segY, x2:ex, y2:segY, stroke:'var(--accent)', 'stroke-width':5, 'stroke-linecap':'round' }));
    // après la réponse, en Difficile : pointillés qui ramènent le trait sur la règle
    if(reveal && ESTIMATE_LEVELS[globalLevel].offset) [sx, ex].forEach(function(x){
      svg.appendChild(el('line', { x1:x, y1:segY-8, x2:x, y2:baseY+30, stroke:'var(--accent)', 'stroke-width':1.5, 'stroke-dasharray':'4 3' }));
    });
  }

  function newEstimateQuestion(level){
    var lv = ESTIMATE_LEVELS[level];
    var step = lv.half ? 0.5 : 1;
    estLen = lv.half ? randInt(3, 18)/2 : randInt(1, 9);          // 1 à 9 cm (1,5 à 9 en Difficile)
    estStart = lv.offset ? randInt(0, Math.floor((10 - estLen)/step))*step : 0;
    drawEstimate(false);
    // 3 autres réponses : écarts tirés dans lv.gaps, de part et d'autre, entre 0,5 et 10 cm
    var cands = [];
    lv.gaps.forEach(function(g){ [-1,1].forEach(function(s){
      var v = Math.round((estLen + s*g)*2)/2;
      if(v >= 0.5 && v <= 10 && cands.indexOf(v)===-1 && v!==estLen) cands.push(v);
    }); });
    // en Facile, les réponses doivent aussi être espacées entre elles d'au moins 2 cm
    // (on retente plusieurs mélanges : une combinaison qui convient existe toujours)
    var minGap = lv.gaps[0], picks = [];
    for(var tries = 0; tries < 40 && picks.length < 3; tries++){
      picks = [];
      shuffle(cands.slice()).forEach(function(v){
        if(picks.length < 3 && picks.every(function(p){ return Math.abs(p - v) >= minGap; })) picks.push(v);
      });
    }
    var list = [estLen].concat(picks).sort(function(a, b){ return a - b; });
    var wrap = document.getElementById('est-choices');
    wrap.innerHTML = '';
    list.forEach(function(v){
      var b = document.createElement('button');
      b.className = 'choice-btn';
      b.type = 'button';
      b.textContent = fmtNum(v) + ' cm';
      b.addEventListener('click', function(){ checkEstimate(v, b); });
      wrap.appendChild(b);
    });
    document.getElementById('est-sub').textContent = lv.offset
      ? 'La règle mesure 10 cm. Le trait ne part pas du 0 : estime sa longueur à l\'œil.'
      : 'La règle mesure 10 cm. Estime la longueur du trait à l\'œil.';
    estFlow.start();
  }
  // Repères pour expliquer : la moitié de la règle (5 cm), un quart, trois quarts, toute la règle.
  function estimateExplain(){
    var L = estLen, ref;
    if(L === 5) ref = 'C\'est exactement la moitié de la règle.';
    else if(L < 2) ref = 'C\'est tout petit : moins de 2 cm, bien moins que la moitié de la règle.';
    else if(L < 5) ref = (L >= 4 ? 'Un peu moins' : 'Moins') + ' que la moitié de la règle (5 cm).';
    else if(L < 8) ref = (L <= 6 ? 'Un peu plus' : 'Plus') + ' que la moitié de la règle (5 cm).';
    else ref = 'Presque toute la règle (10 cm).';
    return 'Le trait mesure ' + fmtNum(L) + ' cm. ' + ref + ' Regarde les graduations qui viennent d\'apparaître.';
  }
  var estFlow = makeQuestionFlow({ feedback:'est-feedback', tries:1 });
  function checkEstimate(v, btn){
    if(estFlow.closed) return;
    var buttons = document.querySelectorAll('#est-choices .choice-btn');
    buttons.forEach(function(b){ b.disabled = true; });
    drawEstimate(true);
    document.getElementById('estSvg').setAttribute('aria-label', 'Règle de 10 cm, graduations visibles : le trait mesure ' + fmtNum(estLen) + ' cm');
    var ok = Math.abs(v - estLen) < 0.001;
    if(ok){
      btn.classList.add('correct');
      estFlow.answer(true, { success:'Bravo, bien vu : ' + fmtNum(estLen) + ' cm !', explain:estimateExplain() });
    } else {
      btn.classList.add('wrong');
      buttons.forEach(function(b){ if(b.textContent === fmtNum(estLen) + ' cm') b.classList.add('correct'); });
      estFlow.answer(false, { solution:'Le trait mesure ' + fmtNum(estLen) + ' cm : la bonne réponse est en vert.', explain:estimateExplain() });
    }
  }
  document.getElementById('est-next').addEventListener('click', function(){ estFlow.skip(); });

  /* ===================== MODULE 2 : DEFORMER ===================== */
  registerFamily({
    key:'deform', tag:'Déformer', domain:'formes', order:20,
    note:'Une seule épreuve avec 5 formes cibles (losange, rectangle, parallélogramme, triangle isocèle, triangle rectangle) : la forme est tirée au hasard à CHAQUE question, quel que soit le niveau — le niveau ne choisit jamais la forme. Ce que change le niveau, c\'est la déformation de départ par rapport à la cible : 1 seul coin décalé en Facile, 3 coins (2 pour un triangle) en Moyen, tous les coins en Difficile (avec une amplitude de décalage elle aussi croissante). Tout le reste (quel(s) coin(s), direction, amplitude exacte dans la plage) est tiré au hasard. Les longueurs (et, selon la forme, les angles) s\'affichent en direct ; après « Vérifier », une forme approximative ou ratée se remet juste.',
    markup:[
      '<div class="coach-row">',
      '  <div class="coach-bubble" id="m2-question">Transforme la forme.</div>',
      '</div>',
      '<p class="muted" id="m2-instructions">Fais glisser les coins, puis vérifie.</p>',
      '<div class="deform-wrap"><svg id="deformSvg" viewBox="0 0 260 260" role="group" aria-label="Forme à déformer : quatre coins à déplacer (à la souris, au doigt ou avec les flèches du clavier)"></svg></div>',
      '<div class="feedback" id="m2-feedback"></div>',
      '<div class="btn-row">',
      '  <button class="btn primary" id="m2-check" type="button">Vérifier ✅</button>',
      '  <button class="btn primary" id="m2-next" type="button">Nouvelle activité ↻</button>',
      '</div>'
    ].join('\n'),
    generate:function(){ newDeformQuestion(); },
    signature:function(){ return m2ShapeIdx + '|' + m2StartPts.map(function(p){ return Math.round(p[0]) + ',' + Math.round(p[1]); }).join(';'); }
  });
  var SCALE2 = 20; // px per cm
  var basePts = [[70,70],[190,70],[190,190],[70,190]];
  var pts = basePts.map(function(p){ return p.slice(); });
  var m2StartPts = pts.map(function(p){ return p.slice(); });
  var m2ShapeIdx = 0;

  // Les 3 formes cibles restent les mêmes (Losange/Rectangle/Parallélogramme),
  // tirées au hasard à chaque exercice. Ce qui change maintenant avec le
  // niveau (Facile/Moyen/Difficile), c'est la distance de départ par rapport
  // à cette cible : un seul coin décalé en Facile, plusieurs coins bien
  // décalés en Moyen, les 4 coins très décalés en Difficile — voir
  // perturbForLevel() plus bas.
  var M2_LEVELS = [
    { name:'Losange',      question:'Transforme la forme en losange.', instr:"Fais glisser les coins : les 4 côtés doivent être à peu près égaux. Puis vérifie.", angles:false, check:checkRhombus, tolGreat:0.15, tolOk:0.30 },
    { name:'Rectangle',    question:'Transforme la forme en rectangle.', instr:"Fais glisser les coins : les côtés opposés à peu près égaux, et les 4 angles à peu près droits. Puis vérifie.", angles:true, check:checkRectangle, tolGreat:{side:0.14, angle:12}, tolOk:{side:0.26, angle:20} },
    { name:'Parallélogramme', question:'Transforme la forme en parallélogramme.', instr:"Fais glisser les coins : les côtés opposés à peu près égaux, mais des angles qui ne sont pas droits. Puis vérifie.", angles:true, check:checkParallelogram, tolGreat:{side:0.14, tilt:15}, tolOk:{side:0.26, tilt:8} },
    { name:'Triangle isocèle', question:'Transforme la forme en triangle isocèle.', instr:"Fais glisser les 3 coins : 2 côtés doivent être à peu près égaux (et le 3e différent). Puis vérifie.", angles:false, check:checkIsosceles, tolGreat:0.05, tolOk:0.10 },
    { name:'Triangle rectangle', question:'Transforme la forme en triangle rectangle.', instr:"Fais glisser les 3 coins : un des angles doit être droit (comme le coin d'une feuille). Puis vérifie.", angles:true, check:checkRightTriangle, tolGreat:6, tolOk:12 }
  ];

  function dist(a,b){ return Math.hypot(a[0]-b[0], a[1]-b[1]); }
  function angleAtDeg(prev,curr,next){
    var v1=[prev[0]-curr[0],prev[1]-curr[1]], v2=[next[0]-curr[0],next[1]-curr[1]];
    var dot=v1[0]*v2[0]+v1[1]*v2[1];
    var m1=Math.hypot(v1[0],v1[1]), m2=Math.hypot(v2[0],v2[1]);
    if(m1<1e-6||m2<1e-6) return 90;
    var c = Math.max(-1, Math.min(1, dot/(m1*m2)));
    return Math.acos(c)*180/Math.PI;
  }

  function sidesAndAngles(){
    var n = pts.length, idx = []; for(var k=0;k<n;k++) idx.push(k);
    var lens = idx.map(function(i){ return dist(pts[i], pts[(i+1)%n]); });
    var angles = idx.map(function(i){
      var prev = pts[(i+n-1)%n], curr = pts[i], next = pts[(i+1)%n];
      return angleAtDeg(prev,curr,next);
    });
    return {lens:lens, angles:angles};
  }

  // Chaque contrôle renvoie { ok, approx?, success, detail, hint } (format de makeQuestionFlow) :
  // `approx` = réussi seulement dans la tolérance large (la forme sera alors remise juste sous les yeux de l'enfant).
  function checkRhombus(tolGreat, tolOk){
    var s = sidesAndAngles();
    var avg = s.lens.reduce(function(a,b){return a+b;},0)/4;
    var maxDev = Math.max.apply(null, s.lens.map(function(l){ return Math.abs(l-avg); }));
    var rel = maxDev/avg;
    if(rel <= tolGreat) return {ok:true, success:'Bravo, c\'est un losange !', detail:'Les 4 côtés sont égaux.'};
    if(rel <= tolOk) return {ok:true, approx:true, success:'Bravo, c\'est un losange !', detail:'Les côtés sont à peu près égaux : regarde la forme se remettre bien juste.'};
    return {ok:false, hint:'Les 4 côtés doivent avoir à peu près la même longueur.'};
  }

  function checkRectangle(tolGreat, tolOk){
    var s = sidesAndAngles();
    var avg = s.lens.reduce(function(a,b){return a+b;},0)/4;
    var sideDevRel = Math.max(Math.abs(s.lens[0]-s.lens[2]), Math.abs(s.lens[1]-s.lens[3])) / avg;
    var angleDevMax = Math.max.apply(null, s.angles.map(function(a){ return Math.abs(a-90); }));
    if(sideDevRel<=tolGreat.side && angleDevMax<=tolGreat.angle) return {ok:true, success:'Bravo, c\'est un rectangle !', detail:'Les côtés opposés sont égaux et les angles sont bien droits.'};
    if(sideDevRel<=tolOk.side && angleDevMax<=tolOk.angle) return {ok:true, approx:true, success:'Bravo, c\'est un rectangle !', detail:'Ce n\'est pas tout à fait précis : regarde la forme se remettre bien droite.'};
    if(angleDevMax>tolOk.angle) return {ok:false, hint:'Les 4 angles doivent redevenir à peu près droits.'};
    return {ok:false, hint:'Les côtés opposés doivent être à peu près de la même longueur.'};
  }

  function checkParallelogram(tolGreat, tolOk){
    var s = sidesAndAngles();
    var avg = s.lens.reduce(function(a,b){return a+b;},0)/4;
    var sideDevRel = Math.max(Math.abs(s.lens[0]-s.lens[2]), Math.abs(s.lens[1]-s.lens[3])) / avg;
    var angleDevMin = Math.min.apply(null, s.angles.map(function(a){ return Math.abs(a-90); }));
    if(sideDevRel<=tolGreat.side && angleDevMin>=tolGreat.tilt) return {ok:true, success:'Bravo, c\'est un parallélogramme !', detail:'Les côtés opposés sont égaux et la forme est bien penchée.'};
    if(sideDevRel<=tolOk.side && angleDevMin>=tolOk.tilt) return {ok:true, approx:true, success:'Bravo, c\'est un parallélogramme !', detail:'Ce n\'est pas tout à fait précis : regarde la forme se remettre bien juste.'};
    if(sideDevRel>tolOk.side) return {ok:false, hint:'Les côtés opposés doivent rester à peu près de la même longueur.'};
    return {ok:false, hint:'Penche un peu plus la forme : les angles ne doivent plus être droits.'};
  }

  // Triangle isocèle : on cherche la paire de côtés la plus proche ; elle doit être (presque)
  // égale, et le triangle ne doit pas être aplati (sinon 3 points alignés « marcheraient »).
  function checkIsosceles(tolGreat, tolOk){
    var s = sidesAndAngles(), L = s.lens, best = 9, bi = 0, bj = 1, i, j;
    for(i=0;i<3;i++) for(j=i+1;j<3;j++){
      var d = Math.abs(L[i]-L[j]) / Math.max(L[i], L[j]);
      if(d < best){ best = d; bi = i; bj = j; }
    }
    var minAngle = Math.min.apply(null, s.angles);
    if(minAngle < 18) return {ok:false, hint:'Le triangle est trop aplati : écarte un coin pour qu\'il redevienne un vrai triangle.'};
    var others = [0,1,2].filter(function(k){ return k!==bi && k!==bj; });
    if(best <= tolOk && Math.abs(L[others[0]]-L[bi]) / Math.max(L[others[0]], L[bi]) < 0.08) return {ok:false, hint:'Les 3 côtés sont égaux : c\'est un triangle équilatéral. Pour un isocèle, un côté doit être différent des deux autres.'};
    if(best <= tolGreat) return {ok:true, success:'Bravo, c\'est un triangle isocèle !', detail:'Deux côtés sont bien égaux.'};
    if(best <= tolOk) return {ok:true, approx:true, success:'Bravo, c\'est un triangle isocèle !', detail:'Deux côtés sont à peu près égaux : regarde la forme se remettre bien juste.'};
    return {ok:false, hint:'Il faut que 2 côtés aient à peu près la même longueur (regarde les mesures en cm).'};
  }
  function checkRightTriangle(tolGreat, tolOk){
    var s = sidesAndAngles();
    var dev = Math.min.apply(null, s.angles.map(function(a){ return Math.abs(a-90); }));
    var minAngle = Math.min.apply(null, s.angles);
    if(minAngle < 15) return {ok:false, hint:'Le triangle est trop aplati : écarte un coin pour qu\'il redevienne un vrai triangle.'};
    if(dev <= tolGreat) return {ok:true, success:'Bravo, c\'est un triangle rectangle !', detail:'Il a bien un angle droit.'};
    if(dev <= tolOk) return {ok:true, approx:true, success:'Bravo, c\'est un triangle rectangle !', detail:'Un des angles est à peu près droit : regarde la forme se remettre bien droite.'};
    return {ok:false, hint:'Un des 3 angles doit devenir droit (90°, comme le coin d\'une feuille).'};
  }

  // Construit une forme cible qui satisfait DÉJÀ le critère "great" du type
  // demandé (losange/rectangle/parallélogramme), avec un peu de hasard sur
  // les proportions et une légère rotation pour varier l'affichage — la
  // rotation ne change ni les longueurs de côtés ni les angles internes,
  // donc elle ne remet jamais en cause la validité de la forme cible.
  function clampCoord(v){ return Math.max(20, Math.min(240, v)); }
  function rotatePt(p, cx, cy, rad){
    var dx=p[0]-cx, dy=p[1]-cy;
    return [cx + dx*Math.cos(rad) - dy*Math.sin(rad), cy + dx*Math.sin(rad) + dy*Math.cos(rad)];
  }
  function shapeTargetPoints(shapeIdx){
    var cx=130, cy=130, rot=rand(0,Math.PI/2), raw;
    if(shapeIdx===0){ // losange
      var d1=rand(90,150), d2=rand(60,d1-25);
      raw = [[0,-d1/2],[d2/2,0],[0,d1/2],[-d2/2,0]];
    } else if(shapeIdx===1){ // rectangle
      var w=rand(100,150), h=w*rand(0.5,0.75);
      raw = [[-w/2,-h/2],[w/2,-h/2],[w/2,h/2],[-w/2,h/2]];
    } else if(shapeIdx===3){ // triangle isocèle : base b, hauteur h (jamais équilatéral)
      var b, h, leg, gd = 0;
      do { b=rand(90,140); h=rand(70,130); leg=Math.hypot(h, b/2); } while(Math.abs(leg-b)/Math.max(leg,b) < 0.2 && gd++ < 50);
      raw = [[-b/2,h/2],[b/2,h/2],[0,-h/2]];
    } else if(shapeIdx===4){ // triangle rectangle : 2 côtés de l'angle droit (pas égaux, sinon isocèle)
      var a1=rand(90,140), a2=rand(55,85);
      raw = [[-a1/2,a2/2],[a1/2,a2/2],[-a1/2,-a2/2]];
    } else { // parallélogramme : rectangle + cisaillement horizontal
      var w2=rand(90,130), h2=rand(80,120);
      var shear = Math.tan(rand(24,36)*Math.PI/180) * h2;
      raw = [[-w2/2,-h2/2],[w2/2,-h2/2],[w2/2,h2/2],[-w2/2,h2/2]].map(function(p){
        return [p[0] + shear*(p[1]/h2), p[1]];
      });
    }
    return raw.map(function(p){
      var rp = rotatePt([p[0], p[1]], 0, 0, rot);
      return [clampCoord(cx+rp[0]), clampCoord(cy+rp[1])];
    });
  }

  // Facile = 1 seul coin décalé (petit effort), Moyen = 3 coins décalés
  // (plusieurs mouvements), Difficile = les 4 coins bien décalés (gros effort).
  function perturbForLevel(target, level){
    var n = target.length;
    var cornerCount = level===0 ? 1 : (level===2 ? n : (n===3 ? 2 : 3));
    var magRange = level===0 ? [35,55] : (level===2 ? [45,75] : [25,45]);
    var idxs = shuffle(target.map(function(_,i){ return i; })).slice(0, cornerCount);
    var startPts = target.map(function(p){ return p.slice(); });
    idxs.forEach(function(i){
      var ang = rand(0, Math.PI*2), mag = rand(magRange[0], magRange[1]);
      startPts[i][0] = clampCoord(startPts[i][0] + Math.cos(ang)*mag);
      startPts[i][1] = clampCoord(startPts[i][1] + Math.sin(ang)*mag);
    });
    return startPts;
  }

  var deformFocusIdx = null; // coin qui garde le focus clavier après un redessin
  var m2Revealed = false;    // après « Vérifier » : forme figée, longueurs ET angles mis en avant
  function cm1(v){ return (Math.round(v*10)/10).toFixed(1).replace('.', ','); }

  // Ce qui est « juste » en ce moment, pour colorer les mesures en direct (même exigence que la réussite
  // « bien précise » : tolGreat) : côtés qui conviennent, angles droits.
  function m2Matches(){
    var n = pts.length, s = sidesAndAngles(), L = s.lens, lv = M2_LEVELS[m2ShapeIdx], g = lv.tolGreat;
    var avg = L.reduce(function(a,b){ return a+b; }, 0) / n;
    var sides = L.map(function(){ return false; }), right = s.angles.map(function(){ return false; });
    if(m2ShapeIdx===0) sides = L.map(function(l){ return Math.abs(l-avg)/avg <= g; });
    else if(m2ShapeIdx===1 || m2ShapeIdx===2) sides = L.map(function(l, i){ return Math.abs(l-L[(i+2)%4])/avg <= g.side; });
    else if(m2ShapeIdx===3){
      var best = 9, bi = 0, bj = 1;
      for(var i=0;i<3;i++) for(var j=i+1;j<3;j++){ var d = Math.abs(L[i]-L[j])/Math.max(L[i],L[j]); if(d < best){ best = d; bi = i; bj = j; } }
      if(best <= g && Math.min.apply(null, s.angles) >= 18){ sides[bi] = true; sides[bj] = true; }
    }
    if(m2ShapeIdx===1) right = s.angles.map(function(a){ return Math.abs(a-90) <= g.angle; });
    if(m2ShapeIdx===4) right = s.angles.map(function(a){ return Math.abs(a-90) <= g; });
    return { sides:sides, right:right, angles:s.angles };
  }
  function unit(v){ var m = Math.hypot(v[0], v[1]) || 1; return [v[0]/m, v[1]/m]; }
  // Un angle : petit arc (ou carré s'il est droit) + sa valeur en degrés, du côté intérieur.
  function drawAngleMark(svg, idx, deg, isRight){
    var n = pts.length, prev = pts[(idx+n-1)%n], cur = pts[idx], next = pts[(idx+1)%n];
    var u1 = unit([prev[0]-cur[0], prev[1]-cur[1]]), u2 = unit([next[0]-cur[0], next[1]-cur[1]]);
    var cls = isRight ? 'angle-mark ok' : 'angle-mark';
    var r = 14;
    if(isRight){
      var a1 = [cur[0]+u1[0]*r*.8, cur[1]+u1[1]*r*.8], a2 = [a1[0]+u2[0]*r*.8, a1[1]+u2[1]*r*.8], a3 = [cur[0]+u2[0]*r*.8, cur[1]+u2[1]*r*.8];
      svg.appendChild(el('polyline', { points:[a1,a2,a3].map(function(p){ return p[0]+','+p[1]; }).join(' '), class:cls, fill:'none' }));
    } else {
      var cross = u1[0]*u2[1] - u1[1]*u2[0];
      svg.appendChild(el('path', { d:'M ' + (cur[0]+u1[0]*r) + ' ' + (cur[1]+u1[1]*r) + ' A ' + r + ' ' + r + ' 0 0 ' + (cross > 0 ? 1 : 0) + ' ' + (cur[0]+u2[0]*r) + ' ' + (cur[1]+u2[1]*r), class:cls, fill:'none' }));
    }
    var bis = unit([u1[0]+u2[0], u1[1]+u2[1]]);
    if(Math.hypot(u1[0]+u2[0], u1[1]+u2[1]) < 0.05) bis = [-u1[1], u1[0]];
    var d = deg < 40 ? 38 : 30;
    var t = el('text', { x:cur[0]+bis[0]*d, y:cur[1]+bis[1]*d+4, 'text-anchor':'middle', class:'angle-label' + (isRight ? ' ok' : '') });
    t.textContent = Math.round(deg) + '°';
    svg.appendChild(t);
  }
  // Traits d'égalité (| et ||) sur les côtés qui doivent être égaux (selon la forme) et qui le sont assez.
  function drawEqualTicks(svg, matches){
    var n = pts.length, groups = [];
    if(m2ShapeIdx === 0) groups = [[0,1,2,3]];
    else if(m2ShapeIdx === 1 || m2ShapeIdx === 2) groups = [[0,2],[1,3]];
    else if(m2ShapeIdx === 3) groups = [[0,1,2].filter(function(i){ return matches.sides[i]; })];
    var rank = 0;
    groups.forEach(function(g){
      if(g.length < 2 || !g.every(function(i){ return matches.sides[i]; })) return;
      rank++;
      g.forEach(function(i){
        var a = pts[i], b = pts[(i+1)%n], u = unit([b[0]-a[0], b[1]-a[1]]), nv = [-u[1], u[0]];
        for(var k=0;k<rank;k++){
          var off = 0.2*dist(a,b) + k*5, cx = a[0]+u[0]*off, cy = a[1]+u[1]*off;
          svg.appendChild(el('line', { x1:cx-nv[0]*7, y1:cy-nv[1]*7, x2:cx+nv[0]*7, y2:cy+nv[1]*7, class:'eq-tick' }));
        }
      });
    });
  }
  function drawDeform(){
    var svg = document.getElementById('deformSvg');
    svg.innerHTML = "";
    var m = m2Matches();
    var poly = el('polygon', {
      points: pts.map(function(p){return p[0]+','+p[1];}).join(' '),
      fill:'var(--accent2)', 'fill-opacity':'0.35', stroke:'var(--accent)', 'stroke-width':3
    });
    svg.appendChild(poly);
    // angles : en direct pour les formes où ils comptent (rectangle, parallélogramme, triangle rectangle) ;
    // après « Vérifier », toujours (avec les traits d'égalité des côtés)
    var showAngles = m2Revealed || M2_LEVELS[m2ShapeIdx].angles;
    if(m2Revealed) drawEqualTicks(svg, m);
    if(showAngles) m.angles.forEach(function(deg, i){ drawAngleMark(svg, i, deg, m.right[i] || (m2Revealed && Math.abs(deg-90) < 1.5)); });

    for(var i=0;i<pts.length;i++){
      var a = pts[i], b = pts[(i+1)%pts.length];
      var mx=(a[0]+b[0])/2, my=(a[1]+b[1])/2;
      var len = cm1(dist(a,b)/SCALE2);
      svg.appendChild(el('rect',{x:mx-18,y:my-9,width:36,height:16,rx:6,class:'side-label-bg' + (m.sides[i] ? ' ok' : '')}));
      var t = el('text',{x:mx,y:my+4,'text-anchor':'middle',class:'side-label' + (m.sides[i] ? ' ok' : '')});
      t.textContent = len+' cm';
      svg.appendChild(t);
    }

    pts.forEach(function(p, idx){
      var c = el('circle',{cx:p[0],cy:p[1],r:13,fill:'var(--accent)',stroke:'var(--text)','stroke-width':3,class:'handle'});
      if(m2Revealed){ c.setAttribute('r', 8); c.setAttribute('class', 'handle done'); svg.appendChild(c); return; }   // forme figée : plus rien à déplacer
      c.style.touchAction = 'none';
      // Accessibilité : chaque coin est atteignable au clavier (Tab) et se
      // déplace avec les flèches (Maj = pas plus grand), en plus du glisser.
      c.setAttribute('tabindex','0');
      c.setAttribute('role','button');
      c.setAttribute('aria-label','Coin ' + (idx+1) + ' sur ' + pts.length + ' : flèches du clavier pour le déplacer');
      c.addEventListener('keydown', function(ev){
        var step = ev.shiftKey ? 20 : 8, dx = 0, dy = 0;
        if(ev.key==='ArrowLeft') dx = -step; else if(ev.key==='ArrowRight') dx = step;
        else if(ev.key==='ArrowUp') dy = -step; else if(ev.key==='ArrowDown') dy = step;
        else return;
        ev.preventDefault();
        if(m2Flow.closed) return;
        m2Flow.clearHint();
        pts[idx][0] = Math.max(20, Math.min(240, pts[idx][0] + dx));
        pts[idx][1] = Math.max(20, Math.min(240, pts[idx][1] + dy));
        deformFocusIdx = idx;
        drawDeform();
      });
      c.addEventListener('pointerdown', function(ev){
        if(m2Flow.closed) return;
        m2Flow.clearHint();
        deformFocusIdx = null;
        // Le glisser est capté par le <svg> (jamais recréé), pas par le coin :
        // drawDeform() reconstruit les coins à chaque mouvement.
        ev.preventDefault();
        var pid = ev.pointerId;
        try{ svg.setPointerCapture(pid); }catch(e){}
        function toSvgPoint(clientX, clientY){
          var pt = svg.createSVGPoint();
          pt.x = clientX; pt.y = clientY;
          var m = svg.getScreenCTM().inverse();
          return pt.matrixTransform(m);
        }
        function move(mv){
          if(mv.pointerId !== pid) return;
          var sp = toSvgPoint(mv.clientX, mv.clientY);
          pts[idx][0] = Math.max(20, Math.min(240, sp.x));
          pts[idx][1] = Math.max(20, Math.min(240, sp.y));
          drawDeform();
        }
        function up(e2){
          if(e2 && e2.pointerId !== pid) return;
          svg.removeEventListener('pointermove', move);
          svg.removeEventListener('pointerup', up);
          svg.removeEventListener('pointercancel', up);
          try{ svg.releasePointerCapture(pid); }catch(e){}
        }
        svg.addEventListener('pointermove', move);
        svg.addEventListener('pointerup', up);
        svg.addEventListener('pointercancel', up);
      });
      svg.appendChild(c);
      if(deformFocusIdx === idx) c.focus();
    });
  }

  var m2Target = null;   // une forme juste, montrée si les 3 essais sont ratés
  var M2_EXPLAIN = [
    'Un losange a 4 côtés de la même longueur.',
    'Un rectangle a ses côtés opposés de même longueur et 4 angles droits.',
    'Un parallélogramme a ses côtés opposés de même longueur, mais ses angles ne sont pas droits.',
    'Un triangle isocèle a 2 côtés de la même longueur.',
    'Un triangle rectangle a un angle droit, comme le coin d\'une feuille.'
  ];
  function newDeformQuestion(){
    m2ShapeIdx = pickFresh('deform-shape', [0,1,2,3,4]);
    document.getElementById('m2-question').textContent = M2_LEVELS[m2ShapeIdx].question;
    document.getElementById('m2-instructions').textContent = M2_LEVELS[m2ShapeIdx].instr;
    m2Target = shapeTargetPoints(m2ShapeIdx);
    cancelAnimationFrame(m2MorphTimer); m2Revealed = false;
    document.getElementById('deformSvg').setAttribute('aria-label', 'Forme à déformer : coins à déplacer (à la souris, au doigt ou avec les flèches du clavier)');
    // le départ ne doit JAMAIS être déjà réussi : on retire la déformation tant que la forme passe le test
    var lvDef = M2_LEVELS[m2ShapeIdx], tries = 0;
    do {
      m2StartPts = perturbForLevel(m2Target, globalLevel);
      pts = m2StartPts.map(function(p){ return p.slice(); });
    } while(lvDef.check(lvDef.tolGreat, lvDef.tolOk).ok && ++tries < 40);
    drawDeform();
    m2Flow.start();
  }

  var m2Flow = makeQuestionFlow({ feedback:'m2-feedback', tries:MANIP_TRIES });
  document.getElementById('m2-next').addEventListener('click', function(){ m2Flow.skip(); });

  /* ---- La forme remise juste, à partir de CELLE de l'enfant (elle bouge peu, il reconnaît son dessin) ---- */
  function angOf(v){ return Math.atan2(v[1], v[0]); }
  function dirV(th, r){ return [r*Math.cos(th), r*Math.sin(th)]; }
  function normDeg(a){ while(a > Math.PI) a -= 2*Math.PI; while(a <= -Math.PI) a += 2*Math.PI; return a; }
  // Deux demi-droites (angles th1, th2) ramenées à un écart d'exactement 90°, en tournant chacune de la moitié de l'erreur.
  function squareUp(th1, th2){
    var d = normDeg(th2 - th1), target = d >= 0 ? Math.PI/2 : -Math.PI/2, fix = (d - target)/2;
    return [th1 + fix, th2 - fix];
  }
  function fitInBox(P){
    var xs = P.map(function(p){ return p[0]; }), ys = P.map(function(p){ return p[1]; });
    var minX = Math.min.apply(null, xs), maxX = Math.max.apply(null, xs), minY = Math.min.apply(null, ys), maxY = Math.max.apply(null, ys);
    var k = Math.min(1, 220/Math.max(maxX-minX, 1), 220/Math.max(maxY-minY, 1));
    var cx = (minX+maxX)/2, cy = (minY+maxY)/2;
    P = P.map(function(p){ return [cx + (p[0]-cx)*k, cy + (p[1]-cy)*k]; });
    var xs2 = P.map(function(p){ return p[0]; }), ys2 = P.map(function(p){ return p[1]; });
    var lx = Math.min.apply(null, xs2), hx = Math.max.apply(null, xs2), ly = Math.min.apply(null, ys2), hy = Math.max.apply(null, ys2);
    var dx = lx < 20 ? 20-lx : (hx > 240 ? 240-hx : 0), dy = ly < 20 ? 20-ly : (hy > 240 ? 240-hy : 0);
    return P.map(function(p){ return [p[0]+dx, p[1]+dy]; });
  }
  function m2Ideal(){
    var n = pts.length, i, out = null;
    if(n === 4){
      var c = [(pts[0][0]+pts[1][0]+pts[2][0]+pts[3][0])/4, (pts[0][1]+pts[1][1]+pts[2][1]+pts[3][1])/4];
      var a = [(pts[0][0]-pts[2][0])/2, (pts[0][1]-pts[2][1])/2], b = [(pts[1][0]-pts[3][0])/2, (pts[1][1]-pts[3][1])/2];
      var la = Math.hypot(a[0], a[1]), lb = Math.hypot(b[0], b[1]), ta = angOf(a), tb = angOf(b);
      if(m2ShapeIdx === 0){ var q = squareUp(ta, tb); a = dirV(q[0], la); b = dirV(q[1], lb); }       // diagonales perpendiculaires → 4 côtés égaux
      else if(m2ShapeIdx === 1){ var r = (la+lb)/2; a = dirV(ta, r); b = dirV(tb, r); }                   // diagonales égales → angles droits
      out = [[c[0]+a[0], c[1]+a[1]], [c[0]+b[0], c[1]+b[1]], [c[0]-a[0], c[1]-a[1]], [c[0]-b[0], c[1]-b[1]]];   // (diagonales qui se coupent en leur milieu : parallélogramme)
    } else if(m2ShapeIdx === 3){
      var L = sidesAndAngles().lens, best = 9, bi = 0, bj = 1, j;
      for(i=0;i<3;i++) for(j=i+1;j<3;j++){ var d = Math.abs(L[i]-L[j])/Math.max(L[i], L[j]); if(d < best){ best = d; bi = i; bj = j; } }
      var v = bi===0 && bj===1 ? 1 : (bi===1 && bj===2 ? 2 : 0);      // sommet commun aux deux côtés presque égaux
      var A = pts[(v+2)%3], B = pts[(v+1)%3], V = pts[v];
      var avg = (dist(V, A) + dist(V, B))/2, uA = unit([A[0]-V[0], A[1]-V[1]]), uB = unit([B[0]-V[0], B[1]-V[1]]);
      out = pts.map(function(p){ return p.slice(); });
      out[(v+2)%3] = [V[0]+uA[0]*avg, V[1]+uA[1]*avg]; out[(v+1)%3] = [V[0]+uB[0]*avg, V[1]+uB[1]*avg];
    } else if(m2ShapeIdx === 4){
      var ang = sidesAndAngles().angles, bv = 0;
      for(i=1;i<3;i++) if(Math.abs(ang[i]-90) < Math.abs(ang[bv]-90)) bv = i;
      var V2 = pts[bv], A2 = pts[(bv+2)%3], B2 = pts[(bv+1)%3];
      var vu = [A2[0]-V2[0], A2[1]-V2[1]], vw = [B2[0]-V2[0], B2[1]-V2[1]];
      var qq = squareUp(angOf(vu), angOf(vw)), nu = dirV(qq[0], Math.hypot(vu[0], vu[1])), nw = dirV(qq[1], Math.hypot(vw[0], vw[1]));
      out = pts.map(function(p){ return p.slice(); });
      out[(bv+2)%3] = [V2[0]+nu[0], V2[1]+nu[1]]; out[(bv+1)%3] = [V2[0]+nw[0], V2[1]+nw[1]];
    }
    if(out){
      out = fitInBox(out);
      var keep = pts; pts = out;
      var lv = M2_LEVELS[m2ShapeIdx], ok = lv.check(lv.tolGreat, lv.tolOk);
      pts = keep;
      if(ok.ok && !ok.approx) return out;
    }
    return m2Target.map(function(p){ return p.slice(); });   // repli : une forme juste tirée au départ
  }
  // Phrase qui nomme les longueurs ET les angles de la forme juste (mesurés sur le dessin affiché).
  function m2Describe(P){
    var keep = pts; pts = P;
    var s = sidesAndAngles(), L = s.lens.map(function(l){ return cm1(l/SCALE2); }), A = s.angles.map(function(a){ return Math.round(a); });
    pts = keep;
    var txt;
    if(m2ShapeIdx === 0) txt = 'Les 4 côtés mesurent ' + L[0] + ' cm.';
    else if(m2ShapeIdx === 1) txt = 'Côtés : ' + L[0] + ' cm et ' + L[1] + ' cm. Les 4 angles mesurent 90°.';
    else if(m2ShapeIdx === 2) txt = 'Côtés : ' + L[0] + ' cm et ' + L[1] + ' cm. Angles : ' + A[0] + '° et ' + A[1] + '°.';
    else if(m2ShapeIdx === 3){
      var sorted = s.lens.map(function(l, i){ return [l, i]; }).sort(function(x, y){ return x[0]-y[0]; });
      var gap = [Math.abs(sorted[0][0]-sorted[1][0]), Math.abs(sorted[1][0]-sorted[2][0])], odd = gap[0] < gap[1] ? 2 : 0, eq = gap[0] < gap[1] ? sorted[0][1] : sorted[1][1];
      txt = 'Deux côtés égaux de ' + L[eq] + ' cm, le troisième de ' + L[sorted[odd][1]] + ' cm.';
    } else {
      var right = A.indexOf(90) !== -1 ? A.indexOf(90) : 0, others = A.filter(function(x, i){ return i !== right; });
      txt = 'Un angle droit de 90°, les deux autres de ' + others[0] + '° et ' + others[1] + '°.';
    }
    return txt;
  }
  // Fait glisser la forme de l'enfant vers la forme juste : les mesures bougent en direct sous ses yeux.
  var m2MorphTimer = null;
  function m2MorphTo(target, done){
    var from = pts.map(function(p){ return p.slice(); });
    var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var t0 = null, DUR = 900;
    cancelAnimationFrame(m2MorphTimer);
    function step(ts){
      if(t0 === null) t0 = ts;
      var k = reduced ? 1 : Math.min(1, (ts - t0)/DUR), e = k < .5 ? 2*k*k : 1 - Math.pow(-2*k + 2, 2)/2;
      pts = from.map(function(p, i){ return [p[0] + (target[i][0]-p[0])*e, p[1] + (target[i][1]-p[1])*e]; });
      drawDeform();
      if(k < 1) m2MorphTimer = requestAnimationFrame(step); else if(done) done();
    }
    m2MorphTimer = requestAnimationFrame(step);
  }
  function m2Reveal(){
    m2Revealed = true; deformFocusIdx = null;
    drawDeform();
    var svg = document.getElementById('deformSvg');
    svg.setAttribute('aria-label', 'Forme corrigée. ' + m2Describe(pts));
  }
  document.getElementById('m2-check').addEventListener('click', function(){
    if(m2Flow.closed) return;
    var lv = M2_LEVELS[m2ShapeIdx];
    var res = lv.check(lv.tolGreat, lv.tolOk);
    // forme juste à montrer : celle de l'enfant si elle est déjà bien précise, sinon sa version remise droite
    var willMorph = !res.ok || res.approx, ideal = willMorph ? m2Ideal() : null;
    res.explain = M2_EXPLAIN[m2ShapeIdx] + ' ' + m2Describe(willMorph ? ideal : pts);
    res.solution = 'Voici un ' + lv.name.toLowerCase() + ' bien formé.';
    var state = m2Flow.answer(res.ok, res);
    if(state === 'retry') return;
    if(willMorph) m2MorphTo(ideal, m2Reveal); else m2Reveal();   // verdict d'abord, puis la forme se remet juste
  });

  function regularPoly(n, rot){
    var pts=[];
    for(var i=0;i<n;i++){
      var a = rot + i*2*Math.PI/n;
      pts.push([100+72*Math.cos(a), 100+72*Math.sin(a)]);
    }
    return pts;
  }
  function rectPoly(w,h,rot){
    var hw=w/2, hh=h/2;
    var corners=[[-hw,-hh],[hw,-hh],[hw,hh],[-hw,hh]];
    return corners.map(function(p){
      var x=p[0]*Math.cos(rot)-p[1]*Math.sin(rot);
      var y=p[0]*Math.sin(rot)+p[1]*Math.cos(rot);
      return [100+x,100+y];
    });
  }

  var SHAPE_META = {
    triangle:  { sides:3, vertices:3, label:'triangle',  note:'Le triangle est la seule forme ici avec 3 côtés et 3 sommets : c\'est la forme qui en a le moins.', gen:function(){ return regularPoly(3, rand(0,2*Math.PI)); } },
    // Rotation volontairement limitée pour le carré et le rectangle : une
    // rotation proche de 45° ferait ressembler un carré à un losange à
    // l'oeil, ce qui entretiendrait exactement la confusion qu'on veut lever.
    carre:     { sides:4, vertices:4, label:'carré',     note:'Le carré a 4 côtés ÉGAUX et 4 angles droits. C\'est ce qui le différencie du losange (angles pas droits) et du rectangle (côtés pas tous égaux).', gen:function(){ return rectPoly(112,112, rand(-0.18,0.18)); } },
    rectangle: { sides:4, vertices:4, label:'rectangle', note:'Le rectangle a 4 angles droits comme le carré, mais ses côtés ne sont pas tous égaux : 2 côtés longs et 2 côtés courts.', gen:function(){ var w=95+Math.random()*35; return rectPoly(w, w*0.55, rand(-0.18,0.18)); } },
    pentagone: { sides:5, vertices:5, label:'pentagone', note:'Le pentagone a 5 côtés et 5 sommets.', gen:function(){ return regularPoly(5, rand(0,2*Math.PI)); } },
    hexagone:  { sides:6, vertices:6, label:'hexagone',  note:'L\'hexagone a 6 côtés et 6 sommets.', gen:function(){ return regularPoly(6, rand(0,2*Math.PI)); } },
    cercle:    { sides:0, vertices:0, label:'cercle', isCircle:true, note:'Le cercle est tout rond : contrairement aux autres formes, il n\'a ni côté droit, ni sommet.', gen:function(){ return { r: 55+Math.random()*20 }; } },
    losange:   { sides:4, vertices:4, label:'losange',   note:'Le losange a 4 côtés ÉGAUX, comme le carré, mais ses angles ne sont pas droits : il a l\'air "penché".', gen:function(){
      var rx=38+Math.random()*16, ry=58+Math.random()*16, rot=rand(0,Math.PI/2);
      var base=[[0,-ry],[rx,0],[0,ry],[-rx,0]];
      return base.map(function(p){
        var x=p[0]*Math.cos(rot)-p[1]*Math.sin(rot);
        var y=p[0]*Math.sin(rot)+p[1]*Math.cos(rot);
        return [100+x,100+y];
      });
    } }
  };
  var NAME_POOL = ['triangle','carré','rectangle','pentagone','hexagone','cercle','losange'];
  function drawPolygon(pts){
    var svg = document.getElementById('m4Svg');
    svg.setAttribute('viewBox','0 0 200 200');
    svg.innerHTML = "";
    svg.appendChild(el('polygon', {
      points: pts.map(function(p){return p[0]+','+p[1];}).join(' '),
      fill:'var(--accent2)', 'fill-opacity':'0.5', stroke:'var(--accent)', 'stroke-width':4, 'stroke-linejoin':'round'
    }));
  }

  function drawShapeGeneric(meta){
    if(meta.isCircle){
      var svg = document.getElementById('m4Svg');
      svg.setAttribute('viewBox','0 0 200 200');
      svg.innerHTML = "";
      var g = meta.gen();
      svg.appendChild(el('circle',{cx:100,cy:100,r:g.r, fill:'var(--accent2)','fill-opacity':'0.5',stroke:'var(--accent)','stroke-width':4}));
    } else {
      drawPolygon(meta.gen());
    }
  }

  function drawAngle(angleDeg){
    var svg = document.getElementById('m4Svg');
    svg.setAttribute('viewBox','0 0 200 200');
    svg.innerHTML = "";
    var vx=36, vy=164, len=140;
    var p1 = [vx+len, vy];
    var rad = angleDeg*Math.PI/180;
    var p2 = [vx+len*Math.cos(rad), vy-len*Math.sin(rad)];
    svg.appendChild(el('line',{x1:vx,y1:vy,x2:p1[0],y2:p1[1],stroke:'var(--accent)','stroke-width':6,'stroke-linecap':'round'}));
    svg.appendChild(el('line',{x1:vx,y1:vy,x2:p2[0],y2:p2[1],stroke:'var(--accent2)','stroke-width':6,'stroke-linecap':'round'}));
    svg.appendChild(el('circle',{cx:vx,cy:vy,r:5,fill:'var(--text)'}));
  }

  // Petit "musée" d'illustrations stockées (dessinées en SVG, donc légères,
  // mais toujours les mêmes formes) : chaque scène a sa propre question et
  // se randomise un peu (nombre d'éléments) pour éviter de répéter toujours
  // le même compte. Voir la note sur le stockage d'images à côté du code.
  function drawHouseScene(withWindow){
    var svg = document.getElementById('m4Svg');
    svg.setAttribute('viewBox','0 0 200 200');
    svg.innerHTML = "";
    // corps carré de la maison (4 angles droits)
    svg.appendChild(el('rect',{x:40,y:90,width:120,height:90,fill:'var(--accent2)','fill-opacity':'0.55',stroke:'var(--accent)','stroke-width':4}));
    // toit triangulaire (aucun angle droit)
    svg.appendChild(el('polygon',{points:'30,90 100,30 170,90', fill:'var(--accent3)','fill-opacity':'0.7', stroke:'var(--accent)','stroke-width':4,'stroke-linejoin':'round'}));
    // porte rectangulaire (4 angles droits)
    svg.appendChild(el('rect',{x:88,y:135,width:26,height:45,fill:'var(--surface)',stroke:'var(--accent)','stroke-width':3}));
    if(withWindow){
      // fenêtre rectangulaire (4 angles droits de plus)
      svg.appendChild(el('rect',{x:52,y:105,width:28,height:28,fill:'var(--surface)',stroke:'var(--accent)','stroke-width':3}));
    }
  }

  function genHouseQuestion(){
    var withWindow = Math.random()<0.5;
    var correct = withWindow ? 12 : 8;
    return {
      tag: 'Photo / illustration',
      question: 'Combien d\'angles droits vois-tu sur cette maison ?',
      sub: withWindow
        ? 'Compte les coins bien carrés du corps de la maison, de la porte et de la fenêtre (pas le toit).'
        : 'Compte les coins bien carrés du corps de la maison et de la porte (pas le toit).',
      explain: withWindow
        ? 'Le corps a 4 angles droits, la porte 4 et la fenêtre 4 : 4 + 4 + 4 = 12.'
        : 'Le corps de la maison a 4 angles droits et la porte en a 4 aussi : 4 + 4 = 8.',
      draw: function(){ drawHouseScene(withWindow); },
      cols3: false,
      choices: numChoiceSet(correct, [4,6,7,9,10,12,16]).map(function(v){ return { label:String(v), ok: v===correct }; })
    };
  }

  function drawFenceScene(count){
    var svg = document.getElementById('m4Svg');
    svg.setAttribute('viewBox','0 0 200 200');
    svg.innerHTML = "";
    var margin = 20, gap = 8;
    var totalGap = gap*(count-1);
    var w = (200 - 2*margin - totalGap)/count;
    for(var i=0;i<count;i++){
      var x = margin + i*(w+gap);
      svg.appendChild(el('rect',{x:x,y:70,width:w,height:100,fill:'var(--accent2)','fill-opacity':'0.6',stroke:'var(--accent)','stroke-width':3}));
    }
    // sol
    svg.appendChild(el('line',{x1:10,y1:172,x2:190,y2:172,stroke:'var(--accent)','stroke-width':4,'stroke-linecap':'round'}));
  }

  function genFenceQuestion(){
    var count = 3 + Math.floor(Math.random()*4); // 3 à 6
    return {
      tag: 'Photo / illustration',
      question: 'Combien de planches (rectangles) compte cette clôture ?',
      sub: 'Compte une par une les planches verticales.',
      explain: 'Il y a ' + count + ' planches, donc ' + count + ' rectangles.',
      draw: function(){ drawFenceScene(count); },
      cols3: false,
      choices: numChoiceSet(count, [2,3,4,5,6,7,8]).map(function(v){ return { label:String(v), ok: v===count }; })
    };
  }

  function drawCastleScene(towers){
    var svg = document.getElementById('m4Svg');
    svg.setAttribute('viewBox','0 0 200 200');
    svg.innerHTML = "";
    // mur central
    svg.appendChild(el('rect',{x:60,y:100,width:80,height:80,fill:'var(--accent2)','fill-opacity':'0.55',stroke:'var(--accent)','stroke-width':4}));
    svg.appendChild(el('rect',{x:90,y:140,width:20,height:40,fill:'var(--surface)',stroke:'var(--accent)','stroke-width':3}));
    var positions = towers===2 ? [30,140] : [22,88,154];
    positions.forEach(function(tx){
      svg.appendChild(el('rect',{x:tx,y:80,width:28,height:100,fill:'var(--accent2)','fill-opacity':'0.55',stroke:'var(--accent)','stroke-width':4}));
      // fanion triangulaire au sommet de la tour
      svg.appendChild(el('polygon',{points:(tx+14)+',48 '+tx+',80 '+(tx+28)+',80', fill:'var(--accent3)','fill-opacity':'0.8', stroke:'var(--accent)','stroke-width':3,'stroke-linejoin':'round'}));
    });
  }

  function genCastleQuestion(){
    var towers = Math.random()<0.5 ? 2 : 3;
    return {
      tag: 'Photo / illustration',
      question: 'Combien de fanions triangulaires vois-tu sur ce château ?',
      sub: 'Regarde le sommet de chaque tour.',
      explain: 'Chaque tour porte un fanion triangulaire, et il y a ' + towers + ' tours : donc ' + towers + ' fanions.',
      draw: function(){ drawCastleScene(towers); },
      cols3: false,
      choices: numChoiceSet(towers, [1,2,3,4]).map(function(v){ return { label:String(v), ok:v===towers }; })
    };
  }

  function drawRobotScene(arms){
    var svg = document.getElementById('m4Svg');
    svg.setAttribute('viewBox','0 0 200 200');
    svg.innerHTML = "";
    // tête + corps
    svg.appendChild(el('rect',{x:75,y:30,width:50,height:44,fill:'var(--accent2)','fill-opacity':'0.6',stroke:'var(--accent)','stroke-width':4}));
    svg.appendChild(el('rect',{x:65,y:80,width:70,height:70,fill:'var(--accent3)','fill-opacity':'0.6',stroke:'var(--accent)','stroke-width':4}));
    // jambes
    svg.appendChild(el('rect',{x:72,y:155,width:20,height:34,fill:'var(--accent2)','fill-opacity':'0.6',stroke:'var(--accent)','stroke-width':3}));
    svg.appendChild(el('rect',{x:108,y:155,width:20,height:34,fill:'var(--accent2)','fill-opacity':'0.6',stroke:'var(--accent)','stroke-width':3}));
    // bras (2 ou 4, thème brainrot oblige : un robot rigolo peut avoir plusieurs bras)
    var armY = [88, 112];
    for(var i=0;i<arms/2;i++){
      var y = armY[i] || (88+i*24);
      svg.appendChild(el('rect',{x:38,y:y,width:24,height:18,fill:'var(--accent2)','fill-opacity':'0.6',stroke:'var(--accent)','stroke-width':3}));
      svg.appendChild(el('rect',{x:138,y:y,width:24,height:18,fill:'var(--accent2)','fill-opacity':'0.6',stroke:'var(--accent)','stroke-width':3}));
    }
  }

  function genRobotQuestion(){
    var arms = Math.random()<0.5 ? 2 : 4;
    var correct = 2 /*tête+corps*/ + 2 /*jambes*/ + arms;
    return {
      tag: 'Photo / illustration',
      question: 'Combien de carrés ou rectangles composent ce robot ?',
      sub: 'Compte la tête, le corps, les jambes et les bras.',
      explain: 'Tête (1) + corps (1) + jambes (2) + bras (' + arms + ') = ' + correct + '.',
      draw: function(){ drawRobotScene(arms); },
      cols3: false,
      choices: numChoiceSet(correct, [4,5,6,7,8,9,10]).map(function(v){ return { label:String(v), ok: v===correct }; })
    };
  }

  function drawTrainScene(wagons){
    var svg = document.getElementById('m4Svg');
    svg.setAttribute('viewBox','0 0 200 200'); svg.innerHTML="";
    // locomotive
    svg.appendChild(el('rect',{x:15,y:110,width:40,height:38,fill:'var(--accent3)','fill-opacity':0.6,stroke:'var(--accent)','stroke-width':3}));
    svg.appendChild(el('rect',{x:20,y:90,width:20,height:22,fill:'var(--accent3)','fill-opacity':0.6,stroke:'var(--accent)','stroke-width':3}));
    svg.appendChild(el('circle',{cx:25,cy:150,r:8,fill:'var(--text)','fill-opacity':0.7}));
    svg.appendChild(el('circle',{cx:45,cy:150,r:8,fill:'var(--text)','fill-opacity':0.7}));
    var x = 62;
    for(var i=0;i<wagons;i++){
      svg.appendChild(el('rect',{x:x,y:118,width:34,height:30,fill:'var(--accent2)','fill-opacity':0.6,stroke:'var(--accent)','stroke-width':3}));
      svg.appendChild(el('circle',{cx:x+8,cy:150,r:7,fill:'var(--text)','fill-opacity':0.7}));
      svg.appendChild(el('circle',{cx:x+26,cy:150,r:7,fill:'var(--text)','fill-opacity':0.7}));
      x += 40;
    }
  }
  function genTrainQuestion(){
    var wagons = 2+Math.floor(Math.random()*3); // 2 à 4
    var correct = wagons;
    return {
      tag: 'Photo / illustration',
      question: 'Combien de wagons rectangulaires vois-tu derrière la locomotive ?',
      sub: 'Ne compte pas la locomotive, seulement les wagons qui la suivent.',
      explain: 'Il y a ' + wagons + ' wagons accrochés à la locomotive.',
      draw: function(){ drawTrainScene(wagons); },
      cols3: false,
      choices: numChoiceSet(correct, [1,2,3,4,5,6]).map(function(v){ return { label:String(v), ok: v===correct }; })
    };
  }

  var IMAGE_QUESTIONS = [genHouseQuestion, genFenceQuestion, genCastleQuestion, genRobotQuestion, genTrainQuestion];

  // ===================== Quadrillage / repérage =====================
  var GRID_N = 5, GRID_CELL = 30, GRID_MARGIN = 25;
  var COL_LETTERS = ['A','B','C','D','E'];
  function gridX(col){ return GRID_MARGIN + col*GRID_CELL; }
  function gridY(row){ return GRID_MARGIN + row*GRID_CELL; }
  function gridCenterX(col){ return gridX(col) + GRID_CELL/2; }
  function gridCenterY(row){ return gridY(row) + GRID_CELL/2; }
  function coordLabel(col,row){ return COL_LETTERS[col] + (row+1); }

  function drawGridBase(svg){
    for(var i=0;i<=GRID_N;i++){
      svg.appendChild(el('line',{x1:gridX(i),y1:gridY(0),x2:gridX(i),y2:gridY(GRID_N),stroke:'var(--text-soft)','stroke-width':1.5}));
      svg.appendChild(el('line',{x1:gridX(0),y1:gridY(i),x2:gridX(GRID_N),y2:gridY(i),stroke:'var(--text-soft)','stroke-width':1.5}));
    }
    for(var c=0;c<GRID_N;c++){ svg.appendChild(svgText(gridCenterX(c), gridY(GRID_N)+14, 11, COL_LETTERS[c])); }
    for(var r=0;r<GRID_N;r++){ svg.appendChild(svgText(gridX(0)-11, gridCenterY(r)+4, 11, String(r+1))); }
  }
  function drawPointMarker(svg,col,row,label,color){
    svg.appendChild(el('circle',{cx:gridCenterX(col),cy:gridCenterY(row),r:7,fill:color||'var(--accent)',stroke:'var(--surface)','stroke-width':2}));
    if(label) svg.appendChild(svgText(gridCenterX(col), gridY(row)-6, 12, label));
  }
  function isColinear(pts){
    var dx1=pts[1].col-pts[0].col, dy1=pts[1].row-pts[0].row;
    var dx2=pts[2].col-pts[0].col, dy2=pts[2].row-pts[0].row;
    return (dx1*dy2 - dy1*dx2) === 0;
  }

  function alignName(p){ return COL_LETTERS[p.col] + (p.row+1); }
  // Explication adaptée aux 3 points affichés : sur quelle ligne/colonne/diagonale/droite penchée
  // ils sont alignés, ou lequel sort de la droite des deux autres.
  function alignExplain(pts, aligned){
    var nm = alignName;
    if(aligned){
      if(pts[0].row===pts[1].row && pts[1].row===pts[2].row) return 'Oui : ' + pts.map(nm).join(', ') + ' sont tous sur la ligne ' + (pts[0].row+1) + '. Une règle posée sur cette ligne les touche tous les trois.';
      if(pts[0].col===pts[1].col && pts[1].col===pts[2].col) return 'Oui : ' + pts.map(nm).join(', ') + ' sont tous dans la colonne ' + COL_LETTERS[pts[0].col] + '. Une règle posée sur cette colonne les touche tous les trois.';
      var dx = Math.abs(pts[1].col-pts[0].col), dy = Math.abs(pts[1].row-pts[0].row);
      if(dx===dy) return 'Oui : ' + pts.map(nm).join(', ') + ' sont en diagonale, à la suite les uns des autres. Une seule règle les touche tous les trois.';
      return 'Oui : ' + pts.map(nm).join(', ') + ' sont sur une même droite penchée : à chaque pas on avance de ' + dx + ' colonne' + (dx>1?'s':'') + ' et de ' + dy + ' ligne' + (dy>1?'s':'') + '. Une seule règle les touche tous les trois.';
    }
    return 'Non : si on pose la règle sur ' + nm(pts[0]) + ' et ' + nm(pts[1]) + ', elle ne touche pas ' + nm(pts[2]) + '. Il faut que la règle touche les 3 points en même temps.';
  }
  function ptEq(p, q){ return p.col===q.col && p.row===q.row; }
  function ptIn(list, p){ return list.some(function(q){ return ptEq(p, q); }); }
  // 3 points alignés régulièrement espacés, dans la direction voulue (horizontale, verticale,
  // diagonale ou droite penchée 2:1), à une position tirée au hasard.
  function alignedTriple(modes){
    var mode = pick(modes), step, tries = 0, pts;
    do {
      var sg = pick([1,-1]), sp = pick([1,2]);
      if(mode==='h') step = [sp,0];
      else if(mode==='v') step = [0,sp];
      else if(mode==='d') step = [sp*sg, sp];
      else step = pick([[2*sg,1],[1*sg,2]]);
      var c0 = randInt(0,4), r0 = randInt(0,4);
      pts = [0,1,2].map(function(i){ return {col:c0+step[0]*i, row:r0+step[1]*i}; });
      tries++;
    } while(tries<200 && !pts.every(function(p){ return p.col>=0 && p.col<=4 && p.row>=0 && p.row<=4; }));
    if(tries>=200) pts = [{col:0,row:0},{col:1,row:1},{col:2,row:2}];
    return pts;
  }
  function randomCell(){ return {col:randInt(0,4), row:randInt(0,4)}; }
  function alignModes(level){ return level===0 ? ['h','v'] : level===1 ? ['h','v','d'] : ['h','v','d','pente']; }
  function drawLetterPoint(svg, p, letter, color){
    svg.appendChild(el('circle',{cx:gridCenterX(p.col),cy:gridCenterY(p.row),r:10,fill:color,stroke:'var(--surface)','stroke-width':2}));
    svg.appendChild(svgText(gridCenterX(p.col), gridCenterY(p.row)+5, 13, letter));
  }
  var ALIGN_COLORS = ['var(--accent)','var(--accent2)','var(--accent3)','var(--accent)'];

  function genAlignQuestion(level){
    level = level || 0;
    var variant = level===0 ? 'oui' : pickFresh('align-var-' + level, ['oui','quatre','candidat']);
    if(variant==='quatre') return genAlignQuatre(level);
    if(variant==='candidat') return genAlignCandidat(level);
    return genAlignOui(level);
  }
  // Variante 1 : 3 points, alignés ou non. Au niveau Moyen/Difficile, les « non alignés »
  // sont souvent des presque-alignés (un point décalé d'une case).
  function genAlignOui(level){
    var aligned = Math.random()<0.5, pts;
    if(aligned) pts = alignedTriple(alignModes(level));
    else if(level>0 && Math.random()<0.6){
      pts = alignedTriple(alignModes(level));
      var k = pick([0,1,2]), tries = 0, cand;
      do { cand = {col:pts[k].col + pick([-1,0,1]), row:pts[k].row + pick([-1,0,1])}; tries++; }
      while(tries<50 && (cand.col<0||cand.col>4||cand.row<0||cand.row>4||ptEq(cand, pts[k])||ptIn(pts, cand)||isColinear(pts.map(function(p,i){ return i===k ? cand : p; }))));
      if(tries<50) pts[k] = cand; else pts = null;
    }
    if(!pts){
      var t2 = 0;
      do { pts = [randomCell(), randomCell(), randomCell()]; t2++; }
      while(t2<50 && (isColinear(pts) || ptEq(pts[0],pts[1]) || ptEq(pts[0],pts[2]) || ptEq(pts[1],pts[2])));
      if(isColinear(pts)) pts = [{col:0,row:0},{col:1,row:0},{col:0,row:2}];
    }
    aligned = isColinear(pts);
    var markerShape = pick(MARKER_SHAPES), markerColor = pick(['var(--accent)','var(--accent2)','var(--accent3)']);
    return {
      tag:'Alignement',
      question:'Ces 3 points sont-ils alignés (sur une même droite) ?',
      sub:'Imagine une règle : peux-tu la poser pour toucher les 3 points en même temps ?',
      explain: alignExplain(pts, aligned),
      draw:function(){
        var svg=document.getElementById('m4Svg'); svg.setAttribute('viewBox','0 0 200 200'); svg.innerHTML="";
        drawGridBase(svg);
        pts.forEach(function(p){ drawShapeMarkerOnGrid(svg,p.col,p.row,markerShape,markerColor); });
      },
      cols3:false,
      choices: shuffle([{label:'Oui, alignés', ok:aligned},{label:'Non, pas alignés', ok:!aligned}])
    };
  }
  // Variante 2 : 4 points A B C D, exactement 3 sont alignés : lesquels ?
  function genAlignQuatre(level){
    var pts, tries = 0, good;
    do {
      var tri = alignedTriple(alignModes(level)), extra = randomCell();
      pts = tri.concat([extra]);
      var triples = [[0,1,2],[0,1,3],[0,2,3],[1,2,3]];
      var n = triples.filter(function(t){ return isColinear(t.map(function(i){ return pts[i]; })); }).length;
      good = n===1 && !ptIn(tri, extra);
      tries++;
    } while(!good && tries<200);
    if(!good){ pts = [{col:0,row:0},{col:2,row:0},{col:4,row:0},{col:1,row:3}]; }
    var order = shuffle([0,1,2,3]), P = order.map(function(i){ return pts[i]; });   // lettres attribuées au hasard
    var letters = ['A','B','C','D'];
    var triplesIdx = [[0,1,2],[0,1,3],[0,2,3],[1,2,3]];
    var right = triplesIdx.filter(function(t){ return isColinear(t.map(function(i){ return P[i]; })); })[0];
    function lab(t){ return letters[t[0]] + ', ' + letters[t[1]] + ' et ' + letters[t[2]]; }
    var tr = right.map(function(i){ return P[i]; });
    return {
      tag:'Alignement',
      question:'Parmi ces 4 points, lesquels sont alignés ?',
      sub:'Imagine une règle : trois de ces points se touchent avec elle.',
      explain: 'Les points ' + lab(right) + ' sont alignés. ' + alignExplain(tr, true).replace(/^Oui : [^ ]+, [^ ]+, [^ ]+ sont /, 'Ils sont '),
      draw:function(){
        var svg=document.getElementById('m4Svg'); svg.setAttribute('viewBox','0 0 200 200'); svg.innerHTML="";
        drawGridBase(svg);
        P.forEach(function(p,i){ drawLetterPoint(svg, p, letters[i], ALIGN_COLORS[i]); });
      },
      cols3:false,
      choices: triplesIdx.map(function(t){ return { label:lab(t), ok:t===right }; })
    };
  }
  // Variante 3 : A et B sont posés ; quel point numéroté (1 à 4) est aligné avec eux ?
  function genAlignCandidat(level){
    var tri, A, B, C, cands, tries = 0, good;
    do {
      tri = alignedTriple(alignModes(level));
      var pick2 = shuffle([0,1,2]); A = tri[pick2[0]]; B = tri[pick2[1]]; C = tri[pick2[2]];
      cands = [C];
      var g = 0;
      while(cands.length<4 && g++<200){
        var q = randomCell();
        if(ptEq(q,A) || ptEq(q,B) || ptIn(cands,q) || isColinear([A,B,q])) continue;
        cands.push(q);
      }
      good = cands.length===4;
      tries++;
    } while(!good && tries<50);
    if(!good){ A = {col:0,row:0}; B = {col:2,row:2}; cands = [{col:4,row:4},{col:3,row:1},{col:1,row:3},{col:0,row:4}]; C = cands[0]; }
    var order = shuffle([0,1,2,3]);   // numéro affiché de chaque candidat
    var shown = order.map(function(i){ return cands[i]; });
    var rightNum = String(order.indexOf(0) + 1);
    return {
      tag:'Alignement',
      question:'Quel point (1, 2, 3 ou 4) est aligné avec A et B ?',
      sub:'Imagine une règle posée sur A et B : quel numéro touche-t-elle ?',
      explain: 'Le point ' + rightNum + ' est aligné avec A et B : ' + alignExplain([A,B,C], true).replace(/^Oui : [^ ]+, [^ ]+, [^ ]+ sont /, 'ils sont ').replace(/^Oui : /, ''),
      draw:function(){
        var svg=document.getElementById('m4Svg'); svg.setAttribute('viewBox','0 0 200 200'); svg.innerHTML="";
        drawGridBase(svg);
        drawLetterPoint(svg, A, 'A', 'var(--accent)'); drawLetterPoint(svg, B, 'B', 'var(--accent)');
        shown.forEach(function(p,i){
          svg.appendChild(el('circle',{cx:gridCenterX(p.col),cy:gridCenterY(p.row),r:10,fill:'var(--surface)',stroke:'var(--text)','stroke-width':2.5}));
          svg.appendChild(svgText(gridCenterX(p.col), gridCenterY(p.row)+5, 13, String(i+1)));
        });
      },
      cols3:false,
      choices: ['1','2','3','4'].map(function(l){ return { label:l, ok:l===rightNum }; })
    };
  }

  // Milieu : trois variantes selon le niveau.
  //  - Facile : 3 formes alignées sur le segment, celle du milieu est la réponse (comme avant).
  //  - Moyen / Difficile « formes » : 3 ou 5 formes (nombre impair → une forme est au milieu),
  //    ou 2 ou 4 formes (nombre pair → AUCUNE forme au milieu). La réponse « Aucune forme » est
  //    toujours proposée, donc on ne peut pas répondre au hasard parmi les seules formes.
  //  - Difficile « coordonnées » : deux points A et B (en ligne, en colonne ou en diagonale),
  //    on cherche les coordonnées du milieu.
  function genMilieuQuestion(level){
    level = level || 0;
    if(level===0) return genMilieuFormes(0);
    if(level===2 && Math.random()<0.5) return genMilieuCoord();
    return genMilieuFormes(level);
  }
  function genMilieuFormes(level){
    var horizontal = Math.random()<0.5;
    var fixedIdx = randInt(0,4);
    var span = 2, s0 = 0, e0 = 2, noneAnswer = false;
    if(level===0){ span = 2; s0 = 1; e0 = 3; }
    else {
      span = pick([2,4,4]);
      s0 = span===4 ? 0 : randInt(0,2); e0 = s0 + span;
      noneAnswer = Math.random()<0.4;
    }
    var mid = (s0+e0)/2;
    var positions = [];
    for(var p=s0;p<=e0;p++){ if(!(noneAnswer && p===mid)) positions.push(p); }
    var shapeKeys = shuffle(MARKER_SHAPES.slice()).slice(0, positions.length);
    var pts = positions.map(function(p,i){
      var base = horizontal ? {col:p,row:fixedIdx} : {col:fixedIdx,row:p};
      base.shape = shapeKeys[i]; base.pos = p; return base;
    });
    var correctShape = null;
    pts.forEach(function(pt){ if(pt.pos===mid) correctShape = pt.shape; });
    var choices;
    if(level===0){
      choices = shapeKeys.map(function(sh){ return { label:MARKER_LABELS[sh], ok: sh===correctShape }; });
    } else {
      // 4 propositions : « Aucune forme » + 3 formes (dont la bonne s'il y en a une)
      var pool = shuffle(shapeKeys.filter(function(sh){ return sh!==correctShape; }));
      var shown = correctShape ? [correctShape].concat(pool.slice(0,2)) : pool.slice(0,3);
      choices = shuffle(shown.map(function(sh){ return { label:MARKER_LABELS[sh], ok: sh===correctShape }; }));
      choices.push({ label:'Aucune forme', ok: correctShape===null });
    }
    var cells = span + 1;
    var explain;
    if(correctShape) explain = 'Le segment passe par ' + cells + ' cases : celle du milieu est la ' + (mid-s0+1) + 'e, et on y trouve le ' + MARKER_LABELS[correctShape] + '.';
    else explain = 'Le segment passe par ' + cells + ' cases : celle du milieu (la ' + (mid-s0+1) + 'e) est vide. Il y a ' + positions.length + ' formes, une de chaque côté du milieu : aucune n\'est au milieu.';
    return {
      tag:'Milieu',
      question: level===0 ? 'Quelle forme se trouve au milieu du segment ?' : 'Quelle forme se trouve au milieu du segment ? (il peut ne pas y en avoir)',
      sub:'Le milieu est à égale distance des deux extrémités du segment.',
      explain: explain,
      draw:function(){
        var svg=document.getElementById('m4Svg'); svg.setAttribute('viewBox','0 0 200 200'); svg.innerHTML="";
        drawGridBase(svg);
        var x1,y1,x2,y2;
        if(horizontal){ x1=gridCenterX(s0); y1=gridCenterY(fixedIdx); x2=gridCenterX(e0); y2=y1; }
        else { x1=gridCenterX(fixedIdx); y1=gridCenterY(s0); x2=x1; y2=gridCenterY(e0); }
        svg.appendChild(el('line',{x1:x1,y1:y1,x2:x2,y2:y2,stroke:'var(--accent)','stroke-width':4,'stroke-linecap':'round'}));
        [[x1,y1],[x2,y2]].forEach(function(q){ svg.appendChild(el('circle',{cx:q[0],cy:q[1],r:4,fill:'var(--accent)'})); });
        pts.forEach(function(pt,i){ drawShapeMarkerOnGrid(svg,pt.col,pt.row,pt.shape,palette[i%palette.length]); });
      },
      cols3:level===0,
      choices: choices
    };
  }
  function genMilieuCoord(){
    var dirs = [[1,0],[0,1],[1,1],[1,-1]], d = pick(dirs), k = pick([1,2]);   // k = demi-longueur du segment
    var c0, r0, c1, r1, tries = 0;
    do {
      var cm = randInt(0,4), rm = randInt(0,4);
      c0 = cm - d[0]*k; r0 = rm - d[1]*k; c1 = cm + d[0]*k; r1 = rm + d[1]*k;
      tries++;
    } while(tries<100 && (c0<0||c0>4||c1<0||c1>4||r0<0||r0>4||r1<0||r1>4));
    if(tries>=100){ c0=0; r0=0; c1=4; r1=0; }
    var cm2 = (c0+c1)/2, rm2 = (r0+r1)/2;
    var correct = coordLabel(cm2, rm2);
    var cand = [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1]].map(function(o){ return [cm2+o[0], rm2+o[1]]; })
      .filter(function(q){ return q[0]>=0 && q[0]<=4 && q[1]>=0 && q[1]<=4; });
    cand.push([c1, r1]);   // piège : prendre l'extrémité
    cand = shuffle(cand);
    var seen = {}; seen[correct] = true; var labels = [correct];
    for(var i=0;i<cand.length && labels.length<4;i++){ var l = coordLabel(cand[i][0], cand[i][1]); if(!seen[l]){ seen[l] = true; labels.push(l); } }
    labels = shuffle(labels);
    var A = coordLabel(c0,r0), B = coordLabel(c1,r1);
    return {
      tag:'Milieu',
      question:'A est en ' + A + ' et B est en ' + B + '. Quelles sont les coordonnées du milieu du segment [AB] ?',
      sub:'Le milieu est à égale distance de A et de B. Compte les cases entre les deux.',
      explain:'Entre A (' + A + ') et B (' + B + '), le milieu est en ' + correct + ' : il est à ' + k + ' case' + (k>1?'s':'') + ' de chaque bout.',
      draw:function(){
        var svg=document.getElementById('m4Svg'); svg.setAttribute('viewBox','0 0 200 200'); svg.innerHTML="";
        drawGridBase(svg);
        svg.appendChild(el('line',{x1:gridCenterX(c0),y1:gridCenterY(r0),x2:gridCenterX(c1),y2:gridCenterY(r1),stroke:'var(--accent)','stroke-width':4,'stroke-linecap':'round'}));
        [[c0,r0,'A'],[c1,r1,'B']].forEach(function(q){
          svg.appendChild(el('circle',{cx:gridCenterX(q[0]),cy:gridCenterY(q[1]),r:11,fill:'var(--surface)',stroke:'var(--accent)','stroke-width':3}));
          svg.appendChild(svgText(gridCenterX(q[0]),gridCenterY(q[1])+5,14,q[2]));
        });
      },
      cols3:false,
      choices: labels.map(function(l){ return { label:l, ok:l===correct }; })
    };
  }

  function genCoordQuestion(){
    var col=randInt(0,4), row=randInt(0,4);
    var correct = coordLabel(col,row);
    var candidates=[];
    for(var dc=-1;dc<=1;dc++){ for(var dr=-1;dr<=1;dr++){
      if(dc===0&&dr===0) continue;
      var nc=col+dc, nr=row+dr;
      if(nc>=0&&nc<=4&&nr>=0&&nr<=4) candidates.push(coordLabel(nc,nr));
    }}
    candidates = shuffle(candidates);
    var seen={}; seen[correct]=true;
    var choiceLabels=[correct];
    for(var i=0;i<candidates.length && choiceLabels.length<4;i++){
      if(!seen[candidates[i]]){ choiceLabels.push(candidates[i]); seen[candidates[i]]=true; }
    }
    choiceLabels = shuffle(choiceLabels);
    return {
      tag:'Coordonnées',
      question:'Quelles sont les coordonnées du point marqué ?',
      sub:'Lis d\'abord la lettre de la colonne, puis le numéro de la ligne.',
      explain:'Le point est dans la colonne ' + COL_LETTERS[col] + ' et sur la ligne ' + (row+1) + ' : ses coordonnées sont ' + correct + '.',
      draw:function(){
        var svg=document.getElementById('m4Svg'); svg.setAttribute('viewBox','0 0 200 200'); svg.innerHTML="";
        drawGridBase(svg);
        drawShapeMarkerOnGrid(svg,col,row,'etoile','var(--accent)');
      },
      cols3:false,
      choices: choiceLabels.map(function(l){ return { label:l, ok:l===correct }; })
    };
  }

  function genCoordFindQuestion(){
    // On pose des formes (pas des lettres, qui se confondaient avec les
    // lettres des colonnes) sur quelques cases, et on demande quelle forme
    // se trouve à des coordonnées données.
    var cells=[]; var usedKeys={};
    var shapesForCells = shuffle(MARKER_SHAPES.slice()).slice(0,4);
    while(cells.length<4){
      var c=randInt(0,4), r=randInt(0,4), key=c+'_'+r;
      if(usedKeys[key]) continue;
      usedKeys[key]=true;
      cells.push({col:c,row:r,shape:shapesForCells[cells.length]});
    }
    var targetIdx=randInt(0,3);
    var target=cells[targetIdx];
    var targetCoord=coordLabel(target.col,target.row);
    var correctName = MARKER_LABELS[target.shape];
    return {
      tag:'Coordonnées',
      question:'Quelle forme se trouve en ' + targetCoord + ' ?',
      sub:'Retrouve la bonne colonne, puis la bonne ligne.',
      explain:'En ' + targetCoord + ', on trouve un(e) ' + correctName + '.',
      draw:function(){
        var svg=document.getElementById('m4Svg'); svg.setAttribute('viewBox','0 0 200 200'); svg.innerHTML="";
        drawGridBase(svg);
        cells.forEach(function(p,i){ drawShapeMarkerOnGrid(svg,p.col,p.row,p.shape,palette[i%palette.length]); });
      },
      cols3:false,
      choices: shuffle(cells.map(function(p,i){ return { label:MARKER_LABELS[p.shape], ok:i===targetIdx }; }))
    };
  }

  var ARROW_CHAR = {up:'⬆',down:'⬇',left:'⬅',right:'➡'};

  function genCodageQuestion(){
    var startCol, startRow, moves, endCol, endRow;
    for(var attempt=0; attempt<50; attempt++){
      var sc=randInt(0,4), sr=randInt(0,4);
      var steps = 2+Math.floor(Math.random()*2);
      var mv=[], c=sc, r=sr, ok=true;
      for(var i=0;i<steps;i++){
        var dir=pick(['up','down','left','right']);
        var nc=c, nr=r;
        if(dir==='up') nr-=1; else if(dir==='down') nr+=1; else if(dir==='left') nc-=1; else nc+=1;
        if(nc<0||nc>4||nr<0||nr>4){ ok=false; break; }
        mv.push(dir); c=nc; r=nr;
      }
      if(ok){ startCol=sc; startRow=sr; moves=mv; endCol=c; endRow=r; break; }
    }
    if(moves===undefined){ startCol=0; startRow=0; moves=['right','right','down']; endCol=2; endRow=1; }
    var seqStr = moves.map(function(d){ return ARROW_CHAR[d]; }).join(' ');
    var correct = coordLabel(endCol,endRow);
    var candidates=[];
    for(var dc=-2; dc<=2; dc++){ for(var dr=-2; dr<=2; dr++){
      var ncc=startCol+dc, nrr=startRow+dr;
      if(ncc<0||ncc>4||nrr<0||nrr>4) continue;
      var lbl=coordLabel(ncc,nrr);
      if(lbl!==correct) candidates.push(lbl);
    }}
    candidates = shuffle(candidates);
    var seen={}; seen[correct]=true;
    var choiceLabels=[correct];
    for(var j=0;j<candidates.length && choiceLabels.length<4;j++){
      if(!seen[candidates[j]]){ choiceLabels.push(candidates[j]); seen[candidates[j]]=true; }
    }
    choiceLabels = shuffle(choiceLabels);
    return {
      tag:'Déplacement',
      question:'Le personnage part du point "Départ" et suit ces flèches : ' + seqStr + '. Où arrive-t-il ?',
      sub:'Suis chaque flèche une par une à partir du point de départ.',
      explain:'En suivant les flèches depuis le départ, on arrive en ' + correct + '.',
      draw:function(){
        var svg=document.getElementById('m4Svg'); svg.setAttribute('viewBox','0 0 200 200'); svg.innerHTML="";
        drawGridBase(svg);
        drawPointMarker(svg,startCol,startRow,'Départ','var(--accent)');
      },
      cols3:false,
      choices: choiceLabels.map(function(l){ return { label:l, ok:l===correct }; })
    };
  }

  function buildMoves(dx,dy){
    var mv=[], i;
    for(i=0;i<Math.abs(dx);i++) mv.push(dx>0?'right':'left');
    for(i=0;i<Math.abs(dy);i++) mv.push(dy>0?'down':'up');
    return mv;
  }
  function seqToStr(moves){ return moves.map(function(d){ return ARROW_CHAR[d]; }).join(' '); }

  function genDecodageQuestion(){
    var sc,sr,ec,er,dx,dy;
    do{
      sc=randInt(0,4); sr=randInt(0,4); ec=randInt(0,4); er=randInt(0,4);
      dx=ec-sc; dy=er-sr;
    } while(dx===0 && dy===0);
    var correctMoves = buildMoves(dx,dy);
    var correctStr = seqToStr(correctMoves);
    var wrongCandidates=[];
    if(dx!==0) wrongCandidates.push(buildMoves(-dx,dy));
    if(dy!==0) wrongCandidates.push(buildMoves(dx,-dy));
    wrongCandidates.push(buildMoves(dx + (dx>=0?1:-1), dy));
    wrongCandidates.push(buildMoves(dx, dy + (dy>=0?1:-1)));
    var seen={}; seen[correctStr]=true;
    var wrongStrs=[];
    wrongCandidates.forEach(function(mv){
      var s=seqToStr(mv);
      if(s && !seen[s]){ seen[s]=true; wrongStrs.push(s); }
    });
    wrongStrs = shuffle(wrongStrs).slice(0,2);
    var options = shuffle([correctStr].concat(wrongStrs));
    return {
      tag:'Trajet',
      question:'Quel trajet permet d\'aller du point de départ au point d\'arrivée ?',
      sub:'Compare le nombre de cases à droite/gauche puis en haut/bas entre les deux points.',
      explain:'Il faut suivre : ' + correctStr + '.',
      draw:function(){
        var svg=document.getElementById('m4Svg'); svg.setAttribute('viewBox','0 0 200 200'); svg.innerHTML="";
        drawGridBase(svg);
        drawPointMarker(svg,sc,sr,'Départ','var(--accent2)');
        drawPointMarker(svg,ec,er,'Arrivée','var(--accent)');
      },
      cols3:false,
      choices: options.map(function(s){ return { label:s, ok:s===correctStr }; })
    };
  }

  // ===================== Chasse aux formes =====================
  var CHASSE_SLOTS = [[38,44],[100,38],[162,44],[32,105],[100,100],[168,105],[45,162],[100,166],[155,162]];
  function drawMiniShape(svg,cx,cy,type,color){
    var s=14;
    if(type==='cercle'){
      svg.appendChild(el('circle',{cx:cx,cy:cy,r:s,fill:color,'fill-opacity':0.65,stroke:'var(--text)','stroke-width':2}));
    } else if(type==='carre'){
      svg.appendChild(el('rect',{x:cx-s,y:cy-s,width:2*s,height:2*s,fill:color,'fill-opacity':0.65,stroke:'var(--text)','stroke-width':2}));
    } else if(type==='rectangle'){
      svg.appendChild(el('rect',{x:cx-s*1.3,y:cy-s*0.7,width:2.6*s,height:1.4*s,fill:color,'fill-opacity':0.65,stroke:'var(--text)','stroke-width':2}));
    } else if(type==='triangle'){
      var pts=[[cx,cy-s],[cx+s,cy+s],[cx-s,cy+s]];
      svg.appendChild(el('polygon',{points:pts.map(function(p){return p[0]+','+p[1];}).join(' '),fill:color,'fill-opacity':0.65,stroke:'var(--text)','stroke-width':2,'stroke-linejoin':'round'}));
    } else if(type==='losange'){
      var pts2=[[cx,cy-s*1.15],[cx+s*0.85,cy],[cx,cy+s*1.15],[cx-s*0.85,cy]];
      svg.appendChild(el('polygon',{points:pts2.map(function(p){return p[0]+','+p[1];}).join(' '),fill:color,'fill-opacity':0.65,stroke:'var(--text)','stroke-width':2,'stroke-linejoin':'round'}));
    } else if(type==='etoile'){
      var spikes=5, outerR=s*1.15, innerR=s*0.5, starPts=[];
      for(var k=0;k<spikes*2;k++){
        var r = (k%2===0) ? outerR : innerR;
        var ang = (Math.PI/spikes)*k - Math.PI/2;
        starPts.push([cx+r*Math.cos(ang), cy+r*Math.sin(ang)]);
      }
      svg.appendChild(el('polygon',{points:starPts.map(function(p){return p[0]+','+p[1];}).join(' '),fill:color,'fill-opacity':0.65,stroke:'var(--text)','stroke-width':2,'stroke-linejoin':'round'}));
    }
  }
  // Formes-repères pour le quadrillage : bien plus distinctives visuellement
  // que des lettres (qui se confondent avec les lettres des colonnes A-E).
  var MARKER_SHAPES = ['triangle','carre','cercle','losange','etoile'];
  var MARKER_LABELS = { triangle:'triangle', carre:'carré', cercle:'cercle', losange:'losange', etoile:'étoile' };
  function drawShapeMarkerOnGrid(svg,col,row,shapeKey,color){
    drawMiniShape(svg, gridCenterX(col), gridCenterY(row), shapeKey, color || 'var(--accent)');
  }
  function genChasseQuestion(){
    var pool=['triangle','carre','rectangle','cercle'];
    var target=pick(pool);
    var assignments, tries=0;
    do{
      assignments = CHASSE_SLOTS.map(function(){ return Math.random()<0.85 ? pick(pool) : null; });
      tries++;
    } while(tries<20 && assignments.filter(function(t){return t===target;}).length===0);
    if(assignments.filter(function(t){return t===target;}).length===0) assignments[0]=target;
    var count = assignments.filter(function(t){return t===target;}).length;
    var plural = { triangle:'triangles', carre:'carrés', rectangle:'rectangles', cercle:'cercles' }[target];
    return {
      tag:'Chasse aux formes',
      question:'Combien de ' + plural + ' vois-tu dans cette image ?',
      sub:'Compte bien toutes les formes, elles ne sont pas toutes pareilles !',
      explain:'Il y a ' + count + ' ' + plural + ' dans l\'image.',
      draw:function(){
        var svg=document.getElementById('m4Svg'); svg.setAttribute('viewBox','0 0 200 200'); svg.innerHTML="";
        CHASSE_SLOTS.forEach(function(pos,i){
          var t=assignments[i];
          if(!t) return;
          drawMiniShape(svg,pos[0],pos[1],t,palette[i%palette.length]);
        });
      },
      cols3:false,
      choices: numChoiceSet(count, [0,1,2,3,4,5,6]).map(function(v){ return { label:String(v), ok:v===count }; })
    };
  }

  // ===================== Symétrie =====================
  // (L'ancien QCM « Quelle droite est l'axe du triangle ? » est remplacé par l'atelier « Axes de symétrie », voir atelier.js.)
  // Le rectangle change de taille à chaque question (jamais un carré : sinon
  // la diagonale deviendrait un vrai axe, ce qui casserait la question), et
  // les propositions "fausses" varient entre diagonale et droite décalée
  // plutôt que toujours les 2 mêmes diagonales fixes.
  // Une diagonale coupe bien un rectangle en 2 triangles de MÊME AIRE, ce qui
  // prêtait à confusion ("ça a l'air coupé en deux parts égales, donc
  // symétrique ?"). Or une diagonale n'est un axe de symétrie que pour un
  // carré (les 2 moitiés ne se superposent pas en pliant, sauf carré) : on
  // ne l'utilise donc plus comme fausse réponse. Les "non-axes" sont
  // maintenant uniquement des droites parallèles à un côté mais décalées du
  // centre (jamais 50%), à des pourcentages variés (10/20/30/35/65/70/80/90)
  // pour que l'écart avec le vrai milieu soit tantôt petit, tantôt grand.
  var SYM_VRAI_OFFSETS = [10,20,30,35,65,70,80,90];
  // Quatre figures : rectangle (jamais carré), carré (ses diagonales SONT des axes), triangle
  // isocèle (seule la médiane de la pointe est un axe) et cercle (toute droite passant par le
  // centre est un axe). Les droites fausses sont décalées ou obliques, la bonne passe exactement
  // par le centre de symétrie.
  function genSymVraiQuestion(){
    var fig = pickFresh('symvrai-fig', ['rect','carre','tri','cercle']);
    var isAxis = Math.random()<0.5, line, shape, expTrue, expFalse;
    if(fig==='rect'){
      var w = 70+randInt(0,60), h; do{ h = 40+randInt(0,50); }while(Math.abs(w-h)<20);
      var rx = 100-w/2, ry = 100-h/2, vertical = Math.random()<0.5, pct = isAxis ? 50 : pick(SYM_VRAI_OFFSETS);
      line = vertical ? {x1:rx+w*(pct/100), y1:ry-15, x2:rx+w*(pct/100), y2:ry+h+15} : {x1:rx-15, y1:ry+h*(pct/100), x2:rx+w+15, y2:ry+h*(pct/100)};
      shape = function(svg){ svg.appendChild(el('rect',{x:rx,y:ry,width:w,height:h, fill:'var(--accent2)','fill-opacity':0.5, stroke:'var(--accent)','stroke-width':4})); };
      expTrue = 'Oui : cette droite passe exactement au milieu, donc en pliant le long d\'elle, les deux moitiés du rectangle se superposent.';
      expFalse = 'Non : cette droite ne passe pas exactement au milieu (elle est décalée), donc les deux parties n\'ont pas la même taille — ce n\'est pas un axe de symétrie.';
    } else if(fig==='carre'){
      var c = 70+randInt(0,40), x0 = 100-c/2, y0 = 100-c/2, kind = isAxis ? pick(['mid','diag']) : pick(['off','off','offd']);
      if(kind==='mid') line = Math.random()<0.5 ? {x1:100, y1:y0-15, x2:100, y2:y0+c+15} : {x1:x0-15, y1:100, x2:x0+c+15, y2:100};
      else if(kind==='diag') line = Math.random()<0.5 ? {x1:x0-12, y1:y0-12, x2:x0+c+12, y2:y0+c+12} : {x1:x0-12, y1:y0+c+12, x2:x0+c+12, y2:y0-12};
      else { var pc = pick([15,25,35,65,75,85])/100; line = Math.random()<0.5 ? {x1:x0+c*pc, y1:y0-15, x2:x0+c*pc, y2:y0+c+15} : {x1:x0-15, y1:y0+c*pc, x2:x0+c+15, y2:y0+c*pc}; }
      shape = function(svg){ svg.appendChild(el('rect',{x:x0,y:y0,width:c,height:c, fill:'var(--accent2)','fill-opacity':0.5, stroke:'var(--accent)','stroke-width':4})); };
      expTrue = kind==='diag' ? 'Oui : dans un carré, les diagonales sont aussi des axes de symétrie. En pliant le long de la diagonale, les deux triangles se superposent.' : 'Oui : cette droite passe exactement par le milieu des côtés, donc les deux moitiés du carré se superposent.';
      expFalse = 'Non : cette droite est décalée, elle ne passe pas par le centre du carré : les deux parties ne se superposent pas.';
    } else if(fig==='tri'){
      var bh = 35+randInt(0,20), th = 55+randInt(0,25), tb = 55+randInt(0,20), kind2 = isAxis ? 'axe' : pick(['off','off','horiz']);
      var apexY = 100-th, baseY = 100+bh;
      if(kind2==='axe') line = {x1:100, y1:apexY-15, x2:100, y2:baseY+15};
      else if(kind2==='off') { var dx = pick([-1,1])*(12+randInt(0,22)); line = {x1:100+dx, y1:apexY-15, x2:100+dx, y2:baseY+15}; }
      else { var hy = apexY + (baseY-apexY)*pick([0.4,0.5,0.6]); line = {x1:100-tb-15, y1:hy, x2:100+tb+15, y2:hy}; }
      shape = function(svg){ svg.appendChild(el('polygon',{points:[[100,apexY],[100-tb,baseY],[100+tb,baseY]].map(function(q){return q[0]+','+q[1];}).join(' '), fill:'var(--accent2)','fill-opacity':0.5, stroke:'var(--accent)','stroke-width':4,'stroke-linejoin':'round'})); };
      expTrue = 'Oui : cette droite passe par la pointe et le milieu de la base du triangle isocèle, donc les deux moitiés se superposent.';
      expFalse = kind2==='horiz' ? 'Non : en pliant le long de cette droite horizontale, le haut (petit) ne tombe pas sur le bas (large) : ce n\'est pas un axe.' : 'Non : cette droite ne passe pas par la pointe et le milieu de la base : les deux parties ne sont pas identiques.';
    } else {
      var rr = 45+randInt(0,25), ang = rand(0, Math.PI), ca = Math.cos(ang), sa = Math.sin(ang), off = isAxis ? 0 : pick([-1,1])*(rr*pick([0.3,0.5,0.7]));
      var px = 100 - sa*off, py = 100 + ca*off;
      line = {x1:px-ca*(rr+18), y1:py-sa*(rr+18), x2:px+ca*(rr+18), y2:py+sa*(rr+18)};
      shape = function(svg){ svg.appendChild(el('circle',{cx:100,cy:100,r:rr, fill:'var(--accent2)','fill-opacity':0.5, stroke:'var(--accent)','stroke-width':4})); };
      expTrue = 'Oui : cette droite passe par le centre du cercle. Un cercle a une infinité d\'axes de symétrie : toutes les droites qui passent par son centre.';
      expFalse = 'Non : cette droite ne passe pas par le centre du cercle, elle le coupe en deux parties de tailles différentes.';
    }
    var names = { rect:'du rectangle', carre:'du carré', tri:'du triangle', cercle:'du cercle' };
    return {
      tag:'Symétrie',
      question:'Cette droite est-elle un axe de symétrie ' + names[fig] + ' ?',
      sub:'Imagine que tu plies la figure le long de la droite : les deux côtés se superposent-ils exactement ?',
      explain: isAxis ? expTrue : expFalse,
      draw:function(){
        var svg=document.getElementById('m4Svg'); svg.setAttribute('viewBox','0 0 200 200'); svg.innerHTML="";
        shape(svg);
        svg.appendChild(el('line',{x1:line.x1,y1:line.y1,x2:line.x2,y2:line.y2, stroke:'var(--text)','stroke-width':3,'stroke-dasharray':'6,5'}));
      },
      cols3:false,
      choices: shuffle([{label:'Oui',ok:isAxis},{label:'Non',ok:!isAxis}])
    };
  }

  // ===================== Suites logiques de formes =====================
  var SUITE_SYMBOLS = ['🔴','🟦','🔺','⭐','🟩','🔶'];
  var SUITE_UNITS = [
    ['AB'],                              // Facile
    ['AAB','ABB','ABC'],                 // Moyen
    ['ABC','AABB','ABAC','ABCD']         // Difficile
  ];
  function genSuiteFormesQuestion(level){
    var unit = pick(SUITE_UNITS[level] || SUITE_UNITS[1]);
    var kinds = unique(unit.split(''));
    var syms = shuffle(SUITE_SYMBOLS.slice()).slice(0, kinds.length);
    var map = {}; kinds.forEach(function(k, i){ map[k] = syms[i]; });
    var slots = 7, seq = [];
    for(var i=0;i<slots;i++) seq.push(map[unit.charAt(i % unit.length)]);
    var answer = seq[slots-1];
    var others = shuffle(SUITE_SYMBOLS.filter(function(x){ return x!==answer; })).slice(0,3);
    var motif = unit.split('').map(function(ch){ return map[ch]; }).join(' ');
    return {
      tag:'Suite logique',
      question:'Quelle forme vient à la place du point d\'interrogation ?',
      sub:'Trouve le motif qui se répète, puis continue la suite.',
      explain:'Le motif qui se répète est : ' + motif + '. La suite continue avec ' + answer + '.',
      draw:function(){
        var svg=document.getElementById('m4Svg'); svg.setAttribute('viewBox','0 0 200 200'); svg.innerHTML="";
        var w=26, gap=2, x0=(200-(slots*w+(slots-1)*gap))/2;
        seq.forEach(function(sym, i){
          var x = x0 + i*(w+gap);
          svg.appendChild(el('rect',{x:x,y:88,width:w,height:w+8,rx:6,fill:'var(--surface)',stroke:'var(--accent)','stroke-width':2}));
          svg.appendChild(svgText(x+w/2,113,19, i===slots-1 ? '?' : sym));
        });
      },
      cols3:false,
      choices: shuffle([answer].concat(others)).map(function(l){ return { label:l, ok:l===answer }; })
    };
  }
  function unique(a){ return a.filter(function(v,i){ return a.indexOf(v)===i; }); }

  // ===================== Mesures : unités de longueur =====================
  var UNITE_SCENES = [
    ['la longueur d\'un crayon','cm'],['la longueur d\'une gomme','cm'],['la largeur de ton cahier','cm'],['la taille d\'un timbre-poste','cm'],
    ['la hauteur d\'une maison','m'],['la longueur d\'une cour d\'école','m'],['la longueur d\'un terrain de football','m'],['la hauteur d\'un arbre','m'],
    ['la distance entre deux villes','km'],['la longueur d\'une route de campagne','km'],['un trajet en train jusqu\'à une autre ville','km'],
    ['l\'épaisseur d\'une pièce de monnaie','mm'],['l\'épaisseur d\'une feuille de papier','mm'],['la longueur d\'une fourmi','mm']
  ];
  var UNITE_NOMS = { mm:'le millimètre (mm)', cm:'le centimètre (cm)', m:'le mètre (m)', km:'le kilomètre (km)' };
  function genMesuresQuestion(level){
    var kind = level===0 ? 'unite' : level===1 ? pick(['unite','plusLong']) : pick(['conv','conv','plusLong','conv2']);
    if(kind==='unite'){
      var sc = pick(UNITE_SCENES), u = sc[1];
      return {
        tag:'Mesures', question:'Avec quelle unité mesure-t-on ' + sc[0] + ' ?', sub:'Pense à la taille : petit, moyen ou très grand.',
        explain:'Pour ' + sc[0] + ', on utilise ' + UNITE_NOMS[u] + '.',
        draw:function(){ var svg=document.getElementById('m4Svg'); svg.setAttribute('viewBox','0 0 200 200'); svg.innerHTML=""; svg.appendChild(svgText(100,125,72,'📏')); },
        cols3:false,
        choices: shuffle(['mm','cm','m','km']).map(function(l){ return { label:l, ok:l===u }; })
      };
    }
    if(kind==='plusLong'){
      var cands = shuffle([20,30,40,50,60,70,80,90,100,120,150,200,250,300]), vals = cands.slice(0,4);
      var max = Math.max.apply(null, vals);
      function fmt(v){ return v>=100 && v%100===0 ? (v/100) + ' m' : v>=100 ? Math.floor(v/100) + ' m ' + (v%100) + ' cm' : v + ' cm'; }
      return {
        tag:'Mesures', question:'Quelle est la plus grande longueur ?', sub:'Attention aux unités : 1 m = 100 cm.',
        explain:fmt(max) + ' est la plus grande : ' + vals.slice().sort(function(a,b){ return a-b; }).map(function(v){ return v + ' cm'; }).join(' < ') + '.',
        draw:function(){
          // une règle d'1 m graduée tous les 10 cm : le repère « 1 m = 100 cm » reste sous les yeux
          var svg=document.getElementById('m4Svg'); svg.setAttribute('viewBox','0 0 200 200'); svg.innerHTML="";
          var x0=24, k=1.5, y=104;
          svg.appendChild(el('rect',{x:x0,y:y,width:100*k,height:34,rx:4,fill:'var(--accent3)','fill-opacity':0.45,stroke:'var(--text)','stroke-width':2}));
          for(var c=0;c<=100;c+=10){
            svg.appendChild(el('line',{x1:x0+c*k,y1:y,x2:x0+c*k,y2:y+(c%50===0 ? 20 : 12),stroke:'var(--text)','stroke-width':c%50===0 ? 2.5 : 1.5}));
            if(c%50===0){ var t=svgText(x0+c*k, y+52, 15, c===100 ? '100 cm' : (c===0 ? '0' : '50 cm')); t.setAttribute('font-weight','800'); svg.appendChild(t); }
          }
          svg.appendChild(el('path',{d:'M '+x0+' '+(y-10)+' v -8 h '+(100*k)+' v 8',fill:'none',stroke:'var(--accent)','stroke-width':3}));
          var tm=svgText(x0+50*k, y-30, 24, '1 m = 100 cm'); tm.setAttribute('font-weight','800'); svg.appendChild(tm);
        },
        cols3:false,
        choices: vals.map(function(v){ return { label:fmt(v), ok:v===max }; })
      };
    }
    // conversions
    var q, ans, extra;
    if(kind==='conv'){ var mm = randInt(1,5); q = mm + ' m = ? cm'; ans = mm*100; extra = [mm*10, mm*1000, mm+100, mm*100+10]; }
    else { var km = randInt(1,5); q = km + ' km = ? m'; ans = km*1000; extra = [km*100, km*10000, km*100+1000, km+1000]; }
    return {
      tag:'Mesures', question:'Convertis : ' + q, sub:'1 m = 100 cm et 1 km = 1 000 m.',
      explain: q.replace('?', String(ans)) + '.',
      draw:function(){ drawEquation(q); },
      cols3:false,
      choices: numChoiceSet(ans, extra).map(function(v){ return { label:String(v), ok:v===ans }; })
    };
  }

  // ===================== Périmètre =====================
  function genPerimetreQuestion(level){
    var w, h, ans, explain, question, drawFn;
    if(level===0){
      w = randInt(2,5); h = randInt(1,4); if(w===h) h = h===1 ? 2 : h-1;
      ans = 2*(w+h);
      question = 'Chaque carreau a un côté de 1 cm. Quel est le périmètre du rectangle (le tour) ?';
      explain = 'Le tour : ' + w + ' + ' + h + ' + ' + w + ' + ' + h + ' = ' + ans + ' cm.';
      drawFn = function(svg){
        var c = 22, x0 = (200 - w*c)/2, y0 = (200 - h*c)/2;
        for(var i=0;i<w;i++) for(var j=0;j<h;j++)
          svg.appendChild(el('rect',{x:x0+i*c,y:y0+j*c,width:c,height:c,fill:'var(--accent3)','fill-opacity':0.35,stroke:'var(--text)','stroke-width':1}));
        svg.appendChild(el('rect',{x:x0,y:y0,width:w*c,height:h*c,fill:'none',stroke:'var(--text)','stroke-width':3}));
      };
    } else if(level===1){
      var sq = Math.random()<0.4;
      w = randInt(3,12); h = sq ? w : randInt(2,10); if(!sq && w===h) h = h+1;
      ans = 2*(w+h);
      question = sq ? 'Un carré a des côtés de ' + w + ' cm. Quel est son périmètre ?' : 'Un rectangle mesure ' + w + ' cm de long et ' + h + ' cm de large. Quel est son périmètre ?';
      explain = sq ? 'Le carré a 4 côtés égaux : 4 × ' + w + ' = ' + ans + ' cm.' : 'Le tour : ' + w + ' + ' + h + ' + ' + w + ' + ' + h + ' = ' + ans + ' cm.';
      drawFn = function(svg){
        var W = sq ? 90 : 120, H = sq ? 90 : Math.max(50, Math.min(100, 120*h/w));
        var x0 = (200-W)/2, y0 = (200-H)/2;
        svg.appendChild(el('rect',{x:x0,y:y0,width:W,height:H,fill:'var(--accent3)','fill-opacity':0.35,stroke:'var(--text)','stroke-width':3}));
        svg.appendChild(svgText(100,y0-8,16,w + ' cm'));
        svg.appendChild(svgText(x0+W+24,100+5,16,h + ' cm'));
      };
    } else {
      var n = pick([3,5,6]), side = randInt(2,9);
      ans = n*side;
      var nm = { 3:'un triangle équilatéral', 5:'un pentagone régulier', 6:'un hexagone régulier' }[n];
      question = 'C\'est ' + nm + ' : tous ses côtés mesurent ' + side + ' cm. Quel est son périmètre ?';
      explain = nm.charAt(0).toUpperCase() + nm.slice(1) + ' a ' + n + ' côtés égaux : ' + n + ' × ' + side + ' = ' + ans + ' cm.';
      drawFn = function(svg){
        var pts = ngonPoints(n, 100, 108, 62, 62, -90);
        svg.appendChild(el('polygon',{points:isoPoly(pts),fill:'var(--accent3)','fill-opacity':0.35,stroke:'var(--text)','stroke-width':3}));
        svg.appendChild(svgText(100,24,16,side + ' cm'));
      };
    }
    return {
      tag:'Périmètre', question:question, sub:'Le périmètre, c\'est la longueur du tour de la figure.', explain:explain,
      draw:function(){ var svg=document.getElementById('m4Svg'); svg.setAttribute('viewBox','0 0 200 200'); svg.innerHTML=""; drawFn(svg); },
      cols3:false,
      choices: numChoiceSet(ans, [ans+2, ans-2, ans+4, ans-4, w*h, ans+1, ans-1].filter(function(v){ return v>0; })).map(function(v){ return { label:v + ' cm', ok:v===ans }; })
    };
  }

  // ===================== Trouve l'intrus =====================
  function genIntrusQuestion(level){
    var maj, mino, rotFixed = false, kind;
    if(level===0){ var t = shuffle([3,4,0]); maj = t[0]; mino = t[1]; }
    else if(level===1){ var t2 = shuffle([3,4,5,6]); maj = t2[0]; mino = t2[1]; }
    else if(Math.random()<0.5){ kind = 'carreRect'; rotFixed = true; }
    else { var t3 = shuffle([5,6,8]); maj = t3[0]; mino = t3[1]; }
    var pos = randInt(0,3), letters = ['A','B','C','D'], colors = ['var(--accent)','var(--accent2)','var(--accent3)'];
    function drawOne(svg, k, isIntrus, cx, cy){
      var fill = colors[randInt(0,2)], r = randInt(24,32);
      var rot = rotFixed ? -90 : randInt(0,359);
      var node;
      if(kind==='carreRect'){
        if(isIntrus) node = el('rect',{x:cx-r*1.15,y:cy-r*0.62,width:r*2.3,height:r*1.24});
        else node = el('rect',{x:cx-r*0.8,y:cy-r*0.8,width:r*1.6,height:r*1.6});
        node.setAttribute('fill',fill);
      } else {
        var n = isIntrus ? mino : maj;
        if(n===0) node = el('circle',{cx:cx,cy:cy,r:r});
        else node = el('polygon',{points:isoPoly(ngonPoints(n,cx,cy,r,r,rot))});
        node.setAttribute('fill',fill);
      }
      node.setAttribute('fill-opacity','0.55'); node.setAttribute('stroke','var(--text)'); node.setAttribute('stroke-width','2.5');
      svg.appendChild(node);
      svg.appendChild(svgText(cx-40,cy-30,16,letters[k]));
    }
    var name = kind==='carreRect' ? 'le rectangle qui n\'est pas un carré' : 'la forme qui n\'a pas le même nombre de côtés que les autres';
    var explain = kind==='carreRect' ? 'Les trois autres sont des carrés (4 côtés égaux). La forme ' + letters[pos] + ' est un rectangle : ses côtés ne sont pas tous égaux.'
      : (maj===0 ? 'Trois formes sont des cercles (aucun côté)' : 'Trois formes ont ' + maj + ' côtés') + ', mais la forme ' + letters[pos] + ' ' + (mino===0 ? 'est un cercle (aucun côté)' : 'a ' + mino + ' côtés') + '.';
    return {
      tag:'Intrus', question:'Trouve l\'intrus : quelle forme est différente des trois autres ?', sub:'Compte les côtés et regarde bien chaque forme.',
      explain:explain,
      draw:function(){
        var svg=document.getElementById('m4Svg'); svg.setAttribute('viewBox','0 0 200 200'); svg.innerHTML="";
        var centers = [[52,52],[148,52],[52,148],[148,148]];
        for(var k=0;k<4;k++) drawOne(svg, k, k===pos, centers[k][0], centers[k][1]);
      },
      cols3:false,
      choices: letters.map(function(l, k){ return { label:l, ok:k===pos }; })
    };
  }

  // ===================== Symétrie : choisir le dessin symétrique =====================
  // Grille 3 colonnes × 5 lignes à gauche de l'axe ; les 4 réponses sont des
  // moitiés droites : la bonne (miroir), la même sans miroir (translation),
  // le miroir retourné en hauteur, et une version avec une case fausse.
  function drawHalfGrid(svg, cells, x0, y0, c, color){
    for(var r=0;r<5;r++) for(var k=0;k<3;k++){
      svg.appendChild(el('rect',{x:x0+k*c,y:y0+r*c,width:c,height:c,fill:cells[r][k] ? color : 'var(--surface)',stroke:'var(--text)','stroke-width':1,'stroke-opacity':0.45}));
    }
  }
  function genSymVisuelQuestion(level){
    var rows = level===0 ? 3 : 5, count = level===0 ? 4 : level===1 ? 5 : 7;
    var left, tries = 0, right, trans, flip, off;
    function empty(){ var g=[]; for(var r=0;r<5;r++){ g.push([false,false,false]); } return g; }
    function key(g){ return g.map(function(r){ return r.map(function(v){ return v?1:0; }).join(''); }).join('|'); }
    do {
      left = empty();
      var placed = 0, guard = 0;
      while(placed<count && guard++<100){
        var r = randInt(0,rows-1), k = randInt(0,2);
        if(!left[r][k]){ left[r][k] = true; placed++; }
      }
      right = empty(); trans = empty(); flip = empty();
      for(r=0;r<5;r++) for(k=0;k<3;k++){
        right[r][k] = left[r][2-k];
        trans[r][k] = left[r][k];
        flip[r][k] = left[4-r][2-k];
      }
      off = right.map(function(row){ return row.slice(); });
      var rr = randInt(0,rows-1), kk = randInt(0,2); off[rr][kk] = !off[rr][kk];
      tries++;
    } while(tries<100 && (new Set([key(right),key(trans),key(flip),key(off)])).size<4);
    if(tries>=100) return genSymVisuelQuestion(level);
    var opts = shuffle([{g:right,ok:true},{g:trans,ok:false},{g:flip,ok:false},{g:off,ok:false}]);
    var C = 22;
    return {
      tag:'Symétrie', question:'Quel dessin complète la figure pour qu\'elle soit symétrique par rapport à la ligne rouge ?',
      sub:'Imagine un miroir posé sur la ligne : ce qui est loin de la ligne à gauche est loin de la ligne à droite.',
      explain:'Avec un miroir sur la ligne, chaque case coloriée à gauche a sa case « jumelle » à droite, à la même hauteur et à la même distance de la ligne : la colonne près de la ligne reste près de la ligne.',
      draw:function(){
        var svg=document.getElementById('m4Svg'); svg.setAttribute('viewBox','0 0 200 200'); svg.innerHTML="";
        var x0 = 100 - 3*C, y0 = 100 - 2.5*C;
        drawHalfGrid(svg, left, x0, y0, C, 'var(--accent2)');
        for(var r2=0;r2<5;r2++) for(var k2=0;k2<3;k2++) svg.appendChild(el('rect',{x:100+k2*C,y:y0+r2*C,width:C,height:C,fill:'none',stroke:'var(--text)','stroke-width':1,'stroke-opacity':0.2,'stroke-dasharray':'3,3'}));
        svg.appendChild(el('line',{x1:100,y1:y0-6,x2:100,y2:y0+5*C+6,stroke:'#d33','stroke-width':3}));
      },
      cols3:false,
      choices: opts.map(function(o, i){
        return { label:'Dessin ' + (i+1), ok:o.ok, viewBox:'0 0 100 100', draw:function(svg){
          svg.appendChild(el('line',{x1:20,y1:4,x2:20,y2:96,stroke:'#d33','stroke-width':2.5}));
          drawHalfGrid(svg, o.g, 20, 7.5, 17, 'var(--accent2)');
        } };
      })
    };
  }

  // ===================== Énigmes =====================
  var ENIGME_POOL = [
    { text:'Je n\'ai pas de côtés, pas de sommets, et je peux rouler très loin. Qui suis-je ?', answer:'boule', pool:['boule','cube','cylindre','cercle'] },
    { text:'J\'ai 3 côtés et 3 sommets, ni plus ni moins. Qui suis-je ?', answer:'triangle', pool:['triangle','carré','pentagone','losange'] },
    { text:'J\'ai 4 côtés égaux et 4 angles droits. Qui suis-je ?', answer:'carré', pool:['carré','rectangle','losange','pentagone'] },
    { text:'J\'ai 6 faces carrées, 8 sommets et 12 arêtes. Qui suis-je ?', answer:'cube', pool:['cube','pavé droit','pyramide à base carrée','cylindre'] },
    { text:'J\'ai une pointe et une base carrée, avec 4 faces triangulaires. Qui suis-je ?', answer:'pyramide à base carrée', pool:['pyramide à base carrée','cube','cône','pavé droit'] },
    { text:'Je suis tout rond et je n\'ai ni côté ni sommet. Qui suis-je ?', answer:'cercle', pool:['cercle','boule','losange','triangle'] },
    { text:'J\'ai 4 côtés égaux, mais mes angles ne sont pas droits : je suis un peu penché. Qui suis-je ?', answer:'losange', pool:['losange','carré','rectangle','pentagone'] },
    { text:'J\'ai 4 angles droits, mais mes côtés ne sont pas tous égaux. Qui suis-je ?', answer:'rectangle', pool:['rectangle','carré','losange','triangle'] },
    { text:'J\'ai 5 côtés, ni plus ni moins. Qui suis-je ?', answer:'pentagone', pool:['pentagone','hexagone','carré','triangle'] },
    { text:'J\'ai deux cercles identiques reliés par une surface qui s\'enroule. Qui suis-je ?', answer:'cylindre', pool:['cylindre','cône','cube','boule'] },
    { text:'J\'ai une seule pointe et une base ronde. Qui suis-je ?', answer:'cône', pool:['cône','pyramide à base carrée','cylindre','boule'] },
    { text:'J\'ai 6 faces qui sont toutes des rectangles, mais pas toutes des carrés. Qui suis-je ?', answer:'pavé droit', pool:['pavé droit','cube','pyramide à base carrée','cylindre'] },
    { text:'On me trouve souvent sous la forme d\'un dé à jouer. Qui suis-je ?', answer:'cube', pool:['cube','pavé droit','pyramide à base carrée','boule'] },
    { text:'On me trouve souvent sous la forme d\'un ballon de football. Qui suis-je ?', answer:'boule', pool:['boule','cercle','cylindre','cône'] },
    { text:'On me trouve souvent sous la forme d\'une canette de soda. Qui suis-je ?', answer:'cylindre', pool:['cylindre','cube','cône','pavé droit'] },
    { text:'On me trouve souvent sous la forme d\'un chapeau de sorcière. Qui suis-je ?', answer:'cône', pool:['cône','pyramide à base carrée','cylindre','triangle'] },
    { text:'J\'ai 6 côtés et 6 sommets, comme les alvéoles d\'une ruche d\'abeilles. Qui suis-je ?', answer:'hexagone', pool:['hexagone','pentagone','carré','cercle'] },
    { text:'Je n\'ai que des angles droits, et si tous mes côtés étaient égaux, on m\'appellerait un carré. Qui suis-je ?', answer:'rectangle', pool:['rectangle','carré','losange','pentagone'] },
    { text:'J\'ai deux faces planes qui sont des cercles identiques, reliées par une surface qui s\'enroule. Qui suis-je ?', answer:'cylindre', pool:['cylindre','cône','boule','cube'] },
    { text:'Je n\'ai aucun angle : impossible de me confondre avec un carré ou un triangle. Qui suis-je ?', answer:'cercle', pool:['cercle','losange','triangle','carré'] },
    { text:'J\'ai 8 sommets et 12 arêtes, mais toutes mes faces ne sont pas des carrés. Qui suis-je ?', answer:'pavé droit', pool:['pavé droit','cube','pyramide à base carrée','cylindre'] },
    { text:'Je ressemble à un carré, mais si on me penche un peu, mes angles ne sont plus droits. Qui suis-je devenu ?', answer:'losange', pool:['losange','rectangle','carré','pentagone'] },
    { text:'Mes 3 côtés ont tous la même longueur. Qui suis-je ?', answer:'triangle', pool:['triangle','losange','pentagone','carré'] },
    { text:'J\'ai 8 sommets, 12 arêtes et 6 faces, toutes identiques et carrées. Qui suis-je ?', answer:'cube', pool:['cube','pavé droit','pyramide à base carrée','cylindre'] },
    { text:'J\'ai seulement 4 faces, toutes triangulaires, et 4 sommets : je suis la plus simple des pyramides. Qui suis-je ?', answer:'tétraèdre', pool:['tétraèdre','pyramide à base carrée','cube','octaèdre'] },
    { text:'Je suis formé de deux pyramides à base carrée collées par leur base : j\'ai 8 faces triangulaires. Qui suis-je ?', answer:'octaèdre', pool:['octaèdre','tétraèdre','cube','pyramide à base carrée'] },
    { text:'J\'ai 2 faces triangulaires et 3 faces rectangulaires : on me trouve dans les tentes de camping. Qui suis-je ?', answer:'prisme triangulaire', pool:['prisme triangulaire','pyramide à base carrée','tétraèdre','pavé droit'] },
    { text:'J\'ai 2 faces pentagonales (à 5 côtés) et 5 faces rectangulaires. Qui suis-je ?', answer:'prisme pentagonal', pool:['prisme pentagonal','prisme hexagonal','pyramide à base carrée','cube'] },
    { text:'J\'ai 2 faces hexagonales et 6 faces rectangulaires : ma base a la même forme qu\'une alvéole d\'abeille. Qui suis-je ?', answer:'prisme hexagonal', pool:['prisme hexagonal','prisme pentagonal','prisme octogonal','cylindre'] },
    { text:'J\'ai 2 faces à 8 côtés et 8 faces rectangulaires : ma base ressemble à un panneau "stop". Qui suis-je ?', answer:'prisme octogonal', pool:['prisme octogonal','prisme hexagonal','cylindre','prisme pentagonal'] },
    { text:"Je suis un quadrilatère : j'ai 4 côtés. Mes côtés opposés sont égaux deux par deux et j'ai 4 angles droits, mais je ne suis pas un carré. Qui suis-je ?", answer:"rectangle", pool:["rectangle", "carré", "losange", "triangle"] },
    { text:"J'ai 6 sommets et 6 côtés. Si on me coupe en deux, on obtient deux trapèzes. Qui suis-je ?", answer:"hexagone", pool:["hexagone", "pentagone", "carré", "triangle"] },
    { text:"Une pièce de monnaie a la forme de mon contour : je suis tout rond et plat. Qui suis-je ?", answer:"cercle", pool:["cercle", "boule", "cylindre", "losange"] },
    { text:"On me trouve souvent sous la forme d'une boîte de chaussures. Qui suis-je ?", answer:"pavé droit", pool:["pavé droit", "cube", "cylindre", "cône"] },
    { text:"On me trouve souvent sous la forme d'un cornet de glace. Qui suis-je ?", answer:"cône", pool:["cône", "cylindre", "pyramide à base carrée", "boule"] },
    { text:"On me trouve souvent sous la forme d'un toit de pyramide en Égypte. Qui suis-je ?", answer:"pyramide à base carrée", pool:["pyramide à base carrée", "cube", "cône", "pavé droit"] },
    { text:"On me trouve souvent sous la forme d'une bille. Qui suis-je ?", answer:"boule", pool:["boule", "cercle", "cylindre", "cône"] },
    { text:"On me trouve souvent sous la forme d'un rouleau de papier toilette. Qui suis-je ?", answer:"cylindre", pool:["cylindre", "cône", "boule", "cube"] },
    { text:"J'ai 3 sommets et 3 côtés, et un de mes angles est droit. Qui suis-je ?", answer:"triangle", pool:["triangle", "rectangle", "carré", "pentagone"] },
    { text:"Je suis un quadrilatère avec 4 côtés égaux et 4 angles droits : si on me tourne d'un quart de tour, je reste pareil. Qui suis-je ?", answer:"carré", pool:["carré", "rectangle", "losange", "triangle"] },
    { text:"J'ai 5 sommets et 5 côtés : j'ai un côté de plus qu'un quadrilatère. Qui suis-je ?", answer:"pentagone", pool:["pentagone", "hexagone", "carré", "triangle"] },
    { text:"J'ai 5 faces : une base carrée et 4 triangles qui se rejoignent en haut. Qui suis-je ?", answer:"pyramide à base carrée", pool:["pyramide à base carrée", "tétraèdre", "cube", "cône"] },
    { text:"J'ai 1 face plane ronde, 1 sommet et une surface qui s'enroule. Qui suis-je ?", answer:"cône", pool:["cône", "cylindre", "pyramide à base carrée", "boule"] },
    { text:"J'ai 12 arêtes, mais mes faces n'ont pas toutes la même taille. Je ressemble à une brique. Qui suis-je ?", answer:"pavé droit", pool:["pavé droit", "cube", "pyramide à base carrée", "cylindre"] },
    { text:"Je n'ai aucune face plane : je suis rond de partout. Qui suis-je ?", answer:"boule", pool:["boule", "cylindre", "cône", "cube"] },
    { text:"Je suis un quadrilatère qui a 4 côtés égaux. Si on me pose sur une pointe, je ressemble à un diamant. Qui suis-je ?", answer:"losange", pool:["losange", "rectangle", "triangle", "pentagone"] }
  ];
  function genEnigmeQuestion(){
    var r = pickFresh('enigme', ENIGME_POOL);
    var poolOthers = shuffle(r.pool.filter(function(p){return p!==r.answer;})).slice(0,3);
    var labels = shuffle([r.answer].concat(poolOthers));
    return {
      tag:'Énigme',
      question: r.text,
      sub:'Lis bien l\'énigme et retrouve la bonne réponse.',
      explain:'La réponse est « ' + r.answer + ' » : ' + ((typeof SOLID_FACTS!=='undefined' && SOLID_FACTS[r.answer]) || 'relis bien les indices de l\'énigme.'),
      draw:function(){
        var svg=document.getElementById('m4Svg'); svg.setAttribute('viewBox','0 0 200 200'); svg.innerHTML="";
        svg.appendChild(svgText(100,120,64,'?'));
      },
      cols3:false,
      choices: labels.map(function(l){ return { label:l, ok:l===r.answer }; })
    };
  }

  // ---- Paramètres par niveau (0 = Facile, 1 = Moyen, 2 = Difficile) ----
  var GEO_LEVELS = [
    { shapes:['triangle','carre','rectangle'], angleGap:20 },
    { shapes:['triangle','carre','rectangle','pentagone','hexagone','cercle'], angleGap:14 },
    { shapes:['triangle','carre','rectangle','pentagone','hexagone','cercle','losange'], angleGap:7 }
  ];

  // ---- Questions de Quizz déplacées depuis l'ancien moteur (mêmes textes, même tirage) ----
  function genSidesVerticesQuestion(type, level){
    var shapeKey = pick(GEO_LEVELS[level].shapes);
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

  function genNameQuestion(level){
    var shapeKey2 = pick(GEO_LEVELS[level].shapes);
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

  // Angles : trois variantes.
  //  - « classer » : droit, aigu ou obtus (une seule valeur, l'écart à 90° se resserre avec le niveau) ;
  //  - « comparer » : quel angle est le plus grand (2 ou 3 angles aux branches de longueurs différentes ;
  //    Difficile : ils peuvent être égaux) ;
  //  - « droits » : combien d'angles droits dans une figure.
  function genAngleQuestion(level){
    var variants = level===0 ? ['comparer','droits'] : ['classer','comparer','droits'];
    var v = pickFresh('angle-var-' + level, variants);
    if(v==='comparer') return genAngleComparer(level);
    if(v==='droits') return genAngleDroits(level);
    return genAngleClasser(level);
  }
  function genAngleClasser(level){
    var cat = pick(['droit','aigu','obtus']);
    var gap = GEO_LEVELS[level].angleGap;
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
  // Un angle dessiné autour d'un centre, tourné au hasard ; les branches ont des longueurs différentes
  // pour que « le plus long » ne soit jamais un indice.
  function drawAngleAt(svg, cx, cy, deg, len, rot, color1, color2, letter){
    var r1 = rot*Math.PI/180, r2 = (rot+deg)*Math.PI/180;
    var l1 = len*rand(0.8,1), l2 = len*rand(0.8,1);
    var ax = cx + l1*Math.cos(r1), ay = cy - l1*Math.sin(r1), bx = cx + l2*Math.cos(r2), by = cy - l2*Math.sin(r2);
    var rr = 20, sx = cx + rr*Math.cos(r1), sy = cy - rr*Math.sin(r1), ex = cx + rr*Math.cos(r2), ey = cy - rr*Math.sin(r2);
    svg.appendChild(el('path',{d:'M '+cx+' '+cy+' L '+sx+' '+sy+' A '+rr+' '+rr+' 0 0 0 '+ex+' '+ey+' Z', fill:'var(--accent3)','fill-opacity':0.55, stroke:'none'}));
    svg.appendChild(el('line',{x1:cx,y1:cy,x2:ax,y2:ay,stroke:color1,'stroke-width':5,'stroke-linecap':'round'}));
    svg.appendChild(el('line',{x1:cx,y1:cy,x2:bx,y2:by,stroke:color2,'stroke-width':5,'stroke-linecap':'round'}));
    svg.appendChild(el('circle',{cx:cx,cy:cy,r:4,fill:'var(--text)'}));
    // lettre placée au bout de la bissectrice, côté opposé aux branches
    var bis = (rot + deg/2 + 180)*Math.PI/180;
    svg.appendChild(svgText(cx + 20*Math.cos(bis), cy - 20*Math.sin(bis) + 5, 15, letter));
  }
  function genAngleComparer(level){
    var k = level===2 ? pick([2,3]) : (level===1 ? pick([2,3]) : 2);
    var minGap = level===0 ? 40 : level===1 ? 20 : 10;
    var equalCase = level===2 && k===2 && Math.random()<0.3;
    var degs, tries = 0;
    do {
      degs = []; for(var i=0;i<k;i++) degs.push(Math.round(rand(25, 160)));
      if(equalCase) degs[1] = degs[0];
      var sorted = degs.slice().sort(function(a,b){ return b-a; });
      var ok = equalCase || sorted.every(function(d,i){ return i===0 || sorted[i-1]-d >= minGap; });
      tries++;
    } while(!ok && tries<300);
    var letters = ['A','B','C'].slice(0,k);
    var max = Math.max.apply(null, degs), bigIdx = degs.indexOf(max);
    var answer = equalCase ? 'Ils sont égaux' : letters[bigIdx];
    var centers = k===2 ? [[50,100],[150,100]] : [[50,50],[150,50],[100,150]];
    var rots = degs.map(function(d){ return rand(0, 360 - d); });
    var cols = [['var(--accent)','var(--accent2)'],['var(--accent2)','var(--accent)'],['var(--accent)','var(--accent3)']];
    var choices = letters.map(function(l){ return { label:l, ok:l===answer }; });
    if(level===2 && k===2) choices.push({ label:'Ils sont égaux', ok:equalCase });
    return {
      tag:'Angles',
      question: k===2 ? 'Quel angle est le plus grand : A ou B ?' : 'Quel angle est le plus grand ?',
      sub: 'Compare l\'écart entre les deux branches. La longueur des branches ne change rien à l\'angle.',
      explain: equalCase ? 'Les deux angles s\'ouvrent exactement pareil : ils sont égaux. Les branches n\'ont pas la même longueur, mais cela ne change pas l\'angle.'
        : 'L\'angle ' + answer + ' est le plus ouvert : c\'est le plus grand. La longueur des branches ne compte pas, seul compte l\'écart entre elles.',
      draw:function(){
        var svg=document.getElementById('m4Svg'); svg.setAttribute('viewBox','0 0 200 200'); svg.innerHTML="";
        degs.forEach(function(d,i){ drawAngleAt(svg, centers[i][0], centers[i][1], d, k===2 ? 48 : 46, rots[i], cols[i][0], cols[i][1], letters[i]); });
      },
      cols3: choices.length===3,
      choices: choices
    };
  }
  // Figures dont on compte les angles droits. Les coordonnées sont centrées sur (0,0).
  var ANGLE_FIGS = {
    rect:   { name:'rectangle', rights:4, why:'Un rectangle a 4 angles droits.',
      pts:function(){ var w=rand(100,140), h=rand(55,85); return [[-w/2,-h/2],[w/2,-h/2],[w/2,h/2],[-w/2,h/2]]; } },
    carre:  { name:'carré', rights:4, why:'Un carré a 4 angles droits.',
      pts:function(){ var c=rand(80,105); return [[-c/2,-c/2],[c/2,-c/2],[c/2,c/2],[-c/2,c/2]]; } },
    triRect:{ name:'triangle rectangle', rights:1, why:'Ce triangle a un seul angle droit, dans le coin ; les deux autres sont aigus.',
      pts:function(){ var a=rand(90,130), b=rand(60,100); return [[-a/2,b/2],[a/2,b/2],[-a/2,-b/2]]; } },
    triGen: { name:'triangle', rights:0, why:'Ce triangle n\'a aucun angle droit.',
      pts:function(){ var t=0, p; do { p=[[-rand(40,60),rand(30,50)],[rand(40,65),rand(30,50)],[rand(-25,25),-rand(40,60)]]; t++; } while(t<100 && !figNoRight(p)); return p; } },
    trapRect:{ name:'trapèze rectangle', rights:2, why:'Ce trapèze a 2 angles droits, côte à côte sur le côté droit ou gauche ; les 2 autres ne sont pas droits.',
      pts:function(){ var w=rand(100,140), h=rand(60,85), d=rand(30,50); return [[-w/2,h/2],[w/2,h/2],[w/2-d,-h/2],[-w/2,-h/2]]; } },
    maison: { name:'maison', rights:2, why:'Les 2 angles en bas sont droits ; les autres coins sont plus ouverts que le coin d\'une feuille (obtus).',
      pts:function(){ var w=rand(100,120), h1=rand(45,60), h2=rand(25,35), b=(h1+h2)/2; return [[-w/2,b],[w/2,b],[w/2,b-h1],[0,b-h1-h2],[-w/2,b-h1]]; } },
    losange:{ name:'losange', rights:0, why:'Un losange a 4 côtés égaux mais aucun angle droit (sinon ce serait un carré).',
      pts:function(){ var d1=rand(110,140), d2=rand(55,d1-30); return [[0,-d1/2],[d2/2,0],[0,d1/2],[-d2/2,0]]; } },
    parallelo:{ name:'parallélogramme', rights:0, why:'Un parallélogramme penché n\'a aucun angle droit.',
      pts:function(){ var w=rand(90,115), h=rand(55,80), sh=rand(22,36); return [[-w/2+sh,-h/2],[w/2+sh,-h/2],[w/2-sh,h/2],[-w/2-sh,h/2]]; } }
  };
  function figNoRight(p){
    var n = p.length;
    return p.every(function(q,i){ return Math.abs(angleAtDeg([p[(i+n-1)%n][0],p[(i+n-1)%n][1]], [q[0],q[1]], [p[(i+1)%n][0],p[(i+1)%n][1]]) - 90) > 18; });
  }
  function genAngleDroits(level){
    var pool = level===0 ? ['rect','carre','triGen','triRect'] : level===1 ? ['rect','carre','triGen','triRect','trapRect','maison'] : ['rect','carre','triRect','trapRect','maison','losange','parallelo','triGen'];
    var key = pickFresh('angle-fig-' + level, pool), f = ANGLE_FIGS[key], P = f.pts();
    var rot = (level===2 && f.rights>0 && Math.random()<0.7) ? rand(-0.5,0.5) : (key==='maison' || key==='trapRect' ? rand(-0.15,0.15) : rand(-0.12,0.12));
    var flip = Math.random()<0.5 ? -1 : 1;
    var pts2 = P.map(function(q){ var x = q[0]*flip, y = q[1]; return [100 + x*Math.cos(rot) - y*Math.sin(rot), 100 + x*Math.sin(rot) + y*Math.cos(rot)]; });
    var vals = numChoiceSet(f.rights, [0,1,2,3,4,5]);
    return {
      tag:'Angles',
      question:'Combien d\'angles droits y a-t-il dans cette figure ?',
      sub:'Un angle droit ressemble au coin d\'une feuille. Regarde chaque coin de la figure.',
      explain: f.why,
      draw:function(){
        var svg=document.getElementById('m4Svg'); svg.setAttribute('viewBox','0 0 200 200'); svg.innerHTML="";
        svg.appendChild(el('polygon',{points:pts2.map(function(q){ return q[0].toFixed(1)+','+q[1].toFixed(1); }).join(' '), fill:'var(--accent2)','fill-opacity':0.5, stroke:'var(--accent)','stroke-width':4,'stroke-linejoin':'round'}));
      },
      cols3:false,
      choices: vals.map(function(v){ return { label:String(v), ok:v===f.rights }; })
    };
  }

  // ---- Déclaration des types de Quizz du thème Géométrie ----
  registerQuizType({ id:'sides', domain:'formes', label:'Côtés', longLabel:'Compter les côtés', defaultLevels:[0,1,2],
    randomNote:'La forme est tirée au hasard parmi celles autorisées à ce niveau ; son nombre de côtés en découle de façon fixe (ce n\'est pas lui qui est tiré, seule la forme l\'est).',
    generate:function(level){ return genSidesVerticesQuestion('sides', level); } });
  registerQuizType({ id:'vertices', domain:'formes', label:'Sommets', longLabel:'Compter les sommets', defaultLevels:[0,1,2],
    randomNote:'Même principe que "Côtés" : la forme est tirée au hasard, son nombre de sommets en découle de façon fixe.',
    generate:function(level){ return genSidesVerticesQuestion('vertices', level); } });
  registerQuizType({ id:'name', domain:'formes', label:'Nom', longLabel:'Nom de la forme', defaultLevels:[0,1,2],
    randomNote:'La forme est tirée au hasard parmi celles du niveau ; son nom est fixe une fois la forme choisie.',
    generate:genNameQuestion });
  registerQuizType({ id:'align', domain:'formes', label:'Alignement', longLabel:'Alignement', defaultLevels:[0,1,2],
    randomNote:'Facile : 3 points, alignés ou non, en ligne ou en colonne. Moyen : + diagonales, points espacés, « presque alignés », et deux nouvelles variantes (parmi 4 points, lesquels sont alignés ; quel point numéroté est aligné avec A et B). Difficile : + droites penchées (2 colonnes pour 1 ligne). Les points sont tirés au hasard ; les bonnes réponses sont vérifiées par le calcul (une seule possible).',
    generate:genAlignQuestion });
  registerQuizType({ id:'milieu', domain:'formes', label:'Milieu', longLabel:'Milieu d\'un segment', defaultLevels:[0,1,2],
    randomNote:'Facile : 3 formes sur le segment, on cherche celle du milieu. Moyen : segment de 3 ou 5 cases avec 3 ou 5 formes (une au milieu), ou 2 ou 4 formes (aucune au milieu : « Aucune forme » est toujours proposée). Difficile : idem, et une variante où l\'on lit les coordonnées du milieu de [AB] (horizontal, vertical ou diagonal). Position, formes et couleurs sont tirées au hasard.',
    generate:genMilieuQuestion });
  registerQuizType({ id:'coord', domain:'repere', label:'Coordonnées', longLabel:'Lire des coordonnées', defaultLevels:[0,1,2],
    randomNote:'Le point marqué sur le quadrillage est tiré au hasard ; ses coordonnées en découlent de façon fixe.',
    generate:genCoordQuestion });
  registerQuizType({ id:'angle', domain:'formes', label:'Angles', longLabel:'Angles (droit, aigu, obtus, comparer)', defaultLevels:[0,1,2],
    randomNote:'Trois variantes en alternance. Facile : comparer 2 angles très différents, ou compter les angles droits d\'un rectangle, carré ou triangle. Moyen : + classer un angle (droit/aigu/obtus, écart de 14° autour de 90°), comparer 2 ou 3 angles, trapèze rectangle et maison. Difficile : écart de 7°, comparaisons très serrées (ou angles égaux aux branches inégales), + losange, parallélogramme et figures penchées. Valeurs et branches tirées au hasard.',
    generate:genAngleQuestion });
  registerQuizType({ id:'image', domain:'formes', label:'Image', longLabel:'Photo / illustration', defaultLevels:[1,2],
    randomNote:'La scène est tirée au hasard parmi 5 illustrations fixes (maison, clôture, château, robot, train) ; certaines valeurs (nombre de wagons, présence d\'une fenêtre...) varient aussi au hasard à l\'intérieur d\'une même scène.',
    generate:function(){ return pickFresh('image', IMAGE_QUESTIONS)(); } });
  registerQuizType({ id:'coordFind', domain:'repere', label:'Repérage', longLabel:'Trouver sur le quadrillage', defaultLevels:[1,2],
    randomNote:'Les 4 cases et les formes qui s\'y trouvent sont tirées au hasard à chaque question.',
    generate:genCoordFindQuestion });
  registerQuizType({ id:'codage', domain:'repere', label:'Déplacement', longLabel:'Déplacement (codage)', defaultLevels:[1,2],
    randomNote:'Le point de départ et la suite de flèches (2 à 3 déplacements) sont tirés au hasard.',
    generate:genCodageQuestion });
  registerQuizType({ id:'chasse', domain:'formes', label:'Chasse aux formes', longLabel:'Chasse aux formes', defaultLevels:[1,2],
    randomNote:'Le nombre et la disposition des formes affichées sont tirés au hasard à chaque question.',
    generate:genChasseQuestion });
  registerQuizType({ id:'decodage', domain:'repere', label:'Trajet', longLabel:'Trajet (décodage)', defaultLevels:[2],
    randomNote:'Les points de départ/arrivée et les propositions de trajet erronées sont tirés au hasard à chaque question.',
    generate:genDecodageQuestion });
  registerQuizType({ id:'symVrai', domain:'symetrie', label:'Symétrie (vrai/faux)', longLabel:'Vrai axe de symétrie ?', defaultLevels:[2],
    randomNote:'4 figures tirées en alternance : rectangle (jamais carré), carré (ses diagonales sont de vrais axes), triangle isocèle, cercle (toute droite par le centre est un axe). La droite est soit un vrai axe, soit décalée ou oblique ; la figure et les mesures sont tirées au hasard.',
    generate:genSymVraiQuestion });
  registerQuizType({ id:'enigme', domain:'logique', label:'Énigme', longLabel:'Énigme', defaultLevels:[2],
    randomNote:'L\'énigme est tirée au hasard dans une banque FIXE de 46 énigmes (tirées sans répétition tant qu’on n’a pas tout vu) (texte non généré : toujours les mêmes formulations).',
    generate:genEnigmeQuestion });
  registerQuizType({ id:'suiteFormes', domain:'logique', label:'Suite de formes', longLabel:'Suite logique de formes', defaultLevels:[0,1,2],
    randomNote:'Un motif de formes/couleurs se répète (ex. rond, carré, rond, carré…) : on trouve la suivante. Facile : motif à 2 éléments (AB). Moyen : AAB, ABB ou ABC. Difficile : ABC, AABB, ABAC ou ABCD. Les symboles sont tirés au hasard.',
    generate:genSuiteFormesQuestion });
  registerQuizType({ id:'mesures', domain:'mesures', label:'Unités de longueur', longLabel:'Mesures : unités et conversions', defaultLevels:[0,1,2],
    randomNote:'Facile : choisir l\'unité (mm, cm, m, km). Moyen : + comparer des longueurs en cm et en m. Difficile : conversions (m → cm, km → m) et comparaisons.',
    generate:genMesuresQuestion });
  registerQuizType({ id:'perimetre', domain:'mesures', label:'Périmètre', longLabel:'Périmètre (le tour d\'une figure)', defaultLevels:[1,2],
    randomNote:'Facile : rectangle sur quadrillage (on compte les carreaux du tour). Moyen : rectangle ou carré aux côtés donnés. Difficile : triangle équilatéral, pentagone ou hexagone régulier.',
    generate:genPerimetreQuestion });
  registerQuizType({ id:'intrus', domain:'logique', label:'Trouve l\'intrus', longLabel:'Trouve l\'intrus (formes)', defaultLevels:[0,1,2],
    randomNote:'Quatre formes A, B, C, D : trois se ressemblent, une est différente. Facile : triangle, carré ou cercle ; Moyen : polygones de 3 à 6 côtés ; Difficile : pentagone/hexagone/octogone, ou carrés contre un rectangle.',
    generate:genIntrusQuestion });
  registerQuizType({ id:'symVisuel', domain:'symetrie', label:'Symétrie : compléter (visuel)', longLabel:'Symétrie : choisir le dessin complété', defaultLevels:[1,2],
    randomNote:'Une moitié de figure sur une grille et une ligne rouge (miroir) ; on choisit, parmi 4 dessins, la moitié symétrique. Les pièges : la même moitié sans miroir, la moitié retournée en hauteur, et une case fausse. Moyen : 5 cases ; Difficile : 7 cases (Facile, si activé : 4 cases sur 3 lignes).',
    generate:genSymVisuelQuestion });
