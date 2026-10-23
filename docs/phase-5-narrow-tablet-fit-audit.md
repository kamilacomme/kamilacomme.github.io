# Phase 5 narrow-tablet fit audit

Updated: 2026-10-23. This audit supports the still-open Milestone 4 preview; it does not approve or lock references.

## Diagnosis

The supplied screenshot is the Figma editor, not a browser screenshot of the overflowing site. Its selected frame is 1194 × 834px, so it does not identify the CSS viewport at which the reported overflow occurred. The exact breakpoint below comes from browser measurements against the current French and English generated pages.

`portfolio-controller.js` selects the mobile presentation below 500 CSS px. At 500px and above it selects the tablet presentation until the existing tablet upper range. Thus 500–659px was a tablet layout, not mobile, and its horizontal layered ticket was still active.

The earlier equal-column estimate and 800px breakpoint were superseded by the user's approved 716×555 horizontal-ticket trial. Focused browser tests now exercise widths from 687 through 834px in French and English and confirm all six titles remain on one line at 32px. The shared Option 2 vertical ticket applies from 500–686px; horizontal tickets begin at 687px; below 500px the existing mobile editorial presentation remains active.

The navbar's tablet controls were also inheriting viewport scale, making button boxes too short. At the 834px reference width, the logo is about 143px and the status/CTA group is about 385px; including 64px side gutters and a 16px separation, the standard one-row arrangement requires about 608px. Standard tablet (608–833px) keeps logo, status and hire CTA. Narrow tablet (500–607px) hides the status control and section links, showing only logo and hire CTA on one row. Mobile keeps the same two-control composition. All controls retain full-size text and a minimum 44px CTA height. The CTA remains content-sized and fits at 320px in both locales. Locales remain separate `/` and `/en/` routes; the authored header has no language-switch control.

## Measured Option 2 correction and verification

The user subsequently supplied exact measurements from Figma node 387:4523; the earlier screenshot-only measurements are superseded. The fallback keeps the same shared desktop/tablet layered-ticket DOM. At 500–686px, the shared ticket uses the compact Option 2 composition: outer background card up to 596 × 572px with 120px horizontal and 64px vertical reference insets; centered inner panel up to 356 × 444px with 24px padding and 20px vertical gaps; a 308 × 172px cover image; a 24px title (approved vertical-variant exception), 14px description, 12px tags, and a horizontal 38px barcode. Outer card width follows the rail's available width inside the existing 32px page gutters, and the inner panel stays constrained rather than stretching to the outer card. Panel/card height may grow naturally for longer copy. At 687px and above the horizontal ticket keeps the 32px title; desktop and mobile are unchanged.

The existing tablet Projects geometry owner measures the resulting portrait card heights for section allocation and positions narrow landscape cards from the rail's measured height. No second ticket template, scaling transform, timer, additional observer, content edit or asset change was introduced.


Focused Playwright checks passed in French and English at widths around the boundary, asserting the vertical/horizontal switch, 24/14/12px vertical and 32/14/12px horizontal type, all six canonical projects and links, media association, rendered barcode orientation and 38px strip height, one-line horizontal titles, locale punctuation, navbar variants/hit areas, orientation change and the Projects-to-About boundary. The user approved horizontal composition at 716×555; the focused test now confirms a horizontal panel width of 556px with 212px image and text columns, six one-line titles, and unchanged 3,420px travel/3,975px section boundary. No full suite or Lighthouse run was performed. Current app implementation is available for the user's local visual review; no references were changed.

The workspace Figma URL itself still returns HTTP 403 through the network proxy; the authoritative dimensions above were supplied directly by the user. The older screenshot-only uncertainty is resolved by that specification, not by estimating coordinates from the Figma canvas screenshot.

The test runner initially observed the controller's new viewport policy one animation frame before the Projects geometry fit. The test now advances the controlled browser clock through that fit frame and then asserts rendered geometry; this was a harness synchronization issue, not a production delay added to the application.
