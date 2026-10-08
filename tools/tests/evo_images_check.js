// Images d'évolution : un chat Évolué montre SON image (sans cadre ni étincelles), Ultime sans image propre reprend celle
// d'Évolué avec l'effet ; Admirer passe d'un niveau à l'autre ; la mascotte retient le niveau choisi (et après rechargement).
const { withPage } = require('./lib');
withPage({ page: 'index_test.html', viewport: { width: 390, height: 780 } }, async (page) => {
  let bad = 0; const chk = (ok, msg) => { console.log(ok ? '  ok' : '  ✘ ÉCHEC', msg); if (!ok) bad++; };
  const ev = c => page.evaluate(x => window.__t.__eval(x), c);
  const J = async c => JSON.parse(await ev(c));
  const o = await J(`JSON.stringify({ n: ['cat01','cat02','cat03','cat04','cat05','cat06','cat07','cat08','cat09','cat10','cat11','cat12'].filter(function(i){ return CUSTOM_IMG[i] && CUSTOM_IMG[i].e1 && CUSTOM_IMG[i].e1.f && CUSTOM_IMG[i].e1.u; }).length,
    e5: evoArt(findAnySprite('cat05'), 1).exact, e12: evoArt(findAnySprite('cat12'), 2).exact, e0: evoArt(findAnySprite('cat05'), 0) })`);
  chk(o.n === 12, 'les 12 premiers chats ont une image Évolué (visage et en pied) : ' + o.n);
  chk(o.e5 === true && o.e12 === false && o.e0 === null, 'Évolué = image exacte ; Ultime sans image propre = image Évolué ; de base = aucune');
  await ev("unlockAllSprites(); evoCats['cat05']=1; evoCats['cat12']=2; delete evoCats['cat03']; saveEvo(); mascotIds.cats='cat05'; mascotLvls.cats=null; saveMascot(); renderMascotDock(); renderTopMascotIcon(); 0");
  await page.click('#stars-btn'); await page.waitForTimeout(500);
  const card = id => page.evaluate(id => { const cs = [...document.querySelectorAll('#shop-grid .sprite-card')]; const c = cs.find(x => x.textContent.includes(id)); const v = c.querySelector('.sp-custom-img'); const wrap = v.parentElement;
    return { src: v.src.slice(0, 80), evoImg: v.classList.contains('evo-art-img'), fx: wrap.classList.contains('evo-1') || wrap.classList.contains('evo-2'), sparks: wrap.querySelectorAll('.evo-spark').length, badge: (wrap.querySelector('.evo-badge') || {}).textContent || '' }; }, id);
  const want = await J(`JSON.stringify({ e5: CUSTOM_IMG.cat05.e1.f.slice(0,80), b3: CUSTOM_IMG.cat03.f.slice(0,80), e12: CUSTOM_IMG.cat12.e1.f.slice(0,80) })`);
  const c5 = await card('Éclairon'), c3 = await card('Pétale'), c12 = await card('Flammèche');
  chk(c5.src === want.e5 && c5.evoImg && !c5.fx && c5.sparks === 0 && c5.badge === '★', 'boutique : Éclairon Évolué = son image, une étoile, sans cadre ni étincelles');
  chk(c3.src === want.b3 && !c3.evoImg && !c3.fx, 'boutique : Pétale de base = image de base');
  chk(c12.src === want.e12 && c12.fx && c12.sparks > 0 && c12.badge === '★★', 'boutique : Flammèche Ultime (pas d\'image propre) = image Évolué + effet Ultime');
  // Bataille : la carte (gardée en mémoire) change d'image quand le chat évolue
  await page.click('#battle-btn'); await page.waitForTimeout(400);
  await ev("evoCats['cat01']=1; saveEvo(); 0");
  await page.click('#stars-btn'); await page.waitForTimeout(200); await page.click('#battle-btn'); await page.waitForTimeout(500);
  const bt = await page.evaluate(() => { const c = [...document.querySelectorAll('#bt-grid-classic .sprite-card')].find(x => x.textContent.includes('Lavandou')); const i = c.querySelector('img'); return { src: i.src.slice(0,80), n: c.querySelectorAll(':scope > img').length }; });
  chk(bt.src === await ev('CUSTOM_IMG.cat01.e1.f.slice(0,80)') && bt.n === 1, 'bataille : Lavandou devenu Évolué montre sa nouvelle image (une seule)');
  await page.click('#stars-btn'); await page.waitForTimeout(300);
  // Admirer : niveaux atteints, passage de l'un à l'autre
  await ev("showAdmire(findAnySprite('cat12')); 0"); await page.waitForTimeout(600);
  const adm = () => page.evaluate(() => ({ lv: [...document.querySelectorAll('.adm-lv')].map(b => b.textContent + (b.getAttribute('aria-pressed') === 'true' ? '*' : '')), src: (document.querySelector('.adm-art img') || {}).src || '', mb: document.querySelector('.adm-mascot').textContent }));
  let a = await adm();
  chk(a.lv.length === 3 && /Ultime\*$/.test(a.lv[2]), 'Admirer : 3 niveaux atteints, Ultime montré d\'abord : ' + a.lv.join(' | '));
  await page.click('.adm-lv >> nth=0'); await page.waitForTimeout(400); a = await adm();
  const baseU = await ev('CUSTOM_IMG.cat12.u.slice(0,80)');
  chk(a.src.slice(0, 80) === baseU && /De base\*$/.test(a.lv[0]), 'Admirer : « De base » montre l\'image de base');
  chk(/Choisir comme mascotte/.test(a.mb), 'Admirer : bouton « Choisir comme mascotte »');
  await page.click('.adm-mascot'); await page.waitForTimeout(300); a = await adm();
  const m = await J(`JSON.stringify({ id: mascotIds.cats, lv: mascotLvls.cats, store: localStorage.getItem('geo_mascot_lv_cats'), dock: (document.querySelector('#mascot-visual img') || {}).src ? document.querySelector('#mascot-visual img').src.slice(0,80) : '' })`);
  chk(m.id === 'cat12' && m.lv === 0 && m.store === '0' && /Ma mascotte/.test(a.mb), 'mascotte : Flammèche au niveau de base, retenu');
  chk(m.dock === baseU, 'la mascotte (en bas) montre l\'image de base choisie');
  // niveau le plus haut : la mascotte suit les évolutions (rien de figé)
  await page.click('.adm-lv >> nth=2'); await page.waitForTimeout(300); await page.click('.adm-mascot'); await page.waitForTimeout(300);
  chk(await ev("mascotLvls.cats === null && localStorage.getItem('geo_mascot_lv_cats') === null"), 'niveau le plus haut choisi : la mascotte suivra les évolutions suivantes');
  // naviguer vers un autre chat remet son niveau le plus haut
  await page.click('.adm-next'); await page.waitForTimeout(300);
  chk(await page.evaluate(() => document.querySelectorAll('.adm-lv').length === 0 || document.querySelector('.adm-levels').hidden), 'Admirer : chat sans évolution = pas de choix de niveau');
  await page.keyboard.press('Escape');
  // persistance après rechargement
  await ev("setMascot(findAnySprite('cat05'), 0); 0");
  await page.reload(); await page.waitForTimeout(500);
  chk(await ev("mascotIds.cats === 'cat05' && mascotLevel(findAnySprite('cat05')) === 0"), 'après rechargement : mascotte et niveau retrouvés');
  await ev('resetProgress(); 0');
  chk(await ev("localStorage.getItem('geo_mascot_lv_cats') === null && mascotLvls.cats === null"), 'effacer la progression oublie aussi le niveau de la mascotte');
  console.log(bad ? 'ÉCHEC' : 'evo_images_check OK'); process.exit(bad ? 1 : 0);
});
