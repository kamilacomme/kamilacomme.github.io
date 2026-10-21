# Phase 4 architecture proposal

**Status: proposal only; implementation is not authorized.** This plan covers the shared-content work that Phase 3 deferred. It preserves the current visual layouts and browser behavior while making project content, localization, media references, and ordering have one maintained source.

## Proposed sources and outputs

- `content/projects.json`: one stable record for each of the six project IDs. Each record owns its active URL, accessible label, media/poster/sequence paths, and French and English title, description, and tags. Explicit `layoutOverrides` retain real exceptions instead of normalizing punctuation, capitalization, or copy that currently varies by layout.
- `content/project-order.json`: four explicit order arrays: desktop, tablet portrait, tablet landscape, and mobile. Portrait and landscape remain separate even though their current orders match.
- Shared content templates: a project-card content template supplies the same data to the four existing layout-specific shells. It does not force one shared geometry or DOM structure. The About section can use five bilingual card-content records expanded at build time into its existing desktop, tablet, and mobile wrappers.
- A dependency-free Node generator/validator produces the static project markup and generated project translations used by the existing English entry/translation path. Generated output is checked in for GitHub Pages, which serves static files and does not run a build. The generator must be deterministic and provide a check-only mode for stale generated output.

Use the frozen `tests/baseline/content-inventory.json` as the extraction oracle. It records all 48 project/layout/language records, exact assets, URLs, descriptions, tags, and order. The source should be compact: six project identities plus localized fields and only necessary layout overrides, rather than maintaining 48 independent full records. Asset manifests should be references in project records, not copied path strings in per-layout templates.

## English site

The English site already uses the shared French source page: `/en/` fetches `/index.html` and applies `en/i18n.js`; it is not a second full portfolio page. Keep that thin route and its English SEO metadata. Phase 4 should make the project data the source for English project copy and have generated localized values flow through the existing English path, so project strings are no longer independently maintained in both markup and the translation map. Keep non-project translation behavior intact until separately reviewed. Do not add a second page, framework, or extra client-side rendering layer.

Build-time expansion is recommended over runtime card cloning or hydration. It leaves ordinary static markup for `x-dc` and `support.js`, adds no browser DOM timing, observers, or data-fetch request, and remains compatible with GitHub Pages when generated files are committed. The cost is one small Node script, generated-file review discipline, and deterministic generation checks.

## Preservation constraints

- Keep desktop/tablet/mobile wrappers, responsive card order, required element IDs and React refs, animation controllers, project scrolling and video/image-sequence lifecycle in their existing owners.
- Preserve the documented category and description differences as explicit layout overrides until a content owner approves changing copy.
- Preserve current media ordering, preload behavior, poster use, accessible labels, link destinations, and the English mobile image-sequence DOM behavior under regression tests. This phase does not authorize cleanup of legacy discrepancies or asset optimization.
- About deduplication shares content definitions only. Its three layout shells, refs and animation choreography stay intact; do not revive the failed one-tree runtime experiment.

## Reviewable milestones and gates

1. **Schema and parity contract:** define IDs, locale fields, layout overrides, media references and four orders; validate exact equality against the frozen 48-record inventory. No application output changes yet.
2. **Project data and generated content:** migrate one project through one existing shell first, compare text/URLs/assets/order and run both-language focused visual and behavior checks. Then migrate the remaining records and shells in small commits.
3. **English integration:** connect generated project translations to the existing `/en/` path without duplicating the page; test exact French/English text, metadata, links and localization timing across all four layouts.
4. **About shared content:** generate the existing three About wrappers from five bilingual content records; preserve refs and test all eight profiles, animation states, footer and legal interactions.
5. **Phase 4 acceptance:** deterministic generated-output check, full eight-profile visual/functional gate, locked reference integrity, independent diff review, and a measured duplication report. Update references only for separately approved design changes.

The measurable target is six maintained project identities instead of 48 full project/layout/language content records, four explicit order lists, and five About card-content definitions instead of 15 maintained card copies. Layout shells and their generated runtime DOM remain distinct where behavior requires it. These targets describe authored source reduction, not a promise to reduce generated HTML bytes or improve Lighthouse. The mobile performance blocker remains separate and release readiness stays blocked until addressed under explicit authorization.

## Main risks

Text extraction can lose exact typography or layout-specific punctuation; asset mapping can silently redirect a project; generated markup can break `support.js` selectors or React refs; translation timing can change what the existing DOM translator sees; and About output can perturb animation geometry. Inventory equality, escaped deterministic output, focused tests after each milestone, and the final locked matrix reduce those risks. If the generator creates complex conditionals or changes browser initialization, stop and reconsider rather than adding runtime workarounds.
