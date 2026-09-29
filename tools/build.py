#!/usr/bin/env python3
"""Assemble index.html à partir des sources de src/.

    python3 tools/build.py            écrit index.html
    python3 tools/build.py --check    vérifie que index.html est à jour (sans l'écrire)

Les fichiers à assembler, et leur ordre, sont dans src/manifest.json.
L'ordre compte : le JS tient dans une seule fonction (les fonctions peuvent
être appelées avant leur définition, pas les variables `var`).
"""
import json, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'src')


def read(rel):
    with open(os.path.join(SRC, rel), encoding='utf-8', newline='') as f:
        return f.read()


def build():
    m = json.loads(read('manifest.json'))
    tpl = read(m['template'])
    for marker in ('@@CSS@@\n', '@@JS@@\n'):
        if tpl.count(marker) != 1:
            raise SystemExit('Le gabarit doit contenir exactement une ligne %r' % marker.strip())
    css = ''.join(read(p) for p in m['css'])
    js = ''.join(read(p) for p in m['js'])
    return tpl.replace('@@CSS@@\n', css).replace('@@JS@@\n', js), os.path.normpath(os.path.join(SRC, m['output']))


if __name__ == '__main__':
    html, out = build()
    if '--check' in sys.argv:
        cur = open(out, encoding='utf-8', newline='').read() if os.path.exists(out) else ''
        if cur != html:
            print('index.html N\'EST PAS à jour : lancer python3 tools/build.py')
            sys.exit(1)
        print('index.html est à jour (%d octets).' % len(html.encode('utf-8')))
    else:
        with open(out, 'w', encoding='utf-8', newline='') as f:
            f.write(html)
        print('index.html écrit (%d octets).' % len(html.encode('utf-8')))
