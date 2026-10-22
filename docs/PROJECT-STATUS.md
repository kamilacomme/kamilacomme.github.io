# Project status

Updated: 2026-10-22. Milestones are marked complete only after their stated checks pass.

**Current branch:** `phase-5/fluid-responsive` (implementation branch; based on `phase-4/shared-bilingual-static`)

**Phase 5 branch point:** `0422402b46bb814d4202abd0e8266d95c03685d3` — completed Phase 4 branch checkpoint, including its latest reviewed documentation. Phase 4 remains preserved on its own branch.

**Latest Phase 5 implementation checkpoint:** `97286cdd78eff1afaaccdf3dc31e3d582bf038bd` — shared desktop/tablet layered-ticket implementation, generated French/English outputs, and focused tablet geometry/type tests. Previous checkpoint: `ee8979594fd901620c8243225047079292fa1bba`.

**Current task:** Milestone 4's shared tablet ticket implementation is ready for the user's visual review. The provided Figma exports are now available; new Phase 5 reference screenshots have not been locked.

**Next task:** Review the French and English tablet portrait and landscape preview images. After approval, record a separate Phase 5 ticket reference set and finish Milestone 4 validation; then continue to Milestone 5.

## Roadmap

| Phase | Scope | Status |
| --- | --- | --- |
| 0 | Read-only audit of responsive implementations, content, risks and architecture | Complete |
| 1 | Baseline inventory, screenshots, Playwright gates and Lighthouse references | Complete |
| 2 | Behavior-preserving CSS and JavaScript extraction, then parity review | Complete — structural extraction and user inspection passed; French mobile TBT remains unresolved and blocks release readiness |
| 3 | Simplify duplicated page/layout behavior while preserving four responsive modes | Complete for structural scope — approved tablet scale retained, initialization dependency resolved, eight-profile gate and review passed; mobile Lighthouse regression remains a release blocker |
| 4 | Centralize project data and French/English translations; generate static routes | Complete — final acceptance recorded below; mobile Lighthouse remains a release blocker |
| 5 | Hybrid fluid-responsive layout, readable typography and accessibility review | In progress — Milestones 1–3 complete; Milestone 4 awaits user visual review before references are locked |
| 6 | Review asset loading and make separately approved performance improvements | Not started |
| 7 | Cross-browser/device validation and release-candidate regression | Not started |
| 8 | Final documentation, independent acceptance and release decision | Not started |

Phase 5 architecture and incremental implementation sequence are documented in [phase-5-plan.md](phase-5-plan.md), with broader hybrid design background in [hybrid-responsive-architecture-proposal.md](hybrid-responsive-architecture-proposal.md). Milestones 1–3 are complete; implementation continues only on this branch. Approved ticket architecture is Option C: one shared layered-ticket template for desktop/tablet, with a separate editorial mobile template.

## Phase 5 milestones

**Progress: 3 / 8 milestones complete.** The browser-measured reference contract, shared shell/type foundation, and desktop/tablet Hero/navigation migration are complete. Phase 5 plan approval was received at `7f98795102548b45366d382680e9589ac690d07f`.

| Milestone | Acceptance criteria | Status |
| --- | --- | --- |
| 1. Responsive geometry and reference contract | Measure four profiles, both locales, transforms, typography, Hero bounds, tablet rail geometry and section transitions; verify immutable references | Complete — browser probe and contract at [phase-5-baseline-contract.md](phase-5-baseline-contract.md); checkpoint `33ab8be03c9d06460439a1946b26a0a960f2916d` |
| 2. Shared fluid shell and type foundations | Introduce responsive tokens/containers for low-coupling shell areas; effective target sizes without shrinking transforms | Complete — checkpoint `c028e183f7b286d5044563bff124f810eae6f0be` |
| 3. Hero and navigation migration | Preserve projector/motion/navigation; enforce 325px maximum effective Hero preview width and anchor/aspect ratio | Complete — checkpoint `ee8979594fd901620c8243225047079292fa1bba` |
| 4. Tablet Projects frame and shared layered tickets | Use one desktop/tablet ticket template with responsive styling; preserve tablet margins, rail geometry, project reachability and About transition | In progress — Figma exports supplied. Shared template and responsive CSS are implemented; targeted checks pass in both locales and tablet orientations. Preview awaits user review; no Phase 5 references have been locked |
| 5. Desktop Projects and shared card typography | Retain desktop layered tickets/iframe contract and apply effective desktop text targets | Not started |
| 6. About and Footer responsive layout | Reduce transforms where safe while preserving three About shells, refs, animations and curtain behavior | Not started |
| 7. Mobile editorial layout and short/zoomed viewport handling | Keep editorial cards and media lifecycles; verify narrow phones, short landscape and zoom accessibility | Not started |
| 8. Phase 5 acceptance, performance comparison and independent review | Full eight-profile gate once, build/data/artifact checks, Lighthouse comparison and independent diff review | Not started |

