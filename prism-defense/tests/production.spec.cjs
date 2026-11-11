const {test,expect}=require('@playwright/test');
test('shipped static game loads its own font and supports real-time combat without test hooks',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');await page.evaluate(()=>document.fonts.ready);
 expect(await page.evaluate(()=>window.__prism)).toBeUndefined();expect((await page.request.get('/fonts/Cubic_11.woff2')).ok()).toBe(true);expect((await page.request.get('/fonts/Cubic_11-OFL.txt')).ok()).toBe(true);
 await page.click('#begin');const cv=page.locator('#board');const box=await cv.boundingBox();for(const[x,y]of[[3,2],[6,4],[10,7]])await cv.click({position:{x:(x+.5)/18*box.width,y:(y+.5)/12*box.height}});
 await expect(page.locator('#cash')).toHaveText('65');await page.click('#next');await page.click('#speed');await page.click('#speed');await expect.poll(async()=>Number(await page.locator('#kills').innerText()),{timeout:15000}).toBeGreaterThan(0);await page.click('#pause');await expect(page.locator('#pause-label')).toBeVisible();expect(errors).toEqual([]);
});
