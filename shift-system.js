'use strict';

const coffeeShiftTraits = [
  { id:'speed', label:'Speed', icon:'timer', color:'speed' },
  { id:'craft', label:'Craft', icon:'bean', color:'craft' },
  { id:'service', label:'Service', icon:'gauge', color:'service' },
  { id:'teamwork', label:'Teamwork', icon:'users', color:'teamwork' },
  { id:'composure', label:'Composure', icon:'heart-pulse', color:'composure' }
];

const coffeeShiftWeights = {
  open:{speed:.55,craft:.55,service:.55,teamwork:.50,composure:.50},
  morning:{speed:1,craft:.62,service:.78,teamwork:.82,composure:.88},
  delivery:{speed:.88,craft:.38,service:.58,teamwork:.52,composure:.72},
  train:{speed:.32,craft:.72,service:.78,teamwork:1,composure:.72},
  catering:{speed:.72,craft:.78,service:.82,teamwork:1,composure:.92},
  'office-rush':{speed:1,craft:.55,service:.76,teamwork:.90,composure:1},
  corporate:{speed:.48,craft:.72,service:1,teamwork:.82,composure:.78},
  launch:{speed:.62,craft:1,service:.88,teamwork:.68,composure:.72},
  study:{speed:.94,craft:.62,service:.76,teamwork:.86,composure:1},
  campus:{speed:.48,craft:.66,service:1,teamwork:.88,composure:.82},
  weekend:{speed:1,craft:.70,service:.84,teamwork:.94,composure:1},
  private:{speed:.44,craft:1,service:1,teamwork:.72,composure:.86},
  'gate-rush':{speed:1,craft:.58,service:.84,teamwork:1,composure:1},
  airline:{speed:.62,craft:.92,service:1,teamwork:.92,composure:.94}
};

function coffeeShiftWeight(shift){
  return coffeeShiftWeights[shift.id] || {speed:.7,craft:.7,service:.7,teamwork:.7,composure:.7};
}

function coffeePlayerTraits(shift){
  const mastery = state.shiftMastery[shift.id] || 0;
  return {
    speed: clamp(18 + state.service * 4 + inventoryPower('service') * 2.25 + state.level * .55, 10, 100),
    craft: clamp(18 + state.quality * 4 + inventoryPower('quality') * 2.25 + state.level * .55, 10, 100),
    service: clamp(22 + (state.service + state.quality) * 2.4 + state.crew.length * 2.5 + state.level * .7, 10, 100),
    teamwork: clamp(20 + crewPower() * 7 + state.crew.length * 4 + state.level * .8, 10, 100),
    composure: clamp((state.morale / Math.max(1,state.maxMorale)) * 66 + state.level * .65 + Math.min(18, mastery / 6), 10, 100)
  };
}

function coffeeShiftRequirements(shift){
  const weights = coffeeShiftWeight(shift);
  const base = clamp(28 + shift.level * 1.18, 28, 84);
  const out = {};
  coffeeShiftTraits.forEach(t => {
    const w = weights[t.id] || .5;
    out[t.id] = clamp(Math.round(base * (.58 + w * .52)), 18, 96);
  });
  return out;
}

function coffeeHeatLevel(value){
  if(value >= 82) return 5;
  if(value >= 66) return 4;
  if(value >= 50) return 3;
  if(value >= 34) return 2;
  return 1;
}

// Coverage is a visual readiness check, separate from the existing outcome roll.
// Surplus on one spoke never conceals a shortfall on another.
function coffeeTraitCoverage(requirements, player){
  const ratios = coffeeShiftTraits.map(t => Math.min(1, Math.max(0, player[t.id] / requirements[t.id])));
  const met = ratios.filter(r => r >= 1).length;
  return {met, percent:met === coffeeShiftTraits.length ? 100 : Math.min(99, Math.floor(ratios.reduce((a,b) => a+b,0) / ratios.length * 100))};
}