The detailed scope, focused tests, expected design changes, regression criteria, risks and recovery policy are in [phase-5-plan.md](phase-5-plan.md). French and English mobile Lighthouse TBT remain open release blockers. The full suite is reserved for Phase 5 completion.

**Milestone 2 checkpoint:** `styles/responsive-foundations.css` defines the approved typography tokens and shell rules; the navigation frame no longer applies a shrinking transform, and the tablet Projects heading no longer measures the unrelated Hero title to choose its font size. Phase 4 data validation and deterministic bilingual generation passed; all 230 frozen artifacts retain their hashes; changed JavaScript and Playwright files pass syntax checks; the focused responsive-shell test passed 8/8 across FR/EN desktop, tablet portrait, tablet landscape and mobile. Keyboard tab movement from “Projets” to “À propos” passed. Headless Chromium did not provide a browser zoom control, so true 200% zoom remains explicitly unverified for Milestone 7. The first test run's six failures were a test selector reading the status dot rather than its text; the selector was corrected and the full targeted rerun passed. No references were updated. The Option C ticket decision is documented in the Phase 5 plan; ticket code has not changed.

**Milestone 3 checkpoint:** Desktop and tablet Hero headings now use effective 56px and 48px sizes outside shrinking ancestor transforms; their original viewport-relative anchor coordinates are maintained. The desktop six-image preview stays at or below 325 effective pixels at 1280×800, 1440×900 and 2560×1440 in both languages, retains its 326:204 ratio and 32px authored bottom/right insets, and advances its image loop. Hero-focused checks passed 8/8 for desktop and both tablet profiles in FR/EN (four cap checks are expected skips on tablet). The navigation shell test passed 8/8 in the preceding checkpoint. `content:check`, deterministic `content:build:check`, syntax and the 230-artifact immutable baseline lock pass. No screenshot references were changed. Mobile Hero typography remains with Milestone 7 so 320px wrapping can be handled without a temporary scale compensation.

**Milestone 4 implementation checkpoint:** Desktop and tablet now render from the single `templates/cards/layered-ticket.html`; the old desktop and tablet card templates are retired. The mobile editorial template, Phase 4 project data, canonical order and mobile media lifecycle remain unchanged. A shared `styles/layered-ticket.css` owns the layered card, and the desktop iframe and tablet rail retain their existing wrappers and media triggers. Tablet Projects no longer scales its whole stage: the existing geometry owner applies the shared viewport scale to card spacing and frame geometry while leaving ticket text at effective 32/14/12px. Portrait card bounds and section length match the baseline; landscape card width and left margin match within 0.1px, its height grows from 203.87px to 250.19px for the full-size text, and the bottom anchor remains within 0.4px. The landscape section and About boundary differ from the Phase 5 geometry contract by 1.25px. All six localized cards pass fit checks. Focused validation passed: tablet template/type/boundary/orientation assertions 4/4, tablet rendering/order/links 4/4, tablet real-media lifecycle 4/4, desktop visual snapshots 2/2, deterministic bilingual build/data checks, 36 asset hashes and the 230-artifact baseline lock. One early render exposed CSS-relative poster URLs and one layout probe exposed landscape/portrait text overflow; both were corrected and the final targeted checks pass. These are preview results, not approved references. The user must review the attached preview images before a new Phase 5 reference set is accepted or locked.

## Phase 4 milestones

**Progress: 6 / 6 milestones complete.** Phase 4 is pushed to GitHub for backup and review only. Nothing is merged or deployed.

