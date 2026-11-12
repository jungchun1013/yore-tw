const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
const {clickCell}=require('./board-helper.cjs');
const {checkSkillButtons}=require('./research-helper.cjs');
let Game,MAPS,TOWERS,RESEARCH,simulate,plan;
test.beforeAll(async()=>{({Game,MAPS,TOWERS,RESEARCH}=await (new Function('p','return import(p)'))(require('node:url').pathToFileURL(require('node:path').resolve(__dirname,'../src/engine.mjs')).href));({simulate,plan}=await (new Function('p','return import(p)'))(require('node:url').pathToFileURL(require('node:path').resolve(__dirname,'../sim/balance.mjs')).href));});

test('combat rules, money conservation, map validity and difficulty baselines',()=>{
 for(const map of MAPS){const g=new Game({map:map.id});expect(g.build('pulse',...g.path[0])).toBe(false);const p=[2,6];const before=g.cash;const t=g.build('pulse',...p);expect(t).toBeTruthy();expect(g.build('pulse',...p)).toBe(false);expect(g.upgrade(t)).toBe(true);const spent=t.spent;expect(g.sell(t)).toBe(true);expect(g.cash).toBe(before-spent+Math.floor(spent*.75));expect(g.sell(t)).toBe(false);}
 for(const m of MAPS){expect(simulate(m.id,'calm','pulse').state).toBe('won');expect(simulate(m.id,'normal','mixed').state).toBe('won');expect(simulate(m.id,'normal','empty').state).toBe('lost');}
 const clear=new Game();const slowed=new Game();clear.startWave();slowed.startWave();clear.spawn();slowed.spawn();slowed.enemies[0].slow=.5;slowed.enemies[0].slowUntil=100;clear.tick(.1);slowed.tick(.1);expect(slowed.enemies[0].progress).toBeLessThan(clear.enemies[0].progress);
 const b=new Game({research:['power','reach','tempo']});const tower=b.build('pulse',2,6);expect(b.stats(tower).damage).toBeGreaterThan(TOWERS.pulse.damage);expect(b.stats(tower).range).toBeGreaterThan(TOWERS.pulse.range);
});

test('player can research, build, upgrade, pause, survive a wave, sell and restart',async({page},info)=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.addInitScript(()=>{if(!sessionStorage.getItem('prism-test-boot')){localStorage.clear();sessionStorage.setItem('prism-test-boot','1');}});await page.goto('/');
 await expect(page.locator('#setup')).toBeVisible();await page.click('#setup-lab');await page.click('#research-tree [data-research="power"]');await page.click('#research-upgrade');await expect(page.locator('#research-tree [data-research="power"]')).toHaveClass(/learned/);await page.click('#research-tree [data-research="critical"]');await expect(page.locator('#research-upgrade')).toBeDisabled();await page.click('[data-close="research"]');await page.click('#begin');
 const board=page.locator('#board');const cell=(x,y)=>clickCell(board,x,y);
 await expect(board).toHaveAttribute('data-projection','isometric');
 await board.click({position:{x:20,y:20}});expect(await page.evaluate(()=>window.__prism.game.towers.length)).toBe(0);
 await cell(0,3);expect(await page.evaluate(()=>window.__prism.game.towers.length)).toBe(0);
 await cell(3,2);await clickCell(board,3,2,-22);expect(await page.evaluate(()=>window.__prism.game.towers.length)).toBe(1);await expect(page.locator('#details')).toContainText('Lv.1');await page.click('#upgrade');await expect(page.locator('#details')).toContainText('Lv.2');
 await page.click('[data-build="pulse"]');await cell(6,4);await page.click('#next');await page.click('#pause');expect(await page.evaluate(()=>window.__prism.paused)).toBe(true);const time=await page.evaluate(()=>window.__prism.game.time);await page.waitForTimeout(250);expect(await page.evaluate(()=>window.__prism.game.time)).toBe(time);await page.click('#pause');await page.click('#speed');await page.click('#speed');
 await page.evaluate(()=>{const g=window.__prism.game;for(let i=0;i<2400&&g.state==='running';i++)g.tick(1/60);});
 await expect.poll(()=>page.evaluate(()=>window.__prism.game.state)).toBe('planning');await expect(page.locator('#next')).toContainText('第 2 波');
 await page.click('#lab');await page.click('#respec');await expect(page.locator('#lab-balance')).toContainText('3');await page.click('[data-close="research"]');
 await cell(3,2);const cash=await page.evaluate(()=>window.__prism.game.cash);await page.click('#sell');expect(await page.evaluate(()=>window.__prism.game.cash)).toBeGreaterThan(cash);
 await board.focus();await page.keyboard.press('Escape');await page.keyboard.press('ArrowRight');await page.keyboard.press('Enter');expect(await page.evaluate(()=>window.__prism.game.towers.some(t=>t.x===8&&t.y===5))).toBe(true);
 await page.click('#restart');await page.click('[data-map="switch"]');await page.click('[data-difficulty="hard"]');await page.click('#begin');await expect(page.locator('#map-name')).toContainText('交錯 / 過載');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.click('[data-build="chain"]');await cell(8,6);await page.click('#next');await page.evaluate(()=>{const g=window.__prism.game;for(let i=0;i<250;i++)g.tick(1/60);});
 const shots=require('node:path').resolve(__dirname,'../screenshots');fs.mkdirSync(shots,{recursive:true});await page.screenshot({path:shots+`/${info.project.name}.png`,fullPage:true});expect(errors).toEqual([]);
});

