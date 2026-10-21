# Phase 2 report — behavior-preserving CSS and JavaScript extraction

## Outcome

The extraction is complete on `phase-2/css-js-extraction`. The eight-profile visual and functional gate passed without updating references. Independent review found no blocking source-parity defect. **Performance parity is unresolved:** the Lighthouse comparator failed its French mobile Total Blocking Time budget. I recommend keeping this phase unmerged and treating the TBT regression as open before relying on the branch as performance-neutral. No Phase 3 work has started.

The completed Phase 0–1 branch, `test/portfolio-baseline-phase-0-1`, was pushed to GitHub for backup at `ec8503a0701b0d29e4bb94864c08d11fcafe9c4c`. The separate Phase 2 branch began at that exact commit. GitHub reports the Pages source as legacy build from **`main` at `/`**; the repository contains no workflow or hosting configuration changed by these commits. Remote `main` remains at `d8a37314ed7d2265f3f949c9e048b5e2beadfc20`. Phase 2 was not pushed, merged, deployed or published.

## Changes

- Moved five original CSS blocks into separate files in [`styles/`](../styles/project-layouts.css), replacing them with stylesheet links at their original source positions. Each extracted file was checked byte-for-byte against the original block. The `<helmet>` style remains in the `<helmet>` slot, the template nav rule remains in its template slot, and the late landscape overrides remain after their original controller.
- Moved nine ordinary inline JavaScript blocks into classic scripts under [`scripts/`](../scripts/projects/tablet-landscape-rail.js). Script references remain in their original order and are synchronous. The async Google Analytics tag remains between consent defaults and analytics initialization.
- Moved the main controller class body verbatim into root-level [`portfolio-controller.js`](../portfolio-controller.js). The existing custom `text/x-dc` block remains for `support.js` to read; its script type, `data-dc-script`, and exact `data-props` remain intact. A small text bridge calls the synchronously loaded factory with the runtime-provided `DCLogic` and `React`. Root-level placement preserves the relative curtain import fallback.
- Left project content, URLs, asset files, translations, SEO metadata, `support.js`, design-system runtime, iframe document, Three.js curtain module, and deployment configuration untouched. No framework or optimization was added.

## Verification

Each milestone was committed separately and tested with the relevant locales/layouts. The full eight-profile `npm test` ran once after all source extraction changes.

| Milestone | Targeted result |
| --- | --- |
| CSS extraction | 16 visual/project checks passed across all eight profiles; CSS byte comparison passed |
| Consent and analytics | 6 functional checks passed: French desktop and English mobile |
| Tablet controllers | 21 checks passed across both tablet orientations and languages; 3 existing responsive duplicates skipped |
| Mobile controllers | 10 checks passed in French and English mobile; 2 existing responsive duplicates skipped |
| Main controller bridge and final gate | `npm test`: 42 passed, 6 existing responsive skips, 0 failed or flaky |

All checks retained the accepted reference lock; no screenshot was regenerated. The final run confirmed natural video playback, mobile image sequences, navigation, all projects, About/footer/legal behavior, representative animation states and the responsive routing assertions. The lock check passed before and after the complete gate with all 230 Phase 0–1 artifact hashes intact.

The original-source identity check from Phase 0–1 is expected to fail after this authorized source extraction; the frozen content inventory and rendered regression gate remain the candidate checks. The independent reviewer verified the extracted CSS and JavaScript bodies against the baseline, preserved metadata/order, protected-file boundaries and the factory bridge. The reviewer found no blocking source-parity issue and flagged the cold-load timing change as a risk to report. The final Playwright JSON is preserved at [`full-gate.json`](../tests/phase-2/validation/full-gate.json).

## Lighthouse and performance impact

Lighthouse **13.5.0** ran three times for each language/device target at phase completion. Raw JSON, HTML and aggregate results are saved in [`tests/phase-2/performance/`](../tests/phase-2/performance/summary.json). The comparator outcome is saved in [`comparison.json`](../tests/phase-2/performance/comparison.json).

| Language | Profile | Score median (range) | FCP median | LCP median | TBT median | CLS median |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| French | Mobile | 53 (51–54) | 4,889 ms | 11,131 ms | **381 ms** | 0.00170 |
| French | Desktop | 76 (75–78) | 1,583 ms | 3,076 ms | 0 ms | 0.00006 |
| English | Mobile | 57 (57–58) | 4,218 ms | 9,790 ms | 285 ms | 0.00157 |
| English | Desktop | 88 (88–89) | 1,074 ms | 1,914 ms | 0 ms | 0.00000 |

Only French mobile TBT exceeded the configured budget: **380.5 ms versus 208.5 ms baseline**, above the 308.5 ms limit. The median performance score is three points lower (53 vs 56), within the comparator's five-point allowance; FCP and LCP improved for French mobile. The other targets met the comparison budgets. All three candidate French mobile TBT samples were high (369–394 ms), while the baseline samples were 187–241 ms. The regression is consistent across this candidate run, although the reports do not isolate its cause. Treat it as a real unresolved performance regression signal; do not attribute it to noise or claim the extraction had no impact. No repeat Lighthouse round was run.

The Lighthouse result records baseline commit `f36454546bc45f4c13add700208f701f2b212b2b` because the final controller bridge was the in-progress, uncommitted extraction when the phase-completion audit ran. The remaining Phase 2 source at measurement time is identified by SHA-256: `index.html` `79cfc5826d991d1c2cfac2cbffbedd3024dae72e1d4fb3f3881a5d53cd8d19b6`; `portfolio-controller.js` `173ac193f8b802da1113f5299e606714e15fa77dde06de7c30e19e6c1b53b397`. These source files were committed unchanged after that run. The audit used the same controlled local runtime replay and simulated settings as the Phase 0–1 baseline; it is not public PageSpeed data.

Moving inline blocks to separate files necessarily adds stylesheet/script requests. Classic scripts still block parsing and run in source order, but external fetch timing differs from inline execution. The settled screenshots and behavior checks pass; they do not establish identical cold-load timing or rule out a brief early style shift. Consider that a known risk until addressed by an authorized follow-up.

## Commits and recovery

The Phase 2 branch has independent recovery commits for the extraction plan, CSS, analytics/consent, tablet controllers and mobile controllers. The main-controller bridge and final report are saved together in the final Phase 2 checkpoint. The Phase 0–1 baseline branch remains separately pushed and unchanged. All 150 baseline PNGs and manifests remain locked and unchanged.

The final diff is limited to `index.html`, the extracted CSS and JavaScript files, Phase 2 documentation, and saved Phase 2 Lighthouse reports. Reverting the final Phase 2 commits restores the Phase 0–1 state; the branch and its evidence are not deployed.

## Readiness and next step

Visual and functional parity passed in the controlled Chromium matrix, and independent source review found no blocking defect. The French mobile Lighthouse TBT comparison failed, and external stylesheet loading introduces cold-load timing risk. I recommend treating this branch as **behaviorally validated but not cleared for a performance-neutral or release-readiness claim**. The performance question requires an explicit decision before Phase 3. Phase 2 changes remain local; wait for the user's explicit approval before any push, merge, deployment, publication or Phase 3 work.
