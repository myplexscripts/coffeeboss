'use strict';

/* Coffee Boss game UI layer. Loaded after the base renderers so it can replace
   website-like screen composition without touching the game engine. */

const cbResourceChip = (type, iconName, label, value='') => `
  <span class="resource-chip ${type}">${icon(iconName)}<span>${label}</span>${value !== '' ? `<strong>${value}</strong>` : ''}</span>`;

const cbPanelLabel = (iconName, label, extra='') => `
  <div class="panel-label">${icon(iconName)}<span>${label}</span>${extra}</div>`;

const cbActivityFeed = (limit=6) => {
  const rows = (state.feed || []).slice(0, limit);
  if(!rows.length) return `<div class="game-empty">No activity yet.</div>`;
  return `<div class="activity-list">${rows.map(entry => `
    <div class="activity-row">
      <span class="activity-icon">${icon(entry.icon || 'circle')}</span>
      <span class="activity-text">${entry.text}</span>
      <span class="activity-time">${relativeTime(entry.time)}</span>
    </div>`).join('')}</div>`;
};

const cbDifficultyClass = label => label === 'Favourable' ? 'good' : label === 'Tough' ? 'danger' : 'warn';
const cbRarityClass = rarity => ({Common:'common',Uncommon:'uncommon',Rare:'rare',Epic:'epic',Legendary:'legendary'}[rarity] || 'common');
const cbDistrict = id => districts.find(d => d.id === id);
const cbItem = id => items.find(i => i.id === id);

pageHead = function(){ return ''; };

renderStats = function(){
  const xpMax = xpNeeded(state.level);
  document.getElementById('cashStat').textContent = formatMoney(state.cash);
  document.getElementById('moraleStat').textContent = `${state.morale}/${state.maxMorale}`;
  document.getElementById('energyStat').textContent = `${state.energy}/${state.maxEnergy}`;
  document.getElementById('driveStat').textContent = `${state.drive}/${state.maxDrive}`;
  document.getElementById('levelStat').textContent = state.level;
  document.getElementById('xpStat').textContent = `${state.xp.toLocaleString()} / ${xpMax.toLocaleString()}`;
  document.getElementById('xpBar').style.width = `${clamp(state.xp / xpMax * 100, 0, 100)}%`;
  const moraleBar = document.getElementById('moraleBar');
  const energyBar = document.getElementById('energyBar');
  const driveBar = document.getElementById('driveBar');
  if(moraleBar) moraleBar.style.width = `${clamp(state.morale / state.maxMorale * 100, 0, 100)}%`;
  if(energyBar) energyBar.style.width = `${clamp(state.energy / state.maxEnergy * 100, 0, 100)}%`;
  if(driveBar) driveBar.style.width = `${clamp(state.drive / state.maxDrive * 100, 0, 100)}%`;
  const districtLabel = document.getElementById('districtLabel');
  if(districtLabel) districtLabel.textContent = cbDistrict(state.district)?.name || 'Old Market';
  const skill = document.getElementById('skillBadge');
  if(skill){ skill.textContent = state.skillPoints; skill.classList.toggle('show', state.skillPoints > 0); }
  const cb = document.getElementById('challengeBadge');
  if(cb){ cb.textContent = state.challengeTokens; cb.classList.toggle('show', state.challengeTokens > 0); }
};

