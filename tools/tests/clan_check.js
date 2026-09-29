// Vérifie : défis = seulement le clan actif ; une mascotte par clan ; aperçu plein pied en Boutique.
const { withPage, SHOTS } = require('./lib');
const assert = require('assert');
withPage({ page: 'index_test.html', viewport: { width: 390, height: 800 } }, async (page) => {
  const ev = c => page.evaluate(x => window.__t.__eval(x), c);
  const owned = () => page.evaluate(() => ({ cat: !!window.__t.ownedCats[window.__t.CAT_REWARDS[0].id], br: !!window.__t.ownedBrain[window.__t.BRAIN_REWARDS[0].id] }));
  const theme = () => page.evaluate(() => document.body.getAttribute('data-app-theme'));
  if (await theme() !== 'cats') await page.click('#theme-toggle');
  await page.evaluate(() => window.__t.completeChallenge(0));
  let o = await owned(); assert(o.cat && !o.br, 'clan chats seulement'); console.log('défi en chats -> ', JSON.stringify(o));
  await page.click('#theme-toggle');
  assert.equal(await theme(), 'brainrot');
  await page.evaluate(() => window.__t.completeChallenge(0));
  o = await owned(); assert(o.cat && o.br); console.log('puis en brainrot ->', JSON.stringify(o));
  // mascotte par clan
  await ev('unlockAllSprites()');
  await ev(`mascotIds.brainrot='br05'; saveMascot(); applyTheme('brainrot');`);
  await ev(`applyTheme('cats')`);
  assert.equal(await ev('activeMascotId()'), null, 'pas de mascotte chats');
  await ev(`mascotIds.cats='cat03'; saveMascot(); renderShop();`);
  await ev(`applyTheme('brainrot')`); assert.equal(await ev('activeMascotId()'), 'br05');
  await ev(`applyTheme('cats')`); assert.equal(await ev('activeMascotId()'), 'cat03');
  console.log('mascottes par clan OK');
  // Boutique : panneau plein pied
  await page.evaluate(() => document.getElementById('menu-btn').click());
  await page.click('.tab-btn[data-tab="arena"]').catch(()=>{});
  await page.waitForTimeout(400);
  console.log('panneau mascotte visible:', await page.evaluate(() => !document.getElementById('shop-mascot-panel').hidden), await page.evaluate(() => document.getElementById('shop-mascot-panel').textContent));
  await page.screenshot({ path: SHOTS + 'clan_shop.png' });
  await page.evaluate(() => document.querySelector('#shop-grid .sprite-card').click());
  await page.waitForTimeout(400);
  await page.screenshot({ path: SHOTS + 'clan_preview.png' });
  // migration ancienne sauvegarde
  await page.evaluate(() => { localStorage.setItem('geo_mascot_id','br07'); });
  await page.reload(); await page.waitForTimeout(500);
});
