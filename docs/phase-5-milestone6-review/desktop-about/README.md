# Desktop About review

These are review-only captures from the current Phase 5 Desktop About implementation. They are not screenshot baselines and do not replace the historical references.

| Viewport | French | English |
| --- | --- | --- |
| 1440×900 | [French capture](desktop-about-fr-1440x900.png) | [English capture](desktop-about-en-1440x900.png) |
| 1100×700 | [French capture](desktop-about-fr-1100x700.png) | [English capture](desktop-about-en-1100x700.png) |

The focused browser test also covered 1280×800 and 1100×600 in both languages, including repeated width changes. Measurements are in [French JSON](desktop-about-fr-measurements.json) and [English JSON](desktop-about-en-measurements.json).

At 1440×900 the five 326px cards keep their authored positions and target typography. At narrower or shorter desktop sizes, card dimensions adapt to fit the three-column/two-row composition and stay below the navbar. The statement remains 56px; card titles remain 40px and body copy 14px, without ancestor scaling. The five-card animation sequence and 800svh About section duration are preserved.

## Local interactive preview

This implementation is currently a local Phase 5 branch checkpoint. The interactive local server works in the checkout containing this commit:

```bash
cd /workspace/kamilacomme.github.io
PORT=8014 node tests/runtime/server.mjs
```

Open `http://127.0.0.1:8014/` for French or `http://127.0.0.1:8014/en/` for English, then scroll to About. If reviewing from the Ubuntu checkout, this cloud workspace's localhost is not reachable from that laptop; the branch must first be pushed for review before the same server command can be run locally.

Visual approval is still pending. No screenshot reference was updated.
