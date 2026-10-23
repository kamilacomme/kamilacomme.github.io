import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { parseGeneratedHTML, validateGeneratedHTML, validateTicketList } from '../../scripts/content/validate-generated-html.mjs';

const root = new URL('../../', import.meta.url);
const projects = JSON.parse(await readFile(new URL('content/projects.json', root), 'utf8'));
const css = await readFile(new URL('styles/layered-ticket.css', root), 'utf8');
const card = (id = 'pilates') => `<a class="ticket" data-project-id="${id}" href="/project"><div class="ticket-panel"><div class="ticket-image" role="img" aria-label="Preview"><img class="media-layer active" alt="" src="/poster.webp"></div><div class="ticket-info"><div><h2>Title</h2><p>Description</p></div><div class="tags"><span>Tag</span></div></div><div class="barcode-slot"><svg class="barcode" aria-hidden="true"></svg></div></div></a>`;
const html = (body) => `<!doctype html><html lang="fr"><head></head><body>${body}</body></html>`;

test('committed French and English generated pages satisfy the shared-ticket contract', async () => {
  const [page, desktop, enPage, enDesktop] = await Promise.all([
    readFile(new URL('index.html', root), 'utf8'),
    readFile(new URL('desktop-project-embedded.html', root), 'utf8'),
    readFile(new URL('en/index.html', root), 'utf8'),
    readFile(new URL('en/desktop-project-embedded.html', root), 'utf8'),
  ]);
  assert.doesNotThrow(() => validateGeneratedHTML({ pageHTML: page, desktopHTML: desktop, locale: 'fr', canonicalOrder: projects.canonicalOrder, css }));
  assert.doesNotThrow(() => validateGeneratedHTML({ pageHTML: enPage, desktopHTML: enDesktop, locale: 'en', canonicalOrder: projects.canonicalOrder, css }));
});

test('parser rejects malformed nesting and nested anchors', () => {
  assert.throws(() => parseGeneratedHTML(html('<a href="/outer"><a href="/inner">nested</a></a>'), 'negative nested-anchor fixture'), /parser reported|nested anchor/i);
  const missingPanelClose = html('<a class="ticket" data-project-id="pilates" href="/"><div class="ticket-panel"><div class="ticket-image" role="img" aria-label="Preview"></div><div class="ticket-info"><div><h2>T</h2><p>D</p></div><div class="tags"></div><div class="barcode-slot"><svg class="barcode"></svg></div></div></a>');
  assert.throws(() => parseGeneratedHTML(missingPanelClose, 'negative malformed-ticket fixture'), /missing its explicit closing tag/i);
  const misnested = html('<a class="ticket" data-project-id="pilates" href="/"><div class="ticket-panel"><div class="ticket-image" role="img" aria-label="Preview"><img class="media-layer" alt="" src="/poster"></div><div class="ticket-info"><div><h2>T</h2><p>D</p></div><div class="tags"></div></div></div><div class="barcode-slot"><svg class="barcode"></svg></div></a>');
  const doc = parseGeneratedHTML(misnested, 'negative misnested-ticket fixture');
  assert.throws(() => validateTicketList(doc, ['pilates'], 'negative misnested-ticket fixture'), /exactly one direct/i);
});

test('ticket validation rejects duplicate and unexpected cards', () => {
  const duplicate = parseGeneratedHTML(html(card() + card()), 'negative duplicate fixture');
  assert.throws(() => validateTicketList(duplicate, ['pilates'], 'negative duplicate fixture'), /expected 1 tickets|duplicate project IDs/i);
});

test('ticket validation rejects duplicated narrow-tablet pseudo-panels', async () => {
  const validator = await import('../../scripts/content/validate-generated-html.mjs');
  assert.throws(() => validator.validateTicketCSS(css.replace('  #kc-tablet-projets.kc-narrow-ticket .ticket-panel {', '  #kc-tablet-projets.kc-narrow-ticket .ticket::after {\n    background: #f2eef2;\n  }\n  #kc-tablet-projets.kc-narrow-ticket .ticket-panel {')), /must not add a second pseudo-panel/i);
});
