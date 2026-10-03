// Bibliothèques de vocabulaire (prénoms, objets, articles, couleurs) et moteur de phrase.
const fs = require('fs'), path = require('path');
const { withPage } = require('./lib');
withPage({ page: 'index_test.html', viewport: { width: 390, height: 900 } }, async (page) => {
  const ev = c => page.evaluate(x => window.__t.__eval(x), c);
  let bad = 0; const chk = (ok, m) => { console.log(ok ? '  ok' : '  ✘ ÉCHEC', m); if (!ok) bad++; };
  const J = async c => JSON.parse(await ev('JSON.stringify(' + c + ')'));

  // 1. Structure des bibliothèques
  const lib = await J(`(function(){ var o={};
    o.prenomsOk = PRENOMS.length>=10 && PRENOMS.every(function(p){ return p.nom && typeof p.f==='boolean'; });
    o.prenomsUniques = new Set(PRENOMS.map(function(p){return p.nom;})).size===PRENOMS.length;
    o.mixte = PRENOMS.some(function(p){return p.f;}) && PRENOMS.some(function(p){return !p.f;});
    o.objetsOk = OBJETS.every(function(x){ return x.sing && x.plur && x.plur!==x.sing && (x.genre==='m'||x.genre==='f') && x.icon && x.groupe; });
    o.groupes = ['jeu','gourmand','fruit'].map(function(g){ return OBJETS.filter(function(x){return x.groupe===g;}).length; });
    o.articlesOk = ARTICLES.every(function(x){ return x.sing && x.plur && x.plur!==x.sing && (x.genre==='m'||x.genre==='f'); });
    o.couleursOk = COULEURS.every(function(c){ return c.m && c.f; });
    return o; })()`);
  chk(lib.prenomsOk && lib.prenomsUniques && lib.mixte, 'prénoms : ≥ 10, uniques, filles et garçons');
  chk(lib.objetsOk && lib.groupes.every(n => n >= 4), 'objets : champs complets, ≥ 4 par groupe ' + lib.groupes);
  chk(lib.articlesOk && lib.couleursOk, 'articles et couleurs : champs complets');

  const m = await J(`(function(){ var l=mascottes(); return { n:l.length, chats:l.filter(function(p){return p.f;}).length, brains:l.filter(function(p){return !p.f;}).length, vides:l.filter(function(p){return !p.nom;}).length, uniques:new Set(l.map(function(p){return p.nom;})).size }; })()`);
  chk(m.vides === 0 && m.uniques === m.n && m.chats === (await ev('CAT_SPRITES.length')) && m.brains === (await ev('BRAINROT_SPRITES.length')), 'mascottes : ' + m.chats + ' kawaii (filles) + ' + m.brains + ' brainrots (garçons), noms uniques');

  // 2. Moteur de phrase et accords
  const ph = await J(`[
    phrase('{Il} en perd {n}.', accords({nom:'Léa',f:true})),
    phrase('{Il} en perd {n}.', accords({nom:'Tom',f:false})),
    phrase('{nom} {at} ?', accords({nom:'Léa',f:true})),
    phrase('{nom} {at} ?', accords({nom:'Tom',f:false})),
    phrase('{n} {obj} {seuls}', Object.assign(accords(null,{plur:'billes',sing:'bille',genre:'f'}),{n:3})),
    phrase('{n} {obj} {seuls}', Object.assign(accords(null,{plur:'jetons',sing:'jeton',genre:'m'}),{n:3})),
    unArticle({sing:'gomme',genre:'f'}), unArticle({sing:'livre',genre:'m'}),
    nbObjet(1,{sing:'bille',plur:'billes'}), nbObjet(5,{sing:'bille',plur:'billes'}),
    nbObjetCouleur(1,{sing:'bille',plur:'billes',genre:'f'},{m:'bleu',f:'bleue'}),
    nbObjetCouleur(4,{sing:'jeton',plur:'jetons',genre:'m'},{m:'bleu',f:'bleue'}),
    nbObjetCouleur(4,{sing:'carte',plur:'cartes',genre:'f'},{m:'bleu',f:'bleue'})
  ]`.replace('{n}', '{n}').replace("phrase('{Il} en perd {n}.', accords({nom:'Léa',f:true}))", "phrase('{Il} en perd 3.', accords({nom:'Léa',f:true}))").replace("phrase('{Il} en perd {n}.', accords({nom:'Tom',f:false}))", "phrase('{Il} en perd 3.', accords({nom:'Tom',f:false}))"));
  const attendu = ['Elle en perd 3.', 'Il en perd 3.', 'Léa a-t-elle ?', 'Tom a-t-il ?', '3 billes toutes seules', '3 jetons tout seuls',
    'une gomme', 'un livre', '1 bille', '5 billes', '1 bille bleue', '4 jetons bleus', '4 cartes bleues'];
  chk(JSON.stringify(ph) === JSON.stringify(attendu), 'accords : ' + ph.join(' | '));
  const err = await ev(`(function(){ try{ phrase('{inconnu}', {}); return 'pas d\\'erreur'; }catch(e){ return 'erreur'; } })()`);
  chk(err === 'erreur', 'clé inconnue = erreur de gabarit (jamais « undefined » affiché)');
  const sp = await J(`(function(){ var seen={}, n=0; for(var i=0;i<PRENOMS.length*2;i++){ seen[pickFresh('test-prenom', PRENOMS).nom]=1; } return Object.keys(seen).length; })()`);
  chk(sp === await ev('PRENOMS.length'), 'prénoms : tirage sans remise, tous sortent en 2 tours (' + sp + ')');
  const dd = await ev(`(function(){ for(var i=0;i<200;i++){ var d=deuxDifferents(ARTICLES); if(d[0]===d[1]||!d[0]||!d[1]) return false; } return true; })()`);
  chk(dd, 'deuxDifferents : toujours deux éléments distincts');

  // 3. Problèmes générés : accords, vocabulaire, pas de reste de gabarit
  const g = await J(`(function(){ var o={n:0,brace:0,undef:0,sing1:0,genre:0,nomInconnu:0,noms:{},masc:{},objets:{},mixte:0};
    var all=toutesLesPersonnes(), noms=all.map(function(p){return p.nom;}), fem={}; all.forEach(function(p){fem[p.nom]=p.f;});
    ['vie','probleme2'].forEach(function(id){ var def=quizTypeById(id);
      for(var lv=0;lv<3;lv++) for(var i=0;i<300;i++){ var q=def.generate(lv), t=q.question; o.n++;
        if(/[{}]/.test(t+q.explain)) o.brace++;
        if(/undefined|NaN/.test(t+q.explain)) o.undef++;
        if(/(^|\\D)1 [a-zéèê]+s\\b/.test(t) && !/ 1 an/.test(t)) o.sing1++;
        var nom=noms.filter(function(n){ return new RegExp('(^|[ .])'+n+' ').test(t); })[0];
        if(nom){ o.noms[nom]=1; if(all.filter(function(p){return p.nom===nom&&p.mascotte;}).length) o.masc[nom]=1;
          if(/\\b(Il|il) /.test(t.replace(/[Ii]l y a/g,'').replace(/reste-t-il/g,'')) || / a-t-il/.test(t)){ if(fem[nom]) o.genre++; }
          if(/\\b(Elle|elle) /.test(t) || /a-t-elle/.test(t)){ if(!fem[nom]) o.genre++; }
        }
        OBJETS.forEach(function(x){ if(t.indexOf(x.plur)!==-1) o.objets[x.plur]=1; });
        if(/(Léa|Tom|Léo|Nina|Maya)/.test(t) && !nom) o.nomInconnu++;
      } });
    o.noms=Object.keys(o.noms).length; o.masc=Object.keys(o.masc).length; o.objets=Object.keys(o.objets).length; return o; })()`);
  chk(g.brace === 0 && g.undef === 0, `${g.n} questions : aucun « {…} », « undefined » ni « NaN »`);
  chk(g.sing1 === 0, 'jamais « 1 billes » (pluriel d\'une unité)');
  chk(g.genre === 0, 'il/elle toujours accordé au prénom');
  chk(g.noms >= 40, 'personnages vus dans les énoncés : ' + g.noms + ' (≥ 40)');
  chk(g.masc >= 20, 'mascottes vues dans les énoncés : ' + g.masc + ' (≥ 20)');
  chk(g.objets >= 10, 'objets vus dans les énoncés : ' + g.objets + ' (≥ 10)');

  // 4. Aucun prénom ni objet en dur hors de la bibliothèque
  const names = await J('PRENOMS.map(function(p){return p.nom;})');  // les noms d\'enfants ; les mascottes viennent du catalogue de la boutique
  const dir = path.join(__dirname, '..', '..', 'src', 'js');
  const hard = [];
  for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith('.js') || f === 'vocabulaire.js' || f === 'images-data.js') continue;
    const src = fs.readFileSync(path.join(dir, f), 'utf8').split('\n');
    src.forEach((l, i) => { for (const n of names) if (new RegExp("['\"> ]" + n + "[ ,.'\"<]").test(l) && /question|q:|explain|ex:/.test(l)) hard.push(f + ':' + (i + 1) + ' ' + n); });
  }
  chk(hard.length === 0, 'aucun prénom écrit en dur dans un énoncé' + (hard.length ? ' : ' + hard.join(', ') : ''));

  console.log(bad ? 'ÉCHEC ' + bad : 'vocabulaire OK');
  process.exitCode = bad ? 1 : 0;
});
