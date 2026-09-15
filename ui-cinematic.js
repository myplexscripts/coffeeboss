'use strict';

function cbxResourceGuide(scene){
  const energySeconds=state.bossStyle==='operator'?45:60;
  const driveSeconds=state.bossStyle==='competitor'?65:90;
  const moraleSeconds=state.bossStyle==='competitor'?90:120;
  const entries={
    energy:['zap','Energy',`Your shift budget. Each shift costs Energy, so choose work you can afford. It returns automatically: 1 every ${energySeconds} seconds, up to your maximum.`],
    drive:['flame','Drive',`Your challenge budget. Rivals cost 1; major challenges cost 1 for a standard attempt or 3 for a full effort. It returns automatically: 1 every ${driveSeconds} seconds.`],
    morale:['heart-pulse','Morale',`How much pressure your crew can take. Rival and major challenges wear it down. You need at least 8 for rivals and 10 for major challenges. It also affects shift performance. Recover in the Break Room or wait: 1 returns every ${moraleSeconds} seconds.`]
  };
  const keys=scene==='shifts'?['energy','morale']:['rivals','challenges'].includes(scene)?['drive','morale']:scene==='home'||scene==='breakroom'?Object.keys(entries):[];
  if(!keys.length)return '';
  return `<aside class="resource-guide" aria-label="How your resources work">${keys.map(key=>{const [ico,title,copy]=entries[key];return `<details><summary>${icon(ico)}${title}: what is it for?</summary><p>${copy}</p></details>`;}).join('')}</aside>`;
}

function cbxEventBrief(context){
  const modal=document.getElementById('modal');
  const content=document.getElementById('modalContent');
  const boss=context.action==='boss'?bosses.find(b=>b.id===context.id):null;
  const rival=context.action==='rival'?rivalList()[Number(context.index)]:null;
  const title=boss?.name||rival?.name||context.name||'Special event';
  const cost=context.action==='challenge'?'1 challenge token':`${context.power==='1'?3:1} Drive, plus Morale from the pressure`;
  const description=context.action==='challenge'
    ? {latte:'The cups are lined up. Put your pour in front of the judges and see what it earns.',speed:'The orders are coming in. This round earns XP and restores some Energy.',crate:'A sealed delivery just arrived. Open it to reveal cash or a piece of gear.'}[context.type]
    : boss?'Every push reduces the remaining pressure. Your progress stays, even if you need a break between attempts.':'Your Service faces their Quality. Your Quality helps limit the Morale you lose. A loss can cost cash from the till.';
  modal.classList.remove('shift-modal','shift-resolving');
  content.innerHTML=`<section class="event-brief"><span class="scene-kicker">BEFORE YOU BEGIN</span><h2>${title}</h2><p>${description}</p><p><strong>Cost:</strong> ${cost}</p><p>Once you start, your crew takes it from here.</p><div class="event-buttons"><button class="btn soft" data-event-back>Not yet</button><button class="btn primary" data-event-start>${context.type==='crate'?'Open the crate':'Start the challenge'}</button></div></section>`;
  modal.showModal();
  content.querySelector('[data-event-back]').onclick=()=>modal.close();
  content.querySelector('[data-event-start]').onclick=()=>{
    const stages=context.type==='crate'?['Breaking the seal…','Unpacking the delivery…','Here is what was inside.']:context.action==='rival'?['The rush is on…','Both crews are pushing…','The results are in.']:context.action==='boss'?['Your crew steps up…','Putting on the pressure…','Let’s see how far you got.']:['Taking your place…','The round is underway…','The results are in.'];
    let finished=false;
    const finish=()=>{
      if(finished)return;finished=true;
      const before=resourceSnapshot();
      window.cbxActionInFlight=true;
      try{
        if(context.action==='challenge')runChallenge(context.type);
        if(context.action==='rival')challengeRival(Number(context.index));
        if(context.action==='boss')bossAttack(context.id,context.power==='1');
      }finally{window.cbxActionInFlight=false;modal.oncancel=null;modal.close();}
      afterActionFeedback(before,context);
    };
    modal.oncancel=e=>e.preventDefault();
    content.innerHTML=`<section class="event-brief event-performance"><div class="event-performance-icon">${icon(context.type==='crate'?'package-open':'trophy')}</div><h2>${title}</h2><p role="status" aria-live="polite" id="eventStage">${stages[0]}</p><progress max="3" value="1" aria-label="Challenge reveal progress"></progress><button class="btn soft" data-event-skip>Show result now</button></section>`;
    lucide.createIcons();
    content.querySelector('[data-event-skip]').onclick=finish;
    const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if(reduced){finish();return;}
    [1,2].forEach(n=>setTimeout(()=>{if(!finished){content.querySelector('#eventStage').textContent=stages[n];content.querySelector('progress').value=n+1;}},n*800));
    setTimeout(finish,2400);
  };
}

/*
 * The cinematic presentation layer deliberately leaves the game engine alone.
 * Every screen below is composed as a place in the game, not a dashboard.
 */

