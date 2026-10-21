import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const data = JSON.parse(await readFile(new URL('../../content/projects.json', import.meta.url), 'utf8'));
const baseline = JSON.parse(await readFile(new URL('../../tests/baseline/content-inventory.json', import.meta.url), 'utf8'));
const expectedOrder = ['pilates', 'longread', 'tour-de-parole', 'inside-out', 'celimax', 'napoli'];
const layouts = Object.keys(baseline.layouts);
const locales = ['fr', 'en'];
const ids = data.projects.map(({ id }) => id);

assert.equal(data.schemaVersion, 1, 'Unsupported project data schema');
assert.deepEqual(data.canonicalOrder, expectedOrder, 'Canonical project order changed');
assert.deepEqual(ids.sort(), [...expectedOrder].sort(), 'Project IDs must be exactly the six canonical IDs');
assert.equal(new Set(ids).size, expectedOrder.length, 'Project IDs must be unique');

const byId = new Map(data.projects.map(project => [project.id, project]));
for (const project of data.projects) {
  assert.ok(project.url, `${project.id}: URL is required`);
  assert.deepEqual(Object.keys(project.presentations).sort(), [...layouts].sort(), `${project.id}: presentation layouts are incomplete`);
  assert.deepEqual(Object.keys(project.locales).sort(), [...locales].sort(), `${project.id}: localized content is incomplete`);
  for (const layout of layouts) {
    assert.ok(Array.isArray(project.presentations[layout].media), `${project.id}/${layout}: media must be an array`);
    assert.ok(Array.isArray(project.presentations[layout].styleAssets), `${project.id}/${layout}: styleAssets must be an array`);
  }
}

for (const layout of layouts) for (const locale of locales) {
  const baselineRows = baseline.layouts[layout][locale];
  assert.equal(baselineRows.length, expectedOrder.length, `${layout}/${locale}: frozen inventory count changed`);
  for (const expectedId of expectedOrder) {
    const project = byId.get(expectedId);
    const expected = baselineRows.find(row => row.id === expectedId);
    assert.ok(expected, `${layout}/${locale}: missing frozen record ${expectedId}`);
    const localized = project.locales[locale];
    const override = localized.layoutOverrides[layout] ?? {};
    const actual = {
      id: project.id,
      title: override.title ?? localized.title,
      description: override.description ?? localized.description,
      tags: override.tags ?? localized.tags,
      url: project.url,
      accessibleName: override.accessibleName ?? localized.accessibleName,
      media: project.presentations[layout].media,
      styleAssets: project.presentations[layout].styleAssets,
    };
    for (const key of ['id', 'title', 'description', 'tags', 'url', 'accessibleName', 'media', 'styleAssets']) {
      assert.deepEqual(actual[key], expected[key], `${layout}/${locale}/${expectedId}: ${key} differs from frozen record`);
    }
  }
}

console.log(`Project data valid: ${data.projects.length} projects, ${layouts.length} layouts, ${locales.length} locales; canonical order verified across ${layouts.length * locales.length} output profiles.`);
