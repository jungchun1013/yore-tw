import { test } from '@playwright/test';
/** Equipment art review: all 16 machines at 4 tiers, gift boxes, paw icons; plus the kitchen at tier 0 / 1 / 2 / 3. Run: EQUIP=1 npx playwright test tests/tools/equip-shot.spec.ts --project=desktop */
const base = { version: 1, macarons: 5e6, totalEarned: 5e9, allTimeEarned: 5e9, clicks: 400, gens: { kitten: 12, apprentice: 8, baker: 5, courier: 3, patissier: 2 }, furnitureOwned: ['cushion', 'cattree'], furnitureSlots: ['cushion', 'cattree', null, null] };
const equip = (tier: number) => ['mixer', 'piping', 'oven', 'box'].flatMap((st) => [1, 2, 3].filter((t) => t <= tier).map((t) => `equip_${st}_t${t}`));

test('sprite sheet', async ({ page }) => {
  test.skip(!process.env.EQUIP, 'set EQUIP=1');
  await page.addInitScript(() => { localStorage.clear(); localStorage.setItem('meowcaron.lang', 'zh'); });
  await page.setViewportSize({ width: 1100, height: 900 });
  await page.goto('/');
  await page.waitForFunction(() => !!window.__mc?.content);
  await page.evaluate(() => {
    const { sprites, content: { UPGRADES }, i18n } = window.__mc!;
    const root = document.createElement('div'); root.id = 'sheet';
    root.innerHTML = `<style>#sheet{position:relative;z-index:999;background:#FFF7F0;padding:24px 28px;font-family:Nunito,"PingFang TC",sans-serif;color:#5A4038}
      #sheet h2{font-size:18px;margin:16px 0 8px} #sheet .row{display:flex;gap:18px;align-items:flex-end;margin-bottom:6px}
      #sheet .cell{display:flex;flex-direction:column;align-items:center;gap:4px;font-size:13px;font-weight:800;width:120px;text-align:center}
      #sheet img{image-rendering:pixelated;background:#F5E6DA;border-radius:8px}</style><h2>廚具 4 台 × 4 階（0 = 起始）</h2>`;
    for (const st of ['mixer', 'piping', 'oven', 'box']) {
      const row = document.createElement('div'); row.className = 'row';
      for (let t = 0; t <= 3; t++) {
        const u = UPGRADES.find((x) => x.id === `equip_${st}_t${t}`);
        row.insertAdjacentHTML('beforeend', `<div class="cell"><img src="${sprites.propCanvas(st, t, 4).toDataURL()}" width="88" height="96"><span>${t === 0 ? '起始' : i18n.nameOf(u!)}</span></div>`);
      }
      root.append(row);
    }
    root.insertAdjacentHTML('beforeend', '<h2>產線物件：麵糊球 → 扁殼 → 馬卡龍 → 禮物（裸裝三入 → 白色小盒 → 緞帶禮盒）</h2>');
    const g = document.createElement('div'); g.className = 'row';
    g.insertAdjacentHTML('beforeend', `<div class="cell" style="width:70px"><img src="${sprites.doughCanvas().toDataURL()}" width="48" height="48"><span>麵糊球</span></div><div class="cell" style="width:70px"><img src="${sprites.shellCanvas('pink').toDataURL()}" width="48" height="48"><span>扁殼</span></div><div class="cell" style="width:70px"><img src="${sprites.macaronCanvas('pink').toDataURL()}" width="48" height="48"><span>馬卡龍</span></div>`);
    for (let t = 1; t <= 3; t++) for (const k of ['pink', 'mint', 'lemon']) g.insertAdjacentHTML('beforeend', `<div class="cell" style="width:80px"><img src="${sprites.packCanvas(t, k).toDataURL()}" width="${t === 3 ? 75 : 70}" height="${t === 3 ? 45 : 40}"><span>包裝 ${t}</span></div>`);
    root.append(g);
    root.insertAdjacentHTML('beforeend', '<h2>拍拍升級圖示 🫳</h2>');
    const p = document.createElement('div'); p.className = 'row';
    for (const id of ['click1', 'click2', 'click3', 'click4', 'click5', 'pct1', 'pct2', 'pct3']) { const u = UPGRADES.find((x) => x.id === id)!; p.insertAdjacentHTML('beforeend', `<div class="cell" style="width:100px"><img src="${sprites.patCanvas(id).toDataURL()}" width="64" height="64"><span>${i18n.nameOf(u)}</span></div>`); }
    root.append(p);
    document.body.append(root);
    document.getElementById('app')!.style.display = 'none';
    document.documentElement.style.cssText = 'overflow:auto;height:auto'; document.body.style.cssText = 'overflow:auto;height:auto';
  });
  await page.waitForTimeout(200);
  await page.screenshot({ path: 'docs/screenshots/equipment-sheet.png', fullPage: true });
});

for (const tier of [0, 1, 2, 3]) {
  test(`kitchen at tier ${tier}`, async ({ page }) => {
    test.skip(!process.env.EQUIP, 'set EQUIP=1');
    const save = { ...base, upgrades: equip(tier), lastTick: Date.now() };
    await page.addInitScript(([k, s]) => { localStorage.clear(); localStorage.setItem(k as string, JSON.stringify(s)); localStorage.setItem('meowcaron.lang', 'zh'); }, ['meowcaron.save.v1', save] as const);
    await page.setViewportSize({ width: 1200, height: 720 });
    await page.goto('/');
    await page.waitForFunction(() => !!window.__mc?.hero);
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `docs/screenshots/kitchen-t${tier}.png` });
  });
}

test('rewrap: buying packaging sends a cat to re-wrap the display', async ({ page }) => {
  test.skip(!process.env.EQUIP, 'set EQUIP=1');
  const save = { ...base, upgrades: equip(0), lastTick: Date.now() };
  await page.addInitScript(([k, s]) => { localStorage.clear(); localStorage.setItem(k as string, JSON.stringify(s)); localStorage.setItem('meowcaron.lang', 'zh'); }, ['meowcaron.save.v1', save] as const);
  await page.setViewportSize({ width: 1200, height: 720 });
  await page.goto('/');
  await page.waitForFunction(() => !!window.__mc?.hero);
  await page.waitForTimeout(1000);
  await page.locator('[data-upgrade="equip_box_t1"]').click();
  for (let i = 0; i < 5; i++) { await page.waitForTimeout(1300); await page.screenshot({ path: `docs/screenshots/rewrap-${i}.png`, clip: { x: 0, y: 380, width: 800, height: 340 } }); }
});
