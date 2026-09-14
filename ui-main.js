'use strict';

function render(){
  updateTimers();
  renderStats();
  document.querySelectorAll('[data-nav]').forEach(el=>el.classList.toggle('active',el.dataset.nav===currentPage));
  const main=document.getElementById('main');
  const renderers={home:renderHome,shifts:renderShifts,rivals:renderRivals,locations:renderLocations,stockroom:renderStockroom,crew:renderCrew,challenges:renderChallenges,reserve:renderReserve,breakroom:renderBreakroom,profile:renderProfile};
  main.innerHTML=(renderers[currentPage]||renderHome)();
  main.classList.remove('screen-enter');
  void main.offsetWidth;
  main.classList.add('screen-enter');
  bindPageActions();
  lucide.createIcons();
}
function renderStats(){
  document.getElementById('cashStat').textContent=formatMoney(state.cash);
  document.getElementById('moraleStat').textContent=`${state.morale}/${state.maxMorale}`;
  document.getElementById('energyStat').textContent=`${state.energy}/${state.maxEnergy}`;
  document.getElementById('driveStat').textContent=`${state.drive}/${state.maxDrive}`;
  document.getElementById('levelStat').textContent=state.level;
  document.getElementById('xpStat').textContent=`${state.xp.toLocaleString()} / ${xpNeeded(state.level).toLocaleString()} XP`;
  document.getElementById('xpBar').style.width=`${clamp(state.xp/xpNeeded(state.level)*100,0,100)}%`;
  document.getElementById('districtLabel').textContent=districts.find(d=>d.id===state.district)?.name||'Old Market';
  const skill=document.getElementById('skillBadge'); skill.textContent=state.skillPoints; skill.classList.toggle('show',state.skillPoints>0);
  const cb=document.getElementById('challengeBadge'); cb.textContent=state.challengeTokens; cb.classList.toggle('show',state.challengeTokens>0);
}
function pageHead(eyebrow,title,subtitle,action=''){
  return `<div class="page-head"><div><p class="eyebrow">${eyebrow}</p><h1>${title}</h1><p class="page-subtitle">${subtitle}</p></div>${action}</div>`;
}
function renderHome(){
  const income=totalIncomePerTick();
  const district=districts.find(d=>d.id===state.district);
  const nextBoss=bosses.find(b=>state.level>=b.level&&!state.defeatedBosses.includes(b.id)) || bosses.find(b=>state.level<b.level);
  return `
    <section class="card hero-card">
      <div class="hero-grid">
        <div>
          <span class="pill accent">${icon('coffee')} ${district.name}</span>
          <h2 class="hero-title">Build something people line up for.</h2>
          <p class="hero-copy">Work shifts for cash and experience, build a crew, collect better gear, open income-producing locations, and take on rival cafés when you are ready.</p>
          <div class="hero-actions"><button class="btn primary" data-action="nav" data-page="shifts">${icon('zap')} Work a shift</button><button class="btn soft" data-action="nav" data-page="locations">${icon('store')} Grow the business</button></div>
        </div>
        <div class="hero-side">
          <div class="metric-tile"><small>Passive income</small><strong>${formatMoney(income)}</strong><span>every minute</span></div>
          <div class="metric-tile"><small>Crew</small><strong>${state.crew.length}</strong><span>${crewPower()} crew power</span></div>
          <div class="metric-tile"><small>Service power</small><strong>${totalService()}</strong><span>vs. rival quality</span></div>
          <div class="metric-tile"><small>Quality power</small><strong>${totalQuality()}</strong><span>protects your shop</span></div>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="section-heading"><div><h2>Right now</h2><p>Pick whatever sounds useful. Nothing here locks you into one path.</p></div></div>
      <div class="grid-4">
        <article class="card quick-card"><div class="icon-chip">${icon('clipboard-list')}</div><h3>Work shifts</h3><p>Spend energy for cash, XP, mastery, and loot drops.</p><button class="btn soft" data-action="nav" data-page="shifts">View shifts</button></article>
        <article class="card quick-card"><div class="icon-chip">${icon('swords')}</div><h3>Challenge rivals</h3><p>Spend drive to test your shop against other cafés.</p><button class="btn soft" data-action="nav" data-page="rivals">Find rivals</button></article>
        <article class="card quick-card"><div class="icon-chip">${icon('store')}</div><h3>Open locations</h3><p>Turn cash into recurring income that keeps paying.</p><button class="btn soft" data-action="nav" data-page="locations">See locations</button></article>
        <article class="card quick-card"><div class="icon-chip">${icon('package-open')}</div><h3>Improve your loadout</h3><p>Better gear automatically strengthens you and your crew.</p><button class="btn soft" data-action="nav" data-page="stockroom">Open stockroom</button></article>
      </div>
    </section>

    ${nextBoss?`<section class="section"><div class="section-heading"><div><h2>${state.level>=nextBoss.level?'Current milestone':'Coming up'}</h2><p>Major challenges pay much better than ordinary shifts.</p></div></div>${bossPreview(nextBoss)}</section>`:''}
    <section class="section"><div class="section-heading"><div><h2>Activity</h2><p>Your shop's recent history.</p></div></div>${feedHtml()}</section>
  `;
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
      <div class="row-actions"><button class="btn ${unlocked?'primary':'soft'}" data-action="shift" data-id="${s.id}" ${!unlocked||state.energy<s.energy?'disabled':''}>${unlocked?'Do shift':'Locked'}</button></div>
    </div>`;
  }).join('') || `<div class="empty-state"><div class="icon-chip">${icon('lock')}</div><h3>No shifts here yet</h3></div>`;
  return `${pageHead('Jobs', 'Shifts', 'Spend energy to earn cash and XP. Repeating shifts builds mastery and slightly improves loot odds.')}
    <div class="tabs">${unlockedDistricts.map(d=>`<button class="tab ${d.id===tabDistrict.id?'active':''}" data-action="tab" data-tab="${d.id}">${d.name}</button>`).join('')}</div>
    <section class="card list-card">${rows}</section>
    <section class="section"><div class="card card-pad"><h3>Energy</h3><p class="muted">Energy regenerates automatically. Level-ups also give you a partial refill, so chaining a level at the right time can keep a run going.</p><div class="progress energy"><span style="width:${state.energy/state.maxEnergy*100}%"></span></div></div></section>`;
}
