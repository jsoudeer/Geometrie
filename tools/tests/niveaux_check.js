// P2 de l'audit : Solides et Monnaie lisent le niveau ; notes de réglage exactes ; plus d'ordre d'affichage historique ; énigmes sans doublon.
const { withPage } = require('./lib');
withPage({ page: 'index_test.html', viewport: { width: 390, height: 900 } }, async (page) => {
  let bad = 0; const chk = (ok, msg) => { console.log(ok ? '  ok' : '  ✘ ÉCHEC', msg); if (!ok) bad++; };
  const J = async c => JSON.parse(await page.evaluate(x => window.__t.__eval(x), c));
  const r = await J(`(function(){
    function def(id){ return QCM_TYPE_DEFS.filter(function(d){return d.id===id;})[0]; }
    var o = { nom:[{},{},{}], cpt:[{},{},{}], mon:[{},{},{}], badDistract:0, badCount:0 };
    var easyN = ['cube','pavé droit','cylindre','cône','boule'];
    for(var lv=0; lv<3; lv++) for(var i=0;i<300;i++){
      var q = def('solideNom').generate(lv);
      var ok = q.choices.filter(function(c){return c.ok;})[0].label; o.nom[lv][ok]=1;
      if(lv===0 && q.choices.some(function(c){ return easyN.indexOf(c.label)===-1; })) o.badDistract++;
      var c = def('solideCompte').generate(lv); var m = /\\((.*)\\) \\?$/.exec(c.question); o.cpt[lv][m[1]]=1;
      var mq = def('monnaie').generate(lv); var svg=document.getElementById('m4Svg'); mq.draw();
      var vals = [].map.call(svg.querySelectorAll('text'), function(t){ return parseInt(t.textContent,10); });
      o.mon[lv].n = Math.min(o.mon[lv].n||9, vals.length); o.mon[lv].N = Math.max(o.mon[lv].N||0, vals.length);
      o.mon[lv].v = Math.max(o.mon[lv].v||0, Math.max.apply(null, vals));
      var sum = vals.reduce(function(a,b){return a+b;},0);
      if(mq.choices.filter(function(c){return c.ok && c.label===sum+'€';}).length!==1) o.badCount++;
    }
    o.nomN = o.nom.map(function(x){return Object.keys(x).length;}); o.cptN = o.cpt.map(function(x){return Object.keys(x).length;});
    o.nom0 = Object.keys(o.nom[0]); o.nom1 = Object.keys(o.nom[1]);
    o.order = typeof QCM_DISPLAY_ORDER; o.enigmes = ENIGME_POOL.length;
    o.dupEnigme = ENIGME_POOL.length - new Set(ENIGME_POOL.map(function(e){return e.text;})).size;
    o.noteNom = def('solideNom').randomNote; o.noteCpt = def('solideCompte').randomNote; o.noteEnigme = def('enigme').randomNote;
    o.solids = Object.keys(SOLID_META).length;
    return JSON.stringify(o); })()`);
  chk(r.nom0.every(l => ['cube','pavé droit','cylindre','cône','boule'].includes(l)) && r.nomN[0] === 5 && r.badDistract === 0, 'Solides Facile : 5 solides simples, mauvaises réponses comprises (' + r.nom0.join(', ') + ')');
  chk(r.nomN[1] === 8 && r.nom1.every(l => !/octaèdre|prisme (penta|hexa|octo)/.test(l)), 'Solides Moyen : 8 solides, sans octaèdre ni gros prismes');
  chk(r.nomN[2] === r.solids && r.solids === 12, 'Solides Difficile : les 12 solides');
  chk(r.cptN.join() === '3,4,9', 'Compter les solides : 3, 4 puis 9 solides selon le niveau (' + r.cptN.join() + ')');
  chk(r.mon[0].n === 2 && r.mon[0].N === 2 && r.mon[0].v <= 5, 'Monnaie Facile : 2 pièces/billets, jusqu\'à 5 € (' + JSON.stringify(r.mon[0]) + ')');
  chk(r.mon[1].n === 2 && r.mon[1].N === 3 && r.mon[1].v <= 10, 'Monnaie Moyen : 2 ou 3, jusqu\'à 10 €');
  chk(r.mon[2].n === 3 && r.mon[2].N === 4 && r.mon[2].v <= 20, 'Monnaie Difficile : 3 ou 4, jusqu\'à 20 €');
  chk(r.badCount === 0, 'Monnaie : la bonne réponse est la somme dessinée (4 pièces comprises)');
  chk(r.order === 'undefined', 'plus de QCM_DISPLAY_ORDER');
  chk(r.dupEnigme === 0 && r.enigmes === 44 && /44 énigmes/.test(r.noteEnigme), 'énigmes : ' + r.enigmes + ' sans doublon de texte, note à jour');
  chk(/12\)/.test(r.noteNom) && /9 polyèdres/.test(r.noteCpt), 'notes de réglage Solides à jour');
  console.log(bad ? 'ÉCHEC niveaux : ' + bad : 'niveaux OK');
  if (bad) process.exitCode = 1;
});
