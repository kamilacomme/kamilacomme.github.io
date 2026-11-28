// Markup of the case blocks: hero-reveal, image-pair, ai-episode, chapter-intro, image-full, image-row-3,
// text-image, logo-showcase, palette-swatches, annotated-image, sequence, detail-grid, principles-list,
// outcome-montage (chapter-menu: case-render.mjs).
// Every block is laid out from the width of its own container (styles/case-blocks.css, container queries);
// all blocks except hero-reveal, ai-episode and annotated-image place their frames and text on the 12-column
// grid (4 columns in a narrow container) from `span` or the defaults. hero-reveal fills the first screen.
// Text never comes from here except the small fixed labels of ai-episode (LABELS).
// Missing text or images marked as placeholders render as quiet skeletons, so a draft
// shows its final layout; the publication gate keeps them off a published page.

import { AUX_ROLES, perRowFor, roleOf } from './case-layout.mjs';

const LABELS = {
  fr: { problem: 'Problème', before: 'Avant', method: 'Méthode', prompt: 'Prompt', after: 'Après' },
  en: { problem: 'Problem', before: 'Before', method: 'Method', prompt: 'Prompt', after: 'After' },
};
const DEFAULT_RATIO = [4, 5];
const SIZES_FULL = '100vw';

// Widths in columns (docs/case-format.md, "Widths in columns"). The geometry is owned by styles/case-blocks.css:
// every block root is a 12-column grid (4 columns in a container under 30rem). Here only an authored `span` is
// written down as custom properties (--sp on a frame, --tsp on a text column) and the defaults stay in the
// stylesheet. "bleed" is the grid's full width. On a phone (a container under 30rem) everything is one column
// whatever the span; the only exception is `mobile: "pair"` on an image-pair (data-mobile).
const colsOf = span => (span === 'bleed' ? 12 : span);
const spanVars = (span, name = 'sp') => (span === undefined ? '' : `--${name}:${colsOf(span)};`);
const pct = (cols, of) => `${Math.round((cols / of) * 100)}vw`;
/** `sizes` of an image with an authored span, else the given default hint. */
const sizesOf = (image, fallback) => (image?.span === undefined ? fallback : `(min-width: 500px) ${pct(colsOf(image.span), 12)}, 100vw`);

/** Text for a locale. A draft may lack French: it falls back to English, marked lang="en". */
export function pick(value, locale) {
  if (!value) return null;
  if (typeof value[locale] === 'string' && value[locale].trim()) return { text: value[locale], lang: null };
  if (locale !== 'en' && typeof value.en === 'string' && value.en.trim()) return { text: value.en, lang: 'en' };
  return null;
}

