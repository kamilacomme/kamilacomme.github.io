# Milestone 6 — Tablet Hero review

These eight captures are rendered review previews, not test baselines. No historical screenshots were replaced.

| Locale | Narrow tablet 500×834 | Portrait 834×1112 | Landscape 1194×834 | Short landscape 1024×600 |
|---|---|---|---|---|
| French | [fr-500x834.png](fr-500x834.png) | [fr-834x1112.png](fr-834x1112.png) | [fr-1194x834.png](fr-1194x834.png) | [fr-1024x600.png](fr-1024x600.png) |
| English | [en-500x834.png](en-500x834.png) | [en-834x1112.png](en-834x1112.png) | [en-1194x834.png](en-1194x834.png) | [en-1024x600.png](en-1024x600.png) |

The captures use the existing generated pages and runtime at device scale 1. Browser measurements, title line boxes, image-loop bounds and active-slide state are recorded in [measurements.json](measurements.json).

## Interactive local preview

After updating the existing checkout to this Phase 5 review checkpoint, run:

```bash
cd ~/Downloads/portfolio-phase5-preview
git fetch origin phase-5/fluid-responsive
git switch phase-5/fluid-responsive
git pull --ff-only origin phase-5/fluid-responsive
PORT=8013 node tests/runtime/server.mjs
```

Open the French page at [http://127.0.0.1:8013/](http://127.0.0.1:8013/) and the English page at [http://127.0.0.1:8013/en/](http://127.0.0.1:8013/en/). In Chrome DevTools responsive mode, inspect 500×834, 834×1112, 1194×834 and 1024×600; resize across widths to see the heading reflow and the six-image Hero loop continue. If port 8013 is occupied, stop the process using that port or substitute another unused `PORT` value.

The branch update contains this Tablet Hero implementation and review-only captures. It does not update historical references or modify `main`; it is not a deployment or website publication.
