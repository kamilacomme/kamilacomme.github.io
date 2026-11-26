# Flaky test diagnosis (2026-11-26)

Branch `fix/site-fixes-1-6` at `f09d309`, macOS, Chrome 158, `npm run test:serve` on port 8000. Diagnosis only: no product or test file was changed. Probes were instrumented copies (scroll writers, attribute writers, DOM node identity) kept outside the repository; the proposed patches below were exercised by serving patched copies through Playwright request routing, never by editing the working tree.

Both cases turned out to be **product bugs**, not test or environment artifacts. Each fix is proposed below and **not applied**, pending Kamila's approval of the diagnosis.

## 1. Tablet About after the language switch (834×1112, FR → EN, 50 % / 75 %)

**Symptom.** After the switch, the final `scrollY` was 2767 or 3433 (50 %), 4411 or 5077 (75 %) from run to run, equally on `f9e5b92` and on this branch.

**Runs.** 10 + 10 instrumented switches (50 %, 75 %): 5/10 and 5/10 ended on the shorter document. 10 further runs with DOM tracing: 6/10 bad. Plain loads of `/en/` without a switch: 1/6 bad in one sample, 0/12 in another.

**Hypotheses and checks**

| # | Hypothesis | Check | Result |
| --- | --- | --- | --- |
| H1 | The stored anchor or its restore differs between runs (switch timing, font load). | Logged the anchor read on arrival and every `scrollTo` with its caller. | Rejected as the cause. The anchor is identical in all 20 runs (`about`, progress 0 / 0.739); the restore (`tablet-project-layout.js:143`) writes the same position every time. The reader's offset inside About is identical in good and bad runs (0 px and 1644 px). |
| H2 | Something above About changes height after the restore. | Measured section heights and the tablet Projects state at the end of each run; traced node identity and attribute writes on `#kc-tablet-projets` / `#kc-t-stage`. | **Confirmed.** In bad runs the tablet Projects section is 1655 px (the CSS fallback in `styles/project-layouts.css`) with no `data-kc-projects-mode`, instead of 2321 px in `normal` mode. The page runtime (React 18 inside `support.js`) commits about 6 ms after the tablet script's last layout pass, removes `data-kc-projects-mode` (stack: `react-dom.production.min.js`) and clears the stage's inline geometry. Nothing schedules another layout pass: the mount observer disconnects after the first mount, and later non-forced passes are skipped because the layout key is unchanged. Browser scroll anchoring then keeps About in view, which is why only the absolute `scrollY` differed. |

**Root cause: product.** A race between the page runtime's re-render and `scripts/projects/tablet-project-layout.js` (the tablet Projects geometry owner). It is not specific to the language switch; any tablet load can end in the unlaid state.

**Visible effect.** On tablet the tickets render in a narrow column with an empty right side, and the section is 666 px shorter. Captures at 834×1112 after the switch: bad [mid](flaky-tablet-projects-bad-mid.png), [top](flaky-tablet-projects-bad-top.png); good [mid](flaky-tablet-projects-good-mid.png), [top](flaky-tablet-projects-good-top.png).

**Proposed fix (not applied).** Owner: `tablet-project-layout.js`. Every layout pass publishes a mode (`normal`, `compact`, `flow`, landscape), so a mounted tablet stage without one has not been laid out: lay it out again. The script's own writes always set a mode and do not retrigger the observer.

