# Phase 0–1 testing contracts

Scope: establish evidence and regression infrastructure for the original portfolio at
`d8a37314ed7d2265f3f949c9e048b5e2beadfc20`. This is not authorization for Phase 2.
The original website files, translations, responsive formulas, iframe and media
assets must remain unchanged. Work is confined to the dedicated baseline branch.
No push, deployment, publication or change to `main` is part of this work.

## Ownership and review

| Agent | Owns | Must not silently decide |
| --- | --- | --- |
| Architecture | Contracts, source inventory, evidence boundaries, original/candidate comparison | New UI, content corrections or consolidated responsive behavior |
| QA | Viewport fixtures, reference captures, functional and visual gates, instability report | Baseline acceptance after a failed comparison |
| Performance | Repeatable Lighthouse runs, raw results, run configuration and variance | A production score inferred from a laboratory fixture |
| Independent reviewer | Inspect provenance, assertions, failures, repeatability and source integrity | Implementation of the same tests it independently approves |

An assertion that only checks a selector exists is insufficient when the behavior
under test is scrolling, playback, navigation, translation or animation. Test IDs
must describe the behavior. Every known failure must remain visible in reports;
an expected failure is not a pass.

## Original, candidate and baseline boundaries

- Reference content is frozen in `tests/baseline/content-inventory.json`; visual
  references have independent provenance recorded by the capture runner.
- `BASE_URL` selects the application under test. Future refactored static output
  must be served separately and run against the same accepted references.
- A normal regression command must never regenerate references automatically.
  Updating references is a separate explicit command and a reviewable operation.
- The original-source hash check applies to Phases 0–1. It proves these phases did
  not modify application files. It is not the future behavior gate: approved
  refactoring necessarily changes source hashes.
- The future gate compares visible output, content and behavior. It must not
  require the candidate to retain the export runtime, iframe or original private
  selectors after a separately approved migration removes them. Any selector
  adapter changes need independent review so they cannot conceal changed output.
- Cross-origin external project destinations are asserted as exact URLs and
  navigation requests. Their third-party availability is outside this site's
  functional contract; tests should not depend on those sites staying online.

## Responsive and language contract

There are four presentation modes, not just three viewport buckets. Current
automatic routing also considers pointer capabilities and iPad identity. Preserve
the distinction between width, device emulation, orientation and actual hardware.

| Mode | Original implementation | Project order |
| --- | --- | --- |
| Desktop | 1440-based page scene; separate horizontal projects iframe | Pilates, Longread, Tour de parole, Inside out, Celimax, Napoli |
| Tablet portrait | 834-based scene; vertical six-row project list | Celimax, Inside out, Napoli, Longread, Tour de parole, Pilates |
| Tablet landscape | Same tablet cards; pinned horizontal rail | Celimax, Inside out, Napoli, Longread, Tour de parole, Pilates |
| Mobile | 390-based Hero/About and 393×3589 project canvas | Pilates, Longread, Tour de parole, Inside out, Celimax, Napoli |

Run every primary mode for `/` and `/en/`. Capture metadata must record browser
version, executable, launch arguments, viewport, device scale factor, user agent,
touch/mobile flags, locale, timezone, reduced-motion setting and exact scroll
coordinates. Record the mode actually selected by the application, not merely the
mode requested by the test name. Do not force an original export preview prop to
make a viewport test pass.

Viewport boundary coverage should include 499/500, 1079/1080 and 1366/1367 CSS px,
with separate touch/fine-pointer assumptions. These are routing checks and do not
replace reference captures for real compositions. Real Safari/iPad acceptance
remains a separate requirement: Chromium touch emulation cannot establish it.

## Readiness and runtime integrity

Wait for actual localized visible content, document fonts, decoded reference
images and the expected project composition before capture. An open port, loaded
HTML shell or zero-JavaScript-error check alone is insufficient. Reject a blank
page as a baseline.

Any test-only CDN cache or response routing must keep original script/module
bytes and their integrity checks, document its origin and hashes, and apply
identically to original and candidate. It must not substitute a different React,
Three.js build, font face or application script to obtain a passing screenshot.
Record fixtures and cache state in Lighthouse provenance because they affect
loading time. Do not present those measurements as public PageSpeed scores.

Analytics may be blocked by the harness to avoid sending test traffic. This must
be explicit and identical across comparisons. Required runtime/font requests and
unexpected local failures cannot be hidden under the analytics exception.

## Animation and media contract

Static screenshots alone are inadequate. Maintain two complementary types of
evidence:

1. Reproducible state captures at known scroll coordinates, controlled animation
   time/randomness/media state where necessary. Any test-only controls are
   disclosed and never change the served application source.
