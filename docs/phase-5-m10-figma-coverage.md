# M10 Figma-to-implementation coverage

This matrix maps the measured Figma Responsive page to the current Phase 5 site and the bounded M10 plan. It records outcomes for the meaningful width and height stages; it does not turn Figma frame sizes into CSS breakpoints. M10B is in progress with the approved mobile Footer legal-link correction implemented. Other “Investigate” entries still require measuring the existing owner and presenting a grouped proposal before changing behavior.

## How to read the classifications

1. **Already supported:** the approved site already covers the behavior represented by the stage.
2. **M10B:** investigate or implement the behavior after an approved proposal and focused validation.
3. **Simpler behavior:** cover the underlying need with an existing or already approved responsive behavior instead of reproducing the Figma arrangement literally.
4. **Stress only:** retain as exploratory evidence; it is not a production viewport or acceptance target.

The source extraction inspected Figma node properties, not thumbnails. Figma section nodes are `408:8638` Navbar, `408:8449` Hero, `408:8056` layered Tickets, `408:8717` mobile Projects, `408:8513` About, and `408:8557` Contact/Footer. Their child stages use `MIN/MIN` constraints and `clipsContent=false`; text truncation is disabled and `maxLines` unset. Native annotation arrays are empty. Names and properties suggest behavior, but the extraction could not establish author approval or production breakpoints. The `A?`, `B?`, and `C?` terms in the original extraction are therefore not treated as authoritative classifications here.

## Coverage matrix

### Navbar — section [408:8638](https://www.figma.com/design/9vt2ATXB0UTz1sPESCNmWh/For-Claude?node-id=408-8638)

| Figma stages and measured evidence | Outcome | Decision |
| --- | --- | --- |
| `408:8639` “Navbar 1”, 1377×84; `408:8650` “Navbar 2”, 1013×84. Brand, navigation, status and recruiter remain visible; brand 22px, nav/status 12px, recruiter 16px. | **1 — Already supported** | Current desktop keeps the complete Navbar at readable type sizes and uses the shared page gutter. Preserve the approved desktop arrangement. |
| `408:8661` “Navbar 3 (navigation hidden)”, 648×84; `408:8672` “Navbar 4 (status button hidden)”, 394×83. Navigation then status are hidden while the recruiter action remains. | **3 — Simpler behavior** | The current responsive profiles already simplify navigation and status at smaller widths while retaining the accessible primary recruiter action. Keep profile ownership and do not add a breakpoint per Figma frame. |
| `408:8683` “Navbar 5 (vertical alignment)”, 210×125; `408:8694` “Navbar 6 (margins 0)”, 130×107; `408:8705` “Navbar 7 (button hidden)”, 50×88. Padding is removed and text wraps; at stage 7 the availability parent is hidden. | **4 — Stress only** | These stages are all below the 320px supported minimum. They do not justify removing or rewrapping the production Navbar controls at supported widths. The 50px button's hidden ancestor is not a production requirement. |

### Hero — section [408:8449](https://www.figma.com/design/9vt2ATXB0UTz1sPESCNmWh/For-Claude?node-id=408-8449)

| Figma stages and measured evidence | Outcome | Decision |
| --- | --- | --- |
| Width stages `408:8485` “Portfolio Hero vert 1”, 577×769.69; `408:8492` “Portfolio Hero vert 2 (footer content vertical)”, 371×1027.69. Intro stays 56px and wraps naturally; scroll cue 12px; the featured image stays 325.5×199.69 and the portrait 48×48. Footer-like content changes from horizontal to vertical at the narrower stage. | **1 — Already supported** | The approved tablet/mobile Hero supports these width ranges with independent readable text, natural heading wrapping, the existing image-only slideshow, portrait, and cue. Preserve its approved composition rather than transplanting the Figma frame layout. |
| Width stages `408:8499` “Portfolio Hero vert 3”, 141×1651.69; `408:8506` “Portfolio Hero vert 4 (no margins)”, 64×1649.69. | **4 — Stress only** | These canvas widths are below support. The examples demonstrate wrapping, not an acceptable production minimum or useful reading layout. |
| Height stages `408:8450` “Portfolio Hero horiz 1”, 1376×707.69; `408:8457` “Portfolio Hero horiz 2”, 1376×397.69. The vertical composition remains, with gap reducing 320→10 and height becoming content-hugging. | **1 — Already supported** | These represent ordinary desktop and shortened desktop heights where the current Hero remains available. Keep the approved scene and normal composition. |
| `408:8464` “Portfolio Hero horiz 3 (horiz alignment)”, 1376×188; `408:8471` “Portfolio Hero horiz 4”, 1707×125. The intro and remaining content become side-by-side; image height falls 113→61 and the scroll prompt becomes horizontal. | **2 — M10B** | Investigate a single height-driven Hero fallback against real geometry and existing ownership. The extraction's height sequence also changes width (to 1707px), so these dimensions do not define a height-only trigger. Any proposal must preserve the six-image loop, portrait, navigation and access to the next section. |
| `408:8478` “Portfolio Hero horiz 5 (margins 0)”, 1707×50. A 62px-high intro begins at y=−12 in the 50px stage. | **4 — Stress only** | The content extends outside the frame with clipping disabled. Use this only as evidence to avoid clipping at production heights, not as a target composition. |

