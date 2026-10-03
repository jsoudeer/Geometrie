// Mode débogage : « Tout débloquer » et « +50 étoiles » cachés derrière le code 0303, à ressaisir à chaque session.
const { withPage, SHOTS } = require('./lib');
withPage({ page: 'index_test.html', viewport: { width: 390, height: 844 } }, async (page) => {
  const ev = c => page.evaluate(x => window.__t.__eval(x), c);
  let bad = 0; const chk = (ok, m) => { console.log(ok ? '  ok' : '  ✘', m); if (!ok) bad++; };
  const vis = sel => page.evaluate(s => { const e = document.querySelector(s); if (!e) return false; const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== 'hidden'; }, sel);
  chk(!(await page.evaluate(() => !!document.getElementById('shop-plus50'))), 'plus de bouton « +50 ⭐ » dans la Boutique');
  await page.click('#settings-btn'); await page.waitForTimeout(300);
  chk(!(await vis('#unlock-all-btn')) && !(await vis('#debug-plus50-btn')) && !(await vis('#debug-code')), 'au départ : ni « Tout débloquer », ni « +50 », ni champ de code');
  await page.evaluate(() => document.getElementById('debug-open-btn').scrollIntoView());
  await page.click('#debug-open-btn');
  chk(await vis('#debug-code') && !(await vis('#unlock-all-btn')), 'le bouton « Mode débogage » demande un code');
  chk(await page.evaluate(() => document.getElementById('debug-code').type === 'password' && document.activeElement.id === 'debug-code'), 'champ masqué, focus dedans');
  await page.screenshot({ path: SHOTS + 'debug_code.png' });
  await page.fill('#debug-code', '1234'); await page.keyboard.press('Enter');
  chk(await vis('#debug-error') && !(await vis('#unlock-all-btn')) && await page.inputValue('#debug-code') === '', 'mauvais code : message, outils toujours cachés, champ vidé');
  const before = await ev('stars');
  await page.fill('#debug-code', '0303'); await page.keyboard.press('Enter');
  chk(await vis('#unlock-all-btn') && await vis('#debug-plus50-btn') && !(await vis('#debug-code')), 'bon code : outils visibles');
  await page.screenshot({ path: SHOTS + 'debug_tools.png' });
  await page.click('#debug-plus50-btn'); await page.click('#debug-plus50-btn');
  chk(await ev('stars') === before + 100 && await page.evaluate(() => localStorage.getItem('geo_stars')) === String(before + 100) && await page.evaluate(() => +document.getElementById('starCount').textContent) === before + 100, '+50 deux fois : étoiles ' + before + ' → ' + (before + 100) + ' (compteur et stockage)');
  await page.click('#unlock-all-btn');
  chk(await ev(`Object.keys(ownedCats).length === CAT_SPRITES.length && Object.keys(ownedBrain).length === BRAINROT_SPRITES.length`), 'tout débloquer fonctionne');
  await page.click('#debug-off-btn');
  chk(!(await vis('#unlock-all-btn')) && !(await vis('#debug-panel')), 'quitter le mode débogage cache les outils');
  await page.click('#debug-open-btn');
  chk(await vis('#debug-code') && !(await vis('#unlock-all-btn')), 'après avoir quitté, le code est redemandé');
  // une nouvelle session (rechargement) : le code est redemandé même si le stockage persiste
  await page.fill('#debug-code', '0303'); await page.keyboard.press('Enter');
  await page.reload(); await page.waitForTimeout(800);
  const startBtn = await page.$('#splash-start-btn');
  if (startBtn) { await startBtn.click(); await page.waitForTimeout(600); }
  await page.click('#settings-btn'); await page.waitForTimeout(300);
  await page.click('#debug-open-btn');
  chk(await vis('#debug-code') && !(await vis('#unlock-all-btn')) && !(await vis('#debug-plus50-btn')), 'après rechargement : code redemandé (rien n\'est mémorisé)');
  console.log(bad ? 'ÉCHEC' : 'OK');
});