renderHome = function(){
  const district = cbDistrict(state.district);
  const income = totalIncomePerTick();
  const nextBoss = bosses.find(b => state.level >= b.level && !state.defeatedBosses.includes(b.id)) || bosses.find(b => state.level < b.level);
  const nextDistrict = districts.find(d => d.level > state.level);
  const nextUnlockText = nextDistrict ? `${nextDistrict.name} at Level ${nextDistrict.level}` : 'All districts unlocked';
  const nextBossStatus = nextBoss ? (state.level >= nextBoss.level ? 'Ready now' : `Level ${nextBoss.level}`) : 'Complete';

  return `
    <div class="game-screen home-screen">
      <div class="home-layout">
        <section class="game-panel shop-panel">
          <div class="shop-strip">
            <div class="shop-mark">${icon(district.icon)}</div>
            <div class="shop-copy">
              <strong>${district.name}</strong>
              <span>Level ${state.level} shop</span>
            </div>
            <div class="shop-income">
              <span>Income</span>
              <strong>+${formatMoney(income)}/min</strong>
            </div>
          </div>

          <div class="shop-stat-grid">
            <div class="shop-stat"><span>Service</span><strong>${totalService()}</strong>${icon('gauge')}</div>
            <div class="shop-stat"><span>Quality</span><strong>${totalQuality()}</strong>${icon('badge-check')}</div>
            <div class="shop-stat"><span>Crew</span><strong>${state.crew.length}</strong>${icon('users')}</div>
            <div class="shop-stat"><span>Reserve</span><strong>${formatMoney(state.reserve)}</strong>${icon('landmark')}</div>
          </div>

          <div class="command-grid">
            <button class="command-tile command-primary" data-action="nav" data-page="shifts">
              <span class="command-icon energy">${icon('zap')}</span>
              <span class="command-copy"><strong>WORK SHIFTS</strong><small>Earn Cash + XP</small></span>
              ${icon('chevron-right')}
            </button>
            <button class="command-tile" data-action="nav" data-page="rivals">
              <span class="command-icon drive">${icon('swords')}</span>
              <span class="command-copy"><strong>CHALLENGE RIVALS</strong><small>Spend Drive</small></span>
              ${icon('chevron-right')}
            </button>
            <button class="command-tile" data-action="nav" data-page="locations">
              <span class="command-icon cash">${icon('store')}</span>
              <span class="command-copy"><strong>OPEN LOCATIONS</strong><small>Build passive income</small></span>
              ${icon('chevron-right')}
            </button>
            <button class="command-tile" data-action="nav" data-page="stockroom">
              <span class="command-icon xp">${icon('package-open')}</span>
              <span class="command-copy"><strong>STOCKROOM</strong><small>Gear + collections</small></span>
              ${icon('chevron-right')}
            </button>
          </div>
        </section>

        <aside class="home-side">
          ${nextBoss ? `
          <section class="game-panel compact-panel milestone-panel">
            ${cbPanelLabel('trophy','Next major challenge',`<span class="status-tag ${state.level >= nextBoss.level ? 'good' : 'neutral'}">${nextBossStatus}</span>`)}
            <div class="milestone-title">${nextBoss.name}</div>
            <div class="milestone-meta">
              ${cbResourceChip('cash','banknote','Reward',formatMoney(nextBoss.reward))}
              ${cbResourceChip('xp','sparkles','XP',nextBoss.xp)}
            </div>
            <button class="panel-action" data-action="nav" data-page="challenges">VIEW CHALLENGE ${icon('chevron-right')}</button>
          </section>` : ''}

          <section class="game-panel compact-panel unlock-panel">
            ${cbPanelLabel('map','Next district')}
            <div class="unlock-value">${nextUnlockText}</div>
            ${nextDistrict ? `<div class="unlock-progress"><span style="width:${clamp(state.level / nextDistrict.level * 100,0,100)}%"></span></div>` : ''}
          </section>
        </aside>
      </div>

      <section class="game-panel activity-panel">
        ${cbPanelLabel('history','Recent activity')}
        ${cbActivityFeed(6)}
      </section>
    </div>`;
};

renderShifts = function(){
  const unlockedDistricts = districts.filter(d => state.level >= d.level);
  if(!currentTab || !unlockedDistricts.some(d => d.id === currentTab)) currentTab = state.district;
  const district = cbDistrict(currentTab) || unlockedDistricts[0];
  const districtShifts = shifts.filter(s => s.district === district.id);

  return `
    <div class="game-screen shifts-screen">
      <div class="screen-control-row">
        <div class="district-tabs">${unlockedDistricts.map(d => `
          <button class="district-tab ${d.id === district.id ? 'active' : ''}" data-action="tab" data-tab="${d.id}">${icon(d.icon)}<span>${d.name}</span></button>`).join('')}
        </div>
        <div class="regen-note">${icon('timer')} +1 Energy / min</div>
      </div>

      <div class="job-stack">${districtShifts.map(s => {
        const unlocked = state.level >= s.level;
        const mastery = state.shiftMastery[s.id] || 0;
        const masteryTier = Math.min(3, Math.floor(mastery / 100));
        const masteryPct = mastery % 100;
        const affordable = state.energy >= s.energy;
        const buttonLabel = !unlocked ? `LEVEL ${s.level}` : !affordable ? 'NEED ENERGY' : 'WORK SHIFT';
        return `
          <article class="job-card ${!unlocked ? 'locked' : ''}">
            <div class="job-icon">${icon(s.icon)}</div>
            <div class="job-main">
              <div class="job-title-row">
                <strong>${s.name}</strong>
                ${masteryTier ? `<span class="mastery-badge">Mastery ${['I','II','III'][masteryTier-1]}</span>` : ''}
              </div>
              <span class="job-desc">${s.description}</span>
              <div class="job-resources">
                ${cbResourceChip('energy','zap','Cost',s.energy)}
                ${cbResourceChip('cash','banknote','Cash',`${formatMoney(s.cash[0])} to ${formatMoney(s.cash[1])}`)}
                ${cbResourceChip('xp','sparkles','XP',s.xp)}
              </div>
              ${unlocked ? `<div class="mastery-track" aria-label="Shift mastery"><span style="width:${masteryPct}%"></span></div>` : ''}
            </div>
            <button class="game-action work-action" data-action="shift" data-id="${s.id}" ${!unlocked || !affordable ? 'disabled' : ''}>${buttonLabel}</button>
          </article>`;
      }).join('')}</div>
    </div>`;
};

