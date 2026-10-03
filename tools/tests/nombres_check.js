// Nouveaux types : nombres jusqu'à 1000 et calcul écrit (lettres, ±10/100, encadrer, droite, blocs, additions, soustractions, multiplier).
const { withPage, SHOTS } = require('./lib');
withPage({ page: 'index_test.html', viewport: { width: 390, height: 900 } }, async (page) => {
  const ev = c => page.evaluate(x => window.__t.__eval(x), c);
  let bad = 0; const chk = (ok, m) => { console.log(ok ? '  ok' : '  ✘', m); if (!ok) bad++; };
  // orthographe des nombres
  const w = JSON.parse(await ev(`JSON.stringify([21,70,71,75,80,81,91,99,100,101,200,280,300,342,999].map(nombreEnLettres))`));
  chk(w.join('|') === 'vingt et un|soixante-dix|soixante et onze|soixante-quinze|quatre-vingts|quatre-vingt-un|quatre-vingt-onze|quatre-vingt-dix-neuf|cent|cent un|deux cents|deux cent quatre-vingts|trois cents|trois cent quarante-deux|neuf cent quatre-vingt-dix-neuf', 'nombres en lettres : ' + w.join(', '));
  // propriétés générales + exactitude des réponses
  const ids = ['blocs1000','lettres','plusMoins','encadrer','droite','addition','soustractionPosee','multiplier'];
  for (const id of ids) for (const lv of [0,1,2]) {
    const r = JSON.parse(await ev(`JSON.stringify((function(){ var def=quizTypeById('${id}'); var o={n:0,notOne:0,dup:0,few:0,empty:0,wrong:0,noDraw:0,clip:0,lv:def.defaultLevels.indexOf(${lv})!==-1};
      for(var i=0;i<250;i++){ var q=def.generate(${lv}); o.n++;
        var labs=q.choices.map(function(c){return c.label;});
        if(q.choices.filter(function(c){return c.ok;}).length!==1) o.notOne++;
        if(new Set(labs).size!==labs.length) o.dup++;
        if(labs.length<4) o.few++;
        if(labs.some(function(l){return !l;}) || !q.question || !q.explain) o.empty++;
        var ok=q.choices.filter(function(c){return c.ok;})[0].label, m;
        if((m=/Calcule (\\d+) \\+ (\\d+)\\./.exec(q.question)) && +ok!==+m[1]+ +m[2]) o.wrong++;
        if((m=/Calcule (\\d+) - (\\d+)\\./.exec(q.question)) && +ok!==+m[1]- +m[2]) o.wrong++;
        if((m=/résultat de (\\d+) ([+-]) (\\d+)/.exec(q.question)) && +ok!==(m[2]==='+'?+m[1]+ +m[3]:+m[1]- +m[3])) o.wrong++;
        if((m=/(\\d+) fois (\\d+)/.exec(q.question)) && +ok!==+m[1]* +m[2]) o.wrong++;
        if((m=/partage (\\d+) .* entre (\\d+) enfants/.exec(q.question)) && +ok*+m[2]!==+m[1]) o.wrong++;
        if((m=/(\\d+) .*paquets de (\\d+)/.exec(q.question)) && +ok*+m[2]!==+m[1]) o.wrong++;
        document.getElementById('m4Svg').innerHTML=''; q.draw();
        if(!document.getElementById('m4Svg').children.length) o.noDraw++;
        var svg=document.getElementById('m4Svg'), vb=svg.viewBox.baseVal; [].forEach.call(svg.querySelectorAll('text'),function(t){ var b=t.getBBox(); if(b.width>0 && (b.x<vb.x-0.5 || b.x+b.width>vb.x+vb.width+0.5)) o.clip++; });
      } return o; })())`));
    chk(r.notOne === 0 && r.dup === 0 && r.few === 0 && r.empty === 0 && r.wrong === 0 && r.noDraw === 0 && r.clip === 0,
      `${id} niveau ${lv}${r.lv ? '' : ' (hors niveaux par défaut)'} : 250 questions OK` + (r.notOne||r.dup||r.few||r.empty||r.wrong||r.noDraw||r.clip ? ' ' + JSON.stringify(r) : ''));
  }
  // lettres ⇄ chiffres : la réponse correspond bien au mot
  const l = JSON.parse(await ev(`JSON.stringify((function(){ var def=quizTypeById('lettres'), bad=0, k=0;
    for(var lv=0;lv<3;lv++) for(var i=0;i<200;i++){ var q=def.generate(lv); var ok=q.choices.filter(function(c){return c.ok;})[0].label;
      var parts=q.explain.replace(/[«»]/g,'').replace(/\.$/,'').split(" s'écrit "); k++;
      if(!isNaN(+ok)){ if(nombreEnLettres(+ok)!==parts[0].trim()) bad++; } else if(nombreEnLettres(+parts[0])!==ok || parts[1].trim()!==ok) bad++; }
    return {k:k,bad:bad}; })())`));
  chk(l.k > 100 && l.bad === 0, 'lettres : explications cohérentes (' + l.k + ')');
  // affichage réel : un type s'affiche en jeu sans coupure
  await ev(`globalLevel=2; m4TypeFilter='droite'; showFamily('qcm'); newQCM();`);
  await page.waitForTimeout(900); await page.screenshot({ path: SHOTS + '/nombres_droite.png' });
  await ev(`globalLevel=2; m4TypeFilter='blocs1000'; showFamily('qcm'); newQCM();`);
  await page.waitForTimeout(900); await page.screenshot({ path: SHOTS + '/nombres_blocs.png' });
  const dom = JSON.parse(await ev(`JSON.stringify(['blocs1000','lettres','plusMoins','encadrer','droite','addition','soustractionPosee','multiplier'].map(function(i){ return quizDomainId(quizTypeById(i)); }))`));
  chk(dom.join() === 'nombres,nombres,nombres,nombres,nombres,calcul,calcul,calcul', 'domaines : ' + dom.join());
  console.log(bad ? 'ÉCHEC' : 'OK');
});
