// Réinitialisation : seul le premier personnage de chaque clan reste (et redevient mascotte),
// y compris après rechargement de la page.
const { withPage } = require('./lib');
withPage({ page: 'index_test.html', viewport: { width: 390, height: 800 } }, async (page) => {
  const ev = c => page.evaluate(x => window.__t.__eval(x), c);
  let bad = 0; const chk = (ok, msg) => { console.log(ok ? '  ok' : '  ✘', msg); if (!ok) bad++; };
  chk(await ev(`Object.keys(ownedCats).length + '/' + Object.keys(ownedBrain).length`) === '1/1', 'première partie : un seul personnage offert par clan');
  await ev(`stars=300; addStar(0); evoCats.cat01=2; evoBrain.br01=1; saveEvo(); CAT_SPRITES.forEach(function(s){ ownedCats[s.id]=true; }); BRAINROT_SPRITES.forEach(function(s){ ownedBrain[s.id]=true; }); saveOwned();`);
  await page.click('#settings-btn'); await page.click('#reset-progress-btn'); await page.click('#reset-yes');
  const state = async () => JSON.parse(await ev(`JSON.stringify({ c:Object.keys(ownedCats), b:Object.keys(ownedBrain), m:mascotIds, fc:CAT_SPRITES.filter(function(s){return s.starter;})[0].id, fb:BRAINROT_SPRITES.filter(function(s){return s.starter;})[0].id, stars:stars })`));
  let s = await state();
  chk(s.c.length === 1 && s.c[0] === s.fc && s.b.length === 1 && s.b[0] === s.fb, 'un seul personnage par clan : ' + s.c + ' / ' + s.b);
  chk(s.m.cats === s.fc && s.m.brainrot === s.fb && s.stars === 0, 'il redevient la mascotte, étoiles à 0');
  chk(await ev(`Object.keys(evoCats).length + Object.keys(evoBrain).length`) === 0 && await ev(`localStorage.getItem('geo_evo_cats')`) === null, 'les évolutions sont aussi effacées');
  // rechargement : l'état est conservé (pas de retour des personnages de départ)
  const url = page.url(); await page.reload(); await page.waitForTimeout(400);
  s = await state();
  chk(s.c.length === 1 && s.b.length === 1 && s.m.cats === s.fc, 'après rechargement : toujours un seul personnage par clan');
  await page.evaluate(() => document.getElementById('battle-btn').click());
  chk(await page.evaluate(() => !document.getElementById('bt-missing').hidden && document.getElementById('bt-start').disabled), 'bataille : « il te manque… », combat impossible');
  console.log(bad ? 'ÉCHEC' : 'OK');
});
