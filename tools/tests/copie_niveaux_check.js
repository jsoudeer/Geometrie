// « Reproduire le modèle » : Facile seulement (trop long au-delà) ; Moyen et Difficile proposent « Trouver l'erreur ».
const { withPage } = require('./lib');
withPage({ page: 'index_test.html' }, async (page) => {
  const ev = c => page.evaluate(x => window.__t.__eval(x), c);
  let bad = 0; const chk = (ok, msg) => { console.log(ok ? '  ok' : '  ✘', msg); if (!ok) bad++; };
  for (const lvl of [0, 1, 2]) {
    const r = JSON.parse(await ev(`(function(){ globalLevel=${lvl}; resetSeenQuestions(); var c={}; for(var i=0;i<150;i++){ nextPracticeQuestion(); c[lastFamily]=(c[lastFamily]||0)+1; } return JSON.stringify(c); })()`));
    chk(lvl === 0 ? r['atelier-copie'] > 0 : !r['atelier-copie'], 'niveau ' + lvl + ' : « reproduire » ' + (r['atelier-copie'] || 0) + ' fois, « trouver l\'erreur » ' + (r['atelier-erreur'] || 0) + ' fois');
    chk(r['atelier-erreur'] > 0, 'niveau ' + lvl + ' : « trouver l\'erreur » présent');
  }
  const lv = await ev(`JSON.stringify(domainUnits('formes').filter(function(u){return u.key==='atelier-copie';}).map(function(u){return u.levels;}))`).catch(() => null);
  if (lv) chk(lv === '[[0]]', 'mode Manuel : « reproduire » proposé en Facile seulement ' + lv);
  chk((await ev(`[1,2].every(function(l){ globalLevel=l; return progReviewUnits().every(function(u){ return u.key!=='atelier-copie'; }); })`)) === true, 'Révision : pas de « reproduire » en Moyen/Difficile');
  console.log(bad ? 'ÉCHEC' : 'OK');
});
