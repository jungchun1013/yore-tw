const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
const {clickCell}=require('./board-helper.cjs');
const {checkSkillButtons}=require('./research-helper.cjs');
let Game,MAPS,TOWERS,RESEARCH,simulate,plan;
test.beforeAll(async()=>{({Game,MAPS,TOWERS,RESEARCH}=await (new Function('p','return import(p)'))(require('node:url').pathToFileURL(require('node:path').resolve(__dirname,'../src/engine.mjs')).href));({simulate,plan}=await (new Function('p','return import(p)'))(require('node:url').pathToFileURL(require('node:path').resolve(__dirname,'../sim/balance.mjs')).href));});

test('combat rules, money conservation, map validity and difficulty baselines',()=>{
 for(const map of MAPS){const g=new Game({map:map.id});expect(new Set(g.path.map(p=>p.join(','))).size).toBe(g.path.length);for(let i=0;i<g.path.length;i++){const[x,y]=g.path[i];expect(x>=0&&x<18&&y>=0&&y<18).toBe(true);if(i)expect(Math.max(Math.abs(x-g.path[i-1][0]),Math.abs(y-g.path[i-1][1]))).toBe(1);}expect(g.build('pulse',...g.path[0])).toBe(false);const p=[2,4];const before=g.cash;const t=g.build('pulse',...p);expect(t).toBeTruthy();expect(g.build('pulse',...p)).toBe(false);expect(g.upgrade(t)).toBe(true);const spent=t.spent;expect(g.sell(t)).toBe(true);expect(g.cash).toBe(before-spent+Math.floor(spent*.75));expect(g.sell(t)).toBe(false);}
 for(const m of MAPS){expect(simulate(m.id,'calm','pulse').state).toBe('won');expect(simulate(m.id,'normal','mixed').state).toBe('won');expect(simulate(m.id,'normal','empty').state).toBe('lost');}
 const clear=new Game();const slowed=new Game();clear.startWave();slowed.startWave();clear.spawn();slowed.spawn();slowed.enemies[0].slow=.5;slowed.enemies[0].slowUntil=100;clear.tick(.1);slowed.tick(.1);expect(slowed.enemies[0].progress).toBeLessThan(clear.enemies[0].progress);
 const b=new Game({research:['power','reach','tempo']});const tower=b.build('pulse',2,4);expect(b.stats(tower).damage).toBeGreaterThan(TOWERS.pulse.damage);expect(b.stats(tower).range).toBeGreaterThan(TOWERS.pulse.range);
});

test('wave icon forecasts agree with actual spawns across all twenty waves',async()=>{
 const {wavePreview}=await(new Function('p','return import(p)'))(require('node:url').pathToFileURL(require('node:path').resolve(__dirname,'../src/engine.mjs')).href);
 const g=new Game();
 for(let wave=1;wave<=20;wave++){
  // Only walk through the wave sequence to inspect spawn composition, not combat.
  expect(g.startWave()).toBe(true);for(let i=0;i<g.info.count;i++)g.spawn();
  const actual={};for(const e of g.enemies)actual[e.kind]=(actual[e.kind]||0)+1;
  expect(Object.fromEntries(wavePreview(wave).map(p=>[p.kind,p.count]))).toEqual(actual);g.enemies=[];g.state='planning';
 }
});

test('all endpoint stone courts reject every tower without spending',()=>{
 for(const map of MAPS){const g=new Game({map:map.id}),cash=g.cash;expect(g.stone.size).toBe(9);for(const cell of g.stone){const[x,y]=cell.split(',').map(Number);expect(g.canBuild(x,y)).toBe(false);for(const type of Object.keys(TOWERS))expect(g.build(type,x,y)).toBe(false);}expect(g.cash).toBe(cash);expect(g.towers).toHaveLength(0);}
});

test('lightning preserves the original right-angle layout with longer vertical spans',async()=>{
 const {position,CELL}=await(new Function('p','return import(p)'))(require('node:url').pathToFileURL(require('node:path').resolve(__dirname,'../src/engine.mjs')).href);
 const g=new Game({map:'switch'}),points=g.map.points;
 expect(points.map(p=>p[0])).toEqual([0,6,6,12,12,16]);
 expect(points[2][1]-points[1][1]).toBeGreaterThan(3);expect(points[4][1]-points[3][1]).toBeGreaterThan(4);
 for(let i=1;i<points.length;i++){const dx=points[i][0]-points[i-1][0],dy=points[i][1]-points[i-1][1];expect((dx===0)!==(dy===0)).toBe(true);}
 for(let i=1;i<g.path.length;i++)expect(Math.abs(g.path[i][0]-g.path[i-1][0])+Math.abs(g.path[i][1]-g.path[i-1][1])).toBe(1);
 const a=position(g.path,6*CELL+40),b=position(g.path,6*CELL+60);expect(a.x).toBe(b.x);expect(b.y-a.y).toBeCloseTo(20,7);
 expect(g.stone.size).toBe(9);for(const p of g.road)expect(g.canBuild(...p.split(',').map(Number))).toBe(false);
 expect(g.canBuild(8,9)).toBe(true);
});

