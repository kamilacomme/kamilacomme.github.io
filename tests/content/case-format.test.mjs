// Case format and publication gate (docs/case-format.md).
// Run: npm run test:case-format
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { BLOCK_TYPES, caseWarnings, validateCaseFormat, validateCaseIndexRecord, validateCasePublication } from '../../scripts/content/validate-case-data.mjs';
import { checkCases } from '../../scripts/content/case-data.mjs';
import { layoutIssues, roleOf } from '../../scripts/content/case-layout.mjs';

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

test('Jane has its final content: it passes the general and the publication check, and stays a noindex draft in the index', () => {
  assert.deepEqual(validateCaseFormat(jane, { id: 'jane' }), []);
  assert.deepEqual(validateCasePublication(jane, allFiles), []);
});

test('ai-episode: refs is an optional list of images', () => {
  const episode = jane.chapters.find(c => c.id === 'designing-with-ai').blocks.find(b => b.type === 'ai-episode' && b.refs);
  assert.ok(episode.refs.length > 0);
  const broken = structuredClone(jane);
  broken.chapters.find(c => c.id === 'designing-with-ai').blocks.find(b => b.refs).refs = 'sketch.png';
  assert.ok(validateCaseFormat(broken, { id: 'jane' }).some(e => e.includes('refs') && e.includes('list of images')));
});

