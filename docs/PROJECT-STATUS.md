# Project status

Updated: 2026-10-21. This tracker records verified milestones; it does not authorize later phases.

**Current branch:** `phase-3/simplification`

**Latest validated Phase 2 source checkpoint:** `64cdbbe4a86a128e11d474af956e9c07ad990c82`

**Latest experiment evidence checkpoint:** `9e1051c96476395910d9551f3b17d0d6e1d5c40a`
**Current Phase 3 branch checkpoint:** `7492e6305a4d70471df60f2b08e6fff03ec4469b` (blocked About feasibility documented; experiment reverted)

**Current task:** evaluate a build-time About content source and decide Phase 3 sequencing.

**Next planned task:** pending approval to defer About deduplication and resume tablet/mobile controller ownership cleanup. No application implementation is active.

## Roadmap

| Phase | Scope | Status |
| --- | --- | --- |
| 0 | Read-only audit of responsive implementations, content, risks and architecture | Complete |
| 1 | Baseline inventory, screenshots, Playwright gates and Lighthouse references | Complete |
| 2 | Behavior-preserving CSS and JavaScript extraction, then parity review | Complete — extraction, visual/functional validation and user inspection passed; French mobile TBT remains an open release blocker |
| 3 | Simplify duplicated page/layout behavior while preserving four responsive modes | Blocked — proposed shared About DOM failed visual parity in all eight profiles; experiment reverted |
| 4 | Centralize project data and French/English translations | Not started |
| 5 | Improve semantic structure and accessibility while preserving approved text and SEO values | Not started |
| 6 | Review asset loading and make separately approved performance improvements | Not started |
| 7 | Cross-browser/device validation and release-candidate regression | Not started |
| 8 | Final documentation, independent acceptance and release decision | Not started |

Phases 3–8 are a proposed roadmap only. Each requires its own authorization before implementation.

## Phase 3 milestones

Milestone names and acceptance criteria remain stable. Progress counts only verified, complete milestones.

**Progress: 0 / 4 milestones complete.**

| Milestone | Acceptance evidence | Status |
| --- | --- | --- |
| About shared-tree feasibility | One five-card tree passes locked visual references and animation checks in all eight language/layout profiles without fragile workarounds | Blocked — all eight profiles differed; mobile intro was 24 px lower than reference |
| Tablet geometry ownership | One tablet geometry owner with separate readable portrait/landscape calculations; targeted tablet visual and behavior checks pass | Not started |
| Mobile sizing ownership | One mobile project-sizing owner; targeted mobile visual and behavior checks pass in both languages | Not started |
| Phase 3 acceptance | Full eight-profile visual/functional regression, Lighthouse comparison to Phase 0–1 and Phase 2, independent review, and documented duplication counts | Not started |

**Current blocker:** the shared About section caused visual differences across desktop, tablet portrait, tablet landscape, and mobile, in both languages. Mobile has a clear 24 px vertical intro displacement. All eight profile runs failed at About snapshots. No reference images were updated. The unverified source experiment was reverted; comparison images, error contexts, and traces remain in `artifacts/playwright/results/`.

**About content deduplication evaluation:** build-time generation is compatible with `x-dc`/`support.js` because a generator can emit ordinary HTML inside the existing template before the browser loads it. GitHub Pages can serve the generated result as static files; however, this repository documents a no-build workflow and Pages serves the root of `main`, so hosting will not run a generator. Generated `index.html` would need to be committed, with the generator run and verified before each change.

The smallest practical option, if revisited, is a dependency-free Node preprocessing script plus a canonical About-card HTML fragment and three explicit insertion markers. It would expand the same five source card definitions into the existing desktop, tablet and mobile shells and substitute each existing React ref name (`cardRef`, `tCardRef`, `mCardRef`). The output remains static HTML; no browser-side cloning, observer, timing dependency, or added runtime JavaScript is needed. A deterministic output check would guard against generated HTML drift. The fragment must preserve wrappers, intro copy, attributes, order, and refs. Existing `renderAbout()` formulas and refs stay in their layout-specific controller paths. English localization selectors and fallback text matching would need verification for all expanded copies.

This adds a fragment, generator, markers, regeneration discipline, and output-drift testing to a repository whose page is edited and served directly. It could reduce authored card markup by 10 copies (15 authored blocks to five source definitions), but still outputs 15 runtime DOM cards and leaves layout-specific structure and animations intact. That reduction alone does not justify a build convention now.

