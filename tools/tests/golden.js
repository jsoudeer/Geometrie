// Test de non-régression "avant / après" pour les refontes du code.
//
//   node golden.js record sortie.json     enregistre un instantané de l'appli actuelle
//   node golden.js diff a.json b.json     compare deux instantanés
//
// L'instantané contient, avec un hasard FIXE (donc reproductible) :
//  - pour chaque niveau et chaque graine : les questions générées par Mesurer,
//    Déformer, Patron, chaque type de Quizz, Lire l'heure, Régler l'heure ;
//  - les panneaux de réglages et du mode Manuel ;
//  - une empreinte de captures d'écran de tous les écrans principaux, dans les
//    deux thèmes (détecte les changements de CSS).
// Si le code est réorganisé sans changer le comportement, les deux instantanés
// sont identiques.
const fs = require('fs');
const crypto = require('crypto');
const { withPage } = require('./lib');

const md5 = b => crypto.createHash('md5').update(b).digest('hex');

const SEED_INIT = `
  window.__seed = function(s){
    var a = s >>> 0;
    Math.random = function(){
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  };
  window.__seed(12345);
`;

async function record(outFile) {
  const snaps = {};
  const shotDir = outFile.replace(/\.json$/, '') + '_shots/';
  fs.mkdirSync(shotDir, { recursive: true });
  const errors = await withPage({ page: 'index_test.html', init: SEED_INIT }, async (page) => {
    await page.addStyleTag({ content: '*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}' });
    const ev = code => page.evaluate(c => window.__t.__eval(c), code);
    const put = (k, v) => { snaps[k] = typeof v === 'string' ? v : JSON.stringify(v); };
    const shot = async (name) => {
      await page.waitForTimeout(400);
      const buf = await page.screenshot({ fullPage: true });
      fs.writeFileSync(shotDir + name + '.png', buf);
      put('shot:' + name, md5(buf));
    };

    // ---- 1. questions générées (hasard fixe) -------------------------------
    const FAM = {
      measure: ["newMeasureQuestion()", 'fam-measure'],
      deform: ["newDeformQuestion()", 'fam-deform'],
      net: ["loadNet(pickNetForLevel(globalLevel))", 'fam-net'],
      'clock-lire': ["newM5Lire()", 'fam-clock-lire'],
      'clock-regler': ["m5rGenTarget()", 'fam-clock-regler']
    };
    for (let lvl = 0; lvl < 3; lvl++) {
      for (const key of Object.keys(FAM)) {
        for (let s = 1; s <= 25; s++) {
          const [call, pane] = FAM[key];
          const r = await ev(`(function(){ __seed(${s * 97 + lvl}); globalLevel=${lvl}; showFamily('${key}'); var r = ${call};
            return JSON.stringify([document.getElementById('${pane}').innerHTML, r === undefined ? null : r]); })()`);
          put(`fam:${key}:L${lvl}:s${s}`, r);
        }
      }
    }
    // Quizz : chaque type, chaque niveau où il existe, 25 graines
    const types = JSON.parse(await ev(`JSON.stringify(QCM_TYPE_DEFS.map(function(d){ return d.id; }))`));
    put('qcm:types', types);
    for (let lvl = 0; lvl < 3; lvl++) {
      put(`qcm:leveltypes:L${lvl}`, await ev(`JSON.stringify(M4_LEVELS[${lvl}].types)`));
      for (const t of types) {
        const has = JSON.parse(await ev(`JSON.stringify(M4_LEVELS[${lvl}].types.indexOf('${t}') !== -1)`));
        if (!has) continue;
        for (let s = 1; s <= 25; s++) {
          const r = await ev(`(function(){ __seed(${s * 131 + lvl * 7}); globalLevel=${lvl}; m4TypeFilter='${t}'; showFamily('qcm'); newQCM();
            return JSON.stringify([document.getElementById('fam-qcm').innerHTML, m4Current.explain, m4Current.tag, m4Current.choices.map(function(c){return [c.label,c.ok];})]); })()`);
          put(`qcm:${t}:L${lvl}:s${s}`, r);
        }
      }
    }
    await ev(`m4TypeFilter='random'`);
    // Toutes les explications de patrons
    put('net:explain', await ev(`JSON.stringify(NET_DEFS.map(function(n){ return [n.id || n.name || null, netExplain(n)]; }))`));
    put('net:pools', await ev(`JSON.stringify(M3_LEVELS.map(function(l){ return l.pool.map(function(n){ return n.id || n.name || null; }); }))`));

    // ---- 2. panneaux générés (réglages, mode Manuel) -----------------------
    await page.click('#settings-btn');
    await page.waitForTimeout(150);
    put('panel:settings', await ev(`document.getElementById('settings-overlay').innerHTML`));
    const cfg = await page.$('text=Configurer les activités');
    if (cfg) { await cfg.click(); await page.waitForTimeout(150); put('panel:settings-config', await ev(`document.getElementById('settings-overlay').innerHTML`)); }
    await page.keyboard.press('Escape');
    await page.waitForTimeout(100);
    await ev(`setAppMode('manual')`);
    put('panel:manual', await ev(`document.getElementById('manual-picker').innerHTML`));
    await ev(`setAppMode('auto')`);

    // ---- 3. empreintes de captures d'écran ---------------------------------
    // (une première capture « à blanc » : la toute première est parfois instable
    //  au sous-pixel près, même sur une appli inchangée)
    await page.screenshot({ fullPage: true });
    await page.waitForTimeout(400);
    for (const theme of ['cats', 'brainrot']) {
      const cur = await ev(`document.body.getAttribute('data-app-theme')`);
      if (cur !== theme) { await page.click('#theme-toggle'); await page.waitForTimeout(150); }
      await ev(`__seed(4242); globalLevel=1; showFamily('measure'); newMeasureQuestion();`);
      for (const key of Object.keys(FAM)) {
        await ev(`__seed(777); globalLevel=1; showFamily('${key}'); ${FAM[key][0]};`);
        await shot(`${theme}_${key}`);
      }
      for (const t of ['align', 'coordFind', 'symAxe', 'solideNom', 'monnaie', 'calc', 'heure', 'vie', 'image']) {
        await ev(`__seed(555); globalLevel=2; m4TypeFilter='${t}'; showFamily('qcm'); newQCM();`);
        await shot(`${theme}_qcm_${t}`);
      }
      await ev(`m4TypeFilter='random'`);
      await ev(`setAppMode('manual')`); await shot(`${theme}_manual`); await ev(`setAppMode('auto')`);
      const arena = await page.$('.tab-btn[data-tab="arena"]');
      if (arena) {
        await page.click('#menu-btn').catch(() => {});
        await arena.click().catch(() => {});
        await page.waitForTimeout(150);
        await shot(`${theme}_arena_shop`);
        await ev(`Array.prototype.slice.call(document.querySelectorAll('#arena-modes .level-btn'))[1].click()`).catch(() => {});
        await page.waitForTimeout(150);
        await shot(`${theme}_arena_battle`);
        await ev(`Array.prototype.slice.call(document.querySelectorAll('#arena-modes .level-btn'))[0].click()`).catch(() => {});
        const back = await page.$('.tab-btn[data-tab="facile"]');
        if (back) { await page.click('#menu-btn').catch(() => {}); await back.click().catch(() => {}); }
      }
    }
  });
  put0(snaps, 'page-errors', errors);
  fs.writeFileSync(outFile, JSON.stringify(snaps));
  console.log('Instantané écrit :', outFile, '(' + Object.keys(snaps).length + ' entrées)');
}
function put0(s, k, v) { s[k] = JSON.stringify(v); }

function diff(a, b) {
  const A = JSON.parse(fs.readFileSync(a, 'utf8')), B = JSON.parse(fs.readFileSync(b, 'utf8'));
  const keys = new Set([...Object.keys(A), ...Object.keys(B)]);
  let bad = 0, total = 0;
  const byGroup = {};
  for (const k of keys) {
    total++;
    if (A[k] !== B[k]) { bad++; const g = k.split(':').slice(0, 2).join(':'); (byGroup[g] = byGroup[g] || []).push(k); }
  }
  if (!bad) { console.log('IDENTIQUE : ' + total + ' éléments comparés, aucune différence.'); return 0; }
  console.log('DIFFÉRENCES : ' + bad + ' / ' + total);
  for (const g of Object.keys(byGroup)) console.log('  ' + g + ' → ' + byGroup[g].length + ' (ex. ' + byGroup[g][0] + ')');
  return 1;
}

const [cmd, x, y] = process.argv.slice(2);
if (cmd === 'record' && x) record(x).catch(e => { console.error(e); process.exit(1); });
else if (cmd === 'diff' && x && y) process.exit(diff(x, y));
else { console.log('usage: node golden.js record out.json | node golden.js diff a.json b.json'); process.exit(2); }
