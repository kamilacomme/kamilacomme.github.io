# D1 — Jane case page: design report (report only, nothing fixed)

Pages: `/cases/jane/` (FR) and `/en/cases/jane/` (EN), local server `http://127.0.0.1:8000`, working tree of branch `case-studies/jane-format` (it holds uncommitted changes to `content/cases/jane*.json`, the generated Jane pages and the WebP set; this report describes what was rendered, not the last commit).
Method: single-context run (no sub-agents; the task was report only). Chrome (installed, not the recorded Linux lab) at 1440×900, 768×1024, 393×852. Deterministic scan: `impeccable detect` on both source files and on both URLs at the three sizes. Measured: DOM geometry, computed styles, image sizes against the original frames, annotation boxes. Not measured: Lighthouse/LCP, screen-reader behaviour, keyboard focus order, physical touch, Safari/iOS. This is a report, not acceptance.

Real page height: FR 30 306 / 24 889 / 31 614 px (1440 / 768 / 393), EN 30 073 / 24 599 / 31 069 px. An earlier figure of 44 306 px came from a 7 900 px tall window stretching the `100svh` footer; the screenshots in this task were taken at a normal window height by clipping.

## 1. Screenshots

Folder: `/private/tmp/claude-501/-Users-admin--claude-spares-spare-ESYQko/a90419aa-a46a-4120-8f3a-b4947ee8ef1f/scratchpad/`, files `jane-<fr|en>-<1440|768|393>-part<N>.png`, each at most 7 900 px tall, no stitching. The last part of every set ends with the footer (checked by eye on FR 1440).

| Set | Parts | Last part height |
|---|---|---|
| fr-1440 | 4 | 6 606 px |
| fr-768 | 4 | 1 189 px |
| fr-393 | 4 | 7 884 px |
| en-1440 | 4 | 6 373 px |
| en-768 | 4 | 899 px |
| en-393 | 4 | 7 369 px |

All other parts are 7 900 px (fr-393: 7 910 px). Sizes in KB are in the report message.

## 2. Critique and audit (numbered)

Severity: P0 blocks, P1 major, P2 minor, P3 polish. "FR=EN" means the same in both languages.

