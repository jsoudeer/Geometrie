// P4 de l'audit : moteur de fiches (gabarits.js) et 6 activités de calcul migrées (fiches-calcul.js).
const { withPage } = require('./lib');
withPage({ page: 'index_test.html', viewport: { width: 390, height: 900 } }, async (page) => {
  let bad = 0; const chk = (ok, msg) => { console.log(ok ? '  ok' : '  ✘ ÉCHEC', msg); if (!ok) bad++; };
  const J = async c => JSON.parse(await page.evaluate(x => window.__t.__eval(x), c));
  // 1. évaluateur
  const ev = await J(`(function(){
    var E = Object.create(null); E.a = 7; E.b = 3; E.__fns = TEMPLATE_FNS; var o = {};
    [['a+b*2',13],['(a+b)*2',20],['a-b-1',3],['-a+10',3],['a%b',1],['a>b && b>0',true],['a<b || b==3',true],['!(a==7)',false],
     ['a>5 ? 100 : 200',100],['a>9 ? 100 : b>2 ? 5 : 6',5],['max(a,b)+min(a,b)',10],['floor(a/2)',3],['abs(b-a)',4],['liste([2,5,10])','2, 5 et 10'],['10-2-3',5]]
      .forEach(function(t){ o[t[0]] = evalExpr(t[0], E) === t[1]; });
    return JSON.stringify(o); })()`);
  const wrong = Object.keys(ev).filter(k => !ev[k]);
  chk(wrong.length === 0, 'évaluateur : ' + Object.keys(ev).length + ' expressions (priorités, ternaire, fonctions)' + (wrong.length ? ' — faux : ' + wrong.join(' ; ') : ''));
  // 2. fiches invalides refusées, aucun code exécuté
  const rej = await J(`(function(){
    var good = JSON.parse(JSON.stringify(TEMPLATE_FICHES.soustraction)), o = {};
    function tryF(name, mut){ var f = JSON.parse(JSON.stringify(good)); mut(f); try { validateFiche(f); o[name] = false; } catch(e){ o[name] = true; } }
    tryF('inconnu', function(f){ f.forms[0].answer = 'a+zz'; });
    tryF('fonction', function(f){ f.forms[0].answer = 'alert(1)'; });
    tryF('constructor', function(f){ f.forms[0].answer = 'constructor'; });
    tryF('syntaxe', function(f){ f.forms[0].answer = 'a +'; });
    tryF('texte', function(f){ delete f.forms[0].question; });
    tryF('niveaux', function(f){ f.levels.pop(); });
    tryF('scene', function(f){ f.forms[0].scene = { type:'hologramme' }; });
    tryF('sceneArg', function(f){ f.forms[0].scene = { type:'blocks', hu:'a', te:'b' }; });
    tryF('id', function(f){ delete f.id; });
    tryF('texteInconnu', function(f){ f.forms[0].sub = 'Calcule {zz}.'; });
    var ok = true; try { validateFiche(good); } catch(e){ ok = false; }
    o.bonneFiche = ok; return JSON.stringify(o); })()`);
  chk(Object.values(rej).every(Boolean), 'fiches mal formées refusées (nom inconnu, fonction inconnue, constructor, syntaxe, texte manquant, niveaux, scène, id) ; fiche valide acceptée' + (Object.values(rej).every(Boolean) ? '' : ' ' + JSON.stringify(rej)));
  // 3. la note est générée depuis les réglages
  const note = await J(`(function(){
    var f = JSON.parse(JSON.stringify(TEMPLATE_FICHES.soustraction)); f.levels[2].aHi = 77;
    var d = {}; for(var i=0;i<400;i++){ var q = genFromFiche(f, 2); d[/(\\d+) - (\\d+)/.exec(q.question)[1]] = 1; }
    return JSON.stringify({ note: templateNote(f), max: Math.max.apply(null, Object.keys(d).map(Number)),
      tables: templateNote(TEMPLATE_FICHES.tables), reel: QCM_TYPE_DEFS.filter(function(x){return x.id==='soustraction';})[0].randomNote }); })()`);
  chk(/jusqu'à 77/.test(note.note) && note.max > 60 && note.max <= 77, 'la note suit les réglages : changer aHi → la note ET les questions changent (max vu ' + note.max + ')');
  chk(/2, 3, 4, 5 et 10/.test(note.tables) && /jusqu'à 60/.test(note.reel), 'notes générées lisibles (liste « 2, 3, 4, 5 et 10 »)');
  // 4. les 6 activités migrées : plages identiques à l'ancien code
  const r = await J(`(function(){
    function def(id){ return QCM_TYPE_DEFS.filter(function(d){return d.id===id;})[0]; }
    var ids = ['calc','soustraction','doubleMoitie','complement','tables','addition'], o = { reg: ids.map(function(i){ return !!def(i) && !!TEMPLATE_FICHES[i]; }) };
    function ints(q){ return (q.question.match(/\\d+/g)||[]).map(Number); }
    function carry(a,b){ return hasCarry(a,b); }
    var m = { calcX:[0,0,0], subMin:[99,99,99], subMax:[0,0,0], bMin2:99, dblMax:[0,0,0], compT:[{},{},{}], tabs:[{},{},{}], tabMiss:[0,0,0], add:[{c:0,n:0,max:0,min:999},{c:0,n:0,max:0,min:999},{c:0,n:0,max:0,min:999}], calcMax:[0,0,0], free:0 };
    for(var lv=0; lv<3; lv++) for(var i=0;i<600;i++){
      var q = def('calc').generate(lv), t = q.question, n = ints(q);
      if(/Trouve x/.test(t)) m.calcX[lv]++;
      m.calcMax[lv] = Math.max(m.calcMax[lv], /Trouve x/.test(t) ? n[1] : n[0]+n[1]);
      q = def('soustraction').generate(lv); n = ints(q); m.subMin[lv]=Math.min(m.subMin[lv],n[0]); m.subMax[lv]=Math.max(m.subMax[lv],n[0]); if(lv===2) m.bMin2=Math.min(m.bMin2,n[1]);
      q = def('doubleMoitie').generate(lv); n = ints(q); m.dblMax[lv] = Math.max(m.dblMax[lv], /double/.test(q.question) ? n[0] : n[0]/2);
      q = def('complement').generate(lv); n = ints(q); m.compT[lv][n[1]] = 1;
      q = def('tables').generate(lv); n = ints(q); m.tabs[lv][n[0]] = 1; if(/× \\?/.test(q.question)) m.tabMiss[lv]++;
      q = def('addition').generate(lv); n = ints(q); var s = n[0]+n[1], c = carry(n[0],n[1]), A = m.add[lv];
      A.n++; if(c) A.c++; A.max = Math.max(A.max, s); A.min = Math.min(A.min, n[0]);
    }
    o.m = m; return JSON.stringify(o); })()`);
  const m = r.m;
  chk(r.reg.every(Boolean), '6 activités enregistrées par fiche (calc, soustraction, doubleMoitie, complement, tables, addition)');
  chk(m.calcX[0] === 0 && m.calcX[1] === 0 && m.calcX[2] > 200 && m.calcX[2] < 400 && m.calcMax.join() === '10,20,20', 'calc : « trouve x » seulement en Difficile (' + m.calcX[2] + '/600) ; sommes jusqu\'à ' + m.calcMax.join('/'));
  chk(m.subMax.join() === '10,20,60' && m.subMin.join() === '2,8,21' && m.bMin2 >= 6, 'soustraction : a de 2-10, 8-20, 21-60 ; b ≥ 6 en Difficile');
  chk(m.dblMax.join() === '10,20,50', 'doubles/moitiés : jusqu\'à 10 / 20 / 50');
  chk(Object.keys(m.compT[0]).join() === '10' && Object.keys(m.compT[1]).join() === '20' && Object.keys(m.compT[2]).join() === '100', 'compléments : à 10 / 20 / 100');
  chk(Object.keys(m.tabs[0]).sort().join() === '10,2' && Object.keys(m.tabs[1]).sort().join() === '10,2,5' && Object.keys(m.tabs[2]).sort().join() === '10,2,3,4,5' && m.tabMiss[0] === 0 && m.tabMiss[2] > 150 && m.tabMiss[2] < 330, 'tables : 2-10 / 2-5-10 / 2-3-4-5-10 ; facteur manquant seulement en Difficile (' + m.tabMiss[2] + '/600)');
  chk(m.add[0].c === 0 && m.add[0].max <= 99 && m.add[1].c > 300 && m.add[1].max <= 99 && m.add[2].c > 300 && m.add[2].max <= 999 && m.add[2].min >= 120, 'additions : sans retenue en Facile ; souvent avec retenue ensuite (' + m.add[1].c + ' et ' + m.add[2].c + '/600) ; ≤ 99 / ≤ 999');
  // 5. soustractions posées (fiche) et scène de blocs partagée
  const sp = await J(`(function(){
    function def(id){ return QCM_TYPE_DEFS.filter(function(d){return d.id===id;})[0]; }
    var o = { reg: !!TEMPLATE_FICHES.soustractionPosee, borrow:[0,0,0], max:[0,0,0], neg:0, c:[ [999,0], [999,0], [999,0] ], b1:0, bad:0, zeroPl:0 };
    for(var lv=0; lv<3; lv++) for(var i=0;i<500;i++){
      var q = def('soustractionPosee').generate(lv), n = /(\\d+) - (\\d+)/.exec(q.question), a=+n[1], b=+n[2];
      if(hasBorrow(a,b)) o.borrow[lv]++; o.max[lv] = Math.max(o.max[lv], a); if(a<=b) o.neg++;
      var c = def('comptage').generate(lv); if(lv>0){ var t = c.choices.filter(function(x){return x.ok;})[0].label; o.c[lv][0]=Math.min(o.c[lv][0],+t); o.c[lv][1]=Math.max(o.c[lv][1],+t); if(!/blocs/.test(c.question)) o.bad++; if(lv===2 && /^1? ?barres?/.test(c.explain)) o.zeroPl++; }
      if(lv>0){ var bq = def('blocs1000').generate(lv), bt = +bq.choices.filter(function(x){return x.ok;})[0].label; if(bt>(lv===1?499:999) || bt<100) o.b1++; }
    }
    return JSON.stringify(o); })()`);
  chk(sp.reg && sp.neg === 0 && sp.borrow[0] === 0 && sp.borrow[1] > 250 && sp.borrow[2] > 250 && sp.max[0] <= 99 && sp.max[1] <= 99 && sp.max[2] <= 999 && sp.max[2] > 900, 'soustractions posées (fiche) : sans emprunt en Facile, souvent avec ensuite ; a ≤ ' + sp.max.join('/') + ' ; toujours a > b');
  chk(sp.bad === 0 && sp.c[1][1] <= 59 && sp.c[2][1] <= 259 && sp.c[2][0] >= 10 && sp.b1 === 0, 'comptage (Moyen/Difficile) et blocs1000 partagent la même scène de blocs ; plages ' + sp.c[1] + ' / ' + sp.c[2]);
  const mu = await J(`(function(){
    function def(id){ return QCM_TYPE_DEFS.filter(function(d){return d.id===id;})[0]; }
    var o = { reg: !!TEMPLATE_FICHES.multiplier && !!TEMPLATE_FICHES.comptage && !!TEMPLATE_FICHES.blocs1000, kinds:[{},{},{}], gMax:[0,0,0], gMin:[99,99,99], wrongRes:0, cn:[99,0], dots:0, drawDiff:0 };
    for(var lv=0; lv<3; lv++) for(var i=0;i<700;i++){
      var q = def('multiplier').generate(lv), t = q.question, k = /points/.test(t) ? 'grille' : /fois/.test(t) ? 'repete' : /partage/.test(t) ? 'partage' : /paquets/.test(t) ? 'groupes' : '?';
      o.kinds[lv][k] = (o.kinds[lv][k]||0) + 1;
      if(k==='grille'){ var r = +/(\\d+) lignes de (\\d+)/.exec(q.sub)[1], c = +/(\\d+) lignes de (\\d+)/.exec(q.sub)[2]; o.gMax[lv] = Math.max(o.gMax[lv], c); o.gMin[lv] = Math.min(o.gMin[lv], r);
        if(q.choices.filter(function(x){return x.ok;})[0].label != r*c) o.wrongRes++; var svg = document.getElementById('m4Svg'); q.draw(); if(svg.querySelectorAll('circle').length !== r*c) o.dots++; }
    }
    for(var i=0;i<300;i++){ var n = +def('comptage').generate(0).choices.filter(function(x){return x.ok;})[0].label; o.cn[0]=Math.min(o.cn[0],n); o.cn[1]=Math.max(o.cn[1],n); }
    return JSON.stringify(o); })()`);
  chk(mu.reg && mu.wrongRes === 0 && mu.dots === 0, 'multiplier, comptage, blocs1000 en fiches ; la grille dessine exactement r × c points');
  const kk = mu.kinds;
  chk(!kk[0].groupes && kk[0].grille > 100 && kk[0].repete > 100 && kk[0].partage > 100 && kk[1].groupes > 100 && kk[2].groupes > kk[2].partage * 1.5 && !kk[0]['?'] && !kk[1]['?'] && !kk[2]['?'], 'multiplier : 3 sortes en Facile, + paquets en Moyen, 2× plus de paquets en Difficile ' + JSON.stringify(kk));
  chk(mu.gMax[0] <= 5 && mu.gMin[0] >= 2 && mu.gMax[2] <= 10 && mu.cn[0] >= 3 && mu.cn[1] <= 12, 'plages : grille Facile ≤ 5 colonnes, Difficile ≤ 10 ; dénombrement Facile ' + mu.cn);
  // 6. droite graduée (scène numberline) et comparer (réponses non numériques)
  const dc = await J(`(function(){
    function def(id){ return QCM_TYPE_DEFS.filter(function(d){return d.id===id;})[0]; }
    var o = { reg: !!TEMPLATE_FICHES.droite && !!TEMPLATE_FICHES.compare, steps:[{},{},{}], k5:0, badV:0, badArrow:0, startOk:true, sign:{bad:0}, eq:[0,0,0], expr:[0,0,0], cols:0, labels:{}, expl:0, same:0, sameN:0 };
    for(var lv=0; lv<3; lv++) for(var i=0;i<600;i++){
      var q = def('droite').generate(lv), st = +/vaut (\\d+)/.exec(q.explain)[1], k = +/numéro (\\d+)/.exec(q.explain)[1], v = +q.choices.filter(function(x){return x.ok;})[0].label;
      o.steps[lv][st] = 1; if(k===5) o.k5++;
      var base = v - k*st; if(base < 0 || base % 100 !== 0 && st === 10 && lv === 2 || (lv < 2 && base !== 0)) o.startOk = false;
      var svg = document.getElementById('m4Svg'); q.draw();
      var tip = svg.querySelector('polygon').getAttribute('points').split(' ')[2].split(',')[0];
      if(Math.abs(+tip - (16 + k*168/10)) > 0.01) o.badArrow++;
      var c = def('compare').generate(lv); o.cols += c.cols3 ? 1 : 0; var lab = c.choices.map(function(x){return x.label;}).join(''); o.labels[lab] = 1;
      var m = /: (.+) … (.+) \\?$/.exec(c.question), L = m[1].split(' + ').reduce(function(a,b){return a+ +b;},0), R = m[2].split(' + ').reduce(function(a,b){return a+ +b;},0);
      var want = L<R ? '<' : L>R ? '>' : '=', got = c.choices.filter(function(x){return x.ok;});
      if(got.length !== 1 || got[0].label !== want) o.sign.bad++;
      if(m[1].indexOf('+') !== -1) o.expr[lv]++;
      if(L === R) o.eq[lv]++;
      if(c.explain.indexOf(want === '=' ? '=.' : want + ' ') === -1) o.expl++;
    }
    return JSON.stringify(o); })()`);
  chk(dc.reg && Object.keys(dc.steps[0]).join() === '1' && Object.keys(dc.steps[1]).sort().join() === '10,20' && Object.keys(dc.steps[2]).sort().join() === '10,100,50' && dc.k5 === 0 && dc.startOk, 'droite graduée : pas 1 / 10 et 20 / 100, 50 et 10 ; jamais la graduation 5 ; départ 0 (sauf entre deux centaines)');
  chk(dc.badArrow === 0, 'droite graduée : la flèche est dessinée à la bonne graduation');
  chk(dc.sign.bad === 0 && dc.cols === 1800 && Object.keys(dc.labels).join() === '<=>' && dc.expl === 0, 'comparer : le signe est toujours juste (recalculé), 3 boutons < = >, explication cohérente');
  chk(dc.expr[0] === 0 && dc.expr[1] > 300 && dc.expr[1] < 420 && dc.expr[2] > 380 && dc.expr[2] < 520 && dc.eq[0] > 60, 'comparer : additions 0 / ~60 % / ~75 % (' + dc.expr + ') — la note ne ment plus sur la Difficile ; égalités vues ' + dc.eq);

  // ---- P5 (fin) : calendrier, lire l'heure, choisir l'horloge, fractions ----
  const tm = await J(String.raw`(function(){
    function def(id){ return QCM_TYPE_DEFS.filter(function(d){return d.id===id;})[0]; }
    function ok(q){ return q.choices.filter(function(c){return c.ok;}); }
    var JO = BANKS.JOURS, MO = BANKS.MOIS, o = { reg:['calendrier','heure','horlogeChoix','fraction'].every(function(i){ return !!TEMPLATE_FICHES[i]; }), cal:{bad:0, kinds:[{},{},{}], dist:0, n4:0, expl:0}, h:{bad:0, mins:[{},{},{}], h24:0, lt12:0, dist:0}, hc:{bad:0, dist:0, labels:0, mins:[{},{},{}]}, fr:{figs:[0,0,0], read:[0,0,0], badF:0, badR:0, dist:0, oneOk:0} };
    // décode une horloge dessinée : minutes et angle de la petite aiguille
    function hands(svg){
      var ls = svg.querySelectorAll('line'), hh = null, mm = null;
      ls.forEach(function(l){ var w = l.getAttribute('stroke-width'); if(w === '5') hh = l; if(w === '3') mm = l; });
      function ang(l){ var a = Math.atan2(+l.getAttribute('y2') - 100, +l.getAttribute('x2') - 100) * 180 / Math.PI + 90; return (a + 360) % 360; }
      return { m:Math.round(ang(mm) / 6) % 60, ah:ang(hh) };
    }
    var tmp = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    function handsOf(drawFn){ tmp.innerHTML = ''; drawFn(tmp); return hands(tmp); }
    function hm(label){ var m = /(\d+) h(?: (\d+))?/.exec(label); return { h:+m[1], m:m[2] ? +m[2] : 0 }; }
    for(var lv = 0; lv < 3; lv++) for(var i = 0; i < 400; i++){
      // --- calendrier : réponse recalculée depuis l'énoncé ---
      var q = def('calendrier').generate(lv), want = null, m, e = q.question, kind;
      if((m = /après (\S+) \?/.exec(e)) && /Quel jour/.test(e)) { want = JO[(JO.indexOf(m[1]) + 1) % 7]; kind = 'jourApres'; }
      else if((m = /avant (\S+) \?/.exec(e)) && /Quel jour/.test(e)) { want = JO[(JO.indexOf(m[1]) + 6) % 7]; kind = 'jourAvant'; }
      else if((m = /après (\S+) \?/.exec(e))) { want = MO[(MO.indexOf(m[1]) + 1) % 12]; kind = 'moisApres'; }
      else if((m = /avant (\S+) \?/.exec(e))) { want = MO[(MO.indexOf(m[1]) + 11) % 12]; kind = 'moisAvant'; }
      else if(/semaine/.test(e)) { want = '7 jours'; kind = 'semaine'; }
      else if(/année/.test(e)) { want = '12 mois'; kind = 'annee'; }
      else if((m = /de (\S+) à (\S+) \?/.exec(e))) { want = (((JO.indexOf(m[2]) - JO.indexOf(m[1])) % 7 + 7) % 7) + ' jours'; kind = 'entre'; }
      else if((m = /c'est (\S+)\. Quel jour (sera-t-on dans|était-on il y a) (\d+) jours/.exec(e))) { var n = +m[3]; want = JO[((JO.indexOf(m[1]) + (m[2][0] === 's' ? n : -n)) % 7 + 7) % 7]; kind = 'decalage'; }
      var g = ok(q); o.cal.kinds[lv][kind] = 1;
      if(!want || g.length !== 1 || g[0].label !== want) o.cal.bad++;
      if(new Set(q.choices.map(function(c){return c.label;})).size !== q.choices.length) o.cal.dist++;
      if(q.choices.length === 4) o.cal.n4++;
      if(q.explain.indexOf(want) === -1) o.cal.expl++;
      // --- lire l'heure : la réponse correspond aux aiguilles dessinées ---
      var svg = document.getElementById('m4Svg'), h = def('heure').generate(lv); h.draw();
      var hd = hands(svg), a = hm(ok(h)[0].label), total12 = (a.h % 12) * 60 + a.m;
      if(hd.m !== a.m || Math.abs(hd.ah - total12 / 2) > 0.5) o.h.bad++;
      o.h.mins[lv][a.m] = 1; if(a.h > 12) o.h.h24++; if(lv === 2 && a.h <= 12) o.h.lt12++;
      if(new Set(h.choices.map(function(c){return c.label;})).size !== 4 || ok(h).length !== 1) o.h.dist++;
      // --- choisir l'horloge ---
      var c = def('horlogeChoix').generate(lv), want2 = hm(/indique (.+) \?/.exec(c.question)[1]), good = null, seen = {};
      c.choices.forEach(function(ch){ var hh = handsOf(ch.draw); var key = hh.m + ':' + Math.round(hh.ah * 2); seen[key] = 1;
        if(ch.ok) good = hh; if(!/^Horloge \d$/.test(ch.label)) o.hc.labels++; });
      if(c.choices.length !== 4 || Object.keys(seen).length !== 4 || ok(c).length !== 1) o.hc.dist++;
      if(!good || good.m !== want2.m || Math.abs(good.ah - ((want2.h % 12) * 60 + want2.m) / 2) > 0.5) o.hc.bad++;
      o.hc.mins[lv][want2.m] = 1;
      // --- fractions ---
      var f = def('fraction').generate(lv);
      function share(svgEl){ var parts = svgEl.querySelectorAll('path, rect'), filled = 0; parts.forEach(function(p){ if(p.getAttribute('fill') === 'var(--accent)') filled++; }); return [filled, parts.length]; }
      if(/Quelle figure/.test(f.question)){
        o.fr.figs[lv]++;
        var tg = { 'la moitié':[1,2], 'le quart':[1,4], 'les trois quarts':[3,4], 'le tiers':[1,3] }[/a (.+) de sa/.exec(f.question)[1]], vals = {};
        f.choices.forEach(function(ch){ tmp.innerHTML = ''; ch.draw(tmp); var s = share(tmp), v = s[0] + '/' + s[1];
          var red = s[0] / s[1]; vals[red] = 1; if(ch.ok && Math.abs(red - tg[0] / tg[1]) > 1e-9) o.fr.badF++; });
        if(Object.keys(vals).length !== 4 || ok(f).length !== 1) o.fr.dist++;
      } else {
        o.fr.read[lv]++; f.draw(); var s2 = share(svg), lab = ok(f)[0].label.split('/');
        if(s2[0] !== +lab[0] || s2[1] !== +lab[1]) o.fr.badR++;
        if(new Set(f.choices.map(function(c){return c.label;})).size !== 4 || ok(f).length !== 1) o.fr.dist++;
      }
    }
    o.capBad = 0; ['calendrier','fraction'].forEach(function(id){ for(var j=0;j<30;j++){ var qq = def(id).generate(j%3), sv = document.getElementById('m4Svg'); qq.draw(); if(/['"]/.test(sv.textContent)) o.capBad++; } });
    // l'écran « Lire l'heure » (m5) reçoit son propre dessin
    var m5 = document.getElementById('m5Svg'); m5.innerHTML = ''; def('heure').generate(1, 'm5Svg').draw(); o.m5 = m5.children.length;
    o.cal.kinds = o.cal.kinds.map(function(k){ return Object.keys(k).sort().join(); });
    o.h.mins = o.h.mins.map(function(k){ return Object.keys(k).map(Number).sort(function(a,b){return a-b;}).join(); });
    o.hc.mins = o.hc.mins.map(function(k){ return Object.keys(k).map(Number).sort(function(a,b){return a-b;}).join(); });
    return JSON.stringify(o); })()`);
  chk(tm.reg, 'calendrier, heure, horlogeChoix et fraction sont des fiches');
  chk(tm.cal.bad === 0 && tm.cal.dist === 0 && tm.cal.n4 === 1200 && tm.cal.expl === 0, 'calendrier : réponse recalculée depuis l\'énoncé, 4 propositions distinctes, explication cohérente');
  chk(tm.cal.kinds.join('|') === 'jourApres,jourAvant,semaine|annee,jourApres,jourAvant,moisApres,moisAvant|decalage,entre,moisApres,moisAvant', 'calendrier : les sortes de questions par niveau (' + tm.cal.kinds.join(' | ') + ')');
  chk(tm.h.bad === 0 && tm.h.dist === 0, 'lire l\'heure : la bonne réponse correspond exactement aux aiguilles dessinées (3 niveaux)');
  chk(tm.h.mins.join('|') === '0,30|0,15,30,45|0,5,10,15,20,25,30,35,40,45,50,55' && tm.h.h24 > 40 && tm.h.lt12 > 0, 'lire l\'heure : précision par niveau, heures 13 à 23 en Difficile (' + tm.h.mins.join(' | ') + ')');
  chk(tm.hc.bad === 0 && tm.hc.dist === 0 && tm.hc.labels === 0, 'choisir l\'horloge : la bonne figure montre l\'heure demandée, 4 horloges différentes');
  chk(tm.hc.mins.join('|') === '0,30|0,15,30,45|0,5,10,15,20,25,30,35,40,45,50,55', 'choisir l\'horloge : minutes par niveau (' + tm.hc.mins.join(' | ') + ')');
  chk(tm.fr.badF === 0 && tm.fr.badR === 0 && tm.fr.dist === 0, 'fractions : la figure juste montre la fraction demandée ; la fraction lue est celle du dessin');
  chk(tm.fr.figs.every(n => n > 100) && tm.fr.read.every(n => n > 100), 'fractions : les deux sortes de questions apparaissent à chaque niveau, Facile compris (' + tm.fr.figs + ' / ' + tm.fr.read + ')');
  chk(tm.capBad === 0, 'calendrier et fractions : aucun guillemet parasite dans le dessin');
  chk(tm.m5 > 10, 'l\'écran « Lire l\'heure » dessine sur sa propre horloge (m5Svg)');

  console.log(bad ? 'ÉCHEC gabarits : ' + bad : 'gabarits OK');
  if (bad) process.exitCode = 1;
});
