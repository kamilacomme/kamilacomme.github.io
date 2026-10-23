# Phase 5 tablet ticket geometry contract

**Status:** Authoritative Figma measurements supplied for portrait frame 834 × 1112px (node 369:1778) and landscape frame 1194 × 834px (node 370:1905). Implementation is in progress; references remain frozen pending interactive visual review.

## Fixed section and behavior requirements

- Keep one shared `templates/cards/layered-ticket.html` for desktop and tablet. Keep the existing mobile editorial template and media lifecycle unchanged.
- Keep desktop appearance and iframe behavior unchanged.
- On tablet, keep the existing Projects section wrapper, page side margins, heading treatment, navigation, horizontal-scroll interaction, project order, links, media association, accessibility labels, and all six projects reachable.
- Keep the tablet-to-About transition smooth and avoid cross-section measurement dependencies, arbitrary timers, offsets, observers, or scale compensation.
- Keep the effective tablet type targets at 32px project titles, 14px body text and 12px tags. Do not shrink the ticket through an ancestor transform.
- Preserve French/English content and the Phase 4 shared data, routes and canonical project order.

## Card dimensions intentionally replaced

The old tablet-specific card measurements are obsolete for the restored layered composition. They are not constraints for the new design:

- Portrait: old `770 × 220px` card bounds.
- Landscape: old `531.91 × 250.19px` card bounds and previous `531.91 × 203.87px` bounds.

The authoritative shared ticket measurements are outer card 770 × 310px with 8px radius; inner panel 674 × 246px with 4px radius and 20px padding; 20px panel gap; image and text columns approximately 271px each; barcode column 52px; outer background `cover`; inner image approximately 271 × 206px with `object-fit: cover`; title 32px, description 14px, tags 12px. The 674px inner-panel width follows the 48px outer horizontal inset on each side; its 246px height follows the 32px top and bottom inset. The component widths and positions should use these values at the supplied frame sizes and adapt fluidly at intermediate widths.

## Rail calculations that adapt to the cards

- Portrait at 834 × 1112: first card x=32px, y=269px; vertical card gap=32px, producing card y positions 269, 611 and 953px. Keep the existing vertical page-scroll behavior. At these dimensions, six 310px cards, five 32px gaps, 269px top placement and 32px bottom breathing room require a 2,321px Projects content span; calculate this from the card count and spacing rather than keeping the obsolete 1,655px section height.
- Landscape at 1194 × 834: first card x=32px, y=492px; second card x=834px, giving a 32px horizontal gap. The initial viewport should show 1.47 cards. Keep horizontal scrolling and the existing section start/margins. For six 770px cards, five 32px gaps, and 32px left/right margins, total horizontal travel is 3,650px; the section's scroll allocation is viewport height plus travel (4,484px at this frame size).
- Portrait cards fill the available content width between the established 32px page gutters. At 834px, the width is 770px; at 1032px, it is 968px. Do not cap portrait cards at 770px or use transforms. The shared panel grid adapts the image and text columns while retaining 20px gaps and the 52px barcode column.
- Landscape retains the approved 770px card width, 32px gap and approximately 1.47-card initial composition at 1194px. At intermediate widths, its width remains constrained to the available rail width. Do not apply an ancestor scale to achieve target sizes.
- Recalculate the section's scroll allocation from the resulting rail travel so the rail starts at its first card, reaches its sixth card at the end, and transitions smoothly into About. The current section height, card dimensions and rail length are not fixed values when they conflict with the new measured cards.
- Keep calculations in the existing tablet geometry owner, using its own dimensions and shared tablet viewport policy. No additional controller or unrelated-section measurement is permitted.

## Narrow-tablet Option 2 geometry

The user supplied authoritative measurements from Figma node 387:4523. The responsive vertical variant applies to the tablet presentation from 500 through 799 CSS px; below 500px the existing mobile editorial layout remains unchanged. The standard horizontal ticket begins at 800px, where the six project titles fit comfortably in both languages; desktop retains its existing ticket.

- The outer image card uses a maximum reference size of 596 × 572px, 8px radius, and 120px horizontal / 64px vertical insets around its inner ticket. At the 659px viewport, the existing 32px page gutters yield a 595px outer card; at 500px the outer width is 436px. Outer card width adapts to the available rail content width without transform scaling.
- Center a compact `#F2EEF2` inner ticket with a maximum reference size of 356 × 444px, 4px radius, 24px padding and 20px vertical section gaps. It remains narrower than the outer image card. The card has a 572px minimum height and grows with content when translated descriptions need more room.
- The featured image is 308 × 172px at the reference size, 2px radius and `object-fit: cover`; it is constrained by the panel's available inner width and preserves the reference aspect ratio.
- Narrow-tablet project titles are an explicitly approved 24px exception. Description and tags remain 14px and 12px. The barcode is horizontal and 38px high. Standard-tablet titles remain 32px.
- The single layered-ticket template and existing tablet geometry owner remain in use. Portrait section height is measured from resulting card heights; landscape rail position and scroll allocation are recalculated from its measured card/rail height. This change does not alter the shared section wrapper, margins, mobile editorial template, or desktop behavior.

Focused tests at widths 500, 560, 607, 608, 640, 659, 660, 680, 686, 687, 700, 720, 760, 780, 799, 800 and 834px verify the variant boundary, measured panel/image/barcode bounds, title size (24px vertical / 32px horizontal), body/tags, all six projects, navigation, French punctuation and the Projects-to-About boundary in French and English. Browser text-range measurements show `Tour de parole` still wraps at 780px and fits on one line at 800px; the former proposed 687px start for the horizontal layout is therefore insufficient. The next user visual review is required before any reference capture.

## Acceptance measurements

At the two supplied target frame sizes, measure rendered geometry in browser pixels and assert: the outer/card and inner-panel bounds; specified image, text and barcode columns; all six project positions and canonical associations; portrait vertical ordering/spacing; landscape first/second positions and approximately 1.47-card initial view; full rail endpoint and all-project reachability; correct scroll allocation and smooth transition into About. Verify 32/14/12px text remains unscaled and fits the panels in French and English. Keep the shared template, desktop appearance/iframe behavior, mobile editorial template, data and media lifecycle unchanged. Run focused tests only. Show the updated interactive preview before accepting or locking any Phase 5 visual reference.