/** Block renderers for one case page. `manifest` is assets/cases/<id>/images.json → images. */
export function createBlockRenderer({ caseId, chapterIds = [], locale, manifest = {}, escapeText, escapeAttribute }) {
  const esc = escapeText, attr = escapeAttribute;
  const ui = LABELS[locale];
  const info = name => (name ? manifest[name] : undefined);
  const dimsOf = (image, name) => {
    const entry = info(name);
    if (entry?.width) return [entry.width, entry.height];
    if (image?.ratio) return image.ratio.split(':').map(Number);
    return null;
  };
  const cssRatio = dims => `${(dims ?? DEFAULT_RATIO)[0]} / ${(dims ?? DEFAULT_RATIO)[1]}`;
  const langAttr = t => (t.lang ? ` lang="${t.lang}"` : '');

  const skeleton = (className, extra = '') => `<div class="kc-case-ph ${className}"${extra} aria-hidden="true" data-placeholder></div>`;
  /** A text element, or a skeleton when the text is still a placeholder; nothing when absent. */
  function text(value, tag, className, skeletonClass) {
    const t = pick(value, locale);
    if (t) return `<${tag} class="${className}"${langAttr(t)}>${esc(t.text)}</${tag}>`;
    return value?.placeholder ? skeleton(skeletonClass ?? className) : '';
  }
  const caption = value => text(value, 'figcaption', 'kc-case-caption', 'kc-case-caption');

  const focusStyle = image => {
    const f = ({ x, y }) => `${(x * 100).toFixed(1)}% ${(y * 100).toFixed(1)}%`;
    return (image.focus ? `--focus:${f(image.focus)};` : '') + (image.focusMobile ? `--focus-m:${f(image.focusMobile)};` : '');
  };
  // Quality rules (docs/case-format.md): a frame is never drawn wider than 1.15x its largest file, and the
  // block narrows and centres instead; drawings (role "sketch" in the image name) stay inside a column.
  const MAX_STRETCH = 1.15;
  const namesOf = image => (image.art ? [image.art.horizontal, image.art.vertical] : [image.src]);
  const mainName = image => (image.art ? image.art.horizontal : image.src);
  const capOf = images => {
    const widths = images.flatMap(namesOf).map(n => info(n)?.widths?.at(-1)).filter(Boolean);
    return widths.length ? Math.round(Math.min(...widths) * MAX_STRETCH) : null;
  };
  const capStyle = cap => (cap ? `--cap:${cap}px;` : '');
  const isSketch = image => namesOf(image).some(n => /-sketch-/.test(n ?? ''));
  const srcsetOf = name => info(name).widths.map(w => `/assets/cases/${caseId}/${name}-${w}.webp ${w}w`).join(', ');
  const fallbackSrc = name => {
    const { widths } = info(name);
    const w = widths.includes(1024) ? 1024 : widths.at(-1);
    return `/assets/cases/${caseId}/${name}-${w}.webp`;
  };
  function imgTag(image, name, { eager = false, sizes }) {
    const entry = info(name);
    const alt = pick(image.alt, locale);
    return `<img src="${fallbackSrc(name)}" srcset="${srcsetOf(name)}" sizes="${sizes}" width="${entry.width}" height="${entry.height}"`
      + ` alt="${alt ? attr(alt.text) : ''}"${alt?.lang ? ` lang="${alt.lang}"` : ''}`
      + (eager ? ' fetchpriority="high"' : ' loading="lazy"') + ' decoding="async">';
  }

  /**
   * One frame: the image cropped to its cell with its own focus point.
   * Returns {html, dims}; `variant` ("wide"/"narrow") marks one half of an art-directed pair.
   */
  function frame(image, name, { eager = false, sizes = SIZES_FULL, variant = '' } = {}) {
    const dims = dimsOf(image, name);
    const classes = `kc-case-frame${variant ? ` kc-case-frame--${variant}` : ''}`;
    const style = `--r:${cssRatio(dims)};${focusStyle(image)}`;
    if (!info(name) || image.placeholder) return { html: `<div class="${classes} kc-case-ph" style="${style}" aria-hidden="true" data-placeholder></div>`, dims };
    if (info(name).format === 'svg') {
      // Vector art (logos) is shown whole on a quiet surface, never cropped.
      const alt = pick(image.alt, locale);
      return { html: `<div class="${classes} kc-case-frame--svg" style="${style}"><img src="/assets/cases/${caseId}/${name}.svg" alt="${alt ? attr(alt.text) : ''}"${alt?.lang ? ` lang="${alt.lang}"` : ''} loading="lazy" decoding="async"></div>`, dims };
    }
    return { html: `<div class="${classes}" style="${style}">${imgTag(image, name, { eager, sizes })}</div>`, dims };
  }

  /** Cells of a row share one size: the first frame's proportions, or 1:1 when orientations differ. */
  function sharedRatio(dimsList) {
    const known = dimsList.filter(Boolean);
    if (!known.length) return cssRatio(null);
    const portrait = known.map(([w, h]) => h > w);
    return portrait.every(p => p === portrait[0]) ? cssRatio(known[0]) : '1 / 1';
  }

  /** A figure for one image of a row or pair; art-directed images carry both frames. */
  function figure(image, sizes, extra = '', { cap = true, style: more = '' } = {}) {
    // Inside a row the container carries the shared cap (--cap); a lone figure carries its own.
    const style = `${cap ? capStyle(capOf([image])) : ''}${spanVars(image.span)}${more}`;
    const open = `<figure class="kc-case-cell"${image.span !== undefined ? ' data-authored' : ''}${style ? ` style="${style}"` : ''}>`;
    if (image.art) {
      const wide = frame(image, image.art.horizontal, { sizes, variant: 'wide' });
      const narrow = frame(image, image.art.vertical, { sizes, variant: 'narrow' });
      return { html: `${open}${wide.html}${narrow.html}${caption(image.caption)}${extra}</figure>`, dims: wide.dims };
    }
    const f = frame(image, image.src, { sizes });
    return { html: `${open}${f.html}${caption(image.caption)}${extra}</figure>`, dims: f.dims };
  }

  function cropOf(image) {
    const c = image.crop, entry = info(image.src);
    if (!c || c.placeholder || !entry?.width) return '';
    const ratio = `${(c.w * entry.width).toFixed(2)} / ${(c.h * entry.height).toFixed(2)}`;
    const label = text(c.label, 'p', 'kc-case-caption kc-case-crop-label');
    const pos = `width:${(100 / c.w).toFixed(3)}%;height:${(100 / c.h).toFixed(3)}%;left:${(-c.x / c.w * 100).toFixed(3)}%;top:${(-c.y / c.h * 100).toFixed(3)}%`;
    return `<div class="kc-case-crop"><div class="kc-case-crop-frame" style="--r:${ratio};max-inline-size:${Math.round(c.w * entry.widths.at(-1) * MAX_STRETCH)}px">`
      + `<img src="/assets/cases/${caseId}/${image.src}-${entry.widths.at(-1)}.webp" style="${pos}" width="${entry.width}" height="${entry.height}" alt="" loading="lazy" decoding="async"></div>${label}</div>`;
  }

  /** Body text: one paragraph per blank line; a skeleton while it is a placeholder. */
  function paragraphs(value, className, skeletonClass) {
    const t = pick(value, locale);
    if (t) return t.text.split(/\n{2,}/).map(part => `<p class="${className}"${langAttr(t)}>${esc(part)}</p>`).join('');
    return value?.placeholder ? skeleton(skeletonClass ?? className) : '';
  }
  /** A row of figures whose cells share one size (see styles/case-blocks.css, .kc-case-row). */
  function rowOf(images, withCrops = false) {
    // `sizes` follows the row's columns: one per frame from a 50rem container.
    const wide = images.length >= 3 ? `(min-width: 800px) ${Math.round(100 / images.length)}vw, ` : '';
    const sizes = `${wide}(min-width: 500px) 50vw, 100vw`;
    const cells = images.map(image => figure(image, sizes, withCrops ? cropOf(image) : '', { cap: false }));
    return `<div class="kc-case-row kc-case-multi" data-n="${images.length}" style="--shared:${sharedRatio(cells.map(c => c.dims))};${capStyle(capOf(images))}">${cells.map(c => c.html).join('')}</div>`;
  }
  /**
   * Flags of a row of frames for the stylesheet. With authored spans: `data-authored`; when the widths differ the
   * frames share one height (`data-uneq`, built from the first authored frame: --ref-sp, --ref-r).
   */
  function rowFlags(images, dimsList) {
    const spans = images.map(image => image?.span);
    if (spans.every(span => span === undefined)) return { attrs: '', style: '', uneq: false };
    const wide = new Set(spans.map(span => (span === undefined ? 'd' : colsOf(span))));
    let attrs = ' data-authored', style = '';
    if (wide.size > 1) {
      const k = spans.findIndex(span => span !== undefined), d = dimsList[k];
      attrs += ' data-uneq';
      style = `--ref-sp:${colsOf(spans[k])};--ref-r:${d ? (d[0] / d[1]).toFixed(4) : '0.8'};`;
    }
    return { attrs, style, uneq: wide.size > 1 };
  }
  /**
   * A block of several rows whose frames all carry a span (e.g. an outcome-montage of 6 + 6 pairs): the frames are
   * packed into rows of 12 columns in order, and each row gets its own size (--shared) and its own 1.15x limit (--cap)
   * on its cells, so a row of verticals stays vertical next to a row of horizontals. Null for a single row or when a
   * frame has no span (then the block-level scheme applies). Frames of unequal widths in one row of a multi-row
   * block are not balanced (use an image-pair or an image-row-3 for them).
   */
  function rowStyles(images, dimsList) {
    if (images.length < 2 || images.some(image => image?.span === undefined)) return null;
    const rows = [[]];
    let sum = 0;
    images.forEach((image, k) => {
      const width = colsOf(image.span);
      if (rows.at(-1).length && sum + width > 12) { rows.push([]); sum = 0; }
      rows.at(-1).push(k);
      sum += width;
    });
    if (rows.length < 2) return null;
    const out = [];
    for (const row of rows) {
      const equal = new Set(row.map(k => colsOf(images[k].span))).size === 1;
      const cap = capStyle(capOf(row.map(k => images[k])));
      for (const k of row) out[k] = `${equal ? `--shared:${sharedRatio(row.map(j => dimsList[j]))};` : ''}${cap}`;
    }
    return out;
  }
  /** Same hint for every frame of a row of n frames without authored spans (see styles/case-blocks.css). */
  const rowSizes = n => `(min-width: 800px) ${pct(1, perRowFor(n))}, (min-width: 500px) ${n === 1 ? '100vw' : '50vw'}, 100vw`;
  const withText = (body, value, span) => {
    const copy = paragraphs(value, 'kc-case-text', 'kc-case-text');
    return copy ? `<div class="kc-case-stack kc-case-cols"${span !== undefined ? ` style="${spanVars(span, 'tsp')}"` : ''}>${body}${copy}</div>` : body;
  };
  /** Rows of sequence, detail-grid and outcome-montage: one grid, frames side by side from their spans. */
  function gridRow(images, cellsHtml, dimsList, extraClass = '') {
    const flags = rowFlags(images, dimsList);
    return `<div class="kc-case-rowgrid kc-case-cols ${extraClass}" data-n="${images.length}"${flags.attrs}`
      + ` style="--shared:${sharedRatio(dimsList)};${flags.uneq ? '' : capStyle(capOf(images))}${flags.style}">${cellsHtml}</div>`;
  }

  return {
    'hero-reveal'(block, meta) {
      const image = block.image;
      const names = image.art ? [image.art.horizontal, image.art.vertical] : [image.src];
      let media;
      if (image.placeholder || names.some(n => !info(n))) {
        media = `<div class="kc-case-hero-media kc-case-ph" style="${focusStyle(image)}" aria-hidden="true" data-placeholder></div>`;
      } else if (image.art) {
        // Full-screen exception: art direction follows the screen, not a container.
        media = `<div class="kc-case-hero-media" style="${focusStyle(image)}"><picture>`
          + `<source media="(orientation: portrait)" srcset="${srcsetOf(image.art.vertical)}" sizes="${SIZES_FULL}" width="${info(image.art.vertical).width}" height="${info(image.art.vertical).height}">`
          + `${imgTag(image, image.art.horizontal, { eager: true, sizes: SIZES_FULL })}</picture></div>`;
      } else {
        media = `<div class="kc-case-hero-media" style="${focusStyle(image)}">${imgTag(image, image.src, { eager: true, sizes: SIZES_FULL })}</div>`;
      }
      const title = pick(block.title, locale) ?? pick(meta.title, locale);
      const subtitle = text(block.subtitle, 'p', 'kc-case-text kc-case-hero-subtitle');
      const facts = (block.facts ?? []).map(fact => {
        const label = pick(fact.label, locale), value = pick(fact.value, locale);
        return label && value ? `<div class="kc-case-fact"><dt class="kc-case-label"${langAttr(label)}>${esc(label.text)}</dt><dd class="kc-case-text"${langAttr(value)}>${esc(value.text)}</dd></div>` : '';
      }).join('');
      return `<div class="kc-case-hero">${media}\n<div class="kc-case-hero-text">`
        + `<h1 class="kc-case-title"${title ? langAttr(title) : ''}>${title ? esc(title.text) : ''}</h1>${subtitle}`
        + `${facts ? `<dl class="kc-case-facts">${facts}</dl>` : ''}</div></div>`;
    },

    'image-pair'(block) {
      const probe = block.images.map(image => dimsOf(image, mainName(image)));
      const flags = rowFlags(block.images, probe);
      const cells = block.images.map(image => figure(image, sizesOf(image, block.mobile === 'pair' ? '50vw' : '(min-width: 500px) 50vw, 100vw'), '', { cap: flags.uneq }));
      const pair = `<div class="kc-case-pair kc-case-cols"${block.mobile === 'pair' ? ' data-mobile="pair"' : ''}${flags.attrs} style="--shared:${sharedRatio(cells.map(c => c.dims))};${flags.uneq ? '' : capStyle(capOf(block.images))}${flags.style}">${cells.map(c => c.html).join('')}</div>`;
      // One caption for the whole pair, drawn once under it (6 columns on a tablet and desktop, the full width on a phone).
      const shared = text(block.caption, 'p', 'kc-case-caption kc-case-pair-caption', 'kc-case-caption');
      return shared ? `<div class="kc-case-stack kc-case-stack--caption kc-case-cols">${pair}${shared}</div>` : pair;
    },

    'ai-episode'(block) {
      // Section labels (Problem / Before / Method / After) are plain text, not headings: the episode title is the only heading.
      const titleHtml = text(block.title, 'h3', 'kc-ai-title');
      const section = (key, body) => `<section class="kc-ai-section kc-ai-section--${key}"><p class="kc-case-label">${esc(ui[key])}</p>${body}</section>`;
      const prompt = block.prompt ? text(block.prompt, 'p', 'kc-ai-prompt', 'kc-ai-prompt') : '';
      return `<article class="kc-ai">`
        + titleHtml
        + section('problem', text(block.problem, 'p', 'kc-case-text'))
        + section('before', rowOf(block.before, true))
        + section('method', text(block.method, 'p', 'kc-case-text') + prompt)
        + section('after', rowOf(block.after))
        + `</article>`;
    },

    'chapter-intro'(block) {
      return `<div class="kc-case-cols kc-case-intro-wrap"${block.span !== undefined ? ` style="${spanVars(block.span, 'tsp')}"` : ''}>${paragraphs(block.text, 'kc-case-intro', 'kc-case-intro')}</div>`;
    },

    'image-full'(block) {
      const dims = dimsOf(block.image, block.image.src);
      const portrait = !!dims && dims[1] > dims[0];
      // A portrait frame is capped in width so it does not become taller than a screen.
      // Full width only for high-resolution photographs (largest file 1600px or more); drawings and smaller frames sit in a column.
      const largest = Math.max(0, ...namesOf(block.image).map(n => info(n)?.widths?.at(-1) ?? 0));
      const fit = isSketch(block.image) || largest < 1600 ? 'column' : 'full';
      // A supporting frame (role sketch, scheme, error, detail, macro) defaults to 6 columns at the left line.
      const aux = AUX_ROLES.includes(roleOf(mainName(block.image), caseId, chapterIds));
      const f = figure(block.image, sizesOf(block.image, portrait || aux ? '(min-width: 704px) 50vw, 100vw' : '100vw'));
      return `<div class="kc-case-full kc-case-cols" data-orient="${portrait ? 'portrait' : 'landscape'}" data-fit="${fit}"${aux ? ' data-aux' : ''}>${f.html}</div>`;
    },

    'image-row-3'(block) {
      const probe = block.images.map(image => dimsOf(image, mainName(image)));
      const flags = rowFlags(block.images, probe);
      const cells = block.images.map(image => figure(image, sizesOf(image, '(min-width: 704px) 33vw, 100vw'), '', { cap: flags.uneq }));
      return `<div class="kc-case-trio kc-case-cols"${flags.attrs} style="--shared:${sharedRatio(cells.map(c => c.dims))};${flags.uneq ? '' : capStyle(capOf(block.images))}${flags.style}">${cells.map(c => c.html).join('')}</div>`;
    },

    'text-image'(block) {
      const f = figure(block.image, sizesOf(block.image, '(min-width: 704px) 50vw, 100vw'));
      return `<div class="kc-case-split kc-case-cols" data-side="${block.side}"${block.span !== undefined ? ` style="${spanVars(block.span, 'tsp')}"` : ''}><div class="kc-case-copy">${paragraphs(block.text, 'kc-case-text', 'kc-case-text')}</div>${f.html}</div>`;
    },

    'logo-showcase'(block) {
      const cells = block.images.map(image => {
        const dims = dimsOf(image, image.src);
        const ar = dims ? (dims[0] / dims[1]).toFixed(4) : '1';
        const inner = !info(image.src) || image.placeholder
          ? `<div class="kc-case-ph kc-case-logo-mark" style="--r:${cssRatio(dims)};--ar:${ar}" aria-hidden="true" data-placeholder></div>`
          : frame(image, image.src).html.replace('kc-case-frame ', 'kc-case-frame kc-case-logo-art ');
        return `<figure class="kc-case-cell kc-case-logo"${image.span !== undefined ? ` data-authored style="${spanVars(image.span)}"` : ''}><div class="kc-case-logo-frame">${inner}</div>${caption(image.caption)}</figure>`;
      });
      const authored = block.images.some(image => image.span !== undefined);
      return withText(`<div class="kc-case-logos kc-case-cols" data-n="${block.images.length}"${authored ? ' data-authored' : ''}>${cells.join('')}</div>`, block.text, block.span);
    },

    'palette-swatches'(block) {
      const items = block.swatches.map(sw => {
        const chip = sw.hex ? `<span class="kc-case-swatch-chip" style="background:${attr(sw.hex)}"></span>` : `<span class="kc-case-swatch-chip kc-case-ph" aria-hidden="true" data-placeholder></span>`;
        return `<li class="kc-case-swatch">${chip}${text(sw.name, 'p', 'kc-case-caption kc-case-swatch-name', 'kc-case-caption')}${sw.hex ? `<span class="kc-case-label">${esc(sw.hex)}</span>` : ''}</li>`;
      });
      return withText(`<ul class="kc-case-swatches kc-case-cols">${items.join('')}</ul>`, block.text, block.span);
    },

    'annotated-image'(block) {
      const stage = frame(block.image, block.image.src, { sizes: '100vw' }).html;
      const notes = block.notes.map((n, i) => {
        // Label anchor: the given position, else the nearer side edge at the marker's height.
        const at = n.textAt ?? { x: n.x < 0.5 ? 0.97 : 0.03, y: n.y };
        return { n, at, letter: String.fromCharCode(65 + i) };
      });
      const pct = v => `${(v * 100).toFixed(2)}%`;
      const lines = notes.map(({ n, at }) => `<line x1="${(n.x * 100).toFixed(2)}" y1="${(n.y * 100).toFixed(2)}" x2="${(at.x * 100).toFixed(2)}" y2="${(at.y * 100).toFixed(2)}" vector-effect="non-scaling-stroke"/>`).join('');
      const markers = notes.map(({ n, letter }) => `<span class="kc-case-marker" style="left:${pct(n.x)};top:${pct(n.y)}" data-l="${letter}" aria-hidden="true"></span>`).join('');
      const items = notes.map(({ n, at, letter }) => {
        const t = pick(n.text, locale);
        const body = t ? `<span${langAttr(t)}>${esc(t.text)}</span>` : (n.text?.placeholder || n.placeholder ? `<span class="kc-case-ph kc-case-note-ph" aria-hidden="true" data-placeholder></span>` : '');
        return `<li class="kc-case-note" style="--tx:${pct(at.x)};--ty:${pct(at.y)}" data-side="${at.x > 0.5 ? 'right' : 'left'}" data-l="${letter}">${body}</li>`;
      }).join('');
      return `<figure class="kc-case-annot" style="${capStyle(capOf([block.image]))}"><div class="kc-case-annot-stage">${stage}`
        + `<svg class="kc-case-annot-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${lines}</svg>${markers}</div>`
        + `<ol class="kc-case-notes">${items}</ol></figure>`;
    },

    'sequence'(block) {
      const probe = block.images.map(image => dimsOf(image, mainName(image)));
      const flags = rowFlags(block.images, probe);
      const rows = rowStyles(block.images, probe);
      const cells = block.images.map((image, i) => figure(image, sizesOf(image, rowSizes(block.images.length)), '', { cap: flags.uneq, style: rows?.[i] ?? '' }));
      return withText(gridRow(block.images, cells.map(c => c.html).join(''), cells.map(c => c.dims)), block.caption, block.span);
    },

    'detail-grid'(block) {
      const images = block.items.map(item => item.image);
      const flags = rowFlags(images, images.map(image => dimsOf(image, image.src)));
      const rows = rowStyles(images, images.map(image => dimsOf(image, image.src)));
      const cells = block.items.map((item, i) => {
        const f = frame(item.image, item.image.src, { sizes: sizesOf(item.image, rowSizes(block.items.length)) });
        const style = `${flags.uneq ? capStyle(capOf([item.image])) : ''}${spanVars(item.image.span)}${rows?.[i] ?? ''}`;
        return { dims: f.dims, html: `<figure class="kc-case-cell"${item.image.span !== undefined ? ' data-authored' : ''}${style ? ` style="${style}"` : ''}>${f.html}${text(item.text, 'figcaption', 'kc-case-caption', 'kc-case-caption')}</figure>` };
      });
      return gridRow(images, cells.map(c => c.html).join(''), cells.map(c => c.dims));
    },

    'principles-list'(block) {
      const items = block.items.map(item => `<li class="kc-case-principle kc-case-cols">${text(item.title, 'h3', 'kc-case-principle-title')}${paragraphs(item.text, 'kc-case-text', 'kc-case-text')}</li>`);
      return `<ul class="kc-case-principles kc-case-cols">${items.join('')}</ul>`;
    },

    'outcome-montage'(block) {
      const probe = block.images.map(image => dimsOf(image, mainName(image)));
      const flags = rowFlags(block.images, probe);
      const rows = rowStyles(block.images, probe);
      const cells = block.images.map((image, i) => figure(image, sizesOf(image, rowSizes(block.images.length)), '', { cap: flags.uneq, style: rows?.[i] ?? '' }));
      return withText(gridRow(block.images, cells.map(c => c.html).join(''), cells.map(c => c.dims)), block.text, block.span);
    },
  };
}
