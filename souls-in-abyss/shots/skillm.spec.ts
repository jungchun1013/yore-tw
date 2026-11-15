import { test } from '@playwright/test';
import { seed } from './seed';
test.use({ video: 'off', viewport: { width: 1280, height: 800 } });
test('skill rows', async ({ page }) => {
  await seed(page, 'zh'); await page.click('.nav [data-k="skills"]'); await page.waitForTimeout(300);
  console.log(await page.evaluate(() => { const r = document.querySelector('#view .skill') as HTMLElement; const name = r.querySelector('.sname, b, .iname') as HTMLElement; const btn = r.querySelector('button') as HTMLElement; const cs = (e: Element) => getComputedStyle(e); return `row h=${r.getBoundingClientRect().height} pad=${cs(r).padding} margin=${cs(r).margin} name-font=${name ? cs(name).fontSize : '?'} row-font=${cs(r).fontSize} btn=${btn ? btn.getBoundingClientRect().width + 'x' + btn.getBoundingClientRect().height + ' ' + cs(btn).fontSize : ''}`; }));
  console.log(await page.evaluate(() => [...document.querySelectorAll('#view .skill')].slice(0,1).map(e => e.outerHTML.slice(0, 400)).join('\n')));
});