function coffeeTraitHeatmap(shift){
  const requirements = coffeeShiftRequirements(shift);
  const player = coffeePlayerTraits(shift);
  const coverage = coffeeTraitCoverage(requirements, player);
  const point = (i, value, radius=86) => {
    const angle = -Math.PI / 2 + i * Math.PI * 2 / coffeeShiftTraits.length;
    return [120 + Math.cos(angle) * radius * value / 100,120 + Math.sin(angle) * radius * value / 100];
  };
  const coords = p => p.map(n => n.toFixed(2)).join(',');
  const polygon = values => coffeeShiftTraits.map((t,i) => coords(point(i,values[t.id]))).join(' ');
  const summary = coffeeShiftTraits.map(t => `${t.label}: ${player[t.id].toFixed(1)} crew, ${requirements[t.id]} required`).join('; ');
  return `<figure class="skill-radar" data-shift="${shift.id}" data-traits="${coffeeShiftTraits.map(t=>player[t.id]).join(',')}" aria-label="${shift.name}: crew skill comparison">
    <div class="radar-plot">
      <svg class="radar-chart" viewBox="0 0 240 240" role="img" aria-label="${coverage.percent}% of requirements covered. ${summary}">
        ${[20,40,60,80,100].map(v => `<polygon class="radar-ring" points="${coffeeShiftTraits.map((t,i) => coords(point(i,v))).join(' ')}"/>`).join('')}
        ${coffeeShiftTraits.map((t,i) => `<line class="radar-spoke" x1="120" y1="120" x2="${point(i,100)[0]}" y2="${point(i,100)[1]}"/>`).join('')}
        <polygon class="radar-crew" points="${polygon(player)}"/>
        <polygon class="radar-required" points="${polygon(requirements)}"/>
        ${coffeeShiftTraits.map((t,i) => `<circle class="radar-dot" cx="${point(i,player[t.id])[0]}" cy="${point(i,player[t.id])[1]}" r="3"/>`).join('')}
      </svg>
      ${coffeeShiftTraits.map((t,i) => {const p=point(i,100,108);return `<span class="radar-axis ${t.color}" style="left:${p[0]/2.4}%;top:${p[1]/2.4}%" role="img" aria-label="${t.label}" title="${t.label}">${icon(t.icon)}</span>`;}).join('')}
    </div>
    <figcaption>
      <div class="radar-legend"><span class="radar-key required">Required</span><span class="radar-key crew">Your crew</span></div>
      <strong class="radar-coverage">${icon(coverage.met===5?'circle-check':'scan')} ${coverage.percent}% covered</strong>
      <span class="radar-status">${coverage.met===5?'All five skills meet the batch':`${coverage.met} of 5 skills meet the batch`}</span>
    </figcaption>
    <details class="radar-details"><summary>Skill details</summary>
      <div class="radar-values-heading"><span>Skill</span><span>Required</span><span>Your crew</span></div>
      ${coffeeShiftTraits.map(t => `<div class="radar-value-row"><span class="radar-trait ${t.color}" role="img" aria-label="${t.label}" title="${t.label}">${icon(t.icon)}</span><span class="radar-needed">${requirements[t.id]}</span><span class="radar-yours">${player[t.id].toFixed(1)} ${icon(player[t.id]>=requirements[t.id]?'check':'arrow-down')}</span></div>`).join('')}
      <p>Skills run from 0 to 100. Cover every green spoke to meet the batch. The final result also depends on practice and luck.</p>
    </details>
  </figure>`;
}

function coffeeRefreshRadars(){
  let changed=false;
  document.querySelectorAll('.skill-radar[data-shift]').forEach(chart=>{
    const shift=shifts.find(s=>s.id===chart.dataset.shift);
    if(!shift)return;
    const player=coffeePlayerTraits(shift);
    if(chart.dataset.traits===coffeeShiftTraits.map(t=>player[t.id]).join(','))return;
    const detailsOpen=chart.querySelector('details')?.open;
    const focused=chart.contains(document.activeElement);
    const template=document.createElement('template');
    template.innerHTML=coffeeTraitHeatmap(shift);
    const replacement=template.content.firstElementChild;
    replacement.querySelector('details').open=detailsOpen;
    chart.replaceWith(replacement);
    if(focused)replacement.querySelector('summary').focus({preventScroll:true});
    changed=true;
  });
  if(changed)lucide.createIcons();
}

