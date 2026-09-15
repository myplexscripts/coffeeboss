'use strict';

// Resolve once at the click; the result is the only interruption.
cbxEventBrief=function(context){
  const before=resourceSnapshot();
  const tokens=state.challengeTokens;
  window.cbxActionInFlight=true;
  try{
    if(context.action==='challenge')runChallenge(context.type);
    if(context.action==='rival')challengeRival(Number(context.index));
    if(context.action==='boss')bossAttack(context.id,context.power==='1');
  }finally{window.cbxActionInFlight=false;}
  const happened=context.action==='challenge'?state.challengeTokens<tokens:state.drive<before.drive;
  if(happened)afterActionFeedback(before,context);
};

performShift=function(id){
  const shift=shifts.find(s=>s.id===id);
  if(!shift||state.level<shift.level)return;
  if(state.energy<shift.energy)return toast('Not enough Energy.','bad');
  const before=resourceSnapshot();
  const result=coffeeResolveShift(shift);
  let extras;
  window.cbxActionInFlight=true;
  try{extras=coffeeApplyShiftResult(shift,result);}finally{window.cbxActionInFlight=false;}
  render();
  const tokens=[cbxReportToken('banknote','Cash',`+${formatMoney(result.cash+extras.masteryReward)}`,'cash'),cbxReportToken('sparkles','XP',`+${result.xp}`,'xp'),cbxReportToken('badge-check','Mastery',`+${result.mastery}`),cbxReportToken('zap','Energy',`-${result.energyCost-result.energyRefund}`,'energy')];
  if(state.level>before.level)tokens.push(cbxReportToken('sparkles','Level',state.level,'xp'));
  if(state.skillPoints>before.skillPoints)tokens.push(cbxReportToken('sparkles','Skill points',`+${state.skillPoints-before.skillPoints}`,'xp'));
  if(state.bossPoints>before.bossPoints)tokens.push(cbxReportToken('crown','Boss points',`+${state.bossPoints-before.bossPoints}`,'xp'));
  cbxShowActionReport({tone:result.tier==='miss'?'bad':'good',celebrate:result.tier!=='miss',icon:result.tier==='miss'?'coffee':'check',kicker:result.label,title:shift.name,copy:(result.tier==='miss'?'A rough batch. You still learned something for next time.':'Another batch served. Your earnings are in the till.')+(extras.loot?` Found: ${extras.loot.name}.`:''),tokens,button:'BACK TO THE COUNTER'});
};

const immediateBuildReport=cbxBuildActionReport;
cbxBuildActionReport=function(action,before,context){
  const report=immediateBuildReport(action,before,context);
  if(!report)return report;
  report.celebrate=action==='rival'?state.rivalsBeaten>before.rivalsBeaten:action==='boss'?state.defeatedBosses.length>before.defeatedBosses.length:!report.brief;
  if(action==='boss'&&!state.defeatedBosses.includes(context.id)){
    const boss=bosses.find(b=>b.id===context.id);
    const progress=(state.bossDamage[context.id]||0)-(before.bossDamage[context.id]||0);
    report.kicker='CHALLENGE PROGRESS';report.title=`${progress} progress made`;
    report.copy=`${Math.max(0,boss.hp-(state.bossDamage[context.id]||0))} left to complete ${boss.name}. Your progress is saved between attempts.`;
  }
  return report;
};
const immediateShowReport=cbxShowActionReport;
cbxShowActionReport=function(report){
  const shown=immediateShowReport(report);
  if(shown&&report?.celebrate&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches){
    const layer=document.querySelector('.action-report-layer');
    if(layer){
      const confetti=document.createElement('div');confetti.className='result-confetti';confetti.setAttribute('aria-hidden','true');
      confetti.innerHTML=Array.from({length:44},(_,i)=>`<i style="--x:${(i*37)%100}%;--delay:${(i%7)*35}ms;--drift:${(i%2?1:-1)*(25+i%70)}px;--colour:${['#e9b65b','#86d7ac','#f3e5c9','#dfa384'][i%4]};--turn:${i*73}deg"></i>`).join('');
      layer.appendChild(confetti);setTimeout(()=>confetti.remove(),1900);
    }
  }
  return shown;
};

