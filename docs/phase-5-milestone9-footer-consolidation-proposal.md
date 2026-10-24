# Milestone 9 — English tablet Footer ownership proposal

Status: **implemented and focused-verified with user authorization.** The redundant English-only helper and generated script inclusion were removed; the shared Footer and Projects geometry owners remain unchanged. Review captures are linked in [the consolidation review](phase-5-milestone9-footer-consolidation-review/README.md).

## Current behavior and origin

`scripts/projects/english-tablet-footer-alignment.js` is appended only to the generated English page by `scripts/content/build.mjs` (`buildPage()`, lines 250–254). It was introduced with the Phase 4 static bilingual page-generation checkpoint `37ac6227ce47e22406384f36a810625a94d05fda`. Its comments state two original purposes: align the English tablet Footer to a centered tablet About frame, and make English tablet ticket padding count inside the measured ticket width.

The runtime order is:

1. `portfolio-controller.js` mounts the responsive controller and runs `fit()`. Its geometry pass selects the profile, sets the shared gutter tokens and calls `fitFooter(tablet)`.
2. The generated English page loads `english-tablet-footer-alignment.js` after the other end-of-page scripts. The helper inserts a style element immediately, then attempts a Footer fit.
3. If the target markup is not yet mounted, a document-wide child-list `MutationObserver` retries attachment. After attachment, a second observer watches inline style changes on the tablet About stage, Footer heading and contact block. Resize/load events and observed changes queue another fit using one RAF at a time.
4. The main controller also runs delayed startup fits and resize fits. Both systems can therefore write the same Footer anchors in succession.

## Exact writes made by the helper

| Target | Properties changed | Condition |
|---|---|---|
| New `<style>` in `<head>` | Adds `#kc-tablet-projets .ticket { box-sizing: border-box; }` | Every English page load, including when the tablet profile is inactive |
| Footer `[data-c="0"]` heading | `style.left` | English tablet portrait only: `500 <= innerWidth <= 1080` and `innerWidth < innerHeight` |
| Footer `[data-c="1"]` contact block | `style.left` | Same condition |
| Footer `[data-c="3"]` corner video | `style.right` | Same condition |
| Footer `[data-c="4"]` legal links | **No property is changed.** It is included in the loop, but explicitly excluded from the `left` assignment. | Same condition; no write |

The helper does not set Footer font sizes, `top`, `bottom`, width, height, transforms, or animation state. The legal links’ `left` position is set by `fitFooter()` and is not overridden by this helper.

## Which behavior is still English-specific?

The translations themselves remain different and can change text widths and wrapping; that is content behavior, not a need for a second geometry controller. The current Footer is fitted by `fitFooter()` using the published shared 32px tablet gutter. Since Milestone 6, the tablet About stage follows viewport geometry rather than the old fixed-width, scaled frame that the helper’s comment describes. No distinct English-only Footer gutter requirement remains in the current owner contract.

The ticket rule also has no remaining English-only need: `styles/project-layouts.css` line 30 applies `box-sizing: border-box` to every descendant of `#kc-tablet-projets`, including `.ticket`. A browser run with the helper blocked still computed the tablet ticket as `border-box`. This broad rule is already the common Projects owner; the helper’s injected rule is redundant.

## Browser evidence

Chromium ran the generated pages at DPR 1 with fresh loads and the Footer brought into view after startup geometry settled. For the English comparison, the helper script was blocked in the browser only; no source file was edited. French measurements were taken with its normal route, where the helper is not generated. In every settled comparison below, the English current and helper-blocked geometry matched, while the tablet ticket remained `border-box` without the injected style.

| CSS viewport | Active tablet factor | French baseline | English current vs. helper blocked |
|---|---:|---|---|
| 834×1112 | 1.000 | Heading/contact/legal x=32px; video right=802px and bottom=1080px, giving 32px right/bottom insets | Same anchors in both variants; ticket remains `border-box` |
| 716×800 | 0.859 | Heading/contact/legal x=32px; video right=684px and bottom=768px, giving 32px right/bottom insets | Both settled variants: heading/contact/legal x=32px; video right=684px and bottom=768px; ticket remains `border-box` |
| 659×834 | 0.790 | Main-controller geometry uses x=32px and 32px bottom/right anchors | Both settled variants: heading/contact/legal x=32px; video right=627px and bottom≈802px (32px inset); ticket remains `border-box` |
| 716×555 | 0.620 | Heading/contact/legal x=32px; video right=684px and bottom=523px (32px insets) | Helper’s portrait-only condition skips this viewport; values are unchanged, and ticket remains `border-box` |

An instrumented fresh load at 716×800 exposed the race hidden by settled screenshots: after the tablet scale became available, the helper calculated a temporary heading left position of 78.1247px, versus the shared gutter at 32px. The main controller restored 32px about 28ms later. That transient is about a 46px displacement; after the controller’s later startup fit, the final position remained 32px. With the helper blocked, the heading stayed at the main owner’s 32px position throughout. This is consistent with the helper using the About frame width multiplied by the tablet factor even though the updated stage width already follows the viewport.

