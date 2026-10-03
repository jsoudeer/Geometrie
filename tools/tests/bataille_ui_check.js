// Bataille : équipe complète en un clic, remplacement du plus ancien choisi,
// cartes persistantes pendant le combat (pas de re-création = pas de clignotement).
const { withPage } = require('./lib');
withPage({ page: 'index_test.html', viewport: { width: 390, height: 900 } }, async (page) => {
  const ev = c => page.evaluate(x => window.__t.__eval(x), c);
  let bad = 0; const chk = (ok, msg) => { console.log(ok ? '  ok' : '  ✘', msg); if (!ok) bad++; };
  await ev('BT_SPEED = 0.05');   // déroulé accéléré (en vrai : lent, pour bien voir les attaques)
  // on possède tout pour tester la rotation
  await ev(`(function(){ CAT_SPRITES.forEach(function(s){ ownedCats[s.id]=true; }); BRAINROT_SPRITES.forEach(function(s){ ownedBrain[s.id]=true; }); btSel.cats={classic:[],support:[],archer:[]}; renderBtSetup(); })()`);
  await page.click('#battle-btn');
  const sel = () => ev(`JSON.stringify(btSel[btSide()])`).then(JSON.parse);
  // rotation du plus ancien
  const ids = JSON.parse(await ev(`JSON.stringify(btMyList().filter(function(s){return s.role==='classic';}).slice(0,5).map(function(s){return s.id;}))`));
  for (let i = 0; i < 4; i++) await ev(`btToggleSetup(findSprite(btMyList(), ${JSON.stringify(ids[i])}))`);
  let s = await sel();
  chk(JSON.stringify(s.classic) === JSON.stringify([ids[1], ids[2], ids[3]]), 'le 4e choisi remplace le plus ancien : ' + s.classic.join(','));
  await page.evaluate((id) => { [...document.querySelectorAll('#bt-grid-classic .sprite-card')].find(c => c.getAttribute('aria-label').startsWith('')) ; }, ids[0]);
  // boutons
  await page.click('#bt-auto-best'); s = await sel();
  const best = JSON.parse(await ev(`JSON.stringify(['classic','support','archer'].map(function(r){ var m=btMyList().filter(function(x){return x.role===r;}).map(function(x){return x.pts;}).sort(function(a,b){return b-a;}); return m.slice(0,BT_LIMITS[r]).reduce(function(a,b){return a+b;},0); }))`));
  const got = JSON.parse(await ev(`JSON.stringify(['classic','support','archer'].map(function(r){ return btSel[btSide()][r].reduce(function(a,id){ return a+findSprite(btMyList(),id).pts; },0); }))`));
  chk(JSON.stringify(best) === JSON.stringify(got) && s.classic.length === 3 && s.support.length === 1 && s.archer.length === 1, 'équipe complète (les plus forts) : ' + got.join('/'));
  chk(!(await page.evaluate(() => document.getElementById('bt-start').disabled)), 'bouton commencer actif');
  await page.click('#bt-auto-clear'); s = await sel();
  chk(s.classic.length + s.support.length + s.archer.length === 0, 'vider');
  await page.click('#bt-auto-random'); s = await sel();
  chk(s.classic.length === 3 && s.support.length === 1 && s.archer.length === 1, 'au hasard : équipe complète');
  // cartes de choix persistantes
  const same = await page.evaluate(() => { const a = document.querySelector('#bt-grid-classic .sprite-card'); document.querySelectorAll('#bt-grid-classic .sprite-card')[1].click(); return a === document.querySelector('#bt-grid-classic .sprite-card'); });
  chk(same, 'les cartes de choix ne sont pas recréées au clic');
  // combat : les cartes gardent leur identité, points cohérents à la fin
  await page.click('#bt-auto-best'); await page.click('#bt-start'); await page.waitForTimeout(200);
  const mark = () => page.evaluate(() => { const a = document.querySelector('#bt-player-field .bcard'); a.__id = 'X'; return a.getAttribute('data-uid'); });
  const uid = await mark();
  await page.evaluate(() => document.querySelector('#bt-player-field .bcard:not(:disabled)').click());
  await page.waitForTimeout(50);
  await page.evaluate(() => document.querySelector('#bt-enemy-field .bcard:not(:disabled)').click());
  let midHtml = { floats: 0 };
  for (let i = 0; i < 20 && !midHtml.floats; i++) { await page.waitForTimeout(100); midHtml = await page.evaluate(() => ({ floats: document.querySelectorAll('.dmg-float').length })); }
  chk(midHtml.floats >= 1, 'chiffres flottants pendant l\'attaque (' + midHtml.floats + ')');
  await page.waitForTimeout(600);
  const after = await page.evaluate((u) => { const c = document.querySelector('#bt-arena [data-uid="' + u + '"]'); return { kept: c ? c.__id === 'X' : 'mort', txt: c && c.querySelector('.bcard-pts').textContent }; }, uid);
  chk(after.kept === true || after.kept === 'mort', 'la carte de l\'attaquant est la même après le combat (' + after.kept + ')');
  // cohérence affichée / interne
  const ok = await ev(`(function(){ var bad=0; [bt.pl,bt.en].forEach(function(sd){ sd.field.forEach(function(u){ var c=bt.cards[u.uid]; if(!c || c._shown!==Math.max(0,u.pts) || c._pts.textContent.indexOf('❤️ '+Math.max(0,u.pts))!==0) bad++; }); }); return bad; })()`);
  chk(ok === 0, 'points affichés = points réels');
  // jouer jusqu'au bout sans erreur
  const t0 = Date.now();
  while (Date.now() - t0 < 90000) {
    if (await page.evaluate(() => !document.getElementById('bt-over').hidden)) break;
    await page.evaluate(() => { const b = document.querySelector('#bt-player-field .bcard:not(:disabled)'); if (b) b.click(); });
    await page.waitForTimeout(40);
    await page.evaluate(() => { const n = document.getElementById('bt-skill-none'); if (n && !document.getElementById('bt-skill').hidden) n.click(); });
    await page.evaluate(() => { const t = document.querySelector('#bt-enemy-field .bcard:not(:disabled)'); if (t) t.click(); });
    await page.waitForTimeout(500);
  }
  chk(await page.evaluate(() => !document.getElementById('bt-over').hidden), 'combat terminé : ' + await page.evaluate(() => document.getElementById('bt-over-text').textContent));
  console.log(bad ? 'ÉCHEC' : 'OK');
});
