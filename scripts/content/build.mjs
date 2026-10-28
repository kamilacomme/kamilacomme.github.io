import { readFile, mkdir, writeFile, mkdtemp, rm } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { validateGeneratedHTML } from './validate-generated-html.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const args = process.argv.slice(2);
const outArg = args.find(arg => arg.startsWith('--out='));
const localeArg = args.find(arg => arg.startsWith('--locale='));
const checkOnly = args.includes('--check');
const siteOutput = args.includes('--site');
const requestedLocales = localeArg ? [localeArg.slice('--locale='.length)] : ['fr', 'en'];
if (requestedLocales.some(locale => !['fr', 'en'].includes(locale))) throw new Error('Locale must be fr or en');
const output = checkOnly ? await mkdtemp(path.join(os.tmpdir(), 'kc-phase4-check-'))
  : path.resolve(root, outArg ? outArg.slice('--out='.length) : siteOutput ? '.' : 'dist/phase4-preview');
execFileSync(process.execPath, [path.join(root, 'scripts/content/validate-project-data.mjs')], { stdio: 'inherit' });
const projectsData = JSON.parse(await readFile(path.join(root, 'content/projects.json'), 'utf8'));
const aboutData = JSON.parse(await readFile(path.join(root, 'content/about.json'), 'utf8'));
const ui = JSON.parse(await readFile(path.join(root, 'content/ui.en.json'), 'utf8'));
const site = JSON.parse(await readFile(path.join(root, 'content/site.en.json'), 'utf8'));
const projects = new Map(projectsData.projects.map(project => [project.id, project]));
const canonicalOrder = projectsData.canonicalOrder;
const layeredTicketCSS = await readFile(path.join(root, 'styles/layered-ticket.css'), 'utf8');

