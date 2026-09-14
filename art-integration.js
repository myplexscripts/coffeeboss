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
  if(typeof renderCrew==='function') renderCrew=wrap('crew',renderCrew);
  if(typeof renderChallenges==='function') renderChallenges=wrap('challenges',renderChallenges);
  if(typeof renderBreakroom==='function') renderBreakroom=wrap('breakroom',renderBreakroom);
})();
