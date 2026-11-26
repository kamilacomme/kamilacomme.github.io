// Loads content/cases.json and the per-case files, and runs the case checks.
// Used by validate-project-data.mjs (content:check), build.mjs and case-publish-check.mjs.
import { readFile, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { IMAGE_WIDTHS, imageNames, validateCaseFormat, validateCaseIndexRecord, validateCasePublication } from './validate-case-data.mjs';

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

export async function loadCases() {
  const index = JSON.parse(await readFile(path.join(root, 'content/cases.json'), 'utf8'));
  const records = [];
  for (const record of index.cases) {
    // The foundation route is a fixed technical page without a case file.
    const data = record.file ? JSON.parse(await readFile(path.join(root, 'content', record.file), 'utf8')) : null;
    records.push({ record, data });
  }
  return records;
}

export async function assetExists(caseId, name) {
  // assets/cases/<id>/images.json is written by build-case-images.mjs with the widths of each image.
  let widths = IMAGE_WIDTHS;
  try { widths = JSON.parse(await readFile(path.join(root, 'assets/cases', caseId, 'images.json'), 'utf8')).images[name]?.widths ?? []; } catch {}
  for (const width of widths) {
    try { await access(path.join(root, 'assets/cases', caseId, `${name}-${width}.webp`)); return true; } catch {}
  }
  return false;
}

// validateCasePublication is synchronous: resolve file existence up front.
export async function publicationErrors(data) {
  const known = new Map();
  if (Array.isArray(data?.chapters)) for (const [name] of imageNames(data)) known.set(name, await assetExists(data.id, name));
  return validateCasePublication(data, { assetExists: (_, name) => known.get(name) === true });
}

/** content:check: structure for every case; the publication gate only for status "publish". */
export async function checkCases() {
  const errors = [];
  const summary = { draft: 0, publish: 0, preview: 0 };
  for (const { record, data } of await loadCases()) {
    if (!record.file) {
      if (record.preview !== true || !/\bnoindex\b/.test(record.robots ?? '')) errors.push(`cases.json ${record.id}: a record without a case file must be a noindex preview route`);
      summary.preview += 1;
      continue;
    }
    errors.push(...validateCaseIndexRecord(record), ...validateCaseFormat(data, { id: record.id }));
    if (record.status === 'publish') errors.push(...await publicationErrors(data));
    summary[record.status] = (summary[record.status] ?? 0) + 1;
  }
  return { errors, summary };
}
