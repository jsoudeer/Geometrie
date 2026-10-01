// Déformer : les 5 formes cibles (dont triangle isocèle et rectangle) se construisent, se vérifient, et la cible fabriquée est bien valide.
const { withPage } = require('./lib');
withPage({ page: 'index_test.html', viewport: { width: 390, height: 900 } }, async (page) => {
  const ev = c => page.evaluate(x => window.__t.__eval(x), c);
  let bad = 0; const chk = (ok, m) => { console.log(ok ? '  ok' : '  ✘', m); if (!ok) bad++; };
  const r = JSON.parse(await ev(`(function(){ var out=[];
    for(var idx=0; idx<5; idx++){ var okT=0, okStart=0, N=60;
      for(var i=0;i<N;i++){
        m2ShapeIdx=idx; var t=shapeTargetPoints(idx); pts=t.map(function(p){return p.slice();});
        var lv=M2_LEVELS[idx]; if(lv.check(lv.tolGreat, lv.tolOk).ok) okT++;
        globalLevel=i%3; newDeformQuestion(); if(m2ShapeIdx!==idx){ continue; } if(lv.check(lv.tolGreat, lv.tolOk).ok) okStart++;
      } out.push([M2_LEVELS[idx].name, okT, okStart, N]); }
    return JSON.stringify(out); })()`));
  r.forEach(([n, t, s, N]) => chk(t === N && true, n + ' : cible valide ' + t + '/' + N + ', départ déjà réussi ' + s + '/' + N));
  // les 5 formes sortent bien (sac) et le dessin a 3 ou 4 poignées
  const seen = {}; let handlesOk = true;
  for (let i = 0; i < 10; i++) {
    await ev('globalLevel=1; newDeformQuestion();');
    const idx = await ev('m2ShapeIdx'); seen[idx] = 1;
    const h = await page.evaluate(() => document.querySelectorAll('#deformSvg circle.handle').length);
    if (h !== (idx >= 3 ? 3 : 4)) handlesOk = false;
  }
  chk(Object.keys(seen).length === 5, '10 tirages couvrent les 5 formes : ' + Object.keys(seen));
  chk(handlesOk, '3 poignées pour un triangle, 4 sinon');
  console.log(bad ? 'ÉCHEC' : 'OK');
});
