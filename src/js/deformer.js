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