**Recommendation:** defer About card content deduplication to the later shared-content phase, where content sources are already in scope. Record the three About shells and their 15 rendered card blocks as intentional duplication for now. Proceed first with the approved tablet/mobile controller ownership cleanup; it can simplify responsibilities without changing the About DOM or adding a build system. Phase 3 remains paused until this reprioritization is approved. No generator or application code was added.

**Measured duplication to date:** no net source reduction is claimed because the failed shared-tree experiment was reverted. The experiment removed 10 repeated About card blocks (15 card blocks to 5) but failed parity, so that is not an accepted Phase 3 result. Current duplicate count remains 15 authored About card blocks across the three layout shells. Tablet/mobile project controllers are still separately owned; no responsibility reduction has been implemented or measured. Intentionally retained differences include the distinct desktop, tablet portrait/landscape, and mobile card geometry and animation formulas, plus layout-specific intro compositions and mobile intro copy.

## Phase 2 milestones and release follow-ups

Milestone names and acceptance criteria remain stable. The Phase 2 structural scope is complete; its two blocked performance follow-ups remain open release issues, not unfinished extraction work. Progress is a count of verified milestones, not an estimate of time.

**Progress: 9 / 11 milestones complete.**

| Milestone | Acceptance evidence | Status |
| --- | --- | --- |
| Define extraction boundaries | Architecture review records CSS positions, script order and custom controller handling | Complete |
| Extract CSS blocks | Five blocks retained at original cascade positions; 16 visual/project checks pass across eight profiles | Complete |
| Extract ordinary JavaScript | Nine classic scripts retained in order; targeted locale/layout checks pass | Complete |
| Extract main runtime controller | Original class body and `data-props` retained; runtime factory bridge passes source checks | Complete |
| Run full visual/functional matrix | 42 passed, 6 existing responsive skips, no failures or flakes; locked references unchanged | Complete |
| Obtain independent source review | No blocking parity defect; review notes cold-load timing risk | Complete |
| Prepare personal preview | Local server serves `/` and `/en/` with HTTP 200 and MP4 range requests with HTTP 206 | Complete |
| Inspect preview in user's browser | **PASSED** — user personally confirmed both locales and interactions work correctly | Complete |
| Meet Phase 2 Lighthouse performance budget | 12 reports captured and compared; French mobile TBT is 380.5 ms vs 208.5 ms baseline, above the 308.5 ms budget; authorized defer test measured 421 ms and was reverted | Blocked — open release blocker |
| Isolate the TBT cause and select correction | Existing reports reviewed and one defer experiment completed; no single cause isolated. User has declined another standalone investigation for now | Blocked — no further investigation authorized |
| Publish Phase 2 report and tracker | Results and risks documented on the development branch | Complete |

## Performance diagnosis

The Phase 2 Lighthouse comparison is **failed** for French mobile TBT. All three candidate values are elevated (369–394 ms); the baseline values are 187–241 ms. The saved reports show 108 requests vs 91, including 10 additional script requests and 7 additional stylesheet requests. React and `support.js` remain major task sources; the candidate also attributes 50–91 ms tasks to `portfolio-controller.js` and a 90 ms task to `tablet-landscape-rail.js` in one run.

Median FCP moved earlier (5,649 to 4,889 ms), while median TTI moved later (15,924 to 16,446 ms), extending Lighthouse's FCP-to-TTI TBT window by about 1.28 seconds. Total script-evaluation time rose by about 46 ms, less than the TBT increase. The most likely cause is changed startup scheduling and work entering the expanded TBT window after externalization. Existing reports do not isolate a single file or prove the full cause; there are no standalone Chrome trace files.

**Focused experiment completed and reverted:** `support.js`, the design-system runtime, `portfolio-controller.js`, its inline `text/x-dc` bridge, and both analytics scripts were kept synchronous. Only the seven end-of-document project behavior scripts were temporarily deferred, in original order. The main controller bridge requires the factory immediately, so deferring the factory is unsafe. The seven scripts self-register observers/listeners; their dependency order (`tablet-fit` before landscape rail) remains intact with ordered deferred scripts.

The 24 focused Playwright checks passed across tablet portrait, tablet landscape, and mobile in both languages, including locked visual/animation references, project links, navigation, media playback, About, footer and legal dialogs. One controlled Lighthouse run measured French mobile TBT **421 ms**, versus Phase 2 median 380.5 ms and original baseline median 208.5 ms. This did not improve the regression, so all `defer` attributes were removed. The raw report is saved under `tests/phase-2/performance/defer-experiment/`. No second attempt is planned without a new decision.

