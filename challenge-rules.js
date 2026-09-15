'use strict';

// Opponents are milestones, not moving targets that level up with the player.
const coffeeRivalLevels=[1,3,6,10,16,24,32,40,46,52];
const coffeeEventNames={latte:'Latte Art Throwdown',speed:'Speed Service Round',crate:'Supply Run'};
const coffeeEventWeights={
  latte:{speed:.45,craft:1,service:.8,teamwork:.45,composure:.9},
  speed:{speed:1,craft:.5,service:.8,teamwork:.85,composure:1},
  crate:{speed:.8,craft:.55,service:.55,teamwork:1,composure:.75}
};
function coffeeProfile(id,name,base,weights){
  return {id,name,weights,requirements:Object.fromEntries(coffeeShiftTraits.map(t=>[t.id,Math.round(clamp(base*(.65+.35*weights[t.id]),1,8.5)*10)/10]))};
}
function coffeeRivalProfile(r){
  const weights=Object.values(coffeeEventWeights)[r.id%3];
  return coffeeProfile(`rival-${r.id}`,r.name,1.5+(r.level-1)*.145+Math.sqrt(r.level-1)*.24,weights);
}
function coffeeEventTier(type){return Math.min(10,1+Math.floor((state.eventWins?.[type]||0)/3));}
function coffeeEventProfile(type){
  const tier=coffeeEventTier(type);
  return coffeeProfile(`event-${type}`,coffeeEventNames[type],1.5+(tier-1)*.75,coffeeEventWeights[type]);
}
function coffeeBossProfile(b){
  return coffeeProfile(`boss-${b.id}`,b.name,1.9+(b.level-1)*.14+Math.sqrt(b.level-1)*.24,{speed:.75,craft:b.quality>=b.service?1:.8,service:1,teamwork:.9,composure:1});
}
function coffeeFindActivity(id){
  if(id.startsWith('rival-')){const r=rivalList().find(r=>`rival-${r.id}`===id);return r&&coffeeRivalProfile(r);}
  if(id.startsWith('event-'))return coffeeEventProfile(id.slice(6));
  if(id.startsWith('boss-')){const b=bosses.find(b=>`boss-${b.id}`===id);return b&&coffeeBossProfile(b);}
  return shifts.find(s=>s.id===id);
}
rivalList=function(){
  return rivalNames.map((name,id)=>({id,name,level:coffeeRivalLevels[id],crew:1+Math.floor(id/2),cash:Math.floor(100+coffeeRivalLevels[id]*55)}));
};
challengeRival=function(index,result){
  const rival=rivalList()[index];
  if(!rival||state.level<rival.level||state.drive<1||state.morale<8)return false;
  result=result||coffeeActivityRoll(coffeeRivalProfile(rival));
  state.drive--;
  state.morale=clamp(state.morale-(result.tier==='miss'?16:9),0,state.maxMorale);
  state.rivalWins=state.rivalWins||{};
  const first=!state.rivalWins[rival.id];
  if(result.tier!=='miss'){
    const payout=first?rival.cash:Math.floor(rival.cash*.35);
    state.cash+=payout;state.lifetimeIncome+=payout;
    state.xp+=first?12+rival.level*2:Math.max(2,Math.floor(rival.level*.6));
    state.rivalsBeaten++;state.rivalWins[rival.id]=(state.rivalWins[rival.id]||0)+1;
    if(first)state.bossPoints++;
    addFeed('trophy',`Beat ${rival.name}${first?' for the first time':''}. +${formatMoney(payout)}.`);
  }else{
    const loss=Math.min(state.cash,Math.floor(rival.cash*.12));
    state.cash-=loss;state.rivalLosses++;state.xp+=2;
    addFeed('shield-alert',`${rival.name} won this round. The reserve stayed safe.`);
  }
  levelCheck();checkAchievements();saveState(true);render();return result;
};
bossAttack=function(id,power=false,result){
  const boss=bosses.find(b=>b.id===id),cost=power?3:1;
  if(!boss||state.level<boss.level||state.defeatedBosses.includes(id)||state.drive<cost||state.morale<10)return false;
  result=result||coffeeActivityRoll(coffeeBossProfile(boss));
  state.drive-=cost;
  state.morale=clamp(state.morale-(power?19:11),0,state.maxMorale);
  const previous=Math.min(boss.hp,state.bossDamage[id]||0);
  const progress=result.tier==='miss'?0:Math.floor(boss.hp*(.10+(result.score-40)*.001)*(power?2.4:1));
  state.bossDamage[id]=Math.min(boss.hp,previous+progress);
  const milestones=Math.floor(state.bossDamage[id]/boss.hp*4)-Math.floor(previous/boss.hp*4);
  state.xp+=result.tier==='miss'?1:3+milestones*5;
  if(state.bossDamage[id]>=boss.hp){
    state.defeatedBosses.push(id);state.cash+=boss.reward;state.lifetimeIncome+=boss.reward;
    state.xp+=boss.xp;state.bossPoints+=2;state.inventory[boss.item]=(state.inventory[boss.item]||0)+1;state.itemsFound++;
    addFeed('trophy',`Completed ${boss.name}. +${formatMoney(boss.reward)} and new gear.`);
  }else addFeed(boss.icon,`${boss.name}: ${progress?`${progress} progress made`:'a missed attempt'}.`);
  levelCheck();checkAchievements();saveState(true);render();return {...result,progress,milestones};
};
runChallenge=function(type,result){
  if(!coffeeEventNames[type]||state.challengeTokens<1)return false;
  const tier=coffeeEventTier(type);
  result=result||coffeeActivityRoll(coffeeEventProfile(type));
  state.challengeTokens--;
  state.eventWins=state.eventWins||{};
  if(result.tier==='miss'){
    state.xp+=3;addFeed('flag',`${coffeeEventNames[type]}: not quite this time. Build your missing skills.`);
  }else{
    state.eventWins[type]=(state.eventWins[type]||0)+1;
    const multiplier=result.tier==='perfect'?1.4:result.tier==='strong'?1.15:1;
    if(type==='latte'){
      const reward=Math.floor((120+tier*65)*multiplier);state.cash+=reward;state.lifetimeIncome+=reward;state.xp+=10+tier*3;
    }else if(type==='speed'){
      state.energy=Math.min(state.maxEnergy,state.energy+4+tier*2);state.xp+=10+tier*3;
    }else{
      const pool=items.filter(i=>i.cost<=250*tier*tier);
      if(result.tier==='perfect'||Math.random()<.35){const item=pick(pool);state.inventory[item.id]=(state.inventory[item.id]||0)+1;state.itemsFound++;}
      else{const reward=80+tier*45;state.cash+=reward;state.lifetimeIncome+=reward;}
      state.xp+=6+tier*2;
    }
    addFeed('trophy',`${coffeeEventNames[type]}: round ${tier} won. ${tier===10?'Top round mastered.':`${state.eventWins[type]%3}/3 wins toward the next round.`}`);
  }
  levelCheck();checkAchievements();saveState(true);render();return result;
};