```diff
--- a/scripts/projects/tablet-project-layout.js
+++ b/scripts/projects/tablet-project-layout.js
@@ -496,14 +496,18 @@
     document.fonts.addEventListener?.('loadingdone', () => scheduleFit(true));
   }
 
-  const projectsRoot = $('kc-tablet-projets');
-  const mountObserver = projectsRoot && new MutationObserver(function () {
-    if (!$('kc-t-stage')) return;
-    mountObserver.disconnect();
-    scheduleFit();
+  // The page runtime (support.js / React) mounts the tablet Projects nodes and can
+  // re-render them after a layout pass, dropping the geometry this script wrote
+  // (stage/viewport inline styles and data-kc-projects-mode). Every layout pass
+  // publishes a mode, so a mounted tablet stage without one has not been laid out:
+  // lay it out again. Our own writes always set a mode and do not retrigger this.
+  new MutationObserver(function () {
+    if (layoutFrame || !window.__kcTabletLayout?.tablet) return;
+    const root = $('kc-tablet-projets');
+    if (!root || !$('kc-t-stage') || root.dataset.kcProjectsMode) return;
+    scheduleFit(true);
+  }).observe(document.documentElement, {
+    childList: true, subtree: true, attributes: true, attributeFilter: ['data-kc-projects-mode'],
   });
-  if (projectsRoot && !$('kc-t-stage')) {
-    mountObserver.observe(projectsRoot, { childList: true, subtree: true });
-  }
   if ($('kc-t-stage')) scheduleFit();
 })();
```

**Pre-check of the proposal** (patched file served via request routing, same switch path, 10 runs each): current 4/10 bad, patched 0/10 bad (all 2321 px, `normal`; reader offset inside About 0 px in 9 runs, 8 px in 1). Not yet run: the Phase 5 suite, the 492-point matrix, desktop/mobile regression checks.

## 2. `footer-legal-resize-direction` (desktop FR/EN)

**Symptom.** Failed in about half of the runs on both versions: “legal links outside the 1377×852 viewport”.

**Runs.** 10 runs of an instrumented copy (desktop FR + EN, 20 executions): 9 failed, all at the second 1377×852 step (after 320×568, mobile → desktop). The first 1377×852 step (after 834×1112, tablet → desktop) never failed.

**Hypotheses and checks**

| # | Hypothesis | Check | Result |
| --- | --- | --- | --- |
| H1 | A deferred scroll restore runs after the test's own scroll to the Footer. | Logged every `scrollTo` with its caller for each step. | **Confirmed.** Mobile → desktop: the controller's Footer handoff (`portfolio-controller.js:1020`) scrolls to the Footer while the document is still short (y 8639); the desktop Projects iframe's late `measure()` then calls `restoreAnchor` (`desktop-project-embedded.html`) and moves to 14039–14050, leaving the Footer 250–261 px down. The test passes only when its own `scrollTo` lands after that late restore. |
| — | Is the product affected without the test? | 10 resizes 320×568 → 1377×852 standing at the Footer, nothing else scrolling. | Yes, deterministically: the Footer top is at 584 px (FR) after the resize in 10/10 runs (573 px EN in 5/5). Tablet → desktop and desktop → desktop keep the Footer (10/10 and 5/5). |

**Root cause: product.** In the transient layout right after mobile → desktop, the viewport at the old Footer position shows About, so the iframe's `captureAnchor()` records an About anchor and its restore overrides the controller's Footer handoff. Not a font, animation, scrollbar or reference-comparison issue.

**Proposed fix (not applied).** The controller publishes its pending Footer handoff; the desktop Projects iframe restores that anchor (through the shared `KCSiteFooter.contactScrollTop`) instead of capturing a transient one, and clears it. The controller also clears it when the reader settles in another section.

