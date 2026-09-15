const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

function game(){
  const context=vm.createContext({localStorage:{getItem:()=>null},performShift:null,renderShifts:null});
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
  const initial=run('coffeePlayerTraits(shifts[0])');
  run('state.service+=5;state.quality+=5;state.crew.push({name:"Test",power:3});state.morale=20;');
  const changed=run('coffeePlayerTraits(shifts[0])');
  for(const trait of ['speed','craft','service','teamwork']) assert.ok(changed[trait]>initial[trait]);
  assert.ok(changed.composure<initial.composure);
});
