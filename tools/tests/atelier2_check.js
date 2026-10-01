// Ateliers « Trouver l'erreur » et « Axes de symétrie » : génération valide, vérification, retours.
const { withPage, SHOTS } = require('./lib');
withPage({ page: 'index_test.html', viewport: { width: 390, height: 900 } }, async (page) => {
  const ev = c => page.evaluate(x => window.__t.__eval(x), c);
  let bad = 0; const chk = (ok, m) => { console.log(ok ? '  ok' : '  ✘', m); if (!ok) bad++; };
  // ---- Trouver l'erreur : le nombre de différences est exact, à tous les niveaux
  const e = JSON.parse(await ev(`(function(){ var o=[]; for(var lv=0;lv<3;lv++){ var okc=0; for(var i=0;i<100;i++){ globalLevel=lv; showFamily('atelier-erreur'); extraFamily('atelier-erreur').generate(lv);
      var d=0, extra=0, miss=0; for(var r=0;r<atErr.n;r++) for(var c=0;c<atErr.n;c++){ if(atErr.model[r][c]!==atErr.copy[r][c]){ d++; if(atErr.copy[r][c]) extra++; else miss++; } }
      if(d===atErr.diff.length && d===[1,2,3][lv] && (lv===0 || (extra>=1 && miss>=1))) okc++; } o.push(okc); } return JSON.stringify(o); })()`));
  chk(e.every(v => v === 100), 'erreur : 1/2/3 différences exactes (dont en trop ET manquante dès 2) : ' + e);
  await ev(`globalLevel=1; showFamily('atelier-erreur'); extraFamily('atelier-erreur').generate(1);`);
  const cellSel = '#at-atelier-erreur-svg rect[role=button]';
  // clic sur de mauvaises cases
  await ev(`atErr.marks[0][0]=!atErrIsDiff(0,0); if(atErrIsDiff(0,0)) atErr.marks[0][0]=true;`);
  await page.click('#at-atelier-erreur-check');
  chk(await page.evaluate(() => document.getElementById('at-atelier-erreur-fb').classList.contains('bad')), 'erreur : réponse partielle/fausse refusée');
  // on clique réellement les bonnes cases
  await ev(`atErr.marks.forEach(function(row){ row.fill(false); }); atErrDraw(null);`);
  const diff = JSON.parse(await ev(`JSON.stringify(atErr.diff)`)), n = await ev(`atErr.n`);
  for (const [r, c] of diff) await page.evaluate(([r, c, n]) => document.querySelectorAll('#at-atelier-erreur-svg rect[role=button]')[r * n + c].dispatchEvent(new MouseEvent('click', { bubbles: true })), [r, c, n]);
  await page.screenshot({ path: SHOTS + 'at_erreur_marques.png' });
  await page.click('#at-atelier-erreur-check');
  chk(await page.evaluate(() => /en trop|manquante/.test(document.getElementById('at-atelier-erreur-fb').textContent) && document.getElementById('at-atelier-erreur-fb').classList.contains('good')), 'erreur : bonnes cases → réussite avec « en trop / manquante »');
  // ---- Axes : la vérité calculée correspond à ce qui est voulu, à tous les niveaux
  const a = JSON.parse(await ev(`(function(){ var o=[]; for(var lv=0;lv<3;lv++){ var seen={}, okc=0; for(var i=0;i<150;i++){ showFamily('atelier-axe'); extraFamily('atelier-axe').generate(lv);
      var all=axTruth(atAxe.fig, atAxe.n, ['V','H','D1','D2']); seen[all.join('+')||'aucun']=1;
      var cnt=0; atAxe.fig.forEach(function(r){ r.forEach(function(v){ if(v) cnt++; }); });
      if(cnt>=4 && (lv>0 || atAxe.truth.length===1)) okc++; } o.push([okc, Object.keys(seen).sort()]); } return JSON.stringify(o); })()`));
  a.forEach(([ok, seen], lv) => chk(ok === 150, 'axes niveau ' + lv + ' : figures valides, cas vus : ' + seen.join(' | ')));
  chk(a[1][1].includes('aucun') && a[1][1].includes('V+H'), 'axes moyen : figures sans axe et à 2 axes');
  chk(a[2][1].includes('D1+D2') && a[2][1].includes('V+H+D1+D2'), 'axes difficile : diagonales, et carré à 4 axes');
  // jeu réel : bonne réponse, puis mauvaise
  await ev(`globalLevel=1; showFamily('atelier-axe'); extraFamily('atelier-axe').generate(1);`);
  await page.screenshot({ path: SHOTS + 'at_axe_depart.png' });
  const truth = JSON.parse(await ev(`JSON.stringify(atAxe.truth)`));
  const idx = { V: 0, H: 1 };
  const clickAxis = ax => page.evaluate(i => document.querySelectorAll('#at-atelier-axe-svg line[role=button]')[i].dispatchEvent(new MouseEvent('click', { bubbles: true })), idx[ax]);
  const other = ['V', 'H'].filter(x => !truth.includes(x))[0];
  if (other) { await clickAxis(other); await page.click('#at-atelier-axe-check'); 
    chk(await page.evaluate(() => document.getElementById('at-atelier-axe-fb').classList.contains('bad') && document.querySelectorAll('#at-atelier-axe-svg rect[stroke-dasharray]').length > 0), 'axes : fausse ligne → refus + cases sans jumelle entourées');
    await page.screenshot({ path: SHOTS + 'at_axe_faux.png' }); await clickAxis(other); }
  for (const t of truth) await clickAxis(t);
  await page.click('#at-atelier-axe-check');
  chk(await page.evaluate(() => document.getElementById('at-atelier-axe-fb').classList.contains('good')), 'axes : bonnes lignes (' + (truth.join('+') || 'aucun') + ') → réussite');
  chk(await ev(`quizTypeById('symAxe')`) === null, 'l\'ancien QCM « symAxe » est retiré');
  console.log(bad ? 'ÉCHEC' : 'OK');
});
