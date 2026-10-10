// Priorité activité par activité : poids (nouveau / peu fait / raté / maîtrisé), mode Aléatoire (≈ 25 % vers les activités
// à travailler), Révision (encore plus), séries (activités les moins réussies), écran Progression (liste par activité).
const { withPage } = require('./lib');
withPage({ page: 'index_test.html' }, async (page) => {
  let bad = 0; const chk = (ok, msg) => { console.log(ok ? '  ok' : '  ✘ ÉCHEC', msg); if (!ok) bad++; };
  const ev = c => page.evaluate(x => window.__t.__eval(x), c);
  const J = async c => JSON.parse(await ev(c));
  await ev(`setAppMode('auto'); setGlobalLevel(1); resetFreeStreak(); 0`);
  // historique : toutes les activités du niveau Moyen maîtrisées (12 bonnes réponses), sauf « Périmètre » (ratée)
  const setHist = (failId) => ev(`(function(){ progEvents = []; var t = Date.now() - 1e7;
    progReviewUnits().forEach(function(u){ for(var k=0;k<12;k++) progEvents.push([t++, 0, u.key, u.type||'', 1, (u.id === '${failId}' && k % 3) ? 0 : 1]); });
    return 0; })()`);
  await setHist('qcm|perimetre');
  const w = await J(`JSON.stringify((function(){ var U = progReviewUnits(); function W(id){ return progReviewWeight(U.filter(function(u){ return u.id===id; })[0]); }
    var sav = progEvents; var r = { maitrise: W('qcm|calc'), rate: W('qcm|perimetre') };
    progEvents = sav.filter(function(e){ return e[3] !== 'calc'; }); r.nouveau = W('qcm|calc');
    progEvents = progEvents.concat([[Date.now(),0,'qcm','calc',1,1],[Date.now(),0,'qcm','calc',1,1]]); r.peu = W('qcm|calc');
    progEvents = sav; return r; })())`);
  chk(w.nouveau.why === 'nouveau' && w.nouveau.w === 3, 'jamais faite à ce niveau : poids 3 (« nouveau »)');
  chk(w.peu.why === 'peu fait' && w.peu.w > 1 && w.peu.w < 3, 'moins de 5 réponses, toutes justes : « peu fait » (' + w.peu.w + ')');
  chk(w.rate.why === 'raté' && w.rate.w > 2, 'ratée : poids fort (' + w.rate.w.toFixed(2) + ')');
  chk(w.maitrise.why === '' && w.maitrise.w === 0.25, 'maîtrisée : poids faible (0,25)');
  // mode Aléatoire : part des questions sur l'activité ratée
  async function share(n, mode) {
    await ev(`practiceMode='${mode}'; resetFreeStreak(); 0`);
    return J(`JSON.stringify((function(){ var hit = 0, tag = 0; for(var i=0;i<${n};i++){ freeStreak = 0; nextPracticeQuestion();
      if(currentFamily==='qcm' && m4Current && m4Current.typeId==='perimetre'){ hit++; if(/🔁 à revoir/.test(document.getElementById('practice-family-tag').textContent)) tag++; } }
      return { hit: hit / ${n}, tag: tag }; })())`);
  }
  const base = await (async () => { await setHist('aucune'); return share(600, 'free'); })();
  await setHist('qcm|perimetre');
  const free = await share(600, 'free');
  chk(base.hit < 0.06, 'sans échec : le Périmètre sort rarement en Aléatoire (' + Math.round(base.hit * 100) + ' %)');
  chk(free.hit > 0.14 && free.hit < 0.4, 'Périmètre raté : il revient souvent en Aléatoire, sans tout envahir (' + Math.round(free.hit * 100) + ' %)');
  chk(free.tag > 0, 'la question poussée porte « 🔁 à revoir »');
  const rev = await share(400, 'review');
  chk(rev.hit > free.hit, 'en Révision, il revient encore plus souvent (' + Math.round(rev.hit * 100) + ' %)');
  // chronométré : pas de poussée (tirage habituel)
  chk(await ev(`practiceMode='countdown'; countdownRunning=true; var n=0; for(var i=0;i<200;i++){ nextPracticeQuestion(); if(currentFamily==='qcm' && m4Current.typeId==='perimetre') n++; } countdownRunning=false; practiceMode='free'; n < 30`), 'chronométré : pas de poussée');
  // séries : les 3 questions avant un palier vont à l'activité ratée
  await ev(`practiceMode='free'; 0`);
  const f = await J(`JSON.stringify((function(){ var out = {}; for(var i=0;i<20;i++){ var p = progWeakPick(); out[p ? p.key + ':' + (p.type||'') : 'null'] = 1; } return Object.keys(out); })())`);
  chk(f.length === 1 && f[0] === 'qcm:perimetre', 'série : l\'activité la moins réussie est ciblée (' + f.join(', ') + ')');
  // écran Progression : liste activité par activité
  await ev(`renderProgress(); 0`);
  const txt = await page.evaluate(() => document.getElementById('progress-body').textContent);
  chk(/Activités à travailler : [^.]*Périmètre/.test(txt), 'Progression : « Activités à travailler » nomme le Périmètre');
  await ev(`progEvents = progEvents.filter(function(e){ return e[3] !== 'duree'; }); renderProgress(); 0`);
  chk(/Peu pratiquées en Moyen[^.]*Durées/.test(await page.evaluate(() => document.getElementById('progress-body').textContent)), 'Progression : « Peu pratiquées » nomme une activité jamais faite (Durées)');
  console.log(bad ? 'ÉCHEC' : 'priorite_check OK'); process.exit(bad ? 1 : 0);
});
