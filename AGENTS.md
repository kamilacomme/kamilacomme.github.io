# Maintenance guide for coding assistants

Use this guide together with the current [project status](docs/PROJECT-STATUS.md) and relevant component tests. The status summary at the top of that file is the current record; dated milestone notes below it describe historical checkpoints and may contain findings that were later resolved.

## Project overview

This is Kamila Comme’s static French/English design portfolio. The French homepage is `/`; the English homepage is `/en/`. GitHub Pages serves committed files from the repository root on `main`. There is no repository GitHub Actions deployment workflow; do not assume Pages runs the Node build. `.nojekyll` is required for the `_ds/` assets.

The site uses HTML templates, a Node content generator, JSON content, CSS, classic JavaScript, the existing `x-dc`/`support.js` browser runtime, and a WebGL curtain module. Playwright with Chromium, Lighthouse and Node’s built-in test runner provide QA.

Edit source files, then regenerate/check the static pages. The principal inputs are:

- `content/projects.json`, `content/about.json`, `content/ui.en.json`, and `content/site.en.json` for canonical project/About data and English UI/site copy.
- `templates/page.html`, `templates/404.html`, `templates/partials/navbar.html`, and `templates/cards/` for page markup.
- `templates/desktop-project-embedded.html` for the desktop Projects iframe document.
- `scripts/content/build.mjs` and its validators for deterministic generation.
- `styles/`, `portfolio-controller.js`, `scripts/projects/`, and `curtain-cloth.js` for presentation and behavior.

`index.html`, `en/index.html`, `desktop-project-embedded.html`, `en/desktop-project-embedded.html`, and root `404.html` are generated, committed Pages output. Do not hand-edit generated pages; change their source and run `npm run content:build` when generated output should be updated. `npm run content:build:check` verifies output determinism without changing the checked-in pages. `support.js` is generated runtime output whose source package is absent from this checkout; do not patch it as if it were application source.

## Component and behavior ownership

Keep one owner for each responsive behavior. `templates/page.html` contains the intentional desktop, tablet and mobile page structures; preserving those differences is not duplication by itself.

| Area | Source owner(s) | Responsibility |
| --- | --- | --- |
| Navbar | `templates/partials/navbar.html`; `portfolio-controller.js`; `styles/responsive-foundations.css`, `styles/base-and-accessibility.css`, `styles/hire-cookie-overrides.css`, `styles/nav-scrim.css` | One shared markup source; the main controller publishes responsive profile/geometry and interactions; styles handle visibility, appearance and focus. |
| Hero | Hero markup in `templates/page.html`; `portfolio-controller.js`; shared responsive styles | `PortfolioController.fit()` owns profile geometry, Hero fallback and shared gutter publication; the same controller owns slideshow advancement and reduced-motion pause/resume. |
| Projects — desktop | `templates/desktop-project-embedded.html`; `templates/cards/layered-ticket.html`; `styles/layered-ticket.css`; `content/projects.json` | The iframe template’s `measure()` owns desktop rail geometry and scroll mapping. The builder supplies canonical card data and shared layered-ticket markup. |
| Projects — tablet | `scripts/projects/tablet-project-layout.js`; tablet markup in `templates/page.html`; shared ticket template/styles | The tablet Projects script owns tablet rail, mode and semantic project-anchor geometry. It consumes the main controller’s published viewport/profile policy. |
| Projects — mobile | Mobile markup in `templates/page.html`; `templates/cards/mobile.html`; `styles/project-layouts.css`; `content/projects.json`; `scripts/projects/mobile-image-sequences.js`, `scripts/projects/responsive-video.js`; `portfolio-controller.js` | The main controller owns active profile and section/resize handoff; CSS keeps the editorial list in natural flow; the two project scripts own image-sequence loading and video lifecycle. |
| About | About markup in `templates/page.html`; `content/about.json`; `portfolio-controller.js`; shared responsive styles | `PortfolioController.fit()` owns profile geometry; `renderAbout()` owns scroll-linked card placement and animation. |
| Footer | Footer markup in `templates/page.html`; `content/ui.en.json`; `portfolio-controller.js`; `curtain-cloth.js` | `fitFooter()` is the sole Footer geometry owner. `renderFooter()` owns scroll-derived curtain progress. The existing `clothRef` lazily activates the curtain module near Footer; `curtain-cloth.js` owns its renderer/simulation and reduced-motion lifecycle. |
| Language switcher | Markup in `templates/page.html`; `styles/language-switch.css`; `portfolio-controller.js` | CSS owns circle appearance, focus and fixed placement. The controller publishes shared gutters and handles semantic route/scroll restoration; the switcher does not measure another section. |
| 404 | `templates/404.html`; `templates/partials/navbar.html`; `styles/404.css`; `scripts/content/build.mjs` | Static localized 404 content and the shared Navbar. Keep homepage animation/controller systems off this page. |
| Content generation | `content/*.json`; `templates/`; `scripts/content/build.mjs`, `scripts/content/validate-project-data.mjs`, `scripts/content/validate-generated-html.mjs` | Validate canonical bilingual records and deterministically render the committed static routes. |

