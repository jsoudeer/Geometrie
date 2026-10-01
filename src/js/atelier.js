  // =====================================================================
  //  THÈME « ATELIERS » : activités interactives, on touche pour construire
  //  (compléter une symétrie, colorier une fraction, reproduire un modèle).
  //  Chaque atelier est une « famille » à écran propre, déclarée avec
  //  registerFamily (voir noyau.js). Ils partagent le même écran (consigne,
  //  dessin tactile, retour, boutons Vérifier / Nouvelle activité) fabriqué par
  //  makeAtelier(). Pas de chrono : comme Déformer, ces activités demandent du
  //  temps.
  // =====================================================================

  // Fabrique l'écran commun et renvoie { instr, svg, feedback, setSolved, ... }
  function makeAtelier(key, wrap, onCheck){
    wrap.innerHTML =
      '<p class="muted" id="at-' + key + '-instr"></p>' +
      '<div class="deform-wrap"><svg id="at-' + key + '-svg" viewBox="0 0 260 260" role="group"></svg></div>' +
      '<div class="feedback" id="at-' + key + '-fb"></div>' +
      '<div class="btn-row">' +
      '<button class="btn primary" id="at-' + key + '-check" type="button">Vérifier ✅</button>' +
      '<button class="btn ghost" id="at-' + key + '-next" type="button">Nouvelle activité ↻</button></div>';
    var ui = {
      instr: wrap.querySelector('#at-' + key + '-instr'),
      svg: wrap.querySelector('#at-' + key + '-svg'),
      fb: wrap.querySelector('#at-' + key + '-fb'),
      solved: false
    };
    ui.reset = function(instruction, ariaLabel, viewBox){
      ui.solved = false;
      ui.instr.textContent = instruction;
      ui.svg.setAttribute('aria-label', ariaLabel);
      ui.svg.setAttribute('viewBox', viewBox || '0 0 260 260');
      ui.svg.innerHTML = '';
      ui.fb.className = 'feedback'; ui.fb.innerHTML = '';
    };
    ui.say = function(ok, html){
      ui.fb.className = 'feedback ' + (ok ? 'good' : 'bad') + ' show';
      ui.fb.innerHTML = html;
      setCoachReaction(ok ? 'good' : 'bad');
      playSound(ok ? 'good' : 'bad');
      celebrate(ok ? 'good' : 'bad', ui.fb);
    };
    wrap.querySelector('#at-' + key + '-check').addEventListener('click', function(){ onCheck(ui); });
    wrap.querySelector('#at-' + key + '-next').addEventListener('click', nextPracticeQuestion);
    // Une fois réussi, toucher le retour passe à la suite (jamais avant : on
    // ne veut pas quitter un exercice raté par un effleurement).
    ui.fb.tabIndex = 0;
    ui.fb.setAttribute('aria-live', 'polite');
    ui.fb.addEventListener('click', function(){ if(ui.solved) nextPracticeQuestion(); });
    return ui;
  }
  // Récompense une seule fois par exercice.
  function atelierWin(ui, html){
    if(!ui.solved){ ui.solved = true; addStar(1); }
    ui.say(true, html);
  }

  // Rectangle tactile (souris, doigt, clavier). onToggle() est appelée à chaque activation.
  function atelierCell(svg, x, y, w, h, fill, label, onToggle){
    var r = el('rect', { x:x, y:y, width:w, height:h, fill:fill, stroke:'var(--text)', 'stroke-width':1.5,
      role:'button', tabindex:0, 'aria-label':label, style:'cursor:pointer;touch-action:manipulation' });
    r.addEventListener('click', onToggle);
    r.addEventListener('keydown', function(e){ if(e.key==='Enter' || e.key===' '){ e.preventDefault(); onToggle(); } });
    svg.appendChild(r);
    return r;
  }

  var AT_COLORS = { given:'var(--accent2)', mine:'var(--accent)', empty:'var(--surface)' };

  // ---------------------------------------------------------------------
  // 1. Symétrie : compléter la figure de l'autre côté de l'axe
  // ---------------------------------------------------------------------
  var atSym = { grid:null, mine:null, solution:null, half:null, dims:null, horizontal:false, ui:null };
  function atSymGenerate(level){
    // L0 : 3 colonnes × 4 lignes par côté, 4 cases ; L1 : 3×5, 6 cases ; L2 : axe vertical OU horizontal, 4×5, 9 cases
    var C = level===0 ? 3 : level===1 ? 3 : 4, R = level===0 ? 4 : 5, count = level===0 ? 4 : level===1 ? 6 : 9;
    var horizontal = level===2 && Math.random()<0.5;
    // « demi » = dimensions d'un côté : en vertical C colonnes × R lignes ; en horizontal on tourne.
    var hc = horizontal ? R : C, hr = horizontal ? C : R;
    var given = [], r, c;
    for(r=0;r<hr;r++){ given.push([]); for(c=0;c<hc;c++) given[r].push(false); }
    var placed = 0, guard = 0;
    while(placed<count && guard++<200){
      r = randInt(0,hr-1); c = randInt(0,hc-1);
      if(!given[r][c]){ given[r][c] = true; placed++; }
    }
    // la colonne (ou ligne) contre l'axe doit contenir au moins une case : sinon la symétrie est trop facile à rater
    var touch = false;
    for(r=0;r<hr;r++) for(c=0;c<hc;c++){ if((horizontal ? r===hr-1 : c===hc-1) && given[r][c]) touch = true; }
    if(!touch){ if(horizontal) given[hr-1][randInt(0,hc-1)] = true; else given[randInt(0,hr-1)][hc-1] = true; }
    atSym.horizontal = horizontal; atSym.half = { rows:hr, cols:hc }; atSym.given = given;
    // solution = miroir des cases données
    var sol = [];
    for(r=0;r<hr;r++){ sol.push([]); for(c=0;c<hc;c++){
      sol[r].push(horizontal ? given[hr-1-r][c] : given[r][hc-1-c]);
    } }
    atSym.solution = sol;
    atSym.mine = sol.map(function(row){ return row.map(function(){ return false; }); });
    atSymDraw(false);
  }
  function atSymDraw(showErrors){
    var ui = atSym.ui, hr = atSym.half.rows, hc = atSym.half.cols, horizontal = atSym.horizontal;
    var cols = horizontal ? hc : hc*2, rows = horizontal ? hr*2 : hr;
    var cell = Math.floor(Math.min(240/cols, 240/rows));
    var x0 = (260 - cols*cell)/2, y0 = (260 - rows*cell)/2;
    ui.svg.innerHTML = '';
    var r, c;
    for(r=0;r<hr;r++) for(c=0;c<hc;c++){
      // case donnée (moitié 1 : gauche ou haut)
      var gx = x0 + c*cell, gy = y0 + r*cell;
      ui.svg.appendChild(el('rect', { x:gx, y:gy, width:cell, height:cell, fill:atSym.given[r][c] ? AT_COLORS.given : AT_COLORS.empty, stroke:'var(--text)', 'stroke-width':1.5 }));
      // case à compléter (moitié 2 : droite ou bas)
      var px = horizontal ? x0 + c*cell : x0 + (hc + c)*cell, py = horizontal ? y0 + (hr + r)*cell : y0 + r*cell;
      (function(rr, cc, x, y){
        var bad = showErrors && atSym.mine[rr][cc] !== atSym.solution[rr][cc];
        var rect = atelierCell(ui.svg, x, y, cell, cell, atSym.mine[rr][cc] ? AT_COLORS.mine : AT_COLORS.empty,
          'case ' + (rr+1) + ', ' + (cc+1) + (atSym.mine[rr][cc] ? ', coloriée' : ', vide'), function(){
            if(ui.solved) return;
            atSym.mine[rr][cc] = !atSym.mine[rr][cc];
            ui.fb.className = 'feedback'; ui.fb.innerHTML = '';
            atSymDraw(false);
          });
        if(bad){ rect.setAttribute('stroke', '#d33'); rect.setAttribute('stroke-width', 4); }
      })(r, c, px, py);
    }
    // l'axe de symétrie
    if(horizontal) ui.svg.appendChild(el('line', { x1:x0-8, y1:y0+hr*cell, x2:x0+cols*cell+8, y2:y0+hr*cell, stroke:'#d33', 'stroke-width':3.5 }));
    else ui.svg.appendChild(el('line', { x1:x0+hc*cell, y1:y0-8, x2:x0+hc*cell, y2:y0+rows*cell+8, stroke:'#d33', 'stroke-width':3.5 }));
  }
  function atSymCheck(ui){
    var wrong = 0, r, c;
    for(r=0;r<atSym.half.rows;r++) for(c=0;c<atSym.half.cols;c++) if(atSym.mine[r][c] !== atSym.solution[r][c]) wrong++;
    if(wrong===0){ atSymDraw(false); atelierWin(ui, '<div>✔ Bravo, la figure est bien symétrique !</div><div class="explain-line">Chaque case a sa jumelle de l\'autre côté de la ligne rouge, à la même distance.</div>'); }
    else { atSymDraw(true); ui.say(false, '<div>✘ ' + (wrong===1 ? 'Il y a 1 case à corriger' : 'Il y a ' + wrong + ' cases à corriger') + ' (entourées en rouge).</div><div class="explain-line">Astuce : la case juste à côté de la ligne rouge se retrouve juste de l\'autre côté.</div>'); }
  }
  registerFamily({
    key:'atelier-sym', tag:'Compléter la symétrie', theme:'✋ Ateliers',
    note:'Une moitié de figure est donnée ; on touche les cases de l\'autre côté de la ligne rouge pour la compléter en miroir. Facile : 4 cases sur 3×4 ; Moyen : 6 cases sur 3×5 ; Difficile : 9 cases, et la ligne peut être verticale OU horizontale. La figure est tirée au hasard (au moins une case touche la ligne).',
    build:function(wrap){ atSym.ui = makeAtelier('atelier-sym', wrap, atSymCheck); },
    generate:function(level){
      atSym.ui.reset('Complète la figure de l\'autre côté de la ligne rouge, comme dans un miroir. Touche les cases à colorier.', 'Figure à compléter en symétrie : touche les cases');
      atSymGenerate(level);
    },
    signature:function(){ return (atSym.horizontal ? 'H' : 'V') + JSON.stringify(atSym.given); }
  });

  // ---------------------------------------------------------------------
  // 2. Fractions : colorier la bonne part de la figure
  // ---------------------------------------------------------------------
  var atFrac = { n:0, k:0, kind:'pie', on:null, ui:null, label:'' };
  var AT_FRAC_TARGETS = [[1,2,'la moitié'],[1,4,'le quart'],[3,4,'les trois quarts'],[1,3,'le tiers'],[2,3,'les deux tiers']];
  function atFracGenerate(level){
    var dens = level===0 ? [2,4] : level===1 ? [2,3,4] : [4,6,8];
    var n, tg, guard = 0;
    do {
      tg = pick(AT_FRAC_TARGETS); n = pick(dens); guard++;
    } while(guard<100 && (n % tg[1] !== 0 || (level===0 && tg[1]===3)));
    if(guard>=100){ tg = AT_FRAC_TARGETS[0]; n = 2; }
    var k = tg[0]*n/tg[1];
    // difficile : parfois la fraction écrite (5/8) plutôt qu'un mot
    var label = tg[2];
    if(level===2 && Math.random()<0.4){ n = 8; k = randInt(1,7); label = k + '/8'; }
    atFrac.n = n; atFrac.k = k; atFrac.kind = pick(['pie','bar']); atFrac.label = label;
    atFrac.on = []; for(var i=0;i<n;i++) atFrac.on.push(false);
    atFrac.ui.reset('Colorie ' + label + ' de la figure. Touche les parts pour les colorier.', 'Figure partagée en ' + n + ' parts égales : touche les parts à colorier');
    atFracDraw();
  }
  function atFracDraw(){
    var ui = atFrac.ui, n = atFrac.n, i;
    ui.svg.innerHTML = '';
    function toggle(idx){ return function(){ if(ui.solved) return; atFrac.on[idx] = !atFrac.on[idx]; ui.fb.className = 'feedback'; ui.fb.innerHTML = ''; atFracDraw(); }; }
    for(i=0;i<n;i++){
      var fill = atFrac.on[i] ? AT_COLORS.mine : AT_COLORS.empty, part;
      if(atFrac.kind==='pie'){
        var cx = 130, cy = 130, r = 112;
        var a0 = -Math.PI/2 + i*2*Math.PI/n, a1 = -Math.PI/2 + (i+1)*2*Math.PI/n;
        var d = 'M '+cx+' '+cy+' L '+(cx+r*Math.cos(a0))+' '+(cy+r*Math.sin(a0))+' A '+r+' '+r+' 0 0 1 '+(cx+r*Math.cos(a1))+' '+(cy+r*Math.sin(a1))+' Z';
        part = el('path', { d:d, fill:fill, stroke:'var(--text)', 'stroke-width':3, 'stroke-linejoin':'round', role:'button', tabindex:0, 'aria-label':'part ' + (i+1) + (atFrac.on[i] ? ', coloriée' : ', vide'), style:'cursor:pointer;touch-action:manipulation' });
      } else {
        var w = 240/n;
        part = el('rect', { x:10 + i*w, y:80, width:w, height:100, fill:fill, stroke:'var(--text)', 'stroke-width':3, role:'button', tabindex:0, 'aria-label':'part ' + (i+1) + (atFrac.on[i] ? ', coloriée' : ', vide'), style:'cursor:pointer;touch-action:manipulation' });
      }
      var t = toggle(i);
      part.addEventListener('click', t);
      part.addEventListener('keydown', function(tt){ return function(e){ if(e.key==='Enter' || e.key===' '){ e.preventDefault(); tt(); } }; }(t));
      ui.svg.appendChild(part);
    }
  }
  function atFracCheck(ui){
    var got = atFrac.on.filter(function(v){ return v; }).length, need = atFrac.k, n = atFrac.n;
    if(got===need){
      atelierWin(ui, '<div>✔ Bravo !</div><div class="explain-line">La figure a ' + n + ' parts égales : ' + atFrac.label + ' de la figure, c\'est ' + need + ' part' + (need>1?'s':'') + ' sur ' + n + ' (' + need + '/' + n + ').</div>');
    } else if(got<need){
      ui.say(false, '<div>✘ Il manque ' + (need-got) + ' part' + (need-got>1?'s':'') + ' à colorier.</div><div class="explain-line">Compte les parts coloriées : il en faut ' + need + ' sur ' + n + '.</div>');
    } else {
      ui.say(false, '<div>✘ Il y a ' + (got-need) + ' part' + (got-need>1?'s':'') + ' de trop.</div><div class="explain-line">Il faut colorier ' + need + ' part' + (need>1?'s':'') + ' sur ' + n + '.</div>');
    }
  }
  registerFamily({
    key:'atelier-fraction', tag:'Colorier une fraction', theme:'✋ Ateliers',
    note:'Un disque ou une bande est partagé(e) en parts égales ; on colorie la fraction demandée (la moitié, le quart, les trois quarts, le tiers, les deux tiers). Facile : 2 ou 4 parts ; Moyen : + 3 parts ; Difficile : 4, 6 ou 8 parts, parfois une fraction écrite (5/8).',
    build:function(wrap){ atFrac.ui = makeAtelier('atelier-fraction', wrap, atFracCheck); },
    generate:atFracGenerate,
    signature:function(){ return atFrac.kind + ':' + atFrac.n + ':' + atFrac.k + ':' + atFrac.label; }
  });

  // ---------------------------------------------------------------------
  // 3. Reproduire le modèle sur une grille
  // ---------------------------------------------------------------------
  var atCopy = { n:0, model:null, mine:null, ui:null };
  function atCopyGenerate(level){
    var n = level===0 ? 4 : level===1 ? 5 : 6, count = level===0 ? 5 : level===1 ? 8 : 12;
    var model = [], r, c;
    for(r=0;r<n;r++){ model.push([]); for(c=0;c<n;c++) model[r].push(false); }
    var placed = 0, guard = 0;
    while(placed<count && guard++<300){ r = randInt(0,n-1); c = randInt(0,n-1); if(!model[r][c]){ model[r][c] = true; placed++; } }
    atCopy.n = n; atCopy.model = model;
    atCopy.mine = model.map(function(row){ return row.map(function(){ return false; }); });
    atCopy.ui.reset('Reproduis le modèle (à gauche) sur la grille vide (à droite). Touche les cases à colorier.', 'Modèle à reproduire et grille vide : touche les cases', '0 0 260 150');
    atCopyDraw(false);
  }
  function atCopyDraw(showErrors){
    var ui = atCopy.ui, n = atCopy.n, cell = Math.floor(116/n), size = cell*n, r, c;
    var xm = 8 + (116-size)/2, xp = 136 + (116-size)/2, y0 = 22 + (116-size)/2;
    ui.svg.innerHTML = '';
    ui.svg.appendChild(svgText(66, 15, 13, 'Modèle'));
    ui.svg.appendChild(svgText(194, 15, 13, 'À toi'));
    for(r=0;r<n;r++) for(c=0;c<n;c++){
      ui.svg.appendChild(el('rect', { x:xm + c*cell, y:y0 + r*cell, width:cell, height:cell, fill:atCopy.model[r][c] ? AT_COLORS.given : AT_COLORS.empty, stroke:'var(--text)', 'stroke-width':1.2 }));
      (function(rr, cc){
        var bad = showErrors && atCopy.mine[rr][cc] !== atCopy.model[rr][cc];
        var rect = atelierCell(ui.svg, xp + cc*cell, y0 + rr*cell, cell, cell, atCopy.mine[rr][cc] ? AT_COLORS.mine : AT_COLORS.empty,
          'case ' + (rr+1) + ', ' + (cc+1) + (atCopy.mine[rr][cc] ? ', coloriée' : ', vide'), function(){
            if(ui.solved) return;
            atCopy.mine[rr][cc] = !atCopy.mine[rr][cc];
            ui.fb.className = 'feedback'; ui.fb.innerHTML = '';
            atCopyDraw(false);
          });
        if(bad){ rect.setAttribute('stroke', '#d33'); rect.setAttribute('stroke-width', 3.5); }
      })(r, c);
    }
  }
  function atCopyCheck(ui){
    var wrong = 0, r, c;
    for(r=0;r<atCopy.n;r++) for(c=0;c<atCopy.n;c++) if(atCopy.mine[r][c] !== atCopy.model[r][c]) wrong++;
    if(wrong===0){ atCopyDraw(false); atelierWin(ui, '<div>✔ Bravo, ta grille est identique au modèle !</div>'); }
    else { atCopyDraw(true); ui.say(false, '<div>✘ Il y a ' + wrong + ' case' + (wrong>1?'s':'') + ' différente' + (wrong>1?'s':'') + ' du modèle (entourée' + (wrong>1?'s':'') + ' en rouge).</div><div class="explain-line">Compare ligne par ligne, en partant du haut.</div>'); }
  }
  registerFamily({
    key:'atelier-copie', tag:'Reproduire le modèle', theme:'✋ Ateliers',
    note:'Un modèle est dessiné sur une grille ; on le reproduit case par case sur une grille vide (repérage, observation). Facile : grille 4×4, 5 cases ; Moyen : 5×5, 8 cases ; Difficile : 6×6, 12 cases. Les cases sont tirées au hasard.',
    build:function(wrap){ atCopy.ui = makeAtelier('atelier-copie', wrap, atCopyCheck); },
    generate:atCopyGenerate,
    signature:function(){ return JSON.stringify(atCopy.model); }
  });

  // ---------------------------------------------------------------------
  // 4. Trouver l'erreur : la copie est déjà remplie, il faut repérer la case en trop ou manquante
  // ---------------------------------------------------------------------
  var atErr = { n:0, model:null, copy:null, diff:null, marks:null, told:true, ui:null };
  function atErrGenerate(level){
    var n = level===0 ? 4 : level===1 ? 5 : 6, count = level===0 ? 5 : level===1 ? 8 : 12;
    var nDiff = level===0 ? 1 : level===1 ? 2 : 3;
    var model = [], copy = [], r, c;
    for(r=0;r<n;r++){ model.push([]); for(c=0;c<n;c++) model[r].push(false); }
    var placed = 0, guard = 0;
    while(placed<count && guard++<300){ r = randInt(0,n-1); c = randInt(0,n-1); if(!model[r][c]){ model[r][c] = true; placed++; } }
    copy = model.map(function(row){ return row.slice(); });
    // cases modifiées : au moins une « en trop » et une « manquante » dès que plusieurs erreurs
    var diff = [], wantExtra = [];
    for(var k=0;k<nDiff;k++) wantExtra.push(k % 2 === 0 ? Math.random()<0.5 : !wantExtra[k-1]);
    wantExtra.forEach(function(extra){
      var tries = 0, rr, cc;
      do { rr = randInt(0,n-1); cc = randInt(0,n-1); tries++; }
      while(tries<200 && (copy[rr][cc] === extra || diff.some(function(d){ return d[0]===rr && d[1]===cc; })));
      if(copy[rr][cc] !== extra){ diff.push([rr,cc]); copy[rr][cc] = extra; }   // extra=true : case ajoutée ; false : case retirée
    });
    atErr.n = n; atErr.model = model; atErr.copy = copy; atErr.diff = diff; atErr.told = level<2;
    atErr.marks = model.map(function(row){ return row.map(function(){ return false; }); });
    var how = level===2 ? 'Il y a des erreurs : trouve-les toutes.' : (nDiff===1 ? 'Il y a 1 erreur.' : 'Il y a ' + nDiff + ' erreurs.');
    atErr.ui.reset('Compare la copie (à droite) avec le modèle (à gauche). ' + how + ' Touche chaque case en trop ou manquante dans la copie.', 'Modèle et copie avec erreurs : touche les cases fausses de la copie', '0 0 260 150');
    atErrDraw(null);
  }
  function atErrIsDiff(r, c){ return atErr.diff.some(function(d){ return d[0]===r && d[1]===c; }); }
  function atErrDraw(reveal){
    var ui = atErr.ui, n = atErr.n, cell = Math.floor(116/n), size = cell*n, r, c;
    var xm = 8 + (116-size)/2, xp = 136 + (116-size)/2, y0 = 22 + (116-size)/2;
    ui.svg.innerHTML = '';
    ui.svg.appendChild(svgText(66, 15, 13, 'Modèle'));
    ui.svg.appendChild(svgText(194, 15, 13, 'Copie'));
    for(r=0;r<n;r++) for(c=0;c<n;c++){
      ui.svg.appendChild(el('rect', { x:xm + c*cell, y:y0 + r*cell, width:cell, height:cell, fill:atErr.model[r][c] ? AT_COLORS.given : AT_COLORS.empty, stroke:'var(--text)', 'stroke-width':1.2 }));
      (function(rr, cc){
        var marked = atErr.marks[rr][cc];
        var rect = atelierCell(ui.svg, xp + cc*cell, y0 + rr*cell, cell, cell, atErr.copy[rr][cc] ? AT_COLORS.mine : AT_COLORS.empty,
          'case ' + (rr+1) + ', ' + (cc+1) + (atErr.copy[rr][cc] ? ', coloriée' : ', vide') + (marked ? ', signalée comme erreur' : ''), function(){
            if(ui.solved) return;
            atErr.marks[rr][cc] = !atErr.marks[rr][cc];
            ui.fb.className = 'feedback'; ui.fb.innerHTML = '';
            atErrDraw(null);
          });
        if(marked){ rect.setAttribute('stroke', '#d33'); rect.setAttribute('stroke-width', 3.5); ui.svg.appendChild(svgText(xp + cc*cell + cell/2, y0 + rr*cell + cell/2 + 4, Math.max(11, cell*0.5), '✖')); }
        if(reveal && atErrIsDiff(rr, cc)){ rect.setAttribute('stroke', reveal==='good' ? '#2a9d4a' : '#d33'); rect.setAttribute('stroke-width', 3.5); }
      })(r, c);
    }
  }
  function atErrCheck(ui){
    var marked = [], r, c;
    for(r=0;r<atErr.n;r++) for(c=0;c<atErr.n;c++) if(atErr.marks[r][c]) marked.push([r,c]);
    var good = marked.filter(function(m){ return atErrIsDiff(m[0], m[1]); }).length, total = atErr.diff.length, wrong = marked.length - good;
    if(good===total && wrong===0){
      var parts = atErr.diff.map(function(d){ return 'ligne ' + (d[0]+1) + ', colonne ' + (d[1]+1) + ' : la case est ' + (atErr.copy[d[0]][d[1]] ? 'en trop' : 'manquante'); });
      atErrDraw('good');
      atelierWin(ui, '<div>✔ Bravo, tu as trouvé ' + (total>1 ? 'toutes les erreurs' : 'l\'erreur') + ' !</div><div class="explain-line">' + parts.join(' ; ') + '.</div>');
    } else if(marked.length===0){
      ui.say(false, '<div>✘ Touche les cases de la copie qui sont différentes du modèle.</div><div class="explain-line">Compare ligne par ligne, en partant du haut.</div>');
    } else {
      var msg = good + ' erreur' + (good>1?'s':'') + ' trouvée' + (good>1?'s':'');
      if(atErr.told) msg += ' sur ' + total;
      if(wrong>0) msg += ', et ' + wrong + ' case' + (wrong>1?'s':'') + ' touchée' + (wrong>1?'s':'') + ' à tort';
      ui.say(false, '<div>✘ ' + msg + '.</div><div class="explain-line">Une erreur, c\'est une case coloriée en trop, ou une case oubliée. Retouche une case pour enlever la croix.</div>');
    }
  }
  registerFamily({
    key:'atelier-erreur', tag:'Trouver l\'erreur', theme:'✋ Ateliers',
    note:'Un modèle et sa copie sont côte à côte ; la copie contient des erreurs (case coloriée en trop ou case oubliée) qu\'on touche pour les signaler. Facile : grille 4×4, 1 erreur ; Moyen : 5×5, 2 erreurs ; Difficile : 6×6, 3 erreurs sans que le nombre soit donné. Les cases et les erreurs sont tirées au hasard (avec à la fois « en trop » et « manquante » dès 2 erreurs).',
    build:function(wrap){ atErr.ui = makeAtelier('atelier-erreur', wrap, atErrCheck); },
    generate:atErrGenerate,
    signature:function(){ return JSON.stringify(atErr.model) + JSON.stringify(atErr.diff); }
  });

  // ---------------------------------------------------------------------
  // 5. Axes de symétrie : on touche les lignes qui sont de vrais axes ; le pliage montre les cases qui ne se superposent pas
  // ---------------------------------------------------------------------
  var AX_NAMES = { V:'la ligne verticale', H:'la ligne horizontale', D1:'la diagonale ↘', D2:'la diagonale ↗' };
  var AX_SHORT = { V:'verticale', H:'horizontale', D1:'diagonale ↘', D2:'diagonale ↗' };
  var atAxe = { n:0, fig:null, cands:null, sel:null, truth:null, ui:null };
  function axReflect(ax, r, c, n){
    if(ax==='V') return [r, n-1-c];
    if(ax==='H') return [n-1-r, c];
    if(ax==='D1') return [c, r];
    return [n-1-c, n-1-r];
  }
  // cases qui n'ont pas de « jumelle » de l'autre côté de l'axe
  function axMismatch(fig, ax, n){
    var out = [], r, c;
    for(r=0;r<n;r++) for(c=0;c<n;c++){ var q = axReflect(ax, r, c, n); if(fig[r][c] !== fig[q[0]][q[1]]) out.push([r,c]); }
    return out;
  }
  function axTruth(fig, n, cands){ return cands.filter(function(ax){ return axMismatch(fig, ax, n).length===0; }); }
  function atAxeGenerate(level){
    var n = level===0 ? 4 : level===1 ? 5 : pick([5,6]);
    var cands = level<2 ? ['V','H'] : ['V','H','D1','D2'];
    var wants = level===0 ? [['V'],['H']] : level===1 ? [['V'],['H'],['V','H'],[]] : [['V'],['H'],['D1'],['D2'],['V','H'],['D1','D2'],['V','H','D1','D2'],[]];
    var want = pickFresh('axe-want-' + level, wants), fig = null, guard = 0, r, c;
    do {
      fig = []; for(r=0;r<n;r++){ fig.push([]); for(c=0;c<n;c++) fig[r].push(false); }
      var seeds = randInt(2,4); for(var s=0;s<seeds;s++) fig[randInt(0,n-1)][randInt(0,n-1)] = true;
      var changed = true;
      while(changed){ changed = false;
        for(r=0;r<n;r++) for(c=0;c<n;c++) if(fig[r][c]) want.forEach(function(ax){ var q = axReflect(ax, r, c, n); if(!fig[q[0]][q[1]]){ fig[q[0]][q[1]] = true; changed = true; } });
      }
      var cnt = 0; for(r=0;r<n;r++) for(c=0;c<n;c++) if(fig[r][c]) cnt++;
      var truth = axTruth(fig, n, ['V','H','D1','D2']);
      var okShape = cnt >= 4 && cnt <= n*n*0.65 && truth.length===want.length && want.every(function(a){ return truth.indexOf(a)>=0; });
    } while(!okShape && ++guard < 400);
    atAxe.n = n; atAxe.fig = fig; atAxe.cands = cands; atAxe.truth = axTruth(fig, n, cands);
    atAxe.sel = {}; cands.forEach(function(a){ atAxe.sel[a] = false; });
    var how = level===0 ? 'Cette figure a un axe de symétrie : touche-le.' : 'Touche toutes les lignes qui sont des axes de symétrie (il peut y en avoir 0, 1' + (cands.length>2 ? ', 2 ou plus' : ' ou 2') + ').';
    atAxe.ui.reset(how + ' Un axe partage la figure en deux moitiés qui se superposent quand on plie.', 'Figure et lignes candidates : touche les axes de symétrie');
    atAxeDraw(null);
  }
  function atAxeDraw(wrongAxes){
    var ui = atAxe.ui, n = atAxe.n, cell = Math.floor(200/n), size = cell*n, x0 = (260-size)/2, y0 = (260-size)/2, r, c;
    ui.svg.innerHTML = '';
    for(r=0;r<n;r++) for(c=0;c<n;c++){
      ui.svg.appendChild(el('rect', { x:x0 + c*cell, y:y0 + r*cell, width:cell, height:cell, fill:atAxe.fig[r][c] ? AT_COLORS.given : AT_COLORS.empty, stroke:'var(--text)', 'stroke-width':1 }));
    }
    // pliage : cases sans jumelle, entourées en rouge pour chaque ligne fausse choisie
    (wrongAxes || []).forEach(function(ax){
      axMismatch(atAxe.fig, ax, n).forEach(function(m){
        ui.svg.appendChild(el('rect', { x:x0 + m[1]*cell + 2, y:y0 + m[0]*cell + 2, width:cell-4, height:cell-4, fill:'none', stroke:'#d33', 'stroke-width':3, 'stroke-dasharray':'5,3', 'pointer-events':'none' }));
      });
    });
    var m = 12, xa = x0 - m, xb = x0 + size + m, ya = y0 - m, yb = y0 + size + m, mid = x0 + size/2, midy = y0 + size/2;
    var coords = { V:[mid, ya, mid, yb], H:[xa, midy, xb, midy], D1:[xa, ya, xb, yb], D2:[xa, yb, xb, ya] };
    atAxe.cands.forEach(function(ax){
      var k = coords[ax], on = atAxe.sel[ax];
      ui.svg.appendChild(el('line', { x1:k[0], y1:k[1], x2:k[2], y2:k[3], stroke:on ? '#d33' : 'var(--text)', 'stroke-width':on ? 4.5 : 2.5, 'stroke-dasharray':on ? '' : '7,5', 'pointer-events':'none' }));
      var hit = el('line', { x1:k[0], y1:k[1], x2:k[2], y2:k[3], stroke:'transparent', 'stroke-width':26, 'stroke-linecap':'round', role:'button', tabindex:0,
        'aria-label':'Ligne ' + AX_SHORT[ax] + (on ? ', choisie comme axe' : ', non choisie'), style:'cursor:pointer;touch-action:manipulation' });
      function toggle(){ if(ui.solved) return; atAxe.sel[ax] = !atAxe.sel[ax]; ui.fb.className = 'feedback'; ui.fb.innerHTML = ''; atAxeDraw(null); }
      hit.addEventListener('click', toggle);
      hit.addEventListener('keydown', function(e){ if(e.key==='Enter' || e.key===' '){ e.preventDefault(); toggle(); } });
      ui.svg.appendChild(hit);
    });
  }
  function atAxeCheck(ui){
    var chosen = atAxe.cands.filter(function(a){ return atAxe.sel[a]; });
    var falsePicks = chosen.filter(function(a){ return atAxe.truth.indexOf(a)<0; });
    var missed = atAxe.truth.filter(function(a){ return chosen.indexOf(a)<0; });
    if(!falsePicks.length && !missed.length){
      atAxeDraw(null);
      var msg = atAxe.truth.length===0 ? 'Cette figure n\'a aucun axe de symétrie : en pliant le long d\'une de ces lignes, les moitiés ne se superposent pas.'
        : atAxe.truth.length===1 ? 'En pliant le long de ' + AX_NAMES[atAxe.truth[0]] + ', les deux moitiés se superposent exactement.'
        : 'Pliée le long de chacune de ces ' + atAxe.truth.length + ' lignes, la figure se superpose exactement sur elle-même.';
      atelierWin(ui, '<div>✔ Bravo !</div><div class="explain-line">' + msg + '</div>');
      return;
    }
    atAxeDraw(falsePicks);
    var html = '<div>✘ Pas encore.</div><div class="explain-line">';
    if(falsePicks.length) html += (falsePicks.length>1 ? 'Ces lignes ne sont pas des axes' : AX_NAMES[falsePicks[0]].charAt(0).toUpperCase() + AX_NAMES[falsePicks[0]].slice(1) + ' n\'est pas un axe') + ' : en pliant, les cases entourées en rouge n\'ont pas de jumelle. ';
    if(missed.length) html += (chosen.length===0 ? 'Il y a au moins un axe à trouver.' : 'Il manque encore ' + (missed.length>1 ? missed.length + ' axes.' : 'un axe.'));
    ui.say(false, html + '</div>');
  }
  registerFamily({
    key:'atelier-axe', tag:'Axes de symétrie', theme:'✋ Ateliers',
    note:'Une figure en cases et des lignes de pliage en pointillés : on touche celles qui sont de vrais axes de symétrie. Si on se trompe, les cases qui ne se superposent pas au pliage sont entourées en rouge. Facile : 4×4, la figure a 1 axe (vertical ou horizontal) ; Moyen : 5×5, lignes verticale/horizontale, 0, 1 ou 2 axes ; Difficile : 5×5 ou 6×6, avec les 2 diagonales, de 0 à 4 axes. La figure est construite pour avoir exactement les axes voulus (et vérifiée), le reste est tiré au hasard.',
    build:function(wrap){ atAxe.ui = makeAtelier('atelier-axe', wrap, atAxeCheck); },
    generate:atAxeGenerate,
    signature:function(){ return atAxe.n + JSON.stringify(atAxe.fig); }
  });
