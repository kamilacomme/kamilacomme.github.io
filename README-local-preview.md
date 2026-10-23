# Run the Tablet About preview on Ubuntu

This bundle is review-only. It contains the browser captures, a screenshot comparison page, a temporary interactive preview helper, and a patch for the current uncommitted Tablet About implementation. It does not contain or commit the reflow as approved website code.

The helper loads the actual Phase 5 site in an iframe at exactly 500×600 CSS pixels. Its controls switch French/English, current layout/proposed reflow, and scroll progress. The proposed treatment is injected into the iframe at runtime and disappears when the page is reloaded; it does not edit the implementation.

Run these commands in a terminal on your Ubuntu computer:

```bash
cd ~/Downloads
git clone --single-branch --branch phase-5/fluid-responsive https://github.com/kamilacomme/kamilacomme.github.io.git portfolio-about-preview
git clone --single-branch --branch review/tablet-about-500x600 https://github.com/kamilacomme/kamilacomme.github.io.git tablet-about-review
cd ~/Downloads/portfolio-about-preview
git apply ~/Downloads/tablet-about-review/preview/tablet-about-current.patch
cp ~/Downloads/tablet-about-review/preview/interactive-preview.html .
PORT=8017 node tests/runtime/server.mjs
```

Leave that terminal running. Open a second terminal and run:

```bash
xdg-open http://127.0.0.1:8017/interactive-preview.html
```

This localhost server runs on your Ubuntu computer from your local checkout. It is not hosted in the cloud. Port 8017 avoids the common 8000 collision. Stop it with Ctrl+C when finished. The preview checkout changes are local and uncommitted; remove that checkout when you are done if desired.

The patch applies to the Phase 5 branch tip used for this preview (`e2b2eea6a21c8870de447f17689bd085e3f99e1f`). It only supplies the current Tablet About implementation for review; the separate B treatment remains browser-only.
