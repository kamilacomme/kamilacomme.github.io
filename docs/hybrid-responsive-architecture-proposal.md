# Proposed hybrid fluid-responsive architecture

**Status:** approved target architecture for future Phase 5; implementation is not authorized.  
**Prepared:** 2026-10-22  
**Current source:** `phase-3/simplification` at `b00285144419ee1ec8ed31e750b78477d9971bad`.

This proposal records the user's approved future responsive-architecture direction. It does not change or interrupt the approved Phase 3 controller-ownership work. Phase 3 must first finish its currently approved validation and review. Phase 4 content and translation centralization can then provide stable text/content inputs before the responsive migration. Phase 5 implementation remains unauthorized.

## Recommendation

Move progressively to a hybrid layout: CSS Grid/Flexbox and fluid, width-constrained containers for content; explicit desktop, tablet portrait, tablet landscape and mobile rules for compositions that are intentionally different; and narrowly scoped transforms only for coordinate-based visual effects that need them. Keep content typography outside whole-section transforms so its effective size is the authored size.

The target rendered type sizes supplied by the user are:

| Layout | Main headings | Project titles | Body | Small labels | Logo |
| --- | ---: | ---: | ---: | ---: | ---: |
| Desktop | 56px | 40px | 14px | 12px | 20px |
| Tablet | 48px | 32px | 14px | 12px | 20px |
| Mobile | 32px | 24px | 14px | 12px | 20px |

These are effective rendered sizes. A parent transform must not reduce them. Existing font families, weights, line heights and letter spacing remain the starting point and are reviewed one category at a time. Responsive gutters, card widths and spacing can use `clamp()`, `min()`, `max()`, Grid `minmax()`, Flexbox wrapping and `max-inline-size`; the four established compositions remain explicit breakpoint/layout rules rather than one fluid arrangement forced across every viewport.

## What can move to CSS, and what is coupled to the runtime

| Area | Feasibility and boundary |
| --- | --- |
| Navigation and logo | Relatively low risk. Use a fluid edge-aligned container, keep the logo at 20px effective size, and give narrow/zoomed layouts an accessible section menu instead of hiding the section links. Keep the hire action and focus behavior intact. The current navigation is transformed by the main controller, so that transform must be removed or limited to decorative positioning before its text can stay at target size. |
| Footer copy and legal dialogs | Medium risk. Text can use fluid columns and a readable measure while the curtain remains a fixed-coordinate animation. Keep curtain progress and canvas dimensions independent. Dialogs should fit `100dvw/100dvh` with safe gutters, a scrollable body, and visible close/consent controls at zoom. |
| Hero | High risk. The beam, SVG mask, particle canvas, pointer-coordinate conversion and three layout-specific image sequences are driven by the `x-dc` React component and `portfolio-controller.js`. Retain that animation coordinate system initially. Move the heading and lower information into non-scaled layout overlays; leave the cinematic background/art in its existing bounded stage. Keep the six-image sequence refs, timing and image order. |
| Hero image-loop panel | Medium risk and a bounded change within the later Hero milestone. The desktop panel is currently in the scaled `heroBottom` group. Browser measurements show a visible width of 326px at 1440×900, 363.63px at 1600×900 and 443.34px at 1920×1080. Its authored aspect ratio is 326:204, and the current right/bottom position is attached to that transformed group. The target is a **325px maximum effective visible width**. In the final layout, put the panel in a Hero overlay that has no scaled ancestor; then `max-inline-size:325px`, a responsive available-width cap, and `aspect-ratio:326 / 204` provide a direct CSS guarantee. Retain the six existing slide nodes/refs and looping controller. Keep its right/bottom anchor relative to the Hero and match the existing gutter at reference widths. While it is still beneath a scaled ancestor, a CSS max-width alone cannot guarantee the visible cap; a temporary compatibility rule would have to set layout width to `min(desiredWidth, 325px / effectiveAncestorScale)` and derive height from the ratio. Do not retain that JS workaround after moving the panel outside transformed ancestors. |
| Projects | High risk. Desktop projects are a separate same-origin iframe; tablet uses the vertical-scroll-to-horizontal-rail geometry owner; mobile positions cards on a 393px canvas and has independent video/image-sequence lifecycle behavior. Preserve the iframe and rail translation/scroll mapping in early steps. Replace card sizing and text placement with fluid card templates only after extracting measurable geometry contracts. Maintain existing per-layout ordering, links, videos, poster transitions and keyboard access. |
| About | High risk. Three independent DOM layouts are intentionally retained. `renderAbout()` maps scroll progress to card position/opacity and the runtime controller mutates stage transforms and refs. Do not consolidate its markup as part of this work. First separate the text/card inner layout from each animated coordinate stage; use bounded card grids within each existing shell while preserving all refs, card order, progress curves and timing. |

The most difficult areas are Hero pointer/beam coordinates, the horizontal Projects rail, and About’s scroll-driven card choreography. The image loop itself is simple to preserve if its DOM refs remain intact; its containing transformed panel is the sizing problem.

## Typography and constraints

The prior browser audit found that a 14px project description becomes 9.33px at 1024×600 and 11.4px at 320×568 when its canvas is scaled. In the proposed structure it remains 14px at those widths; the container and composition must adapt around the text instead of reducing it. Fourteen pixels can remain the minimum for short project-card descriptions where contrast and line height are strong. Sixteen pixels would benefit longer About paragraphs, legal/privacy copy, and other continuous reading. Moving those categories to 16px would change wrapping and possibly section height, so the user’s 14px target remains the default until those specific exceptions are reviewed.

