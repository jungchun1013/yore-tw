import { test, expect } from '@playwright/test';

const SHOTS = '../docs/screenshots/souls-in-abyss';
const fresh = (lang: string) => {
  if (!sessionStorage.getItem('boot')) { localStorage.clear(); localStorage.setItem('yore.lang', lang); sessionStorage.setItem('boot', '1'); }
};

test('title, create a hero, fight, and open every view', async ({ page }, info) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.addInitScript(fresh, 'zh');
  await page.goto('/');
  await page.screenshot({ path: `${SHOTS}/${info.project.name}-title.png` });
  await page.click('#t-play');
  await page.click('[data-a="cRace"][data-k="elf"]');
  await page.click('[data-a="cAge"][data-k="13"]');
  await expect(page.locator('.rinfo')).toContainText('靈巧+4');
  await page.screenshot({ path: `${SHOTS}/${info.project.name}-create.png` });
  await page.click('#c-go');
  await expect(page.locator('#sheet')).toContainText('精靈');

  await page.evaluate(() => (window as any).__game.fastForward(900));
  await page.waitForTimeout(2500);
  const s = await page.evaluate(() => (window as any).__game.s);
  expect(s.counters.kills).toBeGreaterThan(20);
  await expect(page.locator('#log p').first()).toBeVisible();

  for (const k of ['pets', 'skills', 'map', 'smith', 'titles', 'rebirth', 'settings', 'equip']) {
    await page.click(`.nav [data-k="${k}"]`);
    await expect(page.locator('#view')).not.toBeEmpty();
  }
  await page.click('.doll [data-k="weapon"]');
  await page.screenshot({ path: `${SHOTS}/${info.project.name}-main.png` });
  await page.click('.nav [data-k="skills"]');
  if (s.ap > 0) {
    await page.click('[data-a="learn"][data-k="smash"]');
    expect(await page.evaluate(() => (window as any).__game.s.skills.smash)).toBe(1);
  }
  await page.click('[data-a="stab"][data-k="magic"]');
  await page.screenshot({ path: `${SHOTS}/${info.project.name}-skills.png` });

  await page.evaluate(() => { const g = (window as any).__game; localStorage.setItem('soulsinabyss.save', JSON.stringify(g.s)); });
  await page.reload();
  await expect(page.locator('#sheet')).toContainText('精靈');
  expect(errors).toEqual([]);
});

test('rebirth keeps gear and adds legacy', async ({ page }) => {
  await page.addInitScript(fresh, 'en');
  await page.goto('/');
  await page.click('#t-play');
  await page.click('#c-go');
  const uid = await page.evaluate(() => {
    const g = (window as any).__game;
    g.fastForward(300); g.s.age = 20;
    return g.s.equip.weapon.uid;
  });
  await page.click('.nav [data-k="rebirth"]');
  await page.click('[data-a="rbRace"][data-k="giant"]');
  await page.click('[data-a="rbAge"][data-k="15"]');
  await page.click('[data-a="rebirth"]');
  const s = await page.evaluate(() => (window as any).__game.s);
  expect(s.lvl).toBe(1);
  expect(s.race).toBe('giant');
  expect(s.age).toBe(15);
  expect(s.equip.weapon.uid).toBe(uid);
  expect(s.legacy.str).toBeGreaterThan(0);
});
