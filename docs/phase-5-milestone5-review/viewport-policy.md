# Milestone 5 viewport-policy review

These captures document the focused viewport correction. They are review images only, not regression baselines.

The desktop and tablet results at 1100 × 700 are different responsive profiles, not different readings of one profile. Regular desktop Chrome reports a fine pointer and selects the desktop profile at that width. Responsive DevTools with touch emulation reports a coarse pointer/iPad-like device and selects tablet. Both report the same CSS viewport dimensions when configured identically; device pixel ratio does not select the profile.

## Measured layout

CSS geometry is in CSS pixels at 100% browser zoom. Control sizes are bounding boxes; text sizes are computed CSS font sizes. At 1100 × 700, repeated direct load and 1440 → 1100 resizing produced the same measurements.

The user's earlier DevTools capture reported a CSS viewport and outer window of 1100 × 834, DPR 2, zoom 1, with a coarse pointer. The earlier regular Chrome capture reported a CSS viewport of 1920 × 663 inside a 1920 × 1050 outer window, DPR 1, zoom 1, and a fine pointer. Those screenshots were different CSS viewports as well as different responsive profiles. In the controlled equal-viewport comparison below, both browser contexts were set to 1100 × 700 and zoom 1; the regular desktop context used DPR 1/fine pointer, and the tablet-emulation context used DPR 2/coarse pointer. Playwright's headless outer window equals its configured viewport, so the user's outer-window sizes above are recorded separately rather than inferred from the test harness.

| Locale and profile | CSS viewport / DPR | Left / right content gutter | Hero title x / CSS size | Status pill | Hire control |
| --- | --- | ---: | ---: | ---: | ---: |
| FR desktop, fine pointer | 1100 × 700 / 1 | 24.44 / 24.44px | 24.44px / 56px | 242.48 × 44px | 125.38 × 44px |
| EN desktop, fine pointer | 1100 × 700 / 1 | 24.44 / 24.44px | 24.44px / 56px | 234.64 × 44px | 99.36 × 44px |
| FR tablet, coarse pointer | 1100 × 700 / 2 | 24.89 / 24.87px | 24.88px / 48px | 242.56 × 44px | 125.38 × 44px |
| EN tablet, coarse pointer | 1100 × 700 / 2 | 24.89 / 24.87px | 24.88px / 48px | 234.72 × 44px | 99.36 × 44px |
| FR desktop | 1440 × 900 / 1 | 32 / 32px | 32px / 56px | 243.91 × 44px | 125.38 × 44px |
| EN desktop | 1440 × 900 / 1 | 32 / 32px | 32px / 56px | 236.06 × 44px | 99.36 × 44px |
| FR desktop, wide/short | 1920 × 663 / 1 | 25.14 / 25.12px | 25.13px / 56px | 242.61 × 44px | 125.38 × 44px |
| FR desktop | 1366 × 768 / 1 | 29.12 / 29.11px | 29.11px / 56px | 243.36 × 44px | 125.38 × 44px |

At desktop 1100 × 700, the Projects heading's left edge is 24.44px, matching the Hero title. The responsive-shell browser checks cover desktop and tablet portrait/landscape in both languages. Desktop rail checks cover 1440 × 900, 1280 × 800, 1200 × 800 and 1100 × 700, including start/end reachability, repeated resize, and the Projects-to-About boundary.

## Scrollbar-width cause

In the user's regular Chrome capture, `window.innerWidth` was 1920px while the document's layout containing block was 1905px wide because a 15px classic scrollbar occupied part of the window. The old Hero frame was centered in that 1905px containing block but assigned a 1920px width. Its left edge was therefore −7.5px; with the 25.14px gutter, the heading began at 17.63px while the fixed navbar logo began at 25.14px. Responsive emulation used overlay scrollbars (`clientWidth === innerWidth`), so it did not show this offset. The same layout-width model after the correction measures both logo and heading at 25.13px. Hero and frame sizing now use `document.documentElement.clientWidth`, while the browser's actual `innerWidth` remains available to the viewport/profile policy.

## Review captures

- [French desktop, 1100 × 700](viewport-policy/desktop-fr-1100x700.png)
- [English desktop, 1100 × 700](viewport-policy/desktop-en-1100x700.png)
- [French touch-emulated tablet, 1100 × 700](viewport-policy/tablet-fr-1100x700.png)
- [English touch-emulated tablet, 1100 × 700](viewport-policy/tablet-en-1100x700.png)
- [French desktop, 1440 × 900](viewport-policy/desktop-fr-1440x900.png)
- [English desktop, 1440 × 900](viewport-policy/desktop-en-1440x900.png)
- [French Projects end, 1440 × 900](viewport-policy/projects-end-fr-1440x900.png)
- [English Projects end, 1440 × 900](viewport-policy/projects-end-en-1440x900.png)

The changes are committed locally on `phase-5/fluid-responsive` at `03499510ee8c5e7f1ed8c58d3f1488840fa7a605`. They have not been pushed. To open an interactive Ubuntu preview from the existing checkout, the user must authorize pushing this review commit; after that, fetch the branch and run the static server on an available local port. No reference screenshots, full suite or Lighthouse runs were changed or run.
