// Bataille : modes Entraînement / Aventure (30 ❤️ puis +10 % par victoire, paliers nommés tous les 10 niveaux),
// fin de partie : « Abandonner » caché, « Nouvelle partie » (même équipe ?) et « Arrêter » côte à côte.
const { withPage, SHOTS } = require('./lib');
withPage({ page: 'index_test.html', viewport: { width: 390, height: 844 } }, async (page) => {
  let bad = 0; const chk = (ok, msg) => { console.log(ok ? '  ok' : '  ✘ ÉCHEC', msg); if (!ok) bad++; };
  const ev = c => page.evaluate(x => window.__t.__eval(x), c);
  const vis = id => page.evaluate(i => { const e = document.getElementById(i); return !!e && !e.hidden && !!e.offsetParent; }, id);
  const txt = id => page.evaluate(i => document.getElementById(i).textContent, id);
  await ev(`BT_SPEED=0.05; ['cat01','cat02','cat03','cat04','cat05'].forEach(function(id){ ownedCats[id]=true; }); btSel.cats={classic:['cat01','cat02','cat03'],support:['cat04'],archer:['cat05']}; renderBtSetup(); 0`);
  await page.click('#battle-btn'); await page.waitForTimeout(300);
  const modes = await page.evaluate(() => [...document.querySelectorAll('#bt-mode-row .level-btn')].map(b => b.textContent));
  chk(modes.length === 2 && /Entraînement/.test(modes[0]) && /Aventure/.test(modes[1]), 'deux modes : ' + modes.join(' / '));
  chk(await vis('bt-diff-row') && !(await vis('bt-adv-level')), 'Entraînement : la difficulté (Facile / Normal / Difficile) est proposée');
  await page.evaluate(() => [...document.querySelectorAll('#bt-mode-row .level-btn')][1].click()); await page.waitForTimeout(150);
  chk(!(await vis('bt-diff-row')) && await vis('bt-adv-level') && /niveau 1 · palier « Petit pompon »/.test(await txt('bt-adv-level')), 'Aventure : niveau et palier affichés (' + await txt('bt-adv-level') + ')');
  chk(/❤️ 30 points/.test(await txt('bt-diff-note')), 'Aventure niveau 1 : adversaires à 30 points (' + await txt('bt-diff-note') + ')');
  await page.screenshot({ path: SHOTS + 'aventure_setup.png' });
  // combat d'aventure : total adverse = la cible, niveau affiché sur le terrain
  await page.click('#bt-start'); await page.waitForTimeout(300);
  chk(await ev('btTotal(bt.en.field.concat(bt.en.reserve)) === 30 && bt.mode === "adv"'), 'niveau 1 : équipe adverse à 30 points exactement');
  chk(await vis('bt-adv-badge') && /niveau 1/.test(await txt('bt-adv-badge')) && await vis('bt-quit-row'), 'terrain : niveau affiché, bouton « Abandonner » pendant le combat');
  // victoire
  await ev(`bt.en.field=[]; bt.en.reserve=[]; btCheckEnd(); 0`); await page.waitForTimeout(200);
  chk(await ev('btAdv.cats === 2 && JSON.parse(localStorage.getItem("geo_bt_adv")).cats === 2'), 'victoire : niveau 2, enregistré');
  chk(/Niveau 2 débloqué[^.]*❤️ 33 points/.test(await txt('bt-over-text')), 'message : prochains adversaires à 33 points (+10 %)');
  chk(!(await vis('bt-quit-row')) && await vis('bt-again') && await vis('bt-stop'), 'fin de partie : « Abandonner » caché, « Nouvelle partie » et « Arrêter » côte à côte');
  await page.screenshot({ path: SHOTS + 'aventure_victoire.png' });
  // nouvelle partie : on demande si l'on garde la même équipe
  await page.click('#bt-again'); await page.waitForTimeout(150);
  chk(await vis('bt-again-ask') && !(await vis('bt-over-row')) && /même équipe/.test(await txt('bt-again-q')), 'Nouvelle partie : « Tu gardes la même équipe ? »');
  await page.click('#bt-same-team'); await page.waitForTimeout(300);
  chk(await vis('bt-arena') && !(await vis('bt-over')) && await ev('btTotal(bt.en.field.concat(bt.en.reserve)) === 33'), 'même équipe : nouveau combat tout de suite, adversaires à 33 points');
  // défaite : le niveau reste
  await ev(`bt.pl.field=[]; bt.pl.reserve=[]; btCheckEnd(); 0`); await page.waitForTimeout(150);
  chk(await ev('btAdv.cats === 2') && /Tu restes au niveau 2/.test(await txt('bt-over-text')), 'défaite : on reste au niveau 2');
  await page.click('#bt-again'); await page.waitForTimeout(100); await page.click('#bt-new-team'); await page.waitForTimeout(200);
  chk(await vis('bt-setup') && !(await vis('bt-arena')), 'changer d\'équipe : retour au choix de l\'équipe');
  // paliers : passage du niveau 10 au 11
  await ev(`btAdv.cats = 10; btStart(); bt.en.field=[]; bt.en.reserve=[]; btCheckEnd(); 0`); await page.waitForTimeout(150);
  chk(/Nouveau palier : « Patte de velours »/.test(await txt('bt-over-text')), 'niveau 11 : nouveau palier « Patte de velours »');
  chk(await ev('btAdvTarget(11) === Math.round(30 * Math.pow(1.1, 10)) && btAdvTarget(11) === 78'), 'niveau 11 : adversaires à 78 points');
  chk(await ev('btTierName("brainrot", 1) === "Petit bug" && btTierName("brainrot", 25) === "Bizarro débutant" && /Mythe éternel 2/.test(btTierName("cats", 105))'), 'paliers Brainrot et au-delà du dernier palier');
  // grande cible : les points des adversaires sont ajustés même au-delà de ce que les cartes valent
  await ev(`btAdv.cats = 40; btStart(); 0`);
  chk(await ev('btTotal(bt.en.field.concat(bt.en.reserve)) === btAdvTarget(40)'), 'niveau 40 : adversaires ajustés à ❤️ ' + await ev('btAdvTarget(40)'));
  // arrêter : on quitte la bataille
  await ev(`bt.en.field=[]; bt.en.reserve=[]; btCheckEnd(); 0`); await page.waitForTimeout(100);
  await page.click('#bt-stop'); await page.waitForTimeout(200);
  chk(await page.evaluate(() => document.getElementById('tab-battle').hidden && !document.getElementById('tab-practice').hidden), 'Arrêter : retour aux exercices');
  // entraînement : cible = ton équipe × difficulté (pas d'ajustement)
  await ev(`btMode='train'; btDiff=1; btStart(); 0`);
  chk(await ev('bt.mode === "train" && document.getElementById("bt-adv-badge").hidden'), 'Entraînement : pas de niveau d\'aventure sur le terrain');
  await ev('btBackToSetup(); resetProgress(); 0');
  chk(await ev('btAdv.cats === 1 && btAdv.brainrot === 1 && localStorage.getItem("geo_bt_adv") === null'), 'effacer la progression remet l\'aventure au niveau 1');
  console.log(bad ? 'ÉCHEC' : 'aventure_check OK'); process.exit(bad ? 1 : 0);
});