### Layered Projects tickets — section [408:8056](https://www.figma.com/design/9vt2ATXB0UTz1sPESCNmWh/For-Claude?node-id=408-8056)

| Figma stages and measured evidence | Outcome | Decision |
| --- | --- | --- |
| Height stages `408:8057` “Vert 6”, 770×310 with a 674×246 ticket; `408:8096` “Vert 2 (tags horiz)”, 770×236 with a 674×172 ticket. At 236px, tags become horizontal and the ticket's image/content height falls to 132px; type remains 32/14/12px. | **2 — M10B** | The 770×310 composition is already the approved shared desktop/tablet ticket geometry. Investigate the 236px compact arrangement as one measured content-fit option for short-but-usable height; retain the approved ticket size and typography unless a visual proposal is approved. |
| Width stages `408:8135` “horiz 6”, 390×472; `408:8174` “horiz 7”, 264×556. The ticket becomes vertical and grows as its 32/14/12px text wraps. | **3 — Simpler behavior** | At these mobile widths the site already uses its separate editorial Projects composition. That existing layout handles width and content growth without introducing a second narrow layered-ticket variant. |
| Width stages `408:8213` “horiz 3 (image bg margins 0)”, 134×513; `408:8252` “horiz 4 (ticket margins 0)”, 96×473; `408:8291` “horiz 8”, 50×755. | **4 — Stress only** | These micro-width stages remove outer and then ticket padding and create very tall text boxes. Preserve the 320px page minimum and natural mobile editorial layout. |
| Height stages `408:8330` “Vert 3 (image bg 0 margins)”, 1465×127; `408:8369` “Vert 4 (ticket bg 0 margins)”, 1465×91; `408:8410` “Vert 5 (description bottom align)”, 1465×48. | **3 — Simpler behavior** | Cover the content-fit problem with the already approved Projects NORMAL / COMPACT / EXTREME-SHORT policy: retain full-size tickets when the rail fits, hide/reclaim the heading when needed, then use natural document flow when even a whole ticket cannot fit. Do not shrink tickets to 127/91/48px. |
| Guidance wrapper `408:8408` (2220×48), heading `408:8409` (707×48), and ticket stage `408:8410`. Its text says the heading may sit above only while it does not overlap tickets, otherwise it passes to a horizontal version. At the final 48px ticket stage, content children total 1062px inside a 970px content box. | **3 — Simpler behavior** | The approved geometry-driven compact policy addresses the same overlap without creating a separate side-by-side heading mode. The measured final-stage child overflow confirms that the tiny frame is not a clean production target. |

### Mobile editorial Projects — section [408:8717](https://www.figma.com/design/9vt2ATXB0UTz1sPESCNmWh/For-Claude?node-id=408-8717)

