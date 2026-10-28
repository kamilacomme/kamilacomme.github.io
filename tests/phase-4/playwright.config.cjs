const { defineConfig } = require('@playwright/test');
const modes = [
  ['desktop',{width:1440,height:900},false,false,1],
  ['tablet-portrait',{width:834,height:1112},true,true,2],
  ['tablet-landscape',{width:1194,height:834},true,true,2],
  ['mobile',{width:393,height:852},true,true,2]
];
module.exports = defineConfig({
  testDir: __dirname,
  testMatch: /.*\.spec\.cjs/,
  timeout: 120000,
  expect: { timeout: 15000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: process.env.BASE_URL || 'http://127.0.0.1:8001',
    browserName: 'chromium', headless: true,
    launchOptions:{executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--enable-unsafe-swiftshader','--use-angle=swiftshader','--autoplay-policy=no-user-gesture-required']},
    locale:'en-GB',timezoneId:'Europe/Paris',colorScheme:'light',reducedMotion:'no-preference',serviceWorkers:'block',trace:'retain-on-failure'
  },
  projects:modes.flatMap(([mode,viewport,isMobile,hasTouch,deviceScaleFactor])=>['fr','en'].map(language=>({
    name:`${mode}-${language}`,
    metadata:{mode,language,viewport,isMobile,hasTouch,deviceScaleFactor},
    use:{viewport,isMobile,hasTouch,deviceScaleFactor,...(hasTouch?{userAgent:mode==='mobile'?'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1':'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'}:{})}
  })))
});
