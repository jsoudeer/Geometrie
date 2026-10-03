  /* ===================== NOMBRES JUSQU'À 1000 ET CALCUL ÉCRIT =====================
     Types de Quizz de numération (blocs, lettres, ±10/±100, droite graduée, encadrer)
     et de calcul (additions/soustractions posées, multiplier et partager).
     Utilise les outils de calcul.js (numChoices, bigNumQuestion…). */

  // ---- Nombres en lettres (0 à 999, orthographe traditionnelle) ----
  var LETTRES_U = ['zéro','un','deux','trois','quatre','cinq','six','sept','huit','neuf','dix','onze','douze','treize','quatorze','quinze','seize','dix-sept','dix-huit','dix-neuf'];
  var LETTRES_D = ['','','vingt','trente','quarante','cinquante','soixante'];
  function lettres100(n){
    if(n<20) return LETTRES_U[n];
    var d = Math.floor(n/10), u = n%10;
    if(d<7) return u===0 ? LETTRES_D[d] : u===1 ? LETTRES_D[d] + ' et un' : LETTRES_D[d] + '-' + LETTRES_U[u];
    if(d===7) return u===1 ? 'soixante et onze' : 'soixante-' + LETTRES_U[10+u];
    if(d===8) return u===0 ? 'quatre-vingts' : 'quatre-vingt-' + LETTRES_U[u];
    return 'quatre-vingt-' + LETTRES_U[10+u];
  }
  function nombreEnLettres(n){
    var c = Math.floor(n/100), r = n%100;
    if(c===0) return lettres100(r);
    var cent = c===1 ? 'cent' : LETTRES_U[c] + ' cent' + (r===0 ? 's' : '');
    return r===0 ? cent : cent + ' ' + lettres100(r);
  }
  function genLettresQuestion(level){
    var n = level===0 ? randInt(10,69) : level===1 ? randInt(70,99) : randInt(101,999);
    if(level===2 && n%100===0) n += randInt(1,99);
    var w = nombreEnLettres(n);
    var c = Math.floor(n/100), d = Math.floor(n/10)%10, u = n%10;
    if(Math.random()<0.5){
      var swap = c ? c*100 + u*10 + d : u*10 + d;
      var extra = [n+10, n-10, swap, n+1, n-1];
      if(n%100>=70) extra.push(n-10, n-20);        // soixante-dix, quatre-vingt-dix… : pièges 60+, 80+
      var q = bigNumQuestion('Nombres','Quel est ce nombre écrit en chiffres ?','Découpe le mot : cent, vingt, soixante… (quatre-vingt = 4 × 20).', w + ' s\'écrit ' + n + '.', w.length>16 ? '…' : w, n, extra);
      q.draw = function(){
        var svg = document.getElementById('m4Svg'); svg.setAttribute('viewBox','0 0 200 200'); svg.innerHTML = "";
        var words = w.split(/(?<=\s|-)/), lines = [''], i;
        for(i=0;i<words.length;i++){ if((lines[lines.length-1] + words[i]).length>14 && lines[lines.length-1]) lines.push(''); lines[lines.length-1] += words[i]; }
        lines.forEach(function(t, k){ svg.appendChild(svgText(100, 100 - (lines.length-1)*14 + k*30, 24, t.trim())); });
      };
      return q;
    }
    var pool = [n+10, n-10, c ? c*100 + u*10 + d : u*10 + d, n+1, n-1, n+100, n-100].filter(function(v){ return v>9 && v<1000 && v!==n; });   // < 1000 : nombreEnLettres ne sait pas écrire « dix cent »
    var seen = {}; seen[w] = true; var wrong = [];
    shuffle(pool).forEach(function(v){ var t = nombreEnLettres(v); if(!seen[t] && wrong.length<3){ seen[t] = true; wrong.push(t); } });
    return {
      tag:'Nombres', question:'Comment s\'écrit ce nombre en lettres ?', sub:'Cherche le mot qui correspond exactement au nombre.',
      explain: n + ' s\'écrit « ' + w + ' ».',
      draw:function(){ drawEquation(String(n)); }, cols3:false,
      choices: shuffle([w].concat(wrong)).map(function(l){ return { label:l, ok:l===w }; })
    };
  }

  // ---- Ajouter / enlever 10, 100 (et 1 aux frontières) ----
  function genPlusMoinsQuestion(level){
    var step, n, sign;
    if(level===0){ step = 10; sign = pick([1,-1]); n = sign>0 ? randInt(1,8)*10 + (Math.random()<0.5 ? 0 : randInt(1,9)) : randInt(2,9)*10 + (Math.random()<0.5 ? 0 : randInt(1,9)); }
    else if(level===1){
      step = pick([10,10,100]); sign = pick([1,-1]);
      if(step===100) n = sign>0 ? randInt(100,899) : randInt(200,999);
      else n = sign>0 ? randInt(11,89) : randInt(20,99);
    }
    else {
      step = pick([1,10,100,20,30,200]); sign = pick([1,-1]);
      if(step===1){ n = sign>0 ? pick([99,199,299,399,499,599,699,799,899,109,119,129,139]) : pick([100,200,300,400,500,600,700,800,900,110,120,130,140]); }
      else if(step===10 || step===20 || step===30){ n = sign>0 ? randInt(100,970-step) : randInt(110+step, 999); if(Math.random()<0.6) n = Math.floor(n/100)*100 + (sign>0 ? randInt(10,99-step+10) : randInt(0,step)); }
      else { n = sign>0 ? randInt(100,999-step) : randInt(100+step,999); }
    }
    var res = n + sign*step;
    if(res<0 || res>1000) return genPlusMoinsQuestion(level);
    var txt = n + (sign>0 ? ' + ' : ' - ') + step;
    var how = step===1 ? (sign>0 ? 'Ajoute 1 : le chiffre des unités passe à 0 et on retient.' : 'Enlève 1 : attention au passage de la dizaine ou de la centaine.')
      : step%100===0 ? 'Seul le chiffre des centaines change.' : 'Seul le chiffre des dizaines change (attention à la centaine !).';
    return bigNumQuestion('Nombres', 'Quel est le résultat de ' + txt + ' ?', how,
      txt + ' = ' + res + '.', txt, res,
      [res+sign*step, res-sign*step*2, n+sign*step*10, res+10*sign, res-10*sign, res+100*sign].filter(function(v){ return v!==res; }));
  }

  // ---- Encadrer et arrondir ----
  function genEncadrerQuestion(level){
    var base = level===2 ? 100 : 10;
    var hi = level===0 ? 99 : 999;
    var n;
    do { n = randInt(base===100 ? 101 : 11, hi); }
    while(n%base===0 || n%10===5 || (base===100 && Math.floor(n/10)%10===5));   // jamais un 5 en dernier chiffre : « arrondis 605 à la dizaine » serait ambigu (milieu exact)
    var lo = Math.floor(n/base)*base, up = lo + base;
    var arrondi = level>0 && Math.random()<0.5;
    if(level===2 && arrondi && Math.random()<0.4){ base = 10; lo = Math.floor(n/10)*10; up = lo + 10; }
    if(arrondi){
      var near = (n-lo) < (up-n) ? lo : up;
      var unit = base===100 ? 'la centaine' : 'la dizaine';
      return bigNumQuestion('Nombres','Arrondis ' + n + ' à ' + unit + ' la plus proche.','Entre quels ' + (base===100 ? 'centaines' : 'dizaines') + ' est-il ? Duquel est-il le plus proche ?',
        n + ' est entre ' + lo + ' et ' + up + ', plus proche de ' + near + '.', n + ' ≈ ?', near, [lo, up, lo-base, up+base, near+(near===lo ? 1 : -1)*Math.floor(base/10)]);
    }
    var labels = function(a){ return 'entre ' + a + ' et ' + (a+base); };
    var okL = labels(lo), wrongs = [labels(lo-base), labels(lo+base), 'entre ' + lo + ' et ' + (up+base), 'entre ' + (lo-base) + ' et ' + up, 'entre ' + (lo+base) + ' et ' + (up+2*base)].filter(function(t){ return !/entre -/.test(t) && t!==okL; });
    wrongs = shuffle(wrongs).slice(0,3);
    return {
      tag:'Nombres', question:'Entre quelles ' + (base===100 ? 'centaines' : 'dizaines') + ' se trouve ' + n + ' ?', sub:'Trouve la ' + (base===100 ? 'centaine' : 'dizaine') + ' juste avant et celle juste après.',
      explain: lo + ' < ' + n + ' < ' + up + ' : ' + n + ' est ' + okL + '.',
      draw:function(){ drawEquation(String(n)); }, cols3:false,
      choices: shuffle([okL].concat(wrongs)).map(function(l){ return { label:l, ok:l===okL }; })
    };
  }

  // ---- Droite graduée ----
  function genDroiteQuestion(level){
    var start, step, nb, labelEvery, v, k;
    var kinds = level===0 ? ['f'] : level===1 ? ['m1','m2'] : ['d1','d2','d3'];
    var kind = pick(kinds);
    if(kind==='f'){ start = 0; step = 1; nb = 10; labelEvery = 5; do { k = randInt(1,9); } while(k===5); }
    else if(kind==='m1'){ start = 0; step = 10; nb = 10; labelEvery = 5; do { k = randInt(1,9); } while(k===5); }
    else if(kind==='m2'){ start = 0; step = 20; nb = 10; labelEvery = 5; do { k = randInt(1,9); } while(k===5); }
    else if(kind==='d1'){ start = 0; step = 100; nb = 10; labelEvery = 5; do { k = randInt(1,9); } while(k===5); }
    else if(kind==='d2'){ start = 100*randInt(0,8); step = 10; nb = 10; labelEvery = 5; do { k = randInt(1,9); } while(k===5); }
    else { start = 0; step = 50; nb = 10; labelEvery = 5; do { k = randInt(1,9); } while(k===5); }
    v = start + k*step;
    var end = start + nb*step;
    var q = bigNumQuestion('Nombres','Quel nombre indique la flèche ?','Regarde de combien on avance à chaque graduation : ' + step + '.',
      'Chaque graduation vaut ' + step + '. La flèche est à la graduation numéro ' + k + ' : ' + k + ' × ' + step + (start ? ' + ' + start : '') + ' = ' + v + '.',
      '', v, [v+step, v-step, v+2*step, v-2*step, start+(nb-k)*step, v+10].filter(function(x){ return x!==v; }));
    q.draw = function(){
      var svg = document.getElementById('m4Svg'); svg.setAttribute('viewBox','0 0 200 200'); svg.innerHTML = "";
      var x0 = 16, w = 168, y = 120, i;
      svg.appendChild(el('line',{x1:x0-6,y1:y,x2:x0+w+6,y2:y,stroke:'var(--text)','stroke-width':3,'stroke-linecap':'round'}));
      for(i=0;i<=nb;i++){
        var x = x0 + i*w/nb, big = i%labelEvery===0;
        svg.appendChild(el('line',{x1:x,y1:y-(big?11:7),x2:x,y2:y+(big?11:7),stroke:'var(--text)','stroke-width':big?3:2}));
        if(big) svg.appendChild(svgText(x, y+32, 15, String(start + i*step)));
      }
      var ax = x0 + k*w/nb;
      svg.appendChild(el('polygon',{points:(ax-10)+','+(y-52)+' '+(ax+10)+','+(y-52)+' '+ax+','+(y-14),fill:'var(--accent)',stroke:'var(--text)','stroke-width':2.5,'stroke-linejoin':'round'}));
      svg.appendChild(svgText(ax, y-60, 22, '?'));
    };
    return q;
  }

  // ---- Opérations posées : explications colonne par colonne ----
  var COL_NAMES = ['unités','dizaines','centaines'];
  function addExplain(a, b){
    var parts = [], carry = 0, i, da, db, s, A = String(a), B = String(b), len = Math.max(A.length, B.length);
    for(i=0;i<len;i++){
      da = +(A.charAt(A.length-1-i) || 0); db = +(B.charAt(B.length-1-i) || 0);
      s = da + db + carry;
      parts.push(COL_NAMES[i] + ' : ' + da + ' + ' + db + (carry ? ' + 1' : '') + ' = ' + s + (s>=10 ? ' → on pose ' + (s%10) + ' et on retient 1' : ''));
      carry = s>=10 ? 1 : 0;
    }
    if(carry) parts.push('on écrit la retenue 1');
    return parts.join(' ; ') + '. Résultat : ' + (a+b) + '.';
  }
  function subExplain(a, b){
    var parts = [], borrow = 0, i, da, db, A = String(a), B = String(b);
    for(i=0;i<A.length;i++){
      da = +A.charAt(A.length-1-i); db = +(B.charAt(B.length-1-i) || 0);
      var need = db + borrow;
      if(da<need){ parts.push(COL_NAMES[i] + ' : ' + (da+10) + ' - ' + need + ' = ' + (da+10-need) + ' (on emprunte 1)'); borrow = 1; }
      else { parts.push(COL_NAMES[i] + ' : ' + da + ' - ' + need + ' = ' + (da-need)); borrow = 0; }
    }
    return parts.join(' ; ') + '. Résultat : ' + (a-b) + '.';
  }
  function hasCarry(a, b){ var A = String(a), B = String(b), i, c = 0; for(i=0;i<Math.max(A.length,B.length);i++){ var s = +(A.charAt(A.length-1-i)||0) + +(B.charAt(B.length-1-i)||0) + c; c = s>=10 ? 1 : 0; if(c) return true; } return false; }
  function hasBorrow(a, b){ var A = String(a), B = String(b), i, br = 0; for(i=0;i<A.length;i++){ var need = +(B.charAt(B.length-1-i)||0) + br; var da = +A.charAt(A.length-1-i); br = da<need ? 1 : 0; if(br) return true; } return false; }
  function genAdditionQuestion(level){
    var a, b, guard = 0;
    do {
      if(level===0){ a = randInt(11,89); b = Math.random()<0.5 ? randInt(1,9) : randInt(1,8)*10; }
      else if(level===1){ a = randInt(15,89); b = randInt(11,60); }
      else { a = randInt(120,899); b = Math.random()<0.5 ? randInt(11,99) : randInt(110,500); }
      guard++;
    } while(guard<200 && ((level===0 && (hasCarry(a,b) || a+b>99)) || (level===1 && (a+b>99 || (guard<100 && !hasCarry(a,b) && Math.random()<0.6))) || (level===2 && (a+b>999 || (guard<100 && !hasCarry(a,b) && Math.random()<0.5)))));
    var s = a + b;
    var q = bigNumQuestion('Calcul','Calcule ' + a + ' + ' + b + '.','Additionne en colonnes : unités, puis dizaines' + (level===2 ? ', puis centaines' : '') + ' (n\'oublie pas la retenue).',
      addExplain(a,b), a + ' + ' + b, s, [s-10, s+10, s+1, s-1, hasCarry(a,b) ? s-10 : s+10, level===2 ? s+100 : s+20]);
    return q;
  }
  function genSoustractionPoseeQuestion(level){
    var a, b, guard = 0;
    do {
      if(level===0){ a = randInt(21,99); b = Math.random()<0.5 ? randInt(1,9) : randInt(1,Math.floor(a/10)-1)*10; }
      else if(level===1){ a = randInt(31,99); b = randInt(11,a-5); }
      else { a = randInt(121,999); b = Math.random()<0.5 ? randInt(11,99) : randInt(101,a-10); }
      guard++;
    } while(guard<200 && (a<=b || (level===0 && hasBorrow(a,b)) || (level>0 && guard<100 && !hasBorrow(a,b) && Math.random()<0.6)));
    var r = a - b;
    return bigNumQuestion('Calcul','Calcule ' + a + ' - ' + b + '.','Soustrais en colonnes : unités, puis dizaines' + (level===2 ? ', puis centaines' : '') + ' (emprunte 1 si le chiffre du haut est trop petit).',
      subExplain(a,b), a + ' - ' + b, r, [r+10, r-10, r+1, r-1, level===2 ? r+100 : r+20, level>0 ? Math.abs((Math.floor(a/10)%10 - Math.floor(b/10)%10))*10 + Math.abs(a%10 - b%10) : r+2]);
  }

  // ---- Multiplier (grilles, additions répétées) et partager ----
  var PART_ICONS = ['🍬','🍪','⭐','🍎','🎈'];
  function genMultiplierQuestion(level){
    var kinds = level===0 ? ['grille','repete','partage'] : level===1 ? ['grille','repete','partage','groupes'] : ['grille','repete','partage','groupes','groupes'];
    var kind = pick(kinds), r, c, total;
    if(kind==='grille'){
      r = level===0 ? randInt(2,3) : randInt(2,5); c = level===0 ? randInt(2,5) : level===1 ? randInt(2,5) : randInt(3,10);
      total = r*c;
      var q = bigNumQuestion('Calcul','Combien y a-t-il de points en tout ?','Compte les points d\'une ligne, puis répète : ' + r + ' lignes de ' + c + '.',
        r + ' lignes de ' + c + ' : ' + Array(r+1).join(c + ' + ').slice(0,-3) + ' = ' + total + ' (' + r + ' × ' + c + ').', '', total, [total+c, total-c, total+r, c+r, total+1, total-1]);
      q.draw = function(){
        var svg = document.getElementById('m4Svg'); svg.setAttribute('viewBox','0 0 200 200'); svg.innerHTML = "";
        var gap = Math.min(30, 170/c, 170/r), x0 = 100 - (c-1)*gap/2, y0 = 100 - (r-1)*gap/2, i, j;
        for(i=0;i<r;i++) for(j=0;j<c;j++) svg.appendChild(el('circle',{cx:x0+j*gap,cy:y0+i*gap,r:Math.min(10,gap*0.36),fill:i%2 ? 'var(--accent2)' : 'var(--accent)',stroke:'var(--text)','stroke-width':1.8}));
      };
      return q;
    }
    if(kind==='repete'){
      c = level===0 ? pick([2,5,10]) : level===1 ? randInt(2,6) : randInt(3,9);
      r = level===0 ? randInt(3,4) : randInt(3,5);
      total = r*c;
      var eq = Array(r+1).join(c + ' + ').slice(0,-3);
      return bigNumQuestion('Calcul','Combien font ' + r + ' fois ' + c + ' ?','Additionne ' + c + ' à chaque fois, ' + r + ' fois.', eq + ' = ' + total + ' (' + r + ' × ' + c + ').', eq,
        total, [total+c, total-c, r+c, total+1, total-1, c*(r+1)]);
    }
    if(kind==='partage'){
      var kids = level===0 ? 2 : level===1 ? pick([2,3,4,5]) : pick([2,3,4,5,6,10]);
      var each = level===0 ? randInt(1,5) : level===1 ? randInt(2,5) : randInt(3,9);
      total = kids*each;
      var ic = pick(PART_ICONS);
      var q2 = bigNumQuestion('Calcul','On partage ' + total + ' ' + ic + ' en parts égales entre ' + kids + ' enfants. Combien chacun en a-t-il ?','Cherche le nombre qui, répété ' + kids + ' fois, fait ' + total + '.',
        'Chacun en a ' + each + ' car ' + kids + ' × ' + each + ' = ' + total + '.', '', each, [each+1, each-1, total-kids, kids, each*2, each+2]);
      q2.draw = function(){ var svg = document.getElementById('m4Svg'); svg.setAttribute('viewBox','0 0 200 200'); svg.innerHTML = ""; svg.appendChild(svgText(100,95,64,ic)); svg.appendChild(svgText(100,150,26,total + ' pour ' + kids)); };
      return q2;
    }
    // groupes : « combien de paquets de c dans total ? »
    c = level===1 ? pick([2,5,10]) : pick([3,4,5,6,10]);
    r = level===1 ? randInt(2,5) : randInt(3,8);
    total = r*c;
    var ic2 = pick(PART_ICONS);
    var q3 = bigNumQuestion('Calcul','Avec ' + total + ' ' + ic2 + ', on fait des paquets de ' + c + '. Combien de paquets ?','Combien de fois ' + c + ' dans ' + total + ' ?',
      r + ' paquets car ' + r + ' × ' + c + ' = ' + total + '.', '', r, [r+1, r-1, total-c, c, r*2, r+2]);
    q3.draw = function(){ var svg = document.getElementById('m4Svg'); svg.setAttribute('viewBox','0 0 200 200'); svg.innerHTML = ""; svg.appendChild(svgText(100,95,64,ic2)); svg.appendChild(svgText(100,150,26,total + ' → paquets de ' + c)); };
    return q3;
  }

  // ---- Compter avec des blocs jusqu'à 999 (plaques, barres, cubes) ----
  function genBlocsQuestion(level){
    var hu = level===1 ? randInt(1,4) : randInt(1,9), te = randInt(0,9), un = randInt(0,9);
    var total = hu*100 + te*10 + un;
    var swapV = te*100 + hu*10 + un;
    return {
      tag:'Dénombrement', question:'Quel nombre est représenté avec ces blocs ?', sub:'Une plaque = 100, une barre = 10, un petit cube = 1.',
      explain: hu + ' plaque' + (hu>1?'s':'') + ' (' + hu*100 + ') + ' + te + ' barre' + (te>1?'s':'') + ' (' + te*10 + ') + ' + un + ' cube' + (un>1?'s':'') + ' = ' + total + '.',
      draw:function(){
        var svg = document.getElementById('m4Svg'); svg.setAttribute('viewBox','0 0 200 200'); svg.innerHTML = "";
        var i, j, s = 30, g = 3;
        for(i=0;i<hu;i++){
          var px = 8 + (i%5)*(s+g+3), py = 6 + Math.floor(i/5)*(s+g);
          svg.appendChild(el('rect',{x:px,y:py,width:s,height:s,fill:'var(--accent2)','fill-opacity':0.6,stroke:'var(--text)','stroke-width':2}));
          for(j=1;j<5;j++){
            svg.appendChild(el('line',{x1:px+j*s/5,y1:py,x2:px+j*s/5,y2:py+s,stroke:'var(--text)','stroke-width':0.5,'stroke-opacity':0.5}));
            svg.appendChild(el('line',{x1:px,y1:py+j*s/5,x2:px+s,y2:py+j*s/5,stroke:'var(--text)','stroke-width':0.5,'stroke-opacity':0.5}));
          }
        }
        var yb = hu>5 ? 82 : 52;
        for(i=0;i<te;i++){
          var bx = 10 + i*13;
          svg.appendChild(el('rect',{x:bx,y:yb,width:10,height:90,fill:'var(--accent3)','fill-opacity':0.7,stroke:'var(--text)','stroke-width':1.5}));
          for(j=1;j<10;j++) svg.appendChild(el('line',{x1:bx,y1:yb+j*9,x2:bx+10,y2:yb+j*9,stroke:'var(--text)','stroke-width':0.6}));
        }
        for(i=0;i<un;i++) svg.appendChild(el('rect',{x:138+(i%3)*19,y:yb+4+Math.floor(i/3)*21,width:15,height:15,fill:'var(--accent)','fill-opacity':0.75,stroke:'var(--text)','stroke-width':1.5}));
      },
      cols3:false, choices: numChoices(total, [total+10, total-10, total+100, total-100, swapV !== total ? swapV : total+1, total+1, total-1])
    };
  }

  // ---- Problèmes à deux étapes ----
  var PROBLEMES2 = [
    function(L){ var A = L ? randInt(40,90) : randInt(10,20), B = randInt(3, Math.floor(A/2)), C = randInt(3, L ? 30 : 9), r = A-B+C;
      return { icon:'🔵', q:'Léa a ' + A + ' billes. Elle en perd ' + B + ', puis elle en gagne ' + C + '. Combien de billes a-t-elle maintenant ?', ex:A + ' - ' + B + ' = ' + (A-B) + ', puis ' + (A-B) + ' + ' + C + ' = ' + r + '.', r:r, wrong:[A-B, A+C, A+B+C, A-B-C] }; },
    function(L){ var A = L ? randInt(30,70) : randInt(8,15), B = randInt(2, Math.floor(A/2)), C = randInt(3, L ? 25 : 9), r = A-B+C;
      return { icon:'🚌', q:'Dans un bus, il y a ' + A + ' personnes. À l\'arrêt, ' + B + ' personnes descendent et ' + C + ' montent. Combien y a-t-il de personnes dans le bus ?', ex:A + ' - ' + B + ' = ' + (A-B) + ', puis ' + (A-B) + ' + ' + C + ' = ' + r + '.', r:r, wrong:[A-B, A+C, A+B+C, A-B-C] }; },
    function(L){ var B = L ? randInt(12,35) : randInt(2,8), C = L ? randInt(10,30) : randInt(2,8), A = B + C + randInt(1, L ? 30 : 8), r = A-B-C;
      return { icon:'💰', q:'Tom a ' + A + '€. Il achète un livre à ' + B + '€ et un stylo à ' + C + '€. Combien d\'euros lui reste-t-il ?', ex:B + ' + ' + C + ' = ' + (B+C) + ', puis ' + A + ' - ' + (B+C) + ' = ' + r + '.', r:r, wrong:[A-B, A-C, B+C, A+B+C] }; },
    function(L){ var B = L ? randInt(20,60) : randInt(3,9), C = L ? randInt(15,50) : randInt(3,9), T = B + C + randInt(2, L ? 40 : 9), r = T-B-C;
      return { icon:'📖', q:'Nina lit ' + B + ' pages lundi et ' + C + ' pages mardi. Son livre a ' + T + ' pages. Combien de pages lui reste-t-il à lire ?', ex:B + ' + ' + C + ' = ' + (B+C) + ', puis ' + T + ' - ' + (B+C) + ' = ' + r + '.', r:r, wrong:[T-B, T-C, B+C, T+B+C] }; },
    function(){ var b = randInt(3,6), p = randInt(3,6), e = randInt(2, b*p-2), r = b*p-e;
      return { icon:'🍪', q:'Il y a ' + b + ' boîtes de ' + p + ' gâteaux. On mange ' + e + ' gâteaux. Combien de gâteaux reste-t-il ?', ex:b + ' × ' + p + ' = ' + (b*p) + ', puis ' + (b*p) + ' - ' + e + ' = ' + r + '.', r:r, wrong:[b*p, b*p+e, p-e > 0 ? p-e : r+2, b+p-e > 0 ? b+p-e : r+3] }; },
    function(){ var n = randInt(2,5), c = randInt(2,5), A = n*c + randInt(1,15), r = A-n*c;
      return { icon:'📒', q:'Léo a ' + A + '€. Il achète ' + n + ' cahiers à ' + c + '€ chacun. Combien d\'euros lui reste-t-il ?', ex:n + ' × ' + c + ' = ' + (n*c) + ', puis ' + A + ' - ' + (n*c) + ' = ' + r + '.', r:r, wrong:[n*c, A-c, A-n, A+n*c] }; },
    function(){ var b = randInt(3,6), p = randInt(3,6), x = randInt(2,9), r = b*p+x;
      return { icon:'⭐', q:'Maya a ' + b + ' paquets de ' + p + ' stickers et ' + x + ' stickers tout seuls. Combien de stickers a-t-elle en tout ?', ex:b + ' × ' + p + ' = ' + (b*p) + ', puis ' + (b*p) + ' + ' + x + ' = ' + r + '.', r:r, wrong:[b*p, b+p+x, r-x*2 > 0 ? r-x*2 : r+4, r+p] }; },
    function(){ var p = randInt(2,5), k = randInt(2,5), u = randInt(2,5), r = p*(k+u);
      return { icon:'🍎', q:'Un panier contient ' + k + ' pommes. Un autre en contient ' + u + '. On remplit ' + p + ' fois les deux paniers. Combien de pommes en tout ?', ex:k + ' + ' + u + ' = ' + (k+u) + ', puis ' + p + ' × ' + (k+u) + ' = ' + r + '.', r:r, wrong:[k+u, p*k, p*u, r+p] }; }
  ];
  function genProbleme2Question(level){
    var pool = level===1 ? PROBLEMES2.slice(0,4) : PROBLEMES2;
    var t = pickFresh('probleme2|' + level, pool)(level===2 ? 1 : 0);
    return {
      tag:'Problèmes', question:t.q, sub:'Il y a deux étapes : fais-les l\'une après l\'autre.', explain:t.ex,
      draw:function(){ var svg = document.getElementById('m4Svg'); svg.setAttribute('viewBox','0 0 200 200'); svg.innerHTML = ""; svg.appendChild(svgText(100,120,54,t.icon)); },
      cols3:false, choices:numChoices(t.r, t.wrong.filter(function(v){ return v!==t.r; }))
    };
  }

  // ---- Déclaration des types ----
  registerQuizType({ id:'blocs1000', domain:'nombres', label:'Compter jusqu\'à 1000', longLabel:'Compter des blocs jusqu\'à 999', defaultLevels:[1,2],
    randomNote:'Lire un nombre fait de plaques (100), barres (10) et cubes (1). Moyen : 1 à 4 plaques (jusqu\'à 499) ; Difficile : jusqu\'à 9 plaques (999), avec des chiffres 0 pièges.',
    generate:genBlocsQuestion });
  registerQuizType({ id:'lettres', domain:'nombres', label:'Nombres en lettres', longLabel:'Nombres en lettres', defaultLevels:[0,1,2],
    randomNote:'Passer des lettres aux chiffres, ou des chiffres aux lettres. Facile : 10 à 69 ; Moyen : 70 à 99 (soixante-dix, quatre-vingts…) ; Difficile : 101 à 999.',
    generate:genLettresQuestion });
  registerQuizType({ id:'plusMoins', domain:'nombres', label:'Ajouter 10, 100', longLabel:'Ajouter ou enlever 10, 100…', defaultLevels:[0,1,2],
    randomNote:'Facile : +10 / -10 jusqu\'à 100 ; Moyen : +10 / -10 jusqu\'à 100 et +100 / -100 jusqu\'à 1000 ; Difficile : aussi +1 / -1 aux frontières (399 + 1), +20, +30, +200, avec passage de la centaine.',
    generate:genPlusMoinsQuestion });
  registerQuizType({ id:'encadrer', domain:'nombres', label:'Encadrer, arrondir', longLabel:'Encadrer et arrondir un nombre', defaultLevels:[0,1,2],
    randomNote:'Facile : entre quelles dizaines (jusqu\'à 99) ; Moyen : jusqu\'à 999, et arrondir à la dizaine ; Difficile : entre quelles centaines, arrondir à la centaine ou à la dizaine.',
    generate:genEncadrerQuestion });
  registerQuizType({ id:'droite', domain:'nombres', label:'Droite graduée', longLabel:'Droite graduée : lire un nombre', defaultLevels:[0,1,2],
    randomNote:'Lire le nombre pointé par une flèche sur une droite de 10 graduations. Facile : de 1 en 1 (0 à 10) ; Moyen : de 10 en 10 ou de 20 en 20 ; Difficile : de 50 en 50, de 100 en 100 ou de 10 en 10 entre deux centaines.',
    generate:genDroiteQuestion });
  registerQuizType({ id:'addition', domain:'calcul', label:'Additions posées', longLabel:'Additions en colonnes (retenue)', defaultLevels:[0,1,2],
    randomNote:'Facile : sans retenue, jusqu\'à 99 ; Moyen : 2 nombres de 2 chiffres jusqu\'à 99, souvent avec retenue ; Difficile : jusqu\'à 999, souvent avec retenue. L\'explication détaille chaque colonne.',
    generate:genAdditionQuestion });
  registerQuizType({ id:'soustractionPosee', domain:'calcul', label:'Soustractions posées', longLabel:'Soustractions en colonnes (emprunt)', defaultLevels:[0,1,2],
    randomNote:'Facile : sans emprunt, jusqu\'à 99 ; Moyen : jusqu\'à 99, souvent avec emprunt ; Difficile : jusqu\'à 999, souvent avec emprunt. L\'explication détaille chaque colonne.',
    generate:genSoustractionPoseeQuestion });
  registerQuizType({ id:'multiplier', domain:'calcul', label:'Multiplier, partager', longLabel:'Multiplier et partager (grilles, paquets)', defaultLevels:[0,1,2],
    randomNote:'Compter une grille de points, additionner plusieurs fois le même nombre, partager en parts égales (Moyen/Difficile : aussi faire des paquets). Facile : 2 et 3 lignes, partage entre 2 ; Moyen : jusqu\'à 5 × 5 ; Difficile : plus de colonnes, partages entre 2 à 10.',
    generate:genMultiplierQuestion });
  registerQuizType({ id:'probleme2', domain:'calcul', label:'Problèmes à 2 étapes', longLabel:'Problèmes à deux étapes', defaultLevels:[1,2],
    randomNote:'Un énoncé qui demande deux calculs à la suite (perdre puis gagner, deux achats, boîtes de gâteaux…). Moyen : additions et soustractions, nombres jusqu\'à environ 30 ; Difficile : nombres jusqu\'à environ 100 et énoncés avec une multiplication. Les modèles sont tirés sans répétition.',
    generate:genProbleme2Question });
