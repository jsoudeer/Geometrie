// Arrêter un chrono avant la fin : l'accord de l'enfant est demandé (chrono en pause) ;
// s'il a déjà atteint l'objectif du défi, il l'obtient ; sinon il abandonne sans rien gagner.
const { withPage } = require('./lib');
withPage({ page: 'index_test.html' }, async (page) => {
  let bad = 0; const chk = (ok, msg) => { console.log(ok ? '  ok' : '  ✘ ÉCHEC', msg); if (!ok) bad++; };
  const ev = c => page.evaluate(x => window.__t.__eval(x), c);
  const open = () => page.evaluate(() => !document.getElementById('info-overlay').hidden);
  // comme l'enfant : on touche « Chronométré » (3e bouton), puis on lance
  const start = async (score) => {
    await ev(`appMode='auto'; globalLevel=0; countdownSeconds=60; 0`);
    await page.evaluate(() => document.querySelectorAll('#practice-mode .level-btn')[2].click());
    await ev(`startCountdown(); countdownScore={correct:${score},total:${score}}; 0`);
  };
  // 1. objectif non atteint : demande d'accord, pause, « Continuer » reprend
  await start(2);
  await ev('quitCountdown(); 0');
  chk(await open(), 'la fenêtre d\'accord s\'ouvre');
  chk(await ev('countdownRunning') === true, 'le chrono n\'est pas arrêté avant l\'accord');
  const t0 = await ev('Math.ceil((countdownEndAt - Date.now())/1000)');
  await page.waitForTimeout(1500);
  const txt = await page.evaluate(() => document.getElementById('info-body').textContent);
  chk(/Il te manque 3/.test(txt), 'indique ce qui manque pour le défi : ' + txt.slice(0, 80));
  await page.click('#info-body .btn.primary'); await page.waitForTimeout(100);
  chk(!(await open()) && await ev('countdownRunning') === true && await ev('countdownPaused') === false, '« Continuer » ferme et le chrono continue');
  const t1 = await ev('Math.ceil((countdownEndAt - Date.now())/1000)');
  chk(Math.abs(t1 - t0) <= 1, 'le temps passé dans la fenêtre n\'est pas décompté (' + t0 + ' s → ' + t1 + ' s)');
  // 2. Échap = continuer
  await ev('quitCountdown(); 0'); await page.keyboard.press('Escape'); await page.waitForTimeout(100);
  chk(await ev('countdownRunning') === true && await ev('countdownPaused') === false, 'Échap : le chrono continue');
  // 3. arrêter sans objectif : retour Aléatoire, aucune étoile, aucun défi
  const stars0 = await ev('typeof stars!=="undefined" ? stars : -1');
  await ev('quitCountdown(); 0'); await page.click('#countdown-quit-confirm'); await page.waitForTimeout(200);
  chk(await ev('countdownRunning') === false && await ev('practiceMode') === 'free', 'arrêter : retour au mode Aléatoire');
  chk(await ev('typeof stars!=="undefined" ? stars : -1') === stars0, 'aucune étoile sans objectif');
  // 4. objectif atteint : « Arrêter » donne le défi (manche terminée)
  const k = 0; // Facile, 1 min
  await ev(`ownedCats={}; 0`);
  const target = await ev('TIMED_TARGETS[0][0]');
  await start(target);
  await ev('quitCountdown(); 0');
  chk(/déjà atteint/.test(await page.evaluate(() => document.getElementById('info-body').textContent)), 'annonce que l\'objectif est atteint');
  await page.click('#countdown-quit-confirm'); await page.waitForTimeout(500);
  chk(await ev('countdownRunning') === false, 'le chrono est terminé');
  chk(await page.evaluate(() => !document.getElementById('countdown-results').hidden), 'l\'écran de résultats s\'affiche');
  chk(await ev('isChallengeDone(' + k + ')') === true, 'le défi est obtenu');
  console.log(bad ? 'ÉCHEC' : 'chrono_arret_check OK'); process.exit(bad ? 1 : 0);
});
