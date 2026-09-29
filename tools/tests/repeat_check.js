// Vérifie qu'aucune question ne se répète dans une série (fenêtre de 40 en Aléatoire, chrono simulé).
const { withPage } = require('./lib');
withPage({ page: 'index_test.html' }, async (page) => {
  const ev = c => page.evaluate(x => window.__t.__eval(x), c);
  for (let lvl = 0; lvl < 3; lvl++) {
    const r = await ev(`(function(){ globalLevel=${lvl}; resetSeenQuestions(); var seen={}, dup=0, fams={}, n=40;
      for(var i=0;i<n;i++){ nextPracticeQuestion(); var k=lastFamily; fams[k]=(fams[k]||0)+1; var sg=seenSigs[seenSigs.length-1]; if(seen[sg]) dup++; seen[sg]=1; }
      return JSON.stringify({dup:dup, fams:fams, netsig: seenSigs.filter(function(s){return s.indexOf('net|')===0;}).slice(0,3)}); })()`);
    console.log('niveau', lvl, r);
  }
});
