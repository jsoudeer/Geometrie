  /* ===================== THÈME GÉOMÉTRIE =====================
     Mesurer (règle), Déformer (formes) et les questions de Quizz de géométrie :
     côtés, sommets, nom, angles, alignement, milieu, repérage, codage/décodage,
     chasse aux formes, symétrie, scènes illustrées, énigmes.
  */

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

  /* ===================== MODULE 2 : DEFORMER ===================== */
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
    { name:'Losange',      instr:"Fais glisser les coins pour transformer la forme en losange : les 4 côtés doivent rester à peu près égaux.", check:checkRhombus, tolGreat:0.15, tolOk:0.30 },
    { name:'Rectangle',    instr:"Transforme la forme en rectangle : les côtés opposés doivent être à peu près égaux, et les 4 angles doivent rester à peu près droits.", check:checkRectangle, tolGreat:{side:0.14, angle:12}, tolOk:{side:0.26, angle:20} },
    { name:'Parallélogramme', instr:"Transforme la forme en parallélogramme : les côtés opposés doivent rester à peu près égaux, mais les angles ne doivent plus être droits.", check:checkParallelogram, tolGreat:{side:0.14, tilt:15}, tolOk:{side:0.26, tilt:8} }
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
    var lens = [0,1,2,3].map(function(i){ return dist(pts[i], pts[(i+1)%4]); });
    var angles = [0,1,2,3].map(function(i){
      var prev = pts[(i+3)%4], curr = pts[i], next = pts[(i+1)%4];
      return angleAtDeg(prev,curr,next);
    });
    return {lens:lens, angles:angles};
  }

  function checkRhombus(tolGreat, tolOk){
    var s = sidesAndAngles();
    var avg = s.lens.reduce(function(a,b){return a+b;},0)/4;
    var maxDev = Math.max.apply(null, s.lens.map(function(l){ return Math.abs(l-avg); }));
    var rel = maxDev/avg;
    if(rel <= tolGreat) return {ok:true, msg:'✔ Super, les 4 côtés sont égaux : bravo pour ce losange !'};
    if(rel <= tolOk) return {ok:true, msg:'✔ Réussi ! Les côtés sont à peu près égaux, c\'est un losange. Tu peux essayer d\'être encore plus précis la prochaine fois.'};
    return {ok:false, msg:'✘ Pas encore : les 4 côtés doivent avoir à peu près la même longueur.'};
  }

  function checkRectangle(tolGreat, tolOk){
    var s = sidesAndAngles();
    var avg = s.lens.reduce(function(a,b){return a+b;},0)/4;
    var sideDevRel = Math.max(Math.abs(s.lens[0]-s.lens[2]), Math.abs(s.lens[1]-s.lens[3])) / avg;
    var angleDevMax = Math.max.apply(null, s.angles.map(function(a){ return Math.abs(a-90); }));
    if(sideDevRel<=tolGreat.side && angleDevMax<=tolGreat.angle) return {ok:true, msg:'✔ Bravo, les côtés opposés sont égaux et les angles sont bien droits : c\'est un rectangle !'};
    if(sideDevRel<=tolOk.side && angleDevMax<=tolOk.angle) return {ok:true, msg:'✔ Réussi ! C\'est globalement un rectangle, même si ce n\'est pas parfaitement précis. Essaie d\'ajuster encore un peu la prochaine fois.'};
    if(angleDevMax>tolOk.angle) return {ok:false, msg:'✘ Presque : les 4 angles doivent redevenir à peu près droits.'};
    return {ok:false, msg:'✘ Pas encore : les côtés opposés doivent être à peu près de la même longueur.'};
  }

  function checkParallelogram(tolGreat, tolOk){
    var s = sidesAndAngles();
    var avg = s.lens.reduce(function(a,b){return a+b;},0)/4;
    var sideDevRel = Math.max(Math.abs(s.lens[0]-s.lens[2]), Math.abs(s.lens[1]-s.lens[3])) / avg;
    var angleDevMin = Math.min.apply(null, s.angles.map(function(a){ return Math.abs(a-90); }));
    if(sideDevRel<=tolGreat.side && angleDevMin>=tolGreat.tilt) return {ok:true, msg:'✔ Bien joué, c\'est un vrai parallélogramme penché !'};
    if(sideDevRel<=tolOk.side && angleDevMin>=tolOk.tilt) return {ok:true, msg:'✔ Réussi ! C\'est un parallélogramme, même si ce n\'est pas parfaitement précis.'};
    if(sideDevRel>tolOk.side) return {ok:false, msg:'✘ Pas encore : les côtés opposés doivent rester à peu près de la même longueur.'};
    return {ok:false, msg:'✘ Il faut incliner un peu plus la forme pour que les angles ne soient plus droits.'};
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
    var cornerCount = level===0 ? 1 : (level===2 ? 4 : 3);
    var magRange = level===0 ? [35,55] : (level===2 ? [45,75] : [25,45]);
    var idxs = shuffle([0,1,2,3]).slice(0, cornerCount);
    var startPts = target.map(function(p){ return p.slice(); });
    idxs.forEach(function(i){
      var ang = rand(0, Math.PI*2), mag = rand(magRange[0], magRange[1]);
      startPts[i][0] = clampCoord(startPts[i][0] + Math.cos(ang)*mag);
      startPts[i][1] = clampCoord(startPts[i][1] + Math.sin(ang)*mag);
    });
    return startPts;
  }

  var deformFocusIdx = null; // coin qui garde le focus clavier après un redessin
  function drawDeform(){
    var svg = document.getElementById('deformSvg');
    svg.innerHTML = "";
    var poly = el('polygon', {
      points: pts.map(function(p){return p[0]+','+p[1];}).join(' '),
      fill:'var(--accent2)', 'fill-opacity':'0.35', stroke:'var(--accent)', 'stroke-width':3
    });
    svg.appendChild(poly);

    for(var i=0;i<4;i++){
      var a = pts[i], b = pts[(i+1)%4];
      var mx=(a[0]+b[0])/2, my=(a[1]+b[1])/2;
      var len = (dist(a,b)/SCALE2).toFixed(1);
      svg.appendChild(el('rect',{x:mx-16,y:my-9,width:32,height:16,rx:6,class:'side-label-bg'}));
      var t = el('text',{x:mx,y:my+4,'text-anchor':'middle',class:'side-label'});
      t.textContent = len+' cm';
      svg.appendChild(t);
    }

    pts.forEach(function(p, idx){
      var c = el('circle',{cx:p[0],cy:p[1],r:13,fill:'var(--accent)',stroke:'var(--text)','stroke-width':3,class:'handle'});
      c.style.touchAction = 'none';
      // Accessibilité : chaque coin est atteignable au clavier (Tab) et se
      // déplace avec les flèches (Maj = pas plus grand), en plus du glisser.
      c.setAttribute('tabindex','0');
      c.setAttribute('role','button');
      c.setAttribute('aria-label','Coin ' + (idx+1) + ' sur 4 : flèches du clavier pour le déplacer');
      c.addEventListener('keydown', function(ev){
        var step = ev.shiftKey ? 20 : 8, dx = 0, dy = 0;
        if(ev.key==='ArrowLeft') dx = -step; else if(ev.key==='ArrowRight') dx = step;
        else if(ev.key==='ArrowUp') dy = -step; else if(ev.key==='ArrowDown') dy = step;
        else return;
        ev.preventDefault();
        pts[idx][0] = Math.max(20, Math.min(240, pts[idx][0] + dx));
        pts[idx][1] = Math.max(20, Math.min(240, pts[idx][1] + dy));
        deformFocusIdx = idx;
        drawDeform();
      });
      c.addEventListener('pointerdown', function(ev){
        deformFocusIdx = null;
        c.setPointerCapture(ev.pointerId);
        function toSvgPoint(clientX, clientY){
          var pt = svg.createSVGPoint();
          pt.x = clientX; pt.y = clientY;
          var m = svg.getScreenCTM().inverse();
          return pt.matrixTransform(m);
        }
        function move(mv){
          var sp = toSvgPoint(mv.clientX, mv.clientY);
          pts[idx][0] = Math.max(20, Math.min(240, sp.x));
          pts[idx][1] = Math.max(20, Math.min(240, sp.y));
          drawDeform();
        }
        function up(){
          c.removeEventListener('pointermove', move);
          c.removeEventListener('pointerup', up);
        }
        c.addEventListener('pointermove', move);
        c.addEventListener('pointerup', up);
      });
      svg.appendChild(c);
      if(deformFocusIdx === idx) c.focus();
    });
  }

  function newDeformQuestion(){
    m2ShapeIdx = randInt(0,2);
    document.getElementById('m2-instructions').textContent = M2_LEVELS[m2ShapeIdx].instr;
    var target = shapeTargetPoints(m2ShapeIdx);
    m2StartPts = perturbForLevel(target, globalLevel);
    pts = m2StartPts.map(function(p){ return p.slice(); });
    drawDeform();
    var fb = document.getElementById('m2-feedback');
    fb.className='feedback'; fb.textContent='';
  }

  document.getElementById('m2-next').addEventListener('click', nextPracticeQuestion);
  enableTapToContinue('m2-feedback', nextPracticeQuestion);

  document.getElementById('m2-check').addEventListener('click', function(){
    var lv = M2_LEVELS[m2ShapeIdx];
    var res = lv.check(lv.tolGreat, lv.tolOk);
    var fb = document.getElementById('m2-feedback');
    fb.className = 'feedback tappable ' + (res.ok ? 'good' : 'bad') + ' show';
    fb.textContent = res.msg;
    playSound(res.ok ? 'good' : 'bad');
    celebrate(res.ok ? 'good' : 'bad', fb);
    if(res.ok) addStar(1);
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

  // Explication adaptée aux 3 points affichés : sur quelle ligne/colonne/
  // diagonale ils sont alignés, ou lequel sort de la droite des deux autres.
  function alignExplain(pts, aligned){
    function nm(p){ return COL_LETTERS[p.col] + (p.row+1); }
    if(aligned){
      if(pts[0].row===pts[1].row && pts[1].row===pts[2].row) return 'Oui : ' + pts.map(nm).join(', ') + ' sont tous sur la ligne ' + (pts[0].row+1) + '. Une règle posée sur cette ligne les touche tous les trois.';
      if(pts[0].col===pts[1].col && pts[1].col===pts[2].col) return 'Oui : ' + pts.map(nm).join(', ') + ' sont tous dans la colonne ' + COL_LETTERS[pts[0].col] + '. Une règle posée sur cette colonne les touche tous les trois.';
      return 'Oui : ' + pts.map(nm).join(', ') + ' sont en diagonale, à la suite les uns des autres. Une seule règle les touche tous les trois.';
    }
    return 'Non : si on pose la règle sur ' + nm(pts[0]) + ' et ' + nm(pts[1]) + ', elle ne touche pas ' + nm(pts[2]) + '. Il faut que la règle touche les 3 points en même temps.';
  }
  function genAlignQuestion(){
    var aligned = Math.random()<0.5;
    var pts;
    if(aligned){
      var mode = pick(['h','v','d']);
      if(mode==='h'){
        var row = randInt(0,4);
        pts = shuffle([0,1,2,3,4]).slice(0,3).sort(function(a,b){return a-b;}).map(function(c){return {col:c,row:row};});
      } else if(mode==='v'){
        var col = randInt(0,4);
        pts = shuffle([0,1,2,3,4]).slice(0,3).sort(function(a,b){return a-b;}).map(function(r){return {col:col,row:r};});
      } else {
        var dir = pick([1,-1]);
        var startCol = dir===1 ? 0 : 4;
        var startRow = randInt(0,2);
        pts = [0,1,2].map(function(i){ return {col:startCol+dir*i, row:startRow+i}; });
      }
    } else {
      var tries=0;
      do{
        pts = [0,1,2].map(function(){ return {col:randInt(0,4), row:randInt(0,4)}; });
        tries++;
      } while(tries<30 && isColinear(pts));
      if(isColinear(pts)) pts = [{col:0,row:0},{col:1,row:0},{col:0,row:2}];
    }
    // Forme et couleur du repère variées à chaque question (au lieu d'un
    // rond rose systématique) : purement visuel, pour que l'exercice ne
    // ressemble jamais deux fois de suite à la même image.
    var markerShape = pick(MARKER_SHAPES);
    var markerColor = pick(['var(--accent)','var(--accent2)','var(--accent3)']);
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

  function genMilieuQuestion(){
    var horizontal = Math.random()<0.5;
    var fixedIdx = randInt(0,4);
    // 3 formes bien distinctes plutôt que des lettres A/B/C, qui se
    // confondaient visuellement avec les lettres des colonnes du quadrillage.
    var shapeKeys = shuffle(MARKER_SHAPES.slice()).slice(0,3);
    var positions = [1,2,3];
    var pts = positions.map(function(p,i){
      var base = horizontal ? {col:p,row:fixedIdx} : {col:fixedIdx,row:p};
      base.shape = shapeKeys[i];
      return base;
    });
    var correctShape = pts[1].shape;
    var correctName = MARKER_LABELS[correctShape];
    return {
      tag:'Milieu',
      question:'Quelle forme se trouve au milieu du segment ?',
      sub:'Le milieu est à égale distance des deux extrémités du segment.',
      explain:'Le ' + correctName + ' est à égale distance des deux bouts du segment : c\'est lui qui est au milieu.',
      draw:function(){
        var svg=document.getElementById('m4Svg'); svg.setAttribute('viewBox','0 0 200 200'); svg.innerHTML="";
        drawGridBase(svg);
        var x1,y1,x2,y2;
        if(horizontal){ x1=gridCenterX(0); y1=gridCenterY(fixedIdx); x2=gridCenterX(4); y2=y1; }
        else { x1=gridCenterX(fixedIdx); y1=gridCenterY(0); x2=x1; y2=gridCenterY(4); }
        svg.appendChild(el('line',{x1:x1,y1:y1,x2:x2,y2:y2,stroke:'var(--accent)','stroke-width':4,'stroke-linecap':'round'}));
        pts.forEach(function(p,i){ drawShapeMarkerOnGrid(svg,p.col,p.row,p.shape,palette[i%palette.length]); });
      },
      cols3:true,
      choices: shapeKeys.map(function(sh){ return { label:MARKER_LABELS[sh], ok: sh===correctShape }; })
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
  // Le triangle isocèle change de taille, de position ET d'orientation
  // (pointe en haut/bas/gauche/droite) à chaque question, au lieu d'être
  // toujours rigoureusement le même dessin — seules les 3 droites candidates
  // changeaient avant, ce qui rendait l'exercice très répétitif.
  function genSymAxeQuestion(){
    var dir = pick(['up','down','left','right']);
    var vertical = (dir==='up' || dir==='down');
    var cx=100, cy=100;
    var apexDist = 55+randInt(0,25), baseDist = 45+randInt(0,15), baseHalf = 32+randInt(0,22);
    var apex, baseA, baseB;
    if(dir==='up'){    apex=[cx,cy-apexDist]; baseA=[cx-baseHalf,cy+baseDist]; baseB=[cx+baseHalf,cy+baseDist]; }
    else if(dir==='down'){ apex=[cx,cy+apexDist]; baseA=[cx-baseHalf,cy-baseDist]; baseB=[cx+baseHalf,cy-baseDist]; }
    else if(dir==='left'){ apex=[cx-apexDist,cy]; baseA=[cx+baseDist,cy-baseHalf]; baseB=[cx+baseDist,cy+baseHalf]; }
    else {             apex=[cx+apexDist,cy]; baseA=[cx-baseDist,cy-baseHalf]; baseB=[cx-baseDist,cy+baseHalf]; }
    var offset = 20+Math.floor(Math.random()*11);
    var axisCoord = vertical ? cx : cy;
    var coords = [axisCoord-offset, axisCoord, axisCoord+offset];
    var labels = shuffle(['1','2','3']);
    var correctIdx = coords.indexOf(axisCoord);
    var correctLabel = labels[correctIdx];
    return {
      tag:'Symétrie',
      question:'Quelle droite (1, 2 ou 3) est un axe de symétrie de cette figure ?',
      sub:'Une seule droite partage la figure en deux parties identiques, comme un miroir.',
      explain:'La droite ' + correctLabel + ' passe par la pointe et le milieu de la base : elle partage le triangle en deux parties identiques.',
      draw:function(){
        var svg=document.getElementById('m4Svg'); svg.setAttribute('viewBox','0 0 200 200'); svg.innerHTML="";
        svg.appendChild(el('polygon',{points:[apex,baseA,baseB].map(function(p){return p[0]+','+p[1];}).join(' '), fill:'var(--accent2)','fill-opacity':0.5, stroke:'var(--accent)','stroke-width':4,'stroke-linejoin':'round'}));
        coords.forEach(function(v,i){
          if(vertical){
            svg.appendChild(el('line',{x1:v,y1:22,x2:v,y2:182,stroke:'var(--text)','stroke-width':2,'stroke-dasharray':'6,5'}));
            svg.appendChild(svgText(v,15,13,labels[i]));
          } else {
            svg.appendChild(el('line',{x1:22,y1:v,x2:182,y2:v,stroke:'var(--text)','stroke-width':2,'stroke-dasharray':'6,5'}));
            svg.appendChild(svgText(14,v+4,13,labels[i]));
          }
        });
      },
      cols3:true,
      choices: ['1','2','3'].map(function(l){ return { label:l, ok:l===correctLabel }; })
    };
  }
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
  function genSymVraiQuestion(){
    var isAxis = Math.random()<0.5;
    var w = 70+randInt(0,60);
    var h; do{ h = 40+randInt(0,50); }while(Math.abs(w-h)<20); // jamais un carré
    var rx = 100-w/2, ry = 100-h/2;
    var vertical = Math.random()<0.5;
    var pct = isAxis ? 50 : pick(SYM_VRAI_OFFSETS);
    var lc;
    if(vertical){
      var x = rx + w*(pct/100);
      lc = {x1:x, y1:ry-15, x2:x, y2:ry+h+15};
    } else {
      var y = ry + h*(pct/100);
      lc = {x1:rx-15, y1:y, x2:rx+w+15, y2:y};
    }
    return {
      tag:'Symétrie',
      question:'Cette droite est-elle un axe de symétrie du rectangle ?',
      sub:'Imagine que tu plies la figure le long de la droite : les deux côtés se superposent-ils exactement ?',
      explain: isAxis
        ? 'Oui : cette droite passe exactement au milieu, donc en pliant le long d\'elle, les deux moitiés du rectangle se superposent.'
        : 'Non : cette droite ne passe pas exactement au milieu (elle est décalée), donc les deux parties n\'ont pas la même taille — ce n\'est pas un axe de symétrie.',
      draw:function(){
        var svg=document.getElementById('m4Svg'); svg.setAttribute('viewBox','0 0 200 200'); svg.innerHTML="";
        svg.appendChild(el('rect',{x:rx,y:ry,width:w,height:h, fill:'var(--accent2)','fill-opacity':0.5, stroke:'var(--accent)','stroke-width':4}));
        svg.appendChild(el('line',{x1:lc.x1,y1:lc.y1,x2:lc.x2,y2:lc.y2, stroke:'var(--text)','stroke-width':3,'stroke-dasharray':'6,5'}));
      },
      cols3:false,
      choices: shuffle([{label:'Oui',ok:isAxis},{label:'Non',ok:!isAxis}])
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
      explain:'La réponse est « ' + r.answer + ' » : ' + (SOLID_FACTS[r.answer] || 'relis bien les indices de l\'énigme.'),
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

  function genAngleQuestion(level){
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

  // ---- Déclaration des types de Quizz du thème Géométrie ----
  registerQuizType({ id:'sides', label:'Côtés', longLabel:'Compter les côtés', defaultLevels:[0,1,2],
    randomNote:'La forme est tirée au hasard parmi celles autorisées à ce niveau ; son nombre de côtés en découle de façon fixe (ce n\'est pas lui qui est tiré, seule la forme l\'est).',
    generate:function(level){ return genSidesVerticesQuestion('sides', level); } });
  registerQuizType({ id:'vertices', label:'Sommets', longLabel:'Compter les sommets', defaultLevels:[0,1,2],
    randomNote:'Même principe que "Côtés" : la forme est tirée au hasard, son nombre de sommets en découle de façon fixe.',
    generate:function(level){ return genSidesVerticesQuestion('vertices', level); } });
  registerQuizType({ id:'name', label:'Nom', longLabel:'Nom de la forme', defaultLevels:[0,1,2],
    randomNote:'La forme est tirée au hasard parmi celles du niveau ; son nom est fixe une fois la forme choisie.',
    generate:genNameQuestion });
  registerQuizType({ id:'align', label:'Alignement', longLabel:'Alignement', defaultLevels:[0,1,2],
    randomNote:'Les 3 points (alignés ou non) et leur disposition sont tirés au hasard à chaque question.',
    generate:genAlignQuestion });
  registerQuizType({ id:'milieu', label:'Milieu', longLabel:'Milieu d\'un segment', defaultLevels:[0,1,2],
    randomNote:'La position du segment et les formes-repères sont tirées au hasard à chaque question.',
    generate:genMilieuQuestion });
  registerQuizType({ id:'coord', label:'Coordonnées', longLabel:'Lire des coordonnées', defaultLevels:[0,1,2],
    randomNote:'Le point marqué sur le quadrillage est tiré au hasard ; ses coordonnées en découlent de façon fixe.',
    generate:genCoordQuestion });
  registerQuizType({ id:'angle', label:'Angles', longLabel:'Angles (droit/aigu/obtus)', defaultLevels:[1,2],
    randomNote:'La catégorie (droit/aigu/obtus) et la valeur en degrés sont tirées au hasard. C\'est le NIVEAU qui resserre l\'écart minimum autour de 90° (14° en Moyen, 7° en Difficile), rendant la distinction plus fine à l\'œil.',
    generate:genAngleQuestion });
  registerQuizType({ id:'image', label:'Image', longLabel:'Photo / illustration', defaultLevels:[1,2],
    randomNote:'La scène est tirée au hasard parmi 5 illustrations fixes (maison, clôture, château, robot, train) ; certaines valeurs (nombre de wagons, présence d\'une fenêtre...) varient aussi au hasard à l\'intérieur d\'une même scène.',
    generate:function(){ return pickFresh('image', IMAGE_QUESTIONS)(); } });
  registerQuizType({ id:'coordFind', label:'Repérage', longLabel:'Trouver sur le quadrillage', defaultLevels:[1,2],
    randomNote:'Les 4 cases et les formes qui s\'y trouvent sont tirées au hasard à chaque question.',
    generate:genCoordFindQuestion });
  registerQuizType({ id:'codage', label:'Déplacement', longLabel:'Déplacement (codage)', defaultLevels:[1,2],
    randomNote:'Le point de départ et la suite de flèches (2 à 3 déplacements) sont tirés au hasard.',
    generate:genCodageQuestion });
  registerQuizType({ id:'chasse', label:'Chasse aux formes', longLabel:'Chasse aux formes', defaultLevels:[1,2],
    randomNote:'Le nombre et la disposition des formes affichées sont tirés au hasard à chaque question.',
    generate:genChasseQuestion });
  registerQuizType({ id:'symAxe', label:'Symétrie', longLabel:'Axe de symétrie', defaultLevels:[1,2],
    randomNote:'La position des 3 droites candidates est tirée au hasard ; le triangle est toujours isocèle, donc il y a toujours exactement un vrai axe de symétrie parmi elles (règle fixe).',
    generate:genSymAxeQuestion });
  registerQuizType({ id:'decodage', label:'Trajet', longLabel:'Trajet (décodage)', defaultLevels:[2],
    randomNote:'Les points de départ/arrivée et les propositions de trajet erronées sont tirés au hasard à chaque question.',
    generate:genDecodageQuestion });
  registerQuizType({ id:'symVrai', label:'Symétrie (vrai/faux)', longLabel:'Vrai axe de symétrie ?', defaultLevels:[2],
    randomNote:'La droite proposée est parallèle à un côté (jamais une diagonale, qui prêtait à confusion) : soit exactement au milieu (vrai axe), soit décalée d\'un pourcentage variable (10 à 90%, jamais 50%) tiré au hasard.',
    generate:genSymVraiQuestion });
  registerQuizType({ id:'enigme', label:'Énigme', longLabel:'Énigme', defaultLevels:[2],
    randomNote:'L\'énigme est tirée au hasard dans une banque FIXE de 24 énigmes (texte non généré : toujours les mêmes formulations).',
    generate:genEnigmeQuestion });
