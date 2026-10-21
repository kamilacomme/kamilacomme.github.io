# Phase 0–1 baseline and regression report

**Decision: the controlled Chromium baseline is ready to guard an incremental Phase 2 change, subject to explicit approval.** It is not cross-browser or accessibility sign-off. Do not begin Phase 2, alter the original implementation, push, deploy or publish on the strength of this report alone.

The dedicated branch is `test/portfolio-baseline-phase-0-1`. The reference website is `d8a37314ed7d2265f3f949c9e048b5e2beadfc20` from `main`. Independent source verification confirms that all 51 website files are byte-identical to that commit. Every new versioned file belongs to the test lab, its documentation or its evidence. Nothing was pushed or deployed.

## Evidence and result

| Check | Result | Saved evidence |
| --- | --- | --- |
| Original source, inventory, artifact integrity | 51/51 source files match; inventory check passes; 230/230 frozen artifacts match SHA-256 | [`source-inventory-integrity.log`](../tests/baseline/validation/source-inventory-integrity.log), [`artifact-lock.json`](../tests/baseline/artifact-lock.json) |
| One-profile poster-policy validation | French tablet portrait capture and unchanged-reference comparison both passed, 2/2 | [`tablet-portrait-fr` references](../tests/qa/references/tablet-portrait-fr/capture-manifest.json) |
| Full eight-profile visual comparison | 16/16 passed, no failures or flakes; references were **not** updated in this comparison | [`visual-comparison.json`](../tests/baseline/validation/visual-comparison.json) |
| Complete regression gate | 42 passed, 6 deliberately skipped duplicate responsive cases, 0 failed or flaky; artifact lock checked before and after | [`full-gate.json`](../tests/baseline/validation/full-gate.json) |
| Performance comparator unit checks | 11 passed, including missing or incompatible evidence rejection | [`compare.test.mjs`](../tests/performance/compare.test.mjs) |
| Negative control | Test-only red heading changed 12,267 pixels in `hero-intro-600ms.png`; comparison exited nonzero, proving the gate can detect a visible difference | [`negative-control.log`](../tests/baseline/validation/negative-control.log) |
| Lighthouse | 12 complete audits; all four locale/device targets rendered with React, fonts, texture and WebGL, without runtime failures | [`summary.json`](../tests/baseline/performance/summary.json), 12 JSON and 12 HTML reports in the same directory |

The independent reviewer checked source and artifact hashes without rerunning the browsers, counted 150 PNGs and 16 capture manifests, checked the 12 Lighthouse readiness records, and confirmed that poster substitution is test-only while all three preview videos have separate natural-time playback assertions. The reviewer flagged the coverage limitations below.

## Visual reference matrix

All captures use Linux headless Chromium **154.0.8037.57**, Playwright **1.62.1**, light color scheme, `Europe/Paris` timezone and `no-preference` reduced-motion emulation. The device scale factor (DPR) and touch/mobile settings differ by profile. Tablet and mobile user agents emulate iPad/iPhone Safari 17 identifiers **inside Chromium**; this is not a Safari browser test. Every manifest records executable, launch arguments, user agent, locale, clock epoch, random seed, exact state time, scroll x/y, viewport, visible headings and media/animation state. The six individual project captures per profile have separate project manifests.

| Profile | CSS viewport | DPR | Touch/mobile | PNGs | Manifest |
| --- | --- | ---: | --- | ---: | --- |
| Desktop French | 1440 × 900 | 1 | no/no | 18 | [`desktop-fr`](../tests/qa/references/desktop-fr/capture-manifest.json) |
| Desktop English | 1440 × 900 | 1 | no/no | 18 | [`desktop-en`](../tests/qa/references/desktop-en/capture-manifest.json) |
| Tablet portrait French | 834 × 1112 | 2 | yes/yes | 18 | [`tablet-portrait-fr`](../tests/qa/references/tablet-portrait-fr/capture-manifest.json) |
| Tablet portrait English | 834 × 1112 | 2 | yes/yes | 18 | [`tablet-portrait-en`](../tests/qa/references/tablet-portrait-en/capture-manifest.json) |
| Tablet landscape French | 1194 × 834 | 2 | yes/yes | 18 | [`tablet-landscape-fr`](../tests/qa/references/tablet-landscape-fr/capture-manifest.json) |
| Tablet landscape English | 1194 × 834 | 2 | yes/yes | 18 | [`tablet-landscape-en`](../tests/qa/references/tablet-landscape-en/capture-manifest.json) |
| Mobile French | 393 × 852 | 2 | yes/yes | 21 | [`mobile-fr`](../tests/qa/references/mobile-fr/capture-manifest.json) |
| Mobile English | 393 × 852 | 2 | yes/yes | 21 | [`mobile-en`](../tests/qa/references/mobile-en/capture-manifest.json) |

