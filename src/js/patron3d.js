  /* ===================== THÈME PATRON / SOLIDES 3D =====================
     Patron → Solide (animation 3D) et les questions de Quizz sur les solides.
  */

  /* ===================== MODULE 3 : PATRON -> CUBE ===================== */
  var S3 = 44;

  function faceChain(rootNum, steps){
    // steps: liste de {dx,dy} décrivant une chaîne parent -> enfant -> enfant...
    var faces = [];
    var prevId = 'r';
    for(var i=0;i<steps.length;i++){
      var id = 'n'+i;
      faces.push({id:id, parent:prevId, dx:steps[i][0], dy:steps[i][1], num:rootNum+1+i});
      prevId = id;
    }
    return faces;
  }

  // Chaque patron déclare maintenant "answer" : le solide qu'il forme une
  // fois plié ('cube', 'pave', 'pyramide') ou 'aucun' s'il reste un trou /
  // un chevauchement. Ça permet de poser une vraie question à choix
  // multiples ("quel solide ?") plutôt qu'un simple oui/non "cube ou pas".
  var NET_CROSS = {
    answer:'cube', gridW:4, gridH:3,
    root:{ id:'r', dx:1, dy:1, num:1 },
    faces:[
      {id:'n0', parent:'r',  dx:0, dy:-1, num:2},
      {id:'n1', parent:'r',  dx:0, dy:1,  num:3},
      {id:'n2', parent:'r',  dx:-1,dy:0,  num:4},
      {id:'n3', parent:'r',  dx:1, dy:0,  num:5},
      {id:'n4', parent:'n3', dx:1, dy:0,  num:6}
    ]
  };
  var NET_STRIP = {
    answer:'aucun', gridW:6, gridH:1,
    root:{ id:'r', dx:0, dy:0, num:1 },
    faces: faceChain(1, [[1,0],[1,0],[1,0],[1,0],[1,0]])
  };
  var NET_STAIRCASE = {
    answer:'cube', gridW:4, gridH:3,
    root:{ id:'r', dx:0, dy:0, num:1 },
    faces: faceChain(1, [[1,0],[0,1],[1,0],[0,1],[1,0]])
  };
  var NET_BLOCK2X3 = {
    answer:'aucun', gridW:2, gridH:3,
    root:{ id:'r', dx:0, dy:0, num:1 },
    faces:[
      {id:'n0', parent:'r',  dx:1, dy:0, num:2},
      {id:'n1', parent:'r',  dx:0, dy:1, num:3},
      {id:'n2', parent:'n1', dx:1, dy:0, num:4},
      {id:'n3', parent:'n1', dx:0, dy:1, num:5},
      {id:'n4', parent:'n3', dx:1, dy:0, num:6}
    ]
  };
  // Deux pièges qui portent sur le NOMBRE de faces plutôt que sur leur
  // disposition (contrairement à NET_STRIP/NET_BLOCK2X3 ci-dessus, qui ont
  // bien 6 faces mais mal arrangées) : ici, un cube "presque bon" auquel il
  // manque carrément une face (5 au lieu de 6, un vrai trou une fois plié),
  // et un cube avec une face EN TROP (7 au lieu de 6, qui se chevaucherait).
  // Utile pour vérifier que l'enfant compte vraiment les faces plutôt que
  // de reconnaître juste "une forme en croix" au premier coup d'oeil.
  var NET_CUBE_5FACES = {
    answer:'aucun', gridW:3, gridH:3,
    root:{ id:'r', dx:1, dy:1, num:1 },
    faces:[
      {id:'n0', parent:'r',  dx:0, dy:-1, num:2},
      {id:'n1', parent:'r',  dx:0, dy:1,  num:3},
      {id:'n2', parent:'r',  dx:-1,dy:0,  num:4},
      {id:'n3', parent:'r',  dx:1, dy:0,  num:5}
    ]
  };
  var NET_CUBE_7FACES = {
    answer:'aucun', gridW:4, gridH:4,
    root:{ id:'r', dx:1, dy:1, num:1 },
    faces:[
      {id:'n0', parent:'r',  dx:0, dy:-1, num:2},
      {id:'n1', parent:'r',  dx:0, dy:1,  num:3},
      {id:'n2', parent:'r',  dx:-1,dy:0,  num:4},
      {id:'n3', parent:'r',  dx:1, dy:0,  num:5},
      {id:'n4', parent:'n3', dx:1, dy:0,  num:6},
      {id:'n5', parent:'n1', dx:0, dy:1,  num:7}
    ]
  };
  // Un patron de pavé droit (parallélépipède) : il se referme bien en 3D,
  // mais ses faces ne sont pas toutes des carrés identiques comme sur un
  // cube -> "pave", une vraie 3e famille de solides à reconnaître.
  var NET_PAVE = {
    answer:'pave', gridAbsolute:true, stageW:272, stageH:168,
    root:{ id:'r', left:52, top:52, w:84, h:64, num:1 },
    faces:[
      {id:'n0', parent:'r',  dx:0, dy:-1, left:0,  top:-52, w:84, h:52, num:2}, // dessus
      {id:'n1', parent:'r',  dx:0, dy:1,  left:0,  top:64,  w:84, h:52, num:3}, // dessous
      {id:'n2', parent:'r',  dx:-1,dy:0,  left:-52,top:0,   w:52, h:64, num:4}, // côté
      {id:'n3', parent:'r',  dx:1, dy:0,  left:84, top:0,   w:52, h:64, num:5}, // côté
      {id:'n4', parent:'n3', dx:1, dy:0,  left:52, top:0,   w:84, h:64, num:6}  // arrière
    ]
  };
  // Pyramide à base carrée : 1 carré (la base) + 4 triangles, un sur chaque
  // côté, qui se replient (angle plus petit qu'un pli à 90°) pour se
  // rejoindre en un sommet.
  function pyramidFace(id, dir, dx, dy, left, top, w, h, num, angle){
    return { id:id, parent:'r', dx:dx, dy:dy, left:left, top:top, w:w, h:h, num:num, shape:'triangle', dir:dir, angle:angle };
  }
  // IMPORTANT : les 4 triangles sont des enfants DOM de la base ('r'), donc
  // leurs left/top (comme pour NET_PAVE plus haut) sont des coordonnées
  // CSS relatives à la boîte de la base elle-même (0,0 = coin haut-gauche
  // de la base), et NON des coordonnées absolues dans la scène — une
  // confusion qui faisait naguère cascader les 4 triangles en diagonale
  // au lieu de les coller sur les 4 côtés de la base (d'où le patron qui
  // ne se refermait pas du tout en pyramide une fois "plié").
  // L'angle de pliage (127,98°) n'est pas arbitraire, et n'est PAS le simple
  // angle "au-dessus de 90°" qu'on imaginerait à l'oeil : la base reste à
  // plat dans son plan d'origine, donc les 2 triangles haut/bas (qui
  // pivotent autour d'un axe X) ET les 2 triangles gauche/droite (qui
  // pivotent autour d'un axe Y) doivent amener leur pointe au MÊME point
  // dans l'espace 3D, devant le centre de la base (perpendiculairement à
  // son plan) — pas "au-dessus" comme on le dessinerait sur une feuille.
  // Avec une base de 64 (demi-base 32) et des triangles de hauteur 52, la
  // pointe ne revient exactement à la bonne distance qu'après une rotation
  // de 180° - arccos(32/52) ≈ 127,98° depuis la position bien à plat
  // (dépliée) — valeur retrouvée par calcul ET vérifiée en mesurant dans le
  // navigateur que les 4 pointes se superposent bien sous toutes les
  // rotations de caméra (voir historique : 52,02° tout seul, l'angle "au
  // premier coup d'oeil", ne refermait pas du tout la pyramide).
  var PYRAMID_FOLD_ANGLE = 127.98;
  var NET_PYRAMID = {
    answer:'pyramide', gridAbsolute:true, stageW:168, stageH:168,
    root:{ id:'r', left:52, top:52, w:64, h:64, num:1 },
    faces:[
      pyramidFace('n0','up',    0,-1, 0,  -52, 64, 52, 2, -PYRAMID_FOLD_ANGLE),
      pyramidFace('n1','down',  0, 1, 0,  64,  64, 52, 3,  PYRAMID_FOLD_ANGLE),
      pyramidFace('n2','left', -1, 0, -52,0,   52, 64, 4,  PYRAMID_FOLD_ANGLE),
      pyramidFace('n3','right', 1, 0, 64, 0,   52, 64, 5, -PYRAMID_FOLD_ANGLE)
    ]
  };
  // Même patron de pyramide, mais avec un triangle manquant : un vrai trou,
  // donc "aucun" solide fermé (piège pour le niveau difficile).
  var NET_PYRAMID_TROU = {
    answer:'aucun', gridAbsolute:true, stageW:168, stageH:168,
    root:{ id:'r', left:52, top:52, w:64, h:64, num:1 },
    faces:[
      pyramidFace('n0','up',    0,-1, 0,  -52, 64, 52, 2, -PYRAMID_FOLD_ANGLE),
      pyramidFace('n2','left', -1, 0, -52,0,   52, 64, 3,  PYRAMID_FOLD_ANGLE),
      pyramidFace('n3','right', 1, 0, 64, 0,   52, 64, 4, -PYRAMID_FOLD_ANGLE)
    ]
  };

  var M3_ANSWER_LABELS = { cube:'Cube', pave:'Pavé droit', pyramide:'Pyramide', aucun:'Aucun solide' };

  // Explication PROPRE à chaque patron (pédagogie : on dit précisément ce
  // qui se passe pour CE patron, au lieu d'une phrase générique), et petit
  // indice affiché pendant qu'il se plie. "noHighlight" : pour les patrons
  // auxquels il MANQUE une face, on ne surligne aucune face en rouge (il n'y
  // en a pas de "mal placée" : c'est l'absence d'une face qui pose problème).
  NET_CROSS.why = 'Ce patron est une croix de 6 carrés : un carré au centre, un au-dessus, un en dessous, un à gauche, et un dernier accroché à droite. En pliant, chaque carré devient une face et ils se referment sans se chevaucher : on obtient un cube (6 faces carrées).';
  NET_STRIP.why = 'Les 6 carrés sont alignés en une seule bande. En pliant, la bande s\'enroule sur elle-même : les carrés se recouvrent et il reste deux ouvertures. Pour fermer un cube, il faut des carrés placés tout autour, pas une simple bande.';
  NET_STRIP.hint = 'Regarde bien : en s\'enroulant, la bande se recouvre elle-même.';
  NET_STAIRCASE.why = 'Les 6 carrés forment un escalier. En pliant, chacun prend une place différente (dessus, dessous, devant, derrière, gauche, droite), sans trou ni chevauchement : c\'est bien un cube.';
  NET_BLOCK2X3.why = 'Ce patron a bien 6 carrés, mais ils sont serrés en un bloc de 2 sur 3. En pliant, deux carrés se retrouvent au même endroit pendant qu\'une autre place reste vide : ce n\'est pas un cube.';
  NET_BLOCK2X3.hint = 'Regarde bien : deux carrés vont se retrouver l\'un sur l\'autre.';
  NET_CUBE_5FACES.why = 'Ce patron n\'a que 5 carrés, alors qu\'un cube a besoin de 6 faces. Il manque une face : impossible de fermer le cube.';
  NET_CUBE_5FACES.hint = 'Compte les carrés : il n\'y en a que 5, il en faut 6 pour fermer un cube.';
  NET_CUBE_5FACES.noHighlight = true;
  NET_CUBE_7FACES.why = 'Ce patron a 7 carrés, soit un de trop : un cube n\'a que 6 faces. En pliant, un carré se retrouve au même endroit qu\'un autre.';
  NET_CUBE_7FACES.hint = 'Compte les carrés : il y en a 7, un cube n\'en a que 6.';
  NET_PAVE.why = 'Ce patron a 6 rectangles : en pliant, ils forment les 6 faces d\'une boîte (dessus, dessous et 4 côtés). Toutes les faces ne sont pas des carrés, donc ce n\'est pas un cube mais un pavé droit.';
  NET_PYRAMID.why = 'Un carré au centre (la base) et 4 triangles, un sur chaque côté du carré. En pliant, les 4 triangles se rejoignent en une pointe au-dessus de la base : c\'est une pyramide à base carrée.';
  NET_PYRAMID_TROU.why = 'Il n\'y a que 3 triangles autour du carré, alors qu\'une pyramide à base carrée en demande 4 (un par côté du carré). Il manque un triangle : la pyramide reste ouverte.';
  NET_PYRAMID_TROU.hint = 'Compte les triangles autour du carré : il n\'y en a que 3, il en faut 4.';
  NET_PYRAMID_TROU.noHighlight = true;

  // Chaque patron ("épreuve" du module Patron→Solide) est déclaré une fois
  // ici avec ses niveaux PAR DÉFAUT ; le panneau de réglages "Activités &
  // difficulté" peut ensuite surcharger ces niveaux (voir netLevelOverrides
  // / rebuildM3Pools plus bas dans l'orchestrateur), qui reconstruit alors
  // M3_LEVELS[*].pool à partir de ces définitions.
  var NET_DEFS = [
    { id:'cross',        obj:NET_CROSS,        label:'Croix (6 faces en croix)',            defaultLevels:[0,1,2],
      randomNote:'Le dessin de ce patron est toujours le même (fixe) ; c\'est seulement le CHOIX du patron parmi ceux du niveau qui est tiré au hasard. Se déplie en : Cube.' },
    { id:'strip',        obj:NET_STRIP,        label:'Bande de 6 faces alignées',            defaultLevels:[0,1],
      randomNote:'Patron fixe (toujours le même dessin) ; c\'est un piège, il ne se referme pas en solide. Se déplie en : Aucun solide.' },
    { id:'staircase',    obj:NET_STAIRCASE,    label:'Escalier (faces en zigzag)',           defaultLevels:[1,2],
      randomNote:'Patron fixe (toujours le même dessin). Se déplie en : Cube.' },
    { id:'block2x3',     obj:NET_BLOCK2X3,     label:'Bloc 2×3',                             defaultLevels:[1,2],
      randomNote:'Patron fixe (toujours le même dessin) ; c\'est un piège, il ne se referme pas en solide. Se déplie en : Aucun solide.' },
    { id:'pave',         obj:NET_PAVE,         label:'Pavé droit (boîte rectangulaire)',     defaultLevels:[0,1,2],
      randomNote:'Patron fixe (toujours le même dessin). Se déplie en : Pavé droit.' },
    { id:'pyramid',      obj:NET_PYRAMID,      label:'Pyramide à base carrée',               defaultLevels:[0,1,2],
      randomNote:'Patron fixe (toujours le même dessin). Se déplie en : Pyramide.' },
    { id:'pyramid_trou', obj:NET_PYRAMID_TROU, label:'Pyramide avec un triangle manquant',   defaultLevels:[2],
      randomNote:'Patron fixe (toujours le même dessin) ; c\'est un piège volontaire pour le niveau Difficile, il reste un trou. Se déplie en : Aucun solide.' },
    { id:'cube_5faces',  obj:NET_CUBE_5FACES,  label:'Presque un cube, mais 5 faces',        defaultLevels:[1,2],
      randomNote:'Patron fixe (toujours le même dessin) ; il manque carrément une face (5 au lieu de 6), pas juste une histoire de disposition. Se déplie en : Aucun solide.' },
    { id:'cube_7faces',  obj:NET_CUBE_7FACES,  label:'Presque un cube, mais 7 faces',        defaultLevels:[2],
      randomNote:'Patron fixe (toujours le même dessin) ; une face EN TROP (7 au lieu de 6) qui se chevaucherait au pliage. Se déplie en : Aucun solide.' }
  ];
  // pool rempli par rebuildM3Pools() (appelée après le chargement des
  // éventuelles surcharges manuelles, voir plus bas) — jamais laissé vide.
  var M3_LEVELS = [
    { name:'Facile',    pool:[] },
    { name:'Moyen',     pool:[] },
    { name:'Difficile', pool:[] }
  ];

  function foldRule(dx,dy){
    if(dx===1 && dy===0)  return {origin:'0% 50%',   axis:'Y', angle:-90};
    if(dx===-1&& dy===0)  return {origin:'100% 50%', axis:'Y', angle:90};
    if(dx===0 && dy===-1) return {origin:'50% 100%', axis:'X', angle:-90};
    if(dx===0 && dy===1)  return {origin:'50% 0%',    axis:'X', angle:90};
    return {origin:'50% 50%', axis:'Y', angle:0};
  }
  function trianglePoints(dir){
    if(dir==='up')    return 'polygon(0% 100%, 100% 100%, 50% 0%)';
    if(dir==='down')  return 'polygon(0% 0%, 100% 0%, 50% 100%)';
    if(dir==='left')  return 'polygon(100% 0%, 100% 100%, 0% 50%)';
    return 'polygon(0% 0%, 0% 100%, 100% 50%)'; // 'right'
  }

  var palette = ['var(--accent2)','var(--accent3)','var(--accent)','var(--accent2)','var(--accent3)'];
  // Palette fixe (indépendante du thème) pour le patron 3D : une couleur
  // par face numérotée (1 à 6), pour bien voir quel petit carré devient
  // quelle face du solide une fois le pliage terminé.
  var NET_PALETTE = ['#FF8FAE','#FFC168','#FFE985','#8FE3A6','#8FC5FF','#C6A8FF'];

  function buildNet(net){
    var stage = document.getElementById('netEl');
    stage.innerHTML = "";
    var elems = {};

    if(net.gridAbsolute){
      stage.style.width = net.stageW+'px';
      stage.style.height = net.stageH+'px';
    } else {
      stage.style.width = (net.gridW*S3)+'px';
      stage.style.height = (net.gridH*S3)+'px';
    }

    var rootDiv = document.createElement('div');
    rootDiv.className = 'face';
    var rw = net.gridAbsolute ? net.root.w : S3;
    var rh = net.gridAbsolute ? net.root.h : S3;
    rootDiv.style.width = rw+'px'; rootDiv.style.height = rh+'px';
    rootDiv.style.left = (net.gridAbsolute ? net.root.left : net.root.dx*S3)+'px';
    rootDiv.style.top  = (net.gridAbsolute ? net.root.top  : net.root.dy*S3)+'px';
    rootDiv.style.background = NET_PALETTE[(net.root.num-1) % NET_PALETTE.length];
    rootDiv.textContent = net.root.num;
    stage.appendChild(rootDiv);
    elems[net.root.id] = rootDiv;

    // Les faces sont toujours listées dans un ordre où le parent existe déjà
    // (chaque face suit son parent dans le tableau), donc une seule passe suffit.
    net.faces.forEach(function(f){
      var parentEl = elems[f.parent] || rootDiv;
      var div = document.createElement('div');
      div.className = 'face';
      var fw = net.gridAbsolute ? f.w : S3;
      var fh = net.gridAbsolute ? f.h : S3;
      div.style.width = fw+'px'; div.style.height = fh+'px';
      div.style.left = (net.gridAbsolute ? f.left : f.dx*S3)+'px';
      div.style.top  = (net.gridAbsolute ? f.top  : f.dy*S3)+'px';
      div.style.background = NET_PALETTE[(f.num-1) % NET_PALETTE.length];
      div.textContent = f.num;
      if(f.shape==='triangle'){
        div.style.clipPath = trianglePoints(f.dir);
        div.classList.add('face-tri');
      }
      var rule = foldRule(f.dx,f.dy);
      // Un patron peut imposer son propre angle de pliage (ex : une pyramide
      // se replie moins qu'à 90°, pour que les triangles se rejoignent en
      // pointe au lieu de se refermer à plat comme un cube).
      var angle = (typeof f.angle === 'number') ? f.angle : rule.angle;
      div.dataset.axis = rule.axis;
      div.dataset.angle = angle;
      div.dataset.flatOrigin = rule.origin;
      parentEl.appendChild(div);
      elems[f.id] = div;
    });
    return elems;
  }

  function depthOf(node){
    var d=0, p=node.parentElement;
    while(p && p.classList && p.classList.contains('face')){ d++; p=p.parentElement; }
    return d;
  }

  function foldNet(elems, rootId, fold){
    var maxDepth = 0;
    Object.keys(elems).forEach(function(id){
      var d = elems[id];
      if(id === rootId || !d.dataset.axis) return;
      var depth = depthOf(d);
      maxDepth = Math.max(maxDepth, depth);
      d.style.transformOrigin = d.dataset.flatOrigin;
      if(fold){
        d.style.transitionDelay = (0.22*depth)+'s';
        d.style.transform = d.dataset.axis==='Y'
          ? 'rotateY('+d.dataset.angle+'deg)'
          : 'rotateX('+d.dataset.angle+'deg)';
      } else {
        d.style.transitionDelay = '0s';
        d.style.transform = 'none';
        d.classList.remove('broken');
      }
    });
    var netEl = document.getElementById('netEl');
    // Centrage : la face racine (root) ne bouge jamais pendant le pliage —
    // c'est donc elle qui doit finir pile au centre de la scène, quelle que
    // soit sa position dans le patron à plat (au milieu comme NET_CROSS, ou
    // tout en haut à gauche comme NET_STAIRCASE). On calcule sa position
    // réelle à partir de la définition du patron (currentNet), au lieu
    // d'un décalage approximatif fixe qui ne marchait bien que pour un seul
    // patron et laissait les autres "collés" en haut à gauche.
    // #netSpin (le parent qui tourne au doigt) a par défaut son axe de
    // rotation au centre de SA propre boîte, qui a la même taille que
    // #netEl : en amenant la racine exactement à ce centre, la rotation
    // pivote donc naturellement autour du milieu du solide assemblé.
    var net = currentNet;
    var rw = net.gridAbsolute ? net.root.w : S3;
    var rh = net.gridAbsolute ? net.root.h : S3;
    var rootLeft = net.gridAbsolute ? net.root.left : net.root.dx*S3;
    var rootTop  = net.gridAbsolute ? net.root.top  : net.root.dy*S3;
    var vx = netEl.offsetWidth/2  - (rootLeft + rw/2);
    var vy = netEl.offsetHeight/2 - (rootTop  + rh/2);
    netEl.style.transform = fold
      ? 'translate3d('+vx+'px,'+vy+'px,0)'
      : 'none';
    return maxDepth;
  }

  var currentNet = null, currentElems = null, currentRootId = null, answered = false;

  /* ---- rotation manuelle au doigt, une fois le pliage terminé ---- */
  var m3Spin = { x:0, y:0 };
  var m3CanSpin = false;
  var m3Dragging = false;
  var m3DragStart = null;
  var m3Gen = 0;

  function applySpin(){
    document.getElementById('netSpin').style.transform =
      'rotateX(' + m3Spin.x + 'deg) rotateY(' + m3Spin.y + 'deg)';
  }
  function setSpinEnabled(on){
    m3CanSpin = on;
    document.getElementById('stage').classList.toggle('spinnable', on);
  }

  (function initSpinDrag(){
    var stageEl = document.getElementById('stage');
    stageEl.addEventListener('pointerdown', function(ev){
      if(!m3CanSpin) return;
      m3Dragging = true;
      stageEl.setPointerCapture(ev.pointerId);
      m3DragStart = { x:ev.clientX, y:ev.clientY, sx:m3Spin.x, sy:m3Spin.y };
    });
    stageEl.addEventListener('pointermove', function(ev){
      if(!m3Dragging || !m3DragStart) return;
      var dx = ev.clientX - m3DragStart.x;
      var dy = ev.clientY - m3DragStart.y;
      m3Spin.y = m3DragStart.sy + dx * 0.5;
      m3Spin.x = Math.max(-80, Math.min(80, m3DragStart.sx - dy * 0.5));
      applySpin();
    });
    function endDrag(){ m3Dragging = false; m3DragStart = null; }
    stageEl.addEventListener('pointerup', endDrag);
    stageEl.addEventListener('pointercancel', endDrag);
  })();

  function loadNet(net){
    currentNet = net;
    currentRootId = net.root.id;
    answered = false;
    m3Gen++;
    setSpinEnabled(false);
    m3Spin = { x:0, y:0 };
    applySpin();
    currentElems = buildNet(net);
    var wrap = document.getElementById('m3-choices');
    wrap.innerHTML = '';
    ['cube','pave','pyramide','aucun'].forEach(function(key){
      var b = document.createElement('button');
      b.className = 'choice-btn';
      b.type = 'button';
      b.textContent = M3_ANSWER_LABELS[key];
      b.addEventListener('click', function(){ answerNet(key, b); });
      wrap.appendChild(b);
    });
    document.getElementById('m3-next').hidden = true;
    var fb = document.getElementById('m3-feedback');
    fb.className='feedback'; fb.textContent='';
    document.getElementById('m3-sub').textContent = 'Observe les faces à plat, puis choisis le bon solide.';
  }

  function pickNetForLevel(idx){
    var pool = M3_LEVELS[idx].pool;
    return pool[Math.floor(Math.random()*pool.length)];
  }

  function netExplain(net){
    if(net.why) return net.why;
    if(net.answer==='cube') return 'Un cube a 6 faces carrées identiques, qui se referment sans trou ni chevauchement.';
    if(net.answer==='pave') return 'Un pavé droit (une boîte rectangulaire) a 6 faces rectangulaires, mais elles ne sont pas toutes des carrés identiques comme sur un cube.';
    if(net.answer==='pyramide') return 'Une pyramide à base carrée a 1 face carrée (la base) et 4 faces triangulaires qui se rejoignent toutes en un seul sommet, en haut.';
    return 'Ce patron ne se referme pas en un solide.';
  }

  function answerNet(userChoice, btn){
    if(answered) return;
    answered = true;
    var buttons = document.querySelectorAll('#m3-choices .choice-btn');
    buttons.forEach(function(b){ b.disabled = true; });
    var correct = (userChoice === currentNet.answer);
    var fb = document.getElementById('m3-feedback');
    if(correct){
      btn.classList.add('correct');
      fb.className = 'feedback tappable good show';
      fb.innerHTML = '<div>✔ Exact, c\'est bien "' + M3_ANSWER_LABELS[currentNet.answer] + '" !</div><div class="explain-line">'+netExplain(currentNet)+'</div>';
      addStar(1);
    } else {
      btn.classList.add('wrong');
      buttons.forEach(function(b){ if(b.textContent === M3_ANSWER_LABELS[currentNet.answer]) b.classList.add('correct'); });
      fb.className = 'feedback tappable bad show';
      fb.innerHTML = '<div>✘ Pas tout à fait : la bonne réponse était "' + M3_ANSWER_LABELS[currentNet.answer] + '".</div><div class="explain-line">'+netExplain(currentNet)+'</div>';
    }
    playSound(correct?'good':'bad');
    celebrate(correct?'good':'bad', fb);
    onPracticeAnswered(correct);

    var maxDepth = foldNet(currentElems, currentRootId, true);
    var genAtAnswer = m3Gen;
    if(currentNet.answer==='aucun'){
      document.getElementById('m3-sub').textContent = currentNet.hint || 'Regarde bien : une face (en rouge) ne se pose pas au bon endroit.';
    } else {
      document.getElementById('m3-sub').textContent = 'Regarde-le se refermer doucement...';
    }
    document.getElementById('m3-next').hidden = false;

    var totalMs = 220*maxDepth + 1800 + 300;
    setTimeout(function(){
      if(genAtAnswer !== m3Gen) return; // un autre patron a été chargé entre-temps
      if(currentNet.answer==='aucun' && !currentNet.noHighlight){
        var deepestId = null, deepestDepth = -1;
        Object.keys(currentElems).forEach(function(id){
          var d = depthOf(currentElems[id]);
          if(d>deepestDepth){ deepestDepth=d; deepestId=id; }
        });
        if(deepestId) currentElems[deepestId].classList.add('broken');
      }
      // Le pliage est fini : on laisse maintenant l'enfant tourner l'objet
      // lui-même au doigt, plutôt qu'une rotation automatique.
      m3Spin = { x:-16, y:-24 };
      applySpin();
      setSpinEnabled(true);
      document.getElementById('m3-sub').textContent += ' Fais glisser ton doigt sur la forme pour la tourner !';
    }, totalMs);
  }

  document.getElementById('m3-next').addEventListener('click', nextPracticeQuestion);
  // Toucher l'explication passe à la question suivante (comme dans les autres familles).
  enableTapToContinue('m3-feedback', nextPracticeQuestion);

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

