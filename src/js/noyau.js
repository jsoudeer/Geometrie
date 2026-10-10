
  // Langue de la page (RGAA 8.3) : la page est publiée sans balise <html> à elle,
  // on déclare donc le français sur la racine du document.
  document.documentElement.lang = 'fr';

  /* ===================== CORE : THEME + NAV ===================== */
  var THEMES = {
    cats:{ mascot:"🐱" },
    brainrot:{ mascot:"👹" }
  };

  var stars = 0;
  function addStar(n){
    stars += n;
    document.getElementById('starCount').textContent = stars;
    try{ localStorage.setItem('geo_stars', String(stars)); }catch(e){}
    // la boutique déjà ouverte suit le nouveau total (compteur, boutons « Acheter »)
    var shop = document.getElementById('tab-shop');
    if(shop && !shop.hidden && typeof renderShop === 'function') renderShop();
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
    overload:'Sons plus forts, gros effets à l\'écran et la mascotte s\'agite fort à chaque réponse ! Et la chaleur monte aux séries sans faute de 15, 20 puis 25.'
  };
  function updateSfxHint(){
    document.getElementById('sfx-mode-hint').textContent = SFX_HINTS[sfxMode];
  }
  buildLevelRow(document.getElementById('sfx-mode-row'), ['Normal','Mode Overload 🔊'], sfxMode==='overload' ? 1 : 0, function(idx){
    sfxMode = idx===1 ? 'overload' : 'normal';
    try{ localStorage.setItem('geo_sfx_mode', sfxMode); }catch(e){}
    updateSfxHint();
    if(typeof updateHeat === 'function') updateHeat();
  });
  updateSfxHint();

  /* ---- Avancement automatique (modes Manuel et Aléatoire) : toujours actif, il monte de niveau
     après autoAdvanceThreshold bonnes réponses d'affilée (plus de réglage dans l'interface ;
     les tests peuvent relever le seuil pour l'éviter). ---- */
  var autoAdvanceThreshold = 5;

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
    btn.setAttribute('aria-label', other==='brainrot' ? 'Passer dans le clan Brainrot' : 'Passer dans la Team Kawaii');
    btn.setAttribute('title', other==='brainrot' ? 'Passer dans le clan Brainrot' : 'Passer dans la Team Kawaii');
  }
  function applyTheme(th){
    document.body.setAttribute('data-app-theme', th);
    var cfg = THEMES[th];
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
  // Menu : l'icône de la mascotte (en haut à gauche) ouvre, juste sous elle,
  // la colonne Facile / Moyen / Difficile / Manuel, posée par-dessus la page.
  // Elle se referme dès qu'on a choisi, en touchant ailleurs, ou avec Échap
  // (le focus revient alors sur l'icône). Flèches haut/bas pour s'y déplacer.
  // Pendant un défi chronométré, la même icône sert à QUITTER le défi.
  var MENU_BADGES = { facile:'🙂', moyen:'🤔', difficile:'🔥', manuel:'🎯' };
  var MENU_NAMES = { facile:'Facile', moyen:'Moyen', difficile:'Difficile', manuel:'Manuel' };
  function menuItems(){ return [].slice.call(document.querySelectorAll('#main-nav .tab-btn')); }
  function isMenuOpen(){ return !document.getElementById('main-nav').hidden; }
  function setMenuOpen(open, focusItem){
    document.getElementById('main-nav').hidden = !open;
    document.getElementById('menu-btn').setAttribute('aria-expanded', open ? 'true' : 'false');
    if(open && focusItem){
      var items = menuItems(), cur = items.filter(function(b){ return b.classList.contains('active'); })[0];
      (cur || items[0]).focus();
    }
  }
  // Pastille et nom accessible du bouton : niveau en cours, ou « quitter » en chrono.
  function updateMenuButton(){
    var btn = document.getElementById('menu-btn'), badge = document.getElementById('menu-badge');
    var chrono = typeof countdownRunning !== 'undefined' && countdownRunning;
    document.body.classList.toggle('chrono-running', !!chrono);
    if(chrono){
      badge.textContent = '✕';
      btn.setAttribute('aria-label', 'Quitter le défi chronométré');
      btn.removeAttribute('aria-expanded');
      btn.title = 'Quitter le défi';
    } else {
      badge.textContent = MENU_BADGES[lastPracticeTab] || '🙂';
      btn.setAttribute('aria-label', 'Menu : choisir le niveau (niveau actuel : ' + (MENU_NAMES[lastPracticeTab] || 'Facile') + ')');
      btn.setAttribute('aria-expanded', isMenuOpen() ? 'true' : 'false');
      btn.title = 'Choisir le niveau';
    }
  }
  document.getElementById('menu-btn').addEventListener('click', function(e){
    if(typeof countdownRunning !== 'undefined' && countdownRunning){ quitCountdown(); return; }
    // clavier (e.detail===0) : on place le focus dans le menu pour s'y déplacer aux flèches
    setMenuOpen(!isMenuOpen(), e.detail === 0);
  });
  document.getElementById('main-nav').addEventListener('keydown', function(e){
    var items = menuItems(), i = items.indexOf(document.activeElement);
    if(e.key==='ArrowDown' || e.key==='ArrowUp'){
      e.preventDefault();
      var n = e.key==='ArrowDown' ? (i+1) % items.length : (i-1+items.length) % items.length;
      items[n].focus();
    } else if(e.key==='Home'){ e.preventDefault(); items[0].focus(); }
    else if(e.key==='End'){ e.preventDefault(); items[items.length-1].focus(); }
  });
  document.addEventListener('keydown', function(e){
    if(e.key==='Escape' && isMenuOpen()){ setMenuOpen(false); document.getElementById('menu-btn').focus(); }
  });
  document.addEventListener('click', function(e){
    if(isMenuOpen() && !e.target.closest('.brand')) setMenuOpen(false);
  });
  // Navigation : les exercices (Facile/Moyen/Difficile/Manuel) passent par le
  // menu ; la Boutique (compteur d'étoiles) et la Bataille (icône ⚔️) s'ouvrent
  // depuis l'en-tête et se referment en retouchant leur bouton ou « Retour ».
  var lastPracticeTab = 'facile';
  function showTab(tab){
    document.querySelectorAll('.tab-btn').forEach(function(b){
      var on = b.getAttribute('data-tab') === tab;
      b.classList.toggle('active', on); b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    document.getElementById('stars-btn').setAttribute('aria-pressed', tab==='shop' ? 'true' : 'false');
    document.getElementById('battle-btn').setAttribute('aria-pressed', tab==='battle' ? 'true' : 'false');
    document.getElementById('stars-btn').classList.toggle('active', tab==='shop');
    document.getElementById('battle-btn').classList.toggle('active', tab==='battle');
    setMenuOpen(false);
    document.querySelectorAll('.tabpanel').forEach(function(p){ p.hidden = true; });
    if(tab in DIFFICULTY_TABS){
      lastPracticeTab = tab;
      document.getElementById('tab-practice').hidden = false;
      document.getElementById('mascot-dock').hidden = false;
      setAppMode('auto');
      setGlobalLevel(DIFFICULTY_TABS[tab]);
    } else if(tab === 'manuel'){
      lastPracticeTab = tab;
      document.getElementById('tab-practice').hidden = false;
      document.getElementById('mascot-dock').hidden = false;
      setAppMode('manual');
    } else {
      document.getElementById('tab-'+tab).hidden = false;
      document.getElementById('mascot-dock').hidden = true;
      if(tab === 'battle') renderBtSetup();
      // la boutique est redessinée à chaque ouverture : les étoiles gagnées
      // depuis la dernière visite débloquent les boutons « Acheter »
      if(tab === 'shop') renderShop();
    }
    updateMenuButton();
  }
  document.querySelectorAll('.tab-btn').forEach(function(btn){
    btn.addEventListener('click', function(){ showTab(btn.getAttribute('data-tab')); });
  });
  function toggleSidePanel(tab){
    showTab(document.getElementById('tab-'+tab).hidden ? tab : lastPracticeTab);
  }
  document.getElementById('stars-btn').addEventListener('click', function(){ toggleSidePanel('shop'); });
  document.getElementById('battle-btn').addEventListener('click', function(){ toggleSidePanel('battle'); });
  document.querySelectorAll('[data-back]').forEach(function(b){
    b.addEventListener('click', function(){ showTab(lastPracticeTab); });
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
    // Chaque moitié est un groupe à part : elles arrivent chacune de leur côté
    // et s'entrechoquent au centre (voir splashImpact / css « .sp-* »).
    var halfL = el('g',{'class':'sp-half sp-left'}), halfR = el('g',{'class':'sp-half sp-right'});
    halfL.appendChild(el('rect',{x:-2,y:0,width:162,height:180, fill:'#FFE7EF'}));
    halfR.appendChild(el('rect',{x:160,y:0,width:162,height:180, fill:'#1E1830'}));
    svg.appendChild(halfL); svg.appendChild(halfR);

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
    halfL.appendChild(gCat);

    var gBrain = el('g',{transform:'translate(154,4) scale(0.62)'});
    var bpts = [[100,26],[128,42],[162,36],[176,70],[164,104],[182,132],[152,152],[140,186],[100,196],
      [60,186],[48,152],[18,132],[36,104],[24,70],[38,36],[72,42]];
    gBrain.appendChild(el('path',{d:'M42,140 C42,108 158,108 158,140 L172,240 L28,240 Z', fill:'#8CF06B', stroke:'#F5F0FF','stroke-width':4,'stroke-linejoin':'round'}));
    gBrain.appendChild(el('polygon',{points:bpts.map(function(p){return p[0]+','+p[1];}).join(' '), fill:'#8CF06B', stroke:'#F5F0FF','stroke-width':4,'stroke-linejoin':'round'}));
    gBrain.appendChild(el('circle',{cx:70,cy:110,r:11, fill:'#fff'}));
    gBrain.appendChild(el('circle',{cx:130,cy:112,r:8, fill:'#fff'}));
    gBrain.appendChild(el('circle',{cx:73,cy:112,r:4.5, fill:'#2B2B2B'}));
    gBrain.appendChild(el('circle',{cx:132,cy:114,r:3.2, fill:'#2B2B2B'}));
    halfR.appendChild(gBrain);

    var impact = el('g',{'class':'sp-impact', transform:'translate(160,92)'});
    svg.appendChild(impact);
    var vs = el('g',{'class':'sp-vs'});
    vs.appendChild(el('circle',{cx:160,cy:148,r:27, fill:'#FFD24C', stroke:'#5B4034','stroke-width':4}));
    var vsText = el('text',{x:160,y:156,'text-anchor':'middle','font-size':21,'font-family':"'Baloo 2', sans-serif",'font-weight':'800',fill:'#5B4034'});
    vsText.textContent = 'VS';
    vs.appendChild(vsText);
    svg.appendChild(vs);
    splashImpact(svg, impact);
  }
  /* Effets du choc (éclair, ondes, étincelles). Les étincelles partent dans
     des directions tirées au hasard à chaque lecture : rose côté chat, vert
     et jaune côté brainrot. Tout est animé en CSS ; mouvement réduit = rien. */
  function splashImpact(svg, g){
    g.appendChild(el('rect',{x:-160,y:-92,width:320,height:180,'class':'sp-flash',fill:'#fff'}));
    g.appendChild(el('circle',{r:30,'class':'sp-ring sp-ring1',fill:'none',stroke:'#fff','stroke-width':5}));
    g.appendChild(el('circle',{r:30,'class':'sp-ring sp-ring2',fill:'none',stroke:'#FFD24C','stroke-width':3}));
    g.appendChild(el('polyline',{points:'0,-92 -9,-60 7,-40 -8,-12 8,10 -7,38 6,62 0,88','class':'sp-bolt',fill:'none',stroke:'#FFD24C','stroke-width':4,'stroke-linejoin':'round'}));
    var cols = ['#FF7FA6','#FFD9E6','#8CF06B','#FFD24C','#fff','#B58CFF'];
    for(var i=0;i<22;i++){
      var ang = Math.random()*Math.PI*2, d = 55 + Math.random()*95;
      var sp = el('circle',{r:(2+Math.random()*3.2).toFixed(1),'class':'sp-spark',fill:cols[i%cols.length]});
      sp.style.setProperty('--dx', (Math.cos(ang)*d*1.25).toFixed(0) + 'px');
      sp.style.setProperty('--dy', (Math.sin(ang)*d*0.8).toFixed(0) + 'px');
      sp.style.animationDelay = (0.62 + Math.random()*0.08).toFixed(2) + 's';
      g.appendChild(sp);
    }
  }
  var splashSvgEl = document.getElementById('splashSvg');
  var splashArt = splashSvgEl;   // ce qui est affiché : le dessin SVG, ou l'image perso scindée (trySplashCustomMedia)
  // (Re)joue le choc : un clic sur l'image le rejoue.
  function playSplashClash(){
    var card = splashArt && splashArt.closest('.splash-card');
    if(!splashArt) return;
    if(splashArt === splashSvgEl) drawSplashArt(splashSvgEl);
    else { var g = splashArt.querySelector('.sp-impact'); while(g.firstChild) g.removeChild(g.firstChild); splashImpact(splashArt, g); }
    splashArt.classList.remove('sp-go'); if(card) card.classList.remove('sp-shake');
    void splashArt.getBoundingClientRect();
    splashArt.classList.add('sp-go'); if(card) card.classList.add('sp-shake');
  }
  // L'animation ne démarre qu'une fois la recherche d'une image perso terminée (trySplashCustomMedia) :
  // jusque-là la carte reste en attente (classe sp-wait : dessin et textes invisibles).
  // Site installé : on attend aussi la vérification des mises à jour (window.KVB_READY, posée par la page du site,
  // voir tools/build.py) : si une nouvelle version arrive, la page se recharge avant que l'animation ne se joue.
  var splashSettled = false;
  function splashSettle(kind){
    if(splashSettled) return;
    splashSettled = true;
    if(window.KVB_READY && !splashSettle.ready){
      window.KVB_READY.then(function(){ splashSettle.ready = true; splashSettled = false; splashSettle(kind); });
      return;
    }
    var card = splashSvgEl && splashSvgEl.closest('.splash-card');
    if(kind==='svg'){
      drawSplashArt(splashSvgEl);
      splashSvgEl.addEventListener('click', playSplashClash);
    }
    if(card) card.classList.remove('sp-wait');
    if(kind==='video'){ if(card) card.classList.add('sp-shake'); return; }   // la vidéo joue d'elle-même : seulement l'apparition des textes
    playSplashClash();
  }

  /* ---- Splash perso en remplacement du dessin procédural -----------------
     Même principe que pour les personnages (tryLoadCustomImage) : si un
     fichier assets/branding/splash.<ext> existe (ou l'image embarquée SPLASH_IMG, qui est celle du jeu publié), il remplace automatiquement
     le dessin généré, sans rien à changer dans le code. Contrairement aux
     personnages, une VIDÉO ou un GIF animé sont aussi acceptés ici (ordre de
     priorité : vidéo mp4/webm d'abord, puis gif/webp/png/jpg/svg) — un écran
     de démarrage se prête bien à une petite animation en boucle. Si aucun
     fichier n'est trouvé (ex : aperçu publié seul, sans le reste du dépôt),
     ou au bout de 2,5 s, c'est le dessin procédural (drawSplashArt) qui joue. */
  function trySplashCustomMedia(){
    var svg = document.getElementById('splashSvg');
    if(!svg) return;
    var container = svg.parentNode;
    var VIDEO_EXTS = ['mp4','webm'];
    var IMAGE_EXTS = ['gif','webp','png','jpg','jpeg','svg'];
    // i = -1 : image embarquée (SPLASH_IMG, générée par tools/embed.py) ; sinon fichier assets/branding/splash.<ext>
    function tryImage(i){
      if(i >= IMAGE_EXTS.length){ splashSettle('svg'); return; } // rien trouvé : dessin procédural
      var img = new Image();
      img.onerror = function(){ tryImage(i+1); };
      img.onload = function(){
        if(splashSettled) return;
        // Une image fixe est scindée en deux moitiés (fond CSS) qui s'entrechoquent comme le dessin SVG.
        var box = document.createElement('div');
        box.className = 'splash-art splash-custom-media sp-split sp-go';
        box.setAttribute('role','img'); box.setAttribute('aria-label','Écran de démarrage');
        ['sp-hl','sp-hr'].forEach(function(c){
          var h = document.createElement('div'); h.className = 'sp-h ' + c;
          h.style.backgroundImage = 'url("' + img.src + '")'; box.appendChild(h);
        });
        var fx = document.createElementNS(svgNS,'svg');
        fx.setAttribute('viewBox','0 0 320 180'); fx.setAttribute('class','sp-fx'); fx.setAttribute('aria-hidden','true');
        var g = el('g',{'class':'sp-impact', transform:'translate(160,92)'});
        fx.appendChild(g); box.appendChild(fx); splashImpact(box, g);
        box.addEventListener('click', playSplashClash);
        svg.style.display = 'none'; container.insertBefore(box, svg); splashArt = box;
        splashSettle('image');
      };
      img.src = i < 0 ? SPLASH_IMG : 'assets/branding/splash.' + IMAGE_EXTS[i];
    }
    function tryVideo(i){
      if(i >= VIDEO_EXTS.length){ tryImage(typeof SPLASH_IMG === 'string' ? -1 : 0); return; }
      var v = document.createElement('video');
      v.className = 'splash-art splash-custom-media';
      v.autoplay = true; v.loop = true; v.muted = true; v.playsInline = true;
      v.setAttribute('aria-label','Écran de démarrage');
      v.addEventListener('loadeddata', function(){ if(splashSettled) return; svg.style.display = 'none'; container.insertBefore(v, svg); splashSettle('video'); });
      v.addEventListener('error', function(){ tryVideo(i+1); });
      v.src = 'assets/branding/splash.' + VIDEO_EXTS[i];
    }
    tryVideo(0);
  }
  trySplashCustomMedia();
  setTimeout(function(){ splashSettle('svg'); }, 2500);   // filet de sécurité : recherche trop longue

  document.getElementById('splash-start-btn').addEventListener('click', function(){
    var overlay = document.getElementById('splash-overlay');
    overlay.classList.add('splash-hide');
    setTimeout(function(){ overlay.hidden = true; }, 400);
    playSound('good');
  });

  // Hasard des QUESTIONS : tout passe par rnd() (jamais Math.random() directement), pour pouvoir
  // le rendre reproductible. withSeed(graine, fn) exécute fn avec un générateur à graine
  // (mulberry32) et des sacs « sans remise » vierges, puis remet tout comme avant : deux
  // appels avec la même graine donnent la même question. Les effets visuels (confettis…)
  // gardent Math.random().
  var RNG = null;
  function rnd(){ return RNG ? RNG() : Math.random(); }
  function mulberry32(a){
    return function(){
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function withSeed(seed, fn){
    var savedRng = RNG, savedBags = FRESH_BAGS;
    RNG = mulberry32(seed); FRESH_BAGS = {};
    try { return fn(); } finally { RNG = savedRng; FRESH_BAGS = savedBags; }
  }

  function shuffle(arr){
    for(var i=arr.length-1;i>0;i--){
      var j = Math.floor(rnd()*(i+1));
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
        var j = Math.floor(rnd()*(idx.length-1));
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

  /* ---- Sons du « reveal » d'un nouveau personnage ----
     playRevealWhoosh : balayage montant pendant que la silhouette grandit.
     playRevealSting(side) : le son au moment où le personnage apparaît,
     différent pour chaque clan (chats : arpège de harpe scintillant + petit
     « miaou » ; brainrot : boum grave + bips saccadés « glitch »). */
  function revealCtx(){
    var Ctx = window.AudioContext || window.webkitAudioContext;
    return Ctx ? new Ctx() : null;
  }
  function revealTone(ctx, type, f0, f1, t, dur, peak){
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    if(f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + Math.min(0.02, dur/3));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(ctx.destination);
    o.start(t); o.stop(t + dur + 0.02);
  }
  function playRevealWhoosh(){
    try{
      var ctx = revealCtx(); if(!ctx) return;
      var k = sfxMode==='overload' ? 1.6 : 1;
      revealTone(ctx, 'sine', 180, 900, ctx.currentTime, 1.7, 0.09*k);
      revealTone(ctx, 'triangle', 90, 450, ctx.currentTime, 1.7, 0.05*k);
      setTimeout(function(){ try{ ctx.close(); }catch(e){} }, 2000);
    }catch(e){}
  }
  function playRevealSting(side){
    try{
      var ctx = revealCtx(); if(!ctx) return;
      var t0 = ctx.currentTime, k = sfxMode==='overload' ? 1.6 : 1;
      if(side === 'brainrot'){
        // boum grave qui chute
        revealTone(ctx, 'sine', 140, 38, t0, 0.7, 0.55*k);
        revealTone(ctx, 'sawtooth', 900, 90, t0, 0.35, 0.14*k);
        // bips « glitch » saccadés
        [523, 262, 784, 196, 1046, 330].forEach(function(f, i){
          revealTone(ctx, 'square', f, f, t0 + 0.12 + i*0.055, 0.045, 0.1*k);
        });
        revealTone(ctx, 'square', 1568, 392, t0 + 0.5, 0.3, 0.08*k);
      } else {
        // arpège de harpe scintillant
        [1046.5, 1318.5, 1568, 2093, 2637].forEach(function(f, i){
          revealTone(ctx, 'triangle', f, f, t0 + i*0.075, 0.5, 0.22*k);
          revealTone(ctx, 'sine', f*2, f*2, t0 + i*0.075, 0.25, 0.05*k);
        });
        // petit « miaou » : glissando doux
        revealTone(ctx, 'sine', 620, 980, t0 + 0.42, 0.14, 0.16*k);
        revealTone(ctx, 'sine', 980, 700, t0 + 0.56, 0.2, 0.14*k);
      }
      setTimeout(function(){ try{ ctx.close(); }catch(e){} }, 1600);
    }catch(e){}
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

  /* ===================== DÉROULÉ COMMUN D'UNE QUESTION =====================
     TOUTES les activités passent par ici pour corriger une réponse, afin que
     les règles soient les mêmes partout :
     - une question est « ouverte » tant qu'on peut répondre ;
     - QCM (on touche une réponse) : 1 seule tentative ;
       manipulations (Déformer, Régler l'heure, ateliers) : 3 tentatives ;
     - elle se « ferme » dès que la réponse est juste, ou après la dernière
       tentative ratée. À la fermeture : retour + explication, son, effets,
       mascotte, étoile si c'est juste, série sans faute et historique
       (onPracticeAnswered), et la rangée de boutons (Vérifier / Nouvelle
       activité) disparaît : on touche le retour pour passer à la suite ;
     - « Nouvelle activité » avant tout essai = question passée, sans effet ;
       après un essai raté = erreur (on ne peut pas fuir pour garder sa série).
     opts : { feedback: id ou élément, tries: 1|3 }
     La rangée de boutons masquée est la .btn-row qui suit le retour. */
  var MANIP_TRIES = 3;
  var qfFocusNext = false;   // la question suivante a été demandée depuis le retour, au clavier
  function makeQuestionFlow(opts){
    var fb = typeof opts.feedback==='string' ? document.getElementById(opts.feedback) : opts.feedback;
    var row = fb.parentNode.querySelector('.btn-row');
    function famWrap(){ return fb.closest('[id^="fam-"]') || fb.parentNode; }
    var flow = { tries:0, maxTries:opts.tries || 1, closed:false, fb:fb };
    // Accessibilité : annoncé par les lecteurs d'écran, atteignable au clavier,
    // Entrée/Espace fait la même chose qu'un toucher.
    fb.setAttribute('aria-live','polite');
    fb.tabIndex = 0;
    function goNext(){
      if(!flow.closed) return;
      qfFocusNext = (document.activeElement === fb);
      nextPracticeQuestion();
    }
    fb.addEventListener('click', goNext);
    fb.addEventListener('keydown', function(e){
      if((e.key==='Enter' || e.key===' ') && flow.closed){ e.preventDefault(); goNext(); }
    });
    function show(ok, html, closing){
      fb.className = 'feedback show ' + (ok ? 'good' : 'bad') + (closing ? ' tappable' : '');
      fb.innerHTML = html;
      playSound(ok ? 'good' : 'bad');
      celebrate(ok ? 'good' : 'bad', fb);
      setCoachReaction(ok ? 'good' : 'bad');
    }
    function close(ok, html){
      flow.closed = true;
      // le bouton qu'on vient d'utiliser va disparaître : on garde le focus clavier
      // sur le retour, pour qu'Entrée passe à la question suivante (RGAA 12.8)
      var ae = document.activeElement, hadFocus = !ae || ae === document.body || famWrap().contains(ae);   // (un bouton de réponse désactivé perd le focus : il retombe sur la page)
      if(row) row.hidden = true;
      show(ok, html, true);
      if(hadFocus) fb.focus();
      if(ok) addStar(1);
      onPracticeAnswered(ok);
    }
    // Nouvelle question : tout est remis à zéro.
    flow.start = function(){
      var q = famWrap().querySelector('.coach-bubble');
      if(qfFocusNext && q){ q.tabIndex = -1; q.focus(); }   // on vient du retour (clavier) : on lit la nouvelle question
      qfFocusNext = false;
      flow.tries = 0; flow.closed = false;
      fb.className = 'feedback'; fb.innerHTML = '';
      if(row) row.hidden = false;
    };
    // Efface le retour d'un essai raté dès que l'enfant recommence à manipuler.
    flow.clearHint = function(){
      if(!flow.closed){ fb.className = 'feedback'; fb.innerHTML = ''; }
    };
    // Messages : l'activité fournit le CONTENU, le flux compose la FORME,
    // identique partout :
    //   réussite       ✔ <success>              / <detail> / explication
    //   essai raté     ✘ Pas encore.            / <hint>   / 🔁 Essai n sur 3
    //   échec final    ✘ Ce n'est pas ça.       / <solution> / explication
    // msg = { success, detail, hint, solution, explain } (tout est facultatif
    // sauf success, et solution pour un échec).
    // Renvoie 'solved', 'retry' (encore des essais) ou 'failed' (question fermée).
    function line(cls, txt){ return txt ? '<div' + (cls ? ' class="' + cls + '"' : '') + '>' + txt + '</div>' : ''; }
    flow.answer = function(ok, msg){
      if(flow.closed) return 'closed';
      flow.tries++;
      var explain = line('explain-line', msg.explain);
      if(ok){
        close(true, line('fb-title', '✔ ' + msg.success) + line('', msg.detail) + explain);
        return 'solved';
      }
      if(flow.tries >= flow.maxTries){
        close(false, line('fb-title', '✘ Ce n\'est pas ça.') + line('', msg.solution) + explain);
        return 'failed';
      }
      var left = flow.maxTries - flow.tries;
      show(false, line('fb-title', '✘ Pas encore.') + line('', msg.hint) +
        line('explain-line', '🔁 Essai ' + flow.tries + ' sur ' + flow.maxTries + ' : corrige puis vérifie encore (' +
          left + ' essai' + (left>1 ? 's' : '') + ' restant' + (left>1 ? 's' : '') + ').'), false);
      return 'retry';
    };
    // Bouton « Nouvelle activité ».
    flow.skip = function(){
      if(!flow.closed && flow.tries > 0){ flow.closed = true; onPracticeAnswered(false); }
      nextPracticeQuestion();
    };
    return flow;
  }


  // ---- Outils partagés par tous les thèmes ----
  function pick(arr){ return arr[Math.floor(rnd()*arr.length)]; }
  function rand(a,b){ return a+rnd()*(b-a); }

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
  // ---- Outils de dessin partagés par plusieurs thèmes ----
  // (ils vivent ici pour qu'on puisse retirer un thème sans casser les autres)
  var palette = ['var(--accent2)','var(--accent3)','var(--accent)','var(--accent2)','var(--accent3)'];
  // Liste de points [[x,y],…] → attribut `points` d'un <polygon>.
  function isoPoly(pts){ return pts.map(function(p){return p[0]+','+p[1];}).join(' '); }
  // Sommets d'un polygone régulier (ou d'une ellipse, si rx ≠ ry) à n côtés.
  function ngonPoints(n, cx, cy, rx, ry, rotDeg){
    var pts=[];
    for(var k=0;k<n;k++){
      var ang=(rotDeg + k*360/n) * Math.PI/180;
      pts.push([cx+rx*Math.cos(ang), cy+ry*Math.sin(ang)]);
    }
    return pts;
  }
  // Réponses chiffrées d'une question de Quizz (la bonne + 3 voisines), et question
  // « nombre » complète : partagées par les thèmes Calcul et Nombres.
  function numChoices(correct, extra, suffix){
    var pool = [correct-1, correct+1, correct-2, correct+2, correct+3, correct-3].concat(extra || []);
    pool = pool.filter(function(v){ return v>=0 && v!==correct; });
    return numChoiceSet(correct, pool).map(function(v){ return { label:String(v) + (suffix||''), ok:v===correct }; });
  }
  function bigNumQuestion(tag, question, sub, explain, txt, correct, extra){
    return {
      tag:tag, question:question, sub:sub, explain:explain,
      draw:function(){ drawEquation(txt); },
      cols3:false,
      choices: numChoices(correct, extra)
    };
  }
  // Illustration d'une question de Quizz réduite à un texte (ex. « 3 + 4 = ? »).
  function drawEquation(txt){
    var svg = document.getElementById('m4Svg');
    svg.setAttribute('viewBox','0 0 200 200');
    svg.innerHTML = "";
    svg.appendChild(svgText(100,112,txt.length>11 ? 24 : 34,txt));
  }

  // ---- Registre des types de Quizz ----
  // Chaque thème appelle registerQuizType() pour déclarer ses types de questions :
  //   id            identifiant unique (ex. 'sides')
  //   domain        thème (id de DOMAINS, ex. 'formes')
  //   label         nom court (panneau « Configurer les activités »)
  //   longLabel     nom affiché dans la liste du mode Manuel (sous son thème)
  //   defaultLevels niveaux où le type apparaît par défaut : 0 Facile, 1 Moyen, 2 Difficile
  //   randomNote    ce qui est tiré au hasard, pour le panneau de configuration
  //   generate(level)  renvoie la question :
  //     { tag, question, sub, explain, draw:function(){…}, cols3:bool, choices:[{label, ok}] }
  var QCM_TYPE_DEFS = [];
  // THÈMES (domaines) : UN seul découpage pour tout le jeu. Il sert au mode Manuel (thème puis
  // activité), au panneau « Activités & difficulté », à la Progression (radar de 9 compétences)
  // et au ciblage des sujets faibles. Chaque activité y est rangée : une famille d'écran par son
  // champ `domain` (registerFamily), un type de Quizz par son champ `domain` (registerQuizType).
  // Un domaine inconnu tombe dans le dernier (« Logique & énigmes »).
  var DOMAINS = [
    { id:'formes',   icon:'🔷', label:'Formes & angles',     short:'Formes' },
    { id:'symetrie', icon:'🦋', label:'Symétrie',            short:'Symétrie' },
    { id:'repere',   icon:'🧭', label:'Repérage',            short:'Repérage' },
    { id:'solides',  icon:'🧊', label:'Solides & patrons',   short:'Solides' },
    { id:'temps',    icon:'🕒', label:'Heure & calendrier',  short:'Heure' },
    { id:'mesures',  icon:'📏', label:'Mesures',             short:'Mesures' },
    { id:'nombres',  icon:'🔢', label:'Nombres & fractions', short:'Nombres' },
    { id:'calcul',   icon:'➕', label:'Calcul & problèmes',  short:'Calcul' },
    { id:'logique',  icon:'🧩', label:'Logique & énigmes',   short:'Logique' }
  ];
  /* ---- Écran d'accueil : symboles de maths qui flottent en fond + pastilles « au programme » (les 9 thèmes) ---- */
  (function buildSplashDecor(){
    var bg = document.getElementById('splash-bg'), ul = document.getElementById('splash-topics');
    if(bg){
      var SYMS = ['+','−','×','÷','=','π','½','7','3','▲','●','■','∞','%','12','100','★','9'];
      var COLS = ['#FF8FC1','#7C5CFF','#3DB887','#F2A900','#4DA3FF'];
      for(var i=0;i<22;i++){
        var s = document.createElement('span');
        s.textContent = SYMS[i % SYMS.length];
        s.style.left = Math.round(2 + (i*47 % 96)) + '%';
        s.style.setProperty('--sz', (20 + (i*13 % 28)) + 'px');
        s.style.setProperty('--dur', (11 + (i*7 % 9)) + 's');
        s.style.setProperty('--dl', (-(i*1.9)).toFixed(1) + 's');
        s.style.setProperty('--dx', ((i%2 ? 1 : -1) * (14 + i*3 % 30)) + 'px');
        s.style.color = COLS[i % COLS.length];
        bg.appendChild(s);
      }
    }
    if(ul){
      DOMAINS.forEach(function(d, k){
        var li = document.createElement('li');
        li.style.setProperty('--k', k);
        li.innerHTML = '<span aria-hidden="true"></span><b></b>';
        li.firstChild.textContent = d.icon; li.lastChild.textContent = d.short;
        ul.appendChild(li);
      });
    }
  })();
  function domainOrFallback(id){
    for(var i=0;i<DOMAINS.length;i++){ if(DOMAINS[i].id===id) return id; }
    return DOMAINS[DOMAINS.length-1].id;
  }
  function quizDomainId(def){ return domainOrFallback(def.domain); }
  function registerQuizType(def){ QCM_TYPE_DEFS.push(def); }
  /* ===================== REGISTRE DES ACTIVITÉS (familles) =====================
     TOUTES les activités (Mesurer, Déformer, Patron, Quizz, Horloge, ateliers…)
     sont déclarées par leur thème avec registerFamily ; l'orchestrateur ne
     connaît aucune activité par son nom. Retirer un thème du manifeste retire
     simplement ses activités. Contrat d'une famille :
       key        identifiant unique (conteneur d'écran : #fam-<key>)
       tag        nom affiché
       domain     thème (id de DOMAINS : 'formes', 'mesures', 'temps'…) ; le Quizz n'en a pas : chacun de ses types a le sien
       order      rang d'affichage et de tirage (les plus petits d'abord)
       weight     nombre de places dans le tirage aléatoire (1 par défaut ; 3 pour le Quizz)
       timed      true : proposée aussi en mode Chronométré (réponse en un toucher)
       note       texte du panneau « Activités & difficulté » (si pas de `config`)
       config     facultatif : réglage des niveaux épreuve par épreuve
                  { storageKey, defs(), groups()?, rebuild(overrides) } (voir orchestrateur)
       markup     HTML de l'écran (mis dans le conteneur dès l'enregistrement)
       build      facultatif : construit l'écran en JS dans le conteneur `wrap`
       generate   prépare une nouvelle question pour le niveau donné
       signature  empreinte de la question courante (évite les répétitions dans une série)
     Le conteneur existe dès le retour de registerFamily : le thème peut ensuite
     brancher ses boutons par leur id. */
  var FAMILIES = [];
  // Une activité peut se limiter à certains niveaux (def.levels, ex. [0] = Facile seulement).
  function familyAvailable(f, level){ return !f.levels || f.levels.indexOf(level) !== -1; }
  function registerFamily(def){
    var wrap = document.createElement('div');
    wrap.id = 'fam-' + def.key;
    wrap.hidden = true;
    if(def.markup) wrap.innerHTML = def.markup;
    document.getElementById('practice-exercise').appendChild(wrap);
    FAMILIES.push(def);
    if(def.build) def.build(wrap);
    // RÈGLE DE MISE EN PAGE commune à toutes les activités : la zone de réponse
    // (réponses à choisir, retour, boutons Vérifier / Nouvelle activité) est
    // regroupée en bas de l'écran, dans cet ordre, quelle que soit l'activité.
    // Le haut (question, consigne, illustration) prend la place restante : d'une
    // question à l'autre, les boutons et les réponses restent au même endroit.
    var bottom = document.createElement('div');
    bottom.className = 'q-bottom';
    [].slice.call(wrap.children).filter(function(c){
      return c.matches('.choices, .qcm-choices, .feedback, .btn-row');
    }).forEach(function(c){ bottom.appendChild(c); });
    // Le haut (question, consigne, illustration) est regroupé dans .q-top : en portrait il est « transparent »
    // (display:contents), en paysage sur téléphone c'est la colonne de gauche, les réponses (.q-bottom) sont à droite.
    var top = document.createElement('div');
    top.className = 'q-top';
    while(wrap.firstChild) top.appendChild(wrap.firstChild);
    wrap.appendChild(top);
    wrap.appendChild(bottom);
    // Dans la rangée de boutons : « Nouvelle activité » toujours à gauche,
    // « Vérifier » à sa droite. On change l'ordre dans la page elle-même (pas
    // seulement à l'affichage) pour que le clavier suive le même ordre (RGAA 12.8).
    var row = bottom.querySelector('.btn-row');
    if(row){
      var next = [].slice.call(row.children).filter(function(b){ return /-(next|new)$/.test(b.id); })[0];
      if(next) row.insertBefore(next, row.firstChild);
    }
    return wrap;
  }
  // Empreinte d'une question à choix (Quizz, Lire l'heure) pour l'anti-répétition.
  function quizSignature(q){
    return q.tag + '|' + q.question + '|' + q.explain + '|' + q.choices.map(function(c){ return c.label; }).sort().join('/');
  }
  // Niveaux où apparaît une épreuve réglable (Quizz, patron…) : réglage manuel
  // enregistré s'il existe, sinon ses niveaux par défaut.
  function effectiveLevels(def, overrides){
    var lv = overrides && overrides[def.id];
    return (lv && lv.length) ? lv : def.defaultLevels;
  }
  function quizTypeById(id){
    for(var i=0;i<QCM_TYPE_DEFS.length;i++){ if(QCM_TYPE_DEFS[i].id===id) return QCM_TYPE_DEFS[i]; }
    return null;
  }
