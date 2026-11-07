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
  // write the exact line the engine writes when Defense triggers, instead of waiting for a random proc
  await page.evaluate(() => (window as any).__game.say({ zh: '你使用 {0}', en: 'You use {0}' }, [{ text: '防禦', cls: 'skname' }]));
  const display = await page.evaluate(() => getComputedStyle(document.querySelector('#log .skname')!).display);
  expect(display).toBe('inline');
});

test('EXP and SAN bars never flash empty when the sheet refreshes', async ({ page }) => {
  await page.addInitScript(fresh, 'zh');
  await page.goto('/');
  await page.click('#t-play'); await page.click('.intro'); await page.click('#c-go');
  await page.evaluate(() => { const g = (window as any).__game; g.s.xp = Math.floor(g.s.lvl * 10); g.s.san = 60; });
  await page.waitForTimeout(500);
  // sample the bars every frame for 2.5 s, across several sheet rebuilds (the age clock ticks each second)
  const minWidths = await page.evaluate(() => new Promise<number[]>(res => {
    let mx = Infinity, ms = Infinity; const end = performance.now() + 2500;
    const tick = () => {
      const x = document.getElementById('s-xp'), s = document.getElementById('s-san');
      if (x && s) { mx = Math.min(mx, parseFloat(x.style.width || '0')); ms = Math.min(ms, parseFloat(s.style.width || '0')); }
      if (performance.now() < end) requestAnimationFrame(tick); else res([mx, ms]);
    };
    requestAnimationFrame(tick);
  }));
  expect(minWidths[0]).toBeGreaterThan(0);
  expect(minWidths[1]).toBeGreaterThan(50);
});

test('skills and gear explain themselves in a tooltip, rows keep their height', async ({ page }, info) => {
  await page.addInitScript(fresh, 'zh');
  await page.goto('/');
  await page.click('#t-play'); await page.click('.intro'); await page.click('#c-go');
  await page.evaluate(() => { const g = (window as any).__game; g.s.ap = 50; });
  await page.click('.nav [data-k="skills"]');
  const row = page.locator('.view .skill[data-tip="skill:smash"]');
  const h0 = (await row.boundingBox())!.height;
  if (info.project.name === 'desktop') {
    await row.hover();
    await expect(page.locator('.tip')).toBeVisible();
    await expect(page.locator('.tip')).toContainText('下一級');
    await page.screenshot({ path: `${SHOTS}/${info.project.name}-skill-tip.png` });
  }
  await page.click('[data-a="learn"][data-k="smash"]');
  await page.click('[data-a="learn"][data-k="smash"]');
  const h1 = (await page.locator('.view .skill[data-tip="skill:smash"]').boundingBox())!.height;
  expect(Math.abs(h1 - h0)).toBeLessThan(1);
  await page.click('.nav [data-k="equip"]');
  await page.click('.doll [data-k="weapon"]');
  const worn = page.locator('.item.worn');
  if (info.project.name === 'desktop') { await worn.hover(); }
  else { await worn.tap({ position: { x: 20, y: 20 } }); }
  await expect(page.locator('.tip')).toContainText('攻擊');
  await page.waitForTimeout(1500); // log lines keep arriving; the tooltip must stay open
  await expect(page.locator('.tip')).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/${info.project.name}-item-tip.png` });
});
