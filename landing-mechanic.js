'use strict';

// The outcome is the landing point itself. The ball is sampled uniformly from
// the required shape, and succeeds only when that exact point is also inside
// the crew's gold shape.
const coffeeBaseTraitHeatmap=coffeeTraitHeatmap;
const coffeeRadarCenter=[120,120];

function coffeeRadarPoint(i,value,radius=86){
  const angle=-Math.PI/2+i*Math.PI*2/coffeeShiftTraits.length;
  return [120+Math.cos(angle)*radius*value/10,120+Math.sin(angle)*radius*value/10];
}

function coffeeRadarPolygon(values,scale=1){
  return coffeeShiftTraits.map((t,i)=>coffeeRadarPoint(i,Math.max(0,values[t.id]*scale)));
}

function coffeePolygonSignedArea(points){
  if(points.length<3)return 0;
  let sum=0;
  for(let i=0;i<points.length;i++){
    const a=points[i],b=points[(i+1)%points.length];
    sum+=a[0]*b[1]-b[0]*a[1];
  }
  return sum/2;
}

function coffeePolygonArea(points){
  return Math.abs(coffeePolygonSignedArea(points));
}

function coffeeCross(a,b,p){
  return (b[0]-a[0])*(p[1]-a[1])-(b[1]-a[1])*(p[0]-a[0]);
}

function coffeeLineIntersection(a,b,c,d){
  const bax=b[0]-a[0],bay=b[1]-a[1],dcx=d[0]-c[0],dcy=d[1]-c[1];
  const denominator=bax*dcy-bay*dcx;
  if(Math.abs(denominator)<1e-9)return b;
  const t=((c[0]-a[0])*dcy-(c[1]-a[1])*dcx)/denominator;
  return [a[0]+t*bax,a[1]+t*bay];
}

function coffeeClipConvex(subject,clip){
  let output=subject.slice();
  const orientation=coffeePolygonSignedArea(clip)>=0?1:-1;
  for(let i=0;i<clip.length;i++){
    const a=clip[i],b=clip[(i+1)%clip.length],input=output;
    output=[];
    if(!input.length)break;
    let previous=input[input.length-1];
    const inside=point=>coffeeCross(a,b,point)*orientation>=-1e-7;
    for(const current of input){
      if(inside(current)){
        if(!inside(previous))output.push(coffeeLineIntersection(previous,current,a,b));
        output.push(current);
      }else if(inside(previous))output.push(coffeeLineIntersection(previous,current,a,b));
      previous=current;
    }
  }
  return output;
}

function coffeePointInPolygon(point,polygon){
  const [x,y]=point;
  let inside=false;
  for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
    const [xi,yi]=polygon[i],[xj,yj]=polygon[j];
    const crosses=(yi>y)!==(yj>y);
    if(crosses&&x<(xj-xi)*(y-yi)/(yj-yi)+xi)inside=!inside;
  }
  return inside;
}

coffeeTraitCoverage=function(requirements,player){
  const required=coffeeRadarPolygon(requirements),crew=coffeeRadarPolygon(player);
  let requiredArea=0,overlapArea=0;
  for(let i=0;i<coffeeShiftTraits.length;i++){
    const next=(i+1)%coffeeShiftTraits.length;
    const requiredTriangle=[coffeeRadarCenter,required[i],required[next]];
    const crewTriangle=[coffeeRadarCenter,crew[i],crew[next]];
    requiredArea+=coffeePolygonArea(requiredTriangle);
    overlapArea+=coffeePolygonArea(coffeeClipConvex(crewTriangle,requiredTriangle));
  }
  const met=coffeeShiftTraits.filter(t=>player[t.id]>=requirements[t.id]-1e-9).length;
  const ratio=requiredArea?clamp(overlapArea/requiredArea,0,1):1;
  const percent=met===coffeeShiftTraits.length?100:Math.min(99,Math.round(ratio*100));
  return {met,percent,ratio};
};

coffeeTraitHeatmap=function(shift){
  return coffeeBaseTraitHeatmap(shift)
    .replace('% of requirements covered.','% landing success area.')
    .replace('% covered</strong>','% success area</strong>')
    .replace('All five skills ready','All required space covered')
    .replace(/(\d) of 5 skills ready/g,'$1 of 5 skill edges reached')
    .replace('Cover the green shape before taking on tougher rounds.','The ball can land anywhere inside green. Any landing inside gold succeeds. Grow gold until it covers green for 100%.');
};

