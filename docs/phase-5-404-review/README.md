# Custom 404 visual review

Open `gallery.html` locally to review the French and English custom 404 page at desktop, tablet, mobile and short-height sizes. The screenshots were captured in Chromium from actual missing URLs. Each request returned HTTP 404 while rendering the custom page; the short-height captures also show the return link after scrolling.

`measurements.json` records viewport and document bounds, the HTTP status, visible content bounds, horizontal-overflow checks, keyboard focus and the requested resources. The captures use the repository's pinned Figtree and Inter font fixtures. The 404 page does not request the portfolio support runtime, React, project media, slideshow or curtain assets.

GitHub Pages serves a root `404.html` body for a missing URL while keeping the HTTP 404 response and requested URL. The page defaults to French and selects English when the unchanged path begins with `/en/`; the home links navigate to `/` and `/en/` respectively. No automatic redirect is used.

To view the gallery in the local Ubuntu checkout:

```sh
cd ~/Downloads/portfolio-phase5-preview
git switch phase-5/fluid-responsive
git pull --ff-only
xdg-open docs/phase-5-404-review/gallery.html
```

To inspect the page live on localhost, start the small GitHub Pages-style preview server:

```sh
node docs/phase-5-404-review/preview-server.mjs
```

Then open `http://127.0.0.1:8014/missing-page` for French or `http://127.0.0.1:8014/en/missing-page` for English. Both URLs intentionally return HTTP 404 and retain their path. The server is for local review only; no deployment or redirect is involved.

The 404 implementation is a review checkpoint on the feature branch and remains unmerged and unpublished pending visual approval.
