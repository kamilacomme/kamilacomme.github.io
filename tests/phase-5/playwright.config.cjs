const path = require('node:path');
const base = require('../phase-4/playwright.config.cjs');

module.exports = {
  ...base,
  testDir: __dirname,
  testMatch: ['responsive-shell.spec.cjs'],
  outputDir: path.resolve(__dirname, '../../artifacts/playwright/phase-5-results'),
  reporter: 'list',
};
