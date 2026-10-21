# Effective typography and responsive access audit

**Date:** 2026-10-21  
**Branch / source:** `phase-3/simplification`, `b00285144419ee1ec8ed31e750b78477d9971bad`  
**Scope:** read-only browser measurements of the current Phase 3 build. No application code, visual references, or test baselines were changed.

## Method

Both `/` and `/en/` were opened in Chromium 154.0.8037.57 on Linux, with the existing integrity-checked test runtime replay. Measurements were taken after document load and `document.fonts.ready`, from computed browser styles and the product of ancestor transforms. Desktop profiles used DPR 1; tablet and phone profiles used DPR 2 and touch emulation. The phone sizes were cross-checked with an iPhone Safari user-agent override. Profiles were 1600×900, 1440×900, 1200×800, 1024×768, 834×1112, 1194×834, 1024×600, 1366×768, 320×568, 375×667, 393×852 and 430×932. The 200% zoom check used a 720×450 CSS viewport at DPR 2 as a layout-viewport proxy; it was not a manual browser-zoom session on physical hardware.

“Effective size” below means computed CSS font size multiplied by the measured ancestor-transform scale. It does not multiply by device pixel ratio. Font families and text metrics matched between French and English at the same profile; longer English copy can wrap differently.

## Smallest effective text by layout

Rows are sorted by their smallest effective size. The registered mark is decorative; project tags are supporting labels. Body and legal text are meaningful. The thresholds are design-review flags, not automatic WCAG failures.

| Layout and viewport | Smallest text and exact element | Other representative effective sizes |
| --- | --- | --- |
| Short tablet landscape, 1024×600 | **6 px** registered mark in navigation (`Inter 9px × 0.6667`); **6.67 px** project tags (`Inter 10px × 0.6667`); footer legal links about **8 px** | Project descriptions and About card copy **9.33 px** (`Inter 14px × 0.6667`, 21px line height); project headings **21.33 px** (`Figtree 32px × 0.6667`, 700); navigation links **10.67 px** (`Inter 16px × 0.6667`) |
| Phone, 320×568 | **7.38 px** registered mark (`Inter 9px × 0.8205`); **8.96 px** project categories (`Inter 11px × 0.8142`); legal links **9 px** | Project descriptions **11.4 px** (`Inter 14px × 0.8142`, 400, 21px line height); About card body **11.49 px** (`Inter 14px × 0.8205`); project titles **19.54 px** (`Figtree 24px × 0.8142`, 700) |
| Tablet landscape, 1366×768 | **7.68 px** registered mark; **8.53 px** project tags | Project descriptions/About card body **11.95 px**; project titles **27.31 px**; footer links **10.2 px** |
| Narrow desktop, 1200×800 | **7.5 px** registered mark; project/navigation supporting labels **10 px** | Project descriptions **11.67 px**; project headings/About title **33.33/46.67 px**; footer links **10 px** |
| Tablet landscape, 1194×834 | **8.34 px** registered mark; project tags **9.27 px** | Project descriptions/About card body **12.97 px**; project headings **29.65 px**; footer links **11.1 px** |
| Phone, 375×667 | **8.65 px** registered mark; tags **10.5 px** | Project descriptions **13.36 px**; About card body **13.46 px**; legal links **10.6 px** |
| Tablet portrait, 834×1112 | **9 px** registered mark; project tags **10 px** | Project descriptions/About card body **14 px**; project headings **32 px**; footer links **12 px** |
| Phone, 393×852 | **9.07 px** registered mark; tags **11 px** | Project descriptions **14 px**; About card body **14.11 px**; legal links **11.1 px** |
| Phone, 430×932 | **9.92 px** registered mark; tags **12.04 px** | Project descriptions **15.32 px**; About card body **15.44 px**; legal links **12.1 px** |
| Desktop, 1440×900 | **9 px** registered mark | Project descriptions **14 px**; About card body **14 px**; navigation/legal links **12 px**; project titles **40 px**; Hero and About lead **56 px** |
| Desktop, 1600×900 | **9.6 px** registered mark | Project descriptions/About card body **14.93 px**; project titles **42.65 px** |

