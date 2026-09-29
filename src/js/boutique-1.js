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

