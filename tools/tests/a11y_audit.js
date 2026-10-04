// Audit d'accessibilité (RGAA 4 ↔ WCAG 2.2 A/AA) avec axe-core, sur tous les écrans,
// dans les deux clans. axe-core s'installe à part (hors dépôt) :
//   cd tools/tests && npm install --no-save axe-core@4
// Chaque violation est listée avec l'élément en cause ; 0 violation attendue.
const fs = require('fs');
const path = require('path');
const { withPage } = require('./lib');
let AXE;
try { AXE = fs.readFileSync(require.resolve('axe-core/axe.min.js', { paths: [__dirname] }), 'utf8'); }
catch (e) { console.log('axe-core absent : cd tools/tests && npm install --no-save axe-core@4'); process.exit(1); }

const FAMS = ['measure', 'estimate', 'deform', 'net', 'qcm', 'clock-lire', 'clock-regler', 'atelier-sym', 'atelier-fraction', 'atelier-copie'];
(async () => {
  let total = 0;
  for (const theme of ['cats', 'brainrot']) {
    await withPage({ page: 'index_test.html', viewport: { width: 390, height: 900 }, init: `localStorage.setItem('geo_theme','${theme}')` }, async (page) => {
      const ev = c => page.evaluate(x => window.__t.__eval(x), c);
      await page.addScriptTag({ content: AXE });
      const run = async (name) => {
        await page.waitForTimeout(500);   // laisse finir les fondus d'apparition avant de mesurer
        const res = await page.evaluate(async () => {
          const r = await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] },
            rules: { 'region': { enabled: false } } });
          return r.violations.map(v => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.slice(0, 4).map(n => n.target.join(' ') + ' — ' + (n.failureSummary || '').split('\n').slice(1, 2).join('').trim()) , n: v.nodes.length }));
        });
        total += res.length;
        console.log(`\n=== ${theme} / ${name} : ${res.length} règle(s) en défaut`);
        res.forEach(v => { console.log(`  [${v.impact}] ${v.id} (${v.n}) : ${v.help}`); v.nodes.forEach(n => console.log('     · ' + n)); });
      };
      await ev(`appMode='auto'; practiceMode='free'; autoAdvanceThreshold=1e9;`);
      for (const f of FAMS) {
        await ev(`generateFamilyQuestion('${f}')`);
        await run('question ' + f);
      }
      // retour de réponse (question fermée)
      await ev(`generateFamilyQuestion('qcm'); document.querySelector('#m4-choices .choice-btn').click()`);
      await run('quizz répondu');
      await ev(`m3Reduce=true; generateFamilyQuestion('net'); document.querySelector('#m3-choices .choice-btn').click()`);
      await page.waitForTimeout(100);
      await run('patron plié');
      await page.click('#menu-btn'); await run('menu ouvert'); await page.keyboard.press('Escape');
      await page.click('#settings-btn'); await run('réglages');
      await page.click('#open-progress-btn'); await run('progression');
      await page.click('#progress-close');
      await page.click('#settings-btn'); await page.click('#open-guides-btn'); await run('guides (réglages)');
      await page.click('[data-guide="accueil"]'); await page.click('#guide-next'); await page.waitForTimeout(400); await run('guide en cours (étape sur un bouton)');
      await page.keyboard.press('Escape');
      await page.click('#settings-btn'); await page.click('#open-activity-config-btn'); await run('activités & difficulté');
      await page.click('#activity-config-close');
      await page.click('#stars-btn'); await run('boutique');
      await page.click('#battle-btn'); await run('bataille');
      await page.click('#battle-btn');
      await page.click('#menu-btn'); await page.click('.tab-btn[data-tab="manuel"]'); await run('mode manuel');
      await page.click('#menu-btn'); await page.click('.tab-btn[data-tab="facile"]');
      await page.evaluate(() => [...document.querySelectorAll('#practice-mode .level-btn')].find(x => x.textContent.includes('Chrono')).click());
      await run('chrono : réglage');
      await page.click('#countdown-start-btn'); await run('chrono en cours');
    });
  }
  console.log(total ? `\nÉCHEC : ${total} défaut(s)` : '\nOK : aucun défaut');
})();
