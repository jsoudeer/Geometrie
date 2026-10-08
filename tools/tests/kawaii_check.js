// Team Kawaii : les nouveaux membres (chiens, lapins) ont leurs images (visage + en pied) et leurs noms ; le clan s'appelle « Team Kawaii ».
const { withPage } = require('./lib');
withPage({ page: 'index_test.html', viewport: { width: 390, height: 780 } }, async (page) => {
  let bad = 0; const chk = (ok, msg) => { console.log(ok ? '  ok' : '  ✘ ÉCHEC', msg); if (!ok) bad++; };
  const ev = c => page.evaluate(x => window.__t.__eval(x), c);
  const want = { cat13:'Postou', cat14:'Vroumi', cat15:'Kimono', cat16:'Bondi', cat17:'Souplesse', cat18:'Frisette', cat19:'Carotin' };
  const got = JSON.parse(await ev(`JSON.stringify(${JSON.stringify(Object.keys(want))}.map(function(id){ var s = findAnySprite(id), e = CUSTOM_IMG[id]; return [id, s && s.name, !!(e && e.f && e.u)]; }))`));
  chk(got.every(([id, name, img]) => name === want[id] && img), 'les 7 nouveaux membres ont nom, visage et image en pied : ' + got.map(g => g[1]).join(', '));
  await ev("unlockAllSprites(); 0");
  await page.click('#stars-btn'); await page.waitForTimeout(500);
  const shop = await page.evaluate(() => ({ tag: document.getElementById('shop-clan-tag').textContent, imgs: [...document.querySelectorAll('#shop-grid .sprite-card')].filter(c => /Postou|Vroumi|Kimono|Bondi|Souplesse|Frisette|Carotin/.test(c.textContent)).filter(c => c.querySelector('img.sp-custom-img')).length }));
  chk(/Team Kawaii/.test(shop.tag), 'boutique : clan « ' + shop.tag + ' »');
  chk(shop.imgs === 7, 'boutique : les 7 nouveaux s\'affichent avec leur image');
  await page.click('#battle-btn'); await page.waitForTimeout(300);
  chk(/Team Kawaii/.test(await page.evaluate(() => document.getElementById('bt-intro').textContent)), 'bataille : « Tu joues avec la Team Kawaii »');
  chk(!/Chats kawaii|Chats Kawaii/.test(await page.evaluate(() => document.body.innerText)), 'plus de « Chats kawaii » à l\'écran');
  console.log(bad ? 'ÉCHEC' : 'kawaii_check OK'); process.exit(bad ? 1 : 0);
});
