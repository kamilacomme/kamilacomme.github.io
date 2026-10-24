# Current Hero overview

Four review-only captures of the current French site, each taken from a fresh Chromium load at 100% zoom and DPR 1. The images are not historical or regression references and do not alter screenshot baselines.

- `desktop-fr-1440x900.png` — desktop
- `tablet-landscape-fr-1194x834.png` — tablet landscape
- `tablet-portrait-fr-834x1112.png` — tablet portrait
- `mobile-fr-390x844.png` — mobile

To open this folder on Ubuntu after pulling the Phase 5 branch:

```bash
cd ~/Downloads/portfolio-phase5-preview
git fetch origin
git switch phase-5/fluid-responsive
git pull --ff-only origin phase-5/fluid-responsive
xdg-open docs/phase-5-milestone7-review/hero-overview/
```

These captures show the current approved Hero compositions. The slideshow image can differ between captures because it continues its existing loop.