test('research artwork loads and decodes after starting before the first modal open',async({page})=>{
 const assets=['/art/research-tree-dormant-v5.png','/art/research-tree-v4.png','/art/research-icons-flat-v3.png'],requests=[];
 page.on('request',r=>{const path=new URL(r.url()).pathname;if(assets.includes(path))requests.push(path);});
 await page.addInitScript(()=>{window.researchDecoded=[];const decode=HTMLImageElement.prototype.decode;HTMLImageElement.prototype.decode=function(){const src=new URL(this.src).pathname;return decode.call(this).then(value=>{window.researchDecoded.push(src);return value;});};});
 await page.goto('/');await expect(page.locator('#setup')).toBeVisible();expect(requests).toEqual([]);
 await page.click('#begin');await expect(page.locator('#research')).not.toBeVisible();
 await expect.poll(()=>page.evaluate(()=>window.researchDecoded.filter(s=>s.includes('/research-')).length)).toBe(3);
 for(const asset of assets)expect(requests).toContain(asset);
 await expect(page.locator('#research-tree .node')).toHaveCount(15);
 await expect.poll(()=>page.locator('#research .research-art').evaluateAll(images=>images.length===2&&images.every(i=>i.complete&&i.naturalWidth>0))).toBe(true);
 await page.click('#lab');await expect(page.locator('#research')).toBeVisible();await page.click('[data-close="research"]');await page.click('#lab');
 expect(await page.evaluate(()=>window.researchDecoded.filter(s=>s.includes('/research-')).length)).toBe(3);
});

test('status counters share one row without overflow at all screen sizes',async({page},info)=>{
 await page.goto('/');await page.click('#begin');
 for(const width of [320,390,700,1000,1440]){await page.setViewportSize({width,height:1000});const boxes=await page.locator('.metrics .metric').evaluateAll(nodes=>nodes.filter(n=>getComputedStyle(n).display!=='none').map(n=>({top:n.getBoundingClientRect().top,left:n.getBoundingClientRect().left,right:n.getBoundingClientRect().right})));expect(boxes.length).toBe(3);await expect(page.locator('#kills')).toHaveCount(0);await expect(page.locator('.metrics')).not.toContainText('擊破');expect(Math.max(...boxes.map(b=>b.top))-Math.min(...boxes.map(b=>b.top))).toBeLessThan(1);expect(boxes.at(-1).right).toBeLessThanOrEqual(width);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
});

test('clicking stone shows its restriction and leaves grass buildable',async({page})=>{
 await page.goto('/');await page.click('#begin');const board=page.locator('#board');await expect(board).toHaveAttribute('data-art','painted');
 const setup=await page.evaluate(()=>{const g=window.__prism.game,stone=[...g.stone].find(p=>!g.road.has(p)).split(',').map(Number),end=g.path.at(-1);let grass;for(let y=0;y<18;y++)for(let x=0;x<18;x++)if(g.canBuild(x,y)&&Math.max(Math.abs(x-end[0]),Math.abs(y-end[1]))===2)grass=[x,y];return{stone,grass,cash:g.cash};});
 await clickCell(board,...setup.stone);await expect(page.locator('#toast')).toHaveText('灰石地不可建造。');expect(await page.evaluate(()=>window.__prism.game.cash)).toBe(setup.cash);expect(await page.evaluate(()=>window.__prism.game.towers.length)).toBe(0);
 await clickCell(board,...setup.grass);expect(await page.evaluate(()=>window.__prism.game.towers.length)).toBe(1);expect(await page.evaluate(()=>window.__prism.game.cash)).toBe(setup.cash-35);
});

test('player can research, build, upgrade, pause, survive a wave, sell and restart',async({page},info)=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.addInitScript(()=>{if(!sessionStorage.getItem('prism-test-boot')){localStorage.clear();sessionStorage.setItem('prism-test-boot','1');}});await page.goto('/');
 await expect(page.locator('#setup')).toBeVisible();await expect(page.locator('#setup h2')).toHaveText('地圖難度選擇');await expect(page.locator('#setup-lab')).toHaveCount(0);await expect(page.locator('#begin')).toHaveText('開始遊戲 →');for(const id of ['spiral','switch','ribbon']){await page.click('[data-map="'+id+'"]');await expect(page.locator('#map-plan-art svg')).toHaveAttribute('data-map-preview',id);await page.locator('#map-plan-art svg').screenshot({path:require('node:path').resolve(__dirname,`../screenshots/map-${id}-${info.project.name}.png`)});}const shotsSetup=require('node:path').resolve(__dirname,'../screenshots');await page.screenshot({path:shotsSetup+`/setup-${info.project.name}.png`,fullPage:true});await page.click('#begin');await page.click('#lab');await page.click('#research-tree [data-research="power"]');await page.click('#research-upgrade');await expect(page.locator('#research-tree [data-research="power"]')).toHaveClass(/learned/);await page.click('#research-tree [data-research="critical"]');await expect(page.locator('#research-upgrade')).toBeDisabled();await page.click('[data-close="research"]');
 const board=page.locator('#board');const cell=(x,y)=>clickCell(board,x,y);
 await expect(board).toHaveAttribute('data-projection','isometric');
 await board.click({position:{x:20,y:20}});expect(await page.evaluate(()=>window.__prism.game.towers.length)).toBe(0);
 await cell(0,2);expect(await page.evaluate(()=>window.__prism.game.towers.length)).toBe(0);
 await cell(3,5);await clickCell(board,3,5,-22);expect(await page.evaluate(()=>window.__prism.game.towers.length)).toBe(1);await expect(page.locator('#details')).toContainText('Lv.1');await page.click('#upgrade');await expect(page.locator('#details')).toContainText('Lv.2');
 await page.click('[data-build="pulse"]');await cell(6,7);const startWidth=(await page.locator('#next').boundingBox()).width;await page.click('#next');expect((await page.locator('#next').boundingBox()).width).toBe(startWidth);await page.click('#pause');expect(await page.evaluate(()=>window.__prism.paused)).toBe(true);const time=await page.evaluate(()=>window.__prism.game.time);await page.waitForTimeout(250);expect(await page.evaluate(()=>window.__prism.game.time)).toBe(time);await page.click('#pause');await page.click('#speed');await page.click('#speed');
 await page.evaluate(()=>{const g=window.__prism.game;for(let i=0;i<2400&&g.state==='running';i++)g.tick(1/60);});
 await expect.poll(()=>page.evaluate(()=>window.__prism.game.state)).toBe('planning');await expect(page.locator('#next')).toContainText('第 2 波');
 await page.click('#lab');await page.click('#respec');await expect(page.locator('#lab-balance')).toContainText('3');await page.click('[data-close="research"]');
 await cell(3,5);const cash=await page.evaluate(()=>window.__prism.game.cash);await page.click('#sell');expect(await page.evaluate(()=>window.__prism.game.cash)).toBeGreaterThan(cash);
 await page.click('[data-build="pulse"]');await cell(8,8);expect(await page.evaluate(()=>window.__prism.game.towers.some(t=>t.x===8&&t.y===8))).toBe(true);
 await page.click('#restart');await page.click('[data-map="switch"]');await page.click('[data-difficulty="hard"]');await page.click('#begin');await expect(page.locator('#map-name')).toContainText('地圖：閃電 · 難度：困難');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.click('[data-build="chain"]');await cell(8,9);await page.click('#next');await page.evaluate(()=>{const g=window.__prism.game;for(let i=0;i<250;i++)g.tick(1/60);});
 const shots=require('node:path').resolve(__dirname,'../screenshots');fs.mkdirSync(shots,{recursive:true});await page.screenshot({path:shots+`/${info.project.name}.png`,fullPage:true});expect(errors).toEqual([]);
});

