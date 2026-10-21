# Phase 4 architecture proposal

**Status: proposal only; implementation is not authorized. Recommendation: choose B, generated French and English static HTML, after a staged parity migration.** This plan covers the shared-content work Phase 3 deferred. It preserves the current visual layouts and browser behavior while making project content, localization, media references, and ordering have one maintained source.

## Proposed sources and outputs

- `content/projects.json`: one stable record for each of the six project IDs. Each record owns its active URL, accessible label, media/poster/sequence paths, and French and English title, description, and tags. Explicit `layoutOverrides` retain real exceptions instead of normalizing punctuation, capitalization, or copy that currently varies by layout.
- `content/project-order.json`: four explicit order arrays: desktop, tablet portrait, tablet landscape, and mobile. Portrait and landscape remain separate even though their current orders match.
- Shared content templates: a project-card content template supplies the same data to the four existing layout-specific shells. It does not force one shared geometry or DOM structure. The About section can use five bilingual card-content records expanded at build time into its existing desktop, tablet, and mobile wrappers.
- A dependency-free Node generator/validator produces both localized static documents from the shared page/layout templates, project data, and translation dictionaries. Generated outputs are committed because GitHub Pages serves static files and does not run this repository's build. The generator must be deterministic and provide a check-only mode for stale output.

Use the frozen `tests/baseline/content-inventory.json` as the extraction oracle. It records all 48 project/layout/language records, exact assets, URLs, descriptions, tags, and order. The source should be compact: six project identities plus localized fields and only necessary layout overrides, rather than maintaining 48 independent full records. Asset manifests should be references in project records, not copied path strings in per-layout templates.

## Language architecture: A versus B

| | A — current English loader | B — generated static `/` and `/en/` pages |
| --- | --- | --- |
| Authored architecture | One French source plus a runtime string-replacement table and loader | One shared page/layout template set plus locale data and dictionaries |
| Browser behavior | `/en/` fetches French HTML, rewrites metadata, calls `document.write`, translates text/attributes, and observes later DOM mutations | Browser receives complete localized HTML at the requested route; no page-fetch/translation pass is needed |
| Long-term cost | Exact-string matching, mutation timing, special layout rewrites, and loader coupling remain | Adds a small build step and generated-output discipline; runtime content/geometry responsibilities become explicit |
| SEO | English head metadata exists in the shell, but body content is generated client-side after fetch/JS | Locale, title, description, Open Graph, canonical and alternate-language metadata can be present in the first HTML response |

B is the cleaner long-term architecture. A is the safest temporary bridge during migration, but it retains the workaround the refactor is meant to remove. B does create two generated output documents, but they are artifacts, not two separately authored sites.

### Compatibility with `x-dc`, `support.js`, and React refs

Two generated HTML documents are compatible with the existing runtime in principle. `support.js` parses the current document's `<x-dc>` source, mounts its React root, and may fetch `location.href` to re-read that same source. With static `/` and `/en/` documents, each fetch returns that route's own complete localized source. Each document keeps one `<x-dc>` structure, one `data-dc-script`/`data-props` block, runtime scripts in the same initialization order, and the exact IDs, data attributes, and ref names (`cardRef`, `tCardRef`, `mCardRef`, and others) expected by `support.js` and `portfolio-controller.js`. The runtime binds refs to that page's elements in the same way it does today; it does not need both languages in one DOM or a new renderer.

The generator must emit valid `x-dc` input and preserve ref identity, layout-specific card counts/order, and `data-i` indices exactly. Generate and verify the desktop iframe documents as well (`desktop-project-embedded.html` and `/en/desktop-project-embedded.html`) so the existing iframe remains functional. This compatibility is a strong architectural fit, not a claim of parity without tests: first validate one generated section in both languages, then each route and all eight responsive profiles before removing the loader.

### Locale, switching, metadata, and translation ownership

