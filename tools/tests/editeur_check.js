// P6 de l'audit : éditeur d'activités (editeur.js) — logique (construction, refus, aperçu, enregistrement, réouverture,
// suppression, persistance) et écran (formulaires, « Tester 20 questions », modification, suppression).
const { withPage } = require('./lib');
withPage({ page: 'index_test.html', viewport: { width: 390, height: 900 } }, async (page) => {
  let bad = 0; const chk = (ok, msg) => { console.log(ok ? '  ok' : '  ✘ ÉCHEC', msg); if (!ok) bad++; };
  const ev = c => page.evaluate(x => window.__t.__eval(x), c);
  const J = async c => JSON.parse(await ev(c));
  const build = (m, v) => J(`JSON.stringify(editeurBuildAct(${JSON.stringify(m)}, ${JSON.stringify(v)}, 'essai'))`);
  const base = { label: '', domain: 'calcul', niveaux: [0, 1, 2] };

  // 1. modèles numériques : réponses justes, plages respectées
  let r = await build('table', { ...base, p: [6, 4, 6, 10] });
  chk(r.act && r.act.label === 'Table de 6' && r.act.type === 'gabarit', 'table : titre par défaut « Table de 6 »');
  let ap = await J(`JSON.stringify(editeurApercu(${JSON.stringify(r.act)}, 2))`);
  chk(ap.questions && ap.questions.length === 20, 'table : 20 questions d\'aperçu');
  chk(ap.questions.every(q => +q.bonne === 6 * +/× (\d+)/.exec(q.q)[1] && !q.autres.includes(q.bonne)), 'table : toutes les bonnes réponses sont justes');
  const maxF = n => J(`(function(){ var m=0; for(var i=0;i<200;i++){ m=Math.max(m, +/× (\\d+)/.exec(editeurApercu(${JSON.stringify(r.act)},${n}).questions[0].q)[1]); } return m; })()`);
  chk(Math.max(...ap.questions.map(q => +/× (\d+)/.exec(q.q)[1])) <= 10, 'table : plage Difficile ≤ 10');
  for (const T of [2, 10, 12]) {
    const b = await build('table', { ...base, p: [T, 2, 5, 20] });
    for (const lv of [0, 1, 2]) { const a = await J(`JSON.stringify(editeurApercu(${JSON.stringify(b.act)}, ${lv}))`); if (!a.questions) { chk(false, 'table ' + T + ' niveau ' + lv + ' : ' + a.erreurs); } }
    chk(true, 'table de ' + T + ' valide aux 3 niveaux');
  }
  r = await build('plusmoins', { ...base, p: [0, 5, 10, 20, 50] });
  ap = await J(`JSON.stringify(editeurApercu(${JSON.stringify(r.act)}, 1))`);
  chk(r.act.label === 'Ajouter 5' && ap.questions.every(q => { const m = /(\d+) \+ 5/.exec(q.q); return m && +q.bonne === +m[1] + 5 && +m[1] <= 20; }), 'ajouter 5 : réponses justes, nombres ≤ 20 en Moyen');
  r = await build('plusmoins', { ...base, p: [1, 7, 10, 20, 50] });
  for (const lv of [0, 1, 2]) {
    ap = await J(`JSON.stringify(editeurApercu(${JSON.stringify(r.act)}, ${lv}))`);
    chk(ap.questions && ap.questions.every(q => { const m = /(\d+) - 7/.exec(q.q); return m && +q.bonne === +m[1] - 7 && +q.bonne >= 1; }), 'retirer 7 : jamais négatif, réponses justes (niveau ' + (lv + 1) + ')');
  }

  // 2. refus avec message en français
  const refus = [
    ['table', { ...base, p: [1, 5, 8, 10] }, /2 à 12/], ['table', { ...base, p: [7, 5, 8, 99] }, /2 à 20/],
    ['table', { ...base, p: [7, 10, 8, 5] }, /grandir/], ['table', { ...base, p: ['a', 5, 8, 10] }, /2 à 12/],
    ['table', { ...base, p: [7, 5, 8, 10], niveaux: [] }, /niveau/], ['plusmoins', { ...base, p: [0, 0, 10, 20, 50] }, /1 à 99/],
    ['plusmoins', { ...base, p: [0, 5, 50, 20, 10] }, /grandir/], ['libre', { ...base, questions: [] }, /titre/],
    ['libre', { ...base, label: 'x', questions: [] }, /au moins une question/],
    ['libre', { ...base, label: 'x', questions: [{ q: '', bonne: 'a', fausses: ['b'] }] }, /énoncé/],
    ['libre', { ...base, label: 'x', questions: [{ q: 'q', bonne: '', fausses: ['b'] }] }, /bonne réponse/],
    ['libre', { ...base, label: 'x', questions: [{ q: 'q', bonne: 'a', fausses: ['', ''] }] }, /mauvaise/],
    ['libre', { ...base, label: 'x', questions: [{ q: 'q', bonne: 'a', fausses: ['a'] }] }, /identiques/],
    ['inconnu', { ...base }, /inconnu/]];
  for (const [m, v, re] of refus) { const x = await build(m, v); chk(x.erreur && re.test(x.erreur), 'refus (' + m + ') : ' + x.erreur); }


  // 2b. « une activité du jeu, à ma façon » : plages changées, mêmes oracles que l'activité d'origine
  const bases = [['calc', 'max', [4, 8, 30]], ['soustraction', 'aHi', [6, 12, 40]], ['doubleMoitie', 'hi', [5, 8, 30]], ['compare', 'hi', [12, 15, 60]]];
  for (let bi = 0; bi < bases.length; bi++) {
    const [id, , vals] = bases[bi];
    const b = await build('fiche', { ...base, p: [bi, ...vals] });
    chk(b.act && b.act.type === 'gabarit' && /à ma façon/.test(b.act.label) && b.act.meta.p[0] === bi, 'à ma façon (' + id + ') : activité construite, titre par défaut');
    for (const lv of [0, 1, 2]) {
      const a = await J(`JSON.stringify(editeurApercu(${JSON.stringify(b.act)}, ${lv}))`);
      const nums = (a.questions || []).flatMap(q => (q.q.match(/\d+/g) || []).map(Number));
      const bad = !a.questions || a.questions.length !== 20 || a.questions.some(q => !q.bonne || q.autres.includes(q.bonne));
      const mx = Math.max(...nums);
      chk(!bad && (id === 'doubleMoitie' ? mx <= vals[lv] * 2 : mx <= vals[lv]), 'à ma façon (' + id + ') niveau ' + (lv + 1) + ' : 20 questions valides, nombres ≤ ' + vals[lv] + ' (max vu ' + mx + ')');
    }
    // l'activité d'origine du jeu n'est pas modifiée
    chk((await ev(`TEMPLATE_FICHES['${id}'].levels[2]['${bases[bi][1]}']`)) !== vals[2], 'à ma façon (' + id + ') : l\'activité du jeu reste intacte');
  }
  const refus2 = [[{ ...base, p: [9, 5, 8, 10] }, /départ/], [{ ...base, p: [0, 5, 8, ''] }, /pour chaque niveau/], [{ ...base, p: [0, 5, 8, 500] }, /En Difficile : un nombre de 3 à 100/],
    [{ ...base, p: [1, 5, 8, 40] }, /En Moyen : un nombre de 10 à 100/], [{ ...base, p: [0, 20, 10, 30] }, /grandir/], [{ ...base, p: [3, 9, 15, 60] }, /En Facile : un nombre de 10 à 999/]];
  for (const [v, re] of refus2) { const x = await build('fiche', v); chk(x.erreur && re.test(x.erreur), 'à ma façon : refus (' + x.erreur + ')'); }

  // 3. questions à soi : aperçu, une fois chacune
  const libre = { ...base, label: 'Les animaux', domain: 'logique', icone: '🐶', questions: [
    { q: 'Qui aboie ?', bonne: 'le chien', fausses: ['le chat', 'la vache'], explication: 'Le chien aboie.' },
    { q: 'Qui miaule ?', bonne: 'le chat', fausses: ['le chien', ''] }] };
  r = await build('libre', libre);
  ap = await J(`JSON.stringify(editeurApercu(${JSON.stringify(r.act)}, 0))`);
  chk(ap.questions.length === 2 && new Set(ap.questions.map(q => q.q)).size === 2, 'questions à soi : chacune une fois dans l\'aperçu');

  // 4. enregistrement : branchement, version, persistance, modification, suppression
  const save = async act => J(`JSON.stringify(editeurSave(${JSON.stringify(act)}))`);
  let s = await save(r.act);
  chk(s.ok, 'enregistrement : ' + s.message);
  let st = await J(`JSON.stringify({ ids: QCM_TYPE_DEFS.filter(function(d){return d.pack==='perso.moi';}).map(function(d){return d.id;}), v: packFind('perso.moi').pack.version, titre: packFind('perso.moi').pack.titre, ls: Object.keys(JSON.parse(localStorage.getItem('geo_packs'))) })`);
  chk(st.ids.join() === 'custom:perso.moi/essai' && st.v === 1 && st.titre === 'Mes activités' && st.ls.includes('perso.moi'), 'l\'activité est branchée (custom:perso.moi/…), version 1, gardée sur l\'appareil');
  const t6 = (await build('table', { ...base, p: [6, 4, 6, 10] })).act; t6.id = 'table-de-6';
  s = await save(t6);
  st = await J(`JSON.stringify({ n: editeurActs().length, v: packFind('perso.moi').pack.version, dom: quizDomainId(quizTypeById('custom:perso.moi/table-de-6')) })`);
  chk(s.ok && st.n === 2 && st.v === 2 && st.dom === 'calcul', 'une 2e activité s\'ajoute (version 2, thème calcul)');
  const t6b = { ...t6, label: 'Table de six', niveaux: [2] };
  s = await save(t6b);
  st = await J(`JSON.stringify({ n: editeurActs().length, label: editeurActs()[1].label, lv: M4_LEVELS.map(function(l){ return l.types.indexOf('custom:perso.moi/table-de-6') !== -1; }) })`);
  chk(st.n === 2 && st.label === 'Table de six' && st.lv.join() === 'false,false,true', 'modifier remplace l\'activité (pas de doublon) et change ses niveaux');
  const id1 = await ev(`editeurFreeId('Table de six')`);
  chk(/table-de-six/.test(id1) && (await ev(`editeurFreeId('essai')`)) !== 'essai', 'identifiants : slug sans accents, jamais en double (' + id1 + ')');
  await ev(`editeurRemove('essai')`);
  chk((await ev(`editeurActs().length`)) === 1 && !(await ev(`!!quizTypeById('custom:perso.moi/essai')`)) , 'supprimer retire l\'activité du jeu');

  // 5. écran
  await page.evaluate(() => { document.getElementById('settings-overlay').hidden = false; document.getElementById('debug-panel').hidden = false; document.getElementById('debug-tools').hidden = false; document.getElementById('edit-new-btn').scrollIntoView(); });
  chk((await page.evaluate(() => document.querySelectorAll('#edit-list .pack-item').length)) === 1, 'écran : « Mes activités » liste l\'activité enregistrée');
  await page.click('#edit-list .ed-modify');
  chk((await page.inputValue('#ed-label')) === 'Table de six' && (await page.inputValue('#ed-p0')) === '6' && !(await page.isChecked('#ed-niv0')) && await page.isChecked('#ed-niv2'), 'écran : « Modifier » rouvre les réglages d\'origine');
  await page.fill('#ed-p0', '1'); await page.click('#ed-save');
  chk(/2 à 12/.test(await page.textContent('#ed-msg2')), 'écran : un réglage invalide affiche son message');
  await page.fill('#ed-p0', '9'); await page.selectOption('#ed-test-level', '2'); await page.click('#ed-test');
  chk((await page.locator('#ed-preview li').count()) === 20 && /20 questions/.test(await page.textContent('#ed-msg2')), 'écran : « Tester 20 questions » liste 20 questions');
  await page.screenshot({ path: '/tmp/geo_tests/editeur_table.png' });
  await page.click('#ed-save');
  chk((await ev(`editeurActs()[0].meta.p[0]`)) === 9 && /enregistrée/.test(await page.textContent('#edit-msg')), 'écran : enregistrer prend en compte la nouvelle table');
  // nouvelle activité de questions à soi
  await page.click('#edit-new-btn'); await page.click('.ed-modele-libre');
  await page.fill('#ed-label', 'Les couleurs'); 
  await page.fill('.ed-question input.q', 'Quelle couleur a le ciel ?'); await page.fill('.ed-question input.bonne', 'bleu'); await page.fill('.ed-question input.fausse0', 'rouge');
  await page.click('#ed-add-q');
  chk((await page.locator('.ed-question').count()) === 2, 'écran : « Ajouter une question » ajoute un bloc');
  await page.click('#ed-test');
  chk(/Question 2 : écris l'énoncé/.test(await page.textContent('#ed-msg2')), 'écran : question incomplète signalée par son numéro');
  await page.fill('.ed-question:nth-of-type(2) input.q', 'Quelle couleur a l\'herbe ?'); 
  await page.locator('.ed-question').nth(1).locator('input.q').fill('Quelle couleur a l\'herbe ?');
  await page.locator('.ed-question').nth(1).locator('input.bonne').fill('vert'); await page.locator('.ed-question').nth(1).locator('input.fausse0').fill('rose');
  await page.click('#ed-test');
  chk((await page.locator('#ed-preview li').count()) === 2, 'écran : 2 questions d\'essai');
  await page.screenshot({ path: '/tmp/geo_tests/editeur_libre.png' });
  await page.locator('.ed-question').nth(1).locator('.ed-q-remove').click();
  chk((await page.locator('.ed-question').count()) === 1, 'écran : « Retirer cette question »');
  await page.click('#ed-save');
  chk((await ev(`editeurActs().length`)) === 2 && (await page.locator('#edit-list .pack-item').count()) === 2, 'écran : la nouvelle activité apparaît dans la liste');
  // la liste des paquets montre aussi le paquet personnel
  chk(/Mes activités/.test(await page.textContent('#packs-list')), 'le paquet personnel apparaît dans la liste des paquets (exportable)');

  // écran « à ma façon »
  await page.click('#edit-new-btn'); await page.click('.ed-modele-fiche');
  chk((await page.inputValue('#ed-p1')) === '10' && (await page.inputValue('#ed-p3')) === '20', 'écran : les réglages d\'origine de l\'activité de départ sont proposés');
  await page.selectOption('#ed-p0', '2');
  chk((await page.inputValue('#ed-p1')) === '10' && (await page.inputValue('#ed-p3')) === '50', 'écran : changer d\'activité de départ recharge ses réglages (doubles : 10 / 20 / 50)');
  await page.fill('#ed-p3', '40'); await page.click('#ed-test');
  chk((await page.locator('#ed-preview li').count()) === 20, 'écran : « à ma façon » : 20 questions d\'essai');
  await page.click('#ed-save');
  const mine = await J(`JSON.stringify(editeurActs().filter(function(a){ return a.meta && a.meta.modele === 'fiche'; }).map(function(a){ return a.meta.p; }))`);
  chk(JSON.stringify(mine) === '[[2,10,20,40]]', 'écran : enregistré avec les nouvelles plages (' + JSON.stringify(mine) + ')');
  await page.locator('#edit-list .ed-modify').last().click();
  chk((await page.inputValue('#ed-p0')) === '2' && (await page.inputValue('#ed-p3')) === '40', 'écran : « Modifier » rouvre l\'activité du jeu reprise');
  await page.click('#ed-cancel');
  
  // clavier seul : ouvrir, choisir un modèle, régler, tester, enregistrer, annuler
  await page.focus('#edit-new-btn'); await page.keyboard.press('Enter');
  await page.keyboard.press('Tab'); await page.keyboard.press('Enter');          // 1er modèle (table)
  chk((await page.evaluate(() => document.activeElement.id)) === 'ed-label', 'clavier : choisir un modèle place le curseur sur le titre');
  const order = [];
  for (let i = 0; i < 16; i++) { await page.keyboard.press('Tab'); order.push(await page.evaluate(() => document.activeElement.id || document.activeElement.textContent.slice(0, 12))); }
  const want = ['ed-domain', 'ed-niv0', 'ed-niv1', 'ed-niv2', 'ed-p0', 'ed-p1', 'ed-p2', 'ed-p3', 'ed-test-level', 'ed-test', 'ed-save', 'ed-cancel'];
  chk(want.every((id, i) => order[i] === id), 'clavier : l\'ordre de tabulation suit l\'écran (' + order.slice(0, 12).join(' › ') + ')');
  await page.focus('#ed-p0'); await page.keyboard.type('4'); await page.focus('#ed-test'); await page.keyboard.press('Enter');
  chk((await page.locator('#ed-preview li').count()) === 20, 'clavier : « Tester 20 questions » se déclenche au clavier');
  await page.focus('#ed-cancel'); await page.keyboard.press('Enter');
  chk((await page.evaluate(() => document.activeElement.id)) === 'edit-new-btn', 'clavier : après « Annuler », le curseur revient sur « Créer une activité »');
    // XSS : du HTML dans un titre reste du texte
  await page.click('#edit-new-btn'); await page.click('.ed-modele-libre');
  await page.fill('#ed-label', '<img src=x onerror=window.__pwn=1>');
  await page.fill('.ed-question input.q', 'q'); await page.fill('.ed-question input.bonne', 'a'); await page.fill('.ed-question input.fausse0', 'b');
  await page.click('#ed-save'); await page.waitForTimeout(100);
  chk(!(await page.evaluate(() => window.__pwn)) && (await page.locator('#edit-list img').count()) === 0, 'du HTML dans un titre reste du texte');
  // suppression par l'écran
  while ((await page.locator('#edit-list .ed-delete').count()) > 0) await page.locator('#edit-list .ed-delete').first().click();
  chk((await ev(`!!packFind('perso.moi')`)) === false && (await page.locator('#edit-list .pack-item').count()) === 0, 'supprimer la dernière activité retire le paquet personnel');
  console.log(bad ? 'ÉCHEC editeur : ' + bad : 'editeur OK');
  if (bad) process.exitCode = 1;
});
