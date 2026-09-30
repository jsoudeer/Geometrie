const { withPage, SHOTS } = require('./lib');
withPage({ viewport: { width: 390, height: 900 }, init: "localStorage.setItem('geo_theme','cats')" }, async (page) => {
  await page.evaluate(() => document.getElementById('menu-btn').click());
  await page.click('.tab-btn[data-tab="manuel"]');
  await page.evaluate(() => [...document.querySelectorAll('#manual-family-row .level-btn')].find(x => x.textContent.includes('Solides')).click());
  await page.evaluate(() => [...document.querySelectorAll('#manual-level-row .level-btn')].find(x => x.textContent.includes('Difficile')).click());
  await page.waitForTimeout(200);
  const want = { five: false, seven: false, trou: false };
  for (let i = 0; i < 120 && !(want.five && want.seven && want.trou); i++) {
    const info = await page.evaluate(() => ({ faces: document.querySelectorAll('#netEl .face').length, tri: document.querySelectorAll('.face-tri').length }));
    const kind = info.tri === 0 && info.faces === 5 ? 'five' : info.tri === 0 && info.faces === 7 ? 'seven' : info.tri === 3 ? 'trou' : null;
    if (kind && !want[kind]) {
      want[kind] = true;
      await page.evaluate(() => [...document.querySelectorAll('#m3-choices .choice-btn')].find(b => b.textContent.includes('Cube') || b.textContent.includes('Pyramide')).click());
      await page.waitForTimeout(400);
      console.log(kind, '→ feedback:', await page.evaluate(() => document.getElementById('m3-feedback').textContent));
      console.log('   sub:', await page.evaluate(() => document.getElementById('m3-sub').textContent));
      console.log('   tappable class:', await page.evaluate(() => document.getElementById('m3-feedback').classList.contains('tappable')));
      if (kind === 'five') {
        await page.waitForTimeout(3000);
        console.log('   broken faces highlighted:', await page.evaluate(() => document.querySelectorAll('.face.broken').length));
        await page.screenshot({ path: SHOTS + 'n_five.png' });
        // clic sur l'explication -> question suivante
        const before = await page.evaluate(() => document.getElementById('m3-feedback').className);
        await page.click('#m3-feedback');
        await page.waitForTimeout(300);
        console.log('   after tap: feedback class:', before, '->', await page.evaluate(() => document.getElementById('m3-feedback').className));
        continue;
      }
    }
    await page.evaluate(() => { const n = document.getElementById('m3-next'); if (!n.hidden) n.click(); else document.getElementById('m3-feedback').click(); });
    await page.waitForTimeout(150);
    // si pas de feedback affiché on force nouvelle question via bouton manuel
    await page.evaluate(() => { const b = document.querySelector('#m3-choices .choice-btn'); if (b && !b.disabled) { b.click(); } });
    await page.waitForTimeout(100);
    await page.evaluate(() => document.getElementById('m3-next').click());
    await page.waitForTimeout(100);
  }
  console.log(JSON.stringify(want));
});
