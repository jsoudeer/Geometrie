// Avancement automatique en mode Aléatoire (et pas en Chronométré / quand désactivé).
const { withPage } = require('./lib');
const assert = require('assert');
withPage({ page: 'index_test.html', viewport: { width: 390, height: 900 } }, async (page) => {
  const ev = c => page.evaluate(x => window.__t.__eval(x), c);
  const lvl = () => ev('globalLevel');
  await page.evaluate(() => document.getElementById('menu-btn').click());
  await page.click('.tab-btn[data-tab="facile"]');
  await page.evaluate(() => [...document.querySelectorAll('#practice-mode .level-btn')].find(x => x.textContent.includes('Aléatoire')).click());
  // plus de réglage : toujours actif, seuil 5 par défaut
  assert.equal(await ev('autoAdvanceThreshold'), 5, 'seuil par défaut : 5 bonnes réponses');
  assert(await page.evaluate(() => !document.getElementById('auto-advance-toggle') && !document.getElementById('auto-advance-count-row')), 'plus de case ni de choix du seuil dans les réglages');
  // seuil relevé (test) : pas d'avancement
  await ev('autoAdvanceThreshold=1e9');
  for (let i = 0; i < 6; i++) await page.evaluate(() => window.__t.onPracticeAnswered(true));
  await page.waitForTimeout(900);
  assert.equal(await lvl(), 0, 'sans avancement auto, on reste en Facile');
  // seuil 5
  await ev('autoAdvanceThreshold=5; resetFreeStreak();');
  for (let i = 0; i < 4; i++) await page.evaluate(() => window.__t.onPracticeAnswered(true));
  await page.waitForTimeout(900);
  assert.equal(await lvl(), 0, '4 bonnes réponses : pas encore');
  await page.evaluate(() => window.__t.onPracticeAnswered(false));   // une erreur remet le compteur à zéro
  for (let i = 0; i < 4; i++) await page.evaluate(() => window.__t.onPracticeAnswered(true));
  await page.waitForTimeout(900);
  assert.equal(await lvl(), 0, 'erreur puis 4 bonnes : toujours Facile');
  await page.evaluate(() => window.__t.onPracticeAnswered(true));
  await page.waitForTimeout(1000);
  assert.equal(await lvl(), 0, '5 d\'affilée : le niveau ne change PAS tant que l\'enfant n\'a pas demandé la question suivante');
  const qBefore = await ev('questionSignature(currentFamily)');
  await page.waitForTimeout(1500);
  assert.equal(await ev('questionSignature(currentFamily)'), qBefore, 'la question affichée n\'est pas remplacée sous les doigts de l\'enfant');
  await ev('nextPracticeQuestion()');
  assert.equal(await lvl(), 1, 'question suivante : Moyen');
  assert.equal(await page.evaluate(() => window.__t.getStreak()), 5, 'la série sans faute est conservée au changement de niveau');
  console.log('onglet actif :', await page.evaluate(() => document.querySelector('.tab-btn.active').dataset.tab), '| série remise à', await page.evaluate(() => window.__t.getStreak()));
  for (let i = 0; i < 5; i++) await page.evaluate(() => window.__t.onPracticeAnswered(true));
  await ev('nextPracticeQuestion()');
  assert.equal(await lvl(), 2, 'puis Difficile');
  assert.equal(await page.evaluate(() => window.__t.getStreak()), 10, 'série conservée : 10');
  for (let i = 0; i < 12; i++) await page.evaluate(() => window.__t.onPracticeAnswered(true));
  await page.waitForTimeout(900);
  assert.equal(await lvl(), 2, 'Difficile est le dernier niveau');
  // (la série de 20 a pu déclencher une annonce de récompense : on la ferme)
  await page.evaluate(() => { var r=document.getElementById('reveal-overlay'); if(r) r.remove(); });
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
