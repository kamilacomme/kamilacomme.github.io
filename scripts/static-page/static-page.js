/*
 * Static-page shell runtime for pages that do not load portfolio-controller.js
 * (case studies). It does three small things and nothing else:
 *
 * 1. Builds a Footer host for scripts/footer/site-footer.js, which remains the only
 *    owner of Footer geometry, legal dialogs and the curtain. Profile, scales and
 *    page gutters come from scripts/shared/responsive-profile.js (the same source
 *    the homepage controller uses), so the Footer follows the homepage formulas.
 * 2. Flips the static Navbar ink to the dark-surface values while the black Footer
 *    sits under the Navbar.
 */
(function () {
  "use strict";
  const F = window.KCSiteFooter;
  const P = window.KCResponsiveProfile;
  const footer = document.querySelector("[data-kc-footer-root]");
  if (!F || !P || !footer) return;
  const nav = document.querySelector(".kc-responsive-nav");

  // Viewport probes, as on the homepage: small (svh) and large (lvh) viewport heights.
  const probe = (unit) => {
    const el = document.createElement("div");
    el.setAttribute("aria-hidden", "true");
    el.style.cssText = `position: fixed; left: 0; top: 0; width: 0; height: 100${unit}; visibility: hidden; pointer-events: none;`;
    document.body.appendChild(el);
    return el;
  };
  const vhProbe = probe("svh");
  const lvhProbe = probe("lvh");

  const host = {
    footer,
    nav,
    s: 1, st: 1, sm: 1, kFit: 1, devW: 0, devH: 0,
    mobile: false, tablet: false, time: 0,
    vhNow() { return vhProbe.offsetHeight || window.innerHeight; },
    lvhNow() { return lvhProbe.offsetHeight || this.vhNow(); },
    // Static pages are served from their own route, so resources resolve from the site root.
    resolveRes(u) { return "/" + String(u).replace(/^\.?\//, ""); },
    showCookies() {},
    fitSheets(box) { F.fitSheets(host, box, host.vhNow()); },
    renderFooter() { F.renderCurtain(host); },
  };

  document.querySelectorAll("[data-kc-legal-sheet]").forEach((el) => F.registerSheet(host, el));
  document.addEventListener("click", F.legalClickHandler(host), true);
  document.addEventListener("keydown", F.sheetKeyHandler(host));

  let touch = false;
  function fit() {
    const c = P.current;
    if (!c.profile) return;
    host.mobile = c.mobile;
    host.tablet = c.tablet;
    host.s = c.s;
    host.st = c.st;
    host.sm = c.sm;
    host.vh = host.vhNow();
    touch = c.touch;
    F.fitFooter(host, host.tablet);
    const box = footer.getBoundingClientRect();
    host._footerTopDoc = box.top + window.scrollY;
    host._footerHeight = box.height;
    render();
  }

  // Navbar ink: light-surface values come from static-nav.css; over the black Footer
  // use the homepage's dark-surface defaults from the shared Navbar partial.
  const darkInk = {
    "--kc-nav-ink": "rgb(255,255,255)",
    "--kc-nav-muted": "rgb(189,183,189)",
    "--kc-nav-pill-bg": "rgba(34,32,34,0.55)",
    "--kc-nav-pill-border": "rgba(255,255,255,0.14)",
  };
  let navOnDark = null;
  function updateNavInk() {
    if (!nav) return;
    const navBox = nav.getBoundingClientRect();
    const onDark = footer.getBoundingClientRect().top <= navBox.top + navBox.height / 2;
    if (onDark === navOnDark) return;
    navOnDark = onDark;
    Object.entries(darkInk).forEach(([name, value]) => {
      if (onDark) nav.style.setProperty(name, value);
      else nav.style.removeProperty(name);
    });
  }

  function render() {
    F.renderCurtain(host);
    updateNavInk();
  }

  // Frame loop only while the Footer is near the viewport: curtain target and, on
  // touch devices, the same slow gusts the homepage gives the cloth.
  let raf = 0, last = 0, near = false;
  function frame(now) {
    raf = 0;
    const dt = Math.min(0.05, (now - (last || now - 16)) / 1000);
    last = now;
    host.time += dt;
    if (touch || host.tablet || host.mobile) F.curtainGust(host);
    render();
    if (near) raf = requestAnimationFrame(frame);
  }
  function setNear(value) {
    near = value;
    if (near && !raf) { last = 0; raf = requestAnimationFrame(frame); }
  }
  if (typeof IntersectionObserver !== "undefined") {
    new IntersectionObserver((entries) => setNear(entries.some((e) => e.isIntersecting)),
      { rootMargin: `${Math.ceil(window.innerHeight || 0)}px 0px` }).observe(footer);
  } else {
    setNear(true);
  }

  window.addEventListener("scroll", render, { passive: true });
  F.attachCurtain(host, footer.querySelector("[data-kc-footer-cloth]"));
  // The shared module re-publishes the profile on resize and font load; the Footer
  // follows each update.
  document.addEventListener("kc:profile", fit);
  fit();
})();
