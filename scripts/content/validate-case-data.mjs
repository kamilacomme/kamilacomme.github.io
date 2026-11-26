// Case-study content format: one JSON file per case in content/cases/<id>.json,
// listed in content/cases.json. The format is described in docs/case-format.md.
//
// Two levels of checks:
// - validateCaseFormat(): always runs (content:check, build, npm test inputs).
//   It checks structure only, so a draft with placeholders and missing French
//   text passes.
// - validateCasePublication(): the publication gate. content:check runs it for
//   every case whose index status is "publish"; `npm run case:publish-check -- <id>`
//   runs it on demand. It fails on any placeholder, missing language, missing
//   approval or missing image file.

export const LOCALES = ['en', 'fr'];
export const STATUSES = ['draft', 'publish'];
export const IMAGE_WIDTHS = [640, 1024, 1600, 2400];

const KEBAB = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const HEX = /^#[0-9a-f]{6}$/i;

// Block types and their fields. L = localized text {en, fr}; I = image; I[] = images.
// `min`/`max` bound array lengths. Optional fields end with "?".
export const BLOCK_TYPES = {
  'hero-reveal': { title: 'L', subtitle: 'L?', image: 'I', facts: 'facts?' },
  'chapter-intro': { text: 'L' },
  'image-full': { image: 'I' },
  'image-pair': { images: { kind: 'I[]', min: 2, max: 2 } },
  'image-row-3': { images: { kind: 'I[]', min: 3, max: 3 } },
  'text-image': { text: 'L', image: 'I', side: 'side' },
  'logo-showcase': { images: { kind: 'I[]', min: 1 }, text: 'L?' },
  'palette-swatches': { swatches: 'swatches', text: 'L?' },
  'annotated-image': { image: 'I', notes: 'notes' },
  'ai-episode': { title: 'L', problem: 'L', before: { kind: 'I[]', min: 1 }, method: 'L', prompt: 'L?', after: { kind: 'I[]', min: 1 } },
  'sequence': { images: { kind: 'I[]', min: 2 }, caption: 'L?' },
  'detail-grid': { items: 'details' },
  'principles-list': { items: 'principles' },
  'outcome-montage': { images: { kind: 'I[]', min: 3 }, text: 'L?' },
  'chapter-menu': {},
};

const IMAGE_FIELDS = new Set(['src', 'format', 'ratio', 'alt', 'caption', 'crop', 'art', 'focus', 'focusMobile', 'placeholder']);
export const IMAGE_FORMATS = ['webp', 'svg'];
const RATIO = /^[1-9]\d*:[1-9]\d*$/;

class Report {
  constructor(label) { this.label = label; this.errors = []; }
  add(where, message) { this.errors.push(`${this.label}${where ? ` ${where}` : ''}: ${message}`); }
}

const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);

function checkLocalized(value, where, report) {
  if (!isObject(value)) return report.add(where, 'must be an object {"en": "...", "fr": "..."}');
  for (const key of Object.keys(value)) {
    if (key === 'placeholder') { if (typeof value[key] !== 'boolean') report.add(where, 'placeholder must be true or false'); continue; }
    if (!LOCALES.includes(key)) report.add(where, `unknown key "${key}" (allowed: en, fr, placeholder)`);
    else if (typeof value[key] !== 'string') report.add(`${where}.${key}`, 'must be a string');
  }
}