const escapeText = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const escapeAttribute = value => escapeText(value).replaceAll('"', '&quot;');
const normalize = value => value.replace(/\s+/g, ' ').trim();
const decodeEntities = value => value
  .replace(/&nbsp;/gi, '\u00a0').replace(/&amp;/gi, '&').replace(/&lt;/gi, '<').replace(/&gt;/gi, '>')
  .replace(/&quot;/gi, '"').replace(/&#39;|&#x27;/gi, "'")
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
  .replace(/&#x([\da-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)));
const translated = new Map(Object.entries(ui.translations).map(([from, to]) => [normalize(from), to]));
function polishEnglishLineBreaks(value) {
  if (!value || value.length < 30 || value.includes('\n')) return value;
  return value.replace(/\b(a|an|of|to|in|on|at|by|for|with|the) ([A-Za-z][A-Za-z’'-]*)/gi, (_, word, next) => `${word}\u00a0${next}`);
}

function normalizeFrenchTypography(value) {
  return value
    .replace(/[ \t\u00a0\u202f]+([?!:;])/g, '\u202f$1')
    .replace(/«[ \t\u00a0\u202f]*/g, '«\u202f')
    .replace(/[ \t\u00a0\u202f]*»/g, '\u202f»');
}

function normalizeFrenchMarkup(html) {
  let result = '', cursor = 0;
  while (cursor < html.length) {
    const open = html.indexOf('<', cursor);
    if (open < 0) { result += normalizeFrenchTypography(html.slice(cursor)); break; }
    result += normalizeFrenchTypography(html.slice(cursor, open));
    if (html.startsWith('<!--', open)) {
      const end = html.indexOf('-->', open + 4);
      const stop = end < 0 ? html.length : end + 3;
      result += html.slice(open, stop); cursor = stop; continue;
    }
    const end = findTagEnd(html, open);
    let tag = html.slice(open, end);
    tag = tag.replace(/\b(aria-label|title|placeholder|alt|content)=("([^"]*)"|'([^']*)')/g,
      (whole, name, quoted, doubleValue, singleValue) => {
        const value = normalizeFrenchTypography(doubleValue ?? singleValue ?? '');
        const quote = quoted[0];
        return `${name}=${quote}${value}${quote}`;
      });
    result += tag;
    const rawTag = /^<\s*(script|style)\b/i.exec(tag);
    cursor = end;
    if (rawTag && !/^<\s*\//.test(tag)) {
      const close = new RegExp(`<\\/\\s*${rawTag[1]}\\s*>`, 'ig');
      close.lastIndex = cursor;
      const match = close.exec(html);
      if (match) { result += html.slice(cursor, match.index) + match[0]; cursor = close.lastIndex; }
    }
  }
  return result;
}

function renderMedia(items, layout) {
  return items.map((item, index) => {
    if (layout === 'desktop') {
      if (item.element === 'img') return `<img alt="" class="media-layer${index === 0 ? ' active' : ''}" decoding="async" loading="${escapeAttribute(item.loading || 'lazy')}" src="${escapeAttribute(item.src)}"/>`;
      return `<video aria-hidden="true" class="media-layer" data-src="${escapeAttribute(item['data-src'])}" loop="" muted="" playsinline="" preload="${escapeAttribute(item.preload || 'none')}"></video>`;
    }
    if (layout === 'tablet') {
      if (item.element === 'img') return `<img alt="" class="media-layer active" decoding="async" loading="${escapeAttribute(item.loading || 'lazy')}" src="${escapeAttribute(item.src)}"/>`;
      return `<video aria-hidden="true" class="media-layer motion" data-src="${escapeAttribute(item['data-src'])}" loop="" muted="" playsinline="" preload="${escapeAttribute(item.preload || 'none')}"></video>`;
    }
    if (item.element === 'img') return `<img class="poster" src="${escapeAttribute(item.src)}" alt="" loading="${escapeAttribute(item.loading || 'lazy')}" />`;
    return `<video class="motion" muted loop playsinline preload="${escapeAttribute(item.preload || 'none')}" poster="${escapeAttribute(item.poster || '')}" data-src="${escapeAttribute(item['data-src'])}" aria-hidden="true"></video>`;
  }).join('');
}

async function renderCards(layout, locale) {
  const output = [];
  for (const id of canonicalOrder) {
    const project = projects.get(id);
    const localized = project.locales[locale];
    const override = localized.layoutOverrides[layout === 'tablet' ? 'tablet-portrait' : layout] ?? {};
    const presentationKey = layout === 'tablet' ? 'tablet-portrait' : layout;
    const presentation = project.presentations[presentationKey];
    const ticketPresentation = layout === 'tablet' ? project.presentations.desktop : presentation;
    const tags = override.tags ?? localized.tags;
    const fields = {
      id,
      url: project.url,
      title: override.title ?? localized.title,
      description: override.description ?? localized.description,
      cardAccessibleName: localized.accessibility.card ?? '',
      mediaAccessibleName: localized.accessibility.mediaPreview,
      // The layered ticket's poster is consumed from an external stylesheet, so
      // use a root path rather than a path relative to /styles/.
      posterStyle: `--poster:url('/${(ticketPresentation.styleAssets[0] ?? '').replace(/^\/+/, '')}')`,
      mediaLayers: renderMedia(presentation.media, layout),
      sequence: (presentation.sequenceByLocale?.[locale] ?? []).join(' '),
    };
    for (let index = 0; index < tags.length; index++) fields[`tag${index}`] = tags[index];
    const templateName = layout === 'mobile' ? 'mobile' : 'layered-ticket';
    let template = await readFile(path.join(root, 'templates/cards', `${templateName}.html`), 'utf8');
    if (layout === 'mobile') {
      const geometry = presentation.geometry;
      const barcodeTemplate = await readFile(path.join(root, 'templates/partials', `mobile-barcode-${geometry.barcodeProfile}.html`), 'utf8');
      fields.cardStyle = geometry.card;
      fields.visualStyle = geometry.visual;
      fields.titleStyle = geometry.title;
      fields.descriptionStyle = geometry.description;
      fields.categoriesStyle = geometry.categories;
      fields.barcode = barcodeTemplate.replace('{{barcodeTop}}', geometry.barcodeTop);
    }
    for (const [key, value] of Object.entries(fields)) {
      const escaped = key === 'mediaLayers' || key === 'barcode' ? value
        : ['title', 'description'].includes(key) || /^tag\d+$/.test(key) ? escapeText(value)
        : escapeAttribute(value);
      template = template.replaceAll(`{{${key}}}`, escaped);
    }
    if (/\{\{[^}]+\}\}/.test(template)) throw new Error(`Unfilled template token in ${layout}/${id}`);
    output.push(template.trim());
  }
  return output.join('');
}

function findTagEnd(html, start) {
  let quote = '';
  for (let i = start; i < html.length; i++) {
    const ch = html[i];
    if (quote) { if (ch === quote) quote = ''; continue; }
    if (ch === '"' || ch === "'") quote = ch;
    else if (ch === '>') return i + 1;
  }
  return html.length;
}

function translateTextNode(value) {
  const decoded = decodeEntities(value);
  const normalized = normalize(decoded);
  const result = translated.get(normalized);
  if (result === undefined) return value;
  const leading = decoded.match(/^\s*/)?.[0] ?? '';
  const trailing = decoded.match(/\s*$/)?.[0] ?? '';
  return escapeText(leading + polishEnglishLineBreaks(result) + trailing);
}

function translateAttributes(tag) {
  return tag.replace(/\b(aria-label|title|placeholder|alt)=("([^"]*)"|'([^']*)')/g, (whole, name, quoted, doubleValue, singleValue) => {
    const value = doubleValue ?? singleValue ?? '';
    const result = translated.get(normalize(decodeEntities(value)));
    if (result === undefined) return whole;
    const quote = quoted[0];
    return `${name}=${quote}${escapeAttribute(result)}${quote}`;
  });
}

function translateMarkup(html) {
  // Preserve the known responsive heading compositions while generating localized text.
  html = html.replace(/<h1 class="heading">[\s\S]*?<\/h1>/, '<h1 class="heading">A selection of my most<br/><em>recent projects.</em></h1>');
  html = html.replace(/(<main class="stage" id="kc-t-stage"><h1>)[\s\S]*?(<\/h1>)/, '$1<span class="kc-title-line">A selection of my</span><span class="kc-title-line"><em>recent projects.</em></span>$2');
  html = html.replace(/(<main id="kc-m-canvas"><h1>)[\s\S]*?(<\/h1>)/, '$1A selection of my<br><em>recent projects.</em>$2');

  let result = '', cursor = 0;
  while (cursor < html.length) {
    const open = html.indexOf('<', cursor);
    if (open < 0) { result += translateTextNode(html.slice(cursor)); break; }
    result += translateTextNode(html.slice(cursor, open));
    if (html.startsWith('<!--', open)) {
      const end = html.indexOf('-->', open + 4);
      const stop = end < 0 ? html.length : end + 3;
      result += html.slice(open, stop); cursor = stop; continue;
    }
    const end = findTagEnd(html, open);
    let tag = html.slice(open, end);
    tag = translateAttributes(tag);
    result += tag;
    const rawTag = /^<\s*(script|style|noscript)\b/i.exec(tag);
    cursor = end;
    if (rawTag && !/^<\s*\//.test(tag)) {
      const close = new RegExp(`<\\/\\s*${rawTag[1]}\\s*>`, 'ig');
      close.lastIndex = cursor;
      const match = close.exec(html);
      if (match) { result += html.slice(cursor, match.index) + match[0]; cursor = close.lastIndex; }
    }
  }
  return result;
}

function addLocaleMetadata(html, locale) {
  if (locale === 'fr') {
    html = html.replace('<head>', '<head>\n<link rel="canonical" href="https://kamilacomme.github.io/">\n<link rel="alternate" hreflang="fr" href="https://kamilacomme.github.io/">\n<link rel="alternate" hreflang="en" href="https://kamilacomme.github.io/en/">');
    return html;
  }
  html = html.replace('<html lang="fr">', '<html lang="en">');
  html = html.replace('<head>', '<head><base href="/">\n<meta property="og:locale" content="en_US">\n<link rel="canonical" href="https://kamilacomme.github.io/en/">\n<link rel="alternate" hreflang="fr" href="https://kamilacomme.github.io/">\n<link rel="alternate" hreflang="en" href="https://kamilacomme.github.io/en/">');
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeText(site.title)}</title>`);
  html = html.replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${escapeAttribute(site.description)}">`);
  html = html.replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${escapeAttribute(site.openGraphTitle)}">`);
  html = html.replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${escapeAttribute(site.openGraphDescription)}">`);
  html = html.replaceAll('content="https://kamilacomme.github.io/"', 'content="https://kamilacomme.github.io/en/"');
  html = html.replace('src="desktop-project-embedded.html"', 'src="/en/desktop-project-embedded.html"');
  html = html.replace(/href="#([^\"]+)"/g, 'href="/en/#$1"');
  return translateMarkup(html);
}

