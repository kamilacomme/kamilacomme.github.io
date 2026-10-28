# Tablet About and Projects check — 716 × 555

Source: `10fa74ee63738e2e393f69c685a1121b38587c11` on `phase-5/fluid-responsive` (clean tree). Browser-only proposal CSS; no application code changed.

## Tablet About

| Page / size | Full statement box | Stage | Effective type | Current collision |
|---|---:|---:|---:|---|
| FR 716×555 | 496.7px tall, x=32..684, y=73.2..569.8 | 716×555 | 48px; stage scale 1 | 14.8px below the stage; first card starts y=447.6 and covers 122.2px of the statement at section progress 0 |
| EN 716×555 | 386.3px tall, x=32..684, y=128.3..514.7 | 716×555 | 48px; stage scale 1 | first card starts y=447.6 and covers 67.1px of the statement at progress 0 |
| FR 500×600 (approved existing short mode) | visible excerpt 386.3px, x=32..468, y=150.9..537.2 | 500×600 | 48px; stage scale 1 | excerpt fits; existing cards enter one at a time after scrolling |
| EN 500×600 (approved existing short mode) | visible excerpt 331.1px, x=32..468, y=178.4..509.6 | 500×600 | 48px; stage scale 1 | excerpt fits; existing cards enter one at a time after scrolling |

Cause: the short-copy policy is gated by `compact && fh <= 700`. At 716px the current 4-column measure is about 201.3px, one pixel above the strict `<200px` compact cutoff. The implementation therefore keeps the full statement and the normal tablet grid. Its first card uses the normal-grid `prog + 0.45` entrance offset, so it has already risen into the text at progress zero. This explains both the clipped French line and the English overlap. There is no scale transform on the About stage; the text remains 48px.

Temporary 716×555 proposal: apply the existing approved short-copy policy whenever the complete statement exceeds the available height, independent of the card-width compact flag; show a complete opening sentence at 48px; then use the same five card nodes in the existing one-at-a-time 264px stack as the 500×600 layout. The whole paragraph stays in the DOM; no copy is deleted. The sequence is scroll-linked and uses the existing controller, with no timer. Screenshots show progress 0, .42, .82, 1.05, and 1.8 viewport-heights. This is a preview only, not adopted or committed.

The 834×1112 French tablet capture shows the current regular composition and remains unchanged: the full statement ends at y≈783 and the first card begins at y≈820.

## Projects at 716×555

The tablet Projects rail is in landscape horizontal mode. Its section starts at document y=555, is 3975px high, and ends at y=4530, exactly where About starts. The sticky viewport is 716×555. Six 652px cards with 32px gaps form a 4072px rail. The translation range is 3420px (`32 + 4072 + 32 - 716`), exactly the section's scroll allocation (`3975 - 555`). At the endpoint the last card, Napoli, occupies x=32..684, within the 32px page gutters. All six canonical links remain reachable.

Partial cards at the left/right viewport edges during travel are intentional horizontal-rail visibility. At the opening and endpoint one entire card is shown; inner panels, image, text, tags and barcode remain inside their cards. There is one separate, small visual crop: the outer background cards are 581.8px high, so the 555px viewport clips 26.8px from their bottom background edge. The inner panel bottoms are at y=512.9–517.8 and remain fully visible. No Projects code or approved ticket architecture was changed.

## Capture details

Chromium clean context, CSS viewport sizes exactly as in image names, DPR 1, iPad tablet user agent, French `/` and English `/en/` static routes. Each frame is an actual browser screenshot. The comparison sheets are in `visual-comparisons/`; individual captures and JSON geometry records are alongside this file.