The main controller’s viewport policy and shared page gutters are inputs to component owners, not permission for one section to measure or position another. Animation and geometry ownership are separate where documented above. Do not add a competing controller, duplicate Navbar/template, or second owner for Footer, About, desktop Projects, tablet Projects or media lifecycle. `docs/PROJECT-STATUS.md` records the broader M9 ownership contract and accepted exceptions.

## Responsive design rules

- Preserve the visually approved desktop, tablet portrait/landscape and mobile compositions. Check `docs/PROJECT-STATUS.md` before treating an old dated finding or screenshot mismatch as current.
- Use actual component/content fit and the existing active responsive profile. The profile depends on viewport and input characteristics; do not infer it from width alone.
- Prefer shared gutters, natural text wrapping, content growth and ordinary scrolling when a composition cannot fit. Keep text at its approved effective size; do not scale text-bearing containers to force a fit.
- Do not add one breakpoint per Figma frame, per-device pixel patches, new templates/controllers, or arbitrary geometry measurements. Figma frames are design evidence about relationships and states, not a production breakpoint specification. Consult `docs/phase-5-m10-figma-coverage.md` before proposing a visual behavior change.
- Preserve semantic continuity: the primary readable project or corresponding section should survive resize/language transitions where geometrically possible. Exact `scrollY` equality is not the contract.
- Keep the accepted 44×44 switcher overlap at exceptionally short heights unless the user authorizes changing it. The 50px Figma examples are stress references, not supported production targets.

## Safe change workflow

1. Read the current project status, source owner, neighboring styles/scripts, focused tests and applicable architecture notes before editing. Start with `git status --short`; do not overwrite or sweep in existing user changes.
2. Before a significant architectural, responsive or interaction change, write a concise implementation plan identifying the existing owner, proposed files, intended behavior, risks and focused validation. Make the smallest change in the correct owner. Update source inputs, not generated HTML or runtime bundles. If source or generator inputs change, run the deterministic build check and review any generated diff.
3. Run the directly affected test first. Include French and English, and the affected responsive profiles/orientations whenever content, routing, shared styles, geometry or interactions can differ by locale/profile. For browser specs, start `npm run test:serve` in a separate terminal (default `http://127.0.0.1:8000`) and set `BASE_URL` to that server if needed.
4. Use DOM geometry/computed-style evidence for geometry claims and actual browser interaction for behavior. Keep test assertions semantic and meaningful; correct obsolete instrumentation only when browser evidence demonstrates the assumption is wrong. Do not add arbitrary sleeps, force interactions, or remove a valid assertion to make a suite green.
5. Protect the visually approved designs. For changes affecting layout, typography, animation or responsive composition, provide actual before/after browser captures and measurements for the user's visual review before final acceptance. Automated test success is not visual approval. Do not create or replace historical references as a side effect of review.
6. Update relevant documentation when ownership, accepted limitations or test commands actually change. Keep dated checkpoint notes clearly historical; verify a claim against current source before repeating it.

## Build, test and release commands

Run from the repository root. Install the locked dependencies with `npm ci` when needed; use the checked-in `package-lock.json`.

