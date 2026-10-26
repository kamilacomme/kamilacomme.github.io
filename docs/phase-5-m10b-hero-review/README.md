# M10B Hero short-height review

This is the unapproved-for-final-acceptance Hero checkpoint, prepared for local visual review. It uses the existing Hero geometry owner and existing responsive DOM. The fixed 44×44 language switcher is unchanged; the user accepted that it may overlap Hero content at exceptionally short heights.

## Open the captures locally

From the repository root, open the contact sheet:

```bash
xdg-open docs/phase-5-m10b-hero-review/gallery.html
```

The gallery contains actual Chromium captures, with French and English side by side. To view the short-height scroll progression at full size, open:

```bash
xdg-open docs/phase-5-m10b-hero-review/captures/progress-1707x188.png
xdg-open docs/phase-5-m10b-hero-review/captures/progress-500x188.png
xdg-open docs/phase-5-m10b-hero-review/captures/progress-320x188.png
```

Each progression sheet contains successive browser scroll positions for the heading, portrait, scroll cue and slideshow in both languages. The final Hero-to-Projects position is verified by the focused Playwright check.

## Tested layouts

| Layout | French and English capture | Result |
| --- | --- | --- |
| Desktop, 1440×289 | `captures/desktop-1440x289-pair.png` | Horizontal reflow; heading, controls and slideshow remain in one Hero screen. |
| Desktop, 1707×188 | `captures/desktop-1707x188-pair.png` | Natural vertical flow; short-height slideshow is 249.3×156px, preserving its 326:204 ratio. |
| Tablet, 500×188 | `captures/tablet-500x188-pair.png` | Natural vertical flow; navbar scrolls away and the 249.3×156px slideshow can be brought fully into view. |
| Mobile, 320×188 | `captures/mobile-320x188-pair.png` | Natural vertical flow; existing image-only slideshow remains 171×107px. |
| Normal desktop, 1440×900 | `captures/desktop-normal-1440x900-pair.png` | Approved composition retained; 325px slideshow. |
| Normal tablet, 834×1112 | `captures/tablet-normal-834x1112-pair.png` | Approved composition retained. |
| Normal mobile, 393×852 | `captures/mobile-normal-393x852-pair.png` | Approved composition retained; 32px heading, 12px cue. |

`captures/geometry.json` records the actual measured language, profile, viewport, mode, typography and Hero element bounds from Chromium.

## Focused checks

Run the affected French and English profile checks from the repository root:

```bash
npx playwright test --config tests/phase-5/playwright.config.cjs \
  tests/phase-5/hero-title-scale.spec.cjs \
  tests/phase-5/hero-short-height-fallback.spec.cjs \
  --project=desktop-fr --project=desktop-en \
  --project=tablet-landscape-fr --project=tablet-landscape-en \
  --project=mobile-fr --project=mobile-en
```

Result: **10 passed, 2 skipped** (the existing desktop/tablet-only title test is inapplicable to mobile). Checks cover all seven listed captures, the four short-height cases in both languages, exact effective heading/cue sizes, slideshow aspect ratio and six-image loop, no Hero-element collision, no horizontal page overflow, scroll reachability, keyboard focus, normal→short→normal resize transitions and the Hero-to-Projects boundary.

The earlier legacy-test timeout was test instrumentation: `locator.getAttribute()` waited for `[data-kc-hero-mode]` to appear even though the marker is intentionally absent in NORMAL mode. The test now reads the optional marker synchronously and asserts the same expected mode; no viewport or geometry assertion was removed. The tablet title/resize sweep now passes in French and English.

The deterministic bilingual generated-site check passes. Frozen screenshot references remain unchanged; all 230 recorded hashes verify. These review captures are new evidence and are not historical baselines.
