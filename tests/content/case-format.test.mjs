// Case format and publication gate (docs/case-format.md).
// Run: npm run test:case-format
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { BLOCK_TYPES, validateCaseFormat, validateCaseIndexRecord, validateCasePublication } from '../../scripts/content/validate-case-data.mjs';
import { checkCases } from '../../scripts/content/case-data.mjs';

const read = async file => JSON.parse(await readFile(new URL(file, import.meta.url), 'utf8'));
const example = await read('./fixtures/case-example.json');
const jane = await read('../../content/cases/jane.json');
const clone = value => structuredClone(value);
const allFiles = { assetExists: () => true };

test('the example case uses all 15 block types and passes both levels', () => {
  const used = new Set(example.chapters.flatMap(chapter => chapter.blocks.map(block => block.type)));
  assert.deepEqual([...used].sort(), Object.keys(BLOCK_TYPES).sort());
  assert.equal(used.size, 15);
  assert.deepEqual(validateCaseFormat(example), []);
  assert.deepEqual(validateCasePublication(example, allFiles), []);
});

test('a draft with a placeholder passes the general check and fails the publication check', () => {
  const draft = clone(example);
  draft.chapters[1].blocks[0].text = { en: 'Draft intro.', fr: '', placeholder: true };
  assert.deepEqual(validateCaseFormat(draft), [], 'general check must accept a draft');
  const errors = validateCasePublication(draft, allFiles);
  assert.ok(errors.some(e => e.includes('chapters[1].blocks[0].text: is a placeholder')), errors.join('\n'));
  assert.ok(errors.some(e => e.includes('chapters[1].blocks[0].text: FR text is missing')), errors.join('\n'));
});

test('a placeholder image or file blocks publication', () => {
  const draft = clone(example);
  draft.chapters[2].blocks[0].image = { alt: { en: 'Pending', fr: 'En attente' }, placeholder: true };
  assert.deepEqual(validateCaseFormat(draft), []);
  assert.ok(validateCasePublication(draft, allFiles).some(e => e.includes('chapters[2].blocks[0].image: is a placeholder')));
  const missingFile = validateCasePublication(example, { assetExists: (_, name) => name !== 'example-outcome-photo-two' });
  assert.ok(missingFile.some(e => e.includes('no generated image file for "example-outcome-photo-two"')), missingFile.join('\n'));
});

test('a missing language blocks publication', () => {
  const draft = clone(example);
  delete draft.chapters[0].title.fr;
  assert.deepEqual(validateCaseFormat(draft), []);
  assert.ok(validateCasePublication(draft, allFiles).some(e => e.includes('chapters[0].title: FR text is missing')));
});

test('English is approved first; both approvals are needed to publish', () => {
  const frFirst = clone(example);
  frFirst.approval = { en: false, fr: true };
  assert.ok(validateCaseFormat(frFirst).some(e => e.includes('English is approved first')));
  const enOnly = clone(example);
  enOnly.approval = { en: true, fr: false };
  assert.deepEqual(validateCaseFormat(enOnly), []);
  assert.ok(validateCasePublication(enOnly, allFiles).some(e => e.includes('FR text is not approved')));
});

test('structure errors fail the general check', () => {
  const broken = clone(example);
  broken.chapters[2].blocks[1].images.pop();
  broken.chapters[3].blocks[0].images[0].src = 'Jane Photo.png';
  broken.chapters[4].blocks[0].before[0].crop.w = 0.9;
  broken.chapters[5].blocks.push({ type: 'image-carousel' });
  const errors = validateCaseFormat(broken);
  assert.ok(errors.some(e => e.includes('needs at least 2 image(s)')), errors.join('\n'));
  assert.ok(errors.some(e => e.includes('must be latin kebab-case')), errors.join('\n'));
  assert.ok(errors.some(e => e.includes('crop leaves the image')), errors.join('\n'));
  assert.ok(errors.some(e => e.includes('unknown block type "image-carousel"')), errors.join('\n'));
});

