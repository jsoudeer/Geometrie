// Téléphone en paysage (844×390) : barre verticale à gauche, modes en colonne, question sur deux colonnes, rien à défiler.
// En portrait, la mise en page reste celle d'avant (colonne unique). (fit_check couvre « tout tient » sur tous les formats.)
const { withPage } = require('./lib');
(async () => {
  let bad = 0; const chk = (ok, msg) => { console.log(ok ? '  ok' : '  ✘ ÉCHEC', msg); if (!ok) bad++; };
  const rect = (page, sel) => page.evaluate(s => { const e = document.querySelector(s); if (!e || !e.offsetParent && getComputedStyle(e).position !== 'fixed') return null; const r = e.getBoundingClientRect(); return { x:r.x, y:r.y, w:r.width, h:r.height, r:r.right, b:r.bottom }; }, sel);
  await withPage({ page: 'index_test.html', viewport: { width: 844, height: 390 } }, async (page) => {
    const ev = c => page.evaluate(x => window.__t.__eval(x), c);
    await ev("globalLevel=1; forcedQcmType='mesures'; generateFamilyQuestion('qcm'); forcedQcmType=null; 0"); await page.waitForTimeout(200);
    const top = await rect(page, '.topbar'), main = await rect(page, '#tabContent'), modes = await rect(page, '#practice-mode');
    chk(top && main && top.r <= main.x && top.w < 90, 'paysage : la barre du haut est une barre verticale à gauche (' + Math.round(top.w) + ' px)');
    chk(top.h > top.w * 3, 'paysage : la barre est haute et étroite');
    const mb = await page.evaluate(() => [...document.querySelectorAll('#practice-mode .level-btn')].map(b => { const r = b.getBoundingClientRect(); return [r.x, r.y]; }));
    chk(mb.length === 3 && mb.every(p => p[0] === mb[0][0]) && mb[1][1] > mb[0][1] && mb[2][1] > mb[1][1], 'paysage : les 3 modes sont empilés dans une barre à gauche');
    const q = await rect(page, '#fam-qcm .q-top'), a = await rect(page, '#fam-qcm .q-bottom');
    chk(q && a && q.r <= a.x + 1 && Math.abs(q.y - a.y) < 40, 'paysage : énoncé et figure à gauche, réponses à droite');
    chk(modes && modes.r <= q.x, 'paysage : les modes sont à gauche de l\'énoncé');
    chk(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight && document.documentElement.scrollWidth <= innerWidth), 'paysage : la page ne défile pas');
    chk(await page.evaluate(() => getComputedStyle(document.getElementById('mascot-dock')).display === 'none'), 'paysage : la mascotte flottante est masquée');
    // le menu (niveaux) s'ouvre à droite de la barre, entièrement visible
    await page.click('#menu-btn'); await page.waitForTimeout(250);
    const menu = await rect(page, '#main-nav');
    chk(menu && menu.x >= top.r - 1 && menu.b <= 390 && menu.r <= 844, 'paysage : le menu des niveaux s\'ouvre à droite de la barre, sans sortir de l\'écran');
    await page.click('#menu-btn');
    // écrans hors exercice : la barre reste visible quand on défile
    await page.click('#stars-btn'); await page.waitForTimeout(250);
    await page.evaluate(() => window.scrollTo(0, 200)); await page.waitForTimeout(100);
    const t2 = await rect(page, '.topbar');
    chk(t2 && t2.y >= -1 && t2.y < 20, 'paysage : la barre reste en haut à gauche sur la boutique, même en défilant');
  });
  await withPage({ page: 'index_test.html', viewport: { width: 390, height: 780 } }, async (page) => {
    const ev = c => page.evaluate(x => window.__t.__eval(x), c);
    await ev("globalLevel=1; forcedQcmType='mesures'; generateFamilyQuestion('qcm'); forcedQcmType=null; 0"); await page.waitForTimeout(200);
    const top = await rect(page, '.topbar'), q = await rect(page, '#fam-qcm .q-bottom');
    chk(top.w > 300 && top.h < 90, 'portrait : la barre du haut reste horizontale');
    chk(await page.evaluate(() => getComputedStyle(document.querySelector('#fam-qcm .q-top')).display === 'contents'), 'portrait : une seule colonne (regroupement transparent)');
    chk(q.y > 300, 'portrait : les réponses restent en bas');
  });
  console.log(bad ? 'ÉCHEC' : 'paysage_check OK'); process.exit(bad ? 1 : 0);
})();
