// P8 de l'audit : patrons dessinés en cases (paquets de type « patron »).
//  - le moteur 3D de patron3d.js dit « cube » exactement quand un vrai dé, roulé sur les cases, touche 6 faces différentes
//    (oracle indépendant, sur tous les assemblages de 2 à 7 cases qui tiennent dans 6 × 5) ;
//  - un patron de paquet rejoint la famille « Patron → Solide », se joue, se plie, se retire ;
const { withPage } = require('./lib');
withPage({ page: 'index_test.html', viewport: { width: 390, height: 900 } }, async (page) => {
  let bad = 0; const chk = (ok, msg) => { console.log(ok ? '  ok' : '  ✘ ÉCHEC', msg); if (!ok) bad++; };
  const ev = c => page.evaluate(x => window.__t.__eval(x), c);
  const J = async c => JSON.parse(await ev(c));

  // 1. tous les assemblages de 2 à 7 cases dans 6 colonnes × 5 lignes
  const all = [];
  { let cur = [[[0, 0]]]; const key = cells => { const mr = Math.min(...cells.map(c => c[0])), mc = Math.min(...cells.map(c => c[1])); return cells.map(c => (c[0] - mr) + ',' + (c[1] - mc)).sort().join(';'); };
    for (let n = 2; n <= 7; n++) { const seen = new Map();
      for (const p of cur) for (const [r, c] of p) for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const q = [r + dr, c + dc]; if (p.some(x => x[0] === q[0] && x[1] === q[1])) continue;
        const np = p.concat([q]), k = key(np); if (!seen.has(k)) seen.set(k, np.map(x => x.slice())); }
      cur = [...seen.values()].map(p => { const mr = Math.min(...p.map(c => c[0])), mc = Math.min(...p.map(c => c[1])); return p.map(c => [c[0] - mr, c[1] - mc]); });
      for (const p of cur) if (Math.max(...p.map(c => c[0])) < 5 && Math.max(...p.map(c => c[1])) < 6) all.push(p); } }
  const pattern = p => { const h = Math.max(...p.map(c => c[0])) + 1, w = Math.max(...p.map(c => c[1])) + 1, rows = []; for (let r = 0; r < h; r++) { let l = ''; for (let c = 0; c < w; c++) l += p.some(x => x[0] === r && x[1] === c) ? 'X' : '.'; rows.push(l); } return rows.join('/'); };
  function isCubeNet(p) {      // un dé roulé de case en case : 6 cases, sans boucle, 6 faces distinctes sous le papier
    if (p.length !== 6) return false;
    const idx = new Map(p.map((c, i) => [c[0] + ',' + c[1], i])); let edges = 0;
    for (const [r, c] of p) { if (idx.has((r + 1) + ',' + c)) edges++; if (idx.has(r + ',' + (c + 1))) edges++; }
    if (edges !== 5) return false;
    const faces = new Map(), start = p[0].join(','); faces.set(start, { B: 0, T: 1, N: 2, S: 3, E: 4, W: 5 }); const q = [start], under = new Set([0]);
    while (q.length) { const cur = q.shift(), [r, c] = cur.split(',').map(Number), d = faces.get(cur);
      for (const [dr, dc] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) { const k = (r + dr) + ',' + (c + dc); if (!idx.has(k) || faces.has(k)) continue;
        let n;
        if (dc === 1) n = { B: d.E, E: d.T, T: d.W, W: d.B, N: d.N, S: d.S };
        else if (dc === -1) n = { B: d.W, W: d.T, T: d.E, E: d.B, N: d.N, S: d.S };
        else if (dr === -1) n = { B: d.N, N: d.T, T: d.S, S: d.B, E: d.E, W: d.W };
        else n = { B: d.S, S: d.T, T: d.N, N: d.B, E: d.E, W: d.W };
        faces.set(k, n); under.add(n.B); q.push(k); } }
    return under.size === 6;
  }
  const verdicts = await J(`JSON.stringify(${JSON.stringify(all.map(pattern))}.map(function(g){ try { var n = makeNet('t', gridPolys(g), { solid:'cube' }); return n.answer; } catch(e){ return 'ERREUR ' + e.message; } }))`);
  let wrong = 0, cubes = 0, errors = 0;
  all.forEach((p, i) => { const want = isCubeNet(p) ? 'cube' : 'aucun'; if (want === 'cube') cubes++; if (/ERREUR/.test(verdicts[i])) errors++; else if (verdicts[i] !== want) { wrong++; if (wrong < 4) console.log('    désaccord :', pattern(p), 'jeu =', verdicts[i], 'dé =', want); } });
  chk(errors === 0, all.length + ' assemblages de 2 à 7 cases : aucun ne plante le moteur');
  chk(wrong === 0, 'le moteur 3D et le dé qui roule sont d\'accord sur chaque assemblage (' + cubes + ' patrons de cube trouvés)');
  chk(cubes === 11 || cubes > 11, 'les 11 patrons de cube existent, avec leurs orientations (' + cubes + ' positions)');

  // 2. un paquet avec des patrons
  const pack = acts => ({ format: 'kvb-pack', formatVersion: 1, id: 'patrons.test', version: 1, titre: 'Mes patrons', activites: acts });
  const A = (id, g, niv = [0, 1, 2]) => ({ id, type: 'patron', label: 'Patron ' + id, domain: 'solides', niveaux: niv, grille: g });
  let r = await J(`JSON.stringify(packInstall(${JSON.stringify(pack([A('croix', '.X../XXXX/.X..', [0]), A('mauvais', 'XXXXX', [1, 2]), A('z', 'X.../XXXX/..X.', [2])]))}))`);
  chk(r.ok, 'un paquet de patrons s\'installe : ' + r.message);
  let st = await J(`JSON.stringify({ ids: NET_DEFS.filter(function(d){ return d.group==='perso'; }).map(function(d){ return d.id + ':' + d.obj.answer; }),
    pools: M3_LEVELS.map(function(l){ return l.pool.filter(function(n){ return n.id.indexOf('custom:')===0; }).length; }), inQuiz: QCM_TYPE_DEFS.filter(function(d){ return d.id.indexOf('patrons.test')!==-1; }).length })`);
  chk(st.ids.join() === 'custom:patrons.test/croix:cube,custom:patrons.test/mauvais:aucun,custom:patrons.test/z:cube', 'les patrons rejoignent « Patron → Solide » avec la bonne réponse calculée par le moteur (' + st.ids.map(x => x.split('/')[1]) + ')');
  chk(st.pools.join() === '1,1,2' && st.inQuiz === 0, 'ils apparaissent aux niveaux demandés (Facile 1, Moyen 1, Difficile 2), pas dans le Quizz');
  // on joue un patron de paquet : réponses, pliage jusqu'au bout
  await ev(`m3Reduce = true; appMode='manual'; manualFamily='net'; showFamily('net');`);
  for (const id of ['croix', 'mauvais', 'z']) {
    await ev(`loadNet(NET_DEFS.filter(function(x){ return x.id==='custom:patrons.test/${id}'; })[0].obj)`);
    const labels = await page.evaluate(() => [...document.querySelectorAll('#m3-choices .choice-btn')].map(b => b.textContent));
    chk(labels.length === 4 && labels.includes(await ev(`M3_ANSWER_LABELS[currentNet.answer]`)), id + ' : 4 réponses dont la bonne');
    await page.evaluate(() => document.querySelector('#m3-choices .choice-btn').click()); await page.waitForTimeout(150);
    chk(await page.evaluate(() => !document.getElementById('m3-replay').hidden && /\S/.test(document.getElementById('m3-feedback').textContent)), id + ' : après la réponse, le pliage se joue et l\'explication s\'affiche');
  }
  // niveaux et réglages : la famille liste le groupe « Mes patrons »
  chk(await ev(`FAMILIES.filter(function(f){ return f.key==='net'; })[0].config.groups().some(function(g){ return g.id==='net-perso' && g.defs.length===3; })`), 'les réglages d\'activités listent « Mes patrons »');
  // désactiver / retirer
  await ev(`packSetActive('patrons.test', false)`);
  chk((await ev(`NET_DEFS.filter(function(d){ return d.group==='perso'; }).length`)) === 0 && (await ev(`M3_LEVELS.every(function(l){ return l.pool.every(function(n){ return n.id.indexOf('custom:')!==0; }); })`)), 'désactiver le paquet retire les patrons du jeu');
  await ev(`packSetActive('patrons.test', true)`); await ev(`packRemove('patrons.test')`);
  chk((await ev(`NET_DEFS.filter(function(d){ return d.group==='perso'; }).length`)) === 0, 'retirer le paquet retire les patrons');

  // 3. refus
  const refus = [['pas de grille', { ...A('a', 'XX'), grille: undefined }, /grille/], ['trop large', A('a', 'XXXXXXX'), /6 colonnes/], ['trop haut', A('a', 'X/X/X/X/X/X'), /5 lignes/],
    ['une seule case', A('a', 'X'), /2 à 10/], ['11 cases', A('a', 'XXXXXX/XXXXX'), /2 à 10/], ['deux morceaux', A('a', 'XX./..X'), /un seul morceau/], ['caractère étranger', A('a', 'XY'), /6 colonnes/]];
  for (const [nom, act, re] of refus) { const x = await J(`JSON.stringify(packInstall(${JSON.stringify(pack([act]))}))`); chk(!x.ok && re.test(x.message), 'refus (' + nom + ') : ' + x.message.slice(0, 110)); }

  console.log(bad ? 'ÉCHEC patron : ' + bad : 'patron OK');
  if (bad) process.exitCode = 1;
});
