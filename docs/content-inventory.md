# Frozen portfolio content inventory

The authoritative machine-readable inventory is
[`tests/baseline/content-inventory.json`](../tests/baseline/content-inventory.json),
captured from original commit `d8a37314ed7d2265f3f949c9e048b5e2beadfc20`.
The six identifiers below are stable **audit IDs**, not claimed existing DOM IDs.
No project content, URL or asset was changed to create this inventory.

## Active projects and exact destinations

These destinations are the same in all active layouts and both languages.

| Audit ID | Display title | Exact active URL |
| --- | --- | --- |
| `pilates` | Pilates | `https://www.behance.net/gallery/254535151/Reform-pilates-studio-for-men` |
| `longread` | Longread | `https://readymag.website/u1448912666/perfectionism/` |
| `tour-de-parole` | Tour de parole | `https://www.behance.net/gallery/256783201/Tour-de-parole-Negotiation-school-for-GenZ` |
| `inside-out` | Inside out | `https://www.youtube.com/watch?v=NG0HM9ApyP8` |
| `celimax` | Celimax | `https://www.behance.net/gallery/255872777/Climax-3D-product-website` |
| `napoli` | Napoli | `https://www.behance.net/gallery/257282669/Napoli-caffe-branding` |

## Exact project order

- Desktop: `pilates`, `longread`, `tour-de-parole`, `inside-out`, `celimax`, `napoli`.
- Tablet portrait: `celimax`, `inside-out`, `napoli`, `longread`, `tour-de-parole`, `pilates`.
- Tablet landscape: `celimax`, `inside-out`, `napoli`, `longread`, `tour-de-parole`, `pilates`.
- Mobile: `pilates`, `longread`, `tour-de-parole`, `inside-out`, `celimax`, `napoli`.

The JSON `orders` object stores these arrays. Do not infer tablet order from the
desktop rail or reorder it during centralization.

## Existing copy and category variants

The frozen inventory preserves every description verbatim. In particular, these
French descriptions differ; they must not be normalized or silently unified:

| Project/mode | Exact French description |
| --- | --- |
| Inside out — desktop/mobile | `Un motion sur la santé mentale : l'anxiété sociale et le sentiment d'être submergé.` |
| Inside out — tablet | `Un motion sur la santé mentale : l’anxiété sociale et le sentiment d’être submergé par les émotions.` |
| Celimax — desktop/mobile | `Un pot de soin repensé en mini tourne-disque, pour Celimax — marque coréenne que j'adore.` |
| Celimax — tablet | `Un pot de soin repensé en mini tourne-disque, pour Celimax — marque coréenne que j’adore.` |
| Napoli — desktop/mobile | `Un vrai bout d'Italie ouvert à Montreuil — focaccias, pâtisseries italiennes, espresso napolitain.` |
| Napoli — tablet | `Un vrai bout d’Italie ouvert à Montreuil — focaccias, pâtisseries italiennes, espresso napolitain.` |

Other project descriptions match across layout branches, but all are recorded
independently so future divergence cannot disappear through assumptions.

Category arrays also differ, including capitalization:

| Project | Desktop | Tablet | Mobile |
| --- | --- | --- | --- |
| Celimax | `3d modeling`, `landing page` | `branding`, `UX/UI` | `3d modeling`, `landing page` |
| Napoli | `brand identity`, `Web design` | `full brand identity`, `Web design` | `brand identity`, `web design` |
| Longread | `Web design`, `readymag animation` | `Web design`, `readymag animation` | `web design`, `readymag animation` |

English is obtained with the original `en/i18n.js`, including its nonbreaking-space
polishing. For example, the original translator gives Inside out's tablet copy a
longer English description than desktop/mobile. Exact U+00A0 spaces are part of the
JSON strings. Do not use whitespace normalization, typographic apostrophe
replacement or case folding when checking exact copy. The authoritative English
strings are in the individual records, not a newly rewritten glossary.

## Legacy discrepancies

`legacyLinks` preserves the old numeric `ticketLinks()` mapping:
`0=pilates`, `1=tour-de-parole`, `2=longread`, `3=napoli`, `4=inside-out`,
`5=celimax`.

- Tour de parole's legacy URL uses Behance gallery **254618097**, while every active
  anchor uses **256783201**.
- Inside out's legacy YouTube URL has extra `time_continue`, `source_ve_path` and
  `embeds_referring_*` query parameters; active anchors use the shorter URL above.
- Outdated comments/README claims about placeholder links are not authoritative
  over the current active anchors.

The exact longer legacy URLs remain in JSON. Baseline work records the discrepancy;
it does not decide to replace an active destination.

## Finding the complete records

There are **48 records**: six projects × four modes × two languages. Read:

```text
layouts["desktop" | "tablet-portrait" | "tablet-landscape" | "mobile"]
       ["fr" | "en"]
```

Each array is in exact display order. Each record includes `id`, `title`,
`description`, `tags`, `url`, `accessibleName`, `media`, `styleAssets` and `source`.
`source` identifies the original file, line and selector. `media` retains each
element's `src`, `data-src`, `poster`, loading/preload policy and relevant accessible
label; `styleAssets` records CSS background URLs inside project cards.

For example, find the exact mobile English Celimax description by selecting the
record with `id === "celimax"` in `layouts.mobile.en`. Do not use its tablet record
as a substitute.

## Asset and reference inventory

- `assetFiles`: **36** checked-in files, including project media, Hero previews,
  portrait, seats, cursor, favicon, Open Graph image, avatar, footer walk and curtain
  texture. Each has `path`, byte size, SHA-256 and `referencedBy` source locations.
- `resourceReferences`: **152** original literal resource references with source
  file/line, exact reference and reference kind. These include local scripts/CSS,
  asset references and external URLs. An external literal is not necessarily an
  actual network request.
- `mobileImageSequences`: ordered three-image source sequences for Tour de parole,
  Celimax and Napoli. These are constructed from a base path and filenames in the
  original JavaScript; the asset reference list records that construction rather
  than incorrectly treating them as unused files.
  In the current English mobile runtime, each slideshow also appends the last two
  image nodes a second time, giving five DOM layers with source order
  `[first, second, third, second, third]`. French has three layers. The functional
  test records and checks this existing language difference while checking that
  exactly one layer is visible and the active image advances. The duplicate
  English nodes visually cover the original second and third nodes, so its
  visible layer indices cycle through `0, 3, 4`.
- `runtimeDependencies`: original React/React DOM URLs and SRI, conditional Babel
  loader, Three.js module URL and font hosts.
- `sourceIntegrity`: byte sizes and SHA-256 for all **51** original tracked files.

All 36 asset files have a static reference accounted for. This establishes source
reachability, not that every asset downloads in every layout or that every
reference remains behaviorally active. Runtime request logs answer that separate
question. Nothing is authorized for deletion by this inventory.

## Read-only verification

`node tests/inventory/generate.cjs --check` regenerates the inventory in memory and
compares it to the frozen JSON without writing files. It first verifies that every
original file still matches the recorded commit. The output was extracted twice
and compared byte-for-byte during Phase 0–1; both extractions matched.

The source-integrity precondition intentionally applies to baseline preparation.
A future refactor will use the rendered-content and visual regression gates;
changing source hashes is expected only after that implementation is separately
approved. Baseline recording is an explicit reviewed action, never part of a
normal regression command.
