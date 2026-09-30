// Patron → Solide (moteur 3D de patron3d.js) :
//  - chaque patron déclaré comme solide se referme vraiment (calcul 3D), chaque piège non ;
//  - la bonne réponse est parmi les 4 boutons proposés ;
//  - après réponse, le pliage se joue jusqu'au bout : légende des problèmes, bouton « Revoir »,
//    rotation au clavier, et nom accessible de l'image qui décrit le résultat.
const { withPage, SHOTS } = require('./lib');
withPage({ page: 'index_test.html', viewport: { width: 390, height: 900 } }, async (page) => {
  const ev = c => page.evaluate(x => window.__t.__eval(x), c);
  let bad = 0; const chk = (ok, msg) => { if (!ok) { console.log('  ✘', msg); bad++; } };
  const defs = JSON.parse(await ev(`JSON.stringify(NET_DEFS.map(function(d){ return { id:d.id, group:d.group, answer:d.obj.answer, a:d.obj.analysis }; }))`));
  for (const d of defs) {
    if (d.group === 'piege') chk(d.answer === 'aucun' && !d.a.closed, d.id + ' devrait être un piège');
    else chk(d.a.closed && d.answer !== 'aucun', d.id + ' devrait se refermer');
  }
  console.log('patrons :', defs.length, '— solides :', defs.filter(d => d.answer !== 'aucun').length, '— pièges :', defs.filter(d => d.answer === 'aucun').length);
  // pliage instantané pour le test (même chemin que « mouvement réduit »)
  await ev(`m3Reduce = true; appMode='manual'; manualFamily='net'; showFamily('net');`);
  for (const d of defs) {
    await ev(`loadNet(NET_DEFS.filter(function(x){ return x.id==='${d.id}'; })[0].obj)`);
    const labels = await page.evaluate(() => [...document.querySelectorAll('#m3-choices .choice-btn')].map(b => b.textContent));
    chk(labels.length === 4, d.id + ' : 4 réponses proposées');
    chk(labels.includes(await ev(`M3_ANSWER_LABELS[currentNet.answer]`)), d.id + ' : la bonne réponse est proposée');
    chk(/Patron à plat : \d/.test(await page.evaluate(() => document.getElementById('netSvg').getAttribute('aria-label'))), d.id + ' : image décrite avant pliage');
    await page.evaluate(() => document.querySelector('#m3-choices .choice-btn').click());
    await page.waitForTimeout(120);
    const st = await page.evaluate(() => ({
      replay: !document.getElementById('m3-replay').hidden,
      legend: document.getElementById('m3-legend').hidden ? '' : document.getElementById('m3-legend').textContent,
      aria: document.getElementById('netSvg').getAttribute('aria-label'),
      tab: document.getElementById('stage').tabIndex,
      polys: document.querySelectorAll('#netSvg polygon').length
    }));
    chk(st.replay, d.id + ' : bouton Revoir affiché');
    chk(st.tab === 0, d.id + ' : scène atteignable au clavier');
    chk(/^Patron plié/.test(st.aria), d.id + ' : résultat décrit (' + st.aria + ')');
    if (d.answer === 'aucun') chk(st.legend.length > 0, d.id + ' : légende des problèmes');
    else chk(st.legend === '', d.id + ' : pas de légende pour un vrai solide');
    chk(st.polys >= 3, d.id + ' : faces dessinées');
    // rotation au clavier
    const y0 = await ev('m3View.yaw');
    await page.focus('#stage'); await page.keyboard.press('ArrowRight');
    chk(await ev('m3View.yaw') > y0, d.id + ' : la flèche fait tourner le solide');
  }
  // captures : un vrai solide et un piège, dans les deux clans
  for (const [id, th] of [['cube_croix', 'cats'], ['piege_cote', 'brainrot']]) {
    await ev(`applyTheme('${th}'); loadNet(NET_DEFS.filter(function(x){ return x.id==='${id}'; })[0].obj); answerNet('aucun', document.querySelector('#m3-choices .choice-btn'));`);
    await page.waitForTimeout(150);
    await (await page.$('#fam-net')).screenshot({ path: SHOTS + 'net_' + id + '.png' });
  }
  console.log(bad ? 'ÉCHEC (' + bad + ')' : 'OK');
});