// One vocabulary for labels, prose, costs, rewards, HUD and live notifications.
// Accessible names and hover titles keep the symbols learnable.
const resourceSymbols={morale:['heart-pulse','Morale'],energy:['zap','Energy'],drive:['flame','Drive'],cash:['banknote','Cash'],xp:['sparkles','XP'],service:['gauge','Service'],quality:['badge-check','Quality'],'boss point':['crown','Boss point'],'boss points':['crown','Boss points'],'skill point':['sparkles','Skill point'],'skill points':['sparkles','Skill points'],'challenge token':['ticket','Challenge token'],'challenge tokens':['ticket','Challenge tokens']};
const resourceWords=/\b(challenge tokens?|boss points?|skill points?|morale|energy|drive|cash|xp|service|quality)\b/gi;
function symboliseResources(root){
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
  const nodes=[];
  while(walker.nextNode()){
    const node=walker.currentNode;
    if(node.parentElement?.closest('script,style,svg,textarea,option,.resource-symbol,.workspace-scene,.crew-card-copy,.shop-caption'))continue;
    const heading=node.parentElement?.closest('h1,h2,h3');
    if(heading&&[...items,...shifts,...locations,...bosses].some(item=>item.name===heading.textContent))continue;
    resourceWords.lastIndex=0;if(resourceWords.test(node.nodeValue))nodes.push(node);
  }
  for(const node of nodes){
    const fragment=document.createDocumentFragment();let start=0;
    resourceWords.lastIndex=0;
    for(const match of node.nodeValue.matchAll(resourceWords)){
      fragment.append(document.createTextNode(node.nodeValue.slice(start,match.index)));
      const [ico,label]=resourceSymbols[match[0].toLowerCase()];
      const symbol=document.createElement('span');symbol.className='resource-symbol';symbol.dataset.resource=label.toLowerCase().replaceAll(' ','-');symbol.title=label;symbol.setAttribute('role','img');symbol.setAttribute('aria-label',label);symbol.innerHTML=icon(ico);
      fragment.append(symbol);start=match.index+match[0].length;
    }
    fragment.append(document.createTextNode(node.nodeValue.slice(start)));node.replaceWith(fragment);
  }
  // Keep the readout's icon, label and value in explicit layout slots.
  root.querySelectorAll?.('.stage-readout').forEach(el=>{
    const inline=el.querySelector('.readout-label .resource-symbol');
    if(inline){
      const slot=el.querySelector('.readout-icon');
      slot.innerHTML=inline.outerHTML;inline.remove();
      if(!el.querySelector('.readout-label').textContent.trim())el.classList.add('readout-icon-only');
    }
  });
  // Existing resource components already supplied an icon beside their label.
  root.querySelectorAll?.('.resource-chip,.report-token,.status-item,.resource-guide summary,.mission-pay').forEach(el=>{
    if(el.querySelector('.resource-symbol'))Array.from(el.children).filter(c=>c.matches('svg,i[data-lucide]')).forEach(c=>{c.style.display='none';c.setAttribute('aria-hidden','true');});
  });
  if(nodes.length)lucide.createIcons();
}
const resourceObserver=new MutationObserver(records=>{
  resourceObserver.disconnect();
  const roots=new Set();
  for(const record of records){
    if(record.type==='characterData')roots.add(record.target.parentElement);
    else for(const node of record.addedNodes)if(node.nodeType===1)roots.add(node);else if(node.nodeType===3)roots.add(node.parentElement);
  }
  roots.forEach(root=>{if(root?.isConnected)symboliseResources(root);});
  resourceObserver.observe(document.body,{childList:true,subtree:true,characterData:true});
});
symboliseResources(document.body);
resourceObserver.observe(document.body,{childList:true,subtree:true,characterData:true});
