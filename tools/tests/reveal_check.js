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
    await page.evaluate(() => [...document.querySelectorAll('#shop-grid .sp-buy:not(.sp-info):not([disabled])')][0].click());
    await page.waitForTimeout(300);
    chk(await page.evaluate(() => !!document.getElementById('reveal-overlay') && !document.getElementById('reveal-overlay').classList.contains('shown')), side + ' : silhouette en cours');
    const f0 = await page.evaluate(() => getComputedStyle(document.querySelector('.rv-art')).filter);
    chk(/brightness\(0\)/.test(f0), side + ' : silhouette noire (' + f0 + ')');
    await page.screenshot({ path: SHOTS + 'rv_' + side + '_1.png' });
    await page.waitForTimeout(1100);
    await page.screenshot({ path: SHOTS + 'rv_' + side + '_2.png' });
    await page.waitForTimeout(1300);
    chk(await page.evaluate(() => document.getElementById('reveal-overlay').classList.contains('shown')), side + ' : personnage dévoilé');
    await page.waitForTimeout(700);
    await page.screenshot({ path: SHOTS + 'rv_' + side + '_3.png' });
    const f1 = await page.evaluate(() => getComputedStyle(document.querySelector('.rv-art')).filter);
    chk(/brightness\(1\)|none/.test(f1), side + ' : pleine couleur (' + f1 + ')');
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
  await page.keyboard.press('Escape');
  chk(await page.evaluate(() => !document.getElementById('reveal-overlay')), 'Échap ferme');
  console.log(bad ? 'ÉCHEC' : 'OK');
});
