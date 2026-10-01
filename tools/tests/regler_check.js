// Régler l'heure : 24 positions de la petite aiguille, une seule étoile par question (Régler et Déformer).
const { withPage } = require('./lib');
const assert = require('assert');
withPage({ page: 'index_test.html', viewport: { width: 390, height: 900 } }, async (page) => {
  const ev = c => page.evaluate(x => window.__t.__eval(x), c);
  const stars = () => page.evaluate(() => +document.getElementById('starCount').textContent);
  // 1) acceptation : pour chaque niveau/cible, exactement les crans attendus (1 ou 2 à 15/45 min)
  const bad = await ev(`(function(){ var bad=[], n=0;
    for(var lvl=0;lvl<3;lvl++) for(var i=0;i<400;i++){
      globalLevel=lvl; showFamily('clock-regler'); m5rGenTarget();
      var t=m5Target, exact=((t.hour%12)+t.minute/60)*30, okTicks=[];
      for(var k=0;k<24;k++){ m5rHourTick=k; m5rMinTick=Math.round(t.minute*6/M5R_MIN_STEP[lvl]);
        var d=Math.abs(k*15-exact)%360; d=Math.min(d,360-d); if(d<=M5R_HOUR_TOL[lvl]) okTicks.push(k); }
      var want = (t.minute===15||t.minute===45) ? 2 : 1; n++;
      if(okTicks.length!==want) bad.push([lvl,t.hour,t.minute,okTicks]);
      if(M5R_HOUR_STEP[lvl]!==15) bad.push(['step',lvl]);
    } return JSON.stringify({n:n,bad:bad.slice(0,5),nbad:bad.length}); })()`);
  console.log('positions acceptées :', bad);
  assert.equal(JSON.parse(bad).nbad, 0);
  // 2) une étoile, puis la question se ferme (boutons masqués : impossible de revérifier)
  for (let lvl = 0; lvl < 3; lvl++) {
    await ev(`globalLevel=${lvl}; showFamily('clock-regler'); m5rGenTarget();
      m5rHourTick=Math.round((((m5Target.hour%12)+m5Target.minute/60)*30)/15)%24; m5rMinTick=Math.round(m5Target.minute*6/M5R_MIN_STEP[${lvl}]); drawSettableClock();`);
    const s0 = await stars();
    await page.click('#m5r-check');
    assert.equal(await stars(), s0 + 1, 'Régler L' + lvl + ' : une seule étoile');
    assert(await page.evaluate(() => document.getElementById('m5r-check').closest('.btn-row').hidden), 'Régler : boutons masqués après réussite');
    // question suivante : de nouveau possible
    await ev(`m5rGenTarget(); m5rHourTick=Math.round((((m5Target.hour%12)+m5Target.minute/60)*30)/15)%24; m5rMinTick=Math.round(m5Target.minute*6/M5R_MIN_STEP[${lvl}]); drawSettableClock();`);
    await ev(`m5rFlow.start()`);
    await page.click('#m5r-check');
    assert.equal(await stars(), s0 + 2);
  }
  // 3) Déformer : une seule étoile
  await ev(`globalLevel=0; showFamily('deform'); newDeformQuestion(); pts = shapeTargetPoints(m2ShapeIdx).map(function(p){return p.slice();}); drawDeform();`);
  const s1 = await stars();
  await page.click('#m2-check');
  console.log('Déformer : étoiles gagnées =', (await stars()) - s1);
  assert(await page.evaluate(() => document.getElementById('m2-check').closest('.btn-row').hidden), 'Déformer : boutons masqués après réussite');
  assert.equal((await stars()) - s1, 1);
  // 4) indice sur la petite aiguille mal placée
  await ev(`globalLevel=1; showFamily('clock-regler'); m5rGenTarget(); m5Target.hour=3; m5Target.minute=30; m5rHourTick=0; m5rMinTick=2; drawSettableClock();`);
  await page.click('#m5r-check');
  console.log(await page.evaluate(() => document.getElementById('m5r-feedback').textContent));
  console.log('régler OK');
});