test('victory, defeat and persistent research rewards use actual combat',async({page})=>{
 await page.addInitScript(()=>{if(!sessionStorage.getItem('prism-test-boot')){localStorage.clear();sessionStorage.setItem('prism-test-boot','1');}});await page.goto('/');await page.click('#begin');
 await page.evaluate(async()=>{const {plan}=await (new Function('return import("/sim/balance.mjs")'))();const g=window.__prism.game;let steps=0;while(!['lost','won'].includes(g.state)&&steps++<100000){if(g.state==='planning'){plan(g);g.startWave();}g.tick(.05);g.effects.length=0;}});
 await expect(page.locator('#result')).toContainText('守住了');expect(await page.evaluate(()=>window.__prism.save.cores)).toBe(17);
 await page.click('#retry');await page.click('#begin');await page.evaluate(()=>{const g=window.__prism.game;for(let i=0;i<5000&&g.state!=='lost';i++){if(g.state==='planning')g.startWave();g.tick(.05);g.effects.length=0;}});await expect(page.locator('#result')).toContainText('失守');
 await page.reload();await page.click('#setup-lab');await expect(page.locator('#lab-balance')).toContainText('17');
});

test('warm frameless artwork renders all six objects and the research tree',async({page},info)=>{
 await page.goto('/');await page.click('#begin');await expect(page.locator('#board')).toHaveAttribute('data-art','painted');
 for(const type of ['pulse','cannon','frost','beam','chain','bloom']){
  const atlas=await page.locator('.tower-grid .object-'+type).evaluate(e=>getComputedStyle(e).backgroundImage);
  expect(atlas).toContain(type==='cannon'?'towers-original-trim-l2-r1.png':type==='chain'?'towers-mixed-v4.png':'towers-pixel-v2.png');
 }
 expect(await page.locator('body').evaluate(e=>getComputedStyle(e).backgroundColor)).toBe('rgb(43, 46, 51)');
 for(const selector of ['.board-wrap','.panel','.tower-button','button'])expect(await page.locator(selector).evaluateAll(nodes=>nodes.every(n=>getComputedStyle(n).borderTopWidth==='0px'))).toBe(true);
 await page.evaluate(async()=>{const{plan}=await(new Function('return import("/sim/balance.mjs")'))();const g=window.__prism.game;let n=0;while(g.wave<7||g.state==='running'){if(++n>100000)throw Error('scenario failed');if(g.state==='planning'){plan(g);g.startWave();}g.tick(.05);g.effects.length=0;}for(const t of [...g.towers])g.sell(t);for(const[type,x,y]of[['pulse',4,2],['cannon',6,6],['frost',4,7],['beam',9,7],['chain',10,5],['bloom',8,9]]){if(!g.build(type,x,y))throw Error('Cannot build review object '+type);}g.startWave();for(let i=0;i<220;i++){g.tick(.05);g.effects.length=0;}});
 await clickCell(page.locator('#board'),4,2);
 const shots=require('node:path').resolve(__dirname,'../screenshots');fs.mkdirSync(shots,{recursive:true});await expect(page.locator('#toast')).not.toHaveClass(/visible/);await page.screenshot({path:shots+`/warm-${info.project.name}.png`,fullPage:true});
 await page.click('#lab');await expect(page.locator('#research')).toBeVisible();await expect(page.locator('.node')).toHaveCount(15);await page.screenshot({path:shots+`/research-${info.project.name}.png`,fullPage:true});
});

