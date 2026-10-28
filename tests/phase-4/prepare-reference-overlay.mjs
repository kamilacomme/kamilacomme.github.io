import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const references = path.join(root, 'tests/phase-4/references');
const phase3 = path.join(root, 'tests/phase-3/references');
const profiles = ['desktop-fr','desktop-en','tablet-portrait-fr','tablet-portrait-en','tablet-landscape-fr','tablet-landscape-en','mobile-fr','mobile-en'];
const orderStates = new Set(['projects-start.png','projects-middle.png','projects-end.png']);

const branch = execFileSync('git', ['branch', '--show-current'], { cwd: root, encoding: 'utf8' }).trim();
if (!branch || branch === 'main') throw new Error('Phase 4 reference overlay requires a dedicated non-main branch.');
if (fs.existsSync(references)) throw new Error(`Refusing to replace existing Phase 4 references at ${references}`);
execFileSync(process.execPath, ['tests/artifact-lock.mjs'], { cwd: root, stdio: 'inherit' });
execFileSync(process.execPath, ['tests/phase-3/reference-lock.mjs'], { cwd: root, stdio: 'inherit' });

fs.mkdirSync(references, { recursive: true });
for (const profile of profiles) {
  const target = path.join(references, profile);
  const source = path.join(phase3, profile);
  if (!profile.startsWith('tablet-')) {
    fs.symlinkSync(path.relative(references, source), target, 'dir');
    continue;
  }
  fs.mkdirSync(target);
  for (const file of fs.readdirSync(source)) {
    if (orderStates.has(file)) continue;
    fs.symlinkSync(path.relative(target, path.join(source, file)), path.join(target, file));
  }
}
console.log('Prepared Phase 4 overlay: inherited references are symlinks; only approved tablet project-order states are reserved for new captures.');