test('victory, defeat and persistent research rewards use actual combat',async({page})=>{
 await page.addInitScript(()=>{if(!sessionStorage.getItem('prism-test-boot')){localStorage.clear();sessionStorage.setItem('prism-test-boot','1');}});await page.goto('/');await page.click('#begin');
 await page.evaluate(async()=>{const {plan}=await (new Function('return import("/sim/balance.mjs")'))();const g=window.__prism.game;let steps=0;while(!['lost','won'].includes(g.state)&&steps++<100000){if(g.state==='planning'){plan(g);g.startWave();}g.tick(.05);g.effects.length=0;}});
 await expect(page.locator('#result')).toContainText('守住了');expect(await page.locator('#toast').evaluate(e=>e.parentElement.classList.contains('board-wrap'))).toBe(true);expect(await page.evaluate(()=>window.__prism.save.cores)).toBe(17);
 await page.click('#retry');await page.click('#begin');await page.evaluate(()=>{const g=window.__prism.game;for(let i=0;i<5000&&g.state!=='lost';i++){if(g.state==='planning')g.startWave();g.tick(.05);g.effects.length=0;}});await expect(page.locator('#result')).toContainText('失守');
 await page.reload();await page.click('#begin');await page.click('#lab');await expect(page.locator('#lab-balance')).toContainText('17');
});

test('warm frameless artwork renders all six objects and the research tree',async({page},info)=>{
 await page.goto('/');await page.click('#begin');await expect(page.locator('#board')).toHaveAttribute('data-art','painted');
 await expect(page.locator('#details .panel-title h3')).toHaveText('建造預覽');expect(await page.locator('.sidebar .panel-title h3').evaluateAll(nodes=>Math.abs(nodes[0].getBoundingClientRect().top-nodes[1].getBoundingClientRect().top)<1)).toBe(true);for(const[type,name]of[['frost','霜靈'],['beam','光狙'],['bloom','雷眩']])await expect(page.locator('[data-build="'+type+'"]')).toContainText(name);
 for(const type of ['pulse','cannon','frost','beam','chain','bloom']){
  const atlas=await page.locator('.tower-grid .object-'+type).evaluate(e=>getComputedStyle(e).backgroundImage);
  expect(atlas).toContain(type==='cannon'?'towers-original-trim-l2-r1.png':type==='chain'?'towers-mixed-v4.png':'towers-pixel-v2.png');
 }
 expect(await page.locator('body').evaluate(e=>getComputedStyle(e).backgroundColor)).toBe('rgb(43, 46, 51)');
 for(const selector of ['.board-wrap','.panel','.tower-button','button'])expect(await page.locator(selector).evaluateAll(nodes=>nodes.every(n=>getComputedStyle(n).borderTopWidth==='0px'))).toBe(true);
 await page.evaluate(async()=>{const{plan}=await(new Function('return import("/sim/balance.mjs")'))();const g=window.__prism.game;let n=0;while(g.wave<7||g.state==='running'){if(++n>100000)throw Error('scenario failed');if(g.state==='planning'){plan(g);g.startWave();}g.tick(.05);g.effects.length=0;}for(const t of [...g.towers])g.sell(t);for(const[type,x,y]of[['pulse',4,5],['cannon',6,9],['frost',4,10],['beam',9,10],['chain',10,8],['bloom',8,12]]){if(!g.build(type,x,y))throw Error('Cannot build review object '+type);}g.startWave();for(let i=0;i<220;i++){g.tick(.05);g.effects.length=0;}});
 await clickCell(page.locator('#board'),4,5);
 const shots=require('node:path').resolve(__dirname,'../screenshots');fs.mkdirSync(shots,{recursive:true});await expect(page.locator('#toast')).not.toHaveClass(/visible/);await page.screenshot({path:shots+`/warm-${info.project.name}.png`,fullPage:true});
 await page.click('#lab');await expect(page.locator('#research')).toBeVisible();await expect(page.locator('.node')).toHaveCount(15);await page.screenshot({path:shots+`/research-${info.project.name}.png`,fullPage:true});
});

