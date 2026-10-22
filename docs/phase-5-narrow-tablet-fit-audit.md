# Phase 5 narrow-tablet fit audit

Updated: 2026-10-22. This audit supports the still-open Milestone 4 preview; it does not approve or lock references.

## Diagnosis

The supplied screenshot is the Figma editor, not a browser screenshot of the overflowing site. Its selected frame is 1194 × 834px, so it does not identify the CSS viewport at which the reported overflow occurred. The exact breakpoint below comes from browser measurements against the current French and English generated pages.

`portfolio-controller.js` selects the mobile presentation below 500 CSS px. At 500px and above it selects the tablet presentation until the existing tablet upper range. Thus 500–659px was a tablet layout, not mobile, and its horizontal layered ticket was still active.

The horizontal ticket's text/image column width is `(viewport width − 292px) / 2`: the outer card loses 64px page gutters, 96px outer-to-panel insets, 40px inner padding, 40px grid gaps and 52px barcode. At 660px each flexible image/text column is 184px; at 659px it is 183.5px. Browser fit checks across all six projects found the French Tour de parole content first fits at 660px; English content fits at 658px. This makes 660px the smallest width that fits both locales without clipping or overlap. The narrow-tablet vertical variation is therefore active from 500px through 659px. At 660px and above the approved horizontal ticket remains active; below 500px the existing mobile editorial presentation remains active.

The navbar's tablet controls were also inheriting viewport scale, making button boxes too short. At the 834px reference width, the logo is about 143px and the status/CTA group is about 385px; including 64px side gutters and a 16px separation, the one-row arrangement requires about 608px. Tablet navigation keeps full-size text, uses 44px controls with 12px × 24px padding, and reflows below 608px. At 500–607px, the logo and CTA use the first row; the existing section links and status pill use the second row. Locales remain separate `/` and `/en/` routes. The authored header has no language-switch control, so this change preserves the existing language routes rather than adding a new control.

## Change and verification

The fallback keeps the same shared desktop/tablet layered-ticket DOM. CSS changes only its narrow-tablet inner layout: image, text/tags and barcode stack; image and outer card widths use available content width; content height grows naturally. The existing tablet Projects geometry owner measures the resulting card heights for portrait section allocation and positions narrow landscape cards from the rail's measured height. No second ticket template, scaling transform, timer, observer, content edit or asset change was introduced.

Focused Playwright checks passed in French and English at 500, 560, 607, 608, 640, 659, 660, 680 and 834px. They assert the layout boundary, 32/14/12px effective ticket typography, all six canonical projects and links, image/text/tag/barcode bounds, no overlap, card gutters, nav button hit-area heights, and section-link routes. Each run rotates from portrait to 900 × 600 landscape and back to 393 × 852 mobile; the landscape shared-ticket test also passes at standard tablet size in both locales. No full suite or Lighthouse run was performed. The user's visual approval is still required before references are captured.

The test runner initially observed the controller's new viewport policy one animation frame before the Projects geometry fit. The test now advances the controlled browser clock through that fit frame and then asserts rendered geometry; this was a harness synchronization issue, not a production delay added to the application.
