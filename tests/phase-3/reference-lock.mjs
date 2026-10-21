import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';

const lockPath = 'tests/phase-3/reference-lock.json';
const profiles = ['tablet-landscape-fr', 'tablet-landscape-en'];
const pngs = profiles.flatMap(profile => fs.readdirSync(`tests/phase-3/references/${profile}`)
  .filter(file => file.endsWith('.png'))
  .map(file => `tests/phase-3/references/${profile}/${file}`)).sort();
const manifests = profiles.flatMap(profile => [
  `tests/phase-3/references/${profile}/capture-manifest.json`,
  `tests/phase-3/references/${profile}/project-capture-manifest.json`
]).sort();
const referenceFiles = [...pngs, ...manifests].sort();
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const expected = profiles.flatMap(profile => fs.readdirSync(`tests/qa/references/${profile}`)
  .filter(file => file.endsWith('.png')).sort().map(file => `tests/phase-3/references/${profile}/${file}`)).sort();
if (JSON.stringify(pngs) !== JSON.stringify(expected) || pngs.length !== 36) {
  throw new Error('Phase 3 reference set must contain the 36 tablet-landscape images with baseline membership.');
}
if (pngs.some(file => fs.lstatSync(file).isSymbolicLink())) {
  throw new Error('Phase 3 tablet-landscape images must be independent captures, not links to frozen originals.');
}
if (manifests.some(file => !fs.existsSync(file))) throw new Error('Phase 3 capture manifests are incomplete.');

if (process.argv.includes('--record')) {
  const branch = execFileSync('git', ['branch', '--show-current'], {encoding:'utf8'}).trim();
  if (!branch || branch === 'main') throw new Error('Phase 3 reference recording is forbidden on main.');
  execFileSync(process.execPath, ['tests/artifact-lock.mjs'], {stdio:'inherit'});
  const data = {
    schemaVersion: 1,
    sourceCommit: execFileSync('git', ['rev-parse', 'HEAD'], {encoding:'utf8'}).trim(),
    approvedDelta: '0.9266667 tablet-landscape Projects scale and independent stable geometry',
    files: Object.fromEntries(referenceFiles.map(file => [file, hash(file)]))
  };
  fs.writeFileSync(lockPath, JSON.stringify(data, null, 2) + '\n');
  console.log(`Locked ${pngs.length} separate Phase 3 screenshots and ${manifests.length} capture manifests.`);
} else {
  const lock = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
  if (JSON.stringify(Object.keys(lock.files).sort()) !== JSON.stringify(referenceFiles)) {
    throw new Error('Phase 3 reference membership changed.');
  }
  const failures = Object.entries(lock.files).filter(([file, sha]) => hash(file) !== sha).map(([file]) => file);
  if (failures.length) throw new Error(`Phase 3 references changed: ${failures.join(', ')}`);
  console.log(`PASS: ${pngs.length} Phase 3 references retain their recorded SHA-256.`);
}
