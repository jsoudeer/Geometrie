// Milieu : une seule bonne réponse, « Aucune forme » parfois juste, variantes coordonnées au niveau difficile.
const { withPage, SHOTS } = require('./lib');
withPage({ page: 'index_test.html', viewport: { width: 390, height: 900 } }, async (page) => {
  const ev = c => page.evaluate(x => window.__t.__eval(x), c);
  let bad = 0; const chk = (ok, m) => { console.log(ok ? '  ok' : '  ✘', m); if (!ok) bad++; };
  const r = JSON.parse(await ev(`(function(){ var o=[]; for(var lv=0;lv<3;lv++){ var one=0, uniq=0, none=0, coord=0, n=300, sizes={};
    for(var i=0;i<n;i++){ var q=quizTypeById('milieu').generate(lv); var oks=q.choices.filter(function(c){return c.ok;});
      if(oks.length===1) one++; var labs={}; q.choices.forEach(function(c){labs[c.label]=1;}); if(Object.keys(labs).length===q.choices.length) uniq++;
      if(oks[0] && oks[0].label==='Aucune forme') none++; if(/coordonnées/.test(q.question)) coord++; sizes[q.choices.length]=1;
      q.draw(); }
    o.push([lv,one,uniq,none,coord,Object.keys(sizes).join(',')]); } return JSON.stringify(o); })()`));
  r.forEach(([lv, one, uniq, none, coord, sizes]) => chk(one === 300 && uniq === 300, 'niveau ' + lv + ' : 1 seule bonne réponse, propositions distinctes (tailles ' + sizes + ')'));
  chk(r[0][3] === 0 && r[0][4] === 0, 'facile : toujours une forme au milieu, pas de coordonnées');
  chk(r[1][3] > 60 && r[1][3] < 180 && r[1][4] === 0, 'moyen : « Aucune forme » juste dans ~40 % des cas (' + r[1][3] + '/300)');
  chk(r[2][4] > 100 && r[2][4] < 200 && r[2][3] > 20, 'difficile : ~50 % de coordonnées (' + r[2][4] + '/300), + cas « aucune » (' + r[2][3] + ')');
  for (const [i, t] of [[1, 'moyen_aucune'], [2, 'coord']]) {
    await ev(`globalLevel=${i}; m4TypeFilter='milieu'; showFamily('qcm'); (function(){ for(var k=0;k<200;k++){ newQCM(); var q=m4Current; if(${i}===1 ? q.choices.some(function(c){return c.ok && c.label==='Aucune forme';}) : /coordonnées/.test(q.question)) break; } })()`);
    await page.waitForTimeout(900); await page.screenshot({ path: SHOTS + 'milieu_' + t + '.png' });
  }
  await ev(`m4TypeFilter='random'`);
  console.log(bad ? 'ÉCHEC' : 'OK');
});
