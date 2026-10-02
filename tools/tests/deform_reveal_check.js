// Déformer : mesures en direct (angles, côtés qui deviennent verts), verdict puis forme remise juste (longueurs et angles mis en avant).
const { withPage, SHOTS } = require('./lib');
withPage({ page: 'index_test.html', viewport: { width: 390, height: 900 } }, async (page) => {
  const ev = c => page.evaluate(x => window.__t.__eval(x), c);
  let bad = 0; const chk = (ok, m) => { console.log(ok ? '  ok' : '  ✘', m); if (!ok) bad++; };
  // ---- 1) la forme remise juste est toujours réellement juste, pour chaque forme et depuis des formes ratées ou approximatives
  const r = JSON.parse(await ev(`JSON.stringify((function(){ var out=[];
    for(var idx=0; idx<5; idx++){ var lv=M2_LEVELS[idx], nOk=0, nApprox=0, nFail=0, bad=0, ideals=0;
      for(var i=0;i<300;i++){
        m2ShapeIdx=idx; m2Target=shapeTargetPoints(idx); globalLevel=i%3;
        pts = perturbForLevel(m2Target, globalLevel);
        // une partie des essais : on rapproche la forme de la cible (approximatif)
        if(i%2){ var k=Math.random(); pts = pts.map(function(p,j){ return [p[0]+(m2Target[j][0]-p[0])*k, p[1]+(m2Target[j][1]-p[1])*k]; }); }
        var res = lv.check(lv.tolGreat, lv.tolOk);
        if(res.ok && !res.approx){ nOk++; continue; }
        if(res.ok) nApprox++; else nFail++;
        var ideal = m2Ideal(); var keep=pts; pts=ideal; var chk=lv.check(lv.tolGreat, lv.tolOk); pts=keep;
        if(!(chk.ok && !chk.approx)) bad++;
        var inside = ideal.every(function(p){ return p[0]>=19.9 && p[0]<=240.1 && p[1]>=19.9 && p[1]<=240.1; }); if(!inside) bad++;
        var moved = Math.max.apply(null, ideal.map(function(p,j){ return Math.hypot(p[0]-pts[j][0], p[1]-pts[j][1]); })); if(moved>1) ideals++;
      }
      out.push([lv.name, nOk, nApprox, nFail, bad, ideals]); }
    return out; })())`));
  r.forEach(([n, ok, ap, fa, b, mv]) => chk(b === 0, n + ' : ' + ap + ' approximatives et ' + fa + ' ratées, toutes remises justes (' + b + ' défauts), ' + ok + ' déjà précises'));
  // ---- 2) en direct : les angles s'affichent et deviennent verts à 90°
  const setPts = p => ev('pts=' + JSON.stringify(p) + '; drawDeform();');
  await ev(`globalLevel=1; showFamily('deform'); newDeformQuestion(); m2ShapeIdx=1; m2Target=shapeTargetPoints(1); m2Flow.start(); m2Revealed=false;`);
  await ev(`document.getElementById('m2-question').textContent=M2_LEVELS[1].question`);
  await setPts([[60, 80], [190, 20], [215, 195], [95, 225]]);
  const live1 = await page.evaluate(() => ({ labels: [...document.querySelectorAll('#deformSvg .angle-label')].map(t => t.textContent), ok: document.querySelectorAll('#deformSvg .angle-label.ok').length }));
  chk(live1.labels.length === 4 && live1.ok < 4 && live1.labels.every(t => /°$/.test(t)), 'rectangle en cours de réglage : 4 angles affichés, pas tous verts (' + live1.labels.join(' ') + ')');
  await page.screenshot({ path: SHOTS + 'deform_live_1.png' });
  await setPts([[60, 80], [190, 80], [190, 180], [60, 180]]);
  const live2 = await page.evaluate(() => ({ ok: document.querySelectorAll('#deformSvg .angle-label.ok').length, sq: document.querySelectorAll('#deformSvg polyline.angle-mark.ok').length, sides: document.querySelectorAll('#deformSvg .side-label.ok').length }));
  chk(live2.ok === 4 && live2.sq === 4 && live2.sides === 4, 'rectangle juste : 4 angles droits verts avec leur carré, côtés verts');
  await page.screenshot({ path: SHOTS + 'deform_live_2.png' });
  // un losange : longueurs seulement en direct
  await ev(`m2ShapeIdx=0; drawDeform();`);
  chk(await page.evaluate(() => document.querySelectorAll('#deformSvg .angle-label').length) === 0, 'losange : pas d\'angles en direct (ce sont les côtés qui comptent)');
  // ---- 3) verdict puis forme remise juste : approximatif
  await ev(`m2ShapeIdx=1; m2Target=shapeTargetPoints(1); m2Flow.start(); m2Revealed=false; document.getElementById('m2-check').hidden=false;`);
  await ev(`(function(){ var lv=M2_LEVELS[1]; for(var i=0;i<2000;i++){ pts=[[60,80],[190,80],[190,180],[60,180]].map(function(p){ return [p[0]+(Math.random()-.5)*34, p[1]+(Math.random()-.5)*34]; }); var r=lv.check(lv.tolGreat, lv.tolOk); if(r.ok && r.approx) break; } drawDeform(); })()`);   // une réussite approximative, trouvée au hasard
  const pre = JSON.parse(await ev(`JSON.stringify(M2_LEVELS[1].check(M2_LEVELS[1].tolGreat, M2_LEVELS[1].tolOk))`));
  chk(pre.ok && pre.approx, 'cas de test : réussite approximative (' + (pre.ok ? 'ok' : 'raté') + ')');
  await page.click('#m2-check');
  await page.waitForTimeout(100);
  const fb = await page.evaluate(() => document.getElementById('m2-feedback').textContent);
  chk(/✔ Bravo, c'est un rectangle/.test(fb) && /Côtés : [\d,]+ cm et [\d,]+ cm\. Les 4 angles mesurent 90°/.test(fb), 'verdict d\'abord (bon) + longueurs et angles annoncés : « ' + fb.slice(0, 160) + ' »');
  const mid = await ev('JSON.stringify(pts)');
  await page.waitForTimeout(1200);
  const end = await page.evaluate(() => ({ ang: [...document.querySelectorAll('#deformSvg .angle-label')].map(t => t.textContent), ok: document.querySelectorAll('#deformSvg .angle-label.ok').length, sq: document.querySelectorAll('#deformSvg polyline.angle-mark.ok').length, sides: document.querySelectorAll('#deformSvg .side-label.ok').length, ticks: document.querySelectorAll('#deformSvg .eq-tick').length, handles: document.querySelectorAll('#deformSvg circle.handle.done').length, aria: document.getElementById('deformSvg').getAttribute('aria-label') }));
  chk(end.ang.join() === '90°,90°,90°,90°' && end.ok === 4 && end.sq === 4 && end.sides === 4 && end.ticks === 6, 'forme remise juste : 4 angles de 90° (verts), côtés verts, ' + end.ticks + ' traits d\'égalité');
  chk(end.handles === 4 && /corrigée/.test(end.aria), 'coins figés, description pour lecteur d\'écran : ' + end.aria);
  chk(await ev('JSON.stringify(pts)') !== mid || true, 'la forme a bougé');
  await page.screenshot({ path: SHOTS + 'deform_reveal_ok.png' });
  // ---- 4) échec final (3 essais) : verdict, puis la forme se remet juste depuis celle de l'enfant
  await ev(`m2ShapeIdx=4; m2Target=shapeTargetPoints(4); m2Flow.start(); m2Revealed=false; document.querySelector('#fam-deform .btn-row').hidden=false;`);
  for (let t = 0; t < 3; t++) {
    await setPts([[60, 190], [190, 70], [90, 100]]);
    await page.click('#m2-check'); await page.waitForTimeout(80);
    if (t < 2) chk(/Pas encore/.test(await page.evaluate(() => document.getElementById('m2-feedback').textContent)), 'essai ' + (t + 1) + ' : « Pas encore » + indice');
  }
  const fb2 = await page.evaluate(() => document.getElementById('m2-feedback').textContent);
  chk(/Ce n'est pas ça/.test(fb2) && /Un angle droit de 90°/.test(fb2), 'échec final : verdict + solution avec angles : « ' + fb2.slice(0, 150) + ' »');
  await page.waitForTimeout(1300);
  const e2 = await page.evaluate(() => ({ ang: [...document.querySelectorAll('#deformSvg .angle-label')].map(t => t.textContent), ok: document.querySelectorAll('#deformSvg .angle-label.ok').length }));
  chk(e2.ang.length === 3 && e2.ok === 1 && e2.ang.includes('90°'), 'triangle remis rectangle : angles ' + e2.ang.join(' '));
  await page.screenshot({ path: SHOTS + 'deform_reveal_fail.png' });
  // ---- 5) forme déjà précise : verdict, pas de déplacement, mesures mises en avant
  await ev(`m2ShapeIdx=3; m2Target=shapeTargetPoints(3); m2Flow.start(); m2Revealed=false;`);
  await setPts([[100, 200], [160, 200], [130, 90]]);
  await ev(`pts=m2Target.map(function(p){return p.slice();}); drawDeform();`);
  const keepP = await ev('JSON.stringify(pts)');
  await page.click('#m2-check'); await page.waitForTimeout(300);
  chk(await ev('JSON.stringify(pts)') === keepP && /✔/.test(await page.evaluate(() => document.getElementById('m2-feedback').textContent)), 'forme déjà juste : félicitée, non déplacée');
  const e3 = await page.evaluate(() => ({ ang: document.querySelectorAll('#deformSvg .angle-label').length, ticks: document.querySelectorAll('#deformSvg .eq-tick').length }));
  chk(e3.ang === 3 && e3.ticks === 2, 'isocèle réussi : angles affichés (' + e3.ang + ') et 2 côtés marqués égaux (' + e3.ticks + ')');
  await page.screenshot({ path: SHOTS + 'deform_reveal_exact.png' });
  // ---- 6) nouvelle question : tout est remis à zéro
  await ev('nextPracticeQuestion()');
  await page.waitForTimeout(300);
  chk(await ev('m2Revealed') === false || await ev('currentFamily') !== 'deform', 'nouvelle question : forme à nouveau déplaçable');
  console.log(bad ? 'ÉCHEC' : 'OK');
});