coffeeShiftMatch=function(shift){
  return coffeeTraitCoverage(coffeeShiftRequirements(shift),coffeePlayerTraits(shift)).ratio;
};

function coffeeSampleRequiredLanding(requirements,rng=Math.random){
  const required=coffeeRadarPolygon(requirements);
  const areas=coffeeShiftTraits.map((_,i)=>coffeePolygonArea([
    coffeeRadarCenter,
    required[i],
    required[(i+1)%coffeeShiftTraits.length]
  ]));
  const total=areas.reduce((sum,value)=>sum+value,0);
  let selector=rng()*total,index=0;
  while(index<areas.length-1&&selector>areas[index]){selector-=areas[index];index++;}
  const a=coffeeRadarCenter,b=required[index],c=required[(index+1)%required.length];
  const root=Math.sqrt(rng()),mix=rng();
  return [
    (1-root)*a[0]+root*(1-mix)*b[0]+root*mix*c[0],
    (1-root)*a[1]+root*(1-mix)*b[1]+root*mix*c[1]
  ];
}

function coffeeLaunchDirection(requirements){
  const values=coffeeShiftTraits.map(t=>requirements[t.id]||0);
  const max=Math.max(...values),min=Math.min(...values);
  if(max-min<1e-7)return {x:1,y:0,trait:null};
  let index=0;
  for(let i=1;i<values.length;i++)if(values[i]>values[index]+1e-7)index=i;
  const angle=-Math.PI/2+index*Math.PI*2/coffeeShiftTraits.length;
  return {x:Math.cos(angle),y:Math.sin(angle),trait:coffeeShiftTraits[index].id};
}

function coffeeClosestPointOnSegment(point,a,b){
  const abx=b[0]-a[0],aby=b[1]-a[1];
  const length=abx*abx+aby*aby;
  const t=length?clamp(((point[0]-a[0])*abx+(point[1]-a[1])*aby)/length,0,1):0;
  return [a[0]+abx*t,a[1]+aby*t];
}

function coffeePhysicsTrajectory(requirements,landing,steps=165){
  const polygon=coffeeRadarPolygon(requirements);
  const center=coffeeRadarCenter;
  const launch=coffeeLaunchDirection(requirements);
  const position=[center[0],center[1]];
  const velocity=[launch.x*118,launch.y*118];
  const target=[landing.x??landing[0],landing.y??landing[1]];
  const duration=2.35,dt=duration/steps;
  const points=[{x:position[0],y:position[1]}];

  for(let step=1;step<=steps;step++){
    const progress=step/steps;
    const spring=2.2+70*Math.pow(progress,4);
    const drag=.65+4.8*Math.pow(progress,3);
    velocity[0]+=(target[0]-position[0])*spring*dt;
    velocity[1]+=(target[1]-position[1])*spring*dt;
    const damping=Math.exp(-drag*dt);
    velocity[0]*=damping;velocity[1]*=damping;
    const speed=Math.hypot(velocity[0],velocity[1]);
    if(speed>160){velocity[0]*=160/speed;velocity[1]*=160/speed;}

    let candidate=[position[0]+velocity[0]*dt,position[1]+velocity[1]*dt];
    if(!coffeePointInPolygon(candidate,polygon)){
      let nearest=null;
      for(let i=0;i<polygon.length;i++){
        const a=polygon[i],b=polygon[(i+1)%polygon.length];
        const point=coffeeClosestPointOnSegment(candidate,a,b);
        const dx=candidate[0]-point[0],dy=candidate[1]-point[1],distance=dx*dx+dy*dy;
        if(!nearest||distance<nearest.distance)nearest={distance,point,a,b};
      }
      const edgeX=nearest.b[0]-nearest.a[0],edgeY=nearest.b[1]-nearest.a[1];
      let normalX=-edgeY,normalY=edgeX;
      const normalLength=Math.hypot(normalX,normalY)||1;
      normalX/=normalLength;normalY/=normalLength;
      const toCenterX=center[0]-nearest.point[0],toCenterY=center[1]-nearest.point[1];
      if(toCenterX*normalX+toCenterY*normalY<0){normalX*=-1;normalY*=-1;}
      candidate=[nearest.point[0]+normalX*.75,nearest.point[1]+normalY*.75];
      // At sharp corners one edge normal can still leave the centre outside
      // the adjacent edge. Pull inward only as far as needed to guarantee the
      // whole simulated path remains inside the required polygon.
      for(let safety=0;safety<8&&!coffeePointInPolygon(candidate,polygon);safety++){
        candidate=[(candidate[0]+center[0])*.5,(candidate[1]+center[1])*.5];
      }
      const normalSpeed=velocity[0]*normalX+velocity[1]*normalY;
      if(normalSpeed<0){
        velocity[0]-=(1+.72)*normalSpeed*normalX;
        velocity[1]-=(1+.72)*normalSpeed*normalY;
      }
      velocity[0]*=.96;velocity[1]*=.96;
    }
    position[0]=candidate[0];position[1]=candidate[1];
    points.push({x:position[0],y:position[1]});
  }
  points.push({x:target[0],y:target[1]});
  return points;
}

