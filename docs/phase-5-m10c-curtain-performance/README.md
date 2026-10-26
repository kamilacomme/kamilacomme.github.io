# M10C Footer curtain Lighthouse verification

This report records the controlled four-target Lighthouse run after the approved Footer WebGL deferred-initialization change. It is diagnostic/review evidence, not a new visual baseline. The existing 230 frozen screenshot references and all Lighthouse thresholds remain unchanged.

## Measurement conditions

- Tested branch: `phase-5/fluid-responsive`, commit `b65d3ea9bcc3dbe1373b2d1c862a5384ed18d6bf`.
- Local static runtime: `http://127.0.0.1:8000`; Lighthouse 13.5.0; Chromium 154.0.8037.57; Linux x64; 5 reported CPUs, AMD EPYC 9V74.
- Existing profiles/configuration: mobile 393×852, 150ms RTT, 1,638.4Kbps, 4× CPU; desktop 1440×900, 40ms RTT, 10,240Kbps, 1× CPU. Lighthouse simulated throttling, fresh Chrome profile/storage per run, verified local replay for CDN dependencies, analytics blocked by the harness, and active animations were retained.
- Three rounds, ordered `FR mobile → EN mobile → FR desktop → EN desktop`, so locale and profile readings were interleaved. Before the run, no active Playwright/Lighthouse process or high-CPU browser was present; inactive Chromium zombies did not consume CPU. The runner's per-run host load averages are preserved in `reports/summary.json`.
- All 12 runs had no Lighthouse warnings, page errors, console errors, failed resources or runtime-readiness failures. Each audited initial navigation confirmed the curtain module, texture and Three.js were not requested (`curtainResourcesRequested: []`).

Exact repeat command from the repository root, with its local server running:

```sh
LIGHTHOUSE_RUNS=3 LIGHTHOUSE_INTERLEAVE_TARGETS=1 \
  LIGHTHOUSE_OUTPUT=test-results/m10c-curtain-final-controlled \
  BASE_URL=http://127.0.0.1:8000 node tests/performance/run.mjs
node tests/performance/compare.mjs \
  tests/baseline/performance/summary.json \
  test-results/m10c-curtain-final-controlled/summary.json
```

The summary and 12 raw Lighthouse JSON reports are retained under [`reports/`](reports/). `compare.mjs` applies the recorded median budgets from [the original performance baseline](../performance-baseline.md): FCP max(15%,100ms), LCP and Speed Index max(15%,250ms), TBT max(20%,100ms), CLS +0.02, and performance score no worse than five points. This is a comparison against the unchanged historical baseline, not an absolute web-vitals target.

## Individual mobile runs and budget results

Values are milliseconds. The existing comparator applies its thresholds to three-run medians. A sample above the median budget is highlighted because it signals spread even when the median passes.

| Locale/profile | Run | TBT | LCP | Speed Index |
|---|---:|---:|---:|---:|
| FR mobile | 1 | 179.5 | 9,737.2 | 4,704.2 |
| FR mobile | 2 | 180.5 | 10,120.8 | 4,609.7 |
| FR mobile | 3 | 144.5 | 10,699.6 | 4,318.4 |
| EN mobile | 1 | 189.0 | 9,000.1 | 4,135.0 |
| EN mobile | 2 | 243.5 | **11,057.2** | 4,272.1 |
| EN mobile | 3 | 142.0 | 10,067.3 | 4,351.9 |

| Target/metric | Median | Range | Existing median ceiling | Result |
|---|---:|---:|---:|---|
| FR mobile TBT | 179.5 | 144.5–180.5 | 308.5 | Pass |
| FR mobile LCP | 10,120.8 | 9,737.2–10,699.6 | 13,536.7 | Pass |
| FR mobile Speed Index | 4,609.7 | 4,318.4–4,704.2 | 7,433.2 | Pass |
| EN mobile TBT | 189.0 | 142.0–243.5 | 353.5 | Pass |
| EN mobile LCP | 10,067.3 | 9,000.1–11,057.2 | 10,519.9 | **Median pass; one sample exceeds by 537.3ms** |
| EN mobile Speed Index | 4,272.1 | 4,135.0–4,351.9 | 4,861.6 | Pass |

The three-run median for every mobile metric is within the recorded comparator budget, but the English LCP spread crosses its ceiling. The automated comparison reports `passed`; do not treat that median gate as proof that English mobile LCP is stable. The measured run #2 is the only individual mobile sample above a ceiling. TBT is below its recorded budget in every mobile sample.

## Desktop LCP

| Locale | Individual runs | Median | Range | Existing median ceiling | Result |
|---|---|---:|---:|---:|---|
| FR desktop | 2,978.9; 2,827.1; 2,795.3 | 2,827.1 | 2,795.3–2,978.9 | 3,600.4 | Pass |
| EN desktop | 2,784.9; 2,790.3; 2,791.0 | 2,790.3 | 2,784.9–2,791.0 | 2,907.4 | Pass |

`node tests/performance/compare.mjs` passed all four target comparisons and all recorded median metrics. No thresholds were changed. The English mobile LCP individual-run overage remains the performance uncertainty to review; this verification does not authorize another optimization.

## Other M10C issues retained for separate review

- Fresh direct loads of `/#contact` and `/en/#contact` have been observed to remain at the page top instead of moving to the Footer. This fragment-navigation limitation is unchanged.
- The tablet language-switch/About-continuity spec has three known failures after its resize sweep: French tablet portrait returns to `/` without the About fragment; English tablet portrait and landscape return at `#projets-t` rather than `#apropos-t`. They were not changed as part of this performance task.
- Reduced-motion behavior for the WebGL curtain remains an open question. This change did not add a separate visual treatment or alter the curtain animation.
- The duplicate `support.js` document fetch remains deferred because its source package and editor/preview behavior cannot be validated in this checkout.
