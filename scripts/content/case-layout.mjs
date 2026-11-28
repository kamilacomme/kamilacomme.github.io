// Layout rules of a case page in columns of the 12-column grid (docs/case-format.md, "Widths in columns").
// Report only: `npm run case:layout-check -- <id>` lists the issues and never fails content:check, npm test or CI.
//
// Every frame and text column gets a width: its `span` from the data, else the default of its block
// (DEFAULT_SPANS, which describes what the block does today). The rules below are checked on those widths.
// hero-reveal, ai-episode, chapter-menu, palette swatches and principles-list keep their own layout and are not checked.

export const AUX_ROLES = ['sketch', 'scheme', 'error', 'detail', 'macro'];
export const BLEED_MIN_WIDTH = 1600;
export const MAX_BLEEDS = 4;
export const MAX_PER_ROW = 4;
export const TEXT_MAX = 6;
export const INTRO_MAX = 8;

/** Widths used when the data gives no span (the layout of each block today). */
export const DEFAULT_SPANS = {
  'image-full': 'bleed for a photograph whose source is 1600px wide or more, 12 for a drawing (sketch) or a smaller frame, 6 for a vertical frame (centred)',
  'image-pair': '6 + 6',
  'image-row-3': '4 + 4 + 4',
  'text-image': 'text 6 + image 6',
  'chapter-intro': 'text 8',
  'rows': 'sequence, detail-grid, outcome-montage, logo-showcase: up to 4 frames in one row; 5–6 frames make rows of 3, 7 and more rows of 4; each frame 12 / frames per row',
  'text': 'text of logo-showcase, palette-swatches, sequence, outcome-montage: 6',
};

/** Proposal (not accepted yet): widths on the 4-column mobile grid. */
export const MOBILE_SPANS = { 3: 2, 4: 2, 6: 4, 8: 4, 12: 4, bleed: 'bleed' };

export const RULES = {
  'aux-too-wide': 'A supporting frame (sketch, scheme, error, detail, macro) is 3–4 columns, at most 6, never full-bleed',
  'bleed-small': 'Full-bleed only for a frame 1600px wide or more',
  'bleed-count': `At most ${MAX_BLEEDS} full-bleed frames on a page`,
  'row-sum': 'The widths of a row add up to 12',
  'row-too-many': `At most ${MAX_PER_ROW} frames in a row`,
  'row-four-not-aux': 'Four frames in a row only for supporting frames',
  'vertical-alone': 'A vertical frame is never alone in the centre: 3–4 columns in a row, 6 beside a 6-column text, or a 6 + 6 pair',
  'text-too-wide': `Body text is at most ${TEXT_MAX} columns, a chapter intro at most ${INTRO_MAX}`,
  'annotated-image': 'annotated-image is deprecated: no call-outs over images',
};

const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const namesOf = image => (image?.art ? [image.art.horizontal, image.art.vertical] : [image?.src]).filter(Boolean);
/** The frame shown on the 12-column grid: the horizontal one of an art-directed pair. */
const mainName = image => (image?.art ? image.art.horizontal : image?.src);

/** Role of an image from its name <case>-<chapter>-<role>-<description>; null when unknown. */
export function roleOf(name, caseId, chapterIds) {
  if (typeof name !== 'string' || !name.startsWith(`${caseId}-`)) return null;
  const rest = name.slice(caseId.length + 1);
  const chapter = [...chapterIds].sort((a, b) => b.length - a.length).find(id => rest.startsWith(`${id}-`));
  return chapter ? rest.slice(chapter.length + 1).split('-')[0] : null;
}

/** Frames per row for a block of n same-size cells (one scheme for sequence, detail-grid, montage, logos). */
export const perRowFor = n => (n <= MAX_PER_ROW ? n : n <= 6 ? 3 : 4);

/**
 * Issues of a case. `manifest` is assets/cases/<id>/images.json → images (intrinsic sizes); without it the
 * size rules are skipped for the frames it does not list.
 */
