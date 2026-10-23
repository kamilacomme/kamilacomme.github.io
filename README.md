# Tablet About screenshots — French, current layout only

These are Chromium captures of the current Phase 5 website in French. No proposed reflow or layout injection is included. The 500×600 case is intentionally omitted; the gallery covers the other requested tablet widths/heights.

To view the screenshots on Ubuntu, clone this review-only branch and open its gallery:

```bash
cd ~/Downloads
git clone --single-branch --branch review/tablet-about-500x600 https://github.com/kamilacomme/kamilacomme.github.io.git tablet-about-french-review
xdg-open ~/Downloads/tablet-about-french-review/index.html
```

The captures are 2× device-pixel screenshots at these CSS viewport sizes: 560×800, 659×834, 700×900, 834×1112, 1032×1376, 1024×600, and 1194×834. Each size has an About introduction view and a later card view. Measurements are in `captures/current-fr/measurements.json`.
