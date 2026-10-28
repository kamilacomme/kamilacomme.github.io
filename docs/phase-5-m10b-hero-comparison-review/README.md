# M10B Hero tablet reflow comparison

This is a browser-only comparison of the current Hero and a temporary Figma-informed tablet composition. No application source or historical screenshot reference was changed for this comparison.

Open `index.html` in Chromium from the local Ubuntu checkout. Choose French or English and a viewport from the selectors to compare actual browser captures. The screenshots are captured at 1x device scale in Chromium; reduced motion is enabled so the six-image slideshow holds the same frame during comparison. This does not change the website's normal-motion behavior.

## What the prototype tests

The existing Hero owner already measures the active title, slideshow, portrait, cue, Navbar and shared gutters. The prototype asks whether those existing tablet nodes can fit in one horizontal row using their rendered text widths, the existing 48px heading, the 48px portrait, the 12px cue, a 32px horizontal gutter, and a 230px minimum slideshow width at the original 326:204 aspect ratio.

At 960×300, the geometry fits in both languages:

- Navbar height: 72px; content top clearance: 88px; bottom gutter: 32px.
- Heading: 48px, 495.7px text width, 105.6px high.
- Portrait/cue group: 108.6px wide, 76px high.
- Slideshow: 259.7×162.5px, original aspect ratio.
- No Hero element collisions were measured. The 44px language switcher overlaps the lower-right slideshow area, matching the already accepted extreme-short limitation; the switcher was not moved.

At 800×230 and 500×188, the horizontal row fails the content-fit rule. It remains natural vertical flow with the approved typography, complete image ratio and scroll access. Forcing the Figma row at those widths would require narrower-than-minimum slideshow sizing or heading changes. At 716×555 and the normal controls, the approved layouts remain unchanged. At 1440×289, the existing desktop short-height horizontal mode remains in place.

The Figma references are [Hero responsive study 408:8449](https://www.figma.com/design/9vt2ATXB0UTz1sPESCNmWh/For-Claude?node-id=408-8449), [short horizontal stage 408:8464](https://www.figma.com/design/9vt2ATXB0UTz1sPESCNmWh/For-Claude?node-id=408-8464), and [short horizontal stage 408:8471](https://www.figma.com/design/9vt2ATXB0UTz1sPESCNmWh/For-Claude?node-id=408-8471). The prototype uses their content-driven arrangement as a comparison, not as a new breakpoint specification.

## 500×188 English scroll-into-view check

The responsive test reported the portrait ending at y=246.375 after `scrollIntoViewIfNeeded()`. The page's measured document height was 5,182px and the Hero's natural-flow root was 418.4px high, so this was not clipped by the document. A direct Chromium replay of the same title → slideshow → portrait → cue scroll sequence moved the portrait from y=302.4–350.4 to y=56.4–104.4 at `scrollY=246`; the cue also became fully visible. The test failure is therefore consistent with a transient measurement before the browser scroll/layout update settled, not missing content. The test was not changed in this comparison.

## Files

- `index.html` — local before/after gallery.
- `measurements.json` — viewport, language, responsive profile, bounds, effective font sizes, fit measurements, collisions and transition target for each capture.
- `captures/current/` — current website screenshots.
- `captures/figma-informed/` — browser-only prototype screenshots; where the geometry does not fit or the approved control composition applies, the prototype leaves the current natural-flow or normal layout in place.
