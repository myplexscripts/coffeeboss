'use strict';


let state = loadState();
let currentPage = 'home';
let currentTab = null;

function loadState(){
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if(!raw) return defaultState();
    const parsed = JSON.parse(raw);
    // Remove the old free starting bonus once, keeping every earned upgrade.
    if(!parsed.skillBalanceVersion){
      parsed.service=Math.max(1,(parsed.service ?? 5)-4);
      parsed.quality=Math.max(1,(parsed.quality ?? 5)-4);
      parsed.skillBalanceVersion=2;
    }
    return Object.assign(defaultState(), parsed, { owned: parsed.owned||{}, inventory:parsed.inventory||{}, shiftMastery:parsed.shiftMastery||{}, bossDamage:parsed.bossDamage||{}, feed:parsed.feed||[] });
  } catch(e){ return defaultState(); }
}
function saveState(silent=false){
  state.lastUpdate = Date.now();
  localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  if(!silent) toast('Game saved.');
}
function xpNeeded(level){ return Math.floor(80 + (level-1)*44 + Math.pow(level-1,1.4)*10); }
function levelCheck(){
  let levelled = false;
  while(state.xp >= xpNeeded(state.level)){
    state.xp -= xpNeeded(state.level);
    state.level++;
    state.skillPoints += 3;
    state.bossPoints += 1;
    state.energy = Math.min(state.maxEnergy, state.energy + Math.max(10,Math.round(state.maxEnergy*.55)));
    state.drive = Math.min(state.maxDrive, state.drive + Math.max(3,Math.round(state.maxDrive*.55)));
    state.morale = state.maxMorale;
    addFeed('sparkles',`Level ${state.level}. You earned 3 skill points and a Boss Point.`);
    toast(`Level ${state.level}! +3 skill points, +1 Boss Point`, 'good');
    levelled = true;
  }
  if(levelled) checkDistrictUnlocks();
}
function checkDistrictUnlocks(){
  const newly = districts.find(d => d.level===state.level);
  if(newly){ toast(`${newly.name} unlocked.`, 'good'); addFeed(newly.icon, `${newly.name} is now open for business.`); }
}
function totalIncomePerTick(){
  const base = locations.reduce((sum,l)=>{
    const count = state.owned[l.id]||0;
    return sum + count*l.income;
  },0);
  return Math.floor(base * (state.bossStyle==='owner' ? 1.25 : 1));
}
function totalService(){
  return state.service + inventoryPower('service') + crewPower();
}
function totalQuality(){
  return state.quality + inventoryPower('quality') + Math.floor(crewPower()*.75);
}
function crewPower(){ return state.crew.reduce((s,c)=>s+c.power,0); }
function inventoryPower(stat){
  const slots = Math.max(1,state.crew.length);
  const categories = ['equipment','service','training','quality'];
  let total = 0;
  for(const category of categories){
    const sorted = items.filter(i => i.type===category && (state.inventory[i.id]||0)>0).sort((a,b)=>(b[stat]||0)-(a[stat]||0));
    let used = 0;
    for(const item of sorted){
      const count = Math.min(state.inventory[item.id]||0, slots-used);
      total += count*(item[stat]||0);
      used += count;
      if(used>=slots) break;
    }
  }
  return total;
}
function effectiveCash(){ return state.cash; }
function locationCost(loc){
  const count=state.owned[loc.id]||0;
  return Math.floor(loc.cost*Math.pow(1.18,count));
}
function updateTimers(){
  const now=Date.now();
  if(!state.lastEnergyRegen) state.lastEnergyRegen=state.lastUpdate||now;
  if(!state.lastDriveRegen) state.lastDriveRegen=state.lastUpdate||now;
  if(!state.lastMoraleRegen) state.lastMoraleRegen=state.lastUpdate||now;
  const energyInterval = state.bossStyle==='operator' ? 45_000 : ENERGY_REGEN_MS;
  const driveInterval = state.bossStyle==='competitor' ? 65_000 : DRIVE_REGEN_MS;
  const moraleInterval = state.bossStyle==='competitor' ? 90_000 : MORALE_REGEN_MS;

  const energyGain=Math.floor(Math.max(0,now-state.lastEnergyRegen)/energyInterval);
  if(energyGain>0){ state.energy=Math.min(state.maxEnergy,state.energy+energyGain); state.lastEnergyRegen += energyGain*energyInterval; }
  const driveGain=Math.floor(Math.max(0,now-state.lastDriveRegen)/driveInterval);
  if(driveGain>0){ state.drive=Math.min(state.maxDrive,state.drive+driveGain); state.lastDriveRegen += driveGain*driveInterval; }
  const moraleGain=Math.floor(Math.max(0,now-state.lastMoraleRegen)/moraleInterval);
  if(moraleGain>0){ state.morale=Math.min(state.maxMorale,state.morale+moraleGain); state.lastMoraleRegen += moraleGain*moraleInterval; }

  const incomeElapsed=Math.max(0, now-state.lastIncome);
  const ticks=Math.floor(incomeElapsed/INCOME_TICK_MS);
  if(ticks>0){
    const income=totalIncomePerTick()*ticks;
    if(income>0){ state.cash+=income; state.lifetimeIncome+=income; }
    state.lastIncome += ticks*INCOME_TICK_MS;
  }
  const tokenElapsed=Math.max(0, now-state.lastChallengeToken);
  const tokenGain=Math.floor(tokenElapsed/(60*60*1000));
  if(tokenGain>0){
    state.challengeTokens=Math.min(state.maxChallengeTokens,state.challengeTokens+tokenGain);
    state.lastChallengeToken += tokenGain*60*60*1000;
  }
  state.lastUpdate=now;
}
function addFeed(iconName,text){
  state.feed.unshift({id:uid(),icon:iconName,text,time:Date.now()});
  state.feed=state.feed.slice(0,16);
}
function toast(message,type=''){
  const region=document.getElementById('toastRegion');
  const el=document.createElement('div');
  el.className=`toast ${type}`;
  el.textContent=message;
  region.appendChild(el);
  setTimeout(()=>el.remove(),2800);
}
function relativeTime(t){
  const s=Math.floor((Date.now()-t)/1000);
  if(s<45) return 'now';
  if(s<3600) return `${Math.floor(s/60)}m`;
  if(s<86400) return `${Math.floor(s/3600)}h`;
  return `${Math.floor(s/86400)}d`;
}
function chanceLoot(shift){
  if(!shift.loot?.length) return null;
  const chance=.16 + Math.min(.16,(state.shiftMastery[shift.id]||0)/500);
  if(Math.random()>chance) return null;
  const id=pick(shift.loot);
  state.inventory[id]=(state.inventory[id]||0)+1;
  state.itemsFound++;
  const item=items.find(i=>i.id===id);
  addFeed('package-open',`Found ${item.name} while completing ${shift.name}.`);
  toast(`Loot drop: ${item.name}`, 'good');
  return item;
}
function performShift(id){
  const s=shifts.find(x=>x.id===id);
  if(!s||state.level<s.level||state.energy<s.energy) return toast('Not enough energy.','bad');
  state.energy-=s.energy;
  const payout=Math.floor(s.cash[0]+Math.random()*(s.cash[1]-s.cash[0]+1));
  state.cash+=payout;
  state.lifetimeIncome+=payout;
  state.xp+=s.xp;
  state.jobsCompleted++;
  const oldMastery=state.shiftMastery[s.id]||0;
  state.shiftMastery[s.id]=oldMastery+s.mastery;
  const oldTier=Math.min(3,Math.floor(oldMastery/100));
  const newTier=Math.min(3,Math.floor(state.shiftMastery[s.id]/100));
  if(newTier>oldTier){
    const bonus=250*newTier + state.level*50;
    state.cash+=bonus; state.lifetimeIncome+=bonus; state.skillPoints+=1;
    toast(`${s.name} mastery ${['I','II','III'][newTier-1]}: +${formatMoney(bonus)} and +1 skill point`, 'good');
    addFeed('badge-check',`${s.name} reached Mastery ${['I','II','III'][newTier-1]}.`);
  }
  chanceLoot(s);
  if(Math.random()<.06){ state.energy=Math.min(state.maxEnergy,state.energy+s.energy); toast('Perfect flow. Energy refunded!', 'good'); }
  addFeed('clipboard-check',`${s.name}: +${formatMoney(payout)} and +${s.xp} XP.`);
  levelCheck(); checkAchievements(); saveState(true); render();
}
function buyLocation(id){
  const l=locations.find(x=>x.id===id);
  if(!l||state.level<l.level) return;
  const cost=locationCost(l);
  if(state.cash<cost) return toast('You need more cash.','bad');
  state.cash-=cost;
  state.owned[id]=(state.owned[id]||0)+1;
  state.locationsBought++;
  addFeed(l.icon,`Opened ${l.name} #${state.owned[id]}.`);
  toast(`${l.name} added to your business.`, 'good');
  checkAchievements(); saveState(true); render();
}
function buyItem(id){
  const item=items.find(i=>i.id===id);
  if(!item) return;
  if(state.cash<item.cost) return toast('You need more cash.','bad');
  state.cash-=item.cost;
  state.inventory[id]=(state.inventory[id]||0)+1;
  addFeed('shopping-bag',`Bought ${item.name}.`);
  saveState(true); render();
}
function sellItem(id){
  const item=items.find(i=>i.id===id);
  if(!item||(state.inventory[id]||0)<=0) return;
  state.inventory[id]--;
  const value=Math.floor(item.cost*.45);
  state.cash+=value;
  addFeed('badge-dollar-sign',`Sold ${item.name} for ${formatMoney(value)}.`);
  saveState(true); render();
}
function recruitCrew(){
  const cost=Math.floor(300*Math.pow(1.55,state.crew.length-1));
  if(state.cash<cost) return toast('You need more cash.','bad');
  state.cash-=cost;
  const role=crewRoles[Math.min(crewRoles.length-1,Math.floor(state.crew.length/4))];
  const member={id:uid(),name:pick(crewNames.filter(n=>!state.crew.some(c=>c.name===n))),role,power:1+Math.floor(state.level/8)};
  if(!member.name) member.name='Crew '+(state.crew.length+1);
  state.crew.push(member);
  addFeed('user-plus',`${member.name} joined your crew as ${member.role}.`);
  toast(`${member.name} joined the crew.`, 'good');
  saveState(true); render();
}
function rivalList(){
  const seed = state.level*17 + Math.floor(Date.now()/300000);
  return rivalNames.slice(0,6).map((name,i)=>{
    const delta=((seed+i*13)%9)-4;
    const level=Math.max(1,state.level+delta);
    const powerBase=8+level*4.1;
    return {id:i,name,level,service:Math.floor(powerBase*(.82+((seed+i)%12)/50)),quality:Math.floor(powerBase*(.82+((seed+i*2)%11)/48)),cash:Math.floor(35+level*42),crew:Math.max(1,Math.floor(level/3)+1)};
  });
}
function challengeRival(index){
  const rival=rivalList()[index];
  if(!rival) return;
  if(state.drive<1) return toast('You need more drive.','bad');
  if(state.morale<8) return toast('Your crew needs a break first.','bad');
  state.drive--;
  const atk=totalService()+Math.random()*12;
  const def=rival.quality+Math.random()*10;
  const playerDef=totalQuality()+Math.random()*10;
  const rivalAtk=rival.service+Math.random()*10;
  const damage=Math.max(3,Math.floor(rivalAtk-playerDef*.35));
  state.morale=clamp(state.morale-damage,0,state.maxMorale);
  if(atk>=def){
    const payout=rival.cash+Math.floor(Math.random()*rival.cash*.4);
    const xp=5+Math.floor(rival.level*1.4);
    state.cash+=payout; state.lifetimeIncome+=payout; state.xp+=xp; state.rivalsBeaten++;
    addFeed('swords',`Beat ${rival.name} in a head-to-head rush. +${formatMoney(payout)}.`);
    toast(`You beat ${rival.name}.`, 'good');
    if(Math.random()<.08){ state.bossPoints++; toast('You earned a Boss Point.', 'good'); }
  } else {
    const loss=Math.min(state.cash,Math.floor(rival.cash*.22));
    state.cash-=loss; state.rivalLosses++;
    addFeed('shield-alert',`${rival.name} beat you. Lost ${formatMoney(loss)} from the till.`);
    toast(`${rival.name} got the better of you.`, 'bad');
  }
  levelCheck(); checkAchievements(); saveState(true); render();
}
function bossAttack(id,power=false){
  const b=bosses.find(x=>x.id===id);
  if(!b||state.level<b.level||state.defeatedBosses.includes(id)) return;
  const cost=power?3:1;
  if(state.drive<cost) return toast('Not enough drive.','bad');
  if(state.morale<10) return toast('Your crew needs a break.','bad');
  state.drive-=cost;
  const playerPower=(totalService()+totalQuality())/2;
  const scale=power?2.65:1;
  const dealt=Math.max(8,Math.floor((playerPower*.7 + Math.random()*playerPower*.35)*scale));
  const taken=Math.max(4,Math.floor(((b.service+b.quality)/5)*(power?1.25:1) - totalQuality()*.08));
  state.morale=clamp(state.morale-taken,0,state.maxMorale);
  state.bossDamage[id]=(state.bossDamage[id]||0)+dealt;
  state.xp+=Math.max(2,Math.floor(dealt/8));
  toast(`${power?'Power push':'Push'} dealt ${dealt}.`, 'good');
  if(state.bossDamage[id]>=b.hp){
    state.defeatedBosses.push(id);
    state.cash+=b.reward; state.lifetimeIncome+=b.reward; state.xp+=b.xp; state.bossPoints+=2;
    state.inventory[b.item]=(state.inventory[b.item]||0)+1;
    const item=items.find(i=>i.id===b.item);
    addFeed('trophy',`Defeated ${b.name}. Won ${formatMoney(b.reward)} and ${item.name}.`);
    toast(`${b.name} defeated!`, 'good');
  }
  levelCheck(); checkAchievements(); saveState(true); render();
}
function heal(){
  const missing=state.maxMorale-state.morale;
  if(missing<=0) return toast('Morale is already full.');
  const cost=Math.max(25,Math.floor(missing*2.2));
  if(state.cash<cost) return toast('You need more cash.','bad');
  state.cash-=cost; state.morale=state.maxMorale;
  addFeed('heart-pulse',`Crew morale restored for ${formatMoney(cost)}.`);
  saveState(true); render();
}
function useBossPoint(type){
  if(state.bossPoints<1) return toast('You need a Boss Point.','bad');
  state.bossPoints--;
  if(type==='energy') state.energy=state.maxEnergy;
  if(type==='drive') state.drive=state.maxDrive;
  if(type==='morale') state.morale=state.maxMorale;
  if(type==='cash'){ const grant=Math.floor(250+state.level*125); state.cash+=grant; state.lifetimeIncome+=grant; }
  toast('Boss Point used.', 'good'); saveState(true); render();
}
function addSkill(stat){
  if(state.skillPoints<1) return toast('No skill points available.','bad');
  state.skillPoints--;
  if(stat==='service') state.service++;
  if(stat==='quality') state.quality++;
  if(stat==='energy'){state.maxEnergy++;state.energy++;}
  if(stat==='drive'){state.maxDrive++;state.drive++;}
  if(stat==='morale'){state.maxMorale+=10;state.morale+=10;}
  saveState(true); render();
}
function transferReserve(direction,amount){
  amount=Math.floor(Number(amount)||0);
  if(amount<=0) return;
  if(direction==='deposit'){
    const val=Math.min(amount,state.cash); state.cash-=val; state.reserve+=val;
    if(val) addFeed('landmark',`Moved ${formatMoney(val)} into reserve.`);
  } else {
    const val=Math.min(amount,state.reserve); state.reserve-=val; state.cash+=val;
    if(val) addFeed('wallet-cards',`Withdrew ${formatMoney(val)} from reserve.`);
  }
  saveState(true); render();
}
function runChallenge(type){
  if(state.challengeTokens<1) return toast('No challenge tokens. They regenerate hourly.','bad');
  state.challengeTokens--;
  const roll=Math.random();
  if(type==='latte'){
    const reward=Math.floor(180+state.level*65+(roll>.8?350:0));
    state.cash+=reward; state.lifetimeIncome+=reward; state.xp+=16+state.level;
    toast(`Latte art challenge: ${formatMoney(reward)} won.`, 'good');
    addFeed('palette',`Completed a latte art challenge for ${formatMoney(reward)}.`);
  } else if(type==='speed'){
    const energy=Math.min(state.maxEnergy-state.energy, 5+Math.floor(state.level/4));
    state.energy+=energy; state.xp+=12+state.level;
    toast(`Speed round: +${energy} energy.`, 'good');
    addFeed('timer',`Speed service challenge restored ${energy} energy.`);
  } else {
    const chance=.32 + Math.min(.28,state.level/100);
    if(Math.random()<chance){
      const pool=items.filter(i=>i.cost<Math.max(500,state.level*1200));
      const item=pick(pool); state.inventory[item.id]=(state.inventory[item.id]||0)+1; state.itemsFound++;
      toast(`Mystery crate: ${item.name}`, 'good'); addFeed('package-search',`Challenge reward: ${item.name}.`);
    } else {
      const reward=Math.floor(100+state.level*35); state.cash+=reward; state.lifetimeIncome+=reward; toast(`Mystery crate: ${formatMoney(reward)}.`);
    }
  }
  levelCheck(); checkAchievements(); saveState(true); render();
}
function checkAchievements(){
  const defs=[
    ['first10',state.jobsCompleted>=10,'Ten Shifts Deep',1],
    ['owner',state.locationsBought>=3,'Growing Footprint',1],
    ['rival5',state.rivalsBeaten>=5,'Local Favourite',1],
    ['crew5',state.crew.length>=5,'Full Crew',2],
    ['income',state.lifetimeIncome>=25000,'Real Business',2]
  ];
  defs.forEach(([id,ok,name,points])=>{
    if(ok&&!state.achievements.includes(id)){
      state.achievements.push(id); state.bossPoints+=points; toast(`Achievement: ${name} +${points} Boss Point${points>1?'s':''}`, 'good');
    }
  });
}
function claimCollection(id){
  const c=collections.find(x=>x.id===id);
  if(!c||state.collectionsClaimed.includes(id)) return;
  if(!c.items.every(itemId=>(state.inventory[itemId]||0)>0)) return toast('Collection incomplete.','bad');
  state.collectionsClaimed.push(id); state.cash+=c.reward.cash; state.skillPoints+=c.reward.skill;
  toast(`${c.name} completed.`, 'good'); addFeed('library-big',`Completed ${c.name}: +${formatMoney(c.reward.cash)}, +${c.reward.skill} skill point${c.reward.skill>1?'s':''}.`);
  saveState(true); render();
}
