# M10C reduced-motion Footer curtain review

Open the gallery from the local checkout:

```bash
xdg-open docs/phase-5-m10c-reduced-motion-review/gallery.html
```

The gallery contains paired Chromium captures of the actual French and English site at desktop `1440×900` and mobile `393×852`. `A` is the current curtain at settled Footer progress. `B` is the same live `curtain-cloth` element and WebGL canvas paused at its current scroll-derived progress.

The comparison used a temporary Playwright-only runtime adapter. It canceled and resumed the existing curtain frame loop and made the existing `progress` setter update the same renderer, texture and geometry once when progress changed. It did not change application files, add a new layout or replace the curtain with a different illustration. Browser runs switched the emulated motion preference to reduce and back to no-preference without remounting the element.

## Browser evidence

All four preview runs passed. In every run:

- The WebGL canvas and loaded `footer-curtain.webp` texture remained present.
- The frame counter remained unchanged during the paused interval, advanced after resume, and stabilized again after pausing a second time.
- The same curtain element instance remained mounted.
- Progress stayed at the settled scroll-derived value (`0.9999…`); the preference transition changed it by less than `0.0001` in the final captures.
- Contact text, legal links and the language switcher remained in their existing measured positions.

Pixel comparison between the sequential screenshots shows low differences while the active cloth is frozen: mean absolute RGB difference is `1.364` / `1.388` for desktop French/English and `0.315` / `0.244` for mobile French/English. Pixels differing by more than 16 RGB levels were `0.150%` / `0.162%` on desktop and `0%` on mobile. The remaining small desktop variation is consistent with capture timing and the navbar status indicator; there is no blank canvas, cloth distortion or apparent snap.

Per-run geometry and lifecycle data are in the four adjacent JSON files. These are review artifacts, not approved historical visual references.
