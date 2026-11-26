# Phase 5 in the Linux lab (GitHub Actions) — 2026-11-26

**Push.** `fix/site-fixes-1-6` pushed to `origin` with a normal `git push` (no force) at `782f5d1c9e8ca996f01f158e0a2fb76e24c8f3a8`. No pull request was created; `main` stayed at `ce0d033`. GitHub Pages builds from `main` (`build_type: legacy`, source `main` /), the `github-pages` environment allows `main` only, and no Pages build or deployment ran after the push (latest build and deployment: `main` @ `ce0d033`, 2026-11-01).

**Run.** [Phase 5 (Linux lab) #45818174171](https://github.com/kamilacomme/kamilacomme.github.io/actions/runs/45818174171), workflow `.github/workflows/phase-5-linux-lab.yml`: ubuntu-24.04, Node 22, Google Chrome for Testing 154.0.8037.57 (the recorded lab version, MD5-checked), Playwright 1.62.1, one worker, no retries. Frozen reference integrity (230) and the deterministic build check passed before the suite. The suite step failed because of one test.

**Result: 220 passed, 1 failed, 227 skipped by profile filters (19.1 min).**

| Spec | Passed | Failed |
| --- | --- | --- |
| `about-resize-continuity.spec.cjs` | 4 (desktop-fr, desktop-en, tablet-portrait-fr, tablet-portrait-en) | 0 |
| `accessibility-landmarks-and-names.spec.cjs` | 8 (desktop-fr, desktop-en, tablet-portrait-fr, tablet-portrait-en, tablet-landscape-fr, tablet-landscape-en, mobile-fr, mobile-en) | 0 |
| `contact-deep-link.spec.cjs` | 18 (desktop-fr, desktop-fr, desktop-fr, desktop-en, desktop-en, desktop-en, tablet-portrait-fr, tablet-portrait-fr, tablet-portrait-en, tablet-portrait-en, tablet-landscape-fr, tablet-landscape-fr, tablet-landscape-en, tablet-landscape-en, mobile-fr, mobile-fr, mobile-en, mobile-en) | 0 |
| `curtain-deferred-init.spec.cjs` | 18 (desktop-fr, desktop-fr, desktop-fr, desktop-en, desktop-en, desktop-en, tablet-portrait-fr, tablet-portrait-fr, tablet-portrait-en, tablet-portrait-en, tablet-landscape-fr, tablet-landscape-fr, tablet-landscape-en, tablet-landscape-en, mobile-fr, mobile-fr, mobile-en, mobile-en) | 0 |
| `desktop-about-responsive.spec.cjs` | 2 (desktop-fr, desktop-en) | 0 |
| `desktop-fluid-projects.spec.cjs` | 2 (desktop-fr, desktop-en) | 0 |
| `desktop-short-project-layout.spec.cjs` | 2 (desktop-fr, desktop-en) | 0 |
| `footer-legal-orientation.spec.cjs` | 6 (desktop-fr, desktop-en, tablet-portrait-fr, tablet-portrait-en, mobile-fr, mobile-en) | 0 |
| `footer-legal-resize-direction.spec.cjs` | 8 (desktop-fr, desktop-en, tablet-portrait-fr, tablet-portrait-en, tablet-landscape-fr, tablet-landscape-en, mobile-fr, mobile-en) | 0 |
| `footer-short-height-resilience.spec.cjs` | 8 (desktop-fr, desktop-en, tablet-portrait-fr, tablet-portrait-en, tablet-landscape-fr, tablet-landscape-en, mobile-fr, mobile-en) | 0 |
| `hero-preview-cap.spec.cjs` | 2 (desktop-fr, desktop-en) | 0 |
| `hero-short-height-fallback.spec.cjs` | 5 (desktop-fr, tablet-landscape-fr, tablet-landscape-en, mobile-fr, mobile-en) | 1 (desktop-en) |
| `hero-title-scale.spec.cjs` | 6 (desktop-fr, desktop-en, tablet-portrait-fr, tablet-portrait-en, tablet-landscape-fr, tablet-landscape-en) | 0 |
| `language-scroll-restoration.spec.cjs` | 6 (desktop-fr, desktop-en, tablet-portrait-fr, tablet-portrait-fr, tablet-portrait-en, tablet-portrait-en) | 0 |
| `language-switch.spec.cjs` | 8 (desktop-fr, desktop-en, tablet-portrait-fr, tablet-portrait-en, tablet-landscape-fr, tablet-landscape-en, mobile-fr, mobile-en) | 0 |
| `legal-dialog-keyboard.spec.cjs` | 8 (desktop-fr, desktop-en, tablet-portrait-fr, tablet-portrait-en, tablet-landscape-fr, tablet-landscape-en, mobile-fr, mobile-en) | 0 |
| `prefers-reduced-motion.spec.cjs` | 16 (desktop-fr, desktop-fr, desktop-en, desktop-en, tablet-portrait-fr, tablet-portrait-fr, tablet-portrait-en, tablet-portrait-en, tablet-landscape-fr, tablet-landscape-fr, tablet-landscape-en, tablet-landscape-en, mobile-fr, mobile-fr, mobile-en, mobile-en) | 0 |
| `projects-height-modes.spec.cjs` | 4 (desktop-fr, desktop-en, tablet-landscape-fr, tablet-landscape-en) | 0 |
| `radius-check.spec.cjs` | 6 (desktop-fr, desktop-en, tablet-portrait-fr, tablet-portrait-en, tablet-landscape-fr, tablet-landscape-en) | 0 |
| `responsive-geometry.spec.cjs` | 15 (desktop-fr, desktop-fr, desktop-fr, desktop-en, desktop-en, tablet-portrait-fr, tablet-portrait-en, tablet-landscape-fr, tablet-landscape-fr, tablet-landscape-en, tablet-landscape-en, mobile-fr, mobile-fr, mobile-en, mobile-en) | 0 |
| `responsive-interactions.spec.cjs` | 14 (desktop-fr, desktop-fr, desktop-en, desktop-en, tablet-portrait-fr, tablet-portrait-en, tablet-landscape-fr, tablet-landscape-fr, tablet-landscape-en, tablet-landscape-en, mobile-fr, mobile-fr, mobile-en, mobile-en) | 0 |
| `responsive-resize.spec.cjs` | 8 (desktop-fr, desktop-en, tablet-portrait-fr, tablet-portrait-en, tablet-landscape-fr, tablet-landscape-en, mobile-fr, mobile-en) | 0 |
| `responsive-shell.spec.cjs` | 8 (desktop-fr, desktop-en, tablet-portrait-fr, tablet-portrait-en, tablet-landscape-fr, tablet-landscape-en, mobile-fr, mobile-en) | 0 |
| `shared-page-gutter.spec.cjs` | 8 (desktop-fr, desktop-en, tablet-portrait-fr, tablet-portrait-en, tablet-landscape-fr, tablet-landscape-en, mobile-fr, mobile-en) | 0 |
| `tablet-projects-shared-gutter.spec.cjs` | 2 (desktop-fr, desktop-en) | 0 |
| `tablet-about-responsive.spec.cjs` | 2 (tablet-portrait-fr, tablet-portrait-en) | 0 |
| `tablet-layered-ticket.spec.cjs` | 4 (tablet-portrait-fr, tablet-portrait-en, tablet-landscape-fr, tablet-landscape-en) | 0 |
| `tablet-narrow-layout.spec.cjs` | 4 (tablet-portrait-fr, tablet-portrait-fr, tablet-portrait-en, tablet-portrait-en) | 0 |
| `tablet-portrait-fluid.spec.cjs` | 2 (tablet-portrait-fr, tablet-portrait-en) | 0 |
| `tablet-short-project-layout.spec.cjs` | 2 (tablet-landscape-fr, tablet-landscape-en) | 0 |
| `mobile-about-responsive.spec.cjs` | 2 (mobile-fr, mobile-en) | 0 |
| `mobile-footer-responsive.spec.cjs` | 2 (mobile-fr, mobile-en) | 0 |
| `mobile-hero-responsive.spec.cjs` | 2 (mobile-fr, mobile-en) | 0 |
| `mobile-image-sequence-loading.spec.cjs` | 6 (mobile-fr, mobile-fr, mobile-fr, mobile-en, mobile-en, mobile-en) | 0 |
| `mobile-projects-responsive.spec.cjs` | 2 (mobile-fr, mobile-en) | 0 |

executions passed 220 failed 1

## The one failure: `hero-short-height-fallback` (desktop-en)

At the `1707x188-flow` step the Hero image plate (`[data-hplate]`) cannot be scrolled fully into view: its bottom is at 279px against the allowed ≤ 189px (viewport height 188 + 1).

What is known:
- The same spec passed on desktop-fr, tablet-landscape fr/en and mobile fr/en in the same run.
- On this Mac (Chrome 158.0.8127.38) it passed 5/5 for desktop-en on the same commit.
- The stage 1.5 record already listed `hero-short-height-fallback` among the intermittent specs (it passed 3/3 on rerun then).
- None of this branch's product changes touch the Hero: they are in the Footer language anchor (`KCSiteFooter`, case pages), the Footer resize handoff, the desktop Projects iframe anchor and the tablet Projects layout script.
- One Linux run cannot tell an intermittent failure from a Linux-specific one (for example font metrics changing the 188px-tall flow layout). Not changed; product and spec untouched.

## Compared with this Mac

All the macOS-only failures recorded in [flaky-diagnosis](flaky-diagnosis.md) passed on Linux: `tablet-projects-shared-gutter` (desktop fr/en — Linux Chrome reserves the scrollbar gutter), `desktop-fluid-projects`, `language-scroll-restoration`, `language-switch`, `tablet-narrow-layout`, `responsive-resize`, `tablet-about-responsive`, `tablet-layered-ticket`, `tablet-portrait-fluid`, `footer-legal-resize-direction`.

## Known gap in the workflow

The JSON report (`phase-5-results.json`) was not found by the upload step, so the run's step summary and artifact contain only the Playwright traces; the per-test table above was taken from the run log. Fixing the report path is a small workflow change for a later push.