test('isometric projection and diamond hit testing agree across the entire board',async()=>{
 const {project,unproject,screenToCell,cellCenter,groundRadius}=await(new Function('p','return import(p)'))(require('node:url').pathToFileURL(require('node:path').resolve(__dirname,'../src/projection.mjs')).href);
 expect(project(0,0)).toEqual({x:234,y:54});expect(project(576,384)).toEqual({x:342,y:324});
 for(let x=0;x<18;x++)for(let y=0;y<12;y++){
  expect(screenToCell(...Object.values(cellCenter(x,y)))).toEqual({x,y});
  for(const [dx,dy]of[[.02,.02],[.98,.02],[.02,.98],[.98,.98]]){
   const original={x:(x+dx)*32,y:(y+dy)*32},p=project(original.x,original.y),q=unproject(p.x,p.y);
   expect(q.x).toBeCloseTo(original.x,8);expect(q.y).toBeCloseTo(original.y,8);expect(screenToCell(p.x,p.y)).toEqual({x,y});
  }
 }
 for(const [x,y]of[[0,0],[575,0],[0,383],[575,383]])expect(screenToCell(x,y)).toBeNull();
 const r=groundRadius(100);expect(r.x/r.y).toBeCloseTo(2);
});

test('skill icons inspect freely, upgrade explicitly, enforce requirements and retain progress',async({page},info)=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');await page.click('#setup-lab');
 await expect(page.locator('#research h2')).toHaveText('技能樹');await checkSkillButtons(page);
 const node=id=>page.locator('#research-tree [data-research="'+id+'"]');const balance=page.locator('#lab-balance'),upgrade=page.locator('#research-upgrade');
 await expect(node('power')).toHaveAttribute('aria-pressed','true');await expect(balance).toContainText('可用晶核 3');
 for(const id of await page.locator('#research-tree .node').evaluateAll(buttons=>buttons.map(b=>b.dataset.research))){await node(id).click({timeout:5000});await expect(node(id)).toHaveAttribute('aria-pressed','true');}await expect(balance).toContainText('可用晶核 3');
 await node('critical').click();await expect(page.locator('#research-detail')).toContainText('每五次攻擊，傷害加倍');await expect(upgrade).toBeDisabled();await expect(balance).toContainText('可用晶核 3');
 await page.locator('#research-detail [data-research="pierce"]').click();await expect(node('pierce')).toHaveAttribute('aria-pressed','true');await expect(page.locator('#research-detail')).toContainText('一般攻擊忽略 20% 護甲');
 await node('power').focus();await page.keyboard.press('Enter');await expect(upgrade).toBeEnabled();await expect(balance).toContainText('可用晶核 3');await upgrade.click();await expect(balance).toContainText('可用晶核 2');await expect(node('power')).toHaveClass(/learned/);await expect(upgrade).toBeDisabled();
 await node('tempo').click();await expect(upgrade).toBeEnabled();await upgrade.click();await expect(balance).toContainText('可用晶核 0');await node('reach').click();await expect(upgrade).toContainText('還差 1 顆晶核');await expect(upgrade).toBeDisabled();
 for(const id of ['power','tempo'])expect(await node(id).locator('.skill-hex path').evaluate(e=>getComputedStyle(e).fill)).toBe('rgb(234, 219, 149)');expect(await node('reach').locator('.skill-hex path').evaluate(e=>getComputedStyle(e).fill)).toBe('rgb(124, 140, 99)');await page.evaluate(()=>document.fonts.ready);await page.screenshot({path:require('node:path').resolve(__dirname,`../screenshots/research-enabled-${info.project.name}.png`),fullPage:true});
 await page.reload();await page.click('#setup-lab');await expect(balance).toContainText('已完成 2 / 15');await expect(node('tempo')).toHaveClass(/learned/);
 await page.click('#respec');await expect(balance).toContainText('可用晶核 3');await expect(balance).toContainText('已完成 0 / 15');await expect(node('tempo')).toHaveClass(/locked/);await expect(page.locator('#respec')).toBeDisabled();
 await node('reach').click();await expect(upgrade).toBeEnabled();await page.evaluate(()=>document.fonts.ready);await expect.poll(()=>page.locator('.research-art').evaluate(e=>e.complete&&e.naturalWidth>0)).toBe(true);expect((await page.request.get('/art/research-icons-flat-v3.png')).ok()).toBe(true);
 const shots=require('node:path').resolve(__dirname,'../screenshots');await page.screenshot({path:shots+`/research-interactive-${info.project.name}.png`,fullPage:true});
 expect(await page.locator('#research').evaluate(e=>e.scrollWidth<=e.clientWidth)).toBe(true);
 await page.click('[data-close="research"]');await page.click('#begin');await page.click('#next');await page.click('#lab');await node('power').click();await expect(upgrade).toBeDisabled();await expect(upgrade).toContainText('準備階段');await expect(balance).toContainText('可用晶核 3');await expect(node('critical')).toBeEnabled();
 expect(errors).toEqual([]);
});
