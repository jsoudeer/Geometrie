  /* ===================== THÈME HORLOGE =====================
     Lire l'heure, Régler l'heure, et la question de Quizz « Lire l'heure ».
  */

  /* ===================== MODULE 5 : HORLOGE (à part entière) =====================
     Deux modes : "Lire l'heure" (QCM, réutilise genHeureQuestion) et
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
    m5Current = genHeureQuestion('m5Svg', globalLevel);
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
  function genHeure24Question(svgId){
    var hour = randInt(0,23);
    var minuteVal = pick([0,5,10,15,20,25,30,35,40,45,50,55]);
    var total = hour*60 + minuteVal;
    var period = periodOfDay(hour);
    var hourTip = angleToXY(((hour%12) + minuteVal/60) * 30 - 90, 42);
    var minTip = angleToXY((minuteVal/60)*360 - 90, 62);
    var correctLabel = minutesToLabel24(total);
    // Fausses réponses : le piège classique (oublier d'ajouter ou de retirer 12 h)
    // et des heures voisines à 5, 10 ou 15 minutes près.
    var seen = {}; seen[correctLabel] = true;
    var shifted = minutesToLabel24((total + 720) % 1440);
    seen[shifted] = true;
    var near = [];
    [-3,-2,-1,1,2,3].forEach(function(k){
      var label = minutesToLabel24(((total + k*5) % 1440 + 1440) % 1440);
      if(!seen[label]){ seen[label] = true; near.push(label); }
    });
    var wrong = [shifted].concat(shuffle(near).slice(0,2));
    var explain = clockExplain(hour, minuteVal, minutesToClockLabel(total) + ' sur l\'horloge');
    if(hour===0) explain += ' Juste après minuit, l\'horloge montre 12 mais on dit 0 h : il est ' + correctLabel + '.';
    else if(hour >= 13) explain += ' Comme c\'est ' + period.phrase + ', on ajoute 12 h : ' + (hour-12) + ' + 12 = ' + hour + '. Il est donc ' + correctLabel + '.';
    else explain += ' Comme c\'est ' + period.phrase + ', l\'heure ne change pas : on garde ' + correctLabel + '.';
    return {
      tag:'Lire l\'heure',
      question:'C\'est ' + period.phrase + ' ' + period.emoji + '. Quelle heure indique cette horloge ?',
      sub:'Les heures vont de 0 h à 23 h (l\'après-midi : 13 h, 14 h, 15 h…). Regarde bien les deux aiguilles.',
      explain: explain,
      draw:function(){
        var svg=document.getElementById(svgId); svg.setAttribute('viewBox','0 0 200 200'); svg.innerHTML="";
        drawClockFace(svg, hourTip, minTip);
      },
      cols3:false,
      choices: shuffle([correctLabel].concat(wrong)).map(function(l){ return { label:l, ok:l===correctLabel }; })
    };
  }
  function genHeureQuestion(svgId, level){
    svgId = svgId || 'm4Svg';
    level = level || 0;
    if(level >= 2) return genHeure24Question(svgId);
    var step = level===0 ? 30 : 15;
    var hour = 1+randInt(0,11);
    var minuteVal = level===0 ? (rnd()<0.5?0:30) : pick((function(){
      var opts=[]; for(var m=0;m<60;m+=step) opts.push(m); return opts;
    })());
    var hourAngleDeg = ((hour%12) + minuteVal/60) * 30 - 90;
    var minuteAngleDeg = (minuteVal/60)*360 - 90;
    var hourTip = angleToXY(hourAngleDeg, 42);
    var minTip = angleToXY(minuteAngleDeg, 62);
    var totalMinCorrect = (hour%12)*60 + minuteVal;
    var correctLabel = minutesToClockLabel(totalMinCorrect);
    var pool = [], seen = {}; seen[correctLabel]=true;
    [-3,-2,-1,1,2,3].forEach(function(k){
      var cand = ((totalMinCorrect + k*step) % 720 + 720) % 720;
      var label = minutesToClockLabel(cand);
      if(!seen[label]){ seen[label]=true; pool.push(label); }
    });
    var choiceLabels = shuffle([correctLabel].concat(shuffle(pool).slice(0,3)));
    return {
      tag:'Lire l\'heure',
      question:'Quelle heure indique cette horloge ?',
      sub:'Regarde bien la petite aiguille (les heures) et la grande (les minutes).',
      explain: clockExplain(hour, minuteVal, correctLabel),
      draw:function(){
        var svg=document.getElementById(svgId); svg.setAttribute('viewBox','0 0 200 200'); svg.innerHTML="";
        drawClockFace(svg, hourTip, minTip);
      },
      cols3:false,
      choices: choiceLabels.map(function(l){ return { label:l, ok:l===correctLabel }; })
    };
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
  function labelChoices(correctMin, fmt, candidates){
    var correct = fmt(correctMin), seen = {}, wrong = [];
    seen[correct] = true;
    shuffle(candidates.slice()).forEach(function(v){
      var l = fmt(v);
      if(v > 0 && !seen[l] && wrong.length < 3){ seen[l] = true; wrong.push(l); }
    });
    return shuffle([correct].concat(wrong)).map(function(l){ return { label:l, ok:l===correct }; });
  }
  function genDureeQuestion(level){
    var sc = pick(DUREE_SCENES);
    var kinds = level===0 ? ['end','end','dur'] : level===1 ? ['end','dur','start'] : ['end','dur','start','conv'];
    var kind = pick(kinds);
    var stepMin = level===0 ? 60 : level===1 ? 15 : 5;
    var startMin, dur, endMin, question, explain, fmt, correctMin, cands, sub, drawTxt;

    if(kind==='conv'){
      var hh = randInt(1,3), mm = pick([15,30,45]);
      var totalMin = hh*60 + mm;
      question = hh + ' h ' + mm + ' min, ça fait combien de minutes en tout ?';
      explain = '1 heure = 60 minutes. ' + hh + ' h = ' + (hh*60) + ' min, puis on ajoute ' + mm + ' min : ' + totalMin + ' minutes.';
      var okLabel = totalMin + ' minutes';
      var cw = [hh*100+mm, hh*10+mm, totalMin+30, totalMin-30, totalMin+15, (hh+1)*60+mm, hh*60];
      var seen = {}; seen[okLabel] = true; var wrong = [];
      shuffle(cw).forEach(function(v){ var l = v + ' minutes'; if(v>0 && !seen[l] && wrong.length<3){ seen[l]=true; wrong.push(l); } });
      return {
        tag:'Durées', question:question, sub:'Une heure, c\'est 60 minutes.', explain:explain,
        draw:function(){
          var svg=document.getElementById('m4Svg'); svg.setAttribute('viewBox','0 0 200 200'); svg.innerHTML="";
          svg.appendChild(svgText(100,120,64,'⏱️'));
        },
        cols3:false,
        choices: shuffle([okLabel].concat(wrong)).map(function(l){ return { label:l, ok:l===okLabel }; })
      };
    }
    // heures de départ : 12 h max en Facile, sinon la journée entière
    var hMin = level===0 ? 1 : 6, hMax = level===0 ? 9 : 19;
    startMin = randInt(hMin, hMax) * 60 + (level===0 ? 0 : pick(level===1 ? [0,15,30,45] : [0,5,10,15,20,25,30,35,40,45,50,55]));
    var durChoices = level===0 ? [60,120,180] : level===1 ? [30,45,60,90,120] : [35,40,50,75,80,95,105,125,140,165];
    dur = pick(durChoices);
    endMin = startMin + dur;
    var T = minutesToLabel24;
    if(kind==='end'){
      question = sc.start + ' à ' + T(startMin) + ' et cela dure ' + fmtDuree(dur) + '. À quelle heure est-ce fini ?';
      explain = T(startMin) + ' + ' + fmtDuree(dur) + ' = ' + T(endMin) + '.';
      if(level>=1 && (startMin%60) + (dur%60) >= 60) explain += ' (On passe à l\'heure suivante quand on dépasse 60 minutes.)';
      correctMin = endMin; fmt = T;
      cands = [endMin-60, endMin+60, endMin+120, endMin-120, endMin+30, endMin-30, endMin+15, endMin-15, endMin+10, endMin-10, startMin+dur*2, startMin-dur];
      sub = 'Ajoute la durée à l\'heure de début.';
      drawTxt = T(startMin) + ' + ' + fmtDuree(dur);
    } else if(kind==='dur'){
      question = sc.what + ' commence à ' + T(startMin) + ' et finit à ' + T(endMin) + '. Combien de temps cela dure-t-il ?';
      explain = 'De ' + T(startMin) + ' à ' + T(endMin) + ', il s\'écoule ' + fmtDuree(dur) + '.';
      correctMin = dur; fmt = fmtDuree;
      cands = [dur+30, dur-30, dur+60, dur-60, dur+120, dur+180, dur+15, dur-15, dur+10, dur-10, dur+5, dur-5];
      sub = 'Compte le temps qui passe entre le début et la fin.';
      drawTxt = T(startMin) + ' → ' + T(endMin);
    } else {
      question = sc.what + ' dure ' + fmtDuree(dur) + ' et finit à ' + T(endMin) + '. À quelle heure cela a-t-il commencé ?';
      explain = 'On recule de ' + fmtDuree(dur) + ' depuis ' + T(endMin) + ' : ' + T(endMin) + ' - ' + fmtDuree(dur) + ' = ' + T(startMin) + '.';
      correctMin = startMin; fmt = T;
      cands = [startMin-60, startMin+60, startMin-120, startMin+120, startMin+30, startMin-30, startMin+15, startMin-15, endMin+dur, startMin+10, startMin-10];
      sub = 'Retire la durée à l\'heure de fin.';
      drawTxt = T(endMin) + ' - ' + fmtDuree(dur);
    }
    if(level===0) cands = cands.filter(function(v){ return v>=60 && v%60===0; });
    else if(level===1) cands = cands.filter(function(v){ return v%15===0; });
    return {
      tag:'Durées', question:question, sub:sub, explain:explain,
      draw:function(){
        var svg=document.getElementById('m4Svg'); svg.setAttribute('viewBox','0 0 200 200'); svg.innerHTML="";
        svg.appendChild(svgText(100,95,54,sc.icon));
        svg.appendChild(svgText(100,150,24,drawTxt));
      },
      cols3:false,
      choices: labelChoices(correctMin, fmt, cands)
    };
  }

  // ---- Calendrier : jours de la semaine et mois ----
  var JOURS = ['lundi','mardi','mercredi','jeudi','vendredi','samedi','dimanche'];
  var MOIS = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
  function textChoices(correct, pool){
    var others = shuffle(pool.filter(function(x){ return x!==correct; })).slice(0,3);
    return shuffle([correct].concat(others)).map(function(l){ return { label:String(l), ok:l===correct }; });
  }
  function genCalendrierQuestion(level){
    var kinds = level===0 ? ['jourApres','jourAvant','semaine'] : level===1 ? ['jourApres','jourAvant','moisApres','moisAvant','annee'] : ['decalage','decalage','moisApres','moisAvant','entreJours'];
    var kind = pick(kinds), q, explain, correct, pool, sub = 'Réfléchis à l\'ordre des jours ou des mois.';
    var i = randInt(0,6), m = randInt(0,11);
    if(kind==='jourApres'){ correct = JOURS[(i+1)%7]; pool = JOURS; q = 'Quel jour vient juste après ' + JOURS[i] + ' ?'; explain = 'Après ' + JOURS[i] + ' vient ' + correct + '.'; }
    else if(kind==='jourAvant'){ correct = JOURS[(i+6)%7]; pool = JOURS; q = 'Quel jour vient juste avant ' + JOURS[i] + ' ?'; explain = 'Avant ' + JOURS[i] + ' il y a ' + correct + '.'; }
    else if(kind==='semaine'){ correct = '7 jours'; pool = ['5 jours','6 jours','7 jours','8 jours','10 jours']; q = 'Combien y a-t-il de jours dans une semaine ?'; explain = 'La semaine a 7 jours : lundi, mardi, mercredi, jeudi, vendredi, samedi, dimanche.'; }
    else if(kind==='annee'){ correct = '12 mois'; pool = ['10 mois','11 mois','12 mois','13 mois','52 mois']; q = 'Combien y a-t-il de mois dans une année ?'; explain = 'L\'année a 12 mois, de janvier à décembre.'; }
    else if(kind==='moisApres'){ correct = MOIS[(m+1)%12]; pool = MOIS; q = 'Quel mois vient juste après ' + MOIS[m] + ' ?'; explain = 'Après ' + MOIS[m] + ' vient ' + correct + '.'; }
    else if(kind==='moisAvant'){ correct = MOIS[(m+11)%12]; pool = MOIS; q = 'Quel mois vient juste avant ' + MOIS[m] + ' ?'; explain = 'Avant ' + MOIS[m] + ' il y a ' + correct + '.'; }
    else if(kind==='entreJours'){
      var a = randInt(0,6), gap = randInt(2,5), b = (a+gap)%7;
      correct = gap + ' jours'; pool = [2,3,4,5,6].map(function(k){ return k + ' jours'; });
      q = 'Combien de jours passent de ' + JOURS[a] + ' à ' + JOURS[b] + ' ?';
      explain = 'De ' + JOURS[a] + ' à ' + JOURS[b] + ', on avance de ' + gap + ' jours.';
      sub = 'Compte les jours qui passent, un par un.';
    }
    else { // decalage : dans N jours / il y a N jours
      var n = randInt(2,6), fwd = rnd()<0.6;
      correct = JOURS[((i + (fwd ? n : -n)) % 7 + 7) % 7]; pool = JOURS;
      q = 'Aujourd\'hui, c\'est ' + JOURS[i] + '. Quel jour ' + (fwd ? 'sera-t-on dans ' + n + ' jours ?' : 'était-on il y a ' + n + ' jours ?');
      explain = 'À partir de ' + JOURS[i] + ', on ' + (fwd ? 'avance' : 'recule') + ' de ' + n + ' jours : on arrive à ' + correct + '.';
      sub = 'Compte les jours un par un, en ' + (fwd ? 'avançant' : 'reculant') + '.';
    }
    return {
      tag:'Calendrier', question:q, sub:sub, explain:explain,
      draw:function(){
        var svg=document.getElementById('m4Svg'); svg.setAttribute('viewBox','0 0 200 200'); svg.innerHTML="";
        svg.appendChild(svgText(100,125,72,'📅'));
      },
      cols3:false, choices: textChoices(correct, pool)
    };
  }

  // ---- Choisir la bonne horloge parmi 4 dessins ----
  function genHorlogeChoixQuestion(level){
    var steps = level===0 ? [0,30] : level===1 ? [0,15,30,45] : [0,5,10,15,20,25,30,35,40,45,50,55];
    var h = randInt(1,12), m = pick(steps);
    function key(hh, mm){ return ((hh%12)*60 + mm) + ''; }
    var options = [{ h:h, m:m, ok:true }], used = {}; used[key(h,m)] = true;
    function add(hh, mm){
      hh = ((hh-1+12)%12)+1; mm = ((mm%60)+60)%60;
      if(used[key(hh,mm)]) return false;
      used[key(hh,mm)] = true; options.push({ h:hh, m:mm, ok:false }); return true;
    }
    // pièges classiques : aiguilles échangées, heure d'à côté, minutes d'à côté
    var swapH = m===0 ? 12 : m/5;
    if(m % 5 === 0) add(swapH, h*5 % 60);
    add(h+1, m); add(h-1, m);
    var tries = 0;
    while(options.length<4 && tries++<50){ add(h, m + pick(level===0 ? [30] : [15,30,45,5,10])); if(options.length<4) add(h + pick([-2,2,3]), m); }
    options = options.slice(0,4);
    var label = m===0 ? (h + ' h') : (h + ' h ' + (m<10 ? '0'+m : m));
    return {
      tag:'Lire l\'heure', question:'Quelle horloge indique ' + label + ' ?', sub:'La petite aiguille montre l\'heure, la grande aiguille les minutes.',
      explain:clockExplain(h, m, label + ' se lit : ' + minutesToClockLabel(h*60+m)),
      draw:function(){
        var svg=document.getElementById('m4Svg'); svg.setAttribute('viewBox','0 0 200 200'); svg.innerHTML="";
        svg.appendChild(svgText(100,120,54,label));
      },
      cols3:false,
      choices: shuffle(options).map(function(o, i){
        return { label:'Horloge ' + (i+1), ok:o.ok, viewBox:'0 0 200 200', draw:function(svg){
          drawClockFace(svg, angleToXY(((o.h%12) + o.m/60) * 30 - 90, 42), angleToXY((o.m/60)*360 - 90, 62));
        } };
      })
    };
  }

  // ---- Déclaration du type de Quizz « Lire l'heure » ----
  registerQuizType({ id:'heure', domain:'temps', label:'Lire l\'heure', longLabel:'Lire l\'heure (QCM)', defaultLevels:[0,1,2],
    randomNote:'L\'heure affichée est tirée au hasard. C\'est le NIVEAU qui fixe la précision autorisée : à l\'heure pile/demie en Facile, + quarts d\'heure en Moyen, en Difficile toutes les 5 min ET les heures de 0 h à 23 h (l\'énoncé donne le moment de la journée : nuit, matin, après-midi, soir ; le piège : oublier d\'ajouter 12 h l\'après-midi).',
    generate:function(level){ return genHeureQuestion('m4Svg', level); } });
  registerQuizType({ id:'duree', domain:'temps', label:'Durées', longLabel:'Durées : heure de fin, temps écoulé (QCM)', defaultLevels:[0,1,2],
    randomNote:'On calcule avec le temps : trouver l\'heure de fin, la durée, ou l\'heure de début. Facile : heures pleines (ex. 3 h + 2 h). Moyen : demi-heures et quarts d\'heure. Difficile : minutes quelconques, passage à l\'heure suivante, et conversion heures → minutes.',
    generate:function(level){ return genDureeQuestion(level); } });
  registerQuizType({ id:'calendrier', domain:'temps', label:'Calendrier', longLabel:'Calendrier (jours, mois)', defaultLevels:[0,1,2],
    randomNote:'Facile : jour d\'avant / d\'après, jours dans la semaine. Moyen : + mois d\'avant / d\'après, mois dans l\'année. Difficile : « dans 4 jours / il y a 3 jours », nombre de jours entre deux jours, mois.',
    generate:genCalendrierQuestion });
  registerQuizType({ id:'horlogeChoix', domain:'temps', label:'Choisir l\'horloge (visuel)', longLabel:'Choisir la bonne horloge (dessins)', defaultLevels:[0,1,2],
    randomNote:'L\'heure est écrite en chiffres ; on choisit parmi 4 horloges dessinées. Les mauvaises réponses sont des pièges : aiguilles échangées, heure d\'à côté, minutes d\'à côté. Facile : heures pile et demies ; Moyen : + quarts ; Difficile : toutes les 5 minutes.',
    generate:genHorlogeChoixQuestion });
