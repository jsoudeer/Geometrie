// Audit de variété : pour chaque type de quiz, 300 questions par niveau → nombre de questions distinctes.
const { withPage } = require('./lib');
withPage({ page: 'index_test.html', viewport: { width: 390, height: 900 } }, async (page) => {
  const out = await page.evaluate(() => window.__t.__eval(`(function(){
    var res=[]; var ids=[]; QCM_CATEGORIES.forEach(function(c){}); 
    QCM_TYPE_DEFS.forEach(function(t){ var row={id:t.id,cat:quizCategoryId(t),lv:[]};
      for(var lv=0;lv<3;lv++){ var set={}, ans={}, n=0, err=0;
        for(var i=0;i<300;i++){ try{ var q=t.generate(lv); n++;
          var d=''; if(q.draw){ try{ q.draw(); d=document.getElementById('m4Svg').innerHTML.replace(/var\\(--[a-z0-9]+\\)/g,''); }catch(e){} }
          set[q.question+'|'+q.explain+'|'+d+'|'+q.choices.map(function(c){return c.label;}).sort().join('/')]=1;
          var g=q.choices.filter(function(c){return c.good||c.correct||c.ok;})[0]; ans[g?g.label:'?']=1; }catch(e){err++;} }
        row.lv.push([Object.keys(set).length, Object.keys(ans).length, err]); }
      res.push(row); });
    return JSON.stringify(res); })()`));
  JSON.parse(out).forEach(r => console.log(r.id.padEnd(14), r.cat.padEnd(9), r.lv.map(x => x[0] + '/' + x[1] + (x[2] ? '!' + x[2] : '')).join('  ')));
});
