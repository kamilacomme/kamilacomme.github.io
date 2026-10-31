# Website Creation Playbook

**Draft for personal learning and review.** This is a practical guide to planning and building websites with AI coding assistants. It is not a mandatory recipe: choose the lightest process and architecture that support the site’s content, design, interactions and maintenance.

## How to use this guide

- **Lesson from this project** means the point is supported by the portfolio’s repository history, reports or release evidence. It describes one project and does not prove the same choice is right everywhere.
- **General recommendation** means broadly useful advice. Adapt it to your budget, technical support, privacy needs and risk.

AI can research, propose, code, measure and test. You remain the authority on purpose, content, visual direction and whether a result feels right. Agree on the outcome before asking an assistant to translate a screenshot, Figma frame or bug report into implementation details.

## One-page quick start

- [ ] Define the site's goals, audience, content and essential visitor actions.
- [ ] Choose the simplest architecture and hosting that support those needs.
- [ ] Establish design tokens and identify components that are genuinely shared.
- [ ] Define responsive relationships and supported ranges, including relevant height constraints.
- [ ] Set up Git, a working local preview and concise project-specific AI instructions.
- [ ] Implement in small stages with clear owners and agreed acceptance criteria.
- [ ] Run focused tests and review actual browser captures; approve visual changes yourself.
- [ ] Complete launch checks, preserve a recoverable backup and authorize publication explicitly.

Use the ten phases below when you need more detail. Scale the process and testing to the site's complexity and risk.

## 1. Discovery and planning

**Goal:** decide what the website must do and how you will recognize success before choosing technology or writing code.

### Prepare or decide

- **Purpose and audience:** Who is the site for? What should visitors understand or do?
- **Content inventory:** List pages and content you have: text, images, video, documents, project details, contact information and translations. Mark what is final, missing, private or temporary.
- **Page map:** Sketch pages and how visitors move between them. A portfolio might include Home, projects, About, Contact, legal information and a not-found page. A single-page site may need fewer routes.
- **Features:** Separate launch essentials from later ideas. Examples include search, forms, filters, animation, language switching and a CMS.
- **Constraints:** Note timing, budget, domain/hosting, editing skills, privacy, accessibility and third-party services.
- **Quality goals:** Define “done” for content, navigation, mobile usability, accessibility, speed, browser support, backup and publication.

### AI can

Turn a brief into an inventory, page map, prioritized features, risks, missing questions and observable acceptance criteria. “All contact methods work on mobile” is more testable than “make it polished.”

### You review or approve

The audience, message, content authority, launch scope, visual identity, privacy/legal decisions and what can wait.

### Checklist

- [ ] Purpose, audience and main visitor action are clear.
- [ ] Pages, content, locales and content owners are listed.
- [ ] Essential features are separate from later ideas.
- [ ] Constraints and definition of done are recorded.

**Reusable prompt**

> Help me plan a website for [audience and purpose]. Here is my content and my constraints: [details]. Propose a page map, content inventory, essential features, risks and a testable definition of done. Mark assumptions and questions instead of inventing answers. Do not choose a framework yet.

**Warning signs:** “build me a website” without a purpose; placeholder content treated as approved; technology chosen before content is understood; every idea considered launch-critical.

## 2. Choosing the architecture

**Goal:** choose a structure that serves the site and remains understandable to the people who update it.

### Prepare or decide

Think about how often content changes, who edits it, how interactive it is, whether it needs accounts or private data, what the host supports and who will maintain it.

- **Static site:** the server sends prepared files such as HTML, CSS, images and JavaScript. Often suitable for portfolios, marketing sites and documentation. It can be fast and simple to host; a form, search or CMS may still require a service.
- **Dynamic site:** the server creates or retrieves content as visitors use the site. Useful for frequently updated, personalized, transactional or account-based experiences; it adds runtime, security and hosting needs.
- **Hybrid site:** prebuilt pages for some routes, server or client features where needed.
- **Tools/frameworks:** choose based on real needs, team familiarity, hosting, accessibility and support. A framework is optional; a small site may be easier with plain HTML/CSS/JavaScript or a static generator.
- **Content structure:** decide whether repeated pages use structured records, a CMS or individual files. Separate content from presentation when pages share fields.
- **Routes/localization:** plan stable URLs, translated content, metadata, language switching and not-found behavior.
- **Hosting:** verify how files reach the host. Some platforms run a build; others serve only committed or uploaded files. Check forms, redirects, headers, storage and domains.

