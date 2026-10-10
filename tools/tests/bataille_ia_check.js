// Bataille : places d'équipe selon les personnages débloqués (par clan) et IA graduée (Facile / Normal / Difficile ; Aventure).
const { withPage, SHOTS } = require('./lib');
withPage({ page: 'index_test.html', viewport: { width: 390, height: 844 } }, async (page) => {
  let bad = 0; const chk = (ok, msg) => { console.log(ok ? '  ok' : '  ✘ ÉCHEC', msg); if (!ok) bad++; };
  const ev = c => page.evaluate(x => window.__t.__eval(x), c);
  const J = async c => JSON.parse(await ev(c));
  // ---- places selon le nombre de personnages débloqués, par clan
  const own = (side, n) => ev(`(function(){ var o = '${side}'==='cats' ? ownedCats : ownedBrain, L = '${side}'==='cats' ? CAT_SPRITES : BRAINROT_SPRITES;
    Object.keys(o).forEach(function(k){ delete o[k]; }); L.slice(0, ${n}).forEach(function(s){ o[s.id] = true; }); return 0; })()`);
  await own('cats', 9); await own('brainrot', 25);
  let L = await J(`JSON.stringify([btLimits('cats'), btLimits('brainrot')])`);
  chk(L[0].classic + L[0].special === 5 && L[0].support === 1 && L[0].archer === 1, '9 personnages : 5 places (3 classiques, 1 soutien, 1 archer)');
  chk(L[1].classic + L[1].special === 7 && L[1].support === 2 && L[1].archer === 2, 'autre clan, 25 personnages : 7 places (3, 2 soutiens, 2 archers) : chaque clan a ses places');
  await own('cats', 12);
  L = await J(`JSON.stringify(btLimits('cats'))`);
  chk(L.classic + L.special === 6 && L.special === 3 && L.support === 2 && L.archer === 2, '12 personnages : 6 places (3 classiques + 3 soutiens ou archers, 2 du même au plus)');
  // choix : places partagées soutien / archer
  await ev(`unlockAllSprites(); 0`); await own('cats', 12);
  const ids = await J(`JSON.stringify({ s: btMyList().filter(function(x){ return x.role==='support' && ownedCats[x.id]; }).map(function(x){ return x.id; }), a: btMyList().filter(function(x){ return x.role==='archer' && ownedCats[x.id]; }).map(function(x){ return x.id; }) })`);
  chk(ids.s.length >= 2 && ids.a.length >= 2, 'données : 2 soutiens et 2 archers possédés (' + ids.s.length + ' / ' + ids.a.length + ')');
  await page.click('#battle-btn'); await page.waitForTimeout(300);
  const sel = await J(`(function(){ btSel.cats = {classic:[],support:[],archer:[]}; var S = ${JSON.stringify(ids)};
    btToggleSetup(findAnySprite(S.s[0])); btToggleSetup(findAnySprite(S.s[1])); btToggleSetup(findAnySprite(S.a[0]));
    var a = JSON.parse(JSON.stringify(btSel.cats)); btToggleSetup(findAnySprite(S.a[1])); return JSON.stringify([a, btSel.cats]); })()`);
  chk(sel[0].support.length === 2 && sel[0].archer.length === 1, '6 places : 2 soutiens + 1 archer possibles');
  chk(sel[1].support.length === 1 && sel[1].archer.length === 2, 'un 2e archer : le plus ancien soutien laisse sa place (3 spéciaux au plus)');
  await page.click('#bt-auto-best'); await page.waitForTimeout(150);
  const best = await J(`JSON.stringify(btSel.cats)`);
  chk(best.classic.length === 3 && best.support.length + best.archer.length === 3 && best.support.length >= 1 && best.archer.length >= 1, 'équipe la plus forte : 6 cartes, au moins un soutien et un archer');
  chk(/jusqu'à 6 cartes[^.]*\. Débloque 8 personnages de plus pour une 7e place/.test(await page.evaluate(() => document.getElementById('bt-intro').textContent)), 'l\'écran dit le nombre de places et ce qu\'il faut pour la suivante');
  await page.screenshot({ path: SHOTS + 'bataille_6places.png' });
  await page.click('#bt-start'); await page.waitForTimeout(300);
  chk(await ev(`bt.pl.field.length + bt.pl.reserve.length === 6 && bt.en.field.length + bt.en.reserve.length === 6`), 'combat : 6 cartes de chaque côté');
  // ---- IA : scénarios fabriqués (1 attaquant adverse, 3 cibles)
  async function choose(ai, mk, n = 200) {
    return J(`(function(){ var c = {}; for(var i=0;i<${n};i++){ ${mk}; bt.ai = ${ai}; var m = btChooseEnemyMove(); var k = m.t.sprite.role + ':' + m.t.pts + '<' + m.a.sprite.role; c[k] = (c[k]||0) + 1; } return JSON.stringify(c); })()`);
  }
  const U = (role, pts) => `{ uid:++btUid, sprite:{ id:'x'+btUid, name:'X', role:'${role}' }, pts:${pts}, base:${pts}, evo:0 }`;
  // toutes les cibles peuvent être achevées : Difficile vise le soutien, puis l'archer
  const all3 = `bt.en.field = [${U('classic', 12)}]; bt.pl.field = [${U('classic', 9)}, ${U('support', 9)}, ${U('archer', 9)}]`;
  const d2 = await choose(2, all3), d1 = await choose(1, all3);
  chk((d2['support:9<classic'] || 0) >= 190, 'Difficile : vise d\'abord le soutien (' + JSON.stringify(d2) + ')');
  chk((d1['support:9<classic'] || 0) < 120, 'Normal : pas de priorité de rôle (' + JSON.stringify(d1) + ')');
  const two = `bt.en.field = [${U('classic', 12)}]; bt.pl.field = [${U('classic', 9)}, ${U('archer', 9)}]`;
  chk(((await choose(2, two))['archer:9<classic'] || 0) >= 190, 'Difficile : sans soutien, vise l\'archer');
  // achever plutôt que perdre son attaquant
  const trade = `bt.en.field = [${U('classic', 5)}]; bt.pl.field = [${U('classic', 8)}, ${U('classic', 3)}]`;
  const t1 = await choose(1, trade), t0 = await choose(0, trade);
  chk((t1['classic:3<classic'] || 0) >= 195, 'Normal : achève la petite carte au lieu de perdre son attaquant (' + JSON.stringify(t1) + ')');
  chk((t0['classic:8<classic'] || 0) >= 30, 'Facile : joue presque au hasard (' + JSON.stringify(t0) + ')');
  // Difficile : ne sacrifie pas son attaquant même pour viser un soutien qu'il ne peut pas achever
  const risky = `bt.en.field = [${U('classic', 5)}]; bt.pl.field = [${U('support', 9)}, ${U('classic', 3)}]`;
  chk(((await choose(2, risky))['classic:3<classic'] || 0) >= 190, 'Difficile : n\'attaque pas un soutien plus fort (il perdrait sa carte) : il achève la petite');
  // ---- deux soutiens sur le terrain : les deux soignent (chacun soigne l'autre, pas lui-même)
  const heal = await J(`(function(){ var sd = { field:[${U('classic', 10)}, ${U('support', 8)}, ${U('support', 8)}] }; var b = sd.field.map(function(u){ return u.pts; });
    btSupportTick(sd); return JSON.stringify(sd.field.map(function(u, i){ return u.pts - b[i]; })); })()`);
  chk(JSON.stringify(heal) === '[4,2,2]', 'deux soutiens : le classique reçoit +4, chaque soutien +2 (de l\'autre) : ' + JSON.stringify(heal));
  // ---- Aventure : +3 par victoire ; combats de palier en Difficile
  await ev(`btBackToSetup(); btMode = 'adv'; btAdv.cats = 9; btStart(); 0`);
  chk(await ev(`bt.ai === 1 && btTotal(bt.en.field.concat(bt.en.reserve)) === 54`), 'Aventure niveau 9 : adversaire Normal, ❤️ 54');
  await ev(`btBackToSetup(); btAdv.cats = 10; btStart(); 0`);
  chk(await ev(`bt.ai === 2 && /👑/.test(document.getElementById('bt-adv-badge').textContent)`), 'niveau 10 (palier) : adversaire Difficile, 👑 affiché');
  await ev(`btBackToSetup(); btMode = 'train'; btDiff = 0; btStart(); 0`);
  chk(await ev(`bt.ai === 0`), 'Entraînement Facile : adversaire Facile');
  console.log(bad ? 'ÉCHEC' : 'bataille_ia_check OK'); process.exit(bad ? 1 : 0);
});
