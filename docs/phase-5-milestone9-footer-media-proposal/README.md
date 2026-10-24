# Footer media removal — mobile visual proposal

This is a browser-only comparison against the current generated site. Playwright intercepted fresh page responses for the proposal and removed the Footer media markup/resource-map entry, then changed only the existing mobile `fitFooter()` top calculation from `headTop + 72px` to `headTop`. No application/template/CSS/JavaScript files were changed. The proposal does not insert a spacer. Both captures were taken after navigating to the settled, fully closed Footer curtain.

The 72px movement follows the current mobile geometry: the heading is positioned at `headTop + 72px`, where `headTop = max(Footer frame top + 96px, Navbar bottom + 24px)`. The proposal places the heading directly at `headTop`. The remaining heading/email group, contact block, legal links, shared gutters, curtain, and fixed switcher retain their current geometry.

| Locale and CSS viewport | Current | Proposed |
|---|---|---|
| French 320×568 | [open capture](current-fr-320x568.png) | [open capture](proposed-fr-320x568.png) |
| French 390×844 | [open capture](current-fr-390x844.png) | [open capture](proposed-fr-390x844.png) |
| English 320×568 | [open capture](current-en-320x568.png) | [open capture](proposed-en-320x568.png) |
| English 390×844 | [open capture](current-en-390x844.png) | [open capture](proposed-en-390x844.png) |

## Measured comparison

All coordinates are CSS pixels in the final Footer viewport after the curtain settled.

| Locale / viewport | Heading top, current → proposal | Heading block bottom, current → proposal | Contacts top | Legal bottom / switcher bottom | Shared gutter X / bottom |
|---|---:|---:|---:|---:|---:|
| FR 320×568 | 168.28 → 96.28 | 273.84 → 201.84 | 444.28 | 544.28 / 544 | 16 / 24 |
| EN 320×568 | 168.28 → 96.28 | 344.22 → 272.22 | 444.28 | 544.28 / 544 | 16 / 24 |
| FR 390×844 | 168.48 → 96.48 | 274.05 → 202.05 | 720.48 | 820.48 / 820 | 16 / 24 |
| EN 390×844 | 168.48 → 96.48 | 309.23 → 237.23 | 720.48 | 820.48 / 820 | 16 / 24 |

In every proposed view, the media is absent; the heading remains 32px; horizontal overflow is false; the contact group, legal links, and language switcher coordinates are unchanged. At 320px, the longest English block ends at y=272.22px and contacts begin at y=444.28px, leaving 172px between them. The legal link text remains clear of the switcher's 44px circle. There were no page errors in any capture.

The curtain image/script is still present and unchanged in the browser prototype. The switcher remains at right=16px and bottom=24px. This is a visual/geometry proposal only, not proof of the final generated DOM or network lifecycle; those require the authorized source change and focused tests after visual approval.

The original `assets/about/footer-walk.mp4` remains untouched. The temporary response transform removes its Footer-only markup/meta/map references from the proposed browser page so the fresh-load preview mirrors the requested implementation. The source checkout remains unchanged.

`measurements.json` contains the raw DOM rectangles and route details. `gallery.html` opens the eight actual captures together in a local browser.
