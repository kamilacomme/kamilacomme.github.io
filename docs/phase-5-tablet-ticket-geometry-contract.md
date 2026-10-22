# Phase 5 tablet ticket geometry contract

**Status:** Updated after visual review. Card implementation is paused until exact Figma frame measurements are available. No application code or screenshot references have changed for this update.

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

The new outer card width and height, radius, inner-panel bounds, image bounds/crop, panel padding, and inter-card gaps must come from the tablet portrait and landscape Figma frames. They must not be guessed from the current implementation or inferred from a scaled JPEG where the source frame measurements are available.

## Rail calculations that adapt to the cards

- Portrait: retain the vertical presentation and its established section framing; derive card positions, spacing and required content height from the Figma dimensions. Confirm all six cards fit without clipping and retain a clear transition into About.
- Landscape: retain horizontal scrolling and the existing section start/margins. Derive rail width and total horizontal travel from the measured card widths and gaps. At 1194 × 834, the initial visible rail should show approximately 1.5 cards, as in Figma.
- Recalculate the section's scroll allocation from the resulting rail travel so the rail starts at its first card, reaches its sixth card at the end, and transitions smoothly into About. The current section height, card dimensions and rail length are not fixed values when they conflict with the new measured cards.
- Keep calculations in the existing tablet geometry owner, using its own dimensions and shared tablet viewport policy. No additional controller or unrelated-section measurement is permitted.

## Figma measurements needed

Figma access is unavailable from this environment (the design URL request is blocked with HTTP tunnel `403`, and no Figma tools are exposed). Please provide the following values in Figma CSS pixels for **each** portrait and landscape frame, along with that frame's viewport dimensions:

1. Outer project card width and height, corner radius, first-card x/y position, and horizontal/vertical gap between cards.
2. Inner light-grey panel x/y/width/height relative to the outer card, its radius and padding.
3. Inner image x/y/width/height relative to the panel, plus its `object-fit`/crop intent.
4. Panel content-column widths or proportions, gaps between image/text/barcode, and barcode width.
5. For landscape, the intended initial rail x-position and visible fraction of the second card at 1194 × 834 (the target is approximately 1.5 cards).
6. Whether the portrait frame is a vertical stack or horizontal rail, and the intended first/last-card alignment to the tablet viewport.

If a frame is authored at a different scale than CSS pixels, include the frame dimensions and export scale so the values can be converted exactly. A Figma Inspect/Dev Mode measurement list or frame-level CSS export is sufficient; no new screenshot export is needed.

Until these measurements are provided, do not resize tablet cards, adjust tablet rail/section geometry, or create Phase 5 visual references. After implementation, focused visual and functional checks must cover both languages and both tablet orientations before a new interactive preview is offered for review.
