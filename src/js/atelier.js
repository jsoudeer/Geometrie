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
