
  /* ===================== CORE : THEME + NAV ===================== */
  var THEMES = {
    cats:{ mascot:"🐱", title:"Géo Miaou" },
    brainrot:{ mascot:"👹", title:"GEO CHAOS 9000" }
  };

  var stars = 0;
  function addStar(n){
    stars += n;
    document.getElementById('starCount').textContent = stars;
    try{ localStorage.setItem('geo_stars', String(stars)); }catch(e){}
  }
  try{
    var saved = localStorage.getItem('geo_stars');
    if(saved){ stars = parseInt(saved,10)||0; document.getElementById('starCount').textContent = stars; }
  }catch(e){}

  /* ===================== RÉGLAGES : intensité des effets (SFX) ===================== */
  var sfxMode = 'normal'; // 'normal' | 'overload'
  try{
    var savedSfx = localStorage.getItem('geo_sfx_mode');
    if(savedSfx === 'overload') sfxMode = 'overload';
  }catch(e){}
  var SFX_HINTS = {
    normal:'Confettis et petit son à chaque réponse.',
    overload:'Sons plus forts, gros effets à l\'écran et la mascotte s\'agite fort à chaque réponse !'
  };
  function updateSfxHint(){
    document.getElementById('sfx-mode-hint').textContent = SFX_HINTS[sfxMode];
  }
  buildLevelRow(document.getElementById('sfx-mode-row'), ['Normal','Mode Overload 🔊'], sfxMode==='overload' ? 1 : 0, function(idx){
    sfxMode = idx===1 ? 'overload' : 'normal';
    try{ localStorage.setItem('geo_sfx_mode', sfxMode); }catch(e){}
    updateSfxHint();
  });
  updateSfxHint();

  /* ---- Avancement automatique (mode Manuel) : monte de niveau toute seule
     après X bonnes réponses d'affilée sur la même activité. ---- */
  var autoAdvanceEnabled = false;
  var autoAdvanceThreshold = 5;
  var AUTO_ADVANCE_OPTIONS = [3,5,8,10];
  try{
    if(localStorage.getItem('geo_auto_advance') === '1') autoAdvanceEnabled = true;
    var savedThreshold = parseInt(localStorage.getItem('geo_auto_advance_n'),10);
    if(AUTO_ADVANCE_OPTIONS.indexOf(savedThreshold)!==-1) autoAdvanceThreshold = savedThreshold;
  }catch(e){}
  document.getElementById('auto-advance-toggle').checked = autoAdvanceEnabled;
  document.getElementById('auto-advance-count-wrap').hidden = !autoAdvanceEnabled;
  document.getElementById('auto-advance-toggle').addEventListener('change', function(e){
    autoAdvanceEnabled = e.target.checked;
    document.getElementById('auto-advance-count-wrap').hidden = !autoAdvanceEnabled;
    try{ localStorage.setItem('geo_auto_advance', autoAdvanceEnabled ? '1' : '0'); }catch(err){}
  });
  buildLevelRow(
    document.getElementById('auto-advance-count-row'),
    AUTO_ADVANCE_OPTIONS.map(function(n){ return n+''; }),
    AUTO_ADVANCE_OPTIONS.indexOf(autoAdvanceThreshold),
    function(idx){
      autoAdvanceThreshold = AUTO_ADVANCE_OPTIONS[idx];
      try{ localStorage.setItem('geo_auto_advance_n', String(autoAdvanceThreshold)); }catch(e){}
    }
  );

  document.getElementById('settings-btn').addEventListener('click', function(){
    document.getElementById('settings-overlay').hidden = false;
    document.getElementById('settings-close').focus();
  });
  document.getElementById('settings-close').addEventListener('click', function(){
    document.getElementById('settings-overlay').hidden = true;
    document.getElementById('settings-btn').focus();
  });
  document.getElementById('settings-overlay').addEventListener('click', function(e){
    if(e.target.id === 'settings-overlay') document.getElementById('settings-overlay').hidden = true;
  });

  // Un seul bouton (à gauche des étoiles) bascule entre les deux clans : il
  // affiche l'emoji du clan VERS lequel on bascule, et son libellé accessible
  // le dit en toutes lettres (on n'affiche plus deux gros boutons de thème).
  function syncThemeToggleButton(th){
    var btn = document.getElementById('theme-toggle');
    if(!btn) return;
    var other = th==='cats' ? 'brainrot' : 'cats';
    btn.textContent = THEMES[other].mascot;
    btn.setAttribute('aria-label', other==='brainrot' ? 'Passer dans le clan Brainrot' : 'Passer dans le clan Chats Kawaii');
    btn.setAttribute('title', other==='brainrot' ? 'Passer dans le clan Brainrot' : 'Passer dans le clan Chats Kawaii');
  }
  function applyTheme(th){
    document.body.setAttribute('data-app-theme', th);
    var cfg = THEMES[th];
    document.getElementById('appTitle').textContent = cfg.title;
    syncThemeToggleButton(th);
    document.querySelectorAll('.coach-avatar').forEach(function(av){
      // La mascotte perso (si choisie) garde son propre visage, pas
      // l'emoji générique du thème (voir renderMascotDock plus bas).
      if(av.id === 'mascot-face' && activeMascotId()) return;
      av.textContent = cfg.mascot;
    });
    try{ localStorage.setItem('geo_theme', th); }catch(e){}
    renderTopMascotIcon();
    renderMascotDock();
    renderShop(); // la boutique suit le clan actif (voir syncShopThemeToAppTheme)
    if(typeof onThemeChangedForBattle === 'function') onThemeChangedForBattle();
  }
  document.getElementById('theme-toggle').addEventListener('click', function(){
    applyTheme(document.body.getAttribute('data-app-theme')==='brainrot' ? 'cats' : 'brainrot');
  });
  (function initTheme(){
    var th = 'cats';
    try{ th = localStorage.getItem('geo_theme') || 'cats'; }catch(e){}
    if(th !== 'cats' && th !== 'brainrot') th = 'cats';
    document.body.setAttribute('data-app-theme', th);
    var cfg = THEMES[th];
    document.getElementById('mascotIcon').textContent = cfg.mascot;
    document.getElementById('appTitle').textContent = cfg.title;
    syncThemeToggleButton(th);
    document.querySelectorAll('.coach-avatar').forEach(function(av){ av.textContent = cfg.mascot; });
    // (le premier dessin de la mascotte se fait plus bas, une fois svgNS/el
    // définis : el() en dépend, et ce IIFE s'exécute avant leur assignation)
  })();

  /* ---- Buste générique (chat ou brainrot) jusqu'au torse, dessiné dans le
     <svg> fourni. Utilisé pour la mascotte géante en bas de l'écran, et
     comme corps de secours pour une mascotte perso sans asset "plein pied"
     (voir renderCreatureVisual plus bas). L'expression du visage est gérée
     séparément par setCoachReaction (span .mascot-face, qui partage la
     classe .coach-avatar avec les petits avatars des familles Formes/Horloge). */
  function paintMascotBody(svg, side){
    while(svg.firstChild) svg.removeChild(svg.firstChild);
    svg.setAttribute('viewBox','0 0 200 240');
    if(side==='cats'){
      svg.appendChild(el('path',{d:'M42,150 C42,108 158,108 158,150 L172,240 L28,240 Z', fill:'var(--accent2)', stroke:'var(--text)','stroke-width':3,'stroke-linejoin':'round'}));
      svg.appendChild(el('polygon',{points:'55,72 40,18 78,54', fill:'var(--accent2)', stroke:'var(--text)','stroke-width':3,'stroke-linejoin':'round'}));
      svg.appendChild(el('polygon',{points:'145,72 160,18 122,54', fill:'var(--accent2)', stroke:'var(--text)','stroke-width':3,'stroke-linejoin':'round'}));
      svg.appendChild(el('polygon',{points:'58,62 50,34 72,52', fill:'#FFD9E6'}));
      svg.appendChild(el('polygon',{points:'142,62 150,34 128,52', fill:'#FFD9E6'}));
      svg.appendChild(el('circle',{cx:100,cy:112,r:66, fill:'var(--accent2)', stroke:'var(--text)','stroke-width':3}));
      svg.appendChild(el('circle',{cx:56,cy:126,r:12, fill:'#FF9EB8','fill-opacity':0.6}));
      svg.appendChild(el('circle',{cx:144,cy:126,r:12, fill:'#FF9EB8','fill-opacity':0.6}));
      [-1,1].forEach(function(side){
        for(var i=0;i<3;i++){
          var y = 118+i*8;
          svg.appendChild(el('line',{x1:100+side*48, y1:y, x2:100+side*84, y2:y-4+i*4, stroke:'var(--text)','stroke-width':2,'stroke-linecap':'round','stroke-opacity':0.5}));
        }
      });
    } else {
      var pts = [[100,26],[128,42],[162,36],[176,70],[164,104],[182,132],[152,152],[140,186],[100,196],
        [60,186],[48,152],[18,132],[36,104],[24,70],[38,36],[72,42]];
      svg.appendChild(el('path',{d:'M42,140 C42,108 158,108 158,140 L172,240 L28,240 Z', fill:'var(--accent2)', stroke:'var(--text)','stroke-width':3,'stroke-linejoin':'round'}));
      svg.appendChild(el('polygon',{points:pts.map(function(p){return p[0]+','+p[1];}).join(' '), fill:'var(--accent2)', stroke:'var(--text)','stroke-width':3,'stroke-linejoin':'round'}));
    }
  }
  /* ---- Mascotte géante (buste) fixée en bas de l'écran : dessine le buste
     du thème courant (ou de `sideOverride` si fourni) dans #mascotBigSvg. */
  function drawMascotBig(sideOverride){
    var svg = document.getElementById('mascotBigSvg');
    if(!svg) return;
    paintMascotBody(svg, sideOverride || currentThemeKey());
  }
  function bounceMascotTalk(){
    var dock = document.getElementById('mascot-dock');
    if(!dock) return;
    dock.classList.remove('talk','good','bad');
    void dock.offsetWidth;
    dock.classList.add('talk');
  }
  function reactMascot(kind){
    var dock = document.getElementById('mascot-dock');
    if(!dock) return;
    dock.classList.remove('talk','good','bad');
    void dock.offsetWidth;
    dock.classList.add(kind);
  }

  var DIFFICULTY_TABS = { facile:0, moyen:1, difficile:2 };
  // La ligne d'onglets (Facile/Moyen/Difficile/Manuel/Boutique) est repliée
  // par défaut pour alléger l'écran : le bouton "☰ Menu" (juste sous l'image
  // de la mascotte) la fait apparaître, et elle se referme dès qu'on a choisi.
  function setMenuOpen(open){
    document.getElementById('main-nav').hidden = !open;
    document.getElementById('menu-btn').setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  document.getElementById('menu-btn').addEventListener('click', function(){
    setMenuOpen(document.getElementById('main-nav').hidden);
  });
  document.querySelectorAll('.tab-btn').forEach(function(btn){
    btn.addEventListener('click', function(){
      document.querySelectorAll('.tab-btn').forEach(function(b){ b.classList.remove('active'); b.setAttribute('aria-pressed','false'); });
      btn.classList.add('active');
      btn.setAttribute('aria-pressed','true');
      setMenuOpen(false);
      var tab = btn.getAttribute('data-tab');
      document.querySelectorAll('.tabpanel').forEach(function(p){ p.hidden = true; });
      if(tab in DIFFICULTY_TABS){
        document.getElementById('tab-practice').hidden = false;
        document.getElementById('mascot-dock').hidden = false;
        setAppMode('auto');
        setGlobalLevel(DIFFICULTY_TABS[tab]);
      } else if(tab === 'manuel'){
        document.getElementById('tab-practice').hidden = false;
        document.getElementById('mascot-dock').hidden = false;
        setAppMode('manual');
      } else {
        document.getElementById('tab-'+tab).hidden = false;
        document.getElementById('mascot-dock').hidden = true;
      }
    });
  });

  var svgNS = "http://www.w3.org/2000/svg";
  function el(name, attrs){
    var e = document.createElementNS(svgNS, name);
    for(var k in attrs){ e.setAttribute(k, attrs[k]); }
    return e;
  }
  drawMascotBig(); // premier dessin, une fois svgNS/el() réellement assignés

  /* ---- Écran de démarrage : duo chat kawaii / brainrot face à face ----
     Couleurs volontairement écrites en dur (pas de var(--...)) : ce visuel
     montre les DEUX univers à la fois, avant même le choix de thème, donc
     il ne doit pas suivre le thème actif. Les mêmes tracés (dessinés à la
     main, comme drawMascotBig) sont aussi exportés tels quels dans
     assets/branding/splash-cat-vs-brainrot.svg pour réutilisation hors app. */
  function drawSplashArt(svg){
    if(!svg) return;
    while(svg.firstChild) svg.removeChild(svg.firstChild);
    svg.setAttribute('viewBox','0 0 320 180');
    svg.appendChild(el('rect',{x:0,y:0,width:160,height:180, fill:'#FFE7EF'}));
    svg.appendChild(el('rect',{x:160,y:0,width:160,height:180, fill:'#1E1830'}));

    var gCat = el('g',{transform:'translate(24,4) scale(0.62)'});
    gCat.appendChild(el('path',{d:'M42,150 C42,108 158,108 158,150 L172,240 L28,240 Z', fill:'#FFB8CE', stroke:'#5B4034','stroke-width':4,'stroke-linejoin':'round'}));
    // Tête ET oreilles dessinées AVANT le cercle de tête n'est pas assez :
    // ici les oreilles sont tracées APRÈS le cercle pour garantir qu'elles
    // ressortent bien nettement au-dessus de la tête, quelle que soit
    // l'échelle utilisée (contrairement au dessin original, pensé pour une
    // échelle 1:1 où seule la pointe dépasse).
    gCat.appendChild(el('circle',{cx:100,cy:112,r:66, fill:'#FFB8CE', stroke:'#5B4034','stroke-width':4}));
    gCat.appendChild(el('polygon',{points:'55,72 40,10 82,58', fill:'#FFB8CE', stroke:'#5B4034','stroke-width':4,'stroke-linejoin':'round'}));
    gCat.appendChild(el('polygon',{points:'145,72 160,10 118,58', fill:'#FFB8CE', stroke:'#5B4034','stroke-width':4,'stroke-linejoin':'round'}));
    gCat.appendChild(el('polygon',{points:'60,62 50,26 76,54', fill:'#FFD9E6'}));
    gCat.appendChild(el('polygon',{points:'140,62 150,26 124,54', fill:'#FFD9E6'}));
    gCat.appendChild(el('circle',{cx:56,cy:126,r:12, fill:'#FF9EB8','fill-opacity':0.6}));
    gCat.appendChild(el('circle',{cx:144,cy:126,r:12, fill:'#FF9EB8','fill-opacity':0.6}));
    gCat.appendChild(el('circle',{cx:78,cy:104,r:6, fill:'#2B2B2B'}));
    gCat.appendChild(el('circle',{cx:122,cy:104,r:6, fill:'#2B2B2B'}));
    gCat.appendChild(el('circle',{cx:80,cy:102,r:1.8, fill:'#fff'}));
    gCat.appendChild(el('circle',{cx:124,cy:102,r:1.8, fill:'#fff'}));
    svg.appendChild(gCat);

    var gBrain = el('g',{transform:'translate(154,4) scale(0.62)'});
    var bpts = [[100,26],[128,42],[162,36],[176,70],[164,104],[182,132],[152,152],[140,186],[100,196],
      [60,186],[48,152],[18,132],[36,104],[24,70],[38,36],[72,42]];
    gBrain.appendChild(el('path',{d:'M42,140 C42,108 158,108 158,140 L172,240 L28,240 Z', fill:'#8CF06B', stroke:'#F5F0FF','stroke-width':4,'stroke-linejoin':'round'}));
    gBrain.appendChild(el('polygon',{points:bpts.map(function(p){return p[0]+','+p[1];}).join(' '), fill:'#8CF06B', stroke:'#F5F0FF','stroke-width':4,'stroke-linejoin':'round'}));
    gBrain.appendChild(el('circle',{cx:70,cy:110,r:11, fill:'#fff'}));
    gBrain.appendChild(el('circle',{cx:130,cy:112,r:8, fill:'#fff'}));
    gBrain.appendChild(el('circle',{cx:73,cy:112,r:4.5, fill:'#2B2B2B'}));
    gBrain.appendChild(el('circle',{cx:132,cy:114,r:3.2, fill:'#2B2B2B'}));
    svg.appendChild(gBrain);

    svg.appendChild(el('circle',{cx:160,cy:148,r:27, fill:'#FFD24C', stroke:'#5B4034','stroke-width':4}));
    var vsText = el('text',{x:160,y:156,'text-anchor':'middle','font-size':21,'font-family':"'Baloo 2', sans-serif",'font-weight':'800',fill:'#5B4034'});
    vsText.textContent = 'VS';
    svg.appendChild(vsText);
  }
  drawSplashArt(document.getElementById('splashSvg'));

  /* ---- Splash perso en remplacement du dessin procédural -----------------
     Même principe que pour les personnages (tryLoadCustomImage) : si un
     fichier assets/branding/splash.<ext> existe, il remplace automatiquement
     le dessin généré, sans rien à changer dans le code. Contrairement aux
     personnages, une VIDÉO ou un GIF animé sont aussi acceptés ici (ordre de
     priorité : vidéo mp4/webm d'abord, puis gif/webp/png/jpg/svg) — un écran
     de démarrage se prête bien à une petite animation en boucle. Si aucun
     fichier n'est trouvé (ex : aperçu publié seul, sans le reste du dépôt),
     le dessin procédural (drawSplashArt ci-dessus) reste affiché tel quel. */
  function trySplashCustomMedia(){
    var svg = document.getElementById('splashSvg');
    if(!svg) return;
    var container = svg.parentNode;
    var VIDEO_EXTS = ['mp4','webm'];
    var IMAGE_EXTS = ['gif','webp','png','jpg','jpeg','svg'];
    function tryImage(i){
      if(i >= IMAGE_EXTS.length) return; // rien trouvé : on garde le SVG procédural
      var img = new Image();
      img.className = 'splash-art splash-custom-media';
      img.alt = 'Écran de démarrage';
      img.onload = function(){ svg.style.display = 'none'; container.insertBefore(img, svg); };
      img.onerror = function(){ tryImage(i+1); };
      img.src = 'assets/branding/splash.' + IMAGE_EXTS[i];
    }
    function tryVideo(i){
      if(i >= VIDEO_EXTS.length){ tryImage(0); return; }
      var v = document.createElement('video');
      v.className = 'splash-art splash-custom-media';
      v.autoplay = true; v.loop = true; v.muted = true; v.playsInline = true;
      v.setAttribute('aria-label','Écran de démarrage');
      v.addEventListener('loadeddata', function(){ svg.style.display = 'none'; container.insertBefore(v, svg); });
      v.addEventListener('error', function(){ tryVideo(i+1); });
      v.src = 'assets/branding/splash.' + VIDEO_EXTS[i];
    }
    tryVideo(0);
  }
  trySplashCustomMedia();

  document.getElementById('splash-start-btn').addEventListener('click', function(){
    var overlay = document.getElementById('splash-overlay');
    overlay.classList.add('splash-hide');
    setTimeout(function(){ overlay.hidden = true; }, 400);
    playSound('good');
  });

  function shuffle(arr){
    for(var i=arr.length-1;i>0;i--){
      var j = Math.floor(Math.random()*(i+1));
      var t=arr[i]; arr[i]=arr[j]; arr[j]=t;
    }
    return arr;
  }
  // Tirage « sans remise » : chaque élément sort une fois avant qu'aucun ne
  // revienne, et le premier d'un nouveau tour n'est jamais le dernier du tour
  // précédent. `key` identifie le sac (un sac par liste à varier).
  var FRESH_BAGS = {};
  function pickFresh(key, arr){
    var b = FRESH_BAGS[key];
    if(!b || b.n !== arr.length){ b = FRESH_BAGS[key] = { n:arr.length, bag:[], last:-1 }; }
    if(!b.bag.length){
      var idx = [];
      for(var i=0;i<arr.length;i++) idx.push(i);
      shuffle(idx);
      if(idx.length>1 && idx[idx.length-1]===b.last){   // le prochain sorti = idx.pop()
        var j = Math.floor(Math.random()*(idx.length-1));
        var t = idx[idx.length-1]; idx[idx.length-1] = idx[j]; idx[j] = t;
      }
      b.bag = idx;
    }
    b.last = b.bag.pop();
    return arr[b.last];
  }
  function fmtNum(v){
    // affiche "6" ou "6,5" (virgule française)
    return (Math.round(v*2)/2).toString().replace('.', ',');
  }

  function buildLevelRow(container, levels, defaultIdx, onChange){
    container.innerHTML = "";
    // Peu de boutons (ex: Facile/Moyen/Difficile) : on garde le look
    // "pastilles égales" d'origine. Beaucoup de boutons (ex: les types de
    // QCM) : on les laisse prendre la largeur de leur texte et retourner
    // à la ligne, plutôt que de les écraser ou de déborder de l'écran.
    container.classList.toggle('level-row-even', levels.length <= 4);
    var current = defaultIdx;
    levels.forEach(function(label, idx){
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'level-btn' + (idx===defaultIdx ? ' active' : '');
      b.setAttribute('aria-pressed', idx===defaultIdx ? 'true' : 'false');
      b.textContent = label;
      b.addEventListener('click', function(){
        if(current === idx) return;
        current = idx;
        container.querySelectorAll('.level-btn').forEach(function(x){ x.classList.remove('active'); x.setAttribute('aria-pressed','false'); });
        b.classList.add('active');
        b.setAttribute('aria-pressed','true');
        onChange(idx);
      });
      container.appendChild(b);
    });
  }

  /* ===================== EFFETS : son + confettis ===================== */
  function playSound(kind){
    try{
      var Ctx = window.AudioContext || window.webkitAudioContext;
      if(!Ctx) return;
      var ctx = new Ctx();
      var t0 = ctx.currentTime;
      var overload = (sfxMode==='overload');
      if(kind==='good'){
        var notes = overload ? [523.25, 659.25, 783.99, 1046.5] : [523.25, 783.99];
        var peak = overload ? 0.42 : 0.25;
        notes.forEach(function(freq, i){
          var o=ctx.createOscillator(), g=ctx.createGain();
          o.type='sine'; o.frequency.value=freq;
          g.gain.setValueAtTime(0.0001, t0+i*0.08);
          g.gain.exponentialRampToValueAtTime(peak, t0+i*0.08+0.02);
          g.gain.exponentialRampToValueAtTime(0.0001, t0+i*0.08+(overload?0.32:0.22));
          o.connect(g); g.connect(ctx.destination);
          o.start(t0+i*0.08); o.stop(t0+i*0.08+(overload?0.35:0.25));
        });
        if(overload){
          // petite couche de "paillettes" aiguës en plus, façon fanfare
          for(var k=0;k<5;k++){
            var o2=ctx.createOscillator(), g2=ctx.createGain();
            o2.type='triangle'; o2.frequency.value = 1300 + k*220;
            var ts = t0 + 0.3 + k*0.05;
            g2.gain.setValueAtTime(0.0001, ts);
            g2.gain.exponentialRampToValueAtTime(0.18, ts+0.02);
            g2.gain.exponentialRampToValueAtTime(0.0001, ts+0.15);
            o2.connect(g2); g2.connect(ctx.destination);
            o2.start(ts); o2.stop(ts+0.16);
          }
        }
      } else {
        var o=ctx.createOscillator(), g=ctx.createGain();
        o.type='sawtooth';
        o.frequency.setValueAtTime(overload?260:180,t0);
        o.frequency.exponentialRampToValueAtTime(overload?55:90, t0+(overload?0.5:0.28));
        g.gain.setValueAtTime(overload?0.38:0.22,t0);
        g.gain.exponentialRampToValueAtTime(0.0001, t0+(overload?0.55:0.3));
        o.connect(g); g.connect(ctx.destination);
        o.start(t0); o.stop(t0+(overload?0.58:0.32));
        if(overload){
          var o3=ctx.createOscillator(), g3=ctx.createGain();
          o3.type='square'; o3.frequency.setValueAtTime(90,t0+0.05);
          g3.gain.setValueAtTime(0.0001, t0+0.05);
          g3.gain.exponentialRampToValueAtTime(0.3, t0+0.08);
          g3.gain.exponentialRampToValueAtTime(0.0001, t0+0.5);
          o3.connect(g3); g3.connect(ctx.destination);
          o3.start(t0+0.05); o3.stop(t0+0.52);
        }
      }
      setTimeout(function(){ try{ ctx.close(); }catch(e){} }, 900);
    }catch(e){ /* audio non disponible : on continue sans son */ }
  }

  function celebrate(kind, anchorEl){
    setCoachReaction(kind);
    reactMascot(kind);
    if(sfxMode==='overload') overloadBlast(kind);
    if(!anchorEl) return;
    if(kind==='good'){
      var rect = anchorEl.getBoundingClientRect();
      var emojis = ['✨','⭐','🎉','💫'];
      var count = sfxMode==='overload' ? 14 : 6;
      for(var i=0;i<count;i++){
        var s = document.createElement('span');
        s.className = 'burst-particle';
        s.textContent = emojis[Math.floor(Math.random()*emojis.length)];
        s.style.left = (rect.left+rect.width/2+(Math.random()*80-40))+'px';
        s.style.top = (rect.top+8)+'px';
        s.style.setProperty('--dx',(Math.random()*80-40)+'px');
        document.body.appendChild(s);
        (function(el){ setTimeout(function(){ el.remove(); }, 950); })(s);
      }
    } else {
      anchorEl.classList.remove('shake');
      void anchorEl.offsetWidth; // relance l'animation si déjà jouée
      anchorEl.classList.add('shake');
      setTimeout(function(){ anchorEl.classList.remove('shake'); }, 420);
    }
  }

  // Mode Overload : gros effet plein écran (texte qui "pop", secousse de
  // l'écran, pluie de confettis partout) en plus des effets normaux.
  function overloadBlast(kind){
    var goodTexts = ['SUPER !','GÉNIAL !','BOOM !','TROP FORT !','INCROYABLE !'];
    var badTexts = ['OUPS !','RATÉ !','AÏE !','PRESQUE !'];
    var text = kind==='good' ? pick(goodTexts) : pick(badTexts);
    var popEl = document.createElement('div');
    popEl.className = 'overload-pop ' + kind;
    popEl.textContent = text;
    document.body.appendChild(popEl);
    setTimeout(function(){ popEl.remove(); }, 950);

    document.body.classList.remove('overload-shake');
    void document.body.offsetWidth;
    document.body.classList.add('overload-shake');
    setTimeout(function(){ document.body.classList.remove('overload-shake'); }, 550);

    var emojis = kind==='good' ? ['✨','⭐','🎉','💫','🌟','🥳','🎊'] : ['💥','😵','⚡','❌','😱'];
    var vw = window.innerWidth, vh = window.innerHeight;
    for(var i=0;i<24;i++){
      var s = document.createElement('span');
      s.className = 'burst-particle';
      s.textContent = emojis[Math.floor(Math.random()*emojis.length)];
      s.style.left = (Math.random()*vw)+'px';
      s.style.top = (Math.random()*vh*0.6)+'px';
      s.style.fontSize = (16+Math.random()*22)+'px';
      s.style.setProperty('--dx',(Math.random()*160-80)+'px');
      document.body.appendChild(s);
      (function(el){ setTimeout(function(){ el.remove(); }, 1000); })(s);
    }
  }

  var REACTIONS = {
    cats:{ neutral:'🐱', good:'😻', bad:'🙀' },
    brainrot:{ neutral:'👹', good:'🤩', bad:'😵' }
  };
  function currentThemeKey(){
    var th = document.body.getAttribute('data-app-theme');
    return (th==='brainrot') ? 'brainrot' : 'cats';
  }
  function setCoachReaction(kind){
    var face = REACTIONS[currentThemeKey()][kind] || REACTIONS[currentThemeKey()].neutral;
    document.querySelectorAll('.coach-avatar').forEach(function(av){
      // La mascotte perso (si choisie) garde son propre visage au lieu de
      // l'emoji de réaction générique (voir renderMascotDock plus bas).
      if(av.id === 'mascot-face' && activeMascotId()) return;
      av.textContent = face;
    });
  }

  // Permet de toucher n'importe où sur la boîte de feedback pour relancer
  // une nouvelle question (en plus du bouton dédié) : plus pratique pour un
  // enfant que de devoir viser un petit bouton après chaque réponse.
  function enableTapToContinue(feedbackId, nextFn){
    var fb = document.getElementById(feedbackId);
    if(!fb) return;
    fb.classList.add('tappable');
    // Accessibilité : annoncé par les lecteurs d'écran dès qu'il apparaît,
    // atteignable au clavier, et Entrée/Espace fait la même chose qu'un clic.
    fb.setAttribute('aria-live','polite');
    fb.tabIndex = 0;
    fb.addEventListener('click', function(){
      if(fb.classList.contains('show')) nextFn();
    });
    fb.addEventListener('keydown', function(e){
      if((e.key==='Enter' || e.key===' ') && fb.classList.contains('show')){ e.preventDefault(); nextFn(); }
    });
  }


  // ---- Outils partagés par tous les thèmes ----
  function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
  function rand(a,b){ return a+Math.random()*(b-a); }

  function randInt(a,b){ return Math.floor(rand(a, b+1)); }

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

  function svgText(x,y,size,txt){
    var t = el('text',{x:x,y:y,'text-anchor':'middle','font-size':size,'font-family':"'Baloo 2', sans-serif",'font-weight':'700',fill:'var(--text)'});
    t.textContent = txt;
    return t;
  }

  // ---- Registre des types de Quizz ----
  // Chaque thème appelle registerQuizType() pour déclarer ses types de questions :
  //   id            identifiant unique (ex. 'sides')
  //   label         nom court (panneau « Configurer les activités »)
  //   longLabel     nom affiché dans la liste du mode Manuel
  //   defaultLevels niveaux où le type apparaît par défaut : 0 Facile, 1 Moyen, 2 Difficile
  //   randomNote    ce qui est tiré au hasard, pour le panneau de configuration
  //   generate(level)  renvoie la question :
  //     { tag, question, sub, explain, draw:function(){…}, cols3:bool, choices:[{label, ok}] }
  var QCM_TYPE_DEFS = [];
  // Sous-catégories d'affichage (panneau « Activités & difficulté » et mode Manuel).
  // Un thème peut en ajouter avec registerQuizCategory ; un type sans catégorie
  // connue tombe dans « Autres ».
  var QCM_CATEGORIES = [
    { id:'formes',    label:'Formes', icon:'🔷' },
    { id:'repere',    label:'Repérage', icon:'🧭' },
    { id:'solides',   label:'Solides & énigmes', icon:'🧊' },
    { id:'temps',     label:'Heure & durées', icon:'🕒' },
    { id:'calcul',    label:'Calcul', icon:'➕' },
    { id:'problemes', label:'Problèmes & monnaie', icon:'🪙' },
    { id:'logique',   label:'Suites logiques', icon:'🧩' },
    { id:'autres',    label:'Autres', icon:'✨' }
  ];
  function registerQuizCategory(cat){ QCM_CATEGORIES.splice(QCM_CATEGORIES.length-1, 0, cat); }
  function quizCategoryId(def){
    for(var i=0;i<QCM_CATEGORIES.length;i++){ if(QCM_CATEGORIES[i].id===def.category) return def.category; }
    return 'autres';
  }
  function registerQuizType(def){ QCM_TYPE_DEFS.push(def); }
  function quizTypeById(id){
    for(var i=0;i<QCM_TYPE_DEFS.length;i++){ if(QCM_TYPE_DEFS[i].id===id) return QCM_TYPE_DEFS[i]; }
    return null;
  }
