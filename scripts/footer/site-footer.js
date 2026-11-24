/*
 * Shared Footer runtime: the single owner of Footer legal dialogs, curtain and
 * Footer geometry on every page that renders templates/partials/footer.html.
 *
 * The homepage controller (portfolio-controller.js) keeps the responsive profile,
 * shared gutters, Navbar ink, cookie banner and language/resize handoff. It passes
 * its own instance as `host`, so the state these functions read and write is the
 * same state the controller used before the extraction. Static pages (case
 * studies) pass a plain host object instead; they never load the controller.
 *
 * Classic script: exposes window.KCSiteFooter.
 */
(function () {
  "use strict";

  // ---------------------------------------------------------------------------
  // Legal dialogs (Mentions légales / Politique de confidentialité)
  // ---------------------------------------------------------------------------

  // Wires one dialog element: scroll fade, close button and backdrop click.
  function registerSheet(host, el) {
    if (!el || el._wired) return;
    el._wired = true;
    if (!host.sheets) host.sheets = {};
    host.sheets[el.dataset.sheet] = el;
    const sc2 = el.querySelector("[data-scroll]");
    // the fade only shows while there is something left to scroll to
    const fade = () => {
      const atEnd = sc2.scrollTop + sc2.clientHeight >= sc2.scrollHeight - 2;
      const px = Math.max(16, Math.min(el._fadePx || 32, sc2.clientHeight * 0.22));
      const pct = sc2.clientHeight ? (100 - (px / sc2.clientHeight) * 100).toFixed(1) : 80;
      // a percentage survives a re-render intact, so React and fade() agree on the value
      const v = atEnd ? "none" : "linear-gradient(to bottom, #000 " + pct + "%, transparent 100%)";
      sc2.style.maskImage = sc2.style.webkitMaskImage = v;
    };
    sc2.addEventListener("scroll", fade);
    el._fade = fade;
    el.querySelector("[data-close]").addEventListener("click", () => closeSheet(host));
    el.addEventListener("click", (e) => { if (e.target === el) closeSheet(host); });
  }

  // Sizes the dialogs. `box` is the mobile frame box ({left, top, w, h, sc}) or null
  // for the desktop/tablet centered card; `vh` is the current small-viewport height.
  function fitSheets(host, box, vh) {
    Object.values(host.sheets || {}).forEach((el) => {
      const card = el.querySelector("[data-card]");
      const title = el.querySelector("[data-card] > div > span");
      if (box) {
        const k = box.sc;
        el.style.inset = "auto";
        el.style.boxSizing = "border-box";
        Object.assign(el.style, { left: box.left.toFixed(1) + "px", top: box.top.toFixed(1) + "px",
          width: box.w.toFixed(1) + "px", height: box.h.toFixed(1) + "px", padding: (16 * k).toFixed(1) + "px" });
        // a phone sheet stays a peek, not a page: ~500 characters of scroll viewport, and
        // the card grows only as far as the chrome around it needs
        Object.assign(card.style, { maxWidth: "100%", maxHeight: "100%", padding: (20 * k).toFixed(1) + "px" });
        card.style.paddingBottom = (20 * k).toFixed(1) + "px";
        const scEl = el.querySelector("[data-scroll]");
        if (scEl) {
          const lh = 14 * k * 1.6, n = Math.round(Math.max(150 * k, box.h * 0.4 - 120 * k) / lh);
          scEl.style.maxHeight = (n * lh + lh * 0.55).toFixed(1) + "px";
        }
        el._fadePx = 36 * k;
        if (title) title.style.fontSize = (28 * k).toFixed(1) + "px";
        card.querySelectorAll("[data-body] p").forEach((p) => {
          p.style.fontSize = (14 * k).toFixed(1) + "px";
        });
        card.querySelector("[data-body]").style.gap = (20 * k).toFixed(1) + "px";
        card.querySelectorAll("[data-body] > div").forEach((g) => { g.style.gap = (6 * k).toFixed(1) + "px"; });
        const hd = card.querySelector(":scope > div");
        if (hd) hd.style.paddingBottom = (16 * k).toFixed(1) + "px";
      } else {
        Object.assign(el.style, { left: "0px", top: "0px", right: "0px", bottom: "0px",
          width: "auto", height: "auto", padding: "24px", boxSizing: "border-box" });
        Object.assign(card.style, { maxWidth: "640px", maxHeight: "84vh", padding: "32px" });
        card.style.paddingBottom = "32px";
        const scEl = el.querySelector("[data-scroll]");
        if (scEl) {
          // land the cut on a half line: a line sliced in two is what actually reads as
          // "there is more below" — a cut on a paragraph gap looks like the end
          const lh = 25.6, n = Math.round(Math.max(180, Math.min(300, vh * 0.44 - 132)) / lh);
          scEl.style.maxHeight = (n * lh + lh * 0.55).toFixed(1) + "px";
        }
        el._fadePx = 48;
        if (title) title.style.fontSize = "40px";
        card.querySelectorAll("[data-body] p").forEach((p) => { p.style.fontSize = "16px"; });
        card.querySelector("[data-body]").style.gap = "28px";
        card.querySelectorAll("[data-body] > div").forEach((g) => { g.style.gap = "8px"; });
        const hd = card.querySelector(":scope > div");
        if (hd) hd.style.paddingBottom = "24px";
      }
      if (el._fade) requestAnimationFrame(el._fade);
    });
  }

  function openSheet(host, key, trigger) {
    const el = host.sheets && host.sheets[key];
    if (!el) return;
    if (!host._activeSheet) {
      host._sheetTrigger = trigger || document.activeElement;
      host._sheetInertState = new Map();
      // Inert every sibling branch between the dialog and the document. Walking the
      // composed tree also covers the portfolio's shadow-root host when present.
      let branch = el;
      while (branch) {
        const parent = branch.parentElement;
        if (parent) {
          [...parent.children].forEach((sibling) => {
            if (sibling === branch) return;
            if (!host._sheetInertState.has(sibling)) host._sheetInertState.set(sibling, sibling.inert);
            sibling.inert = true;
          });
          branch = parent;
        } else {
          const root = branch.getRootNode();
          if (!(root instanceof ShadowRoot)) break;
          [...root.children].forEach((sibling) => {
            if (sibling === branch) return;
            if (!host._sheetInertState.has(sibling)) host._sheetInertState.set(sibling, sibling.inert);
            sibling.inert = true;
          });
          branch = root.host;
        }
      }
    }
    const sc2 = el.querySelector("[data-scroll]");
    if (sc2) sc2.scrollTop = 0;
    if (el._fade) requestAnimationFrame(el._fade);
    Object.values(host.sheets).forEach((s2) => { s2.style.display = "none"; });
    el.style.display = "flex";
    host._activeSheet = el;
    const btn = el.querySelector("[data-close]");
    (btn || el).focus();
  }

  function closeSheet(host) {
    Object.values(host.sheets || {}).forEach((el) => { el.style.display = "none"; });
    host._activeSheet = null;
    (host._sheetInertState || new Map()).forEach((wasInert, el) => { el.inert = wasInert; });
    host._sheetInertState = null;
    const trigger = host._sheetTrigger;
    host._sheetTrigger = null;
    if (trigger && trigger.isConnected && typeof trigger.focus === "function") trigger.focus();
  }

  // Document click handler (capture phase): any a[data-legal] opens its dialog.
  function legalClickHandler(host) {
    return (e) => {
      const a = e.target && e.target.closest && e.target.closest("a[data-legal]");
      if (!a) return;
      e.preventDefault();
      openSheet(host, a.dataset.legal, a);
    };
  }

  // Document keydown handler: Escape closes, Tab/Shift+Tab stay inside the open dialog.
  function sheetKeyHandler(host) {
    return (e) => {
      const activeSheet = host._activeSheet;
      if (!activeSheet) return;
      if (e.key === "Escape") {
        e.preventDefault();
        closeSheet(host);
        return;
      }
      if (e.key !== "Tab") return;
      const focusable = [...activeSheet.querySelectorAll(
        'a[href], area[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), iframe, [tabindex]:not([tabindex="-1"])'
      )].filter((el) => !el.hidden && el.getAttribute("aria-hidden") !== "true" && el.getClientRects().length > 0);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      let current = document.activeElement;
      while (current && current.shadowRoot && current.shadowRoot.activeElement) current = current.shadowRoot.activeElement;
      if (!first) {
        e.preventDefault();
        activeSheet.focus();
      } else if (!activeSheet.contains(current)) {
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
      } else if (e.shiftKey && current === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && current === last) {
        e.preventDefault();
        first.focus();
      }
    };
  }

  // ---------------------------------------------------------------------------
  // Curtain (WebGL cloth in curtain-cloth.js)
  // ---------------------------------------------------------------------------

  // Lazily loads curtain-cloth.js and mounts the cloth into `el` once the Footer
  // approaches the viewport. Uses host.resolveRes(), host.footer and host.renderFooter().
  function attachCurtain(host, el) {
    if (!el || host.cloth === el) return;
    host.cloth = el;
    // the standalone/offline build inlines curtain-cloth.js and the curtain image as
    // blob URLs (see the ext-resource-dependency meta tags in <head>) so both still
    // load when this page is hosted with no assets/ folder alongside it. Defer this
    // module chain and the WebGL mount until the Footer approaches the viewport.
    const url = host.resolveRes("./curtain-cloth.js");
    // a bare relative specifier fails to import from some hosting contexts, so resolve it
    // against the document first and keep the raw path as a second try
    let abs = url;
    try { abs = new URL(url, document.baseURI).href; } catch (e) {}
    let activated = false;
    const activate = () => {
      if (activated || host.clothEl) return;
      activated = true;
      if (host._clothObserver) {
        host._clothObserver.disconnect();
        host._clothObserver = null;
      }
      const mount = (m) => {
        if (!el.isConnected || host.cloth !== el || host.clothEl) return;
        host.clothEl = m.mountCurtain(el, host.resolveRes("assets/about/footer-curtain.webp"));
        // renderFooter owns the scroll-derived progress; publish its current target
        // immediately so a quick jump into the Footer does not start from stale state.
        host.renderFooter();
      };
      import(abs)
        .then(mount)
        .catch(() => import(url).then(mount))
        .catch((err) => console.error("curtain load failed", err && (err.message || err)));
    };
    if (typeof IntersectionObserver === "undefined") {
      // Keep the existing eager behavior on browsers without IntersectionObserver.
      activate();
      return;
    }
    const prefetchDistance = Math.ceil(Math.max(window.innerHeight || 0, el.clientHeight || 0));
    host._clothObserver = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) activate();
    }, { rootMargin: `${prefetchDistance}px 0px` });
    // Observe the whole Footer, rather than only the viewport-sized canvas slot, so
    // a fast jump to the bottom still activates the curtain at the page end.
    host._clothObserver.observe(host.footer || el);
  }

  // Publishes the scroll-derived curtain target. Reads the Footer document position
  // and height cached by the geometry pass (host._footerTopDoc, host._footerHeight).
  function renderCurtain(host) {
    // both reads below used to be getBoundingClientRect() on every single frame — the nav
    // is position:fixed (its rect never moves with scroll, only resize, and that's already
    // re-cached in fit()) and the footer's document position only needs an arithmetic
    // scrollY subtraction from the value fit() already cached. Neither needs a live DOM read
    // in the render loop.
    const H = host.vh || host.vhNow();
    // how much of the footer block has entered the viewport, 0 -> 1
    let t = 0;
    if (host._footerHeight) {
      const top = host._footerTopDoc - window.scrollY;
      t = (H - top) / Math.max(1, host._footerHeight);
      t = t < 0 ? 0 : t > 1 ? 1 : t;
    }
    // the footer IS the end of the page, so the track can't ask for more scroll: the
    // curtain follows the last screen in, then draws itself shut once you arrive
    // the curtain closes with the scroll and nothing else: the old timed "auto close" part
    // reset itself whenever t dipped back under its threshold, which made the cloth open
    // again mid-scroll. Fully shut by the time 80% of the footer is in.
    let p = (t - 0.02) / 0.78;
    p = p < 0 ? 0 : p > 1 ? 1 : p;
    if (host.clothEl) host.clothEl.progress = p * p * (3 - 2 * p);
  }

  // Touch devices have no hover, so the cloth gets slow random "gusts" instead.
  // Called once per frame with host.time in seconds.
  function curtainGust(host) {
    if (host.clothEl && host.clothEl.mouse) {
      const m = host.clothEl.mouse;
      if (!host._gust || host.time > host._gust.until) {
        const r = Math.random;
        host._gust = {
          x: (r() * 2 - 1) * 0.8, y: (r() * 2 - 1) * 0.5,
          force: 0.22 + r() * 0.3,
          until: host.time + 1.6 + r() * 2.6,
          fade: 0.9 + r() * 1.2,
        };
        host._gustStart = host.time;
        host._gustDrift = (Math.random() * 2 - 1) * 0.12;
      }
      const g = host._gust;
      const k = Math.min(1, (host.time - host._gustStart) / (g.until - host._gustStart));
      // a gust is born where it is: no travel, just a swell that fades out
      // ease into the new gust's position instead of teleporting the pull point across
      // the cloth — a jump there is what made the curtain look like it snapped
      const gx = g.x + host._gustDrift * k;
      m.x = m.x == null ? gx : m.x + (gx - m.x) * 0.12;
      m.y = g.y + Math.sin(host.time * 1.7) * 0.02;
      m.force = g.force * Math.sin(Math.PI * k) * (0.85 + 0.15 * Math.sin(host.time * 5.3));
      m.active = k < 1;
    }
  }

  window.KCSiteFooter = {
    attachCurtain,
    renderCurtain,
    curtainGust,
    registerSheet,
    fitSheets,
    openSheet,
    closeSheet,
    legalClickHandler,
    sheetKeyHandler,
  };
})();
