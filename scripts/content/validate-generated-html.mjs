import { parse } from 'parse5';

const fail = (label, message) => { throw new Error(`${label}: ${message}`); };
const attrs = (node) => Object.fromEntries((node?.attrs ?? []).map(({ name, value }) => [name, value]));
const hasClass = (node, name) => (attrs(node).class ?? '').split(/\s+/).includes(name);
const elements = (node) => (node?.childNodes ?? []).filter((child) => child.tagName);

function walk(node, visit, ancestors = []) {
  if (node.tagName) visit(node, ancestors);
  const next = node.tagName ? [...ancestors, node] : ancestors;
  for (const child of node.childNodes ?? []) walk(child, visit, next);
}

export function parseGeneratedHTML(html, label = 'HTML') {
  const errors = [];
  const document = parse(html, { sourceCodeLocationInfo: true, onParseError: (error) => errors.push(error) });
  if (errors.length) {
    const details = errors.map(({ code, startLine, startCol }) => `${code} at ${startLine}:${startCol}`).join(', ');
    fail(label, `HTML parser reported ${details}`);
  }
  walk(document, (node, ancestors) => {
    if (node.tagName === 'a' && ancestors.some((ancestor) => ancestor.tagName === 'a')) {
      fail(label, 'nested anchor elements are not allowed');
    }
    // HTML5 parsing repairs nested/missing anchors by implicitly closing the
    // first anchor, so check source locations as well as the recovered DOM.
    if (node.tagName === 'a' && !node.sourceCodeLocation?.endTag) {
      fail(label, 'anchor is missing its explicit closing tag (possibly nested anchor markup)');
    }
  });
  return document;
}

function findById(root, id) {
  let result = null;
  walk(root, (node) => { if (attrs(node).id === id) result = node; });
  return result;
}

function descendantsWithClass(root, className) {
  const result = [];
  walk(root, (node) => { if (hasClass(node, className)) result.push(node); });
  return result;
}

function checkTicket(ticket, label) {
  const ticketAttrs = attrs(ticket);
  if (ticket.tagName !== 'a' || !ticketAttrs.href || !ticketAttrs['data-project-id']) {
    fail(label, 'each .ticket must be a linked project anchor with data-project-id');
  }
  const [panel, ...extraChildren] = elements(ticket);
  if (!panel || extraChildren.length || !hasClass(panel, 'ticket-panel')) {
    fail(label, `${ticketAttrs['data-project-id']} must have exactly one direct .ticket-panel child`);
  }
  const [image, info, barcodeSlot, ...extraPanelChildren] = elements(panel);
  if (!hasClass(image, 'ticket-image') || !hasClass(info, 'ticket-info') ||
      !hasClass(barcodeSlot, 'barcode-slot') || extraPanelChildren.length) {
    fail(label, `${ticketAttrs['data-project-id']} panel layers must be image, info, and barcode in order`);
  }
  if (attrs(image).role !== 'img' || !(attrs(image)['aria-label'] ?? '').trim()) {
    fail(label, `${ticketAttrs['data-project-id']} media preview needs role=img and an accessible name`);
  }
  for (const [node, part] of [[ticket, 'anchor'], [panel, 'panel'], [image, 'media frame'], [info, 'info'], [barcodeSlot, 'barcode slot']]) {
    if (!node.sourceCodeLocation?.endTag) fail(label, `${ticketAttrs['data-project-id']} ${part} is missing its closing tag`);
  }
  const media = elements(image);
  if (!media.length || media.some((node) => !['img', 'video'].includes(node.tagName) || !hasClass(node, 'media-layer'))) {
    fail(label, `${ticketAttrs['data-project-id']} media must contain one or more .media-layer images/videos`);
  }
  const infoChildren = elements(info);
  const textGroup = infoChildren[0];
  const tags = infoChildren[1];
  if (infoChildren.length !== 2 || !elements(textGroup).some((node) => node.tagName === 'h2') ||
      !elements(textGroup).some((node) => node.tagName === 'p') || !hasClass(tags, 'tags')) {
    fail(label, `${ticketAttrs['data-project-id']} info must group title/description and tags`);
  }
  if (!textGroup.sourceCodeLocation?.endTag || !tags.sourceCodeLocation?.endTag) {
    fail(label, `${ticketAttrs['data-project-id']} text group or tags are missing their closing tag`);
  }
  const barcode = elements(barcodeSlot);
  if (barcode.length !== 1 || barcode[0].tagName !== 'svg' || !hasClass(barcode[0], 'barcode')) {
    fail(label, `${ticketAttrs['data-project-id']} needs exactly one SVG barcode inside .barcode-slot`);
  }
}

