  /* ===================== MODULE 6 : BOUTIQUE + BATAILLE =====================
     Personnages 100% originaux et procéduraux (dessinés en SVG, comme le
     reste de l'appli) : pas d'images téléchargées. Les créatures "brainrot"
     s'inspirent de l'esprit absurde/italien du mème mais n'en reprennent
     AUCUN personnage précis (ceux-ci sont des personnages protégés/reconnaissables,
     pas des images libres de droit) — noms, couleurs et accessoires inventés. */

  /* Raretés (règle du 04/10/2026) : un personnage DESSINÉ EN SVG est commun, un personnage
     illustré à la main (une image existe dans CUSTOM_IMG) est rare ; les personnages de défi
     (non achetables) ont leur propre rareté. Les points de base dépendent de la rareté : un commun a
     moins de points. Prix : commun 10 ⭐, rare 20 ⭐ (un clan complet, évolutions comprises, ≈ 900 ⭐). Les couleurs `color` des pastilles
     sont assez foncées pour que le texte blanc posé dessus soit lisible (contraste ≥ 4,5:1) ;
     `glow` est la lumière qui apparaît à la révélation. */
  var RARITY_META = {
    commun: { label:'Commun', cost:10, color:'#595959', glow:'#B4BCC6', pts:5 },
    rare:   { label:'Rare',   cost:20, color:'#1D5EA6', glow:'#3D8BFF', pts:9 },
    defi:   { label:'Défi',   cost:0,        color:'#A3246B', glow:'#FF4FA3', pts:0 }
  };
  var CAT_COLORS   = ['#FFC2D1','#FFE29A','#C9F2C6','#BFE3FF','#E4C9FF','#FFD6B0','#C6FFF2','#F2C6E0',
                      '#FFB0A3','#B8C7FF','#D9D2C5','#C8E6A0'];
  var BRAIN_COLORS = ['#B7E85D','#5DE8C7','#F0857D','#7DA9F0','#F0CB5D','#C08DF0','#F07DC0','#8DF08D',
                      '#FFA65D','#5DC8F0','#E85D8A','#A0F0E0'];

  // Chaque personnage a UNE seule caractéristique, ses "points" (pts) : ce
  // sont à la fois sa force d'attaque et son énergie (PV) au combat. Il a
  // aussi un rôle : "classic" (attaque normale), "support" (Soutien : donne
  // +5 points à tous ses alliés en arrivant sur le terrain) ou "archer"
  // (attaque sans subir de dégâts en retour). Les points viennent de la rareté
  // (+ 0, 1 ou 2 selon le numéro, pour que deux personnages ne soient pas identiques).
  function mkSprite(id, name, colorIdx, accessory, starter){
    var rarity = (typeof CUSTOM_IMG !== 'undefined' && CUSTOM_IMG[id]) ? 'rare' : 'commun';
    return {
      id:id, name:name, rarity:rarity, colorIdx:colorIdx, accessory:accessory,
      cost: starter ? 0 : RARITY_META[rarity].cost, starter: !!starter,
      pts: RARITY_META[rarity].pts + (parseInt(id.replace(/\D/g,''),10) % 3), role:'classic', challenge:-1
    };
  }
  // Personnage "récompense" : impossible à acheter, il se débloque en
  // relevant un défi (voir CHALLENGES plus bas).
  function mkReward(id, name, colorIdx, accessory, pts, role, challenge){
    return {
      id:id, name:name, rarity:'defi', colorIdx:colorIdx, accessory:accessory,
      cost:0, starter:false,
      pts:pts, role:role, challenge:challenge
    };
  }


  var CAT_SPRITES = [
    mkSprite('cat01','Lavandou',0,'none',true),
    mkSprite('cat02','Cœurette',1,'bow'),
    mkSprite('cat03','Pétale',2,'none'),
    mkSprite('cat04','Étoilou',3,'bell'),
    mkSprite('cat05','Éclairon',4,'flower'),
    mkSprite('cat06','Gouttelette',5,'heart'),
    mkSprite('cat07','Matchou',6,'none'),
    mkSprite('cat08','Capuche',7,'bow'),
    mkSprite('cat09','Footin',0,'star'),
    mkSprite('cat10','Merlinou',1,'glasses'),
    mkSprite('cat11','Fleurette',2,'crown'),
    mkSprite('cat12','Flammèche',3,'bell'),
    mkSprite('cat13','Postou',4,'flower'),
    mkSprite('cat14','Vroumi',5,'bow'),
    mkSprite('cat15','Kimono',6,'star'),
    mkSprite('cat16','Bondi',7,'crown'),
    mkSprite('cat17','Souplesse',0,'heart'),
    mkSprite('cat18','Frisette',1,'glasses'),
    mkSprite('cat19','Carotin',2,'crown'),
    mkSprite('cat20','Céleste',3,'star')
  ];

  var BRAINROT_SPRITES = [
    mkSprite('br01','Baguetto Montone',0,'spiky',true),
    mkSprite('br02','Maiale Cuvetto',1,'mustache'),
    mkSprite('br03','Waffolo Papero',2,'legs'),
    mkSprite('br04','Spaghettino Orsetto',3,'drill'),
    mkSprite('br05','Televisiogatto',4,'oneeye'),
    mkSprite('br06','Elefantino Aspiro',5,'antenna'),
    mkSprite('br07','Cagnolino Ventilo',6,'propeller'),
    mkSprite('br08','Cannolotto Caos',7,'horns'),
    mkSprite('br09','Raviolone Rex',0,'propeller'),
    mkSprite('br10','Basilico Boom',1,'legs'),
    mkSprite('br11','Tortellino Tornado',2,'antenna'),
    mkSprite('br12','Focacciotto Fury',3,'horns'),
    mkSprite('br13','Zeppolino Zap',4,'drill'),
    mkSprite('br14','Panettonio Punch',5,'spiky'),
    mkSprite('br15','Mortadellone Max',6,'antenna'),
    mkSprite('br16','Caprese Comet',7,'propeller'),
    mkSprite('br17','Arancino Alieno',0,'oneeye'),
    mkSprite('br18','Struzzolino Strike',1,'horns'),
    mkSprite('br19','Gnoccotto Gigante',2,'mustache'),
    mkSprite('br20','Biscottino Blitz',3,'propeller')
  ];

  // Rôles des personnages de base + personnage de départ (le premier de chaque clan).
  var ROLE_BY_ID = {
    cat04:'support', cat10:'support', cat14:'support', cat18:'support',
    cat05:'archer',  cat11:'archer',  cat16:'archer',  cat20:'archer',
    br04:'support',  br10:'support',  br14:'support',  br18:'support',
    br05:'archer',   br11:'archer',   br16:'archer',   br20:'archer'
  };
  // Un seul personnage offert par clan : les autres s'achètent (équipe de 5 communs ≈ 24 ⭐).
  var STARTER_IDS = ['cat01','br01'];
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
  // Image dédiée d'un niveau d'évolution (embarquée : CUSTOM_IMG[id].e1 / .e2, voir tools/evo.py) :
  // Ultime sans image propre reprend celle d'Évolué. exact = l'image est bien celle de CE niveau
  // (elle remplace alors le cadre, l'aura et les étincelles : seule l'étoile reste).
  function evoArt(sprite, level){
    var emb = CUSTOM_IMG[sprite.id];
    if(!emb || !level) return null;
    if(level >= 2 && emb.e2) return { rec:emb.e2, exact:true };
    if(emb.e1) return { rec:emb.e1, exact:level === 1 };
    return null;
  }
  function tryLoadCustomImage(container, svg, sprite, imgLevel){
    var exts = ['png','svg','jpg'];
    var side = spriteSide(sprite);
    var i = 0;
    var emb = CUSTOM_IMG[sprite.id], ea = evoArt(sprite, imgLevel);
    if(emb){
      var im0 = new Image();
      im0.className = 'sp-custom-img' + (ea ? ' evo-art-img' : ''); im0.alt = sprite.name;
      im0.onload = function(){ svg.style.display = 'none'; container.insertBefore(im0, svg); };
      im0.src = ea ? ea.rec.f : emb.f;
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
  // Cadre, aura et étoiles d'évolution posés sur le conteneur (CSS : .evo-1 / .evo-2, par clan).
  function applyEvoLook(container, sprite, level){
    ['evo-1','evo-2'].forEach(function(c){ container.classList.remove(c); });
    Array.prototype.slice.call(container.querySelectorAll(':scope > .evo-badge, :scope > .evo-spark, :scope > .evo-halo')).forEach(function(n){ n.remove(); });
    if(level === undefined) level = spriteEvo(sprite);
    container.removeAttribute('data-evo-clan');
    if(!level) return;
    var ea = evoArt(sprite, level);
    if(!(ea && ea.exact)){ container.classList.add('evo-' + level); container.setAttribute('data-evo-clan', spriteSide(sprite)); }
    var badge = document.createElement('span');
    badge.className = 'evo-badge'; badge.setAttribute('aria-hidden','true');
    badge.textContent = level === 2 ? '★★' : '★';
    container.appendChild(badge);
    if(ea && ea.exact) return;   // l'image de ce niveau EST l'effet d'évolution
    var halo = document.createElement('span');
    halo.className = 'evo-halo'; halo.setAttribute('aria-hidden','true');
    container.insertBefore(halo, container.firstChild);
    var set = spriteSide(sprite)==='cats' ? ['✨','💖','⭐','✨','🌸','💫','✨'] : ['⚡','🔥','💥','⚡','👾','🔥','⚡'];
    var POS = [8,78,30,62,16,88,48];
    for(var i=0;i<(level===2?7:4);i++){
      var sp = document.createElement('span');
      sp.className = 'evo-spark s' + i; sp.setAttribute('aria-hidden','true');
      sp.textContent = set[i];
      sp.style.setProperty('--x', POS[i] + '%');
      sp.style.setProperty('--d', (i*0.55) + 's');
      container.appendChild(sp);
    }
  }
  // level : cadre / aura d'évolution (undefined = niveau possédé, 0 = aucun) ; imgLevel : niveau dont on
  // montre l'IMAGE (par défaut le même : l'écran Admirer et la mascotte montrent un niveau choisi sans cadre).
  function renderSpriteVisual(container, sprite, level, imgLevel){
    var svg = document.createElementNS(svgNS,'svg');
    container.appendChild(svg);
    drawSpriteInto(svg, sprite);
    if(imgLevel === undefined) imgLevel = level === undefined ? spriteEvo(sprite) : level;
    tryLoadCustomImage(container, svg, sprite, imgLevel);
    applyEvoLook(container, sprite, level);
    return svg;
  }

  /* ---- Rendu "tête" (portrait, comme aujourd'hui) ou "plein pied" -------
     mode==='full' essaie d'abord un asset perso assets/<side>/<id>_full.ext
     (photo/dessin en pied du personnage) ; s'il n'existe pas, compose le
     portrait du personnage (tête) au-dessus du buste générique inventé
     (voir paintMascotBody). mode==='head' (par défaut) garde le rendu
     portrait habituel, inchangé. */
  function tryLoadFullBodyImage(sprite, side, onFound, onNotFound, imgLevel){
    var exts = ['png','svg','jpg'];
    var i = 0;
    var emb = CUSTOM_IMG[sprite.id], ea = evoArt(sprite, imgLevel);
    if(emb){
      var im0 = new Image();
      im0.className = 'sp-full-img' + (ea ? ' evo-art-img' : ''); im0.alt = sprite.name;
      im0.onload = function(){ onFound(im0); };
      im0.onerror = function(){ onNotFound(); };
      im0.src = ea ? ea.rec.u : emb.u;
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
  function renderCreatureVisual(container, sprite, mode, level, imgLevel){
    container.innerHTML = '';
    if(imgLevel === undefined) imgLevel = level === undefined ? spriteEvo(sprite) : level;
    if(mode !== 'full'){
      renderSpriteVisual(container, sprite, level, imgLevel);
      return;
    }
    var side = spriteSide(sprite);
    applyEvoLook(container, sprite, level);
    tryLoadFullBodyImage(sprite, side, function(img){
      container.insertBefore(img, container.firstChild);
    }, function(){
      var wrap = document.createElement('div');
      wrap.className = 'fullbody-compose';
      var svg = document.createElementNS(svgNS,'svg');
      wrap.appendChild(svg);
      paintMascotBody(svg, side);
      var faceWrap = document.createElement('div');
      faceWrap.className = 'fb-face';
      wrap.appendChild(faceWrap);
      renderSpriteVisual(faceWrap, sprite, 0, imgLevel);
      container.insertBefore(wrap, container.firstChild);
    }, imgLevel);
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
  /* ---- Évolutions : 2 montées par personnage (0 = de base, 1 = Évolué, 2 = Ultime).
     Chaque montée coûte le prix d'achat du personnage (10 ⭐ commun, 20 ⭐ rare ; 12 ⭐ pour un personnage
     de défi, qui est gratuit), ajoute 20 % de ses points de base (au moins +2) et améliore sa compétence. ---- */
  var EVO_MAX = 2, EVO_BONUS = 0.2, EVO_REWARD_COST = 12;
  var EVO_NAMES = ['De base','Évolué','Ultime'];
  var evoCats = {}, evoBrain = {};
  (function loadEvo(){
    try{
      [['geo_evo_cats',evoCats],['geo_evo_brain',evoBrain]].forEach(function(pair){
        var o = JSON.parse(localStorage.getItem(pair[0])||'{}') || {};
        Object.keys(o).forEach(function(id){ var v = parseInt(o[id],10); if(v>=1 && v<=EVO_MAX) pair[1][id] = v; });
      });
    }catch(e){}
  })();
  function saveEvo(){
    try{
      localStorage.setItem('geo_evo_cats', JSON.stringify(evoCats));
      localStorage.setItem('geo_evo_brain', JSON.stringify(evoBrain));
    }catch(e){}
  }
  function evoMapFor(sprite){ return CAT_SPRITES.indexOf(sprite) >= 0 ? evoCats : evoBrain; }
  function spriteEvo(sprite){ return evoMapFor(sprite)[sprite.id] || 0; }
  function evoGain(sprite){ return Math.max(2, Math.round(sprite.pts * EVO_BONUS)); }
  // Points d'un personnage à un niveau d'évolution donné (par défaut : le niveau possédé).
  function spritePts(sprite, level){
    if(level === undefined) level = spriteEvo(sprite);
    return sprite.pts + level * evoGain(sprite);
  }
  function evoCost(sprite){ return sprite.rarity === 'defi' ? EVO_REWARD_COST : RARITY_META[sprite.rarity].cost; }
  function tryEvolve(sprite){
    var lvl = spriteEvo(sprite);
    if(lvl >= EVO_MAX || !trySpendStars(evoCost(sprite))) return false;
    evoMapFor(sprite)[sprite.id] = lvl + 1;
    saveEvo();
    return true;
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
  /* ---- Reveal d'un nouveau personnage ----
     Plein écran : sa silhouette noire (ombre chinoise, en pied) grossit au
     milieu de l'écran en pivotant sur elle-même, puis s'arrête et se dévoile
     en pleine couleur avec un petit son propre à son clan. Un toucher pendant
     l'animation passe directement à la fin. Plusieurs personnages : à la suite. */
  var REVEAL_TINT_MS = 1700;   // ≈ la moitié de l'animation (rotation 2,35 s + balayage 1 s)
  var revealTimers = [];
  function revealClearTimers(){ revealTimers.forEach(clearTimeout); revealTimers = []; }
  function showReveal(list, headline, onClose){
    var queue = list.slice(), stopAmbient = function(){};
    function closeAll(){
      revealClearTimers(); stopAmbient();
      var o = document.getElementById('reveal-overlay'); if(o) o.remove();
      document.removeEventListener('keydown', onKey);
      if(onClose) onClose();
    }
    function onKey(e){ if(e.key==='Escape') closeAll(); }
    document.addEventListener('keydown', onKey);
    function next(){
      revealClearTimers();
      var old = document.getElementById('reveal-overlay'); if(old) old.remove();
      if(!queue.length){ stopAmbient(); document.removeEventListener('keydown', onKey); if(onClose) onClose(); return; }
      var sp = queue.shift(), side = spriteSide(sp), done = false;
      stopAmbient(); stopAmbient = function(){};
      var ov = document.createElement('div');
      ov.id = 'reveal-overlay'; ov.className = 'reveal-overlay ' + side;
      ov.setAttribute('role','dialog'); ov.setAttribute('aria-modal','true'); ov.setAttribute('aria-label', 'Nouveau personnage : ' + sp.name);
      var head = document.createElement('p'); head.className = 'rv-head'; head.textContent = '🎉 ' + (headline || 'Nouveau personnage !');
      var stage = document.createElement('div'); stage.className = 'rv-stage';
      var lv = sp.rarity==='commun' ? 0 : 1;   // intensité de la mise en scène (rare et défi : plus forte)
      ov.style.setProperty('--rv-c', RARITY_META[sp.rarity].glow); ov.style.setProperty('--rv-chip', RARITY_META[sp.rarity].color);
      ov.classList.add('lv' + lv);
      var rays = document.createElement('div'); rays.className = 'rv-rays'; rays.setAttribute('aria-hidden','true');
      var fxBack = document.createElement('div'); fxBack.className = 'rv-fx back'; fxBack.setAttribute('aria-hidden','true');
      var fxFront = document.createElement('div'); fxFront.className = 'rv-fx front'; fxFront.setAttribute('aria-hidden','true');
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
      // À la moitié de l'animation, la lumière de la rareté se lève autour de l'ombre (aura + pastille).
      var aura = document.createElement('div'); aura.className = 'rv-aura'; aura.setAttribute('aria-hidden','true');
      var chip = document.createElement('p'); chip.className = 'rv-rarity'; chip.setAttribute('aria-hidden','true'); chip.textContent = RARITY_META[sp.rarity].label;
      stage.appendChild(rays); stage.appendChild(fxBack); stage.appendChild(aura); stage.appendChild(glow);
      ['r1','r2','r3'].forEach(function(r){ var ring = document.createElement('div'); ring.className = 'eo-ring ' + r; ring.setAttribute('aria-hidden','true'); stage.appendChild(ring); });
      stage.appendChild(spinner); stage.appendChild(chip); stage.appendChild(fxFront); stage.appendChild(flash);
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
      function tint(){ ov.classList.add('tint'); }
      function burst(){
        if(done) return; done = true; tint();
        revealClearTimers();
        ov.classList.remove('scanning'); ov.classList.add('shown');
        playRevealBoom(side, lv);
        fxBurst(fxFront, side, lv===2 ? 28 : lv===1 ? 20 : 14, 80, lv===2 ? 190 : 150);
        if(lv===2) revealTimers.push(setTimeout(function(){ fxBurst(fxFront, side, 14, 90, 200); }, 350));
        stopAmbient = fxAmbient(fxBack, fxFront, side, lv);
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
      revealTimers.push(setTimeout(tint, REVEAL_TINT_MS));   // la couleur de la rareté, à la moitié de l'animation
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
    if(tag) tag.textContent = shopTheme===0 ? 'Team Kawaii 🐱' : 'Brainrots 👹';
  }
  function roleLine(sprite){
    var m = BT_ROLE_META[sprite.role];
    return m.icon + ' ' + m.label + ' · ❤️ ' + spritePts(sprite);
  }
  function buildSpriteShopCard(sprite, isOwned){
    var card = document.createElement('div');
    var isReward = sprite.rarity === 'defi';
    card.className = 'sprite-card ' + (isOwned ? 'owned' : 'locked');
    if(isOwned) renderSpriteVisual(card, sprite); else renderMysteryVisual(card, sprite);   // verrouillé : image « ? » commune
    // Personnage pas encore débloqué : image « ? » commune ; le nom reste visible, le rôle est caché.
    var nameEl = document.createElement('div'); nameEl.className='sp-name'; nameEl.textContent = sprite.name;
    card.appendChild(nameEl);
    if(isOwned) card.addEventListener('click', function(e){ if(e.target.tagName!=='BUTTON') showAdmire(sprite); });
    var rarity = document.createElement('div'); rarity.className='rarity-pill';
    rarity.textContent = RARITY_META[sprite.rarity].label;
    rarity.style.background = RARITY_META[sprite.rarity].color;
    card.appendChild(rarity);
    var roleEl = document.createElement('div'); roleEl.className='sp-role'; roleEl.textContent = isOwned ? roleLine(sprite) : '❔ Mystère';
    card.appendChild(roleEl);
    if(isOwned){
      var skEl = document.createElement('div'); skEl.className = 'sp-skill'; skEl.textContent = skillLine(sprite, spriteEvo(sprite));
      var skd = skillOf(sprite);
      if(skd) skEl.title = skd.desc;
      card.appendChild(skEl);
    }
    if(isOwned){
      var tag = document.createElement('div'); tag.className='sp-cost'; tag.textContent = 'Débloqué ✔';
      card.appendChild(tag);
      var admireBtn = document.createElement('button');
      admireBtn.type = 'button'; admireBtn.className = 'sp-admire'; admireBtn.textContent = '🔍';
      admireBtn.setAttribute('aria-label', 'Admirer ' + sprite.name);
      admireBtn.addEventListener('click', function(e){ e.stopPropagation(); showAdmire(sprite); });
      card.appendChild(admireBtn);
      var isMascot = activeMascotId() === sprite.id;
      var mascotBtn = document.createElement('button');
      mascotBtn.type = 'button';
      mascotBtn.className = 'sp-mascot-btn' + (isMascot ? ' active' : '');
      mascotBtn.setAttribute('aria-pressed', isMascot ? 'true' : 'false');
      mascotBtn.textContent = isMascot ? '★ Mascotte actuelle' : '☆ Devenir mascotte';
      mascotBtn.addEventListener('click', function(){
        mascotIds[currentThemeKey()] = isMascot ? null : sprite.id;
        mascotLvls[currentThemeKey()] = null;
        saveMascot();
        renderMascotDock();
        renderTopMascotIcon();
        renderShop();
      });
      card.appendChild(mascotBtn);
      var lvl = spriteEvo(sprite);
      var evoBtn = document.createElement('button');
      evoBtn.type = 'button';
      evoBtn.className = 'sp-evo-btn';
      if(lvl >= EVO_MAX){
        evoBtn.disabled = true; evoBtn.classList.add('max');
        evoBtn.textContent = '🌟 Ultime (max)';
        evoBtn.setAttribute('aria-label', sprite.name + ' est au niveau maximum : Ultime');
      } else {
        var gain = evoGain(sprite), cost = evoCost(sprite);
        evoBtn.textContent = '⬆ ' + EVO_NAMES[lvl+1] + ' · ' + cost + ' ⭐ (+' + gain + ' ❤️)';
        evoBtn.setAttribute('aria-label', 'Faire évoluer ' + sprite.name + ' au niveau ' + EVO_NAMES[lvl+1] + ' pour ' + cost + ' étoiles, plus ' + gain + ' points');
        if(stars < cost) evoBtn.disabled = true;
        evoBtn.addEventListener('click', function(e){
          e.stopPropagation();
          if(tryEvolve(sprite)){
            playSound('good');
            renderShop();
            renderBtSetup();
            renderMascotDock();
            renderTopMascotIcon();
            showEvolution(sprite, lvl, lvl + 1);
          }
        });
      }
      card.appendChild(evoBtn);
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
    renderCreatureVisual(art, sprite, 'full', mascotLevel(sprite));
    var txt = document.createElement('div'); txt.className = 'sm-txt';
    txt.innerHTML = '<span>Mascotte du clan</span><strong></strong><span></span><span class="sm-hint">🔍 Touche pour l\'admirer</span>';
    txt.querySelector('strong').textContent = sprite.name;
    txt.children[2].textContent = roleLine(sprite);
    panel.appendChild(art); panel.appendChild(txt);
    panel.classList.add('admirable');
    panel.setAttribute('role','button'); panel.setAttribute('tabindex','0'); panel.setAttribute('aria-label', 'Admirer ' + sprite.name + ', mascotte du clan');
    panel.onclick = function(){ showAdmire(sprite); };
    panel.onkeydown = function(e){ if(e.key==='Enter' || e.key===' '){ e.preventDefault(); showAdmire(sprite); } };
  }
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
  // Niveau d'évolution montré par la mascotte (choisi dans l'écran Admirer) ; null = le plus haut atteint.
  var mascotLvls = { cats:null, brainrot:null };
  (function loadMascotLvl(){
    try{ ['cats','brainrot'].forEach(function(k){ var v = localStorage.getItem('geo_mascot_lv_'+k); if(v !== null && v !== '') mascotLvls[k] = parseInt(v,10) || 0; }); }catch(e){}
  })();
  function activeMascotId(){ return mascotIds ? mascotIds[currentThemeKey()] : null; }
  function mascotLevel(sprite){
    var max = spriteEvo(sprite), v = mascotLvls[spriteSide(sprite)];
    return (v === null || v === undefined) ? max : Math.max(0, Math.min(max, v));
  }
  // Choisir la mascotte du clan du personnage (lv : niveau montré ; null = toujours le plus haut atteint).
  function setMascot(sprite, lv){
    var side = spriteSide(sprite);
    mascotIds[side] = sprite.id; mascotLvls[side] = (lv === undefined) ? null : lv;
    saveMascot();
    renderMascotDock(); renderTopMascotIcon();
  }
  function saveMascot(){
    try{ ['cats','brainrot'].forEach(function(k){
      localStorage.setItem('geo_mascot_'+k, mascotIds[k] || '');
      if(mascotLvls[k] === null) localStorage.removeItem('geo_mascot_lv_'+k); else localStorage.setItem('geo_mascot_lv_'+k, String(mascotLvls[k]));
    }); }catch(e){}
  }
  function renderTopMascotIcon(){
    var iconEl = document.getElementById('mascotIcon');
    if(!iconEl) return;
    var sprite = activeMascotId() ? findAnySprite(activeMascotId()) : null;
    iconEl.innerHTML = '';
    if(sprite){
      renderSpriteVisual(iconEl, sprite, mascotLevel(sprite));
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
    renderCreatureVisual(custom, sprite, 'full', mascotLevel(sprite));
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
  /* ---- Mode débogage (Réglages) : « Tout débloquer » et « +50 étoiles », derrière un code saisi à chaque
     session (variable seulement : ni localStorage, ni rechargement). ---- */
  var DEBUG_CODE = '0303', debugActive = false;
  function debugRender(){
    var open = document.getElementById('debug-open-btn');
    document.getElementById('debug-form').hidden = debugActive;
    document.getElementById('debug-tools').hidden = !debugActive;
    document.getElementById('debug-error').hidden = true;
    document.getElementById('debug-code').value = '';
    open.setAttribute('aria-expanded', document.getElementById('debug-panel').hidden ? 'false' : 'true');
  }
  document.getElementById('debug-open-btn').addEventListener('click', function(){
    var panel = document.getElementById('debug-panel');
    panel.hidden = !panel.hidden;
    debugRender();
    if(!panel.hidden && !debugActive) document.getElementById('debug-code').focus();
  });
  document.getElementById('debug-form').addEventListener('submit', function(e){
    e.preventDefault();
    if(document.getElementById('debug-code').value === DEBUG_CODE){ debugActive = true; debugRender(); return; }
    document.getElementById('debug-code').value = '';
    document.getElementById('debug-error').hidden = false;
  });
  document.getElementById('unlock-all-btn').addEventListener('click', unlockAllSprites);
  document.getElementById('debug-plus50-btn').addEventListener('click', function(){
    addStar(50);
    playSound('good');
    renderShop();
  });
  document.getElementById('debug-off-btn').addEventListener('click', function(){
    debugActive = false;
    document.getElementById('debug-panel').hidden = true;
    debugRender();
  });

  /* ---- Effacer la progression (réglages) : étoiles, personnages
     débloqués, mascotte, équipes de bataille et série en cours. Les
     réglages (thème, effets, affichage) sont conservés. ---- */
  function resetProgress(){
    ['geo_stars','geo_owned_cats','geo_owned_brain','geo_evo_cats','geo_evo_brain','geo_mascot_id','geo_mascot_cats','geo_mascot_brainrot','geo_mascot_lv_cats','geo_mascot_lv_brainrot','geo_bt_team_cats','geo_bt_team_brainrot','geo_bought'].forEach(function(k){
      try{ localStorage.removeItem(k); }catch(e){}
    });
    stars = 0;
    document.getElementById('starCount').textContent = '0';
    Object.keys(ownedCats).forEach(function(k){ delete ownedCats[k]; });
    Object.keys(ownedBrain).forEach(function(k){ delete ownedBrain[k]; });
    Object.keys(evoCats).forEach(function(k){ delete evoCats[k]; });
    Object.keys(evoBrain).forEach(function(k){ delete evoBrain[k]; });
    // On ne garde que le PREMIER personnage de chaque clan, qui redevient la mascotte.
    var firstCat = CAT_SPRITES.filter(function(sp){ return sp.starter; })[0];
    var firstBrain = BRAINROT_SPRITES.filter(function(sp){ return sp.starter; })[0];
    ownedCats[firstCat.id] = true; ownedBrain[firstBrain.id] = true;
    mascotIds = { cats:firstCat.id, brainrot:firstBrain.id };
    mascotLvls = { cats:null, brainrot:null };
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

