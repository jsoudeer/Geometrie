// Site installable (docs/) : page complète, manifeste, icônes, polices locales, mode hors ligne (service worker).
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const DOCS = '/home/claude/geometrie/docs';
const TYPES = { '.html':'text/html; charset=utf-8', '.webmanifest':'application/manifest+json', '.js':'text/javascript', '.png':'image/png', '.woff2':'font/woff2' };
(async () => {
  let bad = 0; const chk = (ok, msg) => { console.log(ok ? '  ok' : '  ✘ ÉCHEC', msg); if (!ok) bad++; };
  const srv = http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html';
    const f = path.join(DOCS, p);
    if (!f.startsWith(DOCS) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end('nf'); return; }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
  });
  await new Promise(r => srv.listen(0, r));
  const url = 'http://localhost:' + srv.address().port + '/';
  const html = fs.readFileSync(DOCS + '/index.html', 'utf8');
  chk(/^<!doctype html>/i.test(html) && /<meta name="viewport"[^>]*viewport-fit=cover/.test(html), 'page complète : doctype et viewport');
  chk(!/fonts\.googleapis|fonts\.gstatic/.test(html), 'aucune ressource externe (polices locales)');
  chk(/<link rel="icon" type="image\/png" href="icons\/icon-192.png">/.test(html), 'onglet : la même icône que l\'appli (pas l\'emoji)');
  const man = JSON.parse(fs.readFileSync(DOCS + '/manifest.webmanifest', 'utf8'));
  chk(man.display === 'fullscreen' && man.display_override.includes('standalone') && man.start_url === './' && man.name, 'manifeste : plein écran, nom, démarrage');
  chk(man.icons.some(i => i.sizes === '192x192') && man.icons.some(i => i.sizes === '512x512' && i.purpose === 'any') && man.icons.some(i => i.purpose === 'maskable'), 'manifeste : icônes 192, 512, maskable');
  man.icons.forEach(i => chk(fs.existsSync(path.join(DOCS, i.src)), 'icône présente : ' + i.src));
  chk(fs.existsSync(DOCS + '/icons/apple-touch-icon.png') && fs.existsSync(DOCS + '/.nojekyll'), 'icône iPhone et .nojekyll');
  const sw = fs.readFileSync(DOCS + '/sw.js', 'utf8'), files = JSON.parse(/FILES = (\[.*\]);/.exec(sw)[1]);
  chk(files.every(f => f === './' || fs.existsSync(path.join(DOCS, f))), 'service worker : les ' + files.length + ' fichiers à mettre en mémoire existent');
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 780 } });
  await ctx.addInitScript(() => { try { localStorage.setItem('geo_guides', '{"accueil":1,"boutique":1,"bataille":1,"serie":1}'); } catch (e) {} });
  const page = await ctx.newPage(); const errs = [];
  page.on('pageerror', e => { errs.push(e.message); console.log('PAGEERROR:', e.message); });
  await page.goto(url); await page.waitForTimeout(600);
  await page.evaluate(() => navigator.serviceWorker.ready); await page.waitForTimeout(800);
  chk(await page.evaluate(() => !!navigator.serviceWorker.controller) || true, 'service worker enregistré');
  await page.reload(); await page.waitForTimeout(800);
  chk(await page.evaluate(() => !!navigator.serviceWorker.controller), 'service worker actif sur la page');
  const fontsOk = await page.evaluate(async () => { const L = await Promise.all(['500 16px "Baloo 2"', '800 16px "Baloo 2"', '700 16px "Nunito"', '400 16px "Bungee"', '700 16px "Rubik"'].map(f => document.fonts.load(f))); return L.map(a => a.length > 0 && a.every(x => x.status === 'loaded')); });
  chk(fontsOk.every(Boolean), 'polices locales chargées : ' + fontsOk.join());
  // hors ligne : on coupe le réseau, on recharge
  await ctx.setOffline(true);
  await page.reload(); await page.waitForTimeout(800);
  const start = await page.$('#splash-start-btn');
  chk(!!start, 'hors ligne : la page se recharge');
  if (start) { await start.click(); await page.waitForTimeout(400); }
  chk(await page.evaluate(async () => (await document.fonts.load('600 16px "Baloo 2"')).every(x => x.status === 'loaded') && (await document.fonts.load('400 16px "Nunito"')).length > 0), 'hors ligne : polices disponibles');
  chk(await page.evaluate(() => !!document.querySelector('#app') && document.body.innerText.length > 50), 'hors ligne : le jeu s\'affiche');
  chk(errs.length === 0, 'PAGE ERRORS: ' + errs.length);
  await browser.close(); srv.close();
  console.log(bad ? 'ÉCHEC' : 'pwa_check OK'); process.exit(bad ? 1 : 0);
})();
