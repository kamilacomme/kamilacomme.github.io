# Milestone 9 — tablet Footer ownership consolidation review

These are actual Chromium captures of the generated French and English pages, taken with tablet touch emulation at DPR 2 after the Footer curtain and responsive layout settled. The dimensions are CSS pixels. The `before/` captures show the approved implementation with the legacy English-only helper; `after/` captures show the generated site after that helper and its script inclusion were removed. These are review artifacts, not visual baselines.

| CSS viewport | French before | French after | English before | English after | Settled measurements in both locales |
|---|---|---|---|---|---|
| 834×1112 portrait | [open](before/before-fr-834x1112.png) | [open](after/after-fr-834x1112.png) | [open](before/before-en-834x1112.png) | [open](after/after-en-834x1112.png) | heading/contact/legal left = 32px; corner media right/bottom inset = 32px; shared ticket width = 770px, `border-box` |
| 1194×834 landscape | [open](before/before-fr-1194x834.png) | [open](after/after-fr-1194x834.png) | [open](before/before-en-1194x834.png) | [open](after/after-en-1194x834.png) | same 32px outer gutters; shared ticket width = 770px, `border-box` |
| 716×800 narrow tablet | [open](before/before-fr-716x800.png) | [open](after/after-fr-716x800.png) | [open](before/before-en-716x800.png) | [open](after/after-en-716x800.png) | heading/contact/legal left = 32px; media right/bottom inset = 32px; ticket width = 652px, `border-box` |
| 716×555 narrow/short | [open](before/before-fr-716x555.png) | [open](after/after-fr-716x555.png) | [open](before/before-en-716x555.png) | [open](after/after-en-716x555.png) | same 32px outer gutters; ticket width = 652px, `border-box` |

The approved settled compositions are visually unchanged. The specific defect was a startup/resize race, not a different final screenshot: at 716×800 the old helper briefly moved the English Footer heading to x=78.1247px, then `fitFooter()` restored the shared x=32px gutter about 28ms later. The helper-free build kept the heading at x=32px throughout fresh loads and repeated portrait/landscape/short-height transitions. The legal links were already owned by `fitFooter()`; their left edge remained x=32px. The shared Projects rule still gives all six tablet tickets `box-sizing: border-box`.

The browser sequence loaded each locale at 834×1112, then resized through 716×800, 1194×834, 716×555, 659×834, and back to 834×1112 and 716×800, dispatching `orientationchange` after each change. At every step the test checked shared gutters, Footer anchors and email line bounds, no horizontal page overflow, all six tickets, ticket box sizing, and the Projects-to-About transition in both directions. There were no browser exceptions.

Focused validation:

- `npm run content:check` — passed; canonical six projects, five About cards, both locales and all asset hashes validated.
- `npm run content:build:check` — passed; all four committed generated outputs match the deterministic build.
- Shared ticket parser contract — 4/4 passed.
- `tests/phase-5/radius-check.spec.cjs` — 6 desktop/tablet cases passed; its two mobile cases are intentionally skipped.
- `npm run test:baseline-integrity` — passed; 230 frozen baseline artifact SHA-256 hashes unchanged.
- Both generated routes and the generator contain no reference to `english-tablet-footer-alignment.js`.

The implementation changes only the generated English helper inclusion and the obsolete helper file. `fitFooter()` remains the sole Footer geometry owner; the existing shared tablet Projects box-sizing rule remains authoritative. Milestone 9 remains open for its other audit findings. Historical screenshot references were not updated.