renderRivals = function(){
  const rivals = rivalList();
  return `
    <div class="game-screen rivals-screen">
      <div class="screen-control-row">
        <div class="inline-stat-group">
          ${cbResourceChip('service','gauge','Service',totalService())}
          ${cbResourceChip('quality','badge-check','Quality',totalQuality())}
          ${cbResourceChip('drive','flame','Drive',`${state.drive}/${state.maxDrive}`)}
        </div>
        <div class="record-chip">${icon('trophy')} ${state.rivalsBeaten}W / ${state.rivalLosses}L</div>
      </div>
      <div class="rival-grid">${rivals.map((r,i) => {
        const compare = (totalService()+totalQuality())-(r.service+r.quality);
        const label = compare > 25 ? 'Favourable' : compare > -10 ? 'Close' : 'Tough';
        return `
          <article class="rival-card">
            <div class="rival-top">
              <span class="rival-mark">${icon('store')}</span>
              <div><strong>${r.name}</strong><span>Level ${r.level} · ${r.crew} crew</span></div>
              <span class="status-tag ${cbDifficultyClass(label)}">${label}</span>
            </div>
            <div class="rival-stats">
              <div><span>Service</span><strong>${r.service}</strong></div>
              <div><span>Quality</span><strong>${r.quality}</strong></div>
              <div><span>Reward</span><strong>${formatMoney(r.cash)}</strong></div>
            </div>
            <button class="game-action challenge-action" data-action="rival" data-index="${i}" ${state.drive < 1 || state.morale < 8 ? 'disabled' : ''}>${icon('swords')} CHALLENGE <span>1 Drive</span></button>
          </article>`;
      }).join('')}</div>
    </div>`;
};

renderLocations = function(){
  return `
    <div class="game-screen locations-screen">
      <div class="screen-control-row">
        <div class="inline-stat-group">
          ${cbResourceChip('cash','banknote','Cash',formatMoney(state.cash))}
          ${cbResourceChip('cash','trending-up','Income',`+${formatMoney(totalIncomePerTick())}/min`)}
        </div>
        <div class="record-chip">${icon('store')} ${state.locationsBought} opened</div>
      </div>
      <div class="location-grid">${locations.map(l => {
        const unlocked = state.level >= l.level;
        const count = state.owned[l.id] || 0;
        const cost = locationCost(l);
        const afford = state.cash >= cost;
        const action = count > 0 ? 'EXPAND' : 'OPEN';
        return `
          <article class="location-tile ${!unlocked ? 'locked' : ''}">
            <div class="location-top">
              <span class="location-icon">${icon(l.icon)}</span>
              <span class="location-district">${unlocked ? cbDistrict(l.district).name : `Level ${l.level}`}</span>
            </div>
            <strong class="location-name">${l.name}</strong>
            <span class="location-desc">${l.description}</span>
            <div class="location-numbers">
              <div class="income-number"><span>Income</span><strong>+${formatMoney(l.income)}/min</strong></div>
              <div><span>Owned</span><strong>${count}</strong></div>
            </div>
            <button class="game-action location-action" data-action="location" data-id="${l.id}" ${!unlocked || !afford ? 'disabled' : ''}>
              <span>${unlocked ? action : `LEVEL ${l.level}`}</span>${unlocked ? `<strong>${formatMoney(cost)}</strong>` : ''}
            </button>
          </article>`;
      }).join('')}</div>
    </div>`;
};

