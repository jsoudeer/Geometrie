// Avancement automatique en mode Aléatoire (et pas en Chronométré / quand désactivé).
const { withPage } = require('./lib');
const assert = require('assert');
withPage({ page: 'index_test.html', viewport: { width: 390, height: 900 } }, async (page) => {
  const ev = c => page.evaluate(x => window.__t.__eval(x), c);
  const lvl = () => ev('globalLevel');
  await page.evaluate(() => document.getElementById('menu-btn').click());
  await page.click('.tab-btn[data-tab="facile"]');
  await page.evaluate(() => [...document.querySelectorAll('#practice-mode .level-btn')].find(x => x.textContent.includes('Aléatoire')).click());
  // désactivé : pas d'avancement
  await ev('autoAdvanceEnabled=false');
  for (let i = 0; i < 6; i++) await page.evaluate(() => window.__t.onPracticeAnswered(true));
  await page.waitForTimeout(900);
  assert.equal(await lvl(), 0, 'sans avancement auto, on reste en Facile');
  // activé, seuil 5
  await ev('autoAdvanceEnabled=true; autoAdvanceThreshold=5; resetFreeStreak();');
  for (let i = 0; i < 4; i++) await page.evaluate(() => window.__t.onPracticeAnswered(true));
  await page.waitForTimeout(900);
  assert.equal(await lvl(), 0, '4 bonnes réponses : pas encore');
  await page.evaluate(() => window.__t.onPracticeAnswered(false));   // une erreur remet le compteur à zéro
  for (let i = 0; i < 4; i++) await page.evaluate(() => window.__t.onPracticeAnswered(true));
  await page.waitForTimeout(900);
  assert.equal(await lvl(), 0, 'erreur puis 4 bonnes : toujours Facile');
  await page.evaluate(() => window.__t.onPracticeAnswered(true));
  await page.waitForTimeout(1000);
  assert.equal(await lvl(), 1, '5 d\'affilée : Moyen');
  console.log('onglet actif :', await page.evaluate(() => document.querySelector('.tab-btn.active').dataset.tab), '| série remise à', await page.evaluate(() => window.__t.getStreak()));
  for (let i = 0; i < 5; i++) await page.evaluate(() => window.__t.onPracticeAnswered(true));
  await page.waitForTimeout(1000);
  assert.equal(await lvl(), 2, 'puis Difficile');
  for (let i = 0; i < 12; i++) await page.evaluate(() => window.__t.onPracticeAnswered(true));
  await page.waitForTimeout(900);
  assert.equal(await lvl(), 2, 'Difficile est le dernier niveau');
  // chrono : jamais
  await page.evaluate(() => document.getElementById('menu-btn').click());
  await page.click('.tab-btn[data-tab="facile"]');
  await page.evaluate(() => [...document.querySelectorAll('#practice-mode .level-btn')].find(x => x.textContent.includes('Chrono')).click());
  await page.click('#countdown-start-btn');
  for (let i = 0; i < 8; i++) await page.evaluate(() => window.__t.onPracticeAnswered(true));
  await page.waitForTimeout(900);
  assert.equal(await lvl(), 0, 'pas d\'avancement en chrono');
  console.log('avancement auto OK');
});
