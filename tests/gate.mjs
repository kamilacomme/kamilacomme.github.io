import {spawnSync} from 'node:child_process';

if (process.env.UPDATE_BASELINE || process.argv.slice(2).some(arg=>/^--(?:update-snapshots|ignore-snapshots|pass-with-no-tests|config|list|ui)(?:=|$)/.test(arg)||/^-u|^-c(?:=|$)/.test(arg))) throw new Error('Regression gate refuses reference updates, alternate configuration and options that bypass comparisons.');
const run = args => {
  const child = spawnSync(process.execPath,args,{stdio:'inherit',env:process.env});
  if(child.status!==0)process.exit(child.status||1);
};
run(['tests/artifact-lock.mjs']);
run(['tests/verify-lab.cjs']);
run(['--test','tests/performance/compare.test.mjs']);
run(['node_modules/@playwright/test/cli.js','test','--config','tests/qa/playwright.config.cjs',...process.argv.slice(2)]);
run(['tests/artifact-lock.mjs']);
