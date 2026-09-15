'use strict';

const coffeeEscape=text=>String(text).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let coffeeNotices=[];
const coffeeShowReport=cbxShowActionReport;
cbxShowActionReport=function(report){
  const notes=coffeeNotices.splice(0);
  const copy=[report.copy,...notes.filter(n=>n.type!=='bad').map(n=>coffeeEscape(n.message))].filter(Boolean).join(' ');
  return coffeeShowReport({...report,brief:false,copy});
};
toast=function(message,type=''){
  if(window.cbxActionInFlight){coffeeNotices.push({message,type});return;}
  cbxShowActionReport({title:type==='bad'?'Not quite yet':'Shop update',copy:coffeeEscape(message),icon:type==='bad'?'circle-alert':'circle-check',tone:type==='bad'?'bad':'good',button:'GOT IT'});
};
afterActionFeedback=function(before,context){
  const report=context&&cbxBuildActionReport(context.action,before,context);
  const error=coffeeNotices.find(n=>n.type==='bad');
  if(error){coffeeNotices=[];toast(error.message,'bad');return;}
  cbxShowActionReport(report||{title:'Nothing changed',copy:'Check the amount or resources and try again.',icon:'info',button:'GOT IT'});
};

// Resolve the random roll once; apply no rewards or HUD changes until landing.
// Clicking or pressing Escape reveals that same roll, never another attempt.
function coffeePlayReveal(activity,result,commit){
  if(window.coffeeRevealBusy)return;
  window.coffeeRevealBusy=true;
  coffeeNotices=[];
  const layer=document.createElement('dialog');
  layer.className='action-report-layer challenge-reveal show';
  layer.setAttribute('aria-label',`${activity.name}: resolving`);
  layer.innerHTML=`<section class="action-report reveal-panel"><span class="report-kicker">YOUR CREW IS ON IT</span><h2>${coffeeEscape(activity.name)}</h2><div class="reveal-stage" aria-hidden="true"><div class="reveal-ball"></div><div class="reveal-lane"><span>Missed</span><span>Complete</span><span>Strong</span><span>Best</span></div></div><p>Let’s see how that went.</p><button class="report-continue" type="button">SHOW RESULT ${icon('arrow-right')}</button><span class="reveal-hint">Click anywhere to skip</span></section>`;
  document.body.appendChild(layer);layer.showModal();lucide.createIcons();
  let finished=false,frame=0;
  const finish=()=>{
    if(finished)return;finished=true;cancelAnimationFrame(frame);
    layer.close();layer.remove();
    window.cbxActionInFlight=true;
    try{commit();}finally{window.cbxActionInFlight=false;window.coffeeRevealBusy=false;}
  };
  layer.addEventListener('click',finish);
  layer.addEventListener('cancel',event=>{event.preventDefault();finish();});
  layer.querySelector('button').focus({preventScroll:true});
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){finish();return;}
  const start=performance.now(),ball=layer.querySelector('.reveal-ball');
  const animate=now=>{
    if(finished)return;
    const t=Math.min(1,(now-start)/2100),decay=1-t,target=result.score/100;
    const x=clamp(target+(.5-target)*decay+Math.sin(t*Math.PI*6)*decay*.38,.02,.98);
    const lift=Math.abs(Math.sin(t*Math.PI*4))*decay*88;
    ball.style.left=`${x*100}%`;ball.style.transform=`translate(-50%,${-lift}px)`;
    if(t<1)frame=requestAnimationFrame(animate);else finish();
  };
  frame=requestAnimationFrame(animate);
}
function coffeeRewardTokens(before){
  const tokens=[];
  const cash=state.cash-before.cash;
  if(cash)tokens.push(cbxReportToken('banknote','Cash',`${cash>0?'+':'-'}${formatMoney(Math.abs(cash))}`,'cash'));
  let xp=state.xp-before.xp;
  for(let level=before.level;level<state.level;level++)xp+=xpNeeded(level);
  if(xp>0)tokens.push(cbxReportToken('sparkles','XP',`+${xp}`,'xp'));
  for(const [key,ico,label,tone] of [['energy','zap','Energy','energy'],['drive','flame','Drive','drive'],['morale','heart-pulse','Morale','morale'],['skillPoints','sparkles','Skill points','xp'],['bossPoints','crown','Boss points','xp']]){
    const n=state[key]-before[key];if(n)tokens.push(cbxReportToken(ico,label,`${n>0?'+':''}${n}`,tone));
  }
  return tokens;
}
performShift=function(id){
  if(window.coffeeRevealBusy)return;
  const shift=shifts.find(s=>s.id===id);
  if(!shift||state.level<shift.level)return;
  if(state.energy<shift.energy)return toast('Not enough Energy. Give the crew a minute.','bad');
  const before=resourceSnapshot(),result=coffeeResolveShift(shift);
  coffeePlayReveal(shift,result,()=>{
    const extras=coffeeApplyShiftResult(shift,result);render();
    cbxShowActionReport({title:shift.name,kicker:result.label,tone:result.tier==='miss'?'bad':'good',icon:result.tier==='miss'?'coffee':'circle-check',celebrate:result.tier!=='miss',copy:(result.tier==='miss'?'A rough batch. Practice still counts. Check the gaps in your skills before the next one.':'Another batch served. Your earnings are in the till.')+(extras.loot?` Found ${extras.loot.name}.`:''),tokens:[...coffeeRewardTokens(before),cbxReportToken('badge-check','Mastery',`+${result.mastery}`)],button:'BACK TO THE COUNTER'});
  });
};
cbxEventBrief=function(context){
  if(window.coffeeRevealBusy)return;
  let activity;
  if(context.action==='rival'){
    const rival=rivalList()[Number(context.index)];if(!rival)return;
    if(state.level<rival.level)return toast(`Reach Level ${rival.level} first.`,'bad');
    activity=coffeeRivalProfile(rival);
  }else if(context.action==='boss'){
    const boss=bosses.find(b=>b.id===context.id);if(!boss||state.defeatedBosses.includes(boss.id))return;
    if(state.level<boss.level)return toast(`Reach Level ${boss.level} first.`,'bad');
    activity=coffeeBossProfile(boss);
  }else activity=coffeeEventProfile(context.type);
  if(context.action==='challenge'&&state.challengeTokens<1)return toast('No event tokens left. One returns each hour.','bad');
  if(context.action!=='challenge'){
    if(state.drive<(context.power==='1'?3:1))return toast('Not enough Drive for this attempt.','bad');
    if(state.morale<(context.action==='boss'?10:8))return toast('The crew needs a break first.','bad');
  }
  const before=resourceSnapshot(),result=coffeeActivityRoll(activity),tier=context.action==='challenge'?coffeeEventTier(context.type):0;
  coffeePlayReveal(activity,result,()=>{
    let applied;
    if(context.action==='rival')applied=challengeRival(Number(context.index),result);
    else if(context.action==='boss')applied=bossAttack(context.id,context.power==='1',result);
    else applied=runChallenge(context.type,result);
    if(!applied){toast('This attempt is no longer available.','bad');const error=coffeeNotices.pop();coffeeNotices=[];cbxShowActionReport({title:'Attempt cancelled',copy:error?.message||'No resources were spent.',button:'GOT IT'});return;}
    let report=cbxBuildActionReport(context.action,before,context);
    // Keep the actual challenge outcome foremost, even if it also levels up.
    const won=result.tier!=='miss';
    const tokens=coffeeRewardTokens(before);
    const found=items.filter(i=>(state.inventory[i.id]||0)>(before.inventory[i.id]||0));
    let copy=won?'Your preparation paid off.':'Not this time. Work on the skills where gold falls short of green.';
    let title=won?`${activity.name}: won`:`${activity.name}: missed`,kicker=won?'CHALLENGE WON':'REGROUP';
    let celebrate=won;
    if(context.action==='boss'){
      const boss=bosses.find(b=>b.id===context.id),complete=state.defeatedBosses.includes(boss.id);
      title=complete?`${boss.name} complete`:won?`${applied.progress} progress made`:'No progress this time';
      kicker=complete?'MAJOR CHALLENGE CLEARED':applied.milestones?'MILESTONE REACHED':'CHALLENGE ATTEMPT';
      copy=complete?'You earned this one. The reward and new gear are yours.':`${boss.hp-state.bossDamage[boss.id]} left. ${won?'Your progress is saved.':'Build the missing skills before another attempt.'}`;
      celebrate=complete||applied.milestones>0;
    }else if(context.action==='challenge'){
      copy=won?(tier===10?'You beat the top round. Come back for another shot at the rewards.':`${(state.eventWins[context.type]||0)%3}/3 wins toward the next round.`):copy;
      if(coffeeEventTier(context.type)>tier){kicker='NEXT ROUND UNLOCKED';copy=`Round ${tier} cleared. Round ${tier+1} asks more of your crew and pays better.`;}
    }
    if(found.length)copy+=` Found: ${found.map(i=>i.name).join(', ')}.`;
    cbxShowActionReport({...report,title,kicker,copy,tokens,celebrate,tone:won?'good':'bad',icon:celebrate?'trophy':won?'circle-check':'flag',button:'BACK TO THE SHOP'});
  });
};