function coffeeShiftMatch(shift){
  const weights = coffeeShiftWeight(shift);
  const requirements = coffeeShiftRequirements(shift);
  const player = coffeePlayerTraits(shift);
  let weighted = 0;
  let totalWeight = 0;
  coffeeShiftTraits.forEach(t => {
    const w = weights[t.id] || .5;
    weighted += clamp(player[t.id] / requirements[t.id], 0, 1.55) * w;
    totalWeight += w;
  });
  return weighted / Math.max(.01,totalWeight);
}

function coffeeResolveShift(shift){
  const match = coffeeShiftMatch(shift);
  const mastery = state.shiftMastery[shift.id] || 0;
  const masteryBonus = Math.min(7, mastery / 45);
  const roll = (Math.random() - .5) * 18;
  const score = clamp(25 + (match - .64) * 88 + masteryBonus + roll, 3, 98);
  let tier = 'miss';
  if(score >= 84) tier = 'perfect';
  else if(score >= 66) tier = 'strong';
  else if(score >= 40) tier = 'complete';

  const payoutBase = Math.floor(shift.cash[0] + Math.random() * (shift.cash[1] - shift.cash[0] + 1));
  const multipliers = {
    miss:{cash:0,xp:.42,mastery:.35,label:'SHIFT MISSED',tone:'miss'},
    complete:{cash:1,xp:1,mastery:1,label:'SHIFT COMPLETE',tone:'complete'},
    strong:{cash:1.22,xp:1.16,mastery:1.25,label:'STRONG SHIFT',tone:'strong'},
    perfect:{cash:1.48,xp:1.38,mastery:1.55,label:'PERFECT SHIFT',tone:'perfect'}
  };
  const m = multipliers[tier];
  return {
    shiftId:shift.id,
    score,
    match,
    tier,
    label:m.label,
    tone:m.tone,
    cash:Math.floor(payoutBase * m.cash),
    xp:Math.max(1,Math.round(shift.xp * m.xp)),
    mastery:Math.max(1,Math.round(shift.mastery * m.mastery)),
    energyCost:shift.energy,
    energyRefund:tier === 'perfect' ? Math.max(1,Math.round(shift.energy * .45)) : 0
  };
}

function coffeeLootWithBonus(shift, result){
  if(!shift.loot?.length || result.tier === 'miss') return null;
  const mastery = state.shiftMastery[shift.id] || 0;
  const tierBonus = result.tier === 'perfect' ? .25 : result.tier === 'strong' ? .11 : 0;
  const chance = .15 + Math.min(.16, mastery / 500) + tierBonus;
  if(Math.random() > chance) return null;
  const id = pick(shift.loot);
  state.inventory[id] = (state.inventory[id] || 0) + 1;
  state.itemsFound++;
  return items.find(i => i.id === id) || null;
}

function coffeeApplyShiftResult(shift, result){
  state.energy = Math.max(0, state.energy - result.energyCost);
  if(result.energyRefund) state.energy = Math.min(state.maxEnergy, state.energy + result.energyRefund);
  state.cash += result.cash;
  state.lifetimeIncome += result.cash;
  state.xp += result.xp;
  state.jobsCompleted++;

  const oldMastery = state.shiftMastery[shift.id] || 0;
  state.shiftMastery[shift.id] = oldMastery + result.mastery;
  const oldTier = Math.min(3, Math.floor(oldMastery / 100));
  const newTier = Math.min(3, Math.floor(state.shiftMastery[shift.id] / 100));
  let masteryReward = 0;
  if(newTier > oldTier){
    masteryReward = 250 * newTier + state.level * 50;
    state.cash += masteryReward;
    state.lifetimeIncome += masteryReward;
    state.skillPoints += 1;
    addFeed('badge-check', `${shift.name} reached Mastery ${['I','II','III'][newTier-1]}.`);
  }

  const loot = coffeeLootWithBonus(shift,result);
  const feedLead = result.tier === 'miss' ? 'Missed' : result.tier === 'perfect' ? 'Perfect' : result.tier === 'strong' ? 'Strong' : 'Completed';
  addFeed(result.tier === 'miss' ? 'circle-x' : 'clipboard-check', `${feedLead} ${shift.name}: +${formatMoney(result.cash)} and +${result.xp} XP.`);
  if(loot) addFeed('package-open', `Found ${loot.name} while working ${shift.name}.`);

  levelCheck();
  checkAchievements();
  saveState(true);
  return {loot,masteryReward};
}

