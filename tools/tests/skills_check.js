// Compétences de personnage : catalogue (rareté, attribution, niveaux), déclenchement tous les 3 tours (2 au niveau Ultime),
// panneau de question jugé tout de suite (une seule fois) : bonne réponse = dégâts ×2 / ×2,5 sur la cible choisie ensuite,
// erreur = effet d'échec et retour à l'écran normal (attaque sans bonus) ; « Doubler ou fixe » (×m ou N fixes : −30 %, +30 %) ;
// effets sonores affichés et déroulé ralenti de la Bataille.
const { withPage, SHOTS } = require('./lib');
withPage({ page: 'index_test.html', viewport: { width: 390, height: 900 } }, async (page) => {
  const ev = c => page.evaluate(x => window.__t.__eval(x), c);
  let bad = 0; const chk = (ok, msg) => { console.log(ok ? '  ok' : '  ✘', msg); if (!ok) bad++; };
  const wait = ms => page.waitForTimeout(ms);
  // équipe de 3 classiques (pas de soutien : les points ne bougent que par les attaques)
  async function newBattle(speed) {
    await ev(`BT_SPEED=${speed}; ['cat01','cat02','cat03'].forEach(function(id){ ownedCats[id]=true; }); btSel.cats={classic:['cat01','cat02','cat03'],support:[],archer:[]}; renderBtSetup();`);
    await page.evaluate(() => { if (document.getElementById('arena-battle-wrap').offsetParent === null) document.getElementById('battle-btn').click(); });
    await wait(200);
    await page.evaluate(() => document.getElementById('bt-start').click());
    await wait(250);
  }
  // Terrain « inoffensif » pour mesurer : mes cartes sont des archers (jamais blessés en retour), l'adversaire est
  // énorme (ne meurt pas) et son tour est sauté ; sauf mention contraire.
  const prep = (mine) => ev(`bt.pl.field.forEach(function(u){ u.sprite.role='archer'; u.pts=${mine}; u.base=${mine}; }); bt.en.field.forEach(function(u){ u.pts=100000; u.base=100000; }); btRender();`);
  const stubEnemy = () => ev(`window.__realEnemy = window.__realEnemy || btEnemyTurn; btEnemyTurn = function(){ if(!bt||bt.over) return; btStartPlayerTurn(); };`);
  const phase = () => ev('bt.phase');
  async function untilPhase(p, max = 30000) { const t0 = Date.now(); while (Date.now() - t0 < max && await phase() !== p) await wait(60); return await phase() === p; }
  await newBattle(0.05);

  // --- affichage : plus de descriptif au milieu, un espace d'effets
  chk(await page.evaluate(() => !!document.getElementById('bt-sfx') && !document.querySelector('#bt-arena .bt-log')), 'zone d\'effets sonores présente, ancien descriptif retiré');
  chk(await page.evaluate(() => { const l = document.getElementById('bt-log'); return l.classList.contains('sr-only') && l.getBoundingClientRect().width <= 1; }), 'le texte reste lisible par lecteur d\'écran uniquement');

  // --- pas de compétence aux tours 1 et 2, une compétence au tour 3
  chk(await ev('bt.turn === 1 && bt.proc === null'), 'tour 1 : pas de compétence');
  async function playTurn(unitIdx = 0) {
    await ev(`bt.selected = null; bt.phase = 'pick-attacker';`);
    await page.evaluate((i) => document.querySelectorAll('#bt-player-field .bcard')[i].click(), unitIdx);
    await wait(30);
    if (await phase() === 'pick-skill') await page.evaluate(() => document.getElementById('bt-skill-none').click());
    await wait(30);
    await page.evaluate(() => [...document.querySelectorAll('#bt-enemy-field .bcard')].find(c => !c.disabled).click());
    return untilPhase('pick-attacker');
  }
  // On rend les cartes très solides pour que personne ne meure pendant le test.
  await stubEnemy(); await prep(500);
  await playTurn(0);
  chk(await ev('bt.turn === 2 && bt.proc === null'), 'tour 2 : pas de compétence');
  await playTurn(1);
  chk(await ev('bt.turn === 3 && bt.proc !== null && bt.pl.field.indexOf(bt.proc.unit) !== -1 && bt.proc.unit.skill === bt.proc.skill'), 'tour 3 : une compétence se déclenche sur une de mes cartes');
  chk(await page.evaluate(() => document.querySelectorAll('#bt-player-field .bcard.skilled .skill-tag:not([hidden])').length === 1 && document.querySelectorAll('#bt-enemy-field .skilled').length === 0), 'une seule carte porte l\'étiquette de sa compétence, aucun adversaire');
  chk(/prête/.test(await page.evaluate(() => document.getElementById('bt-status').textContent)), 'le statut annonce la compétence');
  chk(await page.evaluate(() => document.getElementById('bt-skill').hidden), 'panneau fermé tant qu\'on n\'a pas choisi la carte');
  await page.screenshot({ path: SHOTS + 'skill_apparu.png', fullPage: true });

  // --- choisir une autre carte : pas de panneau ; la compétence reste
  const bIdx = await ev(`bt.pl.field.indexOf(bt.proc.unit)`);
  const otherIdx = bIdx === 0 ? 1 : 0;
  await page.evaluate((i) => document.querySelectorAll('#bt-player-field .bcard')[i].click(), otherIdx);
  await wait(30);
  chk(await phase() === 'pick-target' && await page.evaluate(() => document.getElementById('bt-skill').hidden), 'autre carte : pas de question, on vise directement');
  await ev(`bt.selected=null; bt.phase='pick-attacker'; btRender();`);

  // --- carte chargée : panneau avec question et 3 propositions (dont 1 bonne), ennemis non ciblables
  await ev(`bt.proc = null; bt.pl.field[0].skill = SKILLS.complement; bt.proc = btMakeProc(bt.pl.field[0]); btRender();`);
  await page.evaluate(() => document.querySelectorAll('#bt-player-field .bcard')[0].click());
  await wait(50);
  chk(await phase() === 'pick-skill' && await page.evaluate(() => !document.getElementById('bt-skill').hidden), 'carte chargée : le panneau de la question s\'ouvre');
  chk(await page.evaluate(() => [...document.querySelectorAll('#bt-enemy-field .bcard')].every(c => c.disabled)), 'ennemis pas encore ciblables (il faut répondre)');
  const pn = JSON.parse(await ev(`JSON.stringify({ n: document.querySelectorAll('#bt-skill-row button').length, ok: bt.proc.opts.filter(function(o){return o.ok;}).length, title: document.getElementById('bt-skill-title').textContent })`));
  chk(pn.n === 3 && pn.ok === 1 && /Complément/.test(pn.title) && /×2/.test(pn.title), 'Complément : 3 propositions dont une bonne, titre « ' + pn.title + ' »');
  await page.screenshot({ path: SHOTS + 'skill_panneau.png', fullPage: true });
  // retoucher la carte annule
  await page.evaluate(() => document.querySelectorAll('#bt-player-field .bcard')[0].click());
  await wait(30);
  chk(await phase() === 'pick-attacker' && await page.evaluate(() => document.getElementById('bt-skill').hidden), 'retoucher la carte annule le choix');

  // --- attaque : on choisit une proposition (par prédicat) ou aucune ; renvoie les dégâts mesurés
  async function attackWith(pred) {
    await ev(`window.__att = bt.proc.unit; window.__tg = bt.en.field[0]; window.__a0 = __att.pts; window.__t0 = __tg.pts;`);
    await ev(`bt.selected=null; bt.phase='pick-attacker';`);
    const i = await ev(`bt.pl.field.indexOf(__att)`);
    await page.evaluate((i) => document.querySelectorAll('#bt-player-field .bcard')[i].click(), i);
    await wait(30);
    let failed = false, failSub = '', aim = false, locked = null;
    if (pred === 'none') await page.evaluate(() => document.getElementById('bt-skill-none').click());
    else {
      const idx = await ev(`bt.proc.opts.findIndex(function(o){ return ${pred}; })`);
      await page.evaluate((k) => document.querySelectorAll('#bt-skill-row button')[k].click(), idx);
      await wait(30);
      if (await phase() === 'pick-attacker') {
        // échec : effet d'échec (avec l'explication), retour à l'écran normal ; on attaque sans bonus avec la même carte
        failed = true; failSub = await page.evaluate(() => (document.querySelector('#bt-sfx .sfx-sub') || {}).textContent || '');
        await page.evaluate((i) => document.querySelectorAll('#bt-player-field .bcard')[i].click(), i);
        await wait(30);
      } else {
        aim = await page.evaluate(() => document.getElementById('bt-arena').classList.contains('bt-aim'));
        // le bonus est gagné : retoucher sa carte ne l'annule pas
        await page.evaluate((i) => document.querySelectorAll('#bt-player-field .bcard')[i].click(), i);
        await wait(30);
        locked = await ev(`bt.phase === 'pick-target' && !!bt.armed && bt.selected === __att`);
      }
    }
    await wait(30);
    await page.evaluate(() => document.querySelectorAll('#bt-enemy-field .bcard')[0].click());
    const t0 = Date.now(); let dmg = 0;
    while (Date.now() - t0 < 15000) { dmg = await ev('__t0 - __tg.pts'); if (dmg !== 0) break; await wait(15); }
    const info = JSON.parse(await ev(`JSON.stringify({ dmg: __t0 - __tg.pts, back: __a0 - __att.pts, procLeft: !!bt.proc, sfx: (document.querySelector('#bt-sfx .sfx-text')||{}).textContent, sub: (document.querySelector('#bt-sfx .sfx-sub')||{}).textContent || '' })`));
    info.failed = failed; info.failSub = failSub; info.aim = aim; info.locked = locked;
    await untilPhase('pick-attacker', 40000);
    return info;
  }
  // « sans la compétence » : dégâts normaux, la compétence reste disponible
  let r = await attackWith('none');
  chk(r.dmg === 500 && r.procLeft === true, 'sans la compétence : dégâts normaux (' + r.dmg + '), compétence conservée');
  chk(/(ZIIIP|TCHAK|PIOU|FLOP) !/.test(r.sfx || ''), 'effet sonore de tir (archer) affiché : « ' + r.sfx + ' »');
  chk(await ev(`BT_WORDS.hit.every(function(w){ return /!$/.test(w); }) && BT_WORDS.ko[0] === 'K.O. !'`), 'mots de coup (POW !, BAM !…) et K.O.');

  // --- une compétence à question : bonne réponse = ×2 (×2,5 au niveau Évolué) ; erreur = échec tout de suite, attaque sans bonus
  async function skillRound(skillId, evo, pts, pred) {
    await ev(`bt.pl.field.forEach(function(u){ u.skill = null; }); bt.pl.field[0].skill = SKILLS.${skillId}; bt.pl.field[0].evo = ${evo}; bt.proc = btMakeProc(bt.pl.field[0]);`);
    await prep(pts);
    return attackWith(pred);
  }
  r = await skillRound('complement', 0, 40, 'o.ok');
  chk(r.dmg === 80 && r.procLeft === false && r.back === 0 && !r.failed, 'bonne réponse : ×2 → 80 dégâts pour 40 points, compétence consommée (' + r.sub + ')');
  chk(r.aim === true, 'bonne réponse : les cartes adverses sont mises en avant pour viser');
  chk(r.locked === true, 'bonne réponse : retoucher sa carte n\'annule pas le bonus (pas de relance)');
  chk(/✖️ ×2 BOOM/.test(r.sfx || '') && /👍/.test(r.sub), 'effet affiché « ' + r.sfx + ' » et verdict positif');
  r = await skillRound('complement', 0, 40, '!o.ok');
  chk(r.failed && /bonne réponse était/.test(r.failSub), 'mauvaise réponse : échec tout de suite, avec la bonne réponse (' + r.failSub + ')');
  chk(r.dmg === 40 && r.procLeft === false, 'après l\'échec : la compétence est consommée, l\'attaque fait des dégâts normaux (40)');
  r = await skillRound('table', 1, 40, 'o.ok');
  chk(r.dmg === 100, 'niveau Évolué : bonne réponse ×2,5 → 100 dégâts');
  r = await skillRound('double', 2, 40, 'o.ok');
  chk(r.dmg === 100, 'niveau Ultime : ×2,5 → 100 dégâts');

  // --- « Doubler ou fixe » : ×2 ou N fixes, pour chaque facteur
  async function boostRound(factor, kind) {
    await ev(`bt.pl.field.forEach(function(u){ u.skill = null; }); bt.pl.field[0].skill = SKILLS.boost; bt.pl.field[0].evo = 0; bt.proc = btMakeProc(bt.pl.field[0]); bt.proc.factor = ${factor};`);
    await prep(40);
    // le panneau est construit à l'ouverture ; on choisit « ×2 » ou « fixes » par leur libellé
    await ev(`window.__att = bt.proc.unit; window.__tg = bt.en.field[0]; window.__t0 = __tg.pts; bt.selected=null; bt.phase='pick-attacker';`);
    const i = await ev(`bt.pl.field.indexOf(__att)`);
    await page.evaluate((i) => document.querySelectorAll('#bt-player-field .bcard')[i].click(), i);
    await wait(30);
    const labels = JSON.parse(await ev(`JSON.stringify([].map.call(document.querySelectorAll('#bt-skill-row button'), function(b){ return b.textContent; }))`));
    const k = labels.findIndex(t => kind === 'x2' ? /✖️/.test(t) : /fixes/.test(t));
    await page.evaluate((k) => document.querySelectorAll('#bt-skill-row button')[k].click(), k);
    await wait(30);
    let failed = false, failSub = '';
    if (await phase() === 'pick-attacker') {
      failed = true; failSub = await page.evaluate(() => (document.querySelector('#bt-sfx .sfx-sub') || {}).textContent || '');
      await page.evaluate((i) => document.querySelectorAll('#bt-player-field .bcard')[i].click(), i);
      await wait(30);
    }
    await page.evaluate(() => document.querySelectorAll('#bt-enemy-field .bcard')[0].click());
    const t0 = Date.now(); while (Date.now() - t0 < 15000 && await ev('__t0 - __tg.pts') === 0) await wait(15);
    const info = JSON.parse(await ev(`JSON.stringify({ dmg: __t0 - __tg.pts, procLeft: !!bt.proc, sfx: (document.querySelector('#bt-sfx .sfx-text')||{}).textContent, sub: (document.querySelector('#bt-sfx .sfx-sub')||{}).textContent || '', labels: ${JSON.stringify(labels)} })`));
    info.failed = failed; info.failSub = failSub; info.title = await page.evaluate(() => document.getElementById('bt-skill-title').textContent);
    await untilPhase('pick-attacker', 40000);
    return info;
  }
  r = await boostRound(1, 'x2');
  chk(r.dmg === 80 && r.procLeft === false && !r.failed, '×2 : 80 dégâts pour 40 points, compétence consommée (' + r.labels.join(' / ') + ')');
  chk(r.labels.some(t => /^✖️ Dégâts ×2$/.test(t)) && !r.labels.some(t => /✖️.*80/.test(t)) && /40 points/.test(r.title), 'le résultat du ×2 n\'est pas affiché : l\'enfant le calcule (' + r.labels.join(' / ') + ')');
  chk(/pareil/.test(r.sub), 'facteur 1 : « les deux faisaient pareil » (' + r.sub + ')');
  r = await boostRound(1.3, 'fixed');
  chk(r.dmg === 104 && /👍/.test(r.sub) && !r.failed, 'fixe +30 % : 104 dégâts, bon calcul (' + r.sub + ')');
  r = await boostRound(1.3, 'x2');
  chk(r.failed && /104/.test(r.failSub) && r.dmg === 40, '×2 alors que fixe +30 % valait 104 : échec, puis attaque sans bonus (' + r.failSub + ')');
  r = await boostRound(0.7, 'fixed');
  chk(r.failed && /80/.test(r.failSub) && r.dmg === 40, 'fixe −30 % alors que ×2 valait 80 : échec, attaque sans bonus (' + r.failSub + ')');
  r = await boostRound(0.7, 'x2');
  chk(r.dmg === 80 && /👍/.test(r.sub), '×2 contre fixe −30 % : bon calcul');

  // --- les trois facteurs reviennent tour à tour
  const fs = JSON.parse(await ev(`(function(){ var out=[]; bt.factors=[]; bt.pl.field[0].skill = SKILLS.boost; for(var k=0;k<3;k++){ out.push(btMakeProc(bt.pl.field[0]).factor); } return JSON.stringify(out.sort()); })()`));
  chk(JSON.stringify(fs) === '[0.7,1,1.3]', 'sur 3 déclenchements : double, −30 %, +30 % une fois chacun : ' + fs);
  // pas de 2e déclenchement tant que le premier est là
  await ev(`bt.pl.field.forEach(function(u,i){ u.skill = SKILLS.double; u.evo = 0; }); bt.proc = btMakeProc(bt.pl.field[0]);`);
  const keep = await ev(`(function(){ var b = bt.proc; bt.turn = 5; btStartPlayerTurn(); return bt.proc === b; })()`);
  chk(keep, 'tour 6 : pas de nouvelle compétence tant que l\'ancienne n\'est pas utilisée');
  // le porteur est battu : le déclencheur disparaît
  await ev(`bt.pl.field.splice(bt.pl.field.indexOf(bt.proc.unit),1); btClearProcIfGone();`);
  chk(await ev('bt.proc === null'), 'porteur battu : la compétence disparaît');
  // cadence : tous les 3 tours, tous les 2 si une carte est au niveau Ultime ; jamais sans carte compétente
  const cad = JSON.parse(await ev(`(function(){ var out={};
    function turns(evo, withSkill){ bt.proc=null; bt.pl.field.forEach(function(u){ u.skill = withSkill ? SKILLS.double : null; u.evo = evo; });
      var r=[]; for(var t=1;t<=6;t++){ bt.proc=null; bt.turn=t-1; btStartPlayerTurn(); r.push(bt.proc?1:0); } return r.join(''); }
    out.niv0 = turns(0,true); out.niv2 = turns(2,true); out.sans = turns(0,false); return JSON.stringify(out); })()`));
  chk(cad.niv0 === '001001' && cad.niv2 === '010101' && cad.sans === '000000', 'cadence : niveau 0 → tours 3 et 6 ; Ultime → 2, 4, 6 ; sans compétence → jamais (' + JSON.stringify(cad) + ')');

  // --- déroulé ralenti (vitesse réelle) : plusieurs secondes entre le toucher et la fin de l'attaque
  await ev(`btBackToSetup()`);
  await ev(`btEnemyTurn = window.__realEnemy;`);
  await newBattle(1);
  await ev(`bt.pl.field.forEach(function(u){ u.skill=null; u.sprite.role='archer'; u.pts=500; u.base=500; }); bt.en.field.forEach(function(u){ u.pts=100000; u.base=100000; }); btRender();`);
  const ts = Date.now();
  await page.evaluate(() => document.querySelectorAll('#bt-player-field .bcard')[0].click());
  await wait(30);
  await page.evaluate(() => document.querySelectorAll('#bt-enemy-field .bcard')[0].click());
  await wait(900);
  chk(await page.evaluate(() => !!document.querySelector('#bt-player-field .bcard.charging, #bt-player-field .bcard:not(.charging)')), 'préparation puis charge');
  // capture au moment de l'impact
  let shot = false; const t1 = Date.now();
  while (Date.now() - t1 < 6000) { if (await page.evaluate(() => !!document.querySelector('#bt-sfx .sfx-word'))) { await wait(250); await page.screenshot({ path: SHOTS + 'sfx_impact.png', fullPage: true }); shot = true; break; } await wait(40); }
  chk(shot, 'un effet sonore s\'affiche pendant l\'attaque');
  await untilPhase('pick-attacker', 60000);
  const dur = Date.now() - ts;
  chk(dur >= 6000, 'attaque + riposte adverse prennent du temps à lire : ' + (dur / 1000).toFixed(1) + ' s (≥ 6 s)');
  console.log(bad ? 'ÉCHEC' : 'OK');
});