Representative source metrics are consistent across locales: project titles use Figtree 700 with `-0.03em` letter spacing (40px desktop, 32px tablet, 24px mobile authored size); project descriptions use Inter 400, 14px/21px, `-0.01em`; tablet tags use Inter 400 10px/13px with `0.04em` spacing, and mobile categories use Inter 500 11px/18px with `0.04em`. About card headings use Figtree 700 (40px desktop, 32px tablet, 24px mobile); card copy uses Inter 400 14px/21px, `-0.01em`. The large desktop About lead is Figtree 56px/61.6px, with `-0.03em` spacing. Navigation uses Inter 400 9px/12.6px for its small supporting label and 16px for the hire link before scaling. The legal-dialog close button measures Inter 400 16px/16px.

## Scaling and layout behavior

- Desktop’s 1440×844 scene is fit to the window. At 1200×800, the measured scene scale is 0.8333; at 1440×900 it is 1.0. The text itself is sized in the authored scene, so it shrinks with the whole scene.
- Tablet uses `min(1, width/834, max(0.62, height/900))`. This yields 0.9267 at 1194×834, 0.6667 at 1024×600, and 0.8533 at 1366×768. Hero, Projects and About share this factor, including the user-approved Phase 3 tablet-landscape Projects scale.
- Mobile project content uses a 393px authored canvas scaled by `viewport width / 393`: 0.8142 at 320px, 0.9542 at 375px, 1.0 at 393px, and 1.0941 at 430px. The shared scene also applies its own measured scale to Hero/About text.
- The scale is internally proportional: heading, body and spacing values within each fixed canvas inherit the same transform. The smallest sizes arise from the transform applied to already-small authored text (tags, navigation labels, legal links and 14px descriptions), not from a separate type scale in tablet Projects.

## Clipping, overlap and zoom

No clipping was reported for visible headings, project descriptions or About card copy in the sampled rendered profiles. The overflow probe’s only repeated hit was the 1×1 off-screen SEO description node, which is hidden metadata rather than visible page copy. No obvious overlap appeared in the active rendered text boxes; this was a DOM geometry audit, not a pixel-level overlap classifier. The high-risk finding is undersizing from whole-canvas scaling: project/About body copy falls below 12px on 320px phones and short tablet-landscape screens, and between 12px and 14px at several other profiles.

At the 200%-zoom-equivalent 720×450 CSS viewport, the page remains vertically scrollable; project cards and the legal dialog remain reachable, and the dialog opens with its 16px close button. However, the primary section links (`Projects`, `About`, `Contact`) have no rendered boxes at this narrow layout width; only the hire link remains visible. Thus the zoom proxy preserves access by scrolling and preserves tested project/legal interactions, but does **not** preserve direct section navigation. Because this was a viewport/DPR emulation rather than a manual browser zoom on a laptop, confirm this behavior in a real browser before treating it as a formal zoom conformance result.

## Findings and later design review

- **High priority for later review:** meaningful project descriptions and About card copy are 9.33px at 1024×600 and 11.4px at 320×568. These cross the requested below-12px flag. They are not evidence of automatic WCAG failure.
- **Supporting-text flag:** project tags, small nav labels and footer legal links are below 14px across nearly all profiles; tags reach 6.67px in short landscape. The registered mark is decorative and should not drive the readability conclusion.
- No typography or scaling rules were changed as part of this audit. The approved tablet-landscape scale remains in place.
- A later responsive-architecture phase could separate typography from the fixed artwork canvas: retain current image, card and animation geometry while sizing Hero/About copy, project headings/descriptions, tags, navigation, and footer/legal text with container-aware `clamp()` values. At reference sizes those values would need to match today’s measured pixels; smaller viewports would be the subject of a separate composition and wrapping review. This is a recommendation only.

## Phase 3 scroll check and limitation

Focused French and English tablet-landscape checks found monotonic horizontal rail movement and sequential access to all six linked projects. An initialization-time geometry re-fit can still move the English Projects section/About boundary by about 60px (the French run remained steady). The horizontal rail did not jump in the sampled scroll checkpoints, but this vertical boundary movement leaves the “smooth transition into About” acceptance uncertain. No Lighthouse comparison was run because that condition is not yet conclusively cleared; the Phase 3 implementation remains paused for review.

The existing French-mobile Total Blocking Time concern remains an open release blocker: Phase 2 measured 380.5ms versus 208.5ms in the original baseline; the authorized `defer` experiment reached 421ms and was reverted.
