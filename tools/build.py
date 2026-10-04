#!/usr/bin/env python3
"""Assemble index.html à partir des sources de src/.

    python3 tools/build.py            écrit index.html
    python3 tools/build.py --check    vérifie que index.html est à jour (sans l'écrire)

Les fichiers à assembler, et leur ordre, sont dans src/manifest.json.

Le build écrit aussi le SITE installable (dossier docs/, servi par GitHub Pages ou tout hébergeur
statique) : docs/index.html (page complète : doctype, viewport, manifeste, polices locales),
docs/manifest.webmanifest et docs/sw.js (mode hors ligne). Les polices (docs/fonts) et les icônes
(docs/icons) sont des fichiers fixes. index.html reste le fragment de l'artefact.
L'ordre compte : le JS tient dans une seule fonction (les fonctions peuvent
être appelées avant leur définition, pas les variables `var`).
"""
import hashlib, json, os, sys

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


DOCS = os.path.join(ROOT, 'docs')
FONTS = [  # (famille, graisse, fichier)
    ('Baloo 2', 500), ('Baloo 2', 600), ('Baloo 2', 700), ('Baloo 2', 800),
    ('Nunito', 400), ('Nunito', 600), ('Nunito', 700), ('Nunito', 800),
    ('Rubik', 400), ('Rubik', 600), ('Rubik', 700), ('Rubik', 800), ('Bungee', 400)]
PRECACHE_ICONS = ['icons/icon-192.png', 'icons/icon-512.png', 'icons/maskable-512.png', 'icons/apple-touch-icon.png']


def font_files():
    return ['fonts/%s-latin-%d-normal.woff2' % (fam.lower().replace(' ', '-'), w) for fam, w in FONTS]


def site(fragment):
    """Les fichiers du site installable : {chemin relatif à docs/: texte}."""
    lines = fragment.split('\n')
    # le site embarque ses polices : on retire la feuille Google Fonts (l'artefact, lui, la garde)
    frag = '\n'.join(l for l in lines if 'fonts.googleapis.com' not in l)
    faces = ''.join("@font-face{font-family:'%s';font-weight:%d;font-style:normal;font-display:swap;src:url(%s) format('woff2')}\n" % (fam, w, f)
                    for (fam, w), f in zip(FONTS, font_files()))
    head = ('<!doctype html>\n<html lang="fr">\n<head>\n<meta charset="utf-8">\n'
            '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
            '<meta name="theme-color" content="#FFC2D1">\n'
            '<meta name="description" content="Le grand jeu de maths du CE1 : nombres, calcul, formes, mesures, heure.">\n'
            '<meta name="mobile-web-app-capable" content="yes">\n<meta name="apple-mobile-web-app-capable" content="yes">\n'
            '<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">\n<meta name="apple-mobile-web-app-title" content="Kawaii vs Brainrot">\n'
            '<link rel="manifest" href="manifest.webmanifest">\n<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">\n'
            '<style>\n' + faces + 'html,body{margin:0}\n</style>\n')
    reg = ('<script>\nif("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")){\n'
           '  window.addEventListener("load", function(){ navigator.serviceWorker.register("sw.js").catch(function(){}); });\n}\n</script>\n')
    page = head + frag.rstrip('\n') + '\n' + reg
    # le titre et l'icône du fragment vont dans <head> : ils y sont déjà (premières lignes du fragment)
    page = page.replace('</style>\n<title>', '</style>\n<title>', 1)
    page = page.replace('\n</style>\n\n<div', '\n</style>\n</head>\n<body>\n<div', 1)
    page = page.rstrip('\n') + '\n</body>\n</html>\n'
    manifest = json.dumps({
        'name': 'Kawaii vs Brainrot', 'short_name': 'Kawaii vs Brainrot', 'lang': 'fr',
        'description': 'Le grand jeu de maths du CE1',
        'start_url': './', 'scope': './', 'id': './',
        'display': 'fullscreen', 'display_override': ['fullscreen', 'standalone'],
        'orientation': 'any', 'background_color': '#FFF6F0', 'theme_color': '#FFC2D1', 'categories': ['education', 'games'],
        'icons': [
            {'src': 'icons/icon-192.png', 'sizes': '192x192', 'type': 'image/png', 'purpose': 'any'},
            {'src': 'icons/icon-512.png', 'sizes': '512x512', 'type': 'image/png', 'purpose': 'any'},
            {'src': 'icons/maskable-512.png', 'sizes': '512x512', 'type': 'image/png', 'purpose': 'maskable'}]},
        ensure_ascii=False, indent=2) + '\n'
    files = ['./', 'index.html', 'manifest.webmanifest'] + PRECACHE_ICONS + font_files()
    version = hashlib.sha1((page + manifest).encode('utf-8')).hexdigest()[:10]
    sw = ('// Généré par tools/build.py : ne pas modifier à la main.\n'
          'var CACHE = "kvb-%s", FILES = %s;\n'
          'self.addEventListener("install", function(e){ e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(FILES); }).then(function(){ return self.skipWaiting(); })); });\n'
          'self.addEventListener("activate", function(e){ e.waitUntil(caches.keys().then(function(ks){ return Promise.all(ks.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); })); }).then(function(){ return self.clients.claim(); })); });\n'
          'self.addEventListener("fetch", function(e){\n'
          '  if(e.request.method !== "GET") return;\n'
          '  e.respondWith(caches.match(e.request, { ignoreSearch:true }).then(function(r){ return r || fetch(e.request); }));\n'
          '});\n') % (version, json.dumps(files))
    return {'index.html': page, 'manifest.webmanifest': manifest, 'sw.js': sw}


def main():
    html, out = build()
    wanted = {out: html}
    for name, text in site(html).items():
        wanted[os.path.join(DOCS, name)] = text
    missing = [f for f in font_files() + PRECACHE_ICONS if not os.path.exists(os.path.join(DOCS, f))]
    if missing:
        raise SystemExit('Fichiers fixes manquants dans docs/ : ' + ', '.join(missing))
    if '--check' in sys.argv:
        bad = [os.path.relpath(p, ROOT) for p, t in wanted.items()
               if not os.path.exists(p) or open(p, encoding='utf-8', newline='').read() != t]
        if bad:
            print('Fichiers générés PAS à jour : %s : lancer python3 tools/build.py' % ', '.join(bad))
            sys.exit(1)
        print('index.html est à jour (%d octets), site docs/ à jour.' % len(html.encode('utf-8')))
    else:
        os.makedirs(DOCS, exist_ok=True)
        open(os.path.join(DOCS, '.nojekyll'), 'w').close()
        for p, t in wanted.items():
            with open(p, 'w', encoding='utf-8', newline='') as f:
                f.write(t)
        print('index.html écrit (%d octets) ; site docs/ écrit.' % len(html.encode('utf-8')))


if __name__ == '__main__':
    main()
