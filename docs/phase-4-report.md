# Phase 4 completion report

Phase 4 is complete on the local development branch `phase-4/shared-bilingual-static`. It centralizes project and About content, generates French and English static routes from shared templates, and retires browser-side English page translation. This report is for review; it does not authorize Phase 5, a push, merge, deployment, or publication.

## Architecture delivered

`content/projects.json` is the canonical project source for identity, external URL, localized titles/descriptions/tags/accessibility names, media paths, and responsive presentation details. The single canonical order in every locale and layout is **Pilates → Longread → Tour de parole → Inside Out → Celimax → Napoli**. This is an approved content-order change; the former tablet order is retained only in historical inventory/reference data.

Three shared card templates produce the existing desktop, tablet, and mobile DOM shapes. Layout-specific descriptions, tags, responsive image sequences, loading attributes, poster references, and mobile geometry remain in explicit layout/locale data where the original design varies. Two mobile barcode SVG variants remain as exact layout-specific partials.

The dependency-free Node build generates `/`, `/en/`, and both desktop iframe documents from shared templates. Output is committed for GitHub Pages’ existing static-root model. `npm run content:build:check` confirms the checked-in output is deterministic. The English page now ships translated markup and metadata directly; `en/i18n.js` and fetch-and-rewrite behavior are retired. English-only tablet footer alignment stays in its dedicated controller, while anchors are generated as route-correct static links.

`content/about.json` supplies five bilingual About records. The existing desktop, tablet, and mobile DOM structures and React refs remain distinct to preserve their geometry and animation ownership. Project, About, footer-curtain, media, controller, and `x-dc`/`support.js` runtime contracts remain in place.

One legacy English About education description remains in French because that was the existing text; Phase 4 retains it verbatim rather than inventing or altering approved content.

## Measured simplification

| Area | Before | Phase 4 source | Reduction |
| --- | ---: | ---: | ---: |
| Full project locale/layout rows | 48 | 6 project records plus explicit locale/layout fields | 42 repeated rows removed (87.5%) |
| Media-path references in project rows | 102 | 84 layout-presentation references | 18 repeated references removed (17.6%); all 21 distinct paths remain |
| Project card shells | 18 project/layout-authored shells | 3 shared layout templates | 15 shells removed (83.3%) |
| Project order definitions | 4 layout-specific lists | 1 canonical array | 3 lists removed |
| About authored content blocks | 15 repeated localized/layout blocks | 5 bilingual records plus 9 exact layout-specific overrides | 10 base blocks removed; three DOM/animation shells remain |
| English page translation | Runtime fetch, DOM rewriting and `en/i18n.js` | Build-time localization to committed static HTML | No runtime page translation |

Generated HTML necessarily contains separate responsive structures; these are output rather than separately authored page templates. The existing distinct About shells, responsive card geometry, layout-specific media loading behavior, French/English content, and mobile image sequences remain intentionally distinct. No media file was deleted, renamed, replaced, optimized, or modified. The 36 inventoried media files retain their exact recorded size and SHA-256.

## Validation

- `npm run content:check`: passed; six projects, five About cards, four layouts, two locales, canonical ordering and all 36 asset hashes validated.
- `npm run content:build:check`: passed; all four generated route documents match deterministic output.
- Targeted French generation and English static-route tests passed before their respective cutovers. English’s post-cutover functional tests passed 12/12; static route smoke passed with six expected mobile-only skips.
- The Phase 4 eight-profile Playwright gate ran once: **56 passed, 12 expected responsive skips, 4 failed**. All four failures were tablet individual-project image crops still pointing to historical card ordering. The route/data assertions, project links, media playback, mobile image sequences, section-level visuals and animation states, navigation, About, footer, and legal-dialog tests passed in that run.
- The old tablet reference set was not changed. A separate, locked Phase 4 overlay now contains new tablet rail states and card crops for the approved order. The four affected crop tests then passed **4/4**. The full matrix was not run again; all non-crop results remain from the single full run.
- Independent source review found **no blocking defects**. It confirmed canonical records/order, content/media/accessibility inventory, deterministic templates, English loader retirement, runtime bridge retention, and asset integrity. It noted one low-priority future-proofing item: the templates currently render two tag slots, exactly matching today’s data; validation should reject more than two tags or rendering should be generalized if that model changes.
- The frozen Phase 0–1 artifact lock remains 230/230; the original Phase 3 reference lock remains 36/36; the separate Phase 4 order lock contains 36 new tablet images and four manifests. No original reference was overwritten.

The per-profile run report and its capture environment are documented in `tests/phase-4/references/tablet-*/approved-order-capture.json`. The Playwright output was from the single full run and the focused four-profile crop follow-up.

## Lighthouse results and release blocker

Lighthouse ran three controlled local measurements for each language/device target at the same viewport and throttling profiles used previously. Raw JSON and HTML reports are under [`tests/phase-4/performance/`](../tests/phase-4/performance/). The served-output manifest verifies that `/`, `/en/`, and both desktop iframe documents returned HTTP 200 and matched the measured checkout byte-for-byte.

| Locale / profile | Score | FCP | LCP | TBT | Speed Index |
| --- | ---: | ---: | ---: | ---: | ---: |
| French mobile | 41 | 4,787 ms | 10,392 ms | **885.5 ms** | 5,891 ms |
| English mobile | 40 | 4,791 ms | 10,567 ms | **966.5 ms** | 5,488 ms |
| French desktop | 77 | 1,421 ms | 2,881 ms | 53.5 ms | 1,704 ms |
| English desktop | 79 | 1,358 ms | 2,841 ms | 41.5 ms | 1,742 ms |

The original baseline median TBT was 208.5 ms French mobile and 253.5 ms English mobile. Phase 2 reported 380.5/284.5 ms, Phase 3 925/704 ms, and Phase 4 885.5/966.5 ms. The comparator confirms Phase 4 fails the original-baseline mobile TBT budgets and also reports mobile score regressions. Full comparison output is saved in `tests/phase-4/performance/comparison-results.json`. The Phase 4 French mobile median is 39.5 ms below Phase 3, but remains more than four times the original baseline; English mobile is higher than both Phase 2 and Phase 3. These are lab measurements, not a causal diagnosis.

Phase 2 and Phase 3 Lighthouse summaries have `servedSourceVerification: null`; their measurement settings, browser/runtime replay fingerprints and static-server fingerprints match, but their reports do not prove which application bytes were served. Their numbers are useful context, not provenance-verified comparator baselines. Phase 4’s four generated output files have independent byte verification recorded in `served-output-manifest.json`; the Phase 4 summary itself uses the controlled local runtime replay, not production CDN delivery. The French and English mobile TBT regression remains an **open release blocker**. No performance optimization or cause investigation was part of Phase 4.

## Checkpoint and deployment state

The most recent implementation/reference checkpoint before this report is `5f42902cf3867997cf2ecfcd89e435476b036b59`; the final documentation/report commit follows on the same branch. Phase 2 and Phase 3 backup branches are preserved. Phase 4 has not been pushed. Nothing was merged or deployed/published, and `main` was not modified. Phase 5 has not started. Review this report and `docs/PROJECT-STATUS.md`; wait for explicit approval before Phase 5.
