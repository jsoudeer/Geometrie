// P5b de l'audit : paquets d'activités (paquets.js) — validation, installation, activation, mise à jour, retrait,
// persistance sur l'appareil, import par l'écran Réglages, activité qui échoue écartée.
const fs = require('fs'), path = require('path');
const { withPage } = require('./lib');
const SAMPLE_PATH = path.join(__dirname, '../../exemples/paquet-exemple.kvb.json');
const SAMPLE = JSON.parse(fs.readFileSync(SAMPLE_PATH, 'utf8'));
withPage({ page: 'index_test.html', viewport: { width: 390, height: 900 } }, async (page) => {
  let bad = 0; const chk = (ok, msg) => { console.log(ok ? '  ok' : '  ✘ ÉCHEC', msg); if (!ok) bad++; };
  const ev = c => page.evaluate(x => window.__t.__eval(x), c);
  const J = async c => JSON.parse(await ev(c));
  const install = async (pack) => J(`JSON.stringify(packInstall(${JSON.stringify(pack)}))`);
  const clone = () => JSON.parse(JSON.stringify(SAMPLE));

  // 1. installation du paquet d'exemple
  let r = await install(SAMPLE);
  chk(r.ok && /installé/.test(r.message), 'le paquet d\'exemple s\'installe : ' + r.message);
  const st = await J(`(function(){
    var ids = QCM_TYPE_DEFS.filter(function(d){ return d.pack; }).map(function(d){ return d.id; });
    var out = { ids:ids, lv:M4_LEVELS.map(function(l){ return l.types.filter(function(t){ return t.indexOf('custom:')===0; }); }) };
    var fix = quizTypeById('custom:exemple.ce1.demo/calendrier-classe'), seen = {}, order = [];
    for(var i=0;i<8;i++){ var q = fix.generate(0); order.push(q.question); }
    out.firstFour = new Set(order.slice(0,4)).size; out.nextFour = new Set(order.slice(4)).size;
    var q = fix.generate(1); out.choices = q.choices.length; out.oneOk = q.choices.filter(function(c){return c.ok;}).length;
    var t7 = quizTypeById('custom:exemple.ce1.demo/table-de-7'), badR = 0, maxN = [0,0,0];
    for(var lv=0; lv<3; lv++) for(var j=0;j<200;j++){ var g = t7.generate(lv), n = +/× (\\d+)/.exec(g.question)[1]; maxN[lv] = Math.max(maxN[lv], n);
      if(+g.choices.filter(function(c){return c.ok;})[0].label !== 7*n) badR++; }
    out.badR = badR; out.maxN = maxN; out.note = t7.randomNote; out.domain = quizDomainId(t7); out.dom2 = quizDomainId(fix);
    out.levels = [t7.defaultLevels, fix.defaultLevels];
    return JSON.stringify(out); })()`);
  chk(st.ids.length === 2 && st.ids[0] === 'custom:exemple.ce1.demo/table-de-7', 'les 2 activités sont branchées avec des identifiants « custom:paquet/activité »');
  chk(st.lv[0].length === 1 && st.lv[1].length === 2 && st.lv[2].length === 2, 'elles apparaissent aux niveaux demandés (Facile : 1, Moyen : 2, Difficile : 2)');
  chk(st.firstFour === 4 && st.nextFour === 4, 'questions fixes : tirage sans remise (les 4 d\'abord, puis les 4 à nouveau)');
  chk(st.choices >= 2 && st.choices <= 4 && st.oneOk === 1, 'question fixe : 2 à 4 propositions, une seule bonne');
  chk(st.badR === 0 && st.maxN.join() === '5,8,10', 'gabarit du paquet : réponses justes, plages 5 / 8 / 10 (' + st.maxN + ')');
  chk(/jusqu'à 7 × 5 en Facile/.test(st.note) && st.domain === 'calcul' && st.dom2 === 'temps', 'note générée depuis les réglages du paquet ; thèmes respectés');

  // 2. refus : chaque défaut est refusé, avec un message en français
  const cases = [
    ['pas du JSON', () => J(`JSON.stringify(packInstallText('{pas json'))`), /JSON/],
    ['mauvais format', () => install({ format: 'autre' }), /kvb-pack/],
    ['version de format', () => install(Object.assign(clone(), { formatVersion: 2 })), /version/i],
    ['id de paquet', () => install(Object.assign(clone(), { id: 'Pas Valide!' })), /« id » du paquet/],
    ['sans activité', () => install(Object.assign(clone(), { activites: [] })), /activités/],
    ['domaine inconnu', () => { const p = clone(); p.activites[1].domain = 'magie'; return install(p); }, /domain/],
    ['deux bonnes réponses', () => { const p = clone(); p.activites[1].questions[0].bonnes = ['a', 'b']; return install(p); }, /exactement une réponse/],
    ['4 fausses', () => { const p = clone(); p.activites[1].questions[0].fausses = ['a', 'b', 'c', 'd']; return install(p); }, /de 1 à 3 réponses fausses/],
    ['réponses identiques', () => { const p = clone(); p.activites[1].questions[0].fausses = ['janvier']; return install(p); }, /identiques/],
    ['image non prise en charge', () => { const p = clone(); p.activites[1].questions[0].dessin = 'data:image/png;base64,AAAA'; return install(p); }, /images/],
    ['fonction inconnue (code)', () => { const p = clone(); p.activites[0].fiche.forms[0].answer = 'alert(1)'; return install(p); }, /inconnu/],
    ['constructor', () => { const p = clone(); p.activites[0].fiche.forms[0].answer = 'constructor'; return install(p); }, /inconnu/],
    ['réglage interdit', () => { const p = clone(); p.activites[0].fiche.levels[0].constructor = 1; return install(p); }, /interdit|invalide/],
    ['3 niveaux', () => { const p = clone(); p.activites[0].fiche.levels.pop(); return install(p); }, /3 niveaux/],
    ['id d\'activité en double', () => { const p = clone(); p.activites[1].id = 'table-de-7'; return install(p); }, /en double/],
    ['trop gros', () => { const p = clone(); const big = Array.from({ length: 300 }, (_, i) => ({ q: 'Q' + i + ' ' + 'x'.repeat(290), bonnes: ['y'.repeat(60)], fausses: ['z'.repeat(60)], explication: 'e'.repeat(400) })); p.activites[1].questions = big; p.activites.push(Object.assign(JSON.parse(JSON.stringify(p.activites[1])), { id: 'autre' })); return install(p); }, /volumineux/],
    ['bonne réponse égale aux fausses (essais)', () => { const p = clone(); const f = p.activites[0].fiche.forms[0]; f.answer = 'n'; f.extras = []; f.vars = { n: 5, r: 'n' }; f.options = ['x', 'x']; return install(p); }, /options|identiques/],
    ['réponse non numérique sans bonne réponse', () => { const p = clone(); const f = p.activites[0].fiche.forms[0]; f.options = ['<', '>']; return install(p); }, /bonne réponse/],
    ['énoncé qui cite un nom inconnu', () => { const p = clone(); p.activites[0].fiche.forms[0].question = 'Combien font {zz} ?'; return install(p); }, /inconnu/]
  ];
  for (const [name, run, re] of cases) {
    const x = await run();
    chk(x.ok === false && re.test(x.message), 'refusé : ' + name + ' → ' + String(x.message).slice(0, 110));
  }
  chk((await J(`JSON.stringify(QCM_TYPE_DEFS.filter(function(d){return d.pack;}).length)`)) === 2, 'les paquets refusés n\'ont rien branché (toujours 2 activités)');

  // 3. mise à jour, version plus ancienne, doublon
  const p2 = clone(); p2.version = 2; p2.titre = 'Paquet d\'exemple v2'; p2.activites[1].questions.pop();
  r = await install(p2);
  chk(r.ok && /mis à jour/.test(r.message) && (await J(`JSON.stringify(PACKS.length)`)) === 1, 'une version plus haute remplace : ' + r.message);
  r = await install(SAMPLE);
  chk(!r.ok && /plus récente/.test(r.message), 'une version plus ancienne est refusée');
  r = await install(p2);
  chk(!r.ok && /déjà installé/.test(r.message), 'le même paquet deux fois est refusé');
  chk((await J(`JSON.stringify(quizTypeById('custom:exemple.ce1.demo/calendrier-classe').randomNote)`)).indexOf('(3)') !== -1, 'la mise à jour est bien prise en compte (3 questions)');

  // 4. persistance : rechargement de la page
  await page.reload(); await page.waitForTimeout(400);
  const after = await J(`JSON.stringify({ n: PACKS.length, v: PACKS[0] && PACKS[0].pack.version, defs: QCM_TYPE_DEFS.filter(function(d){return d.pack;}).length, lv: M4_LEVELS[1].types.filter(function(t){ return t.indexOf('custom:')===0; }).length })`);
  chk(after.n === 1 && after.v === 2 && after.defs === 2 && after.lv === 2, 'après rechargement : le paquet est toujours là, activé (version ' + after.v + ')');

  // 5. activer / désactiver / retirer
  await ev(`packSetActive('exemple.ce1.demo', false)`);
  chk((await J(`JSON.stringify(QCM_TYPE_DEFS.filter(function(d){return d.pack;}).length + M4_LEVELS[1].types.filter(function(t){ return t.indexOf('custom:')===0; }).length)`)) === 0, 'désactivé : plus aucune activité du paquet dans le jeu');
  await page.reload(); await page.waitForTimeout(400);
  chk((await J(`JSON.stringify(PACKS.length === 1 && !PACKS[0].actif && QCM_TYPE_DEFS.filter(function(d){return d.pack;}).length === 0)`)), 'la désactivation est mémorisée après rechargement');
  await ev(`packSetActive('exemple.ce1.demo', true)`);
  chk((await J(`JSON.stringify(QCM_TYPE_DEFS.filter(function(d){return d.pack;}).length)`)) === 2, 'réactivé : les 2 activités reviennent');
  const exp = await J(`JSON.stringify(JSON.parse(packExportText('exemple.ce1.demo')).version)`);
  chk(exp === 2, 'export : on retrouve le paquet (version 2) en JSON');
  await ev(`packRemove('exemple.ce1.demo')`);
  chk((await J(`JSON.stringify(PACKS.length + QCM_TYPE_DEFS.filter(function(d){return d.pack;}).length + (localStorage.getItem('geo_packs')||'{}').length)`)) === 2, 'retiré : plus de paquet, plus d\'activité, stockage vidé');

  // 6. une activité qui échoue à l'exécution est écartée, le jeu continue
  const fail = await J(`(function(){
    var d = { id:'custom:boom/x', domain:'calcul', label:'Boom', longLabel:'Boom', defaultLevels:[0,1,2], randomNote:'', generate:function(){ throw new Error('boum'); }, pack:'boom' };
    var entry = { pack:{ id:'boom', titre:'Boom', version:1, activites:[] }, actif:true, defs:[d], erreur:'' };
    PACKS.push(entry); packPlug(entry); rebuildM4Types(FAMILIES.filter(function(f){return f.key==='qcm';})[0].config.overrides);
    var before = QCM_TYPE_DEFS.indexOf(d) !== -1, q = quizTypeById('custom:boom/x').generate(0);
    var after = QCM_TYPE_DEFS.indexOf(d) !== -1;
    PACKS.splice(PACKS.indexOf(entry), 1);
    return JSON.stringify({ before:before, after:after, fallback: !!q.question && q.choices.length >= 2, err: entry.erreur }); })()`);
  chk(fail.before && !fail.after && fail.fallback && /boum/.test(fail.err), 'activité qui plante : écartée, remplacée par une question normale, message gardé');

  // 7. import par l'écran Réglages (fichier)
  await page.setInputFiles('#packs-file', SAMPLE_PATH);
  await page.waitForTimeout(500);
  const ui = await page.evaluate(() => ({ msg: document.getElementById('packs-msg').textContent, items: document.querySelectorAll('#packs-list .pack-item').length, title: (document.querySelector('#packs-list .pack-title') || {}).textContent }));
  chk(/installé/.test(ui.msg) && ui.items === 1 && /Paquet d'exemple/.test(ui.title), 'import par fichier : « ' + ui.msg + ' » ; liste : ' + ui.title);
  await page.setInputFiles('#packs-file', { name: 'mauvais.kvb.json', mimeType: 'application/json', buffer: Buffer.from('{"format":"kvb-pack","formatVersion":1,"id":"x"}') });
  await page.waitForTimeout(400);
  chk(/refusé/.test(await page.evaluate(() => document.getElementById('packs-msg').textContent)), 'import d\'un fichier invalide : message de refus affiché');
  await page.evaluate(() => document.querySelector('#packs-list .pack-toggle').click());
  chk(/Activer/.test(await page.evaluate(() => document.querySelector('#packs-list .pack-toggle').textContent)), 'bouton « Désactiver » → « Activer »');
  await page.evaluate(() => document.querySelector('#packs-list .pack-remove').click());
  chk((await page.evaluate(() => document.querySelectorAll('#packs-list .pack-item').length)) === 0, 'bouton « Retirer » : la liste est vide');

  // 8. les textes d'un paquet ne sont jamais interprétés comme du HTML
  const xss = clone(); xss.id = 'xss.test'; xss.titre = '<img src=x onerror=window.__pwn=1>'; xss.activites[1].questions[0].q = '<img src=x onerror=window.__pwn=1> Quel mois ?';
  await install(xss);
  await page.evaluate(() => window.__t.__eval(`quizTypeById('custom:xss.test/calendrier-classe').generate(0)`)); await page.waitForTimeout(100);
  chk(!(await page.evaluate(() => window.__pwn)) && (await page.evaluate(() => document.querySelectorAll('#packs-list img').length)) === 0, 'du HTML dans un paquet reste du texte (aucune balise injectée)');
  await ev(`packRemove('xss.test')`);

  // 9. un paquet peut aussi utiliser la banque de jours, les réponses de texte, la scène horloge et le choix de figure
  const rich = { format: 'kvb-pack', formatVersion: 1, id: 'riche.test', version: 1, titre: 'Riche', activites: [{ id: 'jour', type: 'gabarit', label: 'Jours', domain: 'temps', niveaux: [0],
    fiche: { levels: [{}, {}, {}], forms: [
      { vars: { i: { int: [0, 6] } }, answer: 'at(JOURS,i+2)', wrong: 'others(JOURS,at(JOURS,i+2),3)', question: 'Quel jour deux jours après {at(JOURS,i)} ?', sub: 'Compte.', explain: '{at(JOURS,i)} + 2 jours = {at(JOURS,i+2)}.', scene: { type: 'emoji', icon: "'📅'", caption: '' } }] } },
    { id: 'horloges', type: 'gabarit', label: 'Horloges', domain: 'temps', niveaux: [0],
    fiche: { levels: [{}, {}, {}], forms: [
      { vars: { h: { int: [1, 12] }, opts: 'clockOptions(h,0,1)' }, answer: '0', question: 'Quelle horloge indique {h} h ?', sub: 'Regarde.', explain: "{clockExplain(h,0,'heure')}", eq: '{h} h', figures: { scene: 'clock', items: 'opts', label: 'Horloge' } }] } }] };
  r = await install(rich);
  chk(r.ok, 'paquet avec banque, réponses de texte, scène horloge et figures accepté : ' + r.message);
  const rr = await J(`(function(){ var q = quizTypeById('custom:riche.test/jour').generate(0), ok = q.choices.filter(function(c){return c.ok;}).length; var h = quizTypeById('custom:riche.test/horloges').generate(0); return JSON.stringify({ n: q.choices.length, ok: ok, h: h.choices.length, hd: typeof h.choices[0].draw }); })()`);
  chk(rr.n === 4 && rr.ok === 1 && rr.h === 4 && rr.hd === 'function', 'ces activités se jouent (4 propositions, une seule bonne ; 4 horloges dessinées)');
  const badFig = JSON.parse(JSON.stringify(rich)); badFig.id = 'riche.bad'; badFig.activites[1].fiche.forms[0].figures = { scene: 'equation', items: 'opts' };
  r = await install(badFig);
  chk(!r.ok, 'figures : une scène qui n\'est pas numérique est refusée : ' + r.message);
  await ev(`packRemove('riche.test')`);
  console.log(bad ? 'ÉCHEC pack : ' + bad : 'pack OK');
  if (bad) process.exitCode = 1;
});