function coffeeOpenShiftBrief(id){
  const shift = shifts.find(s => s.id === id);
  if(!shift || state.level < shift.level) return;
  if(state.energy < shift.energy) return toast('Not enough energy.','bad');

  const modal = document.getElementById('modal');
  const content = document.getElementById('modalContent');
  modal.classList.add('shift-modal');
  content.innerHTML = `<div class="shift-brief">
    <div class="shift-modal-top">
      <button class="shift-close" type="button" aria-label="Close">${icon('x')}</button>
      <div class="shift-brief-icon">${icon(shift.icon)}</div>
      <div class="shift-brief-title"><strong>${shift.name}</strong><span>${cbDistrict(shift.district)?.name || ''}</span></div>
      <span class="resource-chip energy">${icon('zap')}<span>Cost</span><strong>${shift.energy}</strong></span>
    </div>

    <div class="shift-brief-grid">
      <section class="shift-traits-panel">
        <div class="shift-panel-kicker">TRAIT PRESSURE</div>
        <div class="shift-panel-note">Green is the batch. Gold is your crew.</div>
        ${coffeeTraitHeatmap(shift)}
      </section>

      <aside class="shift-pay-panel">
        <div class="shift-panel-kicker">BASE PAYOUT</div>
        <div class="shift-pay-line cash"><span>${icon('banknote')} Cash</span><strong>${formatMoney(shift.cash[0])} to ${formatMoney(shift.cash[1])}</strong></div>
        <div class="shift-pay-line xp"><span>${icon('sparkles')} XP</span><strong>${shift.xp}</strong></div>
        <div class="shift-pay-line mastery"><span>${icon('badge-check')} Mastery</span><strong>+${shift.mastery}</strong></div>
        <p>${shift.description}</p>
      </aside>
    </div>

    <button class="shift-start" type="button">${icon('play')} WORK SHIFT</button>
  </div>`;

  if(!modal.open) modal.showModal();
  lucide.createIcons();
  content.querySelector('.shift-close').onclick = () => { modal.close(); modal.classList.remove('shift-modal','shift-resolving'); };
  content.querySelector('.shift-start').onclick = () => coffeeStartShiftOutcome(shift);
}

function coffeeOutcomeZone(score){
  if(score < 40) return 0;
  if(score < 66) return 1;
  if(score < 84) return 2;
  return 3;
}

