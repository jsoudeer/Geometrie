  /* ===================== BATAILLE (équipes de cartes) =====================
     Règles (voir aussi le bloc "Comment ça marche ?" dans l'interface) :
     - une seule caractéristique par personnage : ses points (pts), qui sont
       à la fois sa force d'attaque et son énergie ;
     - quand A attaque B : B perd autant de points que A en a, et A perd
       autant de points que B en avait (les deux cartes s'abîment) ;
     - Archer : il attaque sans jamais perdre de points en retour ;
     - Soutien : il ajoute +5 points à tous ses alliés (ceux déjà sur le
       terrain quand il arrive, puis chaque allié qui arrive ensuite tant
       qu'il est là) ; et, à la fin de chaque tour de son camp, il donne en plus
       +2 points (BT_SUPPORT_TURN) à chacun de ses alliés présents ;
     - équipe = jusqu'à 3 classiques + 1 soutien + 1 archer (aucun rôle n'est
       obligatoire, il faut au moins 1 carte) ; l'équipe adverse a la même
       composition ; 3 cartes tirées au hasard sont posées sur le terrain, et une carte de la réserve entre
       dès qu'une carte est battue (à 0 point ou moins) ;
     - le camp qui n'a plus aucune carte (terrain + réserve) a perdu ;
     - évolutions (boutique) : spritePts() ajoute 20 % des points de base par niveau ;
     - COMPÉTENCES (competences.js) : un personnage rare ou de défi a une compétence dès le départ, un commun
       la gagne au niveau Ultime. Tous les 3 tours du joueur (2 pour une compétence au niveau Ultime), une de ses
       cartes « chargées » reçoit un déclencheur 🎁 (un seul à la fois, conservé tant qu'il n'est pas utilisé).
       En choisissant cette carte, le joueur résout une petite question de maths : bonne réponse = dégâts ×2 (×2,5 à
       partir du niveau Évolué), erreur = dégâts normaux. La compétence « Doubler ou fixe » propose à la place le choix
       entre « ×2 » et « N dégâts fixes », N valant tour à tour le double, 30 % de moins ou 30 % de plus : il faut
       calculer pour bien choisir. L'adversaire n'a pas de compétence. */
  var BT_ROLE_META = {
    classic:{ label:'Classique', icon:'⚔️' },
    support:{ label:'Soutien',   icon:'💖' },
    archer: { label:'Archer',    icon:'🏹' }
  };
  var BT_FIELD_SIZE = 3, BT_SUPPORT_BONUS = 5, BT_SUPPORT_TURN = 2;
  // Vitesse du déroulé (1 = lent, pour bien voir attaques et conséquences ; les tests l'accélèrent).
  var BT_SPEED = 1;
  function btT(ms){ return Math.round(ms * BT_SPEED); }
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
  // Les cartes de choix sont créées UNE fois par personnage puis simplement
  // mises à jour : recréer les images à chaque clic les faisait clignoter.
  var btSetupCards = {};
  function btReconcile(container, els){
    Array.prototype.slice.call(container.children).forEach(function(el){ if(els.indexOf(el)===-1) container.removeChild(el); });
    els.forEach(function(el, i){ if(container.children[i]!==el) container.insertBefore(el, container.children[i] || null); });
  }
  function btSetupCard(sprite){
    var key = btSide() + '|' + sprite.id;
    var card = btSetupCards[key];
    if(!card){
      card = btSetupCards[key] = document.createElement('button');
      card.type = 'button';
      renderSpriteVisual(card, sprite);
      var nameEl = document.createElement('div'); nameEl.className='sp-name'; nameEl.textContent = sprite.name;
      card.appendChild(nameEl);
      var pts = document.createElement('div'); pts.className='sp-role';
      card.appendChild(pts); card._pts = pts; card._evo = -1;
      card.addEventListener('click', function(){ btToggleSetup(sprite); });
    }
    return card;
  }
  function btUpdateSetupCard(card, sprite, picked, full){
    var evo = spriteEvo(sprite), pts = spritePts(sprite);
    card.className = 'sprite-card owned' + (picked ? ' selected' : '') + (full && !picked ? ' is-full' : '');
    if(card._evo !== evo){
      // le niveau a changé (carte gardée en mémoire) : on redessine aussi l'image, qui peut être celle du nouveau niveau
      if(card._evo !== -1){
        Array.prototype.slice.call(card.querySelectorAll(':scope > svg, :scope > .sp-custom-img')).forEach(function(n){ n.remove(); });
        var svg = renderSpriteVisual(card, sprite, evo); card.insertBefore(svg, card.firstChild);
      } else applyEvoLook(card, sprite, evo);
      card._evo = evo;
    }
    else if(evo && !(evoArt(sprite, evo) || {}).exact){ card.classList.add('evo-' + evo); card.setAttribute('data-evo-clan', spriteSide(sprite)); }
    var sk = skillFor(sprite, evo);
    card._pts.textContent = '❤️ ' + pts + ' points' + (sk ? ' · ' + sk.icon : '');
    card.setAttribute('aria-pressed', picked ? 'true' : 'false');
    card.setAttribute('aria-label', sprite.name + ', ' + BT_ROLE_META[sprite.role].label + (evo ? ', ' + EVO_NAMES[evo] : '') + ', ' + pts + ' points' + (sk ? ', compétence ' + sk.name : '') + (picked ? ', choisi' : ''));
  }
  // Clic sur un personnage : on le retire s'il est choisi ; sinon on l'ajoute,
  // et si la place est pleine, le PLUS ANCIEN choisi de ce rôle sort.
  function btToggleSetup(sprite){
    var sel = btSel[btSide()], role = sprite.role;
    var pos = sel[role].indexOf(sprite.id);
    if(pos !== -1) sel[role].splice(pos,1);
    else {
      sel[role].push(sprite.id);
      while(sel[role].length > BT_LIMITS[role]) sel[role].shift();
    }
    saveBtSel();
    renderBtSetup();
  }
  // Équipe complète en un clic : les plus forts, ou au hasard, ou tout vider.
  function btAutoTeam(mode){
    var side = btSide(), sel = btSel[side], owned = btMyOwned();
    BT_ROLE_ORDER.forEach(function(role){
      var mine = btMyList().filter(function(x){ return x.role===role && owned[x.id]; });
      if(mode==='clear'){ sel[role] = []; return; }
      if(mode==='random') mine = btShuffle(mine);
      else mine = mine.slice().sort(function(x,y){ return spritePts(y) - spritePts(x); });
      sel[role] = mine.slice(0, BT_LIMITS[role]).map(function(x){ return x.id; });
    });
    saveBtSel();
    renderBtSetup();
  }
  function renderBtSetup(){
    if(!document.getElementById('bt-grid-classic')) return;
    var side = btSide(), sel = btSel[side], owned = btMyOwned();
    var ok = true, missing = [];
    BT_ROLE_ORDER.forEach(function(role){
      // on oublie les personnages choisis qui ne sont plus possédés (ex : effacement de la progression)
      sel[role] = sel[role].filter(function(id){ return !!owned[id]; });
      var container = document.getElementById('bt-grid-'+role);
      var mine = btMyList().filter(function(s){ return s.role===role && owned[s.id]; });
      var full = sel[role].length >= BT_LIMITS[role];
      btReconcile(container, mine.map(function(sprite){
        var card = btSetupCard(sprite);
        btUpdateSetupCard(card, sprite, sel[role].indexOf(sprite.id) !== -1, full);
        return card;
      }));
      document.getElementById('bt-count-'+role).textContent = sel[role].length + '/' + BT_LIMITS[role];
    });
    var teamSize = BT_ROLE_ORDER.reduce(function(n, role){ return n + sel[role].length; }, 0);
    ok = teamSize >= 1;
    if(sel.support.length === 0) missing.push('de soutien');
    if(sel.archer.length === 0) missing.push('d\'archer');
    var missEl = document.getElementById('bt-missing');
    if(missing.length){
      missEl.hidden = false;
      missEl.textContent = teamSize === 0 ? 'Choisis au moins une carte pour commencer.'
        : 'Pas ' + missing.join(' ni ') + ' dans ton équipe : c\'est ton choix, à toi de l\'assumer ! (Ils aident beaucoup, et la boutique en propose.)';
    } else missEl.hidden = true;
    document.getElementById('bt-start').disabled = !ok;
    var total = 0;
    BT_ROLE_ORDER.forEach(function(role){ sel[role].forEach(function(id){ var sp = findSprite(btMyList(), id); if(sp) total += spritePts(sp); }); });
    if(BT_DIFFS) document.getElementById('bt-diff-note').textContent = ok
      ? 'Ton équipe : ❤️ ' + total + ' points. Adversaires : environ ❤️ ' + Math.round(total * BT_DIFFS[btDiff].factor) + ' points.'
      : 'Choisis au moins une carte pour voir les points de tes adversaires.';
    document.getElementById('bt-intro').textContent = btSide()==='cats'
      ? 'Tu joues avec les Chats Kawaii contre les Brainrots. Forme ton équipe : jusqu\'à 3 classiques, 1 soutien et 1 archer.'
      : 'Tu joues avec les Brainrots contre les Chats Kawaii. Forme ton équipe : jusqu\'à 3 classiques, 1 soutien et 1 archer.';
  }

  // Petite flèche/éclair qui vole de l'attaquant vers la carte visée.
  function playAttackAnim(fromEl, toEl, emoji, duration){
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
    bolt.style.animationDuration = (duration || 550) + 'ms';
    document.body.appendChild(bolt);
    setTimeout(function(){ bolt.remove(); }, (duration || 550) + 50);
  }

  /* ---- Moteur de combat ---- */
  var bt = null, btUid = 0;
  // own = carte du joueur (points évolués) ; les cartes adverses restent à leurs points de base.
  function btMakeUnit(sprite, own){
    var evo = own ? spriteEvo(sprite) : 0, base = spritePts(sprite, evo);
    return { uid:++btUid, sprite:sprite, pts:base, base:base, evo:evo, buffed:false, skill: own ? skillFor(sprite, evo) : null };
  }
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
  // Fin de tour d'un camp : son Soutien (s'il est encore là) donne des points à ses alliés.
  function btSupportTick(sideObj){
    var sup = sideObj.field.filter(function(u){ return u.sprite.role==='support' && u.pts>0; })[0];
    if(!sup) return false;
    var allies = sideObj.field.filter(function(u){ return u!==sup && u.pts>0; });
    if(!allies.length) return false;
    allies.forEach(function(u){ u.pts += BT_SUPPORT_TURN; u.buffed = true; });
    btLog([sup.sprite.name + ' soutient son équipe : +' + BT_SUPPORT_TURN + ' points à chaque allié.']);
    return true;
  }
  function btDrawFromReserve(sideObj, notes){
    if(!sideObj.reserve.length || sideObj.field.length >= BT_FIELD_SIZE) return null;
    var unit = sideObj.reserve.splice(btRand(sideObj.reserve.length), 1)[0];
    sideObj.field.push(unit);
    btOnArrive(sideObj, unit, notes);
    return unit;
  }
  /* ---- Difficulté : le total des points ❤️ de l'équipe adverse vaut celui de la
     tienne (Normal), 20 % de moins (Facile) ou 20 % de plus (Difficile). ---- */
  var BT_DIFFS = [
    { label:'Facile (−20 %)',    factor:0.8, name:'Facile' },
    { label:'Normal',            factor:1,   name:'Normal' },
    { label:'Difficile (+20 %)', factor:1.2, name:'Difficile' }
  ];
  var btDiff = 1;
  try{ var savedDiff = parseInt(localStorage.getItem('geo_bt_diff'),10); if(savedDiff>=0 && savedDiff<BT_DIFFS.length) btDiff = savedDiff; }catch(e){}
  function btTotal(units){ return units.reduce(function(sum, u){ return sum + u.base; }, 0); }
  // Équipe adverse : même composition que la tienne (mêmes nombres de classiques, soutien, archer),
  // tirée au hasard parmi les combinaisons dont le total est le plus proche de la cible (variété conservée).
  function btBuildEnemyTeam(myUnits){
    var target = btTotal(myUnits) * BT_DIFFS[btDiff].factor;
    var pool = btEnemyList();
    function byRole(role){ return pool.filter(function(s){ return s.role === role; }); }
    var classics = byRole('classic'), supports = byRole('support'), archers = byRole('archer');
    var nC = myUnits.filter(function(u){ return u.sprite.role==='classic'; }).length;
    var nS = myUnits.filter(function(u){ return u.sprite.role==='support'; }).length;
    var nA = myUnits.filter(function(u){ return u.sprite.role==='archer'; }).length;
    var seen = {}, cands = [];
    for(var i=0;i<900;i++){
      var team = btShuffle(classics).slice(0,nC).concat(btShuffle(supports).slice(0,nS), btShuffle(archers).slice(0,nA));
      var key = team.map(function(x){ return x.id; }).sort().join(',');
      if(seen[key]) continue;
      seen[key] = true;
      var total = team.reduce(function(sum, x){ return sum + x.pts; }, 0);
      cands.push({ team:team, gap:Math.abs(total - target) });
    }
    cands.sort(function(a,b){ return a.gap - b.gap; });
    var best = cands[0].gap;
    var near = cands.filter(function(c){ return c.gap <= best; });    // ex æquo au plus près
    if(near.length < 6) near = cands.slice(0, 6).filter(function(c){ return c.gap <= best + 1; });
    return pick_(near).team.map(function(sp){ return btMakeUnit(sp, false); });
  }
  function pick_(arr){ return arr[btRand(arr.length)]; }
  function btStart(){
    var side = btSide(), sel = btSel[side];
    var ids = sel.classic.concat(sel.support, sel.archer);
    var myUnits = ids.map(function(id){ return btMakeUnit(findSprite(btMyList(), id), true); });
    if(myUnits.length < 1 || myUnits.some(function(u){ return !u.sprite; })) return;
    var enUnits = btBuildEnemyTeam(myUnits);
    var myTotal = btTotal(myUnits), enTotal = btTotal(enUnits);   // avant que les cartes soient tirées sur le terrain
    bt = {
      side: side,
      pl: { field:[], reserve:myUnits },
      en: { field:[], reserve:enUnits },
      phase: 'pick-attacker', selected: null, over: false, log: [], cards: {}, animateArrivals: false,
      turn: 0, proc: null, skillChoice: null, factors: []
    };
    var notes = [];
    for(var i=0;i<BT_FIELD_SIZE;i++){ btDrawFromReserve(bt.pl, notes); btDrawFromReserve(bt.en, notes); }
    document.getElementById('bt-setup').hidden = true;
    document.getElementById('bt-over').hidden = true;
    document.getElementById('bt-arena').hidden = false;
    document.getElementById('bt-enemy-title').textContent = (side==='cats' ? 'Adversaires (Brainrots 👹)' : 'Adversaires (Chats Kawaii 🐱)') + ' · ❤️ ' + enTotal;
    var intro = 'Difficulté ' + BT_DIFFS[btDiff].name + ' : équipe adverse ❤️ ' + enTotal + ' points, la tienne ❤️ ' + myTotal + '.';
    btLog([intro].concat(notes), true);
    btClearSfx();
    btStartPlayerTurn();
  }
  var BT_STATUS_PICK = 'À toi ! Touche une de tes cartes pour attaquer.';
  // Début de chaque tour du joueur : une compétence se déclenche sur une des cartes qui en ont une (voir l'en-tête).
  function btStartPlayerTurn(){
    bt.turn++;
    bt.phase = 'pick-attacker'; bt.selected = null; bt.skillChoice = null;
    var spawned = false, skilled = bt.pl.field.filter(function(u){ return !!u.skill; });
    if(skilled.length && !bt.proc){
      var every = Math.min.apply(null, skilled.map(function(u){ return SKILL_LEVELS[Math.min(u.evo, SKILL_LEVELS.length - 1)].every; }));
      if(bt.turn % every === 0){
        var unit = pick_(skilled);
        bt.proc = btMakeProc(unit);
        spawned = true;
        btSfx('🎁 ' + unit.skill.name.toUpperCase() + ' !', 'skill', { sub:'Une de tes cartes a une compétence : choisis-la avec elle.', ms:2200 });
        playSound('good');
      }
    }
    btSetStatus(spawned ? '🎁 ' + bt.proc.unit.skill.name + ' est prête sur ' + bt.proc.unit.sprite.name + ' ! Touche cette carte pour l\'utiliser (ou attaque avec une autre).' : BT_STATUS_PICK);
    btRender();
  }
  function btSkillLevel(unit){ return SKILL_LEVELS[Math.min(unit.evo, SKILL_LEVELS.length - 1)]; }
  // Déclencheur : la question est tirée tout de suite et reste la même tant que la carte ne s'en sert pas.
  // Pour « Doubler ou fixe », seul le facteur du nombre fixe est tiré (sans remise sur 3 déclenchements).
  function btMakeProc(unit){
    var proc = { unit:unit, skill:unit.skill, q:null, factor:1 };
    if(unit.skill.id === 'boost'){
      if(!bt.factors.length) bt.factors = btShuffle(BOOST_FACTORS.slice());
      proc.factor = bt.factors.pop();
    } else proc.q = unit.skill.ask(unit.evo);
    return proc;
  }
  // Valeurs de « Doubler ou fixe » : ×m des points actuels, ou « fixe » = ce ×m à ± 30 %.
  function btBoostValues(proc){
    var base = Math.round(proc.unit.pts * btSkillLevel(proc.unit).mult);
    return { x2: base, fixed: Math.max(1, Math.round(base * proc.factor)) };
  }
  function btProcFor(unit){ return bt && bt.proc && bt.proc.unit === unit ? bt.proc : null; }
  function btClearProcIfGone(){
    if(bt.proc && bt.pl.field.indexOf(bt.proc.unit) === -1) bt.proc = null;
  }
  // Panneau de la compétence : une question et 2 ou 3 boutons (reconstruit seulement si le déclencheur change).
  function btRenderSkillPanel(){
    var panel = document.getElementById('bt-skill');
    if(!panel) return;
    var show = !!(bt && !bt.over && bt.phase === 'pick-skill' && bt.selected && btProcFor(bt.selected));
    panel.hidden = !show;
    if(!show) return;
    var proc = bt.proc, sk = proc.skill, mult = skFmtMult(btSkillLevel(proc.unit).mult);
    var title = document.getElementById('bt-skill-title'), row = document.getElementById('bt-skill-row');
    if(panel._proc === proc && row.children.length) return;
    panel._proc = proc;
    var opts;
    if(sk.id === 'boost'){
      var v = btBoostValues(proc);
      title.textContent = '🎁 ' + sk.name + ' : lequel fait le plus de dégâts ?';
      opts = [{ label:'✖️ Dégâts ' + mult + ' (' + v.x2 + ')', aria:'Dégâts multipliés par ' + String(btSkillLevel(proc.unit).mult).replace('.', ',') + ', soit ' + v.x2, value:v.x2 },
              { label:'🎯 ' + v.fixed + ' dégâts fixes', aria:v.fixed + ' dégâts fixes', value:v.fixed }];
      opts = btShuffle(opts);
    } else {
      title.textContent = sk.icon + ' ' + sk.name + ' : ' + proc.q.text + ' (bonne réponse = dégâts ' + mult + ')';
      opts = proc.q.options.map(function(o){ return { label:o.label, aria:o.label, ok:o.ok }; });
    }
    proc.opts = opts;
    row.innerHTML = '';
    opts.forEach(function(o, i){
      var b = document.createElement('button'); b.type = 'button'; b.className = 'btn bt-skill-btn';
      b.textContent = o.label; b.setAttribute('aria-label', o.aria);
      b.addEventListener('click', function(){ btChooseSkill(i); });
      row.appendChild(b);
    });
  }
  // Choix du joueur dans le panneau (index de la proposition) ou -1 : attaquer sans la compétence.
  function btChooseSkill(i){
    if(!bt || bt.phase !== 'pick-skill') return;
    bt.skillChoice = i;             // index d'une proposition, ou -1
    bt.phase = 'pick-target';
    btSetStatus(i < 0
      ? bt.selected.sprite.name + ' attaque sans compétence : touche la carte adverse à viser.'
      : 'Réponse donnée ! Touche la carte adverse à viser.');
    btRender();
  }
  // Résultat de la compétence pour l'attaque : dégâts, mot affiché, ligne du journal, verdict pédagogique. null = pas de compétence.
  function btSkillResult(attacker, proc, choice){
    if(!proc || choice === null || choice < 0) return null;
    var o = proc.opts[choice], sk = proc.skill, lvl = btSkillLevel(attacker), mult = skFmtMult(lvl.mult);
    if(sk.id === 'boost'){
      var v = btBoostValues(proc), mine = o.value, other = Math.max(v.x2, v.fixed) === mine ? Math.min(v.x2, v.fixed) : Math.max(v.x2, v.fixed);
      var verdict = mine > other ? '👍 Bon calcul : c\'était le meilleur choix !' : mine === other ? '🟰 Les deux choix faisaient pareil (' + mine + ').' : '🤔 L\'autre choix faisait ' + other + ' (tu en as fait ' + mine + ').';
      return { dmg:mine, ok:mine >= other, word:'🎯 ' + mine + ' !', verdict:verdict, line:sk.name + ' : ' + mine + ' dégâts. ' + verdict };
    }
    var right = proc.q.options.filter(function(x){ return x.ok; })[0].label;
    if(o.ok) return { dmg:Math.round(attacker.pts * lvl.mult), ok:true, word:'✖️ ' + mult + ' BOOM !', verdict:'👍 Bonne réponse : dégâts ' + mult + ' ! ' + proc.q.explain, line:sk.name + ' : bonne réponse, dégâts ' + mult + '.' };
    return { dmg:attacker.pts, ok:false, word:btWord('hit'), verdict:'🤔 La bonne réponse était ' + right + '. ' + proc.q.explain, line:sk.name + ' : pas cette fois (réponse : ' + right + '), dégâts normaux.' };
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
  /* ---- Effets sonores affichés (à la place du descriptif) ---- */
  var BT_WORDS = {
    hit:  ['POW !','BAM !','PAF !','CRAC !','BOUM !'],
    shot: ['ZIIIP !','TCHAK !','PIOU !','FLOP !'],
    ko:   ['K.O. !'],
    heal: ['+',''],
    enter:['HOP !']
  };
  function btClearSfx(){ var st = document.getElementById('bt-sfx'); if(st) st.innerHTML = ''; }
  // Affiche un mot d'effet (« POW ! ») au milieu du terrain ; opts.sub = petite ligne sous le mot.
  function btSfx(word, kind, opts){
    var st = document.getElementById('bt-sfx'); if(!st) return;
    opts = opts || {};
    var w = document.createElement('div');
    w.className = 'sfx-word ' + kind; w.setAttribute('aria-hidden','true');
    w.style.setProperty('--rot', (btRand(13) - 6) + 'deg');
    var t = document.createElement('span'); t.className = 'sfx-text'; t.textContent = word; w.appendChild(t);
    if(opts.sub){ var sub = document.createElement('span'); sub.className = 'sfx-sub'; sub.textContent = opts.sub; w.appendChild(sub); }
    st.innerHTML = ''; st.appendChild(w);
    var life = btT(opts.ms || 1100);
    setTimeout(function(){ if(w.parentNode) w.parentNode.removeChild(w); }, life);
  }
  function btWord(kind){ var a = BT_WORDS[kind]; return a[btRand(a.length)]; }
  function btShake(){
    var arena = document.getElementById('bt-arena'); if(!arena || BT_REDUCED) return;
    arena.classList.remove('bt-shake'); void arena.offsetWidth; arena.classList.add('bt-shake');
    setTimeout(function(){ arena.classList.remove('bt-shake'); }, 450);
  }
  var BT_REDUCED = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  // Chaque unité garde SA carte (créée une seule fois) : on ne fait que la
  // mettre à jour. Plus de clignotement des images, et les animations (secousse,
  // chiffres qui défilent, « −5 » qui s'envole) ne sont plus coupées.
  function btCardFor(unit, isEnemy){
    var card = bt.cards[unit.uid];
    if(card) return card;
    card = bt.cards[unit.uid] = document.createElement('button');
    card.type = 'button';
    card.className = 'bcard' + (isEnemy ? ' enemy' : '');
    card.setAttribute('data-uid', String(unit.uid));
    var art = document.createElement('div'); art.className = 'bcard-art';
    renderCreatureVisual(art, unit.sprite, fighterDisplayMode, unit.evo);
    card.appendChild(art);
    var tag = document.createElement('div'); tag.className = 'skill-tag'; tag.setAttribute('aria-hidden','true'); tag.textContent = unit.skill ? unit.skill.icon + ' ' + unit.skill.name : ''; tag.hidden = true;
    card.appendChild(tag); card._skillTag = tag;
    var m = BT_ROLE_META[unit.sprite.role];
    var nameEl = document.createElement('div'); nameEl.className = 'bcard-name'; nameEl.textContent = unit.sprite.name;
    card.appendChild(nameEl);
    var role = document.createElement('div'); role.className = 'bcard-role'; role.textContent = m.icon + ' ' + m.label;
    card.appendChild(role);
    var pts = document.createElement('div'); pts.className = 'bcard-pts';
    card.appendChild(pts);
    card._pts = pts; card._shown = Math.max(0, unit.pts); card._buffed = unit.buffed;
    btSetPtsText(card, card._shown, unit.buffed);
    if(bt.animateArrivals && !BT_REDUCED) card.classList.add('arrive');
    card.addEventListener('click', function(){
      if(!bt || bt.over) return;
      if(isEnemy){
        if(bt.phase !== 'pick-target') return;
        var attacker = bt.selected, res = btSkillResult(attacker, btProcFor(attacker), bt.skillChoice);
        if(btProcFor(attacker) && bt.skillChoice !== null && bt.skillChoice >= 0) bt.proc = null;      // la compétence est consommée
        bt.selected = null; bt.skillChoice = null; bt.phase = 'busy';
        btSetStatus('Attaque en cours…');
        btRender();
        btResolveAttack(bt.pl, attacker, bt.en, unit, false, btAfterPlayerAttack, res);
      } else if(bt.phase === 'pick-attacker'){
        bt.selected = unit; bt.skillChoice = null;
        if(btProcFor(unit)){
          bt.phase = 'pick-skill';
          btSetStatus('🎁 ' + unit.skill.name + ' sur ' + unit.sprite.name + ' : réponds pour gagner des dégâts en plus ! (ou attaque sans.)');
        } else {
          bt.phase = 'pick-target';
          btSetStatus(unit.sprite.name + ' est prêt : touche la carte adverse à attaquer (ou retouche ta carte pour changer).');
        }
        btRender();
      } else if((bt.phase === 'pick-target' || bt.phase === 'pick-skill') && bt.selected === unit){
        bt.selected = null; bt.skillChoice = null; bt.phase = 'pick-attacker';
        btSetStatus(BT_STATUS_PICK);
        btRender();
      }
    });
    return card;
  }
  function btSetPtsText(card, value, buffed){ card._pts.textContent = '❤️ ' + value + (buffed ? ' ⬆' : ''); }
  function btFloat(card, text, cls){
    var f = document.createElement('div');
    f.className = 'dmg-float ' + cls; f.setAttribute('aria-hidden','true'); f.textContent = text;
    card.appendChild(f);
    setTimeout(function(){ if(f.parentNode) f.parentNode.removeChild(f); }, 1100);
  }
  // Fait défiler le nombre de points de `from` à `to` (et pose « −5 » / « +5 »).
  function btAnimatePts(card, unit, from, to){
    var delta = to - from;
    btFloat(card, (delta>0 ? '+' : '−') + Math.abs(delta), delta>0 ? 'pos' : 'neg');
    if(delta < 0 && !BT_REDUCED){
      card.classList.remove('hit'); void card.offsetWidth; card.classList.add('hit');
      setTimeout(function(){ card.classList.remove('hit'); }, 450);
    }
    if(BT_REDUCED){ btSetPtsText(card, to, unit.buffed); return; }
    card._pts.classList.remove('tick'); void card._pts.offsetWidth; card._pts.classList.add('tick');
    var steps = Math.min(12, Math.abs(delta)), i = 0;
    if(card._timer) clearInterval(card._timer);
    card._timer = setInterval(function(){
      i++;
      var v = i>=steps ? to : Math.round(from + delta*i/steps);
      btSetPtsText(card, v, unit.buffed);
      if(i>=steps){ clearInterval(card._timer); card._timer = null; }
    }, Math.max(8, btT(70)));
  }
  function btSyncCard(card, unit, isEnemy, canPick, isSel, canTarget){
    var m = BT_ROLE_META[unit.sprite.role], shown = Math.max(0, unit.pts);
    card.setAttribute('aria-label', (isEnemy ? 'Adversaire : ' : 'Ta carte : ') + unit.sprite.name + ', ' + m.label + ', ' + shown + ' points');
    card.classList.toggle('selected', isSel);
    card.classList.toggle('targetable', canTarget);
    var hasSkill = !isEnemy && !!btProcFor(unit);
    card.classList.toggle('skilled', hasSkill);
    if(card._skillTag) card._skillTag.hidden = !hasSkill;
    if(isSel) card.setAttribute('aria-pressed','true'); else card.removeAttribute('aria-pressed');
    card.disabled = isEnemy ? !canTarget : !canPick;
    if(shown !== card._shown){
      var from = card._shown; card._shown = shown; card._buffed = unit.buffed;
      btAnimatePts(card, unit, from, shown);
    } else if(unit.buffed !== card._buffed){
      card._buffed = unit.buffed; btSetPtsText(card, shown, unit.buffed);
    }
  }
  function btRender(){
    if(!bt) return;
    var plField = document.getElementById('bt-player-field'), enField = document.getElementById('bt-enemy-field');
    btReconcile(plField, bt.pl.field.map(function(u){
      var c = btCardFor(u, false), isSel = bt.selected === u;
      btSyncCard(c, u, false, !bt.over && ((bt.phase === 'pick-attacker') || ((bt.phase === 'pick-target' || bt.phase === 'pick-skill') && isSel)), isSel, false);
      return c;
    }));
    btReconcile(enField, bt.en.field.map(function(u){
      var c = btCardFor(u, true);
      btSyncCard(c, u, true, false, false, !bt.over && bt.phase === 'pick-target');
      return c;
    }));
    bt.animateArrivals = true;
    btRenderSkillPanel();
    document.getElementById('bt-player-reserve').textContent = 'Réserve : ' + bt.pl.reserve.length + ' carte' + (bt.pl.reserve.length>1 ? 's' : '');
    document.getElementById('bt-enemy-reserve').textContent = 'Réserve adverse : ' + bt.en.reserve.length + ' carte' + (bt.en.reserve.length>1 ? 's' : '');
  }
  function btEl(unit){ return document.querySelector('#bt-arena [data-uid="'+unit.uid+'"]'); }

  // Résout une attaque, au ralenti : préparation → charge (ou tir) → impact avec effet sonore →
  // points qui défilent → cartes battues (K.O.) → remplaçants → soutien, puis rappelle done().
  // skill (joueur seulement) : résultat de la compétence { dmg, word, verdict, line } ; il ne change que les dégâts infligés.
  function btResolveAttack(attSide, attacker, defSide, target, attackerIsEnemy, done, skill){
    var archer = attacker.sprite.role === 'archer';
    var fromEl = btEl(attacker), toEl = btEl(target);
    if(fromEl) fromEl.classList.add('charging');
    if(toEl) toEl.classList.add('targeted');
    // 1) préparation : l'attaquant se gonfle et la cible est mise en évidence
    setTimeout(function(){
      if(fromEl) fromEl.classList.remove('charging');
      if(fromEl && toEl){
        if(archer) playAttackAnim(fromEl, toEl, '🏹', btT(750));
        else btLunge(fromEl, toEl, btT(1000));
      }
      // 2) impact (au milieu de la charge / à l'arrivée de la flèche)
      setTimeout(impact, btT(archer ? 700 : 500));
    }, btT(550));

    function impact(){
      if(!bt) return;
      var dmgToTarget = skill ? skill.dmg : attacker.pts;
      var dmgToAttacker = archer ? 0 : target.pts;
      target.pts -= dmgToTarget;
      attacker.pts -= dmgToAttacker;
      if(toEl) toEl.classList.remove('targeted');
      var lines = [];
      if(archer){
        lines.push(attacker.sprite.name + ' tire à distance : ' + target.sprite.name + ' perd ' + dmgToTarget + ' points, ' + attacker.sprite.name + ' ne perd rien.');
      } else {
        lines.push(attacker.sprite.name + ' attaque ' + target.sprite.name + ' : ' + target.sprite.name + ' perd ' + dmgToTarget + ' points et ' + attacker.sprite.name + ' en perd ' + dmgToAttacker + '.');
      }
      var verdict = skill ? skill.verdict : null;
      if(skill) lines.push(skill.line);
      btSfx(skill ? skill.word : btWord(archer ? 'shot' : 'hit'), skill && skill.ok ? 'skill' : (archer ? 'shot' : 'hit'), { sub: verdict, ms: skill ? 2800 : 1300 });
      btShake();
      var hitEl = btEl(target); if(hitEl) btFloat(hitEl, archer ? '🏹' : (attackerIsEnemy ? '💥' : '⚔️'), 'impact');
      playSound(attackerIsEnemy ? 'bad' : 'good');
      btLog(lines);
      btRender();   // les cartes gardent leur image : seuls les chiffres défilent
      var dead = [];
      [attSide, defSide].forEach(function(sd){
        sd.field.forEach(function(u){ if(u.pts <= 0) dead.push({ side:sd, unit:u }); });
      });
      // 3) on laisse le temps de lire les chiffres ; puis K.O., remplaçants, soutien
      function finish(){
        if(!bt) return;
        btClearProcIfGone();
        if(btSupportTick(attSide)){
          btSfx('+' + BT_SUPPORT_TURN + ' ❤️', 'heal', { ms:1300 });
          btRender(); setTimeout(function(){ if(bt) done(); }, btT(1500));
        } else done();
      }
      setTimeout(function(){
        if(!bt) return;
        if(!dead.length){ finish(); return; }
        btSfx(btWord('ko'), 'ko', { ms:1500 });
        dead.forEach(function(d){ var e = btEl(d.unit); if(e) e.classList.add('dying'); });
        setTimeout(function(){
          if(!bt) return;
          var notes = [];
          dead.forEach(function(d){
            d.side.field.splice(d.side.field.indexOf(d.unit), 1);
            notes.push(d.unit.sprite.name + ' est battu !');
          });
          dead.forEach(function(d){
            var arrived = btDrawFromReserve(d.side, notes);
            if(arrived) notes.push(arrived.sprite.name + ' entre sur le terrain.');
          });
          // Une carte qui reçoit un bonus après remplacement est déjà comptée dans btOnArrive ; on remplit aussi les places libres restantes.
          var entered = 0;
          [bt.pl, bt.en].forEach(function(sd){ while(sd.field.length < BT_FIELD_SIZE && sd.reserve.length){ var a = btDrawFromReserve(sd, notes); if(a) notes.push(a.sprite.name + ' entre sur le terrain.'); } });
          entered = notes.filter(function(n){ return /entre sur le terrain/.test(n); }).length;
          if(notes.length) btLog(notes);
          if(entered) btSfx(btWord('enter'), 'enter', { ms:1200 });
          btClearProcIfGone();
          btRender();
          setTimeout(finish, btT(900));   // le temps de voir arriver les remplaçants
        }, btT(850));
      }, btT(1500));
    }
  }
  // Corps à corps : la carte fonce vers sa cible, puis revient à sa place.
  function btLunge(fromEl, toEl, duration){
    if(BT_REDUCED || !fromEl.animate) return;
    var a = fromEl.getBoundingClientRect(), b = toEl.getBoundingClientRect();
    var dx = (b.left + b.width/2 - (a.left + a.width/2)) * 0.6, dy = (b.top + b.height/2 - (a.top + a.height/2)) * 0.6;
    fromEl.style.zIndex = '5';
    var anim = fromEl.animate([
      { transform:'translate(0,0) scale(1)' },
      { transform:'translate(' + (-dx*0.08) + 'px,' + (-dy*0.08) + 'px) scale(1.04)', offset:0.18 },
      { transform:'translate(' + dx + 'px,' + dy + 'px) scale(1.14)', offset:0.5 },
      { transform:'translate(' + dx + 'px,' + dy + 'px) scale(1.14)', offset:0.62 },   // petit arrêt sur l'impact
      { transform:'translate(0,0) scale(1)' }
    ], { duration:duration || 1000, easing:'ease-in-out' });
    anim.onfinish = function(){ fromEl.style.zIndex = ''; };
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
    setTimeout(function(){ if(bt) btEnemyTurn(); }, btT(700));
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
    if(!move){ if(!btCheckEnd()) btStartPlayerTurn(); return; }
    btResolveAttack(bt.en, move.a, bt.pl, move.t, true, function(){
      if(btCheckEnd()) return;
      btStartPlayerTurn();
    });
  }
  function btBackToSetup(){
    bt = null;
    btClearSfx();
    var bp = document.getElementById('bt-skill'); if(bp) bp.hidden = true;
    document.getElementById('bt-arena').hidden = true;
    document.getElementById('bt-over').hidden = true;
    document.getElementById('bt-setup').hidden = false;
    renderBtSetup();
  }
  function onThemeChangedForBattle(){ btBackToSetup(); }
  buildLevelRow(document.getElementById('bt-diff-row'), BT_DIFFS.map(function(d){ return d.label; }), btDiff, function(idx){
    btDiff = idx;
    try{ localStorage.setItem('geo_bt_diff', String(idx)); }catch(e){}
    renderBtSetup();
  });
  document.getElementById('bt-auto-best').addEventListener('click', function(){ btAutoTeam('best'); });
  document.getElementById('bt-auto-random').addEventListener('click', function(){ btAutoTeam('random'); });
  document.getElementById('bt-auto-clear').addEventListener('click', function(){ btAutoTeam('clear'); });
  document.getElementById('bt-start').addEventListener('click', btStart);
  document.getElementById('bt-skill-none').addEventListener('click', function(){ btChooseSkill(-1); });
  document.getElementById('bt-quit').addEventListener('click', btBackToSetup);
  document.getElementById('bt-change-team').addEventListener('click', btBackToSetup);
  document.getElementById('bt-again').addEventListener('click', btStart);

  renderShop();
  renderBtSetup();
  renderMascotDock();
  renderTopMascotIcon();
  updateStreakPill();