```diff
--- a/portfolio-controller.js
+++ b/portfolio-controller.js
@@ -1003,6 +1003,10 @@
       this._layoutProfile = responsiveProfile;
       if (Number.isFinite(handoffFooterProgress)) {
         this._lastScrollSection = "contact";
+        // The desktop Projects iframe can measure after this handoff (mobile → desktop)
+        // and grow the document. Publish the Footer anchor so it restores the Footer
+        // instead of capturing a transient About position.
+        window.__kcPendingFooterAnchor = { progress: handoffFooterProgress };
         const handoffLocation = window.location.href;
         // Let the existing tablet Projects owner finish its layout pass before
         // restoring the Footer's semantic scroll position.
@@ -1045,6 +1049,7 @@
       }
       if (about && about.getBoundingClientRect().top <= 1 && about.getBoundingClientRect().bottom > 1) {
         this._lastScrollSection = "about";
+        window.__kcPendingFooterAnchor = null;
         const rect = about.getBoundingClientRect();
         const travel = Math.max(1, rect.height - window.innerHeight);
         this._pendingResizeAboutProgress = Math.max(0, Math.min(1, -rect.top / travel));
@@ -1052,6 +1057,7 @@
       }
       this._pendingResizeAboutProgress = null;
       this._pendingResizeFooterProgress = null;
+      window.__kcPendingFooterAnchor = null;
       const sectionRect = projects?.getBoundingClientRect();
       if (!sectionRect || sectionRect.top >= innerHeight || sectionRect.bottom <= 0) {
         this._lastScrollSection = "other";
--- a/templates/desktop-project-embedded.html
+++ b/templates/desktop-project-embedded.html
@@ -69,6 +69,7 @@
  }
  function restoreAnchor(anchor){
    if(!anchor)return;
+   if(anchor.kind==='contact'&&outer){const footer=scrollWindow.document.getElementById('contact'),F=scrollWindow.KCSiteFooter;if(footer&&F)scrollWindow.scrollTo(0,Math.max(0,F.contactScrollTop(footer,anchor.progress)));scrollWindow.__kcPendingFooterAnchor=null;return;}
    if(anchor.kind==='about'&&outer){const about=scrollWindow.document.querySelector('#apropos');if(about){const r=about.getBoundingClientRect(),top=r.top+scrollWindow.scrollY;if(Number.isFinite(anchor.progress)){const travel=Math.max(0,r.height-scrollWindow.innerHeight);scrollWindow.scrollTo(0,top+travel*anchor.progress);}else scrollWindow.scrollTo(0,top-anchor.top);}return;}
    if(anchor.kind!=='project')return;
    if(mode==='flow'){
@@ -84,7 +85,8 @@
  }
  function measure(){
    const languageAnchor=outer&&desktopIsActive()?scrollWindow.__kcPendingLanguageAnchor:null;
-   const anchor=languageAnchor||captureAnchor();
+   const footerAnchor=outer&&desktopIsActive()?scrollWindow.__kcPendingFooterAnchor:null;
+   const anchor=languageAnchor||(footerAnchor?{kind:'contact',progress:footerAnchor.progress}:captureAnchor());
    const host=outer?scrollWindow:window;
    const vw=host.innerWidth,vh=host.innerHeight;
    // Measure the authored heading box independently of the previous mode's
```

The generated `desktop-project-embedded.html` and `en/desktop-project-embedded.html` would be regenerated with the content build.

**Pre-check of the proposal** (patched controller and FR/EN iframe documents served via request routing, 5 runs per case): mobile → desktop Footer kept 5/5 FR and 5/5 EN (current: lost 5/5 and 5/5); tablet → desktop and desktop → desktop kept 5/5 in both versions. Not yet run: the spec itself, the Phase 5 suite, the 492-point matrix, the language-switch and resize-continuity specs.

## 3. `tablet-about-responsive` (tablet-portrait EN and FR) — 2026-11-26

**Symptom.** Fails at the first step (500×600): `expect(parseFloat(result.stage.width)).toBeCloseTo(viewport.width, 0)` — expected 500, received 834 (the About stage keeps the previous 834×1112 size).

**Runs.** 10/10 failed on the current branch (EN and FR, 20 executions); 3/3 failed on `main`, `f9e5b92`, `209b30d` and `3fbb343`. It predates this branch and the case-study foundation.

**Hypotheses and checks**

| # | Hypothesis | Check | Result |
| --- | --- | --- | --- |
| H1 | The test's paused fake clock (`qa.seed`: `clock.install` + `pauseAt`) blocks a deferred About fit. | Copies of the spec (outside the repository): without `qa.seed`; with `page.clock.runFor(50)` after the resize. | Rejected. Both still fail (834 at 500×600). `fit()` runs synchronously in the `resize` listener; there is no time-based guard. |
| H2 | The page does not receive the `resize` event within the test's fixed 100 ms real wait. | Instrumented copy: counted `resize` events and traced every write of `window.__kcTabletLayout`; measured the delay between `setViewportSize` and the page's `resize` event in the same emulation (iPad UA, `isMobile`, touch, DPR 2). | **Confirmed.** At the failing check no `resize` event had arrived (the only write was from the previous size); a manual `resize` dispatch immediately produced 500×600 and a 500px stage. Measured event delay after `setViewportSize`: 14–1758 ms with a real clock and 32–1413 ms with the paused clock. With a 1 s wait in a copy of the spec every resize arrives and the full spec passes 3/3 (EN and FR). |

