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

  // ---- Paramètres par niveau (0 = Facile, 1 = Moyen, 2 = Difficile) ----
  // modes : 'add' = a + b ; 'missing' = a + x = c (trouve x). max = plus grand total.
  var CALC_LEVELS = [
    { modes:['add'], max:10 },
    { modes:['add'], max:20 },
    { modes:['add','missing'], max:20 }
  ];

  function genCalcQuestion(level){
    var mode = pick(CALC_LEVELS[level].modes || ['add']);
    var maxV = CALC_LEVELS[level].max || 10;
    if(mode==='missing'){
      // a + x = c : l'enfant retrouve x
      var a = randInt(0, maxV);
      var x = randInt(0, maxV - a);
      var c = a + x;
      return {
        tag: 'Calcul',
        question: 'Trouve x : ' + a + ' + x = ' + c,
        sub: 'Cherche le nombre qui manque pour que l\'égalité soit vraie.',
        explain: 'x = ' + c + ' - ' + a + ' = ' + x + ', car ' + a + ' + ' + x + ' = ' + c + '.',
        draw: function(){ drawEquation(a + ' + x = ' + c); },
        cols3: false,
        choices: numChoiceSet(x, [0,1,2,3,4,5,6,7,8,9,10,x+1,x+2,Math.max(0,x-1),Math.max(0,x-2)]).map(function(v){ return { label:String(v), ok: v===x }; })
      };
    }
    // addition simple : a + b
    var a2 = randInt(0, maxV);
    var b2 = randInt(0, maxV - a2);
    var sum = a2 + b2;
    return {
      tag: 'Calcul',
      question: 'Combien font ' + a2 + ' + ' + b2 + ' ?',
      sub: 'Calcule le résultat de cette addition.',
      explain: a2 + ' + ' + b2 + ' = ' + sum + '.',
      draw: function(){ drawEquation(a2 + ' + ' + b2 + ' = ?'); },
      cols3: false,
      choices: numChoiceSet(sum, [sum-2,sum-1,sum+1,sum+2,sum+3,Math.max(0,sum-3)].filter(function(v){return v>=0;})).map(function(v){ return { label:String(v), ok: v===sum }; })
    };
  }

  // ===================== Arithmétique élargie =====================
  // Petit utilitaire : 4 boutons numériques, la bonne réponse + 3 valeurs voisines.
  function numChoices(correct, extra, suffix){
    var pool = [correct-1, correct+1, correct-2, correct+2, correct+3, correct-3].concat(extra || []);
    pool = pool.filter(function(v){ return v>=0 && v!==correct; });
    return numChoiceSet(correct, pool).map(function(v){ return { label:String(v) + (suffix||''), ok:v===correct }; });
  }
  function eqQuestion(tag, question, sub, explain, eq, correct, extra){
    return {
      tag:tag, question:question, sub:sub, explain:explain,
      draw:function(){ drawEquation(eq); },
      cols3:false,
      choices: numChoices(correct, extra)
    };
  }

  // -- Soustraction --
  function genSoustractionQuestion(level){
    var a, b;
    if(level===0){ a = randInt(2,10); b = randInt(1,a-1); }
    else if(level===1){ a = randInt(8,20); b = randInt(1,a-1); }
    else { a = randInt(21,60); b = randInt(6,a-1); }
    var d = a - b;
    return eqQuestion('Calcul', 'Combien font ' + a + ' - ' + b + ' ?', 'Calcule le résultat de cette soustraction.',
      a + ' - ' + b + ' = ' + d + '. (Vérification : ' + d + ' + ' + b + ' = ' + a + '.)', a + ' - ' + b + ' = ?', d, [a+b, d+10, d-10]);
  }

  // -- Doubles et moitiés --
  function genDoubleMoitieQuestion(level){
    var hi = level===0 ? 10 : level===1 ? 20 : 50;
    var isDouble = Math.random() < 0.5;
    if(isDouble){
      var n = randInt(1, hi), r = n*2;
      return eqQuestion('Calcul', 'Quel est le double de ' + n + ' ?', 'Le double, c\'est le nombre plus lui-même.',
        'Le double de ' + n + ' : ' + n + ' + ' + n + ' = ' + r + '.', 'double de ' + n + ' = ?', r, [n, r+10, r-10, n*3]);
    }
    var h = randInt(1, hi), m = h*2;
    return eqQuestion('Calcul', 'Quelle est la moitié de ' + m + ' ?', 'La moitié, c\'est partager en deux parts égales.',
      'La moitié de ' + m + ' : ' + h + ' + ' + h + ' = ' + m + ', donc la moitié est ' + h + '.', 'moitié de ' + m + ' = ?', h, [m, h+10, h-10, m-1]);
  }

  // -- Compléments (à 10, à 20, à 100) --
  function genComplementQuestion(level){
    var target = level===0 ? 10 : level===1 ? 20 : 100;
    var a = level<2 ? randInt(1, target-1) : randInt(1,19)*5;
    var x = target - a;
    return eqQuestion('Calcul', a + ' + ? = ' + target, 'Cherche le nombre à ajouter pour arriver à ' + target + '.',
      target + ' - ' + a + ' = ' + x + ', car ' + a + ' + ' + x + ' = ' + target + '.', a + ' + ? = ' + target, x,
      level===2 ? [x+5, x-5, x+10, x-10] : [x+1, x-1]);
  }

  // -- Tables de multiplication (2, 5, 10 ; puis 3 et 4 en Difficile) --
  function genTableQuestion(level){
    var tables = level===0 ? [2,10] : level===1 ? [2,5,10] : [2,3,4,5,10];
    var t = pick(tables), n = randInt(1,10), r = t*n;
    var hint = t===10 ? 'Multiplier par 10 : on ajoute un zéro.' : t===5 ? 'On compte de 5 en 5 : 5, 10, 15, 20…' : t===2 ? 'Multiplier par 2, c\'est le double.' : 'On compte de ' + t + ' en ' + t + '.';
    if(level===2 && Math.random()<0.4){
      return eqQuestion('Calcul', t + ' × ? = ' + r, 'Cherche par combien il faut multiplier ' + t + '.',
        t + ' × ' + n + ' = ' + r + '. ' + hint, t + ' × ? = ' + r, n, [n+t, n-t, n*2]);
    }
    return eqQuestion('Calcul', 'Combien font ' + t + ' × ' + n + ' ?', 'Utilise la table de ' + t + '.',
      t + ' × ' + n + ' = ' + r + '. ' + hint, t + ' × ' + n + ' = ?', r, [r+t, r-t, r+10, r-10]);
  }

  // -- Comparer (<, >, =) --
  function genCompareQuestion(level){
    var lo = level===0 ? 0 : 5, hi = level===0 ? 20 : level===1 ? 30 : 99;
    var expr = level>=1 && Math.random()<0.6;
    var left, right, lv, rv;
    if(expr){
      var a=randInt(1,15), b=randInt(1,15), c, d;
      lv = a+b;
      // une fois sur trois, les deux côtés sont égaux (ex. 8 + 5 et 9 + 4)
      if(Math.random()<0.34){ var tries=0; do { c=randInt(Math.max(1,lv-15), Math.min(15,lv-1)); d=lv-c; tries++; } while((c===a || c===b) && tries<10); }
      else { c=randInt(1,15); d=randInt(1,15); }
      rv = c+d; left = a+' + '+b; right = c+' + '+d;
    } else {
      lv = randInt(lo,hi); rv = Math.random()<0.2 ? lv : randInt(lo,hi);
      left = String(lv); right = String(rv);
    }
    var sign = lv<rv ? '<' : lv>rv ? '>' : '=';
    var explain = expr ? (left+' = '+lv+' et '+right+' = '+rv+'. ') : '';
    explain += lv===rv ? lv + ' est égal à ' + rv + ' : ' + sign + '.' : (lv>rv ? lv+' est plus grand que '+rv : lv+' est plus petit que '+rv) + ' : ' + lv + ' ' + sign + ' ' + rv + '.';
    return {
      tag:'Calcul', question:'Quel signe faut-il mettre : ' + left + ' … ' + right + ' ?',
      sub:'< veut dire « plus petit que », > « plus grand que », = « égal à ».',
      explain: explain,
      draw:function(){
        var svg=document.getElementById('m4Svg'); svg.setAttribute('viewBox','0 0 200 200'); svg.innerHTML="";
        var txt = left + '  ?  ' + right;
        svg.appendChild(svgText(100,112, txt.length>12 ? 22 : 34, txt));
      },
      cols3:true,
      choices:['<','=','>'].map(function(l){ return { label:l, ok:l===sign }; })
    };
  }

  // -- Suites de nombres --
  var SUITE_NB_STEPS = [[1,2,5,10],[2,3,5,10],[3,4,6,7,9,11,20,25]];
  function genSuiteNombresQuestion(level){
    var step = pick(SUITE_NB_STEPS[level]);
    var desc = level>=1 && Math.random()<0.4;
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
  function bigNumQuestion(tag, question, sub, explain, txt, correct, extra){
    return {
      tag:tag, question:question, sub:sub, explain:explain,
      draw:function(){ drawEquation(txt); },
      cols3:false,
      choices: numChoices(correct, extra)
    };
  }
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
    if(level>0 && Math.random()<0.4) n = Math.round(n/10)*10 + pick([-1,0,9]);   // frontières de dizaines
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

  // ===================== Activités visuelles : fractions et dénombrement =====================
  // Dessine une figure partagée en n parts égales dont k sont coloriées.
  // kind : 'pie' (disque) ou 'bar' (bande) ; centre (cx,cy) et taille.
  function drawFractionShape(svg, kind, n, k, cx, cy, size){
    var fill = 'var(--accent)', off = 'var(--surface)', i;
    if(kind==='pie'){
      var r = size/2;
      for(i=0;i<n;i++){
        var a0 = -Math.PI/2 + i*2*Math.PI/n, a1 = -Math.PI/2 + (i+1)*2*Math.PI/n;
        var d = 'M '+cx+' '+cy+' L '+(cx+r*Math.cos(a0))+' '+(cy+r*Math.sin(a0))+' A '+r+' '+r+' 0 0 1 '+(cx+r*Math.cos(a1))+' '+(cy+r*Math.sin(a1))+' Z';
        svg.appendChild(el('path',{d:d, fill:i<k ? fill : off, stroke:'var(--text)','stroke-width':2.5,'stroke-linejoin':'round'}));
      }
    } else {
      var w = size, h = size*0.5, x0 = cx-w/2, y0 = cy-h/2;
      for(i=0;i<n;i++){
        svg.appendChild(el('rect',{x:x0+i*w/n, y:y0, width:w/n, height:h, fill:i<k ? fill : off, stroke:'var(--text)','stroke-width':2.5}));
      }
    }
  }
  function gcd2(a,b){ return b===0 ? a : gcd2(b, a % b); }
  function genFractionQuestion(level){
    var kind = pick(['pie','bar']);
    var dens = level===0 ? [2,4] : level===1 ? [2,3,4] : [3,4,5,6,8];
    if(Math.random() < (level===0 ? 0.5 : 0.4)){
      // -- Choisir le DESSIN qui a la bonne fraction coloriée --
      var TARGETS = level===0 ? [[1,2,'la moitié'],[1,4,'le quart']] : [[1,2,'la moitié'],[1,4,'le quart'],[3,4,'les trois quarts'],[1,3,'le tiers']];
      var tg = pick(TARGETS);
      var val = tg[0]/tg[1];
      var options = [];   // { n, k, kind }
      var used = {}; used[val] = true;
      var okN = level===2 && tg[1]%2===0 && Math.random()<0.6 ? tg[1]*2 : tg[1];
      options.push({ n:okN, k:tg[0]*okN/tg[1], ok:true });
      var guard = 0;
      while(options.length<4 && guard++<200){
        var n2 = pick(level===0 ? [2,4] : [2,3,4,6,8]), k2 = randInt(1,n2-1), v2 = k2/n2;
        if(used[v2]) continue;
        used[v2] = true; options.push({ n:n2, k:k2, ok:false });
      }
      if(options.length<4) return genFractionQuestion(level);
      var kinds = pick([['pie'],['bar'],['pie','bar']]);
      return {
        tag:'Fractions', question:'Quelle figure a ' + tg[2] + ' de sa surface coloriée ?', sub:'Regarde combien de parts sont coloriées sur le nombre total de parts.',
        explain:'La bonne figure est partagée en ' + options[0].n + ' parts égales avec ' + options[0].k + ' coloriée' + (options[0].k>1?'s':'') + ' : ' + options[0].k + '/' + options[0].n + ' = ' + tg[0] + '/' + tg[1] + '.',
        draw:function(){ var svg=document.getElementById('m4Svg'); svg.setAttribute('viewBox','0 0 200 200'); svg.innerHTML=""; svg.appendChild(svgText(100,125,72,'🍕')); },
        cols3:false,
        choices: shuffle(options).map(function(o, i){
          var kd = kinds[i % kinds.length];
          return { label:'Figure ' + (i+1), ok:o.ok, viewBox:'0 0 100 100', draw:function(svg){ drawFractionShape(svg, kd, o.n, o.k, 50, 50, 84); } };
        })
      };
    }
    // -- Lire la fraction coloriée --
    var n = pick(dens), k = randInt(1,n-1);
    var val2 = k/n, seen = {}; seen[val2] = true;
    var wrong = [], cand = [[n-k,n],[k,n+1],[k+1,n],[Math.max(1,k-1),n],[1,n],[n,k],[k,n-1],[k,n+2]];
    shuffle(cand).forEach(function(f){
      var a = f[0], b = f[1];
      if(a>=1 && b>a && b<=10 && !seen[a/b] && wrong.length<3){ seen[a/b] = true; wrong.push(a + '/' + b); }
    });
    var g = 0; while(wrong.length<3 && g++<100){ var b3 = randInt(3,9), a3 = randInt(1,b3-1); if(!seen[a3/b3]){ seen[a3/b3]=true; wrong.push(a3+'/'+b3); } }
    var okStr = k + '/' + n;
    return {
      tag:'Fractions', question:'Quelle fraction de la figure est coloriée ?', sub:'En bas : le nombre total de parts égales. En haut : les parts coloriées.',
      explain:'La figure est partagée en ' + n + ' parts égales et ' + k + ' sont coloriées : ' + okStr + '.',
      draw:function(){ var svg=document.getElementById('m4Svg'); svg.setAttribute('viewBox','0 0 200 200'); svg.innerHTML=""; drawFractionShape(svg, kind, n, k, 100, 100, kind==='pie' ? 150 : 170); },
      cols3:false,
      choices: shuffle([okStr].concat(wrong)).map(function(l){ return { label:l, ok:l===okStr }; })
    };
  }

  // -- Dénombrement : compter des objets, ou lire des blocs centaines/dizaines/unités --
  var COUNT_ICONS = ['🍎','⭐','🐟','🚗','🎈','🐞','🍪','🌸'];
  function genComptageQuestion(level){
    if(level===0){
      var n = randInt(3,12), icon = pick(COUNT_ICONS);
      var cells = []; for(var i=0;i<16;i++) cells.push(i);
      var chosen = shuffle(cells).slice(0,n);
      return {
        tag:'Dénombrement', question:'Combien y a-t-il d\'objets ?', sub:'Compte-les un par un, sans en oublier ni en compter deux fois.',
        explain:'Il y a ' + n + ' objets.',
        draw:function(){
          var svg=document.getElementById('m4Svg'); svg.setAttribute('viewBox','0 0 200 200'); svg.innerHTML="";
          chosen.forEach(function(c){ var x = 28 + (c%4)*48 + randInt(-6,6), y = 52 + Math.floor(c/4)*44 + randInt(-4,4); svg.appendChild(svgText(x,y,30,icon)); });
        },
        cols3:false, choices: numChoices(n, [n+1,n-1,n+2,n-2])
      };
    }
    var hu = level===2 ? randInt(0,2) : 0, te = randInt(1,5), un = randInt(0,9);
    var total = hu*100 + te*10 + un;
    if(total===0) return genComptageQuestion(level);
    return {
      tag:'Dénombrement', question:'Quel nombre est représenté avec ces blocs ?', sub:'Une plaque = 100, une barre = 10, un petit cube = 1.',
      explain:(hu ? hu + ' plaque' + (hu>1?'s':'') + ' (' + hu*100 + ') + ' : '') + te + ' barre' + (te>1?'s':'') + ' (' + te*10 + ') + ' + un + ' cube' + (un>1?'s':'') + ' = ' + total + '.',
      draw:function(){
        var svg=document.getElementById('m4Svg'); svg.setAttribute('viewBox','0 0 200 200'); svg.innerHTML="";
        var i, j, y0 = 8;
        if(hu){
          for(i=0;i<hu;i++){
            var px = 100 - hu*25 + i*50 + 3;
            svg.appendChild(el('rect',{x:px,y:y0,width:44,height:44,fill:'var(--accent2)','fill-opacity':0.6,stroke:'var(--text)','stroke-width':2}));
            for(j=1;j<10;j++){
              svg.appendChild(el('line',{x1:px+j*4.4,y1:y0,x2:px+j*4.4,y2:y0+44,stroke:'var(--text)','stroke-width':0.5,'stroke-opacity':0.5}));
              svg.appendChild(el('line',{x1:px,y1:y0+j*4.4,x2:px+44,y2:y0+j*4.4,stroke:'var(--text)','stroke-width':0.5,'stroke-opacity':0.5}));
            }
          }
          y0 = 64;
        } else y0 = 40;
        for(i=0;i<te;i++){
          var bx = 20 + i*17;
          svg.appendChild(el('rect',{x:bx,y:y0,width:12,height:96,fill:'var(--accent3)','fill-opacity':0.7,stroke:'var(--text)','stroke-width':1.5}));
          for(j=1;j<10;j++) svg.appendChild(el('line',{x1:bx,y1:y0+j*9.6,x2:bx+12,y2:y0+j*9.6,stroke:'var(--text)','stroke-width':0.6}));
        }
        for(i=0;i<un;i++){
          var ux = 128 + (i%3)*20, uy = y0 + 4 + Math.floor(i/3)*22;
          svg.appendChild(el('rect',{x:ux,y:uy,width:16,height:16,fill:'var(--accent)','fill-opacity':0.75,stroke:'var(--text)','stroke-width':1.5}));
        }
      },
      cols3:false, choices: numChoices(total, [total+10, total-10, total+1, total-1, total+100, hu*100+un*10+te])
    };
  }

  // ---- Déclaration des types de Quizz du thème Calcul ----
  registerQuizType({ id:'calc', domain:'calcul', label:'Calcul', longLabel:'Calcul', defaultLevels:[0,1,2],
    randomNote:'Les nombres de l\'opération sont tirés au hasard. C\'est le NIVEAU qui fixe la plage (jusqu\'à 10 en Facile, jusqu\'à 20 en Moyen/Difficile) et, en Difficile, la possibilité de tirer une variante "trouve le nombre manquant".',
    generate:genCalcQuestion });
  registerQuizType({ id:'monnaie', domain:'calcul', label:'Monnaie', longLabel:'Monnaie', defaultLevels:[0,1,2],
    randomNote:'Le nombre de pièces/billets et leurs valeurs sont tirés au hasard. Facile : 2 pièces ou billets de 1, 2 ou 5 € ; Moyen : 2 ou 3, jusqu\'à 10 € ; Difficile : 3 ou 4, jusqu\'à 20 €.',
    generate:genMonnaieQuestion });
  registerQuizType({ id:'vie', domain:'calcul', label:'Maths de la vie', longLabel:'Maths de la vie', defaultLevels:[1,2],
    randomNote:'Le modèle de problème est tiré au hasard parmi 6 scénarios fixes (sans répétition tant qu\'on ne les a pas tous vus), puis les nombres de l\'énoncé sont eux aussi tirés au hasard à l\'intérieur de chaque modèle.',
    generate:genVieQuestion });
  registerQuizType({ id:'soustraction', domain:'calcul', label:'Soustraction', longLabel:'Soustraction', defaultLevels:[0,1,2],
    randomNote:'a - b avec b plus petit que a. Facile : nombres jusqu\'à 10 ; Moyen : jusqu\'à 20 ; Difficile : jusqu\'à 60 (avec retenues).',
    generate:genSoustractionQuestion });
  registerQuizType({ id:'doubleMoitie', domain:'calcul', label:'Doubles et moitiés', longLabel:'Doubles et moitiés', defaultLevels:[0,1,2],
    randomNote:'Le double ou la moitié d\'un nombre (la moitié porte toujours sur un nombre pair). Facile : jusqu\'à 10 ; Moyen : jusqu\'à 20 ; Difficile : jusqu\'à 50.',
    generate:genDoubleMoitieQuestion });
  registerQuizType({ id:'complement', domain:'calcul', label:'Compléments', longLabel:'Compléments (à 10, 20, 100)', defaultLevels:[0,1,2],
    randomNote:'« a + ? = cible ». Facile : compléments à 10 ; Moyen : à 20 ; Difficile : à 100 (multiples de 5).',
    generate:genComplementQuestion });
  registerQuizType({ id:'tables', domain:'calcul', label:'Tables', longLabel:'Tables de multiplication', defaultLevels:[1,2],
    randomNote:'Facile : tables de 2 et de 10 ; Moyen : 2, 5 et 10 ; Difficile : 2, 3, 4, 5, 10, avec parfois le facteur manquant (5 × ? = 35).',
    generate:genTableQuestion });
  registerQuizType({ id:'compare', domain:'calcul', label:'Comparer', longLabel:'Comparer des nombres (<, >, =)', defaultLevels:[0,1,2],
    randomNote:'Choisir le bon signe. Facile : deux nombres jusqu\'à 20 ; Moyen : jusqu\'à 30, parfois deux additions à comparer ; Difficile : jusqu\'à 99, plus souvent des additions. Parfois les deux côtés sont égaux.',
    generate:genCompareQuestion });
  registerQuizType({ id:'suiteNombres', domain:'logique', label:'Suite de nombres', longLabel:'Suite de nombres', defaultLevels:[1,2],
    randomNote:'Une suite où l\'on avance (ou recule) du même nombre à chaque fois ; on trouve le nombre manquant. Facile : de 1, 2, 5 ou 10 en 10 ; Moyen : de 2, 3, 5, 10, parfois en descendant ; Difficile : de 3, 4, 6, 7, 9, 11, 20, 25.',
    generate:genSuiteNombresQuestion });
  registerQuizType({ id:'numeration', domain:'nombres', label:'Dizaines et unités', longLabel:'Dizaines et unités (numération)', defaultLevels:[0,1,2],
    randomNote:'Chiffre des dizaines/unités (centaines en Difficile), nombre de dizaines, ou composer un nombre (30 + 4). Facile : jusqu\'à 59 ; Moyen : jusqu\'à 99 ; Difficile : jusqu\'à 999.',
    generate:genNumerationQuestion });
  registerQuizType({ id:'ordre', domain:'nombres', label:'Ordre des nombres', longLabel:'Ordre des nombres (avant, après, plus grand, pair)', defaultLevels:[0,1,2],
    randomNote:'Nombre juste avant/après, nombre entre deux autres, plus grand / plus petit parmi 4, nombre pair (dès Moyen). Facile : jusqu\'à 20 ; Moyen : jusqu\'à 100 ; Difficile : jusqu\'à 1000, souvent autour des changements de dizaine.',
    generate:genOrdreQuestion });
  registerQuizType({ id:'fraction', domain:'nombres', label:'Fractions (visuel)', longLabel:'Fractions : lire ou colorier (dessins)', defaultLevels:[0,1,2],
    randomNote:'Un disque ou une bande partagé(e) en parts égales : soit on lit la fraction coloriée, soit on choisit LE DESSIN qui montre la moitié, le quart, les trois quarts ou le tiers. Facile : demis et quarts ; Moyen : + tiers ; Difficile : jusqu\'aux huitièmes, avec des fractions égales (2/4 = 1/2).',
    generate:genFractionQuestion });
  registerQuizType({ id:'comptage', domain:'nombres', label:'Dénombrement (visuel)', longLabel:'Dénombrement : compter des objets, des blocs', defaultLevels:[0,1,2],
    randomNote:'Facile : compter 3 à 12 objets éparpillés. Moyen : lire des blocs (barres de 10, cubes). Difficile : + plaques de 100.',
    generate:genComptageQuestion });
