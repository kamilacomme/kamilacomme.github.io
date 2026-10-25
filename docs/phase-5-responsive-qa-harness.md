# Phase 5 responsive QA harness

The focused responsive QA runner measures the current application in Chromium. It reuses the Phase 5 Playwright profile matrix, the Phase 0–1 CDN replay/readiness helpers, and `tests/runtime/server.mjs`. It does not supply CSS, alter layout, record approved screenshot baselines, or automatically approve visual output.

## Files and ownership

- `tests/phase-5/responsive-qa.helpers.cjs` selects the bounded viewport matrix, initializes routes, reads the active rendered profile, collects DOM geometry/type/transform data, and attaches evidence. It reads active DOM and published profile state; it does not calculate application layout.
- `tests/phase-5/responsive-geometry.spec.cjs` records fresh-load geometry and bounded probes around existing profile, tablet ticket-width/orientation, and desktop artwork-fit transitions.
- `tests/phase-5/responsive-interactions.spec.cjs` checks all six project links and full-ticket reachability, section boundaries, and the currently deferred short-height Projects behavior.
- `tests/phase-5/responsive-resize.spec.cjs` changes viewport dimensions in both directions, records active profile and scroll state, and checks whether the active project/About section remains in view.
- `tests/phase-5/run-responsive-qa.mjs` starts an isolated local copy of the existing runtime server on an ephemeral port, runs only these specs with the existing Phase 5 Playwright configuration, and writes artifacts under the ignored responsive-QA directory.
- `tests/phase-5/responsive-report.mjs` compiles measurement attachments and test results into a Markdown report.

Run with `npm run test:responsive`. A nonzero exit code means at least one active assertion failed; the report is still generated. Each run is isolated at `artifacts/playwright/responsive-qa/<run-id>/` and includes `summary.md`, Playwright JSON and HTML reports, test screenshots/traces, and server/test logs. The directory is ignored by Git.

## Initial matrix

Every case runs against French `/` and English `/en/`:

| Class | CSS viewport | Existing Playwright context | Expected profile is measured from active DOM |
|---|---:|---|---|
| Routine desktop | 1440×900 | desktop, fine pointer | desktop |
| Routine tablet portrait | 834×1112 | tablet portrait, touch/iPad UA | tablet |
| Routine tablet landscape | 1194×834 | tablet landscape, touch/iPad UA | tablet |
| Routine narrow-short tablet | 716×555 | tablet landscape, touch/iPad UA | tablet |
| Routine mobile | 393×852 | mobile, touch/iPhone UA | mobile |
| Routine supported mobile minimum | 320×568 | mobile, touch/iPhone UA | mobile |
| Resilience probe | 1268×409 | desktop, fine pointer | desktop |
| Resilience probe | 2102×289 | desktop, fine pointer | desktop |

The six routine cases check standard composition; the two resilience cases check overflow and reachability only, never screenshot similarity. The pointer, touch, user-agent and viewport configuration are recorded independently. `active DOM profile` is determined from the rendered Hero/root visibility and cross-checked against `window.__kcTabletLayout`; the harness does not infer the profile from width alone.

Boundary probes are tied to existing behavior: 499/500px mobile-to-tablet profile selection, 1079/1080px fine-pointer profile selection, 1366/1367px iPad-like profile selection, 686/687px tablet narrow-ticket mode, 715/716px tablet orientation change at a fixed width, and 607/608 plus 843/844px desktop artwork-fit transitions. The height points are the current controller's measured scale floor and 844px design-height boundary, not new breakpoint proposals.

## Checks and failure classification

Geometry records CSS/layout viewport dimensions, DPR, UA and pointer features, selected profile, shared gutters, navbar/Hire/switcher/hero rectangles, effective type, text line bounds, ancestor transform chain, page scroll dimensions, ticket rectangles/links, About card bounds, and Footer heading bounds. Hard assertions are limited to stable functional/geometry contracts: expected active profile at a boundary, no document-width overflow, six tickets, minimum control size, approved Hero type, and unscaled fixed language switcher.

Rail viewport clipping is an intentional rendering behavior, not an accessibility pass by itself. The interaction probe samples the existing scroll-driven rail and marks a card reachable only when the whole ticket rectangle is within the rail viewport. It separately checks the six canonical destinations, ticket count and Projects-to-About adjacency. Clipped neighboring cards are accepted only when every full ticket can be brought into view. Text/media internal bounds are measured by the existing component-specific tests, which remain authoritative for ticket template geometry.

Reports distinguish confirmed failures, review-required captures and explicitly approved behavior. The Projects mode and reachability assertions remain active; the approved EXTREME-SHORT mode uses the existing ticket nodes in natural vertical flow when a full ticket cannot fit below the navbar. No automated result constitutes user visual approval.

## Evidence and preservation

Screenshots and JSON measurements are Playwright attachments, never snapshots. They are written only into ignored run output. No `UPDATE_BASELINE`, `--update-snapshots`, or screenshot reference path is used. A human reviewer can open `summary.md` and `html-report/index.html`, then inspect the linked JSON and per-test screenshots. Existing frozen screenshot integrity is checked before and after the baseline run with `npm run test:baseline-integrity`.

## Bounded workflow and specialist review

1. Run `npm run test:responsive` once to establish the current baseline and retain its whole ignored run directory.
2. The coordinator reviews the summary, checks the source commit and output completeness, groups failures by existing geometry owner, and shares the same evidence bundle.
3. Read-only reviewers use that evidence: geometry/overflow; scroll/navigation/media; visual comparison; typography/accessibility. They do not launch duplicate matrices or edit source.
4. For an authorized M10B change, run its directly affected spec/viewports first, then the relevant bilingual profile/resize checks. One source-editing agent at a time; independent architecture and browser QA reviews happen before user visual approval.
5. Run the entire bounded matrix again at the agreed baseline/quality gates. Reserve the broad reference, Lighthouse and release suite for M10C. Never update historical screenshot baselines as part of responsive QA.

## Limitations

The harness uses headless Chromium and the repository's software WebGL/CDN replay setup. iPad/iPhone are emulated UA/touch contexts, not hardware or Safari certification. DOM collision interpretation is component-specific; arbitrary overlapping boxes are not automatically failures because the portfolio intentionally layers artwork/cards. Media lifecycle, card text internals, curtain behavior, legal dialogs and individual visual compositions retain their focused existing specs. Review artifacts describe this browser/environment run and do not substitute for real-device checks or visual approval.
