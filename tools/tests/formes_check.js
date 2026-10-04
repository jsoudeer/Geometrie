// Fiches « formes » (geometrie.js) : côtés, sommets, nom de la forme. La réponse est RECALCULÉE depuis le dessin (points du polygone / cercle).
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
  chk(o.same, 'redessiner = même image');
  chk(o.notes.every(n => /triangle/.test(n) && /Facile/.test(n)), 'notes générées : ' + o.notes[0].slice(0, 90));
  console.log(bad ? 'ÉCHEC' : 'formes_check OK');
  process.exit(bad ? 1 : 0);
});
