  /* ===================== MODULE 1 : MESURER =====================
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

  function randInt(a,b){ return Math.floor(rand(a, b+1)); }

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
    var fb = document.getElementById('m1-feedback');
    fb.className = 'feedback'; fb.innerHTML = '';
  }

  function measureExplain(){
    if(m1SegStart===0){
      return 'Compte le nombre de carreaux entre le début et la fin du trait.';
    }
    return 'Le trait va de ' + fmtNum(m1SegStart) + ' à ' + fmtNum(m1SegEnd) + ' : '
      + fmtNum(m1SegEnd) + ' − ' + fmtNum(m1SegStart) + ' = ' + fmtNum(currentLen) + ' cm.';
  }

  function checkMeasure(v, btn){
    var buttons = document.querySelectorAll('#m1-choices .choice-btn');
    buttons.forEach(function(b){ b.disabled = true; });
    var fb = document.getElementById('m1-feedback');
    var ok = Math.abs(v-currentLen)<0.001;
    if(ok){
      btn.classList.add('correct');
      fb.className = 'feedback tappable good show';
      fb.innerHTML = '<div>✔ Bravo, ce segment mesure bien ' + fmtNum(currentLen) + ' cm !</div><div class="explain-line">' + measureExplain() + '</div>';
    } else {
      btn.classList.add('wrong');
      buttons.forEach(function(b){ if(b.textContent === (fmtNum(currentLen)+' cm')) b.classList.add('correct'); });
      fb.className = 'feedback tappable bad show';
      fb.innerHTML = '<div>✘ Pas tout à fait. La bonne réponse est ' + fmtNum(currentLen) + ' cm.</div><div class="explain-line">' + measureExplain() + '</div>';
    }
    playSound(ok?'good':'bad');
    celebrate(ok?'good':'bad', fb);
    if(ok) addStar(1);
    onPracticeAnswered(ok);
  }

  document.getElementById('m1-next').addEventListener('click', nextPracticeQuestion);
  enableTapToContinue('m1-feedback', nextPracticeQuestion);