| # | Chapter / block | Width | What is wrong | Type | Severity |
|---|---|---|---|---|---|
| 1 | L'identité, annotated logo; Un sac, plusieurs formes, annotated sketch (2 of 3 annotated blocks) | 768 (FR=EN) | Labels over the picture overlap each other ("Le nom" over "La construction"; "Rangé : les lanières…" over "Études de construction…"); the text is cut and unreadable. At 1440 the labels are clear, at 393 they become a list below. The overlap exists only in the tablet range | accessibility / grid | P1 |
| 2 | Hero (Le Reveal) | 1440 | The 1200×896 frame is shown 1376×788: 1.15× (borderline) and soft on a 2× screen (2.3×). It is the first thing seen | stretch | P1 |
| 3 | Whole page | 1440, 2× screens | 18 of 46 frames pass 1.15× when the screen is 2× (list in the inventory) | stretch | P2 |
| 4 | Concevoir avec l'IA (5 episodes) | 1440 | Every episode is one left column of 676 px in a 1376 px area; the right half is empty for about 11 500 px (38 % of the page). Before and After are stacked, so the comparison needs scrolling | grid / taste | P2 |
| 5 | La campagne, single frames | 1440 | Two portrait frames are 640 px wide and centred (x=400). A column step of this grid is about 116.7 px, so 640 starts between columns; 676 px (6 columns) is what the neighbouring pairs use. Full-width, 676 and 640 sit in one chapter with no common edge | grid | P2 |
| 6 | Au-delà du produit, 3-up row | 768 | Two cells and a third on its own line, half empty | grid | P2 |
| 7 | Au-delà du produit, three squares | 1440 | 443×443 squares are not on the column grid (443 is not a column span) | grid | P3 |
| 8 | First screen | 1440 | The hero fills the screen, the title "Trouve ta Jane" and the intro start at y=900, below the fold; the first screen is a picture and the navbar | taste | P2 |
| 9 | Concevoir avec l'IA, prompt boxes (6) | 1440, 768 | Lines of 92–98 characters in the Method box (limit about 80). The prompts are in English on the French page (content, left as is) | typography | P3 |
| 10 | Résultat et enseignements, principles list | 1440, 768 | One line of 89 characters; the last item ("Autres erreurs") is a dense 6-line block next to short one-line items | typography | P3 |
| 11 | Heading structure | all | A visually hidden `h2` ("Le Reveal") comes before the `h1`; the 26 labels "Problème / Avant / Méthode / Après" are `h4`, so a heading list has 26 near-empty entries | accessibility | P2 |
| 12 | Captions, labels | all | 14 px captions and 12 px uppercase labels (approved sizes, contrast 7.06:1 passes). The inactive chapter-menu links are Ink at 64 %, about 4.8:1 at 12 px, passing by a small margin | contrast | P3 |
| 13 | La campagne / De la nature (straggler) | 1440, 768, 393 | One caption ends with a single word on its own line ("ton", "lanière") | typography | P3 |
| 14 | Colour swatches (L'identité) | all | The detector reports four literal colours outside DESIGN.md (olive, burgundy, cream, basalt). They are the project's own colours, as the "Real Colour Rule" intends: a false positive, to be confirmed by Kamila | taste | P3 |
| 15 | Whole page | all | Detector: Inter is the main font (85 % of text). It is the approved body face in DESIGN.md, so this is not a defect to fix | taste | n/a |
| 16 | 4 images without `width`/`height` attributes (the SVG logos) | all | Layout may shift while they load | accessibility / performance | P3 |
| 17 | Source of frames | — | Two frames on the page come from the folder "Extra generations idk if to use" (tree roots, mossbound silk). The status file records a decision "no Extra generations". To be confirmed by Kamila | content (not changed) | P2 |

What works (not to lose): all 50 images have alt text; body and caption text are 7.06:1 or better; the chapter menu is a 44 px sticky bar on desktop and a 44 px toggle on tablet and mobile (I first thought it was missing; it is there); `prefers-reduced-motion` is handled; images load lazily except the hero; no horizontal scroll at any size (scroll width equals viewport width); the grid overlay shows the page content sits on the 12 / 4 column grid.

### Navbar, footer, home (not touched, listed separately)

| # | Where | Width | What | Type | Severity |
|---|---|---|---|---|---|
| N1 | Navbar links "Projets / À propos / Contact" | 1440 | Text links 14 px tall; DESIGN.md says every target is 44 px | spacing / accessibility | P2 |
| N2 | Footer legal links ("Mentions légales", "Politique de confidentialité") | 1440, 768, 393 | 17–18 px tall targets, below 24 px | accessibility | P2 |
| N3 | Language switch | any short height | The fixed 44×44 circle can overlap content; already an accepted limitation | spacing | accepted |
| N4 | Home page | — | Not examined in this task | — | — |

## 3. Audit health score

| # | Dimension | Score | Key finding |
|---|---|---|---|
| 1 | Accessibility | 3 | Heading order and 26 `h4` labels; footer and navbar targets; contrast and alt text pass |
| 2 | Performance | 3 | Lazy loading and responsive widths are in place; LCP not measured; hero is soft rather than heavy |
| 3 | Theming | 3 | Tokens used; four content colours outside DESIGN.md (project colours) |
| 4 | Responsive | 2 | Annotation overlap at 768; orphan cell at 768; hero soft at 1440 |
| 5 | Implementation integrity | 3 | Coherent with DESIGN.md; frame source folder to be confirmed |
| **Total** | | **14/20** | Good (address the weak dimension) |

Count: P0 0, P1 2, P2 7 (incl. N1, N2), P3 7.

## 4. Frame inventory

See [d1-jane-frames.md](d1-jane-frames.md).

## 5. Grid overlay tool

Press G. Desktop and tablet: 12 columns, 32 px margin, 24 px gutter. Mobile (under 500 px): 4 columns, 16 px margin, 16 px gutter. Red, 15 % opacity. Start with `npm run dev:grid`. Files: `scripts/dev/grid-overlay.js`, `tests/runtime/server.mjs` (injects the tool only when `KC_GRID=1`), `package.json` (`dev:grid`). No page, template or generated file loads it. `?grid=1` is accepted by the tool itself, but because no page loads it, it only matters if the tool is loaded by hand on a non-local address. On the live site nothing loads it.
