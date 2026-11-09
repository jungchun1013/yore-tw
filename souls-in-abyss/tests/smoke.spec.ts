import { test, expect } from '@playwright/test';

const SHOTS = 'docs/screenshots';
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

  for (const k of ['pets', 'skills', 'map', 'smith', 'titles', 'settings', 'equip']) {
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
  page.once('dialog', d => d.accept());
  await page.click('.nav [data-k="settings"]');
  await page.click('[data-a="rebirthOpen"]');
  await page.click('[data-a="rbRace"][data-k="giant"]');
  await page.click('[data-a="rbAge"][data-k="15"]');
  await expect(page.locator('.pact')).toHaveCount(4);
  await page.click('[data-a="rbPact"][data-k="1"]');
  await page.screenshot({ path: `${SHOTS}/${info.project.name}-rebirth.png` });
  const offer = await page.evaluate(() => (window as any).__game.s.offers[1]);
  await page.click('#rb-go');
  const s = await page.evaluate(() => (window as any).__game.s);
  expect(s.pact).toEqual(offer);
  expect(s.offers).toBeNull();
  expect(s.lvl).toBe(1);
  expect(s.race).toBe('giant');
  expect(s.age).toBe(15);
  expect(s.equip.weapon.uid).toBe(uid);
  expect(s.legacy.str).toBeGreaterThan(0);
});

test('dying above your level costs SAN; madness blesses and curses; SAN 0 blacks out and wakes on the meadow with less', async ({ page }) => {
  await page.addInitScript(fresh, 'en');
  await page.goto('/');
  await page.click('#t-play');
  await page.click('.intro');
  await page.click('#c-go');
  const r = await page.evaluate(() => {
    const g = (window as any).__game, s = g.s;
    // a level-1 hero in the labyrinth (Lv 12+) dies and loses a whole number of SAN; kills cost nothing
    s.area = 'labyrinth'; g.newMonster();
    const before = s.san, loss = g.sanLossHere();
    g.fastForward(40);
    const afterDeaths = s.san, deaths = s.counters.deaths;
    // below 50 the Abyss rolls a whole-percent blessing or curse on each ability
    s.area = 'meadow'; g.newMonster(); g.setSan(10); g.fastForward(1);
    const rolls = { ...s.madRoll };
    // SAN 0: black, then the meadow with 30-50% less gold and EXP, and no AP for the levels regained
    s.lvl = 30; s.xp = 0; s.peakLvl = 30; s.ap = 0; s.gold = 1000; s.san = 1;
    s.legacy.str = 0; g.refresh();
    s.area = 'abyss'; g.newMonster();
    let black = false;
    for (let i = 0; i < 400 && !black; i++) { g.tick(0.25); black = g.collapsing; }
    for (let i = 0; i < 40; i++) g.tick(0.25);
    const woke = { area: s.area, gold: s.gold, lvl: s.lvl, san: s.san, ap: s.ap, peak: s.peakLvl };
    g.gainXp(1e9);
    return { before, loss, afterDeaths, deaths, rolls, black, woke, lvlAfter: s.lvl, apAfter: s.ap, collapses: s.counters.collapses || 0, titles: s.titles };
  });
  expect(r.loss).toBe(Math.round(r.loss));
  expect(r.loss).toBeGreaterThan(5);
  expect(r.deaths).toBeGreaterThan(0);
  expect(r.afterDeaths).toBeLessThan(r.before);
  const vals = Object.values(r.rolls) as number[];
  expect(vals.length).toBe(8);
  for (const v of vals) { expect(Number.isInteger(v)).toBe(true); expect(v).toBeGreaterThanOrEqual(-50); expect(v).toBeLessThanOrEqual(10); }
  expect(r.black).toBe(true);
  expect(r.woke.area).toBe('meadow');
  expect(r.woke.san).toBeGreaterThanOrEqual(40); expect(r.woke.san).toBeLessThan(41); // wakes at 40, the meadow already restoring it
  expect(r.woke.gold).toBeGreaterThanOrEqual(500); expect(r.woke.gold).toBeLessThanOrEqual(760);
  expect(r.woke.lvl).toBeLessThan(30);
  expect(r.woke.peak).toBe(30);
  // regaining up to Lv 30 gives no AP; only the levels past it do
  expect(r.apAfter - r.woke.ap).toBe(r.lvlAfter - 30);
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
