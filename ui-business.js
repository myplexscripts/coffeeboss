'use strict';

function renderRivals(){
  const rivals=rivalList();
  return `${pageHead('Competition', 'Rivals', 'Head-to-head rushes cost Drive. Winning pays cash and XP. Losing can cost loose cash from your till, but money in Reserve is protected.')}
    <div class="grid-2">${rivals.map((r,i)=>{
      const compare=(totalService()+totalQuality())-(r.service+r.quality);
      const label=compare>25?'Favourable':compare>-10?'Close':'Tough';
      return `<article class="card card-pad"><div style="display:flex;justify-content:space-between;gap:12px"><div><span class="pill ${label==='Favourable'?'green':label==='Tough'?'red':'accent'}">${label}</span><h2 style="margin-top:9px">${r.name}</h2><p class="muted">Level ${r.level} · ${r.crew} crew</p></div><div class="icon-chip">${icon('store')}</div></div><div class="grid-2" style="margin-top:16px"><div class="metric-tile"><small>Service</small><strong>${r.service}</strong></div><div class="metric-tile"><small>Quality</small><strong>${r.quality}</strong></div></div><button class="btn primary" style="width:100%;margin-top:13px" data-action="rival" data-index="${i}" ${state.drive<1||state.morale<8?'disabled':''}>${icon('swords')} Challenge · 1 Drive</button></article>`;
    }).join('')}</div>
    <section class="section"><div class="grid-3"><div class="card resource-card"><div class="resource-top"><div><div class="resource-label">Your service</div><div class="resource-value">${totalService()}</div></div><div class="resource-icon">${icon('gauge')}</div></div><div class="resource-foot">Attack power comes from your Boss stat, crew, and best gear.</div></div><div class="card resource-card"><div class="resource-top"><div><div class="resource-label">Your quality</div><div class="resource-value">${totalQuality()}</div></div><div class="resource-icon">${icon('badge-check')}</div></div><div class="resource-foot">Quality helps you hold up when rivals push back.</div></div><div class="card resource-card"><div class="resource-top"><div><div class="resource-label">Record</div><div class="resource-value">${state.rivalsBeaten}-${state.rivalLosses}</div></div><div class="resource-icon">${icon('trophy')}</div></div><div class="resource-foot">Your competition history follows the whole save.</div></div></div></section>`;
}
function renderLocations(){
  return `${pageHead('City', 'Locations', 'Locations produce recurring cash automatically. Each copy gets more expensive, which rewards spreading out instead of buying only one thing.')}
    <div class="grid-3">${locations.map(l=>{
      const unlocked=state.level>=l.level; const cost=locationCost(l); const count=state.owned[l.id]||0;
      return `<article class="card location-card ${unlocked?'':'locked'}"><div class="big-icon">${icon(l.icon)}</div><span class="pill ${unlocked?'accent':''}">${unlocked?districts.find(d=>d.id===l.district).name:`Level ${l.level}`}</span><h3 style="margin-top:10px">${l.name}</h3><p class="muted">${l.description}</p><div class="income">+${formatMoney(l.income)} / min</div><div class="owned">Owned: ${count} · Next: ${formatMoney(cost)}</div><button class="btn ${unlocked?'primary':'soft'}" data-action="location" data-id="${l.id}" ${!unlocked||state.cash<cost?'disabled':''}>${unlocked?`${icon('plus')} Buy location`:'Locked'}</button></article>`;
    }).join('')}</div>`;
}
function renderStockroom(){
  const ownedItems=items.filter(i=>(state.inventory[i.id]||0)>0);
  const allHtml=items.map(i=>inventoryCard(i,true)).join('');
  const ownedHtml=ownedItems.length?ownedItems.map(i=>inventoryCard(i,false)).join(''):`<div class="card empty-state"><div class="icon-chip">${icon('package-open')}</div><h3>Your shelves are empty</h3><p>Shift loot and purchases will show up here.</p></div>`;
  const tab=currentTab==='shop'?'shop':'owned'; currentTab=tab;
  return `${pageHead('Loadout', 'Stockroom', `Your best items are automatically used by you and your crew. Each crew member can make another strong item count.`)}
    <div class="tabs"><button class="tab ${tab==='owned'?'active':''}" data-action="tab" data-tab="owned">Owned</button><button class="tab ${tab==='shop'?'active':''}" data-action="tab" data-tab="shop">Supply shop</button><button class="tab" data-action="nav" data-page="profile">Collections</button></div>
    <div class="grid-3">${tab==='shop'?allHtml:ownedHtml}</div>`;
}
function inventoryCard(i,shop){
  const count=state.inventory[i.id]||0;
  return `<article class="card inventory-card"><div class="item-icon">${icon(i.icon)}</div><div><div style="display:flex;justify-content:space-between;gap:8px;align-items:start"><div><h3>${i.name}</h3><span class="pill ${i.rarity==='Legendary'?'purple':i.rarity==='Epic'?'blue':i.rarity==='Rare'?'accent':''}">${i.rarity}</span></div>${count?`<span class="pill">×${count}</span>`:''}</div><div class="item-stats"><span>+${i.service} Service</span><span>+${i.quality} Quality</span></div></div><div class="item-foot"><small>${shop?formatMoney(i.cost):`Resale ${formatMoney(Math.floor(i.cost*.45))}`}</small>${shop?`<button class="btn soft" data-action="buy-item" data-id="${i.id}" ${state.cash<i.cost?'disabled':''}>Buy</button>`:`<button class="btn soft" data-action="sell-item" data-id="${i.id}">Sell one</button>`}</div></article>`;
}
function renderCrew(){
  const cost=Math.floor(300*Math.pow(1.55,state.crew.length-1));
  return `${pageHead('Your team', 'Crew', 'Every crew member adds their own power and lets another strong inventory item contribute to your overall loadout.', `<button class="btn primary" data-action="recruit" ${state.cash<cost?'disabled':''}>${icon('user-plus')} Recruit · ${formatMoney(cost)}</button>`)}
    <div class="grid-2">${state.crew.map((c,i)=>`<article class="card crew-card"><div class="avatar">${c.name.slice(0,1)}</div><div class="crew-copy"><h3>${c.name}</h3><p>${c.role} · +${c.power} crew power</p></div><span class="pill ${i===0?'accent':''}">${i===0?'Original crew':'Crew #'+(i+1)}</span></article>`).join('')}</div>
    <section class="section"><div class="card card-pad"><h3>How crew power works</h3><p class="muted">Your crew makes rival challenges easier, but its bigger value is equipment capacity. A larger crew can bring more of your stockroom into competition automatically.</p></div></section>`;
}
function renderChallenges(){
  const activeBosses=bosses.filter(b=>state.level>=b.level);
  return `${pageHead('Milestones', 'Challenges', `Use special challenge tokens for side activities, then spend Drive on major milestone challenges. Tokens regenerate once per hour.`)}
    <div class="grid-3">
      ${challengeCard('latte','palette','Latte Art Throwdown','A quick side challenge for extra cash and XP.')}
      ${challengeCard('speed','timer','Speed Service Round','Trade a token for XP and a burst of energy.')}
      ${challengeCard('crate','package-search','Mystery Supply Crate','Take a chance on cash or a useful equipment drop.')}
    </div>
    <section class="section"><div class="section-heading"><div><h2>Major challenges</h2><p>These are Coffee Boss's version of boss fights. Damage persists until you beat them.</p></div></div><div class="grid-2">${activeBosses.map(b=>bossPreview(b)).join('')||`<div class="card empty-state"><div class="icon-chip">${icon('lock')}</div><h3>Reach level 4</h3><p>Your first major challenge will appear then.</p></div>`}</div></section>`;
}
function challengeCard(type,ico,title,desc){ return `<article class="card quick-card"><div class="icon-chip">${icon(ico)}</div><h3>${title}</h3><p>${desc}</p><button class="btn soft" data-action="challenge" data-type="${type}" ${state.challengeTokens<1?'disabled':''}>Play · 1 token</button></article>`; }
function bossPreview(b){
  const unlocked=state.level>=b.level; const defeated=state.defeatedBosses.includes(b.id); const damage=clamp(state.bossDamage[b.id]||0,0,b.hp); const remain=Math.max(0,b.hp-damage);
  return `<article class="card boss-card"><div class="boss-banner"><div class="icon-chip">${icon(b.icon)}</div><span class="pill ${defeated?'green':unlocked?'accent':''}">${defeated?'Completed':unlocked?'Available':`Unlocks level ${b.level}`}</span><h2 style="margin:8px 0 0">${b.name}</h2></div><div class="boss-body"><p class="muted">${b.description}</p><div class="boss-health"><strong>${defeated?'Complete':`${remain.toLocaleString()} pressure left`}</strong><span class="pill">${formatMoney(b.reward)}</span></div><div class="progress ${defeated?'green':'red'}"><span style="width:${defeated?100:damage/b.hp*100}%"></span></div>${unlocked&&!defeated?`<div class="boss-actions"><button class="btn soft" data-action="boss" data-id="${b.id}" data-power="0" ${state.drive<1||state.morale<10?'disabled':''}>Push · 1 Drive</button><button class="btn primary" data-action="boss" data-id="${b.id}" data-power="1" ${state.drive<3||state.morale<10?'disabled':''}>Power push · 3</button></div>`:''}</div></article>`;
}
function renderReserve(){
  return `${pageHead('Money', 'Reserve', 'Cash in your Reserve cannot be lost when a rival beats you. Move money back out whenever you want.')}
    <div class="money-box"><article class="card money-panel"><span class="pill">Till</span><strong class="big">${formatMoney(state.cash)}</strong><div class="input-row"><input id="depositAmount" type="number" min="0" step="100" placeholder="Amount" value="${Math.floor(state.cash)}"><button class="btn primary" data-action="transfer" data-direction="deposit">Deposit</button></div></article><article class="card money-panel"><span class="pill accent">Protected reserve</span><strong class="big">${formatMoney(state.reserve)}</strong><div class="input-row"><input id="withdrawAmount" type="number" min="0" step="100" placeholder="Amount" value="${Math.floor(state.reserve)}"><button class="btn soft" data-action="transfer" data-direction="withdraw">Withdraw</button></div></article></div>
    <section class="section"><div class="card card-pad"><h3>Why keep a reserve?</h3><p class="muted">Rival losses only touch loose cash. Your locations and stockroom are not taken, and Reserve stays protected.</p></div></section>`;
}
function renderBreakroom(){
  const missing=state.maxMorale-state.morale; const cost=Math.max(25,Math.floor(missing*2.2));
  return `${pageHead('Recovery', 'Break Room', 'Morale is your shop’s health. Rival and major challenges wear it down. It also regenerates on its own.')}
    <section class="card hero-card"><div class="hero-grid"><div><span class="pill accent">Crew morale</span><h2 class="hero-title">${state.morale} / ${state.maxMorale}</h2><p class="hero-copy">Low morale limits how long you can keep pushing against rivals and major challenges.</p><button class="btn primary" data-action="heal" ${missing<=0||state.cash<cost?'disabled':''}>${icon('heart-pulse')} Restore morale · ${formatMoney(cost)}</button></div><div><div class="progress green" style="height:14px"><span style="width:${state.morale/state.maxMorale*100}%"></span></div></div></div></section>
    <section class="section"><div class="section-heading"><div><h2>Boss Points</h2><p>Earned from levels, achievements, and major challenges. There are no purchases in this prototype.</p></div><span class="pill accent">${state.bossPoints} available</span></div><div class="grid-4"><button class="btn soft" data-action="boss-point" data-type="energy" ${state.bossPoints<1?'disabled':''}>${icon('zap')} Fill energy</button><button class="btn soft" data-action="boss-point" data-type="drive" ${state.bossPoints<1?'disabled':''}>${icon('flame')} Fill drive</button><button class="btn soft" data-action="boss-point" data-type="morale" ${state.bossPoints<1?'disabled':''}>${icon('heart-pulse')} Fill morale</button><button class="btn soft" data-action="boss-point" data-type="cash" ${state.bossPoints<1?'disabled':''}>${icon('banknote')} Get cash</button></div></section>`;
}
function renderProfile(){
  const skills=[['service','gauge','Service','Improves your offensive power in rival and major challenges.',state.service,'+1'],['quality','badge-check','Quality','Improves defensive power when another café pushes back.',state.quality,'+1'],['energy','zap','Max Energy','Lets you complete more shifts in one run.',state.maxEnergy,'+1'],['drive','flame','Max Drive','Lets you challenge more rivals before waiting for recovery.',state.maxDrive,'+1'],['morale','heart-pulse','Max Morale','Lets your crew handle more challenge pressure.',state.maxMorale,'+10']];
  return `${pageHead('Your build', 'Boss', 'Level-ups award 3 skill points. Choose whether you want to grind shifts, compete, or build a balanced shop.', `<span class="pill accent">${state.skillPoints} skill points</span>`)}
    <div class="grid-2">${skills.map(([id,ico,name,desc,val,inc])=>`<article class="card skill-card"><div class="icon-chip">${icon(ico)}</div><div><h3>${name}</h3><p class="muted">${desc}</p></div><div><div class="skill-value">${val}</div><button class="btn soft" data-action="skill" data-stat="${id}" ${state.skillPoints<1?'disabled':''}>${inc}</button></div></article>`).join('')}</div>
    <section class="section"><div class="section-heading"><div><h2>Collections</h2><p>Keep at least one of every item in a set to claim its permanent reward.</p></div></div>${collections.map(collectionHtml).join('')}</section>
    <section class="section"><div class="section-heading"><div><h2>Career stats</h2></div></div><div class="grid-4"><div class="card resource-card"><div class="resource-label">Shifts</div><div class="resource-value">${state.jobsCompleted}</div></div><div class="card resource-card"><div class="resource-label">Lifetime income</div><div class="resource-value">${formatMoney(state.lifetimeIncome)}</div></div><div class="card resource-card"><div class="resource-label">Loot found</div><div class="resource-value">${state.itemsFound}</div></div><div class="card resource-card"><div class="resource-label">Achievements</div><div class="resource-value">${state.achievements.length}</div></div></div></section>`;
}
function collectionHtml(c){
  const complete=c.items.every(id=>(state.inventory[id]||0)>0); const claimed=state.collectionsClaimed.includes(c.id);
  return `<div class="card card-pad" style="margin-bottom:12px"><div style="display:flex;justify-content:space-between;gap:14px;align-items:start"><div><h3>${c.name}</h3><p class="muted">Reward: ${formatMoney(c.reward.cash)} + ${c.reward.skill} skill point${c.reward.skill>1?'s':''}</p></div><button class="btn ${claimed?'green':'primary'}" data-action="collection" data-id="${c.id}" ${!complete||claimed?'disabled':''}>${claimed?'Claimed':'Claim reward'}</button></div><div class="collection-grid" style="margin-top:13px">${c.items.map(id=>{const i=items.find(x=>x.id===id);const found=(state.inventory[id]||0)>0;return `<div class="collectible ${found?'found':''}">${icon(i.icon)}<span>${i.name}</span></div>`}).join('')}</div></div>`;
}
function feedHtml(){
  return `<div class="card activity-feed">${state.feed.slice(0,8).map(f=>`<div class="feed-row"><div class="feed-icon">${icon(f.icon)}</div><p>${f.text}</p><time>${relativeTime(f.time)}</time></div>`).join('')}</div>`;
}
