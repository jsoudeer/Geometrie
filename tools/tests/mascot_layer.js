const { withPage, SHOTS } = require('./lib');
withPage({ viewport: { width: 390, height: 700 }, init: `localStorage.setItem('geo_theme','brainrot'); localStorage.setItem('geo_mascot_id','br02');` }, async (page) => {
  await page.waitForTimeout(500);
  await page.evaluate(() => { document.getElementById('menu-btn').click(); });
  await page.click('.tab-btn[data-tab="manuel"]');
  await page.evaluate(() => [...document.querySelectorAll('#manual-family-row .level-btn')].find(x => x.textContent.includes('Quizz')).click());
  await page.evaluate(() => [...document.querySelectorAll('#manual-qcm-type-row .level-btn')].find(x => x.textContent.includes('Nom de la forme')).click());
  await page.waitForTimeout(5800);
  await page.screenshot({ path: SHOTS + 'm_layer.png' });
  console.log('dock z-index', await page.evaluate(() => getComputedStyle(document.getElementById('mascot-dock')).zIndex), 'opacity', await page.evaluate(() => getComputedStyle(document.getElementById('mascot-dock')).opacity));
  console.log('mascot icon html:', await page.evaluate(() => document.getElementById('mascotIcon').innerHTML.slice(0, 80)));
});
