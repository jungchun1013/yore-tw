import { test } from '@playwright/test';
test.use({ video: 'off' });
for (const lang of ['English', '中文']) test('form ' + lang, async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 1000 });
  await page.goto('https://forms.gle/WvSBbN9uWBYhY27s9', { waitUntil: 'networkidle' });
  await page.getByRole('radio', { name: lang }).click();
  await page.getByRole('button', { name: /繼續|Next/ }).click();
  await page.waitForTimeout(1500);
  console.log('=== ' + lang + ' page 2');
  console.log((await page.locator('body').innerText()).slice(0, 4000));
  // try continuing with nothing filled to see which questions are required
  const btns = await page.getByRole('button').allInnerTexts(); console.log('BUTTONS', JSON.stringify(btns));
  await page.screenshot({ path: `${process.env.OUT}/form-${lang === '中文' ? 'zh' : 'en'}.png`, fullPage: true });
});
