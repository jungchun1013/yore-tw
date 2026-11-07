import { test, expect } from '@playwright/test';

// English mode must show no Chinese, except the "中文" option that lets people switch.
const CJK = /[　-鿿＀-￯]/g;
const chinese = (s: string) => (s.replace(/中文/g, '').match(CJK) || []).join('');

test('English mode has no Chinese on any screen', async ({ page }) => {
  await page.addInitScript(() => { if (!sessionStorage.getItem('boot')) { localStorage.clear(); localStorage.setItem('yore.lang', 'en'); sessionStorage.setItem('boot', '1'); } });
  await page.goto('/');
  const check = async (where: string) => expect(chinese(await page.evaluate(() => document.body.innerText + ' ' + [...document.querySelectorAll('svg text, [title], [aria-label]')].map(e => (e.textContent || '') + (e.getAttribute('title') || '') + (e.getAttribute('aria-label') || '')).join(' '))), where).toBe('');
  await check('title');
  await page.click('#t-play'); await check('intro');
  await page.click('.intro'); await check('creation');
  for (const r of ['human', 'elf', 'dwarf', 'giant', 'undead']) { await page.click(`[data-a="cRace"][data-k="${r}"]`); await check('race ' + r); }
  await page.click('#c-go');
  await page.evaluate(() => { const g = (window as any).__game; g.fastForward(1200); g.s.age = 20; g.befriend('potcat'); g.s.area = 'abyss'; g.s.san = 10; g.refresh(); g.newMonster(); });
  await page.waitForTimeout(3000);
  for (const k of ['equip', 'pets', 'skills', 'map', 'smith', 'titles', 'rebirth', 'settings']) {
    await page.click(`.nav [data-k="${k}"]`);
    if (k === 'skills') for (const tab of ['combat', 'magic', 'passive']) { await page.click(`[data-a="stab"][data-k="${tab}"]`); await check('skills ' + tab); }
    await check('view ' + k);
  }
});
