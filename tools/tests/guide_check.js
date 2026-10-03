// Guides (tutoriels en surbrillance) : déclenchement, étapes, repli, réglages, et règle de bataille sans rôle obligatoire.
const { withPage, SHOTS } = require('./lib');
withPage({ page: 'index_test.html', viewport: { width: 390, height: 844 }, guides: true }, async (page) => {
  const ev = c => page.evaluate(x => window.__t.__eval(x), c);
  let bad = 0; const chk = (ok, m) => { console.log(ok ? '  ok' : '  ✘', m); if (!ok) bad++; };
  const open = () => page.evaluate(() => { const l = document.querySelector('.guide-layer'); return !!l && !l.hidden; });
  const txt = () => page.evaluate(() => document.getElementById('guide-text').textContent);
  const stepTxt = () => page.evaluate(() => document.getElementById('guide-step').textContent);
  const next = () => page.evaluate(() => document.getElementById('guide-next').click());
  // ---------- accueil : au premier lancement (le splash vient d'être fermé par lib.js)
  await page.waitForFunction(() => { const l = document.querySelector('.guide-layer'); return l && !l.hidden; }, null, { timeout: 5000 }).catch(() => {});
  chk(await open(), 'le guide d\'accueil démarre tout seul au premier lancement');
  chk(/1 \/ \d+ · Découvrir le jeu/.test(await stepTxt()), 'compteur d\'étapes : ' + await stepTxt());
  await page.screenshot({ path: SHOTS + 'guide_0_bienvenue.png' });
  // on avance jusqu'à l'étape du menu : le cadre lumineux doit entourer #menu-btn
  await next(); await page.waitForTimeout(450);   // fin de la transition du cadre
  const r = await page.evaluate(() => { const s = document.getElementById('guide-spot').getBoundingClientRect(), t = document.getElementById('menu-btn').getBoundingClientRect(), b = document.getElementById('guide-bubble').getBoundingClientRect();
    return { around: s.left <= t.left && s.top <= t.top && s.right >= t.right && s.bottom >= t.bottom, bubbleInside: b.left >= 0 && b.right <= innerWidth && b.top >= 0 && b.bottom <= innerHeight, overlap: !(b.bottom < s.top || b.top > s.bottom) }; });
  chk(r.around, 'le cadre lumineux entoure le bouton Menu');
  chk(r.bubbleInside && !r.overlap, 'la bulle reste dans l\'écran et ne cache pas l\'élément');
  await page.waitForTimeout(400); await page.screenshot({ path: SHOTS + 'guide_1_menu.png' });
  chk(await page.evaluate(() => document.activeElement.id) === 'guide-next', 'le focus clavier est sur « Suivant »');
  await page.keyboard.press('Tab'); await page.keyboard.press('Tab'); await page.keyboard.press('Tab');
  chk(await page.evaluate(() => !!document.activeElement.closest('#guide-bubble')), 'le focus reste dans la bulle (Tab)');
  let n = 0; while (await open() && n++ < 20) await next();
  chk(!(await open()), 'on arrive à la fin du guide (' + n + ' clics en tout)');
  chk(await page.evaluate(() => JSON.parse(localStorage.getItem('geo_guides')).accueil === 1), 'guide marqué comme vu');
  await page.waitForTimeout(3200);
  chk(!(await open()), 'le guide ne revient pas une fois vu');
  // ---------- Échap passe le guide
  await ev(`guideStart('accueil')`); await page.keyboard.press('Escape');
  chk(!(await open()), 'Échap ferme le guide');
  // ---------- boutique : 25 étoiles (prix d'un personnage) et jamais acheté
  await ev(`stars=24; document.getElementById('starCount').textContent=24; delete guideSeen.boutique; guideSave();`);
  await page.waitForTimeout(3200);
  chk(!(await open()), 'à 24 étoiles : pas de guide boutique');
  await ev(`addStar(1)`);
  await page.waitForFunction(() => { const l = document.querySelector('.guide-layer'); return l && !l.hidden; }, null, { timeout: 5000 }).catch(() => {});
  chk(await open() && /boutique|étoiles/i.test(await txt()), 'à 25 étoiles, sans achat : le guide boutique démarre');
  await next(); await page.waitForTimeout(350);
  chk(await page.evaluate(() => !document.getElementById('tab-shop').hidden), 'étape 2 : la boutique s\'ouvre');
  await page.screenshot({ path: SHOTS + 'guide_2_boutique.png' });
  n = 0; while (await open() && n++ < 20) await next();
  chk(!(await open()) && await ev(`guideSeen.boutique`) === 1, 'guide boutique terminé et mémorisé');
  // déjà acheté : pas de guide
  await ev(`showTab('facile'); delete guideSeen.boutique; guideSave(); guideMarkBought();`);
  await page.waitForTimeout(3200);
  chk(!(await open()), 'une fois un achat fait : pas de guide boutique');
  // ---------- bataille : premier passage dans la Bataille
  await ev(`delete guideSeen.bataille; guideSave(); var k=0; CAT_SPRITES.forEach(function(s){ if(!s.starter && k<5){ ownedCats[s.id]=true; k++; } });`);
  await page.waitForTimeout(3200);
  chk(!(await open()), 'avoir débloqué des personnages ne lance plus le guide bataille tout seul');
  await page.evaluate(() => document.getElementById('battle-btn').click());
  await page.waitForFunction(() => { const l = document.querySelector('.guide-layer'); return l && !l.hidden; }, null, { timeout: 4000 }).catch(() => {});
  chk(await open() && /Bataille/.test(await txt()), 'à la première entrée dans la Bataille : le guide démarre');
  await page.waitForTimeout(450); await page.screenshot({ path: SHOTS + 'guide_3_bataille.png' });
  chk(await page.evaluate(() => document.getElementById('guide-mascot').children.length > 0 || document.getElementById('guide-mascot').textContent.length > 0), 'la mascotte est dans la bulle');
  n = 0; while (await open() && n++ < 20) await next();
  chk(!(await open()) && await ev(`guideSeen.bataille`) === 1, 'guide bataille terminé et mémorisé');
  await page.evaluate(() => document.getElementById('battle-btn').click()); await page.evaluate(() => document.getElementById('battle-btn').click());
  await page.waitForTimeout(2200);
  chk(!(await open()), 'deuxième entrée dans la Bataille : pas de guide');
  // ---------- série : première série de 10
  await ev(`showTab('facile'); setAppMode('auto'); practiceMode='free'; delete guideSeen.serie; guideSave(); resetFreeStreak(); freeStreak=9; updateStreakPill();`);
  await page.waitForTimeout(3200);
  chk(!(await open()), 'série de 9 : pas de guide');
  await ev(`freeStreak=10; updateStreakPill();`);
  await page.waitForFunction(() => { const l = document.querySelector('.guide-layer'); return l && !l.hidden; }, null, { timeout: 4000 }).catch(() => {});
  chk(await open() && /10 bonnes réponses/.test(await txt()), 'à 10 bonnes réponses d\'affilée : le guide Série démarre');
  await page.waitForTimeout(450); await page.screenshot({ path: SHOTS + 'guide_5_serie.png' });
  n = 0; while (await open() && n++ < 20) await next();
  chk(!(await open()) && await ev(`guideSeen.serie`) === 1, 'guide Série terminé et mémorisé');
  await ev(`resetFreeStreak()`);
  // ---------- réglages → Guides
  await ev(`showTab('facile')`);
  await page.evaluate(() => document.getElementById('settings-btn').click());
  await page.evaluate(() => document.getElementById('open-guides-btn').click());
  chk(await page.evaluate(() => !document.getElementById('guides-overlay').hidden && document.getElementById('settings-overlay').hidden && document.querySelectorAll('[data-guide]').length === 4), 'Réglages → Guides : 4 boutons');
  await page.screenshot({ path: SHOTS + 'guide_4_reglages.png' });
  for (const id of ['accueil', 'boutique', 'bataille', 'serie']) {
    await page.evaluate(() => { const o = document.getElementById('guides-overlay'); o.hidden = false; });
    await page.evaluate(i => document.querySelector('[data-guide="' + i + '"]').click(), id);
    chk(await open() && await ev(`guideState.id`) === id, 'le bouton relance le guide « ' + id + ' » même déjà vu');
    await page.keyboard.press('Escape');
  }
  // ---------- effacer la progression : les guides contextuels reviennent, pas l'accueil
  await ev(`resetProgress()`);
  chk(await ev(`guideSeen.accueil===1 && !guideSeen.boutique && !guideSeen.bataille && !guideBought()`), 'Effacer ma progression : guides boutique/bataille rejouables, accueil conservé');
  // ---------- bataille : soutien et archer facultatifs
  await ev(`showTab('battle'); var sp=btMyList().filter(function(s){return s.role==='classic';}); ownedCats[sp[0].id]=true; ownedCats[sp[1].id]=true; btSel.cats={classic:[sp[0].id,sp[1].id],support:[],archer:[]}; renderBtSetup();`);
  const st = await page.evaluate(() => ({ dis: document.getElementById('bt-start').disabled, miss: document.getElementById('bt-missing').textContent }));
  chk(!st.dis && /Pas de soutien ni d'archer/.test(st.miss), 'équipe de 2 classiques : combat possible, avec rappel « Pas de soutien ni d\'archer »');
  await ev(`btStart()`);
  const comp = JSON.parse(await ev(`JSON.stringify({ me:bt.pl.field.concat(bt.pl.reserve).map(function(u){return u.sprite.role;}).sort(), en:bt.en.field.concat(bt.en.reserve).map(function(u){return u.sprite.role;}).sort() })`));
  chk(JSON.stringify(comp.me) === '["classic","classic"]' && JSON.stringify(comp.en) === JSON.stringify(comp.me), 'l\'équipe adverse a la même composition : ' + comp.en);
  chk(await page.evaluate(() => !document.getElementById('bt-arena').hidden), 'le combat démarre');
  await ev(`btBackToSetup(); btSel.cats={classic:[],support:[],archer:[]}; renderBtSetup();`);
  chk(await page.evaluate(() => document.getElementById('bt-start').disabled), 'équipe vide : bouton désactivé');
  console.log(bad ? 'ÉCHEC' : 'OK');
});