inventoryCard = function(i, shop){
  const count = state.inventory[i.id] || 0;
  return `
    <article class="item-tile rarity-${cbRarityClass(i.rarity)}">
      <div class="item-head">
        <span class="item-icon">${icon(i.icon)}</span>
        <div class="item-name"><strong>${i.name}</strong><span>${i.rarity}</span></div>
        ${count ? `<span class="item-count">×${count}</span>` : ''}
      </div>
      <div class="item-power">
        ${cbResourceChip('service','gauge','Service',`+${i.service}`)}
        ${cbResourceChip('quality','badge-check','Quality',`+${i.quality}`)}
      </div>
      <button class="game-action item-action" data-action="${shop ? 'buy-item' : 'sell-item'}" data-id="${i.id}" ${shop && state.cash < i.cost ? 'disabled' : ''}>
        <span>${shop ? 'BUY' : 'SELL ONE'}</span><strong>${formatMoney(shop ? i.cost : Math.floor(i.cost*.45))}</strong>
      </button>
    </article>`;
};

renderStockroom = function(){
  const ownedItems = items.filter(i => (state.inventory[i.id] || 0) > 0);
  const tab = currentTab === 'shop' ? 'shop' : 'owned';
  currentTab = tab;
  return `
    <div class="game-screen stockroom-screen">
      <div class="screen-control-row">
        <div class="game-tabs">
          <button class="game-tab ${tab === 'owned' ? 'active' : ''}" data-action="tab" data-tab="owned">${icon('package-open')} INVENTORY</button>
          <button class="game-tab ${tab === 'shop' ? 'active' : ''}" data-action="tab" data-tab="shop">${icon('shopping-bag')} SUPPLY SHOP</button>
        </div>
        <div class="record-chip">${icon('users')} ${state.crew.length} gear slots</div>
      </div>
      <div class="item-grid">${tab === 'shop' ? items.map(i => inventoryCard(i,true)).join('') : (ownedItems.length ? ownedItems.map(i => inventoryCard(i,false)).join('') : `<div class="game-empty">No gear yet. Work shifts or visit the Supply Shop.</div>`)}</div>
    </div>`;
};

renderCrew = function(){
  const cost = Math.floor(300 * Math.pow(1.55, state.crew.length - 1));
  return `
    <div class="game-screen crew-screen">
      <div class="crew-recruit-bar">
        <div class="crew-summary">
          <span class="crew-summary-icon">${icon('users')}</span>
          <div><strong>${state.crew.length} crew</strong><span>${crewPower()} total crew power · ${state.crew.length} gear slots</span></div>
        </div>
        <button class="game-action recruit-action" data-action="recruit" ${state.cash < cost ? 'disabled' : ''}>${icon('user-plus')} RECRUIT <strong>${formatMoney(cost)}</strong></button>
      </div>
      <div class="crew-list">${state.crew.map((c,i) => `
        <article class="crew-row">
          <span class="crew-avatar">${c.name.slice(0,1)}</span>
          <div class="crew-name"><strong>${c.name}</strong><span>${c.role}</span></div>
          <div class="crew-power"><span>Power</span><strong>+${c.power}</strong></div>
          ${i === 0 ? `<span class="status-tag neutral">Original crew</span>` : `<span class="crew-number">#${i+1}</span>`}
        </article>`).join('')}</div>
    </div>`;
};

challengeCard = function(type, ico, title, desc){
  const disabled = state.challengeTokens < 1;
  return `
    <article class="challenge-tile">
      <span class="challenge-icon">${icon(ico)}</span>
      <div class="challenge-copy"><strong>${title}</strong><span>${desc}</span></div>
      <button class="game-action token-action" data-action="challenge" data-type="${type}" ${disabled ? 'disabled' : ''}>PLAY <span>1 token</span></button>
    </article>`;
};