const cbxSceneCopy = {
  shifts:{
    kicker:'THE SHOP FLOOR',
    title:'Choose your shift',
    copy:'Some days are a quick open. Some days the line is out the door. Pick the shift you want to take on and we will size it up before you commit.',
    prompt:'Pick a shift. Nothing is spent until you press Work Shift.',
    icon:'clipboard-check'
  },
  rivals:{
    kicker:'AROUND THE BLOCK',
    title:'Make some noise',
    copy:'Other shops are chasing the same regulars. Challenge one when your crew has the drive and morale to make a proper run at it.',
    prompt:'Favourable is the safer bet. Tough can still pay off, but it can empty the till.',
    icon:'swords'
  },
  locations:{
    kicker:'YOUR COFFEE EMPIRE',
    title:'Put down new roots',
    copy:'Every location earns cash in the background. Open the next one, or pour money into a spot that is already working for you.',
    prompt:'Follow the route from left to right. Locked neighbourhoods open as your level climbs.',
    icon:'map'
  },
  stockroom:{
    kicker:'BEHIND THE COUNTER',
    title:'Set the crew up right',
    copy:'Useful gear quietly lifts service and quality. Your crew decides how much equipment can be working at once.',
    prompt:'Browse supplies to buy gear. Inventory shows what is already on your shelves.',
    icon:'package-open'
  },
  crew:{
    kicker:'YOUR PEOPLE',
    title:'Build a crew that can handle it',
    copy:'Every new hire adds power and another gear slot. A bigger crew costs more, but it changes what the shop can take on.',
    prompt:'Recruit when the till can cover it. New hires join immediately.',
    icon:'users'
  },
  challenges:{
    kicker:'SPECIAL EVENTS',
    title:'Step into the spotlight',
    copy:'Side events hand out quick rewards. Major challenges stick around until you finally break through them.',
    prompt:'Side events cost one token. Major challenges use Drive and wear down Morale.',
    icon:'trophy'
  },
  reserve:{
    kicker:'THE BACK OFFICE',
    title:'Keep the important cash safe',
    copy:'Money in the reserve is out of reach when a rival gets the better of you. Move it back to the till whenever you need to spend it.',
    prompt:'Cash on hand can be spent. Reserve cash is protected.',
    icon:'landmark'
  },
  breakroom:{
    kicker:'TAKE FIVE',
    title:'Give the crew a breather',
    copy:'Big pushes take something out of everyone. Let morale recover on its own, pay for a proper reset, or spend a Boss Point when you need help now.',
    prompt:'Low morale blocks tougher challenges. Restoring it gets everyone back in the game.',
    icon:'heart-pulse'
  },
  profile:{
    kicker:'THE BOSS',
    title:'Decide what you get good at',
    copy:'Skill points shape the way your shop plays. Build for busy shifts, stronger coffee, harder rival pushes, or a crew that can keep going.',
    prompt:'Each upgrade costs one skill point. There is no wrong build.',
    icon:'sparkles'
  }
};

function cbxSceneIntro(scene, extras=''){
  const item = cbxSceneCopy[scene];
  return `<header class="scene-intro scene-intro-${scene}">
    <div class="scene-copy">
      <span class="scene-kicker">${item.kicker}</span>
      <h1>${item.title}</h1>
      <p>${item.copy}</p>
      ${cbxResourceGuide(scene)}
      <div class="scene-prompt">${icon('mouse-pointer-click')}<span>${item.prompt}</span></div>
      ${extras}
    </div>
    <div class="scene-emblem" aria-hidden="true">
      <span class="scene-emblem-ring"></span>
      <span class="scene-emblem-icon">${icon(item.icon)}</span>
      <span class="scene-emblem-shadow"></span>
    </div>
  </header>`;
}

function cbxReadout(label,value,iconName,tone=''){
  return `<div class="stage-readout ${tone}"><span class="readout-icon">${icon(iconName)}</span><span class="readout-label">${label}</span><strong class="readout-value">${value}</strong></div>`;
}

function cbxFeed(limit=6){
  const rows=(state.feed||[]).slice(0,limit);
  if(!rows.length) return `<div class="story-empty">The day is quiet. For now.</div>`;
  return `<div class="story-list">${rows.map((entry,index)=>`<div class="story-beat" style="--beat:${index}">
    <span class="story-pin">${icon(entry.icon||'circle')}</span>
    <span class="story-copy">${entry.text}</span>
    <time>${relativeTime(entry.time)}</time>
  </div>`).join('')}</div>`;
}

function cbxMasteryLabel(value){
  const tier=Math.min(3,Math.floor(value/100));
  return tier?`Mastery ${['I','II','III'][tier-1]}`:'Learning';
}

function cbxHomeObjective(){
  if(state.jobsCompleted<3) return {icon:'coffee',label:'START HERE · 1 OF 4',title:'Serve your first three batches',copy:`${state.jobsCompleted}/3 served. Choose Serve the Regulars at the counter. Each batch earns cash and XP, and the shop stays open between batches.`,action:'shifts',button:'HEAD TO THE COUNTER'};
  if(!state.locationsBought) return {icon:'shopping-cart',label:'NEXT UP · 2 OF 4',title:'Open your first Coffee Cart',copy:'Save $450 from shifts, then open a Coffee Cart in Locations. It earns cash every minute, even while you are away.',action:state.cash>=450?'locations':'shifts',button:state.cash>=450?'OPEN A COFFEE CART':'EARN THE REST'};
  if(state.crew.length<2) return {icon:'user-plus',label:'NEXT UP · 3 OF 4',title:'Give Maya some backup',copy:'Recruit one person for $300. They add power and let you use more gear. Keep working shifts if you need the cash.',action:state.cash>=300?'crew':'shifts',button:state.cash>=300?'MEET YOUR NEXT HIRE':'WORK ANOTHER SHIFT'};
  if(state.rivalsBeaten+state.rivalLosses===0) return {icon:'swords',label:'TRY IT OUT · 4 OF 4',title:'Try a rival challenge',copy:'Visit Rivals and compare their strength with yours. Gear and skill upgrades help if they look too tough. Winning is not required to move on.',action:'rivals',button:'LOOK AT THE RIVALS'};
  const ready=bosses.find(b=>state.level>=b.level&&!state.defeatedBosses.includes(b.id));
  if(ready) return {icon:ready.icon,label:'READY NOW',title:ready.name,copy:'This one is waiting for you. Build Drive and Morale, then make your push.',action:'challenges',button:'FACE THE CHALLENGE'};
  const next=bosses.find(b=>state.level<b.level);
  if(next) return {icon:next.icon,label:`UNLOCKS AT LEVEL ${next.level}`,title:next.name,copy:'Keep working shifts and earning XP. This is the next big test on the horizon.',action:'shifts',button:'KEEP BUILDING'};
  return {icon:'crown',label:'CITY FAVOURITE',title:'You cleared every major challenge',copy:'The city knows the name. Now build the business exactly the way you want it.',action:'locations',button:'GROW THE BUSINESS'};
}

