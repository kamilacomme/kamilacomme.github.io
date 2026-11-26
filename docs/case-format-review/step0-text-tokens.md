# Step 0 — case text levels → existing site tokens (2026-11-26)

Inventory for task 2 (`case-studies/jane-format`). No token was added or changed. Values were read from the current source: `_ds/dsystem-023fcb25-9065-4256-8e64-9674caa319f6/tokens/typography.css`, `colors.css`, `styles/responsive-foundations.css` and the generated homepage (`index.html`).

## Where tokens live and the 230 hashes

| Source | Holds | In the 230-hash lock? |
| --- | --- | --- |
| `_ds/.../tokens/typography.css` | `--font-display` (Figtree), `--font-body` (Inter), weights, `--display-*` 88, `--heading-*` 40, `--body-*` 16/1.5, `--label-*` 12/1.67/0.04em | No |
| `_ds/.../tokens/colors.css` | `--text-default` #222022, `--text-muted` #5C575C, `--surface-muted`, `--surface-page` | No |
| `_ds/.../tokens/spacing.css` | `--space-*`, grid, `--gutter-wide` 24, `--radius` 4 | No |
| `styles/responsive-foundations.css` | `--kc-type-heading-*` 56/48/32, `--kc-type-project-*` 40/32/24, `--kc-type-body` 14, `--kc-type-label` 12 | No |

The lock covers only `tests/qa/references`, `tests/runtime`, `tests/baseline` (checked: 230 entries, none under `_ds/`, `styles/` or `assets/`). Adding a token would not change the 230 hashes. It would still change shared files the homepage loads, which task 2 forbids. Proposal for any token Kamila approves: a separate `styles/case-tokens.css`, loaded only by `templates/case.html`, defining only new variables (no rule touches `/cases/_foundation/`, so the 492-point matrix is unaffected).

## Table

Sizes are desktop / tablet / mobile.

| Case level | Existing token / homepage use | Status |
| --- | --- | --- |
| Chapter title | `--font-display`, 700, `--kc-type-heading-desktop/-tablet/-mobile` 56/48/32, line 1.1, `--display-track` −0.03em, `--text-default` (homepage section headings, case H1) | Exists |
| Chapter intro | — no lead size between body 16 and project 40/32/24 | **Gap 1** |
| Body text | `--font-body`, `--fw-body` 400, 16px, line 1.6 (About text) or `--body-line` 1.5, `--body-track` −0.01em, `--text-muted` | Exists |
| Caption | `--kc-type-body` 14, line 1.5, −0.01em, `--text-muted` (ticket descriptions) | Exists |
| Label | `--kc-type-label` 12, 0.04em, uppercase, `--text-muted` (ticket categories). DS says weight 500, the site uses 400; the case follows the site (400). | Exists |
| Prompt text | — no monospace font; a new font is forbidden | **Gap 2** |
| AI episode title | `--font-display`, 700, `--kc-type-project-*` 40/32/24, −0.03em (project titles) | Exists |
| Accent quote | Figtree 400 italic is used for accent words inside homepage headings; no token names the combination or a size for a standalone quote | **Gap 3** (partial) |

## Options for the gaps (screenshots: `step0-desktop.png`, `step0-mobile.png`)

1. Chapter intro — A: body 16/1.6 in `--text-default` (darker than body). B: `--kc-type-project-*` Figtree 700. C: Inter 24/1.4 — a **new** value.
2. Prompt text — A: `--kc-type-body` 14 on `--surface-muted`, radius 4. B: label size 12, not uppercase, on `--surface-muted`.
3. Accent quote — A: Figtree 400 italic at heading sizes 56/48/32. B: Figtree 400 italic at project sizes 40/32/24.

Decision: waiting for Kamila.