bossPreview = function(b){
  const unlocked = state.level >= b.level;
  const defeated = state.defeatedBosses.includes(b.id);
  const damage = clamp(state.bossDamage[b.id] || 0, 0, b.hp);
  const remain = Math.max(0, b.hp - damage);
  const pct = defeated ? 100 : clamp(damage / b.hp * 100,0,100);
  return `
    <article class="boss-tile ${defeated ? 'defeated' : ''}">
      <div class="boss-head">
        <span class="boss-icon">${icon(b.icon)}</span>
        <div class="boss-name"><strong>${b.name}</strong><span>${b.description}</span></div>
        <span class="status-tag ${defeated ? 'good' : unlocked ? 'warn' : 'neutral'}">${defeated ? 'Complete' : unlocked ? 'Ready' : `Level ${b.level}`}</span>
      </div>
      <div class="boss-reward-row">
        ${cbResourceChip('cash','banknote','Reward',formatMoney(b.reward))}
        ${cbResourceChip('xp','sparkles','XP',b.xp)}
      </div>
      <div class="boss-pressure"><div><span>Pressure</span><strong>${defeated ? 'Cleared' : `${remain} left`}</strong></div><div class="boss-track"><span style="width:${pct}%"></span></div></div>
      ${unlocked && !defeated ? `<div class="boss-buttons"><button class="game-action boss-light" data-action="boss" data-id="${b.id}" data-power="0" ${state.drive < 1 || state.morale < 10 ? 'disabled' : ''}>PUSH <span>1 Drive</span></button><button class="game-action boss-heavy" data-action="boss" data-id="${b.id}" data-power="1" ${state.drive < 3 || state.morale < 10 ? 'disabled' : ''}>POWER PUSH <span>3 Drive</span></button></div>` : ''}
    </article>`;
};

renderChallenges = function(){
  const activeBosses = bosses.filter(b => state.level >= b.level || state.defeatedBosses.includes(b.id));
  return `
    <div class="game-screen challenges-screen">
      <div class="screen-control-row">
        <div class="token-meter">${icon('ticket')} <strong>${state.challengeTokens}/${state.maxChallengeTokens}</strong><span>Challenge tokens</span></div>
        <div class="regen-note">${icon('timer')} +1 token / hour</div>
      </div>
      <div class="challenge-grid">
        ${challengeCard('latte','palette','Latte Art Throwdown','Quick cash + XP.')}
        ${challengeCard('speed','timer','Speed Service Round','XP + an Energy burst.')}
        ${challengeCard('crate','package-search','Mystery Supply Crate','Cash or a gear drop.')}
      </div>
      <div class="section-divider"><span>MAJOR CHALLENGES</span></div>
      <div class="boss-stack">${activeBosses.length ? activeBosses.map(bossPreview).join('') : `<div class="game-empty">Your first major challenge unlocks at Level 4.</div>`}</div>
    </div>`;
};

renderReserve = function(){
  return `
    <div class="game-screen reserve-screen">
      <div class="money-grid">
        <section class="money-panel till-panel">
          <div class="money-icon cash">${icon('wallet-cards')}</div>
          <span>Cash on hand</span>
          <strong>${formatMoney(state.cash)}</strong>
          <div class="money-input"><input id="depositAmount" type="number" min="0" step="100" value="${Math.floor(state.cash)}"><button class="game-action" data-action="transfer" data-direction="deposit">DEPOSIT</button></div>
        </section>
        <section class="money-panel reserve-panel">
          <div class="money-icon xp">${icon('landmark')}</div>
          <span>Protected reserve</span>
          <strong>${formatMoney(state.reserve)}</strong>
          <div class="money-input"><input id="withdrawAmount" type="number" min="0" step="100" value="${Math.floor(state.reserve)}"><button class="game-action" data-action="transfer" data-direction="withdraw">WITHDRAW</button></div>
        </section>
      </div>
      <div class="info-strip">${icon('shield-check')} Rival losses only affect Cash on hand. Reserve stays protected.</div>
    </div>`;
};

