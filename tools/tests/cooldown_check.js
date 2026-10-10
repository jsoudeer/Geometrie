// « Nouvelle activité » : 5 s d'attente avant de pouvoir passer ; 3 questions passées d'affilée = série sans faute perdue ;
// en Chronométré, chaque question passée coûte 5 s.
const { withPage } = require('./lib');
withPage({ page: 'index_test.html' }, async (page) => {
  let bad = 0; const chk = (ok, msg) => { console.log(ok ? '  ok' : '  ✘ ÉCHEC', msg); if (!ok) bad++; };
  const ev = c => page.evaluate(x => window.__t.__eval(x), c);
  const qcm = () => ev(`forcedQcmType='calc'; generateFamilyQuestion('qcm'); forcedQcmType=null; 0`);
  const q = () => page.evaluate(() => document.getElementById('m4-question').textContent + '|' + [...document.querySelectorAll('#m4-choices button')].map(b => b.textContent).join(','));
  const btn = () => page.evaluate(() => { const b = document.getElementById('m4-next'); return { dis: b.disabled, txt: b.textContent }; });
  // ---- attente de 5 s
  await ev(`SKIP_COOLDOWN_MS = 5000; setAppMode('auto'); practiceMode='free'; 0`);
  await qcm(); await page.waitForTimeout(300);
  let b = await btn();
  chk(b.dis && /\((4|5) s\)/.test(b.txt), 'question neuve : bouton grisé avec compte à rebours (« ' + b.txt + ' »)');
  const q0 = await q();
  await ev(`m4Flow.skip(); 0`);
  chk(await q() === q0, 'pendant l\'attente, passer ne fait rien');
  await page.waitForTimeout(5000);
  b = await btn();
  chk(!b.dis && /Nouvelle activité/.test(b.txt) && !/\(/.test(b.txt), 'après 5 s : bouton utilisable, libellé normal (« ' + b.txt + ' »)');
  await page.click('#m4-next'); await page.waitForTimeout(200);
  chk(await ev(`skipRun === 1`), 'question passée (compteur 1)');
  // ---- 3 questions passées d'affilée : série perdue
  await ev(`SKIP_COOLDOWN_MS = 0; skipRun = 0; freeStreak = 7; updateStreakPill(); 0`);
  const skip = async () => { await qcm(); await ev(`m4Flow.skip(); 0`); await page.waitForTimeout(50); };
  await skip(); await skip();
  chk(await ev(`freeStreak === 7`) && /Encore une question passée/.test(await page.evaluate(() => document.body.textContent)), '2 questions passées : série gardée, avertissement');
  await skip();
  chk(await ev(`freeStreak === 0 && skipRun === 0`) && /3 questions passées d'affilée/.test(await page.evaluate(() => document.body.textContent)), '3e question passée : la série sans faute repart à zéro');
  // répondre remet le compteur à zéro
  await ev(`freeStreak = 5; 0`);
  await skip(); await skip();
  await qcm(); await page.click('#m4-choices button'); await page.waitForTimeout(100);
  await ev(`freeStreak = 5; 0`);
  await skip();
  chk(await ev(`freeStreak === 5 && skipRun === 1`), 'une réponse entre-temps : le compteur repart de zéro (pas de perte)');
  // passer après une erreur reste une erreur (règle existante), pas un « passage »
  // ---- chronométré : −5 s
  await ev(`skipRun = 0; practiceMode = 'countdown'; countdownSeconds = 60; startCountdown(); 0`);
  const e0 = await ev(`countdownEndAt`);
  await ev(`generateFamilyQuestion(currentFamily); 0`);
  await ev(`familyDef(currentFamily) && document.querySelector('#practice-exercise [id$="-next"]:not([hidden]), #practice-exercise [id$="-new"]') ; (function(){ var b = [...document.querySelectorAll('#practice-exercise [id$="-next"], #practice-exercise [id$="-new"]')].filter(function(x){ return x.offsetParent; })[0]; b.click(); })(); 0`);
  const e1 = await ev(`countdownEndAt`);
  chk(e0 - e1 === 5000, 'Chronométré : question passée = −5 s (' + (e0 - e1) + ' ms)');
  chk(/−5 s/.test(await page.evaluate(() => document.body.textContent)), 'Chronométré : « −5 s » affiché');
  await ev(`endCountdown(); practiceMode='free'; 0`);
  console.log(bad ? 'ÉCHEC' : 'cooldown_check OK'); process.exit(bad ? 1 : 0);
});