coffeeActivityRoll=function(shift){
  const requirements=coffeeShiftRequirements(shift),player=coffeePlayerTraits(shift);
  const coverage=coffeeTraitCoverage(requirements,player);
  const landing=coffeeSampleRequiredLanding(requirements);
  const crew=coffeeRadarPolygon(player);
  const success=coverage.met===coffeeShiftTraits.length||coffeePointInPolygon(landing,crew);
  let tier='miss',score=Math.max(3,Math.min(39,Math.round(coverage.percent*.35)));
  if(success){
    if(coffeePointInPolygon(landing,coffeeRadarPolygon(player,.45))){tier='perfect';score=90;}
    else if(coffeePointInPolygon(landing,coffeeRadarPolygon(player,.75))){tier='strong';score=72;}
    else{tier='complete';score=54;}
  }
  return {
    score,
    match:coverage.ratio,
    coverage:coverage.percent,
    success,
    tier,
    landing:{x:landing[0],y:landing[1]},
    launch:coffeeLaunchDirection(requirements)
  };
};

coffeeResolveShift=function(shift){
  const outcome=coffeeActivityRoll(shift);
  const payoutBase=Math.floor(shift.cash[0]+Math.random()*(shift.cash[1]-shift.cash[0]+1));
  const multipliers={
    miss:{cash:0,xp:.42,mastery:.35,label:'SHIFT MISSED',tone:'miss'},
    complete:{cash:1,xp:1,mastery:1,label:'SHIFT COMPLETE',tone:'complete'},
    strong:{cash:1.22,xp:1.16,mastery:1.25,label:'STRONG SHIFT',tone:'strong'},
    perfect:{cash:1.48,xp:1.38,mastery:1.55,label:'PERFECT SHIFT',tone:'perfect'}
  };
  const m=multipliers[outcome.tier];
  return {
    ...outcome,
    shiftId:shift.id,
    label:m.label,
    tone:m.tone,
    cash:Math.floor(payoutBase*m.cash),
    xp:Math.max(1,Math.round(shift.xp*m.xp*Math.max(.25,1-Math.max(0,state.level-shift.level-2)*.10))),
    mastery:Math.max(1,Math.round(shift.mastery*m.mastery)),
    energyCost:shift.energy,
    energyRefund:outcome.tier==='perfect'?Math.max(1,Math.round(shift.energy*.45)):0
  };
};

