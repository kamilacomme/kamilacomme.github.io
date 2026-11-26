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

## Relation to T6 (macOS lab)

Neither case depends on macOS, fonts or scrollbars: both are timing races inside the product that the tests expose, so they are not environment limitations. The remaining macOS-only item is `tablet-projects-shared-gutter` (overlay scrollbars), recorded under T4.
