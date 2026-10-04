  /* ===================== GABARITS D'ACTIVITÉS (moteur de fiches) =====================
     Une activité arithmétique = une FICHE de données (voir fiches-calcul.js) lue par ce moteur :
     quoi tirer (variables), quelles contraintes (where), la bonne réponse, les fausses réponses,
     les textes, le dessin. Le jeu, les tests et (plus tard) l'éditeur lisent la même fiche.
     Les expressions (« a+b<=99 », « carry(a,b) ») sont évaluées par NOTRE évaluateur ci-dessous :
     jamais eval ni code saisi, donc une fiche venue d'un fichier ne peut rien exécuter.

     Fiche :
       { id, domain, label, longLabel, defaultLevels, tag?, scene:'equation',
         levels:[ {paramètres du niveau 0}, {…1}, {…2} ],      // nombres, textes ou listes : ils entrent dans l'environnement
         forms:[ { w?, levels?, vars:{x:spec,…}, where?:[expr,…], answer:expr, question, sub, explain, eq,
                   extras?:[expr,…] } ],
         note:'texte avec {expr}' }                              // la note de réglage est GÉNÉRÉE (voir templateNote)
     spec d'une variable : expr | {int:[lo,hi], step?} | {pick:[valeurs] ou "nomDeParamètre"} | {any:[spec,…]}
     Dans les textes : {expr}. Dans note : k0, k1, k2 = paramètre k du niveau 0, 1, 2. */

  // ---- évaluateur d'expressions (+ - * / % < <= > >= == != && || ! ?: appels de fonctions) ----
  var EXPR_FNS = {
    min:Math.min, max:Math.max, abs:Math.abs, floor:Math.floor, round:Math.round,
    rand:function(){ return rnd(); },
    // listes lisibles : [2,5,10] -> « 2, 5 et 10 »
    liste:function(a){ return a.length < 2 ? a.join('') : a.slice(0,-1).join(', ') + ' et ' + a[a.length-1]; }
  };
  function own(o, k){ return Object.prototype.hasOwnProperty.call(o, k); }
  var EXPR_CACHE = Object.create(null);   // sans prototype : « constructor » ne doit pas être pris pour une expression déjà compilée
  function compileExpr(src){
    src = String(src);
    if(EXPR_CACHE[src]) return EXPR_CACHE[src];
    var toks = [], re = /\s*(?:(\d+(?:\.\d+)?)|([A-Za-z_]\w*)|(&&|\|\||<=|>=|==|!=|[-+*\/%<>!?:(),\[\]]))/y, m, pos = 0;
    while(pos < src.length){
      re.lastIndex = pos; m = re.exec(src);
      if(!m){ if(/^\s*$/.test(src.slice(pos))) break; throw new Error('expression illisible : ' + src); }
      pos = re.lastIndex;
      if(m[1] !== undefined) toks.push({ t:'n', v:parseFloat(m[1]) });
      else if(m[2] !== undefined) toks.push({ t:'i', v:m[2] });
      else toks.push({ t:'o', v:m[3] });
    }
    var k = 0, idents = {};
    function peek(){ return toks[k]; }
    function eat(v){ var t = toks[k]; if(!t || t.t !== 'o' || t.v !== v) throw new Error('« ' + v + ' » attendu dans : ' + src); k++; }
    function isOp(v){ var t = toks[k]; return t && t.t === 'o' && t.v === v; }
    function ternary(){
      var c = orE();
      if(isOp('?')){ k++; var a = ternary(); eat(':'); var b = ternary(); return function(e){ return c(e) ? a(e) : b(e); }; }
      return c;
    }
    function bin(next, ops){
      return function(){
        var l = next();
        while(toks[k] && toks[k].t === 'o' && ops.indexOf(toks[k].v) !== -1){
          var op = toks[k++].v, r = next(), a = l;
          l = (function(a, r, op){ return function(e){
            var x = a(e), y = r(e);
            switch(op){
              case '||': return x || y; case '&&': return x && y;
              case '==': return x === y; case '!=': return x !== y;
              case '<': return x < y; case '<=': return x <= y; case '>': return x > y; case '>=': return x >= y;
              case '+': return x + y; case '-': return x - y; case '*': return x * y; case '/': return x / y; default: return x % y;
            } }; })(a, r, op);
        }
        return l;
      };
    }
    var orE, andE, eqE, relE, addE, mulE;
    mulE = bin(unary, ['*','/','%']); addE = bin(mulE, ['+','-']); relE = bin(addE, ['<','<=','>','>=']);
    eqE = bin(relE, ['==','!=']); andE = bin(eqE, ['&&']); orE = bin(andE, ['||']);
    function unary(){
      if(isOp('-')){ k++; var u = unary(); return function(e){ return -u(e); }; }
      if(isOp('!')){ k++; var v = unary(); return function(e){ return !v(e); }; }
      return primary();
    }
    function primary(){
      var t = toks[k++];
      if(!t) throw new Error('expression incomplète : ' + src);
      if(t.t === 'n') return function(){ return t.v; };
      if(t.t === 'o' && t.v === '('){ var x = ternary(); eat(')'); return x; }
      if(t.t === 'o' && t.v === '['){
        var items = [];
        if(!isOp(']')){ do { items.push(ternary()); if(!isOp(',')) break; k++; } while(true); }
        eat(']'); return function(e){ return items.map(function(f){ return f(e); }); };
      }
      if(t.t !== 'i') throw new Error('« ' + t.v + ' » inattendu dans : ' + src);
      if(isOp('(')){
        k++; var args = [];
        if(!isOp(')')){ do { args.push(ternary()); if(!isOp(',')) break; k++; } while(true); }
        eat(')'); idents['()' + t.v] = 1;
        return function(e){
          var f = own(EXPR_FNS, t.v) ? EXPR_FNS[t.v] : own(e.__fns, t.v) ? e.__fns[t.v] : null;
          if(!f) throw new Error('fonction inconnue : ' + t.v);
          return f.apply(null, args.map(function(a){ return a(e); }));
        };
      }
      idents[t.v] = 1;
      return function(e){ return e[t.v]; };
    }
    var root = ternary();
    if(k < toks.length) throw new Error('reste inattendu dans : ' + src);
    root.idents = idents;
    return (EXPR_CACHE[src] = root);
  }
  function evalExpr(src, env){ return compileExpr(src)(env); }

  // ---- textes : « Combien font {a} + {b} ? » ----
  function compileText(src){
    var parts = String(src).split(/\{([^}]*)\}/), fs = [];
    for(var i=0;i<parts.length;i++) fs.push(i%2 ? compileExpr(parts[i]) : parts[i]);
    var fn = function(env){ return fs.map(function(f){ return typeof f === 'string' ? f : f(env); }).join(''); };
    fn.idents = {};
    fs.forEach(function(f){ if(typeof f !== 'string') for(var k in f.idents) fn.idents[k] = 1; });
    return fn;
  }

  // ---- tirage d'une variable ----
  function drawVar(spec, env){
    if(typeof spec === 'number' || typeof spec === 'string') return evalExpr(spec, env);
    if(spec.int){
      var lo = evalExpr(spec.int[0], env), hi = evalExpr(spec.int[1], env);
      return randInt(lo, hi) * (spec.step || 1);
    }
    if(spec.pick){ var list = typeof spec.pick === 'string' ? env[spec.pick] : spec.pick; return pick(list); }
    if(spec.any) return drawVar(pick(spec.any), env);
    throw new Error('variable inconnue : ' + JSON.stringify(spec));
  }
  function specIdents(spec, out){
    if(typeof spec === 'number') return;
    if(typeof spec === 'string'){ var c = compileExpr(spec); for(var k in c.idents) out[k] = 1; return; }
    if(spec.int) spec.int.forEach(function(x){ specIdents(x, out); });
    else if(spec.pick){ if(typeof spec.pick === 'string') out[spec.pick] = 1; }
    else if(spec.any) spec.any.forEach(function(s){ specIdents(s, out); });
    else throw new Error('variable inconnue : ' + JSON.stringify(spec));
  }

  var TEMPLATE_FICHES = {};
  var TEMPLATE_FNS = {};   // fonctions nommées utilisables dans les fiches (carry, explainAdd…), déclarées par fiches-calcul.js

  // Vérifie une fiche (erreur claire si elle est mal formée) : toutes les expressions se compilent,
  // tous les noms utilisés existent. Appelée à l'enregistrement.
  function validateFiche(f){
    function bad(msg){ throw new Error('fiche « ' + f.id + ' » : ' + msg); }
    ['id','domain','label','longLabel'].forEach(function(k){ if(!f[k]) bad('« ' + k + ' » manquant'); });
    if((f.scene || 'equation') !== 'equation') bad('scène inconnue « ' + f.scene + ' »');
    if(!f.levels || f.levels.length !== 3) bad('3 niveaux attendus (Facile, Moyen, Difficile)');
    if(!f.forms || !f.forms.length) bad('aucune forme de question');
    f.forms.forEach(function(form, fi){
      var known = Object.create(null); known.level = 1; known.tries = 1;
      f.levels.forEach(function(p){ for(var k in p) known[k] = 1; });
      var vars = form.vars || {};
      try {
        for(var name in vars){ var need = {}; specIdents(vars[name], need); for(var n in need) if(!known[n] && !own(EXPR_FNS, n) && n.charAt(0) !== '(') bad('forme ' + fi + ' : « ' + n + ' » inconnu dans la variable ' + name); known[name] = 1; }
        var all = [].concat(form.where || [], form.answer, form.extras || [], form.w === undefined ? [] : [form.w]).map(compileExpr)
          .concat(['question','sub','explain','eq'].map(function(k){ if(typeof form[k] !== 'string') bad('forme ' + fi + ' : « ' + k + ' » manquant'); return compileText(form[k]); }));
        all.forEach(function(c){ for(var n in c.idents){
          var fn = n.charAt(0) === '(' ? n.slice(2) : null;
          if(fn ? !(own(EXPR_FNS, fn) || own(TEMPLATE_FNS, fn)) : !known[n]) bad('forme ' + fi + ' : « ' + (fn || n) + ' » inconnu'); } });
      } catch(err){ if(err.message.indexOf('fiche') === 0) throw err; bad(err.message); }
    });
    compileText(f.note || '');
  }

  // Note de réglage GÉNÉRÉE depuis les paramètres de niveau : elle ne peut plus contredire le code.
  function templateNote(f){
    var env = Object.create(null); env.__fns = TEMPLATE_FNS;
    f.levels.forEach(function(p, i){ for(var k in p) env[k + i] = p[k]; });
    return compileText(f.note)(env);
  }

  function genFromFiche(f, level){
    var params = f.levels[level], base = Object.create(null), k;
    base.level = level; base.__fns = TEMPLATE_FNS;
    for(k in params) base[k] = params[k];
    // forme tirée selon ses poids (expressions : « level==2 ? 0.4 : 0 »)
    var cands = [], total = 0;
    f.forms.forEach(function(form){
      if(form.levels && form.levels.indexOf(level) === -1) return;
      var w = form.w === undefined ? 1 : evalExpr(form.w, base);
      if(w > 0){ cands.push([form, w]); total += w; }
    });
    var r = rnd() * total, form = cands[cands.length-1][0];
    for(var i=0;i<cands.length;i++){ r -= cands[i][1]; if(r < 0){ form = cands[i][0]; break; } }
    var env, tries = 0;
    do {
      tries++;
      env = Object.create(base); env.tries = tries;
      for(var name in form.vars) env[name] = drawVar(form.vars[name], env);
    } while(tries < 200 && (form.where || []).some(function(c){ return !evalExpr(c, env); }));
    var correct = evalExpr(form.answer, env);
    var extras = (form.extras || []).map(function(x){ return evalExpr(x, env); });
    var eq = compileText(form.eq)(env);
    return {
      tag: f.tag || 'Calcul',
      question: compileText(form.question)(env),
      sub: compileText(form.sub)(env),
      explain: compileText(form.explain)(env),
      draw: function(){ drawEquation(eq); },
      cols3: false,
      choices: numChoices(correct, extras)
    };
  }

  function registerTemplateType(f){
    validateFiche(f);
    TEMPLATE_FICHES[f.id] = f;
    registerQuizType({ id:f.id, domain:f.domain, label:f.label, longLabel:f.longLabel, defaultLevels:f.defaultLevels || [0,1,2],
      randomNote: templateNote(f), generate:function(level){ return genFromFiche(f, level); } });
  }
