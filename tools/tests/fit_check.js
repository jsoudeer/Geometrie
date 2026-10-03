// Écran de question sur téléphone : la page ne défile pas et les boutons (réponses,
// Vérifier, Nouvelle activité) sont tous visibles sans faire défiler, pour chaque activité.
// Usage : node fit_check.js [--all] (par défaut : un tirage par activité ; --all : 6 tirages).
const { withPage, SHOTS } = require('./lib');
const SIZES = [[360, 640], [390, 664], [412, 760], [375, 667]];
const REP = process.argv.includes('--all') ? 6 : 2;
(async () => {
  let bad = 0; const worst = [];
  for (const [w, h] of SIZES) {
    await withPage({ page: 'index_test.html', viewport: { width: w, height: h } }, async (page) => {
      const ev = c => page.evaluate(x => window.__t.__eval(x), c);
      const keys = JSON.parse(await ev('JSON.stringify(FAMILIES.map(function(f){return f.key;}))'));
      const types = JSON.parse(await ev('JSON.stringify(QCM_TYPE_DEFS.map(function(t){return t.id;}))'));
      const measure = () => page.evaluate(() => {
        const vh = innerHeight, de = document.documentElement;
        const btns = [...document.querySelectorAll('#practice-exercise button, #practice-exercise .choice-btn, #practice-exercise .qcm-choice')]
          .filter(b => b.offsetParent && b.getBoundingClientRect().height > 0);
        const bottom = btns.length ? Math.max(...btns.map(b => b.getBoundingClientRect().bottom)) : 0;
        return { doc: de.scrollHeight, vh, bottom: Math.round(bottom), n: btns.length };
      });
      const jobs = [];
      for (const lv of [0, 1, 2]) {
        for (const k of keys) if (k !== 'qcm') jobs.push({ k, lv, t: null });
        for (const t of types) jobs.push({ k: 'qcm', lv, t });
      }
      for (const j of jobs) {
        for (let r = 0; r < REP; r++) {
          const ok = await ev(`(function(){ try{ globalLevel=${j.lv}; ${j.t ? `forcedQcmType='${j.t}';` : ''} generateFamilyQuestion('${j.k}'); forcedQcmType=null; return true; }catch(e){ return String(e); } })()`);
          if (ok !== true) { console.log('  ✘ ÉCHEC génération', j.k, j.t, ok); bad++; break; }
          await page.waitForTimeout(30);
          const m = await measure();
          const tooTall = m.doc > m.vh + 1 || m.bottom > m.vh + 1;
          if (tooTall) { bad++; worst.push(`${w}x${h} ${j.t || j.k} niv${j.lv} : page ${m.doc}, boutons jusqu'à ${m.bottom} (écran ${m.vh})`); }
          // après une réponse : le retour (bonne/mauvaise réponse + explication) s'ajoute, tout doit encore tenir
          if (j.k === 'qcm' && r === 0) {
            const clicked = await page.evaluate(() => { const b = document.querySelector('#practice-exercise .qcm-choices button, #practice-exercise .choices button'); if (!b) return false; b.click(); return true; });
            if (clicked) {
              await page.waitForTimeout(40);
              const m2 = await measure();
              if (m2.doc > m2.vh + 1 || m2.bottom > m2.vh + 1) { bad++; worst.push(`${w}x${h} ${j.t} niv${j.lv} APRÈS RÉPONSE : page ${m2.doc}, boutons jusqu'à ${m2.bottom} (écran ${m2.vh})`); }
            }
          }
        }
      }
    });
  }
  const uniq = [...new Set(worst)];
  console.log(uniq.slice(0, 60).join('\n'));
  console.log(bad ? `ÉCHEC : ${bad} écrans trop hauts (${uniq.length} cas distincts)` : 'fit OK : tout tient à l\'écran');
  process.exitCode = bad ? 1 : 0;
})();
