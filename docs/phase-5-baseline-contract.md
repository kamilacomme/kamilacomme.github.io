# Phase 5 responsive geometry baseline

**Measured source:** `7f98795102548b45366d382680e9589ac690d07f` (`phase-5/fluid-responsive`), before Phase 5 application changes.

**Measurement record:** [`tests/phase-5/baseline-geometry.json`](../tests/phase-5/baseline-geometry.json), captured with [`capture-geometry-baseline.cjs`](../tests/phase-5/capture-geometry-baseline.cjs). The probe records rendered bounds, ancestor scales, computed typography, Project rail positions at 0/50/100%, and About/Footer bounds for both locales in the four established profiles. It does not take screenshots or alter references.

## Browser and source conditions

The capture used headless Chromium 154.0.8037.57, Playwright 1.62.1, en-GB locale, Europe/Paris time zone, light color scheme, `no-preference` motion, software WebGL, and the same iPad/iPhone user-agent and touch emulation as the Phase 4 Playwright configuration. Fonts were awaited before measurement. QA's existing network replay fixture supplied the original runtime bytes only for the external CDN requests. The local server's `/index.html` response matched the checkout SHA-256 `e43b44481690ea51150066a320fc4af7aa8df05425b38c840bcf13d8f0f9d92c`; `/en/index.html` matched `84f9d68e8a02b3518a7df9b0b0944b3c1cdd168f0a21a682faa2b0fd30e77230`.

| Profile | Viewport | DPR | Emulation |
| --- | ---: | ---: | --- |
| Desktop | 1440 × 900 | 1 | Chromium desktop |
| Tablet portrait | 834 × 1112 | 2 | iPad, touch |
| Tablet landscape | 1194 × 834 | 2 | iPad, touch |
| Mobile | 393 × 852 | 2 | iPhone, touch |

Both `/` and `/en/` were loaded at each profile. Their recorded geometry, card order and responsive scaling matched exactly. No screenshot reference was regenerated.

## Current sizing and transform owners

| Region | Current owner and rule | Phase 5 impact |
| --- | --- | --- |
| Desktop Hero / About / nav | `portfolio-controller.js` fits the 1440 × 844 design frame using shared `s`; Hero artwork also uses `sh = viewportWidth / 1440` and adjusts its stage height to the viewport. Desktop Project presentation remains in its iframe. | Whole-frame scaling reduces text on narrower/short windows; retain projector coordinates and motion while separating text/layout sizing. |
| Tablet Hero / About / nav | `portfolio-controller.js` publishes shared `window.__kcTabletLayout` with `st = min(1, viewportWidth / 834, max(0.62, viewportHeight / 900))`. At 1194 × 834, `st = 0.926667`; at 834 × 1112, `st = 1`. | The approved landscape composition remains scaled consistently today, but 48/32/14/12px source sizes are reduced in effective pixels at the landscape profile. |
| Tablet Projects | `tablet-project-layout.js` consumes the shared viewport policy, fits the stage, keeps portrait tickets stacked, and owns landscape ticket width, horizontal travel, section height and scroll-to-rail mapping. | Keep this geometry owner separate from card appearance. It currently also measures the first tablet Hero line and Projects heading line to derive the Projects heading font size; that is a cross-section **typography** dependency, not the source of the Projects section/rail geometry. Replace it with a shared explicit typography token before or during the tablet-type migration; do not add another cross-section measurement. |
| Mobile Hero / nav | `portfolio-controller.js` uses a 390px design frame, so 393px produces scale 1.00769. | That makes 32px Hero text 32.25px and the 20px mark 20.15px at the reference mobile width. |
| Mobile Projects | `mobile-canvas-fit.js` owns the 393px canvas scale `viewportWidth / 393`; at the reference 393px width it is 1. The existing mobile project markup and video/image-sequence owners are separate. | Keep editorial card structure and lifecycle. Replace canvas shrinkage with responsive sizing incrementally, not by changing content/data. |

## Measured section and Projects geometry

Document coordinates are at scroll position zero. Landscape rail translations are the controller's CSS-pixel values before the stage's 0.926667 display transform. Measurements are the same for French and English.

