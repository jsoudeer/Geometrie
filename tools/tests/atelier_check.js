// Ateliers interactifs : on résout par de vrais clics, on vérifie réussite, échec et une seule étoile par exercice
// (une fois réussi, la rangée Vérifier / Nouvelle activité disparaît).
const { withPage, SHOTS } = require('./lib');
const assert = require('assert');
withPage({ page: 'index_test.html', viewport: { width: 390, height: 900 } }, async (page) => {
  const ev = c => page.evaluate(x => window.__t.__eval(x), c);
  const stars = () => page.evaluate(() => +document.getElementById('starCount').textContent);
  const cells = key => page.$$(`#at-${key}-svg [role=button]`);
  async function clickIdx(key, idxs){ const cs = await cells(key); for (const i of idxs) await cs[i].dispatchEvent('click'); }
  const fbText = key => page.evaluate(k => document.getElementById('at-' + k + '-fb').textContent, key);
  const check = key => page.click(`#at-${key}-check`);
  // les ateliers comptent désormais dans la série : on neutralise la montée de niveau
  // automatique et les annonces de déblocage, qui changeraient l'écran pendant le test
  await ev(`appMode='manual'; manualFamily=null;`);
  for (let lvl = 0; lvl < 3; lvl++) {
    for (const [key, solveExpr] of [
      ['atelier-sym', `(function(){ var o=[]; var s=atSym.solution; for(var r=0;r<s.length;r++) for(var c=0;c<s[r].length;c++) if(s[r][c]) o.push(r*s[r].length+c); return o; })()`],
      ['atelier-fraction', `(function(){ var o=[]; for(var i=0;i<atFrac.k;i++) o.push(i); return o; })()`],
      ['atelier-copie', `(function(){ var o=[]; var m=atCopy.model; for(var r=0;r<m.length;r++) for(var c=0;c<m.length;c++) if(m[r][c]) o.push(r*m.length+c); return o; })()`]
    ]) {
      for (let rep = 0; rep < 6; rep++) {
        await ev(`globalLevel=${lvl}; showFamily('${key}'); extraFamily('${key}').generate(${lvl});`);
        const s0 = await stars();
        await check(key);                                            // rien de fait : ne doit pas réussir (sauf cas dégénéré)
        const t0 = await fbText(key);
        const idxs = await ev(solveExpr);
        // le cas « rien à faire » n'existe pas : au moins une case/part à colorier
        assert(idxs.length > 0, key + ' sans case à colorier');
        assert(/✘/.test(t0), key + ' L' + lvl + ' : le vide devrait échouer : ' + t0);
        assert.equal(await stars(), s0, 'pas d\'étoile pour un échec');
        await clickIdx(key, idxs);
        await check(key);
        assert(/✔/.test(await fbText(key)), key + ' L' + lvl + ' : la bonne solution devrait réussir : ' + await fbText(key));
        assert.equal(await stars(), s0 + 1, 'une étoile');
        const rowHidden = await page.evaluate(k => document.getElementById('at-' + k + '-check').closest('.btn-row').hidden, key);
        assert(rowHidden, key + ' : les boutons disparaissent après la réussite');
        assert.equal(await stars(), s0 + 1, 'pas de 2e étoile');
      }
    }
  }
  // surplus de parts : message « trop »
  await ev(`showFamily('atelier-fraction'); extraFamily('atelier-fraction').generate(0);`);
  await clickIdx('atelier-fraction', Array.from({ length: await ev('atFrac.n') }, (_, i) => i));
  await check('atelier-fraction');
  console.log('fraction tout coloré :', await fbText('atelier-fraction'));
  // captures
  for (const [key, lvl] of [['atelier-sym', 2], ['atelier-fraction', 2], ['atelier-copie', 0]]) {
    await ev(`globalLevel=${lvl}; showFamily('${key}'); extraFamily('${key}').generate(${lvl});`);
    if (key === 'atelier-copie') await clickIdx(key, [0, 1, 7]);
    await check(key);
    await page.waitForTimeout(250);
    await page.screenshot({ path: SHOTS + 'at_' + key + '.png' });
  }
  console.log('ateliers OK');
});