renderBreakroom = function(){
  const missing = state.maxMorale - state.morale;
  const cost = Math.max(25, Math.floor(missing * 2.2));
  return `
    <div class="game-screen breakroom-screen">
      <section class="morale-board">
        <div class="morale-ring" style="--morale-pct:${state.morale/state.maxMorale*100}"><div>${icon('heart-pulse')}<strong>${state.morale}</strong><span>/ ${state.maxMorale}</span></div></div>
        <div class="morale-copy"><strong>Crew morale</strong><span>Rival and major challenges wear the crew down. Morale also recovers automatically.</span></div>
        <button class="game-action recover-action" data-action="heal" ${missing <= 0 || state.cash < cost ? 'disabled' : ''}>RECOVER <strong>${formatMoney(cost)}</strong></button>
      </section>
      <div class="section-divider"><span>BOSS POINTS</span><strong>${state.bossPoints}</strong></div>
      <div class="boss-point-grid">
        <button class="boost-tile energy" data-action="boss-point" data-type="energy" ${state.bossPoints < 1 ? 'disabled' : ''}>${icon('zap')}<strong>Fill Energy</strong><span>1 point</span></button>
        <button class="boost-tile drive" data-action="boss-point" data-type="drive" ${state.bossPoints < 1 ? 'disabled' : ''}>${icon('flame')}<strong>Fill Drive</strong><span>1 point</span></button>
        <button class="boost-tile morale" data-action="boss-point" data-type="morale" ${state.bossPoints < 1 ? 'disabled' : ''}>${icon('heart-pulse')}<strong>Fill Morale</strong><span>1 point</span></button>
        <button class="boost-tile cash" data-action="boss-point" data-type="cash" ${state.bossPoints < 1 ? 'disabled' : ''}>${icon('banknote')}<strong>Get Cash</strong><span>1 point</span></button>
      </div>
    </div>`;
};

const cbSkillData = [
  ['service','gauge','Service','Hit harder in rival + major challenges.',1,'service'],
  ['quality','badge-check','Quality','Reduce pressure when rivals push back.',1,'quality'],
  ['energy','zap','Energy','Work more shifts before waiting.',1,'energy'],
  ['drive','flame','Drive','Challenge more rivals in one run.',1,'drive'],
  ['morale','heart-pulse','Morale','Stay in major challenges longer.',10,'morale']
];

collectionHtml = function(c){
  const owned = c.items.filter(id => (state.inventory[id] || 0) > 0).length;
  const complete = owned === c.items.length;
  const claimed = state.collectionsClaimed.includes(c.id);
  return `
    <article class="collection-tile">
      <div class="collection-top"><div><strong>${c.name}</strong><span>${owned}/${c.items.length} collected</span></div>${claimed ? `<span class="status-tag good">Claimed</span>` : ''}</div>
      <div class="collection-items">${c.items.map(id => {
        const it = cbItem(id);
        const have = (state.inventory[id] || 0) > 0;
        return `<span class="collection-item ${have ? 'owned' : ''}" title="${it.name}">${icon(it.icon)}</span>`;
      }).join('')}</div>
      <div class="collection-foot"><span>${formatMoney(c.reward.cash)} + ${c.reward.skill} skill point${c.reward.skill === 1 ? '' : 's'}</span><button class="game-action collection-action" data-action="collection" data-id="${c.id}" ${!complete || claimed ? 'disabled' : ''}>${claimed ? 'CLAIMED' : 'CLAIM'}</button></div>
    </article>`;
};

renderProfile = function(){
  const valueFor = id => id === 'service' ? state.service : id === 'quality' ? state.quality : id === 'energy' ? state.maxEnergy : id === 'drive' ? state.maxDrive : state.maxMorale;
  return `
    <div class="game-screen boss-screen">
      <div class="screen-control-row boss-points-row">
        <div class="skill-point-bank">${icon('sparkles')}<strong>${state.skillPoints}</strong><span>Skill points</span></div>
        <div class="record-chip">Level ${state.level} Boss</div>
      </div>
      <div class="upgrade-grid">${cbSkillData.map(([id,ico,name,desc,inc,tone]) => `
        <article class="upgrade-tile ${tone}">
          <span class="upgrade-icon">${icon(ico)}</span>
          <div class="upgrade-copy"><strong>${name}</strong><span>${desc}</span></div>
          <div class="upgrade-value">${valueFor(id)}</div>
          <button class="upgrade-button" data-action="skill" data-stat="${id}" ${state.skillPoints < 1 ? 'disabled' : ''}>+${inc}</button>
        </article>`).join('')}</div>
      <div class="section-divider"><span>COLLECTIONS</span></div>
      <div class="collection-grid">${collections.map(collectionHtml).join('')}</div>
      <div class="section-divider"><span>CAREER</span></div>
      <div class="career-strip">
        <div><span>Shifts</span><strong>${state.jobsCompleted}</strong></div>
        <div><span>Lifetime cash</span><strong>${formatMoney(state.lifetimeIncome)}</strong></div>
        <div><span>Loot</span><strong>${state.itemsFound}</strong></div>
        <div><span>Achievements</span><strong>${state.achievements.length}</strong></div>
      </div>
    </div>`;
};
