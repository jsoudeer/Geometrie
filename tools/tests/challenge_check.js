const { withPage, SHOTS } = require('./lib');
withPage({ page: 'index_test.html', viewport: { width: 390, height: 800 } }, async (page) => {
  const T = () => page.evaluate(() => ({
    cats: Object.keys(window.__t.ownedCats).filter(k => /^cat(2[1-9]|3\d)$/.test(k)),
    brain: Object.keys(window.__t.ownedBrain).filter(k => /^br(2[1-9]|3\d)$/.test(k)),
  }));
  console.log('start rewards owned:', JSON.stringify(await T()));
  // 1) défi chrono Facile 1 min : 4 bonnes réponses -> pas de déblocage ; 5 -> déblocage
  console.log('4 correct/60s facile:', JSON.stringify(await page.evaluate(() => { const r = window.__t.checkTimedChallenge(0, 60, 4); return { k: r.k, fresh: r.fresh.map(s => s.name), done: r.done }; })));
  console.log('5 correct/60s facile:', JSON.stringify(await page.evaluate(() => { const r = window.__t.checkTimedChallenge(0, 60, 5); return { k: r.k, fresh: r.fresh.map(s => s.name), done: r.done }; })));
  console.log('again 6 correct/60s facile (already done):', JSON.stringify(await page.evaluate(() => { const r = window.__t.checkTimedChallenge(0, 60, 6); return { fresh: r.fresh.length, done: r.done }; })));
  console.log('owned now:', JSON.stringify(await T()));
  // seuils
  const th = await page.evaluate(() => { const out = []; for (let lv = 0; lv < 3; lv++) for (const d of [60,120,180,300]) { const r = window.__t.checkTimedChallenge(lv, d, 0); out.push(lv + ':' + d + '→k' + r.k + '/needs ' + r.target); } return out; });
  console.log(th.join(' | '));
  // 2) vrai chrono avec horloge simulée
  await page.evaluate(() => document.getElementById('menu-btn').click());
  await page.click('.tab-btn[data-tab="moyen"]');
  await page.evaluate(() => [...document.querySelectorAll('#practice-mode .level-btn')].find(x => x.textContent.includes('Chrono')).click());
  await page.evaluate(() => [...document.querySelectorAll('#countdown-time-row .level-btn')].find(x => x.textContent.includes('2 min')).click());
  await page.click('#countdown-start-btn');
  for (let i = 0; i < 6; i++) await page.evaluate(() => window.__t.onPracticeAnswered(true)); // 6 bonnes réponses (Moyen 2 min = 6 requises)
  await page.evaluate(() => window.__t.endCountdown());
  await page.waitForTimeout(500);
  console.log('results text:', await page.evaluate(() => document.getElementById('countdown-results-text').textContent));
  console.log('unlock dialog title:', await page.evaluate(() => document.getElementById('info-title').textContent), 'open:', await page.evaluate(() => !document.getElementById('info-overlay').hidden));
  await page.screenshot({ path: SHOTS + 'ch_unlock.png' });
  await page.keyboard.press('Escape');
  // 3) série de 20 en aléatoire, niveau Difficile
  await page.evaluate(() => document.getElementById('menu-btn').click());
  await page.click('.tab-btn[data-tab="difficile"]');
  await page.evaluate(() => [...document.querySelectorAll('#practice-mode .level-btn')].find(x => x.textContent.includes('Aléatoire')).click());
  await page.waitForTimeout(200);
  console.log('streak pill visible:', await page.evaluate(() => !document.getElementById('streak-pill').hidden), await page.evaluate(() => document.getElementById('streak-pill').textContent));
  for (let i = 0; i < 19; i++) await page.evaluate(() => window.__t.onPracticeAnswered(true));
  console.log('after 19:', await page.evaluate(() => window.__t.getStreak()), 'dialog open?', await page.evaluate(() => !document.getElementById('info-overlay').hidden));
  await page.evaluate(() => window.__t.onPracticeAnswered(false));
  console.log('after error:', await page.evaluate(() => window.__t.getStreak()));
  for (let i = 0; i < 20; i++) await page.evaluate(() => window.__t.onPracticeAnswered(true));
  console.log('after 20 streak: dialog', await page.evaluate(() => document.getElementById('info-title').textContent), 'owned', JSON.stringify(await T()));
  await page.screenshot({ path: SHOTS + 'ch_streak.png' });
  await page.keyboard.press('Escape');
  // 4) reset
  await page.click('#settings-btn');
  await page.click('#reset-progress-btn');
  await page.screenshot({ path: SHOTS + 'ch_reset_confirm.png' });
  await page.click('#reset-yes');
  console.log('after reset:', JSON.stringify(await T()), 'stars', await page.evaluate(() => document.getElementById('starCount').textContent),
    'owned starters cat:', await page.evaluate(() => Object.keys(window.__t.ownedCats).length), 'mascot ls:', await page.evaluate(() => localStorage.getItem('geo_mascot_id')));
});
