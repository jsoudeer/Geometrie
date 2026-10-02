// Règles communes à TOUTES les activités (déroulé makeQuestionFlow, noyau.js) :
//  - la question est dans la bulle (.coach-bubble) ;
//  - bonne réponse : série +1, étoile, boutons masqués, toucher le retour = question suivante ;
//  - QCM : 1 tentative, une erreur remet la série à 0 et ferme la question ;
//  - manipulations : 3 tentatives ; les 2 premiers ratés laissent la question ouverte
//    et la série intacte, le 3e la ferme, remet la série à 0 et montre la solution ;
//  - « Nouvelle activité » : neutre avant tout essai, erreur après un essai raté.
const { withPage } = require('./lib');
withPage({ page: 'index_test.html', viewport: { width: 390, height: 900 } }, async (page) => {
  const ev = c => page.evaluate(x => window.__t.__eval(x), c);
  let bad = 0; const chk = (ok, msg) => { console.log(ok ? '  ok' : '  ✘', msg); if (!ok) bad++; };

  // Pour chaque activité : comment la générer, répondre juste, répondre faux, et où sont ses éléments.
  const pickBtn = (sel, test) => `(function(){ var b=[].slice.call(document.querySelectorAll('${sel}')).filter(function(b){ return ${test}; })[0]; b.click(); })()`;
  const FAM = {
    'measure':      { fb:'m1-feedback', skip:'m1-next', tries:1,
      right: pickBtn('#m1-choices .choice-btn', `b.textContent===fmtNum(currentLen)+' cm'`),
      wrong: pickBtn('#m1-choices .choice-btn', `b.textContent!==fmtNum(currentLen)+' cm'`) },
    'estimate':     { fb:'est-feedback', skip:'est-next', tries:1,
      right: pickBtn('#est-choices .choice-btn', `b.textContent===fmtNum(estLen)+' cm'`),
      wrong: pickBtn('#est-choices .choice-btn', `b.textContent!==fmtNum(estLen)+' cm'`) },
    'qcm':          { fb:'m4-feedback', skip:'m4-next', tries:1,
      right: pickBtn('#m4-choices .choice-btn', 'b._ok'), wrong: pickBtn('#m4-choices .choice-btn', '!b._ok') },
    'clock-lire':   { fb:'m5-feedback', skip:'m5-next', tries:1,
      right: pickBtn('#m5-choices .choice-btn', `b.textContent.toLowerCase()===m5Current.choices.filter(function(c){return c.ok;})[0].label.toLowerCase()`),
      wrong: pickBtn('#m5-choices .choice-btn', `b.textContent.toLowerCase()!==m5Current.choices.filter(function(c){return c.ok;})[0].label.toLowerCase()`) },
    'net':          { fb:'m3-feedback', skip:'m3-next', tries:1,
      right: pickBtn('#m3-choices .choice-btn', 'b.textContent===M3_ANSWER_LABELS[currentNet.answer]'),
      wrong: pickBtn('#m3-choices .choice-btn', 'b.textContent!==M3_ANSWER_LABELS[currentNet.answer]') },
    'deform':       { fb:'m2-feedback', skip:'m2-next', tries:3,
      right: `pts=m2Target.map(function(p){return p.slice();}); document.getElementById('m2-check').click()`,
      wrong: `pts=(m2ShapeIdx>=3 ? [[20,20],[240,30],[130,45]] : [[20,20],[240,20],[200,60],[40,200]]); document.getElementById('m2-check').click()`,
      solved: `(function(){ var lv=M2_LEVELS[m2ShapeIdx], r=lv.check(lv.tolGreat, lv.tolOk); return m2Revealed && r.ok && !r.approx; })()` },   // la forme se remet juste sous les yeux (~1 s)
    'clock-regler': { fb:'m5r-feedback', skip:'m5r-new', tries:3,
      right: `m5rHourTick=m5Target.hour%12; m5rMinTick=Math.round(m5Target.minute*6/M5R_MIN_STEP[m5Target.level])%Math.round(360/M5R_MIN_STEP[m5Target.level]); document.getElementById('m5r-check').click()`,
      wrong: `m5rHourTick=(m5Target.hour+6)%12; document.getElementById('m5r-check').click()`,
      // la solution affichée doit passer la vérification : on la revérifie en interne
      solved: `m5rHourTick===m5Target.hour%12 && m5rMinutes()===m5Target.minute` },
    'atelier-sym':  { fb:'at-atelier-sym-fb', skip:'at-atelier-sym-next', tries:3,
      right: `atSym.mine=atSym.solution.map(function(r){return r.slice();}); document.getElementById('at-atelier-sym-check').click()`,
      wrong: `atSym.mine=atSym.solution.map(function(r){return r.map(function(){return false;});}); document.getElementById('at-atelier-sym-check').click()`,
      solved: `JSON.stringify(atSym.mine)===JSON.stringify(atSym.solution)` },
    'atelier-fraction': { fb:'at-atelier-fraction-fb', skip:'at-atelier-fraction-next', tries:3,
      right: `atFrac.on=atFrac.on.map(function(v,i){return i<atFrac.k;}); document.getElementById('at-atelier-fraction-check').click()`,
      wrong: `atFrac.on=atFrac.on.map(function(){return false;}); document.getElementById('at-atelier-fraction-check').click()`,
      solved: `atFrac.on.filter(function(v){return v;}).length===atFrac.k` },
    'atelier-copie': { fb:'at-atelier-copie-fb', skip:'at-atelier-copie-next', tries:3,
      right: `atCopy.mine=atCopy.model.map(function(r){return r.slice();}); document.getElementById('at-atelier-copie-check').click()`,
      wrong: `atCopy.mine=atCopy.model.map(function(r){return r.map(function(){return false;});}); document.getElementById('at-atelier-copie-check').click()`,
      solved: `JSON.stringify(atCopy.mine)===JSON.stringify(atCopy.model)` },
    'atelier-erreur': { fb:'at-atelier-erreur-fb', skip:'at-atelier-erreur-next', tries:3,
      right: `atErr.marks=atErr.marks.map(function(row,r){return row.map(function(v,c){return atErrIsDiff(r,c);});}); document.getElementById('at-atelier-erreur-check').click()`,
      wrong: `atErr.marks=atErr.marks.map(function(row){return row.map(function(){return false;});}); document.getElementById('at-atelier-erreur-check').click()`,
      solved: `atErr.marks.every(function(row,r){return row.every(function(v,c){return v===atErrIsDiff(r,c);});})` },
    'atelier-axe': { fb:'at-atelier-axe-fb', skip:'at-atelier-axe-next', tries:3,
      right: `atAxe.cands.forEach(function(a){atAxe.sel[a]=atAxe.truth.indexOf(a)>=0;}); document.getElementById('at-atelier-axe-check').click()`,
      wrong: `atAxe.cands.forEach(function(a){atAxe.sel[a]=atAxe.truth.indexOf(a)<0;}); document.getElementById('at-atelier-axe-check').click()`,
      solved: `atAxe.cands.every(function(a){return atAxe.sel[a]===(atAxe.truth.indexOf(a)>=0);})` }
  };

  // mode Aléatoire, sans montée de niveau automatique (elle changerait l'écran pendant le test)
  await ev(`appMode='auto'; practiceMode='free'; autoAdvanceEnabled=false;`);
  const streak = () => ev('freeStreak');
  const gen = key => ev(`globalLevel=1; resetFreeStreak(); freeStreak=5; lastFamily=null; generateFamilyQuestion('${key}'); currentFamily`);
  const state = f => page.evaluate(f => {
    const fb = document.getElementById(f.fb), row = fb.parentNode.querySelector('.btn-row');
    return { shown: fb.classList.contains('show'), good: fb.classList.contains('good'), tappable: fb.classList.contains('tappable'), rowHidden: !!row.hidden, text: fb.textContent };
  }, f);

  const btnBottoms = {};
  for (const [key, f] of Object.entries(FAM)) {
    console.log('— ' + key);
    // en-tête commun
    await gen(key);
    const bubble = await page.evaluate(k => { const w = document.getElementById('fam-' + k); const b = w && w.querySelector('.coach-bubble'); return b ? b.textContent.trim() : ''; }, key);
    chk(bubble.length > 3, 'question dans la bulle : « ' + bubble + ' »');
    await page.waitForTimeout(800);   // fin de l'animation d'apparition de la question
    // Une question de QCM très haute (figure + 4 réponses) dépasse l'écran de test : le bas de page défile,
    // ce qui n'a rien à voir avec l'alignement mesuré ici. On en tire une autre (déterministe).
    for (let k2 = 0; k2 < 12 && key === 'qcm' && await page.evaluate(() => { const r = document.querySelector('#fam-qcm .btn-row'); return r && r.getBoundingClientRect().bottom > innerHeight; }); k2++) { await gen(key); await page.waitForTimeout(800); }
    const pos = await page.evaluate(k => {
      const w = document.getElementById('fam-' + k), bottom = w.querySelector('.q-bottom'), row = w.querySelector('.btn-row'), ch = w.querySelector('.choices, .qcm-choices');
      return { last: w.lastElementChild === bottom, inBottom: bottom.contains(row) && (!ch || bottom.contains(ch)),
        rowBottom: Math.round(row.getBoundingClientRect().bottom), gap: ch ? Math.round(row.getBoundingClientRect().top - ch.getBoundingClientRect().bottom) : null };
    }, key);
    btnBottoms[key] = pos.rowBottom;
    chk(pos.last && pos.inBottom, 'zone de réponse en bas (réponses + boutons)');
    if (pos.gap !== null) chk(pos.gap >= 0 && pos.gap <= 40, 'réponses juste au-dessus des boutons (écart ' + pos.gap + ' px)');
    const order = await page.evaluate(k => {
      const btns = [...document.querySelectorAll('#fam-' + k + ' .btn-row .btn')];
      const next = btns.find(b => /-(next|new)$/.test(b.id)), check = btns.find(b => /-check$/.test(b.id));
      return { first: btns[0] === next, rightOf: !check || check.getBoundingClientRect().left > next.getBoundingClientRect().right - 1, labels: btns.map(b => b.textContent.trim()).join(' | ') };
    }, key);
    chk(order.first && order.rightOf, 'Nouvelle activité à gauche, Vérifier à sa droite (' + order.labels + ')');
    const colors = await page.evaluate(k => [...document.querySelectorAll('#fam-' + k + ' .btn-row .btn')].map(b => getComputedStyle(b).backgroundColor), key);
    chk(colors.length > 0 && colors.every(c => c === colors[0]), 'boutons de la même couleur (' + [...new Set(colors)].join(' / ') + ')');

    // 1) bonne réponse
    const stars0 = await page.evaluate(() => +document.getElementById('starCount').textContent);
    await ev(f.right);
    let s = await state(f);
    chk(s.shown && s.good, 'bonne réponse acceptée');
    chk(await streak() === 6, 'série +1 (5 → ' + await streak() + ')');
    chk(await page.evaluate(() => +document.getElementById('starCount').textContent) === stars0 + 1, '+1 étoile');
    chk(s.rowHidden, 'boutons Vérifier / Nouvelle activité masqués');
    chk(s.tappable, 'retour marqué « touche pour continuer »');
    await ev(f.right);
    chk(await streak() === 6, 'répondre encore ne compte pas deux fois');
    // toucher le retour = question suivante (en mode Manuel sur cette activité, pour rester dessus)
    await ev(`appMode='manual'; manualFamily='${key}';`);
    await page.evaluate(id => document.getElementById(id).click(), f.fb);
    s = await state(f);
    chk(!s.shown && !s.rowHidden, 'toucher le retour → nouvelle question, boutons revenus');
    await ev(`appMode='auto'; manualFamily=null;`);

    // 2) erreurs
    await gen(key);
    for (let t = 1; t <= f.tries; t++) {
      await ev(f.wrong);
      s = await state(f);
      if (t < f.tries) {
        chk(s.shown && !s.good && !s.rowHidden && !s.tappable && /Essai \d sur 3/.test(s.text), 'raté n°' + t + ' : question toujours ouverte (' + s.text.match(/Essai \d sur 3/) + ')');
        chk(await streak() === 5, 'raté n°' + t + ' : série intacte');
      } else {
        chk(s.shown && !s.good && s.rowHidden && s.tappable, (f.tries === 1 ? 'erreur' : 'raté n°3') + ' : question fermée');
        chk(await streak() === 0, 'série remise à 0');
        if (f.solved) { await page.waitForTimeout(1200); chk(await ev(f.solved), 'la solution est affichée'); }
      }
    }

    // 3) « Nouvelle activité »
    await gen(key);
    await page.evaluate(id => document.getElementById(id).click(), f.skip);
    chk(await streak() === 5, 'passer avant d\'essayer : neutre');
    if (f.tries > 1) {
      await gen(key);
      await ev(f.wrong);
      await page.evaluate(id => document.getElementById(id).click(), f.skip);
      chk(await streak() === 0, 'passer après un raté : compte comme une erreur');
    }
  }
  const vals = Object.values(btnBottoms);
  chk(Math.max(...vals) - Math.min(...vals) <= 1, 'boutons au même endroit dans toutes les activités (' + JSON.stringify(btnBottoms) + ' px)');
  console.log(bad ? 'ÉCHEC (' + bad + ')' : 'OK');
});
