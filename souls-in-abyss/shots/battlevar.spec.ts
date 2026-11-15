import { test } from '@playwright/test';
import { seed } from './seed';
const OUT = process.env.OUT!;
test.use({ video: 'off', deviceScaleFactor: 1, viewport: { width: 1280, height: 800 } });
const A = `.scene{max-height:200px}`;
const B = `#battlepane{display:grid;grid-template-columns:190px minmax(0,1fr) 190px;grid-template-areas:"hero stage mon" "pal stage mon";gap:0 18px;align-items:start}
#battlepane .stage{grid-area:stage;align-self:center;display:block;margin:0}#battlepane .scene{width:100%;height:auto}
#battlepane .fight{display:contents}.fight .side-hero{grid-area:hero}.fight .side-pal{grid-area:pal;margin-top:10px}.fight .side-mon{grid-area:mon}
.fight .side-mon .fname{text-align:left}`;
test('battle variants', async ({ page }) => {
  await seed(page, 'zh');
  await page.evaluate(() => { const g = (window as any).__game; g.fastForward(600); g.befriend('owl', 'blue'); g.refresh(); });
  await page.click('.nav [data-k="map"]'); await page.click('#view .node[data-k="forest"]'); await page.waitForTimeout(4000);
  await page.click('.nav [data-k="bag"]'); await page.click('.hero .ttab[data-k="equip"]');
  for (const [k, css] of [['A', A], ['B', B]] as const) {
    const h = await page.addStyleTag({ content: css }); await page.waitForTimeout(400);
    await page.evaluate(() => { const g = (window as any).__game; g.hp = g.d.hp; (g as any).down = 0; });
    await page.screenshot({ path: `${OUT}/battle-${k}.png` });
    await h.evaluate(e => e.remove());
  }
});