async function buildPage(templatePath, cardSlots, locale, layoutKind) {
  let html = await readFile(templatePath, 'utf8');
  if (layoutKind === 'page' || layoutKind === '404') {
    const partial = await readFile(path.join(root, 'templates/partials/navbar.html'), 'utf8');
    const navLabel = locale === 'fr' ? 'Navigation principale' : 'Main navigation';
    const navHireLabel = locale === 'fr'
      ? 'Me recruter — m’écrire à comme.kamila@gmail.com'
      : 'Hire me — email comme.kamila@gmail.com';
    const navbar = partial
      .replaceAll('{{navVariantClass}}', layoutKind === '404' ? 'kc-404-nav' : '')
      .replaceAll('{{navRefAttr}}', layoutKind === 'page' ? 'ref="{{navRef}}"' : '')
      .replaceAll('{{pillRefAttr}}', layoutKind === 'page' ? 'ref="{{pillRef}}"' : '')
      .replaceAll('{{navLabel}}', escapeAttribute(navLabel))
      .replaceAll('{{navHireLabel}}', escapeAttribute(navHireLabel));
    if (!html.includes('{{navbar}}')) throw new Error(`Missing shared navbar slot in ${templatePath}`);
    html = html.replace('{{navbar}}', navbar);
  }
  if (layoutKind === '404') return `${html.trimEnd()}\n`;
  if (layoutKind === 'page') {
    const switchFields = locale === 'fr'
      ? { languageSwitchHref: '/en/', languageSwitchLabel: 'FR — Langue actuelle : français. Passer en anglais.', languageSwitchLocale: 'fr', languageSwitchText: 'FR', navHireLabel: 'Me recruter — m’écrire à comme.kamila@gmail.com', navLabel: 'Navigation principale' }
      : { languageSwitchHref: '/', languageSwitchLabel: 'EN — Current language: English. Switch to French.', languageSwitchLocale: 'en', languageSwitchText: 'EN', navHireLabel: 'Hire me — email comme.kamila@gmail.com', navLabel: 'Main navigation' };
    for (const [key, value] of Object.entries(switchFields)) {
      html = html.replaceAll(`{{${key}}}`, escapeAttribute(value));
    }
  }
  for (const [slot, markup] of Object.entries(cardSlots)) {
    if (!html.includes(`{{${slot}}}`)) throw new Error(`Missing card slot ${slot} in ${templatePath}`);
    html = html.replace(`{{${slot}}}`, markup);
  }
  if (layoutKind === 'page') {
    for (const layout of ['desktop', 'tablet', 'mobile']) {
      for (const card of aboutData.cards) {
        const text = { ...card.locales[locale], ...card.layoutOverrides[layout]?.[locale] };
        for (const field of ['title', 'description']) {
          const token = `{{about_${layout}_${card.id}_${field}}}`;
          if (!html.includes(token)) throw new Error(`Missing About token ${token}`);
          html = html.replace(token, escapeText(text[field]));
        }
      }
    }
    if (html.includes('{{about_')) throw new Error('Unfilled About content token');
  }
  if (locale === 'en') {
    html = addLocaleMetadata(html, locale);
    if (layoutKind === 'desktop-embed') html = html.replace(/<title>[\s\S]*?<\/title>/, '<title>Portfolio — Projects</title>');
  } else html = addLocaleMetadata(html, locale);
  if (locale === 'fr') html = normalizeFrenchMarkup(html);
  return `${html.trimEnd()}\n`;
}

