const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

function game(save=null){
  const context=vm.createContext({localStorage:{getItem:()=>save},performShift:null,renderShifts:null});
  for(const file of ['data.js','engine.js','shift-system.js']){
    vm.runInContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),context);
  }
  return code=>vm.runInContext(code,context);
}

test('coverage reaches 100 only when every requirement is met',()=>{
  const run=game();
  run('var required=Object.fromEntries(coffeeShiftTraits.map(t=>[t.id,50]));');
  assert.equal(run('coffeeTraitCoverage(required,required).percent'),100);
  assert.equal(run('coffeeTraitCoverage(required,{...required,speed:49.999}).percent'),99);
  assert.equal(run('coffeeTraitCoverage(required,{...required,speed:0,craft:100}).percent'),80);
  assert.equal(run('coffeeTraitCoverage(required,{...required,speed:0,craft:100}).met'),4);
  assert.equal(run('coffeeTraitCoverage(required,Object.fromEntries(coffeeShiftTraits.map(t=>[t.id,25]))).percent'),50);
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
      assert.match(chart,/role="img" aria-label="\d+% of requirements covered/);
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

test('fresh skills start at one, and later batches need preparation',()=>{
  const run=game();
  assert.ok(run('Object.values(coffeePlayerTraits(shifts[0])).every(v=>v===1)'));
  assert.equal(run('state.service'),1);
  assert.equal(run('state.quality'),1);
  const coverage=run('shifts.slice(0,5).map(s=>coffeeTraitCoverage(coffeeShiftRequirements(s),coffeePlayerTraits(s)).percent)');
  assert.equal(coverage[0],100);
  assert.ok(coverage[1]<80);
  assert.ok(coverage[4]<50);
  run('state.level=5;');
  assert.ok(run('coffeeTraitCoverage(coffeeShiftRequirements(shifts[4]),coffeePlayerTraits(shifts[4])).percent')<65);
});

function outcomes(run,index){
  return run(`(()=>{let wins=0,perfect=0;for(let i=0;i<1000;i++){Math.random=()=>i/1000;const r=coffeeResolveShift(shifts[${index}]);if(r.tier!=='miss')wins++;if(r.tier==='perfect')perfect++;}return {wins,perfect};})()`);
}

test('starter batch is reliable, tougher batches improve through investment',()=>{
  const run=game();
  assert.equal(outcomes(run,0).wins,1000);
  assert.equal(outcomes(run,0).perfect,0);
  assert.equal(outcomes(run,4).wins,0);
  const morning=outcomes(run,1);
  assert.ok(morning.wins>=250&&morning.wins<=650);
  run(`state.level=5;state.jobsCompleted=45;state.service=5;state.quality=5;
    state.crew.push({name:'Test',power:1},{name:'Test2',power:1});
    state.inventory['training-cards']=1;state.inventory['thermal-carafe']=1;`);
  assert.ok(outcomes(run,4).wins>=750);
  assert.ok(outcomes(run,4).perfect<500);
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

test('a fully developed crew can earn perfect results even on the final batch',()=>{
  const run=game();
  run(`state.level=60;state.service=100;state.quality=100;state.jobsCompleted=2500;
    state.crew=Array.from({length:30},()=>({power:6}));state.shiftMastery.airline=1000;`);
  const result=outcomes(run,13);
  assert.equal(result.wins,1000);
  assert.ok(result.perfect>0&&result.perfect<500);
});
