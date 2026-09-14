'use strict';

function render(){
  updateTimers();
  renderStats();
  document.querySelectorAll('[data-nav]').forEach(el=>el.classList.toggle('active',el.dataset.nav===currentPage));
  const main=document.getElementById('main');
  const renderers={home:renderHome,shifts:renderShifts,rivals:renderRivals,locations:renderLocations,stockroom:renderStockroom,crew:renderCrew,challenges:renderChallenges,reserve:renderReserve,breakroom:renderBreakroom,profile:renderProfile};
  main.innerHTML=(renderers[currentPage]||renderHome)();
  const pageChanged=main.dataset.page!==currentPage;
  main.dataset.page=currentPage;
  main.classList.remove('screen-enter');
  bindPageActions();
  lucide.createIcons();
}
function renderStats(){
  document.getElementById('cashStat').textContent=formatMoney(state.cash);
  document.getElementById('moraleStat').textContent=`${state.morale}/${state.maxMorale}`;
  document.getElementById('energyStat').textContent=`${state.energy}/${state.maxEnergy}`;
  document.getElementById('driveStat').textContent=`${state.drive}/${state.maxDrive}`;
  document.getElementById('levelStat').textContent=state.level;
  document.getElementById('xpStat').textContent=`${state.xp.toLocaleString()} / ${xpNeeded(state.level).toLocaleString()}`;
  document.getElementById('xpBar').style.width=`${clamp(state.xp/xpNeeded(state.level)*100,0,100)}%`;
  const moraleBar=document.getElementById('moraleBar'); if(moraleBar) moraleBar.style.width=`${clamp(state.morale/state.maxMorale*100,0,100)}%`;
  const energyBar=document.getElementById('energyBar'); if(energyBar) energyBar.style.width=`${clamp(state.energy/state.maxEnergy*100,0,100)}%`;
  const driveBar=document.getElementById('driveBar'); if(driveBar) driveBar.style.width=`${clamp(state.drive/state.maxDrive*100,0,100)}%`;
  document.getElementById('districtLabel').textContent=districts.find(d=>d.id===state.district)?.name||'Old Market';
  const skill=document.getElementById('skillBadge'); skill.textContent=state.skillPoints; skill.classList.toggle('show',state.skillPoints>0);
  const cb=document.getElementById('challengeBadge'); cb.textContent=state.challengeTokens; cb.classList.toggle('show',state.challengeTokens>0);
}
function pageHead(){ return ''; }
function renderHome(){
  const income=totalIncomePerTick();
  const nextBoss=bosses.find(b=>state.level>=b.level&&!state.defeatedBosses.includes(b.id)) || bosses.find(b=>state.level<b.level);
  return `<div class="game-screen home-screen">
    <div class="screen-art-row">
      ${cbSceneArt('home')}
      <div class="screen-art-actions">
        <button class="game-action work-action" data-action="nav" data-page="shifts">${icon('zap')}<span>WORK SHIFT</span><small>${state.energy}/${state.maxEnergy} Energy</small></button>
        <button class="game-action" data-action="nav" data-page="rivals">${icon('swords')}<span>RIVALS</span><small>${state.drive}/${state.maxDrive} Drive</small></button>
        <button class="game-action" data-action="nav" data-page="locations">${icon('store')}<span>LOCATIONS</span><small>${formatMoney(income)}/min</small></button>
        <button class="game-action" data-action="nav" data-page="stockroom">${icon('package-open')}<span>STOCKROOM</span><small>${state.itemsFound} items found</small></button>
      </div>
    </div>

    <div class="grid-4 home-readout">
      <div class="metric-tile"><small>Income</small><strong>${formatMoney(income)}</strong><span>per minute</span></div>
      <div class="metric-tile"><small>Crew</small><strong>${state.crew.length}</strong><span>${crewPower()} power</span></div>
      <div class="metric-tile"><small>Service</small><strong>${totalService()}</strong><span>offence</span></div>
      <div class="metric-tile"><small>Quality</small><strong>${totalQuality()}</strong><span>defence</span></div>
    </div>

    ${nextBoss?`<section class="section home-milestone">${bossPreview(nextBoss)}</section>`:''}
    <section class="section home-feed">${feedHtml()}</section>
  </div>`;
}
function renderShifts(){
  const unlockedDistricts=districts.filter(d=>state.level>=d.level);
  if(!currentTab || !unlockedDistricts.some(d=>d.id===currentTab)) currentTab=state.district;
  const tabDistrict=districts.find(d=>d.id===currentTab)||unlockedDistricts[0];
  const rows=shifts.filter(s=>s.district===tabDistrict.id).map(s=>{
    const unlocked=state.level>=s.level;
    const mastery=state.shiftMastery[s.id]||0;
    const tier=Math.min(3,Math.floor(mastery/100));
    const masteryPct=mastery%100;
    return `<div class="list-row">
      <div class="list-row-main"><div class="icon-chip">${icon(s.icon)}</div><div><div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><h3>${s.name}</h3>${tier?`<span class="pill accent">Mastery ${['I','II','III'][tier-1]}</span>`:''}${!unlocked?`<span class="pill">Level ${s.level}</span>`:''}</div><p>${s.description}</p><div class="row-meta"><span>${icon('zap')} ${s.energy} energy</span><span>${icon('banknote')} ${formatMoney(s.cash[0])}–${formatMoney(s.cash[1])}</span><span>${icon('sparkles')} ${s.xp} XP</span></div>${unlocked?`<div class="progress"><span style="width:${masteryPct}%"></span></div>`:''}</div></div>
      <div class="row-actions"><button class="btn ${unlocked?'primary':'soft'}" data-action="shift" data-id="${s.id}" ${!unlocked||state.energy<s.energy?'disabled':''}>${unlocked?'WORK SHIFT':'Locked'}</button></div>
    </div>`;
  }).join('') || `<div class="empty-state"><div class="icon-chip">${icon('lock')}</div><h3>No shifts here yet</h3></div>`;
  return `<div class="game-screen">${cbSceneArt('shifts')}<div class="tabs">${unlockedDistricts.map(d=>`<button class="tab ${d.id===tabDistrict.id?'active':''}" data-action="tab" data-tab="${d.id}">${d.name}</button>`).join('')}</div><section class="card list-card">${rows}</section></div>`;
}
