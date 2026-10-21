# Controlled Lighthouse baseline

Scope: Phase 0–1 measurement only. No website implementation or assets are changed.

## What is measured

Four targets: `/` and `/en/`, each at mobile 393×852/DPR 1 and desktop 1440×900/DPR 1. Lighthouse 13.5.0 runs against `/usr/bin/chromium`, whose exact version and user agent are recorded in every JSON report. The test browser runs headless with software WebGL available (`--enable-unsafe-swiftshader`). This browser is a lab configuration, not a real phone or iPad.

Each target receives three sequential audits in separate fresh Chromium profiles. Lighthouse resets storage, uses its performance category and simulated throttling, and performs its own navigation after a separate successful rendering preflight. Mobile models 150 ms RTT, 1,638.4 Kbps throughput and 4× CPU slowdown. Desktop models 40 ms RTT, 10,240 Kbps throughput and 1× CPU. Exact settings are serialized in `summary.json` and raw Lighthouse JSON.

`tests/runtime/replay.cjs` supplies integrity-verified dependency bytes at the original CDN URLs. This avoids restricted CDN access without changing application source or disabling SRI/TLS checks. Analytics is handled by the shared harness and its treatment must be disclosed with results. Local dependency replay has different transfer latency from production CDNs. Consequently these scores are **controlled local lab measurements**, not a reproduction of public PageSpeed Insights scores 59 mobile / 73 desktop. Their value is a stable original-versus-candidate comparison under identical conditions.

The origin is Python's HTTP/1 static server with uncompressed responses. Production GitHub Pages compression, edge caching and CDN latency are not reproduced. Playwright routing disables HTTP cache, in addition to fresh profiles/storage resets. CPU-quiet waiting is explicitly set to zero because the approved page animates continuously; network quiet and post-load/FCP pauses stay at 1,000 ms. This custom setting avoids waiting for animation to stop and is recorded for candidate parity.

A zero-weight custom Lighthouse gatherer/audit verifies the **actual measured navigation**, after the sensitive measurement window: visible body content, locale, React, loaded Figtree/Inter fonts, curtain texture and live WebGL context. Context listeners also collect uncaught page errors, console errors (including caught frame failures) and required resource failures. Navigation/remount `net::ERR_ABORTED` requests are recorded separately rather than counted as failed final resources. A separate warm-up preflight is not accepted as evidence that the audited page rendered.

No random seed, frozen clock, artificial scroll or animation disabling is applied by the performance runner. Natural animations remain active. The initial navigation is the measurement target; footer scrolling and video playback are covered separately by QA. Lighthouse does not establish real-user INP or real-device animation smoothness.

## Commands

Start the unchanged repository at `http://127.0.0.1:8000`. Prepare the shared verified runtime fixtures before running Lighthouse. From the repository root:

```sh
npm run test:performance -- --record
npm run test:performance
node tests/performance/compare.mjs
```

The first command records into `tests/baseline/performance/` and refuses to overwrite an existing summary. It verifies all 51 original served files byte-for-byte against Git objects and refuses recording from main or the initial work branch. It also refuses recording if the original website paths differ from reference commit `d8a37314ed7d2265f3f949c9e048b5e2beadfc20`. The second writes candidate reports into `test-results/performance/`. `BASE_URL` selects the candidate origin; `LIGHTHOUSE_OUTPUT` chooses a separate output directory. `LIGHTHOUSE_RUNS` can increase runs but cannot reduce them below three. `CHROMIUM_PATH` selects a browser, but changing browser versions invalidates comparison without reviewed rebaselining.

Each measurement saves a raw Lighthouse JSON and standalone HTML report. The summary records score and FCP/LCP/TBT/CLS/Speed Index medians, all individual measurements, score ranges, warnings, runtime readiness, browser flags and configurations. The runner fails on absent rendered content, wrong locale, missing React, page errors or Lighthouse runtime errors.

## Initial regression budgets

`compare.mjs` fails for incomparable browser/Lighthouse/settings, missing targets/samples, median performance score loss greater than five points, or these metric regressions:

- FCP: greater than max(15%, 100 ms).
- LCP and Speed Index: greater than max(15%, 250 ms).
- TBT: greater than max(20%, 100 ms).
- CLS: absolute increase greater than 0.02.

These are explicitly initial engineering tolerances, not guaranteed user-experience targets. Review them against repeated measurements before tightening. A score range greater than ten points prints an instability warning. A comparison passing does not substitute for the visual, functional or content gates. A legitimate baseline change requires human review; do not overwrite reference artifacts to make a candidate pass.

For a single instrumentation diagnostic, run `node tests/performance/run.mjs --diagnostic`. It writes a separate diagnostic folder, cannot record a reference, and is rejected by the comparison gate. Run `node --test tests/performance/compare.test.mjs` to verify the gate's rejection of partial results, invalid values, fingerprint/version/settings drift, failed runtime resources and material regression. These synthetic tests do not establish website rendering or performance readiness.
