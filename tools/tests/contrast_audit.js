// Audit de contraste (RGAA 3.2) : parcourt le texte visible de plusieurs écrans, dans les deux thèmes.
const { withPage, SHOTS } = require('./lib');

const AUDIT = () => {
  function parse(c) {
    const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null;
    const p = m[1].split(',').map(x => parseFloat(x));
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  }
  function blend(fg, bg) { const a = fg.a; return { r: fg.r * a + bg.r * (1 - a), g: fg.g * a + bg.g * (1 - a), b: fg.b * a + bg.b * (1 - a), a: 1 }; }
  function lum(c) { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); }
  function ratio(a, b) { const l1 = lum(a), l2 = lum(b); return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05); }
  function bgOf(el) {
    const chain = [];
    for (let e = el; e; e = e.parentElement) chain.push(e);
    let base = { r: 255, g: 255, b: 255, a: 1 };
    const bodyBg = parse(getComputedStyle(document.body).backgroundColor); if (bodyBg && bodyBg.a > 0) base = bodyBg;
    for (let i = chain.length - 1; i >= 0; i--) {
      const c = parse(getComputedStyle(chain[i]).backgroundColor);
      if (c && c.a > 0) base = c.a >= 1 ? c : blend(c, base);
    }
    return base;
  }
  const out = [];
  const seen = new Set();
  document.querySelectorAll('body *').forEach(el => {
    if (['SCRIPT', 'STYLE', 'SVG', 'PATH'].includes(el.tagName.toUpperCase())) return;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') return;
    const r = el.getBoundingClientRect(); if (r.width < 2 || r.height < 2) return;
    // texte direct
    const txt = [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent.trim()).join(' ').trim();
    if (!txt) return;
    if (el.closest('svg')) return;
    let op = 1; for (let e = el; e; e = e.parentElement) { op *= parseFloat(getComputedStyle(e).opacity); }
    const fg0 = parse(cs.color); if (!fg0) return;
    const bg = bgOf(el);
    const fg = (fg0.a*op) < 1 ? blend({ r: fg0.r, g: fg0.g, b: fg0.b, a: fg0.a*op }, bg) : fg0;
    const rt = ratio(fg, bg);
    const size = parseFloat(cs.fontSize), bold = parseInt(cs.fontWeight) >= 700;
    const large = size >= 24 || (size >= 18.66 && bold);
    const need = large ? 3 : 4.5;
    if (rt < need) {
      const key = el.tagName + '.' + el.className + '|' + txt.slice(0, 20);
      if (seen.has(key)) return; seen.add(key);
      out.push({ txt: txt.slice(0, 40), ratio: Math.round(rt * 100) / 100, need, size, sel: el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.split(' ').join('.') : ''), fg: cs.color, bg: `rgb(${Math.round(bg.r)},${Math.round(bg.g)},${Math.round(bg.b)})`, op });
    }
  });
  return out;
};

(async () => {
  for (const theme of ['cats', 'brainrot']) {
    await withPage({ viewport: { width: 390, height: 900 }, init: `localStorage.setItem('geo_theme','${theme}')` }, async (page) => {
      const openTab = async (t) => { await page.evaluate(() => { const n = document.getElementById('main-nav'); if (n.hidden) document.getElementById('menu-btn').click(); }); await page.click('.tab-btn[data-tab="' + t + '"]'); };
      const screens = [
        ['home-measure', async () => {}],
        ['menu-open', async () => { await page.click('#menu-btn'); }],
        ['settings', async () => { await page.click('#settings-btn'); }],
        ['shop', async () => { await page.evaluate(() => document.getElementById('settings-overlay').hidden = true); await openTab('arena'); }],
        ['battle-setup', async () => { await page.evaluate(() => [...document.querySelectorAll('#arena-modes .level-btn')].find(x => x.textContent.includes('Bataille')).click()); }],
        ['manual-quizz', async () => {
          await openTab('manuel');
          await page.evaluate(() => [...document.querySelectorAll('#manual-family-row .level-btn')].find(x => x.textContent.includes('Quizz')).click());
        }],
      ];
      for (const [name, act] of screens) {
        await act(); await page.waitForTimeout(200);
        // répondre faux à une question quiz pour voir le feedback
        if (name === 'manual-quizz') {
          await page.evaluate(() => { const b = document.querySelector('#m4-choices button'); if (b) b.click(); });
          await page.waitForTimeout(200);
        }
        if (process.env.INJECT) await page.evaluate(() => { const e = document.querySelector('.muted'); if (e) e.style.color = '#cccccc'; });
        const res = await page.evaluate(AUDIT);
        console.log(`\n=== ${theme} / ${name} : ${res.length} problème(s)`);
        res.slice(0, 25).forEach(r => console.log(`  ${r.ratio} (<${r.need}) ${r.size}px "${r.txt}" ${r.sel} fg=${r.fg} bg=${r.bg}`));
        await page.screenshot({ path: SHOTS + `c_${theme}_${name}.png`, fullPage: true });
      }
    });
  }
})();
