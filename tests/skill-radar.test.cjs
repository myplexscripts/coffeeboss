const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

function game(save=null){
  const context=vm.createContext({localStorage:{getItem:()=>save},performShift:null,renderShifts:null,render:()=>{},toast:()=>{}});
  for(const file of ['data.js','engine.js','shift-system.js','challenge-rules.js','difficulty-balance.js','landing-mechanic.js']){
    vm.runInContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),context);
  }
  return code=>vm.runInContext(code,context);
}

test('coverage is the actual gold overlap inside the required shape',()=>{
  const run=game();
  run('var required=Object.fromEntries(coffeeShiftTraits.map(t=>[t.id,50]));');
  assert.equal(run('coffeeTraitCoverage(required,required).percent'),100);
  assert.equal(run('coffeeTraitCoverage(required,{...required,speed:49.999}).percent'),99);
  assert.equal(run('coffeeTraitCoverage(required,{...required,speed:0,craft:100,service:100,teamwork:100,composure:100}).percent'),60);
  assert.equal(run('coffeeTraitCoverage(required,{...required,speed:0,craft:100,service:100,teamwork:100,composure:100}).met'),4);
  assert.equal(run('coffeeTraitCoverage(required,Object.fromEntries(coffeeShiftTraits.map(t=>[t.id,25]))).percent'),25);
});

test('all sampled ball landings stay inside the required shape',()=>{
  const run=game();
  const allInside=run(`(()=>{
    const required={speed:4,craft:7,service:5,teamwork:8,composure:3};
    const polygon=coffeeRadarPolygon(required);
    let seed=987654321;
    Math.random=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
    for(let i=0;i<2000;i++)if(!coffeePointInPolygon(coffeeSampleRequiredLanding(required),polygon))return false;
    return true;
  })()`);
  assert.equal(allInside,true);
});

test('the sampled landing point itself decides success',()=>{
  const run=game();
  run('state.level=5;state.jobsCompleted=30;');
  const consistent=run(`(()=>{
    const shift=shifts[4],player=coffeePlayerTraits(shift),gold=coffeeRadarPolygon(player);
    let seed=246813579;
    Math.random=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
    for(let i=0;i<1000;i++){
      const result=coffeeActivityRoll(shift);
      const inside=coffeePointInPolygon([result.landing.x,result.landing.y],gold);
      if(result.success!==inside)return false;
      if((result.tier!=='miss')!==inside)return false;
    }
    return true;
  })()`);
  assert.equal(consistent,true);
});

test('physics launch aims at the highest requirement and defaults right when pressure is even',()=>{
  const run=game();
  const equal=run('coffeeLaunchDirection({speed:2,craft:2,service:2,teamwork:2,composure:2})');
  assert.ok(equal.x>.999);
  assert.ok(Math.abs(equal.y)<1e-7);
  assert.equal(equal.trait,null);
  const craft=run('coffeeLaunchDirection({speed:2,craft:5,service:2,teamwork:2,composure:2})');
  assert.equal(craft.trait,'craft');
  assert.ok(craft.x>0&&craft.y<0);
});

test('physics trajectory remains inside green and begins along the launch vector',()=>{
  const run=game();
  const result=run(`(()=>{
    const required={speed:2,craft:5,service:3,teamwork:2.5,composure:2};
    const launch=coffeeLaunchDirection(required),path=coffeePhysicsTrajectory(required,{x:120,y:120});
    const polygon=coffeeRadarPolygon(required),first=path[1];
    const initialDot=(first.x-120)*launch.x+(first.y-120)*launch.y;
    return {initialDot,inside:path.every(p=>coffeePointInPolygon([p.x,p.y],polygon))};
  })()`);
  assert.ok(result.initialDot>0);
  assert.equal(result.inside,true);
});

