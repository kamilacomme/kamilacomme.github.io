# Phase 2 report — behavior-preserving CSS and JavaScript extraction

## Outcome

The extraction is complete on `phase-2/css-js-extraction`. The eight-profile visual and functional gate passed without updating references. Independent review found no blocking source-parity defect. **Performance parity is unresolved:** the Lighthouse comparator failed its French mobile Total Blocking Time budget. I recommend keeping this phase unmerged and treating the TBT regression as open before relying on the branch as performance-neutral. No Phase 3 work has started.

The completed Phase 0–1 branch, `test/portfolio-baseline-phase-0-1`, was pushed to GitHub for backup at `ec8503a0701b0d29e4bb94864c08d11fcafe9c4c`. The separate Phase 2 branch began at that exact commit and was later pushed for backup and independent review at `64cdbbe4a86a128e11d474af956e9c07ad990c82`. GitHub reports the Pages source as legacy build from **`main` at `/`**; the repository contains no workflow or hosting configuration changed by these commits. Remote `main` remains at `d8a37314ed7d2265f3f949c9e048b5e2beadfc20`. Phase 2 was not merged, deployed or published.

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

Visual and functional parity passed in the controlled Chromium matrix, and independent source review found no blocking defect. The French mobile Lighthouse TBT comparison failed, and external stylesheet loading introduces cold-load timing risk. I recommend treating this branch as **behaviorally validated but not cleared for a performance-neutral or release-readiness claim**. The Phase 2 source checkpoint is pushed to the review branch; the follow-up diagnosis and status tracker are local and unpushed. Wait for the user's explicit approval before any further push, merge, deployment, publication or Phase 3 work.

## Follow-up performance diagnosis

The saved Phase 2 Lighthouse JSON reports were inspected without running another audit. No standalone Chrome DevTools trace files were retained; the raw Lighthouse reports provide `long-tasks`, `bootup-time`, `network-requests` and main-thread work breakdowns.

The French mobile candidate recorded 108 requests versus 91 in the baseline. Script requests increased from 9 to 19 and stylesheet requests from 22 to 29. The added requests include nine synchronous classic script files and five CSS files; two styles are requested again when the original runtime mounts `<helmet>`. These resources are discovered near navigation start, while the two helmet stylesheet requests finish around 230–277 ms in the first candidate run. The requests alter parser/render-blocking and initialization timing even though the extraction kept their document order.

The three candidate TBT values are 369, 380.5 and 394 ms; the baseline values are 187, 208.5 and 241 ms. Candidate FCP median moved earlier from 5,649 to 4,889 ms, while TTI median moved later from 15,924 to 16,446 ms. That makes the Lighthouse FCP-to-TTI accounting window about 1.28 seconds longer. The long-task attribution also changed: React and `support.js` remain substantial in both builds, while the candidate reports additional tasks from `portfolio-controller.js` (50–91 ms) and once from `tablet-landscape-rail.js` (90 ms). Median total script evaluation rose by about 46 ms, less than the 172 ms TBT increase. This points to changed script/resource timing and more work falling inside Lighthouse's TBT window; the reports do not prove that any one extracted file caused the entire regression.

**Most likely cause:** the newly externalized parser-blocking scripts and render-blocking stylesheets change startup scheduling; the earlier FCP and later TTI expand the TBT window, and newly attributed controller tasks add some blocking work. **Causal confidence: partial, not isolated.** The performance regression itself is confirmed across all three saved runs.

**Proposed minimal correction to test, pending user approval:** add `defer` to the extracted application/controller script tags (leaving the two analytics scripts synchronous), preserving their document order. Deferred classic scripts run in order before `DOMContentLoaded`, when the existing runtime boots; this could remove parser-blocking fetches without changing the source modules. Validate with focused tablet/mobile behavior and visual checks plus one French-mobile Lighthouse confirmation measurement. This is a proposed experiment only; no correction has been implemented.

The personal preview is available from the Phase 2 branch using `npm run test:serve`. The local server returned 200 for `/` and `/en/` and 206 for a ranged MP4 request. A browser with access to the original CDNs is required for fonts, React, the design-system bundle and curtain module. No complete screenshot set or functional suite was regenerated for this follow-up.

## Authorized defer experiment

The user confirmed personal browser inspection passed for both languages and interactions. A single reversible experiment deferred only the seven project behavior scripts at the end of `index.html`, preserving their order. `support.js`, the design-system bundle, `portfolio-controller.js`, its immediate inline bridge, and analytics stayed synchronous. The controller factory must be available when the inline bridge executes; the project scripts use mutation observers and event listeners and retain the required `tablet-fit` before landscape-rail order.

Focused Playwright tests passed **24/24** for tablet portrait, tablet landscape and mobile in French and English. This included functional behaviors and the existing visual/animation references; no screenshot references were regenerated. One controlled French-mobile Lighthouse run reported TBT **421 ms** (FCP 4,758 ms, LCP 10,508 ms, CLS 0.00170, score 52). This was worse than the Phase 2 French-mobile median of 380.5 ms and the original baseline median of 208.5 ms. The defer attributes were reverted; the extraction source is restored to the validated Phase 2 checkpoint. No alternate mitigation was attempted.

The raw one-run Lighthouse JSON and metadata are retained in [`defer-experiment/`](../tests/phase-2/performance/defer-experiment/). The result is a single confirmation and should not be interpreted as a stable performance estimate. The TBT regression remains unresolved and Phase 2 remains blocked on its performance budget. The experiment and documentation are committed locally on `experiment/defer-project-scripts` only; they have not been pushed, merged or deployed.
