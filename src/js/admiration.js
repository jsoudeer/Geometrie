  /* ===================== ADMIRER UN PERSONNAGE ET CÉRÉMONIE D'ÉVOLUTION =====================
     showAdmire(sprite)    : grand portrait en pied qui se penche au doigt (profondeur), ombre au sol,
                             rayons, particules selon le niveau d'évolution ; ◀ ▶ pour parcourir les
                             personnages possédés du clan.
     showEvolution(sprite, from, to) : cérémonie (charge → flash et ondes de choc → étoiles, points).
     Utilise les outils de boutique.js (renderCreatureVisual, spriteEvo, spritePts, EVO_NAMES…) et les
     sons du « reveal » de noyau.js (revealCtx, revealTone). CSS : css/admiration.css. */

  var FX_EMOJIS = { cats:['✨','💖','⭐','🌸','💫'], brainrot:['⚡','🔥','💥','👾','✨'] };
  var fxTimers = [];
  function fxLater(fn, ms){ var t = setTimeout(fn, ms); fxTimers.push(t); return t; }
  function fxClearTimers(){ fxTimers.forEach(clearTimeout); fxTimers = []; }
  function fxReduced(){ return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); }

  // ---- Sons ----
  function fxVol(){ return sfxMode==='overload' ? 1.6 : 1; }
  function playAdmirePing(side){
    try{
      var ctx = revealCtx(); if(!ctx) return; var t0 = ctx.currentTime, k = fxVol();
      if(side==='brainrot'){ revealTone(ctx,'square',392,784,t0,0.12,0.09*k); revealTone(ctx,'square',1046,523,t0+0.09,0.1,0.06*k); }
      else { revealTone(ctx,'triangle',1568,2093,t0,0.22,0.16*k); revealTone(ctx,'sine',3136,3136,t0+0.05,0.18,0.04*k); }
      setTimeout(function(){ try{ ctx.close(); }catch(e){} }, 600);
    }catch(e){}
  }
  function playEvoCharge(side){
    try{
      var ctx = revealCtx(); if(!ctx) return; var t0 = ctx.currentTime, k = fxVol(), i;
      revealTone(ctx,'sine',150,1500,t0,1.5,0.12*k);
      revealTone(ctx,'triangle',75,750,t0,1.5,0.07*k);
      // tic-tac de plus en plus rapide
      for(i=0;i<14;i++){
        var tt = 1.45*Math.pow(i/14, 1.6);
        revealTone(ctx, side==='brainrot' ? 'square' : 'sine', 500 + i*95, 500 + i*95, t0 + tt, 0.05, (side==='brainrot' ? 0.06 : 0.1)*k);
      }
      setTimeout(function(){ try{ ctx.close(); }catch(e){} }, 1900);
    }catch(e){}
  }
  function playEvoBoom(side, level){
    try{
      var ctx = revealCtx(); if(!ctx) return; var t0 = ctx.currentTime, k = fxVol(), i;
      revealTone(ctx,'sine',160,34,t0,0.9,0.6*k);
      revealTone(ctx,'sawtooth',1400,70,t0,0.45,0.13*k);
      if(level>=2) revealTone(ctx,'sine',90,28,t0+0.12,1.1,0.55*k);
      var arp = side==='brainrot' ? [262,330,392,523,659,784] : [1046.5,1318.5,1568,2093,2637,3136];
      var n = level>=2 ? arp.length : 4;
      for(i=0;i<n;i++){
        var f = arp[i], tt = t0 + 0.28 + i*0.085;
        revealTone(ctx, side==='brainrot' ? 'square' : 'triangle', f, f, tt, 0.55, (side==='brainrot' ? 0.1 : 0.2)*k);
        if(side!=='brainrot') revealTone(ctx,'sine',f*2,f*2,tt,0.3,0.05*k);
      }
      if(level>=2){
        // accord final tenu : fanfare de l'évolution ultime
        [523.25,659.25,783.99,1046.5].forEach(function(f){ revealTone(ctx,'sine',f,f,t0+0.85,1.3,0.12*k); revealTone(ctx,'triangle',f*2,f*2,t0+0.85,1.0,0.05*k); });
        if(side==='brainrot'){ for(i=0;i<8;i++) revealTone(ctx,'square',1568-i*120,1568-i*120,t0+0.9+i*0.05,0.04,0.07*k); }
      }
      setTimeout(function(){ try{ ctx.close(); }catch(e){} }, 2600);
    }catch(e){}
  }
  // Impact de la révélation d'un nouveau personnage (l'arpège est déjà joué par playRevealSting).
  function playRevealBoom(side, level){
    try{
      var ctx = revealCtx(); if(!ctx) return; var t0 = ctx.currentTime, k = fxVol();
      revealTone(ctx,'sine',150,36,t0,0.8,0.5*k);
      revealTone(ctx,'sawtooth',1200,80,t0,0.35,0.1*k);
      if(level>=2){ [523.25,659.25,783.99,1046.5].forEach(function(f){ revealTone(ctx,'sine',f,f,t0+0.1,1.1,0.1*k); }); }
      setTimeout(function(){ try{ ctx.close(); }catch(e){} }, 1500);
    }catch(e){}
  }
  function playStarPing(i){
    try{
      var ctx = revealCtx(); if(!ctx) return; var t0 = ctx.currentTime, k = fxVol();
      var f = 1318.5 * (1 + i*0.5);
      revealTone(ctx,'triangle',f,f,t0,0.3,0.2*k); revealTone(ctx,'sine',f*2,f*2,t0,0.2,0.05*k);
      setTimeout(function(){ try{ ctx.close(); }catch(e){} }, 600);
    }catch(e){}
  }

  // ---- Particules ----
  // Éclat : n émojis projetés autour du centre de `layer`.
  function fxBurst(layer, side, n, minDist, maxDist){
    var set = FX_EMOJIS[side], i;
    for(i=0;i<n;i++){
      var s = document.createElement('span');
      s.className = 'fx-burst'; s.setAttribute('aria-hidden','true');
      s.textContent = set[i % set.length];
      var ang = (i/n)*Math.PI*2 + Math.random()*0.4, dist = minDist + Math.random()*(maxDist-minDist);
      s.style.setProperty('--dx', Math.round(Math.cos(ang)*dist)+'px');
      s.style.setProperty('--dy', Math.round(Math.sin(ang)*dist)+'px');
      s.style.setProperty('--sz', (14 + Math.round(Math.random()*16)) + 'px');
      s.style.setProperty('--rot', Math.round(Math.random()*360 - 180) + 'deg');
      s.addEventListener('animationend', function(){ this.remove(); });
      layer.appendChild(s);
    }
  }
  // Particules qui montent en continu (2 plans : derrière et devant le personnage). Renvoie l'arrêt.
  function fxAmbient(back, front, side, level){
    if(fxReduced()) return function(){};
    var set = FX_EMOJIS[side], every = level>=2 ? 110 : level===1 ? 170 : 300;
    var id = setInterval(function(){
      var layer = Math.random()<0.45 ? back : front;
      if(layer.childElementCount > 36) return;
      var s = document.createElement('span');
      s.className = 'fx-rise' + (layer===back ? ' far' : '');
      s.setAttribute('aria-hidden','true');
      s.textContent = set[Math.floor(Math.random()*set.length)];
      s.style.left = Math.round(8 + Math.random()*84) + '%';
      s.style.setProperty('--sz', (layer===back ? 10 + Math.random()*8 : 14 + Math.random()*14) + 'px');
      s.style.setProperty('--drift', Math.round(Math.random()*60 - 30) + 'px');
      s.style.setProperty('--dur', (2.6 + Math.random()*2.2) + 's');
      s.addEventListener('animationend', function(){ this.remove(); });
      layer.appendChild(s);
    }, every);
    return function(){ clearInterval(id); };
  }
  function fxEvoClass(side, level){ return side + ' lv' + level; }

  // ---- Admirer ----
  var admireStop = null;
  function closeAdmire(){
    if(admireStop){ admireStop(); admireStop = null; }
    var o = document.getElementById('admire-overlay'); if(o) o.remove();
    document.removeEventListener('keydown', onAdmireKey);
    if(admireReturnFocus && admireReturnFocus.focus){ try{ admireReturnFocus.focus(); }catch(e){} }
    admireReturnFocus = null;
  }
  var admireReturnFocus = null, admireList = [], admireIdx = 0;
  function onAdmireKey(e){
    if(e.key==='Escape'){ e.preventDefault(); closeAdmire(); }
    else if(e.key==='ArrowLeft') admireStep(-1);
    else if(e.key==='ArrowRight') admireStep(1);
  }
  function admireStep(d){
    if(admireList.length<2) return;
    admireIdx = (admireIdx + d + admireList.length) % admireList.length;
    admireRender(d);
  }
  function admireRender(dir){
    var ov = document.getElementById('admire-overlay'); if(!ov) return;
    if(admireStop){ admireStop(); admireStop = null; }
    var sp = admireList[admireIdx], side = spriteSide(sp), lvl = spriteEvo(sp);
    ov.className = 'adm-overlay ' + fxEvoClass(side, lvl);
    ov.setAttribute('aria-label', 'Admirer ' + sp.name);
    var stage = ov.querySelector('.adm-stage'), art = ov.querySelector('.adm-art');
    var back = ov.querySelector('.adm-fx.back'), front = ov.querySelector('.adm-fx.front');
    back.innerHTML = ''; front.innerHTML = '';
    renderCreatureVisual(art, sp, 'full', 0);   // niveau 0 : pas de cadre, la mise en scène s'en charge
    stage.classList.remove('swap-l','swap-r'); void stage.offsetWidth;
    if(dir) stage.classList.add(dir>0 ? 'swap-r' : 'swap-l');
    ov.querySelector('.adm-name').textContent = sp.name;
    ov.querySelector('.adm-stars').textContent = lvl===2 ? '★★' : lvl===1 ? '★' : '';
    ov.querySelector('.adm-stars').hidden = !lvl;
    ov.querySelector('.adm-role').textContent = roleLine(sp) + ' · ' + RARITY_META[sp.rarity].label;
    ov.querySelector('.adm-evo').textContent = EVO_NAMES[lvl];
    ov.querySelector('.adm-prev').hidden = ov.querySelector('.adm-next').hidden = admireList.length<2;
    admireStop = fxAmbient(back, front, side, lvl);
  }
  function showAdmire(sprite){
    closeAdmire();
    var side = spriteSide(sprite);
    var list = (side==='cats' ? CAT_SPRITES : BRAINROT_SPRITES);
    var owned = side==='cats' ? ownedCats : ownedBrain;
    admireList = list.filter(function(s){ return owned[s.id]; });
    admireIdx = Math.max(0, admireList.indexOf(sprite));
    admireReturnFocus = document.activeElement;
    var ov = document.createElement('div');
    ov.id = 'admire-overlay'; ov.setAttribute('role','dialog'); ov.setAttribute('aria-modal','true');
    ov.innerHTML =
      '<button type="button" class="adm-close" aria-label="Fermer">✕</button>' +
      '<div class="adm-stage"><div class="adm-rays" aria-hidden="true"></div><div class="adm-aura" aria-hidden="true"></div><div class="adm-orbit" aria-hidden="true"><div class="adm-orbit-spin"></div></div>' +
      '<div class="adm-fx back" aria-hidden="true"></div><div class="adm-floor" aria-hidden="true"></div>' +
      '<div class="adm-figure"><div class="adm-bob"><div class="adm-art"></div></div></div>' +
      '<div class="adm-fx front" aria-hidden="true"></div></div>' +
      '<div class="adm-info"><p class="adm-name"></p><p class="adm-line"><span class="adm-stars" aria-hidden="true"></span> <span class="adm-evo"></span></p><p class="adm-role"></p><p class="adm-hint">Touche et fais glisser pour la faire tourner</p></div>' +
      '<button type="button" class="adm-nav adm-prev" aria-label="Personnage précédent">◀</button><button type="button" class="adm-nav adm-next" aria-label="Personnage suivant">▶</button>';
    document.body.appendChild(ov);
    var spin = ov.querySelector('.adm-orbit-spin');
    for(var i=0;i<6;i++){ var st = document.createElement('span'); st.textContent = '★'; st.style.setProperty('--a', (i*60)+'deg'); spin.appendChild(st); }
    ov.querySelector('.adm-close').addEventListener('click', closeAdmire);
    ov.querySelector('.adm-prev').addEventListener('click', function(e){ e.stopPropagation(); admireStep(-1); });
    ov.querySelector('.adm-next').addEventListener('click', function(e){ e.stopPropagation(); admireStep(1); });
    ov.addEventListener('click', function(e){ if(e.target===ov) closeAdmire(); });
    document.addEventListener('keydown', onAdmireKey);
    // Inclinaison : suit le doigt / la souris (profondeur : chaque calque bouge d'une quantité différente).
    var stage = ov.querySelector('.adm-stage'), fig = ov.querySelector('.adm-figure'), moved = false, down = false, sx = 0, sy = 0;
    function tilt(e){
      var r = stage.getBoundingClientRect();
      var nx = Math.max(-1, Math.min(1, ((e.clientX - r.left)/r.width - 0.5)*2));
      var ny = Math.max(-1, Math.min(1, ((e.clientY - r.top)/r.height - 0.5)*2));
      stage.style.setProperty('--ry', (nx*28).toFixed(1));
      stage.style.setProperty('--rx', (-ny*14).toFixed(1));
      stage.classList.add('tilting');
    }
    stage.addEventListener('pointerdown', function(e){ down = true; moved = false; sx = e.clientX; sy = e.clientY; try{ stage.setPointerCapture(e.pointerId); }catch(x){} tilt(e); });
    stage.addEventListener('pointermove', function(e){ if(down || e.pointerType==='mouse'){ if(Math.abs(e.clientX-sx)+Math.abs(e.clientY-sy) > 6) moved = true; tilt(e); } });
    function release(){ down = false; stage.classList.remove('tilting'); stage.style.setProperty('--ry','0'); stage.style.setProperty('--rx','0'); }
    stage.addEventListener('pointerup', function(e){
      var wasTap = !moved; release();
      if(wasTap){
        var sp = admireList[admireIdx], side2 = spriteSide(sp);
        fig.classList.remove('hop'); void fig.offsetWidth; fig.classList.add('hop');
        fxBurst(ov.querySelector('.adm-fx.front'), side2, 9, 60, 130);
        playAdmirePing(side2);
      }
    });
    stage.addEventListener('pointercancel', release);
    stage.addEventListener('dragstart', function(e){ e.preventDefault(); });
    stage.addEventListener('pointerleave', function(e){ if(!down) release(); });
    admireRender(0);
    ov.querySelector('.adm-close').focus();
  }

  // ---- Cérémonie d'évolution ----
  var evoOverlayStop = null;
  function showEvolution(sprite, from, to, onClose){
    fxClearTimers();
    var old = document.getElementById('evo-overlay'); if(old) old.remove();
    var side = spriteSide(sprite), done = false, stopAmbient = function(){};
    var ov = document.createElement('div');
    ov.id = 'evo-overlay'; ov.className = 'evo-ov ' + fxEvoClass(side, to) + ' charging';
    ov.setAttribute('role','dialog'); ov.setAttribute('aria-modal','true'); ov.setAttribute('aria-label', 'Évolution de ' + sprite.name);
    ov.innerHTML =
      '<p class="eo-head">⚡ ' + sprite.name + ' évolue…</p>' +
      '<div class="eo-stage"><div class="eo-rays" aria-hidden="true"></div>' +
      '<div class="eo-fx back" aria-hidden="true"></div>' +
      '<div class="eo-ring r1" aria-hidden="true"></div><div class="eo-ring r2" aria-hidden="true"></div><div class="eo-ring r3" aria-hidden="true"></div>' +
      '<div class="eo-charge" aria-hidden="true"></div>' +
      '<div class="eo-figure"><div class="eo-art"></div></div>' +
      '<div class="eo-fx front" aria-hidden="true"></div><div class="eo-flash" aria-hidden="true"></div></div>' +
      '<div class="eo-info"><p class="eo-title"></p><p class="eo-stars" aria-hidden="true"></p><p class="eo-stat"></p>' +
      '<button type="button" class="btn primary eo-ok">Super !</button></div>';
    document.body.appendChild(ov);
    var stage = ov.querySelector('.eo-stage'), art = ov.querySelector('.eo-art'), head = ov.querySelector('.eo-head');
    var back = ov.querySelector('.eo-fx.back'), front = ov.querySelector('.eo-fx.front');
    var ptsFrom = spritePts(sprite, from), ptsTo = spritePts(sprite, to);
    renderCreatureVisual(art, sprite, 'full', from);
    // grains de lumière qui convergent vers le personnage pendant la charge
    var charge = ov.querySelector('.eo-charge'), set = FX_EMOJIS[side], i;
    for(i=0;i<14;i++){
      var c = document.createElement('span'); c.textContent = set[i % set.length];
      var ang = (i/14)*Math.PI*2;
      c.style.setProperty('--sx', Math.round(Math.cos(ang)*150)+'px'); c.style.setProperty('--sy', Math.round(Math.sin(ang)*150)+'px');
      c.style.animationDelay = (i*0.07) + 's';
      charge.appendChild(c);
    }
    function close(){
      if(!document.getElementById('evo-overlay')) return;
      fxClearTimers(); stopAmbient(); ov.remove();
      document.removeEventListener('keydown', onKey);
      if(onClose) onClose();
    }
    function onKey(e){ if(e.key==='Escape'){ e.preventDefault(); if(done) close(); else finish(true); } }
    document.addEventListener('keydown', onKey);
    var boomed = false;
    function boom(silent){
      if(boomed) return; boomed = true;
      ov.classList.remove('charging'); ov.classList.add('boom');
      art.innerHTML = ''; renderCreatureVisual(art, sprite, 'full', to);
      head.textContent = (to>=2 ? '🌟 ' : '⭐ ') + EVO_NAMES[to] + ' !';
      if(!silent) playEvoBoom(side, to);
      fxBurst(front, side, to>=2 ? 30 : 18, 70, to>=2 ? 190 : 150);
      if(to>=2) fxLater(function(){ fxBurst(front, side, 16, 90, 200); }, 350);
    }
    function reveal(silent){
      ov.classList.add('shown');
      ov.querySelector('.eo-title').textContent = sprite.name + ' passe au niveau « ' + EVO_NAMES[to] + ' »';
      var stars = ov.querySelector('.eo-stars'); stars.textContent = '';
      for(var k=0;k<to;k++){ (function(k){
        var s = document.createElement('span'); s.textContent = '★'; s.style.animationDelay = (k*0.32) + 's'; stars.appendChild(s);
        if(!silent) fxLater(function(){ playStarPing(k); }, 350 + k*320);
      })(k); }
      var stat = ov.querySelector('.eo-stat'), t = 0, steps = 14;
      stat.textContent = '❤️ ' + ptsFrom + ' → ' + ptsTo + '  (+' + (ptsTo-ptsFrom) + ')';
      if(!silent){
        stat.textContent = '❤️ ' + ptsFrom;
        fxLater(function(){
          var iv = setInterval(function(){ t++; stat.textContent = '❤️ ' + Math.round(ptsFrom + (ptsTo-ptsFrom)*Math.min(1,t/steps)) + (t>=steps ? '  (+' + (ptsTo-ptsFrom) + ')' : ''); if(t>=steps) clearInterval(iv); }, 45);
        }, 500);
      }
      stopAmbient = fxAmbient(back, front, side, to);
      done = true;
      ov.querySelector('.eo-ok').focus();
    }
    function finish(silent){ fxClearTimers(); boom(silent); reveal(silent); }
    ov.addEventListener('click', function(e){
      if(!done){ finish(false); return; }
      if(e.target===ov || e.target.classList.contains('eo-ok')) close();
    });
    if(fxReduced()){ finish(true); return; }
    playEvoCharge(side);
    fxLater(function(){ boom(false); }, 1550);
    fxLater(function(){ reveal(false); }, 2200);
  }
