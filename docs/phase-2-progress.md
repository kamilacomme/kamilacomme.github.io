# Phase 2 recovery checkpoints

## CSS extraction — complete

- Branch: `phase-2/css-js-extraction`
- Parent: tested and pushed Phase 0–1 baseline `ec8503a0701b0d29e4bb94864c08d11fcafe9c4c`
- Change: extracted five original style blocks into `styles/` and replaced them at the same positions in `index.html`. No CSS declarations, media queries, selectors, ordering or inline style attributes were changed.
- Verification: compared each extracted file byte-for-byte with the corresponding baseline style block; checked root-relative paths; `git diff --check` passed; all 230 baseline artifact hashes passed.
- Targeted regression: `npm test -- --grep 'approved visual|every project presentation'` — 16 passed across all eight locale/layout profiles, no failures or flaky tests. This checks representative timed visual states and every project presentation.
- Lighthouse was not rerun. Application content, links, assets, translations, SEO, deployment config and runtime were not changed.

## Current work

JavaScript remains inline and is the next extraction milestone. Preserve classic synchronous script ordering. The `text/x-dc` controller is read as text by the original runtime and must remain inline unless a separately verified factory bridge is introduced. Continue from the current branch head; do not reset the workspace or update the frozen references.
