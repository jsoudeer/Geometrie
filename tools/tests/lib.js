// Petit utilitaire de test : sert /home/claude/geometrie avec le bon charset
// (le fichier index.html est un fragment sans <meta charset>) sur un port libre,
// dans le même processus (les serveurs en arrière-plan ne survivent pas aux appels).
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const ROOT = '/home/claude/geometrie';
const TYPES = { '.html':'text/html; charset=utf-8', '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.js':'text/javascript', '.css':'text/css' };

function serve() {
  return new Promise(resolve => {
    const srv = http.createServer((req, res) => {
      let p = decodeURIComponent(req.url.split('?')[0]);
      if (p === '/') p = '/index.html';
      if (p === '/index_test.html') {
        // Copie de test virtuelle (aucun fichier écrit dans le dépôt) : expose quelques fonctions internes.
        let html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
        const hook = "\n  window.__t = { onPracticeAnswered:onPracticeAnswered, completeChallenge:completeChallenge, checkTimedChallenge:checkTimedChallenge, resetProgress:resetProgress, CAT_REWARDS:CAT_REWARDS, BRAIN_REWARDS:BRAIN_REWARDS, CAT_SPRITES:CAT_SPRITES, BRAINROT_SPRITES:BRAINROT_SPRITES, ownedCats:ownedCats, ownedBrain:ownedBrain, setGlobalLevel:setGlobalLevel, startCountdown:startCountdown, endCountdown:endCountdown, getStreak:function(){return freeStreak;}, __eval:function(c){ return eval(c); } };\n";
        const i = html.lastIndexOf('\n})();\n</script>');
        html = html.slice(0, i) + hook + html.slice(i);
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); res.end(html); return;
      }
      const f = path.join(ROOT, p);
      if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end('nf'); return; }
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' });
      fs.createReadStream(f).pipe(res);
    });
    srv.listen(0, () => resolve({ srv, port: srv.address().port }));
  });
}

async function withPage(opts, fn) {
  if (typeof opts === 'function') { fn = opts; opts = {}; }
  const { srv, port } = await serve();
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const ctx = await browser.newContext({ viewport: opts.viewport || { width: 390, height: 780 } });
  if (opts.init) await ctx.addInitScript(opts.init);
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => { errors.push(e.message); console.log('PAGEERROR:', e.message); });
  await page.goto(`http://localhost:${port}/${opts.page || 'index.html'}`);
  await page.waitForTimeout(250);
  const startBtn = await page.$('#splash-start-btn');
  if (startBtn) { await startBtn.click(); await page.waitForTimeout(250); }
  try { await fn(page, port); } finally {
    await browser.close(); srv.close();
  }
  console.log('PAGE ERRORS:', errors.length);
  return errors;
}
const SHOTS = '/tmp/geo_tests/';
module.exports = { withPage, SHOTS };
