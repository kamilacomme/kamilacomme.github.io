# Phase 3 report

Branch: `phase-3/simplification`
Previously published Phase 3 checkpoint: `b6ceeec2e049fe8303bc14f0325a8fff1b4ce93c` (backup and independent review)
Deployment: no changes merged, deployed, or published; `main` is unchanged.

## Status by category

- **Completed:** Phase 3 structural cleanup, approved tablet-landscape scaling, targeted and full visual/functional validation, independent source review, and performance measurements.
- **Resolved:** tablet Projects initialization no longer depends on About or navigation geometry; the diagnosis and correction history are retained below.
- **Deferred:** About card content sharing was excluded from Phase 3 by approval. Its three existing wrappers and 15 card blocks remain intentionally separate for proposed Phase 4 build-time generation.
- **Historical, reverted:** the runtime shared-About-tree experiment failed visual parity, including a 24px mobile intro shift. It was reverted; none of it is in the accepted implementation.
- **Unresolved release blocker:** mobile Lighthouse performance, especially French mobile TBT. Phase 3 is structurally complete but not release-ready.

## Result

Phase 3 consolidated tablet project geometry under one owner with separate portrait and landscape calculations, established one mobile project-sizing owner, and shared video lifecycle code only where tablet/mobile behavior was common. The desktop project presentation, Hero, About layouts, translations, SEO, curtain, React runtime, and iframe remain outside the refactor scope. About keeps three layout-specific structures and 15 authored card blocks intentionally; shared-content generation remains future work.

The tablet Projects initialization dependency is resolved. The old flow waited for its own `#kc-t-stage` mount, then observed About cards/styles; portrait geometry read About dimensions, landscape rail length read an unrelated Hire CTA, and `portfolio-controller.js` called the Projects fit before finishing shared frame/navigation writes. Font, load, React-ref, resize, and fixed 200/800/2000ms refits could re-enter that premature measurement path while layout settled. Browser traces showed an approximately 60px intermediate geometry shift. The timers repeated the premature cross-section fit; the evidence did not show each timer independently causing the final offset.

The correction publishes shared tablet layout policy after controller writes complete. Projects now owns geometry using its viewport and shared scale, with separate portrait/landscape formulas and no About/CTA measurements or observers. Genuine viewport/policy, orientation, restoration, load, and font changes trigger a coalesced recalculation. At 1194×834 both locales retain the approved 0.9267 scale and stable Projects span. The targeted tablet tests and final eight-profile gate passed with this correction; no delayed About-triggered refit remains.

The approved smaller tablet-landscape card scale is a design adjustment, not unchanged parity. French and English landscape references were added to a separate locked Phase 3 reference set; original references remain frozen.

## Validation

- Focused tablet geometry checks: 13 passed, 3 existing responsive skips.
- Focused tablet visual/project checks: 8/8 passed across both languages and orientations.
- Phase 3 full eight-profile gate: 42 passed, 6 existing responsive skips, 0 failures. Original reference integrity and all 36 Phase 3 landscape reference image hashes passed before and after.
- Lighthouse: 3 runs per language/profile; raw HTML and JSON reports plus summary are in `tests/phase-3/performance/`.
- Independent review: completed; no blocking findings. Reviewer noted the existing narrow-landscape card-width floor as a future responsive-layout consideration.

## Lighthouse comparison and release blocker

| Locale / profile | Score | FCP | LCP | TBT | CLS | Speed Index |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| French mobile | 39 | 5096 ms | 11541 ms | **925 ms** | 0 | 5980 ms |
| English mobile | 45 | 4308 ms | 9852 ms | **704 ms** | 0 | 5447 ms |
| French desktop | 78 | 1400 ms | 2820 ms | 35 ms | 0.000056 | 1698 ms |
| English desktop | 87 | 1026 ms | 1895 ms | 50 ms | ~0 | 1628 ms |

Against the original baseline, Lighthouse budget checks fail for French and English mobile TBT and scores, English mobile Speed Index, and English desktop Speed Index. French mobile TBT is 925 ms versus 208.5 ms originally and 380.5 ms in Phase 2. English mobile TBT is 704 ms versus 253.5 ms originally and 284.5 ms in Phase 2. The Phase 2 comparator also flags missing verified served-source provenance in the Phase 2 summary, so its raw deltas are available but its provenance-verified comparison is blocked. No additional TBT investigation or optimization was authorized, and none was attempted.

### Phase 2 and Phase 3 measurement comparability

The saved manifests match on host, Chrome/Lighthouse versions, runtime replay and static-server fingerprints, three runs per target, locale routes, viewport/emulation and throttling profiles, flags, cache policy, pauses, and CDN/analytics treatment. Both have `servedSourceVerification: null`; `measuredCommit` records a Git revision but does not hash or verify the exact application bytes served. The results are method-matched and their raw metric deltas are useful, but they do not prove source-to-result provenance or that the refactor alone caused the full change. The automated comparator flags this missing provenance. No additional measurement was run for this review.

## Duplication and remaining work

- Tablet project geometry: three former scripts (203 lines) and stale main-controller stage writes now have one owner (218 lines). This is ownership consolidation, not a line-count reduction.
- Mobile project sizing: one active canvas fitter owns sizing; the competing 140-line rail controller had no matching project refs in the page and was unreachable. Removing it reduced the controller by 165 lines overall and removed stale refs/call sites.
- Shared video lifecycle: two 44-line implementations (88 lines) became one 61-line parameterized implementation, 27 fewer authored lines (31%). Layout-specific selectors and thresholds remain separate.
- About: 15 repeated card blocks across three layout shells remain intentionally duplicated, as approved. No runtime cloning or build system was added.

The main unresolved release concern is mobile performance, especially French mobile TBT. Tablet geometry has targeted and full regression evidence, including the stable initialization behavior. Browser validation uses Chromium emulation; physical iOS/Safari devices are not covered. Phase 4 and Phase 5 have not started. The approved Phase 5 hybrid responsive architecture is documented separately and is not authorization to implement it.

## Decision

Phase 3 source and visual/functional validation are complete. Treat the accepted tablet-landscape scale as an approved design change. Keep mobile Lighthouse results visible as a release blocker and do not proceed to Phase 4 until the user reviews this report and authorizes the next phase.
