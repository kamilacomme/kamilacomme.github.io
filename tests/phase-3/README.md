# Phase 3 regression references

This reference overlay records the user-approved tablet-landscape Projects scale and the corrected, stable Projects/About boundary. The original Phase 0–1 and Phase 2 images remain in `tests/qa/references/` and stay covered by the frozen artifact lock.

The six unchanged profile directories (`desktop-*`, `tablet-portrait-*`, and `mobile-*`) resolve to the frozen images by symlink. The two tablet-landscape directories contain independent Phase 3 captures. This keeps their intentional visual delta reviewable without replacing the historical baseline.

Run the Phase 3 Playwright suite with:

```sh
npx playwright test --config tests/phase-3/playwright.config.cjs
```

The end-of-phase gate, which checks both the original and Phase 3 reference locks before and after all eight profiles, is:

```sh
node tests/phase-3/gate.mjs
```

Reference updates are disabled by default. A capture requires the explicit `PHASE3_CAPTURE_REFERENCES=1` opt-in; the setup also checks the dedicated branch, fixed local origin, separate snapshot path, and frozen baseline lock before writing. Update only the approved profile(s), then verify the reference lock and baseline lock.
