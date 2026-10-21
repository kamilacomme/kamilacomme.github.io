# Project status

Updated: 2026-10-22. This tracker records verified milestones; it does not authorize later phases.

**Current branch:** `phase-3/simplification`

**Latest validated Phase 2 source checkpoint:** `64cdbbe4a86a128e11d474af956e9c07ad990c82`

**Latest experiment evidence checkpoint:** `9e1051c96476395910d9551f3b17d0d6e1d5c40a`
**Latest Phase 3 source checkpoint:** `0225eaf6ac803c66800431f398f15b7741982be7` (tablet geometry is independent of About and navigation initialization)
**Latest Phase 3 checkpoint:** `45349d19e53801e2fe45e7033147e5f21be50945` (locked separate landscape references)
**Latest pushed Phase 3 report commit:** `b6ceeec2e049fe8303bc14f0325a8fff1b4ce93c` (backup/review only)

**Current task:** implement Phase 4 from the approved generated-static-pages architecture.

**Phase 4 base checkpoint:** `f41f000dbb24412b31471b98e6a656e36ae3894d` (validated Phase 3 source plus reviewed documentation; no application changes since Phase 3)

**Next planned task:** define the canonical project-data schema and parity validator. Phase 5 implementation is not authorized.

## Roadmap

| Phase | Scope | Status |
| --- | --- | --- |
| 0 | Read-only audit of responsive implementations, content, risks and architecture | Complete |
| 1 | Baseline inventory, screenshots, Playwright gates and Lighthouse references | Complete |
| 2 | Behavior-preserving CSS and JavaScript extraction, then parity review | Complete — structural extraction, visual/functional validation and user inspection passed. French mobile TBT remains unresolved and blocks release readiness |
| 3 | Simplify duplicated page/layout behavior while preserving four responsive modes | Structurally complete — approved tablet scale retained, Projects initialization dependency resolved, eight-profile gate and review passed. Mobile Lighthouse regression remains unresolved and blocks release readiness |
| 4 | Centralize project data and French/English translations | In progress — approved approach B; source inventory milestone complete, no generated page output changed yet |
| 5 | Hybrid fluid-responsive layout, independently readable typography, and semantic/accessibility review | Not started — target architecture is approved for future Phase 5; implementation is not authorized. Proposal: [hybrid-responsive-architecture-proposal.md](hybrid-responsive-architecture-proposal.md) |
| 6 | Review asset loading and make separately approved performance improvements | Not started |
| 7 | Cross-browser/device validation and release-candidate regression | Not started |
| 8 | Final documentation, independent acceptance and release decision | Not started |

Phases 4–8 are future roadmap items. Phase 3 structural work is complete. Phase 4 is authorized on its dedicated branch; Phase 5 architecture direction is approved for the future, but its implementation is not authorized.

**Responsive architecture proposal:** the user approved the hybrid Grid/Flexbox direction, intended effective typography sizes, readability/zoom requirements and 325px effective Hero slideshow cap for future Phase 5. The plan is documented in [hybrid-responsive-architecture-proposal.md](hybrid-responsive-architecture-proposal.md), sequenced after Phase 4; it does not authorize implementation now.

**Phase 4 architecture:** the user approved approach B: generate French and English static pages from shared templates/data, removing the runtime French-to-English HTML rewrite only after parity passes. The plan is documented in [phase-4-architecture-proposal.md](phase-4-architecture-proposal.md). The read-only baseline inventory is [phase-4-inventory.md](phase-4-inventory.md).

## Phase 4 milestones

Milestone names and acceptance criteria remain stable. Progress counts only verified complete milestones.

**Progress: 1 / 6 milestones complete.**

