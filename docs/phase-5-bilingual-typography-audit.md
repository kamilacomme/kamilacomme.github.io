# Phase 5 bilingual typography audit and acceptance rules

**Status:** Audit recorded; acceptance criteria apply to the relevant typography milestones. No copy or application typography has been changed by this audit.

## Current audit

- Generated French documents declare `<html lang="fr">`; the deterministic build changes the English page root to `<html lang="en">`. Verify both emitted routes in browser tests whenever the generator changes.
- Existing tablet ticket typography is authored at 32px title, 14px description and 12px tags; the tablet logo token is 20px and the Projects heading token is 48px. The shared tablet card and stage currently have no scaling transform. Browser tests must still measure effective sizes at each supported width rather than infer them from CSS declarations.
- The current stylesheet has no language-specific `hyphens`, `word-break` or `overflow-wrap` rules. It contains a few local `text-wrap: pretty` declarations. Natural wrapping and fit therefore need locale-specific browser coverage as each presentation migrates.
- A source scan found French punctuation/content candidates in `content/projects.json`: ordinary spaces before `?` and `:`, and straight apostrophes in several French phrases. Other layout overrides already use curly apostrophes. These are audit findings, not approved edits: preserve current copy until each proposed punctuation-only correction is listed and reviewed. `content/about.json` already contains nonbreaking spaces in French strings; do not normalize them to ordinary spaces.
- Existing `white-space: nowrap` declarations are localized to compact navigation/brand/status/button or legal-link elements. Review them in their owning responsive milestone; do not add blanket no-wrap behavior to prose or headings.

## Stable acceptance rules for Phase 5 typography milestones

1. Verify the generated root language (`fr` or `en`) and test the actual rendered French and English pages.
2. Respect French spacing before `; : ? !`, French quotation marks, apostrophes, and nonbreaking spaces for punctuation and names/numbers where French orthography requires them. Use English punctuation and quotation conventions on `/en/`.
3. Keep word breaking and hyphenation language-aware. Test natural wrapping at narrow, intermediate and wide widths; do not add blanket `white-space: nowrap`, arbitrary manual line breaks or shrink-to-fit/parent transforms.
4. Avoid awkward isolated final words, widows/orphans and poor heading wraps where browser layout can reasonably control them, while preserving natural responsive wrapping and approved copy.
5. Any copy/punctuation edit must be itemized in the milestone report and kept to a demonstrable correction; do not rewrite approved content as part of typography work.
6. Measure computed font family, weight, CSS size, line height and letter spacing plus the product of ancestor transforms and actual rendered boxes in both locales. Report exceptions instead of silently shrinking text.

## Incremental application

- **Milestone 4:** apply these rules when fitting the shared tablet tickets. Current portrait width correction must preserve effective 48px heading, 32px title, 14px description, 12px tags and 20px logo. Audit locale wrapping and clipping without changing copy.
- **Milestone 5:** validate desktop ticket copy and wrapping in both locales against the existing desktop design and iframe behavior.
- **Milestone 6:** apply locale-aware wrapping to About and Footer while preserving animation bounds and content.
- **Milestone 7:** audit mobile, 320px widths, short screens and browser zoom, including access to controls and text without transform shrinkage.
- **Milestone 8:** final bilingual acceptance includes both generated language attributes, typography measurements, content integrity and reviewed punctuation corrections.

