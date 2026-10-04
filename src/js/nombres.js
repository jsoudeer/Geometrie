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

  // ---- Déclaration des types ----
