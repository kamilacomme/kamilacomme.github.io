# Milestone 8 shared-gutter review

This review set compares fresh Chromium captures from the pre-correction checkout (`HEAD`) with the current working tree. The Footer curtain was scrolled to its settled state before each capture. These are review-only images and measurements; no historical visual reference was changed.

Open the complete local comparison sheet with:

```sh
xdg-open docs/phase-5-milestone8-review/shared-gutters/index.html
```

The table compares the same viewport and language side by side. Select a thumbnail for its full-size capture. Raw DOM measurements, viewport details and curtain state are in `measurements.json`.

## Measured geometry

| CSS viewport | Active profile | Shared horizontal / bottom gutter | Before → after |
| --- | --- | ---: | --- |
| 1440×900 | Desktop | 32px / 32px | Switcher was 32px at both edges. Footer contact, legal and corner-art bottom edges were inset about 21px, 22px and 27px; each now sits at 32px. |
| 1905×963 | Desktop, scale factor 1.08 | 34.56px / 34.56px | Switcher inset was 32px; it now measures 34.55px. Footer outer bottom edges now measure 34.55px. English legal links previously began at x=628.59px while the Projects link began at x=831.69px; they now share x=831.69px. |
| 834×1112 | Tablet portrait | 32px / 32px | Footer horizontal and legal bottom insets were already 32px. Corner art moved from 35px to 32px; the contact-to-legal spacing stayed unchanged. |
| 1194×834 | Tablet landscape (iPad profile) | 32px / 32px | Footer horizontal and outer bottom insets were 29.69px; they now measure 32px. |
| 716×555 | Short tablet | 32px / 32px | French Footer horizontal inset was 29.69px and English was 19.8px; both now measure 32px. Their outer bottom inset is now 32px. |
| 393×852 | Mobile | 16px / 24px | Switcher was already at 16px / 24px. Footer legal and contact groups were inset 14px and 64px from the bottom; they now use 24px and 74px, preserving their 50px separation. |
| 320×568 | Narrow mobile | 16px / 24px | Same 10px Footer shift as 393px; text size, line height and internal group spacing are unchanged. |

At 1440×900 and 1905×963, the contact heading/email retain their natural content width. Their left edge follows the shared gutter and their maximum available width is constrained by both gutters, so long English/French text can wrap without forcing a full-viewport text box. The tablet right edge and narrow-width wrapping were checked from actual rendered text lines.

The Navbar, Hero slideshow and switcher measurements are also recorded in `chrome-geometry.json`. Their effective right/bottom insets are unchanged across the correction: 32px at 1440×900; 34.56px Hero and 34.55px Navbar/switcher at 1905×963 (a 0.013px layout-rounding difference); 32px for all tablet samples; and 16px right / 24px bottom for mobile. The new root tokens explicitly expose those shared values. The switcher remains fixed at the viewport gutter while scrolling through every section.

## Validation

Focused Playwright checks passed:

- `shared-page-gutter.spec.cjs`: 8/8 French and English desktop, tablet portrait/landscape and mobile profiles. Includes all seven requested sizes, gutter tokens, visible text line bounds, control dimensions, and Footer edges.
- `language-switch.spec.cjs`: 8/8 across the same profiles. Includes fixed positioning at Hero, Projects, About and Footer scroll locations, bidirectional route switching, keyboard focus, contact links and legal-dialog stacking.
- `mobile-footer-responsive.spec.cjs`: 2/2 French and English, including contact links, legal links and scroll-driven curtain behavior.

The existing `scripts/projects/english-tablet-footer-alignment.js` remains intact by request. Its independent Footer geometry writes overlap with `portfolio-controller.js`; this ownership overlap is recorded for the Milestone 9 structural audit and was not removed here.

## Local interactive preview

The current checkout can be served locally with:

```sh
PORT=8075 node tests/runtime/server.mjs
```

Open `http://127.0.0.1:8075/` for French or `http://127.0.0.1:8075/en/` for English, then resize and scroll through the sections. Stop the server with Ctrl+C. The preview server serves the checkout from which that command is run.
