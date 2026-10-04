  /* ===================== THÈME CALCUL =====================
     Questions de Quizz de calcul : opérations, monnaie, maths de la vie.
  */

  // ===================== Monnaie =====================
  function drawMoneyItem(svg,cx,cy,value,isCoin){
    if(isCoin) svg.appendChild(el('circle',{cx:cx,cy:cy,r:26, fill:'var(--accent3)', stroke:'var(--text)','stroke-width':2.5}));
    else svg.appendChild(el('rect',{x:cx-34,y:cy-20,width:68,height:40,rx:4, fill:'var(--accent2)', stroke:'var(--text)','stroke-width':2.5}));
    svg.appendChild(svgText(cx,cy+6,16,value+'€'));
  }
  // Facile : 2 pièces/billets de 1, 2 ou 5 € ; Moyen : 2 ou 3, jusqu'à 10 € ; Difficile : 3 ou 4, jusqu'à 20 €.
  var MONNAIE_LEVELS = [
    { pool:[1,2,5],        min:2, max:2 },
    { pool:[1,2,5,10],     min:2, max:3 },
    { pool:[1,2,5,10,20],  min:3, max:4 }
  ];
  function genMonnaieQuestion(level){
    var pool=MONNAIE_LEVELS[level].pool;
    var count = randInt(MONNAIE_LEVELS[level].min, MONNAIE_LEVELS[level].max);
    var items=[], sum=0;
    for(var i=0;i<count;i++){ var v=pick(pool); items.push(v); sum+=v; }
    var positions=[[55,100],[100,65],[145,100],[100,140]];
    return {
      tag:'Monnaie',
      question:'Combien d\'argent y a-t-il en tout ?',
      sub:'Additionne la valeur de chaque pièce ou billet.',
      explain: items.join('€ + ') + '€ = ' + sum + '€.',
      draw:function(){
        var svg=document.getElementById('m4Svg'); svg.setAttribute('viewBox','0 0 200 200'); svg.innerHTML="";
        items.forEach(function(v,i){ drawMoneyItem(svg, positions[i][0], positions[i][1], v, v<5); });
      },
      cols3:false,
      choices: numChoiceSet(sum, [sum-5,sum-2,sum-1,sum+1,sum+2,sum+5].filter(function(v){return v>0;})).map(function(v){ return { label:String(v)+'€', ok:v===sum }; })
    };
  }

  // ===================== Maths de la vie courante =====================
  function genVieQuestion(){
    var templates = [
      function(){
        var a=randInt(1,10), b=randInt(1,10), sum=a+b, w=prenomAuHasard(), o=objetAuHasard('jeu'), c=deuxDifferents(COULEURS);
        var v = accords(w, o); v.a1 = nbObjetCouleur(a, o, c[0]); v.b1 = nbObjetCouleur(b, o, c[1]);
        return { icon:o.icon, question:phrase('{nom} a {a1} et {b1}. Combien de {obj} {at} en tout ?', v), explain: a + ' + ' + b + ' = ' + sum + ' ' + o.plur + '.', correct:sum, pool:[sum-2,sum-1,sum+1,sum+2,sum+3] };
      },
      function(){
        var a=randInt(2,15), b=randInt(1,a-1), diff=a-b;
        return { icon:'📏', question:'Un crayon mesure ' + a + ' cm. Un autre mesure ' + b + ' cm. Quelle est la différence de longueur ?', explain: a + ' - ' + b + ' = ' + diff + ' cm.', correct:diff, pool:[diff-2,diff-1,diff+1,diff+2,diff+3] };
      },
      function(){
        var p1=randInt(1,10), p2=randInt(1,10), sum=p1+p2, f=deuxDifferents(OBJETS.filter(function(o){ return o.groupe==='fruit'; }));
        return { icon:'💶', question:'Au marché, ' + unArticle(f[0]) + ' coûte ' + p1 + '€ et ' + unArticle(f[1]) + ' coûte ' + p2 + '€. Combien coûtent les deux fruits ensemble ?', explain: p1 + '€ + ' + p2 + '€ = ' + sum + '€.', correct:sum, pool:[sum-2,sum-1,sum+1,sum+2,sum+3] };
      },
      function(){
        var total=randInt(10,20), done=randInt(1,total-1), remain=total-done, w=prenomAuHasard();
        return { icon:'🚶', question:phrase('Sur le chemin de l\'école, il y a {total} arbres. {nom} en a déjà compté {done}. Combien lui en reste-t-il à compter ?', {nom:w.nom, total:total, done:done}), explain: total + ' - ' + done + ' = ' + remain + '.', correct:remain, pool:[remain-2,remain-1,remain+1,remain+2,remain+3] };
      },
      function(){
        var boxes=randInt(2,6), perBox=randInt(2,5), total2=boxes*perBox, o=objetAuHasard('gourmand');
        return { icon:o.icon, question:'Il y a ' + boxes + ' boîtes de ' + o.plur + '. Chaque boîte contient ' + perBox + ' ' + o.plur + '. Combien de ' + o.plur + ' y a-t-il en tout ?', explain: boxes + ' × ' + perBox + ' = ' + total2 + ' ' + o.plur + '.', correct:total2, pool:[total2-4,total2-2,total2+2,total2+4,total2+6] };
      },
      function(){
        var paid=randInt(10,20), cost=randInt(1,paid-1), change=paid-cost, w=prenomAuHasard(), x=articleAuHasard();
        return { icon:'💰', question:phrase('{nom} paie avec un billet de {paid}€ {x} qui coûte {cost}€. Combien de monnaie va-t-on lui rendre ?', {nom:w.nom, paid:paid, x:unArticle(x), cost:cost}), explain: paid + '€ - ' + cost + '€ = ' + change + '€.', correct:change, pool:[change-2,change-1,change+1,change+2,change+3] };
      }
    ];
    var t = pickFresh('vie', templates)();
    var pool = t.pool.filter(function(v){ return v>=0; });
    return {
      tag:'Maths de la vie',
      question: t.question,
      sub:'Lis bien l\'énoncé avant de calculer.',
      explain: t.explain,
      draw:function(){
        var svg=document.getElementById('m4Svg'); svg.setAttribute('viewBox','0 0 200 200'); svg.innerHTML="";
        svg.appendChild(svgText(100,120,54,t.icon));
      },
      cols3:false,
      choices: numChoiceSet(t.correct, pool).map(function(v){ return { label:String(v), ok:v===t.correct }; })
    };
  }

  // ===================== Arithmétique élargie =====================
  // -- Suites de nombres --
  var SUITE_NB_STEPS = [[1,2,5,10],[2,3,5,10],[3,4,6,7,9,11,20,25]];
  function genSuiteNombresQuestion(level){
    var step = pick(SUITE_NB_STEPS[level]);
    var desc = level>=1 && rnd()<0.4;
    var n = 5, first;
    if(desc) first = step*(n-1) + randInt(0, level===2 ? 30 : 10);
    else first = randInt(0, level===0 ? 10 : level===1 ? 20 : 40);
    var seq = [], i;
    for(i=0;i<n;i++) seq.push(desc ? first - i*step : first + i*step);
    var hole = level===0 ? n-1 : randInt(1, n-1);
    var answer = seq[hole];
    var shown = seq.map(function(v, k){ return k===hole ? '?' : String(v); });
    return {
      tag:'Suite de nombres',
      question:'Quel nombre manque dans cette suite ?',
      sub:'Cherche de combien on avance (ou on recule) à chaque fois.',
      explain:'On ' + (desc ? 'recule' : 'avance') + ' de ' + step + ' à chaque fois : ' + seq.join(', ') + '. Le nombre qui manque est ' + answer + '.',
      draw:function(){
        var svg=document.getElementById('m4Svg'); svg.setAttribute('viewBox','0 0 200 200'); svg.innerHTML="";
        var w=34, gap=5, x0=(200-(n*w+(n-1)*gap))/2;
        shown.forEach(function(txt, k){
          var x = x0 + k*(w+gap);
          svg.appendChild(el('rect',{x:x,y:88,width:w,height:34,rx:6,fill:'var(--surface)',stroke:'var(--accent)','stroke-width':2}));
          svg.appendChild(svgText(x+w/2,112,txt.length>2?16:19,txt));
        });
      },
      cols3:false,
      choices: numChoices(answer, [answer+step, answer-step, answer+2*step, answer-2*step])
    };
  }

  // ===================== Nombres : numération et ordre =====================
  // -- Numération : dizaines, unités, centaines ; composer un nombre --
  function genNumerationQuestion(level){
    var hi = level===0 ? 59 : level===1 ? 99 : 999;
    var n = level===2 ? randInt(101, hi) : randInt(11, hi);
    var c = Math.floor(n/100), d = Math.floor(n/10)%10, u = n%10;
    var kinds = level===0 ? ['chiffreD','chiffreU','compose'] : level===1 ? ['chiffreD','chiffreU','compose','nbDiz'] : ['chiffreC','chiffreD','chiffreU','compose','nbDiz'];
    var kind = pick(kinds);
    if(kind==='chiffreD') return bigNumQuestion('Nombres','Dans ' + n + ', quel est le chiffre des dizaines ?','Le chiffre des dizaines est l\'avant-dernier chiffre.',
      'Dans ' + n + ', le chiffre des dizaines est ' + d + ' (' + d + ' dizaine' + (d>1?'s':'') + ').', String(n), d, [c, u, d+1, d-1]);
    if(kind==='chiffreU') return bigNumQuestion('Nombres','Dans ' + n + ', quel est le chiffre des unités ?','Le chiffre des unités est le dernier chiffre.',
      'Dans ' + n + ', le chiffre des unités est ' + u + '.', String(n), u, [c, d, u+1, u-1]);
    if(kind==='chiffreC') return bigNumQuestion('Nombres','Dans ' + n + ', quel est le chiffre des centaines ?','Le chiffre des centaines est le premier chiffre.',
      'Dans ' + n + ', le chiffre des centaines est ' + c + '.', String(n), c, [d, u, c+1, c-1]);
    if(kind==='nbDiz'){
      var t = randInt(2, 9) * 10 + (level===2 ? randInt(0,9)*100 : 0);
      var nd = t/10;
      return bigNumQuestion('Nombres','Combien y a-t-il de dizaines dans ' + t + ' ?','Une dizaine = 10.',
        t + ' = ' + nd + ' × 10, donc il y a ' + nd + ' dizaines.', String(t), nd, [nd+1, nd-1, t, nd*10, nd+10]);
    }
    // composition : 30 + 4 = ?  /  300 + 40 + 7 = ?
    var txt = level===2 ? (c*100 + ' + ' + d*10 + ' + ' + u) : (d*10 + ' + ' + u);
    if(level===2 && d===0) txt = c*100 + ' + ' + u;
    return bigNumQuestion('Nombres','Quel nombre obtient-on ?','Additionne les centaines, dizaines et unités.',
      txt + ' = ' + n + '.', txt + ' = ?', n, [n+10, n-10, n+1, n-1, n+100, d*10+u]);
  }
  // -- Ordre : suivant, précédent, entre, plus grand, plus petit, pair --
  function genOrdreQuestion(level){
    var hi = level===0 ? 20 : level===1 ? 100 : 1000;
    var kinds = level===0 ? ['suivant','precedent','grand','petit'] : ['suivant','precedent','entre','grand','petit','pair'];
    var kind = pick(kinds);
    var n = randInt(3, hi-2);
    if(level>0 && rnd()<0.4) n = Math.round(n/10)*10 + pick([-1,0,9]);   // frontières de dizaines
    n = Math.max(3, Math.min(hi-2, n));
    if(kind==='suivant') return bigNumQuestion('Nombres','Quel nombre vient juste après ' + n + ' ?','Ajoute 1.',(n+1) + ' vient juste après ' + n + ' : ' + n + ' + 1 = ' + (n+1) + '.', n + ' → ?', n+1, [n+2, n-1, n+10, n]);
    if(kind==='precedent') return bigNumQuestion('Nombres','Quel nombre vient juste avant ' + n + ' ?','Retire 1.',(n-1) + ' vient juste avant ' + n + ' : ' + n + ' - 1 = ' + (n-1) + '.', '? → ' + n, n-1, [n-2, n+1, n-10, n]);
    if(kind==='entre') return bigNumQuestion('Nombres','Quel nombre est entre ' + (n-1) + ' et ' + (n+1) + ' ?','Cherche le nombre qui est juste au milieu.',(n-1) + ' < ' + n + ' < ' + (n+1) + '.', (n-1) + ' … ' + (n+1), n, [n-2, n+2, n+10, n-10]);
    if(kind==='pair'){
      var ev = 2*randInt(1, Math.floor(hi/2)-1);
      var opts = [], guard2 = 0;
      while(opts.length<3 && guard2++<200){
        var od = 2*randInt(0, Math.floor(hi/2)-1) + 1;
        if(opts.indexOf(od)===-1) opts.push(od);
      }
      return {
        tag:'Nombres', question:'Quel est le nombre pair ?', sub:'Un nombre pair se termine par 0, 2, 4, 6 ou 8.',
        explain: ev + ' est pair (il se termine par ' + (ev%10) + ') ; les autres sont impairs.',
        draw:function(){ drawEquation('pair ou impair ?'); }, cols3:false,
        choices: shuffle([ev].concat(opts)).map(function(v){ return { label:String(v), ok:v===ev }; })
      };
    }
    // plus grand / plus petit parmi 4 nombres
    var vals = [n], guard = 0;
    while(vals.length<4 && guard++<50){ var v = randInt(1, hi); if(vals.indexOf(v)===-1) vals.push(v); }
    var target = kind==='grand' ? Math.max.apply(null, vals) : Math.min.apply(null, vals);
    return {
      tag:'Nombres', question: kind==='grand' ? 'Quel est le plus grand de ces nombres ?' : 'Quel est le plus petit de ces nombres ?',
      sub:'Compare-les un par un.',
      explain: target + ' est le ' + (kind==='grand' ? 'plus grand' : 'plus petit') + ' : ' + vals.slice().sort(function(a,b){ return a-b; }).join(' < ') + '.',
      draw:function(){ drawEquation(kind==='grand' ? 'le plus grand ?' : 'le plus petit ?'); }, cols3:false,
      choices: shuffle(vals.slice()).map(function(v){ return { label:String(v), ok:v===target }; })
    };
  }

  // ---- Déclaration des types de Quizz du thème Calcul ----
  registerQuizType({ id:'monnaie', domain:'calcul', label:'Monnaie', longLabel:'Monnaie', defaultLevels:[0,1,2],
    randomNote:'Le nombre de pièces/billets et leurs valeurs sont tirés au hasard. Facile : 2 pièces ou billets de 1, 2 ou 5 € ; Moyen : 2 ou 3, jusqu\'à 10 € ; Difficile : 3 ou 4, jusqu\'à 20 €.',
    generate:genMonnaieQuestion });
  registerQuizType({ id:'vie', domain:'calcul', label:'Maths de la vie', longLabel:'Maths de la vie', defaultLevels:[1,2],
    randomNote:'Le modèle de problème est tiré au hasard parmi 6 scénarios fixes (sans répétition tant qu\'on ne les a pas tous vus), puis les nombres de l\'énoncé sont eux aussi tirés au hasard à l\'intérieur de chaque modèle.',
    generate:genVieQuestion });
  registerQuizType({ id:'suiteNombres', domain:'logique', label:'Suite de nombres', longLabel:'Suite de nombres', defaultLevels:[1,2],
    randomNote:'Une suite où l\'on avance (ou recule) du même nombre à chaque fois ; on trouve le nombre manquant. Facile : de 1, 2, 5 ou 10 en 10 ; Moyen : de 2, 3, 5, 10, parfois en descendant ; Difficile : de 3, 4, 6, 7, 9, 11, 20, 25.',
    generate:genSuiteNombresQuestion });
  registerQuizType({ id:'numeration', domain:'nombres', label:'Dizaines et unités', longLabel:'Dizaines et unités (numération)', defaultLevels:[0,1,2],
    randomNote:'Chiffre des dizaines/unités (centaines en Difficile), nombre de dizaines, ou composer un nombre (30 + 4). Facile : jusqu\'à 59 ; Moyen : jusqu\'à 99 ; Difficile : jusqu\'à 999.',
    generate:genNumerationQuestion });
  registerQuizType({ id:'ordre', domain:'nombres', label:'Ordre des nombres', longLabel:'Ordre des nombres (avant, après, plus grand, pair)', defaultLevels:[0,1,2],
    randomNote:'Nombre juste avant/après, nombre entre deux autres, plus grand / plus petit parmi 4, nombre pair (dès Moyen). Facile : jusqu\'à 20 ; Moyen : jusqu\'à 100 ; Difficile : jusqu\'à 1000, souvent autour des changements de dizaine.',
    generate:genOrdreQuestion });