2. Functional observations with time advancing normally: video `currentTime`
   advances while visible; appropriate media pauses offscreen or in a hidden tab;
   image opacity/active-layer changes occur; About card transforms respond to
   scroll; footer curtain progress responds to the approved scroll interval.

Representative states include Hero settled, each project, rail start/middle/end,
About entrance/midpoint/settled, Footer entrance/closure and legal dialogs. Store
actual scroll values and capture timing with each artifact. A sequence captured
with all motion globally disabled does not demonstrate animation preservation.

Preserve and test the observed activation differences: desktop hover and focus;
tablet video 40% intersection; mobile video/image 32%; image sequence interval
1900 ms. Test reduced-motion separately and report existing gaps instead of
silently fixing the website. Test hidden-tab return, orientation changes, resize
and history restoration because the original explicitly handles them.

Screenshots must not mask the entire media or animation area. If narrow masks or
pixel tolerances are required, document the reason, excluded region and behavior
assertion that covers it. Review diffs; do not raise thresholds merely to pass.

## Content inventory contract

The JSON inventory contains:

- Six stable **audit IDs**; these are not claimed as existing DOM identifiers.
- Exact project text, categories, URLs, accessible labels, media attributes and CSS
  asset references for each layout and language.
- Explicit per-layout order arrays.
- Legacy `ticketLinks()` values and discrepancies, including Tour de parole's old
  gallery ID and the longer legacy Inside out URL.
- Mobile image sequences built from base paths plus filenames.
- Every checked-in asset's size/hash and source reference locations, including
  references constructed by the mobile sequence mapping.
- Original file SHA-256 values for the Phase 0–1 source-integrity check.

Exact text uses DOM `textContent`, including U+00A0, punctuation, capitalization
and apostrophe variants. Desktop and tablet descriptions/categories are not
assumed identical. English values are derived by running the unchanged translator
on inert original-card fixtures, including its line-break polishing. The full-page
browser tests must still verify translated rendered content; isolated extraction
does not prove successful runtime mounting.

`tests/inventory/generate.cjs` is a one-time original-export adapter. Its output is
frozen for comparison; do not regenerate it against candidate code to erase a
regression. New inventory extraction logic requires review.

Run `node tests/inventory/generate.cjs --check` for a nonwriting Phase 0–1
comparison against the frozen JSON. It first requires all original files to match
the recorded commit. This source guard is deliberately not the future refactor
gate; future candidates are checked through rendered content and behavior tests.
Recording requires an explicit output filename and a dedicated branch; writes on
`main`, `master` or detached HEAD are refused. A recording command may replace its
specified file, so baseline replacement must remain an explicit reviewed action.

An asset with no static reference is only a reachability candidate, never automatic
authorization to delete it. Inventory scope includes source asset references; a
separate runtime request log establishes actual downloads.

## Accessibility, SEO and existing defects

Assert current metadata, localized content, native project-link behavior and
keyboard access. Inspect visible/focusable inactive branches. Record legal dialog
open, close-button, Escape and focus behavior. Preserve the existing consent
implementation in these phases and record its conflict with privacy copy as a
separate issue. Existing missing focus trapping, focus restoration or reduced
motion coverage must not be described as passing compliance.

The baseline is evidence of current approved presentation, not a claim that every
existing behavior is desirable or accessible. Tests can document a known defect
without approving it as a future product requirement.

## Performance contract

Measure French/English × mobile/desktop with fixed Lighthouse and Chromium
versions. Retain each complete result JSON and HTML report, exact settings,
throttling method, browser flags, machine/environment information and timestamps.
Use multiple cold runs with clean profiles; report median and range rather than
one favorable run. Keep each locale and device result separate.

Confirm the rendered target and audit completion. Never accept a high score from
a blank shell, blocked runtime, error document or wrong locale. Distinguish raw
metrics (FCP, LCP, CLS, TBT, Speed Index) from aggregate score and field INP, which a
Lighthouse run cannot establish. The user-supplied 59/73 scores are historical
references, not measurements reproduced here.

## Acceptance and rollback

Phase 0–1 readiness requires reviewed references, exercised functional/visual
checks, reproducible performance reports and a visible list of limitations and
known failures. Repeat the visual suite to expose flakiness before recommending
Phase 2. A successful capture is not yet a passing regression comparison.

Run the comparison against the original and demonstrate a negative control: a
temporary test fixture or intercepted candidate response with a visible/content
mutation must fail the relevant gate. The mutation must never be written into
original source files or accepted snapshots.

Keep test/configuration changes on the baseline branch. Roll back by reverting
its dedicated commits or discarding only files created for these phases, after
preserving test evidence. Original implementation stays at the recorded SHA.
Phase 2 requires a new explicit user approval after the final report.