function coffeeStartShiftOutcome(shift){
  if(state.energy < shift.energy) return toast('Not enough energy.','bad');
  const result = coffeeResolveShift(shift);
  const modal = document.getElementById('modal');
  const content = document.getElementById('modalContent');
  modal.classList.add('shift-resolving');
  const before = resourceSnapshot();

  content.innerHTML = `<div class="shift-outcome">
    <div class="outcome-title-row">
      <div><span>SHIFT RESULT</span><strong>${shift.name}</strong></div>
      <span class="outcome-resolving">RESOLVING…</span>
    </div>
    <div class="outcome-board-wrap"><canvas id="shiftOutcomeCanvas" class="outcome-board"></canvas></div>
    <div class="outcome-zones" aria-hidden="true"><span>MISS</span><span>COMPLETE</span><span>STRONG</span><span>PERFECT</span></div>
    <div class="outcome-reveal" id="shiftOutcomeReveal">
      <div class="outcome-grade ${result.tone}">${result.label}</div>
      <div class="outcome-rewards" id="shiftOutcomeRewards"></div>
      <button class="outcome-done" type="button">CONTINUE</button>
    </div>
  </div>`;
  lucide.createIcons();
  modal.oncancel = e => e.preventDefault();
  coffeeAnimateOutcomeBall(result.score, () => {
    const extras = coffeeApplyShiftResult(shift,result);
    renderStats();
    requestAnimationFrame(() => afterActionFeedback(before));
    const rewards = [];
    if(result.cash > 0) rewards.push(cbResourceChip('cash','banknote','Cash',`+${formatMoney(result.cash)}`));
    rewards.push(cbResourceChip('xp','sparkles','XP',`+${result.xp}`));
    rewards.push(`<span class="resource-chip mastery">${icon('badge-check')}<span>Mastery</span><strong>+${result.mastery}</strong></span>`);
    if(result.energyRefund) rewards.push(cbResourceChip('energy','zap','Flow refund',`+${result.energyRefund}`));
    if(extras.masteryReward) rewards.push(cbResourceChip('cash','award','Mastery bonus',`+${formatMoney(extras.masteryReward)}`));
    if(extras.loot) rewards.push(`<span class="resource-chip loot">${icon('package-open')}<span>Found</span><strong>${extras.loot.name}</strong></span>`);
    document.getElementById('shiftOutcomeRewards').innerHTML = rewards.join('');
    document.querySelector('.outcome-resolving').textContent = `${Math.round(result.score)} SCORE`;
    document.getElementById('shiftOutcomeReveal').classList.add('show');
    lucide.createIcons();
    content.querySelector('.outcome-done').onclick = () => {
      modal.oncancel = null;
      modal.close();
      modal.classList.remove('shift-modal','shift-resolving');
      render();
    };
  });
}

function coffeeAnimateOutcomeBall(score,onDone){
  const canvas = document.getElementById('shiftOutcomeCanvas');
  if(!canvas){ onDone(); return; }
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.max(1,Math.min(2,window.devicePixelRatio || 1));
  const cssW = Math.max(320,rect.width || 720);
  const cssH = 188;
  canvas.width = cssW * dpr;
  canvas.height = cssH * dpr;
  canvas.style.height = `${cssH}px`;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr,dpr);

  const pad = 18;
  const laneY = 128;
  const laneW = cssW - pad*2;
  const zoneStops = [0,.40,.66,.84,1];
  const zoneColors = ['rgba(238,108,117,.13)','rgba(78,181,255,.12)','rgba(101,210,154,.13)','rgba(197,151,255,.16)'];
  const zoneLines = ['#ee6c75','#4eb5ff','#65d29a','#c597ff'];
  const targetX = pad + laneW * (score/100);
  const startX = pad + 8;
  const duration = 1700;
  const start = performance.now();
  const trail = [];
  let flash = 0;

  function roundedRect(x,y,w,h,r){
    const rr=Math.min(r,w/2,h/2);
    ctx.beginPath();
    ctx.moveTo(x+rr,y);ctx.arcTo(x+w,y,x+w,y+h,rr);ctx.arcTo(x+w,y+h,x,y+h,rr);ctx.arcTo(x,y+h,x,y,rr);ctx.arcTo(x,y,x+w,y,rr);ctx.closePath();
  }

  function drawBoard(){
    ctx.clearRect(0,0,cssW,cssH);
    for(let i=0;i<4;i++){
      const x=pad+laneW*zoneStops[i];
      const w=laneW*(zoneStops[i+1]-zoneStops[i]);
      ctx.fillStyle=zoneColors[i];
      roundedRect(x,84,w,58,10);ctx.fill();
      ctx.fillStyle=zoneLines[i];
      ctx.fillRect(x,138,w,3);
    }
    ctx.strokeStyle='rgba(255,255,255,.08)';
    ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(pad,laneY);ctx.lineTo(cssW-pad,laneY);ctx.stroke();
  }

  function frame(now){
    const raw=clamp((now-start)/duration,0,1);
    const ease=1-Math.pow(1-raw,3);
    const x=startX+(targetX-startX)*ease;
    const bounceAmp=(1-raw)*62;
    const bounce=Math.abs(Math.sin(raw*Math.PI*5.25))*bounceAmp;
    const y=laneY-12-bounce;
    trail.push({x,y,a:1});
    if(trail.length>18)trail.shift();
    trail.forEach(p=>p.a*=.87);

    drawBoard();
    trail.forEach((p,i)=>{
      ctx.beginPath();ctx.arc(p.x,p.y,4+(i/trail.length)*3,0,Math.PI*2);
      ctx.fillStyle=`rgba(246,241,232,${p.a*.18})`;ctx.fill();
    });
    ctx.shadowBlur=18;ctx.shadowColor='rgba(255,255,255,.34)';
    ctx.beginPath();ctx.arc(x,y,11,0,Math.PI*2);ctx.fillStyle='#f6f1e8';ctx.fill();
    ctx.shadowBlur=0;

    if(raw<1){ requestAnimationFrame(frame); return; }
    flash=1;
    impact();
  }

  function impact(){
    drawBoard();
    const zone=coffeeOutcomeZone(score);
    ctx.beginPath();ctx.arc(targetX,laneY-12,11,0,Math.PI*2);ctx.fillStyle='#f6f1e8';ctx.fill();
    if(flash>0){
      ctx.beginPath();ctx.arc(targetX,laneY-12,12+(1-flash)*42,0,Math.PI*2);
      ctx.strokeStyle=`rgba(255,255,255,${flash*.46})`;ctx.lineWidth=3;ctx.stroke();
      ctx.fillStyle=zoneLines[zone];ctx.globalAlpha=.18*flash;ctx.beginPath();ctx.arc(targetX,laneY-12,28,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
      flash-=.075;
      requestAnimationFrame(impact);
    }else onDone();
  }
  requestAnimationFrame(frame);
}