| Milestone | Acceptance evidence | Status |
| --- | --- | --- |
| Source inventory and parity contract | Current source and frozen inventory document all project IDs, exact localized/layout variants, URLs, media, order, About repeats, loader/runtime duties, and preserved asset hashes | Complete — `docs/phase-4-inventory.md`; read-only, no page output changed |
| Canonical project data and responsive order | Six stable project records, locale/layout overrides and four order arrays validate exactly against the 48-record frozen inventory | Not started |
| Shared templates and French static output | Deterministic templates generate `/` and the desktop iframe; French source/content, refs, assets and metadata pass focused parity checks | Not started |
| English static output and loader retirement | `/en/` and English iframe are generated from the same templates; translated text, metadata, hash navigation, Footer layout, runtime refs and initialization pass parity before removing runtime translation | Not started |
| Shared About content generation | Five bilingual About content records generate existing three shells; refs, animation timing and visuals pass targeted checks | Not started |
| Phase 4 acceptance and review | Deterministic output, exact inventory, full eight-profile visual/functional gate, independent review and Lighthouse comparison are complete; mobile TBT stays a release blocker | Not started |

## Phase 3 milestones

Milestone names and acceptance criteria remain stable. Progress counts only verified, complete milestones.

**Progress: 4 / 5 Phase 3 milestones complete; one shared-content milestone was deferred to Phase 4 by approval.**

| Milestone | Acceptance evidence | Status |
| --- | --- | --- |
| About shared-tree feasibility | One five-card tree passes locked visual references and animation checks in all eight language/layout profiles without fragile workarounds | Deferred — user approved moving shared About content to Phase 4; the three layout structures remain intentionally separate in Phase 3 |
| Tablet geometry ownership | One tablet geometry owner with separate readable portrait/landscape calculations; targeted tablet visual and behavior checks pass | Complete — user-approved 0.9267 Projects scale retained. Removed About measurements/observers and navigation CTA sizing dependency; Projects consumes completed shared viewport policy. Targeted tablet behavior/rotation: 13 passed, 3 existing responsive skips; tablet visual/project checks: 8/8 passed against frozen portrait refs and a separate locked Phase 3 landscape set |
| Mobile sizing ownership | One mobile project-sizing owner; targeted mobile visual and behavior checks pass in both languages | Complete — 10 passed, 2 existing responsive skips across both locales |
| Shared project video lifecycle | Common lifecycle implementation retains independent tablet/mobile selectors and thresholds; natural playback checks pass in both languages | Complete — 6/6 focused profile checks passed |
| Phase 3 acceptance | Full eight-profile visual/functional regression, Lighthouse comparison to Phase 0–1 and Phase 2, independent review, and documented duplication counts | Complete for structural scope — full gate and independent review passed; measurements and duplication counts recorded. Lighthouse budgets fail, so this is not release-ready |

**Approved design adjustment:** tablet-landscape Projects now use the shared tablet scale (0.9267 at 1194×834), matching Hero and About. The uniformly smaller cards, typography, and spacing are an explicitly approved visual change, not unchanged visual parity. Original Phase 0–1 and Phase 2 reference images remain preserved. The approved landscape visuals are captured separately in `tests/phase-3/references/`, with an independent lock for 36 images and four capture manifests; unchanged profiles point to the frozen references.

**RESOLVED — tablet Projects initialization dependency; full history retained:** the Projects script waited for its own `#kc-t-stage` mount, then watched `#apropos-t > div > div` and card styles. Portrait alignment read About’s `offsetWidth`/`getBoundingClientRect`; landscape length read an unrelated navigation Hire-button right edge. More significantly, `portfolio-controller.js` called `__kcTabletProjectFit()` immediately after assigning the scale but before it wrote the shared tablet frame and nav sizes. The main controller then re-ran `fit()` on `document.fonts.ready`, `loadingdone`, load/resize/pageshow, fixed 200/800/2000ms timers, and React ref/component updates. A browser trace showed the CTA and viewport measurements changing between early and later fit calls; the derived Projects height shifted by about 60px. The timers were not independently shown to cause the settled offset; they repeatedly invoked the premature cross-section measurement while initialization was in flight.

The correction replaces the early callback with a `kc:tablet-layout-change` policy published after the shared controller finishes its writes. The tablet Projects owner uses its own viewport plus the shared scale, a stable 32-design-pixel rail inset, and a frame-coalesced policy signature. It no longer observes or measures About or measures the nav CTA. It still responds to genuine policy/viewport changes, orientation, page restore/load, and font completion. At 1194×834 both languages now settle to the approved 0.9266667 scale and 2975.4px Projects span after one owner initialization; the About boundary remains stable through 3 seconds with no later Projects style writes. Focused tablet behavior/rotation checks passed 13/16, with 3 existing responsive skips; focused tablet visual checks passed 8/8. The full Phase 3 eight-profile gate also passed after the correction. This dependency is resolved; the approved smaller-card scale is a separate design adjustment and remains in place.