renderHome=function(){
  const district=cbDistrict(state.district);
  const income=totalIncomePerTick();
  const objective=cbxHomeObjective();
  const nextDistrict=districts.find(d=>d.level>state.level);
  return `<div class="scene-screen home-scene">
    <section class="first-steps" aria-label="Your next step"><span>${objective.label}</span><h2>${objective.title}</h2><p>${objective.copy}</p><button class="quest-button" data-action="nav" data-page="${objective.action}">${objective.button}${icon('arrow-right')}</button><details><summary>How the game works</summary><p>Work shifts for cash and XP. Open locations for steady income. Recruit crew and buy gear to get stronger. Then take on rivals and major challenges. There is no daily schedule: each shift is another batch of work, and you choose when to stop.</p></details></section>
    ${cbxResourceGuide('home')}
    <header class="home-stage">
      <div class="home-stage-copy">
        <span class="scene-kicker">${district.name.toUpperCase()} · LEVEL ${state.level}</span>
        <h1>The doors are open.</h1>
        <p>Your shop is finding its feet. Work the floor for quick cash, take on rivals when the crew is ready, and turn that tiny start into something the whole city knows.</p>
        <button class="hero-command" data-action="nav" data-page="shifts">
          <span class="hero-command-icon">${icon('zap')}</span>
          <span><strong>WORK A SHIFT</strong><small>You have ${state.energy} Energy ready</small></span>
          ${icon('arrow-right')}
        </button>
      </div>
      <div class="shop-silhouette" aria-hidden="true">
        <span class="shop-sun"></span>
        <span class="shop-building">${icon(district.icon)}</span>
        <span class="shop-awning"></span>
        <span class="shop-ground"></span>
      </div>
      <div class="home-stage-stats">
        ${cbxReadout('Income',`+${formatMoney(income)}/min`,'trending-up','cash')}
        ${cbxReadout('Crew',state.crew.length,'users','quality')}
        ${cbxReadout('Service',totalService(),'gauge','service')}
        ${cbxReadout('Quality',totalQuality(),'badge-check','quality')}
      </div>
    </header>

    <nav class="action-ribbon" aria-label="Shop actions">
      <button data-action="nav" data-page="rivals"><span>${icon('swords')}</span><strong>Rivals</strong><small>Spend Drive</small></button>
      <button data-action="nav" data-page="locations"><span>${icon('store')}</span><strong>Locations</strong><small>${formatMoney(income)}/min</small></button>
      <button data-action="nav" data-page="stockroom"><span>${icon('package-open')}</span><strong>Stockroom</strong><small>${state.itemsFound} found</small></button>
      <button data-action="nav" data-page="crew"><span>${icon('users')}</span><strong>Crew</strong><small>${crewPower()} power</small></button>
    </nav>

    <div class="home-story-grid">
      <section class="quest-stage">
        <div class="quest-art">${icon(objective.icon)}</div>
        <div class="quest-copy"><span>${objective.label}</span><h2>${objective.title}</h2><p>${objective.copy}</p></div>
        <button class="quest-button" data-action="nav" data-page="${objective.action}">${objective.button}${icon('arrow-right')}</button>
      </section>
      <section class="next-stop">
        <span class="next-stop-label">${icon('map-pin')} NEXT NEIGHBOURHOOD</span>
        <strong>${nextDistrict?nextDistrict.name:'Everywhere is open'}</strong>
        <p>${nextDistrict?`Reach Level ${nextDistrict.level} to take Coffee Boss there.`:'The whole city is yours to build in.'}</p>
        ${nextDistrict?`<div class="route-progress"><span style="width:${clamp(state.level/nextDistrict.level*100,0,100)}%"></span></div>`:''}
      </section>
    </div>

    <section class="story-log">
      <div class="story-heading"><span>${icon('radio')} SHOP TALK</span><small>The latest from your run</small></div>
      ${cbxFeed(6)}
    </section>
  </div>`;
};