function checkImage(image, where, report, ctx) {
  if (!isObject(image)) return report.add(where, 'must be an image object');
  for (const key of Object.keys(image)) if (!IMAGE_FIELDS.has(key)) report.add(where, `unknown image field "${key}"`);
  if (image.placeholder !== undefined && typeof image.placeholder !== 'boolean') report.add(where, 'placeholder must be true or false');
  // A placeholder image may have no file name yet; any name given must follow the rule.
  const names = image.art ? [image.art.horizontal, image.art.vertical] : [image.src];
  if (image.art) {
    if (image.src !== undefined) report.add(where, 'use either "src" or "art", not both');
    if (!isObject(image.art) || Object.keys(image.art).sort().join() !== 'horizontal,vertical') report.add(`${where}.art`, 'must be {"horizontal": name, "vertical": name}');
  } else if (image.src === undefined && image.placeholder !== true) report.add(where, '"src" is required (or mark the image "placeholder": true)');
  for (const name of names) {
    if (name === undefined) continue;
    // One frame belongs to one chapter; only the outcome montage may repeat frames of any chapter.
    const prefix = ctx.anyChapter ? `${ctx.caseId}-` : `${ctx.caseId}-${ctx.chapterId}-`;
    if (typeof name !== 'string' || !KEBAB.test(name)) report.add(where, `image name "${name}" must be latin kebab-case without extension`);
    else if (!name.startsWith(prefix) || name.slice(prefix.length).split('-').length < (ctx.anyChapter ? 3 : 2)) report.add(where, `image name "${name}" must be ${ctx.anyChapter ? `${prefix}<chapter>-` : prefix}<role>-<description>`);
  }
  if (image.format !== undefined && !IMAGE_FORMATS.includes(image.format)) report.add(`${where}.format`, `must be one of ${IMAGE_FORMATS.join(', ')} (default webp)`);
  if (image.format === 'svg' && image.art) report.add(where, 'an SVG has no art-direction pair');
  // Real proportions for a frame not delivered yet, so the layout is final before the file exists.
  if (image.ratio !== undefined && !(typeof image.ratio === 'string' && RATIO.test(image.ratio))) report.add(`${where}.ratio`, 'must be "width:height", e.g. "1000:148"');
  if (image.alt === undefined) report.add(where, '"alt" is required');
  else checkLocalized(image.alt, `${where}.alt`, report);
  if (image.caption !== undefined) checkLocalized(image.caption, `${where}.caption`, report);
  for (const key of ['focus', 'focusMobile']) {
    if (image[key] === undefined) continue;
    const focus = image[key];
    if (!isObject(focus) || [focus.x, focus.y].some(v => typeof v !== 'number' || v < 0 || v > 1)) report.add(`${where}.${key}`, 'must be {x, y} with fractions from 0 to 1 (the point kept in view when the frame is cropped)');
  }
  if (image.crop !== undefined) {
    const crop = image.crop;
    if (!isObject(crop)) report.add(`${where}.crop`, 'must be {x, y, w, h, label}');
    else if (crop.placeholder === true) {
      // A defect crop that Kamila has not marked yet.
      if (crop.label !== undefined) checkLocalized(crop.label, `${where}.crop.label`, report);
    } else {
      for (const key of ['x', 'y', 'w', 'h']) {
        if (typeof crop[key] !== 'number' || crop[key] < 0 || crop[key] > 1) report.add(`${where}.crop.${key}`, 'must be a fraction of the image from 0 to 1');
      }
      if (crop.x + crop.w > 1 || crop.y + crop.h > 1) report.add(`${where}.crop`, 'crop leaves the image');
      if (crop.label === undefined) report.add(`${where}.crop`, '"label" is required');
      else checkLocalized(crop.label, `${where}.crop.label`, report);
    }
  }
}

