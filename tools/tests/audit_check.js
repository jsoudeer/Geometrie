// Audit mesuré des types de Quizz : pour chaque type et niveau, N questions tirées puis contrôlées.
//  - structure : 4 réponses (ou moins), exactement 1 bonne, libellés distincts, pas de NaN/undefined/valeur négative ;
//  - amplitude : plus petit / plus grand entier vu dans l'énoncé et dans la bonne réponse ;
//  - variété : nombre de questions distinctes (dText = énoncé + réponses écrites ; distinct = avec le dessin, gonflé par les rotations aléatoires), position de la bonne réponse (biais) ;
//  - oracles : l'énoncé est recalculé indépendamment pour les types de calcul (la bonne réponse doit coïncider) ;
//  - noms propres : prénoms cités dans les énoncés.
// Échoue (« ÉCHEC ») si une anomalie de structure, un oracle faux ou un défaut déjà corrigé (voir plus bas) réapparaît.
// Usage : node audit_check.js [N]   (écrit /tmp/geo_tests/audit_quiz.json, tableau complet dans AUDIT_ACTIVITES.md §3)
const { withPage } = require('./lib');
const N = +(process.argv[2] || 400);
withPage({ page: "index_test.html", viewport: { width: 390, height: 900 } }, async (page) => {
  const out = await page.evaluate((N) => window.__t.__eval(`(function(N){
    var NAMES=['Léa','Tom','Léo','Nina','Maya','Lou','Emma','Hugo','Jules','Zoé','Sacha','Inès'];
    function ints(s){ var m=(s||'').match(/\\d+/g)||[]; return m.map(Number); }
    function okLabel(q){ var g=q.choices.filter(function(c){return c.ok;}); return g.length===1?g[0].label:null; }
    function num(l){ var m=String(l).match(/^-?\\d+$/); return m?+l:null; }
    // oracles : renvoie null (pas d'oracle), ou la bonne réponse attendue (nombre ou chaîne)
    function oracle(t, q){
      var s=q.question, m;
      if(m=s.match(/^Combien font (\\d+) \\+ (\\d+) \\?$/)) return +m[1]+ +m[2];
      if(m=s.match(/^Combien font (\\d+) - (\\d+) \\?$/)) return +m[1]- +m[2];
      if(m=s.match(/^Combien font (\\d+) × (\\d+) \\?$/)) return +m[1]* +m[2];
      if(m=s.match(/^Calcule (\\d+) \\+ (\\d+)\\.$/)) return +m[1]+ +m[2];
      if(m=s.match(/^Calcule (\\d+) - (\\d+)\\.$/)) return +m[1]- +m[2];
      if(m=s.match(/^Trouve x : (\\d+) \\+ x = (\\d+)$/)) return +m[2]- +m[1];
      if(m=s.match(/^(\\d+) \\+ \\? = (\\d+)$/)) return +m[2]- +m[1];
      if(m=s.match(/^(\\d+) × \\? = (\\d+)$/)) return +m[2]/ +m[1];
      if(m=s.match(/^Quel est le double de (\\d+) \\?$/)) return 2*m[1];
      if(m=s.match(/^Quelle est la moitié de (\\d+) \\?$/)) return m[1]/2;
      if(m=s.match(/^Quel nombre vient juste après (\\d+) \\?$/)) return +m[1]+1;
      if(m=s.match(/^Quel nombre vient juste avant (\\d+) \\?$/)) return m[1]-1;
      if(m=s.match(/^Quel est le résultat de (\\d+) ([+-]) (\\d+) \\?$/)) return m[2]==='+'? +m[1]+ +m[3] : m[1]-m[3];
      if(m=s.match(/^Quel signe faut-il mettre : (.+) … (.+) \\?$/)){ var L=eval(m[1]), R=eval(m[2]); return L<R?'<':L>R?'>':'='; }
      if(m=s.match(/^Combien font (\\d+) fois (\\d+) \\?$/)) return m[1]*m[2];
      if(m=s.match(/^Convertis : (\\d+) m = \\? cm$/)) return m[1]*100;
      if(m=s.match(/^Convertis : (\\d+) km = \\? m$/)) return m[1]*1000;
      if(m=s.match(/^Dans (\\d+), quel est le chiffre des (dizaines|unités|centaines) \\?$/)){ var d=String(m[1]); return m[2]==='unités'? +d.slice(-1) : m[2]==='dizaines'? +d.slice(-2,-1) : +d.slice(-3,-2); }
      if(m=s.match(/^Combien y a-t-il de dizaines dans (\\d+) \\?$/)) return m[1]/10;
      return null;
    }
    var res=[];
    QCM_TYPE_DEFS.forEach(function(t){
      var row={id:t.id, label:t.label, domain:quizDomainId(t), dl:t.defaultLevels, levels:[]};
      for(var lv=0;lv<3;lv++){
        var st={lv:lv, n:0, err:0, errMsg:'', distinct:{}, dText:{}, nch:{}, noOk:0, multiOk:0, dupLab:0, bad:0, negLab:0,
                qMin:1e9, qMax:-1, aMin:1e9, aMax:-1, pos:[0,0,0,0], oracleN:0, oracleKO:0, oracleEx:'', names:{}, badEx:'', tags:{}};
        for(var i=0;i<N;i++){
          var q; try{ q=t.generate(lv); }catch(e){ st.err++; st.errMsg=String(e&&e.message||e).slice(0,80); continue; }
          st.n++;
          var txt=q.question+' '+q.sub+' '+q.explain+' '+q.choices.map(function(c){return c.label;}).join(' ');
          if(/NaN|undefined|Infinity|null/.test(txt)){ st.bad++; st.badEx=txt.slice(0,120); }
          st.tags[q.tag]=1;
          var vis=''; try{ q.draw(); vis=document.getElementById('m4Svg').innerHTML.replace(/var\\(--[a-z0-9]+\\)/g,''); }catch(e){} q.choices.forEach(function(c){ if(c.draw){ try{ var sv=document.createElementNS('http://www.w3.org/2000/svg','svg'); c.draw(sv); vis+=sv.innerHTML; }catch(e){} } });
          st.dText[q.question+'|'+q.explain+'|'+q.choices.filter(function(c){return !c.draw;}).map(function(c){return c.label;}).sort().join('/')]=1;
          st.distinct[q.question+'|'+q.explain+'|'+vis+'|'+q.choices.map(function(c){return c.label;}).sort().join('/')]=1;
          st.nch[q.choices.length]=(st.nch[q.choices.length]||0)+1;
          var ok=q.choices.filter(function(c){return c.ok;}).length; if(ok===0) st.noOk++; if(ok>1) st.multiOk++;
          var labs=q.choices.map(function(c){return c.label;}); if(new Set(labs).size<labs.length) st.dupLab++;
          if(q.choices.some(function(c){ var v=num(c.label); return v!==null && v<0; })) st.negLab++;
          ints(q.question).forEach(function(v){ if(v<st.qMin)st.qMin=v; if(v>st.qMax)st.qMax=v; });
          var ol=okLabel(q); var on=ol===null?null:num(ol);
          if(on!==null){ if(on<st.aMin)st.aMin=on; if(on>st.aMax)st.aMax=on; }
          var idx=q.choices.findIndex(function(c){return c.ok;}); if(idx>=0&&idx<4) st.pos[idx]++;
          NAMES.forEach(function(nm){ if(q.question.indexOf(nm)>=0) st.names[nm]=(st.names[nm]||0)+1; });
          var o=oracle(t,q);
          if(o!==null && ol!==null){ st.oracleN++; var got=num(ol)!==null?num(ol):ol; if(got!==o){ st.oracleKO++; if(!st.oracleEx) st.oracleEx=q.question+' -> '+ol+' (attendu '+o+')'; } }
        }
        st.distinct=Object.keys(st.distinct).length; st.dText=Object.keys(st.dText).length; st.tags=Object.keys(st.tags);
        row.levels.push(st);
      }
      res.push(row);
    });
    return JSON.stringify(res);
  })(${N})`), N);
  const data = JSON.parse(out);
  require('fs').writeFileSync('/tmp/geo_tests/audit_quiz.json', JSON.stringify(data, null, 1));
  // Types dont le nombre de réponses est volontairement inférieur à 4 (oui/non, 3 signes, 3 trajets…).
  const FEW_OK = ['align', 'milieu', 'angle', 'decodage', 'symVrai', 'compare'];
  let bad = 0;
  const fail = (m) => { bad++; console.log('ÉCHEC', m); };
  data.forEach(r => r.levels.forEach(s => {
    const w = r.id + ' niv' + s.lv;
    if (s.err) fail(w + ' exception ×' + s.err + ' ' + s.errMsg);
    if (s.noOk) fail(w + ' sans bonne réponse ×' + s.noOk);
    if (s.multiOk) fail(w + ' plusieurs bonnes réponses ×' + s.multiOk);
    if (s.dupLab) fail(w + ' libellés dupliqués ×' + s.dupLab);
    if (s.bad) fail(w + ' NaN/undefined ×' + s.bad + ' « ' + s.badEx + ' »');
    if (s.negLab) fail(w + ' réponse négative ×' + s.negLab);
    if (s.oracleKO) fail(w + ' ORACLE ×' + s.oracleKO + ' « ' + s.oracleEx + ' »');
    if (!FEW_OK.includes(r.id) && Object.keys(s.nch).some(k => +k < 4)) fail(w + ' moins de 4 réponses ' + JSON.stringify(s.nch));
  }));
  const oracles = data.reduce((a, r) => a + r.levels.reduce((b, s) => b + s.oracleN, 0), 0);
  if (oracles < 2000) fail('trop peu de questions recalculées par oracle : ' + oracles);
  console.log('types:', data.length, '· questions recalculées indépendamment:', oracles);

  // Défauts déjà corrigés : ils ne doivent pas revenir.
  const reg = JSON.parse(await page.evaluate(() => window.__t.__eval(`(function(){
    var o={dixcent:0, tie:0, milieu0:{}, enigmeAmbigue:[]};
    var L=quizTypeById('lettres'), E=quizTypeById('encadrer'), M=quizTypeById('milieu');
    for(var i=0;i<1500;i++){
      L.generate(2).choices.forEach(function(c){ if(/(^| )dix cents?( |$)/.test(c.label)) o.dixcent++; });
      [1,2].forEach(function(lv){ var q=E.generate(lv), m=q.question.match(/^Arrondis (\\d+) à la dizaine/); if(m && +m[1]%10===5) o.tie++; });
      var q4=M.generate(0), k=q4.choices.findIndex(function(c){return c.ok;}); o.milieu0[k]=1;
    }
    // énigmes : la bonne réponse ne doit pas figurer deux fois dans les propositions d'une même énigme, et
    // une énigme « tout rond / sans côté » ne doit pas proposer à la fois cercle et boule.
    ENIGME_POOL.forEach(function(e){ if(/ni côté ni sommet|pas de côtés, pas de sommets/.test(e.text) && e.pool.indexOf('boule')>=0 && e.pool.indexOf('cercle')>=0) o.enigmeAmbigue.push(e.text); });
    return JSON.stringify(o); })()`)));
  if (reg.dixcent) fail('« dix cent » dans un distracteur de lettres ×' + reg.dixcent);
  if (reg.tie) fail('arrondi à la dizaine d\'un nombre en 5 ×' + reg.tie);
  if (Object.keys(reg.milieu0).length < 3) fail('Milieu Facile : la bonne réponse est toujours à la même place ' + JSON.stringify(reg.milieu0));
  if (reg.enigmeAmbigue.length) fail('énigme à double réponse : ' + reg.enigmeAmbigue[0]);
  console.log(bad ? 'ÉCHEC audit : ' + bad + ' problème(s)' : 'audit OK');
  if (bad) process.exitCode = 1;
});
