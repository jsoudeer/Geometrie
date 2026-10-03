// Thèmes (DOMAINS) : un seul découpage ; chaque activité (écran propre ou type de Quizz) a un thème déclaré et valide.
const { withPage, SHOTS } = require('./lib');
withPage({ page: 'index_test.html', viewport: { width: 390, height: 900 } }, async (page) => {
  const ev = c => page.evaluate(x => window.__t.__eval(x), c);
  let bad = 0; const chk = (ok, m) => { console.log(ok ? '  ok' : '  ✘', m); if (!ok) bad++; };
  const r = JSON.parse(await ev(`JSON.stringify((function(){
    var ids = DOMAINS.map(function(d){ return d.id; }), o = { badFam:[], badType:[], empty:[], map:{} };
    FAMILIES.forEach(function(f){ if(f.key==='qcm') return; if(ids.indexOf(f.domain)===-1) o.badFam.push(f.key); (o.map[f.domain]=o.map[f.domain]||[]).push(f.key); });
    QCM_TYPE_DEFS.forEach(function(t){ if(ids.indexOf(t.domain)===-1) o.badType.push(t.id); (o.map[t.domain]=o.map[t.domain]||[]).push(t.id); });
    ids.forEach(function(i){ if(!o.map[i]) o.empty.push(i); });
    return o; })())`));
  chk(r.badFam.length === 0, 'chaque écran propre a un thème valide ' + r.badFam);
  chk(r.badType.length === 0, 'chaque type de Quizz a un thème valide ' + r.badType);
  chk(r.empty.length === 0, 'aucun thème vide ' + r.empty);
  chk(['measure', 'estimate', 'mesures', 'perimetre'].every(k => r.map.mesures.includes(k)) && r.map.mesures.length === 4, 'Mesures réunit Mesurer, Estimer, Unités de longueur, Périmètre : ' + r.map.mesures);
  chk(['atelier-sym', 'atelier-axe', 'symVrai', 'symVisuel'].every(k => r.map.symetrie.includes(k)) && r.map.symetrie.length === 4, 'Symétrie : ' + r.map.symetrie);
  chk(Math.max(...Object.values(r.map).map(l => l.length)) <= 12, 'aucun thème démesuré : ' + Object.entries(r.map).map(([k, l]) => k + ' ' + l.length).join(', '));
  // Progression : la compétence d'une réponse = le thème de l'activité
  const prog = JSON.parse(await ev(`JSON.stringify([progSkillIndex('measure',null), progSkillIndex('qcm','mesures'), progSkillIndex('atelier-axe',null), progSkillIndex('clock-lire',null), progSkillIndex('qcm','calcul')].map(function(i){ return DOMAINS[i].id; }))`));
  chk(prog.join() === 'mesures,mesures,symetrie,temps,calcul', 'la progression suit les mêmes thèmes : ' + prog);
  // Plus aucune trace des anciens regroupements
  chk(await ev(`typeof QCM_CATEGORIES === 'undefined' && typeof FAMILY_THEMES === 'undefined' && typeof PROG_SKILLS === 'undefined'`), 'anciens découpages supprimés');
  // Mode Manuel, thème Mesures : les 4 activités + « un peu de tout »
  await page.click('#menu-btn'); await page.click('.tab-btn[data-tab="manuel"]');
  await page.evaluate(() => [...document.querySelectorAll('#manual-domain-row .level-btn')].find(x => x.textContent.includes('Mesures')).click());
  const units = await page.evaluate(() => [...document.querySelectorAll('#manual-unit-row .level-btn')].map(x => x.textContent));
  chk(units.length === 5 && /Un peu de tout/.test(units[0]), 'Manuel › Mesures : ' + units.join(' | '));
  await page.screenshot({ path: SHOTS + 'manuel_themes.png' });
  console.log(bad ? 'ÉCHEC' : 'OK');
});
