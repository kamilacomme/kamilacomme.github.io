import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';

const lockPath = 'tests/baseline/artifact-lock.json';
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const walk = dir => fs.readdirSync(dir, {withFileTypes:true}).flatMap(e => e.isDirectory() ? walk(path.join(dir,e.name)) : [path.join(dir,e.name)]);
const artifactFiles = () => [...walk('tests/qa/references'), ...walk('tests/runtime/resources'), ...walk('tests/runtime/licenses'), ...walk('tests/baseline/performance'), 'tests/runtime/manifest.json', 'tests/baseline/content-inventory.json'].sort();
if (process.argv.includes('--record')) {
  if (execFileSync('git',['branch','--show-current'],{encoding:'utf8'}).trim() === 'main') throw new Error('Never record references on main.');
  execFileSync(process.execPath, ['tests/verify-original.mjs'], {stdio:'inherit'});
  if (fs.existsSync(lockPath)) throw new Error('Reference lock exists. Baseline refresh requires explicit review, not an ordinary test run.');
  const files = artifactFiles();
  const inventory = JSON.parse(fs.readFileSync('tests/baseline/content-inventory.json','utf8'));
  for(const mode of ['desktop','tablet-portrait','tablet-landscape','mobile']) for(const language of ['fr','en']) {
    const dir = `tests/qa/references/${mode}-${language}`;
    const capture = JSON.parse(fs.readFileSync(`${dir}/capture-manifest.json`, 'utf8'));
    const projects = JSON.parse(fs.readFileSync(`${dir}/project-capture-manifest.json`, 'utf8'));
    const coreCount = mode === 'mobile' ? 15 : 12;
    const expectedCount = coreCount + 6;
    if(capture.states.length !== coreCount || new Set(capture.states.map(s=>s.name)).size !== coreCount) throw new Error(`Incomplete capture manifest: ${dir}`);
    const expectedProjects = inventory.layouts[mode][language].map(project => project.id);
    if(projects.states.length !== 6 || JSON.stringify(projects.states.map(state => state.id)) !== JSON.stringify(expectedProjects)) throw new Error(`Incomplete project capture manifest: ${dir}`);
    for(const state of capture.states) if(!fs.existsSync(`${dir}/${state.name}.png`)) throw new Error(`Missing declared screenshot ${dir}/${state.name}.png`);
    for(const state of projects.states) if(!fs.existsSync(`${dir}/${state.name}.png`)) throw new Error(`Missing declared project screenshot ${dir}/${state.name}.png`);
    if(walk(dir).filter(f=>f.endsWith('.png')).length !== expectedCount) throw new Error(`Unexpected screenshot count: ${dir}`);
  }
  const performance = JSON.parse(fs.readFileSync('tests/baseline/performance/summary.json','utf8'));
  if (performance.diagnostic || performance.aggregate.length !== 4 || performance.measurements.length < 12) throw new Error('Performance references incomplete.');
  const data = {schemaVersion:1, originalCommit:'d8a37314ed7d2265f3f949c9e048b5e2beadfc20', files:Object.fromEntries(files.sort().map(f=>[f,hash(f)]))};
  fs.writeFileSync(lockPath, JSON.stringify(data,null,2)+'\n');
  console.log(`Locked ${files.length} reference files.`);
} else {
  const lock=JSON.parse(fs.readFileSync(lockPath,'utf8'));
  if(JSON.stringify(Object.keys(lock.files).sort()) !== JSON.stringify(artifactFiles())) throw new Error('Frozen artifact file membership changed.');
  const failures=Object.entries(lock.files).filter(([file,expected])=>!fs.existsSync(file)||hash(file)!==expected).map(([file])=>file);
  if(failures.length) throw new Error(`Frozen baseline was altered: ${failures.join(', ')}`);
  console.log(`PASS: ${Object.keys(lock.files).length} frozen baseline artifacts retain their recorded SHA-256.`);
}
