// Alignement et Angles : la bonne réponse affichée est confirmée par un calcul indépendant sur le DESSIN produit.
const { withPage, SHOTS } = require('./lib');
withPage({ page: 'index_test.html', viewport: { width: 390, height: 900 } }, async (page) => {
  const ev = c => page.evaluate(x => window.__t.__eval(x), c);
  let bad = 0; const chk = (ok, m) => { console.log(ok ? '  ok' : '  ✘', m); if (!ok) bad++; };
  const res = JSON.parse(await ev(`(function(){
    function col(a,b,c){ return Math.abs((b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]))<1e-6; }
    var out={ errors:[], align:{}, angle:{} };
    function svg(){ return document.getElementById('m4Svg'); }
    function texts(){ var o={}; [].forEach.call(svg().querySelectorAll('text'), function(t){ o[t.textContent]=[+t.getAttribute('x'), +t.getAttribute('y')]; }); return o; }
    for(var lv=0;lv<3;lv++){
      out.align[lv]={}; out.angle[lv]={};
      for(var i=0;i<250;i++){
        try{
          var q=quizTypeById('align').generate(lv), oks=q.choices.filter(function(c){return c.ok;});
          if(oks.length!==1) out.errors.push('align ok!=1 lv'+lv);
          var kind='oui';
          if(/Parmi ces 4/.test(q.question)) kind='quatre'; else if(/aligné avec A et B/.test(q.question)) kind='candidat';
          out.align[lv][kind]=(out.align[lv][kind]||0)+1;
          q.draw(); var T=texts();
          if(kind==='candidat'){
            var good=['1','2','3','4'].filter(function(k){ return col(T.A,T.B,T[k]); });
            if(good.length!==1 || good[0]!==oks[0].label) out.errors.push('candidat faux lv'+lv+' '+good+' vs '+oks[0].label);
          } else if(kind==='quatre'){
            var L=['A','B','C','D'], tr=[[0,1,2],[0,1,3],[0,2,3],[1,2,3]].filter(function(t){ return col(T[L[t[0]]],T[L[t[1]]],T[L[t[2]]]); });
            var lab=tr.length===1 ? L[tr[0][0]]+', '+L[tr[0][1]]+' et '+L[tr[0][2]] : '?';
            if(tr.length!==1 || lab!==oks[0].label) out.errors.push('quatre faux lv'+lv+' '+lab+' vs '+oks[0].label);
          }
          if(new Set(q.choices.map(function(c){return c.label;})).size!==q.choices.length) out.errors.push('align doublon');
        }catch(e){ out.errors.push('align '+e.message); }
        try{
          var a=quizTypeById('angle').generate(lv), ok2=a.choices.filter(function(c){return c.ok;});
          if(ok2.length!==1) out.errors.push('angle ok!=1 lv'+lv);
          var k2='classer'; if(/le plus grand/.test(a.question)) k2='comparer'; else if(/angles droits/.test(a.question)) k2='droits';
          out.angle[lv][k2]=(out.angle[lv][k2]||0)+1;
          a.draw();
          if(k2==='comparer'){
            var ls=[].slice.call(svg().querySelectorAll('line')), degs=[];
            for(var j=0;j+1<ls.length;j+=2){ var cx=+ls[j].getAttribute('x1'), cy=+ls[j].getAttribute('y1');
              var a1=Math.atan2(cy-ls[j].getAttribute('y2'), ls[j].getAttribute('x2')-cx), a2=Math.atan2(cy-ls[j+1].getAttribute('y2'), ls[j+1].getAttribute('x2')-cx);
              var d=Math.abs(a2-a1)*180/Math.PI; if(d>180) d=360-d; degs.push(d); }
            var mx=Math.max.apply(null,degs), eq=degs.length===2 && Math.abs(degs[0]-degs[1])<0.5;
            var exp= eq ? 'Ils sont égaux' : ['A','B','C'][degs.indexOf(mx)];
            if(exp!==ok2[0].label) out.errors.push('comparer faux lv'+lv+' '+degs.map(Math.round)+' → '+exp+' vs '+ok2[0].label);
            var sorted=degs.slice().sort(function(x,y){return y-x;});
            if(!eq && sorted[0]-sorted[1] < [38,18,8][lv]) out.errors.push('écart trop faible lv'+lv+' '+degs.map(Math.round));
          } else if(k2==='droits'){
            var pp=svg().querySelector('polygon').getAttribute('points').split(' ').map(function(s){return s.split(',').map(Number);}), n=pp.length, cnt=0;
            pp.forEach(function(p,ii){ var pr=pp[(ii+n-1)%n], nx=pp[(ii+1)%n]; var v1=[pr[0]-p[0],pr[1]-p[1]], v2=[nx[0]-p[0],nx[1]-p[1]];
              var dd=Math.acos((v1[0]*v2[0]+v1[1]*v2[1])/Math.hypot(v1[0],v1[1])/Math.hypot(v2[0],v2[1]))*180/Math.PI; if(Math.abs(dd-90)<2) cnt++; });
            if(String(cnt)!==ok2[0].label) out.errors.push('droits faux lv'+lv+' '+cnt+' vs '+ok2[0].label);
          }
        }catch(e){ out.errors.push('angle '+e.message); }
      }
    }
    return JSON.stringify(out); })()`));
  chk(res.errors.length === 0, 'réponses confirmées par le dessin, une seule bonne, propositions distinctes' + (res.errors.length ? ' : ' + [...new Set(res.errors)].slice(0, 6).join(' | ') : ''));
  console.log('  alignement :', JSON.stringify(res.align)); console.log('  angles     :', JSON.stringify(res.angle));
  chk(!res.align[0].quatre && !res.align[0].candidat && res.align[1].quatre > 30 && res.align[2].candidat > 30, 'alignement : Facile = oui/non seulement ; Moyen/Difficile = 4 points et point candidat');
  chk(!res.angle[0].classer && res.angle[0].comparer > 50 && res.angle[0].droits > 50 && res.angle[2].classer > 30, 'angles : Facile sans classer ; trois variantes dès Moyen');
  // captures
  for (const [t, lvl, re, name] of [['align', 2, 'aligné avec A et B', 'align_candidat'], ['align', 1, 'Parmi ces 4', 'align_quatre'], ['angle', 2, 'plus grand', 'angle_comparer'], ['angle', 2, 'angles droits', 'angle_droits']]) {
    await ev(`globalLevel=${lvl}; m4TypeFilter='${t}'; showFamily('qcm'); (function(){ for(var k=0;k<300;k++){ newQCM(); if(/${re}/.test(m4Current.question)) break; } })()`);
    await page.waitForTimeout(900); await page.screenshot({ path: SHOTS + name + '.png' });
  }
  await ev(`m4TypeFilter='random'`);
  console.log(bad ? 'ÉCHEC' : 'OK');
});
