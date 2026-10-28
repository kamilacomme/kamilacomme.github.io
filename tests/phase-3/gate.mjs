import {spawnSync} from 'node:child_process';
const args = process.argv.slice(2);
if (args.some(arg => /^--(?:update-snapshots|ignore-snapshots|pass-with-no-tests|config|list|ui)(?:=|$)/.test(arg) || /^-u/.test(arg))) {
  throw new Error('Phase 3 gate refuses reference updates, alternate configuration, or comparison bypasses.');
}
const run = command => {
  const result = spawnSync(process.execPath, command, {stdio:'inherit', env:process.env});
  if (result.status !== 0) process.exit(result.status || 1);
};
run(['tests/artifact-lock.mjs']);
run(['tests/verify-lab.cjs']);
run(['--test', 'tests/performance/compare.test.mjs']);
run(['tests/phase-3/reference-lock.mjs']);
run(['node_modules/@playwright/test/cli.js', 'test', '--config', 'tests/phase-3/playwright.config.cjs']);
run(['tests/artifact-lock.mjs']);
run(['tests/phase-3/reference-lock.mjs']);
