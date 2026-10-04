// Boutique à jour des étoiles (bug du 04/10/2026) : on ouvre la boutique avec trop
// peu d'étoiles, on la referme, on gagne des étoiles en répondant juste, et on la
// rouvre : le compteur et les boutons « Acheter » doivent suivre, sans avoir à
// changer de clan. Même chose si des étoiles arrivent pendant que la boutique est ouverte.
const { withPage } = require('./lib');
withPage({ page: 'index_test.html', viewport: { width: 390, height: 900 },
  init: "localStorage.setItem('geo_stars','0'); localStorage.setItem('geo_theme','cats');" }, async (page) => {
  const ev = c => page.evaluate(x => window.__t.__eval(x), c);
  let bad = 0; const chk = (ok, msg) => { console.log(ok ? '  ok' : '  ✘', msg); if (!ok) bad++; };
  // pas de visite guidée pendant le test
  await ev(`if(typeof guideSeen==='object'){ for(var k in guideSeen) guideSeen[k]=true; guideSeen.boutique=true; }`);
  const shopState = () => page.evaluate(() => ({
    count: document.getElementById('shop-star-count').textContent,
    top: document.getElementById('starCount').textContent,
    buyable: [...document.querySelectorAll('#shop-grid .sp-buy:not(.sp-info)')].filter(b => !b.disabled).length
  }));
  const cheapest = await ev(`Math.min.apply(null, currentShopList().filter(function(s){ return !currentOwnedMap()[s.id] && s.challenge === -1 && s.cost > 0; }).map(function(s){ return s.cost; }))`);
  console.log('personnage le moins cher :', cheapest, '⭐');
  await page.click('#stars-btn');
  let s = await shopState();
  chk(s.count === '0' && s.buyable === 0, 'boutique ouverte à 0 ⭐ : rien à acheter ' + JSON.stringify(s));
  await page.click('#stars-btn');                       // on referme
  // on gagne des étoiles en répondant juste au quiz (vraies réponses)
  await ev(`appMode='manual'; manualFamily='qcm';`);
  for (let i = 0; i < cheapest; i++) {
    await ev(`generateFamilyQuestion('qcm'); [].slice.call(document.querySelectorAll('#m4-choices .choice-btn')).filter(function(b){ return b._ok; })[0].click();`);
  }
  const top = await page.evaluate(() => document.getElementById('starCount').textContent);
  chk(top === String(cheapest), 'compteur du haut : ' + top + ' ⭐');
  await page.click('#stars-btn');
  s = await shopState();
  chk(s.count === top, 'à la réouverture, la boutique affiche le même total que le haut (' + s.count + ')');
  chk(s.buyable > 0, 'à la réouverture, au moins un bouton « Acheter » est actif (' + s.buyable + ')');
  // étoiles gagnées pendant que la boutique est ouverte
  await ev(`addStar(5)`);
  s = await shopState();
  chk(s.count === String(cheapest + 5), 'boutique ouverte : le total suit un gain d\'étoiles (' + s.count + ')');
  console.log(bad ? 'ÉCHEC (' + bad + ')' : 'OK');
});
