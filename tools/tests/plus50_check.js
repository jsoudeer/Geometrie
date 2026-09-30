const { withPage, SHOTS } = require('./lib');
withPage({ page: 'index_test.html', viewport: { width: 390, height: 700 } }, async (page) => {
  await page.click('#stars-btn');
  const before = await page.evaluate(() => +document.getElementById('starCount').textContent);
  await page.click('#shop-plus50'); await page.click('#shop-plus50');
  const r = await page.evaluate(() => ({ top: +document.getElementById('starCount').textContent, shop: +document.getElementById('shop-star-count').textContent, stored: localStorage.getItem('geo_stars'), buy: document.querySelectorAll('#shop-grid .sp-buy:not(.sp-info):not([disabled])').length }));
  console.log(before, JSON.stringify(r));
  const ok = r.top === before + 100 && r.shop === r.top && r.stored === String(r.top) && r.buy > 0;
  await page.screenshot({ path: SHOTS + 'plus50.png' });
  console.log(ok ? 'OK' : 'ÉCHEC');
});