### AI can

Compare a few options against requirements, draft a content schema, identify repeated page structure, and check whether the host supports the build and server features. Ask it to state assumptions.

### You review or approve

Maintenance burden, external services, privacy, costs, editing workflow and the trade-off between simplicity now and extensibility later.

### Checklist

- [ ] Tool choice follows from content and behavior needs.
- [ ] Source content and generated/runtime output are distinguished.
- [ ] Routes and localization behavior are planned.
- [ ] Hosting supports the output and required features.
- [ ] Ongoing maintenance is realistic.

**Reusable prompt**

> Compare static, dynamic and hybrid approaches for this site: [requirements]. Include hosting fit, editing workflow, security/privacy, cost and maintenance. Recommend the simplest option that satisfies the requirements and identify what needs an additional service.

**Warning signs:** complex tools for a few mostly static pages; assuming a host runs a build without checking; duplicated content across layouts; adopting a CMS before deciding who uses it.

**Lesson from this project:** canonical bilingual records and deterministic static French/English output suited this portfolio. GitHub Pages served repository-root files, so generated output was committed rather than built by Pages. That was right for this deployment, not a universal rule. See [Phase 4](phase-4-report.md).

## 3. Designing in Figma

**Goal:** describe the intended experience, not just attractive screenshots.

### Prepare or decide

- **Tokens:** name reusable colors, typography, spacing, radii and other decisions (for example, page gutter or mobile heading).
- **Typography:** specify font, size, weight, line height, letter spacing and emphasis. Test actual long text.
- **Components:** design repeated items such as buttons, navigation, cards and dialogs with variants and states.
- **Compositions:** create representative desktop, tablet and mobile frames. Add unusual width or height examples to answer a question, not to represent every device.
- **Responsive relationships:** annotate what aligns, wraps, grows, stacks, scrolls, clips, hides or stays fixed, and why.
- **Constraints:** note usable width/height, image ratios, safe spacing, variable content and what must remain reachable.
- **Interaction states:** show hover, keyboard focus, active, disabled, loading, error and reduced-motion expectations where relevant.
- **Handoff:** record frame dimensions, input assumptions, content assumptions, behavior between frames and what remains fixed/fluid.

### AI can

Inventory accessible Figma frames, identify repeated values, suggest token names, compare variants, create a behavior matrix and list missing annotations. It must say when it cannot inspect a node; it must not invent measurements.

### You review or approve

Hierarchy, brand fit, copy, imagery, translations, visibility changes and motion. Mark which proposals are approved and which are experiments.

### Checklist

- [ ] Tokens and components are named consistently.
- [ ] Frames cover representative width and height conditions.
- [ ] Transitions and layout relationships are annotated.
- [ ] Long-content, focus and error states are considered.
- [ ] Approved designs are distinguished from stress concepts.

**Reusable prompt**

> Review these Figma frames/specifications. Separate exact dimensions and observable facts from interpretation. Identify what stays fixed, wraps, grows, scrolls or changes visibility; separate width-driven and height-driven behavior. Flag missing transitions. Do not invent breakpoints or claim access to nodes you cannot inspect.

**Warning signs:** one frame per device with no transition rules; unexplained absolute coordinates; no long-content or focus states; assuming a frame size is automatically a CSS breakpoint.

**Lesson from this project:** Figma snapshots informed composition but did not specify transitions. Some Hero examples changed width and height together, so they could not isolate a height rule. Grouping frames by relationships avoided a breakpoint for every artboard. See the [Figma coverage matrix](phase-5-m10-figma-coverage.md).

### Design-to-development gate