At 320px, keep the 32px main heading and 14px body, use safe side gutters, allow headings and cards to wrap/stack, and prevent horizontal page overflow. At short tablet landscape heights, retain the 48px main heading and 14px body; reduce decorative whitespace, let the Hero content occupy another row or scroll naturally, and avoid collapsing type to fit a 600px fixed stage. At 200% browser zoom, treat the reduced CSS viewport as an ordinary narrow layout: expose a keyboard-operable section menu, wrap/stack content, constrain dialogs to the viewport with internal scrolling, and allow only the Projects rail’s intentional horizontal movement. Do not scale text down to preserve a screenshot composition.

Use size constraints only where browser evidence or content geometry calls for them: a max readable line length for long copy; a maximum 325px effective width for the desktop Hero preview; intrinsic aspect ratios for preview/media panels; sensible min/max card widths so copy can wrap without collision; and a viewport-bounded dialog. Keep decorative background/canvas layers viewport-bounded with their intentional crop. Interactive controls should maintain usable hit areas, especially on touch/zoom layouts. Do not blanket every element with arbitrary minimums and maximums.

## Runtime dependencies and migration boundary

The page is an `x-dc` template mounted through React and `support.js`. Ref callback names bind slideshow, Hero, About and video nodes; the generated runtime expects the current classic-script initialization order. `portfolio-controller.js` selects the active layout and writes scene, nav, Hero and About transforms at runtime. Tablet project geometry reads the shared scale from `window.__kcTabletScale` and the completed viewport policy from `kc:tablet-layout-change`; the tablet geometry owner no longer measures About or the navigation CTA. Mobile project sizing scales the 393px `#kc-m-canvas`; desktop projects remain inside `desktop-project-embedded.html`.

The safest migration keeps React, `support.js`, the `x-dc` renderer, the desktop iframe, current script order and all animation controllers. Change one layout boundary at a time. CSS may own layout and type, while the existing controller temporarily supplies scroll progress and animation variables. Remove a transform only after its coordinate-dependent effects have either stayed in the old stage or received a separately measured coordinate conversion. Do not introduce a frontend framework or a second runtime renderer.

## Suggested later sequence and acceptance evidence

1. **Define responsive contracts.** Record approved screenshots and actual element boxes in both languages at the eight established profiles, plus 320/375/393/430px phones, narrower desktops, short tablet landscape and a 200% zoom-equivalent viewport. Name which composition is expected at each breakpoint and list non-negotiable interaction/animation timings. Do not alter the current reference set.
2. **Build the unscaled shell and navigation/footer.** Introduce layout tokens for type, gutters and content measures; verify section links remain visible or accessible through a menu at zoom. Keep the Footer curtain/canvas controller untouched. Targeted tests: both locales at narrow desktop, portrait tablet, short landscape, 320px phone and zoom proxy; keyboard navigation and dialogs.
3. **Separate Hero overlays and cap the preview panel.** Move text and the image-loop panel out of transformed ancestors while retaining the projector canvas/SVG stage. Confirm the six refs still cycle, the panel aspect ratio/anchor remain correct, and its computed bounding-box width never exceeds 325px at 1440, 1600, 1920 and intermediate widths. Test pointer interaction, animation, both languages, 320px phone and short landscape.
4. **Decouple About content layout.** Keep three existing About shells and refs; replace only inner fixed positioning where it can be safely represented by Grid/Flexbox. Compare scroll-progress checkpoints, all five cards, opacity/position timing, wrapping and the transition to Footer in both languages and all layout modes.
5. **Migrate Projects layouts incrementally.** First desktop iframe card internals, then tablet card sizing while retaining the existing rail owner, then mobile cards while retaining video and image-sequence lifecycle. At each milestone check every project order, clipping, scroll reachability, links, playback, resize and orientation change in both languages.
6. **Complete responsive and accessibility validation.** Run the agreed visual/functional matrix against preserved originals and separate approved responsive references where the visual composition intentionally changes. Add actual browser zoom checks, keyboard and touch paths, text overflow/overlap checks, reduced-motion behavior and Lighthouse comparisons. Require independent review. Do not claim pixel-identical parity where the target type sizes deliberately alter wrapping or placement.

Each milestone needs a recovery commit and focused tests before proceeding. Keep French mobile TBT as an open release blocker and remeasure at responsive phase completion or when loading/execution changes plausibly affect it. Stop on unexpected animation, ordering, scroll or language regressions rather than adding repeated CSS/JS patches.

## Scope and risk

This is a substantial multi-milestone layout migration, not a stylesheet cleanup. Risk is **high** for Hero, About and Projects because the authored coordinates are inputs to animation, scrolling and iframe behavior. Risk is **medium** for navigation and Footer because their position/size are transformed but the transition can be isolated from the complex visual engine. Several differences in text wrapping, card height and whitespace are expected when fixed rendered text sizes replace whole-scene shrinkage. Exact pixel identity across every viewport is not a realistic guarantee; preserve the approved composition, hierarchy, positions and behaviors, then obtain review for unavoidable responsive changes. At the time this proposal was prepared, no Phase 3 source, test references or app code was changed to prepare it.
