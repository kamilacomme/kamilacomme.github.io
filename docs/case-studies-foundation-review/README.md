# Case-study foundation — review captures (stage 1)

Review evidence only. These images are not regression references and are not part of `tests/baseline/artifact-lock.json`. Status and decisions: [project status](../PROJECT-STATUS.md#case-study-foundation--stage-1-branch-case-studiesfoundation-2026-11-24).

Captured on macOS arm64 with Google Chrome 158 (`CHROMIUM_PATH`), software WebGL, the repository runtime fixture (`tests/runtime/replay.cjs`), a seeded `Math.random` and a paused page clock, using the lab device profiles: desktop 1440×900, tablet portrait 834×1112 (iPad, touch), mobile 393×852 (iPhone, touch).

## Foundation page `/cases/_foundation/` and `/en/cases/_foundation/`

| Profile | FR | EN |
| --- | --- | --- |
| Desktop | [top](case-top-desktop-fr.png) · [Footer closed](case-footer-closed-desktop-fr.png) | [top](case-top-desktop-en.png) · [Footer closed](case-footer-closed-desktop-en.png) |
| Tablet portrait | [top](case-top-tablet-portrait-fr.png) · [Footer closed](case-footer-closed-tablet-portrait-fr.png) | [top](case-top-tablet-portrait-en.png) · [Footer closed](case-footer-closed-tablet-portrait-en.png) |
| Mobile | [top](case-top-mobile-fr.png) · [Footer closed](case-footer-closed-mobile-fr.png) | [top](case-top-mobile-en.png) · [Footer closed](case-footer-closed-mobile-en.png) |

Measured in the browser: 12 columns, 24px gap, 32px margins on desktop and tablet (also at 550px); 4 columns, 16px gap, 16px margins on mobile (393 and 320px); title 56/48/32px aligned with the Navbar logo; no horizontal overflow; `robots` is `noindex, nofollow`.

With the curtain canvas hidden, the case-page Footer and both legal dialogs are pixel-identical to the homepage in FR and EN at all three sizes.

## B1.3 acceptance evidence

The first B1.3 capture differed from the baseline in curtain fold shading only: [baseline](b13-baseline-tablet-portrait-en-footer-closed.png), [first B1.3 run](b13-first-run-tablet-portrait-en-footer-closed.png), [difference](b13-first-run-diff-tablet-portrait-en-footer-closed.png) (red = changed pixels, maximum 3/255).

| Variant (tablet EN, mobile EN, mobile FR) | Runs that differed from the baseline (Footer and dialog captures) |
| --- | --- |
| Without B1.3 | 1 / 8 (run 8, tablet EN, same shading pattern) |
| With B1.3 | 0 / 8 |

Earlier full six-profile runs: without B1.3 0/5, with B1.3 1/3. Settled curtain inputs (target, p, aspect, canvas size, simulation frame count) are identical with and without B1.3. The touch gust pointer and the cloth vertices vary between runs of the same variant as much as between variants, and the per-frame order of the controller's progress update and the curtain's own tick ("pt" or "tp") varies run to run in both variants because the curtain module loads asynchronously. B1.3 moved `fitFooter()` verbatim (`this.` → `host.`) and kept its call sites.
