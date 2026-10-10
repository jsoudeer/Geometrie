// Historique de progression : enregistrement, écran Progression, série des 20 qui survit à la montée
// de niveau automatique, et 3 dernières questions du défi sur les sujets faibles.
const { withPage, SHOTS } = require('./lib');
withPage({ page: 'index_test.html', viewport: { width: 390, height: 900 } }, async (page) => {
  const ev = c => page.evaluate(x => window.__t.__eval(x), c);
  let bad = 0; const chk = (ok, msg) => { console.log(ok ? '  ok' : '  ✘', msg); if (!ok) bad++; };
  // ---------- 1) la série continue pendant la montée de niveau automatique ----------
  await ev(`autoAdvanceThreshold=5; setAppMode('auto'); setGlobalLevel(0); resetFreeStreak();`);
  const levels = [];
  let at20 = null;
  for (let i = 0; i < 30; i++) {
    await ev(`nextPracticeQuestion(); onPracticeAnswered(true);`);
    await page.waitForTimeout(100);
    levels.push(await ev(`globalLevel`));
    if (i === 19) at20 = JSON.parse(await ev(`JSON.stringify([12,13,14].map(function(k){ return isChallengeDone(k); }))`));
  }
  console.log('niveaux :', levels.join(''));
  chk(levels[4] === 0 && levels[5] === 1 && levels[9] === 1 && levels[10] === 2 && levels[29] === 2, 'montée automatique Facile → Moyen → Difficile (à la question suivante la 5e bonne réponse)');
  const done = JSON.parse(await ev(`JSON.stringify([12,13,14].map(function(k){ return isChallengeDone(k); }))`));
  chk(JSON.stringify(at20) === '[true,false,false]', 'à 20 (malgré les montées de niveau) : seul le défi Facile est débloqué : ' + JSON.stringify(at20));
  chk(done.every(Boolean), 'à 30 : les trois défis sont débloqués : ' + JSON.stringify(done));
  // ---------- 2) enregistrement ----------
  await page.waitForTimeout(600);
  const stored = JSON.parse(await page.evaluate(() => localStorage.getItem('geo_history')));
  chk(stored.length === 30 && stored.every(e => e.length === 6 && e[5] === 1), 'historique enregistré et sauvegardé (30 réponses)');
  // ---------- 3) les 3 dernières questions sur les sujets faibles ----------
  await ev(`progEvents=[]; var t=Date.now(); [['calcul',0.3],['mesures',0.4],['solides',0.5]].forEach(function(p){ var i=DOMAINS.map(function(s){return s.id;}).indexOf(p[0]); for(var k=0;k<40;k++) progEvents.push([t-k*1000, i, p[0]==='mesures'?'measure':(p[0]==='solides'?'net':'qcm'), p[0]==='calcul'?'calc':'', 1, k/40<p[1]?1:0]); });
    ['formes','symetrie','repere','temps','nombres','logique'].forEach(function(id){ var i=DOMAINS.map(function(s){return s.id;}).indexOf(id); for(var k=0;k<40;k++) progEvents.push([t-k*1000, i, id==='formes'?'deform':(id==='temps'?'clock-lire':'qcm'), id==='repere'?'coordFind':'', 1, 1]); });`);
  // remet les défis à faire
  await ev(`Object.keys(ownedCats).forEach(function(k){ delete ownedCats[k]; }); CAT_SPRITES.forEach(function(s){ if(s.starter) ownedCats[s.id]=true; }); setAppMode('auto'); setGlobalLevel(1); resetFreeStreak();`);
  const focus = [];
  for (let n = 0; n < 20; n++) {
    await ev(`freeStreak=${n}; nextPracticeQuestion();`);
    focus.push(await page.evaluate(() => /🎯/.test(document.getElementById('practice-family-tag').textContent)));
  }
  chk(focus.slice(0, 17).every(f => !f) && focus.slice(17).every(f => f), 'seules les 3 dernières questions (18e, 19e, 20e) sont ciblées : ' + focus.map(f => f ? 1 : 0).join(''));
  const picks = [];
  for (let k = 0; k < 30; k++) {
    await ev(`freeStreak=${17 + (k % 3)}; var f=progWeakPick(); window.__p=f;`);
    picks.push(await ev(`JSON.stringify(window.__p)`));
  }
  const keys = [...new Set(picks.map(p => JSON.parse(p)).map(p => p.key + (p.type ? ':' + p.type : '')))];
  chk(keys.length === 3 && keys.every(k => ['qcm:calc', 'measure', 'net'].includes(k)), 'activités choisies parmi les moins réussies (activité par activité, en tournant) : ' + keys.join(', '));
  // défi déjà réussi : pas de ciblage
  await ev(`ownedCats[CAT_REWARDS[12].id]=true; freeStreak=18; nextPracticeQuestion();`);
  chk(!(await page.evaluate(() => /🎯/.test(document.getElementById('practice-family-tag').textContent))), 'défi du niveau déjà réussi : pas de ciblage');
  // pas assez de données : pas de ciblage
  await ev(`progEvents=[]; delete ownedCats[CAT_REWARDS[12].id]; freeStreak=18; nextPracticeQuestion();`);
  chk(!(await page.evaluate(() => /🎯/.test(document.getElementById('practice-family-tag').textContent))), 'sans historique suffisant : pas de ciblage');
  // ---------- 4) écran Progression ----------
  await page.evaluate(() => { var r=document.getElementById('reveal-overlay'); if(r) r.remove(); });
  await page.evaluate(() => document.getElementById('settings-btn').click());
  await page.evaluate(() => document.getElementById('open-progress-btn').click());
  chk(await page.evaluate(() => !document.getElementById('progress-overlay').hidden && document.getElementById('settings-overlay').hidden), 'bouton « Progression de l\'enfant » ouvre l\'écran');
  chk(await page.evaluate(() => /Pas encore de résultats/.test(document.getElementById('progress-body').textContent)), 'sans données : message clair');
  // avec données
  await ev(`progEvents=[]; var t=Date.now(); var fk=function(s){ var f=FAMILIES.filter(function(f){ return f.key!=='qcm' && f.domain===s.id; })[0]; return f ? f.key : 'qcm'; }; DOMAINS.forEach(function(s,i){ for(var k=0;k<45;k++) progEvents.push([t-k*3600000*5, i, fk(s), fk(s)==='qcm'?'calc':'', k%3, (k%(i+2)===0)?0:1]); }); renderProgress();`);
  const radar = await page.evaluate(() => ({ svg: !!document.querySelector('#progress-body svg.prog-radar'), labels: document.querySelectorAll('#progress-body svg.prog-radar text').length, polys: document.querySelectorAll('#progress-body svg.prog-radar polygon').length }));
  chk(radar.svg && radar.labels === 18 && radar.polys >= 6, 'radar : 9 axes (18 textes), ' + radar.polys + ' polygones');
  await page.screenshot({ path: SHOTS + 'prog_radar.png', fullPage: false });
  await page.evaluate(() => [...document.querySelectorAll('#progress-tabs .level-btn')][1].click());
  const det = await page.evaluate(() => ({ skills: document.querySelectorAll('#progress-body .prog-skill').length, rows: document.querySelectorAll('#progress-body .prog-acts li').length }));
  chk(det.skills === 9 && det.rows > 0, 'détail : 9 compétences avec leurs activités (' + det.rows + ' lignes)');
  await page.evaluate(() => document.querySelector('#progress-body .prog-skill').open = true);
  await page.screenshot({ path: SHOTS + 'prog_detail.png' });
  await page.evaluate(() => [...document.querySelectorAll('#progress-tabs .level-btn')][2].click());
  chk(await page.evaluate(() => !!document.querySelector('#progress-body svg.prog-days')), 'activité : graphique des 14 jours');
  await page.screenshot({ path: SHOTS + 'prog_days.png' });
  await page.click('#progress-clear'); await page.click('#progress-clear-yes');
  chk(await ev(`progEvents.length`) === 0 && (await page.evaluate(() => localStorage.getItem('geo_history'))) === '[]', 'effacer l\'historique');
  await page.evaluate(() => document.getElementById('progress-close').click());
  chk(await page.evaluate(() => document.getElementById('progress-overlay').hidden), 'fermeture');
  console.log(bad ? 'ÉCHEC' : 'OK');
});
