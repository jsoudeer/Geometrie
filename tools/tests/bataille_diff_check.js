// Difficulté de la Bataille : total des points adverses = celui du joueur ×0,8 / ×1 / ×1,2 (au plus près).
const { withPage } = require('./lib');
const assert = require('assert');
withPage({ page: 'index_test.html', viewport: { width: 390, height: 900 } }, async (page) => {
  const ev = c => page.evaluate(x => window.__t.__eval(x), c);
  await ev('unlockAllSprites()');
  for (const side of ['cats', 'brainrot']) {
    await ev(`applyTheme('${side}')`);
    const r = JSON.parse(await ev(`(function(){ var out=[]; for(var d=0; d<3; d++){ btDiff=d; var worst=0, avgRatio=0, n=200, teams={};
      for(var i=0;i<n;i++){
        var mine = [].concat(btShuffle(btMyList().filter(function(s){return s.role==='classic';})).slice(0,3), btShuffle(btMyList().filter(function(s){return s.role==='support';})).slice(0,1), btShuffle(btMyList().filter(function(s){return s.role==='archer';})).slice(0,1)).map(btMakeUnit);
        var en = btBuildEnemyTeam(mine), roles = en.map(function(u){return u.sprite.role;}).sort().join(',');
        if(roles!=='archer,classic,classic,classic,support') return JSON.stringify({err:'composition '+roles});
        var target = btTotal(mine)*BT_DIFFS[d].factor, gap = Math.abs(btTotal(en)-target); if(gap>worst) worst=gap;
        avgRatio += btTotal(en)/btTotal(mine); teams[en.map(function(u){return u.sprite.id;}).sort().join('')]=1;
      } out.push({diff:BT_DIFFS[d].name, worstGap:worst, ratio:+(avgRatio/n).toFixed(3), distinctTeams:Object.keys(teams).length}); }
      btDiff=1; return JSON.stringify(out); })()`));
    console.log(side, JSON.stringify(r));
    assert(!r.err, r.err);
    assert(r[0].ratio < r[1].ratio && r[1].ratio < r[2].ratio, 'facile < normal < difficile');
    assert(Math.abs(r[0].ratio - 0.8) < 0.04 && Math.abs(r[1].ratio - 1) < 0.04 && Math.abs(r[2].ratio - 1.2) < 0.04, 'ratios proches de 0,8 / 1 / 1,2');
  }
  // UI : la difficulté est demandée dans la préparation du combat
  await ev(`applyTheme('cats')`);
  await page.click('#battle-btn');
  await ev(`(function(){ var sel=btSel.cats; sel.classic=btMyList().filter(function(s){return s.role==='classic';}).slice(0,3).map(function(s){return s.id;}); sel.support=btMyList().filter(function(s){return s.role==='support';}).slice(0,1).map(function(s){return s.id;}); sel.archer=btMyList().filter(function(s){return s.role==='archer';}).slice(0,1).map(function(s){return s.id;}); renderBtSetup(); })()`);
  await page.evaluate(() => [...document.querySelectorAll('#bt-diff-row .level-btn')].find(x => /Difficile/.test(x.textContent)).click());
  console.log('note :', await page.evaluate(() => document.getElementById('bt-diff-note').textContent));
  await page.screenshot({ path: '/tmp/geo_tests/bt_diff.png', fullPage: true });
  await page.click('#bt-start'); await page.waitForTimeout(300);
  console.log('titre adverse :', await page.evaluate(() => document.getElementById('bt-enemy-title').textContent));
  console.log('bataille difficulté OK');
});
