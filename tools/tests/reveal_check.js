// Reveal d'un nouveau personnage : silhouette qui grossit et pivote, puis dévoilée ; son propre à chaque clan.
const { withPage, SHOTS } = require('./lib');
withPage({ page: 'index_test.html', viewport: { width: 390, height: 800 } }, async (page) => {
  const ev = c => page.evaluate(x => window.__t.__eval(x), c);
  let bad = 0; const chk = (ok, msg) => { console.log(ok ? '  ok' : '  ✘', msg); if (!ok) bad++; };
  const stings = [];
  await page.exposeFunction('__sting', s => stings.push(s));
  await ev(`(function(){ var o=playRevealSting; playRevealSting=function(s){ window.__sting(s); o(s); }; })()`);
  for (const side of ['cats', 'brainrot']) {
    await ev(`applyTheme('${side}'); stars=500; document.getElementById('starCount').textContent=500; renderShop();`);
    await page.click('#stars-btn');
    await page.evaluate(() => { window.__rv0 = performance.now(); });
    await page.evaluate(() => [...document.querySelectorAll('#shop-grid .sp-buy:not(.sp-info):not([disabled])')][0].click());
    await page.waitForTimeout(300);
    chk(await page.evaluate(() => { const o = document.getElementById('reveal-overlay'); return !!o && o.classList.contains('spinning'); }), side + ' : silhouette qui tourne');
    const f0 = await page.evaluate(() => getComputedStyle(document.querySelector('.rv-art.sil')).filter);
    chk(/brightness\(0\)/.test(f0), side + ' : silhouette noire (' + f0 + ')');
    await page.screenshot({ path: SHOTS + 'rv_' + side + '_1.png' });
    // rotation finie, pause de face (≈ 2,1 à 2,35 s) : on guette ce moment image par image
    // plutôt que d'attendre une durée fixe (instable quand la machine est chargée)
    await page.waitForFunction(() => {
      const o = document.getElementById('reveal-overlay'); if (!o || !o.classList.contains('spinning')) return false;
      if (performance.now() - window.__rv0 < 2000) return false;
      const m = new DOMMatrix(getComputedStyle(document.querySelector('.rv-spinner')).transform);
      return Math.abs(m.a - 1) < 0.02 && Math.abs(m.b) < 0.02;
    }, null, { polling: 'raf', timeout: 5000 }).catch(() => {});
    const pause = await page.evaluate(() => { const o = document.getElementById('reveal-overlay'); const m = new DOMMatrix(getComputedStyle(document.querySelector('.rv-spinner')).transform); return { cls: o.className, a: m.a, b: m.b, col: getComputedStyle(document.querySelector('.rv-art.col')).clipPath }; });
    chk(Math.abs(pause.a - 1) < 0.02 && Math.abs(pause.b) < 0.02 && /spinning/.test(pause.cls) && /100%/.test(pause.col), side + ' : déjà de face, toujours en ombre (' + pause.cls.replace('reveal-overlay ', '') + ')');
    await page.screenshot({ path: SHOTS + 'rv_' + side + '_2.png' });
    await page.waitForTimeout(650);           // balayage en cours
    chk(await page.evaluate(() => document.getElementById('reveal-overlay').classList.contains('scanning')), side + ' : balayage lumineux en cours');
    await page.screenshot({ path: SHOTS + 'rv_' + side + '_scan.png' });
    await page.waitForTimeout(1100);
    chk(await page.evaluate(() => document.getElementById('reveal-overlay').classList.contains('shown')), side + ' : personnage dévoilé');
    await page.waitForTimeout(600);
    await page.screenshot({ path: SHOTS + 'rv_' + side + '_3.png' });
    const f1 = await page.evaluate(() => getComputedStyle(document.querySelector('.rv-art.col')).clipPath);
    chk(f1 === 'none', side + ' : pleine couleur (' + f1 + ')');
    await page.click('.rv-ok');
    await page.waitForTimeout(150);
    chk(await page.evaluate(() => !document.getElementById('reveal-overlay')), side + ' : se ferme');
    await page.click('#stars-btn');
  }
  chk(JSON.stringify(stings) === '["cats","brainrot"]', 'son propre à chaque clan : ' + JSON.stringify(stings));
  // toucher pendant l'animation = passer à la fin
  await ev(`applyTheme('cats'); showReveal([CAT_REWARDS[0]], 'Défi réussi !')`);
  await page.waitForTimeout(200); await page.click('#reveal-overlay');
  chk(await page.evaluate(() => document.getElementById('reveal-overlay').classList.contains('shown')), 'un toucher passe directement au dévoilement');
  chk(stings.length === 3, 'le son est bien joué même quand on passe l\'animation');
  await page.keyboard.press('Escape');
  chk(await page.evaluate(() => !document.getElementById('reveal-overlay')), 'Échap ferme');
  console.log(bad ? 'ÉCHEC' : 'OK');
});