Before substantial implementation, confirm the page and content structure, approved representative Figma layouts, responsive behavior rules, interaction states, architecture and acceptance criteria. The AI should list unresolved decisions and ask for direction where they affect the outcome; it must not fill gaps by inventing design rules or behavior.

## 4. Setting up AI development

**Goal:** make the project inspectable, recoverable and easy to work on in small increments.

### Prepare or decide

- Organize source, content, assets, tests, documentation and generated output.
- Use Git branches and commits to keep unfinished work separate from published work.
- Set up a local preview that serves the real site, assets and interactions.
- Record approved designs, source owners, test commands and known limitations.
- Write project-specific AI instructions for architecture, generated files, review boundaries and deployment.
- Decide whether AI roles are useful: for example, one implementer and read-only reviewers for architecture, accessibility or browser QA. Share captured evidence rather than duplicating expensive test runs.

### AI can

Inspect the repository and propose a directory map, draft instructions from verified code, set up a preview after approval, and summarize the change’s file scope and risks.

### You review or approve

Branch and backup policy, deployment permissions, visual review boundaries, tool access and what files/data may be shared with AI systems.

### Checklist

- [ ] There is a recoverable starting commit and branch plan.
- [ ] Local preview instructions work.
- [ ] AI instructions use real paths and commands.
- [ ] Approved designs and known limitations are recorded.
- [ ] Generated output and frozen references have clear rules.

**Reusable prompt**

> Inspect this repository without editing it. Map source files, generated output, test commands, preview setup, release path and current ownership. Identify outdated instructions and risks. Draft concise contributor instructions with exact paths and commands; do not invent missing source owners.

**Warning signs:** editing before checking Git status; relying on screenshots instead of the real application; deployment access before review practices exist; multiple agents modifying the same files at once.

**Lesson from this project:** the distinction between generated pages and their templates mattered, and browser captures exposed behavior static screenshots could not. The portfolio’s [AGENTS.md](../AGENTS.md) documents its own owners and commands; do not copy those project-specific paths into another site.

## 5. Building the website

**Goal:** implement the agreed structure and behavior without making every page a special case.

### Prepare or decide

- **Semantic structure:** use elements that describe purpose—headings, navigation, main content, sections, forms and buttons. This supports screen readers, keyboard users, search and future edits.
- **Shared components:** reuse when markup, behavior and design are genuinely shared; allow separate structures where hierarchy or interaction differs.
- **Content-driven layouts:** let text, cards and sections grow. Store translations in a clear source rather than duplicating whole pages casually.
- **CSS layout:** Grid arranges rows and columns; Flexbox arranges a row or column. Intrinsic sizing, minmax, wrapping and max-width often express layouts naturally.
- **Typography:** use real font sizes and line heights. clamp can fluidly interpolate within approved limits; do not shrink a text-bearing container to match a screenshot.
- **Animation/media:** specify what animates, when it starts/stops, offscreen behavior and reduced-motion treatment. Load large media when useful rather than unconditionally.
- **Accessibility:** provide meaningful names, keyboard operation, visible focus, contrast, useful text alternatives and reduced-motion behavior for nonessential movement.
- **JavaScript geometry:** use it only when CSS cannot express a real need—for example, mapping vertical scroll to a horizontal rail or preserving a focused content anchor when geometry changes. Keep calculations in the component that owns them.

Avoid JavaScript for ordinary alignment, responsive columns, wrapping or spacing CSS can handle. Measurement code brings timing, font-loading, resize, scroll and cleanup concerns.

### AI can

Implement a small approved change in its existing owner, explain source-to-output relationships, check semantics/translations/links, and identify possible duplication before proposing a refactor.

### You review or approve

Copy, imagery, hierarchy, interaction feel, meaningful component boundaries, and all visual changes in the browser.

### Checklist

- [ ] Source of truth is clear for content, markup, styles and behavior.
- [ ] Landmarks, headings and controls have appropriate semantics and names.
- [ ] Shared components have one maintained source where appropriate.
- [ ] Content wraps and grows without clipping essential text.
- [ ] JavaScript geometry solves a measured need and has one owner.
- [ ] Keyboard, focus and reduced-motion behavior are considered.

