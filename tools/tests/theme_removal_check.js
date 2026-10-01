// Chaque thème doit pouvoir être retiré du manifeste sans casser l'appli :
// on reconstruit la page SANS ce thème (en mémoire, rien n'est écrit), puis on
// enchaîne des questions dans tous les modes, on ouvre le mode Manuel et le
// panneau « Activités & difficulté ». Aucune erreur JavaScript n'est tolérée,
// et les activités du thème retiré ne doivent plus apparaître.
const fs = require('fs');
const path = require('path');
const { withPage } = require('./lib');
const SRC = path.join(__dirname, '..', '..', 'src');

function buildWithout(file) {
  const m = JSON.parse(fs.readFileSync(path.join(SRC, 'manifest.json'), 'utf8'));
  const read = p => fs.readFileSync(path.join(SRC, p), 'utf8');
  const tpl = read(m.template);
  const css = m.css.map(read).join('');
  const js = m.js.filter(p => p !== file).map(read).join('');
  let html = tpl.replace('@@CSS@@\n', css).replace('@@JS@@\n', js);
  const hook = "\n  window.__t = { __eval:function(c){ return eval(c); } };\n";
  const i = html.lastIndexOf('\n})();\n</script>');
  return html.slice(0, i) + hook + html.slice(i);
}

// thème retiré → activités qui doivent disparaître avec lui
const THEMES = {
  'js/horloge.js':  ['clock-lire', 'clock-regler'],
  'js/patron3d.js': ['net'],
  'js/atelier.js':  ['atelier-sym', 'atelier-fraction', 'atelier-copie'],
  'js/calcul.js':   [],
  'js/geometrie.js':['measure', 'deform']
};

withPage({ page: 'index_test.html', viewport: { width: 390, height: 900 } }, async (page, port) => {
  let bad = 0; const chk = (ok, msg) => { console.log(ok ? '  ok' : '  ✘', msg); if (!ok) bad++; };
  for (const [file, gone] of Object.entries(THEMES)) {
    console.log('— sans ' + file);
    const html = buildWithout(file);
    const url = `http://localhost:${port}/sans-theme.html`;
    await page.unroute('**/sans-theme.html');
    await page.route('**/sans-theme.html', r => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: html }));
    const errs = [];
    const onErr = e => errs.push(e.message);
    page.on('pageerror', onErr);
    await page.goto(url);
    await page.waitForTimeout(300);
    const start = await page.$('#splash-start-btn'); if (start) await start.click();
    const ev = c => page.evaluate(x => window.__t.__eval(x), c);
    const fams = JSON.parse(await ev('JSON.stringify(MANUAL_FAMILY_LIST)'));
    chk(gone.every(k => fams.indexOf(k) === -1), 'activités retirées absentes (' + fams.join(', ') + ')');
    // 60 questions en Aléatoire sur les 3 niveaux, en répondant au hasard
    const seen = JSON.parse(await ev(`(function(){ var seen={}; autoAdvanceEnabled=false;
      for(var lv=0; lv<3; lv++){ setGlobalLevel(lv); for(var i=0;i<20;i++){ nextPracticeQuestion(); seen[currentFamily]=1;
        var b=document.querySelector('#fam-' + currentFamily + ' .choice-btn'); if(b) b.click(); } }
      return JSON.stringify(Object.keys(seen)); })()`));
    chk(seen.length > 0 && seen.every(k => gone.indexOf(k) === -1), 'tirage aléatoire : ' + seen.join(', '));
    // chronométré
    await ev(`practiceMode='countdown'; startCountdown(); for(var i=0;i<10;i++) nextPracticeQuestion(); endCountdown(); practiceMode='free';`);
    // mode Manuel : chaque activité, et panneau de configuration de chacune
    await ev(`(function(){ setAppMode('manual'); MANUAL_FAMILY_LIST.forEach(function(k){ manualFamily=k; nextPracticeQuestion(); renderActivityConfig(k); }); setAppMode('auto'); })()`);
    const themes = await ev(`FAMILY_THEMES.map(function(t){ return t.label + ' (' + t.families.length + ')'; }).join(', ')`);
    chk(true, 'groupes du mode Manuel : ' + themes);
    chk(errs.length === 0, 'aucune erreur JavaScript' + (errs.length ? ' : ' + errs.slice(0, 2).join(' | ') : ''));
    page.off('pageerror', onErr);
  }
  console.log(bad ? 'ÉCHEC (' + bad + ')' : 'OK');
});
