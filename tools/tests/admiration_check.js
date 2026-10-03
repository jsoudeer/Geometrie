// Admirer un personnage (profondeur, inclinaison, particules, navigation) + cérémonie d'évolution (phases, sons, étoiles).
const { withPage, SHOTS } = require('./lib');
withPage({ page: 'index_test.html', viewport: { width: 390, height: 844 } }, async (page) => {
  const ev = c => page.evaluate(x => window.__t.__eval(x), c);
  let bad = 0; const chk = (ok, m) => { console.log(ok ? '  ok' : '  ✘', m); if (!ok) bad++; };
  await ev(`unlockAllSprites(); stars=100; addStar(0); evoCats.cat03=2; evoCats.cat02=1; saveEvo(); renderShop();`);
  await page.click('#stars-btn'); await page.waitForTimeout(500);
  // --- accès
  const nOwned = await page.evaluate(() => document.querySelectorAll('#shop-grid .sprite-card.owned').length);
  const nBtn = await page.evaluate(() => [...document.querySelectorAll('#shop-grid .sprite-card.owned .sp-admire')].filter(b => /^Admirer /.test(b.getAttribute('aria-label'))).length);
  chk(nOwned > 5 && nBtn === nOwned, 'chaque personnage possédé a un bouton « Admirer » nommé (' + nBtn + '/' + nOwned + ')');
  const inCard = await page.evaluate(() => [...document.querySelectorAll('#shop-grid .sprite-card.owned .sp-admire')].every(b => { const c = b.closest('.sprite-card').getBoundingClientRect(), r = b.getBoundingClientRect(); return r.left >= c.left && r.right <= c.right + 1 && r.top >= c.top && r.bottom <= c.bottom; }));
  chk(inCard, 'le bouton reste dans sa carte');
  await page.evaluate(() => document.querySelector('#shop-grid .sprite-card.owned .sp-admire').click());
  await page.waitForTimeout(500);
  const info = () => page.evaluate(() => ({ open: !!document.getElementById('admire-overlay'), name: (document.querySelector('.adm-name') || {}).textContent, cls: (document.getElementById('admire-overlay') || {}).className, img: !!document.querySelector('.adm-art img, .adm-art .fullbody-compose') }));
  let i0 = await info();
  chk(i0.open && i0.img && /adm-overlay cats lv0/.test(i0.cls), 'ouverture : portrait en pied affiché (' + i0.name + ')');
  // --- navigation
  await page.click('.adm-next'); await page.waitForTimeout(300);
  const i1 = await info();
  chk(i1.name !== i0.name, 'flèche suivante : autre personnage (' + i1.name + ')');
  await page.keyboard.press('ArrowLeft'); await page.waitForTimeout(300);
  chk((await info()).name === i0.name, 'flèche gauche du clavier : retour');
  // --- niveaux d'évolution : classes, étoiles, anneau d'étoiles
  await ev(`showAdmire(CAT_SPRITES[2])`); await page.waitForTimeout(400);
  const lv2 = await page.evaluate(() => ({ cls: document.getElementById('admire-overlay').className, stars: document.querySelector('.adm-stars').textContent, orbit: getComputedStyle(document.querySelector('.adm-orbit')).display, n: document.querySelectorAll('.adm-orbit-spin span').length }));
  chk(/lv2/.test(lv2.cls) && lv2.stars === '★★' && lv2.orbit === 'block' && lv2.n === 6, 'niveau Ultime : ★★ et anneau d\'étoiles');
  await ev(`showAdmire(CAT_SPRITES[1])`); await page.waitForTimeout(300);
  chk(/lv1/.test(await page.evaluate(() => document.getElementById('admire-overlay').className)) && await page.evaluate(() => getComputedStyle(document.querySelector('.adm-orbit')).display) === 'none', 'niveau Évolué : pas d\'anneau');
  // --- particules en continu, deux plans
  await page.waitForTimeout(1200);
  const parts = await page.evaluate(() => ({ back: document.querySelectorAll('.adm-fx.back .fx-rise').length, front: document.querySelectorAll('.adm-fx.front .fx-rise').length }));
  chk(parts.back + parts.front > 3, 'particules qui montent (' + parts.back + ' derrière, ' + parts.front + ' devant)');
  // --- inclinaison au doigt + toucher = saut et éclat
  const box = await page.evaluate(() => { const r = document.querySelector('.adm-stage').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
  await page.mouse.move(box.x, box.y); await page.mouse.down(); await page.mouse.move(box.x + 90, box.y + 10, { steps: 4 }); await page.waitForTimeout(150);
  const ry = await page.evaluate(() => +document.querySelector('.adm-stage').style.getPropertyValue('--ry'));
  chk(ry > 10, 'glisser vers la droite incline le personnage (--ry = ' + ry + ')');
  await page.screenshot({ path: SHOTS + 'adm_tilt.png' });
  await page.mouse.up(); await page.waitForTimeout(600);
  chk(await page.evaluate(() => document.querySelector('.adm-stage').style.getPropertyValue('--ry') === '0'), 'relâcher : retour de face');
  await ev(`window.__pings=0; var __o=playAdmirePing; playAdmirePing=function(s){ window.__pings++; }`);
  await page.mouse.click(box.x, box.y); await page.waitForTimeout(250);
  chk(await ev(`window.__pings`) === 1 && await page.evaluate(() => document.querySelectorAll('.adm-fx.front .fx-burst').length > 4 && document.querySelector('.adm-figure').classList.contains('hop')), 'un simple toucher : saut, éclat de particules et son');
  // --- le portrait tient dans l'écran
  const fits = await page.evaluate(() => { const r = document.querySelector('.adm-art img, .adm-art .fullbody-compose').getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight; });
  chk(fits, 'le portrait tient dans l\'écran');
  // --- fermeture
  await page.keyboard.press('Escape'); await page.waitForTimeout(200);
  chk(!(await info()).open, 'Échap ferme');
  // --- mascotte du boutique : touche pour admirer
  await ev(`mascotIds.cats='cat03'; saveMascot(); renderShop()`);
  await page.click('#shop-mascot-panel'); await page.waitForTimeout(300);
  chk((await info()).open && (await info()).name === await ev(`CAT_SPRITES[2].name`), 'toucher la mascotte du clan l\'ouvre en grand');
  await page.click('.adm-close'); await page.waitForTimeout(200);

  // --- cérémonie d'évolution : phases, sons, étoiles
  await ev(`window.__tones=0; var __rt=revealTone; revealTone=function(){ window.__tones++; };`);
  await ev(`showEvolution(CAT_SPRITES[3], 1, 2)`);
  const ph = () => page.evaluate(() => (document.getElementById('evo-overlay') || { className: '' }).className);
  chk(/charging/.test(await ph()), 'phase 1 : charge');
  await page.waitForFunction(() => /boom/.test((document.getElementById('evo-overlay') || { className: '' }).className), null, { timeout: 4000 });
  await page.screenshot({ path: SHOTS + 'evo_boom.png' });
  await page.waitForFunction(() => /shown/.test(document.getElementById('evo-overlay').className), null, { timeout: 4000 });
  await page.waitForTimeout(1500);
  const fin = await page.evaluate(() => ({ head: document.querySelector('.eo-head').textContent, stars: document.querySelectorAll('.eo-stars span').length, stat: document.querySelector('.eo-stat').textContent, rings: getComputedStyle(document.querySelector('.eo-ring.r3')).animationName, burst: document.querySelectorAll('.eo-fx.front .fx-burst, .eo-fx.front .fx-rise').length, art: !!document.querySelector('.eo-art.evo-2') }));
  chk(/Ultime/.test(fin.head) && fin.stars === 2 && /→|\(\+/.test(fin.stat) && fin.art, 'phase finale : « ' + fin.head + ' », ' + fin.stars + ' étoiles, ' + fin.stat);
  chk(fin.rings !== 'none', 'niveau 2 : troisième onde de choc');
  chk(await ev(`window.__tones`) > 30, 'sons joués : ' + await ev(`window.__tones`) + ' notes (charge + explosion + fanfare + étoiles)');
  await page.screenshot({ path: SHOTS + 'evo_final.png' });
  await page.click('.eo-ok'); await page.waitForTimeout(200);
  chk(!(await page.evaluate(() => !!document.getElementById('evo-overlay'))), 'le bouton ferme la cérémonie');
  // niveau 1 : une seule étoile, 2 ondes ; toucher = passer directement à la fin
  await ev(`window.__tones=0; showEvolution(BRAINROT_SPRITES[3], 0, 1)`);
  await page.waitForTimeout(400); await page.mouse.click(195, 400); await page.waitForTimeout(300);
  chk(/shown/.test(await ph()) && await page.evaluate(() => document.querySelectorAll('.eo-stars span').length) === 1, 'toucher pendant la charge : passe à la fin (1 étoile au niveau 1)');
  await page.keyboard.press('Escape'); await page.waitForTimeout(200);
  chk(!(await page.evaluate(() => !!document.getElementById('evo-overlay'))), 'Échap ferme (après la fin)');
  // mouvement réduit : tout de suite à la fin
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await ev(`showEvolution(CAT_SPRITES[4], 0, 1)`); await page.waitForTimeout(100);
  chk(/shown/.test(await ph()), 'mouvement réduit : résultat immédiat');
  await page.keyboard.press('Escape');
  console.log(bad ? 'ÉCHEC' : 'OK');
});
