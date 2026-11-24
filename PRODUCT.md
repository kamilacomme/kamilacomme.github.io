# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: hiring managers and art directors evaluating Kamila Comme as a Brand & Digital Designer, for full-time or freelance roles. They arrive from a CV, a LinkedIn profile or a direct referral, usually on desktop, and decide in a short first visit whether the craft, range and judgment justify a conversation.

Secondary, not the first-visit priority: prospective clients looking for branding, web or motion work. The site should not turn away clients, but it is not optimized for them.

## Product Purpose

A bilingual (French `/`, English `/en/`) static portfolio presenting Kamila Comme's branding, web, illustration, packaging and motion work, plus a short About section covering education, employers, recognition and languages. Success means a visitor understands the range quickly, opens a project, and reaches Contact.

## Positioning

Art direction discipline carried across brand, web, motion and print, from a designer with a Master's in Art Direction and five years of professional practice. The claim a neighboring portfolio could not truthfully copy is the combination of a formal art-direction training and a range that moves from wellness-brand identity (for example the Pilates project, aimed at men aged 28–50) to digital, illustration and motion work.

## Operating Context

- Static site served from the repository root on GitHub Pages (`main`); no server runtime, no CMS.
- Generated pages are produced from `content/*.json` and `templates/` by `scripts/content/build.mjs`; visitors never see a build step.
- Projects currently link out to external case material (Behance, Readymag and similar). Internal case-study pages are planned: they will live on this site, share the homepage Navbar, Footer, tokens, grid and typography, and replace the external links project by project as each case study is ready.
- Evaluators will look at it on laptops and phones; the responsive profiles (desktop, tablet portrait/landscape, mobile) are all in scope.

## Capabilities and Constraints

- Six canonical projects in `content/projects.json`, rendered in both locales with a shared layered-ticket template on desktop/tablet and a separate editorial template on mobile.
- Localized About cards (education, employer, recognition, languages) from `content/about.json`.
- Bilingual navigation with a fixed FR/EN language switch; semantic route and scroll restoration across switches.
- WebGL curtain in the Footer, initialized lazily near the Footer; must respect reduced motion.
- Static output is committed; `content:build:check` must stay deterministic.
- 230 frozen historical screenshot references must not be updated as a routine fix.
- Supported minimum width is 320px; 44×44 language-switch overlap at exceptionally short heights is an accepted limitation.
- Physical Safari/iOS and field performance are not certified.

Terminology: "Projects" (not "Work" or "Portfolio" as section names), "About", "Contact", "Footer". Keep the French copy in French and the English copy in English; do not machine-translate one from the other without review.

## Brand Commitments

- Name: Kamila Comme. Title: "Brand & Digital Designer".
- Bilingual FR/EN as a permanent structure, not a toggle for a single language.
- Voice: direct, confident, slightly playful in project descriptions ("Building the body like an architect."); factual in About.
- The Pilates project's audience framing ("men 28–50, beyond the usual audience") is a deliberate positioning claim and should not be generalized away.

## Evidence on Hand

- Project records and imagery under `content/projects.json` and `assets/`.
- About facts in `content/about.json`: Master's in Art Direction (2026), Bachelor Designer Print & Digital (2024), employers Greenly (2024–2026) and Bene Bono (2023–2024), a TikTok reach figure of 450k views for a Readymag portfolio video, and two Behance selections.
- Absences future work must not fabricate: no client testimonials, no pricing, no availability or rate claims.
- Internal case-study pages are a planned part of the project. Each one is built only from the owner's real materials (briefs, process, deliverables, results she supplies); no invented facts, figures, quotes, clients or outcomes. Where material is missing, the page leaves the gap rather than filling it.

## Product Principles

1. The work leads. Project imagery and titles come before interface chrome.
2. Show range without diluting focus: art direction is the thread, digital is the proof.
3. Bilingual parity: both locales carry the same facts and the same visual weight.
4. Fluid, honest responsiveness: prefer natural reflow and shared gutters over scaling text to fit.
5. Restraint in motion: animation serves orientation and reading, and always yields to reduced-motion preferences.

## Accessibility & Inclusion

Target: WCAG 2.1 AA for the Chromium-verified responsive profiles, with keyboard access to all six project links, the language switch and the legal dialog, and visible focus states. Reduced motion must disable or pause the curtain and slideshow motion. Physical Safari/iOS validation remains outstanding.
