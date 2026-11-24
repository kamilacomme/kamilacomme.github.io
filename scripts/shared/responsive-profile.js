/*
 * Shared responsive profile: the single source of the site's profile rule, scene
 * scales and page gutters. The homepage controller (portfolio-controller.js) calls
 * these functions instead of carrying its own copy; static pages (404, case
 * studies) load only this script.
 *
 * Classic script: exposes window.KCResponsiveProfile.
 */
(function () {
  "use strict";

  // Input characteristics the profile rule reads.
  function readDevice() {
    const touch = window.matchMedia && window.matchMedia("(hover: none), (pointer: coarse)").matches;
    const fineHover = window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    // a coarse-pointer report alone is not enough to call something a tablet: some
    // desktop browsers and embedded views report one while showing a full-size window,
    // and routing those to the tablet branch left the DESKTOP dom on screen driven by
    // tablet logic — the About cards then never moved at all.
    const iPadish = /iPad|iPhone|iPod|Android/i.test(navigator.userAgent)
      || (navigator.platform === "MacIntel" && (navigator.maxTouchPoints || 0) > 1);
    return { touch, fineHover, iPadish };
  }

  // The profile rule. `force` and `phoneForced` are the homepage editor's preview
  // overrides; static pages always use "auto".
  function resolveProfile({ width, force = "auto", phoneForced = false, touch, fineHover, iPadish }) {
    // resizing a desktop window has to walk desktop → tablet → phone, so in auto mode the
    // WIDTH decides the tier on its own; orientation no longer gates it (a short landscape
    // window used to skip the tablet tier entirely and jump straight to the phone)
    // 500, not 640: the phone frame is 390 design px wide and scales UP to the window, so
    // a 600-wide browser window blew the handset layout up to 1.5x. Below 500 the scale
    // stays near 1 (a real handset is 390-430); 500-1080 is the tablet's range.
    const mobile = force === "mobile" || phoneForced || (force === "auto" && width < 500);
    // a landscape iPad is still a tablet: it has no hover, so the desktop carousel
    // (cursor graphic, hover-gated video) would be dead there. Route any coarse-pointer
    // viewport up to 1366 to the tablet layout, portrait or not.
    // an iPad with a trackpad or Magic Keyboard attached reports (hover: hover) and
    // (pointer: fine) — exactly like a desktop, which in landscape dropped it onto the
    // desktop layout (overlapping About grid, hover-only deck). The device decides, not
    // whichever pointer happens to be plugged in.
    const tablet = !mobile && (force === "tablet" || (force === "auto" && width < 1080)
      || (force === "auto" && width <= 1366 && ((touch && !fineHover) || iPadish)));
    return { mobile, tablet, profile: mobile ? "mobile" : tablet ? "tablet" : "desktop" };
  }

  // One scene scale for the whole site: 1440x844 design frame fitted into the viewport.
  // width AND height are both respected, so nothing is cropped on short screens;
  // clamped so type never gets tiny on laptops or absurd on 4K.
  // width fit is a hard ceiling (never crop sideways); height only shrinks, down to 0.72.
  function sceneScale(width, viewportHeight) {
    const fw = width / 1440, fh = viewportHeight / 844;
    return Math.min(fw, Math.min(1.08, Math.max(0.72, Math.min(fw, fh))));
  }

  // The tablet frame scales with the window WIDTH off the 834 baseline, capped at 1,
  // and the window HEIGHT caps it too (900 is the reference height for 100%).
  function tabletScale(width, viewportHeight) {
    const ST_MAX = 1;
    return Math.min(ST_MAX, width / 834, Math.max(0.62, viewportHeight / 900));
  }

  // The phone frame is fitted by WIDTH: 390 design px = the device width.
  function mobileScale(viewWidth, kFit) {
    return (viewWidth / 390) * kFit;
  }

  window.KCResponsiveProfile = {
    readDevice,
    resolveProfile,
    sceneScale,
    tabletScale,
    mobileScale,
  };
})();
