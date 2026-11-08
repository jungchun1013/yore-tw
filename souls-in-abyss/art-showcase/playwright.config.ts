import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
 testDir:'.',testMatch:'gallery.spec.ts',timeout:45000,workers:1,reporter:'list',
 use:{baseURL:'http://localhost:4192',acceptDownloads:true},
 webServer:{command:'node build.cjs && python3 -m http.server 4192 --directory dist',cwd:__dirname,url:'http://localhost:4192',reuseExistingServer:false,timeout:60000},
 projects:[{name:'desktop',use:{...devices['Desktop Chrome'],viewport:{width:1440,height:1000}}},{name:'mobile',use:{...devices['Pixel 5']}}],
});
