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
    var fb = document.getElementById('m5-feedback'); fb.className='feedback'; fb.innerHTML='';
  }
  function checkM5Lire(choice, btn){
    var buttons = document.querySelectorAll('#m5-choices .choice-btn');
    buttons.forEach(function(b){ b.disabled = true; });
    var fb = document.getElementById('m5-feedback');
    if(choice.ok){
      btn.classList.add('correct');
      fb.className = 'feedback tappable good show';
      fb.innerHTML = '<div>✔ Bravo, c\'est la bonne heure !</div><div class="explain-line">'+m5Current.explain+'</div>';
      addStar(1);
      setCoachReaction('good');
    } else {
      btn.classList.add('wrong');
      var okLabel = m5Current.choices.filter(function(c){return c.ok;})[0].label;
      buttons.forEach(function(b){ if(b.textContent.toLowerCase()===okLabel.toLowerCase()) b.classList.add('correct'); });
      fb.className = 'feedback tappable bad show';
      fb.innerHTML = '<div>✘ Pas tout à fait, regarde encore.</div><div class="explain-line">'+m5Current.explain+'</div>';
      setCoachReaction('bad');
    }
    playSound(choice.ok?'good':'bad');
    celebrate(choice.ok?'good':'bad', fb);
    onPracticeAnswered(choice.ok);
  }
  document.getElementById('m5-next').addEventListener('click', nextPracticeQuestion);

  // ---- Mode "Régler l'heure" (glisser les aiguilles au doigt) ----
  // Les deux aiguilles se règlent indépendamment, chacune se magnétise sur
  // les positions valides pour le CE1 : heure pile ou demi-heure (24 crans
  // de 15° pour la petite aiguille, 2 positions pour la grande).
  var m5Target = { hour:3, half:false };
  var m5rHourTick = 0, m5rMinTick = 0, m5rDragWhich = null;

  function m5rHourTip(){ return angleToXY(m5rHourTick*15 - 90, 42); }
  function m5rMinTip(){ return angleToXY(m5rMinTick*180 - 90, 62); }

  function drawSettableClock(){
    var svg = document.getElementById('m5ClockSvg');
    svg.setAttribute('viewBox','0 0 200 200');
    svg.innerHTML = "";
    var ht = m5rHourTip(), mt = m5rMinTip();
    drawClockFace(svg, ht, mt);
    // Poignées invisibles, plus grosses que le trait, pour un glisser confortable au doigt.
    var hHandle = el('circle',{cx:ht[0],cy:ht[1],r:20,fill:'rgba(0,0,0,0.001)'});
    hHandle.setAttribute('data-hand','hour');
    svg.appendChild(hHandle);
    var mHandle = el('circle',{cx:mt[0],cy:mt[1],r:20,fill:'rgba(0,0,0,0.001)'});
    mHandle.setAttribute('data-hand','minute');
    svg.appendChild(mHandle);
  }

  function m5rGenTarget(){
    m5Target.hour = 1+randInt(0,11);
    m5Target.half = Math.random()<0.5;
    m5rHourTick = 0; m5rMinTick = 0; // les aiguilles repartent de midi bien net
    document.getElementById('m5-target').textContent = m5Target.hour + ' h' + (m5Target.half ? ' 30' : '');
    drawSettableClock();
    var fb = document.getElementById('m5r-feedback'); fb.className='feedback'; fb.innerHTML='';
  }

  (function initClockDrag(){
    var svg = document.getElementById('m5ClockSvg');
    svg.style.touchAction = 'none';
    svg.addEventListener('pointerdown', function(evt){
      var which = evt.target && evt.target.getAttribute && evt.target.getAttribute('data-hand');
      if(!which) return;
      m5rDragWhich = which;
      svg.setPointerCapture(evt.pointerId);
    });
    svg.addEventListener('pointermove', function(evt){
      if(!m5rDragWhich) return;
      var p = svgPointFromEvent(svg, evt);
      var raw = Math.atan2(p.y-100, p.x-100)*180/Math.PI;
      var clockDeg = ((raw+90)%360+360)%360;
      if(m5rDragWhich==='hour') m5rHourTick = Math.round(clockDeg/15) % 24;
      else m5rMinTick = Math.round(clockDeg/180) % 2;
      drawSettableClock();
    });
    function endDrag(){ m5rDragWhich = null; }
    svg.addEventListener('pointerup', endDrag);
    svg.addEventListener('pointercancel', endDrag);
  })();

  document.getElementById('m5r-new').addEventListener('click', nextPracticeQuestion);
  document.getElementById('m5r-check').addEventListener('click', function(){
    var targetTick = (m5Target.hour % 12) * 2 + (m5Target.half ? 1 : 0);
    var hourOk = m5rHourTick === targetTick;
    var minOk = m5rMinTick === (m5Target.half ? 1 : 0);
    var fb = document.getElementById('m5r-feedback');
    if(hourOk && minOk){
      fb.className = 'feedback good show';
      fb.innerHTML = '<div>✔ Bravo, les aiguilles sont bien placées !</div>';
      addStar(1);
      setCoachReaction('good');
    } else {
      fb.className = 'feedback bad show';
      var msg = (!hourOk && !minOk) ? 'Les deux aiguilles ne sont pas encore au bon endroit.'
        : (!hourOk ? 'La petite aiguille (les heures) n\'est pas encore bien placée.'
        : 'La grande aiguille (les minutes) n\'est pas encore bien placée.');
      fb.innerHTML = '<div>✘ ' + msg + '</div>';
      setCoachReaction('bad');
    }
    playSound(hourOk && minOk ? 'good' : 'bad');
    celebrate(hourOk && minOk ? 'good' : 'bad', fb);
  });

  enableTapToContinue('m5-feedback', nextPracticeQuestion);

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
    var minuteVal = level===0 ? (Math.random()<0.5?0:30) : pick((function(){
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

  // ---- Déclaration du type de Quizz « Lire l'heure » ----
  registerQuizType({ id:'heure', label:'Lire l\'heure', longLabel:'Lire l\'heure (QCM)', defaultLevels:[0,1,2],
    randomNote:'L\'heure affichée est tirée au hasard. C\'est le NIVEAU qui fixe la précision autorisée : à l\'heure pile/demie en Facile, + quarts d\'heure en Moyen, en Difficile toutes les 5 min ET les heures de 0 h à 23 h (l\'énoncé donne le moment de la journée : nuit, matin, après-midi, soir ; le piège : oublier d\'ajouter 12 h l\'après-midi).',
    generate:function(level){ return genHeureQuestion('m4Svg', level); } });