test('isometric projection and diamond hit testing agree across the entire board',async()=>{
 const {project,unproject,screenToCell,cellCenter,groundRadius}=await(new Function('p','return import(p)'))(require('node:url').pathToFileURL(require('node:path').resolve(__dirname,'../src/projection.mjs')).href);
 expect(project(0,0)).toEqual({x:288,y:54});expect(project(576,576)).toEqual({x:288,y:324});
 for(let x=0;x<18;x++)for(let y=0;y<18;y++){
  expect(screenToCell(...Object.values(cellCenter(x,y)))).toEqual({x,y});
  for(const [dx,dy]of[[.02,.02],[.98,.02],[.02,.98],[.98,.98]]){
   const original={x:(x+dx)*32,y:(y+dy)*32},p=project(original.x,original.y),q=unproject(p.x,p.y);
   expect(q.x).toBeCloseTo(original.x,8);expect(q.y).toBeCloseTo(original.y,8);expect(screenToCell(p.x,p.y)).toEqual({x,y});
  }
 }
 for(const [x,y]of[[0,0],[575,0],[0,383],[575,383]])expect(screenToCell(x,y)).toBeNull();
 const r=groundRadius(100);expect(r.x/r.y).toBeCloseTo(2);
});

test('boss arrival dims the field, gems retain separate light and defeat restores daylight',async({page},info)=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');await page.click('#begin');
 const board=page.locator('#board');await expect(board).toHaveAttribute('data-art','painted');await expect(board).toHaveAttribute('data-boss-lighting','0.000');
 // Earn wave five through the real combat planner. No boss, money or wave injection.
 await page.evaluate(async()=>{const{plan}=await(new Function('return import("/sim/balance.mjs")'))();const g=window.__prism.game;let steps=0;while(g.wave<4||g.state==='running'){if(++steps>100000)throw Error('wave four not completed');if(g.state==='planning'){plan(g);g.startWave();}g.tick(.05);g.effects.length=0;}for(const t of [...g.towers])g.sell(t);for(const[type,x,y]of[['pulse',2,5],['cannon',4,7],['frost',3,9],['beam',8,10],['chain',10,8]])if(!g.build(type,x,y))throw Error('review tower budget or location failed');});
 await page.click('#next');await expect(board).toHaveAttribute('data-boss-active','true');
 // Check an actual transition, then freeze the same battle to inspect its pixels.
 await expect.poll(async()=>Number(await board.getAttribute('data-boss-lighting'))).toBeGreaterThan(.15);
 await expect(board).toHaveAttribute('data-boss-lighting','1.000');await expect(page.locator('#board-ambient')).toHaveCSS('opacity','0.6');await page.screenshot({path:require('node:path').resolve(__dirname,`../screenshots/boss-theater-${info.project.name}.png`),fullPage:true});await page.click('#pause');
 const pausedLighting=await board.getAttribute('data-boss-lighting');await page.waitForTimeout(120);await expect(board).toHaveAttribute('data-boss-lighting',pausedLighting);
 const samples=await page.evaluate(async()=>{
  const {drawScene}=await(new Function('return import("/src/art.js")'))();
  const g=window.__prism.game,cv=document.createElement('canvas');cv.width=576;cv.height=384;const c=cv.getContext('2d');
  const frame=strength=>{drawScene(c,g,null,null,'pulse',[],[],g.time,{strength,reducedEffects:true});return c.getImageData(0,0,576,384).data;};
  const day=frame(0),night=frame(1),rgb=(data,x,y)=>Array.from(data.slice((y*576+x)*4,(y*576+x)*4+3));
  // Empty corner is dimmed too, so the map doesn't remain a bright cream rectangle.
  const corner={day:rgb(day,10,10),night:rgb(night,10,10)};
  const t=g.towers.find(t=>t.type==='pulse');if(!t)throw Error('planner should own pulse');
  const {cellCenter}=await(new Function('return import("/src/projection.mjs")'))();const p=cellCenter(t.x,t.y);
  // Towers draw at 35px, anchored by footprint (pulse: centre .54, bottom .96, drop .17).
  const gem={x:Math.round(p.x-.54*35)+Math.round(274/512*35),y:Math.round(p.y+.17*35-.96*35)+Math.round(131/512*35)};
  return {corner,land:{day:rgb(day,350,270),night:rgb(night,350,270)},gem:{day:rgb(day,gem.x,gem.y),night:rgb(night,gem.x,gem.y)}};
 });
 const luminance=rgb=>rgb.reduce((sum,x)=>sum+x,0)/3;
 // The page is dark (#2b2e33), so the empty corner only has so far to fall.
 expect(luminance(samples.corner.night)).toBeLessThan(luminance(samples.corner.day)*.8);
 for(let i=0;i<3;i++)expect(Math.abs(samples.land.night[i]-(samples.land.day[i]*.4+[23,28,42][i]*.6))).toBeLessThan(3);
 expect(luminance(samples.gem.night)).toBeGreaterThan(luminance(samples.corner.night)*1.7);
 // Save a review of this live boss encounter without the pause overlay. Effects are
 // generated by its real tower attacks and frozen at a visible age, not invented.
 const review=await page.evaluate(async()=>{
  const g=window.__prism.game;let steps=0;while(!g.effects.some(f=>f.kind==='shot')&&g.enemies.some(e=>e.kind==='boss')&&steps++<300)g.tick(1/60);
  const flashes=g.effects.filter(f=>['shot','blast','aura'].includes(f.kind)).map(f=>({...f,age:.025,life:f.kind==='blast'?.25:.14}));g.effects.length=0;
  const {drawScene}=await(new Function('return import("/src/art.js")'))();
  const cv=document.createElement('canvas');cv.width=1152;cv.height=768;const ctx=cv.getContext('2d');ctx.setTransform(2,0,0,2,0,0);
  drawScene(ctx,g,null,null,'pulse',flashes,[],g.time,{strength:1,reducedEffects:true});return cv.toDataURL().split(',')[1];
 });
 const shots=require('node:path').resolve(__dirname,'../screenshots');fs.writeFileSync(shots+`/boss-wave-${info.project.name}.png`,Buffer.from(review,'base64'));
 // Complete actual combat, then allow the visual fade to finish in planning.
 await page.evaluate(()=>{const g=window.__prism.game;for(let i=0;i<10000&&g.state==='running';i++){g.tick(.05);g.effects.length=0;}if(g.state!=='planning')throw Error('wave five must be won');});
 await page.click('#pause');await expect(board).toHaveAttribute('data-boss-active','false');await expect(board).toHaveAttribute('data-boss-lighting','0.000');await expect(page.locator('#board-ambient')).toHaveCSS('opacity','0');
 await board.screenshot({path:shots+`/boss-cleared-${info.project.name}.png`});
 // Reduced effects keeps the core darkness/visibility treatment without shimmer.
 await page.click('#settings');await page.locator('#settings-fx').uncheck();await expect(page.locator('#settings-fx')).not.toBeChecked();await page.click('[data-close="settings-dialog"]');
 await page.click('#restart');await page.click('#begin');await expect(board).toHaveAttribute('data-boss-lighting','0.000');expect(errors).toEqual([]);
});

