# Short-height Projects overlap review

These are review captures from the generated desktop Projects iframe and integrated tablet Projects layout at 100% browser zoom. They are not screenshot baselines.

The old bottom-anchored rail collided with the fixed heading. At 960×455, the tablet ticket started at y=113px while the heading ended around y=191px (about 78px of overlap). At the same CSS viewport, the desktop iframe ticket started around y=120px while its heading ended at y=229px (about 109px of overlap). At 1422×600, the desktop ticket started around y=175px against the same 229px heading bottom (about 54px of overlap). The existing tablet rail and desktop iframe geometry owners now keep a 24px gap. During each existing intro scroll interval, the heading and rail travel upward together; the complete ticket then sits above the 32px bottom gutter before horizontal rail motion begins. At the initial frame on very short screens, the lower part of the ticket is naturally below the viewport, but it never covers the heading. The ticket reaches its full unchanged size as the heading clears.

The desktop change is in the existing `measure()`/scroll mapping in `templates/desktop-project-embedded.html`; the tablet change is in the existing `fitLandscapeGeometry()`/`updateLandscapeScroll()` owner in `scripts/projects/tablet-project-layout.js`. Neither change resizes cards, changes crops, media, typography, ticket templates, project order or rail endpoints. At 1440×900 the established desktop composition remains unchanged, and approved standard tablet geometry is unchanged when there is sufficient height.

Focused French/English browser checks passed for integrated tablet Projects at 960×455 and the desktop iframe at 960×455 and 1422×600. They check the 24px heading-to-ticket gap at initial, intermediate, settled and rail-end positions, full ticket visibility after the intro, all six cards' final reachability, and the Projects-to-About boundary. The integrated desktop page test also passed at 1440×900, 1280×800, 1200×800, 1100×700 and 1422×600 in both locales. The approved standard tablet portrait/landscape ticket geometry checks passed 4/4. No full suite, Lighthouse or screenshot-reference update was run.

## Open the screenshots from a terminal

After updating your existing checkout, from `~/Downloads/portfolio-phase5-preview` run:

```bash
xdg-open docs/phase-5-projects-short-height-review/captures/projects-fr-960x455-start.png
xdg-open docs/phase-5-projects-short-height-review/captures/projects-fr-960x455-ticket-visible.png
xdg-open docs/phase-5-projects-short-height-review/captures/projects-fr-1422x600-start.png
xdg-open docs/phase-5-projects-short-height-review/captures/projects-fr-1422x600-ticket-visible.png
xdg-open docs/phase-5-projects-short-height-review/captures/tablet-projects-fr-960x455-start.png
xdg-open docs/phase-5-projects-short-height-review/captures/tablet-projects-fr-960x455-ticket-visible.png
```

English equivalents use `projects-en-…` or `tablet-projects-en-…`. Each size also has `reflow` and `rail-end` captures. The start/reflow/ticket-visible images form the short vertical transition; `rail-end` shows the same ticket rail after horizontal travel. `projects-…` shows the isolated iframe, while `tablet-projects-…` shows the integrated responsive site including its heading and navbar.

## Interactive local preview

From the existing checkout, run `PORT=8025 node tests/runtime/server.mjs` and open `http://127.0.0.1:8025/` (French) or `http://127.0.0.1:8025/en/` (English). Scroll into Projects to see the normal integrated transition. For the isolated iframe geometry, open `http://127.0.0.1:8025/desktop-project-embedded.html` or `/en/desktop-project-embedded.html`; set the browser viewport to 960×455 or 1422×600.
