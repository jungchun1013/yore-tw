import { test, expect } from '@playwright/test';
import { ICON_NAMES, pixels, PALETTE } from '../src/ui/icons';
import { avatarPixels } from '../src/ui/avatar';
import fs from 'node:fs';
import path from 'node:path';

test('every new drawing stays on its native grid and uses only the fixed palette', async () => {
 const palette=new Set(Object.values(PALETTE));
 for(const key of ICON_NAMES){
  const art=pixels(key);expect(art.length,key).toBeGreaterThan(10);
  expect(art.every(p=>Number.isInteger(p.x)&&Number.isInteger(p.y)&&p.x>=0&&p.x<16&&p.y>=0&&p.y<16),key).toBe(true);
  expect(art.every(p=>palette.has(p.color)),key).toBe(true);
 }
 expect(avatarPixels('human').every(p=>palette.has(p.color))).toBe(true);
 // Compare actual silhouettes, not colours: the new pets must not be 2× B masks.
 const old=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../../docs/art-preview/reference/pixel-8x8.json'),'utf8'));
 for(const name of ICON_NAMES.filter(k=>k.startsWith('pet-'))){
  const enlarged=new Set<string>();
  old[name].split('/').forEach((row:string,y:number)=>[...row.replace(/ /g,'')].forEach((v,x)=>{
   if(v!=='.')for(let dy=0;dy<2;dy++)for(let dx=0;dx<2;dx++)enlarged.add(`${x*2+dx},${y*2+dy}`);
  }));
  const native=new Set(pixels(name).map(p=>`${p.x},${p.y}`));
  expect([...new Set([...native,...enlarged])].filter(k=>native.has(k)!==enlarged.has(k)).length,name).toBeGreaterThan(12);
 }
});

test('gallery opens, filters, inspects, exports native PNGs and previews combat motion', async({page},info)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto('/');await page.evaluate(()=>document.fonts.ready);
 await expect(page.locator('.pet-card')).toHaveCount(7);
 await expect(page.locator('#b-icons svg')).toHaveCount(7);
 await expect(page.locator('.world-node')).toHaveCount(8);
 await page.locator('[data-map-place="abyss"]').click();
 await expect(page.locator('#map-place-name')).toHaveText('深淵迴廊');
 await expect.poll(()=>page.locator('#illustrated-map>img').evaluate(e=>(e as HTMLImageElement).naturalWidth)).toBe(1024);
 await page.locator('.pet-card').first().click();
 await expect(page.locator('#inspector')).toBeVisible();
 await expect(page.locator('#detail-native svg')).toHaveAttribute('viewBox','0 0 16 16');
 await page.locator('#show-grid').check();await expect(page.locator('.grid-lines')).toBeVisible();
 const downloaded=page.waitForEvent('download');await page.locator('#download-icon').click();
 const file=await downloaded;const png=fs.readFileSync((await file.path())!);
 expect(png.readUInt32BE(16)).toBe(16);expect(png.readUInt32BE(20)).toBe(16);
 await page.locator('#close-inspector').click();
 const before=await page.locator('#main-character').innerHTML();await page.locator('[data-outfit="medium"]').click();
 expect(await page.locator('#main-character').innerHTML()).not.toBe(before);
 await page.locator('[data-filter="equipment"]').click();await expect(page.locator('.icon-card:visible')).toHaveCount(9);
 await page.locator('[data-filter="all"]').click();await page.locator('[data-zoom="6"]').click();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
 await page.locator('[data-zoom="4"]').click();
 await page.locator('#area-select').selectOption('ruins');await expect(page.locator('.scene')).toHaveAttribute('data-area','ruins');await expect(page.locator('.scene')).toHaveAttribute('data-background','painted');
 const travel=Number(await page.locator('.scene').getAttribute('data-travel'));
 await page.locator('#advance-demo').click();await expect.poll(async()=>Number(await page.locator('.scene').getAttribute('data-travel'))).toBeGreaterThan(travel+25);
 await page.locator('#death-demo').click();await expect(page.locator('.scene')).toHaveAttribute('data-phase','soul');
 await expect(page.locator('#advance-demo')).toBeEnabled({timeout:7000});
 const data=await (await page.request.get('/assets/art-source.json')).json();
 expect(data.version).toBe('B-redraw-16-native');expect(Object.keys(data.icons).length).toBe(ICON_NAMES.length);
 const asset=await page.request.get('/assets/icons/pet-potcat.png');expect(asset.ok()).toBe(true);
 if(info.project.name==='desktop')await page.locator('#landscape-grid').screenshot({path:path.resolve(__dirname,'../../docs/art-preview/battle-painted-scenes.png')});
 await page.evaluate(()=>window.scrollTo(0,0));
 await page.screenshot({path:path.resolve(__dirname,`../../docs/art-preview/b-redraw-gallery-${info.project.name}.png`),fullPage:true});
 expect(errors).toEqual([]);
});
