// Régler l'heure : la petite aiguille se pose sur une des 12 heures et SUIT la grande aiguille
// (à 8 h 10 elle est un peu après le 8) ; une seule étoile par question (Régler et Déformer).
const { withPage } = require('./lib');
const assert = require('assert');
withPage({ page: 'index_test.html', viewport: { width: 390, height: 900 } }, async (page) => {
  const ev = c => page.evaluate(x => window.__t.__eval(x), c);
  const stars = () => page.evaluate(() => +document.getElementById('starCount').textContent);
  const SET = (lvl) => `m5rHourTick=m5Target.hour%12; m5rMinTick=Math.round(m5Target.minute*6/M5R_MIN_STEP[${lvl}])%Math.round(360/M5R_MIN_STEP[${lvl}]); drawSettableClock();`;
  // 1) position affichée : l'heure choisie + 0,5° par minute (8 h 10 → 245°, 8 h 30 → 255°, 8 h 50 → 265°)
  const ang = JSON.parse(await ev(`(function(){ globalLevel=2; showFamily('clock-regler'); m5rGenTarget(); var o=[]; [[8,10],[8,30],[8,50],[12,0],[3,15]].forEach(function(t){ m5rHourTick=t[0]%12; m5rMinTick=t[1]/5; drawSettableClock(); o.push(m5rHourAngle()); }); return JSON.stringify(o); })()`));
  assert.deepEqual(ang, [245, 255, 265, 0, 97.5], 'angles affichés ' + ang);
  console.log('angles de la petite aiguille :', ang.join(', '));
  // 2) le trait dessiné suit bien cet angle (8 h 10 : un peu après le 8, pas sur le 8)
  await ev(`m5rHourTick=8; m5rMinTick=2; drawSettableClock();`);
  const tip = await page.evaluate(() => { const l = document.querySelectorAll('#m5ClockSvg line'); const h = [...l].find(x => x.getAttribute('stroke-width') === '5'); return [+h.getAttribute('x2'), +h.getAttribute('y2')]; });
  const deg = ((Math.atan2(tip[1] - 100, tip[0] - 100) * 180 / Math.PI + 90) + 360) % 360;
  assert(Math.abs(deg - 245) < 0.5, 'trait de la petite aiguille à ' + deg.toFixed(1) + '° (attendu 245°)');
  // 3) l'heure juste est acceptée à tous les niveaux, avec le bon placement ; la mauvaise heure est refusée
  const bad = await ev(`(function(){ var bad=[], n=0;
    for(var lvl=0;lvl<3;lvl++) for(var i=0;i<300;i++){
      globalLevel=lvl; showFamily('clock-regler'); m5rGenTarget();
      m5rHourTick=m5Target.hour%12; m5rMinTick=Math.round(m5Target.minute*6/M5R_MIN_STEP[lvl])%Math.round(360/M5R_MIN_STEP[lvl]);
      var okTicks=[]; for(var k=0;k<12;k++){ if(k===m5Target.hour%12) okTicks.push(k); }
      n++; if(m5rMinutes()!==m5Target.minute) bad.push(['min',lvl,m5Target.minute,m5rMinutes()]);
    } return JSON.stringify({n:n,nbad:bad.length,bad:bad.slice(0,3)}); })()`);
  assert.equal(JSON.parse(bad).nbad, 0, bad);
  // 4) une étoile, puis la question se ferme
  for (let lvl = 0; lvl < 3; lvl++) {
    await ev(`globalLevel=${lvl}; showFamily('clock-regler'); m5rGenTarget(); ${SET(lvl)}`);
    const s0 = await stars();
    await page.click('#m5r-check');
    assert.equal(await stars(), s0 + 1, 'Régler L' + lvl + ' : une seule étoile');
    assert(await page.evaluate(() => document.getElementById('m5r-check').closest('.btn-row').hidden), 'Régler : boutons masqués après réussite');
    await ev(`m5rGenTarget(); ${SET(lvl)}`); await ev(`m5rFlow.start()`);
    await page.click('#m5r-check');
    assert.equal(await stars(), s0 + 2);
  }
  // 5) mauvaise heure : refusée avec un indice qui parle de la position réelle
  await ev(`globalLevel=2; showFamily('clock-regler'); m5rGenTarget(); m5Target.hour=8; m5Target.minute=10; m5rHourTick=9; m5rMinTick=2; drawSettableClock();`);
  await page.click('#m5r-check');
  const fb = await page.evaluate(() => document.getElementById('m5r-feedback').textContent);
  console.log(fb);
  assert(/petite aiguille/.test(fb) && /8 h 10/.test(fb) && /dépassé le 8/.test(fb), 'indice : ' + fb);
  // 6) glisser au doigt : le doigt à la position AFFICHÉE d'un 8 h 10 choisit bien le 8 (et pas le 7 ni le 9)
  await ev(`m5rFlow.start(); m5rHourTick=0; m5rMinTick=2; drawSettableClock();`);
  const box = await page.evaluate(() => { const r = document.getElementById('m5ClockSvg').getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; });
  const to = (deg, len) => { const a = (deg - 90) * Math.PI / 180; return [box.x + (100 + len * Math.cos(a)) * box.w / 200, box.y + (100 + len * Math.sin(a)) * box.h / 200]; };
  const [sx, sy] = await page.evaluate(() => { const c = document.querySelector('#m5ClockSvg [data-hand="hour"]'); const r = c.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; });
  await page.mouse.move(sx, sy); await page.mouse.down();
  const [fx, fy] = to(245, 42); await page.mouse.move(fx, fy, { steps: 6 }); await page.mouse.up();
  assert.equal(await ev('m5rHourTick'), 8, 'glisser sur la position affichée de 8 h 10 → heure 8');
  // 7) Déformer : une seule étoile
  await ev(`globalLevel=0; showFamily('deform'); newDeformQuestion(); pts = shapeTargetPoints(m2ShapeIdx).map(function(p){return p.slice();}); drawDeform();`);
  const s1 = await stars();
  await page.click('#m2-check');
  assert.equal((await stars()) - s1, 1);
  console.log('régler OK');
});