export function layoutIssues(data, manifest = {}) {
  const issues = [];
  if (!isObject(data) || !Array.isArray(data.chapters)) return issues;
  const chapterIds = data.chapters.map(c => c?.id).filter(Boolean);
  const dims = image => {
    const entry = manifest[mainName(image)];
    if (entry?.width) return [entry.width, entry.height];
    if (typeof image?.ratio === 'string') return image.ratio.split(':').map(Number);
    return null;
  };
  const sourceWidth = image => Math.max(0, ...namesOf(image).map(n => manifest[n]?.width ?? 0));
  const frameOf = (image, span) => {
    const d = dims(image);
    const role = roleOf(mainName(image), data.id, chapterIds);
    return { name: mainName(image) ?? '(placeholder)', span: image?.span ?? span, role, aux: AUX_ROLES.includes(role), portrait: !!d && d[1] > d[0], width: sourceWidth(image) };
  };
  let bleeds = 0;

  data.chapters.forEach((chapter, c) => {
    (chapter?.blocks ?? []).forEach((block, b) => {
      const where = { chapter: chapter.id, block: b, type: block.type };
      const add = (rule, image, message) => issues.push({ ...where, image: image ?? null, rule, message });
      const frames = [];
      const checkFrame = f => {
        if (f.span === 'bleed') bleeds += 1;
        if (f.aux && (f.span === 'bleed' || f.span > 6)) add('aux-too-wide', f.name, `${f.role} frame is ${f.span === 'bleed' ? 'full-bleed' : `${f.span} columns`} (supporting: 3–4, at most 6)`);
        if (f.span === 'bleed' && f.width && f.width < BLEED_MIN_WIDTH) add('bleed-small', f.name, `full-bleed frame is ${f.width}px wide (needs ${BLEED_MIN_WIDTH}px)`);
      };
      const checkRow = (row, label = 'row') => {
        if (row.length > MAX_PER_ROW) add('row-too-many', null, `${label} has ${row.length} frames (at most ${MAX_PER_ROW})`);
        if (row.length === 4 && row.some(f => !f.aux)) add('row-four-not-aux', row.filter(f => !f.aux).map(f => f.name).join(', '), `${label} of four frames includes frames that are not supporting (${[...new Set(row.filter(f => !f.aux).map(f => f.role ?? '?'))].join(', ')})`);
        const sum = row.reduce((s, f) => s + (typeof f.span === 'number' ? f.span : 12), 0);
        if (sum !== 12) add('row-sum', row.map(f => f.name).join(', '), `${label} widths ${row.map(f => f.span).join(' + ')} = ${sum}, not 12`);
      };
      const checkText = (span, max, label) => {
        if (span > max) add('text-too-wide', null, `${label} is ${span} columns (at most ${max})`);
      };
      /** Same-size cells in rows: explicit spans pack rows up to 12, otherwise the frames-per-row scheme. */
      const rowsOf = list => {
        const explicit = list.some(image => image?.span !== undefined);
        if (!explicit) {
          const per = perRowFor(list.length);
          const fs = list.map(image => frameOf(image, 12 / per));
          const rows = [];
          for (let i = 0; i < fs.length; i += per) rows.push(fs.slice(i, i + per));
          return rows;
        }
        const rows = [[]];
        let sum = 0;
        for (const image of list) {
          const f = frameOf(image, 12 / perRowFor(list.length));
          const w = typeof f.span === 'number' ? f.span : 12;
          if (rows.at(-1).length && sum + w > 12) { rows.push([]); sum = 0; }
          rows.at(-1).push(f); sum += w;
        }
        return rows;
      };
      const checkRows = (list, label) => {
        const rows = rowsOf(list);
        rows.forEach((row, i) => { row.forEach(checkFrame); checkRow(row, rows.length > 1 ? `${label} row ${i + 1}` : label); });
      };

      switch (block.type) {
        case 'image-full': {
          const image = block.image ?? {};
          const d = dims(image), width = sourceWidth(image);
          const role = roleOf(mainName(image), data.id, chapterIds);
          // Today: a vertical frame is capped and centred; a drawing or a frame under 1600px sits in a column; else full-bleed.
          const fallback = d && d[1] > d[0] ? 6 : role === 'sketch' || width < BLEED_MIN_WIDTH ? 12 : 'bleed';
          const f = frameOf(image, fallback);
          checkFrame(f);
          if (f.portrait) add('vertical-alone', f.name, `vertical frame alone in an image-full (${f.span === 'bleed' ? 'full-bleed' : `${f.span} columns`}, centred)`);
          break;
        }
        case 'image-pair': { const row = (block.images ?? []).map(image => frameOf(image, 6)); row.forEach(checkFrame); checkRow(row, 'pair'); break; }
        case 'image-row-3': { const row = (block.images ?? []).map(image => frameOf(image, 4)); row.forEach(checkFrame); checkRow(row, 'row of three'); break; }
        case 'text-image': {
          const text = block.span ?? 6;
          const f = frameOf(block.image ?? {}, 6);
          checkFrame(f);
          checkText(text, TEXT_MAX, 'text column');
          const sum = text + (typeof f.span === 'number' ? f.span : 12);
          if (sum !== 12) add('row-sum', f.name, `text ${text} + image ${f.span} = ${sum}, not 12`);
          break;
        }
        case 'chapter-intro': checkText(block.span ?? INTRO_MAX, INTRO_MAX, 'chapter intro'); break;
        case 'sequence': checkRows(block.images ?? [], 'sequence'); if (block.caption) checkText(block.span ?? TEXT_MAX, TEXT_MAX, 'caption'); break;
        case 'detail-grid': checkRows((block.items ?? []).map(item => item?.image ?? {}), 'detail grid'); break;
        case 'outcome-montage': checkRows(block.images ?? [], 'montage'); if (block.text) checkText(block.span ?? TEXT_MAX, TEXT_MAX, 'text'); break;
        case 'logo-showcase': checkRows(block.images ?? [], 'logos'); if (block.text) checkText(block.span ?? TEXT_MAX, TEXT_MAX, 'text'); break;
        case 'palette-swatches': if (block.text) checkText(block.span ?? TEXT_MAX, TEXT_MAX, 'text'); break;
        case 'annotated-image': add('annotated-image', mainName(block.image) ?? null, 'deprecated block: replace with a frame and plain text (no call-outs)'); break;
        default: break; // hero-reveal, ai-episode, chapter-menu, principles-list: own layout, not checked.
      }
    });
  });
  if (bleeds > MAX_BLEEDS) issues.push({ chapter: null, block: null, type: null, image: null, rule: 'bleed-count', message: `${bleeds} full-bleed frames on the page (at most ${MAX_BLEEDS})` });
  return issues;
}
