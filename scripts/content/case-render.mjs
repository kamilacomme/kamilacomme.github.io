// Renders the content of a case page built from content/cases/<id>.json:
// chapter sections, the sticky chapter menu and one container per block.
// Block markup inside the containers is added per block type (docs/case-format.md).
// The chapter menu's behavior is owned by scripts/case/chapter-menu.js; its
// styles by styles/case-content.css.

import { createBlockRenderer, pick } from './case-blocks.mjs';

const UI = {
  fr: { menu: 'Chapitres', open: 'Ouvrir', close: 'Fermer' },
  en: { menu: 'Chapters', open: 'Open', close: 'Close' },
};

export const chapterAnchor = id => `chapter-${id}`;

/**
 * Returns {html, ownsTitle}. A case with a hero-reveal block gets its page title (h1)
 * from that block; otherwise the page builder adds the plain case header.
 */
export function renderCaseContent(data, locale, { escapeText, escapeAttribute, manifest }) {
  const ui = UI[locale];
  const blocks = createBlockRenderer({ caseId: data.id, locale, manifest, escapeText, escapeAttribute });
  const ownsTitle = data.chapters.some(c => c.blocks.some(block => block.type === 'hero-reveal'));
  const textNode = (value, tag, attrs = '') => {
    const t = pick(value, locale);
    if (!t) return '';
    return `<${tag}${attrs}${t.lang ? ` lang="${t.lang}"` : ''}>${escapeText(t.text)}</${tag}>`;
  };
  const menuIndex = data.chapters.findIndex(chapter => chapter.blocks.some(block => block.type === 'chapter-menu'));
  const listed = menuIndex >= 0 ? data.chapters.slice(menuIndex + 1) : [];

  const chapter = c => {
    const anchor = chapterAnchor(c.id);
    const hero = c.blocks.some(block => block.type === 'hero-reveal');
    const parts = c.blocks.filter(block => block.type !== 'chapter-menu').map(block => {
      const inner = blocks[block.type]?.(block, data.meta) ?? '';
      return `<div class="kc-case-block kc-case-block--${block.type}" data-kc-block="${block.type}">${inner}</div>`;
    });
    // The hero chapter's title is only for assistive technology; the hero shows the case title.
    const title = textNode(c.title, 'h2', ` class="kc-case-chapter-title${hero ? ' kc-case-visually-hidden' : ''}" id="${anchor}-title"`);
    // Heading order: the hero block carries the page h1, so the hero chapter's hidden h2 follows it.
    if (hero) parts.splice(1, 0, title);
    const content = parts.join('\n');
    return `<section class="kc-case-chapter${hero ? ' kc-case-chapter--hero' : ''}" id="${anchor}" data-kc-chapter="${escapeAttribute(c.id)}" aria-labelledby="${anchor}-title">\n`
      + `${hero ? '' : `${title}\n`}${content}\n</section>`;
  };

  const menu = () => {
    const items = listed.map(c => {
      const t = pick(c.title, locale);
      if (!t) return '';
      return `<li><a class="kc-case-menu-link" href="#${chapterAnchor(c.id)}" data-kc-case-menu-link="${escapeAttribute(c.id)}"${t.lang ? ` lang="${t.lang}"` : ''}>${escapeText(t.text)}</a></li>`;
    }).join('');
    return `<nav class="kc-case-menu" data-kc-case-menu aria-label="${escapeAttribute(ui.menu)}">\n`
      + `<button type="button" class="kc-case-menu-toggle" aria-expanded="false" aria-controls="kc-case-menu-list" data-kc-case-menu-toggle hidden>`
      + `<span class="kc-case-menu-current" data-kc-case-menu-current data-default="${escapeAttribute(ui.menu)}">${escapeText(ui.menu)}</span>`
      + `<span class="kc-case-menu-action" data-kc-case-menu-action data-open="${escapeAttribute(ui.open)}" data-close="${escapeAttribute(ui.close)}" aria-hidden="true">${escapeText(ui.open)}</span>`
      + `</button>\n<ul class="kc-case-menu-list" id="kc-case-menu-list" data-kc-case-menu-list>${items}</ul>\n</nav>`;
  };

  // Everything after the menu sits in one container, so the sticky menu stays
  // in view through the last chapter and leaves before the Footer.
  if (menuIndex < 0) return { html: data.chapters.map(chapter).join('\n'), ownsTitle };
  const before = data.chapters.slice(0, menuIndex + 1).map(chapter).join('\n');
  return { html: `${before}\n<div class="kc-case-chapters" data-kc-case-chapters>\n${menu()}\n${listed.map(chapter).join('\n')}\n</div>`, ownsTitle };
}
