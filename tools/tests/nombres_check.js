// Fiches « nombres » (fiches-nombres.js) : numération, ordre, ± 10 / 100, encadrer, nombres en lettres, suites, monnaie.
// Chaque réponse est RECALCULÉE depuis l'énoncé (ou le dessin) ; les plages et les sortes de questions de chaque niveau sont mesurées.
const { withPage } = require('./lib');
withPage({ page: 'index_test.html', viewport: { width: 390, height: 900 } }, async (page) => {
  let bad = 0; const chk = (ok, msg) => { console.log(ok ? '  ok' : '  ✘ ÉCHEC', msg); if (!ok) bad++; };
  const J = async c => JSON.parse(await page.evaluate(x => window.__t.__eval(x), c));
  const o = await J(String.raw`(function(){
    function def(id){ return QCM_TYPE_DEFS.filter(function(d){return d.id===id;})[0]; }
    function okOf(q){ return q.choices.filter(function(c){return c.ok;}); }
    function uniq(q){ return new Set(q.choices.map(function(c){return c.label;})).size === q.choices.length && q.choices.length >= 2 && okOf(q).length === 1; }
    var svg = document.getElementById('m4Svg'), R = { reg:['numeration','ordre','plusMoins','encadrer','lettres','suiteNombres','monnaie'].every(function(i){ return !!TEMPLATE_FICHES[i]; }) };
    function drawn(q){ q.draw(); return svg.textContent; }
    // --- numération ---
    var N = { bad:0, kinds:[{},{},{}], max:[0,0,0], dist:0 };
    for(var lv=0; lv<3; lv++) for(var i=0;i<500;i++){
      var q = def('numeration').generate(lv), want = null, kind, m, n;
      if((m = /Dans (\d+), quel est le chiffre des (\S+)/.exec(q.question))){ n = +m[1]; kind = m[2]; want = kind==='dizaines' ? Math.floor(n/10)%10 : kind==='unités' ? n%10 : Math.floor(n/100); }
      else if((m = /Combien y a-t-il de dizaines dans (\d+)/.exec(q.question))){ n = +m[1]; kind = 'nbDiz'; want = n/10; }
      else { var t = drawn(q), parts = t.replace(' = ?','').split(' + ').map(Number); kind = 'compose'; want = parts.reduce(function(a,b){return a+b;},0); n = want; }
      N.kinds[lv][kind] = 1; N.max[lv] = Math.max(N.max[lv], n);
      if(okOf(q).length !== 1 || +okOf(q)[0].label !== want) N.bad++; if(!uniq(q)) N.dist++;
    }
    N.kinds = N.kinds.map(function(k){ return Object.keys(k).sort().join(); }); R.num = N;
    // --- ordre ---
    var O = { bad:0, kinds:[{},{},{}], max:[0,0,0], dist:0, frontier:0 };
    for(lv=0; lv<3; lv++) for(i=0;i<500;i++){
      q = def('ordre').generate(lv); var e = q.question, w2 = null, k2;
      if((m = /juste après (\d+)/.exec(e))){ w2 = +m[1]+1; k2 = 'suivant'; n = +m[1]; }
      else if((m = /juste avant (\d+)/.exec(e))){ w2 = +m[1]-1; k2 = 'precedent'; n = +m[1]; }
      else if((m = /entre (\d+) et (\d+)/.exec(e))){ w2 = +m[1]+1; k2 = 'entre'; n = +m[2]; }
      else if(/pair/.test(e)){ k2 = 'pair'; var nums = q.choices.map(function(c){return +c.label;}); w2 = nums.filter(function(v){return v%2===0;})[0]; n = w2; if(nums.filter(function(v){return v%2===0;}).length !== 1) O.bad++; }
      else { var vs = q.choices.map(function(c){return +c.label;}); k2 = /plus grand/.test(e) ? 'grand' : 'petit'; w2 = k2==='grand' ? Math.max.apply(null,vs) : Math.min.apply(null,vs); n = w2; }
      O.kinds[lv][k2] = 1; O.max[lv] = Math.max(O.max[lv], n);
      if(okOf(q).length !== 1 || +okOf(q)[0].label !== w2) O.bad++; if(!uniq(q)) O.dist++;
      if(lv>0 && (k2==='suivant'||k2==='precedent') && (n%10===9 || n%10===0 || n%10===1)) O.frontier++;
    }
    O.kinds = O.kinds.map(function(k){ return Object.keys(k).sort().join(); }); R.ord = O;
    // --- ± 10 / 100 ---
    var P = { bad:0, steps:[{},{},{}], neg:0, dist:0, lv1:{10:0,100:0}, sign:{} };
    for(lv=0; lv<3; lv++) for(i=0;i<600;i++){
      q = def('plusMoins').generate(lv); m = /de (\d+) ([+-]) (\d+) \?/.exec(q.question);
      var a = +m[1], b = +m[3], res = m[2]==='+' ? a+b : a-b;
      P.steps[lv][b] = 1; P.sign[m[2]] = 1; if(lv===1) P.lv1[b]++;
      if(res<0 || res>1000) P.neg++; if(okOf(q).length !== 1 || +okOf(q)[0].label !== res) P.bad++; if(!uniq(q)) P.dist++;
      if(lv===0 && (a<1 || a>99)) P.bad++;
    }
    P.steps = P.steps.map(function(k){ return Object.keys(k).map(Number).sort(function(x,y){return x-y;}).join(); }); R.pm = P;
    // --- encadrer ---
    var E = { bad:0, kinds:[{},{},{}], five:0, dist:0, max:[0,0,0] };
    for(lv=0; lv<3; lv++) for(i=0;i<600;i++){
      q = def('encadrer').generate(lv);
      if((m = /Arrondis (\d+) à la (centaine|dizaine)/.exec(q.question))){
        n = +m[1]; var base = m[2]==='centaine' ? 100 : 10, lo = Math.floor(n/base)*base, near = (n-lo) < (lo+base-n) ? lo : lo+base;
        E.kinds[lv][m[2]] = 1; if(+okOf(q)[0].label !== near) E.bad++;
      } else {
        m = /Entre quelles (centaines|dizaines) se trouve (\d+)/.exec(q.question); n = +m[2]; base = m[1]==='centaines' ? 100 : 10; lo = Math.floor(n/base)*base;
        E.kinds[lv]['entre-' + m[1]] = 1; if(okOf(q)[0].label !== 'entre ' + lo + ' et ' + (lo+base)) E.bad++;
        if(q.choices.some(function(c){ return /-/.test(c.label); })) E.bad++;
      }
      if(n%10===5 || n%(lv===2?100:10)===0) E.five++; E.max[lv] = Math.max(E.max[lv], n); if(!uniq(q)) E.dist++;
    }
    E.kinds = E.kinds.map(function(k){ return Object.keys(k).sort().join(); }); R.enc = E;
    // --- nombres en lettres ---
    var L = { bad:0, kinds:[{},{},{}], range:[[1e9,0],[1e9,0],[1e9,0]], dist:0 };
    for(lv=0; lv<3; lv++) for(i=0;i<500;i++){
      q = def('lettres').generate(lv);
      if(/écrit en chiffres/.test(q.question)){
        m = /^(.+) s'écrit (\d+)\.$/.exec(q.explain); n = +m[2]; L.kinds[lv].mots = 1;
        if(m[1] !== nombreEnLettres(n) || +okOf(q)[0].label !== n) L.bad++;
        var shown = drawn(q).replace(/\s+/g,''); if(shown !== nombreEnLettres(n).replace(/\s+/g,'')) L.bad++;
      } else {
        m = /^(\d+) s'écrit « (.+) ».$/.exec(q.explain); n = +m[1]; L.kinds[lv].chiffres = 1;
        if(okOf(q)[0].label !== nombreEnLettres(n) || m[2] !== nombreEnLettres(n) || drawn(q) !== String(n)) L.bad++;
      }
      L.range[lv] = [Math.min(L.range[lv][0], n), Math.max(L.range[lv][1], n)]; if(lv===2 && n%100===0) L.bad++; if(!uniq(q)) L.dist++;
    }
    L.kinds = L.kinds.map(function(k){ return Object.keys(k).sort().join(); }); R.let = L;
    // --- suites ---
    var S = { bad:0, steps:[{},{},{}], desc:[0,0,0], holes:[{},{},{}], dist:0 };
    for(lv=0; lv<3; lv++) for(i=0;i<500;i++){
      q = def('suiteNombres').generate(lv); m = /On (recule|avance) de (\d+) à chaque fois : ([\d, ]+)\. Le nombre qui manque est (\d+)\./.exec(q.explain);
      var seq = m[3].split(', ').map(Number), st = +m[2], dsc = m[1]==='recule';
      S.steps[lv][st] = 1; if(dsc) S.desc[lv]++;
      var okSeq = seq.length === 5 && seq.every(function(v,k){ return k===0 || v - seq[k-1] === (dsc ? -st : st); }) && seq.every(function(v){ return v >= 0; });
      var txt = svg.innerHTML; q.draw(); var cells = Array.prototype.map.call(svg.querySelectorAll('text'), function(t){ return t.textContent; });
      var hole = cells.indexOf('?'); S.holes[lv][hole] = 1;
      if(!okSeq || cells.length !== 5 || hole < 0 || seq[hole] !== +m[4] || +okOf(q)[0].label !== +m[4]) S.bad++;
      if(cells.some(function(c, k){ return k !== hole && +c !== seq[k]; })) S.bad++; if(!uniq(q)) S.dist++;
    }
    S.steps = S.steps.map(function(k){ return Object.keys(k).map(Number).sort(function(x,y){return x-y;}).join(); }); S.holes = S.holes.map(function(k){ return Object.keys(k).join(); }); R.suite = S;
    // --- monnaie ---
    var M = { bad:0, count:[{},{},{}], values:[{},{},{}], dist:0, drawn:0 };
    for(lv=0; lv<3; lv++) for(i=0;i<500;i++){
      q = def('monnaie').generate(lv); m = /^([\d€ +]+)€ = (\d+)€\.$/.exec(q.explain) || /^(.+) = (\d+)€\.$/.exec(q.explain);
      var items = q.explain.split(' = ')[0].replace(/€/g,'').split(' + ').map(Number), sum = items.reduce(function(a,b){return a+b;},0);
      M.count[lv][items.length] = 1; items.forEach(function(v){ M.values[lv][v] = 1; });
      if(okOf(q)[0].label !== sum + '€') M.bad++;
      q.draw(); var labs = Array.prototype.map.call(svg.querySelectorAll('text'), function(t){ return t.textContent; });
      if(labs.length !== items.length || labs.slice().sort().join() !== items.map(function(v){return v+'€';}).sort().join()) M.drawn++;
      if(!uniq(q) || q.choices.some(function(c){ return !/^\d+€$/.test(c.label); })) M.dist++;
    }
    M.count = M.count.map(function(k){ return Object.keys(k).join(); }); M.values = M.values.map(function(k){ return Object.keys(k).map(Number).sort(function(x,y){return x-y;}).join(); }); R.mon = M;
    return JSON.stringify(R); })()`);
  chk(o.reg, 'les 7 activités sont des fiches');
  chk(o.num.bad === 0 && o.num.dist === 0, 'numération : réponses recalculées, propositions distinctes');
  chk(o.num.kinds.join('|') === 'compose,dizaines,unités|compose,dizaines,nbDiz,unités|centaines,compose,dizaines,nbDiz,unités' && o.num.max[0] <= 59 && o.num.max[1] <= 99 && o.num.max[2] <= 999 && o.num.max[2] > 900, 'numération : sortes de questions et plages par niveau (' + o.num.kinds.join(' | ') + ' ; max ' + o.num.max + ')');
  chk(o.ord.bad === 0 && o.ord.dist === 0, 'ordre : suivant / précédent / entre / pair / plus grand / plus petit recalculés');
  chk(o.ord.kinds.join('|') === 'grand,petit,precedent,suivant|entre,grand,pair,petit,precedent,suivant|entre,grand,pair,petit,precedent,suivant' && o.ord.max[0] <= 20 && o.ord.max[1] <= 100 && o.ord.max[2] <= 1000 && o.ord.frontier > 100, 'ordre : sortes par niveau, plages, frontières de dizaines (' + o.ord.max + ' ; frontières ' + o.ord.frontier + ')');
  chk(o.pm.bad === 0 && o.pm.neg === 0 && o.pm.dist === 0 && o.pm.sign['+'] && o.pm.sign['-'], '± 10 / 100 : résultat juste, jamais négatif ni > 1000, les deux signes');
  chk(o.pm.steps.join('|') === '10|10,100|1,10,20,30,100,200' && o.pm.lv1[10] > 300 && o.pm.lv1[10] < 460, '± 10 / 100 : pas autorisés par niveau (' + o.pm.steps.join(' | ') + ') ; Moyen ≈ 2/3 de ±10 (' + o.pm.lv1[10] + '/600)');
  chk(o.enc.bad === 0 && o.enc.five === 0 && o.enc.dist === 0, 'encadrer : réponses justes, jamais de 5 en dernier chiffre ni de multiple de la base, aucune proposition négative');
  chk(o.enc.kinds.join('|') === 'entre-dizaines|dizaine,entre-dizaines|centaine,dizaine,entre-centaines' && o.enc.max[0] <= 99, 'encadrer : sortes par niveau (' + o.enc.kinds.join(' | ') + ')');
  chk(o.let.bad === 0 && o.let.dist === 0 && o.let.kinds.every(k => k === 'chiffres,mots'), 'nombres en lettres : les deux sens, mots affichés = mots calculés');
  chk(o.let.range[0][0] >= 10 && o.let.range[0][1] <= 69 && o.let.range[1][0] >= 70 && o.let.range[1][1] <= 99 && o.let.range[2][0] >= 101 && o.let.range[2][1] <= 999, 'nombres en lettres : plages 10-69 / 70-99 / 101-999 (' + o.let.range.join(' | ') + ')');
  chk(o.suite.bad === 0 && o.suite.dist === 0, 'suites : progression régulière, trou dessiné à la bonne place, réponse juste');
  chk(o.suite.steps.join('|') === '1,2,5,10|2,3,5,10|3,4,6,7,9,11,20,25' && o.suite.desc[0] === 0 && o.suite.desc[1] > 120 && o.suite.desc[1] < 280 && o.suite.holes[0] === '4' && o.suite.holes[1] !== '4', 'suites : pas par niveau, descente ≈ 40 % dès Moyen (' + o.suite.desc + '), trou en dernier en Facile seulement');
  chk(o.mon.bad === 0 && o.mon.drawn === 0 && o.mon.dist === 0, 'monnaie : somme juste, pièces et billets dessinés = énoncé, réponses « n€ »');
  chk(o.mon.count.join('|') === '2|2,3|3,4' && o.mon.values.join('|') === '1,2,5|1,2,5,10|1,2,5,10,20', 'monnaie : nombre et valeurs par niveau (' + o.mon.count.join(' | ') + ' ; ' + o.mon.values.join(' | ') + ')');
  console.log(bad ? 'ÉCHEC nombres : ' + bad : 'nombres OK');
  if (bad) process.exitCode = 1;
});
