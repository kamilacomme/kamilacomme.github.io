# Tablet Hero slideshow size review

These are fresh review-only captures of the requested slideshow size change. They are not visual baselines, and no historical references were changed.

| Viewport | French | English |
| --- | --- | --- |
| Narrow tablet 500×834 | [French capture](fr-narrow-tablet-500x834.png) | [English capture](en-narrow-tablet-500x834.png) |
| Very short narrow tablet 500×400 | [French capture](fr-very-short-narrow-tablet-500x400.png) | [English capture](en-very-short-narrow-tablet-500x400.png) |
| Tablet portrait 834×1112 | [French capture](fr-tablet-portrait-834x1112.png) | [English capture](en-tablet-portrait-834x1112.png) |
| Short tablet landscape 1024×600 | [French capture](fr-short-tablet-landscape-1024x600.png) | [English capture](en-short-tablet-landscape-1024x600.png) |
| Tablet landscape 1194×834 | [French capture](fr-tablet-landscape-1194x834.png) | [English capture](en-tablet-landscape-1194x834.png) |
| Desktop 1440×900 | [French capture](fr-desktop-1440x900.png) | [English capture](en-desktop-1440x900.png) |

The measured DOM boxes, shared gutter, aspect ratio, slide count, title collision result, and scroll width are in [measurements.json](measurements.json). Desktop 1100×700 and additional tablet resize widths are included in those measurements and focused browser tests.

## Fit and short-height constraint

At 500×834 and 500×600, the slideshow is 230px wide. Tablet portrait is 240.66px at 834×1112, short landscape is 311.11px at 1024×600, and tablet landscape reaches the 325px maximum at 1194×834. Desktop is 249.03px at 1100×700 and 325px at 1440×900.

At 500×400, the wrapped heading occupies the upper-left area down to about 289px. A 230px slideshow anchored to the existing 32px bottom inset would overlap that copy. The existing sizing owner therefore fits the image to the available vertical area: 114.11px wide, preserving the 326:204 ratio and an 8px gap. The preview stays visible and the page does not overflow. The 230px minimum is relaxed only in this exceptionally short narrow-tablet case to avoid a collision.

## Interactive local preview

After updating the existing checkout to the review checkpoint, run:

```bash
cd ~/Downloads/portfolio-phase5-preview
git fetch origin phase-5/fluid-responsive
git switch phase-5/fluid-responsive
git pull --ff-only origin phase-5/fluid-responsive
PORT=8013 node tests/runtime/server.mjs
```

Open [French](http://127.0.0.1:8013/) and [English](http://127.0.0.1:8013/en/). Check 500×834, 500×600, 500×400, 834×1112, 1024×600, 1194×834, 1100×700 and 1440×900. The preview is a branch-only review checkpoint: it does not modify `main`, deploy or publish the website.
