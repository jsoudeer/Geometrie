#!/usr/bin/env python3
"""Regroupement UNIQUE des tranches JS de src/js/ en fichiers par thème (étape B1).

Les blocs de code sont déplacés tels quels (aucune ligne de logique modifiée) ;
seuls des commentaires d'en-tête sont ajoutés. Le comportement doit rester
identique : vérifié par tools/tests/golden.js.
(Conservé pour mémoire ; inutile une fois la refonte terminée.)
"""
import os, re, json

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
JS = os.path.join(ROOT, 'src', 'js')


def rd(name):
    with open(os.path.join(JS, name), encoding='utf-8', newline='') as f:
        return f.read().split('\n')  # sans le \n final : on le remet à l'écriture


def lines(name):
    t = open(os.path.join(JS, name), encoding='utf-8', newline='').read()
    out = t.split('\n')
    if out and out[-1] == '':
        out.pop()
    return [l + '\n' for l in out]


def find(L, pat, start=0):
    r = re.compile(pat)
    for i in range(start, len(L)):
        if r.match(L[i]):
            return i
    raise SystemExit('introuvable: ' + pat)


def cut(L, start_pat, end_pat=None):
    a = find(L, start_pat)
    b = find(L, end_pat, a + 1) if end_pat else len(L)
    return ''.join(L[a:b])


def header(title, body):
    corps = ''.join('     %s\n' % l for l in body)
    return '  /* ===================== %s =====================\n%s  */\n\n' % (title, corps)


Q = lines('quizz.js')
S = {  # segments du Quizz (voir l'analyse de la structure)
    'head':      cut(Q, r'  /\* =+ MODULE 4', r'  function pick\('),
    'pickrand':  cut(Q, r'  function pick\(', r'  function regularPoly'),
    'geo_shapes': cut(Q, r'  function regularPoly', r'  var TYPE_LABELS'),
    'engine_defs': cut(Q, r'  var TYPE_LABELS', r'  function numChoiceSet'),
    'numchoice': cut(Q, r'  function numChoiceSet', r'  function drawPolygon'),
    'geo_draw':  cut(Q, r'  function drawPolygon', r'  function svgText'),
    'svgtext':   cut(Q, r'  function svgText', r'  function drawEquation'),
    'equation':  cut(Q, r'  function drawEquation', r'  // Petit "musée"'),
    'geo_scenes': cut(Q, r'  // Petit "musée"', r'  // =+ Solides'),
    'solides':   cut(Q, r'  // =+ Solides', r'  // =+ Monnaie'),
    'monnaie':   cut(Q, r'  // =+ Monnaie', r"  // =+ Lire l'heure"),
    'heure':     cut(Q, r"  // =+ Lire l'heure", r'  // =+ Énigmes'),
    'enigmes':   cut(Q, r'  // =+ Énigmes', r'  // =+ Maths de la vie'),
    'vie':       cut(Q, r'  // =+ Maths de la vie', r'  function genQuestion'),
    'gen':       cut(Q, r'  function genQuestion', r'  function newQCM'),
    'ui':        cut(Q, r'  function newQCM'),
}
# le découpage doit couvrir tout le fichier, sans trou ni recouvrement
assert sum(len(v) for v in S.values()) == len(''.join(Q)), 'segments du Quizz : recouvrement ou trou'

M = lines('mesurer.js')
ri = find(M, r'  function randInt')
RANDINT = ''.join(M[ri:ri + 2])           # la ligne + la ligne vide qui suit
M = M[:ri] + M[ri + 2:]
mesurer = ''.join(M)

deformer = ''.join(lines('deformer.js'))
patron = ''.join(lines('patron.js'))
horloge = ''.join(lines('horloge.js'))
noyau = ''.join(lines('noyau.js'))
orch = ''.join(lines('orchestrateur.js'))


def w(name, text):
    with open(os.path.join(JS, name), 'w', encoding='utf-8', newline='') as f:
        f.write(text)
    print('  %-20s %5d lignes' % (name, text.count('\n')))


H_GEO = header('THÈME GÉOMÉTRIE', [
    'Mesurer (règle), Déformer (formes) et les questions de Quizz de géométrie :',
    'côtés, sommets, nom, angles, alignement, milieu, repérage, codage/décodage,',
    'chasse aux formes, symétrie, scènes illustrées, énigmes.'])
H_HOR = header('THÈME HORLOGE', [
    'Lire l\'heure, Régler l\'heure, et la question de Quizz « Lire l\'heure ».'])
H_CAL = header('THÈME CALCUL', [
    'Questions de Quizz de calcul : opérations, monnaie, maths de la vie.'])
H_PAT = header('THÈME PATRON / SOLIDES 3D', [
    'Patron → Solide (animation 3D) et les questions de Quizz sur les solides.'])
H_ORC = header('QUIZZ (moteur) + ORCHESTRATEUR + CONFIGURATION DES ACTIVITÉS', [
    'Moteur du Quizz : registre des types, niveaux, tirage, affichage, correction.',
    'Puis l\'orchestrateur (niveaux, chrono, séries) et le panneau de configuration.'])

w('noyau.js', noyau + '\n  // ---- Outils partagés par tous les thèmes ----\n' + S['pickrand'] + RANDINT + S['numchoice'] + S['svgtext'])
w('geometrie.js', H_GEO + mesurer + deformer + S['geo_shapes'] + S['geo_draw'] + S['geo_scenes'] + S['enigmes'])
w('horloge.js', H_HOR + horloge + S['heure'])
w('calcul.js', H_CAL + S['equation'] + S['monnaie'] + S['vie'])
w('patron3d.js', H_PAT + patron + S['solides'])
w('orchestrateur.js', H_ORC + S['head'] + S['engine_defs'] + S['gen'] + S['ui'] + orch)

# boutique = boutique-1 + boutique-2 ; les images restent à part (données générées)
b1, b2 = ''.join(lines('boutique-1.js')), ''.join(lines('boutique-2.js'))
w('boutique.js', b1 + b2)
for old in ['mesurer.js', 'deformer.js', 'patron.js', 'quizz.js', 'boutique-1.js', 'boutique-2.js']:
    os.remove(os.path.join(JS, old))

man_path = os.path.join(ROOT, 'src', 'manifest.json')
man = json.load(open(man_path, encoding='utf-8'))
man['js'] = ['js/noyau.js', 'js/geometrie.js', 'js/horloge.js', 'js/calcul.js', 'js/patron3d.js',
             'js/orchestrateur.js', 'js/images-data.js', 'js/boutique.js', 'js/bataille.js']
open(man_path, 'w', encoding='utf-8', newline='').write(json.dumps(man, ensure_ascii=False, indent=2) + '\n')
print('manifest mis à jour')
