'use strict';

document.addEventListener('click',e=>{
  const nav=e.target.closest('[data-nav]');
  if(nav){ const p=nav.dataset.nav; if(p==='more')showMoreMenu(); else navigate(p); }
});
document.getElementById('saveButton').addEventListener('click',()=>saveState());
document.getElementById('settingsButton').addEventListener('click',showSettings);
window.addEventListener('beforeunload',()=>saveState(true));
setInterval(()=>{ updateTimers(); saveState(true); renderStats(); coffeeRefreshRadars(); },10000);
setInterval(()=>{ if(currentPage==='home'||currentPage==='breakroom') render(); },60000);

render();
if(!state.bossStyle) setTimeout(showBossStyle,120);
