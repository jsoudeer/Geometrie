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

