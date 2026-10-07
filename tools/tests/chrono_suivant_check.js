// Chronométré : passage automatique à la question suivante 5 s après la réponse ; passer à la main (Suivant, retour touché…) l'annule : jamais deux « suivant ».
const { withPage } = require('./lib');
withPage({ page: 'index_test.html' }, async (page) => {
  let bad = 0; const chk = (ok, msg) => { console.log(ok ? '  ok' : '  ✘ ÉCHEC', msg); if (!ok) bad++; };
  const ev = c => page.evaluate(x => window.__t.__eval(x), c);
  await ev(`practiceMode='countdown'; countdownSeconds=60; startCountdown(); window.__n = 0; var __orig = nextPracticeQuestion; nextPracticeQuestion = function(){ window.__n++; return __orig.apply(this, arguments); }; 0`);
  const n = () => page.evaluate(() => window.__n);
  chk(await ev('COUNTDOWN_AUTO_NEXT_MS') === 5000, 'délai automatique : 5 secondes');
  // 1. réponse puis rien : la question ne change ni à 1 s, ni à 4 s ; elle change une fois à 5 s
  await ev('onPracticeAnswered(true); 0');
  await page.waitForTimeout(1500); chk(await n() === 0, 'à 1,5 s : toujours la même question');
  await page.waitForTimeout(3000); chk(await n() === 0, 'à 4,5 s : toujours la même question');
  await page.waitForTimeout(900); chk(await n() === 1, 'après 5 s : une seule question suivante (automatique)');
  // 2. réponse puis « suivant » à la main : le passage automatique est désactivé
  await page.evaluate(() => { window.__n = 0; });
  await ev('onPracticeAnswered(false); 0');
  await page.waitForTimeout(1000); await ev('nextPracticeQuestion(); 0');
  chk(await n() === 1, 'suivant à la main : une question suivante');
  await page.waitForTimeout(5500); chk(await n() === 1, 'pas de second « suivant » 5 s plus tard');
  // 3. la fin du chrono annule aussi l'automatique
  await page.evaluate(() => { window.__n = 0; });
  await ev('onPracticeAnswered(true); endCountdown(); 0');
  await page.waitForTimeout(5500); chk(await n() === 0, 'fin du chrono : plus de passage automatique');
  // 4. le vrai parcours, au doigt : on répond dans le Quizz, puis on touche le retour : une seule question suivante, pas de second saut 5 s plus tard
  await ev('practiceMode="countdown"; forcedQcmType=null; startCountdown(); 0');
  await ev('generateFamilyQuestion("qcm"); 0');
  await ev('window.__n = 0; 0');
  await page.click('#m4-choices button');
  await page.waitForTimeout(400);
  chk(await page.evaluate(() => document.getElementById('m4-feedback').classList.contains('tappable')), 'la réponse ferme la question (retour touchable)');
  await page.click('#m4-feedback'); await page.waitForTimeout(300);
  chk(await n() === 1, 'retour touché : une question suivante');
  await page.waitForTimeout(5600); chk(await n() === 1, 'pas de second saut automatique après le toucher');
  // le bouton « Nouvelle activité » avant de répondre ne programme rien
  await page.click('#m4-next').catch(() => {}); await page.waitForTimeout(5600);
  chk(await n() <= 2, 'Nouvelle activité : un seul saut');
  await ev('endCountdown(); practiceMode="free"; 0');
  console.log(bad ? 'ÉCHEC' : 'chrono_suivant_check OK'); process.exit(bad ? 1 : 0);
});