test('skill icons inspect freely, upgrade explicitly, enforce requirements and retain progress',async({page},info)=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');await page.click('#begin');await page.click('#lab');
 await expect(page.locator('#research h2')).toHaveText('技能樹');await checkSkillButtons(page);
 const node=id=>page.locator('#research-tree [data-research="'+id+'"]');const balance=page.locator('#lab-balance'),upgrade=page.locator('#research-upgrade');
 await expect(node('power')).toHaveAttribute('aria-pressed','true');await expect(balance).toContainText('可用晶核 3');
 for(const id of await page.locator('#research-tree .node').evaluateAll(buttons=>buttons.map(b=>b.dataset.research))){await node(id).click({timeout:5000});await expect(node(id)).toHaveAttribute('aria-pressed','true');}await expect(balance).toContainText('可用晶核 3');
 await node('critical').click();await expect(page.locator('#research-detail')).toContainText('每五次攻擊，傷害加倍');await expect(upgrade).toBeDisabled();await expect(balance).toContainText('可用晶核 3');
 await page.locator('#research-detail [data-research="pierce"]').click();await expect(node('pierce')).toHaveAttribute('aria-pressed','true');await expect(page.locator('#research-detail')).toContainText('一般攻擊忽略 20% 護甲');
 await node('power').focus();await page.keyboard.press('Enter');await expect(upgrade).toBeEnabled();await expect(balance).toContainText('可用晶核 3');await upgrade.click();await expect(balance).toContainText('可用晶核 2');await expect(node('power')).toHaveClass(/learned/);await expect(upgrade).toBeDisabled();
 await node('tempo').click();await expect(upgrade).toBeEnabled();await upgrade.click();await expect(balance).toContainText('可用晶核 0');await node('reach').click();await expect(upgrade).toContainText('還差 1 顆晶核');await expect(upgrade).toBeDisabled();
 for(const id of ['power','tempo'])expect(await node(id).locator('.skill-hex .skill-face').evaluate(e=>getComputedStyle(e).fill)).toBe('rgb(234, 219, 149)');expect(await node('reach').locator('.skill-hex .skill-face').evaluate(e=>getComputedStyle(e).fill)).toBe('rgb(124, 140, 99)');await page.evaluate(()=>document.fonts.ready);await page.screenshot({path:require('node:path').resolve(__dirname,`../screenshots/research-enabled-${info.project.name}.png`),fullPage:true});
 await page.reload();await page.click('#begin');await page.click('#lab');await expect(balance).toContainText('已完成 2 / 15');await expect(node('tempo')).toHaveClass(/learned/);
 await page.click('#respec');await expect(balance).toContainText('可用晶核 3');await expect(balance).toContainText('已完成 0 / 15');await expect(node('tempo')).toHaveClass(/locked/);await expect(page.locator('#respec')).toBeDisabled();
 await node('reach').click();await expect(upgrade).toBeEnabled();await page.evaluate(()=>document.fonts.ready);await expect.poll(()=>page.locator('.research-art').evaluateAll(images=>images.every(e=>e.complete&&e.naturalWidth>0))).toBe(true);expect((await page.request.get('/art/research-icons-flat-v3.png')).ok()).toBe(true);
 const shots=require('node:path').resolve(__dirname,'../screenshots');await page.screenshot({path:shots+`/research-interactive-${info.project.name}.png`,fullPage:true});
 expect(await page.locator('#research').evaluate(e=>e.scrollWidth<=e.clientWidth)).toBe(true);
 await page.click('[data-close="research"]');await page.click('#next');await page.click('#lab');await node('power').click();await expect(upgrade).toBeDisabled();await expect(upgrade).toContainText('準備階段');await expect(balance).toContainText('可用晶核 3');await expect(node('critical')).toBeEnabled();
 expect(errors).toEqual([]);
});