**Reusable prompt**

> Implement [specific approved behavior] in the existing owner. Identify source and generated files first. Preserve approved visual states and unrelated behavior. Prefer semantic HTML and CSS over JavaScript geometry. Make the smallest change, add a focused test, and report files, evidence, risks and anything not verified.

**Warning signs:** giant components with unrelated responsibilities; copied navigation markup; overrides accumulating; hidden duplicate controls; JavaScript measurements for ordinary CSS layout.

**Lesson from this project:** canonical content reduced 48 locale/layout project rows to six records; three card templates replaced 18 authored shells. Mobile editorial Projects remained distinct from desktop/tablet layered cards because their composition and interaction differed. Reuse should remove accidental duplication, not meaningful design differences. See [Phase 4](phase-4-report.md).

## 6. Responsive implementation

**Goal:** adapt between design references across both screen width and height.

### A practical method

1. **Define supported ranges.** Choose a practical minimum width, ordinary desktop/tablet/mobile examples, relevant input modes and a few resilience cases. Do not imply every possible window was tested.
2. **Define relationships.** State what aligns, wraps, shrinks, scrolls or stays fixed. Ask “does this content fit?” before choosing a breakpoint.
3. **Try CSS first.** Use fluid width, max-width, Grid/Flexbox, minmax, clamp and natural wrapping. A media query suits a genuine behavior change; a container query can suit a component responding to its own available width.
4. **Separate width and height constraints.** Width changes line length and columns. Height affects vertical room, sticky content, fixed controls and media. Frames changing both dimensions do not isolate a single cause.
5. **Keep content reachable.** If a fixed composition cannot fit, allow natural growth and document scrolling. Use a horizontal rail only when every item is reachable by pointer, touch and keyboard.
6. **Use JavaScript only for real measured fit decisions.** If behavior depends on actual text, media, navbar clearance or geometry, an existing component owner may need measurement. Recalculate when inputs change and avoid multiple writers.
7. **Test between reference frames.** Include longer translations, font completion, intermediate sizes, repeated resize both ways, scrolling and section transitions. Record the actual profile; touch/pointer characteristics may matter.
8. **Review visually.** Use screenshots and bounds together. Tests can prove reachability; you decide whether the composition looks right.

Understand svh, lvh and dvh (small, large and dynamic viewport-height units), especially on mobile where browser controls affect visible height. Use them deliberately. Do not add height breakpoints without a behavior need.

### Prepare, AI, your review and checklist

- **Prepare:** approved normal layouts, content edge cases, support limits, fixed/sticky elements and resize expectations.
- **AI can:** build a width/height behavior matrix, measure browser rectangles, probe existing transition boundaries and compare CSS with existing geometry ownership.
- **You review:** whether fallbacks preserve the design, readability and access, and whether proposed mode changes are acceptable.
- [ ] Test width- and height-constrained cases separately.
- [ ] Check intermediate sizes, not just Figma dimensions.
- [ ] Check wrapping, type size, clipping and scroll reachability.
- [ ] Resize both directions and preserve semantic focus where feasible.
- [ ] Avoid per-device patches and unnecessary scaling/controllers.

**Reusable prompt**

> Given these approved layouts and requirements, propose the fewest content-driven behaviors that cover intermediate sizes. Separate width from height. Identify existing geometry ownership, CSS-first options, fallback/scroll behavior and focused browser tests. Do not add a breakpoint per reference frame or change approved normal compositions.

**Warning signs:** shrinking text because the page is short; essential content cut off; fixed controls covering content; a layout that works only after manual resize; a new media query for each screenshot; profile inferred from width alone.

**Lessons from this project:** short-height work took repeated iteration because navbar clearance, heading wrapping, media aspect ratios, section travel, language length and scroll lifecycle interacted. The browser could clamp scroll before geometry was ready; preserving semantic section/project identity worked better than insisting on identical scrollY. See the [retrospective](PROJECT-RETROSPECTIVE.md) and [Figma matrix](phase-5-m10-figma-coverage.md).

## 7. Testing and visual QA

