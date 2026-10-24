# Phase 5 responsive QA baseline

This is the first recorded M10A harness baseline. It is diagnostic evidence, not visual approval and not permission to begin M10B.

## Run details

- Source commit: `6d71b386d6f2cd078b437686cbc8ea28db551692` on `phase-5/fluid-responsive`.
- Run directory: `artifacts/playwright/responsive-qa/2026-10-24T23-39-43-669Z-56686/` (ignored by Git).
- Chromium: `154.0.8037.57`, Debian 13, headless software WebGL.
- Matrix: eight viewport cases across French `/` and English `/en/`; six routine sizes and two resilience probes. Existing Playwright profile projects supplied fine-pointer desktop and emulated touch/iPad/iPhone contexts. The active layout was read from DOM visibility and checked against the runtime tablet-policy object.
- Execution: 56 tests, one worker, 308 seconds. Result: 30 passed, 7 failed, 19 context-inapplicable skips, zero timeouts. The failures are recorded below; none was suppressed.
- Harness controls: a known-good focused case passed. A temporary negative-control assertion was then detected as a failing test and removed; no negative-control code remains in the committed harness.
- Evidence: `summary.md`, `html-report/index.html`, measurement JSON, browser captures and traces are in the run directory. No historical reference was used or updated.

## Confirmed deferred short-height Projects limitation

The existing desktop iframe rail owner is `desktop-project-embedded.html`. At both stress heights, no complete ticket fits vertically. At 1268×409 only four of six tickets reach the horizontal endpoint; at 2102×289 all six reach the horizontal endpoint but the ticket height exceeds the rail viewport. This is the already accepted M10B Projects resilience work, not a new regression and not fixed by the harness.

The detailed observations were the same in both languages. The report keeps the four language/viewport records separate and links each measurement file and three scroll-position captures.

## Resize findings

The new continuous-resize probe preserves the active section/About check, but these sequences changed the project occupying the largest visible area. The metrics record prior and current project names, CSS dimensions, actual profile, scrollY and full geometry, and the post-resize screenshot. The failures varied slightly between the two bounded executions during harness development; this final baseline produced the cases below.

| CSS viewport after resize | Language | Actual profile | Observed project change | Existing owner to review in M10B |
|---|---|---|---|---|
| 1280×800 | EN | Desktop, fine pointer | Pilates → Tour de parole | `desktop-project-embedded.html` rail mapping and `portfolio-controller.js` section scroll geometry |
| 716×800 | FR | Tablet, coarse pointer/touch | Tour de parole → Celimax | `scripts/projects/tablet-project-layout.js` |
| 716×555 | EN | Tablet, coarse pointer/touch | Pilates → Tour de parole | `scripts/projects/tablet-project-layout.js` |
| 844×390 | FR and EN | Tablet, coarse pointer/touch (resized from mobile profile) | Tour de parole → Longread | Profile change plus `scripts/projects/tablet-project-layout.js` and mobile Projects geometry |

These are confirmed scroll-continuity failures under the M10A criterion that resizing retain the current project in view. The six browser captures and JSON records are in the resize test folders for the run. They are findings only; no layout owner was changed.

## Routine checks

French and English passed the routine geometry and six-project reachability checks at 1440×900 desktop, 834×1112 tablet portrait, 1194×834 tablet landscape, 716×555 narrow tablet, 393×852 mobile and 320×568 mobile minimum. All six canonical links remained present, the rail brought each full ticket into view at those tested sizes, and the Projects-to-About checks passed. Tablet width/profile/orientation and measured desktop height-fit boundary probes passed. The tested pages had no unexpected document-width overflow; control-size, fixed-switcher and Hero typography invariants passed.

The actual responsive profile followed the configured input profile: fine pointer on desktop and coarse pointer/touch on tablet/mobile. In particular, 844×390 stayed tablet when tested with the iPhone/touch-emulated profile, confirming that the harness does not infer profile from CSS width alone.

## Limits and review

- Browser contexts emulate iPad/iPhone UA, touch and pointer media; they do not certify physical devices or Safari.
- The resize probe treats the largest intersecting project card as the current visual project. It provides geometry and a screenshot for review; M10B should confirm the product-level preservation threshold before implementing any correction.
- The 1268×409 and 2102×289 captures are resilience evidence, not visual baseline targets.
- The test run does not automatically approve screenshots. Specialist reviews can inspect this single evidence set rather than rerunning the matrix.
- The existing mobile Lighthouse TBT regressions remain release blockers for M10C.
