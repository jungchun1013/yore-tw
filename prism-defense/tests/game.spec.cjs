const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
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
 await expect(page.locator('#setup')).toBeVisible();await page.click('#setup-lab');await page.click('[data-research="power"]');await expect(page.locator('[data-research="power"]')).toHaveClass(/learned/);await expect(page.locator('[data-research="critical"]')).toBeDisabled();await page.click('[data-close="research"]');await page.click('#begin');
 const board=page.locator('#board');const box=await board.boundingBox();const cell=async(x,y)=>board.click({position:{x:(x+.5)/18*box.width,y:(y+.5)/12*box.height}});
 await cell(3,2);await cell(3,2);await expect(page.locator('#details')).toContainText('Lv.1');await page.click('#upgrade');await expect(page.locator('#details')).toContainText('Lv.2');
 await page.click('[data-build="pulse"]');await cell(6,4);await page.click('#next');await page.click('#pause');expect(await page.evaluate(()=>window.__prism.paused)).toBe(true);const time=await page.evaluate(()=>window.__prism.game.time);await page.waitForTimeout(250);expect(await page.evaluate(()=>window.__prism.game.time)).toBe(time);await page.click('#pause');await page.click('#speed');await page.click('#speed');
 await page.evaluate(()=>{const g=window.__prism.game;for(let i=0;i<2400&&g.state==='running';i++)g.tick(1/60);});
 await expect.poll(()=>page.evaluate(()=>window.__prism.game.state)).toBe('planning');await expect(page.locator('#next')).toContainText('第 2 波');
 await page.click('#lab');await page.click('#respec');await expect(page.locator('#lab-balance')).toContainText('3');await page.click('[data-close="research"]');
 await cell(3,2);const cash=await page.evaluate(()=>window.__prism.game.cash);await page.click('#sell');expect(await page.evaluate(()=>window.__prism.game.cash)).toBeGreaterThan(cash);
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
