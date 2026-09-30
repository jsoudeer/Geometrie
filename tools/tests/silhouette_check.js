// Personnages non débloqués : ombre chinoise, aucun indice (nom, rôle, dialogue d'explication).
const { withPage, SHOTS } = require('./lib');
withPage({ page: 'index_test.html', viewport: { width: 390, height: 800 } }, async (page) => {
  let bad = 0; const chk = (ok, msg) => { console.log(ok ? '  ok' : '  ✘', msg); if (!ok) bad++; };
  await page.click('#stars-btn');
  const r = await page.evaluate(() => {
    const cards = [...document.querySelectorAll('#shop-grid .sprite-card.locked')];
    return { n: cards.length,
      names: [...new Set(cards.map(c => c.querySelector('.sp-name').textContent))],
      roles: [...new Set(cards.map(c => c.querySelector('.sp-role').textContent))],
      labels: [...new Set(cards.map(c => c.getAttribute('aria-label')).map(l => l.replace(/, .*$/, '')))],
      filters: [...new Set(cards.map(c => getComputedStyle(c.querySelector('svg, .sp-custom-img')).filter.split(' ')[0]))] };
  });
  console.log(JSON.stringify(r));
  chk(r.n > 0 && r.names.length === 1 && r.names[0] === '???', 'noms cachés (???)');
  chk(r.roles.length === 1 && /Mystère/.test(r.roles[0]), 'rôle et points cachés');
  chk(r.labels.length === 1 && r.labels[0] === 'Personnage mystère', 'libellé d\'accessibilité neutre');
  chk(r.filters.length === 1 && r.filters[0] === 'brightness(0)', 'dessin entièrement noir');
  await page.screenshot({ path: SHOTS + 'silhouette.png' });
  await page.evaluate(() => document.querySelector('#shop-grid .sprite-card.locked:not(.reward-locked)').click());
  chk(await page.evaluate(() => document.getElementById('info-overlay').hidden), 'toucher une carte verrouillée n\'ouvre pas d\'aperçu');
  await page.evaluate(() => document.querySelector('#shop-grid .reward-locked').click());
  const t = await page.evaluate(() => ({ title: document.getElementById('info-title').textContent, sil: getComputedStyle(document.querySelector('#info-body .info-art svg, #info-body .info-art .sp-custom-img')).filter.split(' ')[0], body: document.getElementById('info-body').textContent }));
  chk(/mystère/.test(t.title) && t.sil === 'brightness(0)', 'fenêtre de défi : titre neutre + silhouette (' + t.title + ')');
  console.log(bad ? 'ÉCHEC' : 'OK');
});
