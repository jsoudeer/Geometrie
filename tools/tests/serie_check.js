// Séries sans faute : paliers 20 / 25 / 30 (défis Facile / Moyen / Difficile), pastille, ciblage, chaleur (mode Overload) par clan.
const { withPage, SHOTS } = require('./lib');
withPage({ page: 'index_test.html', viewport: { width: 390, height: 844 } }, async (page) => {
  const ev = c => page.evaluate(x => window.__t.__eval(x), c);
  let bad = 0; const chk = (ok, m) => { console.log(ok ? '  ok' : '  ✘', m); if (!ok) bad++; };
  const done = async () => JSON.parse(await ev(`JSON.stringify([12,13,14].map(function(k){ return isChallengeDone(k); }))`));
  const closeReveal = () => page.evaluate(() => { const r = document.getElementById('reveal-overlay'); if (r) r.remove(); });
  await ev(`appMode='auto'; practiceMode='free'; autoAdvanceThreshold=1e9; setGlobalLevel(0); resetFreeStreak();`);
  // ---------- paliers
  for (let i = 1; i <= 30; i++) {
    await ev(`onPracticeAnswered(true)`); await closeReveal();
    if (i === 19) chk(JSON.stringify(await done()) === '[false,false,false]', '19 : rien de débloqué');
    if (i === 20) chk(JSON.stringify(await done()) === '[true,false,false]', '20 : défi Facile seulement');
    if (i === 24) chk(JSON.stringify(await done()) === '[true,false,false]', '24 : toujours le Facile seul, la série continue (' + await ev('freeStreak') + ')');
    if (i === 25) chk(JSON.stringify(await done()) === '[true,true,false]', '25 : + défi Moyen');
    if (i === 30) chk(JSON.stringify(await done()) === '[true,true,true]', '30 : + défi Difficile');
  }
  chk(await ev('freeStreak') === 30, 'la série ne s\'arrête pas aux paliers');
  await ev(`onPracticeAnswered(true)`); await closeReveal();
  chk(await ev('freeStreak') === 31 && !(await page.evaluate(() => document.getElementById('streak-pill').hidden)), 'au-delà de 30 : la pastille reste (' + await page.evaluate(() => document.getElementById('streak-pill').textContent) + ')');
  await ev(`onPracticeAnswered(false)`);
  chk(await ev('freeStreak') === 0 && JSON.stringify(await done()) === '[true,true,true]', 'une erreur remet la série à 0 sans rien retirer');
  // ---------- indépendant du niveau joué : 20 en Difficile débloque le Facile (le défi du palier)
  await ev(`Object.keys(ownedCats).forEach(function(k){ delete ownedCats[k]; }); CAT_SPRITES.forEach(function(s){ if(s.starter) ownedCats[s.id]=true; }); setGlobalLevel(2); resetFreeStreak();`);
  for (let i = 0; i < 20; i++) await ev(`onPracticeAnswered(true)`);
  await closeReveal();
  chk(JSON.stringify(await done()) === '[true,false,false]', '20 en niveau Difficile : c\'est le palier qui compte, pas le niveau joué');
  // ---------- pastille
  await ev(`resetFreeStreak(); freeStreak=21; updateStreakPill();`);
  const pill = await page.evaluate(() => document.getElementById('streak-pill').textContent);
  chk(/21 \/ 25/.test(pill) && /20✔/.test(pill), 'pastille à 21 : « ' + pill + ' »');
  // ---------- ciblage : 3 questions avant chaque palier non débloqué
  await ev(`Object.keys(ownedCats).forEach(function(k){ delete ownedCats[k]; }); CAT_SPRITES.forEach(function(s){ if(s.starter) ownedCats[s.id]=true; });`);
  const foc = JSON.parse(await ev(`JSON.stringify((function(){ var o=[]; for(var n=0;n<31;n++){ freeStreak=n; o.push(challengeFocusActive()?1:0); } return o; })())`));
  const want = Array.from({ length: 31 }, (_, n) => ([17,18,19,22,23,24,27,28,29].includes(n) ? 1 : 0));
  chk(JSON.stringify(foc) === JSON.stringify(want), 'ciblage aux 3 questions avant 20, 25 et 30');
  await ev(`ownedCats[CAT_REWARDS[13].id]=true`);
  chk(await ev(`(function(){ freeStreak=23; return challengeFocusActive(); })()`) === false, 'palier déjà débloqué : pas de ciblage');
  // ---------- chaleur
  const heat = async (n) => { await ev(`freeStreak=${n}; updateStreakPill();`); return page.evaluate(() => document.body.getAttribute('data-heat')); };
  await ev(`sfxMode='normal'`);
  chk(await heat(26) === '0', 'mode Normal : aucune chaleur, même à 26');
  await ev(`sfxMode='overload'`);
  const lv = []; for (const n of [0, 14, 15, 19, 20, 24, 25, 40]) lv.push(await heat(n));
  chk(lv.join(',') === '0,0,1,1,2,2,3,3', 'chaleur en Overload : 15 → 1, 20 → 2, 25 → 3 (' + lv + ')');
  await ev(`freeStreak=26; updateStreakPill();`);
  for (const theme of ['cats', 'brainrot']) {
    await ev(`applyTheme('${theme}')`); await ev(`freeStreak=26; updateStreakPill();`);
    await page.waitForTimeout(1500);
    const info = await page.evaluate(() => ({ glow: getComputedStyle(document.querySelector('.heat-glow')).opacity, particles: document.querySelectorAll('.heat-p').length, bg: getComputedStyle(document.querySelector('.heat-glow')).backgroundImage.slice(0, 60), pe: getComputedStyle(document.querySelector('.heat-layer')).pointerEvents }));
    chk(+info.glow > 0.9 && info.particles > 0 && info.pe === 'none', theme + ' : halo visible, ' + info.particles + ' particules, sans bloquer les clics');
    chk(await page.evaluate(() => getComputedStyle(document.querySelector('.heat-layer'), '::after').opacity) === '0', theme + ' : l\'éclat de palier est éteint une fois joué (sinon écran rosé permanent)');
    await page.screenshot({ path: SHOTS + 'chaleur_' + theme + '_3.png' });
    await ev(`freeStreak=17; updateStreakPill();`); await page.waitForTimeout(1200);
    await page.screenshot({ path: SHOTS + 'chaleur_' + theme + '_1.png' });
  }
  await ev(`onPracticeAnswered(false)`);
  chk(await page.evaluate(() => document.body.getAttribute('data-heat')) === '0', 'une erreur éteint la chaleur');
  await page.waitForTimeout(2500);
  chk(await page.evaluate(() => { const l = document.querySelector('.heat-layer'); return !l.classList.contains('surge') && getComputedStyle(document.querySelector('.heat-glow')).opacity === '0'; }), 'après une erreur : plus aucun voile, écran normal');
  await ev(`freeStreak=22; updateStreakPill(); setAppMode('manual')`);
  chk(await page.evaluate(() => document.body.getAttribute('data-heat')) === '0', 'hors mode Aléatoire : pas de chaleur');
  // mouvement réduit : pas de particules
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await ev(`setAppMode('auto'); practiceMode='free'; resetFreeStreak(); freeStreak=26; updateStreakPill();`);
  await page.waitForTimeout(1200);
  chk(await page.evaluate(() => document.querySelectorAll('.heat-p').length) === 0, 'mouvement réduit : aucune particule');
  console.log(bad ? 'ÉCHEC' : 'OK');
});
