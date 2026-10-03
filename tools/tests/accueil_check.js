// Écran d'accueil : parle de maths (plus seulement de géométrie), 9 thèmes affichés, symboles flottants, bouton toujours visible.
const { withPage, SHOTS } = require('./lib');
(async () => {
  let bad = 0; const chk = (ok, m) => { console.log(ok ? '  ok' : '  ✘', m); if (!ok) bad++; };
  for (const [w, h] of [[390, 844], [360, 600], [1000, 700]]) {
    await new Promise(done => withPage({ page: 'index_test.html', viewport: { width: w, height: h }, splash: true }, async (page) => {
      await page.waitForTimeout(3000);
      const r = await page.evaluate(() => {
        const card = document.querySelector('.splash-card'), btn = document.getElementById('splash-start-btn').getBoundingClientRect();
        return { text: card.textContent, chips: document.querySelectorAll('#splash-topics li').length, chipsShown: getComputedStyle(document.getElementById('splash-topics')).display !== 'none',
          syms: document.querySelectorAll('#splash-bg span').length, btnVisible: btn.top >= 0 && btn.bottom <= innerHeight, scroll: card.scrollHeight - card.clientHeight,
          domains: window.__t.__eval('DOMAINS.length'), badge: document.querySelector('.splash-badge').textContent };
      });
      const tag = ' (' + w + '×' + h + ')';
      chk(/maths/i.test(r.badge) && /jeu de maths/i.test(r.text) && !/g[ée]om[ée]trie/i.test(r.text), 'texte : « ' + r.badge.trim() + ' », « jeu de maths », plus de « géométrie »' + tag);
      chk(r.chips === r.domains && r.domains === 9, '9 thèmes en pastilles' + tag + (r.chipsShown ? '' : ' (masquées sur écran bas)'));
      chk(r.syms >= 18, r.syms + ' symboles de maths flottants' + tag);
      chk(r.btnVisible && r.scroll <= 1, 'le bouton « Commencer » est visible sans défiler' + tag);
      if (w === 390) await page.screenshot({ path: SHOTS + 'accueil.png' });
      // le jeu démarre toujours
      await page.click('#splash-start-btn'); await page.waitForTimeout(600);
      chk(await page.evaluate(() => document.getElementById('splash-overlay').classList.contains('splash-hide')), 'toucher « Commencer » ferme l\'accueil' + tag);
    }).then(done));
  }
  console.log(bad ? 'ÉCHEC' : 'OK');
})();