```sh
npm run content:check          # Validate canonical bilingual content and assets
npm run content:build:check    # Verify generated static output is deterministic
npm run test:baseline-integrity # Verify the frozen reference artifact lock
npm run test:responsive        # Bounded M10 responsive geometry/interaction/resize QA
npm test                      # Full release gate (see below)
```

`npm test` runs the frozen-artifact lock before and after the gate, checks the recorded Chromium lab configuration and performance-comparison unit tests, runs the Playwright functional/visual suite, then runs bounded responsive QA. It does not replace `npm run content:build:check`; run the content checks separately before a release. The expected Chromium binary is `/usr/bin/chromium` unless `CHROMIUM_PATH` is explicitly configured. The Playwright configs use one worker and the recorded device/input profiles; preserve those settings for comparable results.

For a focused Phase 5 browser spec, start the local server in another terminal and run, for example:

```sh
npm run test:serve
BASE_URL=http://127.0.0.1:8000 npx playwright test \
  --config tests/phase-5/playwright.config.cjs \
  tests/phase-5/legal-dialog-keyboard.spec.cjs
```

Substitute the affected spec path. `npm run test:qa` runs the functional/visual Playwright suite alone. `npm run test:performance` runs the Lighthouse measurement set and is intentionally separate/heavy; do not run competing browser/Lighthouse jobs during controlled measurements. Preserve the recorded budgets and report run variability rather than claiming a win from a single sample.

The baseline lock is `tests/baseline/artifact-lock.json`, checked by `tests/artifact-lock.mjs`. The project reports 230 frozen historical screenshot-reference hashes; never use snapshot update flags, `UPDATE_BASELINE`, reference-recording commands, or manual replacements as a routine fix. A proposed reference change needs explicit user authorization and separate review.

## Git, backup and publication safety

- Inspect branch, status and remote refs before work or publication. Keep changes on an appropriate task branch unless the user explicitly requests documentation on `main` or otherwise authorizes the target.
- Do not overwrite existing work. Do not reset, rebase, force-push, move/delete preservation tags, merge to `main`, deploy or publish without explicit authorization.
- Keep commits focused and include only authorized files. Before push, check the staged file list, run relevant checks, and confirm the intended remote branch head. Push only the authorized branch.
- GitHub Pages serves committed static output from the root of `main`; there is no checked-in Actions workflow to build it. Before an authorized release, ensure generated pages are up to date, the bilingual build and full release gate pass, and the frozen reference integrity check passes. Preserve the prior-site tag and main-only files unless explicitly directed otherwise.

## Known limitations and deferred risks

Current accepted/deferred items, verified at publication:

- The fixed 44×44 language switcher can overlap content at exceptionally short heights; accepted without a correction.
- A duplicate document fetch in generated `support.js` remains deferred because its source package is absent and editor/preview behavior could not be validated safely.
- Final controlled Lighthouse median budgets passed, but one English mobile LCP sample exceeded its median ceiling. This is lab data, not field performance.
- Responsive/accessibility validation was Chromium-based. It does not certify physical Safari/iOS behavior, hardware GPU behavior or complete WCAG conformance.
- `robots.txt` and `sitemap.xml` were absent and treated as optional for this launch. The full Figma visual-refinement phase and internal project case-study pages were not part of this release.

Use the current summary in `docs/PROJECT-STATUS.md` for present status. Older phase reports and dated status entries can describe resolved blockers; preserve them as history rather than treating them as current findings.

## Future page development

Build future project/case-study pages from the canonical content model and shared design tokens in `_ds/dsystem-023fcb25-9065-4256-8e64-9674caa319f6/tokens/`. Reuse `templates/partials/navbar.html` and the existing typography, color and spacing tokens; keep page-specific layout and content ownership clear. A case study may add components, styles and interactions when the feature genuinely needs them. Avoid unnecessary copies of shared components and competing owners; do not mistake that guidance for a ban on legitimate new page behavior. Add a route/template to the deterministic generator when static localized output is required, and validate both locale routes.

Do not load `portfolio-controller.js`, `support.js` page runtime, project media controllers or Footer WebGL solely to obtain the shared Navbar on a simple page. The 404 page is the current example: it uses the shared Navbar markup and isolated page styles without initializing homepage animation systems. Add only the runtime and styles a new page actually needs.
