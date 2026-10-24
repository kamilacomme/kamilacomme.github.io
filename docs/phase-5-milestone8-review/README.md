# Milestone 8 language-switcher review

This is a review-only capture set for the current Milestone 8 implementation. These images are not visual baselines and do not replace the original references.

| Profile | CSS viewport | French | English |
| --- | ---: | --- | --- |
| Desktop | 1440×900 | [desktop-fr.png](desktop-fr.png) | [desktop-en.png](desktop-en.png) |
| Wide desktop | 1905×963 | [desktop-wide-fr.png](desktop-wide-fr.png) | [desktop-wide-en.png](desktop-wide-en.png) |
| Tablet landscape | 1194×834 | [tablet-landscape-fr.png](tablet-landscape-fr.png) | [tablet-landscape-en.png](tablet-landscape-en.png) |
| Tablet portrait | 834×1112 | [tablet-portrait-fr.png](tablet-portrait-fr.png) | [tablet-portrait-en.png](tablet-portrait-en.png) |
| Mobile | 393×852 | [mobile-fr.png](mobile-fr.png) | [mobile-en.png](mobile-en.png) |

To review the interactive preview from the Phase 5 checkout on Ubuntu:

```sh
cd ~/Downloads/portfolio-phase5-preview
git fetch origin
git switch phase-5/fluid-responsive
git pull --ff-only origin phase-5/fluid-responsive
PORT=8032 node tests/runtime/server.mjs
```

Then open `http://127.0.0.1:8032/` for French or `http://127.0.0.1:8032/en/` for English and resize the browser as desired. Use `Ctrl+C` in the server terminal to stop it.

The button is a single 44×44px fixed semantic link. Its right and bottom insets now follow the resolved navbar page-gutter value, with safe-area insets added when present. At 1905×963 CSS px, the desktop scene scale makes the shared effective gutter 34.56px. Before the alignment correction, the fixed 32px switch inset extended about 2.5px past both the Hero preview and Hire button edges. It now matches the Hire edge exactly and the preview edge within 0.05px; the 1440×900 offsets remain exactly 32px. Tablet resolves to 32px and mobile to 16px. The focused browser checks cover both switching directions, corresponding Projects/About anchors, preserved scroll position, keyboard activation/focus, resizing through wide desktop widths, responsive bounds, Hero-preview alignment, project-title clearance, Footer links and legal-dialog stacking.
