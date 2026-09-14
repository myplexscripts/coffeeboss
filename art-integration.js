'use strict';

(function(){
  const wrap = (name, original, selector='') => function(...args){
    const html = original(...args);
    if(html.includes('scene-art')) return html;
    if(selector && html.includes(selector)) return html.replace(selector, `${selector}${cbSceneArt(name)}`);
    return `<div class="game-screen art-screen art-screen-${name}">${cbSceneArt(name)}${html}</div>`;
  };

  if(typeof renderShifts==='function') renderShifts=wrap('shifts',renderShifts,'<div class="game-screen shifts-screen">');
  if(typeof renderRivals==='function') renderRivals=wrap('rivals',renderRivals);
  if(typeof renderLocations==='function') renderLocations=wrap('locations',renderLocations);
  if(typeof renderStockroom==='function') renderStockroom=wrap('stockroom',renderStockroom);

  if(typeof renderCrew==='function'){
    const originalCrew=renderCrew;
    renderCrew=function(...args){
      const cost=Math.floor(300*Math.pow(1.55,state.crew.length-1));
      return `<div class="game-screen art-screen art-screen-crew">
        <div class="crew-topline"><div></div><button class="btn primary" data-action="recruit" ${state.cash<cost?'disabled':''}>${icon('user-plus')} Recruit · ${formatMoney(cost)}</button></div>
        ${cbSceneArt('crew')}
        ${originalCrew(...args)}
      </div>`;
    };
  }

  if(typeof renderChallenges==='function') renderChallenges=wrap('challenges',renderChallenges);
  if(typeof renderBreakroom==='function') renderBreakroom=wrap('breakroom',renderBreakroom);
})();