**Phase 3 full validation:** the full eight-profile gate passed: 42 tests passed, 6 existing responsive skips, 0 failures; original baseline artifact hashes and the 36-image Phase 3 landscape reference lock passed before and after. The approved tablet-landscape visual change is tested against its separate Phase 3 references; originals were not overwritten. Lighthouse was measured once at phase completion (3 runs per language/profile) and raw JSON/HTML reports are saved in `tests/phase-3/performance/`. Independent final diff review found no blockers. It noted the existing narrow-landscape minimum-width limitation (the `Math.min(574, width - 64)` formula can yield narrower cards around 500–637px); it predates this change and is retained as an item for the future fluid-layout review.

| Locale / profile | Score | FCP | LCP | TBT | CLS | Speed Index |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| French mobile | 39 | 5096 ms | 11541 ms | **925 ms** | 0 | 5980 ms |
| English mobile | 45 | 4308 ms | 9852 ms | **704 ms** | 0 | 5447 ms |
| French desktop | 78 | 1400 ms | 2820 ms | 35 ms | 0.000056 | 1698 ms |
| English desktop | 87 | 1026 ms | 1895 ms | 50 ms | ~0 | 1628 ms |

The original-baseline comparator fails for French and English mobile TBT and scores, English mobile Speed Index, and English desktop Speed Index. Against Phase 2, French mobile TBT rose from 380.5 ms to 925 ms and score fell 53→39; English mobile TBT rose from 284.5 ms to 704 ms and score fell 57→45. Phase 2 and Phase 3 used matching recorded conditions: same host, Chrome/Lighthouse versions, runtime replay and static-server fingerprints, three runs per target, routes, viewport/throttling profiles, flags, simulated throttling, cache policy, pauses, and analytics/CDN treatment. Both manifests also show `servedSourceVerification: null`; their `measuredCommit` labels are not hashes of the served application files. The runs are method-matched for numerical comparison, but exact source-to-measurement provenance and causal attribution are not proven. The comparator flags this provenance gap, so the Phase 2 comparison is not a provenance-verified gate. The mobile TBT regression remains an unresolved release blocker; no additional test run or optimization was performed.

**Typography/accessibility audit:** [effective-typography-audit.md](effective-typography-audit.md) records rendered font measurements for both languages across 12 representative desktop, tablet, and phone profiles plus a 200% zoom-equivalent viewport. Meaningful copy reaches 9.33px at 1024×600 and 11.4px at 320×568. In the 720×450/DPR2 zoom proxy, Projects/About/Contact navigation links have no rendered boxes; project links and the legal dialog remain reachable. No application code, reference screenshots, or test baselines were changed.

**Historical, reverted experiment / deferred content work:** the attempted shared About DOM tree caused visual differences in all eight profiles, including a 24 px mobile intro displacement. It remains reverted; its diffs/traces are retained in `artifacts/playwright/results/`. This was a failed feasibility experiment, not the final Phase 3 implementation. By approval, About content deduplication is deferred to Phase 4; the three layout-specific structures and 15 card blocks remain intentionally duplicated until then.

**About content deduplication evaluation:** build-time generation is compatible with `x-dc`/`support.js` because a generator can emit ordinary HTML inside the existing template before the browser loads it. GitHub Pages can serve the generated result as static files; however, this repository documents a no-build workflow and Pages serves the root of `main`, so hosting will not run a generator. Generated `index.html` would need to be committed, with the generator run and verified before each change.

The smallest practical option, if revisited, is a dependency-free Node preprocessing script plus a canonical About-card HTML fragment and three explicit insertion markers. It would expand the same five source card definitions into the existing desktop, tablet and mobile shells and substitute each existing React ref name (`cardRef`, `tCardRef`, `mCardRef`). The output remains static HTML; no browser-side cloning, observer, timing dependency, or added runtime JavaScript is needed. A deterministic output check would guard against generated HTML drift. The fragment must preserve wrappers, intro copy, attributes, order, and refs. Existing `renderAbout()` formulas and refs stay in their layout-specific controller paths. English localization selectors and fallback text matching would need verification for all expanded copies.