export function validateTicketList(root, expectedIds, label = 'ticket list') {
  const tickets = descendantsWithClass(root, 'ticket');
  const actualIds = tickets.map((ticket) => attrs(ticket)['data-project-id']);
  if (tickets.length !== expectedIds.length || actualIds.some((id, index) => id !== expectedIds[index])) {
    fail(label, `expected ${expectedIds.length} tickets in canonical order; found ${actualIds.length}: ${actualIds.join(', ')}`);
  }
  if (new Set(actualIds).size !== actualIds.length) fail(label, 'duplicate project IDs found');
  tickets.forEach((ticket) => checkTicket(ticket, label));
}

export function validateGeneratedHTML({ pageHTML, desktopHTML, locale, canonicalOrder, css }) {
  const page = parseGeneratedHTML(pageHTML, `${locale} page`);
  const desktop = parseGeneratedHTML(desktopHTML, `${locale} desktop iframe`);
  const htmlNode = (doc) => elements(doc).find((node) => node.tagName === 'html');
  if (attrs(htmlNode(page)).lang !== locale || attrs(htmlNode(desktop)).lang !== locale) {
    fail(locale, 'generated documents must declare the matching html[lang]');
  }

  const tablet = findById(page, 'kc-tablet-projets');
  const mobile = findById(page, 'kc-mobile-projets');
  const rail = findById(desktop, 'rail');
  if (!tablet || !mobile || !rail) fail(locale, 'missing tablet, mobile, or desktop project container');
  validateTicketList(tablet, canonicalOrder, `${locale} tablet`);
  validateTicketList(rail, canonicalOrder, `${locale} desktop`);

  const mobileIds = descendantsWithClass(mobile, 'project').map((card) => attrs(card)['data-project-id']);
  if (mobileIds.length !== canonicalOrder.length || mobileIds.some((id, index) => id !== canonicalOrder[index])) {
    fail(`${locale} mobile`, `expected ${canonicalOrder.length} editorial cards in canonical order; found ${mobileIds.length}: ${mobileIds.join(', ')}`);
  }
  validateTicketCSS(css, locale);
}

export function validateTicketCSS(css, label = 'ticket CSS') {
  const variables = [
    ['--ticket-outer-radius', '8px'],
    ['--ticket-panel-radius', '4px'],
    ['--ticket-media-radius', '2px'],
    ['--ticket-panel-background', '#f2eef2'],
  ];
  for (const [name, value] of variables) {
    const declarations = [...css.matchAll(new RegExp(`${name}\\s*:\\s*([^;]+)`, 'gi'))];
    if (declarations.length !== 1 || declarations[0][1].trim().toLowerCase() !== value) {
      fail(label, `${name} must have one shared declaration with value ${value}`);
    }
  }
  if (!/\.ticket-panel\s*\{[^}]*border-radius\s*:\s*var\(--ticket-panel-radius\)[^}]*background\s*:\s*var\(--ticket-panel-background\)/s.test(css)) {
    fail(label, '.ticket-panel must own the shared panel radius and background');
  }
  if (!/\.ticket-image\s*\{[^}]*overflow\s*:\s*hidden[^}]*border-radius\s*:\s*var\(--ticket-media-radius\)/s.test(css) ||
      !/\.ticket-image\s+\.media-layer\s*\{[^}]*border-radius\s*:\s*inherit/s.test(css)) {
    fail(label, 'media wrapper and its actual image/video layers must clip to the shared media radius');
  }
  if (/kc-narrow-ticket\s+\.ticket::after\s*\{/.test(css)) {
    fail(label, 'narrow-tablet must not add a second pseudo-panel behind .ticket-panel');
  }
}
