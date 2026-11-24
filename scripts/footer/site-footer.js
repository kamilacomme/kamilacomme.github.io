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

  // Footer geometry owner. Lays out the heading, contact group and legal links for
  // the active profile, falls back to natural flow when the composition does not
  // fit, and keeps the curtain sized to the Footer. Reads the profile and scales the
  // host publishes (host.mobile, host.s/st/sm, host.kFit, host.devW/devH) and calls
  // host.vhNow(), host.lvhNow(), host.showCookies() and host.fitSheets().
  function fitFooter(host, tablet) {
    if (!host.footer) return;
    const mob = host.mobile;
    const sc = (mob ? host.sm : tablet ? host.st : host.s) || 1;
    const pageGeometry = getComputedStyle(document.documentElement);
    const edgeL = parseFloat(pageGeometry.getPropertyValue("--kc-page-gutter-x")) || (mob ? 16 : 32);
    const pageGutterBottom = parseFloat(pageGeometry.getPropertyValue("--kc-page-gutter-bottom")) || (mob ? 24 : 32);
    const px = (v) => (v * sc).toFixed(1) + "px";
    const typePx = (v) => v + "px";
    const footerGeometryKey = `${tablet ? "tablet" : mob ? "mobile" : "desktop"}:${window.innerWidth}x${window.innerHeight}:${Math.round(host.vhNow())}x${Math.round(host.lvhNow())}:${sc}:${edgeL}:${pageGutterBottom}`;
    const q = (sel) => host.footer.querySelector(sel);
    const head = q("[data-c='0']"), info = q("[data-c='1']"), legal = q("[data-c='4']");
    const syncFooterClothHeight = (height) => {
      if (!host.cloth) return;
      const normalizedHeight = height || "100svh";
      Object.assign(host.cloth.style, { left: "0px", top: "0px", width: "100vw",
        height: normalizedHeight, backgroundColor: "#000000" });
      const width = document.documentElement.clientWidth || window.innerWidth;
      const key = `${width}:${normalizedHeight}`;
      if (host._footerClothSizeKey !== key) {
        host._footerClothSizeKey = key;
        if (host.clothEl && host.clothEl.resize) host.clothEl.resize();
      }
    };
    // Scroll-triggered navbar alignment can call fitFooter() without changing
    // viewport geometry. Keep an already-expanded Footer stable so reading it
    // cannot trigger a second absolute-to-flow reflow or browser scroll anchoring.
    if (host._footerNaturalFlow && host._footerNaturalFlowKey === footerGeometryKey) {
      syncFooterClothHeight(host.footer.style.height);
      return;
    }
    // A prior short-height fit may have changed the same authored nodes into natural
    // document flow. Reset only those flow-owned properties before measuring the
    // regular composition for this viewport; the profile branch below reapplies its
    // normal geometry and typography.
    if (host._footerNaturalFlow) {
      Object.assign(host.footer.style, { display: "", flexDirection: "", alignItems: "",
        overflow: "hidden", minHeight: "", padding: "", boxSizing: "" });
      [head, info, legal].forEach((el) => {
        if (!el) return;
        Object.assign(el.style, { position: "absolute", margin: "", flex: "", alignSelf: "",
          left: "", right: "", top: "", bottom: "", width: "", maxWidth: "" });
      });
      host.footer.removeAttribute("data-kc-footer-mode");
      host._footerNaturalFlow = false;
      host._footerNaturalFlowKey = null;
    }
    const naturalFlowIfNeeded = (topInset) => {
      if (!head || !info || !legal) return false;
      const section = host.footer.getBoundingClientRect();
      const sectionHeight = host.footer.clientHeight;
      const boxes = [head, info, legal].map((el) => {
        const r = el.getBoundingClientRect();
        return { left: r.left, right: r.right, top: r.top - section.top,
          bottom: r.bottom - section.top };
      });
      // A previously tall mobile viewport can leave lvh latched after the browser
      // window shrinks. Test the authored composition against the live viewport as
      // well as its section bounds so the short-height fallback engages on resize.
      const availableHeight = mob ? Math.min(sectionHeight, window.innerHeight) : sectionHeight;
      const outside = boxes.some((r) => r.top < -1 || r.bottom > availableHeight + 1);
      const overlaps = boxes.some((a, i) => boxes.slice(i + 1).some((b) =>
        a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top));
      if (!outside && !overlaps) {
        host._footerNaturalFlowHeight = null;
        host._footerNaturalFlowKey = null;
        syncFooterClothHeight(host.footer.style.height);
        return false;
      }

      // The curtain is absolutely positioned and can retain the previous tall
      // viewport's height after a mobile resize. Collapse it while measuring either
      // short-height arrangement, then sync it to the final section below.
      if (host.cloth) host.cloth.style.height = "0px";

      // Try the Figma short-wide composition first: keep the heading at the left and
      // bottom-align contacts and legal links in one row. It is used only when the
      // actual rendered groups fit inside the shared gutters at their authored sizes.
      Object.assign(host.footer.style, { display: "flex", flexDirection: "row",
        alignItems: "flex-end", justifyContent: "flex-start", gap: "32px", height: "auto",
        minHeight: `${Math.max(0, window.innerHeight)}px`, overflow: "visible",
        padding: `16px ${edgeL}px ${pageGutterBottom}px`, boxSizing: "border-box" });
      [head, info, legal].forEach((el) => Object.assign(el.style, { position: "relative", left: "auto",
        right: "auto", top: "auto", bottom: "auto", width: "auto", maxWidth: "none",
        margin: "0px", flex: "0 0 auto", alignSelf: "auto" }));
      head.style.maxWidth = `calc(100vw - ${2 * edgeL}px)`;
      const rowBoxes = [head, info, legal].map((el) => {
        const r = el.getBoundingClientRect(), fr = host.footer.getBoundingClientRect();
        return { left: r.left - fr.left, right: r.right - fr.left,
          top: r.top - fr.top, bottom: r.bottom - fr.top };
      });
      const rowWidthFits = rowBoxes.every((r) => r.left >= edgeL - 1 && r.right <= window.innerWidth - edgeL + 1)
        && rowBoxes.every((r, i) => i === 0 || rowBoxes[i - 1].right + 1 <= r.left);
      const rowHeight = host.footer.scrollHeight;
      if (rowWidthFits && rowHeight <= window.innerHeight + 1) {
        host.footer.style.height = Math.ceil(Math.max(window.innerHeight, rowHeight)) + "px";
        host.footer.setAttribute("data-kc-footer-mode", "natural-flow-row");
        host._footerNaturalFlow = true;
        host._footerNaturalFlowKey = footerGeometryKey;
        host._footerNaturalFlowHeight = host.footer.style.height;
        syncFooterClothHeight(host.footer.style.height);
        return true;
      }

      // If that row cannot fit at this viewport's actual width and height, retain the
      // natural vertical scroll fallback, preserving the existing group hierarchy.
      Object.assign(host.footer.style, { flexDirection: "column", alignItems: "stretch", gap: "0px",
        height: "auto", minHeight: `${Math.max(0, window.innerHeight)}px`,
        padding: `0px 0px ${pageGutterBottom}px` });
      Object.assign(head.style, { maxWidth: `calc(100vw - ${2 * edgeL}px)`,
        margin: `${Math.max(0, topInset)}px ${edgeL}px 0px`, flex: "0 0 auto" });
      Object.assign(info.style, { margin: `32px ${edgeL}px 0px`, flex: "0 0 auto" });
      Object.assign(legal.style, { margin: `32px ${edgeL}px 0px`, flex: "0 0 auto" });
      // Reading scrollHeight includes wrapped bilingual text and the shared bottom
      // gutter. Use it to keep the section and existing scroll-driven curtain aligned.
      const naturalHeight = Math.max(window.innerHeight, host.footer.scrollHeight);
      host.footer.style.height = Math.ceil(naturalHeight) + "px";
      host.footer.setAttribute("data-kc-footer-mode", "natural-flow");
      host._footerNaturalFlow = true;
      host._footerNaturalFlowKey = footerGeometryKey;
      host._footerNaturalFlowHeight = Math.ceil(naturalHeight) + "px";
      syncFooterClothHeight(host.footer.style.height);
      return true;
    };
    if (mob) {
      // phone: the headline/email sit below the navbar; contact details and legal links
      // stay anchored to the frame's bottom edge
      const kFit = host.kFit || 1;
      const boxW = (host.devW || window.innerWidth) * kFit;
      const boxH = (host.devH || host.lvhNow()) * kFit;
      // the panel stays in flow at full window size — pulling it up with a negative top
      // made it ride over the About block. The phone screen is a centred box inside it.
      const bl = (window.innerWidth - boxW) / 2;
      // the footer block matches the viewport, exactly like the hero and projets sections, and
      // the curtain is stretched across the WHOLE block so no field of bare background is ever
      // visible; the text still sits inside the phone frame box
      // same height basis as the About section (frame box + letterbox), so the footer can
      // never be shorter than the block above it and leave a slab of field between them
      const scrH = Math.round(boxH + 2 * Math.max(0, (host.lvhNow() - boxH) / 2));
      const bt = Math.max(0, (scrH - boxH) / 2);
      const bb = Math.max(0, scrH - bt - boxH);
      Object.assign(host.footer.style, {
        position: "relative", left: "0px", top: "0px", width: "100vw", height: scrH + "px",
        backgroundColor: "#000000",
      });
      // the panel spans the window so it can't ride over the About block, but the footer
      // surface is only the phone screen: the black lives on the box, and the surround is the
      // same dark field as every other section's letterbox — never white, or it reads as a
      // slab of dead space between the last card and the curtain
      if (host.cloth) host.cloth.style.backgroundColor = "#000000";
      const contH = Math.min(boxH, host.vhNow() * kFit);
      // Mobile Footer typography and its 16px inset are effective CSS pixels. The
      // former phone-frame scale reduced the 32px contact heading to 26px at 320px
      // and the 11px legal links to 9px; keep geometry responsive without shrinking
      // text-bearing groups.
      const L = (bl + edgeL).toFixed(1) + "px";
      if (host.cloth) host.cloth.style.backgroundColor = "#000000";
      host.showCookies();
      host.fitSheets({ left: bl, top: bt, w: boxW, h: boxH, sc: sc });
      // Keep the heading below the navbar and inside the Footer frame, while contacts and
      // legal links remain pinned to the existing bottom gutter.
      const navB = host.nav ? host.nav.getBoundingClientRect().bottom : 0;
      const headTop = Math.max(bt + 96, navB + 24);
      if (head) Object.assign(head.style, { left: L, right: "auto", top: headTop.toFixed(1) + "px",
        bottom: "auto", fontSize: "32px", width: Math.max(0, boxW - 2 * edgeL).toFixed(1) + "px" });
      if (legal) {
        Object.assign(legal.style, { left: L, right: L, top: "auto",
          bottom: (bb + pageGutterBottom).toFixed(1) + "px",
          flexDirection: "column", alignItems: "flex-start", gap: "8px" });
        // the footer sits outside the mobile root, so the phone type-scale rule there
        // never reached it: body copy 14, labels 11
        [legal, info].forEach((box) => {
          if (!box) return;
          box.querySelectorAll("span, a").forEach((el) => {
            const w = getComputedStyle(el).fontWeight;
            const body = w === "400" || w === "normal";
            el.style.fontSize = (body ? 14 : 11) + "px";
          });
        });
        const cr = legal.querySelector(":scope > span");
        if (cr) cr.style.display = "none";
        const row = legal.querySelector(":scope > div");
        if (row) { row.style.flex = "0 1 auto"; row.style.flexDirection = "column"; row.style.flexWrap = "nowrap"; row.style.justifyContent = "flex-start"; row.style.alignItems = "flex-start"; row.style.gap = "8px"; }
        legal.querySelectorAll("a").forEach((el) => { el.style.fontSize = "11px"; });
      }
      if (info) {
        Object.assign(info.style, { left: L, right: "auto", top: "auto",
          // Keep a clear 32px group gap; the legal stack grows upward from its shared bottom gutter.
          bottom: (bb + pageGutterBottom + (legal ? legal.getBoundingClientRect().height : 0) + 32).toFixed(1) + "px", alignItems: "flex-start", gap: "8px" });
        info.querySelectorAll("span").forEach((el) => { el.style.fontSize = "14px"; el.style.textAlign = "left"; });
      }
      naturalFlowIfNeeded(head ? parseFloat(getComputedStyle(head).top) : bt + 96);
      return;
    }
    // iPad Safari: 100svh is the SHORT viewport (address bar showing) — once the bar hides a
    // strip of the section above shows through above the curtain. The tall viewport is used
    // instead, and it is LATCHED: re-assigning the height mid-scroll re-inits the cloth,
    // which is what made the curtain open again after it had closed.
    if (tablet) host._fhT = Math.max(host._fhT || 0, host.lvhNow(), host.vhNow());
    const fH = tablet ? host._fhT + "px" : "100svh";
    Object.assign(host.footer.style, { position: "relative", left: "0px", top: "0px", width: "100vw", height: fH, margin: "0", backgroundColor: "#000000" });
    if (host.cloth) Object.assign(host.cloth.style, { left: "0px", top: "0px", width: "100vw", backgroundColor: "#000000" });
    host.fitSheets(null);
    host.showCookies();
    // laid out on the 1440x813 Footer frame: headline at the top, contacts bottom-left,
    // legal links at x 583
    const X = (v) => (edgeL + (v - 33) * sc).toFixed(1) + "px";
    // Keep the headline/email inside the same two-sided page gutter as the navbar.
    // At narrow tablet widths the email then wraps at its authored <wbr> instead of
    // allowing its final glyph to sit against the viewport/scrollbar edge.
    if (head) Object.assign(head.style, { left: edgeL.toFixed(1) + "px", right: "auto", bottom: "auto",
      top: px(tablet ? 128 : 118), fontSize: typePx(tablet ? 48 : 56), width: "auto",
      maxWidth: `calc(100vw - ${2 * edgeL}px)` });
    if (info) {
      Object.assign(info.style, { left: edgeL.toFixed(1) + "px", right: "auto", top: "auto",
        bottom: pageGutterBottom.toFixed(1) + "px", alignItems: "flex-start", gap: px(8) });
      info.querySelectorAll("span").forEach((el) => { el.style.fontSize = typePx(14); el.style.textAlign = "left"; });
    }
    if (legal) {
      Object.assign(legal.style, { left: X(583), right: "auto", top: "auto", bottom: pageGutterBottom.toFixed(1) + "px",
        flexDirection: "row", alignItems: "flex-start", gap: px(32) });
      // The existing fit() pass publishes this alignment for both local and
      // route-prefixed section links, so Footer consumes the shared value directly.
      const projectStart = parseFloat(pageGeometry.getPropertyValue("--kc-nav-project-start"));
      if (!tablet && !mob && Number.isFinite(projectStart) && projectStart > 0) {
        legal.style.left = projectStart.toFixed(1) + "px";
      }
      const row = legal.querySelector(":scope > div");
      if (row) { row.style.flex = "0 0 auto"; row.style.flexDirection = "row"; row.style.flexWrap = "nowrap"; row.style.gap = px(32); }
      legal.querySelectorAll("a").forEach((el) => { el.style.fontSize = typePx(12); });
    }
    // Tablet legal links stay stacked, including the large authored tablet frame;
    // the horizontal legal row is reserved for the desktop composition.
    if (tablet) {
      if (legal) {
        Object.assign(legal.style, { left: edgeL.toFixed(1) + "px", right: "auto", bottom: pageGutterBottom.toFixed(1) + "px",
          flexDirection: "column", alignItems: "flex-start", gap: px(8) });
        const row = legal.querySelector(":scope > div");
        if (row) { row.style.flexDirection = "column"; row.style.flexWrap = "nowrap"; row.style.alignItems = "flex-start"; row.style.gap = px(8); }
      }
      const lh = legal ? legal.offsetHeight : 0;
      if (info) Object.assign(info.style, { bottom: (pageGutterBottom + lh + 32 * sc).toFixed(1) + "px", gap: px(8) });
    }
    naturalFlowIfNeeded(head ? parseFloat(getComputedStyle(head).top) : 118 * sc);
  }

  window.KCSiteFooter = {
    fitFooter,
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
