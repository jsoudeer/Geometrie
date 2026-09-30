// Mode Manuel : aucun niveau choisi ni épreuve tant qu'on n'a pas touché un niveau ; ce toucher affiche l'épreuve
// et replie les options ; pas de minuterie de repli.
const { withPage, SHOTS } = require('./lib');
withPage({ page: 'index_test.html', viewport: { width: 390, height: 900 } }, async (page) => {
  let bad = 0; const chk = (ok, msg) => { console.log(ok ? '  ok' : '  ✘', msg); if (!ok) bad++; };
  const vis = id => page.evaluate(i => !document.getElementById(i).hidden, id);
  const levels = () => page.evaluate(() => [...document.querySelectorAll('#manual-level-row .level-btn')].map(b => b.textContent + (b.classList.contains('active') ? '*' : '')));
  await page.click('#menu-btn'); await page.click('.tab-btn[data-tab="manuel"]');
  chk(await vis('manual-picker') && !(await vis('practice-exercise')), 'entrée en Manuel : pas d\'épreuve');
  await page.evaluate(() => [...document.querySelectorAll('#manual-family-row .level-btn')].find(x => x.textContent.includes('Solides')).click());
  chk(!(await vis('practice-exercise')) && await vis('manual-activity-picker'), 'activité choisie : toujours pas d\'épreuve, options visibles');
  chk(JSON.stringify(await levels()) === '["Facile","Moyen","Difficile"]', 'aucun niveau présélectionné : ' + JSON.stringify(await levels()));
  await page.screenshot({ path: SHOTS + 'man_1.png' });
  await page.waitForTimeout(6000);
  chk(await vis('manual-activity-picker') && !(await vis('practice-exercise')), 'après 6 s : pas de repli automatique');
  await page.evaluate(() => [...document.querySelectorAll('#manual-level-row .level-btn')].find(x => x.textContent.includes('Moyen')).click());
  chk(await vis('practice-exercise') && !(await vis('manual-activity-picker')), 'toucher Moyen : épreuve affichée ET options repliées');
  chk(JSON.stringify(await levels()) === '["Facile","Moyen*","Difficile"]', 'Moyen sélectionné');
  await page.screenshot({ path: SHOTS + 'man_2.png' });
  chk(await vis('manual-show-activities-btn'), 'bouton Afficher les activités');
  await page.click('#manual-show-activities-btn');
  chk(await vis('manual-activity-picker') && /Masquer/.test(await page.textContent('#manual-show-activities-btn')), 'afficher puis « Masquer »');
  await page.click('#manual-show-activities-btn');
  chk(!(await vis('manual-activity-picker')), 'masquer');
  // changer d'activité : retour à « pas d'épreuve » jusqu'au choix du niveau
  await page.click('#manual-show-activities-btn');
  await page.evaluate(() => [...document.querySelectorAll('#manual-family-row .level-btn')].find(x => x.textContent.includes('Quizz')).click());
  chk(!(await vis('practice-exercise')) && JSON.stringify(await levels()) === '["Facile","Moyen","Difficile"]', 'nouvelle activité : épreuve masquée, niveaux vierges');
  // quizz : changer de thème/type réinitialise aussi le niveau
  await page.evaluate(() => [...document.querySelectorAll('#manual-level-row .level-btn')].find(x => x.textContent.includes('Facile')).click());
  chk(await vis('practice-exercise'), 'Quizz : niveau touché → épreuve');
  await page.click('#manual-show-activities-btn');
  await page.evaluate(() => document.querySelectorAll('#manual-qcm-cat-row .level-btn')[2].click());
  chk(!(await vis('practice-exercise')) && await vis('manual-activity-picker'), 'changer de thème : niveau à rechoisir');
  // un atelier (sans niveaux) démarre tout de suite
  await page.evaluate(() => { const n = [...document.querySelectorAll('#manual-family-row .level-btn')].map(x => x.textContent); });
  const themes = await page.evaluate(() => [...document.querySelectorAll('#manual-family-row .level-btn')].map(x => x.textContent));
  console.log('thèmes :', themes.join(' | '));
  // retour à Facile (auto) puis Manuel : cohérent
  await page.click('#menu-btn'); await page.click('.tab-btn[data-tab="facile"]');
  chk(await vis('practice-exercise') && !(await vis('manual-picker')), 'Facile (auto) : épreuve visible comme avant');
  await page.click('#menu-btn'); await page.click('.tab-btn[data-tab="manuel"]');
  chk(!(await vis('practice-exercise')) && await vis('manual-activity-picker'), 'retour en Manuel sans niveau choisi : options visibles, pas d\'épreuve');
  console.log(bad ? 'ÉCHEC' : 'OK');
});
