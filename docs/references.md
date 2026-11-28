# Frozen references — inventory

The single list of the project's frozen references and why each exists. The rules for changing them are in [AGENTS.md](../AGENTS.md#git-backups-and-repository-hygiene). Do not shorten, move or re-record any of them without the owner's explicit authorization.

## 1. Artifact lock — 230 hashes

`tests/baseline/artifact-lock.json` records the SHA-256 of 230 files, captured from the original site at `d8a37314`. `npm run test:baseline-integrity` (`tests/artifact-lock.mjs`) fails if any file changes, disappears or a file is added to these folders. `npm test` runs it before and after the release gate.

| Files | Count | Why |
| --- | ---: | --- |
| `tests/qa/references/<profile>-<lang>/` (desktop, tablet-portrait, tablet-landscape, mobile × fr, en) | 166 | Screenshot references and capture manifests (browser, platform, emulation) for the `tests/qa` visual comparison and `tests/verify-lab.cjs`. |
| `tests/runtime/resources/` | 32 | Recorded runtime resources (fonts, scripts, styles, media) replayed by `tests/runtime/server.mjs`, so tests do not depend on the network. |
| `tests/runtime/manifest.json` | 1 | Maps replayed URLs to those resources. One entry was added on 2026-11-28 with Kamila's explicit approval (`577ee66`): the Google Fonts URL without Epilogue, replaying the same recorded stylesheet; the lock record of this file was updated, the other 229 hashes were not. |
| `tests/runtime/licenses/` | 5 | Licenses of the replayed third-party resources. |
| `tests/baseline/performance/` | 25 | Lighthouse reports (FR/EN × desktop/mobile × 3 runs, HTML and JSON) and `summary.json`: the performance budgets compared by `tests/performance/compare.mjs`. |
| `tests/baseline/content-inventory.json` | 1 | Canonical project order per layout, checked when references are recorded. |

## 2. Responsive matrix — 492 points

Homepage, case page (`/cases/_foundation/`) and 404, FR and EN: widths 320–1920px in 20px steps at heights 500/800/1100, plus 1024×768, 1180×820 and 1366×1024 with iPad touch emulation (246 points × 2 languages). Per point: profile, logo and Hire position, availability pill, page gutters, Footer heading size/position, legal links position, case H1 size. It proves that the homepage, case pages and 404 share one responsive profile and gutter rule.

| File | Role |
| --- | --- |
| `docs/site-fixes-1-6-review/matrix-after.csv` | **Current reference** (site fixes 1–6, 2026-11-26). A new run must be byte-identical. |
| `docs/site-fixes-1-6-review/matrix-before.csv` | Same data before site fixes 1–6; byte-identical to the reference, proving the fixes changed nothing here. |
| `docs/case-studies-foundation-review/responsive-matrix-before.csv`, `responsive-matrix-after.csv` | Stage 1.5 evidence (earlier column set): up to 410 mismatches before, 0 after. History, not compared against. |
| `tests/responsive-matrix-492.cjs` | Generator. Start `npm run test:serve`, then `node tests/responsive-matrix-492.cjs <out.csv>` and compare with the reference (`cmp`). Uses `CHROME_PATH` (default: macOS Google Chrome) and `BASE_URL` (default `http://127.0.0.1:8000`). |
