# Footer legal-link orientation review

This is a browser-only visual proposal, not an application change. It contains before/after Chromium captures of the actual generated French and English site routes after the Footer curtain settled. The proposed after-state was applied as a temporary in-browser DOM style override; no application files or historical screenshot baselines were changed.

## Open locally

From the repository root, run:

```bash
xdg-open docs/phase-5-m10-footer-legal-review/gallery.html
```

The gallery shows both states for each requested CSS viewport:

- Mobile: 320×568 and 390×844
- Narrow tablet: 500×600
- Tablet portrait: 834×1112
- Tablet landscape: 1194×834
- Desktop control: 1440×900

Each French and English capture records the actual responsive profile, pointer/touch mode, settled curtain progress, shared gutters, contact and legal bounds, switcher bounds, effective link fonts, and horizontal overflow in `measurements.json`.

## What the proposal changes

- Mobile legal links stack vertically with a 16px gap and remain anchored to the shared 16px horizontal / 24px bottom gutters. They grow upward. The contact group stays at its current coordinates; measured contact-to-legal clearance is 1px at the two tested mobile sizes, with no box overlap.
- Tablet legal links are horizontal with natural wrapping available; the tested languages fit at 500px and above. Shared 32px gutters and contact positions are retained.
- Desktop remains unchanged with horizontal links.
- The 44×44px switcher is unchanged in every capture.

The narrow mobile clearance is visibly tight. This is the requested contact-position-preserving proposal; the preview does not move the contact group. Please review the captures locally before implementation.
