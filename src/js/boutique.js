  /* ===================== MODULE 6 : BOUTIQUE + BATAILLE =====================
     Personnages 100% originaux et procéduraux (dessinés en SVG, comme le
     reste de l'appli) : pas d'images téléchargées. Les créatures "brainrot"
     s'inspirent de l'esprit absurde/italien du mème mais n'en reprennent
     AUCUN personnage précis (ceux-ci sont des personnages protégés/reconnaissables,
     pas des images libres de droit) — noms, couleurs et accessoires inventés. */

  var STAT_KEYS = ['pow','spd','chaos','charm'];
  var STAT_LABELS = { pow:'💪 Puissance', spd:'⚡ Vitesse', chaos:'🌀 Chaos', charm:'✨ Charme' };
  // Les fonds des pastilles de rareté sont assez foncés pour que le texte
  // blanc posé dessus soit lisible (contraste ≥ 4,5:1, accessibilité).
  var RARITY_META = {
    commun:     { label:'Commun',     cost:8,  color:'#595959' },
    rare:       { label:'Rare',       cost:15, color:'#1D5EA6' },
    epique:     { label:'Épique',     cost:28, color:'#7B3FB8' },
    legendaire: { label:'Légendaire', cost:45, color:'#8A5200' },
    defi:       { label:'Défi',       cost:0,  color:'#A3246B' }
  };
  var CAT_COLORS   = ['#FFC2D1','#FFE29A','#C9F2C6','#BFE3FF','#E4C9FF','#FFD6B0','#C6FFF2','#F2C6E0',
                      '#FFB0A3','#B8C7FF','#D9D2C5','#C8E6A0'];
  var BRAIN_COLORS = ['#B7E85D','#5DE8C7','#F0857D','#7DA9F0','#F0CB5D','#C08DF0','#F07DC0','#8DF08D',
                      '#FFA65D','#5DC8F0','#E85D8A','#A0F0E0'];

  // Chaque personnage a UNE seule caractéristique, ses "points" (pts) : ce
  // sont à la fois sa force d'attaque et son énergie (PV) au combat. Il a
  // aussi un rôle : "classic" (attaque normale), "support" (Soutien : donne
  // +5 points à tous ses alliés en arrivant sur le terrain) ou "archer"
  // (attaque sans subir de dégâts en retour).
  function mkSprite(id, name, rarity, colorIdx, accessory, statArr, starter){
    var sum = statArr[0]+statArr[1]+statArr[2]+statArr[3];
    return {
      id:id, name:name, rarity:rarity, colorIdx:colorIdx, accessory:accessory,
      cost: starter ? 0 : RARITY_META[rarity].cost, starter: !!starter,
      stats:{ pow:statArr[0], spd:statArr[1], chaos:statArr[2], charm:statArr[3] },
      pts: Math.max(4, Math.round(sum/2.4)), role:'classic', challenge:-1
    };
  }
  // Personnage "récompense" : impossible à acheter, il se débloque en
  // relevant un défi (voir CHALLENGES plus bas).
  function mkReward(id, name, colorIdx, accessory, pts, role, challenge){
    return {
      id:id, name:name, rarity:'defi', colorIdx:colorIdx, accessory:accessory,
      cost:0, starter:false, stats:{ pow:pts, spd:pts, chaos:pts, charm:pts },
      pts:pts, role:role, challenge:challenge
    };
  }


  var CAT_SPRITES = [
    mkSprite('cat01','Lavandou','commun',0,'none',[4,5,3,6],true),
    mkSprite('cat02','Cœurette','commun',1,'bow',[3,6,4,5]),
    mkSprite('cat03','Pétale','commun',2,'none',[5,4,3,5]),
    mkSprite('cat04','Étoilou','commun',3,'bell',[4,4,4,6]),
    mkSprite('cat05','Éclairon','commun',4,'flower',[3,5,5,4]),
    mkSprite('cat06','Gouttelette','commun',5,'heart',[5,3,4,5]),
    mkSprite('cat07','Matchou','commun',6,'none',[4,4,5,5]),
    mkSprite('cat08','Capuche','commun',7,'bow',[3,5,4,5]),
    mkSprite('cat09','Footin','rare',0,'star',[6,6,5,7]),
    mkSprite('cat10','Merlinou','rare',1,'glasses',[7,5,6,5]),
    mkSprite('cat11','Fleurette','rare',2,'crown',[5,7,6,6]),
    mkSprite('cat12','Flammèche','rare',3,'bell',[6,6,7,5]),
    mkSprite('cat13','Velours','rare',4,'flower',[7,6,5,6]),
    mkSprite('cat14','Chamallow','rare',5,'bow',[6,7,5,6]),
    mkSprite('cat15','Pixel','epique',6,'star',[8,8,6,7]),
    mkSprite('cat16','Étincelle','epique',7,'crown',[7,7,8,8]),
    mkSprite('cat17','Câline','epique',0,'heart',[8,7,7,8]),
    mkSprite('cat18','Nougat','epique',1,'glasses',[7,8,8,7]),
    mkSprite('cat19','Impériale','legendaire',2,'crown',[9,9,8,9]),
    mkSprite('cat20','Céleste','legendaire',3,'star',[9,8,9,10])
  ];

  var BRAINROT_SPRITES = [
    mkSprite('br01','Baguetto Montone','commun',0,'spiky',[5,4,3,4],true),
    mkSprite('br02','Maiale Cuvetto','commun',1,'mustache',[4,3,5,3]),
    mkSprite('br03','Waffolo Papero','commun',2,'legs',[4,5,4,3]),
    mkSprite('br04','Spaghettino Orsetto','commun',3,'drill',[3,6,4,4]),
    mkSprite('br05','Televisiogatto','commun',4,'oneeye',[5,4,4,4]),
    mkSprite('br06','Elefantino Aspiro','commun',5,'antenna',[6,3,4,3]),
    mkSprite('br07','Cagnolino Ventilo','commun',6,'propeller',[3,5,5,4]),
    mkSprite('br08','Cannolotto Caos','commun',7,'horns',[4,4,5,4]),
    mkSprite('br09','Raviolone Rex','rare',0,'propeller',[6,6,5,6]),
    mkSprite('br10','Basilico Boom','rare',1,'legs',[7,5,6,5]),
    mkSprite('br11','Tortellino Tornado','rare',2,'antenna',[5,7,7,5]),
    mkSprite('br12','Focacciotto Fury','rare',3,'horns',[6,6,6,7]),
    mkSprite('br13','Zeppolino Zap','rare',4,'drill',[7,7,5,6]),
    mkSprite('br14','Panettonio Punch','rare',5,'spiky',[6,5,7,6]),
    mkSprite('br15','Mortadellone Max','epique',6,'antenna',[8,7,7,6]),
    mkSprite('br16','Caprese Comet','epique',7,'propeller',[7,8,6,8]),
    mkSprite('br17','Arancino Alieno','epique',0,'oneeye',[8,8,6,7]),
    mkSprite('br18','Struzzolino Strike','epique',1,'horns',[7,7,8,8]),
    mkSprite('br19','Gnoccotto Gigante','legendaire',2,'mustache',[9,8,9,8]),
    mkSprite('br20','Biscottino Blitz','legendaire',3,'propeller',[10,9,8,9])
  ];

  // Rôles des personnages de base + personnages de départ (3 classiques, 1
  // soutien, 1 archer par clan : de quoi former une équipe tout de suite).
  var ROLE_BY_ID = {
    cat04:'support', cat10:'support', cat14:'support', cat18:'support',
    cat05:'archer',  cat11:'archer',  cat16:'archer',  cat20:'archer',
    br04:'support',  br10:'support',  br14:'support',  br18:'support',
    br05:'archer',   br11:'archer',   br16:'archer',   br20:'archer'
  };
  var STARTER_IDS = ['cat01','cat02','cat03','cat04','cat05','br01','br02','br03','br04','br05'];
  CAT_SPRITES.concat(BRAINROT_SPRITES).forEach(function(sp){
    if(ROLE_BY_ID[sp.id]) sp.role = ROLE_BY_ID[sp.id];
    if(STARTER_IDS.indexOf(sp.id) !== -1){ sp.starter = true; sp.cost = 0; }
  });

  // 15 personnages par clan à débloquer en relevant des défis (12 défis
  // chronométrés + 3 séries sans faute). Le n° "challenge" (0..14) est le même
  // pour le chat et le brainrot : un défi réussi débloque celui du clan actif.
  var REWARD_ROLES = ['classic','support','classic','archer','classic'];
  var CAT_REWARD_DEFS = [
    ['Flocon',9,'halo'],['Muffin',8,'headphones'],['Caramel',10,'scarf'],['Zéphyr',11,'wizard'],
    ['Saphir',9,'moon'],['Truffe',10,'shades'],['Perle',8,'halo'],['Cookie',11,'headphones'],
    ['Aurore',9,'wizard'],['Volcan',10,'crown'],['Tonnerre',8,'shades'],['Comète',11,'moon'],
    ['Astro',9,'star'],['Galaxie',10,'wizard'],['Phénix',8,'crown']
  ];
  var BRAIN_REWARD_DEFS = [
    ['MiaoStation 5',8,'flame'],['Leone Spaghettoni',9,'bolt'],['Ciabattino Cric',10,'wings'],['Tiramisù Tuono',11,'sprout'],
    ['Carciofo Comico',8,'bolt'],['Bruschetta Bum',9,'flame'],['Pistacchio Pop',11,'wings'],['Cornetto Crash',10,'sprout'],
    ['Gorgonzolo Gong',8,'wings'],['Melanzano Magico',9,'sprout'],['Prosciutto Pazzo',10,'flame'],['Pecorino Pow',11,'bolt'],
    ['Limoncello Laser',8,'horns'],['Mozzarello Mega',9,'antenna'],['Tartufo Titano',10,'propeller']
  ];
  var CAT_REWARDS = CAT_REWARD_DEFS.map(function(d,k){
    return mkReward('cat'+(21+k), d[0], d[1], d[2], 8 + Math.floor(k*0.5) + (k>=12?2:0), REWARD_ROLES[k%5], k);
  });
  var BRAIN_REWARDS = BRAIN_REWARD_DEFS.map(function(d,k){
    return mkReward('br'+(21+k), d[0], d[1], d[2], 8 + Math.floor(k*0.5) + (k>=12?2:0), REWARD_ROLES[k%5], k);
  });
  CAT_SPRITES = CAT_SPRITES.concat(CAT_REWARDS);
  BRAINROT_SPRITES = BRAINROT_SPRITES.concat(BRAIN_REWARDS);

  function starPolygonPoints(cx,cy,outerR,innerR,spikes){
    spikes = spikes || 5;
    var pts = [];
    for(var k=0;k<spikes*2;k++){
      var r = (k%2===0) ? outerR : innerR;
      var ang = (Math.PI/spikes)*k - Math.PI/2;
      pts.push((cx+r*Math.cos(ang))+','+(cy+r*Math.sin(ang)));
    }
    return pts.join(' ');
  }

  function drawCatSprite(svg, sprite){
    while(svg.firstChild) svg.removeChild(svg.firstChild);
    svg.setAttribute('viewBox','0 0 140 140');
    var color = CAT_COLORS[sprite.colorIdx % CAT_COLORS.length];
    svg.appendChild(el('polygon',{points:'35,45 25,10 55,35', fill:color, stroke:'var(--text)','stroke-width':2.5,'stroke-linejoin':'round'}));
    svg.appendChild(el('polygon',{points:'105,45 115,10 85,35', fill:color, stroke:'var(--text)','stroke-width':2.5,'stroke-linejoin':'round'}));
    svg.appendChild(el('polygon',{points:'37,38 32,20 47,33', fill:'#FFD9E6'}));
    svg.appendChild(el('polygon',{points:'103,38 108,20 93,33', fill:'#FFD9E6'}));
    svg.appendChild(el('circle',{cx:70,cy:78,r:48, fill:color, stroke:'var(--text)','stroke-width':2.5}));
    svg.appendChild(el('circle',{cx:38,cy:88,r:9, fill:'#FF9EB8','fill-opacity':0.7}));
    svg.appendChild(el('circle',{cx:102,cy:88,r:9, fill:'#FF9EB8','fill-opacity':0.7}));
    svg.appendChild(el('circle',{cx:53,cy:75,r:5.5, fill:'#2B2B2B'}));
    svg.appendChild(el('circle',{cx:87,cy:75,r:5.5, fill:'#2B2B2B'}));
    svg.appendChild(el('circle',{cx:55,cy:73,r:1.6, fill:'#fff'}));
    svg.appendChild(el('circle',{cx:89,cy:73,r:1.6, fill:'#fff'}));
    svg.appendChild(el('polygon',{points:'70,86 65,92 75,92', fill:'#D9607A'}));
    svg.appendChild(el('path',{d:'M70,92 Q64,98 58,93', fill:'none', stroke:'var(--text)','stroke-width':2,'stroke-linecap':'round'}));
    svg.appendChild(el('path',{d:'M70,92 Q76,98 82,93', fill:'none', stroke:'var(--text)','stroke-width':2,'stroke-linecap':'round'}));
    [-1,1].forEach(function(side){
      for(var i=0;i<3;i++){
        var y = 84+i*6;
        svg.appendChild(el('line',{x1:70+side*36, y1:y, x2:70+side*58, y2:y-3+i*3, stroke:'var(--text)','stroke-width':1.4,'stroke-linecap':'round','stroke-opacity':0.55}));
      }
    });
    applyCatAccessory(svg, sprite.accessory);
  }

  function applyCatAccessory(svg, kind){
    if(kind==='bow'){
      svg.appendChild(el('polygon',{points:'95,30 112,20 112,40', fill:'#E85D9A', stroke:'var(--text)','stroke-width':1.8}));
      svg.appendChild(el('polygon',{points:'95,30 78,20 78,40', fill:'#E85D9A', stroke:'var(--text)','stroke-width':1.8}));
      svg.appendChild(el('circle',{cx:95,cy:30,r:5, fill:'#C43C79'}));
    } else if(kind==='bell'){
      svg.appendChild(el('circle',{cx:70,cy:118,r:8, fill:'#FFD24C', stroke:'var(--text)','stroke-width':1.8}));
      svg.appendChild(el('circle',{cx:70,cy:120,r:1.6, fill:'var(--text)'}));
    } else if(kind==='flower'){
      [0,72,144,216,288].forEach(function(a){
        var rad = a*Math.PI/180;
        svg.appendChild(el('circle',{cx:108+Math.cos(rad)*7, cy:22+Math.sin(rad)*7, r:5, fill:'#FF8FAE'}));
      });
      svg.appendChild(el('circle',{cx:108,cy:22,r:4, fill:'#FFD24C'}));
    } else if(kind==='heart'){
      svg.appendChild(el('path',{d:'M30,84 C26,78 34,74 38,80 C42,74 50,78 46,84 L38,92 Z', fill:'#FF5D8F'}));
      svg.appendChild(el('path',{d:'M102,84 C98,78 106,74 110,80 C114,74 122,78 118,84 L110,92 Z', fill:'#FF5D8F'}));
    } else if(kind==='star'){
      svg.appendChild(el('polygon',{points:starPolygonPoints(28,92,9,4), fill:'#FFD24C', stroke:'var(--text)','stroke-width':1.6,'stroke-linejoin':'round'}));
    } else if(kind==='glasses'){
      svg.appendChild(el('circle',{cx:53,cy:75,r:11, fill:'none', stroke:'#2B2B2B','stroke-width':3}));
      svg.appendChild(el('circle',{cx:87,cy:75,r:11, fill:'none', stroke:'#2B2B2B','stroke-width':3}));
      svg.appendChild(el('line',{x1:64,y1:75,x2:76,y2:75, stroke:'#2B2B2B','stroke-width':3}));
    } else if(kind==='crown'){
      svg.appendChild(el('polygon',{points:'52,32 58,12 70,26 82,12 88,32', fill:'#FFD24C', stroke:'var(--text)','stroke-width':1.8,'stroke-linejoin':'round'}));
    } else if(kind==='halo'){
      svg.appendChild(el('ellipse',{cx:70,cy:20,rx:24,ry:7, fill:'none', stroke:'#F5B32A','stroke-width':5}));
    } else if(kind==='headphones'){
      svg.appendChild(el('path',{d:'M26,80 C26,20 114,20 114,80', fill:'none', stroke:'#4A4A6A','stroke-width':6,'stroke-linecap':'round'}));
      svg.appendChild(el('rect',{x:16,y:70,width:16,height:28,rx:7, fill:'#6B6BD6', stroke:'var(--text)','stroke-width':1.8}));
      svg.appendChild(el('rect',{x:108,y:70,width:16,height:28,rx:7, fill:'#6B6BD6', stroke:'var(--text)','stroke-width':1.8}));
    } else if(kind==='wizard'){
      svg.appendChild(el('polygon',{points:'46,36 70,2 94,36', fill:'#5B4BB0', stroke:'var(--text)','stroke-width':2,'stroke-linejoin':'round'}));
      svg.appendChild(el('ellipse',{cx:70,cy:36,rx:34,ry:6, fill:'#5B4BB0', stroke:'var(--text)','stroke-width':2}));
      svg.appendChild(el('polygon',{points:starPolygonPoints(70,18,6,2.6), fill:'#FFD24C'}));
    } else if(kind==='scarf'){
      svg.appendChild(el('path',{d:'M34,112 Q70,132 106,112 L110,124 Q70,146 30,124 Z', fill:'#E8534A', stroke:'var(--text)','stroke-width':2,'stroke-linejoin':'round'}));
      svg.appendChild(el('rect',{x:92,y:118,width:12,height:20,rx:3, fill:'#E8534A', stroke:'var(--text)','stroke-width':2}));
    } else if(kind==='moon'){
      svg.appendChild(el('path',{d:'M78,40 A14,14 0 1 0 78,62 A11,11 0 1 1 78,40 Z', fill:'#FFD24C', stroke:'var(--text)','stroke-width':1.6}));
    } else if(kind==='shades'){
      svg.appendChild(el('rect',{x:38,y:66,width:28,height:18,rx:6, fill:'#222', stroke:'#222','stroke-width':2}));
      svg.appendChild(el('rect',{x:74,y:66,width:28,height:18,rx:6, fill:'#222', stroke:'#222','stroke-width':2}));
      svg.appendChild(el('line',{x1:66,y1:73,x2:74,y2:73, stroke:'#222','stroke-width':3}));
    }
  }

  function drawBrainrotSprite(svg, sprite){
    while(svg.firstChild) svg.removeChild(svg.firstChild);
    svg.setAttribute('viewBox','0 0 140 140');
    var color = BRAIN_COLORS[sprite.colorIdx % BRAIN_COLORS.length];
    var bodyPts = [[70,20],[88,32],[110,28],[118,50],[112,72],[122,90],[104,104],[96,124],[70,132],
      [44,124],[36,104],[18,90],[28,72],[22,50],[30,28],[52,32]];
    svg.appendChild(el('polygon',{points:bodyPts.map(function(p){return p[0]+','+p[1];}).join(' '), fill:color, stroke:'var(--text)','stroke-width':2.5,'stroke-linejoin':'round'}));
    if(sprite.accessory !== 'oneeye'){
      svg.appendChild(el('circle',{cx:56,cy:72,r:12, fill:'#fff', stroke:'var(--text)','stroke-width':2}));
      svg.appendChild(el('circle',{cx:59,cy:74,r:5.5, fill:'#2B2B2B'}));
      svg.appendChild(el('circle',{cx:88,cy:76,r:7, fill:'#fff', stroke:'var(--text)','stroke-width':2}));
      svg.appendChild(el('circle',{cx:89,cy:77,r:3, fill:'#2B2B2B'}));
    }
    if(sprite.accessory !== 'mustache'){
      svg.appendChild(el('path',{d:'M42,98 L52,108 L60,96 L70,110 L80,96 L88,108 L98,98', fill:'none', stroke:'var(--text)','stroke-width':2.5,'stroke-linecap':'round','stroke-linejoin':'round'}));
    }
    applyBrainrotFeature(svg, sprite.accessory, color);
  }

  function applyBrainrotFeature(svg, kind, color){
    if(kind==='spiky'){
      [30,50,70,90,110].forEach(function(x,i){
        var h = (i%2===0) ? 18 : 26;
        svg.appendChild(el('polygon',{points:[x+','+(38-h), (x-7)+',40', (x+7)+',40'].join(' '), fill:color, stroke:'var(--text)','stroke-width':1.8,'stroke-linejoin':'round'}));
      });
    } else if(kind==='mustache'){
      svg.appendChild(el('path',{d:'M40,100 Q50,88 62,98 Q70,92 78,98 Q90,88 100,100 Q90,96 78,102 Q70,96 62,102 Q50,96 40,100 Z', fill:'#3A2A1E', stroke:'var(--text)','stroke-width':1.5}));
    } else if(kind==='legs'){
      svg.appendChild(el('line',{x1:55,y1:128,x2:50,y2:138, stroke:color,'stroke-width':6,'stroke-linecap':'round'}));
      svg.appendChild(el('line',{x1:85,y1:128,x2:90,y2:138, stroke:color,'stroke-width':6,'stroke-linecap':'round'}));
      svg.appendChild(el('circle',{cx:50,cy:139,r:4, fill:'var(--text)'}));
      svg.appendChild(el('circle',{cx:90,cy:139,r:4, fill:'var(--text)'}));
    } else if(kind==='drill'){
      svg.appendChild(el('polygon',{points:'70,6 60,26 80,26', fill:'#C6C6C6', stroke:'var(--text)','stroke-width':1.8,'stroke-linejoin':'round'}));
      svg.appendChild(el('line',{x1:63,y1:12,x2:77,y2:20, stroke:'var(--text)','stroke-width':1.5}));
      svg.appendChild(el('line',{x1:65,y1:18,x2:79,y2:24, stroke:'var(--text)','stroke-width':1.5}));
    } else if(kind==='oneeye'){
      svg.appendChild(el('circle',{cx:70,cy:72,r:22, fill:'#fff', stroke:'var(--text)','stroke-width':2.5}));
      svg.appendChild(el('circle',{cx:70,cy:72,r:9, fill:'#2B2B2B'}));
      svg.appendChild(el('circle',{cx:74,cy:68,r:3, fill:'#fff'}));
    } else if(kind==='antenna'){
      svg.appendChild(el('line',{x1:70,y1:20,x2:70,y2:2, stroke:'var(--text)','stroke-width':2.5}));
      svg.appendChild(el('circle',{cx:70,cy:2,r:6, fill:'#FFD24C', stroke:'var(--text)','stroke-width':1.8}));
    } else if(kind==='propeller'){
      svg.appendChild(el('line',{x1:70,y1:22,x2:70,y2:6, stroke:'var(--text)','stroke-width':2.5}));
      svg.appendChild(el('ellipse',{cx:70,cy:4,rx:18,ry:4.5, fill:color, stroke:'var(--text)','stroke-width':1.6}));
      svg.appendChild(el('circle',{cx:70,cy:4,r:2.5, fill:'var(--text)'}));
    } else if(kind==='horns'){
      svg.appendChild(el('polygon',{points:'44,26 36,4 54,20', fill:'#E8D65D', stroke:'var(--text)','stroke-width':1.8,'stroke-linejoin':'round'}));
      svg.appendChild(el('polygon',{points:'96,26 104,4 86,20', fill:'#E8D65D', stroke:'var(--text)','stroke-width':1.8,'stroke-linejoin':'round'}));
    } else if(kind==='flame'){
      svg.appendChild(el('path',{d:'M70,2 C84,16 92,24 84,34 C80,40 60,40 56,34 C48,24 62,16 70,2 Z', fill:'#FF7A1A', stroke:'var(--text)','stroke-width':1.8,'stroke-linejoin':'round'}));
      svg.appendChild(el('path',{d:'M70,14 C78,22 78,32 70,34 C62,32 62,22 70,14 Z', fill:'#FFD24C'}));
    } else if(kind==='bolt'){
      svg.appendChild(el('polygon',{points:'76,2 56,22 68,22 62,40 86,16 72,16', fill:'#FFD24C', stroke:'var(--text)','stroke-width':1.8,'stroke-linejoin':'round'}));
    } else if(kind==='wings'){
      svg.appendChild(el('path',{d:'M22,70 C0,52 -2,84 20,92 C6,96 18,112 34,104 Z', fill:'#FFFFFF', stroke:'var(--text)','stroke-width':1.8,'stroke-linejoin':'round'}));
      svg.appendChild(el('path',{d:'M118,70 C140,52 142,84 120,92 C134,96 122,112 106,104 Z', fill:'#FFFFFF', stroke:'var(--text)','stroke-width':1.8,'stroke-linejoin':'round'}));
    } else if(kind==='sprout'){
      svg.appendChild(el('line',{x1:70,y1:20,x2:70,y2:6, stroke:'#2E8B3A','stroke-width':3,'stroke-linecap':'round'}));
      svg.appendChild(el('ellipse',{cx:60,cy:6,rx:11,ry:6, fill:'#4CC65A', stroke:'var(--text)','stroke-width':1.5, transform:'rotate(-25 60 6)'}));
      svg.appendChild(el('ellipse',{cx:80,cy:6,rx:11,ry:6, fill:'#4CC65A', stroke:'var(--text)','stroke-width':1.5, transform:'rotate(25 80 6)'}));
    }
  }

  /* ---- Silhouette « mystère » : la MÊME image pour tous les personnages
     verrouillés d'un clan (un chat / un brainrot noir avec un « ? »). ---- */
  function drawMysterySprite(svg, side){
    while(svg.firstChild) svg.removeChild(svg.firstChild);
    svg.setAttribute('viewBox','0 0 140 140');
    var ink = '#22222b', rim = {stroke:'rgba(255,255,255,.4)','stroke-width':2,'stroke-linejoin':'round'};
    function shape(tag, attrs){ var a = {fill:ink}; for(var k in rim) a[k]=rim[k]; for(var j in attrs) a[j]=attrs[j]; svg.appendChild(el(tag, a)); }
    if(side === 'cats'){
      shape('polygon',{points:'35,45 25,10 55,35'});
      shape('polygon',{points:'105,45 115,10 85,35'});
      shape('circle',{cx:70,cy:78,r:48});
    } else {
      shape('polygon',{points:[[70,20],[88,32],[110,28],[118,50],[112,72],[122,90],[104,104],[96,124],[70,132],[44,124],[36,104],[18,90],[28,72],[22,50],[30,28],[52,32]].map(function(p){return p[0]+','+p[1];}).join(' ')});
    }
    var q = el('text',{x:70, y: side==='cats' ? 100 : 104, 'text-anchor':'middle', 'font-size':70, 'font-weight':900, 'font-family':'system-ui, Arial, sans-serif', fill:'#fff'});
    q.textContent = '?';
    svg.appendChild(q);
  }
  function renderMysteryVisual(container, sprite){
    var svg = document.createElementNS(svgNS,'svg');
    container.appendChild(svg);
    drawMysterySprite(svg, spriteSide(sprite));
    return svg;
  }
  function drawSpriteInto(svg, sprite){
    if(CAT_SPRITES.indexOf(sprite) >= 0) drawCatSprite(svg, sprite);
    else drawBrainrotSprite(svg, sprite);
  }
  function spriteSide(sprite){ return CAT_SPRITES.indexOf(sprite) >= 0 ? 'cats' : 'brainrot'; }

  /* ---- Image perso en remplacement du dessin procédural -----------------
     Si un fichier assets/cats/<id>.png (ou .svg / .jpg) existe, il remplace
     automatiquement le dessin généré, sans rien à changer dans le code :
     il suffit de déposer le fichier au bon endroit avec le bon nom (voir
     assets/MANIFEST.md). Si le fichier n'existe pas (ex : aperçu publié
     seul, sans le reste du dépôt), le dessin procédural reste affiché. */
  function tryLoadCustomImage(container, svg, sprite){
    var exts = ['png','svg','jpg'];
    var side = spriteSide(sprite);
    var i = 0;
    var emb = CUSTOM_IMG[sprite.id];
    if(emb){
      var im0 = new Image();
      im0.className = 'sp-custom-img'; im0.alt = sprite.name;
      im0.onload = function(){ svg.style.display = 'none'; container.insertBefore(im0, svg); };
      im0.src = emb.f;
      return;
    }
    function attempt(){
      if(i >= exts.length) return;
      var img = new Image();
      img.className = 'sp-custom-img';
      img.alt = sprite.name;
      img.onload = function(){
        svg.style.display = 'none';
        container.insertBefore(img, svg);
      };
      img.onerror = function(){ i++; attempt(); };
      img.src = 'assets/' + side + '/' + sprite.id + '.' + exts[i];
    }
    attempt();
  }
  function renderSpriteVisual(container, sprite){
    var svg = document.createElementNS(svgNS,'svg');
    container.appendChild(svg);
    drawSpriteInto(svg, sprite);
    tryLoadCustomImage(container, svg, sprite);
    return svg;
  }

  /* ---- Rendu "tête" (portrait, comme aujourd'hui) ou "plein pied" -------
     mode==='full' essaie d'abord un asset perso assets/<side>/<id>_full.ext
     (photo/dessin en pied du personnage) ; s'il n'existe pas, compose le
     portrait du personnage (tête) au-dessus du buste générique inventé
     (voir paintMascotBody). mode==='head' (par défaut) garde le rendu
     portrait habituel, inchangé. */
  function tryLoadFullBodyImage(sprite, side, onFound, onNotFound){
    var exts = ['png','svg','jpg'];
    var i = 0;
    var emb = CUSTOM_IMG[sprite.id];
    if(emb){
      var im0 = new Image();
      im0.className = 'sp-full-img'; im0.alt = sprite.name;
      im0.onload = function(){ onFound(im0); };
      im0.onerror = function(){ onNotFound(); };
      im0.src = emb.u;
      return;
    }
    function attempt(){
      if(i >= exts.length){ onNotFound(); return; }
      var img = new Image();
      img.className = 'sp-full-img';
      img.alt = sprite.name;
      img.onload = function(){ onFound(img); };
      img.onerror = function(){ i++; attempt(); };
      img.src = 'assets/' + side + '/' + sprite.id + '_full.' + exts[i];
    }
    attempt();
  }
  function renderCreatureVisual(container, sprite, mode){
    container.innerHTML = '';
    if(mode !== 'full'){
      renderSpriteVisual(container, sprite);
      return;
    }
    var side = spriteSide(sprite);
    tryLoadFullBodyImage(sprite, side, function(img){
      container.appendChild(img);
    }, function(){
      var wrap = document.createElement('div');
      wrap.className = 'fullbody-compose';
      var svg = document.createElementNS(svgNS,'svg');
      wrap.appendChild(svg);
      paintMascotBody(svg, side);
      var faceWrap = document.createElement('div');
      faceWrap.className = 'fb-face';
      wrap.appendChild(faceWrap);
      renderSpriteVisual(faceWrap, sprite);
      container.appendChild(wrap);
    });
  }

  /* ---- Persistance des personnages débloqués ---- */
  var ownedCats = {}, ownedBrain = {};
  (function loadOwned(){
    try{
      JSON.parse(localStorage.getItem('geo_owned_cats')||'[]').forEach(function(id){ ownedCats[id]=true; });
      JSON.parse(localStorage.getItem('geo_owned_brain')||'[]').forEach(function(id){ ownedBrain[id]=true; });
    }catch(e){}
    // Première partie (rien de sauvegardé) : les 5 personnages de départ de chaque clan.
    // Après une sauvegarde (y compris une réinitialisation), on respecte ce qui est enregistré.
    var saved = false;
    try{ saved = localStorage.getItem('geo_owned_cats')!==null && localStorage.getItem('geo_owned_brain')!==null; }catch(e){}
    if(!saved){
      CAT_SPRITES.forEach(function(s){ if(s.starter) ownedCats[s.id]=true; });
      BRAINROT_SPRITES.forEach(function(s){ if(s.starter) ownedBrain[s.id]=true; });
    }
  })();
  function saveOwned(){
    try{
      localStorage.setItem('geo_owned_cats', JSON.stringify(Object.keys(ownedCats)));
      localStorage.setItem('geo_owned_brain', JSON.stringify(Object.keys(ownedBrain)));
    }catch(e){}
  }
  function trySpendStars(n){
    if(stars < n) return false;
    stars -= n;
    document.getElementById('starCount').textContent = stars;
    try{ localStorage.setItem('geo_stars', String(stars)); }catch(e){}
    return true;
  }

  /* ---- Défis : les 15 personnages "récompense" de chaque clan ----
     Ils ne s'achètent pas : on les débloque en relevant un défi. Chaque
     défi débloque UN personnage, dans le clan actif au moment où on le relève
     (le chat ou le brainrot du même numéro) : chaque clan a sa propre progression.
       - 12 défis chronométrés (3 niveaux x 4 durées) : réussir au moins N
         bonnes réponses avant la fin du temps.
       - 3 séries sans faute, en mode Aléatoire, sans aucune erreur et quel que
         soit le niveau joué : 20 bonnes réponses d'affilée débloquent le défi
         Facile, 25 le Moyen, 30 le Difficile (la série continue au-delà de 20). */
  var LEVEL_NAMES_FR = ['Facile','Moyen','Difficile'];
  var TIMED_DURATIONS = [60,120,180,300];
  var TIMED_TARGETS = [ [5,8,10,15], [4,6,8,12], [3,5,7,10] ];
  function fmtDuration(sec){ return sec===60 ? '1 minute' : (sec/60)+' minutes'; }
  function challengeInfo(k){
    if(k < 12){
      var lvl = Math.floor(k/4), d = k%4;
      return { type:'timed', level:lvl, seconds:TIMED_DURATIONS[d], target:TIMED_TARGETS[lvl][d] };
    }
    return { type:'streak', level:k-12, target:STREAK_GOALS[k-12] };
  }
  function challengeText(k){
    var c = challengeInfo(k), lvl = LEVEL_NAMES_FR[c.level];
    if(c.type === 'timed'){
      return 'Défi ' + lvl + ' : ouvre le menu, choisis « ' + lvl + ' », puis « Chronométré » et « ' +
        fmtDuration(c.seconds) + ' ». Réponds correctement à ' + c.target + ' questions avant la fin du temps !';
    }
    return 'Défi ' + lvl + ' · série sans faute : en mode « Aléatoire », réponds correctement à ' + c.target +
      ' questions d\'affilée, sans aucune erreur ! (La série continue : 20 pour le Facile, 25 pour le Moyen, 30 pour le Difficile.)';
  }
  function isBrainClan(){ return currentThemeKey()==='brainrot'; }
  function isChallengeDone(k){
    return isBrainClan() ? !!ownedBrain[BRAIN_REWARDS[k].id] : !!ownedCats[CAT_REWARDS[k].id];
  }
  // Débloque le personnage du défi k dans le clan ACTIF ; renvoie la liste des
  // NOUVEAUX personnages (vide si ce défi était déjà réussi dans ce clan).
  function completeChallenge(k){
    var fresh = [];
    if(isBrainClan()){ var b = BRAIN_REWARDS[k]; if(!ownedBrain[b.id]){ ownedBrain[b.id] = true; fresh.push(b); } }
    else { var c = CAT_REWARDS[k]; if(!ownedCats[c.id]){ ownedCats[c.id] = true; fresh.push(c); } }
    if(fresh.length){
      saveOwned();
      renderShop();
      renderBtSetup();
    }
    return fresh;
  }
  // Appelée à la fin d'un défi chronométré (voir endCountdown).
  function checkTimedChallenge(level, seconds, correctCount){
    var d = TIMED_DURATIONS.indexOf(seconds);
    if(d === -1) return { k:-1, fresh:[], target:0, done:false };
    var k = level*4 + d, target = TIMED_TARGETS[level][d];
    if(correctCount >= target) return { k:k, fresh:completeChallenge(k), target:target, done:true };
    return { k:k, fresh:[], target:target, done:false };
  }

  /* ---- Fenêtre d'information (accessible : rôle dialog, focus rendu à la
     fermeture, Échap pour fermer) ---- */
  var infoReturnFocus = null;
  function openInfoDialog(title, buildBody){
    var overlay = document.getElementById('info-overlay');
    document.getElementById('info-title').textContent = title;
    var body = document.getElementById('info-body');
    body.innerHTML = '';
    buildBody(body);
    infoReturnFocus = document.activeElement;
    overlay.hidden = false;
    document.getElementById('info-close').focus();
  }
  function closeInfoDialog(){
    document.getElementById('info-overlay').hidden = true;
    if(infoReturnFocus && infoReturnFocus.focus){ try{ infoReturnFocus.focus(); }catch(e){} }
    infoReturnFocus = null;
  }
  document.getElementById('info-close').addEventListener('click', closeInfoDialog);
  document.getElementById('info-overlay').addEventListener('click', function(e){
    if(e.target.id === 'info-overlay') closeInfoDialog();
  });
  document.addEventListener('keydown', function(e){
    if(e.key !== 'Escape') return;
    ['info-overlay','guides-overlay','progress-overlay','activity-config-overlay','settings-overlay'].some(function(id){
      var o = document.getElementById(id);
      if(o && !o.hidden){
        if(id==='info-overlay') closeInfoDialog(); else o.hidden = true;
        return true;
      }
      return false;
    });
  });
  function showRewardExplanation(sprite){
    openInfoDialog('🔒 ' + sprite.name, function(body){
      var art = document.createElement('div');
      art.className = 'info-art';
      renderMysteryVisual(art, sprite);
      body.appendChild(art);
      var p = document.createElement('p');
      p.textContent = 'Ce personnage ne s\'achète pas : il se débloque en relevant un défi. ' + challengeText(sprite.challenge);
      body.appendChild(p);
    });
  }
  // Aperçu en pied d'un personnage (touche sur sa carte dans la Boutique).
  function showSpritePreview(sprite){
    openInfoDialog(sprite.name, function(body){
      var art = document.createElement('div');
      art.className = 'info-art full';
      renderCreatureVisual(art, sprite, 'full');
      body.appendChild(art);
      var role = document.createElement('p');
      role.className = 'muted';
      role.textContent = roleLine(sprite) + ' · ' + RARITY_META[sprite.rarity].label;
      body.appendChild(role);
    });
  }
  /* ---- Reveal d'un nouveau personnage ----
     Plein écran : sa silhouette noire (ombre chinoise, en pied) grossit au
     milieu de l'écran en pivotant sur elle-même, puis s'arrête et se dévoile
     en pleine couleur avec un petit son propre à son clan. Un toucher pendant
     l'animation passe directement à la fin. Plusieurs personnages : à la suite. */
  var revealTimers = [];
  function revealClearTimers(){ revealTimers.forEach(clearTimeout); revealTimers = []; }
  function showReveal(list, headline, onClose){
    var queue = list.slice();
    function closeAll(){
      revealClearTimers();
      var o = document.getElementById('reveal-overlay'); if(o) o.remove();
      document.removeEventListener('keydown', onKey);
      if(onClose) onClose();
    }
    function onKey(e){ if(e.key==='Escape') closeAll(); }
    document.addEventListener('keydown', onKey);
    function next(){
      revealClearTimers();
      var old = document.getElementById('reveal-overlay'); if(old) old.remove();
      if(!queue.length){ document.removeEventListener('keydown', onKey); if(onClose) onClose(); return; }
      var sp = queue.shift(), side = spriteSide(sp), done = false;
      var ov = document.createElement('div');
      ov.id = 'reveal-overlay'; ov.className = 'reveal-overlay ' + side;
      ov.setAttribute('role','dialog'); ov.setAttribute('aria-modal','true'); ov.setAttribute('aria-label', 'Nouveau personnage : ' + sp.name);
      var head = document.createElement('p'); head.className = 'rv-head'; head.textContent = '🎉 ' + (headline || 'Nouveau personnage !');
      var stage = document.createElement('div'); stage.className = 'rv-stage';
      var glow = document.createElement('div'); glow.className = 'rv-glow';
      // Deux calques superposés : l'ombre chinoise (noire) et la version couleur, masquée
      // jusqu'au balayage lumineux qui la dévoile de gauche à droite.
      var spinner = document.createElement('div'); spinner.className = 'rv-spinner';
      var art = document.createElement('div'); art.className = 'rv-art sil';
      renderCreatureVisual(art, sp, 'full');
      var artCol = document.createElement('div'); artCol.className = 'rv-art col'; artCol.setAttribute('aria-hidden','true');
      renderCreatureVisual(artCol, sp, 'full');
      var scan = document.createElement('div'); scan.className = 'rv-scan'; scan.setAttribute('aria-hidden','true');
      spinner.appendChild(art); spinner.appendChild(artCol); spinner.appendChild(scan);
      var flash = document.createElement('div'); flash.className = 'rv-flash';
      stage.appendChild(glow); stage.appendChild(spinner); stage.appendChild(flash);
      var info = document.createElement('div'); info.className = 'rv-info';
      var nm = document.createElement('p'); nm.className = 'rv-name'; nm.textContent = sp.name;
      var rl = document.createElement('p'); rl.className = 'rv-role'; rl.textContent = roleLine(sp) + ' · ' + RARITY_META[sp.rarity].label;
      var ok = document.createElement('button'); ok.type = 'button'; ok.className = 'btn primary rv-ok';
      ok.textContent = queue.length ? 'Suivant ➜' : 'Super !';
      info.appendChild(nm); info.appendChild(rl); info.appendChild(ok);
      ov.appendChild(head); ov.appendChild(stage); ov.appendChild(info);
      document.body.appendChild(ov);
      // Étape 1 : le personnage, déjà de face en ombre chinoise, est balayé par un trait de
      // lumière qui fait apparaître ses couleurs (+ son du clan). Étape 2 : éclat, étincelles, nom.
      function burst(){
        if(done) return; done = true;
        revealClearTimers();
        ov.classList.remove('scanning'); ov.classList.add('shown');
        for(var i=0;i<12;i++){
          var sparkle = document.createElement('span');
          sparkle.className = 'rv-spark'; sparkle.setAttribute('aria-hidden','true');
          sparkle.textContent = side==='brainrot' ? ['💥','⚡','🔥'][i%3] : ['✨','⭐','💖'][i%3];
          var ang = (i/12)*Math.PI*2, dist = 110 + (i%3)*30;
          sparkle.style.setProperty('--dx', Math.round(Math.cos(ang)*dist)+'px');
          sparkle.style.setProperty('--dy', Math.round(Math.sin(ang)*dist)+'px');
          stage.appendChild(sparkle);
        }
        ok.focus();
      }
      var scanning = false;
      function reveal(){
        if(scanning || done) return; scanning = true;
        revealClearTimers();
        ov.classList.remove('spinning'); ov.classList.add('scanning');
        playRevealSting(side);
        revealTimers.push(setTimeout(burst, 1000));
      }
      function skip(){ if(!scanning) playRevealSting(side); scanning = true; burst(); }
      ov.addEventListener('click', function(e){
        if(!done){ skip(); return; }
        if(e.target === ok || e.target === ov) next();
      });
      var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if(reduced){ skip(); return; }
      ov.classList.add('spinning');
      playRevealWhoosh();
      revealTimers.push(setTimeout(reveal, 2350));   // 2,1 s de rotation + une courte pause, de face
    }
    next();
  }
  function showUnlockAnnouncement(fresh, headline){
    showReveal(fresh, headline || 'Nouveau personnage !');
  }

  /* ---- Boutique ----
     La boutique affiche tous les personnages du clan actuellement actif (le
     bouton à gauche des étoiles, en haut) : ceux qu'on possède déjà et ceux
     qu'il reste à obtenir sont côte à côte dans la même grille, sans rien à
     déplier. Un personnage possédé peut devenir mascotte ; un personnage
     ordinaire se débloque avec des étoiles ; un personnage "Défi" ne
     s'achète pas : un clic sur sa carte explique comment l'obtenir. */
  var shopTheme = 0; // 0 = chats, 1 = brainrots — toujours synchronisé sur le thème actif, voir syncShopThemeToAppTheme()
  function currentShopList(){ return shopTheme===0 ? CAT_SPRITES : BRAINROT_SPRITES; }
  function currentOwnedMap(){ return shopTheme===0 ? ownedCats : ownedBrain; }
  function syncShopThemeToAppTheme(){
    shopTheme = currentThemeKey()==='brainrot' ? 1 : 0;
    var tag = document.getElementById('shop-clan-tag');
    if(tag) tag.textContent = shopTheme===0 ? 'Chats kawaii 🐱' : 'Brainrots 👹';
  }
  function roleLine(sprite){
    var m = BT_ROLE_META[sprite.role];
    return m.icon + ' ' + m.label + ' · ❤️ ' + sprite.pts;
  }
  function buildSpriteShopCard(sprite, isOwned){
    var card = document.createElement('div');
    var isReward = sprite.rarity === 'defi';
    card.className = 'sprite-card ' + (isOwned ? 'owned' : 'locked');
    if(isOwned) renderSpriteVisual(card, sprite); else renderMysteryVisual(card, sprite);   // verrouillé : image « ? » commune
    // Personnage pas encore débloqué : image « ? » commune ; le nom reste visible, le rôle est caché.
    var nameEl = document.createElement('div'); nameEl.className='sp-name'; nameEl.textContent = sprite.name;
    card.appendChild(nameEl);
    if(isOwned) card.addEventListener('click', function(e){ if(e.target.tagName!=='BUTTON') showSpritePreview(sprite); });
    var rarity = document.createElement('div'); rarity.className='rarity-pill';
    rarity.textContent = RARITY_META[sprite.rarity].label;
    rarity.style.background = RARITY_META[sprite.rarity].color;
    card.appendChild(rarity);
    var roleEl = document.createElement('div'); roleEl.className='sp-role'; roleEl.textContent = isOwned ? roleLine(sprite) : '❔ Mystère';
    card.appendChild(roleEl);
    if(isOwned){
      var tag = document.createElement('div'); tag.className='sp-cost'; tag.textContent = 'Débloqué ✔';
      card.appendChild(tag);
      var isMascot = activeMascotId() === sprite.id;
      var mascotBtn = document.createElement('button');
      mascotBtn.type = 'button';
      mascotBtn.className = 'sp-mascot-btn' + (isMascot ? ' active' : '');
      mascotBtn.setAttribute('aria-pressed', isMascot ? 'true' : 'false');
      mascotBtn.textContent = isMascot ? '★ Mascotte actuelle' : '☆ Devenir mascotte';
      mascotBtn.addEventListener('click', function(){
        mascotIds[currentThemeKey()] = isMascot ? null : sprite.id;
        saveMascot();
        renderMascotDock();
        renderTopMascotIcon();
        renderShop();
      });
      card.appendChild(mascotBtn);
    } else if(isReward){
      card.classList.add('reward-locked');
      var lock = document.createElement('div'); lock.className='sp-cost'; lock.textContent = '🔒 Défi à relever';
      card.appendChild(lock);
      var infoBtn = document.createElement('button');
      infoBtn.type = 'button'; infoBtn.className = 'sp-buy sp-info';
      infoBtn.textContent = 'Comment l\'obtenir ?';
      infoBtn.addEventListener('click', function(e){ e.stopPropagation(); showRewardExplanation(sprite); });
      card.appendChild(infoBtn);
      card.addEventListener('click', function(){ showRewardExplanation(sprite); });
    } else {
      var owned = currentOwnedMap();
      var costTag = document.createElement('div'); costTag.className='sp-cost'; costTag.textContent = sprite.cost + ' ⭐';
      card.appendChild(costTag);
      var buyBtn = document.createElement('button');
      buyBtn.type = 'button'; buyBtn.className = 'sp-buy'; buyBtn.textContent = 'Acheter';
      if(stars < sprite.cost) buyBtn.disabled = true;
      buyBtn.addEventListener('click', function(){
        if(trySpendStars(sprite.cost)){
          owned[sprite.id] = true;
          guideMarkBought();
          saveOwned();
          renderShop();
          renderBtSetup();
          showReveal([sprite], 'Nouveau personnage !');
        }
      });
      card.appendChild(buyBtn);
    }
    return card;
  }
  function renderShopMascot(){
    var panel = document.getElementById('shop-mascot-panel');
    if(!panel) return;
    var sprite = activeMascotId() ? findAnySprite(activeMascotId()) : null;
    panel.innerHTML = '';
    panel.hidden = !sprite;
    if(!sprite) return;
    var art = document.createElement('div'); art.className = 'sm-art';
    renderCreatureVisual(art, sprite, 'full');
    var txt = document.createElement('div'); txt.className = 'sm-txt';
    txt.innerHTML = '<span>Mascotte du clan</span><strong></strong><span></span>';
    txt.querySelector('strong').textContent = sprite.name;
    txt.lastChild.textContent = roleLine(sprite);
    panel.appendChild(art); panel.appendChild(txt);
  }
  // Bouton d'entraînement : +50 étoiles d'un clic pour essayer les déblocages.
  document.getElementById('shop-plus50').addEventListener('click', function(){
    addStar(50);
    playSound('good');
    renderShop();
  });
  function renderShop(){
    syncShopThemeToAppTheme();
    renderShopMascot();
    document.getElementById('shop-star-count').textContent = stars;
    var list = currentShopList(), owned = currentOwnedMap();
    var grid = document.getElementById('shop-grid');
    grid.innerHTML = '';
    list.forEach(function(sprite){ grid.appendChild(buildSpriteShopCard(sprite, !!owned[sprite.id])); });
    var have = list.filter(function(s){ return !!owned[s.id]; }).length;
    var counter = document.getElementById('shop-collection-count');
    if(counter) counter.textContent = have + ' / ' + list.length + ' débloqués';
  }

  function findSprite(list, id){
    for(var i=0;i<list.length;i++){ if(list[i].id===id) return list[i]; }
    return null;
  }
  function findAnySprite(id){
    return findSprite(CAT_SPRITES, id) || findSprite(BRAINROT_SPRITES, id);
  }

  /* ---- Mascotte perso : n'importe quel personnage débloqué peut devenir
     "la mascotte", affichée en tête dans la barre du haut (#mascotIcon) et
     en pied (ou buste+tête) dans le dock du bas (#mascot-dock). Réglée via
     le bouton "Mascotte" sur les cartes débloquées de la Boutique. */
  // Une mascotte PAR CLAN : en changeant de clan, on retrouve celle de l'autre clan.
  var mascotIds = { cats:null, brainrot:null };
  (function loadMascot(){
    try{
      ['cats','brainrot'].forEach(function(k){ var m = localStorage.getItem('geo_mascot_'+k); if(m) mascotIds[k] = m; });
      // ancienne sauvegarde (une seule mascotte pour tout) : rangée dans son clan
      var old = localStorage.getItem('geo_mascot_id');
      if(old){
        var side = findSprite(BRAINROT_SPRITES, old) ? 'brainrot' : 'cats';
        if(!mascotIds[side]) mascotIds[side] = old;
        localStorage.removeItem('geo_mascot_id');
        localStorage.setItem('geo_mascot_'+side, mascotIds[side]);
      }
    }catch(e){}
  })();
  function activeMascotId(){ return mascotIds ? mascotIds[currentThemeKey()] : null; }
  function saveMascot(){
    try{ ['cats','brainrot'].forEach(function(k){ localStorage.setItem('geo_mascot_'+k, mascotIds[k] || ''); }); }catch(e){}
  }
  function renderTopMascotIcon(){
    var iconEl = document.getElementById('mascotIcon');
    if(!iconEl) return;
    var sprite = activeMascotId() ? findAnySprite(activeMascotId()) : null;
    iconEl.innerHTML = '';
    if(sprite){
      renderSpriteVisual(iconEl, sprite);
    } else {
      iconEl.textContent = THEMES[currentThemeKey()].mascot;
    }
  }
  // Bascule "hidden" en posant/retirant explicitement l'attribut DOM. La
  // propriété IDL .hidden (el.hidden = true/false) n'existe QUE sur les
  // éléments HTML : sur un <svg> (namespace SVG, comme #mascotBigSvg), lui
  // affecter .hidden ne fait rien du tout — l'attribut "hidden" n'est
  // jamais posé, l'élément reste visible en douce, et le buste générique
  // restait donc affiché EN PLUS du personnage en pied (le bug remonté).
  function setHiddenAttr(el, hide){
    if(hide) el.setAttribute('hidden',''); else el.removeAttribute('hidden');
  }
  function renderMascotDock(){
    var visualWrap = document.getElementById('mascot-visual');
    var svgBig = document.getElementById('mascotBigSvg');
    var faceEl = document.getElementById('mascot-face');
    if(!visualWrap || !svgBig || !faceEl) return;
    var prevCustom = visualWrap.querySelector('.mascot-custom-visual');
    if(prevCustom) prevCustom.remove();
    var sprite = activeMascotId() ? findAnySprite(activeMascotId()) : null;
    if(!sprite){
      setHiddenAttr(svgBig, false);
      setHiddenAttr(faceEl, false);
      drawMascotBig(currentThemeKey());
      faceEl.textContent = REACTIONS[currentThemeKey()].neutral;
      return;
    }
    setHiddenAttr(svgBig, true);
    setHiddenAttr(faceEl, true);
    var custom = document.createElement('div');
    custom.className = 'mascot-custom-visual';
    visualWrap.appendChild(custom);
    renderCreatureVisual(custom, sprite, 'full');
  }
  /* ---- Réglage global "tête / plein pied" pour l'affichage des
     cartes en Bataille. ---- */
  var fighterDisplayMode = 'head';
  (function loadFighterDisplayMode(){
    try{ if(localStorage.getItem('geo_fighter_display')==='full') fighterDisplayMode='full'; }catch(e){}
  })();
  buildLevelRow(document.getElementById('fighter-display-row'), ['Tête','Plein pied'], fighterDisplayMode==='full' ? 1 : 0, function(idx){
    fighterDisplayMode = idx===1 ? 'full' : 'head';
    try{ localStorage.setItem('geo_fighter_display', fighterDisplayMode); }catch(e){}
    if(typeof btRender === 'function') btRender();
  });
  function unlockAllSprites(){
    CAT_SPRITES.forEach(function(s){ ownedCats[s.id] = true; });
    BRAINROT_SPRITES.forEach(function(s){ ownedBrain[s.id] = true; });
    saveOwned();
    renderShop();
    renderBtSetup();
  }
  document.getElementById('unlock-all-btn').addEventListener('click', unlockAllSprites);

  /* ---- Effacer la progression (réglages) : étoiles, personnages
     débloqués, mascotte, équipes de bataille et série en cours. Les
     réglages (thème, effets, affichage) sont conservés. ---- */
  function resetProgress(){
    ['geo_stars','geo_owned_cats','geo_owned_brain','geo_mascot_id','geo_mascot_cats','geo_mascot_brainrot','geo_bt_team_cats','geo_bt_team_brainrot','geo_bought'].forEach(function(k){
      try{ localStorage.removeItem(k); }catch(e){}
    });
    stars = 0;
    document.getElementById('starCount').textContent = '0';
    Object.keys(ownedCats).forEach(function(k){ delete ownedCats[k]; });
    Object.keys(ownedBrain).forEach(function(k){ delete ownedBrain[k]; });
    // On ne garde que le PREMIER personnage de chaque clan, qui redevient la mascotte.
    var firstCat = CAT_SPRITES.filter(function(sp){ return sp.starter; })[0];
    var firstBrain = BRAINROT_SPRITES.filter(function(sp){ return sp.starter; })[0];
    ownedCats[firstCat.id] = true; ownedBrain[firstBrain.id] = true;
    mascotIds = { cats:firstCat.id, brainrot:firstBrain.id };
    saveMascot();
    btSel = { cats:{classic:[],support:[],archer:[]}, brainrot:{classic:[],support:[],archer:[]} };
    if(typeof resetFreeStreak === 'function') resetFreeStreak();
    guideResetContextual();
    saveOwned();
    renderShop();
    renderMascotDock();
    renderTopMascotIcon();
    btBackToSetup();
  }
  document.getElementById('reset-progress-btn').addEventListener('click', function(){
    document.getElementById('reset-confirm').hidden = false;
    document.getElementById('reset-done').hidden = true;
    this.hidden = true;
    document.getElementById('reset-no').focus();
  });
  document.getElementById('reset-no').addEventListener('click', function(){
    document.getElementById('reset-confirm').hidden = true;
    var b = document.getElementById('reset-progress-btn'); b.hidden = false; b.focus();
  });
  document.getElementById('reset-yes').addEventListener('click', function(){
    resetProgress();
    document.getElementById('reset-confirm').hidden = true;
    var b = document.getElementById('reset-progress-btn'); b.hidden = false;
    document.getElementById('reset-done').hidden = false;
  });

