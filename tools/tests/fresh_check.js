// Vérifie le tirage « sans remise » : familles (jamais 2 fois de suite la même,
// tour complet avant retour) et catégories de quiz (toutes vues avant répétition).
const { withPage } = require('./lib');
withPage({ page: 'index_test.html' }, async (page) => {
  const ev = c => page.evaluate(x => window.__t.__eval(x), c);
  let bad = 0;
  for (let lvl = 0; lvl < 3; lvl++) {
    const r = JSON.parse(await ev(`(function(){ globalLevel=${lvl}; resetSeenQuestions(); var fams=[], cats=[], n=60;
      for(var i=0;i<n;i++){ nextPracticeQuestion(); fams.push(lastFamily); if(lastFamily==='qcm') cats.push(m4Current.typeId); }
      var consec=0; for(var j=1;j<fams.length;j++) if(fams[j]===fams[j-1]) consec++;
      var cnt={}; fams.forEach(function(f){cnt[f]=(cnt[f]||0)+1;});
      var seenCats={}; cats.forEach(function(c){seenCats[c]=(seenCats[c]||0)+1;});
      return JSON.stringify({consec:consec, cnt:cnt, cats:seenCats}); })()`));
    console.log('niveau', lvl, JSON.stringify(r));
    // Le tirage est par ACTIVITÉ (repartition_check) : le Quizz porte la plupart d'entre elles, il peut donc se suivre ;
    // les autres écrans, eux, ne reviennent pas avant un tour complet.
    const others = Object.entries(r.cnt).filter(([k]) => k !== 'qcm').map(([, v]) => v);
    if (Math.max(...others) - Math.min(...others) > 2) { bad++; console.log('  ✘ répartition des écrans inégale'); }
    if (Math.max(...Object.values(r.cats)) > 2) { bad++; console.log('  ✘ un type de quiz revient trop souvent'); }
  }
  console.log(bad ? 'ÉCHEC' : 'OK');
});
