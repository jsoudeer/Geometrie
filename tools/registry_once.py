#!/usr/bin/env python3
"""Étape B2 (UNIQUE) : registre des types de Quizz.

Chaque thème déclare ses types de questions avec registerQuizType(...) ;
le moteur du Quizz n'a plus de liste écrite en dur ni de longue chaîne de `if`.
Les blocs de code sont déplacés tels quels ; la logique ne change pas.
(Conservé pour mémoire ; inutile une fois la refonte terminée.)
"""
import os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
JS = os.path.join(ROOT, 'src', 'js')


def rd(n):
    return open(os.path.join(JS, n), encoding='utf-8', newline='').read()


def wr(n, t):
    open(os.path.join(JS, n), 'w', encoding='utf-8', newline='').write(t)


orc = rd('orchestrateur.js')

# ---------------------------------------------------------------- extraction
i_tl = orc.index('  var TYPE_LABELS = {')
i_defs = orc.index('  var QCM_TYPE_DEFS = [')
i_defs_end = orc.index('\n  ];\n', i_defs) + len('\n  ];\n')
i_m4 = orc.index('  // types rempli par rebuildM4Types()')
i_m4_end = orc.index('  var m4TypeFilter')
i_gen = orc.index('  function genQuestion(){')
i_gen_end = orc.index('  function newQCM(){')

labels_txt = orc[i_tl:orc.index('  };', i_tl) + 4]
defs_txt = orc[i_defs:i_defs_end]
gen_txt = orc[i_gen:i_gen_end]

pair = re.compile(r"(\w+):('(?:[^'\\]|\\.)*')")
short = dict(pair.findall(labels_txt))

i_ql = orc.index('  var QCM_TYPE_LABELS = {')
ql_txt = orc[i_ql:orc.index('  };', i_ql) + 4]
long_ = dict(pair.findall(ql_txt))

entries = []
for chunk in re.split(r"\n    \{ id:", defs_txt)[1:]:
    chunk = '{ id:' + chunk
    tid = re.search(r"id:'(\w+)'", chunk).group(1)
    lv = re.search(r"defaultLevels:(\[[0-9,]*\])", chunk).group(1)
    note = re.search(r"randomNote:('.*')\s*\}", chunk, re.S).group(1)
    entries.append((tid, lv, note))
assert len(entries) == 21, len(entries)
assert all(t in short and t in long_ for t, _, _ in entries)
order = [t for t, _, _ in entries]

# ------------------------------------------------- blocs en ligne de genQuestion
def block(start_pat, end_pat):
    a = gen_txt.index(start_pat)
    b = gen_txt.index(end_pat, a)
    lines = gen_txt[a:b].rstrip('\n').split('\n')
    assert lines[0].startswith('    if(type===') and lines[-1] == '    }', lines[0]
    body = lines[1:-1]
    return '\n'.join(l[2:] if l.startswith('  ') else l for l in body)  # 6 -> 4 espaces


b_sides = block("    if(type==='sides' || type==='vertices'){", "    if(type==='name'){")
b_name = block("    if(type==='name'){", "    if(type==='angle'){")
b_angle = block("    if(type==='angle'){", "    if(type==='calc'){")
b_calc = block("    if(type==='calc'){", "    if(type==='align')")
b_sides = b_sides.replace('lv.shapes', 'GEO_LEVELS[level].shapes')
b_name = b_name.replace('lv.shapes', 'GEO_LEVELS[level].shapes')
b_angle = b_angle.replace('lv.angleGap', 'GEO_LEVELS[level].angleGap')
b_calc = b_calc.replace('lv.calcModes', 'CALC_LEVELS[level].modes').replace('lv.calcMax', 'CALC_LEVELS[level].max')
for b in (b_sides, b_name, b_angle, b_calc):
    assert not re.search(r'\blv\b', b), 'référence à lv restante'


# ------------------------------------------------------------ génération
def reg(tid, gen):
    e = {t: (lv, note) for t, lv, note in entries}[tid]
    return ("  registerQuizType({ id:'%s', label:%s, longLabel:%s, defaultLevels:%s,\n"
            "    randomNote:%s,\n"
            "    generate:%s });\n") % (tid, short[tid], long_[tid], e[0], e[1], gen)


GEO = {
    'sides': "function(level){ return genSidesVerticesQuestion('sides', level); }",
    'vertices': "function(level){ return genSidesVerticesQuestion('vertices', level); }",
    'name': 'genNameQuestion',
    'angle': 'genAngleQuestion',
    'align': 'genAlignQuestion', 'milieu': 'genMilieuQuestion', 'coord': 'genCoordQuestion',
    'coordFind': 'genCoordFindQuestion', 'codage': 'genCodageQuestion', 'decodage': 'genDecodageQuestion',
    'chasse': 'genChasseQuestion', 'symAxe': 'genSymAxeQuestion', 'symVrai': 'genSymVraiQuestion',
    'image': 'function(){ return pick(IMAGE_QUESTIONS)(); }',
    'enigme': 'genEnigmeQuestion',
}
CAL = {'calc': 'genCalcQuestion', 'monnaie': 'genMonnaieQuestion', 'vie': 'genVieQuestion'}
HOR = {'heure': "function(level){ return genHeureQuestion('m4Svg', level); }"}
PAT = {'solideNom': 'genSolideNomQuestion', 'solideCompte': 'genSolideCompteQuestion'}
assert set(GEO) | set(CAL) | set(HOR) | set(PAT) == set(order)

order_of = lambda d: [t for t in order if t in d]

