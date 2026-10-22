import { spawnSync } from 'node:child_process';

const args=process.argv.slice(2);
if(process.env.UPDATE_BASELINE==='1'||process.env.REGRESSION_PROBE==='1')throw new Error('Phase 4 acceptance refuses baseline recording and negative-control modes.');
if(args.some(arg=>/^--(?:update-snapshots|ignore-snapshots|pass-with-no-tests|config|list|ui)(?:=|$)/.test(arg)||/^-u/.test(arg))){
 throw new Error('Phase 4 gate refuses reference updates, alternate configuration, or comparison bypasses.');
}
const run=command=>{
 const result=spawnSync(process.execPath,command,{stdio:'inherit',env:process.env});
 if(result.status!==0)process.exit(result.status||1);
};
run(['tests/artifact-lock.mjs']);
run(['tests/phase-3/reference-lock.mjs']);
run(['tests/phase-4/reference-lock.mjs']);
run(['scripts/content/validate-project-data.mjs']);
run(['scripts/content/build.mjs','--check']);
run(['node_modules/@playwright/test/cli.js','test','--config','tests/phase-4/regression.config.cjs']);
run(['tests/artifact-lock.mjs']);
run(['tests/phase-3/reference-lock.mjs']);
run(['tests/phase-4/reference-lock.mjs']);
