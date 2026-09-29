const { withPage, SHOTS } = require('./lib');
withPage({ viewport: { width: 390, height: 900 } }, async (page) => {
  async function openArena() {
    await page.click('#menu-btn');
    await page.click('.tab-btn[data-tab="arena"]');
    await page.waitForTimeout(150);
  }
  await openArena();
  await page.screenshot({ path: SHOTS + 'b_shop.png', fullPage: true });
  console.log('shop cards:', await page.evaluate(() => document.querySelectorAll('#shop-grid .sprite-card').length),
    'count text:', await page.evaluate(() => document.getElementById('shop-collection-count').textContent));
  console.log('reward-locked cards:', await page.evaluate(() => document.querySelectorAll('#shop-grid .reward-locked').length));
  // click a locked reward -> info dialog
  await page.evaluate(() => document.querySelector('#shop-grid .reward-locked').click());
  await page.waitForTimeout(150);
  console.log('info dialog open:', await page.evaluate(() => !document.getElementById('info-overlay').hidden),
    '| title:', await page.evaluate(() => document.getElementById('info-title').textContent),
    '| text:', await page.evaluate(() => document.getElementById('info-body').textContent));
  await page.screenshot({ path: SHOTS + 'b_info.png' });
  await page.keyboard.press('Escape');
  console.log('closed with Escape:', await page.evaluate(() => document.getElementById('info-overlay').hidden));

  // battle setup
  await page.evaluate(() => [...document.querySelectorAll('#arena-modes .level-btn')].find(x => x.textContent.includes('Bataille')).click());
  await page.waitForTimeout(150);
  // team pick: all starters should be selectable
  const counts = await page.evaluate(() => ['classic','support','archer'].map(r => document.querySelectorAll('#bt-grid-' + r + ' .sprite-card').length));
  console.log('owned per role (expected 3/1/1 for a fresh start):', counts);
  // auto-pick
  for (const role of ['classic', 'support', 'archer']) {
    const n = await page.evaluate(r => document.querySelectorAll('#bt-grid-' + r + ' .sprite-card').length, role);
    for (let i = 0; i < n; i++) {
      await page.evaluate(([r, i]) => document.querySelectorAll('#bt-grid-' + r + ' .sprite-card')[i].click(), [role, i]);
    }
  }
  console.log('start disabled?', await page.evaluate(() => document.getElementById('bt-start').disabled));
  await page.screenshot({ path: SHOTS + 'b_setup.png', fullPage: true });
  await page.click('#bt-start');
  await page.waitForTimeout(200);
  await page.screenshot({ path: SHOTS + 'b_arena0.png', fullPage: true });

  // play until over (max 60 player turns)
  let turns = 0;
  const t0 = Date.now(); while (turns < 40 && Date.now() - t0 < 60000) {
    const over = await page.evaluate(() => !document.getElementById('bt-over').hidden);
    if (over) break;
    const canPick = await page.evaluate(() => [...document.querySelectorAll('#bt-player-field .bcard')].some(b => !b.disabled));
    if (canPick) {
      await page.evaluate(() => { const b = [...document.querySelectorAll('#bt-player-field .bcard')].find(x => !x.disabled); b.click(); });
      await page.waitForTimeout(50);
      await page.evaluate(() => { const t = [...document.querySelectorAll('#bt-enemy-field .bcard')].find(x => !x.disabled); if (t) t.click(); });
      turns++;
      if (turns === 2) { await page.waitForTimeout(700); await page.screenshot({ path: SHOTS + 'b_arena_mid.png', fullPage: true }); }
    }
    await page.waitForTimeout(400);
  }
  console.log('turns played:', turns, 'over text:', await page.evaluate(() => document.getElementById('bt-over-text').textContent));
  console.log('log:', await page.evaluate(() => document.getElementById('bt-log').textContent));
  await page.screenshot({ path: SHOTS + 'b_over.png', fullPage: true });
  console.log('stars:', await page.evaluate(() => document.getElementById('starCount').textContent));

  // theme toggle should reset to setup with the other clan
  await page.click('#theme-toggle');
  await page.waitForTimeout(200);
  console.log('after theme toggle: setup visible?', await page.evaluate(() => !document.getElementById('bt-setup').hidden),
    'intro:', await page.evaluate(() => document.getElementById('bt-intro').textContent));
  const counts2 = await page.evaluate(() => ['classic','support','archer'].map(r => document.querySelectorAll('#bt-grid-' + r + ' .sprite-card').length));
  console.log('brainrot owned per role:', counts2);
  await page.screenshot({ path: SHOTS + 'b_setup_brainrot.png', fullPage: true });
});
