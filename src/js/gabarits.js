  /* ===================== GABARITS D'ACTIVITÉS (moteur de fiches) =====================
     Une activité arithmétique = une FICHE de données (voir fiches-calcul.js) lue par ce moteur :
     quoi tirer (variables), quelles contraintes (where), la bonne réponse, les fausses réponses,
     les textes, le dessin. Le jeu, les tests et (plus tard) l'éditeur lisent la même fiche.
     Les scènes (equation, blocks, scatter, grid, emoji, numberline, fraction, clock) sont dans SCENES ci-dessous. Les expressions (« a+b<=99 », « carry(a,b) ») sont évaluées par NOTRE évaluateur ci-dessous :
     jamais eval ni code saisi, donc une fiche venue d'un fichier ne peut rien exécuter.

     Fiche :
       { id, domain, label, longLabel, defaultLevels, tag?,
         levels:[ {paramètres du niveau 0}, {…1}, {…2} ],      // nombres, textes ou listes : ils entrent dans l'environnement
         forms:[ { w?, levels?, vars:{x:spec,…}, where?:[expr,…], answer:expr, question, sub, explain,
                   eq:'texte dessiné' | scene:{type:'blocks', hu:'hu', …},
                   extras?:[expr,…]  |  options?:['<','=','>'] (réponses non numériques : `answer` vaut alors l'une d'elles)
                   |  wrong:expr (réponses de texte : liste des fausses réponses, ex. others(JOURS, bonne, 3) ; `answer` est la bonne)
                   |  figures:{scene, items:expr, label?} (« quelle figure ? » : items = liste de listes de paramètres de la scène, la 1re est la bonne) } ],
         Banques de textes : JOURS, MOIS ; fonctions : at(liste,i) (en tournant), others(liste, sauf, n).
         note:'texte avec {expr}' }                              // la note de réglage est GÉNÉRÉE (voir templateNote)
     spec d'une variable : expr | {int:[lo,hi], step?} | {pick:[valeurs] ou "nomDeParamètre"} | {any:[spec,…]}
     Dans les textes : {expr}. Dans note : k0, k1, k2 = paramètre k du niveau 0, 1, 2. */

  // ---- évaluateur d'expressions (+ - * / % < <= > >= == != && || ! ?: appels de fonctions) ----
  var EXPR_FNS = {
    min:Math.min, max:Math.max, abs:Math.abs, floor:Math.floor, round:Math.round,
    rand:function(){ return rnd(); },
    // listes lisibles : [2,5,10] -> « 2, 5 et 10 »
    liste:function(a){ return a.length < 2 ? a.join('') : a.slice(0,-1).join(', ') + ' et ' + a[a.length-1]; },
    // élément d'une liste, en tournant : at(JOURS, 7) = le même jour que at(JOURS, 0) ; at(JOURS, -1) = le dernier
    at:function(a, i){ var n = a.length; return a[((Math.floor(i) % n) + n) % n]; },
    // n éléments de la liste, au hasard et différents, sans `except` : les fausses réponses d'une question de texte
    others:function(a, except, n){ return shuffle(a.filter(function(x, i){ return x !== except && a.indexOf(x) === i; })).slice(0, n); }
  };
  // Banques de textes : listes prêtes à l'emploi, lisibles par toutes les fiches (noms en majuscules).
  var BANKS = {
    JOURS:['lundi','mardi','mercredi','jeudi','vendredi','samedi','dimanche'],
    MOIS:['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre']
  };
  function own(o, k){ return Object.prototype.hasOwnProperty.call(o, k); }
  var EXPR_CACHE = Object.create(null);   // sans prototype : « constructor » ne doit pas être pris pour une expression déjà compilée
  function compileExpr(src){
    src = String(src);
    if(EXPR_CACHE[src]) return EXPR_CACHE[src];
    var toks = [], re = /\s*(?:(\d+(?:\.\d+)?)|([A-Za-z_]\w*)|'([^']*)'|(&&|\|\||<=|>=|==|!=|[-+*\/%<>!?:(),\[\]]))/y, m, pos = 0;
    while(pos < src.length){
      re.lastIndex = pos; m = re.exec(src);
      if(!m){ if(/^\s*$/.test(src.slice(pos))) break; throw new Error('expression illisible : ' + src); }
      pos = re.lastIndex;
      if(m[1] !== undefined) toks.push({ t:'n', v:parseFloat(m[1]) });
      else if(m[2] !== undefined) toks.push({ t:'i', v:m[2] });
      else if(m[3] !== undefined) toks.push({ t:'s', v:m[3] });
      else toks.push({ t:'o', v:m[4] });
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
      if(t.t === 'n' || t.t === 's') return function(){ return t.v; };
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

  // ---- SCÈNES : ce qui est dessiné. make(args) tire tout ce qui est aléatoire (une seule fois, à la génération) ;
  // draw(svg, données) dessine, sans rien tirer : redessiner = même image. exprs = paramètres lus comme
  // expressions, texts = paramètres lus comme textes à {trous}.
  function clampInt(v, lo, hi){ v = Math.floor(+v); return isNaN(v) ? lo : Math.max(lo, Math.min(hi, v)); }
  var SCENES = {
    equation: { exprs:[], texts:['text'],
      make:function(a){ return a; },
      draw:function(svg, d){ svg.appendChild(svgText(100,112,d.text.length>11 ? 24 : 34,d.text)); } },
    // plaques (100), barres (10), cubes (1) : « quel nombre est représenté ? »
    blocks: { exprs:['hu','te','un'], texts:[],
      make:function(a){ return { hu:clampInt(a.hu, 0, 20), te:clampInt(a.te, 0, 12), un:clampInt(a.un, 0, 30) }; },
      draw:function(svg, d){
        var hu = d.hu, te = d.te, un = d.un, i, j, s = 30, g = 3;
        for(i=0;i<hu;i++){
          var px = 8 + (i%5)*(s+g+3), py = 6 + Math.floor(i/5)*(s+g);
          svg.appendChild(el('rect',{x:px,y:py,width:s,height:s,fill:'var(--accent2)','fill-opacity':0.6,stroke:'var(--text)','stroke-width':2}));
          for(j=1;j<5;j++){
            svg.appendChild(el('line',{x1:px+j*s/5,y1:py,x2:px+j*s/5,y2:py+s,stroke:'var(--text)','stroke-width':0.5,'stroke-opacity':0.5}));
            svg.appendChild(el('line',{x1:px,y1:py+j*s/5,x2:px+s,y2:py+j*s/5,stroke:'var(--text)','stroke-width':0.5,'stroke-opacity':0.5}));
          }
        }
        var yb = hu>5 ? 82 : hu>0 ? 52 : 30;
        for(i=0;i<te;i++){
          var bx = 10 + i*13;
          svg.appendChild(el('rect',{x:bx,y:yb,width:10,height:90,fill:'var(--accent3)','fill-opacity':0.7,stroke:'var(--text)','stroke-width':1.5}));
          for(j=1;j<10;j++) svg.appendChild(el('line',{x1:bx,y1:yb+j*9,x2:bx+10,y2:yb+j*9,stroke:'var(--text)','stroke-width':0.6}));
        }
        for(i=0;i<un;i++) svg.appendChild(el('rect',{x:138+(i%3)*19,y:yb+4+Math.floor(i/3)*21,width:15,height:15,fill:'var(--accent)','fill-opacity':0.75,stroke:'var(--text)','stroke-width':1.5}));
      } },
    // n objets éparpillés sur une grille 4×4 (positions et petits décalages tirés une fois)
    scatter: { exprs:['n','icon'], texts:[],
      make:function(a){
        var cells = []; for(var i=0;i<16;i++) cells.push(i);
        var chosen = shuffle(cells).slice(0, clampInt(a.n, 0, 16));
        return { icon:a.icon, items: chosen.map(function(c){ return { c:c, dx:randInt(-6,6), dy:randInt(-4,4) }; }) };
      },
      draw:function(svg, d){ d.items.forEach(function(it){ svg.appendChild(svgText(28 + (it.c%4)*48 + it.dx, 52 + Math.floor(it.c/4)*44 + it.dy, 30, d.icon)); }); } },
    // droite graduée : nb graduations de pas `step` depuis `start`, une flèche « ? » à la graduation k
    numberline: { exprs:['start','step','nb','labelEvery','k'], texts:[],
      make:function(a){ var nb = clampInt(a.nb, 2, 20); return { start:a.start, step:a.step, nb:nb, labelEvery:clampInt(a.labelEvery, 1, nb), k:clampInt(a.k, 0, nb) }; },
      draw:function(svg, d){
        var x0 = 16, w = 168, y = 120, i;
        svg.appendChild(el('line',{x1:x0-6,y1:y,x2:x0+w+6,y2:y,stroke:'var(--text)','stroke-width':3,'stroke-linecap':'round'}));
        for(i=0;i<=d.nb;i++){
          var x = x0 + i*w/d.nb, big = i%d.labelEvery===0;
          svg.appendChild(el('line',{x1:x,y1:y-(big?11:7),x2:x,y2:y+(big?11:7),stroke:'var(--text)','stroke-width':big?3:2}));
          if(big) svg.appendChild(svgText(x, y+32, 15, String(d.start + i*d.step)));
        }
        var ax = x0 + d.k*w/d.nb;
        svg.appendChild(el('polygon',{points:(ax-10)+','+(y-52)+' '+(ax+10)+','+(y-52)+' '+ax+','+(y-14),fill:'var(--accent)',stroke:'var(--text)','stroke-width':2.5,'stroke-linejoin':'round'}));
        svg.appendChild(svgText(ax, y-60, 22, '?'));
      } },
    // rows × cols points
    grid: { exprs:['rows','cols'], texts:[],
      make:function(a){ return { rows:clampInt(a.rows, 1, 12), cols:clampInt(a.cols, 1, 12) }; },
      draw:function(svg, d){
        var r = d.rows, c = d.cols, gap = Math.min(30, 170/c, 170/r), x0 = 100 - (c-1)*gap/2, y0 = 100 - (r-1)*gap/2, i, j;
        for(i=0;i<r;i++) for(j=0;j<c;j++) svg.appendChild(el('circle',{cx:x0+j*gap,cy:y0+i*gap,r:Math.min(10,gap*0.36),fill:i%2 ? 'var(--accent2)' : 'var(--accent)',stroke:'var(--text)','stroke-width':1.8}));
      } },
    // une figure partagée en n parts égales dont k sont coloriées : disque (pie) ou bande (bar)
    fraction: { exprs:['n','k','shape'], texts:[],
      make:function(a){ var n = clampInt(a.n, 1, 12); return { n:n, k:clampInt(a.k, 0, n), shape:a.shape === 'bar' ? 'bar' : 'pie' }; },
      draw:function(svg, d){
        var fill = 'var(--accent)', off = 'var(--surface)', i, n = d.n;
        if(d.shape === 'pie'){
          var r = 75;
          for(i=0;i<n;i++){
            var a0 = -Math.PI/2 + i*2*Math.PI/n, a1 = -Math.PI/2 + (i+1)*2*Math.PI/n;
            var p = 'M 100 100 L '+(100+r*Math.cos(a0))+' '+(100+r*Math.sin(a0))+' A '+r+' '+r+' 0 0 1 '+(100+r*Math.cos(a1))+' '+(100+r*Math.sin(a1))+' Z';
            svg.appendChild(el('path',{d:p, fill:i<d.k ? fill : off, stroke:'var(--text)','stroke-width':2.5,'stroke-linejoin':'round'}));
          }
        } else {
          var w = 170, h = 85;
          for(i=0;i<n;i++) svg.appendChild(el('rect',{x:15+i*w/n, y:57.5, width:w/n, height:h, fill:i<d.k ? fill : off, stroke:'var(--text)','stroke-width':2.5}));
        }
      } },
    // une horloge à aiguilles : h (0 à 23, l'horloge ne montre que h mod 12) et m minutes
    clock: { exprs:['h','m'], texts:[],
      make:function(a){ return { h:clampInt(a.h, 0, 23), m:clampInt(a.m, 0, 59) }; },
      draw:function(svg, d){ drawClockFace(svg, angleToXY(((d.h%12) + d.m/60) * 30 - 90, 42), angleToXY((d.m/60)*360 - 90, 62)); } },
    // un gros emoji et une ligne de légende
    emoji: { exprs:['icon'], texts:['caption'],
      make:function(a){ return a; },
      draw:function(svg, d){ svg.appendChild(svgText(100,95,64,d.icon)); svg.appendChild(svgText(100,150,26,d.caption)); } }
  };

  // La scène d'une forme : `scene:{type:…}` ou, en raccourci, `eq:'texte'` (une équation écrite).
  function formScene(form){ return form.scene || { type:'equation', text:form.eq }; }
  var TEMPLATE_FICHES = {};
  var TEMPLATE_FNS = {};   // fonctions nommées utilisables dans les fiches (carry, explainAdd…), déclarées par fiches-calcul.js

  // Vérifie une fiche (erreur claire si elle est mal formée) : toutes les expressions se compilent,
  // tous les noms utilisés existent. Appelée à l'enregistrement.
  function validateFiche(f){
    function bad(msg){ throw new Error('fiche « ' + f.id + ' » : ' + msg); }
    ['id','domain','label','longLabel'].forEach(function(k){ if(!f[k]) bad('« ' + k + ' » manquant'); });
    if(!f.levels || f.levels.length !== 3) bad('3 niveaux attendus (Facile, Moyen, Difficile)');
    if(!f.forms || !f.forms.length) bad('aucune forme de question');
    f.forms.forEach(function(form, fi){
      var known = Object.create(null); known.level = 1; known.tries = 1;
      for(var bk in BANKS) known[bk] = 1;
      f.levels.forEach(function(p){ for(var k in p) known[k] = 1; });
      var vars = form.vars || {};
      try {
        for(var name in vars){ var need = {}; specIdents(vars[name], need); for(var n in need) if(!known[n] && !own(EXPR_FNS, n) && n.charAt(0) !== '(') bad('forme ' + fi + ' : « ' + n + ' » inconnu dans la variable ' + name); known[name] = 1; }
        var all = [].concat(form.where || [], form.answer, form.extras || [], form.w === undefined ? [] : [form.w]).map(compileExpr)
          .concat(['question','sub','explain'].map(function(k){ if(typeof form[k] !== 'string') bad('forme ' + fi + ' : « ' + k + ' » manquant'); return compileText(form[k]); }));
        if(form.wrong !== undefined) all.push(compileExpr(form.wrong));
        if(form.figures){
          var fg = form.figures, fdef = own(SCENES, fg.scene) ? SCENES[fg.scene] : null;
          if(!fdef || fdef.texts.length) bad('forme ' + fi + ' : « figures » : scène inconnue ou sans paramètres numériques « ' + fg.scene + ' »');
          if(typeof fg.items !== 'string') bad('forme ' + fi + ' : « figures.items » manquant');
          all.push(compileExpr(fg.items));
        }
        var sc = formScene(form), def = own(SCENES, sc.type) ? SCENES[sc.type] : null;
        if(!def) bad('forme ' + fi + ' : scène inconnue « ' + sc.type + ' »');
        def.exprs.forEach(function(k){ if(sc[k] === undefined) bad('forme ' + fi + ' : scène « ' + sc.type + ' » : « ' + k + ' » manquant'); all.push(compileExpr(sc[k])); });
        def.texts.forEach(function(k){ if(typeof sc[k] !== 'string') bad('forme ' + fi + ' : scène « ' + sc.type + ' » : « ' + k + ' » manquant'); all.push(compileText(sc[k])); });
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

  function genFromFiche(f, level, svgId){
    var params = f.levels[level], base = Object.create(null), k;
    base.level = level; base.__fns = TEMPLATE_FNS;
    for(k in BANKS) base[k] = BANKS[k];
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
    var sc = formScene(form), sdef = SCENES[sc.type], sargs = {};
    sdef.exprs.forEach(function(k){ sargs[k] = evalExpr(sc[k], env); });
    sdef.texts.forEach(function(k){ sargs[k] = compileText(sc[k])(env); });
    var sdata = sdef.make(sargs), choices, cols3 = false;
    if(form.figures){
      // « Quelle figure… ? » : items = liste de listes de paramètres de la scène, la première est la bonne ; ordre mélangé ici
      var fg = form.figures, fdef = SCENES[fg.scene], items = evalExpr(fg.items, env);
      choices = shuffle(items.map(function(args, i){
        var a = {}; fdef.exprs.forEach(function(k, j){ a[k] = args[j]; });
        var data = fdef.make(a);
        return { ok:i === 0, viewBox:'0 0 200 200', draw:function(svg){ fdef.draw(svg, data); } };
      })).map(function(c, i){ c.label = (fg.label || 'Figure') + ' ' + (i + 1); return c; });
    } else if(form.wrong){
      // réponses de texte : la bonne + la liste calculée de fausses réponses, mélangées
      var good = String(correct);
      choices = shuffle([good].concat(evalExpr(form.wrong, env).map(String))).map(function(l){ return { label:l, ok:l === good }; });
    } else if(form.options){
      cols3 = form.cols3 !== false;
      choices = form.options.map(function(l){ return { label:l, ok:l === correct }; });
    } else choices = numChoices(correct, extras);
    return {
      tag: f.tag || 'Calcul',
      question: compileText(form.question)(env),
      sub: compileText(form.sub)(env),
      explain: compileText(form.explain)(env),
      draw: function(){
        var svg = document.getElementById(svgId || 'm4Svg'); svg.setAttribute('viewBox','0 0 200 200'); svg.innerHTML = "";
        sdef.draw(svg, sdata);
      },
      cols3: cols3,
      choices: choices
    };
  }

  // Définition d'un type de Quizz à partir d'une fiche (validée) — sans l'enregistrer.
  function makeTemplateDef(f){
    validateFiche(f);
    return { id:f.id, domain:f.domain, label:f.label, longLabel:f.longLabel, defaultLevels:f.defaultLevels || [0,1,2],
      randomNote: templateNote(f), generate:function(level, svgId){ return genFromFiche(f, level, svgId); } };
  }
  function registerTemplateType(f){
    var def = makeTemplateDef(f);
    TEMPLATE_FICHES[f.id] = f;
    registerQuizType(def);
  }