function coffeeRevealShape(activity,result){
  const requirements=coffeeShiftRequirements(activity),player=coffeePlayerTraits(activity);
  const required=coffeeRadarPolygon(requirements),crew=coffeeRadarPolygon(player);
  const coords=points=>points.map(([x,y])=>`${x.toFixed(2)},${y.toFixed(2)}`).join(' ');
  const coverage=coffeeTraitCoverage(requirements,player);
  return `<div class="reveal-radar-stage" aria-hidden="true" style="width:min(100%,340px);margin:8px auto 4px">
    <svg viewBox="0 0 240 240" style="display:block;width:100%;height:auto;overflow:visible">
      ${[2,4,6,8,10].map(value=>`<polygon class="radar-ring" points="${coords(coffeeShiftTraits.map((_,i)=>coffeeRadarPoint(i,value)))}"/>`).join('')}
      ${coffeeShiftTraits.map((_,i)=>`<line class="radar-spoke" x1="120" y1="120" x2="${coffeeRadarPoint(i,10)[0]}" y2="${coffeeRadarPoint(i,10)[1]}"/>`).join('')}
      <polygon class="radar-crew" points="${coords(crew)}"/>
      <polygon class="radar-required" points="${coords(required)}"/>
      <circle class="reveal-radar-impact" cx="120" cy="120" r="7" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="2" opacity="0"/>
      <circle class="reveal-radar-ball" cx="120" cy="120" r="6" fill="#fffaf2" stroke="#10151d" stroke-width="3"/>
    </svg>
    <div class="radar-legend" style="margin-top:4px"><span class="radar-key required">Required</span><span class="radar-key crew">Your crew</span></div>
    <strong style="display:block;margin-top:8px;text-align:center;font-size:14px;color:var(--text-2)">${coverage.percent}% success area</strong>
  </div>`;
}

coffeePlayReveal=function(activity,result,commit){
  if(window.coffeeRevealBusy)return;
  window.coffeeRevealBusy=true;
  coffeeNotices=[];
  const layer=document.createElement('dialog');
  layer.className='action-report-layer challenge-reveal show';
  layer.setAttribute('aria-label',`${activity.name}: resolving`);
  layer.innerHTML=`<section class="action-report reveal-panel"><span class="report-kicker">YOUR CREW IS ON IT</span><h2>${coffeeEscape(activity.name)}</h2>${coffeeRevealShape(activity,result)}<p>The landing decides it.</p><button class="report-continue" type="button">SHOW RESULT ${icon('arrow-right')}</button><span class="reveal-hint">Click anywhere to skip</span></section>`;
  document.body.appendChild(layer);layer.showModal();lucide.createIcons();

  let finished=false,frame=0;
  const finish=()=>{
    if(finished)return;
    finished=true;
    cancelAnimationFrame(frame);
    layer.close();layer.remove();
    window.cbxActionInFlight=true;
    try{commit();}finally{window.cbxActionInFlight=false;window.coffeeRevealBusy=false;}
  };
  layer.addEventListener('click',finish);
  layer.addEventListener('cancel',event=>{event.preventDefault();finish();});
  layer.querySelector('button').focus({preventScroll:true});
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){finish();return;}

  const requirements=coffeeShiftRequirements(activity);
  const ball=layer.querySelector('.reveal-radar-ball'),impact=layer.querySelector('.reveal-radar-impact');
  const landing=result.landing||{x:120,y:120};
  const trajectory=coffeePhysicsTrajectory(requirements,landing);
  const start=performance.now(),duration=2350,impactDuration=180;

  const animate=now=>{
    if(finished)return;
    const elapsed=now-start;
    const t=clamp(elapsed/duration,0,1);
    const position=t*(trajectory.length-1);
    const index=Math.min(trajectory.length-2,Math.floor(position));
    const local=position-index;
    const from=trajectory[index],to=trajectory[index+1];
    const x=from.x+(to.x-from.x)*local,y=from.y+(to.y-from.y)*local;
    ball.setAttribute('cx',x.toFixed(2));ball.setAttribute('cy',y.toFixed(2));
    const speedPulse=Math.min(1,Math.hypot(to.x-from.x,to.y-from.y)/1.4);
    ball.setAttribute('r',(6+speedPulse*.7).toFixed(2));

    if(t<1){frame=requestAnimationFrame(animate);return;}
    ball.setAttribute('cx',landing.x.toFixed(2));ball.setAttribute('cy',landing.y.toFixed(2));ball.setAttribute('r','6');
    const impactT=clamp((elapsed-duration)/impactDuration,0,1);
    impact.setAttribute('cx',landing.x.toFixed(2));impact.setAttribute('cy',landing.y.toFixed(2));
    impact.setAttribute('r',(8+impactT*18).toFixed(2));
    impact.setAttribute('opacity',(.8*(1-impactT)).toFixed(2));
    if(impactT<1){frame=requestAnimationFrame(animate);return;}
    finish();
  };
  frame=requestAnimationFrame(animate);
};
