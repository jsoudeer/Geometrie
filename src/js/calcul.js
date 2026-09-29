  /* ===================== THÈME CALCUL =====================
     Questions de Quizz de calcul : opérations, monnaie, maths de la vie.
  */

  function drawEquation(txt){
    var svg = document.getElementById('m4Svg');
    svg.setAttribute('viewBox','0 0 200 200');
    svg.innerHTML = "";
    svg.appendChild(svgText(100,112,34,txt));
  }

  // ===================== Monnaie =====================
  function drawMoneyItem(svg,cx,cy,value,isCoin){
    if(isCoin) svg.appendChild(el('circle',{cx:cx,cy:cy,r:26, fill:'var(--accent3)', stroke:'var(--text)','stroke-width':2.5}));
    else svg.appendChild(el('rect',{x:cx-34,y:cy-20,width:68,height:40,rx:4, fill:'var(--accent2)', stroke:'var(--text)','stroke-width':2.5}));
    svg.appendChild(svgText(cx,cy+6,16,value+'€'));
  }
  function genMonnaieQuestion(){
    var pool=[1,2,5,10,20];
    var count = 2+Math.floor(Math.random()*2);
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
        var a=randInt(1,10), b=randInt(1,10), sum=a+b;
        return { icon:'🎒', question:'Léa a ' + a + ' billes rouges et ' + b + ' billes bleues. Combien de billes a-t-elle en tout ?', explain: a + ' + ' + b + ' = ' + sum + ' billes.', correct:sum, pool:[sum-2,sum-1,sum+1,sum+2,sum+3] };
      },
      function(){
        var a=randInt(2,15), b=randInt(1,a-1), diff=a-b;
        return { icon:'📏', question:'Un crayon mesure ' + a + ' cm. Un autre mesure ' + b + ' cm. Quelle est la différence de longueur ?', explain: a + ' - ' + b + ' = ' + diff + ' cm.', correct:diff, pool:[diff-2,diff-1,diff+1,diff+2,diff+3] };
      },
      function(){
        var p1=randInt(1,10), p2=randInt(1,10), sum=p1+p2;
        return { icon:'💶', question:'Au marché, une pomme coûte ' + p1 + '€ et une poire coûte ' + p2 + '€. Combien coûtent les deux fruits ensemble ?', explain: p1 + '€ + ' + p2 + '€ = ' + sum + '€.', correct:sum, pool:[sum-2,sum-1,sum+1,sum+2,sum+3] };
      },
      function(){
        var total=randInt(10,20), done=randInt(1,total-1), remain=total-done;
        return { icon:'🚶', question:'Sur le chemin de l\'école, il y a ' + total + ' arbres. Léo en a déjà compté ' + done + '. Combien lui en reste-t-il à compter ?', explain: total + ' - ' + done + ' = ' + remain + '.', correct:remain, pool:[remain-2,remain-1,remain+1,remain+2,remain+3] };
      },
      function(){
        var boxes=randInt(2,6), perBox=randInt(2,5), total2=boxes*perBox;
        return { icon:'🍪', question:'Il y a ' + boxes + ' boîtes de gâteaux. Chaque boîte contient ' + perBox + ' gâteaux. Combien de gâteaux y a-t-il en tout ?', explain: boxes + ' × ' + perBox + ' = ' + total2 + ' gâteaux.', correct:total2, pool:[total2-4,total2-2,total2+2,total2+4,total2+6] };
      },
      function(){
        var paid=randInt(10,20), cost=randInt(1,paid-1), change=paid-cost;
        return { icon:'💰', question:'Tom paie avec un billet de ' + paid + '€ un jouet qui coûte ' + cost + '€. Combien de monnaie va-t-on lui rendre ?', explain: paid + '€ - ' + cost + '€ = ' + change + '€.', correct:change, pool:[change-2,change-1,change+1,change+2,change+3] };
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

  // ---- Déclaration des types de Quizz du thème Calcul ----
  registerQuizType({ id:'calc', label:'Calcul', longLabel:'Calcul', defaultLevels:[0,1,2],
    randomNote:'Les nombres de l\'opération sont tirés au hasard. C\'est le NIVEAU qui fixe la plage (jusqu\'à 10 en Facile, jusqu\'à 20 en Moyen/Difficile) et, en Difficile, la possibilité de tirer une variante "trouve le nombre manquant".',
    generate:genCalcQuestion });
  registerQuizType({ id:'monnaie', label:'Monnaie', longLabel:'Monnaie', defaultLevels:[0,1,2],
    randomNote:'Le nombre de pièces/billets et leurs valeurs sont tirés au hasard à chaque question.',
    generate:genMonnaieQuestion });
  registerQuizType({ id:'vie', label:'Maths de la vie', longLabel:'Maths de la vie', defaultLevels:[1,2],
    randomNote:'Le modèle de problème est tiré au hasard parmi 6 scénarios fixes, puis les nombres de l\'énoncé sont eux aussi tirés au hasard à l\'intérieur de chaque modèle.',
    generate:genVieQuestion });