function checkField(kind, value, where, report, ctx) {
  const spec = typeof kind === 'string' ? { kind } : kind;
  switch (spec.kind) {
    case 'L': return checkLocalized(value, where, report);
    case 'I': return checkImage(value, where, report, ctx);
    case 'I[]': {
      if (!Array.isArray(value)) return report.add(where, 'must be a list of images');
      if (spec.min !== undefined && value.length < spec.min) report.add(where, `needs at least ${spec.min} image(s)`);
      if (spec.max !== undefined && value.length > spec.max) report.add(where, `allows at most ${spec.max} image(s)`);
      return value.forEach((image, i) => checkImage(image, `${where}[${i}]`, report, ctx));
    }
    case 'side': if (!['left', 'right'].includes(value)) report.add(where, 'must be "left" or "right"'); return;
    case 'facts': case 'principles': case 'notes': case 'swatches': case 'details': {
      if (!Array.isArray(value) || !value.length) return report.add(where, 'must be a non-empty list');
      return value.forEach((item, i) => {
        const at = `${where}[${i}]`;
        if (!isObject(item)) return report.add(at, 'must be an object');
        if (spec.kind === 'facts') { checkLocalized(item.label, `${at}.label`, report); checkLocalized(item.value, `${at}.value`, report); }
        if (spec.kind === 'principles') { checkLocalized(item.title, `${at}.title`, report); checkLocalized(item.text, `${at}.text`, report); }
        if (spec.kind === 'notes') {
          for (const key of ['x', 'y']) if (typeof item[key] !== 'number' || item[key] < 0 || item[key] > 1) report.add(`${at}.${key}`, 'must be a fraction from 0 to 1');
          // Optional label position; the marker line runs from the label to (x, y). Fractions of the block.
          if (item.textAt !== undefined && (!isObject(item.textAt) || [item.textAt.x, item.textAt.y].some(v => typeof v !== 'number' || v < 0 || v > 1))) report.add(`${at}.textAt`, 'must be {x, y} with fractions from 0 to 1');
          checkLocalized(item.text, `${at}.text`, report);
        }
        if (spec.kind === 'swatches') {
          if (!(typeof item.hex === 'string' && HEX.test(item.hex)) && item.placeholder !== true) report.add(`${at}.hex`, 'must be #rrggbb');
          checkLocalized(item.name, `${at}.name`, report);
        }
        if (spec.kind === 'details') { checkImage(item.image, `${at}.image`, report, ctx); if (item.text !== undefined) checkLocalized(item.text, `${at}.text`, report); }
      });
    }
    default: report.add(where, `unknown field kind ${spec.kind}`);
  }
}

/** Structural checks; drafts with placeholders and empty French text pass. */
export function validateCaseFormat(data, { id } = {}) {
  const report = new Report(`case ${id ?? data?.id ?? '?'}`);
  if (!isObject(data)) { report.add('', 'file must contain a JSON object'); return report.errors; }
  if (data.schemaVersion !== 1) report.add('schemaVersion', 'must be 1');
  if (id !== undefined && data.id !== id) report.add('id', `must equal the index id "${id}"`);
  if (typeof data.id !== 'string' || !KEBAB.test(data.id)) report.add('id', 'must be latin kebab-case');
  if (!isObject(data.approval)) report.add('approval', 'must be {"en": false, "fr": false}');
  else {
    for (const locale of LOCALES) if (typeof data.approval[locale] !== 'boolean') report.add(`approval.${locale}`, 'must be true or false');
    if (data.approval.fr === true && data.approval.en !== true) report.add('approval', 'English is approved first: fr cannot be approved while en is not');
  }
  if (!isObject(data.meta)) report.add('meta', 'must contain pageTitle and title');
  else { checkLocalized(data.meta.pageTitle, 'meta.pageTitle', report); checkLocalized(data.meta.title, 'meta.title', report); }
  if (!Array.isArray(data.chapters) || !data.chapters.length) { report.add('chapters', 'must be a non-empty list'); return report.errors; }
  const chapterIds = new Set();
  let menus = 0;
  data.chapters.forEach((chapter, c) => {
    const at = `chapters[${c}]`;
    if (!isObject(chapter)) return report.add(at, 'must be an object');
    if (typeof chapter.id !== 'string' || !KEBAB.test(chapter.id)) report.add(`${at}.id`, 'must be latin kebab-case');
    else if (chapterIds.has(chapter.id)) report.add(`${at}.id`, `duplicate chapter id "${chapter.id}"`);
    chapterIds.add(chapter.id);
    checkLocalized(chapter.title, `${at}.title`, report);
    if (!Array.isArray(chapter.blocks)) return report.add(`${at}.blocks`, 'must be a list (may be empty in a draft)');
    chapter.blocks.forEach((block, b) => {
      const where = `${at}(${chapter.id}).blocks[${b}]`;
      if (!isObject(block)) return report.add(where, 'must be an object');
      const fields = BLOCK_TYPES[block.type];
      if (!fields) return report.add(where, `unknown block type "${block.type}"`);
      if (block.type === 'chapter-menu') menus += 1;
      for (const key of Object.keys(block)) {
        if (key !== 'type' && key !== 'placeholder' && !(key in fields)) report.add(where, `unknown field "${key}" for ${block.type}`);
      }
      for (const [field, rawKind] of Object.entries(fields)) {
        const optional = typeof rawKind === 'string' && rawKind.endsWith('?');
        const kind = optional ? rawKind.slice(0, -1) : rawKind;
        if (block[field] === undefined) { if (!optional) report.add(where, `"${field}" is required for ${block.type}`); continue; }
        checkField(kind, block[field], `${where}.${field}`, report, { caseId: data.id, chapterId: chapter.id, anyChapter: block.type === 'outcome-montage' });
      }
    });
  });
  if (menus > 1) report.add('chapters', 'chapter-menu may appear only once');
  // The menu lists the chapters after it, so it closes its chapter.
  data.chapters.forEach((chapter, c) => {
    const blocks = Array.isArray(chapter?.blocks) ? chapter.blocks : [];
    const at = blocks.findIndex(block => block?.type === 'chapter-menu');
    if (at >= 0 && at !== blocks.length - 1) report.add(`chapters[${c}]`, 'chapter-menu must be the last block of its chapter');
    if (at >= 0 && c === data.chapters.length - 1) report.add(`chapters[${c}]`, 'chapter-menu needs chapters after it');
  });
  return report.errors;
}

