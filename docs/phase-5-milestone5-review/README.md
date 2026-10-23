# Phase 5 Milestone 5 review preview

These are review captures from the current Milestone 5 implementation. They are not regression references, are not used as baselines, and do not replace or alter any historical screenshot.

The browser was Chromium 154.0.8037.57 at 100% zoom and device scale factor 1. The screenshots show the initial desktop Projects rail position at `1440 × 900` and `1100 × 700`, plus the desktop Hero and the reached final project at `1440 × 900`. French and English pages were measured independently.

## Captures

| View | French | English |
| --- | --- | --- |
| Hero, 1440 × 900 | [French capture](hero-fr-1440x900.png) | [English capture](hero-en-1440x900.png) |
| Hero, 1100 × 700 | [French capture](hero-fr-1100x700.png) | [English capture](hero-en-1100x700.png) |
| Projects start, 1440 × 900 | [French capture](projects-start-fr-1440x900.png) | [English capture](projects-start-en-1440x900.png) |
| Projects start, 1100 × 700 | [French capture](projects-start-fr-1100x700.png) | [English capture](projects-start-en-1100x700.png) |
| Projects end, 1440 × 900 | [French capture](projects-end-fr-1440x900.png) | [English capture](projects-end-en-1440x900.png) |

## What changed

The desktop Projects iframe remains the single owner of its geometry and vertical-to-horizontal mapping. Its `measure()` now leaves `#stage` untransformed, fits the shared ticket to the available width up to its approved `1142px` design width, retains the `1142 / 393.453` card proportion, and derives the rail travel and parent Projects section height from the rendered ticket rail. At `1440 × 900`, the approved card remains `1142 × 393.45px` at `(32, 474.55)`; the template geometry and content remain unchanged at that reference width. Narrower desktop widths intentionally show a smaller card with unchanged readable type instead of scaling all card text down.

The desktop Hero's six-image artwork remains under the existing controller's image-only fit and 325px effective width cap. The image artwork alone keeps the responsive scale; the `12px` “Scroll down” cue is outside that transform. The portrait tile and cue retain their former relative spacing. This is an intentional typography correction; the cue is larger than its historical effective size on narrower desktop screens.

## Browser measurements

At each width, the browser computed and effective font sizes matched: Projects heading `56px`; project title `40px`; description `14px`; tags and Explorer label `12px`. The unscaled ticket uses Figtree for titles and Inter for body/tags with its existing weights, line heights and letter spacing. All six IDs, order, URLs, data-driven poster paths and media sources matched the canonical project data. Card text fit without overlap/clipping, media/background crop remained `cover`, and the common 8/4/4px corner radii were retained.

| Viewport | First ticket | Rail width | Projects section height | Hero cue effective size |
| --- | ---: | ---: | ---: | ---: |
| 1440 × 900 | 1142 × 393.45px | 6977px | 6637px | 12px |
| 1280 × 800 | 1142 × 393.45px | 6977px | 6681.88px | 12px |
| 1200 × 800 | 1130.69 × 389.56px | 6909.13px | 6690.31px | 12px |
| 1100 × 700 | 1035.13 × 356.63px | 6335.75px | 6098.88px | 12px |

The `1440 × 900` ticket dimensions, location, shared markup, content, media and desktop rail appearance match the approved design. The intentional differences below that viewport are fluid card geometry and the removal of text shrink; the rail's vertical scroll allocation consequently follows the newly rendered rail length. No tablet or mobile Projects styles were changed.

## Focused validation

- `content:build:check` — passed; both generated language routes match their shared templates.
- `node --check portfolio-controller.js` and focused Playwright spec syntax — passed.
- `tests/phase-5/desktop-fluid-projects.spec.cjs`, desktop FR/EN — passed at `1440 × 900`, `1280 × 800`, `1200 × 800`, and `1100 × 700`; includes resize, computed/effective type, media/data association, fit/clipping, rail start/end and About boundary checks.
- `tests/phase-5/hero-preview-cap.spec.cjs`, desktop FR/EN — passed at narrow, reference and wide viewports; checks the 325px effective cap and six-image rotation. The animation assertion now waits up to 3.5 seconds because its former 1.5-second limit intermittently timed out in software-rendered Chromium; application animation timing was not changed.
- `tests/qa/functional.spec.cjs` filtered to “project video playback”, desktop FR/EN — passed with real video playback and advancing frames.
- `git diff --check` — passed.

The full suite and Lighthouse were not run. Original screenshot references remain immutable. Milestone 5 remains open pending the user's visual review of these captures and the interactive page.

## Interactive preview on Ubuntu

After the user authorizes pushing the review checkpoint, update the existing local checkout and serve it locally:

```bash
cd ~/Downloads/portfolio-phase5-preview
git fetch origin phase-5/fluid-responsive
git switch phase-5/fluid-responsive
git pull --ff-only origin phase-5/fluid-responsive
PORT=8002 node tests/runtime/server.mjs
```

Open `http://127.0.0.1:8002/` for French or `http://127.0.0.1:8002/en/` for English. Use a fresh port if `8002` is already occupied. This is a local static preview; it does not change GitHub Pages, `main`, or deployment configuration.
