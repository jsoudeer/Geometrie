  /* ===================== GUIDES (tutoriels en surbrillance) =====================
     Un guide = une suite d'étapes ; chaque étape éclaire un VRAI élément de l'écran
     (voile sombre + trou) et l'explique dans une bulle. Comme on s'appuie sur les
     éléments réels, les explications restent justes quand l'interface change
     (aucune capture d'écran à refaire).
       accueil  : au premier lancement (boutons, niveaux, série, étoiles, bataille, réglages) ;
       boutique : dès 25 étoiles (le prix d'un personnage) quand on n'a jamais rien acheté ;
       bataille : la première fois qu'on ouvre la Bataille ;
       serie    : à la première série de 10 bonnes réponses d'affilée.
     Chaque guide se rejoue depuis ⚙️ Réglages → 📖 Guides. L'état « déjà vu » est
     dans localStorage (geo_guides) ; geo_bought mémorise le premier achat. */
  var GUIDE_SHOP_STARS = BUY_COST;   // seuil d'étoiles du guide Boutique (= le prix d'un personnage)
  var GUIDE_SERIE_START = 10;      // série sans faute qui lance le guide Série
    var guideSeen = {};
  try{ guideSeen = JSON.parse(localStorage.getItem('geo_guides') || '{}') || {}; }catch(e){}
  function guideSave(){ try{ localStorage.setItem('geo_guides', JSON.stringify(guideSeen)); }catch(e){} }
  function guideBought(){ try{ return localStorage.getItem('geo_bought') === '1'; }catch(e){ return false; } }
  function guideMarkBought(){ try{ localStorage.setItem('geo_bought', '1'); }catch(e){} }
  // « Effacer ma progression » : nouvelle partie, les guides contextuels pourront revenir (pas l'accueil).
  function guideResetContextual(){
    delete guideSeen.boutique; delete guideSeen.bataille; delete guideSeen.serie; guideSave();
    try{ localStorage.removeItem('geo_bought'); }catch(e){}
  }

  function guideVisible(e){
    if(!e) return false;
    var r = e.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && !e.closest('[hidden]');
  }
  // La mascotte du clan actif accompagne chaque bulle (son dessin, ou l'emoji du thème à défaut).
  function guideDrawMascot(box){
    var id = activeMascotId(), sprite = id ? findAnySprite(id) : null;
    box.innerHTML = '';
    if(sprite) renderSpriteVisual(box, sprite);
    else box.textContent = THEMES[currentThemeKey()].mascot;
  }

  var GUIDES = {
    accueil: {
      title:'Découvrir le jeu',
      steps:[
        { text:'Bienvenue ! Je te montre en une minute à quoi servent les boutons. Tu pourras revoir ce guide quand tu veux dans les réglages ⚙️.' },
        { sel:'#menu-btn', text:'Touche ton personnage, en haut à gauche, pour ouvrir le menu : choisis ton niveau (Facile, Moyen ou Difficile), ou le mode Manuel pour choisir toi-même l\'activité.' },
        { sel:'#practice-mode', text:'Aléatoire : les activités changent toutes seules. Révision : le jeu te repose surtout les exercices ratés ou pas encore faits. Chronométré : tu réponds à un maximum de questions avant la fin du temps.' },
        { sel:'#streak-pill', text:'La série : réponds juste 20 fois de suite, sans te tromper, pour débloquer un nouveau personnage ! Et si tu continues jusqu\'à 25 puis 30, d\'autres personnages t\'attendent.' },
        { sel:'#stars-btn', text:'Chaque bonne réponse te donne des étoiles ⭐. Touche ce bouton pour ouvrir la boutique et acheter de nouveaux personnages.' },
        { sel:'#battle-btn', text:'La Bataille : fais combattre tes personnages contre l\'autre clan.' },
        { sel:'#settings-btn', text:'Les réglages : sons, thème, progression de l\'enfant… et le bouton « Guides » pour revoir ces explications.' },
        { text:'À toi de jouer ! Réponds aux questions pour gagner des étoiles.' }
      ]
    },
    boutique: {
      title:'Acheter un personnage',
      steps:[
        { sel:'#stars-btn', enter:function(){ showTab(lastPracticeTab); },
          text:'Les étoiles ⭐ que tu gagnes servent à acheter de nouveaux personnages. Je t\'emmène à la boutique.' },
        { sel:'#shop-grid .sprite-card, #shop-grid > *', enter:function(){ showTab('shop'); },
          text:'Voici les personnages. Un seul est offert, chacun des autres coûte 25 étoiles. Quand tu en as assez, touche « Acheter » : le personnage est à toi ! Les rares et les personnages « Défi » ont une compétence pour la Bataille ; les communs la gagnent en évoluant jusqu\'au niveau Ultime.' },
        { sel:'#shop-grid .sp-buy:not(:disabled)',
          text:'Ce bouton « Acheter » est actif : tu peux t\'offrir ce personnage. Les personnages « Défi » 🔒, eux, ne s\'achètent pas : ils se gagnent en relevant un défi (série sans faute ou course contre la montre).' },
        { sel:'#shop-mascot-panel',
          text:'Ta mascotte t\'accompagne et réagit à tes réponses. Pour en changer, ouvre un personnage que tu possèdes et touche « Devenir mascotte ».' }
      ]
    },
    serie: {
      title:'Série sans faute',
      steps:[
        { sel:'#streak-pill', enter:function(){ showTab(lastPracticeTab); },
          text:'10 bonnes réponses d\'affilée, bravo ! C\'est ta série sans faute : une seule erreur et elle repart à zéro.' },
        { sel:'#streak-pill',
          text:'À 20, tu débloques le personnage du défi Facile. Continue sans faute : à 25 tu gagnes celui du Moyen, à 30 celui du Difficile ! Peu importe le niveau où tu joues.' },
        { sel:'#streak-pill',
          text:'Juste avant chaque palier, je te pose les 3 dernières questions dans les sujets où tu as le plus besoin de t\'entraîner. Et en mode Overload, la chaleur monte à 15, 20 et 25 !' }
      ]
    },
    bataille: {
      title:'Combattre',
      steps:[
        { sel:'#tab-battle .panel-head', enter:function(){ showTab('battle'); },
          text:'Bienvenue dans la Bataille ! Tes personnages combattent ceux de l\'autre clan. Chacun a des points ❤️, à la fois sa force et son énergie.' },
        { sel:'#bt-grid-classic',
          text:'Compose ton équipe : jusqu\'à 3 classiques, 1 soutien 💖 et 1 archer 🏹. Tu n\'es pas obligé d\'avoir un soutien ou un archer, mais ils aident beaucoup : à toi de choisir ! Une petite icône à côté des points indique la compétence du personnage : en combat, une bonne réponse à sa question de maths double les dégâts.' },
        { sel:'.bt-auto-row',
          text:'Pas envie de choisir ? « Équipe complète » prend les plus forts, « Au hasard » tire au sort.' },
        { sel:'#bt-diff-row', text:'Choisis la difficulté : une équipe adverse plus faible, égale ou plus forte que la tienne.' },
        { sel:'#bt-start',
          text:'Quand tu es prêt, lance le combat. Touche une de tes cartes pour attaquer, puis la carte à viser : chaque carte perd autant de points que l\'autre en avait. L\'archer, lui, ne perd rien ; le soutien donne des points à ses alliés.' }
      ]
    }
  };

  // ---- Moteur ----
  var guideState = null;   // { id, i, steps }
  var guideEls = null;
  function guideBuild(){
    if(guideEls) return guideEls;
    var layer = document.createElement('div'); layer.className = 'guide-layer'; layer.hidden = true;
    layer.innerHTML =
      '<div class="guide-spot none" id="guide-spot"></div>' +
      '<div class="guide-bubble" id="guide-bubble" role="dialog" aria-modal="true">' +
      '<div class="guide-head"><div class="guide-mascot" id="guide-mascot" aria-hidden="true"></div>' +
      '<div><div class="guide-step" id="guide-step"></div><h2 id="guide-title"></h2></div></div>' +
      '<p id="guide-text" aria-live="polite"></p>' +
      '<div class="guide-actions"><button class="btn ghost" id="guide-skip" type="button">Passer</button>' +
      '<button class="btn ghost" id="guide-prev" type="button">◀ Retour</button>' +
      '<button class="btn primary" id="guide-next" type="button">Suivant ➜</button></div></div>';
    document.body.appendChild(layer);
    guideEls = { layer:layer, spot:layer.querySelector('#guide-spot'), bubble:layer.querySelector('#guide-bubble'),
      step:layer.querySelector('#guide-step'), mascot:layer.querySelector('#guide-mascot'), title:layer.querySelector('#guide-title'), text:layer.querySelector('#guide-text'),
      skip:layer.querySelector('#guide-skip'), prev:layer.querySelector('#guide-prev'), next:layer.querySelector('#guide-next') };
    guideEls.next.addEventListener('click', function(){ guideGo(1); });
    guideEls.prev.addEventListener('click', function(){ guideGo(-1); });
    guideEls.skip.addEventListener('click', function(){ guideEnd(true); });
    layer.addEventListener('keydown', function(e){
      if(e.key === 'Escape'){ e.preventDefault(); guideEnd(true); return; }
      if(e.key === 'Tab'){   // le focus reste dans la bulle
        var btns = [guideEls.skip, guideEls.prev, guideEls.next].filter(function(b){ return !b.hidden; });
        var first = btns[0], last = btns[btns.length-1];
        if(e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
        else if(!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
      }
    });
    window.addEventListener('resize', function(){ if(guideState) guidePlace(); });
    window.addEventListener('scroll', function(){ if(guideState) guidePlace(); }, true);
    return guideEls;
  }
  function guideTarget(step){
    if(!step.sel) return null;
    var list = step.sel.split(',');
    for(var i=0;i<list.length;i++){
      var e = document.querySelector(list[i].trim());
      if(guideVisible(e)) return e;
    }
    return null;
  }
  function guideStart(id){
    if(!GUIDES[id]) return;
    if(guideState) guideEnd(false);
    ['settings-overlay','guides-overlay','progress-overlay','info-overlay','activity-config-overlay'].forEach(function(o){ var e = document.getElementById(o); if(e) e.hidden = true; });
    var reveal = document.getElementById('reveal-overlay'); if(reveal) reveal.remove();
    guideBuild();
    guideState = { id:id, i:-1, steps:GUIDES[id].steps, dir:1 };
    guideEls.layer.hidden = false;
    guideGo(1);
  }
  // Va à l'étape suivante (dir=1) ou précédente (dir=-1) qui a un élément visible (ou pas d'élément : étape centrée).
  function guideGo(dir){
    var s = guideState; if(!s) return;
    var i = s.i + dir;
    while(i >= 0 && i < s.steps.length){
      var st = s.steps[i];
      if(st.enter) st.enter();
      if(!st.sel || guideTarget(st)) break;
      i += dir;                      // élément absent : on saute l'étape
    }
    if(i >= s.steps.length){ guideEnd(false); return; }
    if(i < 0) i = 0;
    s.i = i; s.dir = dir;
    var step = s.steps[i], e = guideEls;
    e.step.textContent = (i+1) + ' / ' + s.steps.length + ' · ' + GUIDES[s.id].title;
    guideDrawMascot(e.mascot);
    e.title.textContent = step.sel ? '' : (i===0 ? 'Bienvenue !' : 'Prêt ?');
    e.title.hidden = !!step.sel;
    e.bubble.setAttribute('aria-label', 'Guide : ' + GUIDES[s.id].title);
    e.text.textContent = step.text;
    e.prev.hidden = i === 0;
    e.next.textContent = (i === s.steps.length-1) ? 'Terminé ✔' : 'Suivant ➜';
    var t = guideTarget(step);
    if(t && t.scrollIntoView) t.scrollIntoView({ block:'center', inline:'nearest' });
    guidePlace();
    e.next.focus();
  }
  function guidePlace(){
    var s = guideState; if(!s) return;
    var e = guideEls, step = s.steps[s.i], t = guideTarget(step);
    var vw = window.innerWidth, vh = window.innerHeight, pad = 6;
    if(t){
      var r = t.getBoundingClientRect();
      e.spot.classList.remove('none');
      e.spot.style.left = (r.left - pad) + 'px'; e.spot.style.top = (r.top - pad) + 'px';
      e.spot.style.width = (r.width + 2*pad) + 'px'; e.spot.style.height = (r.height + 2*pad) + 'px';
      var bh = e.bubble.offsetHeight, bw = e.bubble.offsetWidth;
      var below = r.bottom + pad + 12, top;
      if(below + bh <= vh - 8) top = below;                     // sous l'élément
      else if(r.top - pad - 12 - bh >= 8) top = r.top - pad - 12 - bh;   // au-dessus
      else top = Math.max(8, vh - bh - 8);                      // en bas de l'écran
      e.bubble.style.top = top + 'px';
      e.bubble.style.left = Math.max(12, Math.min(vw - bw - 12, r.left + r.width/2 - bw/2)) + 'px';
    } else {
      e.spot.classList.add('none');
      e.bubble.style.left = Math.max(12, (vw - e.bubble.offsetWidth)/2) + 'px';
      e.bubble.style.top = Math.max(8, (vh - e.bubble.offsetHeight)/2) + 'px';
    }
  }
  function guideEnd(skipped){
    var s = guideState; if(!s) return;
    guideSeen[s.id] = 1; guideSave();
    guideState = null;
    guideEls.layer.hidden = true;
    var b = document.getElementById('settings-btn'); if(b && skipped) b.focus();
  }

  // ---- Déclenchement automatique (vérifié toutes les 1,5 s, sans jamais interrompre quelqu'un) ----
  function guideCanInterrupt(){
    if(guideState) return false;
    var splash = document.getElementById('splash-overlay');
    if(splash && !splash.hidden) return false;
    if(document.getElementById('reveal-overlay')) return false;
    if(typeof countdownRunning !== 'undefined' && countdownRunning) return false;   // jamais en plein défi chronométré
    var blocked = ['settings-overlay','guides-overlay','progress-overlay','info-overlay','activity-config-overlay'].some(function(id){ var e = document.getElementById(id); return e && !e.hidden; });
    if(blocked) return false;
    return !document.getElementById('tab-practice').hidden || !document.getElementById('tab-battle').hidden;
  }
  function guideTick(){
    if(!guideCanInterrupt()) return;
    var inBattle = !document.getElementById('tab-battle').hidden;
    if(!guideSeen.accueil && !inBattle){ guideStart('accueil'); return; }
    if(inBattle){ if(!guideSeen.bataille) guideStart('bataille'); return; }   // première entrée dans la Bataille
    if(!guideSeen.serie && appMode==='auto' && practiceMode==='free' && freeStreak >= GUIDE_SERIE_START){ guideStart('serie'); return; }
    if(!guideSeen.boutique && !guideBought() && stars >= GUIDE_SHOP_STARS){ guideStart('boutique'); return; }
  }
  setInterval(guideTick, 1500);
  document.getElementById('battle-btn').addEventListener('click', function(){ setTimeout(guideTick, 350); });

  // ---- Réglages → Guides : rejouer chacun ----
  document.getElementById('open-guides-btn').addEventListener('click', function(){
    document.getElementById('settings-overlay').hidden = true;
    document.getElementById('guides-overlay').hidden = false;
  });
  document.getElementById('guides-close').addEventListener('click', function(){ document.getElementById('guides-overlay').hidden = true; });
  document.getElementById('guides-overlay').addEventListener('click', function(e){
    if(e.target.id === 'guides-overlay') document.getElementById('guides-overlay').hidden = true;
  });
  document.querySelectorAll('[data-guide]').forEach(function(b){
    b.addEventListener('click', function(){
      var id = b.getAttribute('data-guide');
      document.getElementById('guides-overlay').hidden = true;
      if(id === 'accueil') showTab(lastPracticeTab);
      guideStart(id);
    });
  });