function walk(value, path, visit) {
  visit(value, path);
  if (Array.isArray(value)) value.forEach((item, i) => walk(item, `${path}[${i}]`, visit));
  else if (isObject(value)) for (const [key, item] of Object.entries(value)) walk(item, path ? `${path}.${key}` : key, visit);
}

/** All image file names a case uses, with their location in the file. */
export function imageNames(data) {
  const names = [];
  walk(data.chapters, 'chapters', (value, path) => {
    if (!isObject(value) || !('alt' in value)) return;
    if (value.src) names.push([value.src, path, value.format ?? 'webp']);
    if (isObject(value.art)) names.push([value.art.horizontal, `${path}.art.horizontal`, 'webp'], [value.art.vertical, `${path}.art.vertical`, 'webp']);
  });
  return names;
}

/**
 * Publication gate. `assetExists(caseId, name)` reports whether at least one
 * generated width of an image exists. Run only for cases that are to be published.
 */
export function validateCasePublication(data, { assetExists } = {}) {
  const report = new Report(`case ${data?.id ?? '?'} (publication)`);
  const structural = validateCaseFormat(data);
  if (structural.length) return structural;
  for (const locale of LOCALES) if (data.approval[locale] !== true) report.add(`approval.${locale}`, `${locale.toUpperCase()} text is not approved`);
  walk(data, '', (value, path) => {
    if (path === 'approval') return;
    if (isObject(value) && value.placeholder === true) report.add(path || 'case', 'is a placeholder');
    // Every localized text needs both languages.
    if (isObject(value) && LOCALES.some(locale => locale in value) && !('src' in value) && !('alt' in value)) {
      for (const locale of LOCALES) if (typeof value[locale] !== 'string' || !value[locale].trim()) report.add(path, `${locale.toUpperCase()} text is missing`);
    }
  });
  for (const chapter of data.chapters) if (!chapter.blocks.length) report.add(`chapter ${chapter.id}`, 'has no blocks');
  if (assetExists) for (const [name, path, format] of imageNames(data)) if (!assetExists(data.id, name, format)) report.add(path, `no ${format === 'svg' ? 'SVG' : 'generated image'} file for "${name}"`);
  return report.errors;
}

/** Index record checks (content/cases.json). Non-published pages must stay out of search engines. */
export function validateCaseIndexRecord(record) {
  const report = new Report(`cases.json ${record?.id ?? '?'}`);
  if (!STATUSES.includes(record.status)) report.add('status', `must be one of ${STATUSES.join(', ')}`);
  if (typeof record.file !== 'string' || record.file !== `cases/${record.id}.json`) report.add('file', `must be "cases/${record.id}.json"`);
  if (record.status !== 'publish' && !/\bnoindex\b/.test(record.robots ?? '')) report.add('robots', 'a draft must stay "noindex, nofollow"');
  return report.errors;
}