test('research tree awakens with learned skills, badges stay unlit and respec restores grey-white tree',async({page},info)=>{
 const learned=['power','tempo','pierce','critical','overdrive','reach','cold','blast','jump','spectrum','fund','bounty','build','repair','interest'];
 // A completed, valid saved research tree exercises returning-player rendering.
 await page.addInitScript(ids=>localStorage.setItem('prism-defense-v1',JSON.stringify({cores:0,learned:ids,best:{},sound:false,fx:false})),learned);
 await page.goto('/');await page.click('#begin');await page.click('#lab');const tree=page.locator('.research-canopy'),awake=page.locator('.research-awake');
 await expect(tree).toHaveAttribute('data-awakening','1');await expect(awake).toHaveCSS('opacity','1');await expect(page.locator('#research-tree .node.learned')).toHaveCount(15);await page.evaluate(()=>document.fonts.ready);await expect.poll(()=>page.locator('.research-art').evaluateAll(images=>images.every(e=>e.complete&&e.naturalWidth>0))).toBe(true);
 const shots=require('node:path').resolve(__dirname,'../screenshots');await page.screenshot({path:shots+`/research-awakened-${info.project.name}.png`,fullPage:true});
 await page.click('#respec');await expect(tree).toHaveAttribute('data-awakening','0');await expect(awake).toHaveCSS('opacity','0');await expect(page.locator('#research-tree .node.learned')).toHaveCount(0);await page.locator('#research').evaluate(e=>e.scrollTop=0);await page.screenshot({path:shots+`/research-dormant-${info.project.name}.png`,fullPage:true});
 await page.click('#research-tree [data-research="power"]');await page.click('#research-upgrade');expect(Number(await tree.getAttribute('data-awakening'))).toBeCloseTo(1/15,6);expect(Number(await awake.evaluate(e=>getComputedStyle(e).opacity))).toBeCloseTo(1/15,5);await expect(page.locator('#research-tree .node.learned')).toHaveCount(1);
});

test('research modal wash covers the full document and prevents background scrolling',async({page},info)=>{
 const {PNG}=require('playwright-core/lib/utilsBundle');
 await page.goto('/');await page.click('#begin');await expect(page.locator('#board')).toHaveAttribute('data-art','painted');await page.evaluate(()=>document.fonts.ready);
 const baseline=PNG.sync.read(await page.screenshot({fullPage:true}));
 expect(baseline.height).toBeGreaterThan(page.viewportSize().height*(info.project.use.deviceScaleFactor||1));
 await page.click('#lab');await expect(page.locator('#research')).toBeVisible();
 await expect.poll(()=>page.locator('.research-art').evaluateAll(imgs=>imgs.every(i=>i.complete&&i.naturalWidth>0))).toBe(true);
 const path=require('node:path').resolve(__dirname,`../screenshots/research-backdrop-${info.project.name}.png`);
 const covered=PNG.sync.read(await page.screenshot({path,fullPage:true}));
 const rgb=(png,x,y)=>Array.from(png.data.subarray((y*png.width+x)*4,(y*png.width+x)*4+3));
 const top=rgb(covered,5,20),bottom=rgb(covered,5,covered.height-20),original=rgb(baseline,5,baseline.height-20);
 // Inspect rendered pixels below the viewport, where the old native backdrop ended.
 for(let i=0;i<3;i++){expect(Math.abs(top[i]-bottom[i])).toBeLessThan(4);expect(bottom[i]).toBeLessThan(original[i]-10);}
 await page.mouse.move(2,100);const scroll=await page.evaluate(()=>scrollY),direction=scroll>0?-600:600;await page.mouse.wheel(0,direction);await page.waitForTimeout(150);expect(await page.evaluate(()=>scrollY)).toBe(scroll);
 // Escape must release both the wash and the scroll lock, without click interception.
 await page.keyboard.press('Escape');await expect(page.locator('#research')).not.toBeVisible();await page.mouse.wheel(0,direction);await expect.poll(()=>page.evaluate(()=>scrollY)).not.toBe(scroll);
 await page.evaluate(()=>scrollTo(0,0));await page.click('#lab');await expect(page.locator('#research')).toBeVisible();await page.click('[data-close="research"]');await expect(page.locator('#research')).not.toBeVisible();
});

