  /* ===================== PAQUETS D'ACTIVITÉS =====================
     Un paquet est un fichier JSON autonome (« kvb-pack ») qui apporte des activités au jeu sans toucher
     au code : des gabarits (une fiche, voir gabarits.js) et des questions fixes (écrites à la main).
     Un paquet ne contient JAMAIS de code : uniquement des données et des expressions arithmétiques évaluées
     par notre évaluateur ; les textes sont posés avec textContent. Il est validé en entier à l'installation
     (structure, bornes, 200 tirages d'essai par niveau : une seule bonne réponse, propositions distinctes…) ;
     s'il est refusé, le message dit pourquoi, en français.

     Fournisseur (PackSource) : { list(), save(entrée), remove(id) }. Aujourd'hui « appareil » = localStorage. Il n'y a PAS
     d'écran pour importer ou créer un paquet pour l'instant (retiré des Réglages, voir HISTORIQUE §66) : le moteur reste
     (installer, activer, retirer par code ; testé par pack_check.js) pour y revenir sans tout réécrire.

     Identifiants : une activité de paquet s'appelle `custom:<paquet>/<activité>` (jamais en collision avec les
     types intégrés ; l'historique de progression est rangé par cet identifiant). */

  var PACK_LIMITS = { octets:300000, activites:40, questions:300, texte:400, expr:300, essais:200 };
  var PACK_STORAGE_KEY = 'geo_packs';
  var PACKS = [];            // paquets installés : { pack, actif, defs, erreur }

  // ---- fournisseur « appareil » ----
  var packSourceAppareil = {
    read:function(){ try { return JSON.parse(localStorage.getItem(PACK_STORAGE_KEY) || '{}') || {}; } catch(e){ return {}; } },
    list:function(){ var o = this.read(); return Object.keys(o).map(function(k){ return o[k]; }); },
    save:function(entry){
      var o = this.read(); o[entry.pack.id] = { pack:entry.pack, actif:entry.actif };
      try { localStorage.setItem(PACK_STORAGE_KEY, JSON.stringify(o)); return true; } catch(e){ return false; }
    },
    remove:function(id){ var o = this.read(); delete o[id]; try { localStorage.setItem(PACK_STORAGE_KEY, JSON.stringify(o)); } catch(e){} }
  };

  // ---- validation ----
  function packIsStr(v, min, max){ return typeof v === 'string' && v.length >= min && v.length <= max; }
  function packIsObj(v){ return v && typeof v === 'object' && !Array.isArray(v); }
  var PACK_ID_RE = /^[a-z0-9][a-z0-9._-]{1,59}$/, ACT_ID_RE = /^[a-z0-9][a-z0-9-]{0,39}$/, PARAM_RE = /^[A-Za-z_]\w{0,19}$/;
  var PACK_RESERVED = { level:1, tries:1, __fns:1, __proto__:1, constructor:1, prototype:1 };

  // Forme d'une fiche de gabarit venue d'un paquet (le sens — noms, syntaxe, scènes — est ensuite vérifié par validateFiche).
  function packCheckFiche(f, err){
    if(!packIsObj(f.levels) && !Array.isArray(f.levels)){ err('« levels » : 3 réglages de niveau attendus'); return; }
    if(f.levels.length !== 3) err('« levels » : 3 niveaux attendus (Facile, Moyen, Difficile)');
    f.levels.forEach(function(p, i){
      if(!packIsObj(p)){ err('niveau ' + i + ' : un objet de réglages est attendu'); return; }
      Object.keys(p).forEach(function(k){
        var v = p[k];
        if(!PARAM_RE.test(k) || PACK_RESERVED[k]) err('niveau ' + i + ' : nom de réglage « ' + k + ' » interdit');
        var okV = function(x){ return typeof x === 'number' && isFinite(x) || packIsStr(x, 0, PACK_LIMITS.texte); };
        if(!(okV(v) || Array.isArray(v) && v.length <= 60 && v.every(okV))) err('niveau ' + i + ' : réglage « ' + k + ' » invalide');
      });
    });
    if(!Array.isArray(f.forms) || f.forms.length < 1 || f.forms.length > 20) err('« forms » : de 1 à 20 formes de question');
    (f.forms || []).forEach(function(form, fi){
      if(!packIsObj(form)){ err('forme ' + fi + ' invalide'); return; }
      var strs = [form.w, form.answer, form.question, form.sub, form.explain, form.eq, form.wrong].concat(form.where || [], form.extras || [], form.options || []);
      if(strs.some(function(x){ return x !== undefined && (typeof x !== 'string' && typeof x !== 'number' || String(x).length > PACK_LIMITS.expr * 2); })) err('forme ' + fi + ' : texte ou expression trop long');
      if(JSON.stringify(form).length > 6000) err('forme ' + fi + ' : trop longue');
      if(form.vars !== undefined && (!packIsObj(form.vars) || Object.keys(form.vars).length > 14 || Object.keys(form.vars).some(function(k){ return !PARAM_RE.test(k) || PACK_RESERVED[k]; }))) err('forme ' + fi + ' : variables invalides');
      if(form.figures !== undefined && (!packIsObj(form.figures) || !packIsStr(form.figures.scene, 1, 20) || !packIsStr(form.figures.items, 1, PACK_LIMITS.expr) || form.figures.label !== undefined && !packIsStr(form.figures.label, 0, 30))) err('forme ' + fi + ' : « figures » invalide');
      if(form.where !== undefined && (!Array.isArray(form.where) || form.where.length > 8)) err('forme ' + fi + ' : « where » invalide');
      if(form.extras !== undefined && (!Array.isArray(form.extras) || form.extras.length > 10)) err('forme ' + fi + ' : « extras » invalide');
      if(form.options !== undefined && (!Array.isArray(form.options) || form.options.length < 2 || form.options.length > 4 || form.options.some(function(o){ return !packIsStr(o, 1, 30); }))) err('forme ' + fi + ' : « options » : de 2 à 4 réponses courtes');
    });
    if(f.note !== undefined && !packIsStr(f.note, 0, 600)) err('« note » trop longue');
  }

  // Patron dessiné en cases : lignes séparées par « / », « X » = case, « . » = vide (ex. « .X../XXXX/.X.. »).
  // Au plus 6 colonnes × 5 lignes, de 2 à 10 cases qui se touchent par un côté. Renvoie un message ou null.
  var PACK_GRID_RE = /^[.X]{1,6}(\/[.X]{1,6}){0,4}$/;
  function packGridCheck(g){
    if(typeof g !== 'string' || !PACK_GRID_RE.test(g)) return 'le patron doit tenir dans une grille de 6 colonnes sur 5 lignes (lignes séparées par « / », « X » pour une case, « . » pour du vide).';
    var cells = [];
    g.split('/').forEach(function(line, r){ for(var c = 0; c < line.length; c++) if(line[c] === 'X') cells.push(r + ',' + c); });
    if(cells.length < 2 || cells.length > 10) return 'le patron doit avoir de 2 à 10 cases.';
    var seen = {}, queue = [cells[0]]; seen[cells[0]] = true;
    for(var q = 0; q < queue.length; q++){
      var rc = queue[q].split(','), r0 = +rc[0], c0 = +rc[1];
      [[1,0],[-1,0],[0,1],[0,-1]].forEach(function(d){ var k = (r0 + d[0]) + ',' + (c0 + d[1]); if(cells.indexOf(k) !== -1 && !seen[k]){ seen[k] = true; queue.push(k); } });
    }
    return queue.length === cells.length ? null : 'les cases doivent se toucher par un côté (un seul morceau).';
  }

  // Questions d'essai : un tirage est refusé s'il n'est pas jouable.
  function packCheckQuestion(q, where){
    if(!q || typeof q !== 'object') return where + ' : pas de question';
    if(!packIsStr(q.question, 1, 400) || /undefined|NaN|\[object/.test(q.question + q.explain + q.sub)) return where + ' : texte vide ou invalide (« ' + String(q.question).slice(0, 40) + ' »)';
    if(!Array.isArray(q.choices) || q.choices.length < 2 || q.choices.length > 4) return where + ' : il faut de 2 à 4 propositions';
    var labels = q.choices.map(function(c){ return c.label; });
    if(labels.some(function(l){ return !packIsStr(l, 1, 60); })) return where + ' : proposition vide ou trop longue';
    if(new Set(labels).size !== labels.length) return where + ' : deux propositions identiques (' + String(q.question).slice(0, 40) + ')';
    if(q.choices.filter(function(c){ return c.ok; }).length !== 1) return where + ' : il n\'y a pas exactement une bonne réponse (' + String(q.question).slice(0, 40) + ')';
    if(typeof q.draw !== 'function') return where + ' : pas de dessin';
    return null;
  }

  // Construit les définitions de types de Quizz d'un paquet ; renvoie { defs, erreurs }.
  function packBuild(pack){
    var errs = [], defs = [];
    pack.activites.forEach(function(act){
      var id = 'custom:' + pack.id + '/' + act.id, where = '« ' + act.label + ' »';
      var def;
      try {
        if(act.type === 'patron'){
          def = packPatronDef(id, act, pack);
        } else if(act.type === 'fixe'){
          def = packFixeDef(id, act, pack);
        } else {
          var fiche = JSON.parse(JSON.stringify(act.fiche));
          fiche.id = id; fiche.domain = act.domain; fiche.label = act.label; fiche.longLabel = act.label;
          fiche.defaultLevels = act.niveaux; fiche.note = fiche.note || 'Activité du paquet « ' + pack.titre + ' ».';
          def = makeTemplateDef(fiche);
          if(/undefined|NaN/.test(def.randomNote)) throw new Error('la note de réglage cite un réglage inexistant');
          def.__fiche = fiche;
        }
      } catch(e){ errs.push(where + ' : ' + e.message); return; }
      // essais : pour chaque niveau activé, tirages à graine (reproductibles) ; un seul défaut suffit à refuser
      for(var k = 0; k < act.niveaux.length && !errs.length && !def.obj; k++){
        var lv = act.niveaux[k];
        for(var i = 0; i < PACK_LIMITS.essais; i++){
          var msg = null;
          try { msg = packCheckQuestion(withSeed(1000 + i * 7919 + lv, function(){ return def.generate(lv); }), where + ' (niveau ' + (lv + 1) + ')'); }
          catch(e){ msg = where + ' (niveau ' + (lv + 1) + ') : ' + e.message; }
          if(msg){ errs.push(msg); break; }
        }
      }
      def.pack = pack.id; def.packTitre = pack.titre;
      defs.push(def);
    });
    return { defs:defs, erreurs:errs };
  }

  // Activité « patron » : un patron de cube dessiné en cases ; le moteur 3D (patron3d.js) calcule lui-même s'il se referme.
  // Elle rejoint la famille « Patron → Solide » (NET_DEFS, groupe « Mes patrons »).
  function packPatronDef(id, act, pack){
    var net = makeNet(id, gridPolys(act.grille), { solid:'cube' });
    return { id:id, group:'perso', label:act.label, defaultLevels:act.niveaux, obj:net, randomNote:netNote(net), domain:'solides' };
  }

  // Activité « questions fixes » : liste écrite à la main, tirage sans remise, réponses mélangées par le jeu.
  function packFixeDef(id, act, pack){
    var qs = act.questions;
    return { id:id, domain:act.domain, label:act.label, longLabel:act.label, defaultLevels:act.niveaux,
      randomNote:'Questions écrites à la main (' + qs.length + '), tirées sans répétition tant qu\'on ne les a pas toutes vues. Paquet « ' + pack.titre + ' ».',
      generate:function(){
        var q = pickFresh(id, qs);
        var bonne = q.bonnes[0], opts = shuffle([bonne].concat(q.fausses));
        return { tag:act.label, question:q.q, sub:'Choisis la bonne réponse.',
          explain:q.explication || ('La bonne réponse est : ' + bonne + '.'),
          draw:function(){
            var svg = document.getElementById('m4Svg'); svg.setAttribute('viewBox','0 0 200 200'); svg.innerHTML = "";
            svg.appendChild(svgText(100,125,72,q.icone || act.icone || '❓'));
          },
          cols3:false, choices:opts.map(function(l){ return { label:l, ok:l === bonne }; }) };
      } };
  }

  // Valide et nettoie un paquet lu depuis du JSON ; renvoie { erreurs:[…], pack:nettoyé|null, defs }.
  function packValidate(raw){
    var errs = [];
    function err(m){ errs.push(m); }
    if(!packIsObj(raw)) return { erreurs:['Ce fichier n\'est pas un paquet d\'activités.'], pack:null };
    if(raw.format !== 'kvb-pack') return { erreurs:['Ce fichier n\'est pas un paquet d\'activités (format « kvb-pack » attendu).'], pack:null };
    if(raw.formatVersion !== 1) return { erreurs:['Version de format non prise en charge : ' + raw.formatVersion + ' (ce jeu lit la version 1).'], pack:null };
    if(!PACK_ID_RE.test(raw.id || '')) err('« id » du paquet : lettres minuscules, chiffres, point, tiret (2 à 60 caractères).');
    if(!(Number.isInteger(raw.version) && raw.version >= 1 && raw.version < 100000)) err('« version » : un entier à partir de 1.');
    if(!packIsStr(raw.titre, 1, 80)) err('« titre » : de 1 à 80 caractères.');
    if(raw.auteur !== undefined && !packIsStr(raw.auteur, 0, 60)) err('« auteur » : 60 caractères au plus.');
    if(!Array.isArray(raw.activites) || raw.activites.length < 1 || raw.activites.length > PACK_LIMITS.activites) err('« activites » : de 1 à ' + PACK_LIMITS.activites + ' activités.');
    var pack = { format:'kvb-pack', formatVersion:1, id:raw.id, version:raw.version, titre:raw.titre, auteur:raw.auteur || '', activites:[] };
    var seen = {}, domains = DOMAINS.map(function(d){ return d.id; });
    (Array.isArray(raw.activites) ? raw.activites : []).forEach(function(a, ai){
      var w = 'Activité ' + (ai + 1) + (a && a.label ? ' (« ' + String(a.label).slice(0, 30) + ' »)' : '');
      function e2(m){ err(w + ' : ' + m); }
      if(!packIsObj(a)){ e2('objet attendu.'); return; }
      if(!ACT_ID_RE.test(a.id || '')) e2('« id » : minuscules, chiffres, tiret (1 à 40 caractères).');
      else if(seen[a.id]) e2('« id » en double : ' + a.id);
      seen[a.id] = 1;
      if(a.type !== 'gabarit' && a.type !== 'fixe' && a.type !== 'patron') e2('« type » doit être « gabarit », « fixe » ou « patron ».');
      if(!packIsStr(a.label, 1, 60)) e2('« label » : de 1 à 60 caractères.');
      if(domains.indexOf(a.domain) === -1) e2('« domain » inconnu (' + domains.join(', ') + ').');
      var niveaux = a.niveaux === undefined ? [0,1,2] : a.niveaux;
      if(!Array.isArray(niveaux) || !niveaux.length || niveaux.some(function(n){ return n !== 0 && n !== 1 && n !== 2; }) || new Set(niveaux).size !== niveaux.length) { e2('« niveaux » : une liste non vide parmi 0, 1, 2.'); niveaux = [0,1,2]; }
      var out = { id:a.id, type:a.type, label:a.label, domain:a.domain, niveaux:niveaux.slice().sort() };
      if(a.type === 'fixe'){
        if(a.tirage !== undefined && a.tirage !== 'sans remise') e2('« tirage » : seul « sans remise » est connu.');
        if(a.icone !== undefined) { if(packIsStr(a.icone, 1, 4)) out.icone = a.icone; else e2('« icone » : un emoji.'); }
        var qs = Array.isArray(a.questions) ? a.questions : [];
        if(qs.length < 1 || qs.length > PACK_LIMITS.questions) e2('« questions » : de 1 à ' + PACK_LIMITS.questions + ' questions.');
        out.questions = [];
        qs.forEach(function(q, qi){
          var qw = 'question ' + (qi + 1);
          if(!packIsObj(q)){ e2(qw + ' : objet attendu.'); return; }
          if(!packIsStr(q.q, 1, 300)) e2(qw + ' : « q » (l\'énoncé) de 1 à 300 caractères.');
          if(!Array.isArray(q.bonnes) || q.bonnes.length !== 1 || !packIsStr(q.bonnes[0], 1, 60)) e2(qw + ' : « bonnes » doit contenir exactement une réponse (1 à 60 caractères).');
          if(!Array.isArray(q.fausses) || q.fausses.length < 1 || q.fausses.length > 3 || q.fausses.some(function(f){ return !packIsStr(f, 1, 60); })) e2(qw + ' : « fausses » : de 1 à 3 réponses fausses.');
          else if(Array.isArray(q.bonnes) && new Set([].concat(q.bonnes, q.fausses)).size !== q.bonnes.length + q.fausses.length) e2(qw + ' : deux réponses identiques.');
          if(q.explication !== undefined && !packIsStr(q.explication, 0, 400)) e2(qw + ' : « explication » trop longue.');
          if(q.dessin !== undefined && q.dessin !== null) e2(qw + ' : les images ne sont pas encore prises en charge (« dessin » doit être null).');
          if(q.icone !== undefined && !packIsStr(q.icone, 1, 4)) e2(qw + ' : « icone » : un emoji.');
          out.questions.push({ q:q.q, bonnes:(q.bonnes || []).slice(), fausses:(q.fausses || []).slice(), explication:q.explication || '', icone:q.icone });
        });
      } else if(a.type === 'patron'){
        var ge = packGridCheck(a.grille);
        if(ge) e2('« grille » : ' + ge); else out.grille = a.grille;
      } else if(a.type === 'gabarit'){
        var fiche = a.fiche;
        if(!packIsObj(fiche)){ e2('« fiche » attendue (voir src/README.md).'); }
        else {
          var before = errs.length;
          packCheckFiche(fiche, function(m){ err(w + ' : ' + m); });
          if(errs.length === before){ out.fiche = { tag:fiche.tag, levels:fiche.levels, forms:fiche.forms, note:fiche.note }; }
        }
      }
      pack.activites.push(out);
    });
    if(JSON.stringify(pack).length > PACK_LIMITS.octets) err('Paquet trop volumineux (' + Math.round(JSON.stringify(pack).length / 1000) + ' Ko ; maximum ' + Math.round(PACK_LIMITS.octets / 1000) + ' Ko).');
    if(errs.length) return { erreurs:errs.slice(0, 8), pack:null };
    var built = packBuild(pack);
    if(built.erreurs.length) return { erreurs:built.erreurs.slice(0, 8), pack:null };
    return { erreurs:[], pack:pack, defs:built.defs };
  }

  // ---- registre : installer, activer, mettre à jour, retirer ----
  function packFind(id){ for(var i = 0; i < PACKS.length; i++) if(PACKS[i].pack.id === id) return PACKS[i]; return null; }
  function packPlug(entry){        // branche les activités d'un paquet actif dans le jeu
    entry.defs.forEach(function(d){
      if(d.obj){ if(NET_DEFS.indexOf(d) === -1) NET_DEFS.push(d); return; }       // un patron rejoint la famille « Patron → Solide »
      if(QCM_TYPE_DEFS.indexOf(d) === -1){
        var gen = d.generate;
        d.generate = function(level){
          try { return gen(level); }
          catch(e){ packUnplug(entry, [d]); entry.erreur = 'Activité écartée : ' + e.message; return quizTypeById('calc').generate(level); }   // une activité qui échoue est écartée, le jeu continue
        };
        registerQuizType(d);
      }
    });
  }
  function packUnplug(entry, only){
    (only || entry.defs).forEach(function(d){
      var list = d.obj ? NET_DEFS : QCM_TYPE_DEFS, i = list.indexOf(d);
      if(i !== -1) list.splice(i, 1);
    });
    if(typeof refreshQuizTypes === 'function') refreshQuizTypes();
  }
  // Installe un paquet (objet JSON déjà lu). Renvoie { ok, message }.
  function packInstall(raw){
    var r = packValidate(raw);
    if(!r.pack) return { ok:false, message:'Paquet refusé : ' + r.erreurs.join(' — ') };
    var old = packFind(r.pack.id);
    if(old && r.pack.version < old.pack.version) return { ok:false, message:'Paquet refusé : une version plus récente (' + old.pack.version + ') est déjà installée.' };
    if(old && r.pack.version === old.pack.version && JSON.stringify(r.pack) === JSON.stringify(old.pack)) return { ok:false, message:'Ce paquet est déjà installé (version ' + old.pack.version + ').' };
    var entry = { pack:r.pack, actif:true, defs:r.defs, erreur:'' };
    if(!packSourceAppareil.save(entry)) return { ok:false, message:'Paquet refusé : pas assez de place sur cet appareil.' };
    if(old){ packUnplug(old); PACKS.splice(PACKS.indexOf(old), 1); }
    PACKS.push(entry);
    packPlug(entry);
    if(typeof refreshQuizTypes === 'function') refreshQuizTypes();
    return { ok:true, message:(old ? 'Paquet mis à jour' : 'Paquet installé') + ' : « ' + r.pack.titre + ' » (version ' + r.pack.version + ', ' + r.pack.activites.length + ' activité' + (r.pack.activites.length > 1 ? 's' : '') + ').' };
  }
  function packSetActive(id, on){
    var e = packFind(id); if(!e) return;
    e.actif = !!on; packSourceAppareil.save(e);
    if(e.actif) packPlug(e); else packUnplug(e);
    if(typeof refreshQuizTypes === 'function') refreshQuizTypes();
  }
  function packRemove(id){
    var e = packFind(id); if(!e) return;
    packUnplug(e); PACKS.splice(PACKS.indexOf(e), 1); packSourceAppareil.remove(id);
  }
  function packExportText(id){ var e = packFind(id); return e ? JSON.stringify(e.pack, null, 2) : ''; }
  function packInstallText(text){
    var raw;
    try { raw = JSON.parse(text); } catch(e){ return { ok:false, message:'Paquet refusé : ce fichier n\'est pas du JSON valide.' }; }
    return packInstall(raw);
  }

  // Au démarrage : on relit les paquets de l'appareil (chacun est re-validé ; un paquet devenu invalide est ignoré).
  packSourceAppareil.list().forEach(function(rec){
    var r = packValidate(rec.pack);
    if(!r.pack) return;
    var entry = { pack:r.pack, actif:rec.actif !== false, defs:r.defs, erreur:'' };
    PACKS.push(entry);
    if(entry.actif) packPlug(entry);
  });
