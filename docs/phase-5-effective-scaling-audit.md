# Phase 5 effective scaling audit

Updated: 2026-10-22. Read-only browser audit of the current Phase 5 worktree, except for the separately authorized narrow-tablet ticket correction recorded in [the ticket audit](phase-5-narrow-tablet-fit-audit.md). No references or Lighthouse data were changed.

## Method

Measured both generated routes in Chromium 154.0.8037.57 using Playwright runtime fixtures, with fonts loaded and the page settled after each viewport resize. Desktop used a desktop browser context at DPR 1; tablet and mobile used iPad/iPhone touch emulation at DPR 2. The 18 samples were:

| Profile | CSS viewport samples |
| --- | --- |
| Desktop | 1440 × 900; 1100 × 700 (narrow and short) |
| Tablet portrait | 834 × 1112; 700 × 900 |
| Tablet landscape | 1194 × 834; 1024 × 600 (short) |
| Mobile | 393 × 852; 375 × 667; 320 × 568 (narrow and short) |

For text, the audit recorded `getComputedStyle().fontSize` separately from the product of the element's ancestor transform scale. The effective rendered font size is the computed CSS size multiplied by that measured scale. The same checks ran on `/` and `/en/`; numeric typography and scale values matched in both routes. The localized copy can still wrap differently.

## Findings by active scale owner

| Area | Current behavior and owner | Purpose | Text effect |
| --- | --- | --- | --- |
| Desktop Hero | `portfolio-controller.js` keeps `heroTopRef` unscaled and scales its anchor coordinates; `heroBottomRef` receives `scale(s)`. The separate `heroContainerRef` uses `scale(windowWidth / 1440)`. | Background/image scene fitting and positioning; the image-only scene scale does not affect text. | Main Hero heading remains 56px. The 12px “Scroll down” cue is inside the bottom cluster and becomes `12 × s` (9.17px at 1100 × 700). |
| Desktop Projects | `templates/desktop-project-embedded.html` `measure()` sets `#stage` to `scale(s)`, using the same width/height formula as the main controller. | Fits the fixed 1440px carousel frame and maps vertical scroll to horizontal rail travel. | Every heading and ticket text descendant shrinks. At 1100 × 700: section heading 56→42.78px, project title 40→30.56px, body 14→10.69px, label 12→9.17px. |
| Desktop About | `portfolio-controller.js` sets the About `aStageRef` to `scale(s)`. | Fits the fixed 1440px About composition. | Statement 56→42.78px, card title 40→30.56px, card body 14→10.69px at 1100 × 700. |
| Desktop Footer | `fitFooter()` in `portfolio-controller.js`; no footer ancestor transform. It writes font sizes as design size × `s`. | Coordinates footer elements against the scaled desktop frame. | This is JavaScript font-size reduction rather than transformed text: at 1100 × 700, heading 42.8px, body 10.7px, legal label 9.2px. |
| Tablet Hero | `portfolio-controller.js` scales `tHeroRef` by `st`; the separate tablet main heading remains outside that stage. | Fits the image/scroll-cue frame to the shared tablet viewport policy. | Tablet heading remains 48px. The 12px scroll cue is reduced to 11.12px at 1194 × 834 and 8px at 1024 × 600. Background/slideshow images also scale, as intended. |
| Tablet Projects | `scripts/projects/tablet-project-layout.js` explicitly keeps the tablet stage at `transform:none`; rail translation is horizontal positioning only. | The stage owns card/rail geometry and scroll travel in CSS pixels. | No whole-section shrink. Standard tablet is 48px heading, 32px title, 14px description and 12px tags. The approved narrow-tablet ticket exception uses a direct 24px title CSS size, still unscaled. |
| Tablet About | `portfolio-controller.js` scales the About `tAStageRef` by `st`. | Fits the 834px design frame to viewport dimensions. | At 700 × 900 (`st=.8393`): statement 48→40.29px, card title 32→26.86px, body 14→11.75px. At 1194 × 834 (`st=.9267`): 44.48px, 29.65px, 12.97px. At 1024 × 600 (`st=.6667`): 32px, 21.33px, 9.33px. |
| Tablet Footer | `fitFooter()` in `portfolio-controller.js`; no footer ancestor transform. It writes heading/body/legal font sizes multiplied by `st`. | Positions the footer relative to the fitted tablet frame. | At 700 × 900: heading 40.3px, body 11.8px, legal 10.1px. At 1194 × 834: 44.5px, 13px, 11.1px. At 1024 × 600: 32px, 9.3px, 8px. |
| Mobile Hero and About | `portfolio-controller.js` applies `scale(sm)` to `mHeroRef` and `mAStageRef`, where automatic mobile mode derives `sm` from viewport width/390. | Fits fixed 390px phone scenes to device width. | At 375 × 667 (`sm=.9615` for About): Hero/About headings 32→about 30.5px; About card title 24→23.08px; body 14→13.46px. At 320 × 568 (`sm=.8205`): Hero 32→26.06px; About statement 26.26px, card title 19.69px, body 11.49px. |
| Mobile Projects | `scripts/projects/mobile-canvas-fit.js` transforms `#kc-m-canvas` by `documentElement.clientWidth / 393`. This is independent of the Hero/About `sm` value. | Fits the fixed editorial canvas and its authored project positions to device width. | At 375px (`.9542`): project heading 30.53px, title 22.90px, body 13.36px and 11px CSS category label 10.50px. At 320px (`.8142`): 26.06px, 19.54px, 11.40px and 8.96px. The mobile project label's base CSS size is 11px, below the approved 12px label target even before scaling. |
| Mobile Footer | `fitFooter()` in `portfolio-controller.js`; no footer ancestor transform. It multiplies heading and legal-link sizes by `sm`; body copy has a 14px minimum. | Fits footer content to the mobile frame and anchors it around the phone viewport. | At 375px, heading 30.8px and legal 10.6px. At 320px, heading 26.3px and legal 9px; body is held at 14px. |
| Navigation, all profiles | `.kc-responsive-nav` remains `transform:none`; `--kc-nav-scale` adjusts frame spacing/control dimensions in the controller and responsive CSS. | Reflows the navbar while preserving text sizing. The animated status dot's `scale()` is animation-only and affects no text. | Measured logo 20px, status/section labels 12px and hire text 14px at every sampled viewport; no ancestor text scale. The box dimensions can still use the frame scale outside the explicit tablet/mobile overrides. |