renderShifts=function(){
  const unlockedDistricts=districts.filter(d=>state.level>=d.level);
  if(!currentTab||!unlockedDistricts.some(d=>d.id===currentTab)) currentTab=state.district;
  const district=cbDistrict(currentTab)||unlockedDistricts[0];
  const districtShifts=shifts.filter(s=>s.district===district.id);
  const extras=`<div class="scene-inline-facts">${cbxReadout('Energy ready',`${state.energy}/${state.maxEnergy}`,'zap','energy')}${cbxReadout('Refill',state.bossStyle==='operator'?'1 / 45 sec':'1 / min','timer')}</div>`;
  return `<div class="scene-screen shifts-scene">
    ${cbxSceneIntro('shifts',extras)}
    <nav class="district-switcher">${unlockedDistricts.map(d=>`<button class="${d.id===district.id?'active':''}" data-action="tab" data-tab="${d.id}">${icon(d.icon)}<span>${d.name}</span></button>`).join('')}</nav>
    <section class="mission-board">
      <div class="mission-board-heading"><span>AVAILABLE IN ${district.name.toUpperCase()}</span><small>${district.description}</small></div>
      <div class="mission-list">${districtShifts.map((s,index)=>{
        const unlocked=state.level>=s.level;
        const mastery=state.shiftMastery[s.id]||0;
        const affordable=state.energy>=s.energy;
        const buttonLabel=!unlocked?`LEVEL ${s.level}`:!affordable?'NEED ENERGY':'SERVE THIS BATCH';
        return `<article class="mission ${!unlocked?'locked':''}">
          <span class="mission-number">${String(index+1).padStart(2,'0')}</span>
          <div class="mission-art">${icon(s.icon)}<span>${cbxMasteryLabel(mastery)}</span></div>
          <div class="mission-copy"><span class="mission-status">${unlocked?'SHIFT AVAILABLE':`LOCKED UNTIL LEVEL ${s.level}`}</span><h2>${s.name}</h2><p>${s.description}</p>
            <div class="mission-pay">${cbResourceChip('energy','zap','Energy',s.energy)}${cbResourceChip('cash','banknote','Cash',`${formatMoney(s.cash[0])} to ${formatMoney(s.cash[1])}`)}${cbResourceChip('xp','sparkles','XP',s.xp)}</div>
          </div>
          ${coffeeTraitHeatmap(s)}
          <button class="mission-start" data-action="shift" data-id="${s.id}" ${!unlocked||!affordable?'disabled':''}>${buttonLabel}${icon('arrow-right')}</button>
        </article>`;
      }).join('')}</div>
    </section>
  </div>`;
};

renderRivals=function(){
  const rivals=rivalList();
  const extras=`<div class="scene-inline-facts">${cbxReadout('Your attack',totalService(),'gauge','service')}${cbxReadout('Your defence',totalQuality(),'shield-check','quality')}${cbxReadout('Record',`${state.rivalsBeaten}W / ${state.rivalLosses}L`,'trophy')}</div>`;
  return `<div class="scene-screen rivals-scene">
    ${cbxSceneIntro('rivals',extras)}
    <div class="rival-board">${rivals.map((r,i)=>{
      const compare=(totalService()+totalQuality())-(r.service+r.quality);
      const label=compare>25?'Favourable':compare>-10?'Close':'Tough';
      return `<article class="matchup ${cbDifficultyClass(label)}">
        <div class="matchup-banner"><span class="matchup-rank">#${i+1}</span><span class="matchup-mark">${icon('store')}</span><span class="matchup-difficulty">${label}</span></div>
        <div class="matchup-name"><span>LEVEL ${r.level} · ${r.crew} CREW</span><h2>${r.name}</h2></div>
        <div class="versus-line"><span><small>SERVICE</small><strong>${r.service}</strong></span><b>VS</b><span><small>QUALITY</small><strong>${r.quality}</strong></span></div>
        <div class="matchup-prize"><span>${icon('banknote')} WIN UP TO</span><strong>${formatMoney(Math.floor(r.cash*1.4))}</strong></div>
        <button data-action="rival" data-index="${i}" data-name="${r.name}" ${state.drive<1||state.morale<8?'disabled':''}>${icon('swords')} TAKE THEM ON <span>1 Drive</span></button>
      </article>`;
    }).join('')}</div>
  </div>`;
};

renderLocations=function(){
  const extras=`<div class="scene-inline-facts">${cbxReadout('Cash ready',formatMoney(state.cash),'banknote','cash')}${cbxReadout('Current income',`+${formatMoney(totalIncomePerTick())}/min`,'trending-up','cash')}</div>`;
  return `<div class="scene-screen locations-scene">
    ${cbxSceneIntro('locations',extras)}
    <section class="location-route"><div class="location-route-line"></div>${locations.map((l,index)=>{
      const unlocked=state.level>=l.level;
      const count=state.owned[l.id]||0;
      const cost=locationCost(l);
      const action=count>0?'EXPAND THIS SPOT':'OPEN THIS SPOT';
      return `<article class="route-stop ${!unlocked?'locked':''} ${count?'owned':''}">
        <div class="route-node"><span>${icon(unlocked?l.icon:'lock-keyhole')}</span><b>${String(index+1).padStart(2,'0')}</b></div>
        <div class="route-place"><span>${unlocked?cbDistrict(l.district).name:`OPENS AT LEVEL ${l.level}`}</span><h2>${l.name}</h2><p>${l.description}</p></div>
        <div class="route-income"><small>EARNS EACH MINUTE</small><strong>+${formatMoney(l.income)}</strong><span>${count?`${count} running`:'Not open yet'}</span></div>
        <button data-action="location" data-id="${l.id}" data-name="${l.name}" ${!unlocked||state.cash<cost?'disabled':''}><span>${unlocked?action:`LEVEL ${l.level}`}</span>${unlocked?`<strong>${formatMoney(cost)}</strong>`:''}</button>
      </article>`;
    }).join('')}</section>
  </div>`;
};

function cbxInventorySlot(item,shop){
  const count=state.inventory[item.id]||0;
  const price=shop?item.cost:Math.floor(item.cost*.45);
  return `<article class="locker-slot rarity-${cbRarityClass(item.rarity)}">
    <div class="locker-art">${icon(item.icon)}<span>${item.rarity}</span></div>
    <div class="locker-copy"><h2>${item.name}</h2><p>${item.type==='service'?'Keeps the line moving.':item.type==='quality'?'Makes every cup a little better.':item.type==='training'?'Gives the crew a sharper edge.':'Proper equipment for serious shifts.'}</p></div>
    <div class="locker-stats">${cbResourceChip('service','gauge','Service',`+${item.service}`)}${cbResourceChip('quality','badge-check','Quality',`+${item.quality}`)}</div>
    ${count?`<span class="locker-count">×${count}</span>`:''}
    <button data-action="${shop?'buy-item':'sell-item'}" data-id="${item.id}" data-name="${item.name}" ${shop&&state.cash<item.cost?'disabled':''}><span>${shop?'BUY SUPPLY':'SELL ONE'}</span><strong>${formatMoney(price)}</strong></button>
  </article>`;
}

