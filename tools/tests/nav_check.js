// Navigation : Boutique = compteur d'étoiles, Bataille = icône ⚔️, menu = 3 niveaux + Manuel.
// Soutien : +2 points à chaque allié à la fin de chaque tour de son camp.
const { withPage } = require('./lib');
withPage({ page: 'index_test.html', viewport: { width: 390, height: 900 } }, async (page) => {
  const ev = c => page.evaluate(x => window.__t.__eval(x), c);
  let bad = 0; const chk = (ok, msg) => { console.log(ok ? '  ok' : '  ✘', msg); if (!ok) bad++; };
  const vis = id => page.evaluate(i => !document.getElementById(i).hidden, id);
  chk(await page.evaluate(() => [...document.querySelectorAll('.tab-btn')].map(b => b.dataset.tab).join(',')) === 'facile,moyen,difficile,manuel', 'menu : facile, moyen, difficile, manuel');
  await page.click('#stars-btn');
  chk(await vis('tab-shop') && !(await vis('tab-practice')) && !(await vis('tab-battle')), 'compteur d\'étoiles → boutique');
  await page.click('#battle-btn');
  chk(await vis('tab-battle') && !(await vis('tab-shop')), 'icône ⚔️ → bataille');
  await page.click('#battle-btn');
  chk(await vis('tab-practice') && !(await vis('tab-battle')), 'retouche ⚔️ → retour aux exercices');
  await page.click('#menu-btn'); await page.click('.tab-btn[data-tab="difficile"]');
  await page.click('#stars-btn'); await page.click('#tab-shop [data-back]');
  chk(await vis('tab-practice') && await ev('globalLevel') === 2, 'bouton Retour → dernier niveau (difficile)');
  const box = await page.evaluate(() => { const r = ['theme-toggle','stars-btn','battle-btn','settings-btn'].map(i => document.getElementById(i).getBoundingClientRect()); return r.map(x => [Math.round(x.left), Math.round(x.right)]); });
  chk(box[1][1] <= box[2][0] + 1 && box[2][1] <= box[3][0] + 1 && box[3][1] <= 390, 'en-tête sans débordement : ' + JSON.stringify(box));
  // Soutien
  await ev(`CAT_SPRITES.forEach(function(s){ ownedCats[s.id]=true; })`);
  await page.click('#battle-btn'); await page.click('#bt-auto-best'); await page.click('#bt-start'); await page.waitForTimeout(200);
  const r = JSON.parse(await ev(`(function(){
    var sup = bt.pl.reserve.concat(bt.pl.field).filter(function(u){return u.sprite.role==='support';})[0];
    if(bt.pl.field.indexOf(sup)===-1){ var i=bt.pl.reserve.indexOf(sup); var out=bt.pl.field.pop(); bt.pl.reserve.splice(i,1); bt.pl.field.push(sup); bt.pl.reserve.push(out); }
    var before = bt.pl.field.map(function(u){return u.pts;});
    var did = btSupportTick(bt.pl);
    var after = bt.pl.field.map(function(u){return u.pts;});
    var diffs = bt.pl.field.map(function(u,i){ return after[i]-before[i]; });
    return JSON.stringify({did:did, diffs:diffs, roles:bt.pl.field.map(function(u){return u.sprite.role;})});
  })()`));
  const healer = r.roles.indexOf('support');   // un seul soutien soigne par tour (le premier) ; un 2e soutien est soigné comme un allié
  chk(r.did && r.diffs.every((d, i) => d === (i === healer ? 0 : 2)), 'soutien : +2 aux alliés, rien pour lui : ' + JSON.stringify(r));
  console.log(bad ? 'ÉCHEC' : 'OK');
});
