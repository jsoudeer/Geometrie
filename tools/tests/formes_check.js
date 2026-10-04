// Fiches « formes » (geometrie.js) : côtés, sommets, nom de la forme, suite de formes, mesures, périmètre, intrus. La réponse est RECALCULÉE depuis le dessin (points du polygone / cercle).
const { withPage } = require('./lib');
withPage({ page: 'index_test.html', viewport: { width: 390, height: 900 } }, async (page) => {
  let bad = 0; const chk = (ok, msg) => { console.log(ok ? '  ok' : '  ✘ ÉCHEC', msg); if (!ok) bad++; };
  const J = async c => JSON.parse(await page.evaluate(x => window.__t.__eval(x), c));
  const o = await J(String.raw`(function(){
    function def(id){ return QCM_TYPE_DEFS.filter(function(d){return d.id===id;})[0]; }
    function okOf(q){ return q.choices.filter(function(c){return c.ok;}); }
    var svg = document.getElementById('m4Svg');
    function shapeOf(){   // lit le dessin
      var c = svg.querySelector('circle'); if(c) return { n:0, name:'cercle' };
      var pl = svg.querySelector('polygon'); if(!pl) return null;
      var P = pl.getAttribute('points').split(' ').map(function(s){ return s.split(',').map(Number); }), n = P.length;
      function d(i,j){ return Math.hypot(P[i][0]-P[j][0], P[i][1]-P[j][1]); }
      var names = { 3:'triangle', 5:'pentagone', 6:'hexagone' }, name = names[n];
      if(n === 4){
        var s = [d(0,1),d(1,2),d(2,3),d(3,0)], eq = Math.abs(s[0]-s[1]) < 1;
        var dot = (P[1][0]-P[0][0])*(P[2][0]-P[1][0]) + (P[1][1]-P[0][1])*(P[2][1]-P[1][1]), right = Math.abs(dot) < 1;
        name = right ? (eq ? 'carré' : 'rectangle') : 'losange';
      }
      return { n:n, name:name };
    }
    var LV = [['triangle','carré','rectangle'], ['triangle','carré','rectangle','pentagone','hexagone','cercle'], ['triangle','carré','rectangle','pentagone','hexagone','cercle','losange']];
    var R = { reg:['sides','vertices','name'].every(function(i){ return !!TEMPLATE_FICHES[i]; }), bad:0, dist:0, out:0, seen:[{},{},{}], quote:0, notes:[] };
    ['sides','vertices','name'].forEach(function(id){
      for(var lv=0; lv<3; lv++){
        for(var i=0;i<300;i++){
          var q = def(id).generate(lv); q.draw(); var sh = shapeOf(), g = okOf(q);
          if(!sh || g.length !== 1){ R.bad++; continue; }
          var want = id==='name' ? sh.name : String(sh.n);
          if(g[0].label !== want) R.bad++;
          if(new Set(q.choices.map(function(c){return c.label;})).size !== 4) R.dist++;
          if(LV[lv].indexOf(sh.name) === -1) R.out++;
          R.seen[lv][sh.name] = 1;
          if(/['"]{2}|undefined|NaN/.test(q.question + q.sub + q.explain)) R.quote++;
        }
        R.notes.push(def(id).randomNote);
      }
    });
    R.seen = R.seen.map(function(k){ return Object.keys(k).length; });

    // --- suite de formes : la case « ? » doit prolonger le motif ---
    var S = { bad:0, dist:0, units:[{},{},{}] };
    for(var lv=0; lv<3; lv++) for(var i=0;i<300;i++){
      var q = def('suiteFormes').generate(lv); q.draw();
      var cells = Array.prototype.map.call(svg.querySelectorAll('text'), function(t){ return t.textContent; });
      if(cells.length !== 7 || cells[6] !== '?'){ S.bad++; continue; }
      var seq = cells.slice(0,6), g = okOf(q), found = false;
      for(var per=1; per<=4; per++){ var okp = true; for(var j=per;j<6;j++) if(seq[j] !== seq[j-per]) okp = false; if(okp){ found = (g[0].label === seq[6-per]); break; } }
      // le plus court motif qui colle ; sinon c'est l'unité complète
      if(!found) S.bad++; if(g.length !== 1 || new Set(q.choices.map(function(c){return c.label;})).size !== 4) S.dist++;
      S.units[lv][q.explain.split(' : ')[1].split('.')[0].replace(/ /g,'').length] = 1;
    }
    S.units = S.units.map(function(k){ return Object.keys(k).join(); }); R.suite = S;
    // --- mesures ---
    var M = { bad:0, dist:0, kinds:[{},{},{}] };
    for(lv=0; lv<3; lv++) for(i=0;i<400;i++){
      q = def('mesures').generate(lv); g = okOf(q); var m, want = null, kind;
      if((m = /Avec quelle unité mesure-t-on (.*) \?/.exec(q.question))){ kind='unite'; var hit = BANKS.UNITE_TXT.indexOf(m[1]); want = hit < 0 ? null : BANKS.UNITE_U[hit]; }
      else if(/plus grande longueur/.test(q.question)){ kind='plusLong';
        var cm = q.choices.map(function(c){ var t = /^(\d+) m(?: (\d+) cm)?$/.exec(c.label), u = /^(\d+) cm$/.exec(c.label); return t ? +t[1]*100 + (+t[2]||0) : +u[1]; });
        want = q.choices[cm.indexOf(Math.max.apply(null, cm))].label; }
      else if((m = /(\d+) m = \? cm/.exec(q.question))){ kind='conv'; want = String(m[1]*100); }
      else if((m = /(\d+) km = \? m/.exec(q.question))){ kind='conv2'; want = String(m[1]*1000); }
      if(want === null || g.length !== 1 || g[0].label !== want) M.bad++;
      if(new Set(q.choices.map(function(c){return c.label;})).size !== 4) M.dist++;
      M.kinds[lv][kind] = 1;
    }
    M.kinds = M.kinds.map(function(k){ return Object.keys(k).sort().join(); }); R.mes = M;
    // --- périmètre : recalculé depuis l'énoncé ou le dessin ---
    var P = { bad:0, dist:0, kinds:[{},{},{}] };
    for(lv=0; lv<3; lv++) for(i=0;i<400;i++){
      q = def('perimetre').generate(lv); g = okOf(q); want = null; q.draw();
      if((m = /Un carré a des côtés de (\d+) cm/.exec(q.question))){ want = 4*m[1]; P.kinds[lv].carre = 1; }
      else if((m = /mesure (\d+) cm de long et (\d+) cm de large/.exec(q.question))){ want = 2*(+m[1] + +m[2]); P.kinds[lv].rect = 1; }
      else if((m = /mesurent (\d+) cm/.exec(q.question))){ var n = svg.querySelector('polygon').getAttribute('points').split(' ').length; want = n*m[1]; P.kinds[lv]['poly' + n] = 1; }
      else { var cs = svg.querySelectorAll('rect'); var xs = {}, ys = {}; Array.prototype.forEach.call(cs, function(r){ xs[r.getAttribute('x')] = 1; ys[r.getAttribute('y')] = 1; });
        want = 2*(Object.keys(xs).length + Object.keys(ys).length); P.kinds[lv].grille = 1; }
      if(g.length !== 1 || g[0].label !== want + ' cm') P.bad++;
      if(new Set(q.choices.map(function(c){return c.label;})).size !== 4) P.dist++;
    }
    P.kinds = P.kinds.map(function(k){ return Object.keys(k).sort().join(); }); R.per = P;
    // --- intrus : la lettre juste est la forme dessinée différemment ---
    var I = { bad:0, kinds:[{},{},{}] };
    for(lv=0; lv<3; lv++) for(i=0;i<400;i++){
      q = def('intrus').generate(lv); g = okOf(q); q.draw();
      var sig = Array.prototype.filter.call(svg.children, function(n){ return /^(polygon|circle|rect)$/.test(n.tagName); }).map(function(n){
        if(n.tagName === 'circle') return 'c';
        if(n.tagName === 'polygon') return 'p' + n.getAttribute('points').split(' ').length;
        return 'r' + (Math.abs(+n.getAttribute('width') - +n.getAttribute('height')) < 1 ? 'carre' : 'long'); });
      var odd = -1; sig.forEach(function(sg, k){ if(sig.filter(function(x){ return x === sg; }).length === 1) odd = k; });
      if(sig.length !== 4 || odd < 0 || g.length !== 1 || g[0].label !== 'ABCD'.charAt(odd)) I.bad++;
      I.kinds[lv][sig.join('').replace(/\d/g,'') ? (sig[odd].charAt(0) === 'r' ? 'rect' : 'poly') : '?'] = 1;
    }
    I.kinds = I.kinds.map(function(k){ return Object.keys(k).sort().join(); }); R.int = I;
    // les cinq nouvelles sont bien des fiches
    R.reg2 = ['suiteFormes','mesures','perimetre','intrus'].every(function(i){ return !!TEMPLATE_FICHES[i]; });
    // redessiner = même image
    var q2 = def('name').generate(2); q2.draw(); var a = svg.innerHTML; q2.draw(); R.same = a === svg.innerHTML;
    return JSON.stringify(R);
  })()`);
  chk(o.reg, 'sides, vertices, name sont des fiches');
  chk(o.bad === 0, 'bonne réponse = ce qui est dessiné (' + o.bad + ' écarts)');
  chk(o.dist === 0, 'toujours 4 réponses différentes');
  chk(o.out === 0, 'formes limitées à celles du niveau');
  chk(o.seen.join() === '3,6,7', 'formes vues par niveau : ' + o.seen.join());
  chk(o.quote === 0, 'aucun guillemet / undefined parasite');
  chk(o.reg2, 'suiteFormes, mesures, perimetre, intrus sont des fiches');
  chk(o.suite.bad === 0 && o.suite.dist === 0, 'suite : la case ? prolonge le motif (' + o.suite.bad + ' écarts)');
  chk(o.mes.bad === 0 && o.mes.dist === 0, 'mesures : réponse recalculée (' + o.mes.bad + ' écarts)');
  chk(o.mes.kinds.join('|') === 'unite|plusLong,unite|conv,conv2,plusLong', 'mesures : sortes par niveau ' + o.mes.kinds.join('|'));
  chk(o.per.bad === 0 && o.per.dist === 0, 'périmètre : réponse recalculée (' + o.per.bad + ' écarts)');
  chk(o.per.kinds.join('|') === 'grille|carre,rect|poly3,poly5,poly6', 'périmètre : sortes par niveau ' + o.per.kinds.join('|'));
  chk(o.int.bad === 0, 'intrus : la lettre juste est la forme différente (' + o.int.bad + ' écarts)');
  chk(o.int.kinds.join('|') === 'poly|poly|poly,rect', 'intrus : sortes par niveau ' + o.int.kinds.join('|'));
  chk(o.same, 'redessiner = même image');
  chk(o.notes.every(n => /triangle/.test(n) && /Facile/.test(n)), 'notes générées : ' + o.notes[0].slice(0, 90));
  console.log(bad ? 'ÉCHEC' : 'formes_check OK');
  process.exit(bad ? 1 : 0);
});