renderStockroom=function(){
  const owned=items.filter(i=>(state.inventory[i.id]||0)>0);
  const tab=currentTab==='shop'?'shop':'owned';
  currentTab=tab;
  const extras=`<div class="scene-inline-facts">${cbxReadout('Gear slots',state.crew.length,'briefcase-business')}${cbxReadout('Cash',formatMoney(state.cash),'banknote','cash')}</div>`;
  return `<div class="scene-screen stockroom-scene">
    ${cbxSceneIntro('stockroom',extras)}
    <nav class="mode-switch"><button class="${tab==='owned'?'active':''}" data-action="tab" data-tab="owned">${icon('warehouse')} ON THE SHELVES</button><button class="${tab==='shop'?'active':''}" data-action="tab" data-tab="shop">${icon('shopping-bag')} SUPPLY SHOP</button></nav>
    <section class="locker"><div class="locker-heading"><span>${tab==='shop'?'SUPPLIES READY TO ORDER':'YOUR WORKING GEAR'}</span><small>${tab==='shop'?'Buy once. The best pieces equip themselves automatically.':'The strongest gear fills your available crew slots.'}</small></div>
      <div class="locker-grid">${tab==='shop'?items.map(i=>cbxInventorySlot(i,true)).join(''):owned.length?owned.map(i=>cbxInventorySlot(i,false)).join(''):`<div class="locker-empty">${icon('package-open')}<h2>The shelves are nearly bare</h2><p>Work shifts for surprise drops, or head to the Supply Shop and buy what you need.</p><button data-action="tab" data-tab="shop">BROWSE SUPPLIES</button></div>`}</div>
    </section>
  </div>`;
};

renderCrew=function(){
  const cost=Math.floor(300*Math.pow(1.55,state.crew.length-1));
  const extras=`<div class="scene-inline-facts">${cbxReadout('Crew power',crewPower(),'sparkles','quality')}${cbxReadout('Next hire',formatMoney(cost),'user-plus','cash')}</div>`;
  return `<div class="scene-screen crew-scene">
    ${cbxSceneIntro('crew',extras)}
    <section class="crew-stage">
      <div class="crew-call"><div class="crew-call-art">${icon('user-plus')}</div><div><span>THERE IS ROOM BEHIND THE BAR</span><h2>Bring in another pair of hands</h2><p>The next hire adds power and opens one more gear slot.</p></div><button data-action="recruit" ${state.cash<cost?'disabled':''}><span>RECRUIT SOMEONE</span><strong>${formatMoney(cost)}</strong></button></div>
      <div class="crew-lineup">${state.crew.map((member,index)=>`<article class="crew-member" style="--member:${index}">
        <div class="crew-portrait">${shopAvatar(member.name)}</div>
        <div class="crew-card-copy"><span>${index===0?'ORIGINAL CREW':`CREW #${index+1}`}</span><h2>${member.name}</h2><p>${member.role}</p></div>
        <div class="crew-card-power"><small>POWER</small><strong>+${member.power}</strong></div>
      </article>`).join('')}</div>
    </section>
  </div>`;
};

function cbxChallenge(type,iconName,title,copy,reward){
  return `<article class="event-poster event-${type}"><div class="event-light"></div><div class="event-art">${icon(iconName)}</div><span class="event-kicker">ONE TOKEN EVENT</span><h2>${title}</h2><p>${copy}</p><div class="event-reward">${icon('gift')}<span>${reward}</span></div><button data-action="challenge" data-type="${type}" data-name="${title}" ${state.challengeTokens<1?'disabled':''}>ENTER EVENT ${icon('arrow-right')}</button></article>`;
}

function cbxBossStage(b){
  const unlocked=state.level>=b.level;
  const defeated=state.defeatedBosses.includes(b.id);
  const damage=clamp(state.bossDamage[b.id]||0,0,b.hp);
  const remain=Math.max(0,b.hp-damage);
  const pct=defeated?100:clamp(damage/b.hp*100,0,100);
  return `<article class="boss-stage ${defeated?'defeated':''}">
    <div class="boss-stage-art">${icon(b.icon)}<span>${defeated?'CLEARED':unlocked?'READY':`LEVEL ${b.level}`}</span></div>
    <div class="boss-stage-copy"><span>MAJOR CHALLENGE</span><h2>${b.name}</h2><p>${b.description}</p><div class="boss-rewards">${cbResourceChip('cash','banknote','Reward',formatMoney(b.reward))}${cbResourceChip('xp','sparkles','XP',b.xp)}</div></div>
    <div class="boss-stage-pressure"><div><span>${defeated?'CHALLENGE COMPLETE':'WORK REMAINING'}</span><strong>${defeated?'DONE':remain}</strong></div><div class="pressure-track"><span style="width:${pct}%"></span></div>
      ${unlocked&&!defeated?`<p class="challenge-instructions">Complete this challenge over several attempts. Each attempt reduces what is left. A full effort makes about 2.65× the progress, but wears down more Morale. You need at least 10 Morale to attempt either.</p><div class="boss-stage-actions"><button data-action="boss" data-id="${b.id}" data-name="${b.name}" data-power="0" ${state.drive<1||state.morale<10?'disabled':''}>STANDARD ATTEMPT <span>1 Drive</span></button><button class="power" data-action="boss" data-id="${b.id}" data-name="${b.name}" data-power="1" ${state.drive<3||state.morale<10?'disabled':''}>FULL EFFORT <span>3 Drive</span></button></div>`:''}
    </div>
  </article>`;
}

