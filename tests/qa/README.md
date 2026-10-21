# Portfolio reference and regression tests (Phase 0–1)

The website is not built or rewritten by these tests. Serve the unchanged checkout root with `python3 -m http.server 8000 --bind 127.0.0.1`. Install test dependencies with `npm ci`. A matching Linux Chromium executable is required at `/usr/bin/chromium` (override `CHROMIUM_PATH` only to reproduce the recorded version).

## Run and compare

- Entire Playwright suite: `npm run test:qa`.
- Natural functional behavior only: `npx playwright test --config tests/qa/playwright.config.cjs --grep 'rendering, localized|navigation, About|project video|responsive breakpoint'`.
- Main visual timeline comparison: `npx playwright test --config tests/qa/playwright.config.cjs --grep 'approved visual'`.
- Every project crop comparison: `npx playwright test --config tests/qa/playwright.config.cjs --grep 'every project presentation'`.
- Future implementation at a separately served root: `BASE_URL=http://127.0.0.1:8001 npm run test:qa`. This compares to the existing references and never records candidate output as original.
- Explicit reference recording of the original only: `UPDATE_BASELINE=1 npx playwright test --config tests/qa/playwright.config.cjs --grep 'approved visual|every project presentation'`. Recording is restricted to a dedicated non-main branch, the original source hashes, and the original server URL. It is not part of the default gate. A baseline update requires review; passing generation alone is not acceptance.
- Negative control (must fail): `REGRESSION_PROBE=1 npx playwright test --config tests/qa/playwright.config.cjs --project desktop-fr --grep 'approved visual'`. This injects a test-only red heading rule. The application files are unchanged. Recording is forbidden during the probe.

Never use `--update-snapshots` or `UPDATE_BASELINE=1` to resolve an unexplained regression. Preserve actual/diff artifacts and diagnose the cause.

## Matrix

| Project | Viewport | DPR | Mobile/touch | User agent |
| --- | --- | --- | --- | --- |
| desktop | 1440×900 | 1 | false/false | Actual recorded Chromium UA |
| tablet portrait | 834×1112 | 2 | true/true | Explicit iPad iOS17 Safari UA on Chromium |
| tablet landscape | 1194×834 | 2 | true/true | Explicit iPad iOS17 Safari UA on Chromium |
| mobile | 393×852 | 2 | true/true | Explicit iPhone iOS17 Safari UA on Chromium |

Each runs French `/` and English `/en/`. UA emulation exercises the site's existing Safari/device branches; it is **not** a real Safari or hardware certification. The browser engine is Chromium in every project. Boundary tests additionally exercise 499/500, 1079/1080 and 1366/1367 widths under fine-pointer and touch profiles, plus tablet rotation and restoration.

Shared settings: headless Chromium, light theme, locale en-GB, timezone Europe/Paris, no reduced-motion preference, blocked service workers, one worker, no retries. Launch flags enable software WebGL and allow muted media without user gestures. Every capture manifest records actual browser version, UA, viewport, DPR, exact scroll positions and sampled clock times; main manifests also record OS, executable, launch flags, test/runtime hashes and reference commit.

## Controlled visual states versus natural behavior

Visual tests seed `Math.random`, pause the browser clock, and advance the unchanged application through explicit time/scroll checkpoints. They include a 600ms early hero sample and 3000ms sample, project rail/list positions, three About animation positions, entering and near-closed curtain states, both dialogs, and three mobile image-sequence samples. The filename `hero-intro-600ms` is historical: the initial flicker ends earlier than 600ms and that sub-200ms sequence is not covered by this checkpoint.

CSS animations/transitions are disabled only during screenshot acquisition so the infinite status dot cannot introduce pixel noise. JavaScript animation progression (hero, About, rail, curtain and image sequences) is sampled, not removed. Video playback is held at a known media time for screenshots; natural functional tests independently require actual video decoding and time advancement. They also require distinct subsequent mobile image-layer indices, not merely a nonempty image.

The screenshot comparison tolerance is a 0.15 color threshold with at most 0.2% differing pixels. It is intended for minor rasterization noise, not layout or content changes. Exact text (including NBSP), tags, accessible names, project links, asset references and order have independent functional assertions.

`projects.spec.cjs` adds a complete, readable crop of each of the six cards in each mode/language. The main timeline captures preserve their surrounding page composition. This deliberate overlap guards both card details and responsive positioning.

## Runtime and network policy

`tests/runtime/replay.cjs` supplies frozen, verified responses at the original CDN request URLs. It preserves original React SRI checks and never rewrites the served source. Required URLs absent from the manifest fail instead of falling through to live mutable responses. Analytics is isolated in the test browser to avoid sending lab traffic.

The unchanged export runtime can cancel duplicate/hidden requests during mounting and pruning. Exact `net::ERR_ABORTED` events are recorded separately in manifests; every other request failure, page error or HTTP error fails the tests. Visible images must decode, required font faces must load, and the curtain texture must be complete. Request cancellation is not treated as evidence that an essential image loaded.

## Artifacts and review

- `references/<mode>-<language>/*.png`: reviewed reference screenshots.
- `capture-manifest.json`: main timeline provenance and sampled states.
- `project-capture-manifest.json`: card crops, media/asset state and exact clipping/scroll coordinates.
- `artifacts/playwright`: current machine-readable report, HTML report, traces/diffs on failures, and per-test attachments. Parent orchestration preserves final run reports separately before another invocation overwrites them.

A completed original recording must be rerun without update mode. Both that repeat and the negative control are required before calling the visual gate trustworthy. A failing existing application behavior is reported as an unresolved issue; the test is not silently skipped or weakened to obtain a pass. Real Safari/iOS browser-chrome behavior, physical pointer/GPU characteristics and human assessment of the approved design remain outside this Chromium lab's certification.
