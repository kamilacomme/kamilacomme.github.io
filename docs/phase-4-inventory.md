# Phase 4 source inventory and parity contract

**Status:** Read-only inventory milestone complete. This records the pre-Phase 4 source and frozen baseline as historical evidence. The user has now approved a canonical project-order change and requires approval of the revised Phase 4 plan before implementation. This inventory is not permission to alter application output or media.

## Bilingual page and runtime structure

- `index.html` is the authored French full-page source. It contains the responsive page shells and the project presentations for tablet and mobile.
- `desktop-project-embedded.html` contains the desktop project rail used in the iframe.
- `en/index.html` and `en/desktop-project-embedded.html` are small loaders. Each fetches its French source, changes the language/head metadata, and injects `en/i18n.js`; they are not separately authored page structures.
- `en/i18n.js` has 105 exact-string translation pairs in a 264-line script. It also does non-translation work: special Projects heading markup, a tablet ticket box-sizing rule, English tablet Footer alignment with About/style observers, and hash-link interception. These responsibilities must be migrated before the runtime translation loader is removed.
- `support.js` parses the current document's `<x-dc>` source, reads the shared `data-dc-script`/`data-props`, creates the React root, and can fetch `location.href` to re-read that route's source. Generated `/` and `/en/` documents therefore need the same runtime structure and script order, with locale-specific source returned at each path.
- `portfolio-controller.js` consumes existing named refs and `data-i` indexes. Generated DOM must preserve names such as `cardRef`, `tCardRef`, `mCardRef`, `dProjRef`, and the exact element/ID contracts. The desktop iframe route needs its matching English generated document too.

## Project source inventory

The frozen `tests/baseline/content-inventory.json` contains **48 records**: six stable project IDs × four responsive modes × two languages. It is the exact-content contract for extraction. Each record includes title, description, tags, active URL, accessible name, media elements and their attributes, CSS background assets, source location, and order.

The stable IDs are `pilates`, `longread`, `tour-de-parole`, `inside-out`, `celimax`, and `napoli`. Each has one active destination URL across layouts/locales. The JSON retains the legacy numeric ticket-link mapping and discrepancies separately; those legacy values do not supersede active links.

The exact historical order in the frozen source is:

| Layout | Order |
| --- | --- |
| Desktop | Pilates → Longread → Tour de parole → Inside out → Celimax → Napoli |
| Tablet portrait | Celimax → Inside out → Napoli → Longread → Tour de parole → Pilates |
| Tablet landscape | Celimax → Inside out → Napoli → Longread → Tour de parole → Pilates |
| Mobile | Pilates → Longread → Tour de parole → Inside out → Celimax → Napoli |

The tablet-specific order is now confirmed as unintentional and is explicitly superseded for Phase 4 output by the user-approved canonical order: **Pilates → Longread → Tour de parole → Inside Out → Celimax → Napoli**. Phase 4 must maintain one order array and use it for desktop, tablet portrait, tablet landscape, mobile, French and English. The historical inventory remains unchanged; order is the approved difference, while each complete card record (copy, media, link and accessible name) must stay associated with its project ID. Content exceptions include project-specific category casing and punctuation differences by responsive layout. For example, Inside out, Celimax and Napoli have documented desktop/mobile versus tablet description variants. Do not normalize those strings during extraction.

The inventory covers 36 physical asset files and 152 literal resource references. Project asset fields include `<img>` sources, `data-src` video paths, posters, preload/loading attributes, and CSS background URLs. The English mobile sequences currently contain five DOM nodes ordered first/second/third/second/third while French has three; preserve and test this existing behavior unless a separate decision changes it.

About has five card contents repeated across desktop, tablet and mobile shells: **15 authored card blocks**. The runtime one-tree experiment failed visual parity and was reverted. Phase 4 may share the five content records at generation time, while retaining all three shells, refs and animation formulas.

## Phase 4 invariants and measurements

1. Keep the frozen six IDs, six active URLs, exact French/English copy, category text, accessible labels and media attributes. Compare generated data to all 48 frozen records, except that the old tablet order is superseded by the approved single canonical order: Pilates → Longread → Tour de parole → Inside Out → Celimax → Napoli. Assert the same order in all four layouts and both locales.
2. Keep every physical media file, path, byte count and SHA-256 from the 36-file baseline inventory. Centralizing a reference does not authorize deleting, renaming, replacing, recompressing or optimizing an asset.
3. Maintain one authored content/page-template source for both locales. Generated French and English route outputs are expected artifacts; they may duplicate rendered HTML but must not become independently maintained pages.
4. Keep the intentional responsive project shells and the existing About desktop/tablet/mobile shells distinct wherever geometry, refs or animation behavior differs. All project shells use the one approved canonical order; layout-specific order variation is removed.
5. Measure authored source reduction against this inventory: project data records and field copies, media path references, page/card template sources, translation dictionary entries and runtime translation responsibilities. Report generated output size separately; do not mistake generated markup duplication for authored-source duplication.

No application output has been changed for this inventory milestone.

## Order decision record

The inventory’s tablet order (Celimax → Inside Out → Napoli → Longread → Tour de parole → Pilates) is retained here only to document the original implementation. The user confirmed that variation was accidental and approved standardizing every output to Pilates → Longread → Tour de parole → Inside Out → Celimax → Napoli. This is the one approved content-order delta. No baseline artifacts are to be overwritten.