renderChallenges=function(){
  const active=bosses.filter(b=>state.level>=b.level||state.defeatedBosses.includes(b.id));
  const extras=`<div class="scene-inline-facts">${cbxReadout('Event tokens',`${state.challengeTokens}/${state.maxChallengeTokens}`,'ticket','xp')}${cbxReadout('Next token','1 hour','timer')}</div>`;
  return `<div class="scene-screen challenges-scene">
    ${cbxSceneIntro('challenges',extras)}
    <section class="event-marquee">${cbxChallenge('latte','palette','Latte Art Throwdown','Make something worth putting on the counter, then hope the judges agree.','Cash and XP')}${cbxChallenge('speed','timer','Speed Service Round','Send the crew through a busy run for a quick pick-me-up.','XP and Energy')}${cbxChallenge('crate','package-search','Mystery Supply Crate','You will leave with cash or a new piece of gear.','Cash or gear')}</section>
    <div class="chapter-break"><span>THE BIG TESTS</span><p>Progress is saved. Every attempt gets you closer to completing the challenge.</p></div>
    <section class="boss-run">${active.length?active.map(cbxBossStage).join(''):`<div class="locked-challenge">${icon('lock-keyhole')}<h2>Your first major challenge arrives at Level 4</h2><p>Keep working. Word about the shop is starting to travel.</p></div>`}</section>
  </div>`;
};

renderReserve=function(){
  const extras=`<div class="scene-inline-facts">${cbxReadout('Total cash',formatMoney(state.cash+state.reserve),'wallet-cards','cash')}</div>`;
  return `<div class="scene-screen reserve-scene">
    ${cbxSceneIntro('reserve',extras)}
    <section class="vault-stage">
      <div class="vault-console till-console"><div class="vault-art">${icon('wallet-cards')}</div><span>FRONT TILL</span><h2>${formatMoney(state.cash)}</h2><p>Ready to spend, but exposed when a rival wins.</p><label for="depositAmount">Amount to protect</label><div class="vault-input"><input id="depositAmount" type="number" min="0" step="100" value="${Math.floor(state.cash)}"><button data-action="transfer" data-direction="deposit">MOVE TO RESERVE ${icon('arrow-right')}</button></div></div>
      <div class="vault-door" aria-hidden="true"><span>${icon('shield-check')}</span><b>PROTECTED</b></div>
      <div class="vault-console reserve-console"><div class="vault-art">${icon('landmark')}</div><span>RESERVE</span><h2>${formatMoney(state.reserve)}</h2><p>Safe from rival losses and waiting when you need it.</p><label for="withdrawAmount">Amount to bring back</label><div class="vault-input"><input id="withdrawAmount" type="number" min="0" step="100" value="${Math.floor(state.reserve)}"><button data-action="transfer" data-direction="withdraw">RETURN TO TILL ${icon('arrow-left')}</button></div></div>
    </section>
  </div>`;
};

renderBreakroom=function(){
  const missing=state.maxMorale-state.morale;
  const cost=Math.max(25,Math.floor(missing*2.2));
  const extras=`<div class="scene-inline-facts">${cbxReadout('Boss Points',state.bossPoints,'crown','xp')}${cbxReadout('Morale refill',state.bossStyle==='competitor'?'1 / 90 sec':'1 / 2 min','timer')}</div>`;
  return `<div class="scene-screen breakroom-scene">
    ${cbxSceneIntro('breakroom',extras)}
    <section class="rest-stage">
      <div class="morale-dial" style="--morale:${state.morale/state.maxMorale*100}"><div>${icon('heart-pulse')}<strong>${state.morale}</strong><span>OF ${state.maxMorale}</span></div></div>
      <div class="rest-copy"><span>HOW EVERYONE IS DOING</span><h2>${state.morale>75?'The crew is feeling good.':state.morale>35?'They could use a minute.':'Everyone is running on fumes.'}</h2><p>Morale comes back with time. If you need the crew ready now, cover a proper reset from the till.</p><button data-action="heal" ${missing<=0||state.cash<cost?'disabled':''}><span>${missing<=0?'MORALE IS FULL':'GIVE EVERYONE A RESET'}</span>${missing>0?`<strong>${formatMoney(cost)}</strong>`:''}</button></div>
    </section>
    <section class="boost-station"><div class="boost-heading"><span>SPEND A BOSS POINT</span><p>A one-off boost when waiting is not an option.</p></div><div class="boost-controls">
      <button class="energy" data-action="boss-point" data-type="energy" ${state.bossPoints<1?'disabled':''}><span>FILL ENERGY</span><small>1 Boss point</small></button>
      <button class="drive" data-action="boss-point" data-type="drive" ${state.bossPoints<1?'disabled':''}><span>FILL DRIVE</span><small>1 Boss point</small></button>
      <button class="morale" data-action="boss-point" data-type="morale" ${state.bossPoints<1?'disabled':''}><span>FILL MORALE</span><small>1 Boss point</small></button>
      <button class="cash" data-action="boss-point" data-type="cash" ${state.bossPoints<1?'disabled':''}><span>GET CASH</span><small>1 Boss point</small></button>
    </div></section>
  </div>`;
};

function cbxCollection(c){
  const owned=c.items.filter(id=>(state.inventory[id]||0)>0).length;
  const complete=owned===c.items.length;
  const claimed=state.collectionsClaimed.includes(c.id);
  return `<article class="collection-case"><div class="collection-case-title"><span>${owned}/${c.items.length} FOUND</span><h2>${c.name}</h2></div><div class="collection-case-items">${c.items.map(id=>{const item=cbItem(id);const have=(state.inventory[id]||0)>0;return `<span class="${have?'found':''}" title="${item.name}">${icon(item.icon)}</span>`;}).join('')}</div><div class="collection-case-reward"><span>${formatMoney(c.reward.cash)} + ${c.reward.skill} skill point${c.reward.skill===1?'':'s'}</span><button data-action="collection" data-id="${c.id}" data-name="${c.name}" ${!complete||claimed?'disabled':''}>${claimed?'CLAIMED':'CLAIM SET'}</button></div></article>`;
}

