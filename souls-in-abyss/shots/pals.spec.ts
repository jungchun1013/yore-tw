import { test } from '@playwright/test';
test.use({ video: 'off', deviceScaleFactor: 2 });
test('pals page and skill buttons', async ({ page }) => {
  for (const w of [1280, 360]) {
    await page.setViewportSize({ width: w, height: 800 });
    await page.addInitScript(() => { if (!sessionStorage.getItem('boot')) { localStorage.clear(); localStorage.setItem('yore.lang', 'zh'); sessionStorage.setItem('boot', '1'); } });
    await page.goto('/');
    if (await page.locator('#t-play').count()) { await page.click('#t-play'); await page.click('.intro'); await page.click('#c-go'); }
    await page.waitForTimeout(500);
    await page.evaluate(() => { const g = (window as any).__game; if (g.s.pets.length) return;
      g.befriend('owl', 'sage'); g.befriend('owl', 'blue'); g.befriend('bloom'); g.befriend('mimipup', 'gold'); g.s.pets[1].lvl = 12; g.s.pets[1].bond = 4;
      g.s.ap = 40; g.s.skills = { ...g.s.skills }; g.refresh(); });
    await page.click('.nav [data-k="pets"]'); await page.waitForTimeout(300);
    await page.locator('.side').screenshot({ path: `${process.env.OUT}/pals-${w}.png` });
    await page.locator('#view [data-a="palPart"]').first().click(); await page.waitForTimeout(200);
    await page.locator('.side').screenshot({ path: `${process.env.OUT}/pals-ask-${w}.png` });
    await page.click('#view [data-a="disarm"]');
    await page.click('.nav [data-k="skills"]'); await page.waitForTimeout(200);
    // rank a few skills so one- and two-digit costs sit in the same column
    await page.evaluate(() => { const g = (window as any).__game; const ks = Array.from(document.querySelectorAll('#view .skill [data-a="learn"]')).map(b => (b as HTMLElement).dataset.k!);
      g.s.ap = 500; g.s.skills[ks[0]] = 12; g.s.skills[ks[1]] = 9; g.s.skills[ks[2]] = 3; g.s.ap = 11; g.refresh(); });
    await page.click('.nav [data-k="bag"]'); await page.click('.nav [data-k="skills"]'); await page.waitForTimeout(300);
    const ws = await page.locator('#view .skill .up-btn').evaluateAll(n => n.map(b => Math.round(b.getBoundingClientRect().width) + ':' + (b.textContent || '').trim()));
    console.log(w, 'up-btn widths', ws.join(' '), 'scrollW', await page.evaluate(() => document.documentElement.scrollWidth));
    await page.locator('.side').screenshot({ path: `${process.env.OUT}/skills-${w}.png` });
  }
});