The **150 accepted PNGs** cover hero at 600 and 3000 ms, all six projects per profile, project rail/list checkpoints, About entrance/rising/settled states, legal and privacy dialogs, and footer curtain entrance/closure. Mobile adds three timed image-sequence states. Scroll and simulation times must be read from the manifests rather than inferred from filenames; for example the desktop French rail begins at y=900, tablet portrait French at y=1112 and mobile French at y=852. The French mobile Tour sequence records layer changes at approximately 5547, 7447 and 9347 ms; English retains the original duplicated layers and records its own changes. Animation movement is asserted in natural-time tests, not inferred only from images.

Software Chromium occasionally displayed a stale decoded video frame after a seek. With user approval, visual captures expose each existing project poster beneath its preview video **only in the screenshot browser context**. No site file, video, asset or production behavior changes. The functional suite independently checks natural playback and time advance for all three real MP4 previews; footer video and curtain remain in visual references. Screenshot acquisition freezes time/seed and disables CSS animation, while timed JavaScript-driven About, mobile image and curtain states remain captured. Natural-time functional and Lighthouse runs do not use these screenshot controls. No whole-region masks were added.

## Lighthouse baseline

Each target has three audits in a fresh browser profile: Lighthouse **13.5.0**, Chromium **154.0.8037.57**, simulated throttling, local uncompressed HTTP server with video byte ranges. The performance mobile profile is 393 × 852/DPR 1 with 4× CPU slowdown and 150 ms RTT; desktop is 1440 × 900/DPR 1 with 1× CPU and 40 ms RTT. These are distinct from the visual-capture device settings. Scores below are medians; parentheses show the full three-run score range.

| Language | Profile | Score | Median FCP | Median LCP | Median TBT | Median CLS |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| French | Mobile | 56 (56–57) | 5,649 ms | 11,771 ms | 209 ms | 0.00012 |
| French | Desktop | 74 (73–76) | 1,762 ms | 3,131 ms | 0 ms | 0.00006 |
| English | Mobile | 60 (59–60) | 3,994 ms | 9,148 ms | 254 ms | 0.00000 |
| English | Desktop | 84 (81–89) | 1,017 ms | 2,528 ms | 0 ms | 0.00000 |

The previous public PageSpeed numbers, 59 mobile/73 desktop, are historical context and **not comparable** with this local lab. The exact config, raw metrics, score ranges, host, source/server hashes, readiness checks and 12 individual reports are in [`tests/baseline/performance/`](../tests/baseline/performance/summary.json). The site is measured with original runtime bytes replayed at original CDN URLs because the browser environment could not reliably fetch esm.sh under its trust/proxy configuration. Integrity checks remain active. Analytics is stubbed to avoid test traffic. These conditions are documented in the [performance protocol](performance-baseline.md) and must match a future candidate; production CDN latency, compression, field INP and real-device smoothness are not measured.

## Content and rollback contracts

The [content inventory](../tests/baseline/content-inventory.json) contains six stable audit IDs, **48 project variants** across two languages and four layout modes, exact text, active and legacy URLs, media attributes, project order, 36 asset files and 152 source references. Desktop/mobile order is Pilates, Longread, Tour de parole, Inside out, Celimax, Napoli; both tablet orientations use Celimax, Inside out, Napoli, Longread, Tour de parole, Pilates. The inventory explicitly records legacy-link discrepancies and the English mobile sequence's duplicate layers. See the [readable inventory](content-inventory.md) for project-by-project detail.

The [regression runbook](regression-runbook.md) defines source, inventory, functional/visual, lock and Lighthouse commands. The normal gate compares against immutable screenshots and fails on snapshot-update flags. A future candidate can run at a separate local `BASE_URL`; approved selector-adapter changes require independent review. Rollback is to revert the dedicated lab commits or return to the untouched original commit after preserving this evidence. The existing website requires no rollback because its files have not changed.

## Open issues and readiness boundary

1. **Behavioral coverage gaps:** the testing contract calls for reduced-motion, hidden-tab pause/return and history restoration checks. They are not yet asserted. The responsive suite exercises breakpoint routing and orientation transitions, but six duplicate responsive cases are intentionally skipped; it is not an exhaustive resize/history matrix. These gaps need focused tests or explicit acceptance before a release claim.
2. **Real device coverage:** Chromium touch emulation does not establish Safari/iOS, hardware GPU timing, keyboard/focus behavior on devices or field performance. A real-device review remains necessary during Phase 2 acceptance.
3. **Existing site issues remain:** legacy-link discrepancies, English mobile duplicate image layers and previously identified consent/accessibility concerns remain visible in the inventory and contracts. These are not silently corrected or approved by passing regression tests.
4. **Lab-specific rendering/performance:** project preview pixels use posters for visual stability; real video motion is asserted separately. CDN replay, analytics stubbing, an uncompressed local server and software WebGL make this baseline a controlled comparison, not a production-network measurement. English desktop's 81–89 score spread suggests keeping three or more runs and watching variance.

**Readiness recommendation:** accept these locked artifacts as the original site's Phase 0–1 regression floor for a separately approved, incremental Phase 2. Keep the behavioral and device gaps as release-blocking follow-up evidence; do not claim complete accessibility, Safari fidelity or public PageSpeed improvement from this baseline. Stop here until the user explicitly authorizes Phase 2.
