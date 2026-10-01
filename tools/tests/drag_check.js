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
  await page.mouse.move(x0, y0); await page.mouse.down();
  // 3 secondes de glisser, par grands pas (le pointeur quitte la poignée d'un mouvement à l'autre)
  for (let i = 1; i <= 60; i++) { await page.mouse.move(x0 + i * 2.5, y0 + i * 1.5); await page.waitForTimeout(50); }
  const mid = await ev('JSON.stringify(pts[0])');
  await page.mouse.up();
  const [x1, y1] = await center();
  chk(Math.abs(x1 - (x0 + 150)) < 4 && Math.abs(y1 - (y0 + 90)) < 4, 'après 3 s de glisser, la poignée suit toujours la souris (' + Math.round(x1 - x0) + ',' + Math.round(y1 - y0) + ' px sur 150,90)');
  // relâché : la souris ne déplace plus rien
  await page.mouse.move(x1 + 40, y1 + 40);
  const [x2, y2] = await center();
  chk(x2 === x1 && y2 === y1, 'souris relâchée : la poignée reste en place');
  // glisser très rapide (un seul grand saut)
  await page.mouse.move(x2, y2); await page.mouse.down(); await page.mouse.move(x2 - 60, y2 - 20, { steps: 2 }); await page.mouse.up();
  const [x3] = await center();
  chk(Math.abs(x3 - (x2 - 60)) < 4, 'glisser rapide suivi');
  console.log(bad ? 'ÉCHEC' : 'OK');
});
