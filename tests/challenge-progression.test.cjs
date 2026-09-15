const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
function game(){
  const context=vm.createContext({localStorage:{getItem:()=>null,setItem:()=>{}},performShift:null,renderShifts:null,render:()=>{},toast:()=>{}});
  for(const file of ['data.js','engine.js','shift-system.js','challenge-rules.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),context);
  return code=>vm.runInContext(code,context);
}
function odds(run,expression){return run(`(()=>{const activity=${expression};let wins=0;for(let i=0;i<1000;i++){Math.random=()=>i/1000;if(coffeeActivityRoll(activity).tier!=='miss')wins++;}return wins/10;})()`);}
test('rivals stay fixed while the player grows, and every challenge has a usable radar',()=>{
  const run=game(),before=run('JSON.stringify(rivalList())');
  run('state.level=50;');assert.equal(run('JSON.stringify(rivalList())'),before);
  assert.ok(run(`[...rivalList().map(coffeeRivalProfile),...bosses.map(coffeeBossProfile),...['latte','speed','crate'].map(coffeeEventProfile)].every(p=>coffeeTraitHeatmap(p).includes('radar-required')&&Object.values(p.requirements).every(v=>v>=1&&v<=8.5))`));
});
test('early, middle and late milestones reward preparation instead of level alone',()=>{
  const run=game();
  assert.ok(odds(run,'coffeeRivalProfile(rivalList()[0])')<70);
  assert.equal(odds(run,'coffeeBossProfile(bosses[0])'),0);
  run(`state.level=5;state.jobsCompleted=65;state.service=5;state.quality=5;
    state.crew.push({power:1},{power:1});state.inventory['thermal-carafe']=1;state.inventory['training-cards']=1;`);
  assert.ok(odds(run,'coffeeRivalProfile(rivalList()[0])')>95);
  assert.ok(odds(run,'coffeeBossProfile(bosses[0])')>=50);
  assert.equal(odds(run,'coffeeBossProfile(bosses[2])'),0);
  run(`state.level=20;state.jobsCompleted=300;state.service=15;state.quality=15;
    state.crew=Array.from({length:6},()=>({power:3}));state.inventory['cold-brew-tower']=1;state.inventory['client-book']=1;`);
  assert.ok(odds(run,'coffeeBossProfile(bosses[2])')>=50);
  assert.ok(odds(run,'coffeeBossProfile(bosses[4])')<60);
  run(`state.level=46;state.jobsCompleted=1200;state.service=35;state.quality=35;
    state.crew=Array.from({length:12},()=>({power:5}));state.inventory['precision-brewer']=1;state.inventory['rare-beans']=1;`);
  assert.ok(odds(run,'coffeeBossProfile(bosses[4])')>80);
});
test('major challenges take multiple successful attempts, misses cannot chip away',()=>{
  const run=game();run('state.level=4;state.drive=100;state.morale=100;');
  run(`bossAttack('critic',false,{score:20,tier:'miss'});`);
  assert.equal(run('state.bossDamage.critic'),0);
  run(`state.morale=100;bossAttack('critic',true,{score:98,tier:'perfect'});`);
  assert.ok(run('state.bossDamage.critic')<run('bosses[0].hp')*.4);
  assert.equal(run('state.defeatedBosses.length'),0);
});
test('events advance only on wins; rematches cannot farm first-win rewards',()=>{
  const run=game();run('state.challengeTokens=10;');
  const low=run("coffeeEventProfile('latte').requirements.craft");
  run("runChallenge('latte',{score:20,tier:'miss'});");
  assert.equal(run("coffeeEventTier('latte')"),1);
  run("for(let i=0;i<3;i++)runChallenge('latte',{score:65,tier:'complete'});");
  assert.equal(run("coffeeEventTier('latte')"),2);
  assert.ok(run("coffeeEventProfile('latte').requirements.craft")>low);
  run("state.drive=10;state.morale=100;var startCash=state.cash;challengeRival(0,{score:65,tier:'complete'});var first=state.cash-startCash;var points=state.bossPoints;startCash=state.cash;challengeRival(0,{score:65,tier:'complete'});");
  assert.ok(run('state.cash-startCash')<run('first')*.4);
  assert.equal(run('state.bossPoints'),run('points'));
});
