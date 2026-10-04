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
    tryF('scene', function(f){ f.scene = 'hologramme'; });
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
  await page.evaluate(() => window.__t.__eval("globalLevel=2; showFamily('quiz')")).catch(() => {});
  console.log(bad ? 'ÉCHEC gabarits : ' + bad : 'gabarits OK');
  if (bad) process.exitCode = 1;
});
