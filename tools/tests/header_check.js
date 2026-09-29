const { withPage, SHOTS } = require('./lib');
withPage(async (page) => {
  await page.screenshot({ path: SHOTS + 'h_default.png' });
  await page.click('#menu-btn');
  await page.waitForTimeout(100);
  await page.screenshot({ path: SHOTS + 'h_menu_open.png' });
  console.log('nav hidden after open?', await page.evaluate(() => document.getElementById('main-nav').hidden));
  await page.click('.tab-btn[data-tab="moyen"]');
  console.log('nav hidden after choose?', await page.evaluate(() => document.getElementById('main-nav').hidden));
  await page.click('#theme-toggle');
  await page.waitForTimeout(200);
  console.log('theme now:', await page.evaluate(() => document.body.getAttribute('data-app-theme')), 'toggle label:', await page.evaluate(() => document.getElementById('theme-toggle').getAttribute('aria-label')));
  await page.screenshot({ path: SHOTS + 'h_brainrot.png' });
  // chrono + home
  await page.click('#menu-btn'); await page.click('.tab-btn[data-tab="facile"]');
  await page.evaluate(() => [...document.querySelectorAll('#practice-mode .level-btn')].find(x => x.textContent.includes('Chrono')).click());
  await page.click('#countdown-start-btn');
  await page.waitForTimeout(300);
  await page.screenshot({ path: SHOTS + 'h_chrono.png' });
  await page.click('#countdown-home-btn');
  await page.waitForTimeout(300);
  console.log('after home: chrono-compact?', await page.evaluate(() => document.body.classList.contains('chrono-compact')),
    'topbar visible?', await page.evaluate(() => getComputedStyle(document.querySelector('.topbar')).display !== 'none'),
    'practiceExercise hidden?', await page.evaluate(() => document.getElementById('practice-exercise').hidden));
  await page.screenshot({ path: SHOTS + 'h_afterhome.png' });
});
