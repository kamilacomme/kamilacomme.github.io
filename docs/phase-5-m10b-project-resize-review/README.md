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

No historical visual references were changed. This folder is review evidence only; application and test changes remain outside the review-artifact commit.

## Run the working implementation in your local browser

The source changes are deliberately not part of the review-artifact commit. The patch file contains the current uncommitted M10B Projects implementation and focused test changes so you can try them in your local checkout without committing them.

From the repository root, update the review artifacts and apply the patch:

```bash
git pull --ff-only origin phase-5/fluid-responsive
git apply --check docs/phase-5-m10b-project-resize-review/m10b-projects-working-tree.patch
git apply docs/phase-5-m10b-project-resize-review/m10b-projects-working-tree.patch
```

Start the local static server in a terminal:

```bash
PORT=8033 node tests/runtime/server.mjs
```

Open `http://127.0.0.1:8033/` in Chrome. Resize the window to review the live French page; `/en/` opens English. The Projects geometry changes across NORMAL, COMPACT, and EXTREME-SHORT based on available space.

The patch leaves the changes in your local working tree, uncommitted. To discard only this preview patch afterward, run `git apply -R docs/phase-5-m10b-project-resize-review/m10b-projects-working-tree.patch` from the repository root, provided you have not edited the patched files.