This adds a fragment, generator, markers, regeneration discipline, and output-drift testing to a repository whose page is edited and served directly. It could reduce authored card markup by 10 copies (15 authored blocks to five source definitions), but still outputs 15 runtime DOM cards and leaves layout-specific structure and animations intact. That reduction alone does not justify a build convention now.

**Approved decision:** defer About card content deduplication to the later shared-content phase. Keep three About shells and 15 authored card blocks unchanged as intentional duplication. Proceed with Phase 3 tablet/mobile controller ownership cleanup without a build system or About code changes. No generator or application code was added by the architecture evaluation.

**Measured duplication to date:** shared video lifecycle changed from two 44-line scripts (88 lines total) to one 61-line parameterized script: 27 fewer authored lines (31%) and one fewer script request. Tablet project geometry now has one owning script with explicit base, portrait, and landscape functions; three geometry scripts plus stale main-controller stage writes are consolidated. The old three scripts totaled 203 lines and the new owner is 218 lines, so this is a responsibility reduction, not a line-count reduction. Mobile sizing now has one active owner: `mobile-canvas-fit.js` scales the authored 393 px canvas; the competing 140-line controller rail fitter had no matching project refs/cards in the page and was unreachable. Removing it reduced the controller by 165 lines overall and removes the stale refs/call sites; no mobile layout formula or runtime sizing implementation was added. Playback thresholds, ticket selectors, mutation binding, and visibility handling remain layout-specific where needed. The failed About experiment was reverted; it removed 10 repeated About card blocks (15 card blocks to 5) but failed parity, so that is not an accepted Phase 3 result. Current duplicate count remains 15 authored About card blocks across the three layout shells. Tablet geometry and mobile canvas sizing each now have one owner; the mobile project layout remains authored static content scaled by its canvas controller. Intentionally retained differences include the distinct desktop, tablet portrait/landscape, and mobile card geometry and animation formulas, plus layout-specific intro compositions and mobile intro copy.

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

- **Passed:** Phase 3 full gate `node tests/phase-3/gate.mjs`: 42 passed, 6 existing responsive skips, 0 failed/flaky; original artifact lock and separate Phase 3 reference lock passed before and after.
- **Passed:** targeted CSS, tablet, mobile and analytics milestones; all 230 baseline artifact hashes remain unchanged.
- **Passed:** independent review found no blocking source-parity defect.
- **Passed:** user inspected Phase 2 in a browser and confirmed both languages and interactions behave correctly.
- **Passed:** focused experiment checks, 24/24 across six tablet/mobile language profiles; original visual references remained locked.
- **Failed:** `npm run test:performance:compare` — French mobile TBT 380.5 ms exceeds the 308.5 ms budget.
- **Failed:** one controlled French-mobile defer experiment measured TBT 421 ms; experiment reverted.
- **Failed, Phase 3 feasibility check:** `npm run test:qa -- --grep "approved visual and animation states"` ran all eight profiles; all eight failed at About screenshots after the shared-tree experiment. The clearest mismatch is mobile intro content shifted 24 px downward. The source experiment was reverted; frozen references and artifact hashes remain unchanged.
- **Passed, Phase 3 quick checks:** JavaScript syntax checks, `git diff --check`, and all 230 frozen baseline artifact hashes before the visual run.
- **Passed, Phase 3 shared-video milestone:** natural video playback and mobile image-sequence test passed in tablet portrait, tablet landscape, and mobile, in both languages (6/6). Baseline screenshot artifacts remain locked.
- **Passed, Phase 3 tablet functional checks:** rendering, project links, responsive branch, About animation, footer and legal interactions passed for tablet portrait and landscape, both languages (8/8).
- **Passed, Phase 3 mobile checks:** the full mobile-only Playwright suite passed in both languages (10 passed, 2 existing responsive skips), covering per-project visuals, scrolling/navigation, videos, image sequences, About/footer and legal dialogs. Frozen references were not updated.
- **Historical Phase 3 matrix before approval of the scale change:** 38 passed, 6 existing responsive skips, 4 failed. All failures were tablet landscape: project-card snapshots and `projects-start` references in both languages. The Celimax locked clip expected 574×220 but the candidate was 531×203; the overall project-start screenshot differed by 0.08 pixel ratio. These differences correspond to the later user-approved tablet scale change. The final gate passed using a separate Phase 3 reference overlay; frozen originals remain locked.
- **Parity control:** the detached Phase 2 worktree (`1b0ddbb`), served independently on port 8002, passed the four tablet-landscape project/visual checks against original references (4/4). It confirms the image differences belong to the Phase 3 scale adjustment; those originals are retained as historical baseline evidence.
- **Passed, Phase 3 tablet geometry correction:** syntax/source checks and frozen artifact lock passed; focused tablet functional/rotation suite passed 13 tests with 3 existing responsive skips across both languages/layouts. Browser timing trace showed stable 2975.4px Projects span and 3809.39px About boundary from 100ms through 3s in both languages.
- **Passed, Phase 3 targeted tablet visuals:** project crops and approved visual/animation timelines passed 8/8 across tablet portrait and landscape in both languages. Portrait compares to the original locked references; landscape compares to the separate approved Phase 3 reference set.
- **Passed, Phase 3 tablet visual checks:** tablet portrait project references passed (6 cards in each language).
- **Failed, Phase 3 Lighthouse budgets:** original-baseline comparator reports FR/EN mobile TBT and score regressions, EN mobile Speed Index, and EN desktop Speed Index. Phase 2 comparison reports FR/EN mobile TBT and score regressions plus EN desktop Speed Index; it also flags missing verified source provenance for the Phase 2 summary. Full measurements and raw reports are recorded above and in `tests/phase-3/performance/`.
- **Limitations:** Chromium emulates tablet/mobile; Safari/iOS hardware is not covered. Browser preview needs access to the existing external CDNs. Lighthouse reports contain task/network data but no standalone DevTools trace. The single 421 ms defer confirmation is not a stable performance estimate.

