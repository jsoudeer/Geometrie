// Parcours au clavier seul (RGAA 7.3 et 12.8) :
//  - Régler l'heure : chaque aiguille est un curseur manipulable aux flèches ;
//  - répondre au clavier ferme la question et laisse le focus sur le retour ;
//    Entrée sur le retour passe à la question suivante, dont la bulle reçoit le focus.
const { withPage } = require('./lib');
withPage({ page: 'index_test.html', viewport: { width: 390, height: 900 } }, async (page) => {
  const ev = c => page.evaluate(x => window.__t.__eval(x), c);
  let bad = 0; const chk = (ok, msg) => { console.log(ok ? '  ok' : '  ✘', msg); if (!ok) bad++; };
  await ev(`appMode='manual'; manualFamily='clock-regler'; globalLevel=0; generateFamilyQuestion('clock-regler'); m5Target.hour=3; m5Target.minute=30; m5rHourTick=0; m5rMinTick=0; drawSettableClock();`);
  // petite aiguille : 3 h 30 → 7 crans de 15° (à mi-chemin entre 3 et 4) ; grande : 1 cran (sur le 6)
  await page.focus('#m5ClockSvg [data-hand="hour"]');
  for (let i = 0; i < 7; i++) await page.keyboard.press('ArrowRight');
  chk(await page.evaluate(() => document.activeElement.getAttribute('data-hand')) === 'hour', 'le focus reste sur la petite aiguille après chaque cran');
  chk(await page.evaluate(() => document.activeElement.getAttribute('aria-valuetext')) === 'entre le 3 et le 4', 'position annoncée : ' + await page.evaluate(() => document.activeElement.getAttribute('aria-valuetext')));
  await page.keyboard.press('Tab');
  chk(await page.evaluate(() => document.activeElement.getAttribute('data-hand')) === 'minute', 'Tab passe à la grande aiguille');
  await page.keyboard.press('ArrowRight');
  chk(/30 minutes/.test(await page.evaluate(() => document.activeElement.getAttribute('aria-valuetext'))), 'grande aiguille sur le 6 (30 minutes)');
  await page.focus('#m5r-check'); await page.keyboard.press('Enter');
  chk(await page.evaluate(() => document.getElementById('m5r-feedback').classList.contains('good')), 'réglée au clavier : bonne réponse');
  chk(await page.evaluate(() => document.activeElement.id) === 'm5r-feedback', 'le focus passe sur le retour (les boutons ont disparu)');
  await page.keyboard.press('Enter');
  chk(await page.evaluate(() => document.activeElement.classList.contains('coach-bubble')), 'Entrée : question suivante, focus sur la nouvelle question');
  // même chose avec un quiz
  await ev(`manualFamily='qcm'; generateFamilyQuestion('qcm');`);
  await page.focus('#m4-choices .choice-btn'); await page.keyboard.press('Enter');
  chk(await page.evaluate(() => document.activeElement.id) === 'm4-feedback', 'quiz : focus sur le retour après la réponse');
  console.log(bad ? 'ÉCHEC (' + bad + ')' : 'OK');
});
