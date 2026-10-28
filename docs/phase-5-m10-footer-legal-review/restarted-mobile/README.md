# Fresh mobile Footer spacing proposal

This browser-only comparison starts over after the previous 1px-clearance proposal was cancelled. It leaves application code untouched.

Open from the repository root with:

```bash
xdg-open docs/phase-5-m10-footer-legal-review/restarted-mobile/gallery.html
```

The gallery shows actual generated-site Chromium captures in French and English at 320×568 and 390×844, alongside the existing 500×600 narrow-tablet spacing reference.

The new mobile-only proposal stacks the legal links with an 8px internal gap and reserves a larger 32px gap between the contact group and legal links. The link group remains anchored to the shared 16px horizontal and 24px bottom gutters; its increased height grows upward. To retain the outer gap, the contact group moves upward by 23px at both tested mobile sizes. Tablet and desktop geometry are unchanged. The switcher remains at its existing 44×44px bounds.

All proposal styling was applied in the browser at runtime. The screenshot references and application source were not modified. This is a design proposal awaiting visual approval.
