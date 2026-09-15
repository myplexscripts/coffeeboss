const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {JSDOM}=require('jsdom');
function game(reduced=false){
  const root=path.join(__dirname,'..'),html=fs.readFileSync(path.join(root,'index.html'),'utf8');
  const dom=new JSDOM(html,{url:'https://coffeeboss.test',runScripts:'outside-only',pretendToBeVisual:true});
  const w=dom.window,frames=new Map();let id=0;
  w.matchMedia=()=>({matches:reduced});w.scrollTo=()=>{};
  w.setInterval=()=>0;w.requestAnimationFrame=callback=>{frames.set(++id,callback);return id;};w.cancelAnimationFrame=id=>frames.delete(id);
  w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;};
  w.lucide={createIcons(){w.document.querySelectorAll('i[data-lucide]').forEach(el=>{const svg=w.document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('data-lucide',el.dataset.lucide);el.replaceWith(svg);});}};
  const run=code=>vm.runInContext(code,dom.getInternalVMContext());
  for(const match of html.matchAll(/<script src="([^"?]+)(?:\?[^\"]*)?"/g)){
    if(match[1].startsWith('http'))continue;
    if(match[1]==='app.js')run("state.bossStyle='operator';");
    run(fs.readFileSync(path.join(root,match[1]),'utf8'));
  }
  return {dom,w,run,frames};
}
test('all pages render; challenges share radar previews and workspaces have no header art',()=>{
  const {dom,w,run}=game();
  for(const page of ['home','shifts','rivals','locations','stockroom','crew','challenges','reserve','breakroom','profile']){
    run(`currentPage='${page}';render();`);
    assert.equal(w.document.querySelectorAll('.workspace-scene').length,0);
    if(['shifts','rivals','challenges'].includes(page))assert.ok(w.document.querySelectorAll('.skill-radar').length>=3);
    if(page==='home')assert.ok(w.document.querySelector('.shop-room'));
    else assert.equal(w.document.querySelector('.shop-backdrop'),null);
  }
  run('resourceObserver.disconnect();');dom.window.close();
});
test('result stays uncommitted and unspoiled until skip; double skip spends only once',()=>{
  const {dom,w,run}=game();
  const before=run('JSON.stringify(state)');run("performShift('open');");
  assert.equal(run('JSON.stringify(state)'),before);
  assert.ok(w.document.querySelector('.challenge-reveal'));
  assert.equal(w.document.querySelector('.report-tokens'),null);
  assert.ok(!w.document.querySelector('.challenge-reveal').textContent.includes('PERFECT SHIFT'));
  run("performShift('open');");assert.equal(w.document.querySelectorAll('.challenge-reveal').length,1);
  const skip=w.document.querySelector('.challenge-reveal button');skip.click();skip.click();
  assert.equal(run('state.jobsCompleted'),1);
  assert.equal(run('window.coffeeRevealBusy'),false);
  assert.ok(w.document.querySelector('.report-tokens'));
  assert.equal(w.document.querySelector('.challenge-reveal'),null);
  run('resourceObserver.disconnect();');dom.window.close();
});
test('automatic landing, Escape and reduced motion reveal one result each',()=>{
  for(const mode of ['landing','escape','reduced']){
    const {dom,w,run,frames}=game(mode==='reduced');run("performShift('open');");
    if(mode==='landing'){for(const callback of [...frames.values()])callback(w.performance.now()+3000);}
    if(mode==='escape')w.document.querySelector('.challenge-reveal').dispatchEvent(new w.Event('cancel',{cancelable:true}));
    assert.equal(run('state.jobsCompleted'),1,mode);
    assert.ok(w.document.querySelector('.report-tokens'),mode);
    run('resourceObserver.disconnect();');dom.window.close();
  }
});
test('rivals, major challenges and each event use the same reveal before spending',()=>{
  for(const context of [{action:'rival',index:'0'},{action:'boss',id:'critic',power:'0'},{action:'challenge',type:'latte'},{action:'challenge',type:'speed'},{action:'challenge',type:'crate'}]){
    const {dom,w,run}=game();run('state.level=5;');const before=run('JSON.stringify(state)');
    run(`cbxEventBrief(${JSON.stringify(context)});`);
    assert.equal(run('JSON.stringify(state)'),before);
    w.document.querySelector('.challenge-reveal button').click();
    assert.notEqual(run('JSON.stringify(state)'),before);
    assert.ok(w.document.querySelector('.action-report-layer:not(.challenge-reveal)'));
    assert.equal(w.document.querySelectorAll('.toast').length,0);
    run('resourceObserver.disconnect();');dom.window.close();
  }
});
test('routine purchases and validation messages use full result dialogs',()=>{
  const {dom,w,run,frames}=game();run("currentPage='stockroom';currentTab='shop';render();");
  w.document.querySelector('[data-action="buy-item"]').click();
  for(const callback of [...frames.values()])callback(w.performance.now());
  assert.ok(w.document.querySelector('.action-report-layer').textContent.includes('on the shelf'));
  run("toast('Not enough Energy.','bad');");
  assert.ok(w.document.querySelector('.action-report-layer').textContent.includes('Not enough'));
  assert.equal(w.document.querySelectorAll('.toast').length,0);
  run('resourceObserver.disconnect();');dom.window.close();
});
