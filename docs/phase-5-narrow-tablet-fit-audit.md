# Phase 5 narrow-tablet fit audit

Updated: 2026-10-23. This audit supports the still-open Milestone 4 preview; it does not approve or lock references.

## Diagnosis

The supplied screenshot is the Figma editor, not a browser screenshot of the overflowing site. Its selected frame is 1194 × 834px, so it does not identify the CSS viewport at which the reported overflow occurred. The exact breakpoint below comes from browser measurements against the current French and English generated pages.

`portfolio-controller.js` selects the mobile presentation below 500 CSS px. At 500px and above it selects the tablet presentation until the existing tablet upper range. Thus 500–659px was a tablet layout, not mobile, and its horizontal layered ticket was still active.

The earlier equal-column calculation `(viewport width − 292px) / 2` did not account for all six titles at their actual rendered widths and is superseded by browser text-range measurements on both generated locales. `Tour de parole` still wraps in the horizontal layout at 780px and becomes one line at 800px; 800px is the smallest tested start width meeting the no-unnecessary-title-wrap criterion in both languages. The same breakpoint is used for every project and locale: the shared Option 2 vertical ticket is active from 500–799px, horizontal tickets begin at 800px, and below 500px the existing mobile editorial presentation remains active.

The navbar's tablet controls were also inheriting viewport scale, making button boxes too short. At the 834px reference width, the logo is about 143px and the status/CTA group is about 385px; including 64px side gutters and a 16px separation, the standard one-row arrangement requires about 608px. Standard tablet (608–833px) keeps logo, status and hire CTA. Narrow tablet (500–607px) hides the status control and section links, showing only logo and hire CTA on one row. Mobile keeps the same two-control composition. All controls retain full-size text and a minimum 44px CTA height. The CTA remains content-sized and fits at 320px in both locales. Locales remain separate `/` and `/en/` routes; the authored header has no language-switch control.

## Measured Option 2 correction and verification

The user subsequently supplied exact measurements from Figma node 387:4523; the earlier screenshot-only measurements are superseded. The fallback keeps the same shared desktop/tablet layered-ticket DOM. At 500–799px, the shared ticket uses the compact Option 2 composition: outer background card up to 596 × 572px with 120px horizontal and 64px vertical reference insets; centered inner panel up to 356 × 444px with 24px padding and 20px vertical gaps; a 308 × 172px cover image; a 24px title (approved vertical-variant exception), 14px description, 12px tags, and a horizontal 38px barcode. Outer card width follows the rail's available width inside the existing 32px page gutters, and the inner panel stays constrained rather than stretching to the outer card. Panel/card height may grow naturally for longer copy. At 800px and above the horizontal ticket keeps the 32px title; desktop and mobile are unchanged.

The existing tablet Projects geometry owner measures the resulting portrait card heights for section allocation and positions narrow landscape cards from the rail's measured height. No second ticket template, scaling transform, timer, additional observer, content edit or asset change was introduced.


Focused Playwright checks passed in French and English at 17 widths: 500, 560, 607, 608, 640, 659, 660, 680, 686, 687, 700, 720, 760, 780, 799, 800 and 834px. They assert the vertical/horizontal boundary, 24/14/12px vertical and 32/14/12px horizontal type, all six canonical projects and links, video/media association, rendered barcode orientation and 38px strip height, title wrapping, locale punctuation, navigation variants and hit areas, orientation change and the Projects-to-About boundary. The reviewed 687–720px interval stays vertical because the horizontal title fit remains cramped. No full suite or Lighthouse run was performed. User visual approval remains pending before references are captured.

The workspace Figma URL itself still returns HTTP 403 through the network proxy; the authoritative dimensions above were supplied directly by the user. The older screenshot-only uncertainty is resolved by that specification, not by estimating coordinates from the Figma canvas screenshot.

The test runner initially observed the controller's new viewport policy one animation frame before the Projects geometry fit. The test now advances the controlled browser clock through that fit frame and then asserts rendered geometry; this was a harness synchronization issue, not a production delay added to the application.
