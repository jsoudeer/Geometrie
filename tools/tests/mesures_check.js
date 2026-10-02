// « Quelle est la plus grande longueur ? » : quatre valeurs bien visibles et distinctes, une seule plus grande, règle d'1 m dessinée.
const { withPage, SHOTS } = require('./lib');
withPage({ page: 'index_test.html', viewport: { width: 390, height: 844 } }, async (page) => {
  const ev = c => page.evaluate(x => window.__t.__eval(x), c);
  let bad = 0; const chk = (ok, m) => { console.log(ok ? '  ok' : '  ✘', m); if (!ok) bad++; };
  const r = JSON.parse(await ev(`JSON.stringify((function(){ var o={n:0, noLabel:0, dup:0, notOne:0, noRuler:0};
    globalLevel=2; m4TypeFilter='mesures'; showFamily('qcm');
    for(var i=0;i<400;i++){ newQCM(); if(m4Current.question.indexOf('plus grande')===-1) continue; o.n++;
      var labels=[].map.call(document.querySelectorAll('#m4-choices .choice-btn'), function(b){ return b.textContent.trim(); });
      if(labels.length!==4 || labels.some(function(l){ return !/\\d/.test(l) || !/(cm|m)$/.test(l); })) o.noLabel++;
      if(new Set(labels).size!==4) o.dup++;
      if(m4Current.choices.filter(function(c){ return c.ok; }).length!==1) o.notOne++;
      if(!document.querySelector('#m4Svg line') || !/1 m = 100 cm/.test(document.getElementById('m4Svg').textContent)) o.noRuler++; }
    return o; })())`));
  chk(r.n > 20, r.n + ' questions « plus grande longueur » tirées');
  chk(r.noLabel === 0, 'les 4 valeurs (avec chiffres et unité) sont écrites sur les boutons');
  chk(r.dup === 0 && r.notOne === 0, 'valeurs distinctes, une seule bonne réponse');
  chk(r.noRuler === 0, 'la règle « 1 m = 100 cm » est dessinée');
  const clipped = await page.evaluate(() => { const svg = document.getElementById('m4Svg'), vb = svg.viewBox.baseVal; return [...svg.querySelectorAll('text')].filter(t => { const b = t.getBBox(); return b.x < vb.x - 0.5 || b.x + b.width > vb.x + vb.width + 0.5; }).length; });
  chk(clipped === 0, 'aucun texte du dessin n\'est coupé');
  console.log(bad ? 'ÉCHEC' : 'OK');
});
