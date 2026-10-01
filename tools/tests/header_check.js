// En-tête : l'icône de la mascotte ouvre le menu (colonne sous l'icône), qui se referme
// après un choix, au toucher ailleurs et avec Échap ; pendant un défi chronométré,
// la même icône quitte le défi (pas de mode plein écran).
const { withPage, SHOTS } = require('./lib');
withPage({ page: 'index_test.html', viewport: { width: 390, height: 844 } }, async (page) => {
  let bad = 0; const chk = (ok, msg) => { console.log(ok ? '  ok' : '  ✘', msg); if (!ok) bad++; };
  const navHidden = () => page.evaluate(() => document.getElementById('main-nav').hidden);
  const attr = (id, a) => page.evaluate(([i, x]) => document.getElementById(i).getAttribute(x), [id, a]);
  chk(await page.evaluate(() => !document.querySelector('#appTitle') || getComputedStyle(document.getElementById('appTitle')).position === 'absolute'), 'nom du clan masqué (gardé pour les lecteurs d\'écran)');
  chk(await page.evaluate(() => !document.querySelector('.menu-btn .vh') && !/Menu$/.test(document.getElementById('menu-btn').textContent.trim())), 'plus de libellé « Menu » visible');
  chk(await navHidden(), 'menu fermé au départ');
  await page.click('#menu-btn');
  chk(!(await navHidden()) && await attr('menu-btn', 'aria-expanded') === 'true', 'toucher l\'icône ouvre le menu');
  const box = await page.evaluate(() => { const b = document.getElementById('menu-btn').getBoundingClientRect(), n = document.getElementById('main-nav').getBoundingClientRect(), items = [...document.querySelectorAll('#main-nav .tab-btn')].map(x => x.getBoundingClientRect()); return { below: n.top >= b.bottom, left: Math.abs(n.left - b.left) < 2, vertical: items.every((r, i) => i === 0 || r.top > items[i - 1].bottom - 1), count: items.length }; });
  chk(box.below && box.left && box.vertical && box.count === 4, 'quatre choix en colonne, sous l\'icône ' + JSON.stringify(box));
  await page.screenshot({ path: SHOTS + 'h_menu_open.png' });
  await page.click('.tab-btn[data-tab="moyen"]');
  chk(await navHidden(), 'le menu se referme après un choix');
  chk(await page.evaluate(() => document.getElementById('menu-badge').textContent) === '🤔', 'la pastille montre le niveau Moyen');
  chk(/Moyen/.test(await attr('menu-btn', 'aria-label')), 'nom accessible : niveau actuel');
  await page.click('#menu-btn'); await page.keyboard.press('Escape');
  chk(await navHidden() && await page.evaluate(() => document.activeElement.id) === 'menu-btn', 'Échap ferme et rend le focus à l\'icône');
  await page.click('#menu-btn'); await page.mouse.click(200, 600);
  chk(await navHidden(), 'toucher ailleurs ferme le menu');
  // clavier : Entrée ouvre et place le focus dans le menu, flèches pour se déplacer
  await page.focus('#menu-btn'); await page.keyboard.press('Enter');
  chk(await page.evaluate(() => document.activeElement.classList.contains('tab-btn')), 'au clavier, le focus entre dans le menu');
  await page.keyboard.press('ArrowDown');
  chk(await page.evaluate(() => document.activeElement.dataset.tab) === 'difficile', 'flèche bas : entrée suivante');
  await page.keyboard.press('Escape');
  // chronométré
  await page.evaluate(() => [...document.querySelectorAll('#practice-mode .level-btn')].find(x => x.textContent.includes('Chrono')).click());
  await page.click('#countdown-start-btn');
  await page.waitForTimeout(300);
  const chrono = await page.evaluate(() => ({ running: document.body.classList.contains('chrono-running'), topbar: getComputedStyle(document.querySelector('.topbar')).display !== 'none', mode: getComputedStyle(document.getElementById('practice-mode')).display, badge: document.getElementById('menu-badge').textContent, label: document.getElementById('menu-btn').getAttribute('aria-label') }));
  chk(chrono.running && chrono.topbar && chrono.mode === 'none' && chrono.badge === '✕' && /Quitter/.test(chrono.label), 'chrono : barre du haut gardée, icône = quitter ' + JSON.stringify(chrono));
  await page.screenshot({ path: SHOTS + 'h_chrono.png' });
  await page.click('#menu-btn');
  await page.waitForTimeout(300);
  const after = await page.evaluate(() => ({ running: document.body.classList.contains('chrono-running'), nav: document.getElementById('main-nav').hidden, exercise: !document.getElementById('practice-exercise').hidden, badge: document.getElementById('menu-badge').textContent }));
  chk(!after.running && after.nav && after.exercise && after.badge === '🤔', 'toucher l\'icône quitte le défi (sans ouvrir le menu) ' + JSON.stringify(after));
  await page.click('#theme-toggle');
  await page.waitForTimeout(200);
  await page.screenshot({ path: SHOTS + 'h_brainrot.png' });
  console.log(bad ? 'ÉCHEC (' + bad + ')' : 'OK');
});