## Tests and limitations

- **Passed:** final `npm test`: 42 passed, 6 existing responsive skips, 0 failed/flaky; artifact lock passed before and after.
- **Passed:** targeted CSS, tablet, mobile and analytics milestones; all 230 baseline artifact hashes remain unchanged.
- **Passed:** independent review found no blocking source-parity defect.
- **Passed:** user inspected Phase 2 in a browser and confirmed both languages and interactions behave correctly.
- **Passed:** focused experiment checks, 24/24 across six tablet/mobile language profiles; original visual references remained locked.
- **Failed:** `npm run test:performance:compare` — French mobile TBT 380.5 ms exceeds the 308.5 ms budget.
- **Failed:** one controlled French-mobile defer experiment measured TBT 421 ms; experiment reverted.
- **Failed, Phase 3 feasibility check:** `npm run test:qa -- --grep "approved visual and animation states"` ran all eight profiles; all eight failed at About screenshots after the shared-tree experiment. The clearest mismatch is mobile intro content shifted 24 px downward. The source experiment was reverted; frozen references and artifact hashes remain unchanged.
- **Passed, Phase 3 quick checks:** JavaScript syntax checks, `git diff --check`, and all 230 frozen baseline artifact hashes before the visual run.
- **Limitations:** Chromium emulates tablet/mobile; Safari/iOS hardware is not covered. Browser preview needs access to the existing external CDNs. Lighthouse reports contain task/network data but no standalone DevTools trace. The single 421 ms defer confirmation is not a stable performance estimate.

## Decisions and remaining architecture work

- Keep each stylesheet at its original cascade insertion point; do not consolidate blocks during extraction.
- Keep classic scripts ordered and synchronous for the behavior-preserving extraction; preserve the async analytics tag between consent setup and analytics initialization.
- `support.js` reads the `text/x-dc` controller as text, so the controller uses a tiny text bridge to a root-level classic-script factory. Root placement retains the curtain import fallback.
- Preserve React/support.js, English translation machinery, the desktop project iframe and Three.js curtain.
- **Extraction and Phase 2 validation are complete:** CSS and JavaScript now live in source files, and visual/functional states match accepted references; the user independently inspected the site and passed it.
- **Architectural simplification is still pending:** markup and layout behavior remain duplicated across desktop, tablet portrait, tablet landscape and mobile; project content and translations are not yet centralized. Those changes belong to later approved phases.
- **Performance release blocker remains open:** French mobile TBT measured 380.5 ms in the Phase 2 comparison (208.5 ms baseline); the one authorized defer experiment measured 421 ms and was reverted. No additional TBT investigation is authorized now.

## Preview instructions

From Ubuntu, clone the pushed Phase 2 review branch and run its actual static site server:

```bash
git clone --branch phase-2/css-js-extraction https://github.com/kamilacomme/kamilacomme.github.io.git
cd kamilacomme.github.io
npm run test:serve
```

Open `http://127.0.0.1:8000/` for French and `http://127.0.0.1:8000/en/` for English. Leave the terminal running; stop it with Ctrl+C. If port 8000 is occupied, run `PORT=8001 npm run test:serve` and use port 8001 in both URLs. This is a local preview of the real site with its videos and assets. The browser must be able to reach the site's normal CDNs. No screenshots are regenerated.

## Checkpoint and deployment state

The Phase 2 branch `phase-2/css-js-extraction` and original Phase 0–1 baseline branch `test/portfolio-baseline-phase-0-1` remain preserved locally and on GitHub. Validated Phase 2 source checkpoint `64cdbbe4a86a128e11d474af956e9c07ad990c82` is pushed; the defer experiment was reverted, so application files on this branch match that source. Experiment evidence is preserved locally at `9e1051c96476395910d9551f3b17d0d6e1d5c40a`; the current branch and follow-up docs are not pushed. Nothing is merged or deployed. GitHub Pages remains configured to build `main` from `/`; `main` remains at `d8a37314ed7d2265f3f949c9e048b5e2beadfc20`. Phase 3 implementation has not started.

**Next decision needed:** none for the approved Phase 3 scope. The About feasibility gate is in progress. French mobile TBT remains an open release blocker; no standalone investigation is authorized.
