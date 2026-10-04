  /* ===================== ÉDITEUR D'ACTIVITÉS (parents et enseignants) =====================
     Crée des activités sans écrire de fichier : on choisit un modèle, on règle, on teste 20 questions, on enregistre.
     Les activités créées vivent dans UN paquet personnel (« perso.moi », « Mes activités ») : il passe par la même
     validation et le même branchement que n'importe quel paquet (paquets.js), donc il est aussi exportable.
     Quatre modèles : une table de multiplication, ajouter / retirer un nombre fixe, une activité du jeu reprise avec d'autres plages (gabarits), des questions écrites
     à la main (type « fixe »). Chaque activité garde ses réglages d'origine (`meta`) pour pouvoir être rouverte.
     La logique (editeurBuildAct, editeurApercu, editeurSave, editeurRemove) est séparée de l'écran (editeurUI). */

  var EDIT_PACK_ID = 'perso.moi';
  var EDIT_MODELES = [
    { id:'table',     label:'Une table de multiplication' },
    { id:'plusmoins', label:'Ajouter ou retirer un nombre' },
    { id:'fiche',     label:'Une activité du jeu, à ma façon' },
    { id:'libre',     label:'Mes propres questions' }
  ];
  // Activités du jeu qu'on peut reprendre en changeant la taille des nombres à chaque niveau.
  // param = réglage de niveau modifié ; lo/hi = bornes permises ; min(niveau) = plancher qui dépend des autres réglages du niveau.
  var EDIT_BASES = [
    { id:'calc',         param:'max', lo:3, hi:100 },
    { id:'soustraction', param:'aHi', lo:5, hi:100, min:function(l){ return l.aLo + 2; } },
    { id:'doubleMoitie', param:'hi',  lo:2, hi:100 },
    { id:'compare',      param:'hi',  lo:10, hi:999, min:function(l){ return l.lo + 5; } }
  ];
  var NIVEAU_NOMS = ['Facile', 'Moyen', 'Difficile'];

  function editeurInt(v, lo, hi){ var n = Number(v); return (typeof v !== 'object' && String(v).trim() !== '' && Number.isInteger(n) && n >= lo && n <= hi) ? n : null; }
  function editeurSlug(label){
    var s = String(label).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 30).replace(/-+$/, '');
    return s || 'activite';
  }
  function editeurActs(){ var e = packFind(EDIT_PACK_ID); return e ? e.pack.activites.slice() : []; }
  function editeurFreeId(label){
    var base = editeurSlug(label), ids = editeurActs().map(function(a){ return a.id; }), id = base, k = 2;
    while(ids.indexOf(id) !== -1) id = base.slice(0, 36) + '-' + (k++);
    return id;
  }

  // Construit une activité de paquet à partir des réglages de l'écran.
  // v : { label, domain, niveaux:[0,1,2], p:[nombres…], icone, questions:[{q, bonne, fausses:[…], explication}] }
  // Renvoie { act } ou { erreur } (message en français).
  function editeurBuildAct(modele, v, id){
    var niveaux = (v.niveaux || []).filter(function(n){ return n === 0 || n === 1 || n === 2; });
    if(!niveaux.length) return { erreur:'Coche au moins un niveau.' };
    var act = { id:id, label:String(v.label || '').trim(), domain:v.domain || 'calcul', niveaux:niveaux };
    var p = v.p || [];
    if(modele === 'table'){
      var T = editeurInt(p[0], 2, 12), mx = [editeurInt(p[1], 2, 20), editeurInt(p[2], 2, 20), editeurInt(p[3], 2, 20)];
      if(T === null) return { erreur:'La table doit être un nombre de 2 à 12.' };
      if(mx.indexOf(null) !== -1) return { erreur:'Les « jusqu\'à × » doivent être des nombres de 2 à 20.' };
      if(!(mx[0] <= mx[1] && mx[1] <= mx[2])) return { erreur:'Les « jusqu\'à × » doivent grandir de Facile à Difficile.' };
      act.type = 'gabarit'; act.label = act.label || 'Table de ' + T; act.meta = { modele:modele, p:[T].concat(mx) };
      act.fiche = {
        levels:mx.map(function(m){ return { maxN:m }; }),
        forms:[{ vars:{ n:{ int:[1, 'maxN'] }, r:T + '*n' }, answer:'r', extras:['r+' + T, 'r-' + T, 'r+1', 'r-1'],
          question:'Combien font ' + T + ' × {n} ?', sub:'Utilise la table de ' + T + '.', explain:T + ' × {n} = {r}.', eq:T + ' × {n} = ?' }],
        note:'La table de ' + T + ' jusqu\'à ' + T + ' × {maxN0} en Facile, ' + T + ' × {maxN1} en Moyen, ' + T + ' × {maxN2} en Difficile.' };
    } else if(modele === 'plusmoins'){
      var sens = editeurInt(p[0], 0, 1), K = editeurInt(p[1], 1, 99), hi = [editeurInt(p[2], 3, 100), editeurInt(p[3], 3, 100), editeurInt(p[4], 3, 100)];
      if(sens === null) return { erreur:'Choisis « Ajouter » ou « Retirer ».' };
      if(K === null) return { erreur:'Le nombre à ajouter ou retirer doit être de 1 à 99.' };
      if(hi.indexOf(null) !== -1) return { erreur:'Les « nombres jusqu\'à » doivent être de 3 à 100.' };
      if(!(hi[0] <= hi[1] && hi[1] <= hi[2])) return { erreur:'Les « nombres jusqu\'à » doivent grandir de Facile à Difficile.' };
      var plus = sens === 0, sign = plus ? '+' : '-';
      act.type = 'gabarit'; act.label = act.label || (plus ? 'Ajouter ' : 'Retirer ') + K; act.meta = { modele:modele, p:[sens, K].concat(hi) };
      act.fiche = {
        levels:hi.map(function(h){ return { hi:h }; }),
        forms:[{ vars:{ n:plus ? { int:[1, 'hi'] } : { int:[K + 1, 'hi+' + K] }, r:'n' + sign + K }, answer:'r', extras:['r+10', 'r-10', 'r+1', 'r-1'],
          question:'Combien font {n} ' + sign + ' ' + K + ' ?', sub:plus ? 'Ajoute ' + K + '.' : 'Retire ' + K + '.',
          explain:'{n} ' + sign + ' ' + K + ' = {r}.', eq:'{n} ' + sign + ' ' + K + ' = ?' }],
        note:(plus ? 'On ajoute ' : 'On retire ') + K + ' à un nombre. Facile : nombres jusqu\'à {hi0} ; Moyen : jusqu\'à {hi1} ; Difficile : jusqu\'à {hi2}.' };
    } else if(modele === 'fiche'){
      var bi = editeurInt(p[0], 0, EDIT_BASES.length - 1);
      if(bi === null) return { erreur:'Choisis l\'activité de départ.' };
      var B = EDIT_BASES[bi], F = TEMPLATE_FICHES[B.id], vv = [editeurInt(p[1], 1, 999), editeurInt(p[2], 1, 999), editeurInt(p[3], 1, 999)];
      if(vv.indexOf(null) !== -1) return { erreur:'Écris un nombre pour chaque niveau.' };
      for(var li = 0; li < 3; li++){
        var plancher = Math.max(B.lo, B.min ? B.min(F.levels[li]) : 0);
        if(vv[li] < plancher || vv[li] > B.hi) return { erreur:'En ' + NIVEAU_NOMS[li] + ' : un nombre de ' + plancher + ' à ' + B.hi + '.' };
      }
      if(!(vv[0] <= vv[1] && vv[1] <= vv[2])) return { erreur:'Les nombres doivent grandir de Facile à Difficile.' };
      var fiche = JSON.parse(JSON.stringify({ tag:F.tag, levels:F.levels, forms:F.forms, note:F.note }));
      fiche.levels.forEach(function(l, i){ l[B.param] = vv[i]; });
      act.type = 'gabarit'; act.label = act.label || F.label + ' à ma façon'; act.fiche = fiche; act.meta = { modele:modele, p:[bi].concat(vv) };
    } else if(modele === 'libre'){
      if(!act.label) return { erreur:'Donne un titre à ton activité.' };
      var qs = [];
      for(var i = 0; i < (v.questions || []).length; i++){
        var q = v.questions[i], bonne = String(q.bonne || '').trim(), fa = (q.fausses || []).map(function(f){ return String(f).trim(); }).filter(Boolean);
        if(!String(q.q || '').trim()) return { erreur:'Question ' + (i + 1) + ' : écris l\'énoncé.' };
        if(!bonne) return { erreur:'Question ' + (i + 1) + ' : écris la bonne réponse.' };
        if(!fa.length) return { erreur:'Question ' + (i + 1) + ' : écris au moins une mauvaise réponse.' };
        if(new Set([bonne].concat(fa)).size !== fa.length + 1) return { erreur:'Question ' + (i + 1) + ' : deux réponses sont identiques.' };
        qs.push({ q:String(q.q).trim(), bonnes:[bonne], fausses:fa, explication:String(q.explication || '').trim() });
      }
      if(!qs.length) return { erreur:'Écris au moins une question.' };
      act.type = 'fixe'; act.tirage = 'sans remise'; act.icone = String(v.icone || '').trim() || '❓'; act.questions = qs; act.meta = { modele:modele, p:[] };
    } else return { erreur:'Modèle inconnu.' };
    return { act:act };
  }

  // Aperçu : 20 questions (au plus, une fois chacune pour les questions écrites à la main) au niveau lv.
  // Renvoie { erreurs } ou { questions:[{ q, bonne, autres, explication }] }. Rien n'est enregistré.
  function editeurApercu(act, lv){
    var r = packValidate({ format:'kvb-pack', formatVersion:1, id:'perso.apercu', version:1, titre:'Aperçu', activites:[act] });
    if(!r.pack) return { erreurs:r.erreurs };
    var def = r.defs[0], n = act.type === 'fixe' ? Math.min(20, act.questions.length) : 20;
    var out = withSeed(2024, function(){
      var l = [];
      for(var i = 0; i < n; i++){
        var g = def.generate(lv);
        l.push({ q:g.question, bonne:g.choices.filter(function(c){ return c.ok; })[0].label,
                 autres:g.choices.filter(function(c){ return !c.ok; }).map(function(c){ return c.label; }), explication:g.explain });
      }
      return l;
    });
    return { questions:out };
  }

  // Enregistre (ajoute ou remplace) une activité dans le paquet personnel.
  function editeurSave(act){
    var e = packFind(EDIT_PACK_ID), acts = editeurActs(), pos = -1;
    acts.forEach(function(a, i){ if(a.id === act.id) pos = i; });
    if(pos === -1) acts.push(act); else acts[pos] = act;
    var r = packInstall({ format:'kvb-pack', formatVersion:1, id:EDIT_PACK_ID, version:e ? e.pack.version + 1 : 1, titre:'Mes activités', auteur:'', activites:acts });
    if(r.ok){ if(e && !e.actif) packSetActive(EDIT_PACK_ID, true); packsUIRefresh(); }
    return r;
  }
  function editeurRemove(id){
    var e = packFind(EDIT_PACK_ID); if(!e) return;
    var acts = e.pack.activites.filter(function(a){ return a.id !== id; });
    if(!acts.length) packRemove(EDIT_PACK_ID);
    else packInstall({ format:'kvb-pack', formatVersion:1, id:EDIT_PACK_ID, version:e.pack.version + 1, titre:'Mes activités', auteur:'', activites:acts });
    packsUIRefresh();
  }

  // ---- écran (dans Réglages, derrière le code adulte) ----
  (function editeurUI(){
    var newBtn = document.getElementById('edit-new-btn'), listEl = document.getElementById('edit-list'), formEl = document.getElementById('edit-form');
    if(!newBtn || !listEl || !formEl) return;
    var cur = null;      // { modele, id|null }

    function el(tag, props, kids){
      var x = document.createElement(tag);
      Object.keys(props || {}).forEach(function(k){ if(k === 'text') x.textContent = props[k]; else if(k === 'cls') x.className = props[k]; else x.setAttribute(k, props[k]); });
      (kids || []).forEach(function(c){ x.appendChild(c); });
      return x;
    }
    function field(id, label, input){ var w = el('div', { cls:'ed-field' }); w.appendChild(el('label', { 'for':id, text:label })); input.id = id; w.appendChild(input); return w; }
    function num(id, label, val, lo, hi){ var i = el('input', { type:'number', inputmode:'numeric', min:lo, max:hi }); i.value = val; return field(id, label, i); }
    function btn(id, text, fn, cls){ var b = el('button', { type:'button', cls:'btn ' + (cls || 'ghost'), text:text }); b.id = id; b.addEventListener('click', fn); return b; }
    function val(id){ var x = document.getElementById(id); return x ? x.value : ''; }

    function renderList(){
      listEl.innerHTML = '';
      editeurActs().forEach(function(a){
        var li = el('li', { cls:'pack-item' });
        li.appendChild(el('div', { cls:'pack-title', text:a.label + ' · ' + (DOMAINS.filter(function(d){ return d.id === a.domain; })[0] || {}).short }));
        var row = el('div', { cls:'btn-row' });
        row.appendChild(btn('', '✏️ Modifier', function(){ open(a.meta ? a.meta.modele : 'libre', a); }));
        row.appendChild(btn('', '🗑 Supprimer', function(){ editeurRemove(a.id); say('Activité supprimée : « ' + a.label + ' ».'); renderList(); }));
        row.querySelectorAll('button')[0].className += ' ed-modify'; row.querySelectorAll('button')[1].className += ' ed-delete';
        li.appendChild(row); listEl.appendChild(li);
      });
    }
    var msgEl = document.getElementById('edit-msg');
    function say(m){ if(msgEl) msgEl.textContent = m; }

    function questionBlock(q, i){
      var box = el('fieldset', { cls:'ed-question' });
      box.appendChild(el('legend', { text:'Question ' + (i + 1) }));
      function inp(cls, label, v, max){ var x = el('input', { type:'text', maxlength:max, cls:cls }); x.value = v || ''; var id = 'ed-' + cls + '-' + i; return field(id, label, x); }
      box.appendChild(inp('q', 'Énoncé', q.q, 300));
      box.appendChild(inp('bonne', 'Bonne réponse', q.bonne, 60));
      for(var k = 0; k < 3; k++) box.appendChild(inp('fausse' + k, 'Mauvaise réponse ' + (k + 1) + (k ? ' (facultatif)' : ''), (q.fausses || [])[k], 60));
      box.appendChild(inp('expl', 'Explication (facultatif)', q.explication, 400));
      var rm = btn('', '🗑 Retirer cette question', function(){ box.remove(); renumber(); }); rm.className += ' ed-q-remove'; box.appendChild(rm);
      return box;
    }
    function renumber(){
      var qs = formEl.querySelectorAll('.ed-question');
      qs.forEach(function(b, i){ b.querySelector('legend').textContent = 'Question ' + (i + 1); });
    }

    function open(modele, act){
      cur = { modele:modele, id:act ? act.id : null };
      var p = act && act.meta ? act.meta.p : null;
      formEl.innerHTML = ''; formEl.hidden = false; say('');
      formEl.appendChild(el('h3', { text:(act ? 'Modifier : ' : 'Nouvelle activité : ') + EDIT_MODELES.filter(function(m){ return m.id === modele; })[0].label }));
      var t = el('input', { type:'text', maxlength:60 }); t.value = act ? act.label : '';
      formEl.appendChild(field('ed-label', 'Titre' + (modele === 'libre' ? '' : ' (facultatif)'), t));
      var dom = el('select', {}); DOMAINS.forEach(function(d){ var o = el('option', { value:d.id, text:d.icon + ' ' + d.label }); dom.appendChild(o); });
      dom.value = act ? act.domain : (modele === 'libre' ? 'logique' : 'calcul');
      formEl.appendChild(field('ed-domain', 'Thème', dom));
      var lv = el('fieldset', { cls:'ed-levels' }); lv.appendChild(el('legend', { text:'Niveaux où l\'activité apparaît' }));
      ['Facile', 'Moyen', 'Difficile'].forEach(function(nm, k){
        var c = el('input', { type:'checkbox', id:'ed-niv' + k }); c.checked = act ? act.niveaux.indexOf(k) !== -1 : true;
        var lab = el('label', { 'for':'ed-niv' + k, cls:'ed-check' }); lab.appendChild(c); lab.appendChild(document.createTextNode(' ' + nm)); lv.appendChild(lab);
      });
      formEl.appendChild(lv);
      var box = el('div', { id:'ed-fields' });
      if(modele === 'table'){
        p = p || [7, 5, 8, 10];
        box.appendChild(num('ed-p0', 'Table de', p[0], 2, 12));
        ['Facile', 'Moyen', 'Difficile'].forEach(function(nm, k){ box.appendChild(num('ed-p' + (k + 1), 'Jusqu\'à × … en ' + nm, p[k + 1], 2, 20)); });
      } else if(modele === 'fiche'){
        var bases = EDIT_BASES.map(function(b){ return TEMPLATE_FICHES[b.id]; });
        p = p || [0].concat(bases[0].levels.map(function(l){ return l[EDIT_BASES[0].param]; }));
        var sb = el('select', {}); bases.forEach(function(f, i){ sb.appendChild(el('option', { value:String(i), text:f.label })); }); sb.value = String(p[0]);
        box.appendChild(field('ed-p0', 'Activité de départ', sb));
        [1, 2, 3].forEach(function(j){ box.appendChild(num('ed-p' + j, 'Nombres jusqu\'à … en ' + NIVEAU_NOMS[j - 1], p[j], 1, 999)); });
        sb.addEventListener('change', function(){      // on repart des réglages d'origine de l'activité choisie
          var bb = EDIT_BASES[+sb.value], ff = TEMPLATE_FICHES[bb.id];
          [1, 2, 3].forEach(function(j){ document.getElementById('ed-p' + j).value = ff.levels[j - 1][bb.param]; });
        });
      } else if(modele === 'plusmoins'){
        p = p || [0, 5, 10, 20, 50];
        var s = el('select', {}); s.appendChild(el('option', { value:'0', text:'Ajouter' })); s.appendChild(el('option', { value:'1', text:'Retirer' })); s.value = String(p[0]);
        box.appendChild(field('ed-p0', 'Opération', s));
        box.appendChild(num('ed-p1', 'Le nombre', p[1], 1, 99));
        ['Facile', 'Moyen', 'Difficile'].forEach(function(nm, k){ box.appendChild(num('ed-p' + (k + 2), 'Nombres jusqu\'à … en ' + nm, p[k + 2], 3, 100)); });
      } else {
        var ic = el('input', { type:'text', maxlength:4 }); ic.value = act ? act.icone : '❓';
        box.appendChild(field('ed-icone', 'Image (un emoji)', ic));
        var qs = el('div', { id:'ed-questions' });
        (act ? act.questions : [{}]).forEach(function(q, i){
          qs.appendChild(questionBlock({ q:q.q, bonne:q.bonnes ? q.bonnes[0] : '', fausses:q.fausses, explication:q.explication }, i));
        });
        box.appendChild(qs);
        box.appendChild(btn('ed-add-q', '➕ Ajouter une question', function(){
          var n = qs.querySelectorAll('.ed-question').length;
          if(n >= 40){ say('40 questions au plus par activité.'); return; }
          qs.appendChild(questionBlock({}, n)); }));
      }
      formEl.appendChild(box);
      var sel = el('select', {}); ['Facile', 'Moyen', 'Difficile'].forEach(function(nm, k){ sel.appendChild(el('option', { value:String(k), text:nm })); });
      var tr = el('div', { cls:'btn-row' });
      tr.appendChild(btn('ed-test', '🔍 Tester 20 questions', test));
      tr.appendChild(btn('ed-save', '💾 Enregistrer', save, 'primary'));
      tr.appendChild(btn('ed-cancel', 'Annuler', close));
      formEl.appendChild(field('ed-test-level', 'Tester au niveau', sel));
      formEl.appendChild(tr);
      formEl.appendChild(el('p', { id:'ed-msg2', cls:'muted settings-hint', role:'alert' }));
      formEl.appendChild(el('ol', { id:'ed-preview', cls:'ed-preview' }));
      t.focus();
    }
    function close(){ formEl.hidden = true; formEl.innerHTML = ''; cur = null; newBtn.focus(); }   // le clavier reprend là où il était
    function say2(m){ var x = document.getElementById('ed-msg2'); if(x) x.textContent = m; }

    function read(){
      var v = { label:val('ed-label'), domain:val('ed-domain'), niveaux:[0, 1, 2].filter(function(k){ return document.getElementById('ed-niv' + k).checked; }), p:[], questions:[] };
      for(var i = 0; document.getElementById('ed-p' + i); i++) v.p.push(val('ed-p' + i));
      if(cur.modele === 'libre'){
        v.icone = val('ed-icone');
        formEl.querySelectorAll('.ed-question').forEach(function(b){
          v.questions.push({ q:b.querySelector('input.q').value, bonne:b.querySelector('input.bonne').value,
            fausses:[0, 1, 2].map(function(k){ return b.querySelector('input.fausse' + k).value; }), explication:b.querySelector('input.expl').value });
        });
      }
      return v;
    }
    function build(){ return editeurBuildAct(cur.modele, read(), cur.id || editeurFreeId(val('ed-label') || (cur.modele === 'table' ? 'table ' + val('ed-p0') : cur.modele === 'plusmoins' ? (val('ed-p0') === '1' ? 'retirer ' : 'ajouter ') + val('ed-p1') : ''))); }

    function test(){
      var b = build(), pv = document.getElementById('ed-preview'); pv.innerHTML = ''; say2('');
      if(b.erreur){ say2(b.erreur); return; }
      var lv = Number(val('ed-test-level'));
      if(b.act.niveaux.indexOf(lv) === -1) lv = b.act.niveaux[0];
      var r = editeurApercu(b.act, lv);
      if(r.erreurs){ say2('Cette activité n\'est pas valide : ' + r.erreurs.join(' — ')); return; }
      say2(r.questions.length + ' question' + (r.questions.length > 1 ? 's' : '') + ' d\'essai (niveau ' + ['Facile', 'Moyen', 'Difficile'][lv] + ') : vérifie les réponses avant d\'enregistrer.');
      r.questions.forEach(function(q){
        var li = el('li', { cls:'ed-prev-item' });
        li.appendChild(el('div', { cls:'ed-prev-q', text:q.q }));
        li.appendChild(el('div', { cls:'ed-prev-a', text:'✔ ' + q.bonne + '   ✘ ' + q.autres.join(' · ') }));
        pv.appendChild(li);
      });
    }
    function save(){
      var b = build(); say2('');
      if(b.erreur){ say2(b.erreur); return; }
      var r = editeurSave(b.act);
      if(!r.ok){ say2(r.message); return; }
      say('Activité enregistrée : « ' + b.act.label + ' ». Elle apparaît dans « Configurer les activités ».');
      close(); renderList();
    }

    newBtn.addEventListener('click', function(){
      formEl.innerHTML = ''; formEl.hidden = false; cur = null;
      formEl.appendChild(el('p', { text:'Quel genre d\'activité ?' }));
      var row = el('div', { cls:'btn-row' });
      EDIT_MODELES.forEach(function(m){ var b = btn('', m.label, function(){ open(m.id); }); b.className += ' ed-modele ed-modele-' + m.id; row.appendChild(b); });
      formEl.appendChild(row);
      formEl.appendChild(btn('ed-cancel', 'Annuler', close));
    });
    renderList();
    var prev = packsUIRefresh; packsUIRefresh = function(){ prev(); renderList(); };
  })();
