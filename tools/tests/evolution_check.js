// Économie et évolutions : un seul personnage offert, commun 10 ⭐, rare 20 ⭐, 2 montées au prix d'achat
// (+20 % des points de base chacune), visuels par niveau, persistance, effet en bataille.
const { withPage, SHOTS } = require('./lib');
withPage({ page: 'index_test.html', viewport: { width: 390, height: 900 } }, async (page) => {
  const ev = c => page.evaluate(x => window.__t.__eval(x), c);
  let bad = 0; const chk = (ok, msg) => { console.log(ok ? '  ok' : '  ✘', msg); if (!ok) bad++; };

  // --- économie
  chk(await ev(`Object.keys(ownedCats).join()`) === 'cat01' && await ev(`Object.keys(ownedBrain).join()`) === 'br01', 'un seul personnage offert par clan');
  chk(await ev(`CAT_SPRITES.concat(BRAINROT_SPRITES).filter(function(s){ return s.cost===0 && s.rarity!=='defi'; }).map(function(s){return s.id;}).join()`) === 'cat01,br01', 'seuls cat01 et br01 sont gratuits (hors défis)');
  chk(await ev(`[RARITY_META.commun.cost,RARITY_META.rare.cost].join()`) === '10,20', 'prix : 10 ⭐ un commun, 20 ⭐ un rare (un rare coûte plus)');
  chk(await ev(`CAT_SPRITES.filter(function(s){ return s.rarity!=='defi' && !s.starter; }).every(function(s){ return s.cost===RARITY_META[s.rarity].cost && evoCost(s)===s.cost; })`), 'une évolution coûte le prix d\'achat');
  chk(await ev(`evoCost(CAT_SPRITES.filter(function(s){return s.rarity==='defi';})[0])`) === 12, 'personnage de défi : 12 ⭐ par évolution');
  const tot = await ev(`[CAT_SPRITES,BRAINROT_SPRITES].map(function(l){ return l.filter(function(s){return s.rarity!=='defi' && !s.starter;}).reduce(function(a,s){return a+3*s.cost;},0); }).join()`);
  chk(tot.split(',').every(function(v){ return v >= 700 && v <= 950; }), 'budget : acheter + 2 évolutions par clan ≈ 900 ⭐ (' + tot + ')');
  const team = await ev(`CAT_SPRITES.filter(function(s){ return s.rarity!=='defi' && !s.starter; }).slice(0,4).reduce(function(a,s){ return a+s.cost; },0)`);
  chk(team >= 40 && team <= 80, 'une équipe de 5 personnages (1 offert) coûte ' + team + ' ⭐');
  const all = await ev(`CAT_SPRITES.filter(function(s){ return s.rarity!=='defi'; }).reduce(function(a,s){ return a+RARITY_META[s.rarity].cost*3; },0)`);
  chk(all >= 600, 'tout acheter et tout faire évoluer : ' + all + ' ⭐ par clan (plusieurs semaines)');

  // --- achat + évolution dans la boutique
  await page.click('#stars-btn'); await page.waitForTimeout(300);
  await ev(`stars=0; addStar(0); renderShop()`);
  await page.evaluate(() => document.querySelector('#shop-grid .sprite-card.locked .sp-buy') && 0);
  chk(await page.evaluate(() => [...document.querySelectorAll('#shop-grid .sprite-card.locked .sp-buy:not(.sp-info)')].every(b => b.disabled)), 'sans étoiles : tout est grisé');
  await ev(`stars=100; addStar(0); renderShop()`);
  const base = await ev(`CAT_SPRITES[0].pts`), gain = await ev(`evoGain(CAT_SPRITES[0])`);
  chk(gain === Math.max(2, Math.round(base * 0.2)), 'gain = 20 % des points de base (' + base + ' → +' + gain + ')');
  const btnTxt = () => page.evaluate(() => document.querySelector('#shop-grid .sprite-card.owned .sp-evo-btn').textContent);
  let t = await btnTxt();
  chk(/Évolué/.test(t) && /20 ⭐/.test(t) && new RegExp('\\+' + gain).test(t), 'bouton niveau 1 : « ' + t + ' »');
  await page.screenshot({ path: SHOTS + 'evo_shop0.png' });
  await page.evaluate(() => document.querySelector('#shop-grid .sprite-card.owned .sp-evo-btn').click());
  await page.waitForTimeout(300);
  chk(await ev(`stars`) === 80 && await ev(`spriteEvo(CAT_SPRITES[0])`) === 1, 'niveau 1 : −20 ⭐ (cat01 est rare)');
  chk(await ev(`spritePts(CAT_SPRITES[0])`) === base + gain, 'niveau 1 : points = ' + (base + gain));
  chk(await page.evaluate(() => !!document.getElementById('evo-overlay') && !document.getElementById('reveal-overlay')), 'la cérémonie d\'évolution s\'ouvre (pas le reveal)');
  await page.evaluate(() => { const o = document.getElementById('evo-overlay'); if (o) { o.click(); const b = o.querySelector('.eo-ok'); if (b) b.click(); } });
  await page.waitForTimeout(300);
  chk(await page.evaluate(() => !document.getElementById('evo-overlay')), 'cérémonie fermée (un toucher passe à la fin, le bouton ferme)');
  chk(await page.evaluate(() => !!document.querySelector('#shop-grid .sprite-card.owned.evo-1 .evo-badge') && document.querySelectorAll('#shop-grid .sprite-card.owned.evo-1 .evo-spark').length === 4 && !!document.querySelector('#shop-grid .sprite-card.owned.evo-1 .evo-halo')), 'cadre + étoile + 4 particules + halo niveau 1 sur la carte');
  t = await btnTxt();
  chk(/Ultime/.test(t) && /20 ⭐/.test(t), 'bouton niveau 2 : « ' + t + ' »');
  await page.evaluate(() => document.querySelector('#shop-grid .sprite-card.owned .sp-evo-btn').click());
  await page.waitForTimeout(300);
  await page.evaluate(() => { const o = document.getElementById('evo-overlay'); if (o) { o.click(); const b = o.querySelector('.eo-ok'); if (b) b.click(); } });
  await page.waitForTimeout(400);
  chk(await ev(`stars`) === 60 && await ev(`spriteEvo(CAT_SPRITES[0])`) === 2, 'niveau 2 : −20 ⭐ (total 40)');
  chk(await ev(`spritePts(CAT_SPRITES[0])`) === base + 2 * gain, 'niveau 2 : points = ' + (base + 2 * gain) + ' (+2 niveaux)');
  chk(await page.evaluate(() => document.querySelector('#shop-grid .sprite-card.owned .sp-evo-btn').disabled), 'niveau maximum : bouton grisé');
  chk(await page.evaluate(() => !!document.querySelector('#shop-grid .sprite-card.owned.evo-2 .evo-badge') && document.querySelectorAll('#shop-grid .sprite-card.owned.evo-2 .evo-spark').length === 7), 'cadre doré, 2 étoiles, 7 particules niveau 2');
  chk(await ev(`tryEvolve(CAT_SPRITES[0])`) === false && await ev(`stars`) === 60, 'impossible d\'aller au-delà du niveau 2');
  await page.screenshot({ path: SHOTS + 'evo_shop2.png' });
  // pas assez d'étoiles
  await ev(`stars=5; addStar(0); evoCats.cat01=0; renderShop()`);
  chk(await page.evaluate(() => document.querySelector('#shop-grid .sprite-card.owned .sp-evo-btn').disabled), 'pas assez d\'étoiles : évolution grisée');
  await ev(`evoCats.cat01=2; stars=100; addStar(0); renderShop()`);

  // --- achat d'un autre personnage
  await page.evaluate(() => [...document.querySelectorAll('#shop-grid .sprite-card.locked .sp-buy:not(.sp-info)')][0].click());
  await page.waitForTimeout(300);
  chk(await ev(`stars`) === 100 - await ev(`CAT_SPRITES.filter(function(s){return ownedCats[s.id] && !s.starter;})[0].cost`) && await ev(`Object.keys(ownedCats).length`) === 2, 'achat d\'un personnage : son prix est débité');
  await page.evaluate(() => { const o = document.getElementById('reveal-overlay'); if (o) { const b = o.querySelector('.rv-ok'); if (b) { b.click(); b.click(); } } });
  await page.waitForTimeout(300);

  // --- persistance
  await page.reload(); await page.waitForTimeout(500);
  { const sb = await page.$('#splash-start-btn'); if (sb) { await sb.click(); await page.waitForTimeout(300); } }
  chk(await ev(`spriteEvo(CAT_SPRITES[0])`) === 2, 'l\'évolution survit au rechargement');

  // --- visuel en plein pied et chez les brainrots
  await ev(`evoBrain.br01=1; ownedBrain.br01=true; fighterDisplayMode='full'; renderShop();`);
  await page.waitForTimeout(300);
  await page.screenshot({ path: SHOTS + 'evo_shop_full.png' });
  await ev(`fighterDisplayMode='head'`);

  // --- en bataille : l'évolution compte pour mon équipe, pas pour l'adversaire
  await ev(`BT_SPEED=0.05; evoCats.cat01=2; ['cat02','cat03','cat04','cat05'].forEach(function(id){ ownedCats[id]=true; }); evoBrain.br01=2; ownedBrain.br01=true; btSel.cats={classic:['cat01'],support:[],archer:[]}; renderBtSetup();`);
  await page.evaluate(() => document.getElementById('battle-btn').click());
  await page.waitForTimeout(300);
  const cardTxt = await page.evaluate(() => [...document.querySelectorAll('#bt-grid-classic .sprite-card')][0].textContent);
  chk(cardTxt.indexOf('❤️ ' + (base + 2 * gain)) !== -1, 'carte de choix : points évolués (' + cardTxt.replace(/\s+/g, ' ') + ')');
  chk(await page.evaluate(() => !!document.querySelector('#bt-grid-classic .sprite-card.evo-2')), 'carte de choix : cadre niveau 2');
  await page.click('#bt-start'); await page.waitForTimeout(300);
  const units = JSON.parse(await ev(`JSON.stringify({ me: bt.pl.field.map(function(u){return [u.sprite.id,u.pts,u.evo];}), foe: bt.en.field.concat(bt.en.reserve).map(function(u){return u.evo;}) })`));
  chk(units.me[0][0] === 'cat01' && units.me[0][1] === base + 2 * gain && units.me[0][2] === 2, 'unité du joueur : points évolués ' + JSON.stringify(units.me));
  chk(units.foe.every(e => e === 0), 'adversaires : jamais évolués');
  chk(await page.evaluate(() => !!document.querySelector('#bt-player-field .bcard-art.evo-2') && !document.querySelector('#bt-enemy-field .evo-1, #bt-enemy-field .evo-2')), 'carte de combat : cadre niveau 2 (joueur seulement)');
  await page.screenshot({ path: SHOTS + 'evo_battle.png', fullPage: true });
  console.log(bad ? 'ÉCHEC' : 'OK');
});
