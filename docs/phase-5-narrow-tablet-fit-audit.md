# Phase 5 narrow-tablet fit audit

Updated: 2026-10-22. This audit supports the still-open Milestone 4 preview; it does not approve or lock references.

## Diagnosis

The supplied screenshot is the Figma editor, not a browser screenshot of the overflowing site. Its selected frame is 1194 × 834px, so it does not identify the CSS viewport at which the reported overflow occurred. The exact breakpoint below comes from browser measurements against the current French and English generated pages.

`portfolio-controller.js` selects the mobile presentation below 500 CSS px. At 500px and above it selects the tablet presentation until the existing tablet upper range. Thus 500–659px was a tablet layout, not mobile, and its horizontal layered ticket was still active.

The horizontal ticket's text/image column width is `(viewport width − 292px) / 2`: the outer card loses 64px page gutters, 96px outer-to-panel insets, 40px inner padding, 40px grid gaps and 52px barcode. At 660px each flexible image/text column is 184px; at 659px it is 183.5px. Browser fit checks across all six projects found the French Tour de parole content first fits at 660px; English content fits at 658px. This makes 660px the smallest width that fits both locales without clipping or overlap. The narrow-tablet vertical variation is therefore active from 500px through 659px. At 660px and above the approved horizontal ticket remains active; below 500px the existing mobile editorial presentation remains active.

The navbar's tablet controls were also inheriting viewport scale, making button boxes too short. At the 834px reference width, the logo is about 143px and the status/CTA group is about 385px; including 64px side gutters and a 16px separation, the standard one-row arrangement requires about 608px. Standard tablet (608–833px) keeps logo, status and hire CTA. Narrow tablet (500–607px) hides the status control and section links, showing only logo and hire CTA on one row. Mobile keeps the same two-control composition. All controls retain full-size text and a minimum 44px CTA height. The CTA remains content-sized and fits at 320px in both locales. Locales remain separate `/` and `/en/` routes; the authored header has no language-switch control.

## Measured Option 2 correction and verification

The user subsequently supplied exact measurements from Figma node 387:4523; the earlier screenshot-only measurements are superseded. The fallback keeps the same shared desktop/tablet layered-ticket DOM. At 500–659px, the shared ticket uses the compact Option 2 composition: outer background card up to 596 × 572px with 120px horizontal and 64px vertical reference insets; centered inner panel up to 356 × 444px with 24px padding and 20px vertical gaps; a 308 × 172px cover image; a 24px title (approved narrow-tablet exception), 14px description, 12px tags, and a horizontal 38px barcode. Outer card width follows the rail's available width inside the existing 32px page gutters, and the inner panel stays constrained rather than stretching to the outer card. Panel/card height may grow naturally for longer copy. Standard tablet at 660px and above keeps the 32px horizontal-ticket title; desktop and mobile are unchanged.

The existing tablet Projects geometry owner measures the resulting portrait card heights for section allocation and positions narrow landscape cards from the rail's measured height. No second ticket template, scaling transform, timer, additional observer, content edit or asset change was introduced.


Focused Playwright checks passed in French and English at 500, 560, 607, 608, 640, 659, 660, 680 and 834px. They assert the ticket layout boundary, 24/14/12px narrow and 32/14/12px standard effective ticket typography, all six canonical projects and links, exact image/panel/barcode geometry, no text overlap, card gutters, navigation variants and hit areas, plus the Projects-to-About boundary. The test rotates to 900 × 600 landscape and returns to the unchanged mobile editorial layout at 393 × 852 with a navigation fit check at 320 × 568. In the focused run, the French and English tablet-profile cases passed; the other six configured profiles skipped by design. No full suite or Lighthouse run was performed. User visual approval remains pending before references are captured.

The workspace Figma URL itself still returns HTTP 403 through the network proxy; the authoritative dimensions above were supplied directly by the user. The older screenshot-only uncertainty is resolved by that specification, not by estimating coordinates from the Figma canvas screenshot.

The test runner initially observed the controller's new viewport policy one animation frame before the Projects geometry fit. The test now advances the controlled browser clock through that fit frame and then asserts rendered geometry; this was a harness synchronization issue, not a production delay added to the application.
