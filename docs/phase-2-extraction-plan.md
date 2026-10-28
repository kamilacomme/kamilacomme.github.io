# Phase 2 extraction boundaries

Phase 2 is limited to moving existing inline CSS and JavaScript into source files. Keep the original rendering, initialization order, geometry and timing. Do not change text, links, assets, translations, SEO, responsive formulas, runtime dependencies, the desktop iframe or deployment configuration.

The tested baseline is commit `ec8503a0701b0d29e4bb94864c08d11fcafe9c4c` on `test/portfolio-baseline-phase-0-1`. The working branch is `phase-2/css-js-extraction`. The baseline branch is a GitHub backup; GitHub Pages currently builds the repository root of `main` only.

## CSS extraction map

Extract each style block separately and replace it at its existing location with a stylesheet reference. Do not combine blocks or move them to the document head. Keep existing inline style attributes untouched.

| Source block in original `index.html` | Responsibility | Position constraint |
| --- | --- | --- |
| Lines 35–50 | Hire-button and cookie overrides | Same head position |
| Lines 66–115, `kc-new-project-css` | Tablet/mobile project styles and mobile guards | Preserve its ID and override order |
| Lines 128–142 inside `<helmet>` | Global base, focus, reduced-motion and dot animation | Keep mounted through `<helmet>` |
| Line 436, `kc-no-nav-gradient` | Navigation gradient suppression | Same template position and ID |
| Lines 2343–2353 | Landscape tablet overrides | After project interactions script |

All five blocks lack `url(...)` references. New stylesheet URLs must resolve from `/` and `/en/`. In particular, CSS mounted through `<helmet>` and CSS in the original template have different insertion points; moving either changes cascade order.

## Script extraction map

For ordinary scripts, use classic synchronous `src` scripts exactly where the inline scripts occur. Do not add `async`, `defer`, module semantics or reorder/combine scripts.

| Source block in original `index.html` | Responsibility |
| --- | --- |
| Lines 52–59 | Consent defaults and global `gtag` definition |
| Lines 62–65 | Analytics initialization, after the existing async analytics tag |
| Lines 2302–2343, `kc-project-interactions` | Tablet fitting and project mounting |
| Lines 2354–2447 | Tablet landscape rail |
| Lines 2448–2492 | Tablet preview playback |
| Lines 2493–2537 | Mobile preview playback |
| Lines 2538–2622 | Mobile image sequences |
| Lines 2623–2656 | Mobile project canvas fitting |
| Lines 2658–2727, `kc-tablet-project-frame-alignment` | Portrait tablet alignment |

Leave `support.js`, the design-system runtime, iframe document, English loader/translator and `curtain-cloth.js` unchanged. Preserve the existing async Google Analytics tag between the two analytics blocks.

The `text/x-dc` block at lines 451–2301 is data consumed by `support.js`, not an executable browser script. `support.js` reads `[data-dc-script].textContent`; assigning an external `src` would silently discard the controller. Keep it inline until a separately reviewed bridge is implemented. Any bridge must keep the type, `data-dc-script`, every `data-props` value, and synchronously provide the factory before the runtime evaluates the text. A factory must defer class creation because `DCLogic` is supplied by runtime evaluation.

## State and verification rules

Preserve the shared globals `window.__kcTabletScale` and `window.__kcTabletProjectFit`. Preserve observer registration order, callback timing, scroll listeners, timers and thresholds. Do not resolve current overlapping geometry ownership during extraction. Keep the main controller at the root if extracted, or explicitly retain its resolution of the dynamic `curtain-cloth.js` import. Preserve all quirks as part of behavioral parity.

Each commit should contain one extraction milestone and its source-only edits. Run the narrow relevant functional and visual checks immediately after that milestone; save a checkpoint, inspect the diff, then continue. After the last milestone run the frozen eight-profile visual and complete functional gate once, Lighthouse comparison, and an independent review of the final diff. Never update accepted references to hide a mismatch. On any parity failure, stop and revert only the latest extraction commit while keeping the baseline branch and artifacts intact.

`npm run test:source` and `npm run test:inventory` verify Phase 0–1 source identity and therefore are expected to fail once the application is extracted. They must not be used to block the Phase 2 candidate; use rendered-content, behavior, visual and artifact-lock checks against the frozen baseline.