test('index: a draft must stay noindex; content:check passes with Jane as a draft', async () => {
  assert.deepEqual(validateCaseIndexRecord({ id: 'jane', file: 'cases/jane.json', status: 'draft', robots: 'noindex, nofollow' }), []);
  assert.ok(validateCaseIndexRecord({ id: 'jane', file: 'cases/jane.json', status: 'draft', robots: 'index, follow' }).some(e => e.includes('noindex')));
  const { errors, summary } = await checkCases();
  assert.deepEqual(errors, []);
  // Two drafts: Jane and the example page (content/cases/example.json).
  assert.equal(summary.draft, 2);
  assert.equal(summary.publish, 0);
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

test('chapter-menu closes its chapter and has chapters after it', () => {
  const c = clone(example);
  c.chapters[0].blocks.reverse();
  assert.ok(validateCaseFormat(c).some(e => e.includes('chapter-menu must be the last block of its chapter')));
  const last = clone(example);
  last.chapters.at(-1).blocks.push({ type: 'chapter-menu' });
  last.chapters[0].blocks.pop();
  assert.ok(validateCaseFormat(last).some(e => e.includes('chapter-menu needs chapters after it')));
});

// Widths in columns (span) and the layout report (scripts/content/case-layout.mjs).
const index = await read('../../content/cases.json');
const examplePage = await read('../../content/cases/example.json');
const exampleManifest = (await read('../../assets/cases/example/images.json')).images;

test('the example page uses all 15 blocks on real frames and stays a noindex draft', () => {
  const used = new Set(examplePage.chapters.flatMap(chapter => chapter.blocks.map(block => block.type)));
  assert.deepEqual([...used].sort(), Object.keys(BLOCK_TYPES).sort());
  assert.deepEqual(validateCaseFormat(examplePage, { id: 'example' }), []);
  const record = index.cases.find(c => c.id === 'example');
  assert.equal(record.status, 'draft');
  assert.match(record.robots, /noindex/);
  assert.ok(!JSON.stringify(examplePage).includes('"placeholder":true'), 'no grey skeletons on the example page');
});

test('span: columns of 12 on frames and text columns, "bleed" only for image-full', () => {
  const c = clone(example);
  const nature = c.chapters.find(ch => ch.id === 'nature-to-form');
  nature.blocks[0].image.span = 'bleed';
  nature.blocks[1].images[0].span = 4;
  nature.blocks[1].images[1].span = 8;
  nature.blocks[2].span = 4;
  nature.blocks[2].image.span = 8;
  c.chapters.find(ch => ch.id === 'identity').blocks[0].span = 6;
  assert.deepEqual(validateCaseFormat(c), []);
  const bad = clone(example);
  const badNature = bad.chapters.find(ch => ch.id === 'nature-to-form');
  badNature.blocks[1].images[0].span = 5;
  badNature.blocks[1].images[1].span = 'bleed';
  badNature.blocks[2].span = 'bleed';
  bad.chapters[0].blocks[0].image.span = 6;
  bad.chapters.find(ch => ch.id === 'designing-with-ai').blocks[0].after[0].span = 6;
  bad.chapters.find(ch => ch.id === 'campaign').blocks[0].span = 6;
  const errors = validateCaseFormat(bad);
  assert.ok(errors.some(e => e.includes('images[0].span: must be one of 3, 4, 6, 8, 12')), errors.join('\n'));
  assert.ok(errors.some(e => e.includes('images[1].span: "bleed" (full-bleed) is only for the frame of an image-full')), errors.join('\n'));
  assert.ok(errors.some(e => e.includes('.span: text column width must be one of')), errors.join('\n'));
  assert.ok(errors.some(e => e.includes('hero-reveal keeps its own layout')), errors.join('\n'));
  assert.ok(errors.some(e => e.includes('ai-episode keeps its own layout')), errors.join('\n'));
  assert.ok(errors.some(e => e.includes('unknown field "span" for detail-grid')), errors.join('\n'));
});

// A tiny case for the layout rules: one chapter "c", frames sized by a manifest.
const W = { wide: [2400, 1600], small: [1200, 800], tall: [800, 1200] };
const layoutCase = blocks => ({ id: 'x', chapters: [{ id: 'c', blocks }] });
const frame = (role, size = 'wide', extra = {}) => ({ src: `x-c-${role}-${size}-${Math.random().toString(36).slice(2, 7)}`, alt: { en: '', fr: '' }, ...extra });
const manifestOf = data => Object.fromEntries((JSON.stringify(data).match(/x-c-[a-z]+-[a-z]+-[a-z0-9]+/g) ?? []).map(n => [n, { width: W[n.split('-')[3]][0], height: W[n.split('-')[3]][1] }]));
const rulesOf = blocks => { const d = layoutCase(blocks); return layoutIssues(d, manifestOf(d)).map(i => i.rule); };

test('layout: role comes from the image name', () => {
  assert.equal(roleOf('jane-nature-to-form-sketch-vines', 'jane', ['nature-to-form', 'nature']), 'sketch');
  assert.equal(roleOf('jane-campaign-photo-basalt', 'jane', ['campaign']), 'photo');
  assert.equal(roleOf('other-campaign-photo-basalt', 'jane', ['campaign']), null);
});

test('layout rule aux-too-wide: a supporting frame above 6 columns or full-bleed', () => {
  assert.deepEqual(rulesOf([{ type: 'image-pair', images: [frame('sketch'), frame('photo')] }]), []);
  // A supporting frame in an image-full defaults to 6 columns (decision of Kamila, 2026-11-28): no report; 12 is reported.
  for (const role of ['sketch', 'scheme', 'error', 'detail', 'macro']) assert.deepEqual(rulesOf([{ type: 'image-full', image: frame(role) }]), [], `${role} defaults to 6`);
  assert.ok(rulesOf([{ type: 'image-full', image: frame('sketch', 'wide', { span: 12 }) }]).includes('aux-too-wide'), 'an authored 12 is reported');
  assert.ok(rulesOf([{ type: 'image-full', image: frame('detail', 'wide', { span: 'bleed' }) }]).includes('aux-too-wide'));
  assert.ok(rulesOf([{ type: 'image-pair', images: [frame('macro', 'wide', { span: 8 }), frame('photo', 'wide', { span: 4 })] }]).includes('aux-too-wide'));
});

test('layout rule bleed-small: full-bleed under 1600px', () => {
  assert.deepEqual(rulesOf([{ type: 'image-full', image: frame('photo', 'wide') }]), [], 'default bleed at 2400px');
  assert.deepEqual(rulesOf([{ type: 'image-full', image: frame('photo', 'small') }]), [], 'default 12 under 1600px');
  assert.ok(rulesOf([{ type: 'image-full', image: frame('photo', 'small', { span: 'bleed' }) }]).includes('bleed-small'));
});

test('layout rule bleed-count: at most four full-bleed frames', () => {
  const bleeds = n => Array.from({ length: n }, () => ({ type: 'image-full', image: frame('photo', 'wide') }));
  assert.ok(!rulesOf(bleeds(4)).includes('bleed-count'));
  assert.deepEqual(rulesOf(bleeds(5)), ['bleed-count']);
});

test('layout rule row-sum: widths of a row add up to 12', () => {
  assert.deepEqual(rulesOf([{ type: 'image-pair', images: [frame('photo', 'wide', { span: 4 }), frame('photo', 'wide', { span: 8 })] }]), []);
  assert.ok(rulesOf([{ type: 'image-pair', images: [frame('photo', 'wide', { span: 4 }), frame('photo')] }]).includes('row-sum'));
  assert.ok(rulesOf([{ type: 'text-image', side: 'left', text: { en: '', fr: '' }, span: 4, image: frame('photo') }]).includes('row-sum'));
  assert.ok(rulesOf([{ type: 'sequence', images: [frame('detail'), frame('detail'), frame('detail'), frame('detail'), frame('detail')] }]).includes('row-sum'), 'rows of 3: the last row is 4 + 4');
});

test('layout rule row-too-many and row-four-not-aux', () => {
  const four = role => ({ type: 'sequence', images: [frame(role), frame(role), frame(role), frame(role)] });
  assert.deepEqual(rulesOf([four('detail')]), []);
  assert.deepEqual(rulesOf([four('photo')]), ['row-four-not-aux']);
  // Five frames never share a row: the scheme makes rows of 3; an image-row-3 forced to five is reported.
  const five = layoutCase([{ type: 'image-row-3', images: [frame('detail'), frame('detail'), frame('detail'), frame('detail'), frame('detail')] }]);
  assert.ok(layoutIssues(five, manifestOf(five)).some(i => i.rule === 'row-too-many'));
});

test('layout rule vertical-alone: a lone vertical in the centre', () => {
  assert.deepEqual(rulesOf([{ type: 'image-full', image: frame('photo', 'tall') }]), ['vertical-alone']);
  assert.deepEqual(rulesOf([{ type: 'image-pair', images: [frame('photo', 'tall'), frame('photo', 'tall')] }]), []);
  assert.deepEqual(rulesOf([{ type: 'text-image', side: 'left', text: { en: '', fr: '' }, image: frame('photo', 'tall') }]), []);
});

test('layout rule text-too-wide: body text up to 6, chapter intro up to 8', () => {
  assert.deepEqual(rulesOf([{ type: 'chapter-intro', text: { en: '', fr: '' } }]), []);
  assert.deepEqual(rulesOf([{ type: 'chapter-intro', span: 12, text: { en: '', fr: '' } }]), ['text-too-wide']);
  assert.ok(rulesOf([{ type: 'text-image', side: 'left', text: { en: '', fr: '' }, span: 8, image: frame('photo', 'wide', { span: 4 }) }]).includes('text-too-wide'));
  assert.deepEqual(rulesOf([{ type: 'palette-swatches', swatches: [], text: { en: '', fr: '' }, span: 8 }]), ['text-too-wide']);
});

test('layout rule annotated-image: the block is deprecated', () => {
  assert.deepEqual(rulesOf([{ type: 'annotated-image', image: frame('photo'), notes: [] }]), ['annotated-image']);
});

test('layout report on the example page: only the issues kept on purpose', () => {
  const rules = layoutIssues(examplePage, exampleManifest).map(i => `${i.chapter}:${i.rule}`).sort();
  assert.deepEqual(rules, ['campaign:vertical-alone', 'identity:annotated-image', 'nature-to-form:annotated-image', 'nature-to-form:aux-too-wide']);
});

// Phone = one column (decision of Kamila, 2026-11-28); the one exception is mobile: "pair" on an image-pair.
test('mobile: "pair" is allowed only on an image-pair and only as "pair"', () => {
  const c = clone(example);
  const nature = c.chapters.find(ch => ch.id === 'nature-to-form');
  nature.blocks[1].mobile = 'pair';
  assert.deepEqual(validateCaseFormat(c), []);
  nature.blocks[1].mobile = 'row';
  assert.ok(validateCaseFormat(c).some(e => e.includes('.mobile: must be "pair"')));
  nature.blocks[1].mobile = 'pair';
  nature.blocks[2].mobile = 'pair';
  assert.ok(validateCaseFormat(c).some(e => e.includes('unknown field "mobile" for text-image')));
  assert.ok(!('span' in BLOCK_TYPES['image-pair']) && 'mobile' in BLOCK_TYPES['image-pair']);
});

test('layout rule mobile-pair: exactly two frames, all vertical (art-directed counts as vertical)', () => {
  const pair = (images, mobile = 'pair') => [{ type: 'image-pair', mobile, images }];
  assert.deepEqual(rulesOf(pair([frame('photo', 'tall'), frame('photo', 'tall')])), []);
  assert.deepEqual(rulesOf(pair([frame('photo', 'tall'), frame('photo', 'wide')])), ['mobile-pair'], 'one horizontal frame');
  assert.deepEqual(rulesOf([{ type: 'image-pair', images: [frame('photo', 'wide'), frame('photo', 'wide')] }]), [], 'without the mark nothing is said');
  const art = { art: { horizontal: 'x-c-photo-wide-aaaaa', vertical: 'x-c-photo-tall-bbbbb' }, alt: { en: '', fr: '' } };
  const d = layoutCase(pair([frame('photo', 'tall'), art]));
  assert.deepEqual(layoutIssues(d, { ...manifestOf(d), 'x-c-photo-wide-aaaaa': { width: 2400, height: 1600 }, 'x-c-photo-tall-bbbbb': { width: 800, height: 1200 } }).map(i => i.rule), []);
  const three = layoutCase(pair([frame('photo', 'tall'), frame('photo', 'tall'), frame('photo', 'tall')]));
  assert.ok(layoutIssues(three, manifestOf(three)).some(i => i.rule === 'mobile-pair'), 'three frames');
});

// One caption for a whole image-pair (task 03b).
test('image-pair: a caption of its own is allowed; with frame captions too it is a warning, not an error', () => {
  const c = clone(example);
  const pair = c.chapters.find(ch => ch.id === 'nature-to-form').blocks[1];
  assert.equal(pair.type, 'image-pair');
  pair.caption = { en: 'One caption for the pair.', fr: 'Une légende pour la paire.' };
  pair.images.forEach(image => delete image.caption);
  assert.deepEqual(validateCaseFormat(c), []);
  assert.deepEqual(caseWarnings(c), [], 'a pair caption alone is fine');
  pair.images[0].caption = { en: 'Left.', fr: 'Gauche.' };
  assert.deepEqual(validateCaseFormat(c), [], 'both kinds are not an error');
  const warnings = caseWarnings(c);
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /image-pair has a caption of its own and captions on its frames/);
  const bad = clone(c);
  bad.chapters.find(ch => ch.id === 'nature-to-form').blocks[1].caption = 'plain string';
  assert.ok(validateCaseFormat(bad).some(e => e.includes('.caption: must be an object')));
  const other = clone(example);
  other.chapters.find(ch => ch.id === 'nature-to-form').blocks[2].caption = { en: 'x', fr: 'x' };
  assert.ok(validateCaseFormat(other).some(e => e.includes('unknown field "caption" for text-image')), 'only image-pair and the blocks that have one take a caption');
});

test('layout rule mobile-pair-caption: a frame caption over 40 characters under mobile: "pair"', () => {
  const cap = n => ({ en: 'x'.repeat(n), fr: 'y'.repeat(Math.max(0, n - 5)) });
  const pair = (c1, c2, mobile = 'pair') => [{ type: 'image-pair', mobile, images: [frame('photo', 'tall', { caption: c1 }), frame('photo', 'tall', { caption: c2 })] }];
  assert.deepEqual(rulesOf(pair(cap(40), cap(20))), [], 'up to 40 characters is fine');
  assert.deepEqual(rulesOf(pair(cap(41), cap(20))), ['mobile-pair-caption']);
  assert.deepEqual(rulesOf(pair({ en: 'short', fr: 'z'.repeat(45) }, cap(5))), ['mobile-pair-caption'], 'either language counts');
  assert.deepEqual(rulesOf(pair(cap(80), cap(80), undefined).map(b => (delete b.mobile, b))), [], 'without mobile: pair nothing is said');
  const d = layoutCase(pair(cap(60), cap(60)));
  const msg = layoutIssues(d, manifestOf(d)).map(i => i.message).join(' ');
  assert.match(msg, /one caption for the whole pair/);
  const shared = layoutCase([{ type: 'image-pair', mobile: 'pair', caption: cap(200), images: [frame('photo', 'tall'), frame('photo', 'tall')] }]);
  assert.deepEqual(layoutIssues(shared, manifestOf(shared)), [], 'a long caption of the block itself is the intended way');
});

test('the example page shows both pair captions: one for the pair, and two short frame captions', () => {
  const pairs = examplePage.chapters.flatMap(ch => ch.blocks).filter(b => b.type === 'image-pair' && b.mobile === 'pair');
  assert.ok(pairs.some(b => b.caption && b.images.every(i => !i.caption)), 'a pair with one shared caption');
  assert.ok(pairs.some(b => !b.caption && b.images.every(i => i.caption && ['en', 'fr'].every(l => i.caption[l].length <= 40))), 'a pair with two short frame captions');
  assert.deepEqual(caseWarnings(examplePage), []);
});
