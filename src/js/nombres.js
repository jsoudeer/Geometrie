  /* ===================== NOMBRES JUSQU'À 1000 ET CALCUL ÉCRIT =====================
     Types de Quizz de numération (blocs, lettres, ±10/±100, droite graduée, encadrer)
     et de calcul (additions/soustractions posées, multiplier et partager).
     Utilise les outils partagés de noyau.js (numChoices, bigNumQuestion…). */

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
    if(rnd()<0.5){
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
    if(level===0){ step = 10; sign = pick([1,-1]); n = sign>0 ? randInt(1,8)*10 + (rnd()<0.5 ? 0 : randInt(1,9)) : randInt(2,9)*10 + (rnd()<0.5 ? 0 : randInt(1,9)); }
    else if(level===1){
      step = pick([10,10,100]); sign = pick([1,-1]);
      if(step===100) n = sign>0 ? randInt(100,899) : randInt(200,999);
      else n = sign>0 ? randInt(11,89) : randInt(20,99);
    }
    else {
      step = pick([1,10,100,20,30,200]); sign = pick([1,-1]);
      if(step===1){ n = sign>0 ? pick([99,199,299,399,499,599,699,799,899,109,119,129,139]) : pick([100,200,300,400,500,600,700,800,900,110,120,130,140]); }
      else if(step===10 || step===20 || step===30){ n = sign>0 ? randInt(100,970-step) : randInt(110+step, 999); if(rnd()<0.6) n = Math.floor(n/100)*100 + (sign>0 ? randInt(10,99-step+10) : randInt(0,step)); }
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
    var arrondi = level>0 && rnd()<0.5;
    if(level===2 && arrondi && rnd()<0.4){ base = 10; lo = Math.floor(n/10)*10; up = lo + 10; }
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
  // ---- Multiplier (grilles, additions répétées) et partager ----
  // ---- Problèmes à deux étapes ----
  var PROBLEMES2 = [
    function(L){ var A = L ? randInt(40,90) : randInt(10,20), B = randInt(3, Math.floor(A/2)), C = randInt(3, L ? 30 : 9), r = A-B+C, w = prenomAuHasard(), o = objetAuHasard('jeu');
      return { icon:o.icon, q:phrase('{nom} a {A} {obj}. {Il} en perd {B}, puis {il} en gagne {C}. Combien de {obj} {at} maintenant ?', Object.assign(accords(w, o), {A:A, B:B, C:C})), ex:A + ' - ' + B + ' = ' + (A-B) + ', puis ' + (A-B) + ' + ' + C + ' = ' + r + '.', r:r, wrong:[A-B, A+C, A+B+C, A-B-C] }; },
    function(L){ var A = L ? randInt(30,70) : randInt(8,15), B = randInt(2, Math.floor(A/2)), C = randInt(3, L ? 25 : 9), r = A-B+C;
      return { icon:'🚌', q:'Dans un bus, il y a ' + A + ' personnes. À l\'arrêt, ' + B + ' personnes descendent et ' + C + ' montent. Combien y a-t-il de personnes dans le bus ?', ex:A + ' - ' + B + ' = ' + (A-B) + ', puis ' + (A-B) + ' + ' + C + ' = ' + r + '.', r:r, wrong:[A-B, A+C, A+B+C, A-B-C] }; },
    function(L){ var B = L ? randInt(12,35) : randInt(2,8), C = L ? randInt(10,30) : randInt(2,8), A = B + C + randInt(1, L ? 30 : 8), r = A-B-C, w = prenomAuHasard(), x = deuxDifferents(ARTICLES);
      return { icon:'💰', q:phrase('{nom} a {A}€. {Il} achète {x1} à {B}€ et {x2} à {C}€. Combien d\'euros lui reste-t-il ?', Object.assign(accords(w), {A:A, B:B, C:C, x1:unArticle(x[0]), x2:unArticle(x[1])})), ex:B + ' + ' + C + ' = ' + (B+C) + ', puis ' + A + ' - ' + (B+C) + ' = ' + r + '.', r:r, wrong:[A-B, A-C, B+C, A+B+C] }; },
    function(L){ var B = L ? randInt(20,60) : randInt(3,9), C = L ? randInt(15,50) : randInt(3,9), T = B + C + randInt(2, L ? 40 : 9), r = T-B-C, w = prenomAuHasard();
      return { icon:'📖', q:phrase('{nom} lit {B} pages lundi et {C} pages mardi. Son livre a {T} pages. Combien de pages lui reste-t-il à lire ?', {nom:w.nom, B:B, C:C, T:T}), ex:B + ' + ' + C + ' = ' + (B+C) + ', puis ' + T + ' - ' + (B+C) + ' = ' + r + '.', r:r, wrong:[T-B, T-C, B+C, T+B+C] }; },
    function(){ var b = randInt(3,6), p = randInt(3,6), e = randInt(2, b*p-2), r = b*p-e, o = objetAuHasard('gourmand');
      return { icon:o.icon, q:phrase('Il y a {b} boîtes de {p} {obj}. On mange {e} {obj}. Combien de {obj} reste-t-il ?', Object.assign(accords(null, o), {b:b, p:p, e:e})), ex:b + ' × ' + p + ' = ' + (b*p) + ', puis ' + (b*p) + ' - ' + e + ' = ' + r + '.', r:r, wrong:[b*p, b*p+e, p-e > 0 ? p-e : r+2, b+p-e > 0 ? b+p-e : r+3] }; },
    function(){ var n = randInt(2,5), c = randInt(2,5), A = n*c + randInt(1,15), r = A-n*c, w = prenomAuHasard(), x = articleAuHasard();
      return { icon:'📒', q:phrase('{nom} a {A}€. {Il} achète {n} {obj} à {c}€ {chacun}. Combien d\'euros lui reste-t-il ?', Object.assign(accords(w, {plur:x.plur, genre:x.genre}), {A:A, n:n, c:c})), ex:n + ' × ' + c + ' = ' + (n*c) + ', puis ' + A + ' - ' + (n*c) + ' = ' + r + '.', r:r, wrong:[n*c, A-c, A-n, A+n*c] }; },
    function(){ var b = randInt(3,6), p = randInt(3,6), x = randInt(2,9), r = b*p+x, w = prenomAuHasard(), o = objetAuHasard('jeu');
      return { icon:o.icon, q:phrase('{nom} a {b} paquets de {p} {obj} et {x} {obj} {seuls}. Combien de {obj} {at} en tout ?', Object.assign(accords(w, o), {b:b, p:p, x:x})), ex:b + ' × ' + p + ' = ' + (b*p) + ', puis ' + (b*p) + ' + ' + x + ' = ' + r + '.', r:r, wrong:[b*p, b+p+x, r-x*2 > 0 ? r-x*2 : r+4, r+p] }; },
    function(){ var p = randInt(2,5), k = randInt(2,5), u = randInt(2,5), r = p*(k+u), o = objetAuHasard('fruit');
      return { icon:o.icon, q:phrase('Un panier contient {k} {obj}. Un autre en contient {u}. On remplit {p} fois les deux paniers. Combien de {obj} en tout ?', Object.assign(accords(null, o), {k:k, u:u, p:p})), ex:k + ' + ' + u + ' = ' + (k+u) + ', puis ' + p + ' × ' + (k+u) + ' = ' + r + '.', r:r, wrong:[k+u, p*k, p*u, r+p] }; }
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
  registerQuizType({ id:'lettres', domain:'nombres', label:'Nombres en lettres', longLabel:'Nombres en lettres', defaultLevels:[0,1,2],
    randomNote:'Passer des lettres aux chiffres, ou des chiffres aux lettres. Facile : 10 à 69 ; Moyen : 70 à 99 (soixante-dix, quatre-vingts…) ; Difficile : 101 à 999.',
    generate:genLettresQuestion });
  registerQuizType({ id:'plusMoins', domain:'nombres', label:'Ajouter 10, 100', longLabel:'Ajouter ou enlever 10, 100…', defaultLevels:[0,1,2],
    randomNote:'Facile : +10 / -10 jusqu\'à 100 ; Moyen : +10 / -10 jusqu\'à 100 et +100 / -100 jusqu\'à 1000 ; Difficile : aussi +1 / -1 aux frontières (399 + 1), +20, +30, +200, avec passage de la centaine.',
    generate:genPlusMoinsQuestion });
  registerQuizType({ id:'encadrer', domain:'nombres', label:'Encadrer, arrondir', longLabel:'Encadrer et arrondir un nombre', defaultLevels:[0,1,2],
    randomNote:'Facile : entre quelles dizaines (jusqu\'à 99) ; Moyen : jusqu\'à 999, et arrondir à la dizaine ; Difficile : entre quelles centaines, arrondir à la centaine ou à la dizaine.',
    generate:genEncadrerQuestion });
  registerQuizType({ id:'probleme2', domain:'calcul', label:'Problèmes à 2 étapes', longLabel:'Problèmes à deux étapes', defaultLevels:[1,2],
    randomNote:'Un énoncé qui demande deux calculs à la suite (perdre puis gagner, deux achats, boîtes de gâteaux…). Moyen : additions et soustractions, nombres jusqu\'à environ 30 ; Difficile : nombres jusqu\'à environ 100 et énoncés avec une multiplication. Les modèles sont tirés sans répétition.',
    generate:genProbleme2Question });
