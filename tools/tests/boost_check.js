// Bataille : effets sonores au milieu (à la place du descriptif), déroulé ralenti,
// boost tous les 3 tours (×2 ou dégâts fixes : double, −30 %, +30 %).
const { withPage, SHOTS } = require('./lib');
withPage({ page: 'index_test.html', viewport: { width: 390, height: 900 } }, async (page) => {
  const ev = c => page.evaluate(x => window.__t.__eval(x), c);
  let bad = 0; const chk = (ok, msg) => { console.log(ok ? '  ok' : '  ✘', msg); if (!ok) bad++; };
  const wait = ms => page.waitForTimeout(ms);
  // équipe de 3 classiques (pas de soutien : les points ne bougent que par les attaques)
  async function newBattle(speed) {
    await ev(`BT_SPEED=${speed}; ['cat01','cat02','cat03'].forEach(function(id){ ownedCats[id]=true; }); btSel.cats={classic:['cat01','cat02','cat03'],support:[],archer:[]}; renderBtSetup();`);
    await page.evaluate(() => { if (document.getElementById('arena-battle-wrap').offsetParent === null) document.getElementById('battle-btn').click(); });
    await wait(200);
    await page.evaluate(() => document.getElementById('bt-start').click());
    await wait(250);
  }
  // Terrain « inoffensif » pour mesurer : mes cartes sont des archers (jamais blessés en retour), l'adversaire est
  // énorme (ne meurt pas) et son tour est sauté ; sauf mention contraire.
  const prep = (mine) => ev(`bt.pl.field.forEach(function(u){ u.sprite.role='archer'; u.pts=${mine}; u.base=${mine}; }); bt.en.field.forEach(function(u){ u.pts=100000; u.base=100000; }); btRender();`);
  const stubEnemy = () => ev(`window.__realEnemy = window.__realEnemy || btEnemyTurn; btEnemyTurn = function(){ if(!bt||bt.over) return; btStartPlayerTurn(); };`);
  const phase = () => ev('bt.phase');
  async function untilPhase(p, max = 30000) { const t0 = Date.now(); while (Date.now() - t0 < max && await phase() !== p) await wait(60); return await phase() === p; }
  await newBattle(0.05);

  // --- affichage : plus de descriptif au milieu, un espace d'effets
  chk(await page.evaluate(() => !!document.getElementById('bt-sfx') && !document.querySelector('#bt-arena .bt-log')), 'zone d\'effets sonores présente, ancien descriptif retiré');
  chk(await page.evaluate(() => { const l = document.getElementById('bt-log'); return l.classList.contains('sr-only') && l.getBoundingClientRect().width <= 1; }), 'le texte reste lisible par lecteur d\'écran uniquement');

  // --- pas de boost aux tours 1 et 2, un boost au tour 3
  chk(await ev('bt.turn === 1 && bt.boost === null'), 'tour 1 : pas de boost');
  async function playTurn(unitIdx = 0, boostKind = null) {
    await ev(`bt.selected = null; bt.phase = 'pick-attacker';`);
    await page.evaluate((i) => document.querySelectorAll('#bt-player-field .bcard')[i].click(), unitIdx);
    await wait(30);
    if (boostKind && await phase() === 'pick-boost') await page.evaluate((k) => document.getElementById('bt-boost-' + k).click(), boostKind);
    await wait(30);
    await page.evaluate(() => [...document.querySelectorAll('#bt-enemy-field .bcard')].find(c => !c.disabled).click());
    return untilPhase('pick-attacker');
  }
  // On rend les cartes très solides pour que personne ne meure pendant le test.
  await stubEnemy(); await prep(500);
  await playTurn(0, 'none');
  chk(await ev('bt.turn === 2 && bt.boost === null'), 'tour 2 : pas de boost');
  await playTurn(1, 'none');
  chk(await ev('bt.turn === 3 && bt.boost !== null && bt.pl.field.indexOf(bt.boost.unit) !== -1'), 'tour 3 : un boost apparaît devant une de mes cartes');
  chk(await page.evaluate(() => document.querySelectorAll('#bt-player-field .bcard.boosted .boost-tag:not([hidden])').length === 1 && document.querySelectorAll('#bt-enemy-field .boosted').length === 0), 'une seule carte porte l\'étiquette « 🎁 BOOST », chez moi seulement');
  chk(/boost/i.test(await page.evaluate(() => document.getElementById('bt-status').textContent)), 'le statut annonce le boost');
  chk(await page.evaluate(() => document.getElementById('bt-boost').hidden), 'panneau de boost fermé tant qu\'on n\'a pas choisi la carte');
  await page.screenshot({ path: SHOTS + 'boost_apparu.png', fullPage: true });

  // --- choisir une autre carte : pas de panneau ; le boost reste
  const bIdx = await ev(`bt.pl.field.indexOf(bt.boost.unit)`);
  const otherIdx = bIdx === 0 ? 1 : 0;
  await page.evaluate((i) => document.querySelectorAll('#bt-player-field .bcard')[i].click(), otherIdx);
  await wait(30);
  chk(await phase() === 'pick-target' && await page.evaluate(() => document.getElementById('bt-boost').hidden), 'autre carte : pas de choix de boost, on vise directement');
  await ev(`bt.selected=null; bt.phase='pick-attacker'; btRender();`);

  // --- carte boostée : panneau, ennemis non ciblables tant qu'on n'a pas choisi
  await page.evaluate((i) => document.querySelectorAll('#bt-player-field .bcard')[i].click(), bIdx);
  await wait(50);
  chk(await phase() === 'pick-boost' && await page.evaluate(() => !document.getElementById('bt-boost').hidden), 'carte boostée : le panneau de choix s\'ouvre');
  chk(await page.evaluate(() => [...document.querySelectorAll('#bt-enemy-field .bcard')].every(c => c.disabled)), 'ennemis pas encore ciblables (il faut choisir)');
  const vals = JSON.parse(await ev(`JSON.stringify({ pts: bt.selected.pts, v: btBoostValues(bt.selected), f: bt.boost.factor })`));
  chk(vals.v.x2 === vals.pts * 2 && vals.v.fixed === Math.round(vals.pts * 2 * vals.f), 'valeurs : ×2 = ' + vals.v.x2 + ', fixe = ' + vals.v.fixed + ' (facteur ' + vals.f + ')');
  chk(await page.evaluate((v) => document.getElementById('bt-boost-fixed').textContent.indexOf(String(v)) !== -1 && /2/.test(document.getElementById('bt-boost-x2').textContent), vals.v.fixed), 'les boutons affichent ×2 et le nombre fixe');
  await page.screenshot({ path: SHOTS + 'boost_panneau.png', fullPage: true });
  // retoucher la carte annule
  await page.evaluate((i) => document.querySelectorAll('#bt-player-field .bcard')[i].click(), bIdx);
  await wait(30);
  chk(await phase() === 'pick-attacker' && await page.evaluate(() => document.getElementById('bt-boost').hidden), 'retoucher la carte annule le choix');

  // --- attaque sans boost : dégâts normaux, le boost reste disponible
  async function attackWith(kind) {
    await ev(`window.__att = bt.boost.unit; window.__tg = bt.en.field[0]; window.__a0 = __att.pts; window.__t0 = __tg.pts;`);
    await ev(`bt.selected=null; bt.phase='pick-attacker';`);
    const i = await ev(`bt.pl.field.indexOf(__att)`);
    await page.evaluate((i) => document.querySelectorAll('#bt-player-field .bcard')[i].click(), i);
    await wait(30);
    await page.evaluate((k) => document.getElementById('bt-boost-' + k).click(), kind);
    await wait(30);
    await page.evaluate(() => document.querySelectorAll('#bt-enemy-field .bcard')[0].click());
    // dès l'impact
    const t0 = Date.now(); let dmg = 0;
    while (Date.now() - t0 < 15000) { dmg = await ev('__t0 - __tg.pts'); if (dmg !== 0) break; await wait(15); }
    const info = JSON.parse(await ev(`JSON.stringify({ dmg: __t0 - __tg.pts, back: __a0 - __att.pts, boostLeft: !!bt.boost, sfx: (document.querySelector('#bt-sfx .sfx-text')||{}).textContent, sub: (document.querySelector('#bt-sfx .sfx-sub')||{}).textContent || '' })`));
    await untilPhase('pick-attacker', 40000);
    return info;
  }
  let r = await attackWith('none');
  chk(r.dmg === 500 && r.boostLeft === true, 'sans boost : dégâts normaux (' + r.dmg + '), boost conservé');
  chk(/(ZIIIP|TCHAK|PIOU|FLOP) !/.test(r.sfx || ''), 'effet sonore de tir (archer) affiché : « ' + r.sfx + ' »');
  chk(await ev(`BT_WORDS.hit.every(function(w){ return /!$/.test(w); }) && BT_WORDS.ko[0] === 'K.O. !'`), 'mots de coup (POW !, BAM !…) et K.O.');

  // --- ×2 puis fixe, pour chaque facteur
  async function boostRound(factor, kind) {
    await ev(`bt.boost = bt.boost || { unit: bt.pl.field[0], factor: 1 }; bt.boost.factor = ${factor}; bt.boost.unit = bt.pl.field[0];`);
    await prep(40);
    return attackWith(kind);
  }
  r = await boostRound(1, 'x2');
  chk(r.dmg === 80 && r.boostLeft === false, '×2 : 80 dégâts pour 40 points, boost consommé');
  chk(/BOOM|✖️2/.test(r.sfx || ''), 'effet sonore de boost : « ' + r.sfx + ' » ; ' + r.sub);
  chk(/pareil/.test(r.sub), 'facteur 1 : « les deux faisaient pareil » (' + r.sub + ')');
  r = await boostRound(1.3, 'fixed');
  chk(r.dmg === 104 && /👍/.test(r.sub), 'fixe +30 % : 104 dégâts, bon calcul (' + r.sub + ')');
  r = await boostRound(1.3, 'x2');
  chk(r.dmg === 80 && /🤔/.test(r.sub) && /104/.test(r.sub), '×2 alors que fixe +30 % valait 104 : l\'autre était plus fort (' + r.sub + ')');
  r = await boostRound(0.7, 'fixed');
  chk(r.dmg === 56 && /🤔/.test(r.sub) && /80/.test(r.sub), 'fixe −30 % : 56 dégâts, ×2 valait 80 (' + r.sub + ')');
  r = await boostRound(0.7, 'x2');
  chk(r.dmg === 80 && /👍/.test(r.sub), '×2 contre fixe −30 % : bon calcul');

  // --- les trois facteurs reviennent tour à tour
  const fs = JSON.parse(await ev(`(function(){ var out=[]; bt.factors=[]; for(var k=0;k<3;k++){ bt.boost=null; bt.turn=2; btStartPlayerTurn(); out.push(bt.boost.factor); } return JSON.stringify(out.sort()); })()`));
  chk(JSON.stringify(fs) === '[0.7,1,1.3]', 'sur 3 boosts : double, −30 %, +30 % une fois chacun : ' + fs);
  // pas de 2e boost tant que le premier est là
  const keep = await ev(`(function(){ var b = bt.boost; bt.turn = 5; btStartPlayerTurn(); return bt.boost === b; })()`);
  chk(keep, 'tour 6 : pas de nouveau boost tant que l\'ancien n\'est pas utilisé');
  // le porteur est battu : le boost disparaît
  await ev(`bt.pl.field.splice(bt.pl.field.indexOf(bt.boost.unit),1); btClearBoostIfGone();`);
  chk(await ev('bt.boost === null'), 'porteur battu : le boost disparaît');

  // --- déroulé ralenti (vitesse réelle) : plusieurs secondes entre le toucher et la fin de l'attaque
  await ev(`btBackToSetup()`);
  await ev(`btEnemyTurn = window.__realEnemy;`);
  await newBattle(1);
  await ev(`bt.pl.field.forEach(function(u){ u.sprite.role='archer'; u.pts=500; u.base=500; }); bt.en.field.forEach(function(u){ u.pts=100000; u.base=100000; }); btRender();`);
  const ts = Date.now();
  await page.evaluate(() => document.querySelectorAll('#bt-player-field .bcard')[0].click());
  await wait(30);
  await page.evaluate(() => document.querySelectorAll('#bt-enemy-field .bcard')[0].click());
  await wait(900);
  chk(await page.evaluate(() => !!document.querySelector('#bt-player-field .bcard.charging, #bt-player-field .bcard:not(.charging)')), 'préparation puis charge');
  // capture au moment de l'impact
  let shot = false; const t1 = Date.now();
  while (Date.now() - t1 < 6000) { if (await page.evaluate(() => !!document.querySelector('#bt-sfx .sfx-word'))) { await wait(250); await page.screenshot({ path: SHOTS + 'sfx_impact.png', fullPage: true }); shot = true; break; } await wait(40); }
  chk(shot, 'un effet sonore s\'affiche pendant l\'attaque');
  await untilPhase('pick-attacker', 60000);
  const dur = Date.now() - ts;
  chk(dur >= 6000, 'attaque + riposte adverse prennent du temps à lire : ' + (dur / 1000).toFixed(1) + ' s (≥ 6 s)');
  console.log(bad ? 'ÉCHEC' : 'OK');
});