These measurements show the proposed settled layout, not a new visual design: the helper-blocked variant preserves the approved shared-gutter Footer geometry and the shared ticket box model. No historical reference screenshots were used or changed.

## Minimal consolidation proposal

Implemented:

1. Keep `portfolio-controller.js` / `fitFooter()` as the sole owner of Footer geometry and the shared gutter. Do not add a route-specific geometry branch; preserve natural FR/EN text wrapping.
2. Remove the English helper’s Footer writes and both of its resize/load/observer pathways.
3. Remove the helper-injected ticket style. The existing shared tablet Projects box-sizing rule remains the owner and already produces the same computed value.
4. Stop appending the helper from `scripts/content/build.mjs` and regenerate the static `/en/` output through the established deterministic content build.

This removes one script, one generated-English-only controller hook, two mutation-observer pathways, and one redundant style rule. It preserves the Footer and Projects DOM, `fitFooter()`, the shared responsive gutter values, and the shared ticket component.

## Focused regression gates for the approved correction

- Compare current and corrected English Footer after curtain completion at 834×1112, 1194×834, 716×555, 659×834 and 716×800; verify the shared tablet gutter and all four Footer blocks’ bounds, including no transient off-gutter position after fresh load or resize.
- Run the same geometry checks on French at those sizes to prove the shared owner remains unchanged; inspect English line wrapping separately because the copy is longer in some blocks.
- Verify computed tablet `.ticket` `box-sizing`, outer card bounds, titles, six-project order/links/media and rail/Projects-to-About behavior in both locales. The shared rule must still apply when the English helper is absent.
- Test fresh load, height and width resize across the helper’s former portrait range, orientation change, and one resize from outside the tablet profile into it and back.
- Run `npm run content:check`, `npm run content:build:check`, the focused tablet ticket geometry test, and the focused bilingual Footer/browser interaction checks. Do not run Lighthouse or update visual baselines for this consolidation.

## Implementation result

- Deleted `scripts/projects/english-tablet-footer-alignment.js` and removed its English-only inclusion from `scripts/content/build.mjs`.
- Regenerated `en/index.html`; the generated French page and shared CSS/JS geometry owners are unchanged.
- Verified no helper reference or script tag remains in the build source or either generated route.
- Fresh-load/resize/orientation browser checks across both locales at 834×1112, 1194×834, 716×800, and 716×555 preserved 32px tablet gutters, Footer anchors, six ticket cards, `border-box` ticket sizing, and Projects-to-About transitions. At each settled viewport, Footer heading/contact/legal left edges were x=32px; video right/bottom and legal bottom inset were 32px. The former helper race produced a transient 78.1247px heading left at 716×800 before `fitFooter()` restored 32px roughly 28ms later; after removal, all observed positions remained at x=32px through repeated resizes.
- Focused ticket radius/clip browser checks passed 6/6 desktop/tablet cases (the two mobile cases are intentionally skipped by that test).
- `npm run content:check`, `npm run content:build:check`, and `npm run test:baseline-integrity` passed. All 230 frozen baseline hashes are unchanged.
- The first combined `npm run test:ticket-contract` attempt failed only because its expected preview server on port 8001 was not running. With the server started, the same focused Playwright radius check passed 6/6; its four shared-ticket parser/contract tests and deterministic build check also passed.

## Milestone 9 closure review

**Status: complete (2026-10-24).** The ownership contract and finding classifications are recorded in [PROJECT-STATUS.md](PROJECT-STATUS.md). The user visually approved the decorative Footer video removal across desktop, tablet and mobile in both languages; details and local captures are in [the video-removal review](phase-5-milestone9-footer-media-removal/README.md). `fitFooter()` remains the single Footer geometry owner, the tablet Projects `box-sizing` rule remains shared, and the curtain animation and generic shared video lifecycle are intact.

Closure evidence: focused responsive checks passed (10 passed; 6 profile skips), bilingual Footer/navigation/legal-dialog checks passed 8/8, `npm run content:check` and `npm run content:build:check` passed, and `npm run test:baseline-integrity` confirmed all 230 frozen-reference hashes unchanged. No other confirmed high-priority ownership conflict remains unresolved.

Remaining audit findings are classified and deferred: distinct responsive templates, approved ticket pseudo-elements and profile media handlers are **intentionally retained**; identified dead branches and repeated mobile CSS are **safe cleanup, deferred**; legal-dialog sizing, listener teardown and English generator substitutions are **deferred** pending targeted evidence; Projects extreme-short resilience is **deferred to M10B**. French and English mobile Lighthouse TBT remain release blockers. M10A–M10C are unstarted; this closure does not authorize M10A.
