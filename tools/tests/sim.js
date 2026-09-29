// Simulation rapide des règles de combat (mêmes règles que dans l'appli) pour vérifier l'équilibrage
function rnd(n){return Math.floor(Math.random()*n);}
function shuffle(a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=rnd(i+1);[a[i],a[j]]=[a[j],a[i]];}return a;}
const START = [ {n:'a',pts:8,role:'classic'},{n:'b',pts:8,role:'classic'},{n:'c',pts:7,role:'classic'},{n:'d',pts:8,role:'support'},{n:'e',pts:7,role:'archer'} ];
// pool ennemi (pts des brainrots base + rewards), approx: pts = round(sum/2.4)
const base = [[5,4,3,4,'classic'],[4,3,5,3,'classic'],[4,5,4,3,'classic'],[3,6,4,4,'support'],[5,4,4,4,'archer'],[6,3,4,3,'classic'],[3,5,5,4,'classic'],[4,4,5,4,'classic'],
 [6,6,5,6,'classic'],[7,5,6,5,'support'],[5,7,7,5,'archer'],[6,6,6,7,'classic'],[7,7,5,6,'classic'],[6,5,7,6,'support'],[8,7,7,6,'classic'],[7,8,6,8,'archer'],[8,8,6,7,'classic'],[7,7,8,8,'support'],[9,8,9,8,'classic'],[10,9,8,9,'archer']]
 .map((r,i)=>({n:'e'+i,pts:Math.max(4,Math.round((r[0]+r[1]+r[2]+r[3])/2.4)),role:r[4]}));
const roles=['classic','support','archer'];
const rewardRoles=['classic','support','classic','archer','classic'];
for(let k=0;k<15;k++) base.push({n:'r'+k,pts:8+Math.floor(k*0.5)+(k>=12?2:0),role:rewardRoles[k%5]});
function buildEnemy(mine, slack){
  const maxMine=Math.max(...mine.map(u=>u.pts));
  function pickRole(role,n){ const all=base.filter(s=>s.role===role); let c=all.filter(s=>s.pts<=maxMine+slack); if(c.length<n) c=all.slice().sort((a,b)=>a.pts-b.pts).slice(0,Math.max(n,3)); return shuffle(c).slice(0,n); }
  return pickRole('classic',3).concat(pickRole('support',1),pickRole('archer',1));
}
function mk(s){return {role:s.role,pts:s.pts,buffed:false,n:s.n};}
function arrive(side,u){ if(u.role==='support'){side.field.forEach(x=>{if(x!==u){x.pts+=5;}});} else if(side.field.some(x=>x!==u&&x.role==='support')){u.pts+=5;} }
function draw(side){ if(!side.reserve.length||side.field.length>=3) return; const u=side.reserve.splice(rnd(side.reserve.length),1)[0]; side.field.push(u); arrive(side,u); }
function alive(s){return s.field.length+s.reserve.length>0;}
function attack(att,a,def,t){ const dt=a.pts, da=a.role==='archer'?0:t.pts; t.pts-=dt; a.pts-=da; [att,def].forEach(sd=>{ const dead=sd.field.filter(u=>u.pts<=0); dead.forEach(d=>{sd.field.splice(sd.field.indexOf(d),1);}); dead.forEach(()=>draw(sd)); while(sd.field.length<3&&sd.reserve.length) draw(sd);}); }
function enemyMove(en,pl){ let best=null,bs=-1e9; en.field.forEach(a=>pl.field.forEach(t=>{const archer=a.role==='archer';const kills=a.pts>=t.pts,dies=!archer&&t.pts>=a.pts;const sc=(kills?4:0)+(dies?-5:0)+(archer?2:0)+a.pts*0.05-t.pts*0.1+Math.random(); if(sc>bs){bs=sc;best={a,t};}})); return best; }
function playerMove(pl,en,mode){
  if(mode==='random'){ return {a:pl.field[rnd(pl.field.length)], t:en.field[rnd(en.field.length)]}; }
  // "sensé" : même heuristique que l'ennemi
  return enemyMove(pl,en);
}
function game(mode,slack){
  const pl={field:[],reserve:START.map(mk)}; const en={field:[],reserve:buildEnemy(START,slack).map(mk)};
  for(let i=0;i<3;i++){draw(pl);draw(en);}
  let turn=0;
  while(alive(pl)&&alive(en)&&turn<200){
    const m=playerMove(pl,en,mode); attack(pl,m.a,en,m.t); if(!alive(en)||!alive(pl))break;
    const e=enemyMove(en,pl); attack(en,e.a,pl,e.t); turn++;
  }
  const me=alive(pl),foe=alive(en);
  return me&&!foe?'win':(!me&&foe?'loss':'draw');
}
for(const slack of [2,0,-1]){
  for(const mode of ['random','smart']){
    const r={win:0,loss:0,draw:0}; for(let i=0;i<4000;i++) r[game(mode,slack)]++;
    console.log('slack',slack,mode,'win%',(r.win/40).toFixed(1),'loss%',(r.loss/40).toFixed(1),'draw%',(r.draw/40).toFixed(1));
  }
}
