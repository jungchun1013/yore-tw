import { test, devices } from '@playwright/test';
test.use({ ...devices['Pixel 5'], video: 'off' });
test('latin', async ({ page }) => {
  await page.addInitScript(() => { if (!sessionStorage.getItem('boot')) { localStorage.clear(); localStorage.setItem('yore.lang','zh'); sessionStorage.setItem('boot','1'); } });
  await page.goto('/');
  const scan = (tag: string) => page.evaluate((tag) => { const out = new Set<string>(); const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (w.nextNode()) { const t = (w.currentNode.textContent || '').trim(); const el = w.currentNode.parentElement!; if (!t || el.closest('script,style') || !el.getClientRects().length) continue; if (/[A-Za-z]{3,}/.test(t)) out.add(t.slice(0, 60)); }
    document.querySelectorAll('[title],[aria-label],img[alt]').forEach(e => { const t = e.getAttribute('title') || e.getAttribute('aria-label') || ''; if (/[A-Za-z]{3,}/.test(t)) out.add('attr:' + t.slice(0, 40)); });
    return tag + ' => ' + [...out].join(' | '); }, tag);
  console.log(await scan('title'));
  await page.click('#t-play'); await page.waitForTimeout(500); console.log(await scan('intro'));
  await page.click('.intro'); console.log(await scan('create'));
  await page.click('#c-go'); await page.waitForTimeout(1500); console.log(await scan('game'));
  for (const k of ['equip','bag','pets','skills','map','smith','titles','settings']) { await page.click(`.nav [data-k="${k}"]`); await page.waitForTimeout(200); console.log(await scan(k)); }
});
