# Project status

Updated: 2026-10-21. This tracker records verified milestones; it does not authorize later phases.

**Current branch:** `experiment/defer-project-scripts`

**Latest validated Phase 2 source checkpoint:** `64cdbbe4a86a128e11d474af956e9c07ad990c82`

**Latest experiment evidence checkpoint:** `9e1051c96476395910d9551f3b17d0d6e1d5c40a`
**Current task:** record the completed, reverted `defer` experiment and its Lighthouse result.

**Next planned task:** wait for a decision on the remaining Phase 2 performance blocker; do not begin Phase 3.

## Roadmap

| Phase | Scope | Status |
| --- | --- | --- |
| 0 | Read-only audit of responsive implementations, content, risks and architecture | Complete |
| 1 | Baseline inventory, screenshots, Playwright gates and Lighthouse references | Complete |
| 2 | Behavior-preserving CSS and JavaScript extraction, then parity review | Blocked — visual/functional parity passes; French mobile TBT budget fails and personal inspection is pending |
| 3 | Simplify duplicated page/layout behavior while preserving four responsive modes | Not started |
| 4 | Centralize project data and French/English translations | Not started |
| 5 | Improve semantic structure and accessibility while preserving approved text and SEO values | Not started |
| 6 | Review asset loading and make separately approved performance improvements | Not started |
| 7 | Cross-browser/device validation and release-candidate regression | Not started |
| 8 | Final documentation, independent acceptance and release decision | Not started |

Phases 3–8 are a proposed roadmap only. Each requires its own authorization before implementation.

## Phase 2 milestones

Milestone names and acceptance criteria below are stable. Progress is a count of verified milestones, not an estimate of time.

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
| Meet Phase 2 Lighthouse performance budget | 12 reports captured and compared; French mobile TBT is 380.5 ms vs 208.5 ms baseline, above the 308.5 ms budget | Blocked |
| Isolate the TBT cause and select correction | Evidence reviewed; probable timing mechanism documented, but no single cause isolated. User decision required before code experiment | Blocked |
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
- **Limitations:** Chromium emulates tablet/mobile; Safari/iOS hardware is not covered. Browser preview needs access to the existing external CDNs. The Lighthouse reports contain extracted task/network data but no standalone DevTools trace. User has not yet inspected the preview.

## Decisions and remaining architecture work

- Keep each stylesheet at its original cascade insertion point; do not consolidate blocks during extraction.
- Keep classic scripts ordered and synchronous for the behavior-preserving extraction; preserve the async analytics tag between consent setup and analytics initialization.
- `support.js` reads the `text/x-dc` controller as text, so the controller uses a tiny text bridge to a root-level classic-script factory. Root placement retains the curtain import fallback.
- Preserve React/support.js, English translation machinery, the desktop project iframe and Three.js curtain.
- **Extraction is complete:** CSS and JavaScript now live in source files, and tested presentation states match the accepted references.
- **Architectural simplification is still pending:** markup and layout behavior remain duplicated across desktop, tablet portrait, tablet landscape and mobile; project content and translations are not yet centralized. Those changes belong to later approved phases.

## Preview instructions

From Ubuntu, clone the pushed Phase 2 review branch and run its actual static site server:

```bash
git clone --branch phase-2/css-js-extraction https://github.com/kamilacomme/kamilacomme.github.io.git
cd kamilacomme.github.io
npm run test:serve
```

Open `http://127.0.0.1:8000/` for French and `http://127.0.0.1:8000/en/` for English. Leave the terminal running; stop it with Ctrl+C. If port 8000 is occupied, run `PORT=8001 npm run test:serve` and use port 8001 in both URLs. This is a local preview of the real site with its videos and assets. The browser must be able to reach the site's normal CDNs. No screenshots are regenerated.

## Checkpoint and deployment state

The Phase 2 source/test checkpoint `64cdbbe4a86a128e11d474af956e9c07ad990c82` is pushed to GitHub for backup and independent review. The defer experiment was reverted, so current website application files match that validated source checkpoint. The experiment outcome is committed only on local branch `experiment/defer-project-scripts` at `9e1051c96476395910d9551f3b17d0d6e1d5c40a`; the updated tracker is a local, unpushed change. Nothing is merged or deployed. GitHub Pages remains configured to build `main` from `/`; `main` remains at `d8a37314ed7d2265f3f949c9e048b5e2beadfc20`. No Phase 3 work has started.

**Next decision needed:** decide whether to accept the unresolved Phase 2 French-mobile TBT regression as documented or authorize a separately scoped investigation/correction. The one authorized experiment failed and was reverted; Phase 3 remains stopped.
