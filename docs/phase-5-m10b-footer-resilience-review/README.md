# M10B Footer short-height review

Open `gallery.html` locally to review 20 actual Chromium captures. French and English short-height views cover 1707×188 and 320×188; normal controls cover 1440×900, 834×1112 and 393×852. At 320×188, the longer English heading and email have separate successive captures so each remains readable within the short viewport. Other short views show the heading/email, contacts and legal links at their own scroll positions. `measurements.json` records rendered bounds, effective typography, responsive profile, Footer mode, switcher insets and curtain progress/target for every capture.

## What changed

`fitFooter()` now tests the existing Footer groups against their available geometry. When their absolute composition collides or extends beyond the live short viewport, that same Footer section grows in natural document flow. It reuses the existing heading/email, contact and legal-link nodes, preserves their type sizes and gutters, and sizes the curtain to the expanded section. A geometry key keeps the expanded layout stable during scroll-triggered navbar alignment; viewport/profile changes still recalculate it. Normal-height compositions retain their existing positions.

The mobile large-viewport unit can remain at a previous tall size after a window is shortened. The fallback therefore uses the live viewport height when it decides whether the mobile composition fits and when it sets the section's minimum height.

## Navbar measurement diagnosis

The old mobile resize assertion was measuring the Navbar against a Footer that had not reached the viewport. After resize, the responsive-profile marker updated before the preceding sections and document scroll extent had finished settling. Playwright then scrolled to a stale document coordinate, which was clamped at the old maximum; the Navbar itself remained at the top edge. The updated test advances the controlled clock, waits for stable section geometry, and retries using fresh Footer coordinates. It retains the original Navbar-clearance assertion. Browser review capture also waits for the existing 200/800/2000 ms fresh-load geometry passes before starting a long scroll, preventing test setup from racing semantic scroll restoration.

## Verification

Focused checks:

```sh
BASE_URL=http://127.0.0.1:8036 npx playwright test --config tests/phase-5/playwright.config.cjs \
  --project=desktop-fr --project=desktop-en --project=mobile-fr --project=mobile-en \
  tests/phase-5/footer-short-height-resilience.spec.cjs \
  tests/phase-5/mobile-footer-responsive.spec.cjs

BASE_URL=http://127.0.0.1:8036 npx playwright test --config tests/phase-5/playwright.config.cjs \
  --project=tablet-portrait-fr --project=tablet-portrait-en \
  --project=tablet-landscape-fr --project=tablet-landscape-en \
  tests/phase-5/footer-short-height-resilience.spec.cjs \
  tests/phase-5/footer-legal-orientation.spec.cjs \
  tests/phase-5/shared-page-gutter.spec.cjs
```

The short-height test checks all text groups, their non-overlap, gutters, keyboard traversal through both legal links, the language switch route, and return to the normal composition. The resize test checks the Navbar clearance using geometry after resize layout settles.

The focused Footer/gutter run completed with 24 passed and 64 profile-filtered skips. The cross-section run passed About semantic resize continuity and Hero short-height fallback in both languages, and desktop Projects modes in both languages. One pre-existing tablet Projects mode assertion still fails for both locales: under the tablet-landscape browser project when the case resizes to 834×1112 portrait, the test expects the portrait wrapper `#projets-t` to be `position: sticky`; the portrait ticket layout intentionally uses natural flow. No Projects code or test was changed for this Footer task.

The bilingual deterministic build check passed, and all 230 frozen screenshot artifacts retain their recorded SHA-256 hashes.

## Local preview

From the local checkout:

```sh
git switch phase-5/fluid-responsive
git pull --ff-only
xdg-open docs/phase-5-m10b-footer-resilience-review/gallery.html
PORT=8036 npm run test:serve
```

The gallery opens directly from disk. The final command starts the interactive site at `http://127.0.0.1:8036/`; use Chrome DevTools responsive mode to inspect other dimensions and scroll through the sections.