**Goal:** find behavior, appearance, accessibility and performance defects without mistaking stale tests for real failures.

### Prepare or decide

- Match testing effort to risk. A small brochure site may need smoke checks; a bilingual animated portfolio with complex scrolling justifies more.
- Separate content/build, functional, responsive, accessibility and performance checks.
- Choose representative languages, viewports, browsers and input modes.
- Approve visual references before treating them as a baseline. Keep references immutable unless a baseline update is explicitly reviewed.
- Use screenshots and DOM measurements together: bounds document geometry, screenshots help a person judge hierarchy and appearance.

### Investigating a failure

1. Reproduce the exact route, language, input profile, viewport, starting state and action.
2. Capture actual browser state, bounds, computed styles, console/network output and trace when useful.
3. Compare semantic behavior with the requirement, not just an old coordinate.
4. Classify it as application, timing/lifecycle, environment, test instrumentation, stale expectation or approved behavior.
5. Fix the cause in its owner. Correct instrumentation only with evidence; preserve the underlying behavior assertion.
6. Run focused bilingual/profile regressions, then broader tests when warranted.

### Accessibility and performance

Check keyboard operation and visible focus, dialogs, names/landmarks, contrast on actual backgrounds, image alternatives, reduced motion and reachability. Automated scanners identify candidates but do not certify complete accessibility.

Measure performance with consistent browser, host, throttling and configuration. Use multiple samples; interleave variants where timing bias is possible; report medians and ranges; inspect traces before blaming a library. Lab results are not real-user results. Do not remove approved animation or change budgets just to improve scores.

### AI can and you review

- **AI can:** write focused browser checks, compare geometry, inspect traces, run accessibility tools and summarize repeated measurements.
- **You review:** visual changes, actual wording/contrast, essential keyboard journeys and trade-offs with design.

### Checklist

- [ ] Tests represent user behavior, not only selectors or URLs.
- [ ] Relevant locales and input/profile variants are covered.
- [ ] Resize and transitions are tested if geometry changes.
- [ ] Focus and reduced motion are checked in a browser.
- [ ] Review captures do not overwrite historical references.
- [ ] Failures are diagnosed, not silenced.

**Reusable prompt**

> Investigate this failing check without changing code first. Reproduce exact browser conditions; capture semantic state, geometry, focus, console/network output and timing. Classify the failure. Preserve the assertion’s intent; do not add arbitrary sleeps, force clicks or update baselines to obtain a pass.

**Warning signs:** one green run treated as a performance guarantee; snapshots replaced to hide differences; absolute scroll used where content identity matters; timeouts increased without diagnosis; full suites repeated when a focused test can isolate the issue.

### Stop refining

Separate concrete defects from optional polish. Fix genuine functional bugs, accessibility or content-reachability failures, and mismatches against an approved design. Once supported layouts pass the agreed criteria and have visual approval, defer marginal extreme-viewport refinements unless they address a specific defect or a new user need. Do not keep adding exceptions just to improve an already accepted screenshot.

**Reusable visual-review prompt**

> Compare the current and proposed browser captures at the listed routes and viewports. Report observable differences in layout, typography, spacing, imagery, animation and interaction, and note any functional or accessibility issue. Separate required corrections from optional preferences. Do not change code or infer my approval. Ask me to explicitly approve or reject the visual result.

**Lesson from this project:** all 230 frozen historical screenshot-reference hashes were preserved. Some failures were real, while others came from stale coordinate assumptions or early measurements. Controlled Lighthouse medians passed budgets, but one English mobile LCP sample exceeded its median ceiling; variability stayed in the report. See the [retrospective](PROJECT-RETROSPECTIVE.md).

## 8. Publication

**Goal:** publish reviewed files and verify the deployed site at its public URLs.

### Prepare or decide

- Add titles, descriptions, canonical URLs and language relationships such as hreflang where appropriate.
- Check social-sharing metadata/images, favicon and browser/mobile icons.
- Provide a useful 404 page that retains an error response rather than silently redirecting. Localize it if the routes are localized.
- Decide whether robots.txt and a sitemap benefit this site; they are not automatically launch requirements for every site.
- Verify forms, privacy/legal content, external links, redirects, HTTPS, domain, caching and deployment source.
- Make a release checkpoint: reviewed diff, build, appropriate tests, backup and rollback plan.

