# Milestone 6 Footer review

Review-only browser captures of the current shared Desktop/Tablet Footer, in French and English. These are not screenshot references and have not been locked.

The single `fitFooter()` geometry owner now keeps typography independent of its viewport geometry scale: desktop headline 56px, tablet headline 48px, contact text 14px, and legal links 12px. The Footer curtain, tablet height latch, video, link targets and layout positions remain under their existing owners. The mobile branch is unchanged for Milestone 7.

## Captures

Open the paired French and English images for each profile:

- `desktop-normal-{fr,en}-1440x900.png`
- `desktop-compact-{fr,en}-1100x700.png`
- `tablet-portrait-{fr,en}-834x1112.png`
- `tablet-landscape-{fr,en}-1194x834.png`
- `tablet-short-{fr,en}-1024x600.png`
- `tablet-narrow-{fr,en}-500x600.png`

From the repository root on Ubuntu, for example:

```sh
xdg-open docs/phase-5-milestone6-review/footer-approval/desktop-normal-fr-1440x900.png
xdg-open docs/phase-5-milestone6-review/footer-approval/tablet-short-fr-1024x600.png
```

The measured bounding boxes, computed/effective font sizes, resize sequence, media ready state and overflow/collision results are in `measurements.json`.

## Interactive preview

From the repository root:

```sh
PORT=8000 node tests/runtime/server.mjs
```

Open `http://127.0.0.1:8000/#contact` for French or `http://127.0.0.1:8000/en/#contact` for English. Use Chrome's responsive controls or resize the window to inspect the profiles. Footer review remains open until the user approves it.

## Focused validation

Playwright's existing `navigation, About animation, footer and legal dialog interactions` check passed in both languages at desktop, tablet portrait, and tablet landscape (6 targeted runs). It covers navigation, the Footer curtain's progress, video playback, and legal/privacy dialogs. Browser geometry captures also checked the listed viewport sizes in both languages and repeated resizing through desktop, tablet and short-height states. No full suite, Lighthouse run, or reference screenshot update was performed.