test('all batches render two finite five-point shapes without changing state',()=>{
  const run=game();
  for(const level of [1,20,50]){
    run(`state.level=${level};`);
    const before=run('JSON.stringify(state)');
    const charts=run('shifts.map(s=>coffeeTraitHeatmap(s))');
    for(const chart of charts){
      assert.equal((chart.match(/class="radar-axis /g)||[]).length,5);
      for(const type of ['crew','required']){
        const points=chart.match(new RegExp(`class="radar-${type}" points="([^"]+)"`))[1].split(' ');
        assert.equal(points.length,5);
        assert.ok(points.flatMap(p=>p.split(',')).every(n=>Number.isFinite(+n)&&+n>=0&&+n<=240));
      }
      assert.ok(!chart.includes('NaN'));
      assert.match(chart,/role="img" aria-label="\d+% landing success area/);
      assert.match(chart,/\d+% success area/);
    }
    assert.equal(run('JSON.stringify(state)'),before);
  }
});

test('crew upgrades and morale changes update the chart from real game values',()=>{
  const run=game();
  run('state.level=5;state.jobsCompleted=30;');
  const initial=run('coffeePlayerTraits(shifts[0])');
  run('state.service+=5;state.quality+=5;state.crew.push({name:"Test",power:3});state.morale=20;');
  const changed=run('coffeePlayerTraits(shifts[0])');
  for(const trait of ['speed','craft','service','teamwork']) assert.ok(changed[trait]>initial[trait]);
  assert.ok(changed.composure<initial.composure);
});

test('fresh serves are possible but never automatic',()=>{
  const run=game();
  assert.ok(run('Object.values(coffeePlayerTraits(shifts[0])).every(v=>v===1)'));
  const coverage=run('shifts.slice(0,5).map(s=>coffeeTraitCoverage(coffeeShiftRequirements(s),coffeePlayerTraits(s)).percent)');
  assert.ok(coverage[0]>=58&&coverage[0]<=70,`regulars ${coverage[0]}%`);
  assert.ok(coverage[1]>=40&&coverage[1]<=55,`morning ${coverage[1]}%`);
  assert.ok(coverage[2]<40);
  assert.ok(coverage[4]<25);
  run('state.level=5;');
  const catering=run('coffeeTraitCoverage(coffeeShiftRequirements(shifts[4]),coffeePlayerTraits(shifts[4])).percent');
  assert.ok(catering>10&&catering<40,`catering ${catering}%`);
});

function outcomes(run,index,count=4000){
  return run(`(()=>{
    let seed=123456789,wins=0,perfect=0;
    Math.random=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
    for(let i=0;i<${count};i++){
      const r=coffeeActivityRoll(shifts[${index}]);
      if(r.tier!=='miss')wins++;
      if(r.tier==='perfect')perfect++;
    }
    return {wins,perfect};
  })()`);
}

test('observed success tracks the displayed gold overlap and improves with investment',()=>{
  const run=game();
  for(const index of [0,1,4,10]){
    const expected=run(`coffeeTraitCoverage(coffeeShiftRequirements(shifts[${index}]),coffeePlayerTraits(shifts[${index}])).percent`);
    const result=outcomes(run,index);
    const observed=result.wins/40;
    assert.ok(Math.abs(observed-expected)<=4,`shift ${index}: expected ${expected}, observed ${observed}`);
  }
  const before=run('coffeeTraitCoverage(coffeeShiftRequirements(shifts[4]),coffeePlayerTraits(shifts[4])).percent');
  run(`state.level=5;state.jobsCompleted=45;state.service=5;state.quality=5;
    state.crew.push({name:'Test',power:1},{name:'Test2',power:1});
    state.inventory['training-cards']=1;state.inventory['thermal-carafe']=1;`);
  const after=run('coffeeTraitCoverage(coffeeShiftRequirements(shifts[4]),coffeePlayerTraits(shifts[4])).percent');
  assert.ok(after>before);
  const improved=outcomes(run,4);
  assert.ok(Math.abs(improved.wins/40-after)<=4);
});

test('legacy saves keep earned upgrades and migrate only once',()=>{
  const run=game(JSON.stringify({service:9,quality:7,cash:1234,level:5}));
  assert.equal(run('state.service'),5);
  assert.equal(run('state.quality'),3);
  assert.equal(run('state.cash'),1234);
  const again=game(run('JSON.stringify(state)'));
  assert.equal(again('state.service'),5);
  assert.equal(again('state.quality'),3);
});

test('a fully developed crew reaches 100 percent and cannot miss old content',()=>{
  const run=game();
  run(`state.level=60;state.service=100;state.quality=100;state.jobsCompleted=2500;
    state.crew=Array.from({length:30},()=>({power:6}));state.shiftMastery.airline=1000;`);
  assert.equal(run('coffeeTraitCoverage(coffeeShiftRequirements(shifts[13]),coffeePlayerTraits(shifts[13])).percent'),100);
  const result=outcomes(run,13,1000);
  assert.equal(result.wins,1000);
  assert.ok(result.perfect>0);
});
