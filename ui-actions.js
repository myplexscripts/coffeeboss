'use strict';

function resourceSnapshot(){
  return {cash:state.cash,xp:state.xp,energy:state.energy,drive:state.drive,morale:state.morale,level:state.level};
}
function pulseHud(id,spent=false){
  const el=document.getElementById(id);
  if(!el) return;
  el.classList.remove('hud-pop','hud-spend');
  void el.offsetWidth;
  el.classList.add(spent?'hud-spend':'hud-pop');
  setTimeout(()=>el.classList.remove('hud-pop','hud-spend'),650);
}
function rewardBurst(text,type='good'){
  const el=document.createElement('div');
  el.className=`reward-burst ${type}`;
  el.textContent=text;
  document.body.appendChild(el);
  setTimeout(()=>el.remove(),1400);
}
function afterActionFeedback(before){
  const changes=[];
  const deltaCash=state.cash-before.cash;
  const deltaXp=state.level===before.level?state.xp-before.xp:state.xp;
  const deltaEnergy=state.energy-before.energy;
  const deltaDrive=state.drive-before.drive;
  const deltaMorale=state.morale-before.morale;

  if(deltaCash!==0){ pulseHud('cashHud',deltaCash<0); changes.push({text:`${deltaCash>0?'+':''}${formatMoney(deltaCash)}`,type:deltaCash>0?'cash':'bad'}); }
  if(deltaXp>0){ pulseHud('xpHud'); changes.push({text:`+${deltaXp.toLocaleString()} XP`,type:'xp'}); }
  if(deltaEnergy!==0) pulseHud('energyHud',deltaEnergy<0);
  if(deltaDrive!==0) pulseHud('driveHud',deltaDrive<0);
  if(deltaMorale!==0) pulseHud('moraleHud',deltaMorale<0);
  if(state.level>before.level){ pulseHud('xpHud'); changes.unshift({text:`LEVEL ${state.level}`,type:'xp'}); }

  if(changes.length){
    rewardBurst(changes.slice(0,2).map(c=>c.text).join('   '),changes[0].type);
  }
}

