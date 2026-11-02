import { test } from '@playwright/test';
/** Renders every upgrade (kitchen equipment, patting, per-cat tiers, star shop) as one sheet. Run: SHEET=1 npx playwright test tests/tools/upgrade-sheet.spec.ts --project=desktop */
test('upgrade sheet', async ({ page }) => {
  test.skip(!process.env.SHEET, 'set SHEET=1');
  const lang = process.env.LANG_ZH === '0' ? 'en' : 'zh';
  await page.addInitScript((l) => { localStorage.clear(); localStorage.setItem('meowcaron.lang', l as string); }, lang);
  await page.setViewportSize({ width: 1180, height: 900 });
  await page.goto('/');
  await page.waitForFunction(() => !!window.__mc?.content);
  await page.evaluate(() => {
    const { content: { UPGRADES, STAR_UPGRADES, CATS, fmt }, sprites, i18n } = window.__mc!;
    const { nameOf, descOf } = i18n;
    const icon = (key: string) => { const m = /^prop:(\w+):(\d)$/.exec(key); const ty = /^toy:(\w+)$/.exec(key); return m ? sprites.propCanvas(m[1], Number(m[2])).toDataURL() : ty ? sprites.toyCanvas(ty[1]).toDataURL() : sprites.iconDataUrl(key); };
    const zh = i18n.lang() === 'zh';
    const css = `#sheet{position:relative;z-index:999;background:#FFF7F0;padding:28px 32px;font-family:Nunito,"PingFang TC","Microsoft JhengHei",sans-serif;color:#5A4038}
      #sheet h1{margin:0 0 4px;font-size:30px} #sheet .sub{color:#9C8A82;font-weight:700;margin-bottom:18px}
      #sheet h2{font-size:20px;margin:22px 0 10px;border-bottom:2px solid #F0DFD3;padding-bottom:4px}
      #sheet .grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
      #sheet .card{background:#fff;border:2px solid #F0DFD3;border-radius:14px;padding:10px 12px;display:flex;gap:10px;align-items:flex-start;box-shadow:0 2px 0 #E8D2C4}
      #sheet .card img{width:56px;height:56px;image-rendering:pixelated;flex:none;background:#FBEFE6;border-radius:10px;padding:4px}
      #sheet .name{font-weight:900;font-size:16px} #sheet .desc{font-size:13px;line-height:1.45;color:#7A5A4A;margin-top:2px}
      #sheet .cost{display:inline-block;margin-top:6px;background:#FBECA6;border-radius:999px;padding:2px 10px;font-weight:900;font-size:13px}
      #sheet .req{font-size:12px;color:#9C8A82;margin-top:3px}
      #sheet table{border-collapse:separate;border-spacing:6px;width:100%} #sheet th{font-size:13px;color:#9C8A82;text-align:left;font-weight:800}
      #sheet td{background:#fff;border:2px solid #F0DFD3;border-radius:10px;padding:6px 10px;font-size:13px;vertical-align:middle;white-space:nowrap}
      #sheet td.cat{font-weight:900;font-size:15px} #sheet td img{width:28px;height:28px;image-rendering:pixelated;vertical-align:middle;margin-right:6px}
      #sheet td b{display:block;font-size:12px;color:#7A5A4A;font-weight:800} #sheet td.cat img{width:40px;height:40px}`;
    const root = document.createElement('div'); root.id = 'sheet';
    root.innerHTML = `<style>${css}</style><h1>${zh ? '升級 item 總覽' : 'All upgrades'}</h1><div class="sub">${zh ? '廚具 12 · 拍拍 8 · 星星商店 4 · 每隻貓 5 階 × 11 隻 = 55' : 'equipment 12 · patting 8 · star shop 4 · cat tiers 55'}</div>`;
    const sec = (title: string, list: typeof UPGRADES, costLabel = '🍪') => {
      const h = document.createElement('h2'); h.textContent = title; root.append(h);
      const g = document.createElement('div'); g.className = 'grid';
      for (const u of list) {
        const req = u.requires?.earned ? (zh ? `累計 ${fmt(u.requires.earned)} 後出現` : `appears at ${fmt(u.requires.earned)} baked`) : u.requires?.clicks ? (zh ? `拍 ${u.requires.clicks} 次後出現` : `after ${u.requires.clicks} pats`) : '';
        g.insertAdjacentHTML('beforeend', `<div class="card"><img src="${icon(u.icon)}"><div><div class="name">${nameOf(u)}</div><div class="desc">${descOf(u)}</div><span class="cost">${costLabel} ${fmt(u.cost)}</span><div class="req">${req}</div></div></div>`);
      }
      root.append(g);
    };
    const equip = UPGRADES.filter((u) => u.id.startsWith('equip_'));
    const order = ['mixer', 'piping', 'oven', 'box'];
    equip.sort((a, b) => order.indexOf(a.id.split('_')[1]) - order.indexOf(b.id.split('_')[1]) || a.cost - b.cost);
    sec(zh ? '廚具升級（4 台 × 3 階，顯示在廚房地板上）' : 'Kitchen equipment (4 stations × 3 tiers)', equip);
    sec(zh ? '拍拍升級（店長）' : 'Patting upgrades', UPGRADES.filter((u) => /^(click|pct)\d$/.test(u.id)));
    sec(zh ? '星星商店（開新店後，永久）' : 'Star shop (permanent)', STAR_UPGRADES, '★');
    const h = document.createElement('h2'); h.textContent = zh ? '每隻貓的階段升級（每隻貓自己的階梯：擁有幾隻時出現 → 該貓產量倍率）' : 'Per-cat tiers (each cat has its own ladder: owned count → multiplier)'; root.append(h);
    const tbl = document.createElement('table');
    tbl.innerHTML = `<tr><th></th>${[1, 2, 3, 4, 5].map((n) => `<th>${zh ? `第 ${n} 階` : `tier ${n}`}</th>`).join('')}</tr>`;
    for (const c of CATS) {
      const tiers = UPGRADES.filter((u) => u.id.startsWith(`${c.id}_t`));
      tbl.insertAdjacentHTML('beforeend', `<tr><td class="cat"><img src="${sprites.catCanvas(c.coat, c.accessory).toDataURL()}">${nameOf(c)}</td>${tiers.map((u) => `<td><img src="${icon(u.icon)}"><b>${nameOf(u).split(/[:：]/)[1]?.trim() ?? nameOf(u)}</b>${zh ? `擁有 ${u.requires?.count} 隻 → ×${(u.effect as { mult: number }).mult}` : `${u.requires?.count} owned → ×${(u.effect as { mult: number }).mult}`}<br>🍪 ${fmt(u.cost)}</td>`).join('')}</tr>`);
    }
    root.append(tbl);
    document.body.append(root);
    document.getElementById('app')!.style.display = 'none';
    document.documentElement.style.cssText = 'overflow:auto;height:auto'; document.body.style.cssText = 'overflow:auto;height:auto';
  });
  await page.waitForTimeout(300);
  await page.screenshot({ path: `docs/screenshots/upgrade-sheet-${lang}.png`, fullPage: true, animations: 'disabled' });
});
