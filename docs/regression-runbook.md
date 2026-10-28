# Portfolio regression lab — Phases 0 and 1 only

The reference website is commit `d8a37314ed7d2265f3f949c9e048b5e2beadfc20`.
All application files remain unchanged. New files provide test infrastructure only.
Nothing in these commands deploys, pushes, publishes, or writes to `main`.

## Reproduce the lab

Use the dedicated `test/portfolio-baseline-phase-0-1` branch. Install the locked
development dependencies from the repository root:

```sh
npm ci --cache /tmp/portfolio-npm-cache --ignore-scripts --no-audit --no-fund
```

The reference browser is Debian Chromium 154.0.8037.57 at `/usr/bin/chromium`.
Playwright is pinned in `package-lock.json`. Use the same OS/browser for visual
comparison; a browser upgrade requires a separately reviewed compatibility run.
The available cloud image already has this browser; `npm ci` does not install it.

Project preview video pixels vary after a seek in this software Chromium renderer.
The visual screenshots therefore show each project's original poster image beneath
its video. The functional suite separately requires the real MP4 to decode, play,
and advance under natural time. The footer and curtain remain visible in the
full-page references; this poster policy applies only to project previews.

Start the original website from the repository root in a persistent terminal:

```sh
npm run test:serve
```

If that port already serves this checkout, reuse it rather than starting a
second server. This test server serves the exact repository bytes with HTTP byte
ranges so the browser can seek to a reproducible video frame. It is uncompressed
local HTTP, not the production GitHub Pages CDN. No preview publication is needed.

## Commands

```sh
npm run test:source
npm run test:inventory
npm test
```

The first two commands prove the original reference source and extracted inventory
have not changed. They are Phase 0–1 checks, not requirements for future refactored
source code. `npm test` verifies frozen artifact hashes, runs functional and visual
comparisons without updates, then verifies the reference hashes again. Failures
exit nonzero. It never accepts new screenshots automatically.

Test diagnostics are written under `artifacts/playwright/`. Open its generated HTML
report locally using Playwright's report command; traces and screenshot diffs are
retained for failed tests. Diagnostics are ignored by Git; accepted references
and their capture manifests are versioned under `tests/qa/references/`.

## Comparing a future candidate

Serve the candidate at a separate local origin, preserving the public `/` and
`/en/` routes. Keep this baseline checkout and references intact:

```sh
BASE_URL=http://127.0.0.1:8001 npm test
BASE_URL=http://127.0.0.1:8001 npm run test:performance
npm run test:performance:compare
```

The candidate command must not include `UPDATE_BASELINE` or snapshot-update flags.
The current selectors are an adapter for the original export. Changes to that
adapter during an approved refactor require independent review; they must not
remove content, geometry, timing or behavior assertions merely to pass.

Lighthouse is deliberately separate from the quicker functional/visual gate:
it performs at least twelve audits. Do not run other heavy browser tasks during
performance measurement. See `performance-baseline.md` for exact profiles and
the comparison budgets. Lab scores are not public PageSpeed Insights results.

## Reference provenance and deliberate updates

- `tests/baseline/content-inventory.json`: exact original project variants,
  links, orders, assets, dependency records and original source hashes.
- `tests/qa/references/*/capture-manifest.json`: viewport/emulation, browser,
  actual scroll positions, sampled animation times and media state.
- `tests/runtime/manifest.json`: original HTTPS CDN responses and integrity.
- `tests/baseline/artifact-lock.json`: immutable reference SHA-256 list.
- `tests/baseline/performance/`: raw Lighthouse HTML/JSON and aggregate summary.

Recording is a separate operation and requires unchanged original source on a
dedicated branch. The initial visual recording command is
`npm run test:visual:update`. It is not part of the comparison gate. An accepted
reference lock prevents unnoticed changes; any later approved refresh must review
the changed images/manifests and deliberately replace the lock in its own change.
Do not refresh references to conceal a candidate failure.

The negative-control experiment uses `REGRESSION_PROBE=1` to inject a visible
heading-color change through the test harness. It must fail the visual comparison;
the original application files and reference images are never modified by it.

## Scope and limitations

Visual captures use a seeded clock/randomness and the original project posters,
disclosed in each manifest. CSS animations are disabled for screenshot acquisition;
the captured JavaScript-driven About, mobile image and curtain states still have
explicit times and scroll positions. Natural-time functional and Lighthouse runs
do not use those controls. Small screenshot tolerances are documented in the QA
configuration; animation areas are not globally masked. Real Safari/iPad, hardware
GPU timing, production CDN transfer and field INP are not established by this
Chromium lab.

Existing accessibility, consent and content discrepancies are recorded rather
than corrected in these phases. Phase 2 remains subject to explicit user approval.
