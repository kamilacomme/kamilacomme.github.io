// Phase 3 visual references are an explicit overlay: unchanged states resolve
// to the locked Phase 0–1 captures; approved tablet-landscape differences have
// standalone Phase 3 images. This config never runs the baseline recorder.
const path = require('node:path');
const base = require('../qa/playwright.config.cjs');
module.exports = {
  ...base,
  testDir: path.resolve(__dirname, '../qa'),
  globalSetup: path.resolve(__dirname, 'global-setup.cjs'),
  snapshotPathTemplate: '{testDir}/../phase-3/references/{projectName}/{arg}{ext}',
  outputDir: path.resolve(__dirname, '../../artifacts/playwright/phase-3-results')
};