### AI can and you review

- **AI can:** audit metadata and links, explain deployment mechanics and verify public URLs after deployment.
- **You review:** final content and appearance, domain, legal/privacy text, launch timing and go/no-go.

### Checklist

- [ ] Production output is up to date.
- [ ] Diff contains only intended files.
- [ ] Appropriate tests pass; references remain intact.
- [ ] Previous release can be recovered.
- [ ] Live home, language routes, core links, 404 and assets work.
- [ ] Metadata and social preview resolve.

**Reusable prompt**

> Audit this site before publication. Check metadata, language links, icons, social images, internal URLs, 404 status, hosting/build behavior and release diff. Separate verified responses from assumptions. Do not deploy or change settings; give me a go/no-go checklist.

**Reusable publication-authorization prompt**

> Prepare this release for my explicit publication decision. Verify the exact branch, commit and remote ref; confirm the working tree and release diff; run the agreed build and test gates; verify backups and rollback steps; and list the deployment action and live-site checks. Stop before merging, pushing to the publication branch or deploying. Report any changed ref, unexpected file, failed check or missing backup and wait for my authorization naming the exact release commit.

**Warning signs:** local preview is the only check; assuming static host runs a build; 404 returns success or redirects away; missing metadata/assets; pushing before checking remote branch and diff.

**Lesson from this project:** the prior version was preserved with a tag; release used a regular merge, retained a main-only privacy page and verified public language routes, 404s and assets. That process matched a high-visibility published portfolio; a small landing page may need less ceremony. See [Project Status](PROJECT-STATUS.md).

## 9. Maintenance and future development

**Goal:** keep future changes understandable without freezing the site or overengineering it.

### Prepare or decide

- Maintain a short status page with current release, owners, commands, accepted limitations and deferred risks. Mark dated notes as historical.
- Keep content updates in the canonical source; regenerate output where the host serves committed files.
- For each feature, identify owners for markup, data, geometry, animation and tests.
- Review dependencies and services when their value changes; do not upgrade everything by default.
- Keep real user needs and measured defects separate from speculative cleanup.

### AI can

Summarize changes, update docs, locate affected tests, inspect generated output and propose a small plan.

### You review or approve

Whether a feature is worthwhile, deserves a new dependency/service, changes design or warrants publication.

### Checklist

- [ ] Current source owner and focused test are documented.
- [ ] Resolved issues are not listed as current blockers.
- [ ] Generated output matches its inputs.
- [ ] Shared components are reused where appropriate without erasing legitimate differences.
- [ ] Release decisions and backups remain understandable.

**Reusable prompt**

> Review this feature against the architecture and maintenance needs. Identify owner, source files, repeated behavior, risks and the smallest plan. Distinguish a genuine shared component from visual coincidence. Do not refactor unrelated areas.

**Warning signs:** stale status docs; cleanup that erases intentional layout differences; rewrites without a measured reason; a new controller duplicating an existing owner.

## 10. Mistakes and lessons from this project

These are events from the portfolio’s documented history, not universal failure rates.

