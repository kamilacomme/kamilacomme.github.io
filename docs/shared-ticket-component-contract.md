# Shared layered-ticket contract

Desktop iframe cards and tablet project cards use the same authored template at `templates/cards/layered-ticket.html`. Mobile keeps its separate editorial template at `templates/cards/mobile.html`; all three render from the canonical project data and order.

## Required structure

Each shared ticket is one linked project card with exactly one `.ticket-panel` child:

```text
a.ticket[data-project-id][href]                 outer project link
└── div.ticket-panel                            inner light-grey panel
    ├── div.ticket-image[role=img][aria-label]   media frame
    │   └── img/video.media-layer…              poster and optional motion layers
    ├── div.ticket-info
    │   ├── div > h2 + p                         title and description
    │   └── div.tags                              project tags
    └── div.barcode-slot > svg.barcode
```

The outer link remains the single interaction target. Do not nest links or add another authored ticket tree for a responsive mode. Desktop and tablet may retain distinct media triggers; their rendered structure remains shared.

## Layer purposes and stylesheet ownership

- `.ticket` owns the outer project link, poster background, fallback color, clipping, and the shared 8px outer radius.
- `.ticket::before` paints the outer project background image from `--poster`.
- `.ticket::after` is the translucent image tint. Desktop and tablet retain their existing tint strengths.
- `.ticket-panel` is the only light-grey panel. It owns the 4px radius, `#F2EEF2` background and panel clipping.
- `.ticket-image` is the media viewport and owns the 2px radius and overflow clip. Its poster background is a loading/failure fallback behind the actual media layers. Each image/video layer inherits the same radius so composited media cannot paint square corners.
- `.barcode-slot` provides the layout box; the existing SVG is the barcode artwork.

The radius tokens and panel color are declared once on `.ticket` in `styles/layered-ticket.css`. Responsive rules change placement, sizing, grid/flex arrangement, and the already-approved typography exceptions. They must not add a second panel, duplicate media, or redefine the shared surface tokens.

## Responsive changes

Desktop and tablet share the structure and common visual tokens. Tablet rules adapt card and panel geometry. The narrow-tablet vertical composition reflows the existing panel and media in place. Mobile continues to use its independent editorial markup. New elements or pseudo-elements are allowed only when their visual or semantic purpose is documented here and generated markup plus affected responsive profiles receive focused validation.

The narrow-tablet `::after` panel override and the `> *` stacking workaround were removed. They duplicated `.ticket-panel`; the normal `::after` tint remains. No third ticket template or runtime clone is permitted by this contract.

## Automated checks

`scripts/content/validate-generated-html.mjs` parses the generated French and English page and desktop-iframe documents with parse5 during every content build/check. It rejects parser errors, nested anchors, wrong language attributes, unexpected/duplicate project cards, noncanonical order, and missing or misnested shared ticket layers. It also checks the shared CSS tokens and media clipping declarations.

`tests/phase-5/shared-ticket-validation.test.mjs` includes negative controls for malformed nesting, duplicate cards, and redundant narrow-tablet pseudo-panels. The focused browser contract test checks computed radii, panel color, media clipping and rendered card geometry in French and English across desktop, tablet portrait, tablet landscape, and narrow tablet. Run it with `npm run test:ticket-contract` and `npx playwright test --config tests/phase-5/playwright.config.cjs tests/phase-5/radius-check.spec.cjs`.
