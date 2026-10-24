# Mobile About review

This directory contains review-only captures from the current Phase 5 branch. They were captured in Chromium at 100% browser zoom, DPR 1, at the CSS viewport sizes in each filename. They are not regression references and do not replace the approved originals.

The `intro` capture shows the full localized statement before the card sequence. `mid-scroll` shows the cards rising over the introduction. `stacked` shows the five existing cards layered at the end of their scroll sequence. The page remains scrollable to the existing Footer after the About section.

Open the current interactive site locally from the repository root with:

```bash
PORT=8032 node tests/runtime/server.mjs
```

Then visit `http://127.0.0.1:8032/` for French or `http://127.0.0.1:8032/en/` for English. At phone widths, scroll past Projects to About and continue scrolling to see the card progression and Footer.

Capture set:

- French and English at 320×568: introduction, mid-scroll and stacked cards.
- French and English at 390×844: introduction, mid-scroll and stacked cards.

The changes remove the mobile About stage scale. The existing `fit()` owner sizes that frame to the viewport, and `renderAbout()` continues to own the five-card scroll animation and positions. No duplicate template, controller or pseudo-element was added. Mobile Hero, Projects, desktop and tablet layouts remain unchanged.

Focused validation: the Mobile About and Mobile Projects browser tests passed in French and English. They cover 320/375/390/430px widths, short/tall heights, resizing, text/card bounds, effective type, natural wrapping, five-card order, card progression, six project reachability and the Projects/About/Footer boundary. Deterministic generation and syntax checks passed. No full suite, Lighthouse run or screenshot-reference update was performed.

**Mobile About visual review is pending.**