performShift = function(id){ coffeeOpenShiftBrief(id); };

renderShifts = function(){
  const unlockedDistricts = districts.filter(d => state.level >= d.level);
  if(!currentTab || !unlockedDistricts.some(d => d.id === currentTab)) currentTab = state.district;
  const district = cbDistrict(currentTab) || unlockedDistricts[0];
  const districtShifts = shifts.filter(s => s.district === district.id);

  return `<div class="game-screen shifts-screen">
    <div class="screen-control-row">
      <div class="district-tabs">${unlockedDistricts.map(d => `<button class="district-tab ${d.id===district.id?'active':''}" data-action="tab" data-tab="${d.id}">${icon(d.icon)}<span>${d.name}</span></button>`).join('')}</div>
      <div class="regen-note">${icon('timer')} +1 Energy / min</div>
    </div>
    <div class="job-stack">${districtShifts.map(s => {
      const unlocked=state.level>=s.level;
      const mastery=state.shiftMastery[s.id]||0;
      const masteryTier=Math.min(3,Math.floor(mastery/100));
      const masteryPct=mastery%100;
      const affordable=state.energy>=s.energy;
      const buttonLabel=!unlocked?`LEVEL ${s.level}`:!affordable?'NEED ENERGY':'WORK SHIFT';
      return `<article class="job-card ${!unlocked?'locked':''}">
        <div class="job-icon">${icon(s.icon)}</div>
        <div class="job-main">
          <div class="job-title-row"><strong>${s.name}</strong>${masteryTier?`<span class="mastery-badge">Mastery ${['I','II','III'][masteryTier-1]}</span>`:''}</div>
          <span class="job-desc">${s.description}</span>
          <div class="job-bottom-line">
            <div class="job-resources">${cbResourceChip('energy','zap','Cost',s.energy)}${cbResourceChip('cash','banknote','Cash',`${formatMoney(s.cash[0])} to ${formatMoney(s.cash[1])}`)}${cbResourceChip('xp','sparkles','XP',s.xp)}</div>
            ${coffeeTraitHeatmap(s,true)}
          </div>
          ${unlocked?`<div class="mastery-track"><span style="width:${masteryPct}%"></span></div>`:''}
        </div>
        <button class="game-action work-action" data-action="shift" data-id="${s.id}" ${!unlocked||!affordable?'disabled':''}>${buttonLabel}</button>
      </article>`;
    }).join('')}</div>
  </div>`;
};
