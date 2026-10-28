import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';

const original = 'd8a37314ed7d2265f3f949c9e048b5e2beadfc20';
const paths = execFileSync('git', ['ls-tree', '-r', '--name-only', original], {encoding:'utf8'}).trim().split('\n');
const failures = [];
for (const file of paths) {
  const expected = execFileSync('git', ['show', `${original}:${file}`], {maxBuffer:32*1024*1024});
  if (!fs.existsSync(file) || !crypto.timingSafeEqual(crypto.createHash('sha256').update(expected).digest(), crypto.createHash('sha256').update(fs.readFileSync(file)).digest())) failures.push(file);
}
if (failures.length) throw new Error(`Original website files changed: ${failures.join(', ')}`);
console.log(`PASS: all ${paths.length} original website files are byte-identical to ${original}`);