geo_add = '''
  // ---- Paramètres par niveau (0 = Facile, 1 = Moyen, 2 = Difficile) ----
  var GEO_LEVELS = [
    { shapes:['triangle','carre','rectangle'], angleGap:20 },
    { shapes:['triangle','carre','rectangle','pentagone','hexagone','cercle'], angleGap:14 },
    { shapes:['triangle','carre','rectangle','pentagone','hexagone','cercle','losange'], angleGap:7 }
  ];

  // ---- Questions de Quizz déplacées depuis l'ancien moteur (mêmes textes, même tirage) ----
  function genSidesVerticesQuestion(type, level){
%s
  }

  function genNameQuestion(level){
%s
  }

  function genAngleQuestion(level){
%s
  }

  // ---- Déclaration des types de Quizz du thème Géométrie ----
%s''' % (b_sides, b_name, b_angle, ''.join(reg(t, GEO[t]) for t in order_of(GEO)))

cal_add = '''
  // ---- Paramètres par niveau (0 = Facile, 1 = Moyen, 2 = Difficile) ----
  // modes : 'add' = a + b ; 'missing' = a + x = c (trouve x). max = plus grand total.
  var CALC_LEVELS = [
    { modes:['add'], max:10 },
    { modes:['add'], max:20 },
    { modes:['add','missing'], max:20 }
  ];

  function genCalcQuestion(level){
%s
  }

  // ---- Déclaration des types de Quizz du thème Calcul ----
%s''' % (b_calc, ''.join(reg(t, CAL[t]) for t in order_of(CAL)))

hor_add = "\n  // ---- Déclaration du type de Quizz « Lire l'heure » ----\n" + ''.join(reg(t, HOR[t]) for t in order_of(HOR))
pat_add = '\n  // ---- Déclaration des types de Quizz sur les solides ----\n' + ''.join(reg(t, PAT[t]) for t in order_of(PAT))

registry = '''
  // ---- Registre des types de Quizz ----
  // Chaque thème appelle registerQuizType() pour déclarer ses types de questions :
  //   id            identifiant unique (ex. 'sides')
  //   label         nom court (panneau « Configurer les activités »)
  //   longLabel     nom affiché dans la liste du mode Manuel
  //   defaultLevels niveaux où le type apparaît par défaut : 0 Facile, 1 Moyen, 2 Difficile
  //   randomNote    ce qui est tiré au hasard, pour le panneau de configuration
  //   generate(level)  renvoie la question :
  //     { tag, question, sub, explain, draw:function(){…}, cols3:bool, choices:[{label, ok}] }
  var QCM_TYPE_DEFS = [];
  function registerQuizType(def){ QCM_TYPE_DEFS.push(def); }
  function quizTypeById(id){
    for(var i=0;i<QCM_TYPE_DEFS.length;i++){ if(QCM_TYPE_DEFS[i].id===id) return QCM_TYPE_DEFS[i]; }
    return null;
  }
'''

# ------------------------------------------------- réécriture du moteur (orch)
engine_new = '''  // Ordre d'affichage historique des types dans les listes (Configurer les
  // activités, mode Manuel). Un type absent de cette liste (nouveau thème)
  // s'affiche à la suite, dans l'ordre d'enregistrement.
  var QCM_DISPLAY_ORDER = [%s];
  QCM_TYPE_DEFS.sort(function(a, b){
    var ia = QCM_DISPLAY_ORDER.indexOf(a.id), ib = QCM_DISPLAY_ORDER.indexOf(b.id);
    if(ia === -1) ia = QCM_DISPLAY_ORDER.length + QCM_TYPE_DEFS.indexOf(a);
    if(ib === -1) ib = QCM_DISPLAY_ORDER.length + QCM_TYPE_DEFS.indexOf(b);
    return ia - ib;
  });

  // Niveaux du Quizz : `types` est rempli par rebuildM4Types() (appelée après le
  // chargement des éventuelles surcharges manuelles, voir plus bas) — jamais laissé
  // vide. Les paramètres propres à un thème (formes, calcul…) vivent dans ce thème.
  var M4_LEVELS = [
    { name:'Facile',    types:[] },
    { name:'Moyen',     types:[] },
    { name:'Difficile', types:[] }
  ];
''' % ', '.join("'%s'" % t for t in order)

gen_new = '''  function genQuestion(){
    var lv = M4_LEVELS[globalLevel];
    var type = (m4TypeFilter!=='random' && lv.types.indexOf(m4TypeFilter)!==-1) ? m4TypeFilter : pick(lv.types);
    // (repli sur « image » comme avant si le niveau n'a plus aucun type actif)
    return (quizTypeById(type) || quizTypeById('image')).generate(globalLevel);
  }

'''

new = orc[:i_tl] + engine_new + orc[i_m4_end:i_gen] + gen_new + orc[i_gen_end:]
# le moteur garde m4TypeFilter / m4Current (déjà entre i_m4_end et i_gen)
# la liste des libellés longs du mode Manuel vient maintenant du registre
new = re.sub(r"\n  var QCM_TYPE_LABELS = \{.*?\n  \};\n", "\n", new, flags=re.S)
assert 'QCM_TYPE_LABELS[t]' in new
new = new.replace('QCM_TYPE_LABELS[t] || t', '(quizTypeById(t) && quizTypeById(t).longLabel) || t')
assert 'QCM_TYPE_LABELS' not in new and 'TYPE_LABELS.' not in new
wr('orchestrateur.js', new)

wr('noyau.js', rd('noyau.js').rstrip('\n') + '\n' + registry)
wr('geometrie.js', rd('geometrie.js').rstrip('\n') + '\n' + geo_add)
wr('calcul.js', rd('calcul.js').rstrip('\n') + '\n' + cal_add)
wr('horloge.js', rd('horloge.js').rstrip('\n') + '\n' + hor_add)
wr('patron3d.js', rd('patron3d.js').rstrip('\n') + '\n' + pat_add)
print('registre installé :', len(entries), 'types')