| Milestone | Acceptance evidence | Status |
| --- | --- | --- |
| Source inventory and parity contract | Frozen inventory, asset hashes, layout exceptions and canonical-order change documented | Complete — [phase-4-inventory.md](phase-4-inventory.md) |
| Canonical project data and responsive order | Six project IDs, exact localized/layout copy, URLs, accessible names, media and one order array match the frozen inventory except the approved historical tablet-order delta | Complete — `content/projects.json`; validator checks all eight profiles and 36 asset hashes |
| Shared templates and French static output | Three layout card templates generate `/` and the desktop iframe; all French records, refs, routes, assets and interactions pass focused checks | Complete — source checkpoint `37ac6227ce47e22406384f36a810625a94d05fda` |
| English static output and loader retirement | Shared templates generate `/en/` and its iframe; translated content, metadata, anchors, tablet Footer, refs and interactions pass before replacing/removing runtime loader | Complete — commit `20a534faed76b7b9545ac08c2052b267306bfb0d`; static route smoke passed and `en/i18n.js` is retired |
| Shared About content generation | Five bilingual About content records generate the existing three DOM shells; refs, animation timing and visuals pass | Complete — `content/about.json`; all eight focused locale/layout checks passed |
| Phase 4 acceptance and review | Deterministic output, data/asset integrity, separate refs for approved tablet-order change, full eight-profile gate, independent review and Lighthouse comparison complete | Complete — full gate ran once (56 passed, 12 expected skips, 4 tablet card crops compared with old-order references); after adding the approved-order overlay, the four affected crop tests passed 4/4. The other 56 results and skips remain from that full run; no second full run was made. Lighthouse and review are recorded below |

**Milestone 3 checkpoint:** content validator passes 48 frozen project/layout/language records, approved canonical order and all 36 asset byte/hash checks. Generated French output is deterministic across two builds and matches committed `/` and desktop-iframe files. Focused Playwright functional checks passed 24/24 across eight locale/layout profiles. Visual checks passed for desktop French/English and mobile French/English (4/4); originals were not updated. Phase 4 generated-route smoke checks passed 10 with 6 expected mobile-only skips across eight profiles. Frozen test artifact integrity passed 230/230.

**Authored-source reduction so far:** 6 maintained project records instead of 48 repeated complete records; one six-ID canonical order instead of four layout orders; 3 shared layout card templates instead of 18 project-specific card shells. Mobile retains two exact barcode SVG variants and per-project coordinate/style parameters because those vary in the original composition. Generated HTML still has separate responsive shells and is not counted as authored-source reduction. Five About content records now replace 15 authored card-content blocks; nine exact layout-specific localized overrides preserve legacy copy and line breaks. The three structural shells and their refs remain intentionally distinct.

**Milestone 4 checkpoint:** `/en/` and `/en/desktop-project-embedded.html` now contain complete static English markup generated from the shared French templates, project records and English UI dictionary. The old runtime document fetch and mutation-based translation script has been removed. English-only tablet ticket sizing remains in the dedicated `english-tablet-footer-alignment.js` layout owner; route-correct hash links are emitted during generation. `npm run content:build:check`, `npm run content:check`, and generated-route smoke (10 pass, 6 expected skips) passed against the committed outputs. The French mobile Lighthouse blocker is unchanged.

**Milestone 5 checkpoint:** five records in `content/about.json` populate the existing desktop, tablet, and mobile shells without changing their DOM structure, refs or animation controllers. `about-content-baseline.json` freezes the original 15 layout records (five cards × three layouts) in both languages, including intentionally retained French text in one legacy English card. `npm run content:check` verifies all records, layout overrides and 36 media hashes. `content:build:check` passed; both language routes are byte-for-byte identical to their pre-About-generation output. The focused About content and scrolling-animation suite passed 8/8 profiles.

**Known test-harness limitation:** a separate About-only screenshot probe initially differed by about 1% solely in the looping avatar video's captured frame after a direct section jump. It did not change frozen references or indicate a text/layout difference. That probe was removed; exact generated-output comparison and eight-profile content/animation checks passed. The Phase 4 full gate and focused follow-up results are recorded below.

