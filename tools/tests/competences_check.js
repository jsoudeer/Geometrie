// Compétences : rareté (SVG = commun, illustré = rare), points, attribution (1 compétence par personnage, équilibrée),
// compétence des communs au niveau Ultime, questions de chaque compétence (3 propositions, 1 bonne, calcul vérifié),
// affichage dans la Boutique et dans le choix d'équipe.
const { withPage, SHOTS } = require('./lib');
withPage({ page: 'index_test.html', viewport: { width: 390, height: 900 } }, async (page) => {
  const ev = c => page.evaluate(x => window.__t.__eval(x), c);
  const J = async c => JSON.parse(await ev('JSON.stringify(' + c + ')'));
  let bad = 0; const chk = (ok, m) => { console.log(ok ? '  ok' : '  ✘ ÉCHEC', m); if (!ok) bad++; };

  // --- raretés et points
  const rar = await J(`(function(){ var all=CAT_SPRITES.concat(BRAINROT_SPRITES), o={ badRarity:0, badPts:0, commun:0, rare:0, defi:0, minC:99, maxC:0, minR:99, maxR:0 };
    all.forEach(function(s){ var img = !!CUSTOM_IMG[s.id]; o[s.rarity]++;
      if(s.rarity!=='defi' && (img ? 'rare' : 'commun') !== s.rarity) o.badRarity++;
      if(s.rarity==='commun'){ o.minC=Math.min(o.minC,s.pts); o.maxC=Math.max(o.maxC,s.pts); }
      if(s.rarity==='rare'){ o.minR=Math.min(o.minR,s.pts); o.maxR=Math.max(o.maxR,s.pts); } });
    o.cost = all.filter(function(s){ return s.rarity!=='defi' && !s.starter; }).every(function(s){ return s.cost===(s.rarity==='rare'?20:10); });
    o.keys = Object.keys(RARITY_META).join(); return o; })()`);
  chk(rar.badRarity === 0 && rar.rare > 0 && rar.commun > 0 && rar.defi === 30, `rareté : illustré = rare (${rar.rare}), SVG = commun (${rar.commun}), défis ${rar.defi}`);
  chk(rar.keys === 'commun,rare,defi', 'raretés existantes : ' + rar.keys);
  chk(rar.minC >= 5 && rar.maxC <= 7 && rar.minR >= 9 && rar.maxR <= 11 && rar.maxC < rar.minR, `points : communs ${rar.minC}-${rar.maxC}, rares ${rar.minR}-${rar.maxR} (un commun a moins de points)`);
  chk(rar.cost, 'prix : commun 10 ⭐, rare 20 ⭐');

  // --- attribution des compétences
  const att = await J(`(function(){ var all=CAT_SPRITES.concat(BRAINROT_SPRITES), cnt={}, miss=0, same=0;
    all.forEach(function(s){ var id=SKILL_BY_ID[s.id]; if(!id||!SKILLS[id]) miss++; else cnt[id]=(cnt[id]||0)+1; });
    for(var i=1;i<=35;i++){ var n=(i<10?'0':'')+i; if(SKILL_BY_ID['cat'+n]===SKILL_BY_ID['br'+n]) same++; }
    return { miss:miss, cnt:cnt, n:all.length, same:same, kinds:Object.keys(SKILLS).length }; })()`);
  chk(att.miss === 0 && att.n === 70, 'les 70 personnages ont une compétence attribuée');
  chk(att.kinds === 10 && Object.values(att.cnt).every(n => n === 7), 'chaque compétence est portée par 7 personnages : ' + JSON.stringify(att.cnt));
  chk(att.same === 0, 'le chat et le brainrot de même numéro n\'ont pas la même compétence');

  // --- qui a sa compétence quand ?
  const who = await J(`(function(){ function f(id,l){ return !!skillFor(findAnySprite(id), l); }
    return { communNiv0:f('cat13',0), communNiv1:f('cat13',1), communNiv2:f('cat13',2), rareNiv0:f('cat02',0), defiNiv0:f('cat21',0), starterRare:findAnySprite('cat01').rarity }; })()`);
  chk(!who.communNiv0 && !who.communNiv1 && who.communNiv2, 'un commun gagne sa compétence au niveau Ultime seulement');
  chk(who.rareNiv0 && who.defiNiv0, 'rare et défi : compétence dès le niveau de base');

  // --- questions : 3 propositions distinctes, une seule bonne, calcul vérifié
  const q = await J(`(function(){ var o={ n:0, bad:0, dup:0, notOne:0, wrong:0, perSkill:{}, checked:0 };
    Object.keys(SKILLS).filter(function(k){ return k!=='boost'; }).forEach(function(id){ for(var lvl=0;lvl<3;lvl++) for(var i=0;i<300;i++){
      var x = SKILLS[id].ask(lvl), labs = x.options.map(function(p){return p.label;}); o.n++;
      if(x.options.length!==3 || !x.text || !x.explain || labs.some(function(l){return !l || /NaN|undefined/.test(l);})) o.bad++;
      if(new Set(labs).size!==3) o.dup++;
      var right = x.options.filter(function(p){return p.ok;}); if(right.length!==1) o.notOne++;
      var r = right[0] ? parseFloat(right[0].label) : NaN, m, t = x.text, ok = true, before = o.wrong; o.checked++; var matched = false;
      if(id==='complement' && (m=/de (\\d+) à (\\d+), il manque/.exec(t))) ok = +m[1] + r === +m[2];
      if(id==='table' && (m=/Combien font (\\d+) × (\\d+)/.exec(t))) ok = r === m[1]*m[2];
      if(id==='double' && (m=/double de (\\d+)/.exec(t))) ok = r === 2*m[1];
      if(id==='moitie' && (m=/moitié de (\\d+)/.exec(t))) ok = r*2 === +m[1];
      if(id==='plusgrand' && (m=/nombre : (.*) \\?/.exec(t))) ok = r === Math.max.apply(null, m[1].split(', ').map(Number));
      if(id==='monnaie' && (m=/paies (\\d+) € un objet à (\\d+) €/.exec(t))) ok = r === m[1]-m[2];
      if(id==='partage' && (m=/On partage (\\d+) .* entre (\\d+) amis/.exec(t))) ok = r*m[2] === +m[1];
      if(id==='suite' && (m=/suite : (-?\\d+), (-?\\d+), (-?\\d+), /.exec(t))){ var d=m[2]-m[1]; ok = (m[3]-m[2])===d && r === +m[3]+d && r>=0; }
      if(id==='heure' && (m=/Il est (\\d+) h( 30)? \\. ?Quelle heure sera-t-il dans (.*) \\?/.exec(t.replace('. ',' . ')))){
        var h=+m[1], half=!!m[2], add=m[3], addMin = add==='1 h 30'?90: add==='2 h 30'?150: parseInt(add,10)*60, tot=h*60+(half?30:0)+addMin, hh=((Math.floor(tot/60)-1)%12)+1, mm=tot%60;
        ok = right[0].label === hh+' h'+(mm?' 30':''); }
      matched = /(de \\d+ à \\d+, il manque|Combien font \\d+ × \\d+|double de \\d+|moitié de \\d+|plus grand nombre : |paies \\d+ € un objet à \\d+ €|On partage \\d+ .* entre \\d+ amis|suite : -?\\d+, -?\\d+, -?\\d+, |Il est \\d+ h( 30)?\. Quelle heure sera-t-il dans)/.test(t); if(!matched) ok = false;
      if(!ok){ o.wrong++; o.perSkill[id]=(o.perSkill[id]||[]).concat([t+' -> '+(right[0]&&right[0].label)]).slice(0,2); } } });
    return o; })()`);
  chk(q.n === 9 * 3 * 300 && q.bad === 0 && q.dup === 0 && q.notOne === 0, `${q.n} questions : 3 propositions distinctes, une seule bonne, aucun NaN`);
  chk(q.wrong === 0, 'les réponses justes sont bien calculées (9 compétences × 3 niveaux)' + (q.wrong ? ' ' + JSON.stringify(q.perSkill) : ''));
  // les nombres restent dans la plage du niveau
  const rg = await J(`(function(){ var o={ comp:[0,0], big:0 };
    for(var i=0;i<400;i++){ var x=SKILLS.complement.ask(0); var m=/de (\\d+) à (\\d+)/.exec(x.text); if(+m[2]!==10) o.big++; x=SKILLS.complement.ask(1); m=/de (\\d+) à (\\d+)/.exec(x.text); if(+m[2]!==20) o.big++; x=SKILLS.complement.ask(2); m=/de (\\d+) à (\\d+)/.exec(x.text); if(+m[2]!==100 || +m[1]%5) o.big++;
      x=SKILLS.double.ask(0); if(+/double de (\\d+)/.exec(x.text)[1]>10) o.big++; x=SKILLS.monnaie.ask(0); if(+/paies (\\d+)/.exec(x.text)[1]!==10) o.big++; }
    return o; })()`);
  chk(rg.big === 0, 'plages par niveau respectées (compléments à 10 / 20 / 100, doubles ≤ 10, monnaie sur 10 €)');

  // --- Boutique : la compétence s'affiche (🔒 pour un commun)
  await ev(`ownedCats['cat02']=true; ownedCats['cat13']=true; renderShop();`);
  await page.evaluate(() => document.getElementById('stars-btn').click());
  await page.waitForTimeout(200);
  const lines = await page.evaluate(() => [...document.querySelectorAll('#shop-grid .sprite-card.owned .sp-skill')].map(e => e.textContent));
  chk(lines.some(l => /Complément \(×2\)/.test(l)) && lines.some(l => /🔒 Compétence au niveau Ultime/.test(l)), 'Boutique : « ' + lines.join(' | ') + ' »');
  await ev(`evoCats['cat13']=2; renderShop();`);
  const l2 = await page.evaluate(() => [...document.querySelectorAll('#shop-grid .sprite-card.owned .sp-skill')].map(e => e.textContent));
  chk(!l2.some(l => /🔒/.test(l)) && l2.some(l => /×2,5/.test(l)), 'commun au niveau Ultime : compétence visible, ×2,5 (' + l2.join(' | ') + ')');
  await page.screenshot({ path: SHOTS + 'competences_boutique.png', fullPage: true });
  // --- choix d'équipe : l'icône de la compétence apparaît
  await page.evaluate(() => document.getElementById('battle-btn').click());
  await page.waitForTimeout(200);
  const pt = await page.evaluate(() => [...document.querySelectorAll('#bt-grid-classic .sp-role')].map(e => e.textContent));
  chk(pt.some(t => /🧩/.test(t)) , 'choix d\'équipe : icône de compétence sur la carte (' + pt.join(' | ') + ')');
  console.log(bad ? 'ÉCHEC ' + bad : 'competences OK');
  process.exitCode = bad ? 1 : 0;
});