test('map zoom, drag and touch pinch keep building aligned and do not spend on gestures',async({page},info)=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');await page.click('#begin');
 const board=page.locator('#board');await expect(board).toHaveAttribute('data-art','painted');await expect(page.locator('#map-name')).toHaveText('地圖：蜿蜒 · 難度：標準');await page.evaluate(()=>document.fonts.ready);expect(await page.locator('.brand').evaluate(b=>{const h=b.querySelector('h1').getBoundingClientRect(),s=b.querySelector('small').getBoundingClientRect();return s.left>=h.right&&s.top<h.bottom;})).toBe(true);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.click('#lab');await expect(page.locator('#research')).not.toContainText('從根部');await expect(page.locator('.skill-requirements dd').first()).toHaveText('無');await page.keyboard.press('Escape');
 await expect(page.locator('#fx')).toHaveCount(0);await expect(page.locator('#restart')).toHaveText('重開新局');await expect(page.locator('.panel-title h3').first()).toHaveCSS('font-size','18px');await expect(page.locator('.metric>span').first()).toHaveCSS('font-size','14px');await expect(page.locator('.tower-button span:not(.object-icon)').first()).toHaveCSS('font-size','14px');await expect(page.locator('#next')).toHaveCSS('font-size','14px');expect(await page.locator('#lab').evaluate(b=>b.parentElement===document.querySelector('#help').parentElement&&b.closest('.controls')!==null)).toBe(true);expect(await page.locator('#restart').evaluate(b=>b.closest('footer')!==null&&b.parentElement===document.querySelector('#settings').parentElement)).toBe(true);await expect(page.locator('.panel-title')).not.toContainText(['選塔 → 點空格']);expect(await page.locator('#speed').evaluate(b=>b.parentElement===document.querySelector('#next').parentElement)).toBe(true);
 await page.click('#help');await expect(page.locator('#instructions h2')).toHaveText('遊戲說明');await expect(page.locator('#instructions')).toContainText('選擇防禦塔，放置於道路以外的空格。');await expect(page.locator('#instructions')).toContainText('首領抵達城堡會失去 5 點生命。');await expect(page.locator('#instructions')).not.toContainText('Cubic 11');
 const shots=require('node:path').resolve(__dirname,'../screenshots');await page.screenshot({path:shots+`/instructions-${info.project.name}.png`,fullPage:true});await page.click('[data-close="instructions"]');
 await page.click('#settings');await expect(page.locator('#settings-dialog')).toBeVisible();await expect(page.locator('#settings-dialog .font-license')).toContainText('Cubic 11');await expect(page.locator('#settings-dialog a')).toHaveAttribute('href','./fonts/Cubic_11-OFL.txt');await page.locator('#settings-fx').uncheck();expect(await page.evaluate(()=>window.__prism.save.fx)).toBe(false);await page.locator('#settings-fx').check();await page.screenshot({path:shots+`/settings-${info.project.name}.png`,fullPage:true});await page.click('[data-close="settings-dialog"]');
 for(let i=0;i<4;i++)await page.click('#zoom-in');await expect(board).toHaveAttribute('data-zoom','2.000');
 await clickCell(board,6,7);expect(await page.evaluate(()=>window.__prism.game.towers.map(t=>[t.x,t.y]))).toEqual([[6,7]]);await clickCell(board,6,7,-22);await expect(page.locator('#details')).toContainText('Lv.1');
 await expect(page.locator('#target option[value="strong"]')).toHaveText('血量最多');await page.locator('#target').focus();await page.selectOption('#target','strong');expect(await page.evaluate(()=>window.__prism.game.towers[0].target)).toBe('strong');
 const cash=await page.evaluate(()=>window.__prism.game.cash);await board.scrollIntoViewIfNeeded();const box=await board.boundingBox();
 await page.mouse.move(box.x+box.width*.5,box.y+box.height*.55);await page.mouse.down();await page.mouse.move(box.x+box.width*.5+65,box.y+box.height*.55+25,{steps:8});await page.mouse.up();
 expect(Number(await board.getAttribute('data-pan-x'))).toBeGreaterThan(0);expect(Number(await board.getAttribute('data-pan-y'))).toBeGreaterThan(0);expect(await page.evaluate(()=>window.__prism.game.cash)).toBe(cash);
 await clickCell(board,6,7,-22);await expect(page.locator('#details')).toContainText('Lv.1');
 await page.click('#zoom-reset');await expect(board).toHaveAttribute('data-zoom','1.000');await expect(board).toHaveAttribute('data-pan-x','0.000');
 await board.scrollIntoViewIfNeeded();const wheelBox=await board.boundingBox();await page.mouse.move(wheelBox.x+wheelBox.width/2,wheelBox.y+wheelBox.height/2);await page.mouse.wheel(0,-150);await expect.poll(async()=>Number(await board.getAttribute('data-zoom'))).toBeGreaterThan(1.1);
 await page.click('#zoom-reset');await page.click('#zoom-out');await expect(board).toHaveAttribute('data-zoom','0.750');await expect(page.locator('#zoom-out')).toBeDisabled();
 for(let i=0;i<7;i++)await page.click('#zoom-in');await expect(page.locator('#zoom-in')).toBeDisabled();await expect(board).toHaveAttribute('data-zoom','2.500');
 await page.click('#zoom-reset');await expect(board).toHaveAttribute('data-zoom','1.000');
 // Actual browser touch input exercises pointer capture and two-finger release.
 await board.scrollIntoViewIfNeeded();const cdp=await page.context().newCDPSession(page),touchBox=await board.boundingBox();
 const touch=(id,x)=>({id,x:touchBox.x+touchBox.width*x,y:touchBox.y+touchBox.height*.5});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[touch(1,.4),touch(2,.6)]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[touch(1,.3),touch(2,.7)]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.detach();
 expect(Number(await board.getAttribute('data-zoom'))).toBeCloseTo(2,1);expect(await page.evaluate(()=>window.__prism.game.cash)).toBe(cash);expect(await page.evaluate(()=>window.__prism.game.towers.length)).toBe(1);
 await page.evaluate(()=>document.fonts.ready);await page.screenshot({path:require('node:path').resolve(__dirname,`../screenshots/map-zoom-${info.project.name}.png`),fullPage:true});
 await page.click('#restart');await page.click('#begin');await expect(board).toHaveAttribute('data-zoom','1.000');expect(errors).toEqual([]);
 if(info.project.name==='mobile'){await page.setViewportSize({width:320,height:850});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.setViewportSize({width:700,height:1000});expect(await page.locator('.controls>div').evaluateAll(groups=>Math.abs(groups[0].getBoundingClientRect().top-groups[1].getBoundingClientRect().top)<1)).toBe(true);}
});