| Figma stages and measured evidence | Outcome | Decision |
| --- | --- | --- |
| `408:8718` “Mobile projects 1”, 360.88×3427.56. Six vertically stacked cards retain order and content; project image is 360.88×245 and text wraps without truncation. Card nodes in order: `408:8719`, `408:8757`, `408:8795`, `408:8833`, `408:8871`, `408:8909`. | **1 — Already supported** | The site preserves its distinct mobile editorial layout, all six canonical projects, images, links and media lifecycle. Keep it separate from the shared layered desktop/tablet tickets. |
| `408:8947` “Mobile projects 2 (all projects on fill, same width)”, 160×3721.56. Six card nodes: `408:8948`, `408:8986`, `408:9024`, `408:9062`, `408:9100`, `408:9138`. | **3 — Simpler behavior** | Equal-width filling and natural text growth are already the mobile editorial layout's purpose. Apply fluid available width at the supported 320px minimum; do not create a 160px viewport breakpoint. |
| `408:9176` “Mobile projects 3”, 50×5833.56. Six card nodes: `408:9177`, `408:9215`, `408:9253`, `408:9291`, `408:9329`, `408:9367`. All content remains but some text boxes reach hundreds of pixels tall. | **4 — Stress only** | The 50px width is a stress concept. It does not change the practical 320px minimum or require a special card mode. |

### About — section [408:8513](https://www.figma.com/design/9vt2ATXB0UTz1sPESCNmWh/For-Claude?node-id=408-8513)

| Figma stages and measured evidence | Outcome | Decision |
| --- | --- | --- |
| Card-width stages `408:8514` “About card horiz 1”, 326×326; `408:8518` “About card vert 1”, 196×326. Text remains 40/14px and grows vertically. | **1 — Already supported** | The approved About compositions preserve five canonical cards and readable wrapping at supported desktop/tablet/mobile sizes. Retain existing card animation and geometry owners. |
| `408:8522` “About card vert 2”, 122×326; `408:8526` “About card vert 3”, 94×497; `408:8530` “About card vert 4 (margins 0)”, 50×449. | **4 — Stress only** | These remove usable card width/padding and produce very tall copy. Do not treat card-frame widths below the site minimum as new viewport targets. |
| Height stages `408:8534` “About card horiz 2”, 347×144; `408:8538` “About card horiz 3 (horiz alignment)”, 568×90; `408:8542` “About card horiz 4”, 685×88. Content spacing reduces, then title/description align horizontally. | **2 — M10B** | Investigate height-driven About card/introduction fit only where the existing sticky composition cannot keep content readable. Prefer the already approved narrow-short introduction and natural card scrolling if it covers the constraint; do not add a competing card controller. |
| `408:8550` “About card horiz 5 (margins 0)”, 637×50; companion horizontal heading/card wrapper `408:8546`, 4532×50; `408:8547` photo & heading, 3847×50. | **4 — Stress only** | These are exceptionally wide/short frames; in `408:8549`, the 48px heading is 53px high inside a 50px stage. Use as clipping-resilience evidence, not production design targets. |
| Tiny-width heading example `408:8554` (50×790), photo `408:8555` (48×48), text `408:8556` (50×742) retains only “Je suis Kamila Comme.” | **3 — Simpler behavior** | The principle of a concise introduction on a short, narrow tablet is already covered by the approved Tablet About reflow, which retains all five cards and complete card text. The exact 50px stage remains unsupported stress testing. |

### Footer / Contact — section [408:8557](https://www.figma.com/design/9vt2ATXB0UTz1sPESCNmWh/For-Claude?node-id=408-8557)

