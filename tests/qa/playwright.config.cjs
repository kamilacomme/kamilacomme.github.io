const { defineConfig } = require('@playwright/test');
const matrix = [
  ['desktop', {width:1440,height:900}, false, false, 1],
  ['tablet-portrait', {width:834,height:1112}, true, true, 2],
  ['tablet-landscape', {width:1194,height:834}, true, true, 2],
  ['mobile', {width:393,height:852}, true, true, 2]
];
module.exports = defineConfig({
  testDir: __dirname,
  globalSetup: require.resolve('./global-setup.cjs'),
  testMatch: /.*\.spec\.cjs/,
  timeout: 300000,
  expect: {timeout:15000,toHaveScreenshot:{maxDiffPixelRatio:0.002,threshold:0.15,animations:'disabled',scale:'css'}},
  fullyParallel: false, workers: 1, retries: 0,
  forbidOnly: !!process.env.CI,
  updateSnapshots: process.env.UPDATE_BASELINE === '1' ? 'all' : 'none',
  outputDir: '../../artifacts/playwright/results',
  snapshotPathTemplate: '{testDir}/references/{projectName}/{arg}{ext}',
  reporter: [['list'],['json',{outputFile:'artifacts/playwright/results.json'}],['html',{outputFolder:'artifacts/playwright/report',open:'never'}]],
  use: {
    baseURL: process.env.BASE_URL || 'http://127.0.0.1:8000',
    browserName:'chromium', headless:true,
    launchOptions: {executablePath:process.env.CHROMIUM_PATH || '/usr/bin/chromium',args:['--no-sandbox','--enable-unsafe-swiftshader','--use-angle=swiftshader','--autoplay-policy=no-user-gesture-required']},
    locale:'en-GB', timezoneId:'Europe/Paris', colorScheme:'light', reducedMotion:'no-preference',
    serviceWorkers:'block', trace:'retain-on-failure', screenshot:'only-on-failure',
    video: process.env.RECORD_VIDEO === '1' ? {mode:'on',size:{width:1440,height:1112}} : 'off'
  },
  projects: matrix.flatMap(([mode,viewport,isMobile,hasTouch,deviceScaleFactor]) => ['fr','en'].map(language=>({
    name:`${mode}-${language}`,
    metadata:{mode,language,viewport,isMobile,hasTouch,deviceScaleFactor},
    use:{viewport,isMobile,hasTouch,deviceScaleFactor,
      ...(hasTouch ? {userAgent: mode==='mobile'?'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1':'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'} : {})}
  })))
});