renderProfile=function(){
  const valueFor=id=>id==='service'?state.service:id==='quality'?state.quality:id==='energy'?state.maxEnergy:id==='drive'?state.maxDrive:state.maxMorale;
  const extras=`<div class="scene-inline-facts">${cbxReadout('Skill points',state.skillPoints,'sparkles','xp')}${cbxReadout('Boss Points',state.bossPoints,'crown','xp')}</div>`;
  return `<div class="scene-screen profile-scene">
    ${cbxSceneIntro('profile',extras)}
    <section class="skill-stage"><div class="skill-core"><span>${shopAvatar('Felix')}</span><strong>LEVEL ${state.level}</strong><small>COFFEE BOSS</small></div><div class="skill-branches">${cbSkillData.map(([id,iconName,name,desc,inc,tone],index)=>`<article class="skill-branch ${tone}" style="--branch:${index}"><span class="skill-branch-icon">${icon(iconName)}</span><div><span>${name.toUpperCase()}</span><h2>${valueFor(id)}</h2><p>${desc}</p></div><button data-action="skill" data-stat="${id}" data-name="${name}" ${state.skillPoints<1?'disabled':''}>+${inc}</button></article>`).join('')}</div></section>
    <div class="chapter-break"><span>COLLECTION CABINET</span><p>Complete a shelf to claim its reward.</p></div>
    <section class="collection-cabinet">${collections.map(cbxCollection).join('')}</section>
    <section class="career-tape">${cbxReadout('Shifts worked',state.jobsCompleted,'clipboard-check')}${cbxReadout('Lifetime cash',formatMoney(state.lifetimeIncome),'banknote','cash')}${cbxReadout('Gear found',state.itemsFound,'package-open')}${cbxReadout('Achievements',state.achievements.length,'medal','xp')}</section>
  </div>`;
};

function cbxReportToken(iconName,label,value,tone=''){
  return `<span class="report-token ${tone}">${icon(iconName)}<span>${label}</span><strong>${value}</strong></span>`;
}

function cbxShowActionReport(report){
  if(!report) return false;
  if(report.brief){cbxOriginalToast(`${report.title}. ${report.copy}`,'good');return true;}
  document.querySelector('.action-report-layer')?.remove();
  const returnFocus=document.activeElement;
  const layer=document.createElement('dialog');
  layer.className=`action-report-layer ${report.tone||'good'} ${report.brief?'brief':''}`;
  layer.setAttribute('role','dialog');
  layer.setAttribute('aria-modal','true');
  layer.setAttribute('aria-label',report.title);
  layer.innerHTML=`<section class="action-report">
    <div class="report-icon">${icon(report.icon||'sparkles')}</div>
    <span class="report-kicker">${report.kicker||'SHOP UPDATE'}</span>
    <h2>${report.title}</h2>
    <p>${report.copy}</p>
    ${report.tokens?.length?`<div class="report-tokens">${report.tokens.join('')}</div>`:''}
    <button type="button" class="report-continue">${report.button||'KEEP GOING'}${icon('arrow-right')}</button>
  </section>`;
  document.body.appendChild(layer);
  lucide.createIcons();
  layer.showModal();
  let closing=false;
  const close=()=>{if(closing)return;closing=true;layer.classList.add('closing');setTimeout(()=>{layer.close();layer.remove();if(returnFocus?.isConnected)returnFocus.focus({preventScroll:true});},240);};
  layer.querySelector('.report-continue').onclick=close;
  layer.addEventListener('click',event=>{if(event.target===layer) close();});
  layer.addEventListener('cancel',event=>{event.preventDefault();close();});
  requestAnimationFrame(()=>{layer.classList.add('show');layer.querySelector('.report-continue').focus({preventScroll:true});});
  return true;
}

