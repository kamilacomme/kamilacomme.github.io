# Phase 2 recovery checkpoints

## CSS extraction — complete

- Branch: `phase-2/css-js-extraction`
- Parent: tested and pushed Phase 0–1 baseline `ec8503a0701b0d29e4bb94864c08d11fcafe9c4c`
- Change: extracted five original style blocks into `styles/` and replaced them at the same positions in `index.html`. No CSS declarations, media queries, selectors, ordering or inline style attributes were changed.
- Verification: compared each extracted file byte-for-byte with the corresponding baseline style block; checked root-relative paths; `git diff --check` passed; all 230 baseline artifact hashes passed.
- Targeted regression: `npm test -- --grep 'approved visual|every project presentation'` — 16 passed across all eight locale/layout profiles, no failures or flaky tests. This checks representative timed visual states and every project presentation.
- Lighthouse was not rerun. Application content, links, assets, translations, SEO, deployment config and runtime were not changed.

## Current work

### Analytics and consent scripts — complete

- Extracted the two existing head scripts to `scripts/analytics/consent-defaults.js` and `scripts/analytics/init.js`; both are classic synchronous scripts in their original positions, with the async Google tag retained between them.
- `node --check` passed for both extracted files; `git diff --check` and the 230-artifact lock passed.
- Targeted regression: `npm test -- --project=desktop-fr --project=mobile-en tests/qa/functional.spec.cjs` — 6 passed, no failures. Covered French desktop and English mobile rendering, all project links, navigation, About/footer/legal interactions, natural video playback and image sequences.
- No Lighthouse run was needed for this structural change.

## Current work

### Tablet project controllers — complete

- Extracted tablet fitting/mounting, landscape rail, tablet preview playback and portrait frame alignment into four ordered classic scripts under `scripts/projects/`. Preserved the interaction script ID and the hand-offs through `window.__kcTabletScale` and `window.__kcTabletProjectFit`.
- `node --check` passed for each file; `git diff --check` and the 230-artifact lock passed.
- Targeted regression: `npm test -- --project=tablet-portrait-fr --project=tablet-portrait-en --project=tablet-landscape-fr --project=tablet-landscape-en` — 21 passed, 3 pre-existing responsive skips, no failures or flakes. Covered both tablet orientations and languages, selected visual references, rendering/navigation, all projects and natural media playback.
- Lighthouse was not rerun for this structural extraction.

## Current work

### Mobile project controllers — complete

- Extracted mobile preview playback, timed project image sequences and mobile canvas fitting into three classic scripts under `scripts/projects/`, in original order.
- `node --check` passed for each file; `git diff --check` and the 230-artifact lock passed.
- Targeted regression: `npm test -- --project=mobile-fr --project=mobile-en` — 10 passed, 2 pre-existing responsive skips, no failures or flakes. Covered French/English rendering, all projects, natural preview playback and image sequences, navigation and mobile visual references.
- Lighthouse was not rerun for this structural extraction.

## Current work

### Main runtime controller — extracted, final gate complete

- Moved the original `Component extends DCLogic` class body verbatim into root-level `portfolio-controller.js`, wrapped in a factory receiving the runtime's `DCLogic` and `React` objects.
- Kept the original `type="text/x-dc"`, `data-dc-script`, exact `data-props`, and a minimal text bridge. The factory classic script loads synchronously immediately before the bridge; root-level placement preserves the controller's relative dynamic-import fallback.
- `node --check portfolio-controller.js` passed. A source check confirmed the original controller body is present verbatim and its metadata remains unchanged. The full gate passed: 42 passed, 6 existing skips, no failures; 230 frozen hashes passed before and after.
- Full verification was run once after all extraction changes: `npm test` across all eight profiles, including functional, media, visual and responsive checks.
- Lighthouse was run once at phase completion: 12 complete reports saved under `tests/phase-2/performance/`. `npm run test:performance:compare` reports one unresolved French mobile TBT regression (candidate median 380.5 ms vs 208.5 ms baseline; comparator limit 308.5 ms). Other metric budgets passed. No Lighthouse rerun or performance optimization was performed.

The extraction and behavior checks are complete. Phase 2 is not pushed or deployed. See [`phase-2-report.md`](phase-2-report.md) for the final review, performance findings and remaining risk. Wait for explicit approval before Phase 3.
