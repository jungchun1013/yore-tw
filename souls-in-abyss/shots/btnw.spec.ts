import { test } from '@playwright/test';
test.use({ video: 'off' });
for (const lang of ['zh', 'en']) test('button widths ' + lang, async ({ page }) => {
  for (const w of [1280, 360]) {
    await page.setViewportSize({ width: w, height: 800 });
    await page.addInitScript(l => { if (!sessionStorage.getItem('boot')) { localStorage.clear(); localStorage.setItem('yore.lang', l); sessionStorage.setItem('boot', '1'); } }, lang);
    await page.goto('/');
    if (await page.locator('#t-play').count()) { await page.click('#t-play'); await page.click('.intro'); await page.click('#c-go'); }
    await page.waitForTimeout(400);
    await page.evaluate(() => { const g = (window as any).__game; if (!g.s.pets.length) { g.befriend('owl', 'sage'); g.befriend('bloom'); } g.s.gold = 999999; g.refresh(); });
    await page.waitForTimeout(2500);
    const keys = await page.locator('.nav [data-a="view"]').evaluateAll(n => n.map(b => (b as HTMLElement).dataset.k!));
    for (const k of keys) {
      await page.click(`.nav [data-k="${k}"]`); await page.waitForTimeout(150);
      if (k === 'equip') await page.locator('#view .doll .slot').first().click().catch(() => {});
      const read = () => page.locator('#view button, #view .dim').evaluateAll(n => n.filter(b => b.tagName === 'BUTTON' && (b as HTMLElement).offsetWidth).map(b => `${b.className || '-'}|${(b.textContent || '').trim().slice(0, 14)}|${Math.round(b.getBoundingClientRect().width)}x${Math.round(b.getBoundingClientRect().height)}`));
      console.log(lang, w, k, [...new Set(await read())].join('  '));
      for (const a of ['reset', 'palPart']) if (await page.locator(`#view [data-a="${a}"]`).count()) { await page.locator(`#view [data-a="${a}"]`).first().click(); await page.waitForTimeout(100); console.log(lang, w, k, 'armed', [...new Set(await read())].join('  ')); await page.locator('#view [data-a="disarm"]').first().click(); }
    }
    console.log(lang, w, 'scrollW', await page.evaluate(() => document.documentElement.scrollWidth));
  }
});
