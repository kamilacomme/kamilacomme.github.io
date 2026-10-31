# Project Retrospective — Phase 5 Portfolio Redesign

**Status: review draft.** This document summarizes the completed redesign and publication using the repository’s phase reports, Git history, test records, and live verification. It distinguishes recorded results from interpretation and does not replace the detailed test reports.

## Executive overview

The work turned an existing, animation-rich French/English portfolio into a published responsive site with clearer content and geometry ownership, more readable typography, improved narrow and short viewport behavior, a shared Navbar, and a localized custom 404 page. The redesign preserved the six projects, five About cards, profile-specific compositions, and approved animation behavior while replacing several brittle scaling and measurement rules.

The published release is `main` commit [`30ffa517`](https://github.com/kamilacomme/kamilacomme.github.io/commit/30ffa5179389a1173a10cc9a151099d70daf6501). The Phase 5 release candidate was [`21d518c`](https://github.com/kamilacomme/kamilacomme.github.io/commit/21d518c4584215db5a7d84aaf3e2f00c29c0f6bd). The previous published site is preserved by the annotated tag `pre-phase-5-2026-10-28`, pointing to `ddb01376b7a14e629f67fe5281f89843b6cc4494`. The user approved the release and its publication was verified on GitHub Pages.

## The original website

The redesign began from a working, media-rich portfolio, not a blank-page prototype. The baseline inventory records six projects across two languages and four layout modes, an animated Hero, five About cards, contact/legal content, project media sequences, and a WebGL Footer curtain. The site already had different desktop, tablet, and mobile structures and an existing browser runtime/controller stack. The Phase 0–1 report records **51/51 website source files** matching the original published baseline at that point, together with its content inventory and screenshots.

The redesign objective was to retain that identity and its approved interaction/animation while making content and responsive behavior more consistent, readable, and testable. “Responsive” meant preserving useful relationships as the available width or height changed—not making every screen a scaled screenshot of another one.

## Before and after

| Area | Before the redesign | Published result |
| --- | --- | --- |
| Content and languages | Project presentation data was repeated across language/layout combinations. The English page depended on runtime fetch-and-rewrite translation. | Six canonical project records generate the two language routes deterministically. About copy is also sourced from bilingual records. Generated French and English HTML is committed for static hosting. |
| Project templates | Eighteen authored card shells repeated the project markup across layouts; project order varied by layout. | Three shared card templates produce the desktop, tablet, and mobile presentations. Desktop/tablet share layered tickets; mobile retains its distinct editorial list. The six-project order is canonical across layouts. |
| Responsive geometry | Several text-bearing regions relied on scaled frames or separate scripts that could write or infer another section’s geometry. | Shared page gutters and profile geometry have a clear owner. Text remains at approved effective sizes; content-fit decisions use component geometry and natural wrapping/scrolling. Intentional profile differences remain. |
| Short viewports and resizing | Short height could squeeze, clip, or displace content; resize restoration sometimes used stale absolute positions. | Projects has NORMAL, COMPACT, and EXTREME-SHORT modes. Hero and Footer can use natural document flow when their composition cannot fit. Resize and language restoration preserve semantic section/project position where feasible. |
| Navigation and shared UI | The 404 proposal initially risked a separate Navbar implementation; Footer geometry also had an English-only helper. | Homepages and 404 use `templates/partials/navbar.html`. Footer geometry is owned by `fitFooter()`. The fixed language switcher consumes shared gutter values independently. |
| QA and visual references | The project began with a locked Chromium baseline and identified behavioral coverage gaps. | Bilingual build, browser interaction, responsive, accessibility, performance, and release gates were added. All 230 original screenshot-reference hashes remained unchanged through release. |

The “before” description is supported by the [Phase 0–1 baseline report](phase-0-1-test-report.md), [Phase 4 completion report](phase-4-report.md), and the Phase 5 ownership audit. The “after” reflects the final source at the published `main` commit. “Clearer ownership” and “more resilient” are retrospective assessments of the measured/tested changes, not independent quality scores.

## Objectives and what was achieved

The project’s documented objectives were to preserve the portfolio’s approved art direction and animation, make layout and type resilient across width- and height-constrained viewports, remove unintended text scaling, centralize bilingual content, reduce conflicting responsive ownership, and establish a reliable release gate. Figma was to inform relationships and content behavior, not dictate a breakpoint for every frame. These goals are described in the [Phase 5 plan](phase-5-plan.md) and [M10 Figma coverage matrix](phase-5-m10-figma-coverage.md).

The delivered site keeps its normal desktop, tablet portrait/landscape, and mobile designs, and adds bounded fallbacks for exceptional dimensions. Supported narrow layouts preserve readable content and access; 50px Figma examples remain stress references. The project was published at [kamilacomme.github.io](https://kamilacomme.github.io/) and [the English route](https://kamilacomme.github.io/en/). Live checks verified the language toggle, Contact navigation, project links/images, shared Navbar, localized 404 responses, metadata and preview assets, and the privacy page retained from main.

## Milestone timeline

Dates below summarize the repository history; milestones describe the work, not a claim that every interim checkpoint passed every later gate.

| Period | Milestone / work | Outcome |
| --- | --- | --- |
| Oct 19–21 | Phases 0–1: source/content inventory, baseline and frozen visual references | Established the original source and 230-file reference lock; documented performance and device-coverage limits. |
| Oct 22 | Phase 2: CSS/JavaScript extraction and parity checks | Extraction completed; Lighthouse showed mobile TBT regressions. A defer experiment was measured, failed to improve TBT, and was reverted. |
| Oct 22–23 | Phase 3: controller ownership simplification | Removed inactive mobile sizing logic and consolidated tablet Projects geometry; resolved initialization that had depended on About and Navbar geometry. |
| Oct 23–24 | Phase 4: canonical bilingual content and generated static routes | Replaced runtime English translation with deterministic output; centralized project and About content. |
| Oct 22–24 | Phase 5 M1–M8: geometry contracts, shared tickets, typography, About/Footer migration, language switcher | Iteratively reviewed and approved desktop, tablet, and mobile compositions; established shared responsive gutters. |
| Oct 24 | M9: architecture contract and Footer ownership cleanup | Removed the redundant English tablet Footer helper and decorative Footer video; preserved the main curtain and reclaimed the video-dependent mobile space. |
| Oct 24–25 | M10A: Figma/reference research and responsive QA harness | Mapped meaningful Figma stages to current behavior and built a bounded bilingual Playwright workflow. |
| Oct 25–28 | M10B: Projects, Hero, About, and Footer resilience | Added geometry-driven short-height behavior and semantic resize continuity, each focused-tested and visually approved. |
| Oct 26–28 | M10C: release QA, performance and accessibility | Added lazy project-sequence loading, deferred Footer curtain initialization, reduced-motion behavior, direct Contact/history restoration, accessible dialogs/landmarks/names, and reconciled stale tests. |
| Oct 28 | Shared Navbar and bilingual 404, final review, merge, publication | The release candidate merged normally with the main-only privacy page retained. GitHub Pages deployed the merge commit. |

Supporting phase reports: [Phase 2](phase-2-report.md), [Phase 3](phase-3-report.md), [Phase 4](phase-4-report.md), and [M10 Figma coverage](phase-5-m10-figma-coverage.md). The final 404/Navbar comparison is in [the 404 review gallery](phase-5-404-review/README.md).

## Responsive design: challenges and decisions

### Figma frames describe states, not the transition system

The Figma study supplied useful compositions, text sizes, alignments, content visibility, and examples of wrapping or stacking. But a frame is a snapshot at a particular width and height; by itself it does not say when to switch, how to interpolate between states, whether a change is width-driven or height-driven, or what should happen during resizing. The extracted responsive study recorded no native annotations or breakpoint specification. For example, Hero stages `408:8464` (1376×188) and `408:8471` (1707×125) differ in both width and height, so they do not isolate a height-only transition. Treating every frame size as a CSS breakpoint would have converted exploratory evidence into a large set of unrelated rules.

The implementation instead grouped stages by the relationship they demonstrated: content fits or no longer fits; a horizontal rail remains usable or must become natural flow; text wraps as available width changes; fixed page gutters remain shared. The [coverage matrix](phase-5-m10-figma-coverage.md) records the exact node outcomes and which ideas were already supported, implemented, covered by a simpler behavior, or kept as stress-only guidance.

### Relationships versus absolute geometry

The project learned to distinguish *where an element happened to be in one frame* from *how it relates to the rest of the page*. A fixed `x/y` position or a component’s apparent edge is not necessarily a reusable responsive rule. More durable rules were relationships such as:

- Navbar, Hero, Footer, and switcher independently consuming shared page-gutter values.
- A ticket or Footer row remaining in its composition only while measured content fits.
- A project remaining the primary readable project through a profile change, even when its pixel position changes.
- A section anchor retaining semantic position after navigation or resize, rather than restoring a stale `scrollY` value.
- Content continuing through ordinary document scrolling when a viewport cannot contain the full composition.

These relationships reduced the need for per-viewport pixel patches and kept geometry calculations inside existing component owners. The [M9 ownership contract](PROJECT-STATUS.md#milestone-9-audit-findings-and-ownership-contract) describes the resulting boundaries.

### Why short-height work took repeated iteration

Vertical space is constrained by several interacting elements: Navbar clearance, title wrapping, media minimum size and aspect ratio, contact/legal groups, section transitions, and the fixed language switcher. Horizontal and vertical constraints are not interchangeable. The tablet rail, Hero slideshow, About scroll/animation sequence, and Footer curtain also have different geometry and lifecycle owners. A layout that appears to fit at one height may fail after a font loads, a profile changes, the visitor scrolls, or English copy wraps differently.

Short-height proposals therefore needed actual browser captures, element bounds, scroll progression, fresh-load and resize tests, and user review. The final policy favors normal composition when it fits, a limited intermediate mode only where it preserves meaningful content, and natural flow when the fixed composition cannot remain readable. This took more iteration than adding a breakpoint, but avoided solving each screenshot with a new controller or shrinking text.

## Significant design and engineering decisions

- **Canonical content, shared generation:** centralize data and generate bilingual static routes; keep visual templates distinct only where the design/interaction differs.
- **Shared desktop/tablet tickets; separate mobile editorial Projects:** retain desktop iframe behavior and the mobile media lifecycle instead of forcing identical markup across profiles.
- **One geometry owner per behavior:** main controller publishes active profile/shared gutters; component owners measure their own internal layout; animation owners remain separate.
- **Natural flow for extreme height:** preserve readable typography and reachability rather than scaling text-bearing containers or clipping content.
- **Semantic continuity:** restore the focused project or section after resize/language change and let genuine user input supersede pending restoration.
- **Review before visual changes:** use local browser galleries, real bounds, before/after captures, and explicit user approval. Automated passing tests do not constitute visual approval.
- **Keep history immutable:** reconcile stale assertions against current approved behavior without replacing the 230 original screenshot references.
- **Share the Navbar literally:** extract its markup once and generate it into home and 404 pages; keep 404 colors isolated and avoid loading homepage animation systems there.

## Measurable results

### Content and architecture

The [Phase 4 report](phase-4-report.md) records these source reductions:

- Project locale/layout rows: **48 → 6 canonical project records** (42 repeated rows removed, 87.5%).
- Authored project-card shells: **18 → 3 shared layout templates** (15 shells removed, 83.3%).
- Project order lists: **4 → 1 canonical order**.
- Repeated base About content blocks: **15 → 5 bilingual records**, retaining nine explicit layout-specific overrides and distinct DOM/animation shells.
- Runtime English translation: retired in favor of build-time generated English markup and metadata.

The canonical build validates six projects, five About cards, four layout outputs, two locales, and 36 tracked asset hashes. Its checked-in output passes `npm run content:build:check`.

### Accessibility

Verified functional changes include modal focus trapping, Escape/backdrop closing and trigger-focus restoration; accessible names that include visible switcher/CTA text; a main landmark; and reduced-motion handling for Hero advancement and Footer curtain simulation. These are behavior-level improvements, not a WCAG certification. The manual audit and browser limitations are described in the release evidence and project status.

### Performance

The original local baseline and final controlled run used the repository’s Lighthouse comparison protocol. The [baseline report](phase-0-1-test-report.md) records mobile TBT medians of 208.5 ms (French) and 253.5 ms (English). The [final M10C report](phase-5-m10c-curtain-performance/README.md) records 179.5 ms and 189.0 ms. In that comparison, mobile Speed Index medians moved from 5,891 to 4,609.7 ms (French) and 5,488 to 4,272.1 ms (English); French mobile LCP moved from 11,771 to 10,120.8 ms. English mobile LCP increased from the original baseline’s 9,148 ms to 10,067.3 ms, although the final median remained within the approved performance budget.

All recorded *median* performance budgets passed, including both desktop LCP checks. This is a controlled lab comparison, not field data or a claim that every run improved: one English mobile LCP sample was 11,057.2 ms, **537.3 ms above its median ceiling**, while its median remained within budget. The deferred-curtain run recorded no curtain module, texture, or Three.js requests during initial navigation. The image-sequence work was verified as deferred until tickets approached view, but no durable numeric before/after request-byte total is cited here.

### Quality assurance and publication

- The original **230 frozen screenshot-reference hashes** remain unchanged.
- The release gate on the approved candidate passed. The recorded Playwright gates include a primary matrix of **42 passed / 6 expected skips** and responsive QA of **37 passed / 19 expected skips**; the skips were profile-specific/duplicate coverage, not disabled failures.
- Deterministic bilingual output and the final hash check passed on the merged tree.
- GitHub Pages deployment of `30ffa517...` completed successfully. Live checks returned 200 for both homepages and the reference-library privacy page, and 404 for unknown French and English paths with localized content. The shared Navbar, language switch, Contact navigation, project links/images, metadata, social preview, and favicon were also checked.

## Verified limitations and deferred items

- The fixed 44×44 language switcher can overlap content at exceptionally short viewport heights. The user accepted this limitation; no correction was made.
- The duplicate document fetch in the generated runtime remains deferred because the source package is absent and editor/preview behavior could not be validated safely.
- The final English mobile LCP median passed, but one sample exceeded its median ceiling as noted above.
- The responsive and accessibility evidence is Chromium-based. It does not establish physical Safari/iOS behavior, real-device GPU performance, or complete WCAG conformance.
- `robots.txt` and `sitemap.xml` were absent in the pre-publication audit and were considered optional for this launch; a dedicated ICO/web manifest and `x-default` hreflang were also optional.
- The separate full Figma visual-refinement phase and internal project case-study pages were not part of Phase 5 and remain future work.

## Interpretation and lessons

**Retrospective assessment:** the strongest outcome was not simply a collection of smaller layouts; it was a more explicit contract for how the site behaves when available space changes. Measuring content-fit and preserving section/project identity proved more robust than trying to preserve coordinates. Keeping several intentional templates also proved more maintainable than collapsing distinct interactions into one universal structure.

**If starting again:** establish the geometry/animation ownership map and semantic resize contract before the first responsive implementation; extract the Figma stages into a relationship-oriented behavior matrix at project kickoff; build the bilingual viewport/resize harness before migrating components; and define a single reproducible performance measurement protocol early. Prototype uncertain short-height behavior in the browser before writing production rules. Keep a concise, current project-status summary separate from chronological audit notes so old findings cannot be mistaken for live blockers.

These recommendations are interpretations based on the project history, not outcomes already tested on another project.
