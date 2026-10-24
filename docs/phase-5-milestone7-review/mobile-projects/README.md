# Milestone 7 — Mobile Projects review

These are review-only captures from the generated French and English pages. They are not visual test baselines and do not change historical references.

The editorial cards now use normal document flow. Their image ratios, alternating wide/narrow arrangement, text, categories, barcode, anchor, project order, and existing media nodes come from the same six mobile records. Type is independent of viewport scaling: section heading 32px, project title 24px, description 14px, and category labels 12px. Card widths adapt to the 16px page gutters; descriptions wrap naturally and the About section follows the complete last card.

| CSS viewport | French | English |
| --- | --- | --- |
| 320 × 568 — project start | `fr-320x568-projects-start.png` | `en-320x568-projects-start.png` |
| 320 × 568 — final Napoli card | `fr-320x568-napoli-end.png` | `en-320x568-napoli-end.png` |
| 390 × 844 — project start | `fr-390x844-projects-start.png` | `en-390x844-projects-start.png` |
| 430 × 932 — project start | `fr-430x932-projects-start.png` | `en-430x932-projects-start.png` |

To try the actual interactive pages in the local checkout after pulling the review branch:

```bash
PORT=8032 node tests/runtime/server.mjs
```

Open `http://127.0.0.1:8032/` for French or `http://127.0.0.1:8032/en/` for English. The 8032 port avoids the previously used 8031 preview port.
