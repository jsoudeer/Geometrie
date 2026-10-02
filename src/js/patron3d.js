  /* ===================== THÈME PATRON / SOLIDES 3D =====================
     Patron → Solide (animation 3D) et les questions de Quizz sur les solides.
  */

  /* ===================== MODULE 3 : PATRON -> SOLIDE =====================
     Un petit moteur 3D maison (SVG, sans bibliothèque).
     - Un patron n'est qu'une liste de polygones posés à plat (en unités : un
       carré de cube mesure 1). Les charnières sont trouvées toutes seules :
       deux faces qui partagent un bord sont reliées, et un parcours en
       largeur depuis la face de départ donne l'ordre de pliage.
     - Chaque face tourne autour de sa charnière d'un angle qui dépend du
       solide (90° pour une boîte, 120° entre deux rectangles d'un prisme…),
       toujours du même côté : la face imprimée (avec son numéro) finit dehors.
     - Une fois tout plié, on VÉRIFIE le résultat au lieu de le supposer :
       deux faces au même endroit = une face EN TROP (hachurée, soulevée) ;
       un tour de bords libres = une face MANQUANTE (contour en pointillés).
       La bonne réponse de chaque patron (solide ou « aucun ») se déduit de
       ce calcul : impossible de se tromper en ajoutant un patron.
     - Code couleur : la couleur dit la FORME de la face (carré bleu,
       rectangle vert, triangle jaune), le numéro permet de suivre chaque
       face ; l'intérieur du solide est couleur papier. Les problèmes ont
       leur propre marque, jamais la seule couleur : hachures + « en trop »,
       pointillés + « ? » (RGAA 3.1). */

  var M3_ANSWER_LABELS = { cube:'Cube', pave:'Pavé droit', pyramide:'Pyramide', prisme:'Prisme', aucun:'Aucun solide' };
  var M3_ANSWER_ORDER = ['cube','pave','pyramide','prisme','aucun'];
  var M3_KIND_COLORS = { carre:['#7FC2F2','#A9D6F7'], rect:['#7FD49D','#AEE5C1'], tri:['#FFCB5C','#FFDE95'] };
  var M3_KIND_NAMES = { carre:['carré','carrés'], rect:['rectangle','rectangles'], tri:['triangle','triangles'] };
  var M3_INSIDE = '#F2E6D4';
  var M3_EDGE = '#3B2A20';
  var SQ3 = Math.sqrt(3)/2;

  // ---- petite algèbre 3D : une transformation = rotation r (3×3) + translation t ----
  var T_ID = { r:[1,0,0, 0,1,0, 0,0,1], t:[0,0,0] };
  function tApply(T, p){
    var r = T.r;
    return [r[0]*p[0]+r[1]*p[1]+r[2]*p[2]+T.t[0], r[3]*p[0]+r[4]*p[1]+r[5]*p[2]+T.t[1], r[6]*p[0]+r[7]*p[1]+r[8]*p[2]+T.t[2]];
  }
  function tRot(T, p){ var r = T.r; return [r[0]*p[0]+r[1]*p[1]+r[2]*p[2], r[3]*p[0]+r[4]*p[1]+r[5]*p[2], r[6]*p[0]+r[7]*p[1]+r[8]*p[2]]; }
  function tCompose(A, B){   // A ∘ B
    var a = A.r, b = B.r, r = [];
    for(var i=0;i<3;i++) for(var j=0;j<3;j++) r[i*3+j] = a[i*3]*b[j] + a[i*3+1]*b[3+j] + a[i*3+2]*b[6+j];
    var t = tRot(A, B.t);
    return { r:r, t:[t[0]+A.t[0], t[1]+A.t[1], t[2]+A.t[2]] };
  }
  // rotation d'angle `deg` autour de la droite passant par a, de direction b-a (formule de Rodrigues)
  function tAxisRot(a, b, deg){
    var u = [b[0]-a[0], b[1]-a[1], b[2]-a[2]], n = Math.hypot(u[0],u[1],u[2]);
    u = [u[0]/n, u[1]/n, u[2]/n];
    var th = deg*Math.PI/180, c = Math.cos(th), s = Math.sin(th), k = 1-c, x = u[0], y = u[1], z = u[2];
    var r = [c+x*x*k, x*y*k-z*s, x*z*k+y*s, y*x*k+z*s, c+y*y*k, y*z*k-x*s, z*x*k-y*s, z*y*k+x*s, c+z*z*k];
    var ra = tRot({ r:r }, a);
    return { r:r, t:[a[0]-ra[0], a[1]-ra[1], a[2]-ra[2]] };
  }
  function vKey(p){ return p.map(function(v){ return Math.round(v*1000); }).join(','); }

  // ---- construction d'un patron à partir de ses polygones ----
  // Le plan du patron : x vers la droite, y vers le BAS (comme sur la feuille) ;
  // dans l'espace, la feuille est le plan z = 0 et on la regarde depuis z > 0.
  function flatTo3(p){ return [p[0], -p[1], 0]; }
  function faceKind(pts){
    if(pts.length===3) return 'tri';
    var a = Math.hypot(pts[1][0]-pts[0][0], pts[1][1]-pts[0][1]), b = Math.hypot(pts[2][0]-pts[1][0], pts[2][1]-pts[1][1]);
    return Math.abs(a-b) < 1e-6 ? 'carre' : 'rect';
  }
  function sharedEdge(P, Q){
    for(var i=0;i<P.length;i++){
      var a = P[i], b = P[(i+1)%P.length];
      for(var j=0;j<Q.length;j++){
        var c = Q[j], d = Q[(j+1)%Q.length];
        if(vKey(a)===vKey(d) && vKey(b)===vKey(c)) return [a, b];
        if(vKey(a)===vKey(c) && vKey(b)===vKey(d)) return [a, b];
      }
    }
    return null;
  }
  // polys : liste de polygones [[x,y],…] ; opts.solid : cube | pave | pyramide | tetra | prisme ;
  // opts.root : indice de la face qui reste à plat (par défaut, celle qui a le plus de voisines).
  function makeNet(id, polys, opts){
    var faces = polys.map(function(pts, i){ return { i:i, pts:pts, kind:faceKind(pts), num:i+1, parent:-1, hinge:null }; });
    var nb = faces.map(function(){ return []; });
    for(var i=0;i<faces.length;i++) for(var j=i+1;j<faces.length;j++){
      var e = sharedEdge(faces[i].pts, faces[j].pts);
      if(e){ nb[i].push({ j:j, e:e }); nb[j].push({ j:i, e:e }); }
    }
    var root = typeof opts.root==='number' ? opts.root : 0;
    if(typeof opts.root!=='number') nb.forEach(function(l, i){ if(l.length > nb[root].length) root = i; });
    var order = [root], seen = {}; seen[root] = true;
    for(var q=0; q<order.length; q++){
      nb[order[q]].forEach(function(n){
        if(seen[n.j]) return;
        seen[n.j] = true; order.push(n.j);
        faces[n.j].parent = order[q]; faces[n.j].hinge = n.e;
      });
    }
    // numéros dans l'ordre de pliage : 1 = la face qui reste à plat
    order.forEach(function(fi, k){ faces[fi].num = k+1; });
    var net = { id:id, faces:faces, order:order, root:root, solid:opts.solid, why:opts.why };
    faces.forEach(function(f){
      if(f.parent < 0) return;
      var a = flatTo3(f.hinge[0]), b = flatTo3(f.hinge[1]);
      f.angle = foldAngle(opts.solid, faces[f.parent].kind, f.kind);
      // sens : la face doit passer SOUS la feuille (z < 0) pour que le côté imprimé reste dehors
      var c = flatTo3(polyCenter(f.pts)), rc = tApply(tAxisRot(a, b, 30), c);
      f.sign = rc[2] < 0 ? 1 : -1;
      f.a3 = a; f.b3 = b;
    });
    net.analysis = analyseNet(net);
    net.answer = net.analysis.closed ? (opts.solid==='tetra' ? 'pyramide' : opts.solid) : 'aucun';
    return net;
  }
  function polyCenter(pts){
    var x=0, y=0; pts.forEach(function(p){ x+=p[0]; y+=p[1]; });
    return [x/pts.length, y/pts.length];
  }
  // Angle dont une face tourne autour de sa charnière (180° − angle entre les deux faces du solide).
  var ANG_PYR_BASE = 180 - Math.acos((0.5)/SQ3)*180/Math.PI;     // triangle équilatéral sur base carrée : ≈ 125,3°
  var ANG_PYR_SIDE = 180 - Math.acos(-1/3)*180/Math.PI;           // entre deux triangles de cette pyramide : ≈ 70,5°
  var ANG_TETRA = 180 - Math.acos(1/3)*180/Math.PI;               // tétraèdre régulier : ≈ 109,5°
  function foldAngle(solid, parentKind, childKind){
    if(solid==='pyramide') return (parentKind==='tri' && childKind==='tri') ? ANG_PYR_SIDE : ANG_PYR_BASE;
    if(solid==='tetra') return ANG_TETRA;
    if(solid==='prisme') return (parentKind!=='tri' && childKind!=='tri') ? 120 : 90;
    return 90;
  }

  // Position de chaque face pour un avancement de pliage s[i] ∈ [0,1].
  function netTransforms(net, s){
    var T = [];
    net.order.forEach(function(fi){
      var f = net.faces[fi];
      if(f.parent < 0){ T[fi] = T_ID; return; }
      T[fi] = tCompose(T[f.parent], tAxisRot(f.a3, f.b3, f.sign * f.angle * s[fi]));
    });
    return T;
  }
  function faceWorld(net, T, fi){ return net.faces[fi].pts.map(function(p){ return tApply(T[fi], flatTo3(p)); }); }

  // ---- vérification du solide plié ----
  function analyseNet(net){
    var s = net.faces.map(function(){ return 1; }), T = netTransforms(net, s);
    var world = net.faces.map(function(f, fi){ return faceWorld(net, T, fi); });
    var byKey = {}, dups = [];
    world.forEach(function(pts, fi){
      var k = pts.map(vKey).sort().join('|');
      if(byKey[k] === undefined) byKey[k] = fi; else dups.push({ face:fi, over:byKey[k] });
    });
    var isDup = {}; dups.forEach(function(d){ isDup[d.face] = true; });
    var edges = {}, pos = {};
    world.forEach(function(pts, fi){
      if(isDup[fi]) return;
      pts.forEach(function(p, k){
        var q = pts[(k+1)%pts.length], a = vKey(p), b = vKey(q), key = a < b ? a+'#'+b : b+'#'+a;
        pos[a] = p; pos[b] = q;
        edges[key] = (edges[key] || 0) + 1;
      });
    });
    // bords libres (utilisés une seule fois) → on les enchaîne en contours de trous
    var free = Object.keys(edges).filter(function(k){ return edges[k]===1; });
    var adj = {};
    free.forEach(function(k){ var ab = k.split('#'); (adj[ab[0]] = adj[ab[0]] || []).push(ab[1]); (adj[ab[1]] = adj[ab[1]] || []).push(ab[0]); });
    var used = {}, holes = [], loose = [];
    free.forEach(function(k){
      if(used[k]) return;
      var ab = k.split('#'), loop = [ab[0]], cur = ab[1], prev = ab[0]; used[k] = true;
      var guard = 0, ok = true;
      while(cur !== loop[0] && guard++ < 50){
        loop.push(cur);
        var nxt = (adj[cur] || []).filter(function(n){ var kk = n < cur ? n+'#'+cur : cur+'#'+n; return n!==prev && !used[kk]; })[0];
        if(nxt===undefined){ ok = false; break; }
        var kk = nxt < cur ? nxt+'#'+cur : cur+'#'+nxt; used[kk] = true;
        prev = cur; cur = nxt;
      }
      var pts = loop.map(function(v){ return pos[v]; });
      if(ok && pts.length >= 3 && isPlanar(pts)) holes.push(pts); else loose.push(pts);
    });
    return { closed: dups.length===0 && free.length===0, dups:dups, holes:holes, loose:loose, freeCount:free.length };
  }
  function isPlanar(pts){
    var a = pts[0], b = pts[1], c = null;
    for(var i=2;i<pts.length && !c;i++){
      var n0 = cross3(sub3(b,a), sub3(pts[i],a));
      if(Math.hypot(n0[0],n0[1],n0[2]) > 1e-6) c = n0;
    }
    if(!c) return false;
    return pts.every(function(p){ return Math.abs(dot3(c, sub3(p,a))) < 1e-3; });
  }
  function sub3(a,b){ return [a[0]-b[0], a[1]-b[1], a[2]-b[2]]; }
  function dot3(a,b){ return a[0]*b[0]+a[1]*b[1]+a[2]*b[2]; }
  function cross3(a,b){ return [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]]; }

  // ---- fabriques de patrons ----
  // Grille de rectangles : 'X' = une face, '/' = ligne suivante ; colW / rowH : largeurs
  // de colonnes et hauteurs de lignes (1 par défaut) pour les pavés.
  function gridPolys(pattern, colW, rowH){
    colW = colW || []; rowH = rowH || [];
    function at(arr, n){ var v = 0; for(var i=0;i<n;i++) v += (arr[i]||1); return v; }
    var polys = [];
    pattern.split('/').forEach(function(line, r){
      for(var c=0;c<line.length;c++) if(line[c]==='X'){
        var x = at(colW, c), y = at(rowH, r), w = colW[c]||1, h = rowH[r]||1;
        polys.push([[x,y],[x+w,y],[x+w,y+h],[x,y+h]]);
      }
    });
    return polys;
  }
  // Triangle équilatéral posé sur le bord a→b, du côté opposé au point `inside`.
  function triOn(a, b, inside){
    var m = [(a[0]+b[0])/2, (a[1]+b[1])/2], d = [b[0]-a[0], b[1]-a[1]], L = Math.hypot(d[0], d[1]);
    var n = [-d[1]/L, d[0]/L];
    if((inside[0]-m[0])*n[0] + (inside[1]-m[1])*n[1] > 0) n = [-n[0], -n[1]];
    return [a, b, [m[0]+n[0]*L*SQ3, m[1]+n[1]*L*SQ3]];
  }
  function sqBase(){ return [[0,0],[1,0],[1,1],[0,1]]; }
  function pyramidPolys(sides, extra){
    var base = sqBase(), c = [0.5,0.5], polys = [base];
    sides.forEach(function(k){ polys.push(triOn(base[k], base[(k+1)%4], c)); });
    // extra : [indice d'un triangle déjà posé (1…), côté 1 ou 2] → triangle accroché à un triangle
    (extra || []).forEach(function(x){
      var t = polys[x[0]], a = t[x[1]===1 ? 1 : 2], b = t[x[1]===1 ? 2 : 0];
      polys.push(triOn(a, b, polyCenter(t)));
    });
    return polys;
  }
  function prismPolys(L, tops, bottoms){
    var polys = [0,1,2].map(function(i){ return [[i,0],[i+1,0],[i+1,L],[i,L]]; });
    tops.forEach(function(i){ polys.push(triOn([i,0],[i+1,0],[i+0.5,L/2])); });
    bottoms.forEach(function(i){ polys.push(triOn([i,L],[i+1,L],[i+0.5,L/2])); });
    return polys;
  }
  function tetraPolys(kind){
    var h = SQ3;
    if(kind==='bande') return [[[0,0],[1,0],[0.5,h]], [[1,0],[1.5,h],[0.5,h]], [[1,0],[2,0],[1.5,h]], [[2,0],[2.5,h],[1.5,h]]];
    // grand triangle partagé en 4 (pointe en haut)
    var A = [0,2*h], B = [2,2*h], C = [1,0], ab = [1,2*h], bc = [1.5,h], ca = [0.5,h];
    return [[ab,bc,ca], [A,ab,ca], [ab,B,bc], [ca,bc,C]];
  }
  var PAVE_W = 1.6, PAVE_D = 1, PAVE_H = 1.2;

  // ---- catalogue des patrons (niveaux par défaut réglables dans « Activités & difficulté ») ----
  function netDef(id, group, label, levels, polys, opts){
    return { id:id, group:group, label:label, defaultLevels:levels, obj:makeNet(id, polys, opts) };
  }
  var NET_DEFS = [
    netDef('cube_croix',   'cube', 'Cube : la croix',                    [0,1,2], gridPolys('.X../XXXX/.X..'), { solid:'cube' }),
    netDef('cube_t',       'cube', 'Cube : le T',                        [1,2],   gridPolys('X.../XXXX/X...'), { solid:'cube' }),
    netDef('cube_l',       'cube', 'Cube : 1-4-1 décalé',               [1,2],   gridPolys('X.../XXXX/.X..'), { solid:'cube' }),
    netDef('cube_z',       'cube', 'Cube : 1-4-1 en Z',                 [2],     gridPolys('X.../XXXX/..X.'), { solid:'cube' }),
    netDef('cube_coins',   'cube', 'Cube : 1-4-1 aux deux bouts',       [2],     gridPolys('X.../XXXX/...X'), { solid:'cube' }),
    netDef('cube_milieu',  'cube', 'Cube : 1-4-1 au milieu',            [1,2],   gridPolys('.X../XXXX/..X.'), { solid:'cube' }),
    netDef('cube_231a',    'cube', 'Cube : 2-3-1',                       [2],     gridPolys('XX../.XXX/.X..'), { solid:'cube' }),
    netDef('cube_231b',    'cube', 'Cube : 2-3-1 (bis)',                 [2],     gridPolys('XX../.XXX/..X.'), { solid:'cube' }),
    netDef('cube_231c',    'cube', 'Cube : 2-3-1 (ter)',                 [2],     gridPolys('XX../.XXX/...X'), { solid:'cube' }),
    netDef('cube_escalier','cube', 'Cube : l\'escalier 2-2-2',           [1,2],   gridPolys('XX../.XX./..XX'), { solid:'cube' }),
    netDef('cube_33',      'cube', 'Cube : 3-3',                         [2],     gridPolys('XXX../..XXX'), { solid:'cube' }),
    netDef('pave_t',       'pave', 'Pavé droit : le T',                  [0,1,2], gridPolys('X.../XXXX/X...', [PAVE_W,PAVE_D,PAVE_W,PAVE_D], [PAVE_D,PAVE_H,PAVE_D]), { solid:'pave' }),
    netDef('pave_z',       'pave', 'Pavé droit : en Z',                  [1,2],   gridPolys('.X../XXXX/...X', [PAVE_D,PAVE_W,PAVE_D,PAVE_W], [PAVE_D,PAVE_H,PAVE_D]), { solid:'pave' }),
    netDef('pyr_etoile',   'pyramide', 'Pyramide : l\'étoile',           [0,1,2], pyramidPolys([0,1,2,3]), { solid:'pyramide' }),
    netDef('pyr_eventail', 'pyramide', 'Pyramide : un triangle accroché à un autre', [1,2], pyramidPolys([0,1,2], [[3,1]]), { solid:'pyramide' }),
    netDef('tetra_grand',  'pyramide', 'Pyramide à base triangulaire : le grand triangle', [2], tetraPolys('grand'), { solid:'tetra', root:0 }),
    netDef('tetra_bande',  'pyramide', 'Pyramide à base triangulaire : la bande',          [2], tetraPolys('bande'), { solid:'tetra' }),
    netDef('prisme_face',  'prisme', 'Prisme : triangles face à face',   [1,2],   prismPolys(1.6, [1], [1]), { solid:'prisme', root:1 }),
    netDef('prisme_decale','prisme', 'Prisme : triangles décalés',       [2],     prismPolys(1.6, [0], [2]), { solid:'prisme', root:1 }),
    // pièges : ils ne se referment pas (trou, face en trop, ou les deux)
    netDef('piege_bande',  'piege', 'Piège : bande de 6 carrés',         [0,1],   gridPolys('XXXXXX'), { solid:'cube', root:0 }),
    netDef('piege_5',      'piege', 'Piège : seulement 5 carrés',        [0,1,2], gridPolys('.X../XXX./.X..'), { solid:'cube' }),
    netDef('piege_7',      'piege', 'Piège : 7 carrés',                  [2],     gridPolys('.X../XXXX/.X../.X..'), { solid:'cube' }),
    netDef('piege_bloc',   'piege', 'Piège : bloc de 2 × 3',             [1,2],   gridPolys('XX/XX/XX'), { solid:'cube' }),
    netDef('piege_carre',  'piege', 'Piège : 4 carrés en carré',         [2],     gridPolys('XX../XXXX'), { solid:'cube' }),
    netDef('piege_cote',   'piege', 'Piège : deux carrés du même côté',  [1,2],   gridPolys('X.X./XXXX'), { solid:'cube' }),
    netDef('piege_pyr3',   'piege', 'Piège : pyramide à 3 triangles',    [2],     pyramidPolys([0,1,2]), { solid:'pyramide' }),
    netDef('piege_pyr5',   'piege', 'Piège : pyramide à 5 triangles',    [2],     pyramidPolys([0,1,2,3], [[1,1]]), { solid:'pyramide' }),
    netDef('piege_prisme', 'piege', 'Piège : prisme, deux triangles en haut', [2], prismPolys(1.6, [0,2], []), { solid:'prisme', root:1 })
  ];
  var M3_GROUPS = [
    { id:'cube', label:'🧊 Cubes' }, { id:'pave', label:'📦 Pavés droits' }, { id:'pyramide', label:'🔺 Pyramides' },
    { id:'prisme', label:'⛺ Prismes' }, { id:'piege', label:'🪤 Pièges (aucun solide)' }
  ];
  NET_DEFS.forEach(function(d){ d.randomNote = netNote(d.obj); });
  function netNote(net){
    return 'Dessin fixe ; seul le choix du patron parmi ceux du niveau est tiré au hasard. ' + netContents(net) + '. Se plie en : ' + M3_ANSWER_LABELS[net.answer] + '.';
  }
  // « 6 carrés », « 1 carré et 4 triangles »…
  function netContents(net){
    var n = { carre:0, rect:0, tri:0 };
    net.faces.forEach(function(f){ n[f.kind]++; });
    var parts = ['carre','rect','tri'].filter(function(k){ return n[k]; }).map(function(k){ return n[k] + ' ' + M3_KIND_NAMES[k][n[k]>1 ? 1 : 0]; });
    return parts.length > 1 ? parts.slice(0,-1).join(', ') + ' et ' + parts[parts.length-1] : parts[0];
  }

  var M3_LEVELS = [
    { name:'Facile',    pool:[] },
    { name:'Moyen',     pool:[] },
    { name:'Difficile', pool:[] }
  ];
  function rebuildM3Pools(overrides){
    M3_LEVELS.forEach(function(lv, idx){
      lv.pool = NET_DEFS.filter(function(d){ return effectiveLevels(d, overrides).indexOf(idx)!==-1; })
        .map(function(d){ return d.obj; });
    });
  }
  registerFamily({
    key:'net', tag:'Patron → Solide', domain:'solides', order:30,
    // Chaque patron se règle niveau par niveau dans « Activités & difficulté ».
    config:{
      storageKey:'geo_net_level_overrides', defs:function(){ return NET_DEFS; }, rebuild:rebuildM3Pools,
      groups:function(){ return M3_GROUPS.map(function(g){ return { id:'net-' + g.id, label:g.label, defs:NET_DEFS.filter(function(d){ return d.group===g.id; }) }; }); }
    },
    markup:[
      '<div class="coach-row">',
      '  <div class="coach-bubble" id="m3-question">Quel solide peut-on fabriquer avec ce patron ?</div>',
      '</div>',
      '<p class="muted" id="m3-sub">Observe les faces à plat, puis choisis le bon solide.</p>',
      '<div class="stage" id="stage">',
      '  <svg id="netSvg" viewBox="0 0 340 250" role="img" aria-label="Patron à plat"></svg>',
      '  <button class="stage-btn" id="m3-replay" type="button" hidden>↺ Revoir le pliage</button>',
      '</div>',
      '<ul class="net-legend" id="m3-legend" hidden></ul>',
      '<div class="qcm-choices" id="m3-choices"></div>',
      '<div class="feedback" id="m3-feedback"></div>',
      '<div class="btn-row">',
      '  <button class="btn primary" id="m3-next" type="button">Nouvelle activité ↻</button>',
      '</div>'
    ].join('\n'),
    generate:function(level){ loadNet(pickNetForLevel(level)); },
    signature:function(){ return currentNet ? currentNet.id : ''; }
  });

  // ---- rendu ----
  var M3_W = 340, M3_H = 250, M3_D = 1400;
  var m3View = { yaw:0, pitch:0, scale:60, lift:0, ghost:0 };
  var m3S = [];              // avancement de pliage de chaque face
  var currentNet = null, answered = false, m3Gen = 0, m3Anim = null, m3CanSpin = false;
  var m3Reduce = false;
  try{ m3Reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; }catch(e){}

  function shade(hex, k){
    var n = parseInt(hex.slice(1), 16), r = (n>>16)&255, g = (n>>8)&255, b = n&255;
    function c(v){ return Math.max(0, Math.min(255, Math.round(v*k))); }
    return 'rgb(' + c(r) + ',' + c(g) + ',' + c(b) + ')';
  }
  // Caméra : on tourne d'abord autour de l'axe z (perpendiculaire à la feuille,
  // qui devient l'axe VERTICAL du solide plié), puis on bascule autour de x.
  // pitch = 0 : on regarde la feuille de dessus ; pitch ≈ 90° + un peu : le solide
  // est posé sur sa face 1 et on le voit légèrement du dessus.
  function viewOf(p, center){
    var v = viewDir([p[0]-center[0], p[1]-center[1], p[2]-center[2]]);
    var X = v[0]*m3View.scale, Y = v[1]*m3View.scale, Z = v[2]*m3View.scale, f = M3_D/(M3_D - Z);
    return { x:M3_W/2 + X*f, y:M3_H/2 - Y*f, z:Z, f:f };
  }
  function viewDir(v){
    var cy = Math.cos(m3View.yaw), sy = Math.sin(m3View.yaw), cp = Math.cos(m3View.pitch), sp = Math.sin(m3View.pitch);
    var x1 = cy*v[0] - sy*v[1], y1 = sy*v[0] + cy*v[1], z1 = v[2];
    return [x1, cp*y1 - sp*z1, sp*y1 + cp*z1];
  }
  function svgDefs(){
    return '<defs>' +
      '<pattern id="m3Hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">' +
      '<rect width="8" height="8" fill="#FFD9D6"/><rect width="3.5" height="8" fill="#C62828"/></pattern>' +
      '</defs>';
  }
  function renderNet(){
    var svg = document.getElementById('netSvg');
    if(!svg || !currentNet) return;
    var net = currentNet, T = netTransforms(net, m3S);
    var world = net.faces.map(function(f, fi){ return faceWorld(net, T, fi); });
    var an = net.analysis, dupOf = {};
    if(m3View.lift > 0) an.dups.forEach(function(d){ dupOf[d.face] = true; });
    // centre de l'objet : milieu de sa boîte englobante
    var lo = [Infinity,Infinity,Infinity], hi = [-Infinity,-Infinity,-Infinity];
    world.forEach(function(pts){ pts.forEach(function(p){ for(var k=0;k<3;k++){ lo[k] = Math.min(lo[k], p[k]); hi[k] = Math.max(hi[k], p[k]); } }); });
    var c = [(lo[0]+hi[0])/2, (lo[1]+hi[1])/2, (lo[2]+hi[2])/2];
    var L = [-0.35, 0.55, 0.76];
    var items = [];
    world.forEach(function(pts, fi){
      var f = net.faces[fi], nrm = tRot(T[fi], [0,0,1]);
      if(dupOf[fi]){   // face en trop : soulevée hors du solide, le long de sa normale
        var off = 0.28 * m3View.lift;
        pts = pts.map(function(p){ return [p[0]+nrm[0]*off, p[1]+nrm[1]*off, p[2]+nrm[2]*off]; });
      }
      var P = pts.map(function(p){ return viewOf(p, c); });
      var nv = viewDir(nrm), front = nv[2] > 0;
      var lit = Math.abs(nv[0]*L[0] + nv[1]*L[1] + nv[2]*L[2]);
      var base = front ? M3_KIND_COLORS[f.kind][(f.num) % 2] : M3_INSIDE;
      var fill = dupOf[fi] ? 'url(#m3Hatch)' : shade(base, (front ? 0.86 : 0.8) + 0.2*lit);
      var z = 0; P.forEach(function(p){ z += p.z; }); z /= P.length;
      items.push({ z:z + (dupOf[fi] ? 1000 : 0), P:P, fill:fill, front:front, num:f.num, dup:!!dupOf[fi] });
    });
    if(m3View.ghost > 0) an.holes.forEach(function(h){
      var P = h.map(function(p){ return viewOf(p, c); }), z = 0; P.forEach(function(p){ z += p.z; });
      items.push({ z:z/P.length + 500, P:P, ghost:true });
    });
    if(m3View.ghost > 0) an.loose.forEach(function(h){
      var P = h.map(function(p){ return viewOf(p, c); }), z = 0; P.forEach(function(p){ z += p.z; });
      items.push({ z:z/P.length + 500, P:P, ghost:true, open:true });
    });
    items.sort(function(a, b){ return a.z - b.z; });
    var out = [svgDefs()];
    items.forEach(function(it){
      var pts = it.P.map(function(p){ return p.x.toFixed(1) + ',' + p.y.toFixed(1); }).join(' ');
      var cx = 0, cy = 0; it.P.forEach(function(p){ cx += p.x; cy += p.y; }); cx /= it.P.length; cy /= it.P.length;
      if(it.ghost && it.open){   // bords qui ne se rejoignent pas (trou qui n'est pas plat)
        out.push('<polygon points="' + pts + '" fill="none" stroke="#1B4FD8" stroke-width="3.5" stroke-dasharray="7 5" stroke-linejoin="round" opacity="' + m3View.ghost.toFixed(2) + '"/>');
        return;
      }
      if(it.ghost){
        out.push('<polygon points="' + pts + '" fill="rgba(27,79,216,' + (0.16*m3View.ghost).toFixed(2) + ')" stroke="#1B4FD8" stroke-width="3" stroke-dasharray="7 5" stroke-linejoin="round" opacity="' + m3View.ghost.toFixed(2) + '"/>');
        out.push('<text x="' + cx.toFixed(1) + '" y="' + (cy+9).toFixed(1) + '" text-anchor="middle" font-size="26" font-weight="900" fill="#1B4FD8" opacity="' + m3View.ghost.toFixed(2) + '" font-family="Nunito, sans-serif">?</text>');
        return;
      }
      out.push('<polygon points="' + pts + '" fill="' + it.fill + '" stroke="' + (it.dup ? '#8E1B1B' : M3_EDGE) + '" stroke-width="' + (it.dup ? 3 : 2) + '" stroke-linejoin="round"/>');
      var area = 0; for(var i=0;i<it.P.length;i++){ var a = it.P[i], b = it.P[(i+1)%it.P.length]; area += a.x*b.y - b.x*a.y; }
      if(it.front && Math.abs(area/2) > 260){
        var fs = Math.max(11, Math.min(20, Math.sqrt(Math.abs(area/2))/2.6));
        out.push('<text x="' + cx.toFixed(1) + '" y="' + (cy + fs*0.36).toFixed(1) + '" text-anchor="middle" font-size="' + fs.toFixed(0) + '" font-weight="800" fill="' + M3_EDGE + '" font-family="Nunito, sans-serif">' + it.num + '</text>');
      }
      if(it.dup){
        out.push('<rect x="' + (cx-30).toFixed(1) + '" y="' + (cy-11).toFixed(1) + '" width="60" height="22" rx="11" fill="#8E1B1B"/>');
        out.push('<text x="' + cx.toFixed(1) + '" y="' + (cy+5).toFixed(1) + '" text-anchor="middle" font-size="13" font-weight="800" fill="#FFFFFF" font-family="Nunito, sans-serif">en trop</text>');
      }
    });
    svg.innerHTML = out.join('');
  }

  // Échelle : le patron à plat remplit la scène ; le solide plié, plus petit, est agrandi.
  function fitScale(net, s){
    var T = netTransforms(net, s), xs = [], ys = [], zs = [];
    net.faces.forEach(function(f, fi){ faceWorld(net, T, fi).forEach(function(p){ xs.push(p[0]); ys.push(p[1]); zs.push(p[2]); }); });
    var span = function(a){ return Math.max.apply(null, a) - Math.min.apply(null, a); };
    if(s.every(function(v){ return v===0; })) return Math.min((M3_W-40)/span(xs), (M3_H-40)/span(ys));
    // solide plié : sa plus grande dimension occupe environ la moitié de la hauteur
    // (il tourne sur lui-même : il faut de la place dans toutes les directions)
    var d = Math.max(span(xs), span(ys), span(zs)) * 2.3;
    return Math.min((M3_W-40)/d, (M3_H-30)/d);
  }
  function ease(t){ return t<0 ? 0 : t>1 ? 1 : t<0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2, 3)/2; }

  // ---- déroulé du pliage : on incline la vue, on plie une face après l'autre,
  // puis on montre ce qui cloche, et le solide tourne un peu sur lui-même ----
  var M3_T = { tilt:900, fold:950, gap:180, marks:700, spin:4200 };
  function playFold(){
    var net = currentNet, gen = m3Gen;
    if(m3Anim) cancelAnimationFrame(m3Anim);
    setSpinEnabled(false);
    document.getElementById('m3-replay').hidden = true;
    var steps = net.order.slice(1), n = steps.length;
    var flatScale = fitScale(net, net.faces.map(function(){ return 0; }));
    var foldScale = fitScale(net, net.faces.map(function(){ return 1; }));
    var tFoldStart = M3_T.tilt, tFoldEnd = tFoldStart + n*(M3_T.fold + M3_T.gap);
    var tEnd = tFoldEnd + M3_T.marks + M3_T.spin;
    // vue finale « de trois quarts » : on voit trois faces du solide
    var yaw0 = 0, pitch0 = 0, yaw1 = 0.6, pitch1 = Math.PI/2 + 0.45;
    var t0 = performance.now();
    function frame(now){
      if(gen !== m3Gen) return;
      var t = m3Reduce ? tEnd : now - t0;
      var tilt = ease(t / M3_T.tilt);
      m3View.pitch = pitch0 + (pitch1 - pitch0)*tilt;
      steps.forEach(function(fi, k){
        var st = tFoldStart + k*(M3_T.fold + M3_T.gap);
        m3S[fi] = ease((t - st) / M3_T.fold);
      });
      var prog = Math.max(0, Math.min(1, (t - tFoldStart)/(tFoldEnd - tFoldStart)));
      m3View.scale = flatScale + (foldScale - flatScale)*ease(prog);
      var marks = ease((t - tFoldEnd) / M3_T.marks);
      m3View.lift = marks; m3View.ghost = marks;
      // une fois plié (et les problèmes montrés), le solide fait un tour complet sur lui-même
      m3View.yaw = yaw0 + yaw1*tilt + 2*Math.PI*ease((t - tFoldEnd - M3_T.marks)/M3_T.spin);
      renderNet();
      if(t < tEnd) m3Anim = requestAnimationFrame(frame);
      else { m3Anim = null; foldDone(); }
    }
    m3Anim = requestAnimationFrame(frame);
  }
  function foldDone(){
    setSpinEnabled(true);
    document.getElementById('m3-replay').hidden = false;
    var an = currentNet.analysis, legend = document.getElementById('m3-legend'), items = [];
    if(an.dups.length) items.push('<li><span class="nl-swatch nl-extra" aria-hidden="true"></span>' + (an.dups.length>1 ? an.dups.length + ' faces en trop : elles se posent sur d\'autres faces' : '1 face en trop : elle se pose sur une autre') + '</li>');
    if(an.holes.length) items.push('<li><span class="nl-swatch nl-missing" aria-hidden="true">?</span>' + (an.holes.length>1 ? an.holes.length + ' faces manquantes : il reste des trous' : '1 face manquante : il reste un trou') + '</li>');
    if(!an.holes.length && an.loose.length) items.push('<li><span class="nl-swatch nl-missing" aria-hidden="true">?</span>Des bords ne se rejoignent pas</li>');
    legend.innerHTML = items.join('');
    legend.hidden = !items.length;
    document.getElementById('netSvg').setAttribute('aria-label', 'Patron plié : ' + netResultText(currentNet) + ' Fais-le tourner avec le doigt ou les flèches du clavier.');
    var sub = document.getElementById('m3-sub');
    sub.textContent = (currentNet.answer==='aucun' ? netResultText(currentNet) : 'Le patron s\'est refermé : c\'est un solide !') + ' Fais-le tourner avec ton doigt.';
  }
  // Ce que le pliage montre, en une phrase.
  function netResultText(net){
    var an = net.analysis;
    if(an.closed) return 'Toutes les faces se referment, sans trou ni face en trop.';
    var parts = [];
    if(an.dups.length) parts.push(an.dups.length>1 ? an.dups.length + ' faces se posent sur d\'autres faces (en trop)' : 'une face se pose sur une autre (en trop)');
    if(an.holes.length) parts.push(an.holes.length>1 ? 'il reste ' + an.holes.length + ' trous (faces manquantes)' : 'il reste un trou (une face manquante)');
    else if(an.loose.length) parts.push('des bords ne se rejoignent pas');
    var txt = parts.join(' et ');
    return txt.charAt(0).toUpperCase() + txt.slice(1) + ' : le patron ne se referme pas.';
  }

  /* ---- rotation au doigt (ou aux flèches) une fois le pliage terminé ---- */
  function setSpinEnabled(on){
    m3CanSpin = on;
    var st = document.getElementById('stage');
    st.classList.toggle('spinnable', on);
    if(on) st.tabIndex = 0; else st.removeAttribute('tabindex');
  }
  (function initSpinDrag(){
    var stageEl = document.getElementById('stage'), drag = null;
    stageEl.addEventListener('pointerdown', function(ev){
      if(!m3CanSpin || ev.target.closest('button')) return;
      drag = { x:ev.clientX, y:ev.clientY, yaw:m3View.yaw, pitch:m3View.pitch };
      stageEl.setPointerCapture(ev.pointerId);
    });
    stageEl.addEventListener('pointermove', function(ev){
      if(!drag) return;
      m3View.yaw = drag.yaw + (ev.clientX - drag.x) * 0.012;
      m3View.pitch = Math.max(0.5, Math.min(2.9, drag.pitch - (ev.clientY - drag.y) * 0.012));
      renderNet();
    });
    function endDrag(){ drag = null; }
    stageEl.addEventListener('pointerup', endDrag);
    stageEl.addEventListener('pointercancel', endDrag);
    stageEl.addEventListener('keydown', function(ev){
      if(!m3CanSpin) return;
      var k = { ArrowLeft:[-0.2,0], ArrowRight:[0.2,0], ArrowUp:[0,-0.2], ArrowDown:[0,0.2] }[ev.key];
      if(!k) return;
      ev.preventDefault();
      m3View.yaw += k[0];
      m3View.pitch = Math.max(0.5, Math.min(2.9, m3View.pitch - k[1]));
      renderNet();
    });
    document.getElementById('m3-replay').addEventListener('click', function(){
      m3S = currentNet.faces.map(function(){ return 0; });
      m3View.lift = 0; m3View.ghost = 0;
      document.getElementById('m3-legend').hidden = true;
      playFold();
    });
  })();

  function loadNet(net){
    currentNet = net;
    answered = false;
    m3Gen++;
    if(m3Anim){ cancelAnimationFrame(m3Anim); m3Anim = null; }
    setSpinEnabled(false);
    m3S = net.faces.map(function(){ return 0; });
    m3View = { yaw:0, pitch:0, scale:fitScale(net, m3S), lift:0, ghost:0 };
    document.getElementById('m3-replay').hidden = true;
    document.getElementById('m3-legend').hidden = true;
    document.getElementById('netSvg').setAttribute('aria-label', 'Patron à plat : ' + netContents(net) + '.');
    renderNet();
    // 4 réponses : la bonne, « Aucun solide », et d'autres solides au hasard
    var opts = net.answer==='aucun' ? ['aucun'] : [net.answer, 'aucun'];
    shuffle(['cube','pave','pyramide','prisme'].filter(function(k){ return opts.indexOf(k)===-1; }))
      .slice(0, 4 - opts.length).forEach(function(k){ opts.push(k); });
    opts.sort(function(a, b){ return M3_ANSWER_ORDER.indexOf(a) - M3_ANSWER_ORDER.indexOf(b); });
    var wrap = document.getElementById('m3-choices');
    wrap.innerHTML = '';
    opts.forEach(function(key){
      var b = document.createElement('button');
      b.className = 'choice-btn';
      b.type = 'button';
      b.textContent = M3_ANSWER_LABELS[key];
      b.addEventListener('click', function(){ answerNet(key, b); });
      wrap.appendChild(b);
    });
    m3Flow.start();
    document.getElementById('m3-sub').textContent = 'Observe les faces à plat, puis choisis le bon solide.';
  }

  function pickNetForLevel(idx){
    var pool = M3_LEVELS[idx].pool;
    return pool[Math.floor(Math.random()*pool.length)];
  }

  function netExplain(net){
    net = net.obj || net;
    if(net.answer==='cube') return 'Ce patron a 6 carrés. En pliant, chacun prend une place différente, sans trou ni face en trop : c\'est un cube.';
    if(net.answer==='pave') return 'Ce patron a 6 rectangles, pareils deux par deux. En pliant, ils forment une boîte fermée ; les faces ne sont pas toutes des carrés, donc c\'est un pavé droit.';
    if(net.answer==='prisme') return 'Ce patron a 2 triangles (les bases) et 3 rectangles qui les relient. En pliant, il se referme : c\'est un prisme à base triangulaire.';
    if(net.answer==='pyramide') return net.solid==='tetra'
      ? 'Ce patron a 4 triangles. En pliant, ils se rejoignent en une pointe : c\'est une pyramide à base triangulaire.'
      : 'Ce patron a 1 carré (la base) et 4 triangles. En pliant, les triangles se rejoignent en une pointe : c\'est une pyramide à base carrée.';
    return 'Ce patron a ' + netContents(net) + '. ' + netResultText(net);
  }

  var m3Flow = makeQuestionFlow({ feedback:'m3-feedback', tries:1 });
  function answerNet(userChoice, btn){
    if(answered) return;
    answered = true;
    var buttons = document.querySelectorAll('#m3-choices .choice-btn');
    buttons.forEach(function(b){ b.disabled = true; });
    var correct = (userChoice === currentNet.answer);
    if(correct){
      btn.classList.add('correct');
      m3Flow.answer(true, { success:'Bravo, c\'est bien « ' + M3_ANSWER_LABELS[currentNet.answer] + ' » !', explain:netExplain(currentNet) });
    } else {
      btn.classList.add('wrong');
      buttons.forEach(function(b){ if(b.textContent === M3_ANSWER_LABELS[currentNet.answer]) b.classList.add('correct'); });
      m3Flow.answer(false, { solution:'La bonne réponse est « ' + M3_ANSWER_LABELS[currentNet.answer] + ' », en vert.', explain:netExplain(currentNet) });
    }
    document.getElementById('m3-sub').textContent = 'Regarde le patron se plier, face après face…';
    playFold();
  }

  document.getElementById('m3-next').addEventListener('click', function(){ m3Flow.skip(); });

  // ===================== Solides =====================
  // Représentation "perspective cavalière", comme dans les cahiers : les
  // arêtes visibles sont des traits pleins, les arêtes cachées (derrière le
  // solide) sont en pointillés, et les faces visibles sont translucides.
  // Ça permet à l'enfant de voir ET de compter les arêtes/sommets cachés,
  // au lieu d'avoir à "deviner" ce qu'il y a derrière.
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
    svg.appendChild(el('path',{d:'M '+(cx-rx)+' '+botCy+' A '+rx+' '+ry+' 0 0 0 '+(cx+rx)+' '+botCy+' Z', fill:'var(--accent2)'}));
    svg.appendChild(el('line',{x1:cx-rx,y1:topCy,x2:cx-rx,y2:botCy,stroke:'var(--text)','stroke-width':2}));
    svg.appendChild(el('line',{x1:cx+rx,y1:topCy,x2:cx+rx,y2:botCy,stroke:'var(--text)','stroke-width':2}));
    svg.appendChild(el('path',{d:'M '+(cx-rx)+' '+botCy+' A '+rx+' '+ry+' 0 0 0 '+(cx+rx)+' '+botCy, fill:'none', stroke:'var(--text)','stroke-width':2}));
    svg.appendChild(el('path',{d:'M '+(cx-rx)+' '+botCy+' A '+rx+' '+ry+' 0 0 1 '+(cx+rx)+' '+botCy, fill:'none', stroke:'var(--text)','stroke-width':2,'stroke-dasharray':'5,4'}));
    svg.appendChild(el('ellipse',{cx:cx,cy:topCy,rx:rx,ry:ry,fill:'var(--accent3)',stroke:'var(--text)','stroke-width':2}));
  }
  function drawSolidCone(svg){
    var rx=48, ry=16, baseCy=150, apex=[100,40];
    svg.appendChild(el('polygon',{points:isoPoly([apex,[100-rx,baseCy],[100+rx,baseCy]]),fill:'var(--accent2)'}));
    svg.appendChild(el('path',{d:'M '+(100-rx)+' '+baseCy+' A '+rx+' '+ry+' 0 0 0 '+(100+rx)+' '+baseCy+' Z', fill:'var(--accent2)'}));
    svg.appendChild(el('path',{d:'M '+(100-rx)+' '+baseCy+' A '+rx+' '+ry+' 0 0 0 '+(100+rx)+' '+baseCy, fill:'none', stroke:'var(--text)','stroke-width':2}));
    svg.appendChild(el('path',{d:'M '+(100-rx)+' '+baseCy+' A '+rx+' '+ry+' 0 0 1 '+(100+rx)+' '+baseCy, fill:'none', stroke:'var(--text)','stroke-width':2,'stroke-dasharray':'5,4'}));
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
  // (ngonPoints, isoPoly : outils de dessin partagés, dans noyau.js)
  // Prisme droit à base régulière à n côtés, en perspective : on le dessine EN
  // ENTIER, comme les autres solides (cube, pyramide…) — les arêtes cachées
  // sont en pointillés. Vue de dessus légère : une face rectangulaire est
  // toujours bien en face ; une face latérale est visible si son milieu est du
  // côté « avant » (sinus > 0) ; une arête est cachée si toutes les faces qui la
  // touchent sont cachées.
  function drawSolidPrismeN(svg, n){
    var cx=100, rx=52, ry=20, topCy=58, botCy=146;
    var rot = n===3 ? 90 : 90 - 180/n;   // triangle : une arête (sommet) en face, pour bien voir 2 faces latérales
    var top = ngonPoints(n,cx,topCy,rx,ry,rot);
    var bot = ngonPoints(n,cx,botCy,rx,ry,rot);
    var front = [];                                    // face k = entre les sommets k et k+1
    for(var k=0;k<n;k++){
      var mid = (rot + (k+0.5)*360/n) * Math.PI/180;
      front.push(Math.sin(mid) > 0.01);
    }
    var colors = ['var(--accent)','var(--accent2)','var(--accent3)'];
    for(k=0;k<n;k++){
      if(front[k]) solidFace(svg, [top[k], top[(k+1)%n], bot[(k+1)%n], bot[k]], colors[k%3]);
    }
    solidFace(svg, top, 'var(--accent3)');
    // arêtes cachées d'abord (pointillés)
    for(k=0;k<n;k++){
      var prev = (k+n-1)%n;
      if(!front[k] && !front[prev]) solidEdge(svg, top[k], bot[k], true);   // arête verticale
      if(!front[k]) solidEdge(svg, bot[k], bot[(k+1)%n], true);            // arête du bas, au fond
    }
    // arêtes visibles
    for(k=0;k<n;k++){
      var prev2 = (k+n-1)%n;
      solidEdge(svg, top[k], top[(k+1)%n], false);
      if(front[k] || front[prev2]) solidEdge(svg, top[k], bot[k], false);
      if(front[k]) solidEdge(svg, bot[k], bot[(k+1)%n], false);
    }
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

  // ---- Déclaration des types de Quizz sur les solides ----
  registerQuizType({ id:'solideNom', domain:'solides', label:'Solides', longLabel:'Nom du solide', defaultLevels:[0,1,2],
    randomNote:'Le solide est tiré au hasard parmi les 6 solides connus ; son nom (la réponse) en découle de façon fixe.',
    generate:genSolideNomQuestion });
  registerQuizType({ id:'solideCompte', domain:'solides', label:'Compter les solides', longLabel:'Compter faces/sommets/arêtes', defaultLevels:[1,2],
    randomNote:'Le solide (cube/pavé/pyramide) et l\'attribut demandé (faces/sommets/arêtes) sont tirés au hasard ; le nombre correspondant est ensuite fixe pour ce solide.',
    generate:genSolideCompteQuestion });
