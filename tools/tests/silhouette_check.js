// Personnages non débloqués : même image « ? » pour tout un clan, nom visible, rôle caché, pas d'aperçu.
const { withPage, SHOTS } = require('./lib');
withPage({ page: 'index_test.html', viewport: { width: 390, height: 800 } }, async (page) => {
  const ev = c => page.evaluate(x => window.__t.__eval(x), c);
  let bad = 0; const chk = (ok, msg) => { console.log(ok ? '  ok' : '  ✘', msg); if (!ok) bad++; };
  const sigs = {};
  for (const side of ['cats', 'brainrot']) {
    await ev(`applyTheme('${side}'); renderShop();`);
    await page.click('#stars-btn');
    const r = await page.evaluate(() => {
      const cards = [...document.querySelectorAll('#shop-grid .sprite-card.locked')];
      return { n: cards.length,
        svgs: [...new Set(cards.map(c => c.querySelector('svg').innerHTML))].length,
        custom: cards.filter(c => c.querySelector('.sp-custom-img')).length,
        names: cards.map(c => c.querySelector('.sp-name').textContent),
        roles: [...new Set(cards.map(c => c.querySelector('.sp-role').textContent))],
        q: [...new Set(cards.map(c => (c.querySelector('svg text') || {}).textContent))] };
    });
    console.log(side, r.n, 'cartes,', r.svgs, 'image(s) distincte(s)');
    sigs[side] = await page.evaluate(() => document.querySelector('#shop-grid .sprite-card.locked svg').innerHTML);
    chk(r.n > 0 && r.svgs === 1 && r.custom === 0 && JSON.stringify(r.q) === '["?"]', side + ' : une seule image « ? » pour tous les verrouillés');
    chk(r.names.every(n => n && n !== '???') && new Set(r.names).size === r.n, side + ' : noms visibles (ex. ' + r.names.slice(0, 2).join(', ') + ')');
    chk(r.roles.length >= 2 && r.roles.every(x => /^\S+ (Classique|Soutien|Archer) · ❤️ \?$/.test(x)), side + ' : classe visible, points cachés (' + r.roles.join(' | ') + ')');
    await page.evaluate(() => document.querySelector('#shop-grid .sprite-card.locked:not(.reward-locked)').click());
    chk(await page.evaluate(() => document.getElementById('info-overlay').hidden), side + ' : pas d\'aperçu au toucher');
    await page.evaluate(() => document.querySelector('#shop-grid .reward-locked').click());
    const t = await page.evaluate(() => ({ title: document.getElementById('info-title').textContent, q: !!document.querySelector('#info-body svg text') }));
    chk(/🔒/.test(t.title) && t.title.length > 3 && t.q, side + ' : fenêtre défi : nom + image « ? » (' + t.title + ')');
    await page.keyboard.press('Escape');
    await page.evaluate(() => document.querySelectorAll('#shop-grid .sprite-card.locked')[0].scrollIntoView());
    await page.waitForTimeout(300);
    await page.screenshot({ path: SHOTS + 'mystere_' + side + '.png' });
    await page.click('#stars-btn');
  }
  chk(sigs.cats !== sigs.brainrot, 'chat et brainrot ont chacun leur image');
  console.log(bad ? 'ÉCHEC' : 'OK');
});
