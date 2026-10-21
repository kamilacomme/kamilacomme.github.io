# Phase 2 / Phase 3 tablet-landscape comparison

The paired images compare the same Projects-start checkpoint at 1194 × 834 CSS px. The Phase 2 panel uses the locked reference image; the detached Phase 2 worktree passed the exact landscape visual and project-reference checks, validating it as the Phase 2 rendering. The Phase 3 panel is the actual screenshot attached to the current branch’s failed Playwright visual check. French and English used the same test configuration and controlled runtime fixture. No references were regenerated.

## Browser profile

Chromium 154.0.8037.57 headless, same /usr/bin/chromium executable for both builds; tablet-landscape project profile; viewport 1194 × 834; device scale factor 2; iPadOS 17 Safari user-agent emulation; mobile and touch emulation enabled; locale en-GB; timezone Europe/Paris; light color scheme; reduced motion no-preference; software WebGL; deterministic Math.random seed 123456789; clock fixed at 2026-01-01 UTC; CSS animations disabled only at screenshot capture. Both builds used the integrity-verified local replay of the same external runtime/CDN responses. Project videos are hidden for these visual captures so their approved poster imagery is compared; natural video playback remains covered separately by functional tests.

## Observed geometry at the Projects start checkpoint

All coordinates below are CSS pixels relative to the 1194 × 834 viewport. Pixel bounds are measured from the flat card background in the saved full-viewport screenshots, and agree with Playwright’s project-card crop dimensions.

| Build | Celimax card | Inside Out card | Right-edge clipping |
| --- | --- | --- | --- |
| Phase 2 | x=32, y=582, 574 × 220 | x=624, y=582, 574 × 220 | Inside Out continues beyond the right viewport; next card is outside the viewport |
| Phase 3 | x=30, y=598, 531 × 203 | x=579, y=598, 531 × 203 | Inside Out ends at x=1110; the next card begins at about x=1127, leaving about 67 px visible |

The card gap remains about 18 px. Phase 3 cards are about 43 px narrower and 17 px shorter; the row is 16 px lower and starts 2 px farther left. The smaller cards expose part of the next project at the right edge. Difference images color changed pixels red against a dimmed view of the Phase 2 screenshot.

## Files

- `fr-projects-side-by-side.png` and `en-projects-side-by-side.png` show the Phase 2 and Phase 3 captures together.
- `fr-projects-difference.png` and `en-projects-difference.png` highlight changed pixels in red.

These files are review artifacts only. No preview server is required to inspect them.
