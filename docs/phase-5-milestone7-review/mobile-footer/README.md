# Mobile Footer visual review

These are review-only Chromium captures at 100% browser zoom and DPR 1. They are not screenshot references and do not update or lock any baselines.

| Locale | 320 × 568 | 390 × 844 |
| --- | --- | --- |
| French | `fr-320x568.png` | `fr-390x844.png` |
| English | `en-320x568.png` | `en-390x844.png` |

The footer is the current Phase 5 implementation at `http://127.0.0.1:8062/` (French) and `http://127.0.0.1:8062/en/` (English). For a local preview, update the Phase 5 branch and run `PORT=8032 node tests/runtime/server.mjs`, then open the routes above with port `8032`.

Focused checks passed for French and English at 320 × 568, 375 × 844, 390 × 667 and 430 × 932, with short/tall resize transitions. They verify effective type sizes (32px heading/email, 14px contacts, 11px legal links), the 16px inset, wrapping and bounds, no horizontal page overflow, links, the footer video, and the existing curtain progression. The footer uses its existing `fitFooter()` geometry owner and `renderFooter()` animation; no duplicate structure or controller was added.

**Visual approval is pending.**
