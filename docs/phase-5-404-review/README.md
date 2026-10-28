# Custom 404 visual review

Open `gallery.html` locally to review the French and English custom 404 page at desktop, tablet and mobile sizes. It compares the old homepage Navbar, the homepage using the shared partial, and the 404 Navbar side by side at identical viewports. The new comparison captures were taken in Chromium from actual missing URLs; each request returned HTTP 404 while rendering the custom page.

`measurements.json` records the new Chromium Navbar, typography, button, focus and overflow measurements. The captures use the repository's pinned Figtree and Inter font fixtures. The 404 page does not request the portfolio support runtime, React, project media, slideshow or curtain assets.

Both pages consume `templates/partials/navbar.html` through the deterministic content build. The old-homepage comparison uses the committed pre-extraction homepage output. Chromium bounds show the old and extracted homepage Navbar layouts match, and that the 404 Navbar follows the same responsive geometry. Desktop links stay centered; tablet/mobile visibility follows the homepage behavior. Only the white 404 surface overrides Navbar colors. The 404 loads no PortfolioController or homepage animation systems.

The message computes to 56px on desktop, 48px on tablet and 32px on mobile. The numeral uses responsive font sizing without transform scaling. The return link remains 14px with a 44px minimum height at each tested size.

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
node scripts/content/build.mjs --site
node docs/phase-5-404-review/preview-server.mjs
```

Then open `http://127.0.0.1:8014/missing-page` for French or `http://127.0.0.1:8014/en/missing-page` for English. Both URLs intentionally return HTTP 404 and retain their path. The server is for local review only; no deployment or redirect is involved.

The 404 implementation is a review checkpoint on the feature branch and remains unmerged and unpublished pending visual approval.
