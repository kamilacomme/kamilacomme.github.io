// Is a case ready to publish? Runs the publication gate on one case, whatever its status.
// Usage: npm run case:publish-check -- <case-id>
import { loadCases, publicationErrors } from './case-data.mjs';

const id = process.argv[2];
const entry = (await loadCases()).find(({ record }) => record.id === id);
if (!id || !entry?.data) {
  console.error(`Usage: npm run case:publish-check -- <case-id> (cases with a file: ${(await loadCases()).filter(e => e.data).map(e => e.record.id).join(', ')})`);
  process.exit(2);
}
const errors = await publicationErrors(entry.data);
if (errors.length) {
  console.error(`Case ${id} is NOT ready to publish (${errors.length} issue(s)):\n- ${errors.join('\n- ')}`);
  process.exit(1);
}
console.log(`Case ${id} is ready to publish: no placeholders, both languages present and approved, all image files exist.`);