- `/` serves a complete French HTML document with `lang="fr"`; `/en/` serves the same page/layout templates populated with English strings and `lang="en"`. Ordinary language links navigate between these routes and retain equivalent section anchors where available.
- A shared UI dictionary owns labels and copy outside project records. Project records own project titles, descriptions, tags, accessible labels, and their explicit locale/layout exceptions. The generator reads these sources; the project text is not duplicated in a separate exact-French-string replacement map.
- Each route gets static title, description, Open Graph locale/URL, canonical URL, and language-alternate links in its own `<head>`. Static HTML makes the translated body available without JavaScript execution.
- The current `en/i18n.js` mixes translation with presentation/runtime work: special Projects heading markup, ticket box sizing, English tablet Footer alignment and its observers, and hash navigation. Before removing the loader, inventory these separately. Render heading variants through the shared layout templates; move box sizing to shared CSS; keep Footer alignment in a clear tablet/footer layout owner; and preserve anchor navigation with route-correct links or shared nav logic. Test each behavior in both languages. Do not leave a translation script responsible for geometry.

### GitHub Pages output

Use a dependency-free Node build command locally to generate the two static route documents and the two localized desktop-iframe documents from shared templates/data. Commit generated output alongside sources and verify it with a deterministic `--check` command. Existing GitHub Pages root publishing can then serve `/index.html`, `/en/index.html`, and both iframe paths as ordinary files; no workflow, framework, or deployment-configuration change is required. Do not publish these generated pages until explicitly authorized.

The migration temporarily retains A while building B in a separate output directory. Compare raw generated source, metadata, text, refs and assets; serve both routes locally; run focused language/layout checks; then switch the source output only after parity evidence passes. This avoids a half-translated live route and provides a rollback point at each commit.

## Preservation constraints

- Keep desktop/tablet/mobile wrappers, responsive card order, required element IDs and React refs, animation controllers, project scrolling and video/image-sequence lifecycle in their existing owners.
- Preserve the documented category and description differences as explicit layout overrides until a content owner approves changing copy.
- Preserve current media ordering, preload behavior, poster use, accessible labels, link destinations, and the English mobile image-sequence DOM behavior under regression tests. This phase does not authorize cleanup of legacy discrepancies or asset optimization.
- About deduplication shares content definitions only. Its three layout shells, refs and animation choreography stay intact; do not revive the failed one-tree runtime experiment.

## Reviewable milestones and gates

1. **Schema and parity contract:** define IDs, locale fields, layout overrides, media references and four orders; validate exact equality against the frozen 48-record inventory. No application output changes yet.
2. **Shared templates and data:** migrate one project through one existing shell first; verify exact text/URLs/assets/order and refs. Then generate the remaining layout shells from shared records in small commits.
3. **Static English route:** generate a complete `/en/` page and English iframe from the shared templates/dictionaries; migrate the non-translation responsibilities out of `en/i18n.js`. Verify raw response metadata, both language links, anchors, runtime initialization and English tablet Footer behavior.
4. **About shared content:** generate the existing three About wrappers from five bilingual content records; preserve refs and test animation states, Footer and legal interactions. Do not merge the three layout DOM structures.
5. **Phase 4 acceptance:** deterministic generated-output check, exact inventory parity, full eight-profile visual/functional gate, locked reference integrity, independent diff review, and a measured duplication report. Update references only for separately approved design changes.

The measurable target is six maintained project identities instead of 48 full project/layout/language content records, four explicit order lists, and five About card-content definitions instead of 15 maintained card copies. Layout shells and their generated runtime DOM remain distinct where behavior requires it. These targets describe authored source reduction, not a promise to reduce generated HTML bytes or improve Lighthouse. The mobile performance blocker remains separate and release readiness stays blocked until addressed under explicit authorization.

## Main risks

Text extraction can lose exact typography or layout-specific punctuation; asset mapping can silently redirect a project; generated markup can break `support.js` selectors or React refs; localized route metadata/anchors can drift; moving the English Footer fit can alter tablet geometry; and About output can perturb animation geometry. Inventory equality, HTML escaping, output checks, direct HTTP metadata checks, focused tests after each milestone, and the final locked matrix reduce those risks. If the generator creates complex conditionals or changes browser initialization, stop and reconsider rather than adding runtime workarounds.

## Asset preservation contract

Phase 4 centralizes references; it does not authorize deleting, replacing, recompressing, or optimizing files. Keep every asset in the frozen inventory, preserve paths, and compare file count, byte length, and SHA-256 to the baseline. Any asset that appears unused remains untouched until a separately approved asset review. Project records may change where references are authored, but generated markup must resolve to the exact existing media and poster paths.