| Profile | Projects section top / height | About starts at | Current Projects presentation and checkpoints |
| --- | ---: | ---: | --- |
| Desktop, 1440 × 900 | 900 / 6,637px | 7,537px | Six-ticket iframe rail width 6,977px. Rail transform is 0px at section start, −2,749px at 50% section scroll, and −5,617px at the end. |
| Tablet portrait, 834 × 1112 | 1,112 / 1,655px | 2,767px | Six stacked 770 × 220px cards at x=32px, with 18px gaps; last ticket bottom is y=2,735px, leaving the established 32px bottom inset. No horizontal rail transform. |
| Tablet landscape, 1194 × 834 | 834 / 2,975.39px | 3,809.39px | Six horizontal cards, each 531.91 × 203.87 effective px; rail box width 3,274.84px. Scroll checkpoints: y=834 / 1,905 / 2,975px; rail transforms 0 / −1,155.32 / −2,309.56px. The section ends exactly where About begins. |
| Mobile, 393 × 852 | 852 / 3,589px | 4,441px | Six editorial cards on the 393 × 3,589px canvas; canvas scale is 1 at this reference width. About follows the project section directly. |

The tablet landscape card visual size is the already approved result of the shared 0.926667 tablet scale. The Phase 5 goal is not to restore the historic 1.0 card size. Card markup/composition may change to the Figma direction, while the outer tablet section bounds, side insets, six-project reachability, scroll mapping and About boundary remain the geometry contract. Any changed measured value must be classified as an explicit responsive value/design decision, not silently accepted as a side effect.

## Measured representative typography

Values below are CSS size → effective rendered size from `getComputedStyle`, with ancestor transform scales multiplied. Families, weights, line heights, letter spacing, element bounds and the full measured text samples are in the JSON record.

| Profile | Hero / Projects heading | Project title | Project body | Project labels | Brand mark |
| --- | --- | --- | --- | --- | --- |
| Desktop | 56 → 56px | 40 → 40px | 14 → 14px | 12 → 12px | 20 → 20px |
| Tablet portrait | 48 → 48px | 32 → 32px | 14 → 14px | 10 → 10px | 20 → 20px |
| Tablet landscape | 48 → 44.48px | 32 → 29.65px | 14 → 12.97px | 10 → 9.27px | 20 → 18.53px |
| Mobile | 32 → 32.25px Hero / 32px Projects | 24 → 24px Projects | 14 → 14px Projects | 11 → 11px | 20 → 20.15px |

Additional measured examples: tablet-landscape About card body is 14 → 12.97px and its card title 32 → 29.65px; Footer labels are 12 → 11.1px. Mobile Footer legal labels are 11 → 11px and Footer contact body text is 16 → 16.1px. The former typography reflects the currently approved design; moving these values to the newly approved effective targets is expected Phase 5 work, with no temporary counter-transform. Desktop and the main project typography already match their targets at the 1440px reference width. Tablet labels and the mobile logo/Hero slight enlargement also need their effective values normalized during their owning responsive milestones.

## Hero preview cap

At 1440 × 900, the desktop six-image preview measures 326 × 204 effective pixels (aspect ratio 1.598), anchored 32px from the right and bottom of the 1440 design stage. It currently exceeds the approved 325px effective maximum by 1px. The preview's parent is not scaled at this profile. Phase 3/4 tablet preview boxes are separate responsive elements and are not subject to the desktop cap. Phase 5 must cap the desktop element after accounting for ancestor transforms and retain the measured aspect ratio and anchor.

## Scroll and behavior ownership notes

The measured tablet landscape starts at the rail's first project, shows all six canonical IDs, maps section scroll progress to a clamped rail translation, and ends at the About boundary without locale-specific geometry. Tablet portrait remains a vertical stack. The tablet Project layout code has no About-section bound lookup for its rail height/translation; it uses the section, viewport, stage, cards and shared tablet viewport policy. Its Hero-to-Projects heading-height read is noted above and will be removed as typography coupling.

The baseline confirms the existing landscape scroll and transition can be treated as invariants while changing card appearance. It does not yet prove that future fluid card sizes can preserve those mappings; Milestone 4 must validate the mapping against the recorded bounds and stop if the Figma card size or effective type cannot fit without changing the approved interaction.

## Verification and limits

- The browser geometry probe completed all eight language/profile records and stored its scroll states and computed values in `baseline-geometry.json`.
- `npm run content:check` and `npm run content:build:check` passed; the six projects, canonical order, 36 asset hashes and four generated static route documents remain valid.
- `node tests/artifact-lock.mjs` passed: 230 frozen Phase 0–1 artifact hashes unchanged.
- `node tests/phase-4/reference-lock.mjs` passed: 230 Phase 0–1 artifacts, 36 Phase 3 references, 36 Phase 4 approved-order references and four Phase 4 capture manifests retain their recorded hashes.
- No full regression suite or Lighthouse run was performed for this milestone; no application code or screenshot references changed.
- The probe uses emulated Chromium, not physical Safari/iOS. It records geometry and typography, not perceptual/Figma screenshot parity.
- French and English mobile TBT remain unresolved release blockers; this milestone did not investigate or optimize performance.
