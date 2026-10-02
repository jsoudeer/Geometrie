  /* ===================== HISTORIQUE DE PROGRESSION =====================
     Chaque réponse (bonne ou mauvaise) est enregistrée sur l'appareil
     (localStorage 'geo_history') : date, compétence, activité, niveau, résultat.
     Ils servent à :
       1) montrer les résultats de l'enfant dans les Réglages (📈 Progression) :
          un radar de synthèse, un détail par compétence, l'activité des derniers jours ;
       2) orienter les séries sans faute (paliers 20, 25, 30) : les 3 dernières
          questions sont posées dans les sujets les plus faibles (progWeakPick).
     Les 9 compétences sont les thèmes (DOMAINS, noyau.js) : chaque famille et chaque type de quiz
     y est rangé par son champ `domain`, rien à déclarer ici pour une nouvelle activité. */
  var PROG_MAX_EVENTS = 3000;    // on garde les 3000 dernières réponses
  var PROG_RECENT = 40;          // « niveau récent » d'une compétence = ses 40 dernières réponses
  var PROG_MIN_RECENT = 5;       // en dessous, pas assez de données pour juger
  var PROG_WEAK_BELOW = 0.9;     // une compétence sous 90 % est « à travailler »

  // événement : [horodatage ms, indice de compétence, famille, type de quiz, niveau 0-2, réussi 0/1]
  var progEvents = [];
  (function progLoad(){
    try{
      var raw = JSON.parse(localStorage.getItem('geo_history') || '[]');
      if(Array.isArray(raw)) progEvents = raw.filter(function(e){ return Array.isArray(e) && e.length >= 6; });
    }catch(e){ progEvents = []; }
  })();
  var progSaveTimer = null;
  function progSave(){
    try{ localStorage.setItem('geo_history', JSON.stringify(progEvents)); }catch(e){}
  }
  function progSaveSoon(){
    clearTimeout(progSaveTimer);
    progSaveTimer = setTimeout(progSave, 400);
  }
  window.addEventListener('pagehide', progSave);

  function progSkillIndex(family, domain){
    var d = domainOrFallback(family==='qcm' ? domain : (familyDef(family) || {}).domain);
    for(var i=0;i<DOMAINS.length;i++){ if(DOMAINS[i].id===d) return i; }
    return DOMAINS.length - 1;
  }
  // Appelé à chaque réponse (voir onPracticeAnswered).
  function progRecord(correct){
    if(!progEvents) return;
    var fam = currentFamily, isQcm = (fam==='qcm' && m4Current);
    progEvents.push([
      Date.now(), progSkillIndex(fam, isQcm ? m4Current.domain : null), fam,
      isQcm ? (m4Current.typeId || '') : '', globalLevel, correct ? 1 : 0
    ]);
    if(progEvents.length > PROG_MAX_EVENTS) progEvents.splice(0, progEvents.length - PROG_MAX_EVENTS);
    progSaveSoon();
  }

  /* ---- Statistiques ---- */
  function progRate(list){
    if(!list.length) return null;
    var ok = 0; list.forEach(function(e){ ok += e[5]; });
    return ok / list.length;
  }
  function progSkillEvents(i){ return progEvents.filter(function(e){ return e[1]===i; }); }
  // Par compétence : niveau récent, niveau global, tendance.
  function progSkillStats(){
    return DOMAINS.map(function(sk, i){
      var all = progSkillEvents(i), recent = all.slice(-PROG_RECENT);
      var prev = all.slice(-2*20, -20), last20 = all.slice(-20);
      var trend = 0;
      if(prev.length >= 10 && last20.length >= 10){
        var d = progRate(last20) - progRate(prev);
        trend = d > 0.08 ? 1 : (d < -0.08 ? -1 : 0);
      }
      var byLevel = [0,1,2].map(function(lv){ var l = all.filter(function(e){ return e[4]===lv; }); return { n:l.length, rate:progRate(l) }; });
      return { skill:sk, index:i, n:all.length, rateAll:progRate(all), nRecent:recent.length,
               rateRecent: recent.length >= PROG_MIN_RECENT ? progRate(recent) : null, trend:trend, byLevel:byLevel };
    });
  }

  /* ---- Défi des 20 : sujets à travailler ----
     Renvoie { key, domain } (famille à poser, et thème du quiz si key==='qcm') ou null s'il
     n'y a pas assez de données. On prend l'une des 3 compétences les plus faibles (en
     tournant pour ne pas poser 3 fois le même sujet), puis, dans cette compétence,
     l'activité la moins réussie disponible au niveau en cours. */
  function progWeakPick(){
    if(!progEvents || progEvents.length < 20) return null;
    var stats = progSkillStats().filter(function(st){ return st.rateRecent !== null && st.rateRecent < PROG_WEAK_BELOW; });
    if(!stats.length) return null;
    stats.sort(function(a,b){ return (a.rateRecent - b.rateRecent) || (Math.random() - .5); });
    var weak = stats.slice(0, 3);
    var st = pickFresh('weakskill|' + weak.map(function(w){ return w.skill.id; }).join(','), weak);
    // activités disponibles pour cette compétence au niveau courant
    var dom = st.skill.id, options = [];
    FAMILIES.forEach(function(f){ if(f.key!=='qcm' && domainOrFallback(f.domain)===dom) options.push({ key:f.key, domain:null }); });
    if(M4_LEVELS[globalLevel].types.some(function(t){ var d = quizTypeById(t); return d && quizDomainId(d)===dom; })) options.push({ key:'qcm', domain:dom });
    if(!options.length) return null;
    // la moins réussie récemment (les activités sans donnée passent après)
    var all = progSkillEvents(st.index);
    function optionRate(o){
      var l = all.filter(function(e){ return o.key==='qcm' ? (e[2]==='qcm' && eventDomain(e)===o.domain) : e[2]===o.key; }).slice(-20);
      return l.length ? progRate(l) : 0.5;
    }
    options.sort(function(a,b){ return (optionRate(a) - optionRate(b)) || (Math.random() - .5); });
    return { key:options[0].key, domain:options[0].domain };
  }
  /* ---- Mode Révision : mettre en avant les exercices ratés et ceux jamais faits ----
     Une « unité » = une activité au niveau en cours (une famille, ou un type de quiz précis).
     Poids de tirage : jamais faite à ce niveau = 3 ; sinon 0,25 + 4 × (part d'erreurs sur ses
     10 dernières réponses), +1 si la toute dernière réponse était fausse. Une activité
     toujours réussie reste possible (poids faible), pour ne pas tourner en rond.
     Renvoie { key, type (quiz seulement), why : 'raté' | 'nouveau' | '' }. Jamais deux fois de suite
     la même famille quand il y a le choix. */
  var REVIEW_RECENT = 10, REVIEW_NEW_WEIGHT = 3;
  var reviewLast = null;
  function progReviewUnits(){
    var units = [];
    FAMILIES.forEach(function(f){
      if(f.key==='qcm') M4_LEVELS[globalLevel].types.forEach(function(t){ units.push({ key:'qcm', type:t, id:'qcm|' + t }); });
      else units.push({ key:f.key, type:null, id:f.key });
    });
    return units;
  }
  function progReviewWeight(u){
    var ev = (progEvents || []).filter(function(e){
      return e[4]===globalLevel && (u.type ? (e[2]==='qcm' && e[3]===u.type) : e[2]===u.key);
    });
    if(!ev.length) return { w:REVIEW_NEW_WEIGHT, why:'nouveau' };
    var last = ev.slice(-REVIEW_RECENT), errs = last.filter(function(e){ return !e[5]; }).length;
    var w = 0.25 + 4 * errs / last.length + (last[last.length-1][5] ? 0 : 1);
    return { w:w, why: errs ? 'raté' : '' };
  }
  function weightedPick(list){
    var total = list.reduce(function(s,u){ return s + u.w; }, 0), x = Math.random() * total;
    for(var i=0;i<list.length;i++){ x -= list[i].w; if(x <= 0) return list[i]; }
    return list[list.length-1];
  }
  // Deux étages : d'abord la famille (le quiz pèse la moyenne de ses types × 1,5 : il en contient
  // une vingtaine, il ne doit pas écraser le reste), puis, pour le quiz, le type précis.
  function progReviewPick(){
    var units = progReviewUnits().map(function(u){ var r = progReviewWeight(u); u.w = r.w; u.why = r.why; return u; });
    var fams = [], byKey = {};
    units.forEach(function(u){
      var f = byKey[u.key];
      if(!f){ f = byKey[u.key] = { key:u.key, units:[], w:0, why:'' }; fams.push(f); }
      f.units.push(u);
    });
    fams.forEach(function(f){
      f.w = f.units.reduce(function(s,u){ return s + u.w; }, 0) / f.units.length * (f.key==='qcm' ? 1.5 : 1);
      f.why = f.units.some(function(u){ return u.why==='raté'; }) ? 'raté' : (f.units.every(function(u){ return u.why==='nouveau'; }) ? 'nouveau' : '');
    });
    var pool = fams.filter(function(f){ return f.key !== reviewLast; });
    if(!pool.length) pool = fams;
    var fam = weightedPick(pool);
    reviewLast = fam.key;
    var u = weightedPick(fam.units);
    return { key:u.key, type:u.type, why:u.why };
  }
  // thème de quiz d'un événement, retrouvée à partir de son type
  function eventDomain(e){ var d = e[3] ? quizTypeById(e[3]) : null; return d ? quizDomainId(d) : null; }

  /* ---- Écran « Progression » (Réglages) ---- */
  var progTab = 0;                 // 0 synthèse · 1 détail · 2 activité
  function progPct(r){ return r===null ? '—' : Math.round(r*100) + ' %'; }
  function progMk(tag, cls, text){ var e = document.createElement(tag); if(cls) e.className = cls; if(text!==undefined) e.textContent = text; return e; }

  function progRadar(stats){
    var N = stats.length, cx = 150, cy = 150, R = 100;
    var svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', '-55 0 410 310'); svg.setAttribute('class', 'prog-radar'); svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', 'Radar des compétences : ' + stats.map(function(st){
      return st.skill.label + ' ' + (st.rateRecent===null ? 'pas assez de données' : progPct(st.rateRecent));
    }).join(', '));
    function pt(i, r){ var a = -Math.PI/2 + i*2*Math.PI/N; return [cx + r*Math.cos(a), cy + r*Math.sin(a)]; }
    function poly(vals, attrs){
      var pts = vals.map(function(v,i){ var p = pt(i, R*v); return p[0].toFixed(1)+','+p[1].toFixed(1); }).join(' ');
      svg.appendChild(el('polygon', Object.assign({ points:pts }, attrs)));
    }
    [0.25,0.5,0.75,1].forEach(function(k){
      var pts = []; for(var i=0;i<N;i++){ var p = pt(i, R*k); pts.push(p[0].toFixed(1)+','+p[1].toFixed(1)); }
      svg.appendChild(el('polygon', { points:pts.join(' '), fill:'none', stroke:'var(--border)', 'stroke-width':k===1?1.6:1 }));
    });
    for(var i=0;i<N;i++){ var p = pt(i, R); svg.appendChild(el('line', { x1:cx, y1:cy, x2:p[0], y2:p[1], stroke:'var(--border)', 'stroke-width':1 })); }
    // depuis le début (pointillés) puis niveau récent (rempli)
    poly(stats.map(function(st){ return st.rateAll===null ? 0 : st.rateAll; }), { fill:'none', stroke:'var(--text-soft)', 'stroke-width':1.6, 'stroke-dasharray':'4 3' });
    poly(stats.map(function(st){ return st.rateRecent===null ? 0 : st.rateRecent; }), { fill:'var(--accent)', 'fill-opacity':.28, stroke:'var(--accent)', 'stroke-width':2.4, 'stroke-linejoin':'round' });
    stats.forEach(function(st,i){
      if(st.rateRecent!==null){ var q = pt(i, R*st.rateRecent); svg.appendChild(el('circle', { cx:q[0], cy:q[1], r:3.8, fill:st.rateRecent<PROG_WEAK_BELOW ? 'var(--bad)' : 'var(--good)', stroke:'var(--surface)', 'stroke-width':1.2 })); }
      var lp = pt(i, R + 26), anchor = Math.abs(lp[0]-cx) < 8 ? 'middle' : (lp[0] > cx ? 'start' : 'end');
      var t = el('text', { x:lp[0], y:lp[1], 'text-anchor':anchor, 'font-size':11.5, 'font-weight':800, fill:'var(--text)', 'font-family':'inherit' });
      t.textContent = st.skill.icon + ' ' + st.skill.short;
      svg.appendChild(t);
      var t2 = el('text', { x:lp[0], y:lp[1] + 13, 'text-anchor':anchor, 'font-size':10.5, fill:st.rateRecent===null ? 'var(--text-soft)' : (st.rateRecent<PROG_WEAK_BELOW ? 'var(--bad)' : 'var(--good)'), 'font-weight':800, 'font-family':'inherit' });
      t2.textContent = st.rateRecent===null ? '?' : progPct(st.rateRecent);
      svg.appendChild(t2);
    });
    return svg;
  }

  function progRenderSynthese(body, stats){
    var total = progEvents.length, good = 0; progEvents.forEach(function(e){ good += e[5]; });
    var week = progEvents.filter(function(e){ return e[0] > Date.now() - 7*86400000; });
    var p = progMk('p', 'prog-summary');
    p.innerHTML = '<strong>' + total + '</strong> réponse' + (total>1?'s':'') + ' enregistrée' + (total>1?'s':'') + ' · réussite <strong>' + (total ? Math.round(100*good/total) : 0) + ' %</strong> · cette semaine : <strong>' + week.length + '</strong>';
    body.appendChild(p);
    if(!total){ body.appendChild(progMk('p', 'muted', 'Pas encore de résultats : ils apparaissent ici dès les premières réponses.')); return; }
    body.appendChild(progRadar(stats));
    var legend = progMk('p', 'muted prog-legend');
    legend.innerHTML = '<span class="prog-key recent"></span> niveau récent (40 dernières réponses) &nbsp; <span class="prog-key all"></span> depuis le début';
    body.appendChild(legend);
    var known = stats.filter(function(st){ return st.rateRecent!==null; }).sort(function(a,b){ return b.rateRecent - a.rateRecent; });
    if(known.length >= 2){
      var best = known.slice(0, 2), worst = known.slice(-2).reverse().filter(function(st){ return st.rateRecent < PROG_WEAK_BELOW; });
      var ul = progMk('ul', 'prog-points');
      ul.appendChild(progMk('li', '', '💪 Points forts : ' + best.map(function(st){ return st.skill.icon + ' ' + st.skill.short + ' (' + progPct(st.rateRecent) + ')'; }).join(', ')));
      if(worst.length) ul.appendChild(progMk('li', '', '🎯 À travailler : ' + worst.map(function(st){ return st.skill.icon + ' ' + st.skill.short + ' (' + progPct(st.rateRecent) + ')'; }).join(', ')));
      else ul.appendChild(progMk('li', '', '🌟 Tout est au-dessus de 90 % : bravo !'));
      body.appendChild(ul);
    }
    body.appendChild(progMk('p', 'muted settings-hint', '🎯 Dans les séries sans faute (paliers 20, 25 et 30), les 3 questions avant un palier sont posées dans les sujets à travailler (il faut au moins 20 réponses enregistrées).'));
    var unknown = stats.filter(function(st){ return st.rateRecent===null; });
    if(unknown.length) body.appendChild(progMk('p', 'muted settings-hint', 'Pas encore assez de réponses (moins de ' + PROG_MIN_RECENT + ') : ' + unknown.map(function(st){ return st.skill.short; }).join(', ') + '.'));
  }

  function progActivityLabel(e){
    if(e[2]==='qcm'){ var d = e[3] ? quizTypeById(e[3]) : null; return d ? (d.longLabel || d.label || e[3]) : 'Quiz'; }
    return FAMILY_TAGS[e[2]] || e[2];
  }
  function progRenderDetail(body, stats){
    if(!progEvents.length){ body.appendChild(progMk('p', 'muted', 'Pas encore de résultats.')); return; }
    stats.slice().sort(function(a,b){
      var ra = a.rateRecent===null ? 2 : a.rateRecent, rb = b.rateRecent===null ? 2 : b.rateRecent; return ra - rb;
    }).forEach(function(st){
      var d = progMk('details', 'prog-skill');
      var sum = document.createElement('summary');
      var head = progMk('span', 'prog-skill-head', st.skill.icon + ' ' + st.skill.label);
      var val = progMk('span', 'prog-skill-val' + (st.rateRecent!==null && st.rateRecent<PROG_WEAK_BELOW ? ' weak' : ''), (st.rateRecent===null ? 'pas assez de données' : progPct(st.rateRecent)) + (st.trend>0 ? ' ▲' : st.trend<0 ? ' ▼' : ''));
      sum.appendChild(head); sum.appendChild(val); d.appendChild(sum);
      var bar = progMk('div', 'prog-bar'); var fill = progMk('div', 'prog-bar-fill' + (st.rateRecent!==null && st.rateRecent<PROG_WEAK_BELOW ? ' weak' : ''));
      fill.style.width = Math.round(100 * (st.rateRecent===null ? 0 : st.rateRecent)) + '%'; bar.appendChild(fill); d.appendChild(bar);
      d.appendChild(progMk('p', 'muted prog-line', st.n + ' réponse' + (st.n>1?'s':'') + ' · depuis le début : ' + progPct(st.rateAll) +
        ' · par niveau : ' + ['Facile','Moyen','Difficile'].map(function(nm,lv){ return nm + ' ' + (st.byLevel[lv].n ? progPct(st.byLevel[lv].rate) + ' (' + st.byLevel[lv].n + ')' : '—'); }).join(' · ')));
      // détail par activité
      var acts = {};
      progSkillEvents(st.index).forEach(function(e){
        var k = e[2]==='qcm' ? 'qcm|' + e[3] : e[2];
        (acts[k] = acts[k] || { label:progActivityLabel(e), list:[] }).list.push(e);
      });
      var rows = Object.keys(acts).map(function(k){ var a = acts[k]; return { label:a.label, n:a.list.length, rate:progRate(a.list.slice(-20)) }; })
        .sort(function(a,b){ return a.rate - b.rate; });
      if(rows.length){
        var ul = progMk('ul', 'prog-acts');
        rows.forEach(function(r){
          var li = progMk('li', r.rate < PROG_WEAK_BELOW ? 'weak' : '');
          li.appendChild(progMk('span', '', r.label)); li.appendChild(progMk('span', 'prog-act-val', progPct(r.rate) + ' · ' + r.n));
          ul.appendChild(li);
        });
        d.appendChild(ul);
      }
      body.appendChild(d);
    });
  }

  function progRenderActivity(body){
    var DAYS = 14, now = new Date(); now.setHours(0,0,0,0);
    var days = [];
    for(var i=DAYS-1;i>=0;i--){ var t0 = now.getTime() - i*86400000; days.push({ t0:t0, list:progEvents.filter(function(e){ return e[0]>=t0 && e[0]<t0+86400000; }) }); }
    var max = Math.max.apply(null, days.map(function(d){ return d.list.length; }).concat([1]));
    var svg = document.createElementNS(svgNS, 'svg'); svg.setAttribute('viewBox', '0 0 320 150'); svg.setAttribute('class', 'prog-days'); svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', 'Réponses par jour sur les ' + DAYS + ' derniers jours');
    var bw = 320 / DAYS;
    days.forEach(function(d, i){
      var h = Math.round(100 * d.list.length / max), r = progRate(d.list), x = i*bw + 4;
      if(d.list.length){
        svg.appendChild(el('rect', { x:x, y:110-h, width:bw-8, height:h, rx:3, fill: r>=0.8 ? 'var(--good)' : (r>=0.6 ? 'var(--accent)' : 'var(--bad)') }));
        var t = el('text', { x:x+(bw-8)/2, y:106-h, 'text-anchor':'middle', 'font-size':9.5, fill:'var(--text)', 'font-weight':800, 'font-family':'inherit' }); t.textContent = d.list.length; svg.appendChild(t);
      } else svg.appendChild(el('rect', { x:x, y:108, width:bw-8, height:2, fill:'var(--border)' }));
      var dd = new Date(d.t0), lab = el('text', { x:x+(bw-8)/2, y:126, 'text-anchor':'middle', 'font-size':9.5, fill:'var(--text-soft)', 'font-family':'inherit' });
      lab.textContent = dd.getDate(); svg.appendChild(lab);
    });
    body.appendChild(progMk('p', 'muted', 'Réponses par jour (14 derniers jours) — vert : ≥ 80 % de réussite, orange : ≥ 60 %, rouge : moins.'));
    body.appendChild(svg);
    var today = days[days.length-1].list, wk = progEvents.filter(function(e){ return e[0] > Date.now() - 7*86400000; });
    body.appendChild(progMk('p', 'prog-summary', 'Aujourd’hui : ' + today.length + ' réponse' + (today.length>1?'s':'') + ' (' + progPct(progRate(today)) + ') · 7 derniers jours : ' + wk.length + ' (' + progPct(progRate(wk)) + ')'));
    var lv = [0,1,2].map(function(l){ var x = progEvents.filter(function(e){ return e[4]===l; }); return ['Facile','Moyen','Difficile'][l] + ' ' + progPct(progRate(x)) + ' (' + x.length + ')'; }).join(' · ');
    body.appendChild(progMk('p', 'muted', 'Par niveau : ' + lv));
  }

  function renderProgress(){
    var body = document.getElementById('progress-body');
    body.innerHTML = '';
    var stats = progSkillStats();
    if(progTab===0) progRenderSynthese(body, stats);
    else if(progTab===1) progRenderDetail(body, stats);
    else progRenderActivity(body);
  }
  function openProgress(){
    document.getElementById('settings-overlay').hidden = true;
    document.getElementById('progress-confirm').hidden = true;
    document.getElementById('progress-overlay').hidden = false;
    renderProgress();
  }
  buildLevelRow(document.getElementById('progress-tabs'), ['Synthèse','Détail','Activité'], 0, function(idx){ progTab = idx; renderProgress(); });
  document.getElementById('open-progress-btn').addEventListener('click', openProgress);
  document.getElementById('progress-close').addEventListener('click', function(){ document.getElementById('progress-overlay').hidden = true; });
  document.getElementById('progress-overlay').addEventListener('click', function(e){
    if(e.target.id === 'progress-overlay') document.getElementById('progress-overlay').hidden = true;
  });
  document.getElementById('progress-clear').addEventListener('click', function(){ document.getElementById('progress-confirm').hidden = false; });
  document.getElementById('progress-clear-no').addEventListener('click', function(){ document.getElementById('progress-confirm').hidden = true; });
  document.getElementById('progress-clear-yes').addEventListener('click', function(){
    progEvents = []; progSave();
    document.getElementById('progress-confirm').hidden = true;
    renderProgress();
  });