**English migration evidence:** generated English output is committed at `/en/` and `/en/desktop-project-embedded.html`. Targeted English functional checks passed 12/12 across desktop, tablet portrait, tablet landscape and mobile, covering project links/media, navigation, About animation, footer and legal dialogs. English desktop/mobile visual checks passed, and the static route smoke suite passed after cutover. English hash links remain within `/en/`, metadata is static, and no fetch/translation observer or `en/i18n.js` request remains. The approved canonical tablet order has a separate Phase 4 reference overlay; original Phase 0–1 and Phase 3 references remain unchanged.

One legacy English About education description remains in French because that was the existing text; Phase 4 retains it verbatim rather than inventing or altering approved content.

**Phase 4 acceptance results:** `content:check` and `content:build:check` pass; all four committed route documents match deterministic output. The content validator confirms all 36 original media-file hashes. The full eight-profile Playwright gate ran once: 56 passed, 12 expected responsive skips, and four tablet per-project crop comparisons failed because the inherited crops represented the old tablet order. A new, separately locked Phase 4 overlay captured 36 tablet screenshots (three Projects rail states plus six project crops × four tablet profiles); the four affected per-project tests then passed 4/4. All other tests passed in the full run, including section visuals/animations, both languages' functional checks, video playback, mobile image sequences, navigation, About, footer, legal dialogs and generated-data assertions. No full-gate rerun was done after replacing the four stale crop sets. The focused crops and all hashes are locked; the originals remain intact.

**Source reduction:** the baseline has 48 complete locale/layout project rows; `content/projects.json` now has six project identities with localized and layout-specific data. This removes 42 repeated project definitions (87.5%). The baseline inventory contains 102 media-path references across those repeated rows; the canonical data contains 84 references across the four actual layout presentations (18 fewer, 17.6%) while retaining the same 21 distinct paths. The three authored card templates replace 18 project/layout card shells (83.3% fewer shells); the four generated static documents are outputs, not additional authored templates. One canonical order replaces four layout-order lists. Five About content records replace 15 authored content blocks while the three distinct animation/ref DOM shells remain. Runtime English HTML rewriting and the `en/i18n.js` loader are removed; localized dictionaries and markup substitution now run at build time. No asset was deleted, renamed, replaced or optimized.

**Phase 4 Lighthouse:** three controlled runs per route/profile are saved under `tests/phase-4/performance/`. Medians: French mobile score 41, FCP 4,787 ms, LCP 10,392 ms, TBT **885.5 ms**, Speed Index 5,891 ms; English mobile 40, 4,791 ms, 10,567 ms, **966.5 ms**, 5,488 ms. French desktop score 77/TBT 53.5 ms; English desktop 79/TBT 41.5 ms. Against the provenance-verified original baseline, mobile TBT is 208.5 ms French and 253.5 ms English; Phase 4 remains above both. Compared as context, Phase 2 reported 380.5/284.5 ms and Phase 3 925/704 ms for French/English mobile. The Phase 2/3 reports have `servedSourceVerification: null`, so their comparators reject them as provenance-verified references even though recorded measurement settings and runtime/server fingerprints match. Phase 4 output bytes for `/`, `/en/`, and both iframe documents were separately verified against the checked-out generated files; hashes are in `tests/phase-4/performance/served-output-manifest.json`. No performance cause was isolated, and the mobile TBT blocker remains open.

**Independent review:** no blocking Phase 4 source defects found. The reviewer verified content/order/media/accessibility inventory and asset integrity, shared templates, deterministic bilingual generation, English loader retirement, and runtime bridge retention. One low-priority future-proofing note remains: card templates currently have two tag slots, matching all current records; validator should explicitly reject more than two tags or rendering should be generalized if the data model later permits a third tag.

## User-approved upcoming Phase 5 tablet ticket redesign

