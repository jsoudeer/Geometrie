  /* ===================== CHALEUR (mode Overload) =====================
     Selon la série sans faute (freeStreak) : 15 → niveau 1, 20 → 2, 25 → 3. Le niveau est écrit dans
     body[data-heat] ; la mise en forme (halo, flammes, tremblement) est dans css/chaleur.css, avec
     une variante par clan (data-app-theme). Ce fichier ajoute les particules qui montent, l'éclat et le
     son à chaque nouveau palier. Rien n'apparaît hors mode Overload. */
  var HEAT_STEPS = [15, 20, 25];
  var HEAT_EMOJI = {
    cats:     [['✨','💖'], ['✨','💖','🌸','⭐'], ['🌟','💖','🌈','✨','🎀']],
    brainrot: [['🔥'], ['🔥','💥','🔥'], ['🔥','⚡','💥','☠️','🔥']]
  };
  var heatLevel = 0, heatLayer = null, heatTimer = null;
  function heatLevelFor(streak){
    var lv = 0;
    HEAT_STEPS.forEach(function(g, i){ if(streak >= g) lv = i + 1; });
    return lv;
  }
  function heatBuild(){
    if(heatLayer) return heatLayer;
    heatLayer = document.createElement('div');
    heatLayer.className = 'heat-layer'; heatLayer.setAttribute('aria-hidden', 'true');
    heatLayer.innerHTML = '<div class="heat-glow"></div><div class="heat-flames"></div>';
    document.body.appendChild(heatLayer);
    return heatLayer;
  }
  function heatSpawn(){
    if(!heatLevel) return;
    var layer = heatBuild();
    if(heatReduced()){ layer.querySelectorAll('.heat-p').forEach(function(q){ q.remove(); }); return; }
    if(layer.querySelectorAll('.heat-p').length > 26) return;
    var side = currentThemeKey()==='brainrot' ? 'brainrot' : 'cats';
    var set = HEAT_EMOJI[side][heatLevel - 1];
    var p = document.createElement('span');
    p.className = 'heat-p'; p.textContent = set[Math.floor(Math.random()*set.length)];
    p.style.left = (Math.random()*96) + 'vw';
    p.style.fontSize = (16 + Math.random()*16 + heatLevel*3) + 'px';
    p.style.setProperty('--dur', (2.6 + Math.random()*2) + 's');
    p.style.setProperty('--dx', ((Math.random()-0.5)*90) + 'px');
    p.style.setProperty('--rot', ((Math.random()-0.5)*50) + 'deg');
    p.addEventListener('animationend', function(){ p.remove(); });
    layer.appendChild(p);
  }
  function heatReduced(){ return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); }
  function heatSting(level){
    try{
      var ctx = revealCtx(); if(!ctx) return;
      var t0 = ctx.currentTime, k = 1.2 + level*0.25;
      if(currentThemeKey()==='brainrot'){
        revealTone(ctx, 'sawtooth', 70, 40 + level*10, t0, 0.55, 0.30*k);       // grondement
        revealTone(ctx, 'square', 200 + level*90, 900 + level*200, t0, 0.35, 0.07*k);   // montée de flamme
        if(level>1) revealTone(ctx, 'square', 1200, 300, t0 + 0.25, 0.25, 0.07*k);
      } else {
        [660, 880, 1175, 1568].slice(0, 2 + level).forEach(function(f, i){           // arpège étincelant
          revealTone(ctx, 'triangle', f, f*1.01, t0 + i*0.07, 0.35, 0.10*k);
        });
      }
      setTimeout(function(){ try{ ctx.close(); }catch(e){} }, 1200);
    }catch(e){}
  }
  // Appelée à chaque mise à jour de la série (voir updateStreakPill) et au changement de mode d'effets.
  function updateHeat(){
    if(!HEAT_STEPS) return;   // appelée avant le chargement de ce fichier
    var lv = sfxMode==='overload' ? heatLevelFor(freeStreak) : 0;
    if(appMode!=='auto' || practiceMode!=='free' || countdownRunning) lv = 0;
    if(lv === heatLevel){ document.body.setAttribute('data-heat', String(lv)); return; }
    var up = lv > heatLevel;
    heatLevel = lv;
    document.body.setAttribute('data-heat', String(lv));
    heatBuild();
    if(up){
      heatLayer.classList.remove('surge'); void heatLayer.offsetWidth; heatLayer.classList.add('surge');
      heatSting(lv);
      for(var i=0;i<6+lv*4;i++) setTimeout(heatSpawn, i*60);
    }
    if(lv && !heatTimer) heatTimer = setInterval(function(){ if(heatLevel){ heatSpawn(); if(heatLevel>1) heatSpawn(); } }, 520);
    if(!lv && heatTimer){ clearInterval(heatTimer); heatTimer = null; }
    if(!lv) heatLayer.classList.remove('surge');
  }
  updateHeat();
