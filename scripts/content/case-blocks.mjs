// Markup of the case blocks that are built so far: hero-reveal, image-pair, ai-episode.
// Every block is laid out from the width of its own container (styles/case-blocks.css,
// container queries); the one exception is hero-reveal, which fills the first screen.
// Text never comes from here except the small fixed labels of ai-episode (LABELS).
// Missing text or images marked as placeholders render as quiet skeletons, so a draft
// shows its final layout; the publication gate keeps them off a published page.

const LABELS = {
  fr: { problem: 'Problème', before: 'Avant', method: 'Méthode', prompt: 'Prompt', after: 'Après' },
  en: { problem: 'Problem', before: 'Before', method: 'Method', prompt: 'Prompt', after: 'After' },
};
const DEFAULT_RATIO = [4, 5];
const SIZES_FULL = '100vw';

/** Text for a locale. A draft may lack French: it falls back to English, marked lang="en". */
export function pick(value, locale) {
  if (!value) return null;
  if (typeof value[locale] === 'string' && value[locale].trim()) return { text: value[locale], lang: null };
  if (locale !== 'en' && typeof value.en === 'string' && value.en.trim()) return { text: value.en, lang: 'en' };
  return null;
}

/** Block renderers for one case page. `manifest` is assets/cases/<id>/images.json → images. */
export function createBlockRenderer({ caseId, locale, manifest = {}, escapeText, escapeAttribute }) {
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
  function figure(image, sizes, extra = '') {
    if (image.art) {
      const wide = frame(image, image.art.horizontal, { sizes, variant: 'wide' });
      const narrow = frame(image, image.art.vertical, { sizes, variant: 'narrow' });
      return { html: `<figure class="kc-case-cell">${wide.html}${narrow.html}${caption(image.caption)}${extra}</figure>`, dims: wide.dims };
    }
    const f = frame(image, image.src, { sizes });
    return { html: `<figure class="kc-case-cell">${f.html}${caption(image.caption)}${extra}</figure>`, dims: f.dims };
  }

  function cropOf(image) {
    const c = image.crop, entry = info(image.src);
    if (!c || c.placeholder || !entry?.width) return '';
    const ratio = `${(c.w * entry.width).toFixed(2)} / ${(c.h * entry.height).toFixed(2)}`;
    const label = text(c.label, 'p', 'kc-case-caption kc-case-crop-label');
    const pos = `width:${(100 / c.w).toFixed(3)}%;height:${(100 / c.h).toFixed(3)}%;left:${(-c.x / c.w * 100).toFixed(3)}%;top:${(-c.y / c.h * 100).toFixed(3)}%`;
    return `<div class="kc-case-crop"><div class="kc-case-crop-frame" style="--r:${ratio}">`
      + `<img src="/assets/cases/${caseId}/${image.src}-${entry.widths.at(-1)}.webp" style="${pos}" width="${entry.width}" height="${entry.height}" alt="" loading="lazy" decoding="async"></div>${label}</div>`;
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
      const cells = block.images.map(image => figure(image, '(min-width: 500px) 50vw, 100vw'));
      return `<div class="kc-case-pair" style="--shared:${sharedRatio(cells.map(c => c.dims))}">${cells.map(c => c.html).join('')}</div>`;
    },

    'ai-episode'(block) {
      // Section labels are headings one level under the episode title (h3 → h4), or under the chapter (h2 → h3) while the title is a placeholder.
      const titleHtml = text(block.title, 'h3', 'kc-ai-title');
      const level = titleHtml.startsWith('<h3') ? 4 : 3;
      const section = (key, body) => `<section class="kc-ai-section kc-ai-section--${key}"><h${level} class="kc-case-label">${esc(ui[key])}</h${level}>${body}</section>`;
      const row = (images, withCrops) => {
        // `sizes` follows the row's columns (see styles/case-blocks.css): one per frame from a 50rem container.
        const wide = images.length >= 3 ? `(min-width: 800px) ${Math.round(100 / images.length)}vw, ` : '';
        const sizes = `${wide}(min-width: 500px) 50vw, 100vw`;
        const cells = images.map(image => figure(image, sizes, withCrops ? cropOf(image) : ''));
        return `<div class="kc-case-row" data-n="${images.length}" style="--shared:${sharedRatio(cells.map(c => c.dims))}">${cells.map(c => c.html).join('')}</div>`;
      };
      const prompt = block.prompt ? text(block.prompt, 'p', 'kc-ai-prompt', 'kc-ai-prompt') : '';
      return `<article class="kc-ai">`
        + titleHtml
        + section('problem', text(block.problem, 'p', 'kc-case-text'))
        + section('before', row(block.before, true))
        + section('method', text(block.method, 'p', 'kc-case-text') + prompt)
        + section('after', row(block.after, false))
        + `</article>`;
    },
  };
}
