  /* ===================== THÈME HORLOGE =====================
     Lire l'heure, Régler l'heure, et la question de Quizz « Lire l'heure ».
  */

  /* ===================== MODULE 5 : HORLOGE (à part entière) =====================
     Deux modes : "Lire l'heure" (QCM, réutilise la fiche « heure » (en bas de ce fichier)) et
     "Régler l'heure" (l'enfant fait glisser les aiguilles au doigt). */
  function svgPointFromEvent(svg, evt){
    var rect = svg.getBoundingClientRect();
    var vb = svg.viewBox.baseVal;
    var scaleX = vb.width/rect.width, scaleY = vb.height/rect.height;
    return { x:(evt.clientX-rect.left)*scaleX+vb.x, y:(evt.clientY-rect.top)*scaleY+vb.y };
  }

  // ---- Mode "Lire l'heure" (même moteur que le QCM, ciblé sur m5Svg) ----
  registerFamily({
    key:'clock-lire', tag:'Lire l\'heure', domain:'temps', order:50, timed:true,
    note:'Une seule épreuve. L\'heure affichée est tirée au hasard à chaque question. Le niveau fixe uniquement la précision autorisée : heure pile ou demie en Facile, + quarts d\'heure en Moyen. En Difficile : toutes les 5 minutes et les heures de 0 h à 23 h (l\'énoncé précise le moment de la journée).',
    markup:[
      '<div class="coach-row">',
      '  <div class="coach-bubble" id="m5-question">Quelle heure indique cette horloge ?</div>',
      '</div>',
      '<p class="muted" id="m5-sub">Regarde bien la petite et la grande aiguille.</p>',
      '<div class="shape-wrap"><svg id="m5Svg" viewBox="0 0 200 200" role="img" aria-label="Horloge à lire"></svg></div>',
      '<div class="qcm-choices" id="m5-choices"></div>',
      '<div class="feedback" id="m5-feedback"></div>',
      '<div class="btn-row">',
      '  <button class="btn primary" id="m5-next" type="button">Nouvelle activité ↻</button>',
      '</div>'
    ].join('\n'),
    generate:function(){ newM5Lire(); },
    signature:function(){ return quizSignature(m5Current); }
  });
  var m5Current = null;
  function newM5Lire(){
    m5Current = quizTypeById('heure').generate(globalLevel, 'm5Svg');
    document.getElementById('m5-question').textContent = m5Current.question;
    document.getElementById('m5-sub').textContent = m5Current.sub;
    m5Current.draw();
    setCoachReaction('neutral');
    var wrap = document.getElementById('m5-choices');
    wrap.className = 'qcm-choices' + (m5Current.cols3 ? ' cols3' : '');
    wrap.innerHTML = "";
    m5Current.choices.forEach(function(c){
      var b = document.createElement('button');
      b.className = 'choice-btn'; b.type = 'button';
      b.textContent = c.label.charAt(0).toUpperCase()+c.label.slice(1);
      b.addEventListener('click', function(){ checkM5Lire(c, b); });
      wrap.appendChild(b);
    });
    m5Flow.start();
  }
  var m5Flow = makeQuestionFlow({ feedback:'m5-feedback', tries:1 });
  function checkM5Lire(choice, btn){
    if(m5Flow.closed) return;
    var buttons = document.querySelectorAll('#m5-choices .choice-btn');
    buttons.forEach(function(b){ b.disabled = true; });
    if(choice.ok){
      btn.classList.add('correct');
      m5Flow.answer(true, { success:'Bravo, c\'est la bonne heure !', explain:m5Current.explain });
    } else {
      btn.classList.add('wrong');
      var okLabel = m5Current.choices.filter(function(c){return c.ok;})[0].label;
      buttons.forEach(function(b){ if(b.textContent.toLowerCase()===okLabel.toLowerCase()) b.classList.add('correct'); });
      m5Flow.answer(false, { solution:'La bonne réponse est en vert.', explain:m5Current.explain });
    }
  }
  document.getElementById('m5-next').addEventListener('click', function(){ m5Flow.skip(); });

  // ---- Mode "Régler l'heure" (glisser les aiguilles au doigt) ----
  registerFamily({
    key:'clock-regler', tag:'Régler l\'heure', domain:'temps', order:60,
    note:'Une seule épreuve. L\'heure cible à reproduire est tirée au hasard à chaque question. Le niveau fixe la précision : heure pile ou demie en Facile, + quarts d\'heure en Moyen, toutes les 5 minutes et heure de 0 h à 23 h en Difficile (l\'énoncé donne alors le moment de la journée ; il faut placer la petite aiguille comme sur le cadran, par exemple 15 h se lit 3 h). La petite aiguille se place comme sur une vraie horloge : on choisit l\'heure (12 positions) et elle se décale toute seule d\'un peu plus en avant quand la grande aiguille avance (à 8 h 10, elle est un peu après le 8 ; à 8 h 30, à mi-chemin du 9). Elle est acceptée dès qu\'elle est sur la bonne heure.',
    markup:[
      '<div class="coach-row">',
      '  <div class="coach-bubble">Place les aiguilles sur <span id="m5-target">3 h</span></div>',
      '</div>',
      '<p class="muted">Fais glisser la petite et la grande aiguille, puis vérifie.</p>',
      '<div class="shape-wrap"><svg id="m5ClockSvg" viewBox="0 0 200 200" role="group" aria-label="Horloge dont on règle les aiguilles : touche une aiguille, puis les flèches pour la tourner"></svg></div>',
      '<div class="feedback" id="m5r-feedback"></div>',
      '<div class="btn-row">',
      '  <button class="btn primary" id="m5r-check" type="button">Vérifier ✅</button>',
      '  <button class="btn primary" id="m5r-new" type="button">Nouvelle activité ↻</button>',
      '</div>'
    ].join('\n'),
    generate:function(){ m5rGenTarget(); },
    signature:function(){ return m5Target.hour + ':' + m5Target.minute; }
  });
  // Comme sur une vraie horloge : la grande aiguille se règle sur des crans qui dépendent du niveau
  // (0 Facile, 1 Moyen, 2 Difficile) et la petite aiguille se pose sur une des 12 heures ; sa position
  // affichée suit la grande aiguille (elle avance de 0,5° par minute) : à 8 h 10 elle est un peu après le 8,
  // à 8 h 30 à mi-chemin du 9. L'enfant n'a donc jamais à « faire comme si il y avait 0 minute ».
  //   Facile     heure pile ou demie      (grande : 2 positions)
  //   Moyen      + les quarts d'heure     (grande : 4 positions)
  //   Difficile  toutes les 5 minutes, heure de 0 h à 23 h (grande : 12 positions)
  var m5Target = { hour:3, minute:0, level:0 };
  var m5rHourTick = 0, m5rMinTick = 0, m5rDragWhich = null;   // m5rHourTick : 0..11 (l'heure choisie, 12 = 0)
  var M5R_MIN_STEP = [180, 90, 30];    // degrés par cran, grande aiguille
  function m5rMinutes(){ return Math.round(m5rMinTick * M5R_MIN_STEP[m5Target.level] / 6) % 60; }
  // Angle affiché de la petite aiguille : l'heure choisie + l'avance due aux minutes.
  function m5rHourAngle(){ return m5rHourTick * 30 + m5rMinutes() * 0.5; }

  // Indice quand l'heure (petite aiguille) est fausse.
  function hourHandHint(h, m){
    var a = h%12 || 12, b = a%12 + 1;
    if(m===0) return 'Indice : à ' + a + ' h pile, la petite aiguille est exactement sur le ' + a + '.';
    return 'Indice : à ' + a + ' h ' + (m<10 ? '0' + m : m) + ', la petite aiguille a dépassé le ' + a + ' sans atteindre le ' + b + ' (elle avance avec la grande).';
  }
  function m5rHourTip(){ return angleToXY(m5rHourAngle() - 90, 42); }
  function m5rMinTip(){ return angleToXY(m5rMinTick*M5R_MIN_STEP[m5Target.level] - 90, 62); }

  function drawSettableClock(){
    var svg = document.getElementById('m5ClockSvg');
    svg.setAttribute('viewBox','0 0 200 200');
    svg.innerHTML = "";
    var ht = m5rHourTip(), mt = m5rMinTip();
    drawClockFace(svg, ht, mt);
    // Poignées invisibles, plus grosses que le trait, pour un glisser confortable au doigt.
    // Au clavier (RGAA 7.3), chaque aiguille est un curseur : Tab pour la choisir,
    // flèches pour la faire tourner d'un cran ; sa position est annoncée en mots.
    var lvl = m5Target.level;
    [['hour', ht, 'Petite aiguille (les heures)', hourHandText()], ['minute', mt, 'Grande aiguille (les minutes)', minuteHandText()]].forEach(function(h){
      var c = el('circle',{cx:h[1][0],cy:h[1][1],r:20,fill:'rgba(0,0,0,0.001)', class:'clock-handle'});
      c.setAttribute('data-hand', h[0]);
      c.setAttribute('role', 'slider');
      c.setAttribute('tabindex', '0');
      c.setAttribute('aria-label', h[2]);
      c.setAttribute('aria-valuetext', h[3]);
      c.setAttribute('aria-valuenow', h[0]==='hour' ? m5rHourTick : m5rMinTick);
      c.setAttribute('aria-valuemin', 0);
      c.setAttribute('aria-valuemax', h[0]==='hour' ? 11 : Math.round(360/M5R_MIN_STEP[lvl]) - 1);
      c.addEventListener('keydown', function(e){
        var d = (e.key==='ArrowRight' || e.key==='ArrowUp') ? 1 : (e.key==='ArrowLeft' || e.key==='ArrowDown') ? -1 : 0;
        if(!d || m5rFlow.closed) return;
        e.preventDefault();
        m5rFlow.clearHint();
        if(h[0]==='hour'){ m5rHourTick = (m5rHourTick + d + 12) % 12; }
        else { var nm = Math.round(360/M5R_MIN_STEP[lvl]); m5rMinTick = (m5rMinTick + d + nm) % nm; }
        m5rFocus = h[0];
        drawSettableClock();
      });
      svg.appendChild(c);
      if(m5rFocus === h[0]) c.focus();
    });
  }
  var m5rFocus = null;   // aiguille qui garde le focus clavier après un redessin
  function hourHandText(){
    var a = m5rHourTick || 12, m = m5rMinutes();
    return m===0 ? 'sur le ' + a : 'un peu après le ' + a + ' (elle avance avec la grande aiguille)';
  }
  function minuteHandText(){
    var m = Math.round(m5rMinTick * M5R_MIN_STEP[m5Target.level] / 6) % 60;
    return m===0 ? 'sur le 12 (0 minute)' : 'sur le ' + (m/5) + ' (' + m + ' minutes)';
  }

  function m5rGenTarget(){
    var lvl = Math.max(0, Math.min(globalLevel || 0, 2));
    var label;
    m5Target.level = lvl;
    if(lvl===0){
      m5Target.hour = 1+randInt(0,11);
      m5Target.minute = rnd()<0.5 ? 30 : 0;
      label = m5Target.hour + ' h' + (m5Target.minute ? ' 30' : '');
    } else if(lvl===1){
      m5Target.hour = 1+randInt(0,11);
      m5Target.minute = pick([0,15,30,45]);
      label = minutesToClockLabel(m5Target.hour*60 + m5Target.minute);
    } else {
      m5Target.hour = randInt(0,23);
      m5Target.minute = pick([0,5,10,15,20,25,30,35,40,45,50,55]);
      label = minutesToLabel24(m5Target.hour*60 + m5Target.minute) + ' (' + periodOfDay(m5Target.hour).phrase + ')';
    }
    m5rHourTick = 0; m5rMinTick = 0; // les aiguilles repartent de midi bien net (la petite se décale avec la grande)
    document.getElementById('m5-target').textContent = label;
    drawSettableClock();
    m5rFlow.start();
  }

  (function initClockDrag(){
    var svg = document.getElementById('m5ClockSvg');
    svg.style.touchAction = 'none';
    svg.addEventListener('pointerdown', function(evt){
      var which = evt.target && evt.target.getAttribute && evt.target.getAttribute('data-hand');
      if(!which || m5rFlow.closed) return;
      m5rFocus = null;
      m5rFlow.clearHint();
      m5rDragWhich = which;
      svg.setPointerCapture(evt.pointerId);
    });
    svg.addEventListener('pointermove', function(evt){
      if(!m5rDragWhich) return;
      var p = svgPointFromEvent(svg, evt);
      var raw = Math.atan2(p.y-100, p.x-100)*180/Math.PI;
      var clockDeg = ((raw+90)%360+360)%360;
      var lvl = m5Target.level;
      // petite aiguille : l'heure dont la position AFFICHÉE (heure + avance des minutes) est la plus proche du doigt
      if(m5rDragWhich==='hour') m5rHourTick = (((Math.round((clockDeg - m5rMinutes()*0.5)/30)) % 12) + 12) % 12;
      else m5rMinTick = Math.round(clockDeg/M5R_MIN_STEP[lvl]) % Math.round(360/M5R_MIN_STEP[lvl]);
      drawSettableClock();
    });
    function endDrag(){ m5rDragWhich = null; }
    svg.addEventListener('pointerup', endDrag);
    svg.addEventListener('pointercancel', endDrag);
  })();

  var m5rFlow = makeQuestionFlow({ feedback:'m5r-feedback', tries:MANIP_TRIES });
  document.getElementById('m5r-new').addEventListener('click', function(){ m5rFlow.skip(); });
  document.getElementById('m5r-check').addEventListener('click', function(){
    var lvl = m5Target.level;
    var hourOk = m5rHourTick === (m5Target.hour % 12);
    var minOk = m5rMinutes() === m5Target.minute;
    var total = m5Target.hour*60 + m5Target.minute;
    // En Difficile, l'heure demandée est en 24 h : on rappelle comment elle se lit sur le cadran.
    var readAs = (lvl===2 && (m5Target.hour===0 || m5Target.hour>=13))
      ? 'Sur le cadran, ' + minutesToLabel24(total) + ' se lit ' + minutesToClockLabel(total) + '.' : '';
    var explain = 'La petite aiguille montre les heures, la grande aiguille montre les minutes.';
    if(hourOk && minOk){
      m5rFlow.answer(true, { success:'Bravo, les aiguilles sont bien placées !', detail:readAs, explain:explain });
      return;
    }
    var hint = (!hourOk && !minOk) ? 'Les deux aiguilles ne sont pas encore au bon endroit.'
      : (!hourOk ? 'La petite aiguille (les heures) n\'est pas encore bien placée. ' + hourHandHint(m5Target.hour, m5Target.minute)
      : 'La grande aiguille (les minutes) n\'est pas encore bien placée.');
    var state = m5rFlow.answer(false, { hint:hint + (readAs ? ' ' + readAs : ''), solution:'Voici les aiguilles bien placées.' + (readAs ? ' ' + readAs : ''), explain:explain });
    if(state==='failed'){
      // on montre la bonne position des deux aiguilles
      m5rHourTick = m5Target.hour % 12;
      m5rMinTick = Math.round(m5Target.minute * 6 / M5R_MIN_STEP[lvl]) % Math.round(360 / M5R_MIN_STEP[lvl]);
      drawSettableClock();
    }
  });

  // ===================== Lire l'heure =====================
  function angleToXY(deg,len,cx,cy){ var rad=deg*Math.PI/180; return [(cx||100)+len*Math.cos(rad), (cy||100)+len*Math.sin(rad)]; }
  function drawClockFace(svg, hourTip, minTip){
    svg.appendChild(el('circle',{cx:100,cy:100,r:70, fill:'var(--surface)', stroke:'var(--accent)','stroke-width':4}));
    for(var i=0;i<12;i++){
      var a=(i*30-90)*Math.PI/180;
      svg.appendChild(el('line',{x1:100+60*Math.cos(a),y1:100+60*Math.sin(a),x2:100+68*Math.cos(a),y2:100+68*Math.sin(a), stroke:'var(--text)','stroke-width':2}));
    }
    svg.appendChild(el('line',{x1:100,y1:100,x2:hourTip[0],y2:hourTip[1], stroke:'var(--text)','stroke-width':5,'stroke-linecap':'round'}));
    svg.appendChild(el('line',{x1:100,y1:100,x2:minTip[0],y2:minTip[1], stroke:'var(--accent)','stroke-width':3,'stroke-linecap':'round'}));
    svg.appendChild(el('circle',{cx:100,cy:100,r:4, fill:'var(--text)'}));
  }

  // Précision de lecture d'heure selon le niveau : Facile = heure pile ou
  // demie, Moyen = + les quarts d'heure, Difficile = n'importe quelle
  // tranche de 5 minutes.
  function minutesToClockLabel(totalMin){
    var h = Math.floor(totalMin/60) % 12; if(h===0) h = 12;
    var m = totalMin % 60;
    return m===0 ? (h+' h') : (h+' h '+(m<10?'0'+m:m));
  }
  // Explication adaptée à l'horloge affichée : où est la grande aiguille
  // (minutes), où est la petite (heures), et donc quelle heure il est.
  function clockExplain(hour, minuteVal, label){
    var big = minuteVal/5; if(big===0) big = 12;
    var bigTxt;
    if(minuteVal===0) bigTxt = 'La grande aiguille (les minutes) est sur le 12 : c\'est une heure pile.';
    else if(minuteVal===30) bigTxt = 'La grande aiguille (les minutes) est sur le 6 : c\'est la demi-heure, 30 minutes.';
    else if(minuteVal===15) bigTxt = 'La grande aiguille (les minutes) est sur le 3 : c\'est le quart, 15 minutes.';
    else if(minuteVal===45) bigTxt = 'La grande aiguille (les minutes) est sur le 9 : 45 minutes.';
    else bigTxt = 'La grande aiguille (les minutes) est sur le ' + big + ' : on compte de 5 en 5, ' + big + ' × 5 = ' + minuteVal + ' minutes.';
    var h12 = hour % 12; if(h12===0) h12 = 12;
    var smallTxt = minuteVal===0
      ? 'La petite aiguille (les heures) est pile sur le ' + h12 + '.'
      : 'La petite aiguille (les heures) a dépassé le ' + h12 + ' sans atteindre le ' + ((h12%12)+1) + '.';
    return bigTxt + ' ' + smallTxt + ' Il est donc ' + label + '.';
  }
  // ---- Difficile : les heures de 0 h 00 à 23 h 59 (format 24 h) ----
  // L'horloge ronde ne dit pas s'il est le matin ou l'après-midi : la question
  // donne donc le moment de la journée, et la bonne réponse est en heures de 0 à 23.
  function periodOfDay(h){
    if(h < 6)  return { phrase:'cette nuit', emoji:'🌙' };
    if(h < 12) return { phrase:'le matin', emoji:'🌅' };
    if(h < 18) return { phrase:'l\'après-midi', emoji:'☀️' };
    return { phrase:'le soir', emoji:'🌆' };
  }
  function minutesToLabel24(totalMin){
    var h = Math.floor(totalMin/60) % 24;
    var m = totalMin % 60;
    return m===0 ? (h+' h') : (h+' h '+(m<10?'0'+m:m));
  }
  // ---- Durées : calculer une heure de fin, une durée, une heure de début ----
  function fmtDuree(min){
    var h = Math.floor(min/60), m = min % 60;
    if(h===0) return m + ' min';
    return m===0 ? (h + ' h') : (h + ' h ' + (m<10 ? '0'+m : m));
  }
  var DUREE_SCENES = [
    { icon:'🎬', start:'Le film commence', end:'Il se termine', what:'Le film' },
    { icon:'⚽', start:'Le match commence', end:'Il se termine', what:'Le match' },
    { icon:'🍰', start:'Le gâteau entre au four', end:'Il en sort', what:'La cuisson' },
    { icon:'🎨', start:'L\'atelier de peinture commence', end:'Il se termine', what:'L\'atelier' },
    { icon:'🚌', start:'Le bus part', end:'Il arrive', what:'Le voyage en bus' },
    { icon:'📚', start:'La lecture commence', end:'Elle se termine', what:'La lecture' },
    { icon:'🏊', start:'La séance de piscine commence', end:'Elle se termine', what:'La séance' }
  ];
  // ---- Durées : fiche (voir plus bas) ----

  /* ===================== FICHES D'ACTIVITÉS : heure et calendrier (moteur : gabarits.js, chargé avant ce fichier) =====================
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

  BANKS.DUREE_ICON = DUREE_SCENES.map(function(d){ return d.icon; });
  BANKS.DUREE_START = DUREE_SCENES.map(function(d){ return d.start; });
  BANKS.DUREE_WHAT = DUREE_SCENES.map(function(d){ return d.what; });
  BANKS.DUREE_N = DUREE_SCENES.length;
  TEMPLATE_FNS.dureeT = minutesToLabel24;
  TEMPLATE_FNS.dureeFmt = fmtDuree;
  // trois mauvaises réponses : candidats filtrés selon le niveau (heures pleines en Facile, quarts d'heure en Moyen), libellés différents de la bonne
  TEMPLATE_FNS.dureeWrong = function(correct, cands, level, kind){
    var fmt = kind === 'D' ? fmtDuree : minutesToLabel24, good = fmt(correct), seen = {}, wrong = [];
    if(level === 0) cands = cands.filter(function(v){ return v >= 60 && v % 60 === 0; });
    else if(level === 1) cands = cands.filter(function(v){ return v % 15 === 0; });
    seen[good] = true;
    shuffle(cands.slice()).forEach(function(v){ var l = fmt(v); if(v > 0 && !seen[l] && wrong.length < 3){ seen[l] = true; wrong.push(l); } });
    return wrong;
  };
  TEMPLATE_FNS.minList = function(a){ return a.map(function(v){ return v + ' minutes'; }); };
  TEMPLATE_FNS.dureeRetenue = function(s, d, level){ return level >= 1 && s % 60 + d % 60 >= 60 ? " (On passe à l'heure suivante quand on dépasse 60 minutes.)" : ''; };
  var DUREE_EXPL_END = "{dureeT(s)} + {dureeFmt(d)} = {dureeT(e)}.{dureeRetenue(s,d,level)}";
  var DUREE_VARS = { i:{int:[0,'DUREE_N-1']}, h:{int:['hMin','hMax']}, m:{pick:'mins'}, d:{pick:'durs'}, s:'h*60+m', e:'s+d' };
  function dureeVars(extra){ var v = {}, k; for(k in DUREE_VARS) v[k] = DUREE_VARS[k]; for(k in extra) v[k] = extra[k]; return v; }
  registerTemplateType({ id:'duree', domain:'temps', label:'Durées', longLabel:'Durées : heure de fin, temps écoulé (QCM)', defaultLevels:[0,1,2], tag:'Durées',
    levels:[
      { hMin:1, hMax:9,  mins:[0], durs:[60,120,180] },
      { hMin:6, hMax:19, mins:[0,15,30,45], durs:[30,45,60,90,120] },
      { hMin:6, hMax:19, mins:[0,5,10,15,20,25,30,35,40,45,50,55], durs:[35,40,50,75,80,95,105,125,140,165] }
    ],
    forms:[
      { w:'level==0 ? 2 : 1', vars:dureeVars({ ans:'dureeT(e)', cands:'[e-60,e+60,e+120,e-120,e+30,e-30,e+15,e-15,e+10,e-10,s+d*2,s-d]' }), answer:'ans', wrong:"dureeWrong(e, cands, level, 'T')",
        question:'{at(DUREE_START,i)} à {dureeT(s)} et cela dure {dureeFmt(d)}. À quelle heure est-ce fini ?', sub:"Ajoute la durée à l'heure de début.",
        explain:DUREE_EXPL_END, scene:{ type:'emoji', icon:'at(DUREE_ICON,i)', caption:'{dureeT(s)} + {dureeFmt(d)}' } },
      { vars:dureeVars({ ans:'dureeFmt(d)', cands:'[d+30,d-30,d+60,d-60,d+120,d+180,d+15,d-15,d+10,d-10,d+5,d-5]' }), answer:'ans', wrong:"dureeWrong(d, cands, level, 'D')",
        question:'{at(DUREE_WHAT,i)} commence à {dureeT(s)} et finit à {dureeT(e)}. Combien de temps cela dure-t-il ?', sub:'Compte le temps qui passe entre le début et la fin.',
        explain:"De {dureeT(s)} à {dureeT(e)}, il s'écoule {dureeFmt(d)}.", scene:{ type:'emoji', icon:'at(DUREE_ICON,i)', caption:'{dureeT(s)} → {dureeT(e)}' } },
      { levels:[1,2], vars:dureeVars({ ans:'dureeT(s)', cands:'[s-60,s+60,s-120,s+120,s+30,s-30,s+15,s-15,e+d,s+10,s-10]' }), answer:'ans', wrong:"dureeWrong(s, cands, level, 'T')",
        question:'{at(DUREE_WHAT,i)} dure {dureeFmt(d)} et finit à {dureeT(e)}. À quelle heure cela a-t-il commencé ?', sub:"Retire la durée à l'heure de fin.",
        explain:"On recule de {dureeFmt(d)} depuis {dureeT(e)} : {dureeT(e)} - {dureeFmt(d)} = {dureeT(s)}.", scene:{ type:'emoji', icon:'at(DUREE_ICON,i)', caption:'{dureeT(e)} - {dureeFmt(d)}' } },
      { levels:[2], vars:{ hh:{int:[1,3]}, mm:{pick:[15,30,45]}, t:'hh*60+mm', ans:"t+' minutes'" }, answer:'ans',
        wrong:"minList(others([hh*100+mm, hh*10+mm, t+30, t-30, t+15, (hh+1)*60+mm, hh*60], t, 3))",
        question:'{hh} h {mm} min, ça fait combien de minutes en tout ?', sub:'Une heure, c\'est 60 minutes.',
        explain:'1 heure = 60 minutes. {hh} h = {hh*60} min, puis on ajoute {mm} min : {t} minutes.', scene:{ type:'emoji', icon:"'⏱️'", caption:'' } }
    ],
    note:"On calcule avec le temps : trouver l'heure de fin, la durée, ou l'heure de début. Facile : heures pleines (ex. 3 h + 2 h). Moyen : demi-heures et quarts d'heure. Difficile : minutes quelconques, passage à l'heure suivante, et conversion heures → minutes." });