The user approved a new tablet card direction, using [tablet portrait Figma](https://www.figma.com/design/9vt2ATXB0UTz1sPESCNmWh/For-Claude?node-id=369-1778) and [tablet landscape Figma](https://www.figma.com/design/9vt2ATXB0UTz1sPESCNmWh/For-Claude?node-id=370-1905) as visual references. The user has since approved Option C as the final architecture: one shared desktop/tablet layered-ticket template with responsive CSS, while mobile keeps the separate editorial template and lifecycle. Desktop's iframe and media interaction remain intact; tablet section/rail ownership remains separate. All presentations keep the Phase 4 canonical project data and order. The shared template is approved; its implementation is pending Milestone 4.

Limit the redesign to tablet cards. Preserve tablet page margins, Projects section geometry, scroll behavior and project navigation. Review effective typography and the global scaling system during Phase 5; do not add temporary compensating transforms now. Shared project data does not require identical card markup across breakpoints.

The old tablet design omitted the outer background image and sometimes used pink/blue ticket backgrounds; those appearances are obsolete and must not be restored to satisfy historical screenshots. Some historical tablet reference differences also came from the approved project reordering. Neither fact automatically approves every Phase 4 visual difference. Before changing a card, separately classify differences in media, crop, layout, animation or behavior against the Figma intent. Preserve unrelated differences for review. Historical references remain unchanged.

## Current blockers and test limits

- **Release blocker:** Phase 4 Lighthouse French mobile TBT is 885.5 ms and English mobile is 966.5 ms. Both remain above the verified original baseline and release budget. No performance optimization was performed in Phase 4.
- **Phase 4 acceptance limitation:** the complete gate was run once before replacing the old tablet per-project crops; 56 passed and 12 skipped, while four expected old-order reference mismatches failed. Those four tests passed against new Phase 4 references in a focused follow-up. This is recorded instead of rerunning the full matrix.
- **Known limits:** browser testing uses Chromium and emulated tablet/mobile devices; physical Safari/iOS hardware is not covered. Existing external CDN availability is required for runtime checks.
- **Original asset status:** all 36 inventoried media files still match their frozen byte sizes and SHA-256 values. No asset was removed, renamed, replaced or optimized.

## Deployment and checkpoint state

Phase 4 is on `phase-4/shared-bilingual-static` at `0422402b46bb814d4202abd0e8266d95c03685d3`, pushed to GitHub for backup and review. Latest Phase 5 implementation checkpoint is `ee8979594fd901620c8243225047079292fa1bba` on `phase-5/fluid-responsive`. Phase 5 changes have not been pushed. Nothing was merged, deployed or published; `main` is unchanged. French and English mobile Lighthouse TBT remain unresolved release blockers.

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

**Historical, reverted experiment / Phase 4 resolution:** the attempted shared About DOM tree caused visual differences in all eight profiles, including a 24 px mobile intro displacement. It remains reverted; its diffs/traces are retained in `artifacts/playwright/results/`. This was a failed feasibility experiment, not the final Phase 3 implementation. By approval, content deduplication moved to Phase 4 and is now complete: five data records supply the three intentionally distinct layout shells.

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
- **At the Phase 2 checkpoint, further content simplification was pending:** Phase 3 controller ownership cleanup followed, and Phase 4 has now centralized project content/translations and shared card templates while retaining distinct geometry and animation shells.
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

The Phase 2 branch `phase-2/css-js-extraction` and original Phase 0–1 baseline branch `test/portfolio-baseline-phase-0-1` remain preserved locally and on GitHub. Validated Phase 2 source checkpoint `64cdbbe4a86a128e11d474af956e9c07ad990c82` is pushed; the defer experiment was reverted. Experiment evidence is preserved locally at `9e1051c96476395910d9551f3b17d0d6e1d5c40a`. Phase 3 checkpoint `b6ceeec2e049fe8303bc14f0325a8fff1b4ce93c` was pushed to `phase-3/simplification`. Phase 4 at `0422402b46bb814d4202abd0e8266d95c03685d3` is pushed for backup/review only. Nothing was merged, deployed, or published. GitHub Pages remains configured to build `main` from `/`; remote `main` was last verified at `d8a37314ed7d2265f3f949c9e048b5e2beadfc20`. Phase 4 is complete; Phase 5 is in progress on `phase-5/fluid-responsive`, with Milestones 1 and 2 complete. The latest Phase 5 changes remain local and unpushed. Mobile Lighthouse performance remains unresolved and prevents release readiness.

**Current blocker:** mobile Lighthouse budgets fail; Phase 4 French mobile TBT is 885.5 ms (Phase 3: 925 ms; Phase 2: 380.5 ms; original baseline: 208.5 ms). English mobile is 966.5 ms. Phase 2/3 source provenance is incomplete, so those values are method-matched context rather than verified source comparisons. Phase 4 is structurally and functionally complete for review. The Phase 4 branch is pushed for backup/review only; nothing was merged, deployed or published, and `main` remains unchanged.
