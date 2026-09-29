  /* ===================== BATAILLE (équipes de cartes) =====================
     Règles (voir aussi le bloc "Comment ça marche ?" dans l'interface) :
     - une seule caractéristique par personnage : ses points (pts), qui sont
       à la fois sa force d'attaque et son énergie ;
     - quand A attaque B : B perd autant de points que A en a, et A perd
       autant de points que B en avait (les deux cartes s'abîment) ;
     - Archer : il attaque sans jamais perdre de points en retour ;
     - Soutien : il ajoute +5 points à tous ses alliés (ceux déjà sur le
       terrain quand il arrive, puis chaque allié qui arrive ensuite tant
       qu'il est là) ;
     - équipe = 3 classiques + 1 soutien + 1 archer ; 3 cartes tirées au
       hasard sont posées sur le terrain, et une carte de la réserve entre
       dès qu'une carte est battue (à 0 point ou moins) ;
     - le camp qui n'a plus aucune carte (terrain + réserve) a perdu. */
  var BT_ROLE_META = {
    classic:{ label:'Classique', icon:'⚔️' },
    support:{ label:'Soutien',   icon:'💖' },
    archer: { label:'Archer',    icon:'🏹' }
  };
  var BT_FIELD_SIZE = 3, BT_SUPPORT_BONUS = 5;
  var BT_ROLE_ORDER = ['classic','support','archer'];
  var BT_LIMITS = { classic:3, support:1, archer:1 };

  function btSide(){ return currentThemeKey()==='brainrot' ? 'brainrot' : 'cats'; }
  function btMyList(){ return btSide()==='cats' ? CAT_SPRITES : BRAINROT_SPRITES; }
  function btEnemyList(){ return btSide()==='cats' ? BRAINROT_SPRITES : CAT_SPRITES; }
  function btMyOwned(){ return btSide()==='cats' ? ownedCats : ownedBrain; }
  function btRand(n){ return Math.floor(Math.random()*n); }
  function btShuffle(arr){
    var a = arr.slice();
    for(var i=a.length-1;i>0;i--){ var j = btRand(i+1), t = a[i]; a[i]=a[j]; a[j]=t; }
    return a;
  }

  /* ---- Choix de l'équipe (mémorisé par clan) ---- */
  var btSel = { cats:{classic:[],support:[],archer:[]}, brainrot:{classic:[],support:[],archer:[]} };
  (function loadBtSel(){
    ['cats','brainrot'].forEach(function(side){
      try{
        var raw = JSON.parse(localStorage.getItem('geo_bt_team_'+side) || 'null');
        if(raw) BT_ROLE_ORDER.forEach(function(r){ if(Array.isArray(raw[r])) btSel[side][r] = raw[r].slice(0, BT_LIMITS[r]); });
      }catch(e){}
    });
  })();
  function saveBtSel(){
    try{
      ['cats','brainrot'].forEach(function(side){ localStorage.setItem('geo_bt_team_'+side, JSON.stringify(btSel[side])); });
    }catch(e){}
  }
  function btSpritePlain(sprite){ return sprite; }
  function btSetupCard(sprite, picked, full, onClick){
    var card = document.createElement('button');
    card.type = 'button';
    card.className = 'sprite-card owned' + (picked ? ' selected' : '') + (full && !picked ? ' is-full' : '');
    card.setAttribute('aria-pressed', picked ? 'true' : 'false');
    card.setAttribute('aria-label', sprite.name + ', ' + BT_ROLE_META[sprite.role].label + ', ' + sprite.pts + ' points' + (picked ? ', choisi' : ''));
    renderSpriteVisual(card, sprite);
    var nameEl = document.createElement('div'); nameEl.className='sp-name'; nameEl.textContent = sprite.name;
    card.appendChild(nameEl);
    var pts = document.createElement('div'); pts.className='sp-role'; pts.textContent = '❤️ ' + sprite.pts + ' points';
    card.appendChild(pts);
    card.addEventListener('click', onClick);
    return card;
  }
  function renderBtSetup(){
    if(!document.getElementById('bt-grid-classic')) return;
    var side = btSide(), sel = btSel[side], owned = btMyOwned();
    var ok = true, missing = [];
    BT_ROLE_ORDER.forEach(function(role){
      // on oublie les personnages choisis qui ne sont plus possédés (ex : effacement de la progression)
      sel[role] = sel[role].filter(function(id){ return !!owned[id]; });
      var container = document.getElementById('bt-grid-'+role);
      container.innerHTML = '';
      var mine = btMyList().filter(function(s){ return s.role===role && owned[s.id]; });
      mine.forEach(function(sprite){
        var picked = sel[role].indexOf(sprite.id) !== -1;
        var full = sel[role].length >= BT_LIMITS[role];
        container.appendChild(btSetupCard(sprite, picked, full, function(){
          var pos = sel[role].indexOf(sprite.id);
          if(pos !== -1) sel[role].splice(pos,1);
          else if(sel[role].length < BT_LIMITS[role]) sel[role].push(sprite.id);
          else if(BT_LIMITS[role] === 1) sel[role] = [sprite.id]; // un seul emplacement : on remplace
          saveBtSel();
          renderBtSetup();
        }));
      });
      document.getElementById('bt-count-'+role).textContent = sel[role].length + '/' + BT_LIMITS[role];
      if(sel[role].length !== BT_LIMITS[role]) ok = false;
      if(mine.length < BT_LIMITS[role]) missing.push((BT_LIMITS[role]-mine.length) + ' ' + BT_ROLE_META[role].label.toLowerCase());
    });
    var missEl = document.getElementById('bt-missing');
    if(missing.length){
      missEl.hidden = false;
      missEl.textContent = 'Il te manque encore : ' + missing.join(', ') + '. Va en débloquer à la boutique !';
    } else missEl.hidden = true;
    document.getElementById('bt-start').disabled = !ok;
    document.getElementById('bt-intro').textContent = btSide()==='cats'
      ? 'Tu joues avec les Chats Kawaii contre les Brainrots. Forme ton équipe : 3 classiques, 1 soutien et 1 archer.'
      : 'Tu joues avec les Brainrots contre les Chats Kawaii. Forme ton équipe : 3 classiques, 1 soutien et 1 archer.';
  }

  // Petite flèche/éclair qui vole de l'attaquant vers la carte visée.
  function playAttackAnim(fromEl, toEl, emoji){
    var fromRect = fromEl.getBoundingClientRect(), toRect = toEl.getBoundingClientRect();
    var fx = fromRect.left+fromRect.width/2, fy = fromRect.top+fromRect.height/2;
    var tx = toRect.left+toRect.width/2, ty = toRect.top+toRect.height/2;
    var bolt = document.createElement('div');
    bolt.className = 'attack-bolt';
    bolt.setAttribute('aria-hidden','true');
    bolt.textContent = emoji;
    bolt.style.left = fx+'px'; bolt.style.top = fy+'px';
    bolt.style.setProperty('--tx',(tx-fx)+'px');
    bolt.style.setProperty('--ty',(ty-fy)+'px');
    document.body.appendChild(bolt);
    setTimeout(function(){ bolt.remove(); }, 550);
  }

  /* ---- Moteur de combat ---- */
  var bt = null, btUid = 0;
  function btMakeUnit(sprite){ return { uid:++btUid, sprite:sprite, pts:sprite.pts, buffed:false }; }
  function btOnArrive(sideObj, unit, notes){
    if(unit.sprite.role === 'support'){
      sideObj.field.forEach(function(u){
        if(u !== unit){ u.pts += BT_SUPPORT_BONUS; u.buffed = true; }
      });
      if(sideObj.field.length > 1) notes.push(unit.sprite.name + ' donne +' + BT_SUPPORT_BONUS + ' points à ses alliés !');
    } else if(sideObj.field.some(function(u){ return u !== unit && u.sprite.role === 'support'; })){
      unit.pts += BT_SUPPORT_BONUS; unit.buffed = true;
      notes.push(unit.sprite.name + ' reçoit +' + BT_SUPPORT_BONUS + ' points du soutien.');
    }
  }
  function btDrawFromReserve(sideObj, notes){
    if(!sideObj.reserve.length || sideObj.field.length >= BT_FIELD_SIZE) return null;
    var unit = sideObj.reserve.splice(btRand(sideObj.reserve.length), 1)[0];
    sideObj.field.push(unit);
    btOnArrive(sideObj, unit, notes);
    return unit;
  }
  function btBuildEnemyTeam(myUnits){
    var maxMine = Math.max.apply(null, myUnits.map(function(u){ return u.sprite.pts; }));
    var pool = btEnemyList();
    function pickRole(role, n){
      var all = pool.filter(function(s){ return s.role === role; });
      // (équilibrage mesuré par simulation : avec 'pts <= meilleure carte du joueur', un
      // joueur qui tape au hasard gagne ~50 % des combats, un joueur attentif ~70 %)
      var cands = all.filter(function(s){ return s.pts <= maxMine; });
      if(cands.length < n) cands = all.slice().sort(function(a,b){ return a.pts-b.pts; }).slice(0, Math.max(n,3));
      return btShuffle(cands).slice(0, n);
    }
    return pickRole('classic',3).concat(pickRole('support',1), pickRole('archer',1)).map(btMakeUnit);
  }
  function btStart(){
    var side = btSide(), sel = btSel[side];
    var ids = sel.classic.concat(sel.support, sel.archer);
    var myUnits = ids.map(function(id){ return btMakeUnit(findSprite(btMyList(), id)); });
    if(myUnits.length !== 5 || myUnits.some(function(u){ return !u.sprite; })) return;
    var enUnits = btBuildEnemyTeam(myUnits);
    bt = {
      side: side,
      pl: { field:[], reserve:myUnits },
      en: { field:[], reserve:enUnits },
      phase: 'pick-attacker', selected: null, over: false, log: []
    };
    var notes = [];
    for(var i=0;i<BT_FIELD_SIZE;i++){ btDrawFromReserve(bt.pl, notes); btDrawFromReserve(bt.en, notes); }
    document.getElementById('bt-setup').hidden = true;
    document.getElementById('bt-over').hidden = true;
    document.getElementById('bt-arena').hidden = false;
    document.getElementById('bt-enemy-title').textContent = side==='cats' ? 'Adversaires (Brainrots 👹)' : 'Adversaires (Chats Kawaii 🐱)';
    btLog(notes.length ? notes : ['Le combat commence !'], true);
    btSetStatus('À toi ! Touche une de tes cartes pour attaquer.');
    btRender();
  }
  function btSetStatus(text){ document.getElementById('bt-status').textContent = text; }
  function btLog(lines, reset){
    if(reset) bt.log = [];
    lines.forEach(function(l){ bt.log.push(l); });
    bt.log = bt.log.slice(-4);
    document.getElementById('bt-log').innerHTML = '';
    bt.log.forEach(function(l){
      var p = document.createElement('p'); p.textContent = l; document.getElementById('bt-log').appendChild(p);
    });
  }
  function btUnitCard(unit, isEnemy){
    var card = document.createElement('button');
    card.type = 'button';
    card.className = 'bcard' + (isEnemy ? ' enemy' : '');
    card.setAttribute('data-uid', String(unit.uid));
    var m = BT_ROLE_META[unit.sprite.role];
    card.setAttribute('aria-label', (isEnemy ? 'Adversaire : ' : 'Ta carte : ') + unit.sprite.name + ', ' + m.label + ', ' + unit.pts + ' points');
    var art = document.createElement('div'); art.className = 'bcard-art';
    renderCreatureVisual(art, unit.sprite, fighterDisplayMode);
    card.appendChild(art);
    var nameEl = document.createElement('div'); nameEl.className = 'bcard-name'; nameEl.textContent = unit.sprite.name;
    card.appendChild(nameEl);
    var role = document.createElement('div'); role.className = 'bcard-role'; role.textContent = m.icon + ' ' + m.label;
    card.appendChild(role);
    var pts = document.createElement('div'); pts.className = 'bcard-pts'; pts.textContent = '❤️ ' + unit.pts + (unit.buffed ? ' ⬆' : '');
    card.appendChild(pts);
    return card;
  }
  function btRender(){
    if(!bt) return;
    var plField = document.getElementById('bt-player-field'), enField = document.getElementById('bt-enemy-field');
    plField.innerHTML = ''; enField.innerHTML = '';
    bt.pl.field.forEach(function(u){
      var c = btUnitCard(u, false);
      var isSel = bt.selected === u;
      if(isSel){ c.classList.add('selected'); c.setAttribute('aria-pressed','true'); }
      var canPick = !bt.over && ((bt.phase === 'pick-attacker') || (bt.phase === 'pick-target' && isSel));
      c.disabled = !canPick;
      c.addEventListener('click', function(){
        if(bt.phase === 'pick-attacker'){
          bt.selected = u; bt.phase = 'pick-target';
          btSetStatus(u.sprite.name + ' est prêt : touche la carte adverse à attaquer (ou retouche ta carte pour changer).');
          btRender();
        } else if(bt.phase === 'pick-target' && bt.selected === u){
          bt.selected = null; bt.phase = 'pick-attacker';
          btSetStatus('À toi ! Touche une de tes cartes pour attaquer.');
          btRender();
        }
      });
      plField.appendChild(c);
    });
    bt.en.field.forEach(function(u){
      var c = btUnitCard(u, true);
      var canTarget = !bt.over && bt.phase === 'pick-target';
      if(canTarget) c.classList.add('targetable');
      c.disabled = !canTarget;
      c.addEventListener('click', function(){
        if(bt.phase !== 'pick-target') return;
        var attacker = bt.selected;
        bt.selected = null; bt.phase = 'busy';
        btSetStatus('Attaque en cours…');
        btRender();
        btResolveAttack(bt.pl, attacker, bt.en, u, false, btAfterPlayerAttack);
      });
      enField.appendChild(c);
    });
    document.getElementById('bt-player-reserve').textContent = 'Réserve : ' + bt.pl.reserve.length + ' carte' + (bt.pl.reserve.length>1 ? 's' : '');
    document.getElementById('bt-enemy-reserve').textContent = 'Réserve adverse : ' + bt.en.reserve.length + ' carte' + (bt.en.reserve.length>1 ? 's' : '');
  }
  function btEl(unit){ return document.querySelector('#bt-arena [data-uid="'+unit.uid+'"]'); }

  // Résout une attaque : animation, échange de points, cartes battues,
  // remplacements depuis la réserve, puis rappelle done().
  function btResolveAttack(attSide, attacker, defSide, target, attackerIsEnemy, done){
    var archer = attacker.sprite.role === 'archer';
    var fromEl = btEl(attacker), toEl = btEl(target);
    if(fromEl && toEl) playAttackAnim(fromEl, toEl, archer ? '🏹' : (attackerIsEnemy ? '💥' : '⚔️'));
    setTimeout(function(){
      var dmgToTarget = attacker.pts;
      var dmgToAttacker = archer ? 0 : target.pts;
      target.pts -= dmgToTarget;
      attacker.pts -= dmgToAttacker;
      var lines = [];
      if(archer){
        lines.push(attacker.sprite.name + ' tire à distance : ' + target.sprite.name + ' perd ' + dmgToTarget + ' points, ' + attacker.sprite.name + ' ne perd rien.');
      } else {
        lines.push(attacker.sprite.name + ' attaque ' + target.sprite.name + ' : ' + target.sprite.name + ' perd ' + dmgToTarget + ' points et ' + attacker.sprite.name + ' en perd ' + dmgToAttacker + '.');
      }
      var hitEl = btEl(target); if(hitEl) hitEl.classList.add('hit');
      if(!archer){ var hitA = btEl(attacker); if(hitA) hitA.classList.add('hit'); }
      playSound(attackerIsEnemy ? 'bad' : 'good');
      btLog(lines);
      btRender();
      // Marque les cartes battues, puis les retire après un court instant.
      var dead = [];
      [attSide, defSide].forEach(function(sd){
        sd.field.forEach(function(u){ if(u.pts <= 0) dead.push({ side:sd, unit:u }); });
      });
      dead.forEach(function(d){ var e = btEl(d.unit); if(e) e.classList.add('dying'); });
      setTimeout(function(){
        var notes = [];
        dead.forEach(function(d){
          d.side.field.splice(d.side.field.indexOf(d.unit), 1);
          notes.push(d.unit.sprite.name + ' est battu' + (d.unit.sprite.role==='support' ? '' : '') + ' !');
        });
        dead.forEach(function(d){
          var arrived = btDrawFromReserve(d.side, notes);
          if(arrived) notes.push(arrived.sprite.name + ' entre sur le terrain.');
        });
        // Une carte qui reçoit un bonus après remplacement est déjà comptée dans btOnArrive ; on remplit aussi les places libres restantes.
        [bt.pl, bt.en].forEach(function(sd){ while(sd.field.length < BT_FIELD_SIZE && sd.reserve.length){ var a = btDrawFromReserve(sd, notes); if(a) notes.push(a.sprite.name + ' entre sur le terrain.'); } });
        if(notes.length) btLog(notes);
        btRender();
        done();
      }, dead.length ? 650 : 350);
    }, 480);
  }
  function btAlive(sd){ return sd.field.length + sd.reserve.length > 0; }
  function btCheckEnd(){
    var me = btAlive(bt.pl), foe = btAlive(bt.en);
    if(me && foe) return false;
    bt.over = true; bt.phase = 'over';
    var text;
    if(!me && !foe) text = '🤝 Égalité ! Il ne reste plus aucune carte des deux côtés.';
    else if(me){ text = '🏆 Victoire ! Tu as battu toute l\'équipe adverse. +3 ⭐'; addStar(3); playSound('good'); celebrate('good', document.getElementById('bt-over-text')); }
    else { text = '💥 Défaite… toute ton équipe a été battue. Réessaie, tu peux changer d\'équipe !'; playSound('bad'); }
    document.getElementById('bt-over-text').textContent = text;
    document.getElementById('bt-over').hidden = false;
    document.getElementById('bt-arena').hidden = false;
    btSetStatus('Combat terminé.');
    btRender();
    return true;
  }
  function btAfterPlayerAttack(){
    if(btCheckEnd()) return;
    btSetStatus('Tour de l\'adversaire…');
    setTimeout(btEnemyTurn, 650);
  }
  function btChooseEnemyMove(){
    var best = null, bestScore = -1e9;
    bt.en.field.forEach(function(a){
      bt.pl.field.forEach(function(t){
        var archer = a.sprite.role === 'archer';
        var kills = a.pts >= t.pts, dies = !archer && t.pts >= a.pts;
        var score = (kills ? 4 : 0) + (dies ? -5 : 0) + (archer ? 2 : 0) + a.pts*0.05 - t.pts*0.1 + Math.random();
        if(score > bestScore){ bestScore = score; best = { a:a, t:t }; }
      });
    });
    return best;
  }
  function btEnemyTurn(){
    if(!bt || bt.over) return;
    var move = btChooseEnemyMove();
    if(!move){ if(!btCheckEnd()){ bt.phase = 'pick-attacker'; btRender(); } return; }
    btResolveAttack(bt.en, move.a, bt.pl, move.t, true, function(){
      if(btCheckEnd()) return;
      bt.phase = 'pick-attacker';
      btSetStatus('À toi ! Touche une de tes cartes pour attaquer.');
      btRender();
    });
  }
  function btBackToSetup(){
    bt = null;
    document.getElementById('bt-arena').hidden = true;
    document.getElementById('bt-over').hidden = true;
    document.getElementById('bt-setup').hidden = false;
    renderBtSetup();
  }
  function onThemeChangedForBattle(){ btBackToSetup(); }
  document.getElementById('bt-start').addEventListener('click', btStart);
  document.getElementById('bt-quit').addEventListener('click', btBackToSetup);
  document.getElementById('bt-change-team').addEventListener('click', btBackToSetup);
  document.getElementById('bt-again').addEventListener('click', btStart);

  buildLevelRow(document.getElementById('arena-modes'), ['Boutique 🛒','Bataille ⚔️'], 0, function(idx){
    document.getElementById('arena-shop-wrap').hidden = idx!==0;
    document.getElementById('arena-battle-wrap').hidden = idx!==1;
    if(idx===1) renderBtSetup();
  });
  renderShop();
  renderBtSetup();
  renderMascotDock();
  renderTopMascotIcon();
  updateStreakPill();

