import { test, expect } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';
const ART = path.resolve(__dirname, '../../docs/art-preview');
import { avatarPixels } from '../src/ui/avatar';
import { pixels } from '../src/ui/icons';
import { BattleMotion } from '../src/ui/motion';
import { LANDSCAPE_KEYS } from '../src/ui/landscape';

test('art stays inside the finer grids and motion completes one step per victory', () => {
  for (const key of ['slot-weapon', 'pet-pudding', 'pet-potcat', 'pet-nameless']) {
    const art = pixels(key);
    expect(art.length).toBeGreaterThan(50);
    expect(art.every(p => p.x >= 0 && p.x < 16 && p.y >= 0 && p.y < 16)).toBe(true);
    expect(art.some(p => p.x % 2 !== 0)).toBe(true);
  }
  for (const race of ['human', 'elf', 'dwarf', 'undead', 'giant']) {
    expect(avatarPixels(race).every(p => p.x >= 0 && p.x < 32 && p.y >= 0 && p.y < 48)).toBe(true);
  }
  const m = new BattleMotion();
  m.kill(); for (let i = 0; i < 12; i++) m.update(.05, 0);
  expect(m.travel).toBeCloseTo(36);
  for (let i = 0; i < 20; i++) m.update(.05, 0);
  expect(m.travel).toBeCloseTo(36);
  m.death(); m.update(.1, 5); expect(m.phase).toBe('death');
  for (let i = 0; i < 10; i++) m.update(.1, 4);
  expect(m.phase).toBe('soul');
  m.update(.05, 0); expect(m.phase).toBe('rebirth');
  for (let i = 0; i < 20; i++) m.update(.05, 0);
  expect(m.phase).toBe('fight');
});

test('all maps have distinct scenery; victories advance and death returns the soul', async ({ page }, info) => {
  await page.addInitScript(() => { localStorage.clear(); localStorage.setItem('yore.lang', 'zh'); });
  await page.goto('/'); await page.click('#t-play'); await page.click('.intro'); await page.click('#c-go');
  const canvas = page.locator('canvas.scene');
  // Keep the regular frame loop and deterministic event flow, without random attacks.
  await page.evaluate(() => { const g = (window as any).__game; g.heroT = -100; g.monT = -100; });
  const scenes: string[] = [];
  for (const key of LANDSCAPE_KEYS) {
    await page.evaluate(key => { (window as any).__game.s.area = key; }, key);
    await expect(canvas).toHaveAttribute('data-area', key);
    await expect(canvas).toHaveAttribute('data-background', 'painted');
    scenes.push(await canvas.evaluate(e => (e as HTMLCanvasElement).toDataURL()));
    if (info.project.name === 'desktop') {
      fs.mkdirSync(ART, { recursive: true });
      fs.writeFileSync(`${ART}/battle-${key}.png`, Buffer.from(scenes[scenes.length - 1].split(',')[1], 'base64'));
    }
  }
  expect(new Set(scenes).size).toBe(8);
  const before = Number(await canvas.getAttribute('data-travel'));
  await page.evaluate(() => { const g = (window as any).__game; g.s.area = 'meadow'; g.damageMon(1e9, 'hero', false); });
  await expect(canvas).toHaveAttribute('data-phase', 'advance');
  await expect.poll(async () => Number(await canvas.getAttribute('data-travel'))).toBeGreaterThan(before + 25);
  await expect(canvas).toHaveAttribute('data-phase', 'fight');
  await page.evaluate(() => {
    const phases: string[] = []; (window as any).__phases = phases;
    const cv = document.querySelector('canvas.scene') as HTMLCanvasElement;
    new MutationObserver(() => phases.push(cv.dataset.phase!)).observe(cv, { attributes: true, attributeFilter: ['data-phase'] });
    const g = (window as any).__game; g.heroT = -100; g.monT = -100; g.hp = .001; g.s.skills = {}; g.monAttack();
  });
  await expect(canvas).toHaveAttribute('data-phase', 'death');
  await expect(canvas).toHaveAttribute('data-phase', 'soul');
  if (info.project.name === 'desktop') fs.writeFileSync(`${ART}/battle-soul.png`, Buffer.from((await canvas.evaluate(e => (e as HTMLCanvasElement).toDataURL())).split(',')[1], 'base64'));
  await expect.poll(() => page.evaluate(() => (window as any).__game.hp), { timeout: 7000, intervals: [100] }).toBeGreaterThan(0);
  expect(await page.evaluate(() => (window as any).__phases)).toContain('rebirth');
});

test('illustrated map replaces the gradient and keeps every destination selectable', async ({ page }, info) => {
 await page.addInitScript(() => { localStorage.clear(); localStorage.setItem('yore.lang', 'zh'); });
 await page.goto('/');await page.click('#t-play');await page.click('.intro');await page.click('#c-go');
 await page.click('.nav [data-k="map"]');
 const map=page.locator('.mapboard'), art=map.locator('.map-art');
 await expect(art).toBeVisible();
 await expect.poll(()=>art.evaluate(e=>(e as HTMLImageElement).naturalWidth)).toBe(1024);
 expect(await map.evaluate(e=>getComputedStyle(e).backgroundImage)).toBe('none');
 const box=await map.boundingBox();expect(box!.width/box!.height).toBeCloseTo(2/3,2);
 await expect(map.locator('.node')).toHaveCount(8);
 for(const key of ['forest','mine','abyss','meadow']){
  await map.locator(`[data-k="${key}"]`).click();
  await expect(map.locator(`[data-k="${key}"]`)).toHaveClass(/(?:sel|here)/);
 }
 await map.screenshot({path:path.resolve(ART,`abyss-map-${info.project.name}.png`)});
});