| What happened | Why | What worked / how to avoid it |
| --- | --- | --- |
| Text-bearing areas relied on whole-container scaling. | Scaling made a composition appear to fit but shrank text and coupled geometry to transforms. | Use independently readable type and content-driven sizing; preserve transforms only for intentional image-only art. |
| Figma frames tempted one-breakpoint-per-frame implementation. | A frame is a snapshot; some examples changed width and height together. | Annotate relationships and transitions, group equivalent stages and test intermediate dimensions. |
| Short-height layouts appeared to fit, then failed with real content or resizing. | Navbar clearance, wrapping, media, section travel, language length and scroll lifecycle interacted. | Test combined widths/heights, fonts, content, scrolling and repeated resize; allow natural flow when needed. |
| One section’s controller measured or positioned another. | Responsibilities grew over time and multiple scripts wrote related geometry. | Map ownership first; publish shared viewport/gutter inputs once; consolidate only confirmed conflicts. |
| Preserving absolute scroll restored the wrong place. | Localized text and responsive layout change section lengths and positions. | Preserve semantic project/section identity; allow later user input to supersede pending restoration. |
| Bilingual project data repeated across layouts. | Content was coupled to page copies and runtime translation. | Canonical data and static generation reduced 48 project locale/layout rows to six project records and 18 card shells to three templates, while retaining distinct presentations. |
| A failing test sometimes disagreed with a settled browser screenshot. | Some tests measured too early or assumed an absolute coordinate; others found real bugs. | Reproduce exact conditions and inspect settled semantic state before correcting the app or test. |
| Automated checks passed but visual composition still needed review. | Geometry and interaction assertions cannot judge hierarchy or feel. | Compare actual before/after captures and get human approval for meaningful visual changes. |
| Performance varied and differed by language. | Lab runs are sensitive to environment, media and content; metrics can move in opposite directions. | Interleave repeated runs, inspect traces, report ranges and preserve budgets. |
| Historical visual references risked changing during redesign. | Approved designs evolved beyond earlier screenshots. | Keep frozen references immutable; use separate review captures and authorize baseline changes explicitly. |

**Lesson from this project:** the largest process improvement was moving from “make this screenshot fit” to “define the relationship, owner and fallback.” A new project can apply that principle with lighter tooling when its risk is lower.

## Glossary

- **Accessibility (a11y):** designing so people can use the site with different abilities and tools, including keyboard and screen readers.
- **Breakpoint:** a condition at which layout behavior changes, usually because available space or interaction needs changed—not merely because a device has a familiar name.
- **Canonical content:** the authoritative content record from which pages or locales are generated.
- **Component:** a reusable interface part with defined markup, styling and possibly behavior.
- **CSS Grid / Flexbox:** browser layout tools. Grid arranges rows/columns; Flexbox lays items along one main direction.
- **Design token:** a named reusable design value, such as a color, type size or spacing.
- **DOM:** the browser’s tree of elements, text and controls.
- **Generated output:** files produced from source/templates by a build step; some hosts require these files to be committed.
- **Geometry owner:** the component or script responsible for measuring and setting a layout region’s responsive positions and sizes.
- **Git branch / commit / tag:** a branch is a line of work, a commit is a saved state, and a tag is a named pointer often used to preserve a release.
- **Hydration/runtime rendering:** browser code attaching behavior or updating interface elements after initial HTML loads.
- **IntersectionObserver:** a browser feature reporting when an element approaches or enters a visible region; often useful for lazy loading.
- **Localization / internationalization:** localization adapts content for language/region; internationalization structures a site to support those variations.
- **Lighthouse:** a lab tool auditing performance and other quality signals under configured conditions; it is not field data or human review.
- **Natural flow:** ordinary document layout where content takes the height it needs and visitors scroll to reach it.
- **Semantic continuity:** preserving the same meaningful content or section across layout/language transitions even if pixel coordinates change.
- **Static site:** a website delivered as prepared files rather than generating each page on a server for every visitor.
- **Viewport:** the visible browser area available to the page; mobile browser controls can change its effective height.
- **WebGL:** a browser graphics interface for GPU-rendered visuals such as simulations; it adds performance and compatibility considerations.
- **Visual baseline:** an approved screenshot used for comparison, not a file to update automatically when a test fails.

## Project sources and evidence

For portfolio-specific facts, see the [Project Retrospective](PROJECT-RETROSPECTIVE.md), [current Project Status](PROJECT-STATUS.md), [Phase 5 plan](phase-5-plan.md), [Figma coverage matrix](phase-5-m10-figma-coverage.md), [Phase 2](phase-2-report.md), [Phase 3](phase-3-report.md), [Phase 4](phase-4-report.md), [responsive QA harness](phase-5-responsive-qa-harness.md) and [performance measurement protocol](performance-baseline.md). Current status takes precedence over dated checkpoint notes. General recommendations here are not claimed as measured portfolio results.