**Root cause: environment and test timing, not the product.** On this Mac (Chrome 158.0.8127.38, headless, mobile emulation) the emulated viewport change reaches the page later than the spec's fixed `waitForTimeout(100)`. The product's geometry owner lays out correctly as soon as the event arrives. Per the task rules the spec and its waits were not changed. The Phase 5 record of 3/3 passes on 2026-11-25 no longer reproduces on this machine.

**Where it closes.** In the recorded Linux lab (T6 or a Linux run), or by an owner decision to change how the spec waits for the resize (for example, polling until `__kcTabletLayout` reports the new size, as other Phase 5 specs do) — a test change that needs separate authorization.

## 4. `language-scroll-restoration` (desktop-en PageDown; tablet-portrait-fr) — 2026-11-26

**Symptom.** After the About restore on `/` at 1920×1080, the spec presses PageDown and expects `scrollY` to grow by more than 80px within 5 s; in failing runs it stays at the restored 7665.

**Runs.** 20 consecutive runs on the current branch: desktop-en failed 2/20; tablet-portrait-fr passed 20/20 (its single earlier failure, in a full-suite run, did not recur). Earlier comparison: 2/20 on `3fbb343` (before the race fixes), so it predates them. One more failure was caught on the 6th run of an instrumented copy.

**Hypotheses and checks**

| # | Hypothesis | Check | Result |
| --- | --- | --- | --- |
| H1 | A product key handler cancels the PageDown (legal-dialog key handler, scroll-intent cancellation). | Instrumented copy: capture-phase `keydown` log (target, active element, `document.hasFocus()`), `defaultPrevented` after dispatch, and a trace of every `preventDefault` call on `keydown`. | Rejected. In the failing run the PageDown reached `BODY` with the document focused, `defaultPrevented` was `false`, and no script called `preventDefault`. |
| H2 | A late product scroll writer (language-anchor restore, iframe `restoreAnchor`, Footer handoff) moves the page back after the key scroll. | Trace of every `scrollTo` / `scrollBy` / `scrollIntoView` with its caller (run earlier on this branch); scroll events after the key press. | Rejected. No script wrote a scroll position after the restore; the only scroll event after the key press came 2.2 s later and still reported 7665, i.e. the browser never applied the key's default scroll. |

**Conclusion: not confirmed in the product; stopped here per the task rules.** The page received an uncancelled PageDown with focus and no competing scroll writer, and headless Chrome 158 on macOS did not perform the default keyboard scroll in about 1 of 10 runs (with a 2.2 s gap before the next rendered scroll event). This points to the browser/environment rather than the site. Nothing was changed; the spec and thresholds are untouched. To be re-checked in the recorded Linux lab (T6 or a Linux run).

## 5. `tablet-layered-ticket` (tablet-landscape EN) — 2026-11-26

**Symptom.** After `scrollTo(projectTop + 3650)` and `page.clock.runFor(500)` the landscape rail transform is 0 instead of −3650.

**Runs.** Current branch 3/5 and 3/4 (instrumented) failed; `3fbb343` (before the race fixes) 5/5 failed — it predates them.

**Check.** Instrumented copy logged scroll and resize events from just before the `scrollTo`. In every failing run the page had received **0** scroll and 0 resize events at the assertion; 1.5 s of real time later both events had arrived and the rail stood exactly at −3650 (the same value the spec expects). The rail is driven by the `scroll` listener, which simply had not run yet; `runFor(500)` advances the fake clock, not the browser's event delivery.

**Conclusion: environment (late event delivery in headless Chrome 158 on macOS), not the product.** Same mechanism as case 3. Not changed.

## 6. `language-switch` (tablet-landscape FR, About step) — 2026-11-26