function bindPageActions(){
  document.querySelectorAll('[data-action]').forEach(el=>el.addEventListener('click',()=>{
    const a=el.dataset.action;
    if(a==='nav'){ currentPage=el.dataset.page; currentTab=null; render(); document.getElementById('main').focus({preventScroll:true}); window.scrollTo({top:0,behavior:'smooth'}); return; }
    if(a==='tab'){ currentTab=el.dataset.tab; render(); return; }

    const before=resourceSnapshot();
    if(a==='shift') performShift(el.dataset.id);
    if(a==='location') buyLocation(el.dataset.id);
    if(a==='buy-item') buyItem(el.dataset.id);
    if(a==='sell-item') sellItem(el.dataset.id);
    if(a==='recruit') recruitCrew();
    if(a==='rival') challengeRival(Number(el.dataset.index));
    if(a==='boss') bossAttack(el.dataset.id,el.dataset.power==='1');
    if(a==='heal') heal();
    if(a==='boss-point') useBossPoint(el.dataset.type);
    if(a==='skill') addSkill(el.dataset.stat);
    if(a==='challenge') runChallenge(el.dataset.type);
    if(a==='collection') claimCollection(el.dataset.id);
    if(a==='transfer'){
      const input=document.getElementById(el.dataset.direction==='deposit'?'depositAmount':'withdrawAmount');
      transferReserve(el.dataset.direction,input.value);
    }
    requestAnimationFrame(()=>afterActionFeedback(before));
  }));
}
function navigate(page){ currentPage=page; currentTab=null; render(); window.scrollTo({top:0,behavior:'smooth'}); }
function showMoreMenu(){
  const m=document.getElementById('modal');
  document.getElementById('modalContent').innerHTML=`<div class="modal-head"><h2>More</h2><button class="icon-button" data-close>${icon('x')}</button></div><div class="modal-body settings-grid">${[['stockroom','package-open','Stockroom'],['crew','users','Crew'],['challenges','trophy','Challenges'],['reserve','landmark','Reserve'],['breakroom','armchair','Break Room'],['profile','circle-user-round','Boss']].map(([p,i,n])=>`<button class="btn soft" data-modal-nav="${p}">${icon(i)} ${n}</button>`).join('')}</div>`;
  m.showModal(); lucide.createIcons();
  m.querySelector('[data-close]').onclick=()=>m.close();
  m.querySelectorAll('[data-modal-nav]').forEach(b=>b.onclick=()=>{m.close();navigate(b.dataset.modalNav)});
}
function showSettings(){
  const m=document.getElementById('modal');
  document.getElementById('modalContent').innerHTML=`<div class="modal-head"><h2>Game options</h2><button class="icon-button" data-close>${icon('x')}</button></div><div class="modal-body"><div class="settings-grid"><button class="btn soft" data-settings="save">${icon('save')} Save now</button><button class="btn soft" data-settings="export">${icon('download')} Export save</button><button class="btn soft" data-settings="import">${icon('upload')} Import save</button><button class="btn danger" data-settings="reset">${icon('rotate-ccw')} Start over</button></div><p class="muted" style="margin-top:14px">Coffee Boss saves locally in this browser automatically.</p></div>`;
  m.showModal(); lucide.createIcons();
  m.querySelector('[data-close]').onclick=()=>m.close();
  m.querySelectorAll('[data-settings]').forEach(b=>b.onclick=()=>{
    const t=b.dataset.settings;
    if(t==='save'){ saveState(); m.close(); }
    if(t==='export'){
      const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='coffee-boss-save.json'; a.click(); URL.revokeObjectURL(a.href);
    }
    if(t==='import'){
      const input=document.createElement('input'); input.type='file'; input.accept='.json,application/json'; input.onchange=()=>{const f=input.files[0]; if(!f)return; const r=new FileReader(); r.onload=()=>{try{state=Object.assign(defaultState(),JSON.parse(r.result));saveState(true);m.close();render();toast('Save imported.','good')}catch{toast('That save file could not be read.','bad')}};r.readAsText(f)};input.click();
    }
    if(t==='reset'){
      if(confirm('Start Coffee Boss over from the beginning?')){localStorage.removeItem(SAVE_KEY);state=defaultState();currentPage='home';currentTab=null;m.close();render();toast('Fresh start.');}
    }
  });
}

function showBossStyle(){
  const m=document.getElementById('modal');
  document.getElementById('modalContent').innerHTML=`<div class="modal-head"><div><p class="eyebrow">Choose your edge</p><h2>What kind of Coffee Boss are you?</h2></div></div><div class="modal-body"><p class="muted">This changes how your shop recovers or earns, but it does not lock any content.</p><div class="grid-3" style="margin-top:14px"><button class="card card-pad" style="text-align:left;color:inherit;cursor:pointer" data-style="operator"><div class="icon-chip">${icon('zap')}</div><h3 style="margin-top:12px">Operator</h3><p class="muted">Energy regenerates 25% faster. Best for doing more shifts.</p></button><button class="card card-pad" style="text-align:left;color:inherit;cursor:pointer" data-style="owner"><div class="icon-chip">${icon('store')}</div><h3 style="margin-top:12px">Owner</h3><p class="muted">Locations earn 25% more passive income.</p></button><button class="card card-pad" style="text-align:left;color:inherit;cursor:pointer" data-style="competitor"><div class="icon-chip">${icon('swords')}</div><h3 style="margin-top:12px">Competitor</h3><p class="muted">Drive and Morale regenerate faster for challenges.</p></button></div></div>`;
  m.showModal(); lucide.createIcons();
  m.querySelectorAll('[data-style]').forEach(b=>b.onclick=()=>{ state.bossStyle=b.dataset.style; state.lastEnergyRegen=Date.now(); state.lastDriveRegen=Date.now(); state.lastMoraleRegen=Date.now(); saveState(true); m.close(); render(); toast(`${b.textContent.trim().split(/\s+/)[0]} style selected.`, 'good'); });
}
