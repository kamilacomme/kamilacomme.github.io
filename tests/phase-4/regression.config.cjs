const path = require('node:path');
const base = require('../qa/playwright.config.cjs');

module.exports = {
  ...base,
  testDir: path.resolve(__dirname, '../..'),
  testMatch: ['tests/qa/*.spec.cjs','tests/phase-4/projects.spec.cjs','tests/phase-4/about-content.spec.cjs'],
  snapshotPathTemplate: '{testDir}/tests/phase-4/references/{projectName}/{arg}{ext}',
  outputDir: path.resolve(__dirname, '../../artifacts/playwright/phase-4-results'),
  reporter: [['list'],['json',{outputFile:'artifacts/playwright/phase4-results.json'}],['html',{outputFolder:'artifacts/playwright/phase4-report',open:'never'}]],
};