## Effective rendered sizes by viewport

Numbers below are `computed CSS → effective rendered px`. Values are the same in French and English. “About” shows statement / card title / card body; “Footer” shows heading / contact body / legal link. Scroll-cue sizes are documented in the section table above.

| Layout and viewport | Main heading | Projects heading / title / body / label | About | Footer | Smallest measured text |
| --- | --- | --- | --- | --- | --- |
| Desktop 1440 × 900 | 56→56 | 56→56 / 40→40 / 14→14 / 12→12 | 56→56 / 40→40 / 14→14 | 56→56 / 14→14 / 12→12 | 12px |
| Desktop 1100 × 700 | 56→56 | 56→42.78 / 40→30.56 / 14→10.69 / 12→9.17 | 56→42.78 / 40→30.56 / 14→10.69 | 42.8→42.8 / 10.7→10.7 / 9.2→9.2 | 9.17px |
| Tablet portrait 834 × 1112 | 48→48 | 48→48 / 32→32 / 14→14 / 12→12 | 48→48 / 32→32 / 14→14 | 48→48 / 14→14 / 12→12 | 12px |
| Tablet portrait 700 × 900 | 48→48 | 48→48 / 32→32 / 14→14 / 12→12 | 48→40.29 / 32→26.86 / 14→11.75 | 40.3→40.3 / 11.8→11.8 / 10.1→10.1 | 10.1px |
| Tablet landscape 1194 × 834 | 48→48 | 48→48 / 32→32 / 14→14 / 12→12 | 48→44.48 / 32→29.65 / 14→12.97 | 44.5→44.5 / 13→13 / 11.1→11.1 | 11.1px |
| Tablet landscape 1024 × 600 | 48→48 | 48→48 / 32→32 / 14→14 / 12→12 | 48→32 / 32→21.33 / 14→9.33 | 32→32 / 9.3→9.3 / 8→8 | **8px** |
| Mobile 393 × 852 | 32→32 | 32→32 / 24→24 / 14→14 / 11→11 | 32→32.25 / 24→24.18 / 14→14.11 | 32.2→32.2 / 16.1→16.1 / 11.1→11.1 | 11px |
| Mobile 375 × 667 | 32→30.53 | 32→30.53 / 24→22.90 / 14→13.36 / 11→10.50 | 32→30.77 / 24→23.08 / 14→13.46 | 30.8→30.8 / 15.4→15.4 / 10.6→10.6 | 10.5px |
| Mobile 320 × 568 | 32→26.06 | 32→26.06 / 24→19.54 / 14→11.40 / 11→8.96 | 32→26.26 / 24→19.69 / 14→11.49 | 26.3→26.3 / 14→14 / 9→9 | **8.96px** |

## Milestone ownership and acceptance update

- **Milestone 5 — Desktop Projects and shared card typography:** remove layout-scale shrinkage from the desktop iframe's 1440px text-bearing stage while retaining the vertical-to-horizontal rail interaction; also remove the desktop Hero scroll-cue scale. Keep image-only Hero scene scaling if it does not scale descendant text.
- **Milestone 6 — About and Footer responsive layout:** replace desktop/tablet About frame scaling and JavaScript-scaled Footer text with fluid geometry/independent type; remove the tablet Hero scroll-cue shrink. About animation-only translations and the footer curtain animation may remain.
- **Milestone 7 — Mobile editorial layout and short/zoomed viewport handling:** remove text-bearing `mHeroRef`/`mAStageRef` scale effects and the `#kc-m-canvas` scale path, and stop multiplying Footer typography by `sm`. Bring mobile project category labels to their approved 12px target as part of the deliberate typography migration; do not counter-scale text in the interim.
- **Milestone 8 — Acceptance:** verify, in both locales and every supported responsive profile, that no text's effective rendered size is reduced by whole-container/layout scaling. Compare actual rendered pixels against approved targets (with the specifically approved 24px title for narrow tablets); document any intentional authored-size exception for review. Animation-only transforms remain allowed when they do not scale text. Include width/height changes and zoom checks in the final matrix.

The approved tablet Projects section currently has no text-shrinking stage transform; its narrow-tablet 24px title is a direct CSS design value. This correction and its focused tests are separate from the scaling audit; no screenshot reference was updated. French and English mobile Lighthouse TBT remain unresolved release blockers and were not measured in this audit.
