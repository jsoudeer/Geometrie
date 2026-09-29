#!/usr/bin/env python3
"""Découpage UNIQUE de l'ancien index.html monolithique en src/.

Étape A de la refonte : on découpe en tranches contiguës, sans rien changer,
de sorte que tools/build.py reconstitue exactement le même index.html.
(Conservé pour mémoire ; inutile une fois la refonte terminée.)
"""
import os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'src')
lines = open(os.path.join(ROOT, 'index.html'), encoding='utf-8').read().split('\n')
# split('\n') supprime les \n : on les remet en gardant la dernière ligne telle quelle
L = [l + '\n' for l in lines[:-1]] + ([lines[-1]] if lines[-1] else [])

def find(prefix, start=0):
    for i in range(start, len(L)):
        if L[i].startswith(prefix):
            return i
    raise SystemExit('introuvable: ' + prefix)

style_open = find('<style>')
style_close = find('</style>', style_open)
script_open = find('<script>', style_close)
iife_open = find('(function(){', script_open)
use_strict = find('  "use strict";', iife_open)
iife_close = find('})();', use_strict)
script_close = find('</script>', iife_close)

css0, css1 = style_open + 1, style_close          # [css0, css1)
js0, js1 = use_strict + 1, iife_close             # [js0, js1)

def seg(a, b):
    return ''.join(L[a:b])

def write(rel, text):
    p = os.path.join(SRC, rel)
    os.makedirs(os.path.dirname(p), exist_ok=True)
    open(p, 'w', encoding='utf-8', newline='').write(text)
    print('  %-28s %6d lignes' % (rel, text.count('\n')))

def one(prefix, start=0):
    return find(prefix, start)

# --- CSS : 4 tranches contiguës, repérées par leurs titres de section -------
h_module1 = one('  /* ============ MODULE 1 : MESURER', css0)
h_coach = one('  /* ============ COACH', css0)
h_module6 = one('  /* ============ MODULE 6 : BOUTIQUE', css0)
css_parts = [
    ('css/base.css', css0, h_module1),
    ('css/exercices.css', h_module1, h_coach),
    ('css/interface.css', h_coach, h_module6),
    ('css/boutique-bataille.css', h_module6, css1),
]

# --- JS : tranches contiguës, repérées par leurs titres de section ----------
def js_head(prefix):
    return find(prefix, js0)
j = {
    'noyau': js0,
    'mesurer': js_head('  /* ===================== MODULE 1 : MESURER'),
    'deformer': js_head('  /* ===================== MODULE 2 : DEFORMER'),
    'patron': js_head('  /* ===================== MODULE 3 : PATRON'),
    'quizz': js_head('  /* ===================== MODULE 4 : QCM'),
    'horloge': js_head('  /* ===================== MODULE 5 : HORLOGE'),
    'orch': js_head('  /* ===================== ENTRAINEMENT : ORCHESTRATEUR'),
    'boutique_a': js_head('  /* ===================== MODULE 6 : BOUTIQUE'),
    'bataille': js_head('  /* ===================== BATAILLE'),
}
img_comment = find('  // Images générées (visage', j['boutique_a'])
img_end = find('"br22":', img_comment) + 1           # ligne br22 comprise
assert 'IMG_DATA_END' in L[img_end - 1], 'fin du bloc images inattendue'
order = ['noyau', 'mesurer', 'deformer', 'patron', 'quizz', 'horloge', 'orch', 'boutique_a']
js_parts = []
for a, b in zip(order, order[1:] + ['bataille']):
    end = j[b]
    if a == 'boutique_a':
        end = img_comment
    js_parts.append(('js/%s.js' % {'orch': 'orchestrateur', 'boutique_a': 'boutique-1'}.get(a, a), j[a], end))
js_parts.append(('js/images-data.js', img_comment, img_end))
js_parts.append(('js/boutique-2.js', img_end, j['bataille']))
js_parts.append(('js/bataille.js', j['bataille'], js1))

# --- gabarit HTML -----------------------------------------------------------
template = seg(0, css0) + '@@CSS@@\n' + seg(css1, js0) + '@@JS@@\n' + seg(js1, len(L))

print('Écriture dans', SRC)
write('index.template.html', template)
for rel, a, b in css_parts:
    write(rel, seg(a, b))
for rel, a, b in js_parts:
    write(rel, seg(a, b))

manifest = '{\n  "template": "index.template.html",\n  "output": "../index.html",\n  "css": [%s],\n  "js": [%s]\n}\n' % (
    ', '.join('"%s"' % r for r, _, _ in css_parts),
    ', '.join('"%s"' % r for r, _, _ in js_parts))
write('manifest.json', manifest)