for (const locale of requestedLocales) {
  const folder = path.join(output, locale === 'fr' ? '' : 'en');
  await mkdir(folder, { recursive: true });
  const desktopCards = await renderCards('desktop', locale);
  const tabletCards = await renderCards('tablet', locale);
  const mobileCards = await renderCards('mobile', locale);
  const page = await buildPage(path.join(root, 'templates/page.html'), { tabletCards, mobileCards }, locale, 'page');
  const desktop = await buildPage(path.join(root, 'templates/desktop-project-embedded.html'), { desktopCards }, locale, 'desktop-embed');
  validateGeneratedHTML({ pageHTML: page, desktopHTML: desktop, locale, canonicalOrder, css: layeredTicketCSS });
  await writeFile(path.join(folder, 'index.html'), page);
  await writeFile(path.join(folder, 'desktop-project-embedded.html'), desktop);
}
const notFound = await buildPage(path.join(root, 'templates/404.html'), {}, 'fr', '404');
await writeFile(path.join(output, '404.html'), notFound);
if (checkOnly) {
  const outputs = requestedLocales.flatMap(locale => {
    const folder = locale === 'fr' ? '' : 'en/';
    return [`${folder}index.html`, `${folder}desktop-project-embedded.html`];
  });
  outputs.push('404.html');
  for (const relative of outputs) {
    const [generated, committed] = await Promise.all([readFile(path.join(output, relative)), readFile(path.join(root, relative))]);
    if (!generated.equals(committed)) throw new Error(`Generated output is stale: ${relative}`);
  }
  await rm(output, { recursive: true, force: true });
  console.log(`Committed output matches deterministic build (${outputs.join(', ')}).`);
} else {
  console.log(`Generated ${requestedLocales.join(' and ').toUpperCase()} static pages in ${path.relative(root, output)}.`);
}
