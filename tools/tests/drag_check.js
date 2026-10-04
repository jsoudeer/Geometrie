// Déformer : glisser un coin à la souris, longtemps et vite, sans que le glisser se perde (le dessin est reconstruit à chaque mouvement).
const { withPage } = require('./lib');
withPage({ page: 'index_test.html', viewport: { width: 390, height: 900 } }, async (page) => {
  const ev = c => page.evaluate(x => window.__t.__eval(x), c);
  let bad = 0; const chk = (ok, m) => { console.log(ok ? '  ok' : '  ✘', m); if (!ok) bad++; };
  await ev("globalLevel=1; showFamily('deform'); m2ShapeIdx=0; pickFresh=pickFresh; newDeformQuestion();");
  await page.evaluate(() => document.getElementById('deformSvg').scrollIntoView({ block: 'center' }));
  await page.waitForTimeout(300);
  const center = () => page.evaluate(() => { const r = document.querySelector('#deformSvg circle.handle').getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; });
  const [x0, y0] = await center();
  // on glisse toujours vers le centre de la figure (jamais contre un bord : la poignée y est retenue)
  const sr = await page.evaluate(() => { const r = document.getElementById('deformSvg').getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; });
  const sx = x0 < sr[0] ? 1 : -1, sy = y0 < sr[1] ? 1 : -1;
  await page.mouse.move(x0, y0); await page.mouse.down();
  // 3 secondes de glisser, par grands pas (le pointeur quitte la poignée d'un mouvement à l'autre)
  for (let i = 1; i <= 60; i++) { await page.mouse.move(x0 + sx * i * 1.6, y0 + sy * i * 1.0); await page.waitForTimeout(50); }
  const mid = await ev('JSON.stringify(pts[0])');
  await page.mouse.up();
  const [x1, y1] = await center();
  chk(Math.abs(x1 - (x0 + sx * 96)) < 4 && Math.abs(y1 - (y0 + sy * 60)) < 4, 'après 3 s de glisser, la poignée suit toujours la souris (' + Math.round(x1 - x0) + ',' + Math.round(y1 - y0) + ' px sur ' + (sx * 96) + ',' + (sy * 60) + ')');
  // relâché : la souris ne déplace plus rien
  await page.mouse.move(x1 + 40, y1 + 40);
  const [x2, y2] = await center();
  chk(x2 === x1 && y2 === y1, 'souris relâchée : la poignée reste en place');
  // glisser très rapide (un seul grand saut)
  await page.mouse.move(x2, y2); await page.mouse.down(); await page.mouse.move(x2 - sx * 40, y2 - sy * 14, { steps: 2 });  // retour sur le chemin déjà parcouru : jamais contre un bord ni sur une autre poignée await page.mouse.up();
  const [x3] = await center();
  chk(Math.abs(x3 - (x2 - sx * 40)) < 4, 'glisser rapide suivi');
  console.log(bad ? 'ÉCHEC' : 'OK');
});