test('image names follow <case>-<chapter>-<role>-<description>', () => {
  const wrongChapter = clone(example);
  wrongChapter.chapters[2].blocks[0].image.src = 'example-campaign-sketch-vines';
  assert.ok(validateCaseFormat(wrongChapter).some(e => e.includes('must be example-nature-to-form-<role>-<description>')));
});

test('Jane (draft) passes the general check and fails the publication check', () => {
  assert.deepEqual(validateCaseFormat(jane, { id: 'jane' }), []);
  const errors = validateCasePublication(jane, allFiles);
  assert.ok(errors.length > 0);
  assert.ok(errors.some(e => e.includes('is a placeholder')));
  assert.ok(errors.some(e => e.includes('EN text is not approved')));
});

test('index: a draft must stay noindex; content:check passes with Jane as a draft', async () => {
  assert.deepEqual(validateCaseIndexRecord({ id: 'jane', file: 'cases/jane.json', status: 'draft', robots: 'noindex, nofollow' }), []);
  assert.ok(validateCaseIndexRecord({ id: 'jane', file: 'cases/jane.json', status: 'draft', robots: 'index, follow' }).some(e => e.includes('noindex')));
  const { errors, summary } = await checkCases();
  assert.deepEqual(errors, []);
  assert.equal(summary.draft, 1);
});

test('focus points, pending crops and montage repeats', () => {
  const c = clone(example);
  c.chapters[2].blocks[0].image.focus = { x: 0.5, y: 0.2 };
  c.chapters[2].blocks[0].image.focusMobile = { x: 0.4, y: 0.25 };
  c.chapters[4].blocks[0].before[0].crop = { placeholder: true };
  c.chapters[6].blocks[0].images[0].src = 'example-campaign-detail-buckle';
  assert.deepEqual(validateCaseFormat(c), []);
  assert.ok(validateCasePublication(c, allFiles).some(e => e.includes('before[0].crop: is a placeholder')));
  const bad = clone(example);
  bad.chapters[2].blocks[0].image.focus = { x: 2, y: 0 };
  bad.chapters[2].blocks[1].images[0].src = 'example-campaign-detail-buckle';
  const errors = validateCaseFormat(bad);
  assert.ok(errors.some(e => e.includes('.focus: must be {x, y}')), errors.join('\n'));
  assert.ok(errors.some(e => e.includes('must be example-nature-to-form-<role>-<description>')), errors.join('\n'));
});

test('SVG logos, annotation over an SVG, and real proportions for pending frames', () => {
  const c = clone(example);
  const identity = c.chapters.find(chapter => chapter.id === 'identity');
  assert.equal(identity.blocks[2].type, 'annotated-image');
  assert.equal(identity.blocks[2].image.format, 'svg');
  const seen = [];
  assert.deepEqual(validateCasePublication(c, { assetExists: (_, name, format) => { seen.push([name, format]); return true; } }), []);
  assert.ok(seen.some(([name, format]) => name === 'example-identity-logo-horizontal' && format === 'svg'));
  identity.blocks[1].images[0] = { format: 'svg', ratio: '1000:148', alt: { en: '', fr: '', placeholder: true }, placeholder: true };
  assert.deepEqual(validateCaseFormat(c), []);
  identity.blocks[1].images[1].ratio = '16/9';
  identity.blocks[1].images[1].format = 'png';
  identity.blocks[2].notes[0].textAt = { x: 1.2, y: 0 };
  const errors = validateCaseFormat(c);
  assert.ok(errors.some(e => e.includes('.ratio: must be "width:height"')), errors.join('\n'));
  assert.ok(errors.some(e => e.includes('.format: must be one of webp, svg')), errors.join('\n'));
  assert.ok(errors.some(e => e.includes('.textAt: must be {x, y}')), errors.join('\n'));
});
