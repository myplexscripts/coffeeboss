'use strict';

// The shop is the hub. Workspaces open over it, keeping a place to return to.
const shopPageNames={shifts:'At the counter',rivals:'Around the block',locations:'The neighbourhood',stockroom:'Behind the bar',crew:'Your crew',challenges:'The noticeboard',reserve:'The safe',breakroom:'Take five',profile:'The boss'};
function shopAvatar(seed='Felix'){
  return `<img class="micah-avatar" src="https://api.dicebear.com/10.x/micah/svg?seed=${encodeURIComponent(seed).replace(/'/g,'%27')}&amp;mouth=smile,laughing,smirk&amp;eyes=eyes,round,smiling" width="96" height="96" alt="" decoding="async">`;
}
function shopRoom(interactive=true){
  const spot=(page,cls,label,detail)=>interactive?`<button class="shop-spot ${cls}" data-action="nav" data-page="${page}"><span>${label}</span><small>${detail}</small>${icon('arrow-up-right')}</button>`:'';
  const gear=items.filter(i=>(state.inventory[i.id]||0)>0).sort((a,b)=>(b.service+b.quality)-(a.service+a.quality))[0];
  return `<div class="shop-room" ${interactive?'aria-label="Your coffee shop"':'aria-hidden="true"'}>
    <div class="shop-wall"></div><div class="shop-floor"></div>
    <div class="shop-window"><div class="shop-skyline"></div><div class="shop-window-frame"></div><span>OLD MARKET COFFEE</span></div>
    <div class="shop-clock" aria-hidden="true"></div>
    <div class="shop-shelf"><i></i><i></i><i></i><i></i></div>
    <div class="shop-menu"><b>ON THE MENU</b><span>Espresso · Latte</span><span>Good coffee. No rush.</span><hr><strong>Fresh batch, coming up.</strong></div>
    <div class="shop-board"><b>WHAT'S ON</b><i>LATTE ART</i><i>LOCAL RIVALS</i></div>
    <div class="shop-plant"><i></i><i></i><i></i><b></b></div>
    <div class="shop-machine"><div class="machine-controls"><i></i><i></i><i></i></div><div class="machine-spouts"></div><div class="machine-cup"></div><span class="coffee-steam"></span></div>
    <div class="shop-counter"><span>COFFEE <b>BOSS</b></span><div class="counter-stripes"></div></div>
    <div class="shop-cups"><i></i><i></i><i></i></div>
    ${spot('locations','spot-street','Neighbourhood',totalIncomePerTick()?`${formatMoney(totalIncomePerTick())}/min income`:'Open your first cart')}
    ${spot('challenges','spot-events','Events & rivals',`${state.challengeTokens} event tokens`)}
    ${spot('crew','spot-crew','Crew',`${state.crew.length} behind the bar`)}
    ${spot('stockroom','spot-gear','Gear & supplies',gear?gear.name:'Stock the shelves')}
    ${spot('shifts','spot-counter','Serve a batch',`${state.energy} Energy ready`)}
    <div class="shop-caption">${cbDistrict(state.district).name} · Your shop</div>
  </div>`;
}

renderHome=function(){
  const goal=cbxHomeObjective();
  return `<div class="shop-home">${shopRoom()}<section class="shop-objective" aria-label="Your next step"><div><span class="scene-kicker">${goal.label}</span><h1>${goal.title}</h1><p>${goal.copy}</p></div><button class="btn primary" data-action="nav" data-page="${goal.action}">${goal.button}${icon('arrow-right')}</button></section><details class="shop-help"><summary>New here? Here's the rhythm.</summary><p>Serve batches for cash and XP. Put that cash into locations for income while you're away. Hire crew and buy gear, then try the rivals and bigger challenges. You decide when to work and when to take a break.</p>${cbxResourceGuide('home')}</details></div>`;
};

// A short briefing leaves most of the workspace for the actual decision.
cbxSceneIntro=function(scene,extras=''){
  const copy={
    shifts:['Pick your next batch','Spend Energy to earn cash and XP. The shop stays open between batches.'],
    rivals:['Who are we taking on?','Green is the rival’s challenge. Gold is your crew. Build the skills you are missing, then take them on.'],
    locations:['A little shop. A bigger town.','Each spot earns cash every minute. Open one, then expand when you can afford it.'],
    stockroom:['Make every cup count','Buy gear once. Your best pieces work automatically, with slots supplied by your crew.'],
    crew:['Room for one more','Each hire adds power and another gear slot.'],
    challenges:['Make a name for yourself','Side events use challenge tokens. Major challenges use Drive, and progress is saved after every attempt.'],
    reserve:['Keep a little tucked away','Rivals can take cash from the till. Money in the safe stays yours.'],
    breakroom:['The next rush can wait','Restore Morale here before facing more pressure.'],
    profile:['Your kind of boss','Spend skill points to improve the way you like to play.']
  }[scene];
  return `<header class="workspace-intro"><h2>${copy[0]}</h2><p>${copy[1]}</p>${extras}${cbxResourceGuide(scene)}</header>`;
};

