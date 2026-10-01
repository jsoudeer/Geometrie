// Mode Révision (à côté d'Aléatoire) : met en avant les activités ratées et celles jamais faites, sans bloquer le reste.
const { withPage, SHOTS } = require('./lib');
withPage({ page: 'index_test.html', viewport: { width: 390, height: 844 } }, async (page) => {
  const ev = c => page.evaluate(x => window.__t.__eval(x), c);
  let bad = 0; const chk = (ok, m) => { console.log(ok ? '  ok' : '  ✘', m); if (!ok) bad++; };
  const labels = await page.evaluate(() => [...document.querySelectorAll('#practice-mode .level-btn')].map(b => b.textContent.trim()));
  chk(labels.join('|').replace(/✔ /g, '') === 'Aléatoire|Révision|Chronométré', 'les trois boutons : ' + labels.join(' | '));
  await page.click('#practice-mode .level-btn:nth-child(2)');
  chk(await ev('practiceMode') === 'review' && await ev('appMode') === 'auto', 'clic sur Révision : mode révision');
  chk(!(await page.evaluate(() => document.getElementById('practice-exercise').hidden)), 'une question est affichée');
  // Historique fabriqué (niveau 0) : mesure tout faux, déformer tout juste, le reste jamais fait
  await ev(`globalLevel=0; progEvents=[]; var i; for(i=0;i<10;i++){ progEvents.push([Date.now(), 4, 'measure', '', 0, 0]); progEvents.push([Date.now(), 0, 'deform', '', 0, 1]); } reviewLast=null;`);
  const tally = JSON.parse(await ev(`JSON.stringify((function(){ var t={}; for(var n=0;n<1500;n++){ var r=progReviewPick(); t[r.key]=(t[r.key]||0)+1; } return t; })())`));
  const nbFam = Object.keys(tally).length;
  const others = Object.keys(tally).filter(k => k !== 'measure' && k !== 'deform' && k !== 'qcm').map(k => tally[k]);
  const avgOther = others.reduce((a, b) => a + b, 0) / Math.max(1, others.length);
  chk(tally.measure > avgOther * 1.1, 'activité ratée (mesure) plus tirée que les jamais faites : ' + tally.measure + ' vs ~' + Math.round(avgOther));
  chk(tally.deform < avgOther * 0.3, 'activité toujours réussie (déformer) rarement tirée mais possible : ' + tally.deform + ' vs ~' + Math.round(avgOther));
  chk(tally.deform > 0 && others.every(n => n > 0), 'toutes les activités restent possibles (' + nbFam + ' familles)');
  chk(tally.qcm > avgOther * 0.7 && tally.qcm < avgOther * 2.5, 'le quiz (une vingtaine de types) ne domine pas : ' + tally.qcm + ' vs ~' + Math.round(avgOther));
  // jamais deux fois de suite la même famille
  const rep = await ev(`(function(){ var last=null, rep=0; for(var n=0;n<500;n++){ var r=progReviewPick(); if(r.key===last) rep++; last=r.key; } return rep; })()`);
  chk(rep === 0, 'jamais deux fois de suite la même famille');
  // dans le quiz : un type raté est préféré aux autres
  await ev(`progEvents=[]; M4_LEVELS[0].types.forEach(function(t, k){ for(var i=0;i<10;i++) progEvents.push([Date.now(), 0, 'qcm', t, 0, k===0 ? 0 : 1]); });`);
  const ty = JSON.parse(await ev(`JSON.stringify((function(){ var t={}, bad=M4_LEVELS[0].types[0]; for(var n=0;n<3000;n++){ var r=progReviewPick(); if(r.key==='qcm') t[r.type===bad?'bad':'other']=(t[r.type===bad?'bad':'other']||0)+1; } return t; })())`));
  chk(ty.bad > 0 && ty.bad > ty.other / ((await ev('M4_LEVELS[0].types.length')) - 1) * 1.8, 'un type de quiz raté ressort plus qu\'un autre : ' + JSON.stringify(ty));
  // la question posée est bien du type demandé, et l'étiquette l'annonce
  await ev(`progEvents=[]; for(var i=0;i<10;i++) progEvents.push([Date.now(), 4, 'measure', '', 0, 0]); `);
  let seenMeasure = 0, tagged = 0;
  for (let i = 0; i < 40; i++) {
    await ev('nextPracticeQuestion()');
    if (await ev('currentFamily') === 'measure') { seenMeasure++; if (/à revoir/.test(await page.evaluate(() => document.getElementById('practice-family-tag').textContent))) tagged++; }
  }
  chk(seenMeasure > 0 && tagged === seenMeasure, 'l\'étiquette « à revoir » accompagne l\'activité ratée (' + tagged + '/' + seenMeasure + ')');
  // quiz : la question affichée correspond bien au type choisi
  await ev(`progEvents=[]; window.__tt=M4_LEVELS[0].types[2]; M4_LEVELS[0].types.forEach(function(t){ for(var i=0;i<10;i++) progEvents.push([Date.now(), 0, 'qcm', t, 0, t===window.__tt ? 0 : 1]); }); for(var j=0;j<10;j++){ ['measure','deform','clock-lire','clock-regler','net','estimate','atelier-sym','atelier-copie','atelier-erreur','atelier-axe','atelier-fraction'].forEach(function(f){ progEvents.push([Date.now(), 0, f, '', 0, 1]); }); }`);
  let hit = 0, qcmSeen = 0;
  for (let i = 0; i < 60; i++) { await ev('nextPracticeQuestion()'); if (await ev('currentFamily') === 'qcm') { qcmSeen++; if (await ev('m4Current.typeId === window.__tt')) hit++; } }
  chk(qcmSeen > 5 && hit > qcmSeen * 0.3, 'quiz : le type raté est bien posé (' + hit + '/' + qcmSeen + ')');
  // la révision ne touche ni à la série sans faute ni à la montée de niveau automatique
  await ev(`freeStreak=0; levelStreak=0; autoAdvanceEnabled=true; for(var i=0;i<12;i++) onPracticeAnswered(true);`);
  chk(await ev('freeStreak') === 0 && await ev('globalLevel') === 0, 'pas de série sans faute ni de changement de niveau en révision');
  // retour à Aléatoire / passage en Chronométré
  await page.click('#practice-mode .level-btn:nth-child(1)');
  chk(await ev('practiceMode') === 'free', 'retour à Aléatoire');
  await page.click('#practice-mode .level-btn:nth-child(3)');
  chk(await ev('practiceMode') === 'countdown' && !(await page.evaluate(() => document.getElementById('countdown-setup').hidden)), 'Chronométré fonctionne toujours');
  await page.click('#practice-mode .level-btn:nth-child(2)');
  chk(await ev('practiceMode') === 'review' && (await page.evaluate(() => document.getElementById('countdown-setup').hidden)) && !(await page.evaluate(() => document.getElementById('practice-exercise').hidden)), 'de Chronométré vers Révision : les questions reviennent');
  // changer de niveau en révision reste en révision
  await ev('setGlobalLevel(1)');
  chk(await ev('practiceMode') === 'review', 'changer de niveau garde la révision');
  await page.waitForTimeout(600);
  await page.screenshot({ path: SHOTS + 'revision.png' });
  console.log(bad ? 'ÉCHEC' : 'OK');
});
