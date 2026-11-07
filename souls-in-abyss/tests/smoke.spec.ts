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
  await expect(page.locator('.introline').first()).toBeVisible();
  await page.click('.intro');
  await page.click('[data-a="cRace"][data-k="elf"]');
  await page.click('[data-a="cAge"][data-k="13"]');
  await expect(page.locator('.sttable tbody tr').nth(1).locator('td').nth(1)).toHaveText('+4');
  await expect(page.locator('.fig.on .agev')).toHaveText('年齡13');
  await page.hover('#c-go');
  await page.waitForTimeout(300);
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
  await page.click('.nav [data-k="map"]');
  await page.click('.node[data-k="forest"]');
  await page.screenshot({ path: `${SHOTS}/${info.project.name}-map.png` });
  await page.click('.nav [data-k="equip"]');
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

test('rebirth with a pact keeps gear and adds legacy', async ({ page }, info) => {
  await page.addInitScript(fresh, 'en');
  await page.goto('/');
  await page.screenshot({ path: `${SHOTS}/${info.project.name}-title-en.png` });
  await page.click('#t-play');
  await page.waitForTimeout(2600);
  await page.screenshot({ path: `${SHOTS}/${info.project.name}-intro-en.png` });
  await page.click('.intro');
  await page.screenshot({ path: `${SHOTS}/${info.project.name}-create-en.png` });
  await page.click('#c-go');
  const uid = await page.evaluate(() => {
    const g = (window as any).__game;
    g.fastForward(300); g.s.age = 20;
    return g.s.equip.weapon.uid;
  });
  await page.click('.nav [data-k="rebirth"]');
  await page.click('[data-a="rbRace"][data-k="giant"]');
  await page.click('[data-a="rbAge"][data-k="15"]');
  await expect(page.locator('.pact')).toHaveCount(4);
  await page.click('[data-a="rbPact"][data-k="1"]');
  await page.screenshot({ path: `${SHOTS}/${info.project.name}-rebirth.png` });
  const offer = await page.evaluate(() => (window as any).__game.s.offers[1]);
  await page.click('[data-a="rebirth"]');
  const s = await page.evaluate(() => (window as any).__game.s);
  expect(s.pact).toEqual(offer);
  expect(s.offers).toBeNull();
  expect(s.lvl).toBe(1);
  expect(s.race).toBe('giant');
  expect(s.age).toBe(15);
  expect(s.equip.weapon.uid).toBe(uid);
  expect(s.legacy.str).toBeGreaterThan(0);
});

test('sanity drains in the abyss, glitches the log, and collapses at zero', async ({ page }) => {
  await page.addInitScript(fresh, 'en');
  await page.goto('/');
  await page.click('#t-play');
  await page.click('.intro');
  await page.click('#c-go');
  const r = await page.evaluate(() => {
    const g = (window as any).__game;
    g.s.legacy.str = 200000; g.refresh(); g.hp = g.d.hp; // strong enough to survive the abyss
    g.s.area = 'abyss'; g.newMonster();
    const before = g.s.san;
    g.fastForward(120);
    const mid = g.s.san;
    g.s.san = 2; g.refresh();
    g.fastForward(60);
    return { before, mid, collapses: g.s.counters.collapses || 0, titles: g.s.titles };
  });
  expect(r.mid).toBeLessThan(r.before);
  expect(r.collapses).toBeGreaterThan(0);
  expect(r.titles).toContain('broken');
  await expect(page.locator('#sheet')).toContainText('SAN');
});

test('the gear on the title screen switches language', async ({ page }) => {
  await page.addInitScript(fresh, 'en');
  await page.goto('/');
  await expect(page.locator('#t-play')).toHaveText('Play Game');
  await page.click('.cog');
  await page.click('.cogmenu [data-lang="zh"]');
  await expect(page.locator('#t-play')).toHaveText('開始遊戲');
});

test('a title message in the log stays one line tall', async ({ page }) => {
  await page.addInitScript(fresh, 'zh');
  await page.goto('/');
  await page.click('#t-play'); await page.click('.intro'); await page.click('#c-go');
  await page.evaluate(() => { const g = (window as any).__game; g.s.counters.kills = 100; g.checkTitles(); });
  const h = await page.evaluate(() => Math.max(...[...document.querySelectorAll('#log p')].map(p => p.getBoundingClientRect().height)));
  expect(h).toBeLessThan(80);
});

test('skill names in the log stay inline', async ({ page }) => {
  await page.addInitScript(fresh, 'zh');
  await page.goto('/');
  await page.click('#t-play'); await page.click('.intro'); await page.click('#c-go');
  await page.evaluate(() => { const g = (window as any).__game; g.s.skills.defense = 15; g.s.skills.smash = 15; g.refresh(); g.fastForward(0); });
  await page.waitForFunction(() => document.querySelector('#log .skname'), null, { timeout: 30000 });
  const display = await page.evaluate(() => getComputedStyle(document.querySelector('#log .skname')!).display);
  expect(display).toBe('inline');
});
