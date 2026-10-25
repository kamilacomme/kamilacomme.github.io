# M10B Projects resize review

Open `gallery.html` in a browser to review the actual Playwright captures. The gallery contains after-fix captures only; Playwright removed the original failing screenshots when it cleaned its output directory. Baseline behavior is recorded below from the failing browser traces.

## Baseline and corrected behavior

- Tablet rotation: starting with Tour de parole focused at 834×1112 (tablet portrait), resizing to 1194×834 (tablet landscape) caused an intermediate scroll event to select Longread before the tablet Projects owner captured its resize anchor. The owner then restored Longread. The post-fix resize records keep Tour focused at both sizes; the rail panel is centered in the destination geometry.
- Mobile/profile transition: starting at 393×852 (mobile), Tour stayed focused at 320×568, but resizing to 844×390 selected Inside out in the tablet profile; returning to 393×852 selected Longread. Post-fix records keep Tour focused at 320×568, 844×390 (tablet profile under coarse-pointer emulation), and 393×852 (mobile profile).
- About: the paired measurements confirm the visitor remains in About through these resize sequences.

Before captures are not included because they were removed by the Playwright output cleanup. The JSON records in `measurements/` include the final focused project, actual profile, viewport, scroll position, and About position.

## Validation

- Four failing resize cases rerun in French and English: 4 passed.
- Three-mode and complete resize suite: 12 passed; 12 inapplicable profile cases skipped.
- Six-project reachability and Projects-to-About checks: 8 passed across FR/EN and desktop, tablet portrait, tablet landscape, and mobile.
- Deterministic FR/EN build check and `git diff --check` passed.

No historical visual references were changed. The captures and measurements in this folder are review evidence; the application changes are now part of the approved branch checkpoint.

## Run the working implementation in your local browser

From the repository root, update your checkout. If you applied the temporary preview patch before approval, first reverse it while the patch file is still present, then pull the approved source commit:

```bash
git apply -R docs/phase-5-m10b-project-resize-review/m10b-projects-working-tree.patch
git pull --ff-only origin phase-5/fluid-responsive
```

Start the local static server in a terminal:

```bash
PORT=8033 node tests/runtime/server.mjs
```

Open `http://127.0.0.1:8033/` in Chrome. Resize the window to review the live French page; `/en/` opens English. The Projects geometry changes across NORMAL, COMPACT, and EXTREME-SHORT based on available space.

If you did not apply the temporary preview patch, just run the pull command. The approved checkpoint includes the Projects implementation and focused tests; no patch application is needed.
