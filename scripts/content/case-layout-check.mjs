// Layout report of one case in columns of the 12-column grid (rules: scripts/content/case-layout.mjs).
// Report only: exits 0 whatever it finds, so content:check, npm test and CI are not affected.
// Usage: npm run case:layout-check -- <case-id> [--json]
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { loadCases, root } from './case-data.mjs';
import { RULES, layoutIssues } from './case-layout.mjs';
import { caseWarnings } from './validate-case-data.mjs';

const args = process.argv.slice(2);
const id = args.find(arg => !arg.startsWith('--'));
const entry = (await loadCases()).find(({ record }) => record.id === id);
if (!id || !entry?.data) {
  console.error(`Usage: npm run case:layout-check -- <case-id> [--json] (cases with a file: ${(await loadCases()).filter(e => e.data).map(e => e.record.id).join(', ')})`);
  process.exit(2);
}
let manifest = {};
try { manifest = JSON.parse(await readFile(path.join(root, 'assets/cases', id, 'images.json'), 'utf8')).images; } catch {}
const issues = layoutIssues(entry.data, manifest);
const warnings = caseWarnings(entry.data);
if (args.includes('--json')) {
  console.log(JSON.stringify({ case: id, issues, warnings }, null, 2));
  process.exit(0);
}
console.log(`Layout check for case ${id} (report only): ${issues.length} issue(s).`);
for (const [rule, text] of Object.entries(RULES)) {
  const found = issues.filter(i => i.rule === rule);
  if (!found.length) continue;
  console.log(`\n${rule}: ${text}`);
  for (const i of found) {
    const at = i.chapter === null ? 'page' : `${i.chapter} / block ${i.block} (${i.type})`;
    console.log(`- ${at}${i.image ? ` | ${i.image}` : ''} | ${i.message}`);
  }
}
if (!issues.length) console.log('No issues.');
if (warnings.length) console.log(`\nWarnings from the format check (report only):\n- ${warnings.join('\n- ')}`);
