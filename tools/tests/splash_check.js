// Écran de lancement : les deux moitiés arrivent, s'entrechoquent (flash, ondes, étincelles, VS), puis se posent. Clic sur l'image = rejouer.
const { withPage, SHOTS } = require('./lib');
// Deux cas : image perso (assets/branding/splash.png, aussi embarquée en base64, scindée en deux) et dessin SVG de secours (image introuvable).
const NO_IMG = `(function(){ var D=Object.getOwnPropertyDescriptor(HTMLImageElement.prototype,'src');
  Object.defineProperty(HTMLImageElement.prototype,'src',{ get:function(){ return D.get.call(this); }, set:function(v){ if(/branding\\/splash\\./.test(v) || (v.length>120000 && /^data:image\\/webp/.test(v))){ var t=this; setTimeout(function(){ if(t.onerror) t.onerror(); },0); return; } D.set.call(this,v); } }); })();`;
const SLOW = NO_IMG.replace('setTimeout(function(){ if(t.onerror) t.onerror(); },0)', 'setTimeout(function(){ if(t.onerror) t.onerror(); },900)');
// Recherche d'image lente : la carte attend (rien dessiné, rien animé) puis, au filet de 2,5 s, le dessin joue.
(async () => {
console.log('== attente');
await withPage({ page: 'index_test.html', viewport: { width: 390, height: 780 }, init: SLOW }, async (page) => {
  let bad = 0; const chk = (ok, m) => { console.log(ok ? '  ok' : '  ✘', m); if (!ok) bad++; };
  await page.waitForTimeout(100);
  const st = () => page.evaluate(() => ({ wait: document.querySelector('.splash-card').classList.contains('sp-wait'), drawn: document.getElementById('splashSvg').childNodes.length, vis: getComputedStyle(document.getElementById('splashSvg')).visibility, title: +getComputedStyle(document.querySelector('.splash-title')).opacity }));
  const w = await st();
  chk(w.wait && w.drawn === 0 && w.vis === 'hidden' && w.title === 0, 'pendant la recherche : carte en attente, rien dessiné, rien visible');
  await page.waitForTimeout(3000);
  const d = await st();
  chk(!d.wait && d.drawn > 0, 'filet de 2,5 s : le dessin de secours est lancé');
  console.log(bad ? 'ÉCHEC' : 'OK');
});
for (const mode of ['image', 'svg']) {
console.log('== ' + mode);
await withPage({ page: 'index_test.html', viewport: { width: 390, height: 780 }, init: mode === 'svg' ? NO_IMG : undefined }, async (page) => {
  const L = mode === 'svg' ? '.sp-left' : '.sp-hl', R = mode === 'svg' ? '.sp-right' : '.sp-hr';
  const ART = mode === 'svg' ? '#splashSvg' : '.sp-split';
  let bad = 0; const chk = (ok, m) => { console.log(ok ? '  ok' : '  ✘', m); if (!ok) bad++; };
  const box = sel => page.evaluate(s => { const r = document.querySelector(s).getBoundingClientRect(); return [Math.round(r.x), Math.round(r.right)]; }, sel);
  const show = async () => { await page.evaluate(() => { const o = document.getElementById('splash-overlay'); o.hidden = false; o.classList.remove('splash-hide'); }); };
  await page.waitForTimeout(500);   // laisse finir la fermeture lancée par lib.js
  await show();
  await page.evaluate(a => document.querySelector(a).dispatchEvent(new MouseEvent('click', { bubbles: true })), ART);   // rejoue
  const t0 = Date.now();
  const at = async ms => { const w = ms - (Date.now() - t0); if (w > 0) await page.waitForTimeout(w); };
  await at(150);
  const [lx0] = await box(L); const [, rr0] = await box(R);
  const svgB = await page.evaluate(a => { const r = document.querySelector(a).getBoundingClientRect(); return [r.x, r.right]; }, ART);
  chk(lx0 < svgB[0] - 20 && rr0 > svgB[1] + 20, 'au départ : les moitiés sont hors cadre, chacune de son côté');
  await page.screenshot({ path: SHOTS + 'splash_'+mode+'_1_arrivee.png' });
  await at(520);
  await page.screenshot({ path: SHOTS + 'splash_'+mode+'_2_avant_choc.png' });
  await at(760);
  const fl = await page.evaluate(() => ({ spark: [...document.querySelectorAll('.sp-spark')].filter(e => e.closest('svg').getBoundingClientRect().width > 0).filter(e => +getComputedStyle(e).opacity > 0.1).length, ring: +getComputedStyle(document.querySelector('.sp-ring1')).opacity }));
  chk(fl.spark > 10 && fl.ring > 0.2, 'au choc : ' + fl.spark + ' étincelles visibles, onde de choc visible');
  await page.screenshot({ path: SHOTS + 'splash_'+mode+'_3_choc.png' });
  await at(1000);
  await page.screenshot({ path: SHOTS + 'splash_'+mode+'_4_apres.png' });
  await at(2700);
  const end = await page.evaluate(([L, R, svg]) => { const m = el => getComputedStyle(el).transform; return { l: m(document.querySelector(L)), r: m(document.querySelector(R)), vs: svg ? m(document.querySelector('.sp-vs')) : 'none', sp: [...document.querySelectorAll('.sp-spark')].filter(e=>e.closest('svg').getBoundingClientRect().width>0).map(e=>+getComputedStyle(e).opacity).filter(o=>o!==0).length===0, btn: +getComputedStyle(document.getElementById('splash-start-btn')).opacity }; }, [L, R, mode === 'svg']);
  const ident = t => t === 'none' || t === 'matrix(1, 0, 0, 1, 0, 0)';
  chk(ident(end.l) && ident(end.r) && ident(end.vs), 'au repos : moitiés et VS à leur place');
  chk(end.sp && end.btn === 1, 'étincelles éteintes, bouton visible');
  await page.screenshot({ path: SHOTS + 'splash_'+mode+'_5_repos.png' });
  // le bouton reste utilisable même pendant l'animation
  await page.evaluate(a => document.querySelector(a).dispatchEvent(new MouseEvent('click', { bubbles: true })), ART);
  await page.waitForTimeout(100);
  await page.click('#splash-start-btn');
  await page.waitForTimeout(500);
  chk(await page.evaluate(() => document.getElementById('splash-overlay').hidden), 'le bouton « Commencer » fonctionne pendant l\'animation');
  // mouvement réduit : image finale directe
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await show();
  await page.evaluate(a => document.querySelector(a).dispatchEvent(new MouseEvent('click', { bubbles: true })), ART);
  await page.waitForTimeout(100);
  const rm = await page.evaluate(l => ({ l: getComputedStyle(document.querySelector(l)).transform, flash: getComputedStyle(document.querySelector('.sp-flash')).display }), L);
  chk(ident(rm.l) && rm.flash === 'none', 'mouvement réduit : image fixe, sans flash');
  console.log(bad ? 'ÉCHEC' : 'OK');
}); } })();