**Symptom.** After the spec scrolls to About and clicks the switch, the URL is `/en/#projets-t` instead of `/en/#apropos-t`.

**Runs.** Current branch 3/21 failed; `3fbb343` 1/15 — it predates the race fixes (rates within noise of each other).

**Checks.** Geometry and every `scrollTo` with its caller were logged up to the click. Sequence in a failing run: on arrival from the previous switch `tablet-project-layout.js` restores the project anchor (y 555); the spec scrolls programmatically to About (y 4610, About top −80); ~460 ms later a forced tablet layout pass restores the project anchor again (y 555), so at the click the switch handler sees Projects. The second restore uses `lastViewportAnchor`, which `captureViewportAnchor()` deliberately prefers during resize and which the scroll owner clears from its `scroll` listener once Projects leaves the viewport. At the click the page had received only 3 scroll events and not the one for the spec's jump to About, so the stale project anchor was still set.

**Conclusion (corrected 2026-11-26, see the regression check below).** A further probe timed the scroll owner's 120 ms `preservingResizeAnchor` window: in a failing run the window opened at t 88 ms (arrival restore) and closed at t 209 ms, and the spec's jump to About, with its synchronous `scroll` event, came at t 175 ms. The scroll owner therefore ignored it by design, and no later `scroll` event was processed before the next forced layout pass at t 641 ms, which restored the stale project anchor. The product contributes a window in which a single scroll is ignored and never re-read; whether that becomes visible depends on no further scroll event arriving before the next layout pass, which this environment makes likely (late event delivery). It also occurs on `3fbb343`, before the race fixes, so it is not a regression. Not changed; a hardening (re-reading the position when the 120 ms window closes) would be a separate product decision.

## Regression check of cases 3, 5 and 6 (2026-11-26)

Question: do `8d4c130` (tablet re-layout observer) or `ba9e60a` (Footer handoff) cause or worsen these failures? Temporary copies of each commit were extracted with `git archive` into `/tmp`, served on separate ports, and deleted after the run; the current branch was not touched. The four checks were run 10 times per commit, interleaved commit by commit so all three versions shared the same conditions (120 runs). The spec files, the QA helpers and the Playwright configs are identical in all three commits and on the branch head. Raw results: [regression-check-results.csv](regression-check-results.csv).

| Check | `3fbb343` (before both fixes) | `8d4c130` (tablet fix) | `ba9e60a` (+ Footer fix) |
| --- | --- | --- | --- |
| `tablet-about-responsive` tablet-portrait-en | 0 passed / 10 failed | 0 / 10 | 0 / 10 |
| `tablet-about-responsive` tablet-portrait-fr | 0 / 10 | 0 / 10 | 0 / 10 |
| `tablet-layered-ticket` tablet-landscape-en | 0 / 10 | 0 / 10 | 0 / 10 |
| `language-switch` tablet-landscape-fr | 6 / 4 | 8 / 2 | 6 / 4 |

**Result: no regression.** Every failure is present at the same or a higher rate on `3fbb343`, before either fix. `tablet-layered-ticket` failed 10/10 in this interleaved series (3/5 and 5/5 in earlier smaller series), consistent with case 5's timing dependence.

## Relation to T6 (macOS lab)

Cases 1 and 2 did not depend on macOS, fonts or scrollbars: they were timing races inside the product, fixed in `8d4c130` and `ba9e60a`. Cases 3–6 are not confirmed in the product: on this Mac, headless Chrome 158 delivers `resize` and `scroll` events (and keyboard default scrolling) hundreds of milliseconds to seconds late, while the specs sample after fixed short waits or fake-clock advances. Case 3 is late `resize`, case 4 a dropped default keyboard scroll, case 5 late `scroll`, case 6 a scroll ignored inside the scroll owner's 120 ms post-layout window and not re-read before the next pass (see the corrected conclusion). All four belong with T6 or a Linux lab run; none of their specs or thresholds were changed. The remaining macOS-only failure is `tablet-projects-shared-gutter` (overlay scrollbars), recorded under T4; it closes only with T6 or in the Linux lab.
