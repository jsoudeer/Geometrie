// P3 de l'audit : graine injectable. Pour chaque type de Quizz × niveau × quelques graines :
//  - deux generate() à graine égale donnent la même question (énoncé, explication, réponses) ;
//  - draw() est déterministe : appelé deux fois (et après un autre tirage), il donne la même image.
// Et des graines différentes donnent bien des questions différentes (le hasard n'est pas figé).
const { withPage } = require('./lib');
withPage({ page: 'index_test.html', viewport: { width: 390, height: 900 } }, async (page) => {
  let bad = 0; const chk = (ok, msg) => { console.log(ok ? '  ok' : '  ✘ ÉCHEC', msg); if (!ok) bad++; };
  const r = JSON.parse(await page.evaluate(() => window.__t.__eval(`(function(){
    var out = { types:0, diffQ:[], diffImg:[], same:0, varied:{}, none:[] };
    function snap(def, lv, seed){
      return withSeed(seed, function(){
        var q = def.generate(lv);
        var svg = document.getElementById('m4Svg');
        svg.innerHTML = ''; q.draw && q.draw(); var a = svg.innerHTML;
        Math.random(); rnd(); var b0 = svg.innerHTML; svg.innerHTML = ''; q.draw && q.draw(); var b = svg.innerHTML;
        return { q: JSON.stringify([q.tag, q.question, q.sub, q.explain, q.choices.map(function(c){return c.label+'|'+c.ok;})]), a: a, b: b };
      });
    }
    QCM_TYPE_DEFS.forEach(function(def){
      out.types++;
      for(var lv=0; lv<3; lv++){
        var qs = {};
        for(var seed=1; seed<=6; seed++){
          var s1 = snap(def, lv, seed*7919), s2 = snap(def, lv, seed*7919);
          qs[s1.q] = 1;
          if(s1.q !== s2.q) out.diffQ.push(def.id+' L'+lv+' seed'+seed);
          else if(s1.a !== s2.a || s1.a !== s1.b || s2.a !== s2.b) out.diffImg.push(def.id+' L'+lv+' seed'+seed);
          else out.same++;
        }
        out.varied[def.id+lv] = Object.keys(qs).length;
      }
    });
    out.fixed = Object.keys(out.varied).filter(function(k){ return out.varied[k] === 1; });
    // hors graine : le hasard ordinaire fonctionne toujours (deux tirages libres ne sont pas tous identiques)
    var d = QCM_TYPE_DEFS.filter(function(x){return x.id==='calc';})[0], seen = {};
    for(var i=0;i<30;i++) seen[d.generate(2).question] = 1;
    out.free = Object.keys(seen).length;
    return JSON.stringify(out); })()`)));
  chk(r.types >= 47, r.types + ' types de Quizz parcourus');
  chk(r.diffQ.length === 0, 'même graine = même question' + (r.diffQ.length ? ' — écarts : ' + r.diffQ.slice(0, 6).join(', ') : ''));
  chk(r.diffImg.length === 0, 'même graine = même image, et draw() ne change plus d\'un appel à l\'autre' + (r.diffImg.length ? ' — types : ' + Array.from(new Set(r.diffImg.map(function(x){ return x.split(' ')[0]; }))).join(', ') : ''));
  chk(r.fixed.length <= 6, 'des graines différentes donnent des questions différentes (figés : ' + r.fixed.join(', ') + ')');
  chk(r.free > 5, 'hors graine, le tirage reste libre (' + r.free + ' questions différentes sur 30)');
  // garde-fou : plus de Math.random() direct dans les fichiers qui fabriquent des questions (seuls les effets visuels l'utilisent)
  const fs = require('fs'), path = require('path');
  const left = ['calcul', 'nombres', 'geometrie', 'horloge', 'patron3d', 'vocabulaire', 'atelier', 'competences']
    .filter(f => /Math\.random\(\)/.test(fs.readFileSync(path.join(__dirname, '../../src/js', f + '.js'), 'utf8')));
  chk(left.length === 0, 'aucun Math.random() direct dans les fichiers de questions (utiliser rnd())' + (left.length ? ' : ' + left.join(', ') : ''));
  console.log(bad ? 'ÉCHEC seed : ' + bad : 'seed OK (' + r.same + ' cas identiques)');
  if (bad) process.exitCode = 1;
});