test('only Enter, Space and Z/X control combat while inputs retain native keys',async({page})=>{
 await page.goto('/');await page.click('#begin');const board=page.locator('#board');
 await expect(page.locator('.keyboard-hint')).toHaveText('Enter 開始 · Space 暫停 · Z 減速 · X 加速');await expect(page.locator('.keyboard-hint')).toHaveCSS('font-size','12px');await expect(page.locator('footer')).not.toContainText('20 波 / 3 地圖');
 await page.click('[data-build="cannon"]');await board.focus();await page.keyboard.press('1');await expect(page.locator('[data-build="cannon"]')).toHaveClass(/active/);await clickCell(board,6,7);await clickCell(board,6,7,-20);await page.keyboard.press('u');expect(await page.evaluate(()=>window.__prism.game.towers[0].level)).toBe(1);
 await board.focus();await page.keyboard.press('Enter');await expect.poll(()=>page.evaluate(()=>window.__prism.game.wave)).toBe(1);await page.keyboard.press('Space');expect(await page.evaluate(()=>window.__prism.paused)).toBe(true);await expect(page.locator('#pause')).toHaveClass(/primary/);const speedWidth=(await page.locator('#speed').boundingBox()).width;
 for(let i=0;i<4;i++)await page.keyboard.press('x');await expect(page.locator('#speed')).toHaveText('3×');expect((await page.locator('#speed').boundingBox()).width).toBe(speedWidth);for(let i=0;i<4;i++)await page.keyboard.press('z');await expect(page.locator('#speed')).toHaveText('1×');
 await page.click('#speed');await page.keyboard.press('x');await expect(page.locator('#speed')).toHaveText('3×');await page.keyboard.press('z');await expect(page.locator('#speed')).toHaveText('2×');await page.keyboard.press('Space');expect(await page.evaluate(()=>window.__prism.paused)).toBe(false);await page.keyboard.press('Space');
 await page.click('#settings');await page.keyboard.press('x');await expect(page.locator('#speed')).toHaveText('2×');await page.keyboard.press('Escape');await expect(page.locator('#settings-dialog')).not.toBeVisible();
});

test('automatic waves wait through pause and settings, continue after combat and can be cancelled',async({page})=>{
 await page.goto('/');await page.click('#begin');const board=page.locator('#board'),auto=page.locator('#auto-start');await expect(auto).toHaveText('自動：關');const autoWidth=(await auto.boundingBox()).width;
 await expect(page.locator('#hint')).toHaveText('準備階段');await expect(page.locator('#wave-enemies .enemy-preview')).toHaveCount(2);await expect(page.locator('#forecast')).toHaveCount(0);await expect(page.locator('.legend')).toHaveCount(0);await expect(page.locator('#details')).not.toContainText('點道路外的格子放置');
 await clickCell(board,3,5);await clickCell(board,6,7);await auto.click();await expect(auto).toHaveAttribute('aria-pressed','true');await expect(auto).toHaveText('自動：開');await expect(auto).toHaveClass(/primary/);expect((await auto.boundingBox()).width).toBe(autoWidth);await page.mouse.move(2,2);const primaryColor=await page.locator('#next').evaluate(e=>getComputedStyle(e).backgroundColor);await expect(auto).toHaveCSS('background-color',primaryColor);await expect(page.locator('#lab')).toHaveCSS('background-color',primaryColor);await page.click('#pause');await page.waitForTimeout(3150);expect(await page.evaluate(()=>window.__prism.game.wave)).toBe(0);
 await page.click('#pause');await page.click('#settings');await page.waitForTimeout(3150);expect(await page.evaluate(()=>window.__prism.game.wave)).toBe(0);await page.click('[data-close="settings-dialog"]');await expect.poll(()=>page.evaluate(()=>window.__prism.game.wave),{timeout:5000}).toBe(1);
 await page.evaluate(()=>{const g=window.__prism.game;for(let i=0;i<5000&&g.state==='running';i++){g.tick(.05);g.effects.length=0;}if(g.state!=='planning')throw Error('must survive first wave');});await expect.poll(()=>page.evaluate(()=>window.__prism.game.wave),{timeout:5000}).toBe(2);
 await auto.click();await expect(auto).toHaveAttribute('aria-pressed','false');await expect(auto).toHaveText('自動：關');expect((await auto.boundingBox()).width).toBe(autoWidth);await page.evaluate(()=>{const g=window.__prism.game;for(let i=0;i<5000&&g.state==='running';i++){g.tick(.05);g.effects.length=0;}});await page.waitForTimeout(3150);expect(await page.evaluate(()=>window.__prism.game.wave)).toBe(2);expect(await page.evaluate(()=>window.__prism.game.state)).toBe('planning');
 await page.click('#restart');await page.click('#begin');await expect(auto).toHaveAttribute('aria-pressed','false');
});
