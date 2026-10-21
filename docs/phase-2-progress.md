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

Continue with mobile controllers, preserving their source order. The `text/x-dc` controller is read as text by the original runtime and must remain inline unless a separately verified factory bridge is introduced. Continue from the current branch head; do not reset the workspace or update the frozen references.
