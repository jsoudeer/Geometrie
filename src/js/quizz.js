  /* ===================== MODULE 4 : QCM FORMES =====================
     Deux familles de questions, comme discuté :
     - "procédural" : la forme est dessinée par le code (SVG), à l'infini,
       aucune image stockée nécessaire.
     - "image" : s'appuie sur une illustration fixe (ici une petite scène
       dessinée à la main en SVG, qui tient lieu de prototype pour une
       vraie image stockée plus tard — voir la réponse ci-dessous).
  */
  function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
  function rand(a,b){ return a+Math.random()*(b-a); }

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
  var TYPE_LABELS = {
    sides:'Côtés', vertices:'Sommets', name:'Nom', angle:'Angles', image:'Image', calc:'Calcul',
    align:'Alignement', milieu:'Milieu', coord:'Coordonnées', coordFind:'Repérage', codage:'Déplacement',
    decodage:'Trajet', chasse:'Chasse aux formes', symAxe:'Symétrie', symVrai:'Symétrie (vrai/faux)',
    solideNom:'Solides', solideCompte:'Compter les solides', monnaie:'Monnaie', heure:'Lire l\'heure',
    enigme:'Énigme', vie:'Maths de la vie'
  };

  // Chaque type de question du Quizz (module 4) est déclaré une fois ici,
  // avec ses niveaux PAR DÉFAUT (defaultLevels) et une note qui explique ce
  // qui est tiré au hasard vs fixe pour ce type précis. Le panneau de
  // réglages "Activités & difficulté" peut surcharger defaultLevels (voir
  // typeLevelOverrides / rebuildM4Types plus bas dans l'orchestrateur), qui
  // reconstruit alors M4_LEVELS[*].types à partir de ces définitions —
  // qcmTypeLevels() (mode Manuel) lit donc toujours le résultat à jour.
  var QCM_TYPE_DEFS = [
    { id:'sides',        label:TYPE_LABELS.sides,        defaultLevels:[0,1,2],
      randomNote:'La forme est tirée au hasard parmi celles autorisées à ce niveau ; son nombre de côtés en découle de façon fixe (ce n\'est pas lui qui est tiré, seule la forme l\'est).' },
    { id:'vertices',     label:TYPE_LABELS.vertices,     defaultLevels:[0,1,2],
      randomNote:'Même principe que "Côtés" : la forme est tirée au hasard, son nombre de sommets en découle de façon fixe.' },
    { id:'name',         label:TYPE_LABELS.name,         defaultLevels:[0,1,2],
      randomNote:'La forme est tirée au hasard parmi celles du niveau ; son nom est fixe une fois la forme choisie.' },
    { id:'calc',         label:TYPE_LABELS.calc,         defaultLevels:[0,1,2],
      randomNote:'Les nombres de l\'opération sont tirés au hasard. C\'est le NIVEAU qui fixe la plage (jusqu\'à 10 en Facile, jusqu\'à 20 en Moyen/Difficile) et, en Difficile, la possibilité de tirer une variante "trouve le nombre manquant".' },
    { id:'align',        label:TYPE_LABELS.align,        defaultLevels:[0,1,2],
      randomNote:'Les 3 points (alignés ou non) et leur disposition sont tirés au hasard à chaque question.' },
    { id:'milieu',       label:TYPE_LABELS.milieu,       defaultLevels:[0,1,2],
      randomNote:'La position du segment et les formes-repères sont tirées au hasard à chaque question.' },
    { id:'coord',        label:TYPE_LABELS.coord,        defaultLevels:[0,1,2],
      randomNote:'Le point marqué sur le quadrillage est tiré au hasard ; ses coordonnées en découlent de façon fixe.' },
    { id:'solideNom',    label:TYPE_LABELS.solideNom,    defaultLevels:[0,1,2],
      randomNote:'Le solide est tiré au hasard parmi les 6 solides connus ; son nom (la réponse) en découle de façon fixe.' },
    { id:'monnaie',      label:TYPE_LABELS.monnaie,      defaultLevels:[0,1,2],
      randomNote:'Le nombre de pièces/billets et leurs valeurs sont tirés au hasard à chaque question.' },
    { id:'heure',        label:TYPE_LABELS.heure,        defaultLevels:[0,1,2],
      randomNote:'L\'heure affichée est tirée au hasard. C\'est le NIVEAU qui fixe la précision autorisée : à l\'heure pile/demie en Facile, + quarts d\'heure en Moyen, n\'importe quelle tranche de 5 min en Difficile.' },
    { id:'angle',        label:TYPE_LABELS.angle,        defaultLevels:[1,2],
      randomNote:'La catégorie (droit/aigu/obtus) et la valeur en degrés sont tirées au hasard. C\'est le NIVEAU qui resserre l\'écart minimum autour de 90° (14° en Moyen, 7° en Difficile), rendant la distinction plus fine à l\'œil.' },
    { id:'image',        label:TYPE_LABELS.image,        defaultLevels:[1,2],
      randomNote:'La scène est tirée au hasard parmi 5 illustrations fixes (maison, clôture, château, robot, train) ; certaines valeurs (nombre de wagons, présence d\'une fenêtre...) varient aussi au hasard à l\'intérieur d\'une même scène.' },
    { id:'coordFind',    label:TYPE_LABELS.coordFind,    defaultLevels:[1,2],
      randomNote:'Les 4 cases et les formes qui s\'y trouvent sont tirées au hasard à chaque question.' },
    { id:'codage',       label:TYPE_LABELS.codage,       defaultLevels:[1,2],
      randomNote:'Le point de départ et la suite de flèches (2 à 3 déplacements) sont tirés au hasard.' },
    { id:'chasse',       label:TYPE_LABELS.chasse,       defaultLevels:[1,2],
      randomNote:'Le nombre et la disposition des formes affichées sont tirés au hasard à chaque question.' },
    { id:'symAxe',       label:TYPE_LABELS.symAxe,       defaultLevels:[1,2],
      randomNote:'La position des 3 droites candidates est tirée au hasard ; le triangle est toujours isocèle, donc il y a toujours exactement un vrai axe de symétrie parmi elles (règle fixe).' },
    { id:'solideCompte', label:TYPE_LABELS.solideCompte, defaultLevels:[1,2],
      randomNote:'Le solide (cube/pavé/pyramide) et l\'attribut demandé (faces/sommets/arêtes) sont tirés au hasard ; le nombre correspondant est ensuite fixe pour ce solide.' },
    { id:'vie',          label:TYPE_LABELS.vie,          defaultLevels:[1,2],
      randomNote:'Le modèle de problème est tiré au hasard parmi 6 scénarios fixes, puis les nombres de l\'énoncé sont eux aussi tirés au hasard à l\'intérieur de chaque modèle.' },
    { id:'decodage',     label:TYPE_LABELS.decodage,     defaultLevels:[2],
      randomNote:'Les points de départ/arrivée et les propositions de trajet erronées sont tirés au hasard à chaque question.' },
    { id:'symVrai',      label:TYPE_LABELS.symVrai,      defaultLevels:[2],
      randomNote:'La droite proposée est parallèle à un côté (jamais une diagonale, qui prêtait à confusion) : soit exactement au milieu (vrai axe), soit décalée d\'un pourcentage variable (10 à 90%, jamais 50%) tiré au hasard.' },
    { id:'enigme',       label:TYPE_LABELS.enigme,       defaultLevels:[2],
      randomNote:'L\'énigme est tirée au hasard dans une banque FIXE de 24 énigmes (texte non généré : toujours les mêmes formulations).' }
  ];
  // types rempli par rebuildM4Types() (appelée après le chargement des
  // éventuelles surcharges manuelles, voir plus bas) — jamais laissé vide.
  var M4_LEVELS = [
    { name:'Facile',
      shapes:['triangle','carre','rectangle'],
      types:[],
      angleGap:20, calcModes:['add'], calcMax:10 },
    { name:'Moyen',
      shapes:['triangle','carre','rectangle','pentagone','hexagone','cercle'],
      types:[],
      angleGap:14, calcModes:['add'], calcMax:20 },
    { name:'Difficile',
      shapes:['triangle','carre','rectangle','pentagone','hexagone','cercle','losange'],
      types:[],
      angleGap:7, calcModes:['add','missing'], calcMax:20 }
  ];
  var m4TypeFilter = 'random';
  var m4Current = null;

  function numChoiceSet(correct, poolVals){
    var opts = [correct];
    var seen = {}; seen[correct] = true;
    var uniquePool = poolVals.filter(function(v){
      if(v===correct || seen[v]) return false;
      seen[v] = true; return true;
    });
    var pool = shuffle(uniquePool);
    var i=0;
    while(opts.length<4 && i<pool.length){ opts.push(pool[i]); i++; }
    return shuffle(opts);
  }

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

  function svgText(x,y,size,txt){
    var t = el('text',{x:x,y:y,'text-anchor':'middle','font-size':size,'font-family':"'Baloo 2', sans-serif",'font-weight':'700',fill:'var(--text)'});
    t.textContent = txt;
    return t;
  }

  function drawEquation(txt){
    var svg = document.getElementById('m4Svg');
    svg.setAttribute('viewBox','0 0 200 200');
    svg.innerHTML = "";
    svg.appendChild(svgText(100,112,34,txt));
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

  // ===================== Solides =====================
  // Représentation "perspective cavalière", comme dans les cahiers : les
  // arêtes visibles sont des traits pleins, les arêtes cachées (derrière le
  // solide) sont en pointillés, et les faces visibles sont translucides.
  // Ça permet à l'enfant de voir ET de compter les arêtes/sommets cachés,
  // au lieu d'avoir à "deviner" ce qu'il y a derrière.
  function isoPoly(pts){ return pts.map(function(p){return p[0]+','+p[1];}).join(' '); }
  function solidFace(svg,pts,color){
    svg.appendChild(el('polygon',{points:isoPoly(pts), fill:color, 'fill-opacity':0.5, stroke:'none'}));
  }
  function solidEdge(svg,p1,p2,hidden){
    var attrs = {x1:p1[0],y1:p1[1],x2:p2[0],y2:p2[1], stroke:'var(--text)','stroke-width':2.2,'stroke-linecap':'round'};
    if(hidden) attrs['stroke-dasharray'] = '5,4';
    svg.appendChild(el('line',attrs));
  }
  function drawCavalierBox(svg,c){
    // c = coins Front(TL,TR,BR,BL) et Back(TL,TR,BR,BL). Seul le coin
    // Back-Bas-Gauche (BBL) est caché, avec les 3 arêtes qui y mènent.
    solidFace(svg, [c.FTL,c.FTR,c.FBR,c.FBL], 'var(--accent)');   // face avant
    solidFace(svg, [c.FTL,c.FTR,c.BTR,c.BTL], 'var(--accent3)');  // face du dessus
    solidFace(svg, [c.FTR,c.FBR,c.BBR,c.BTR], 'var(--accent2)');  // face de droite
    // arêtes cachées (le coin arrière-bas-gauche, invisible depuis l'extérieur)
    solidEdge(svg,c.FBL,c.BBL,true);
    solidEdge(svg,c.BTL,c.BBL,true);
    solidEdge(svg,c.BBL,c.BBR,true);
    // arêtes visibles
    solidEdge(svg,c.FTL,c.FTR,false); solidEdge(svg,c.FTR,c.FBR,false);
    solidEdge(svg,c.FBR,c.FBL,false); solidEdge(svg,c.FBL,c.FTL,false);
    solidEdge(svg,c.FTL,c.BTL,false); solidEdge(svg,c.FTR,c.BTR,false); solidEdge(svg,c.FBR,c.BBR,false);
    solidEdge(svg,c.BTL,c.BTR,false); solidEdge(svg,c.BTR,c.BBR,false);
  }
  function drawSolidCube(svg){
    // Base carrée ET profondeur cohérente avec la largeur : ça se voit
    // clairement comme un cube, pas comme une boîte allongée.
    drawCavalierBox(svg, {
      FTL:[55,70], FTR:[145,70], FBR:[145,160], FBL:[55,160],
      BTL:[90,42], BTR:[180,42], BBR:[180,132], BBL:[90,132]
    });
  }
  function drawSolidPave(svg){
    // Volontairement bien plus large que haut, et moins profond : la
    // silhouette "boîte allongée" doit sauter aux yeux à côté du cube.
    drawCavalierBox(svg, {
      FTL:[30,92], FTR:[160,92], FBR:[160,145], FBL:[30,145],
      BTL:[58,68], BTR:[188,68], BBR:[188,121], BBL:[58,121]
    });
  }
  function drawSolidPyramide(svg){
    // Base carrée en losange (F=devant, Bk=caché derrière, L/R=côtés) +
    // sommet. Seuls le sommet arrière du carré de base et les 3 arêtes qui
    // y mènent sont cachés (pointillés) ; le reste est visible.
    var Apex=[100,38], Bk=[100,116], R=[153,142], F=[100,168], L=[47,142];
    solidFace(svg, [Apex,L,F], 'var(--accent2)');
    solidFace(svg, [Apex,F,R], 'var(--accent)');
    solidEdge(svg,Apex,Bk,true); solidEdge(svg,L,Bk,true); solidEdge(svg,R,Bk,true);
    solidEdge(svg,Apex,F,false); solidEdge(svg,Apex,L,false); solidEdge(svg,Apex,R,false);
    solidEdge(svg,F,L,false); solidEdge(svg,F,R,false);
  }
  function drawSolidCylindre(svg){
    var cx=100, topCy=62, botCy=150, rx=46, ry=16;
    svg.appendChild(el('rect',{x:cx-rx,y:topCy,width:2*rx,height:botCy-topCy,fill:'var(--accent2)'}));
    svg.appendChild(el('line',{x1:cx-rx,y1:topCy,x2:cx-rx,y2:botCy,stroke:'var(--text)','stroke-width':2}));
    svg.appendChild(el('line',{x1:cx+rx,y1:topCy,x2:cx+rx,y2:botCy,stroke:'var(--text)','stroke-width':2}));
    svg.appendChild(el('path',{d:'M '+(cx-rx)+' '+botCy+' A '+rx+' '+ry+' 0 0 0 '+(cx+rx)+' '+botCy, fill:'none', stroke:'var(--text)','stroke-width':2}));
    svg.appendChild(el('ellipse',{cx:cx,cy:topCy,rx:rx,ry:ry,fill:'var(--accent3)',stroke:'var(--text)','stroke-width':2}));
  }
  function drawSolidCone(svg){
    var rx=48, ry=16, baseCy=150, apex=[100,40];
    svg.appendChild(el('polygon',{points:isoPoly([apex,[100-rx,baseCy],[100+rx,baseCy]]),fill:'var(--accent2)'}));
    svg.appendChild(el('ellipse',{cx:100,cy:baseCy,rx:rx,ry:ry,fill:'var(--accent3)',stroke:'var(--text)','stroke-width':2}));
    svg.appendChild(el('line',{x1:apex[0],y1:apex[1],x2:100-rx,y2:baseCy,stroke:'var(--text)','stroke-width':2}));
    svg.appendChild(el('line',{x1:apex[0],y1:apex[1],x2:100+rx,y2:baseCy,stroke:'var(--text)','stroke-width':2}));
  }
  function drawSolidBoule(svg){
    svg.appendChild(el('circle',{cx:100,cy:100,r:60,fill:'var(--accent2)','fill-opacity':0.75,stroke:'var(--text)','stroke-width':2}));
    svg.appendChild(el('ellipse',{cx:100,cy:128,rx:38,ry:13,fill:'var(--text)','fill-opacity':0.12}));
  }
  // Tétraèdre : pyramide à base TRIANGULAIRE (3 sommets de base + 1 pointe,
  // au lieu des 4 sommets de base de drawSolidPyramide). Même logique que
  // la pyramide : les 2 faces avant sont visibles (remplies), et la seule
  // arête du fond de la base (celle qu'on ne voit jamais de face) est en
  // pointillés.
  function drawSolidTetraedre(svg){
    // L, R et F doivent rester GROUPÉS dans une bande basse étroite (comme
    // dans drawSolidPyramide : L/R/F sont tous proches de y=142-168) pour
    // que la base se lise comme une zone compacte, bien plus bas que la
    // pointe (Apex tout en haut) — sinon, si F descend trop loin sous L/R,
    // la silhouette devient un losange à 4 pointes (confondu avec un
    // octaèdre) plutôt qu'une seule pointe au-dessus d'une base.
    var Apex=[100,35], L=[45,140], R=[155,140], F=[100,163];
    solidFace(svg, [Apex,F,L], 'var(--accent2)');
    solidFace(svg, [Apex,F,R], 'var(--accent)');
    solidEdge(svg,L,R,true);
    solidEdge(svg,Apex,F,false); solidEdge(svg,Apex,L,false); solidEdge(svg,Apex,R,false);
    solidEdge(svg,F,L,false); solidEdge(svg,F,R,false);
  }
  // Octaèdre : deux pyramides à base carrée collées base contre base — vu
  // de face, la base carrée du milieu s'aplatit en un losange dont on ne
  // voit que 2 des 4 sommets (Front, en bas ; le 4e, Back, est caché
  // derrière, comme le sommet caché du patron de pyramide).
  function drawSolidOctaedre(svg){
    var Top=[100,30], Bot=[100,175], F=[100,128], L=[45,100], R=[155,100], Bk=[100,72];
    solidFace(svg, [Top,F,L], 'var(--accent2)');
    solidFace(svg, [Top,F,R], 'var(--accent)');
    solidFace(svg, [Bot,F,L], 'var(--accent3)');
    solidFace(svg, [Bot,F,R], 'var(--accent2)');
    solidEdge(svg,Top,Bk,true); solidEdge(svg,Bot,Bk,true); solidEdge(svg,L,Bk,true); solidEdge(svg,R,Bk,true);
    solidEdge(svg,Top,F,false); solidEdge(svg,Top,L,false); solidEdge(svg,Top,R,false);
    solidEdge(svg,Bot,F,false); solidEdge(svg,Bot,L,false); solidEdge(svg,Bot,R,false);
    solidEdge(svg,F,L,false); solidEdge(svg,F,R,false);
  }
  // Prismes à base polygonale régulière (triangle/pentagone/hexagone/
  // octogone) : même langage visuel que le cylindre (drawSolidCylindre) —
  // un "corps" plein (silhouette rectangulaire, comme si les faces
  // latérales étaient fondues), un dessus entièrement visible, et un
  // dessous dont seule la moitié avant (les sommets les plus bas) est
  // tracée — plutôt que de gérer arête par arête laquelle des n faces
  // latérales est visible ou cachée, inutilement complexe à cet âge.
  function ngonPoints(n, cx, cy, rx, ry, rotDeg){
    var pts=[];
    for(var k=0;k<n;k++){
      var ang=(rotDeg + k*360/n) * Math.PI/180;
      pts.push([cx+rx*Math.cos(ang), cy+ry*Math.sin(ang)]);
    }
    return pts;
  }
  function drawSolidPrismeN(svg, n){
    var cx=100, rx=46, ry=17, topCy=62, botCy=148;
    var top = ngonPoints(n,cx,topCy,rx,ry,-90);
    var bot = ngonPoints(n,cx,botCy,rx,ry,-90);
    svg.appendChild(el('rect',{x:cx-rx,y:topCy,width:2*rx,height:botCy-topCy,fill:'var(--accent2)'}));
    svg.appendChild(el('line',{x1:cx-rx,y1:topCy,x2:cx-rx,y2:botCy, stroke:'var(--text)','stroke-width':2}));
    svg.appendChild(el('line',{x1:cx+rx,y1:topCy,x2:cx+rx,y2:botCy, stroke:'var(--text)','stroke-width':2}));
    var front = bot.filter(function(p){ return p[1] >= botCy - 0.01; }).sort(function(a,b){ return a[0]-b[0]; });
    if(front.length>1){
      var d = 'M '+front[0][0]+' '+front[0][1];
      for(var i=1;i<front.length;i++) d += ' L '+front[i][0]+' '+front[i][1];
      svg.appendChild(el('path',{d:d, fill:'none', stroke:'var(--text)','stroke-width':2}));
    }
    svg.appendChild(el('polygon',{points:isoPoly(top), fill:'var(--accent3)', stroke:'var(--text)','stroke-width':2}));
  }
  function drawSolidPrismeTri(svg){ drawSolidPrismeN(svg,3); }
  function drawSolidPrismePenta(svg){ drawSolidPrismeN(svg,5); }
  function drawSolidPrismeHexa(svg){ drawSolidPrismeN(svg,6); }
  function drawSolidPrismeOcto(svg){ drawSolidPrismeN(svg,8); }
  // Nombre de faces/arêtes/sommets d'un prisme à base n-gonale régulière :
  // n+2 faces (2 bases + n côtés), 3n arêtes, 2n sommets.
  function prismCounts(n){ return { faces:n+2, aretes:3*n, sommets:2*n }; }
  var SOLID_META = {
    cube:          { faces:6, aretes:12, sommets:8,  label:'cube', draw:drawSolidCube },
    pave:          { faces:6, aretes:12, sommets:8,  label:'pavé droit', draw:drawSolidPave },
    pyramide:      { faces:5, aretes:8,  sommets:5,  label:'pyramide à base carrée', draw:drawSolidPyramide },
    tetraedre:     { faces:4, aretes:6,  sommets:4,  label:'tétraèdre', draw:drawSolidTetraedre },
    octaedre:      { faces:8, aretes:12, sommets:6,  label:'octaèdre', draw:drawSolidOctaedre },
    prisme_tri:    { faces:prismCounts(3).faces, aretes:prismCounts(3).aretes, sommets:prismCounts(3).sommets,
                     label:'prisme triangulaire', draw:drawSolidPrismeTri },
    prisme_penta:  { faces:prismCounts(5).faces, aretes:prismCounts(5).aretes, sommets:prismCounts(5).sommets,
                     label:'prisme pentagonal', draw:drawSolidPrismePenta },
    prisme_hexa:   { faces:prismCounts(6).faces, aretes:prismCounts(6).aretes, sommets:prismCounts(6).sommets,
                     label:'prisme hexagonal', draw:drawSolidPrismeHexa },
    prisme_octo:   { faces:prismCounts(8).faces, aretes:prismCounts(8).aretes, sommets:prismCounts(8).sommets,
                     label:'prisme octogonal', draw:drawSolidPrismeOcto },
    cylindre: { label:'cylindre', draw:drawSolidCylindre },
    cone:     { label:'cône', draw:drawSolidCone },
    boule:    { label:'boule', draw:drawSolidBoule }
  };
  var SOLID_NAME_POOL = ['cube','pavé droit','pyramide à base carrée','cylindre','cône','boule',
    'tétraèdre','octaèdre','prisme triangulaire','prisme pentagonal','prisme hexagonal','prisme octogonal'];

  // Fait varier le "plan" (l'angle de vue) d'un solide : un miroir
  // horizontal aléatoire (une chance sur deux), pour que l'enfant ne
  // mémorise pas "LA" silhouette d'un solide donné mais le reconnaisse
  // aussi vu sous un angle différent. Marche pour tous les solides sans
  // toucher à chaque fonction de dessin : on dessine dans un <g> qu'on
  // retourne éventuellement, plutôt que directement dans le <svg>.
  function drawSolidVaried(svg, meta){
    svg.innerHTML = "";
    var g = document.createElementNS(svgNS,'g');
    if(Math.random()<0.5) g.setAttribute('transform','translate(200,0) scale(-1,1)');
    svg.appendChild(g);
    meta.draw(g);
  }

  // Une phrase qui décrit chaque solide (ce qui permet de le reconnaître),
  // réutilisée par les questions "nom du solide" et les énigmes.
  var SOLID_FACTS = {
    'cube':'il a 6 faces carrées toutes identiques, comme un dé.',
    'pavé droit':'il a 6 faces rectangulaires, comme une boîte à chaussures ou une brique.',
    'pyramide à base carrée':'il a 1 base carrée et 4 faces triangulaires qui se rejoignent en une pointe.',
    'tétraèdre':'il a 4 faces, toutes des triangles : c\'est la plus simple des pyramides.',
    'octaèdre':'il a 8 faces triangulaires : ce sont deux pyramides à base carrée collées par leur base.',
    'prisme triangulaire':'il a 2 faces triangulaires reliées par 3 rectangles, comme une tente de camping.',
    'prisme pentagonal':'il a 2 faces pentagonales (5 côtés) reliées par 5 rectangles.',
    'prisme hexagonal':'il a 2 faces hexagonales (6 côtés) reliées par 6 rectangles.',
    'prisme octogonal':'il a 2 faces à 8 côtés reliées par 8 rectangles.',
    'cylindre':'il a 2 disques ronds reliés par une surface qui s\'enroule, comme une boîte de conserve.',
    'cône':'il a une base ronde et une seule pointe, comme un chapeau de sorcière ou un cornet de glace.',
    'boule':'il est tout rond, sans arête ni sommet, comme un ballon.',
    'triangle':'il a 3 côtés et 3 sommets. S\'il a 3 côtés égaux, on l\'appelle un triangle équilatéral.',
    'carré':'il a 4 côtés égaux et 4 angles droits.',
    'rectangle':'il a 4 angles droits et ses côtés opposés sont égaux (le carré est un rectangle particulier).',
    'losange':'il a 4 côtés égaux, mais ses angles ne sont pas droits.',
    'cercle':'c\'est une ligne courbe fermée : il n\'a ni côté ni sommet.',
    'pentagone':'il a 5 côtés et 5 sommets.',
    'hexagone':'il a 6 côtés et 6 sommets, comme une alvéole de ruche.'
  };
  // Comment compter faces / arêtes / sommets pour chaque polyèdre.
  function countTip(key, attr){
    var meta = SOLID_META[key];
    var nPrism = { prisme_tri:3, prisme_penta:5, prisme_hexa:6, prisme_octo:8 }[key];
    if(nPrism){
      if(attr==='faces') return '2 faces de base (dessus et dessous) + ' + nPrism + ' rectangles sur les côtés = ' + meta.faces + ' faces.';
      if(attr==='aretes') return nPrism + ' arêtes en haut + ' + nPrism + ' en bas + ' + nPrism + ' qui relient le haut et le bas = ' + meta.aretes + ' arêtes.';
      return nPrism + ' coins en haut + ' + nPrism + ' coins en bas = ' + meta.sommets + ' sommets.';
    }
    var tips = {
      cube:{ faces:'Dessus + dessous + 4 côtés = 6 faces.', aretes:'4 arêtes en haut + 4 en bas + 4 qui relient le haut et le bas = 12 arêtes.', sommets:'4 coins en haut + 4 coins en bas = 8 sommets.' },
      pave:{ faces:'Dessus + dessous + 4 côtés = 6 faces (toutes des rectangles).', aretes:'4 arêtes en haut + 4 en bas + 4 qui relient le haut et le bas = 12 arêtes.', sommets:'4 coins en haut + 4 coins en bas = 8 sommets.' },
      pyramide:{ faces:'1 base carrée + 4 triangles = 5 faces.', aretes:'4 arêtes autour de la base + 4 qui montent jusqu\'à la pointe = 8 arêtes.', sommets:'4 coins de la base + 1 pointe tout en haut = 5 sommets.' },
      tetraedre:{ faces:'4 triangles = 4 faces.', aretes:'3 arêtes autour de la base + 3 qui montent jusqu\'à la pointe = 6 arêtes.', sommets:'3 coins de la base + 1 pointe = 4 sommets.' },
      octaedre:{ faces:'4 triangles en haut + 4 triangles en bas = 8 faces.', aretes:'4 arêtes autour du milieu + 4 vers la pointe du haut + 4 vers la pointe du bas = 12 arêtes.', sommets:'1 pointe en haut + 1 en bas + 4 au milieu = 6 sommets.' }
    };
    return tips[key][attr];
  }
  var COUNT_DEFS = {
    faces:'Une face est une surface plate du solide.',
    aretes:'Une arête est un trait où deux faces se rejoignent.',
    sommets:'Un sommet est une pointe, un coin où plusieurs arêtes se rejoignent.'
  };
  function genSolideNomQuestion(){
    var keys = Object.keys(SOLID_META);
    var key = pick(keys);
    var meta = SOLID_META[key];
    var poolLabels = shuffle(SOLID_NAME_POOL.filter(function(l){return l!==meta.label;})).slice(0,3);
    var labels = shuffle([meta.label].concat(poolLabels));
    return {
      tag:'Solides',
      question:'Quel est le nom de ce solide ?',
      sub:'Observe bien sa forme en 3D.',
      explain:'C\'est un(e) ' + meta.label + ' : ' + (SOLID_FACTS[meta.label] || 'observe bien ses faces.'),
      draw:function(){ var svg=document.getElementById('m4Svg'); svg.setAttribute('viewBox','0 0 200 200'); drawSolidVaried(svg, meta); },
      cols3:false,
      choices: labels.map(function(l){ return { label:l, ok:l===meta.label }; })
    };
  }
  // Solides pour lesquels faces/arêtes/sommets ont un sens simple à compter
  // (polyèdres) — cylindre/cône/boule en sont volontairement exclus, leurs
  // "faces" courbes prêtant à débat à ce niveau.
  var SOLID_COMPTE_KEYS = ['cube','pave','pyramide','tetraedre','octaedre','prisme_tri','prisme_penta','prisme_hexa','prisme_octo'];
  function genSolideCompteQuestion(){
    var key = pick(SOLID_COMPTE_KEYS);
    var meta = SOLID_META[key];
    var attr = pick(['faces','sommets','aretes']);
    var correct = meta[attr];
    var attrLabel = attr==='faces'?'faces' : attr==='sommets'?'sommets' : 'arêtes';
    return {
      tag:'Solides',
      question:'Combien de ' + attrLabel + ' a ce solide (' + meta.label + ') ?',
      sub:'Essaie de bien visualiser toutes les faces, même celles qu\'on ne voit pas directement.',
      explain: COUNT_DEFS[attr] + ' ' + countTip(key, attr) + ' (Un ' + meta.label + ' a ' + meta.faces + ' faces, ' + meta.aretes + ' arêtes et ' + meta.sommets + ' sommets.)',
      draw:function(){ var svg=document.getElementById('m4Svg'); svg.setAttribute('viewBox','0 0 200 200'); drawSolidVaried(svg, meta); },
      cols3:false,
      // Les distracteurs sont pris AUTOUR de la vraie valeur (plutôt qu'un
      // pool fixe 2-12) : nécessaire depuis l'ajout des prismes, dont le
      // nombre d'arêtes/sommets peut largement dépasser 12 (24 arêtes pour
      // le prisme octogonal, par ex.) — un pool fixe aurait alors proposé
      // des distracteurs ridiculement éloignés, rendant la question trop facile.
      choices: numChoiceSet(correct, [correct-4,correct-3,correct-2,correct-1,correct+1,correct+2,correct+3,correct+4].filter(function(v){return v>=1;})).map(function(v){ return { label:String(v), ok:v===correct }; })
    };
  }

  // ===================== Monnaie =====================
  function drawMoneyItem(svg,cx,cy,value,isCoin){
    if(isCoin) svg.appendChild(el('circle',{cx:cx,cy:cy,r:26, fill:'var(--accent3)', stroke:'var(--text)','stroke-width':2.5}));
    else svg.appendChild(el('rect',{x:cx-34,y:cy-20,width:68,height:40,rx:4, fill:'var(--accent2)', stroke:'var(--text)','stroke-width':2.5}));
    svg.appendChild(svgText(cx,cy+6,16,value+'€'));
  }
  function genMonnaieQuestion(){
    var pool=[1,2,5,10,20];
    var count = 2+Math.floor(Math.random()*2);
    var items=[], sum=0;
    for(var i=0;i<count;i++){ var v=pick(pool); items.push(v); sum+=v; }
    var positions=[[55,100],[100,65],[145,100],[100,140]];
    return {
      tag:'Monnaie',
      question:'Combien d\'argent y a-t-il en tout ?',
      sub:'Additionne la valeur de chaque pièce ou billet.',
      explain: items.join('€ + ') + '€ = ' + sum + '€.',
      draw:function(){
        var svg=document.getElementById('m4Svg'); svg.setAttribute('viewBox','0 0 200 200'); svg.innerHTML="";
        items.forEach(function(v,i){ drawMoneyItem(svg, positions[i][0], positions[i][1], v, v<5); });
      },
      cols3:false,
      choices: numChoiceSet(sum, [sum-5,sum-2,sum-1,sum+1,sum+2,sum+5].filter(function(v){return v>0;})).map(function(v){ return { label:String(v)+'€', ok:v===sum }; })
    };
  }

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
  function genHeureQuestion(svgId, level){
    svgId = svgId || 'm4Svg';
    level = level || 0;
    var step = level===0 ? 30 : (level===1 ? 15 : 5);
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
    { text:'J\'ai 2 faces à 8 côtés et 8 faces rectangulaires : ma base ressemble à un panneau "stop". Qui suis-je ?', answer:'prisme octogonal', pool:['prisme octogonal','prisme hexagonal','cylindre','prisme pentagonal'] }
  ];
  function genEnigmeQuestion(){
    var r = pick(ENIGME_POOL);
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

  // ===================== Maths de la vie courante =====================
  function genVieQuestion(){
    var templates = [
      function(){
        var a=randInt(1,10), b=randInt(1,10), sum=a+b;
        return { icon:'🎒', question:'Léa a ' + a + ' billes rouges et ' + b + ' billes bleues. Combien de billes a-t-elle en tout ?', explain: a + ' + ' + b + ' = ' + sum + ' billes.', correct:sum, pool:[sum-2,sum-1,sum+1,sum+2,sum+3] };
      },
      function(){
        var a=randInt(2,15), b=randInt(1,a-1), diff=a-b;
        return { icon:'📏', question:'Un crayon mesure ' + a + ' cm. Un autre mesure ' + b + ' cm. Quelle est la différence de longueur ?', explain: a + ' - ' + b + ' = ' + diff + ' cm.', correct:diff, pool:[diff-2,diff-1,diff+1,diff+2,diff+3] };
      },
      function(){
        var p1=randInt(1,10), p2=randInt(1,10), sum=p1+p2;
        return { icon:'💶', question:'Au marché, une pomme coûte ' + p1 + '€ et une poire coûte ' + p2 + '€. Combien coûtent les deux fruits ensemble ?', explain: p1 + '€ + ' + p2 + '€ = ' + sum + '€.', correct:sum, pool:[sum-2,sum-1,sum+1,sum+2,sum+3] };
      },
      function(){
        var total=randInt(10,20), done=randInt(1,total-1), remain=total-done;
        return { icon:'🚶', question:'Sur le chemin de l\'école, il y a ' + total + ' arbres. Léo en a déjà compté ' + done + '. Combien lui en reste-t-il à compter ?', explain: total + ' - ' + done + ' = ' + remain + '.', correct:remain, pool:[remain-2,remain-1,remain+1,remain+2,remain+3] };
      },
      function(){
        var boxes=randInt(2,6), perBox=randInt(2,5), total2=boxes*perBox;
        return { icon:'🍪', question:'Il y a ' + boxes + ' boîtes de gâteaux. Chaque boîte contient ' + perBox + ' gâteaux. Combien de gâteaux y a-t-il en tout ?', explain: boxes + ' × ' + perBox + ' = ' + total2 + ' gâteaux.', correct:total2, pool:[total2-4,total2-2,total2+2,total2+4,total2+6] };
      },
      function(){
        var paid=randInt(10,20), cost=randInt(1,paid-1), change=paid-cost;
        return { icon:'💰', question:'Tom paie avec un billet de ' + paid + '€ un jouet qui coûte ' + cost + '€. Combien de monnaie va-t-on lui rendre ?', explain: paid + '€ - ' + cost + '€ = ' + change + '€.', correct:change, pool:[change-2,change-1,change+1,change+2,change+3] };
      }
    ];
    var t = pick(templates)();
    var pool = t.pool.filter(function(v){ return v>=0; });
    return {
      tag:'Maths de la vie',
      question: t.question,
      sub:'Lis bien l\'énoncé avant de calculer.',
      explain: t.explain,
      draw:function(){
        var svg=document.getElementById('m4Svg'); svg.setAttribute('viewBox','0 0 200 200'); svg.innerHTML="";
        svg.appendChild(svgText(100,120,54,t.icon));
      },
      cols3:false,
      choices: numChoiceSet(t.correct, pool).map(function(v){ return { label:String(v), ok:v===t.correct }; })
    };
  }

  function genQuestion(){
    var lv = M4_LEVELS[globalLevel];
    var type = (m4TypeFilter!=='random' && lv.types.indexOf(m4TypeFilter)!==-1) ? m4TypeFilter : pick(lv.types);

    if(type==='sides' || type==='vertices'){
      var shapeKey = pick(lv.shapes);
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

    if(type==='name'){
      var shapeKey2 = pick(lv.shapes);
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

    if(type==='angle'){
      var cat = pick(['droit','aigu','obtus']);
      var gap = lv.angleGap;
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

    if(type==='calc'){
      var mode = pick(lv.calcModes || ['add']);
      var maxV = lv.calcMax || 10;
      if(mode==='missing'){
        // a + x = c : l'enfant retrouve x
        var a = randInt(0, maxV);
        var x = randInt(0, maxV - a);
        var c = a + x;
        return {
          tag: 'Calcul',
          question: 'Trouve x : ' + a + ' + x = ' + c,
          sub: 'Cherche le nombre qui manque pour que l\'égalité soit vraie.',
          explain: 'x = ' + c + ' - ' + a + ' = ' + x + ', car ' + a + ' + ' + x + ' = ' + c + '.',
          draw: function(){ drawEquation(a + ' + x = ' + c); },
          cols3: false,
          choices: numChoiceSet(x, [0,1,2,3,4,5,6,7,8,9,10,x+1,x+2,Math.max(0,x-1),Math.max(0,x-2)]).map(function(v){ return { label:String(v), ok: v===x }; })
        };
      }
      // addition simple : a + b
      var a2 = randInt(0, maxV);
      var b2 = randInt(0, maxV - a2);
      var sum = a2 + b2;
      return {
        tag: 'Calcul',
        question: 'Combien font ' + a2 + ' + ' + b2 + ' ?',
        sub: 'Calcule le résultat de cette addition.',
        explain: a2 + ' + ' + b2 + ' = ' + sum + '.',
        draw: function(){ drawEquation(a2 + ' + ' + b2 + ' = ?'); },
        cols3: false,
        choices: numChoiceSet(sum, [sum-2,sum-1,sum+1,sum+2,sum+3,Math.max(0,sum-3)].filter(function(v){return v>=0;})).map(function(v){ return { label:String(v), ok: v===sum }; })
      };
    }

    if(type==='align')      return genAlignQuestion();
    if(type==='milieu')     return genMilieuQuestion();
    if(type==='coord')      return genCoordQuestion();
    if(type==='coordFind')  return genCoordFindQuestion();
    if(type==='codage')     return genCodageQuestion();
    if(type==='decodage')   return genDecodageQuestion();
    if(type==='chasse')     return genChasseQuestion();
    if(type==='symAxe')     return genSymAxeQuestion();
    if(type==='symVrai')    return genSymVraiQuestion();
    if(type==='solideNom')  return genSolideNomQuestion();
    if(type==='solideCompte') return genSolideCompteQuestion();
    if(type==='monnaie')    return genMonnaieQuestion();
    if(type==='heure')      return genHeureQuestion('m4Svg', globalLevel);
    if(type==='enigme')     return genEnigmeQuestion();
    if(type==='vie')        return genVieQuestion();

    // type === 'image' : question basée sur une illustration fixe, tirée
    // d'un petit pool de scènes (prototype du circuit "images stockées",
    // voir la note sur le stockage d'images à côté du code)
    return pick(IMAGE_QUESTIONS)();
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
      b.textContent = c.label.charAt(0).toUpperCase()+c.label.slice(1);
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
      var okLabel = m4Current.choices.filter(function(c){return c.ok;})[0].label;
      buttons.forEach(function(b){ if(b.textContent.toLowerCase()===okLabel.toLowerCase()) b.classList.add('correct'); });
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