| Figma stages and measured evidence | Outcome | Decision |
| --- | --- | --- |
| Width `408:8558` “Contact page vert 1”, 1376.5×814. Contact/legal groups horizontal. | **1 — Already supported** | Current desktop Footer retains its approved horizontal legal links, content, curtain and shared gutters. |
| `408:8608` “Contact page vert 2 (legal links vert)”, 544×1086. Footer groups stack and legal links are vertical with a 16px gap. | **2 — M10B complete for the approved mobile behavior** | The mobile legal links now stack using the existing Footer owner, with an 8px internal gap and 32px contact separation. Desktop remains horizontal and tablet remains in its approved vertical composition. The Figma 16px gap is a reference, not copied as a breakpoint or value. |
| `408:8618` “Contact page vert 3”, 197×1188; `408:8628` “Contact page vert 4 (margins 0)”, 64×2158. Contact/legal text wraps extensively and outer margins are removed. | **4 — Stress only** | These widths are below the supported minimum. Preserve the supported shared gutters and do not make legal-copy breakpoints for these stages. |
| Height `408:8568` “Contact page horiz 1”, 2206×386. Message above the horizontal footer. | **1 — Already supported** | Current Footer supports its approved normal-height desktop composition. |
| `408:8578` “Contact page horiz 2 (contact details vertical, small margins)”, 2206×164. Place the heading/email, contact group and legal group in one horizontal row, bottom-aligned. The extraction notes that `408:8581` Contact Details is horizontal despite the stage name; the approved implementation follows the user's clarified visual instruction and measures the rendered groups rather than using the label as a rule. | **2 — M10B** | Implemented within `fitFooter()`: use the row only when actual content widths and height fit inside the shared gutters at unchanged typography; otherwise fall back to natural vertical document flow. No separate breakpoint or Footer owner. |
| `408:8588` “Contact page horiz 3”, 2206×102. More constrained horizontal Footer stage. | **3 — Simpler behavior** | Covered by the same measured row-fit condition; if the complete row does not fit vertically, the existing Footer uses natural document scrolling rather than adding another short-height mode. |
| `408:8598` “Contact page horiz 4 (margins 0)”, 2206×50. The 62px message overflows y=−6..56. | **4 — Stress only** | This stage is visibly taller in content than its 50px frame, with clipping disabled. It is a resilience warning, not a required Footer size or margin rule. |

## Footer legal-link orientation and implementation record

The approved design is now implemented within the existing `PortfolioController.fitFooter()` geometry owner. Mobile legal links are vertical with an 8px gap; the contact group ends 32px above the first legal link. The link group remains aligned to the shared 16px horizontal and 24px bottom gutters and grows upward. At 320×568 and 390×844, the contact group moves up 23px to preserve that visible separation. Typography remains 11px for legal links, and the 44px language switcher stays fixed at its shared gutter position. The curtain, links, dialogs and content are unchanged.

Tablet keeps its existing vertical arrangement (including the 500×600 narrow-tablet reference); desktop keeps its existing horizontal arrangement. A real-browser wide desktop control at 2991×643 with fine-pointer input selects the desktop profile and renders horizontal links. The user's capture at the same nominal viewport appeared vertical, so its active responsive profile or local runtime state remains uncertain; the vertical arrangement could not be reproduced in the controlled desktop profile.

No new template, controller, stylesheet rule or layout owner was added. The mobile branch now sets the legal stack to `column` with an 8px gap and derives the contact group's bottom position from the measured legal-group height, shared bottom gutter and 32px inter-group spacing. Desktop/tablet assignments are unchanged.

Actual FR/EN captures at mobile 320×568 and 390×844 and desktop 1440×900 and 2991×643, together with bounds and active input/profile data, are in the [local implementation gallery](phase-5-m10-footer-legal-implementation-review/README.md). The tablet arrangement was focused-tested at 500×600 and 1194×834. The test `footer-legal-orientation.spec.cjs` verifies mobile stack/gaps, desktop horizontal behavior including 2991×643, and retained tablet orientation in both locales; the existing `mobile-footer-responsive.spec.cjs` additionally covers its width/height resize sequence. Eight focused cases passed (four profile skips). `content:check`, deterministic `content:build:check` and the 230-entry frozen-reference hash check passed. No historical screenshots changed.

The earlier browser-only 1px-clearance proposal was rejected. It is retained in the previous review folder only as a record of that discarded attempt; it is not an implementation target.

## M10B planning implications

- Keep the approved Projects three-mode policy in the work plan: **NORMAL** preserves heading and horizontal rail when full content fits; **COMPACT** reclaims the heading space while preserving the rail when only the ticket fits; **EXTREME-SHORT** uses natural vertical flow and the same six tickets when a complete ticket cannot fit under the Navbar. Figma tiny horizontal frames do not replace this policy.
- Keep the M10A baseline findings in [the responsive QA baseline report](phase-5-responsive-qa-baseline.md): desktop short-height ticket access remains a known deferred issue; resize scroll-position continuity remains a confirmed failure for targeted M10B owner review. The coverage classifications above add no new application behavior or breakpoint.
- Preserve approved visual compositions, bilingual route generation, the M9 architecture contract and immutable screenshot references. Implementation, automated validation and user visual approval remain separate acceptance gates.