const shopBaseRender=render;
render=function(){
  const main=document.getElementById('main');
  const oldPage=main.dataset.page;
  const scroll=window.scrollY;
  const active=document.activeElement;
  const focusData=active?.closest('#main')?{action:active.dataset.action,id:active.dataset.id,tab:active.dataset.tab}:null;
  shopBaseRender();
  if(currentPage!=='home'){
    const content=main.innerHTML;
    main.innerHTML=`<section class="shop-workspace" aria-labelledby="workspaceTitle"><header class="workspace-bar"><button class="workspace-back" data-action="nav" data-page="home" aria-label="Back to your shop">${icon('arrow-left')}<span>Shop</span></button><h1 id="workspaceTitle">${shopPageNames[currentPage]||'Your shop'}</h1><span class="workspace-level">LV ${state.level}</span></header><div class="workspace-body">${content}</div></section>`;
    bindPageActions();
    if(oldPage===currentPage)window.scrollTo({top:scroll,behavior:'instant'});
  }
  lucide.createIcons();
  if(oldPage!==currentPage)main.focus({preventScroll:true});
  else if(focusData?.action){
    const candidate=[...main.querySelectorAll('[data-action]')].find(el=>el.dataset.action===focusData.action&&el.dataset.id===focusData.id&&el.dataset.tab===focusData.tab);
    candidate?.focus({preventScroll:true});
  }
};

// Resource labels also teach their use without sending the player to a manual.
const shopResourceHints={energyHud:'Energy pays for shifts. It refills automatically.',driveHud:'Drive pays for rival and major challenges. It refills automatically.',moraleHud:'Morale is how much pressure your crew can take. Low Morale blocks challenges and affects shifts.'};
Object.entries(shopResourceHints).forEach(([id,hint])=>{
  const el=document.getElementById(id);
  el.setAttribute('role','button');el.tabIndex=0;el.title=hint;
  el.setAttribute('aria-label',hint+' Press for details.');
  const explain=()=>{
    const modal=document.getElementById('modal');
    modal.classList.remove('shift-modal','shift-resolving');
    document.getElementById('modalContent').innerHTML=`<section class="event-brief"><h2>Your crew's resources</h2>${cbxResourceGuide('home')}<button class="btn primary" data-resource-close>Got it</button></section>`;
    modal.showModal();
    modal.querySelectorAll('details').forEach(el=>el.open=true);
    modal.querySelector('[data-resource-close]').onclick=()=>modal.close();
    lucide.createIcons();
  };
  el.addEventListener('click',explain);
  el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();explain();}});
});
// One dock on every screen. The room supplies the remaining destinations.
const dock=document.querySelector('.mobile-nav');
dock.setAttribute('aria-label','Game navigation');
dock.innerHTML=[['home','house','Shop'],['shifts','coffee','Serve'],['rivals','swords','Rivals','desktop'],['locations','map','Grow'],['stockroom','package-open','Supplies','desktop'],['crew','users','Crew','desktop'],['challenges','trophy','Events'],['reserve','landmark','Safe','desktop'],['breakroom','heart-pulse','Break room','desktop'],['profile','circle-user-round','Boss','desktop'],['more','menu','More','mobile']].map(([page,ico,name,visibility])=>`<button class="mobile-nav-item ${visibility?`nav-${visibility}-only`:''}" data-nav="${page}" title="${name}">${icon(ico)}<span>${name}</span></button>`).join('')+`<button class="mobile-nav-item nav-desktop-only" data-dock-options title="Save & options">${icon('settings-2')}<span>Options</span></button>`;
dock.querySelector('[data-dock-options]').addEventListener('click',showSettings);
showMoreMenu=function(){
  const modal=document.getElementById('modal');
  modal.classList.remove('shift-modal','shift-resolving');
  document.getElementById('modalContent').innerHTML=`<div class="modal-head"><h2>Around the shop</h2><button class="icon-button" data-close aria-label="Close menu">${icon('x')}</button></div><div class="modal-body settings-grid">${[['rivals','swords','Rivals'],['stockroom','package-open','Gear & supplies'],['crew','users','Crew'],['reserve','landmark','Safe'],['breakroom','heart-pulse','Break room'],['profile','circle-user-round','Boss']].map(([page,ico,name])=>`<button class="btn soft" data-modal-nav="${page}">${icon(ico)}${name}</button>`).join('')}<button class="btn soft" data-game-options>${icon('settings-2')}Save & options</button></div>`;
  modal.showModal();lucide.createIcons();
  modal.querySelector('[data-close]').onclick=()=>modal.close();
  modal.querySelectorAll('[data-modal-nav]').forEach(el=>el.onclick=()=>{modal.close();navigate(el.dataset.modalNav);});
  modal.querySelector('[data-game-options]').onclick=()=>{modal.close();showSettings();};
};
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&!document.querySelector('dialog[open]')&&currentPage!=='home')navigate('home');
});