function cbxBuildActionReport(action,before,context={}){
  const cashDelta=state.cash-before.cash;
  const xpDelta=state.level===before.level?state.xp-before.xp:state.xp;
  const energyDelta=state.energy-before.energy;
  const moraleDelta=state.morale-before.morale;
  const common=[];
  if(cashDelta) common.push(cbxReportToken('banknote','Cash',`${cashDelta>0?'+':'-'}${formatMoney(Math.abs(cashDelta))}`,'cash'));
  if(xpDelta>0) common.push(cbxReportToken('sparkles','XP',`+${xpDelta}`,'xp'));
  if(energyDelta) common.push(cbxReportToken('zap','Energy',`${energyDelta>0?'+':''}${energyDelta}`,'energy'));
  if(moraleDelta) common.push(cbxReportToken('heart-pulse','Morale',`${moraleDelta>0?'+':''}${moraleDelta}`,'morale'));

  if(state.level>before.level){
    const district=districts.find(d=>d.level===state.level);
    return {tone:'level',icon:'sparkles',kicker:'LEVEL UP',title:`You reached Level ${state.level}`,copy:district?`${district.name} is open for business. You also picked up new skill points and a Boss Point.`:'The shop just got stronger. New skill points and a Boss Point are waiting for you.',tokens:[cbxReportToken('sparkles','Skill points','+3','xp'),cbxReportToken('crown','Boss Point','+1','xp')],button:'SEE WHAT IS NEXT'};
  }
  if(action==='location'&&(state.owned[context.id]||0)!==(before.owned[context.id]||0)){
    const loc=locations.find(l=>l.id===context.id);
    const first=(before.owned[context.id]||0)===0;
    return {tone:'cash',icon:loc.icon,kicker:first?'GRAND OPENING':'LOCATION UPGRADE',title:first?`${loc.name} is open`:`${loc.name} just got bigger`,copy:first?'Another spot is pouring coffee and earning cash every minute.':'The extra capacity is already earning in the background.',tokens:[cbxReportToken('trending-up','Income',`+${formatMoney(loc.income)}/min`,'cash'),cbxReportToken('store','Locations',state.locationsBought)],button:'OPEN THE DOORS'};
  }
  if(action==='rival'){
    const won=state.rivalsBeaten>before.rivalsBeaten;
    const name=context.name||'The rival shop';
    return {tone:won?'good':'bad',icon:won?'trophy':'shield-alert',kicker:won?'RIVAL BEATEN':'ROUGH ROUND',title:won?`${name} could not keep up`:`${name} got this one`,copy:won?'Your crew owned the rush and people noticed. Take the win.':'It stings, but the reserve stayed safe. Let the crew recover before you go again.',tokens:common,button:won?'TAKE THE WIN':'REGROUP'};
  }
  if(action==='recruit'&&state.crew.length>before.crewLength){
    const member=state.crew[state.crew.length-1];
    return {tone:'quality',icon:'user-plus',kicker:'NEW CREW MEMBER',title:`${member.name} joined the shop`,copy:`${member.name} is starting as ${member.role}. You now have ${state.crew.length} people and ${state.crew.length} working gear slots.`,tokens:[cbxReportToken('sparkles','Power',`+${member.power}`,'quality'),...common],button:'WELCOME ABOARD'};
  }
  if(action==='boss'){
    const boss=bosses.find(b=>b.id===context.id);
    const cleared=!before.defeatedBosses.includes(context.id)&&state.defeatedBosses.includes(context.id);
    const dealt=(state.bossDamage[context.id]||0)-(before.bossDamage[context.id]||0);
    return {tone:cleared?'level':'xp',icon:cleared?'trophy':boss.icon,kicker:cleared?'MAJOR CHALLENGE CLEARED':'PRESSURE APPLIED',title:cleared?`${boss.name} is beaten`:`You pushed ${boss.name} back`,copy:cleared?'That was the big one. The reward, the gear, and the bragging rights are yours.':`${Math.max(0,dealt)} pressure dealt. The progress stays put, so you can finish this over several runs.`,tokens:common,button:cleared?'CLAIM THE MOMENT':'KEEP BUILDING'};
  }
  if(action==='challenge'){
    const labels={latte:['palette','Latte art results are in'],speed:['timer','The speed round is over'],crate:['package-search','The crate is open']};
    const [iconName,title]=labels[context.type]||['trophy','Event complete'];
    const found=items.filter(item=>(state.inventory[item.id]||0)>(before.inventory[item.id]||0));
    const newest=context.type==='crate'?(found.length?`Inside: ${found.map(item=>item.name).join(', ')}. Your gear is already on the shelf.`:`Inside: ${formatMoney(Math.max(0,cashDelta))}. It is already in the till.`):context.type==='speed'?'The round is finished. Your XP and any restored Energy are shown below.':'The judges have finished scoring your pour. Your prize is shown below.';
    return {tone:'xp',icon:iconName,kicker:'EVENT COMPLETE',title,copy:newest,tokens:common,button:'BACK TO THE FLOOR'};
  }
  if(action==='collection'&&state.collectionsClaimed.length>before.collectionsClaimed.length){
    return {tone:'level',icon:'library-big',kicker:'SET COMPLETE',title:`${context.name} is complete`,copy:'Every piece is in the cabinet. The completion reward is yours.',tokens:common,button:'ADMIRE THE SHELF'};
  }
  if(action==='buy-item'&&cashDelta<0) return {brief:true,tone:'cash',icon:'package-check',kicker:'DELIVERY RECEIVED',title:`${context.name} is on the shelf`,copy:'The strongest available gear equips itself. No extra setup needed.',tokens:common,button:'GOT IT'};
  if(action==='sell-item'&&cashDelta>0) return {brief:true,tone:'cash',icon:'badge-dollar-sign',kicker:'SOLD',title:'Cleared some shelf space',copy:`${context.name} is out the door and the cash is in the till.`,tokens:common,button:'DONE'};
  if(action==='heal'&&moraleDelta>0) return {brief:true,tone:'morale',icon:'heart-pulse',kicker:'RESET COMPLETE',title:'Everyone can breathe again',copy:'The crew is rested and ready for another push.',tokens:common,button:'BACK TO WORK'};
  if(action==='boss-point'&&before.bossPoints>state.bossPoints) return {brief:true,tone:'xp',icon:'crown',kicker:'BOSS POINT SPENT',title:'That is your second wind',copy:'The boost is active right away.',tokens:common,button:'USE IT WELL'};
  if(action==='skill'&&before.skillPoints>state.skillPoints) return {brief:true,tone:'xp',icon:'sparkles',kicker:'SKILL IMPROVED',title:`${context.name} went up`,copy:'That upgrade is already working across the shop.',tokens:[],button:'KEEP BUILDING'};
  if(action==='transfer'&&cashDelta!==0){
    const deposit=context.direction==='deposit';
    return {brief:true,tone:'cash',icon:deposit?'shield-check':'wallet-cards',kicker:'TRANSFER COMPLETE',title:deposit?'Cash tucked away':'Cash back in the till',copy:deposit?'That money is now protected from rival losses.':'That money is ready to spend again.',tokens:common,button:'DONE'};
  }
  return null;
}

const cbxOriginalToast=toast;
toast=function(message,type=''){
  if(window.cbxActionInFlight&&type!=='bad') return;
  cbxOriginalToast(message,type);
};