## Decisions and remaining architecture work

- Keep each stylesheet at its original cascade insertion point; do not consolidate blocks during extraction.
- Keep classic scripts ordered and synchronous for the behavior-preserving extraction; preserve the async analytics tag between consent setup and analytics initialization.
- `support.js` reads the `text/x-dc` controller as text, so the controller uses a tiny text bridge to a root-level classic-script factory. Root placement retains the curtain import fallback.
- Preserve React/support.js, English translation machinery, the desktop project iframe and Three.js curtain.
- **Extraction and Phase 2 validation are complete:** CSS and JavaScript now live in source files, and visual/functional states match accepted references; the user independently inspected the site and passed it.
- **Further content simplification remains pending:** Phase 3 controller ownership cleanup is complete, while project content/translations and repeated card templates remain distributed across layout variants. The proposed Phase 4 work addresses those sources while retaining distinct geometry and animation shells.
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

The Phase 2 branch `phase-2/css-js-extraction` and original Phase 0–1 baseline branch `test/portfolio-baseline-phase-0-1` remain preserved locally and on GitHub. Validated Phase 2 source checkpoint `64cdbbe4a86a128e11d474af956e9c07ad990c82` is pushed; the defer experiment was reverted. Experiment evidence is preserved locally at `9e1051c96476395910d9551f3b17d0d6e1d5c40a`. Phase 3 checkpoint `b6ceeec2e049fe8303bc14f0325a8fff1b4ce93c` was pushed to `phase-3/simplification` for backup/review. The present tracker/report corrections and Phase 4 proposal are unpushed documentation changes. No changes were merged, deployed, or published. GitHub Pages remains configured to build `main` from `/`; remote `main` was last verified at `d8a37314ed7d2265f3f949c9e048b5e2beadfc20`. Phase 3 visual/functional validation is complete; mobile Lighthouse performance remains unresolved and prevents release readiness.

**Current blocker:** mobile Lighthouse budgets fail; French mobile TBT is 925 ms (Phase 2: 380.5 ms; original baseline: 208.5 ms). Phase 3 is structurally complete and pushed for review, but release readiness is blocked. The performance cause has not been separately investigated. The Phase 4 proposal is for review only; wait for approval before implementation. Nothing was merged, deployed, or published, and `main` remains unchanged.
