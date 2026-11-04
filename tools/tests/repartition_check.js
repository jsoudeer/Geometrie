// Répartition égale entre TOUTES les activités (chrono et Aléatoire), à chaque niveau :
// - sur un grand nombre de tirages, aucune activité ne dépasse 2× la moyenne (et chaque activité sort) ;
// - la mesure et l'horloge ne dominent plus un chrono (c'était ~50 % des questions) ;
// - jamais deux fois la même activité d'affilée ; la priorité (nudge) reste rare, espacée et jamais juste après une faute.
const { withPage } = require('./lib');
withPage({ page: 'index_test.html' }, async (page) => {
  let bad = 0; const chk = (ok, msg) => { console.log(ok ? '  ok' : '  ✘ ÉCHEC', msg); if (!ok) bad++; };
  const ev = c => page.evaluate(x => window.__t.__eval(x), c);
  for (const mode of ['countdown', 'free']) for (let lvl = 0; lvl < 3; lvl++) {
    const r = JSON.parse(await ev(`(function(){ practiceMode='${mode}'; appMode='auto'; globalLevel=${lvl}; resetSeenQuestions(); progEvents=[];
      var units=drawUnits().length, N=units*12, ids=[], cnt={};
      for(var i=0;i<N;i++){ var u=pickUnitFresh(); ids.push(u.id); cnt[u.id]=(cnt[u.id]||0)+1; }
      var consec=0; for(var j=1;j<ids.length;j++) if(ids[j]===ids[j-1]) consec++;
      var vals=Object.keys(cnt).map(function(k){return cnt[k];});
      return JSON.stringify({units:units, seen:vals.length, max:Math.max.apply(null,vals), min:Math.min.apply(null,vals), consec:consec, clock:(cnt['clock-lire']||0), meas:(cnt['measure']||0)+(cnt['estimate']||0), N:N}); })()`));
    console.log(mode, 'niveau', lvl, JSON.stringify(r));
    chk(r.seen === r.units, 'toutes les activités sortent');
    chk(r.max - r.min <= 1, 'écart d\'au plus 1 tirage entre la plus et la moins fréquente (sac sans remise)');
    chk(r.consec === 0, 'jamais la même activité deux fois de suite');
    chk((r.clock + r.meas) / r.N < 0.15, 'longueur + horloge : moins de 15 % des questions');
  }
  // priorité : espacée, rare, pas après une faute
  const n = JSON.parse(await ev(`(function(){ practiceMode='free'; appMode='auto'; globalLevel=1; countdownRunning=false; resetSeenQuestions();
    progEvents=[]; for(var i=0;i<40;i++) progEvents.push([Date.now(),0,'qcm','pf_x',1,i%3?1:0]);   // beaucoup de ratés et rien d'autre : tout est « à travailler »
    var hits=0, gapMin=99, since=99, afterMiss=0, N=2000;
    for(var k=0;k<N;k++){
      progEvents.push([Date.now(),0,'qcm','pf_x',1, (k%2)?1:0]);
      var lastOk = progEvents[progEvents.length-1][5];
      var p=progNudgePick(); since++;
      if(p){ hits++; if(since<gapMin) gapMin=since; since=0; if(!lastOk) afterMiss++; } }
    return JSON.stringify({hits:hits, N:N, gapMin:gapMin, afterMiss:afterMiss}); })()`));
  console.log('priorité', JSON.stringify(n));
  chk(n.hits / n.N <= 0.16, 'priorité : au plus ~15 % des questions');
  chk(n.gapMin > 4 - 0 && n.gapMin >= 5, 'priorité : au moins 4 questions entre deux');
  chk(n.afterMiss === 0, 'priorité : jamais juste après une faute');
  console.log(bad ? 'ÉCHEC' : 'repartition_check OK'); process.exit(bad ? 1 : 0);
});
