window.createPortfolioComponent = function (DCLogic, React) {
class Component extends DCLogic {
  // maps a plain relative asset URL to the id used in its ext-resource-dependency meta
  // tag — lets the standalone/offline export swap in the inlined blob URL at runtime
  RESOURCE_MAP = {
    "assets/about/avatar.mp4": "avatarVid",
    "assets/about/footer-walk.mp4": "footerWalkVid",
    "assets/projets/pilates.mp4": "pilatesVid",
    "assets/projets/longread.mp4": "longreadVid",
    "assets/projets/inside-out.mp4": "insideoutVid",
    "assets/about/footer-curtain.webp": "footerCurtainImg",
    "./curtain-cloth.js": "curtainScript",
  };
  // iOS reports a window height that changes as the Safari address bar collapses. All the
  // section heights are 100svh (the SMALL viewport, which never moves), so every geometry
  // measurement reads this probe instead — otherwise the layout re-tiers mid-scroll.
  vhNow() {
    return (this.vhProbe && this.vhProbe.offsetHeight) || window.innerHeight;
  }
  // the LARGE viewport height: the full screen with the browser chrome collapsed. Below the
  // hero the page is always read in that state, so those blocks are measured against it —
  // measuring them with svh instead left a band of bare section background at the bottom
  // once the address bar hid itself.
  lvhNow() {
    return (this.lvhProbe && this.lvhProbe.offsetHeight) || this.vhNow();
  }
  // the unit ONE SCREEN of scroll is measured in. It must match the unit the scrolled
  // sections are sized in, or the animations advance faster than the page does and the
  // error compounds panel by panel.
  stepH() {
    return this.mobile ? this.lvhNow() : (this.vh || this.vhNow());
  }
  resolveRes(u) {
    const id = this.RESOURCE_MAP[u];
    return (id && window.__resources && window.__resources[id]) || u;
  }
  bgs = []; tickets = []; pSlides = {}; pSlideIdx = {};
  tBgs = []; tTickets = []; tCards = [];
  mCards = [];
  HOLD = 0.12; N = 6; BANDS = 11; TH = 416; OFF = 800;
  cards = []; CARD_H = 326; SPACING = 620;
  // section layout, in viewport heights
  PROJ_TOP = 1; PROJ_H = 6; ABOUT_TOP = 7;

  componentDidMount() {
    // Figtree arrives over the network. Every measured headline (the big MES PROJETS above
    // all) is sized from the font's own metrics, so a fit that runs before the file lands
    // measures a fallback face and the word ends up short of the edge — on a cold iPad,
    // never in a warm preview. Re-fit when the fonts report in, and again a beat later.
    if (document.fonts) {
      const again = () => { this._fontsIn = true; if (this.fit) this.fit(); };
      document.fonts.ready.then(again).catch(() => {});
      try { document.fonts.addEventListener("loadingdone", again); } catch (e) {}
      setTimeout(again, 1200);
      setTimeout(again, 3000);
    }
    // the first prune fires before the responsive layouts have settled, so re-run it a
    // few times — otherwise the off-screen copies keep the src they were handed early
    [0, 400, 1500].forEach((d) => setTimeout(() => this.pruneEmbeds(), d));
    // ?dbg=1 — a read-out of which layout branch is live and where the About cards
    // actually landed, so a device report is a measurement instead of a guess

    // tablet: the six project photographs are CSS backgrounds, so Safari only decodes them
    // the moment the section scrolls in — which is the black screen before Projets. Decode
    // them up front, off the real (possibly blob:) urls the document ended up with.
    this._warmBgs = () => {
      if (this._warmed) return;
      // Staged, not all at once: decoding sixty plates in one go is what froze the beam and
      // left the sections below black for the first seconds. The hero's own slides go first,
      // then everything else in small batches during idle time.
      const first = (this.heroSlides || []).concat(this.tHeroSlides || [], this.mHeroSlides || []).filter(Boolean);
      const rest = [].concat(this.bgs || []).filter(Boolean)
        .concat(this.root ? Array.from(this.root.querySelectorAll("[data-tmedia] div, [data-i] div")).slice(0, 60) : []);
      if (!first.length && !rest.length) { setTimeout(this._warmBgs, 300); return; }
      this._warmed = true;
      const seen = {};
      const decode = (el) => {
        const m = /url\("?([^")]+)"?\)/.exec(getComputedStyle(el).backgroundImage || "");
        if (!m || seen[m[1]]) return false;
        seen[m[1]] = 1;
        const im = new Image();
        im.src = m[1];
        if (im.decode) im.decode().catch(() => {});
        return true;
      };
      // what is on screen right now: the hero's first plate only
      first.slice(0, 2).forEach(decode);
      const queue = first.slice(2).concat(rest);
      const idle = window.requestIdleCallback || ((fn) => setTimeout(() => fn({ timeRemaining: () => 8 }), 120));
      const step = () => {
        if (!queue.length) return;
        // two plates per idle slice: enough to be ready long before the section arrives,
        // small enough that the projector never drops a frame
        let n = 2;
        while (n-- > 0 && queue.length) decode(queue.shift());
        idle(step);
      };
      idle(step);
    };
    // the first frames belong to the projector: the warm-up waits for the hero to be up
    if (window.requestIdleCallback) requestIdleCallback(() => setTimeout(this._warmBgs, 400));
    else setTimeout(this._warmBgs, 900);
    this.vh = this.vhNow();
    // --- hero projector ---
    this.cx = 720; this.cy = 407; this.tx = 720; this.ty = 407;
    this.ci = 0; this.ti = 0; this.time = 0; this.intro = true; this.introStart = 0;
    this.initDust();
    // every mailto (Hire me pill, nav link, footer address) reports a conversion to
    // Google Analytics / Tag Manager if one is installed; silent if not
    this._onMail = (e) => {
      const a = e.target && e.target.closest && e.target.closest("a[href^='mailto']");
      if (!a) return;
      const where = a.closest("[data-c]") ? "footer_address"
        : a.querySelector("span") ? "nav_hire_me" : "nav_email";
      const p = { event_category: "contact", event_label: where, transport_type: "beacon" };
      if (typeof window.gtag === "function") window.gtag("event", "contact_click", p);
      else if (window.dataLayer && window.dataLayer.push) window.dataLayer.push(Object.assign({ event: "contact_click" }, p));
      // a sandboxed preview frame swallows plain mailto navigation, so open it
      // explicitly — same behaviour on the real site
      if (window.top !== window) {
        e.preventDefault();
        window.open(a.getAttribute("href"), "_blank", "noopener,noreferrer");
      }
    };
    document.addEventListener("click", this._onMail, true);
    this._onLegal = (e) => {
      const a = e.target && e.target.closest && e.target.closest("a[data-legal]");
      if (!a) return;
      e.preventDefault();
      this.openSheet(a.dataset.legal);
    };
    document.addEventListener("click", this._onLegal, true);
    this._onKey = (e) => { if (e.key === "Escape") this.closeSheet(); };
    document.addEventListener("keydown", this._onKey);
    if (!this.heroSlides) this.heroSlides = [];
    if (!this.tHeroSlides) this.tHeroSlides = [];
    this.heroIdx = 0;
    this.heroTimer = setInterval(() => {
      const arr = this.mobile ? this.mHeroSlides : this.tablet ? this.tHeroSlides : this.heroSlides;
      if (!arr || !arr.length) return;
      const prev = this.heroIdx % arr.length;
      this.heroIdx = (prev + 1) % arr.length;
      if (arr[prev]) arr[prev].style.opacity = 0;
      if (arr[this.heroIdx]) arr[this.heroIdx].style.opacity = 1;
    }, 350);
    // --- projets ---
    this._bc = this.buildBarcode();
    // The previous project slideshow and tablet deck were disabled before redesign.

    // Old 3D Projects RAF loop removed: active Projects run in the separate iframe.

    this.fit = () => {
      this.vh = this.vhNow();
      // one scene scale for the whole site: 1440x844 design frame fitted into the viewport.
      // width AND height are both respected, so nothing is cropped on short screens;
      // clamped so type never gets tiny on laptops or absurd on 4K.
      const fw = window.innerWidth / 1440, fh = this.vhNow() / 844;
      // width fit is a hard ceiling (never crop sideways); height only shrinks, down to 0.72.
      const s = Math.min(fw, Math.min(1.08, Math.max(0.72, Math.min(fw, fh))));
      this.s = s;
      // Keep the Hero preview image-only responsive: size it in effective CSS pixels,
      // then account for its existing art-frame scale. If a very short viewport leaves
      // less vertical room below the heading, fit to that measured space rather than
      // letting the preview cover Hero copy.
      const fitHeroPreview = (plate, candidateWidth, scale, gutter, bottomInset, title) => {
        if (!plate || !scale) return;
        let titleBottom = title ? title.getBoundingClientRect().bottom : 0;
        if (title) {
          for (const child of title.children) {
            const range = document.createRange();
            range.selectNodeContents(child);
            for (const rect of range.getClientRects()) titleBottom = Math.max(titleBottom, rect.bottom);
          }
        }
        const availableWidth = Math.max(0, (document.documentElement.clientWidth || window.innerWidth) - 2 * gutter);
        const availableHeight = Math.max(0, this.vhNow() - bottomInset - titleBottom - 8);
        const effectiveWidth = Math.min(325, Math.max(230, candidateWidth), availableWidth, availableHeight * 326 / 204);
        const cssWidth = effectiveWidth / scale;
        plate.style.width = cssWidth.toFixed(2) + "px";
        plate.style.height = (cssWidth * 204 / 326).toFixed(2) + "px";
        plate.style.right = (gutter / scale).toFixed(2) + "px";
      };
      // the ticket cursor lives outside the scaled stage, so its label is sized by hand to
      // the same 44 design px as the "Me recruter" button (43 tall in the authored art)
      if (this.ticketCursorImg) {
        const k = (this._curK = (44 * s) / 43);
        this.ticketCursorImg.style.width = (216 * k).toFixed(1) + "px";
        this.ticketCursorImg.style.height = (87 * k).toFixed(1) + "px";
      }
      if (this.heroTop) {
        // Keep Hero type outside the shrinking artwork transform. Scale its anchor
        // coordinates independently so the heading remains at its established position.
        this.heroTop.style.transform = "translateX(-50%)";
        this.heroTop.style.setProperty("--kc-desktop-hero-scale", String(s));
      }
      if (this.heroBottom) {
        this.heroBottom.style.transform = "translateX(-50%)";
        this.heroBottom.style.setProperty("--kc-desktop-hero-scale", String(s));
      }
      if (this.heroContainer) {
        // width-fit stage: the plate is 1440 design px wide and as tall as the window needs,
        // so the photo is cover-cropped ONCE (no double zoom from scaling a 16:9 box up)
        const sh = window.innerWidth / 1440;
        const H = Math.round(this.vhNow() / sh);
        this.heroH = H;
        this.heroContainer.style.height = H + "px";
        this.heroContainer.style.transform = "translate(-50%,-50%) scale(" + sh + ")";
        // the container's own layout width is fixed at 1440 by design (only its height and
        // its transform:scale change) — cache it here so heroApply() doesn't need a live
        // offsetWidth read on every single animation frame just to get back the same 1440
        // it always was.
        this._heroW = this.heroContainer.offsetWidth || 1440;
        if (this.heroSvg) this.heroSvg.setAttribute("viewBox", "0 0 1440 " + H);
        if (this.beamBlur) {
          const sd = (24 * Math.max(1, H / 813)).toFixed(1);
          if (this._sd !== sd) { this._sd = sd; this.beamBlur.setAttribute("stdDeviation", sd); }
        }
        if (this.maskRect) this.maskRect.setAttribute("height", H);
        if (this.heroImg) this.heroImg.setAttribute("height", H);
        if (this.heroCanvas && this.heroCanvas.height !== H) this.heroCanvas.height = H;
      }
      // the desktop stage is a 1440-wide frame whose HEIGHT follows the window, so its
      // clip edge always sits at the window edge (cards used to get cut mid-screen on
      // tall displays) and the tickets stay optically where they were designed
      const frameH = Math.max(844, Math.round(this.vhNow() / s));
      this.frameH = frameH;
      if (this.aStage) this.aStage.style.height = frameH + "px";
      // the projets stage was cover-scaled (the LARGER of width-fit and height-fit), so on a
      // tablet — where the window is much narrower than the 1440 design frame — the stage grew
      // wider than the screen and the deck was cropped sideways. Touch devices fit by WIDTH;
      // the stage's height follows the section, so nothing is cropped in either direction.
      if (this.aStage) this.aStage.style.transform = "translate(-50%,-50%) scale(" + s + ")";
      if (this.wordmark) this.wordmark.style.transform = "translateX(-50%) scale(" + s + ")";

      // ---- tablet frame (834 x 1112) ----
      // the 834x1112 frame is portrait: only use it on portrait-ish viewports.
      // short/wide windows keep the desktop frame, which fits by width.
      const portrait = this.vhNow() / window.innerWidth > 1.05;
      // "layout" prop forces a frame so each version can be reviewed at any window size
      const force = (this.props && this.props.layout) || "auto";
      // optional device preset: review a forced frame at a real handset's viewport
      // picking a handset IS the request to see the phone frame — no need to also
      // switch "layout", which is what made the preset look dead before
      const dev = ((this.props && this.props.phone) || "auto");
      const dm = dev.match(/(\d+)\s*[x×]\s*(\d+)\s*$/);
      this.devW = dm ? +dm[1] : 0; this.devH = dm ? +dm[2] : 0;
      // an explicit desktop/tablet choice still wins over the handset preset
      if (force === "desktop" || force === "tablet") { this.devW = 0; this.devH = 0; }
      const phoneForced = this.devW > 0;
      // forcing the phone frame without picking a handset: preview a default 390x844 phone
      if (force === "mobile" && !this.devW) { this.devW = 390; this.devH = 844; }
      // resizing a desktop window has to walk desktop → tablet → phone, so in auto mode the
      // WIDTH decides the tier on its own; orientation no longer gates it (a short landscape
      // window used to skip the tablet tier entirely and jump straight to the phone)
      // 500, not 640: the phone frame is 390 design px wide and scales UP to the window, so
      // a 600-wide browser window blew the handset layout up to 1.5x. Below 500 the scale
      // stays near 1 (a real handset is 390-430); 500-1080 is the tablet's range.
      const mobile = force === "mobile" || phoneForced || (force === "auto" && window.innerWidth < 500);
      // a landscape iPad is still a tablet: it has no hover, so the desktop carousel
      // (cursor graphic, hover-gated video) would be dead there. Route any coarse-pointer
      // viewport up to 1366 to the tablet layout, portrait or not.
      const touch = window.matchMedia && window.matchMedia("(hover: none), (pointer: coarse)").matches;
      const fineHover = window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
      // a coarse-pointer report alone is not enough to call something a tablet: some
      // desktop browsers and embedded views report one while showing a full-size window,
      // and routing those to the tablet branch left the DESKTOP dom on screen driven by
      // tablet logic — the About cards then never moved at all.
      const iPadish = /iPad|iPhone|iPod|Android/i.test(navigator.userAgent)
        || (navigator.platform === "MacIntel" && (navigator.maxTouchPoints || 0) > 1);
      // an iPad with a trackpad or Magic Keyboard attached reports (hover: hover) and
      // (pointer: fine) — exactly like a desktop, which in landscape dropped it onto the
      // desktop layout (overlapping About grid, hover-only deck). The device decides, not
      // whichever pointer happens to be plugged in.
      const tablet = !mobile && (force === "tablet" || (force === "auto" && window.innerWidth < 1080)
        || (force === "auto" && window.innerWidth <= 1366 && ((touch && !fineHover) || iPadish)));
      this.tablet = tablet; this.mobile = mobile;
      const big = !tablet && !mobile;
      // desktop projets is 1 screen (carousel); tablet/phone still scroll 6 panels
      this.ABOUT_TOP = big || tablet ? 2.35 : 7;
      // reset before the mobile branch may measure a real one, so switching layouts (or
      // rotating) never leaves the phone's measured value behind on desktop
      this.PROJ_TOP = 1;
      // desktop finishes its card grid at ~2.4 screens — no idle scroll before the footer
      if (this.about) this.about.style.height = big ? "800svh" : mobile ? "400lvh" : "400svh";
      // the tablet now runs the DESKTOP projets carousel (same tickets, same fanned
      // animation); only the About block below it stays tablet-specific
      const fineHover2 = fineHover;
      this.touch = (touch || tablet || mobile) && !fineHover2;
      // ABOUT_TOP/RANGE describe where the About block really is, in screens. Measure the
      // section that is actually on screen rather than trusting a constant — the sections
      // above it have changed height several times, and a stale constant parks the cards
      // outside the frame for the whole block.
      this._aboutSec = () => (mobile ? (this.root && this.root.querySelector("#apropos-m"))
        : tablet ? (this.root && this.root.querySelector("#apropos-t"))
        : this.about);
      this._measureAbout = () => {
        const sec = this._aboutSec();
        if (!sec) return;
        const r = sec.getBoundingClientRect();
        if (r.height <= 0) return;
        const step = this.stepH();
        this.ABOUT_TOP = (r.top + window.scrollY) / step;
        this.ABOUT_RANGE = Math.max(1, (r.height - step) / step);
      };
      // the carousel is authored on a 1440 frame and cover-scaled on desktop; on a tablet
      // that scale blew the tickets up (and pushed the edge labels off-frame). Run the
      // stage at 1:1 there instead: 16/12 type stays 16/12 and the deck reads smaller.
      // the desktop carousel is desktop-only again: the tablet has its own block with the
      // same composition, so nothing here is re-sized in window pixels
      // the phone runs the same desktop carousel, scaled into the 390 frame
      // the tablet block carries the SAME composition as the desktop one — black field, the
      // word behind the deck, one horizontal carousel — on its own tablet frame
      if (this.dRoot) this.dRoot.style.display = big ? "block" : "none";
      if (this.about) this.about.style.display = big ? "block" : "none";
      if (this.heroTop) this.heroTop.style.display = big ? "block" : "none";
      if (this.heroBottom) this.heroBottom.style.display = big ? "block" : "none";
      const tabletHeroHeading = document.querySelector("[data-kc-tablet-hero-title]");
      if (tabletHeroHeading) tabletHeroHeading.style.display = tablet ? "block" : "none";
      // the bar spans the window, so the content frames span it too. Their 32px design
      // margin then resolves to the same real pixels as the bar's, which lines the hero
      // headline up with the wordmark and the preview card up with the Hire-me pill —
      // without squeezing the copy into a narrower 1440 island.
      if (big) {
        // Absolutely positioned Hero/Projects frames use the document's layout
        // containing block. On browsers with classic scrollbars this is narrower
        // than innerWidth; using innerWidth here shifts a centered frame left by
        // half the scrollbar width while the fixed navbar stays on the layout edge.
        const layoutWidth = document.documentElement.clientWidth || window.innerWidth;
        const Wd = Math.round(layoutWidth / s);
        [this.heroTop, this.aStage].forEach((el) => { if (el) el.style.width = Wd + "px"; });
        if (this.heroTop) this.heroTop.style.width = layoutWidth + "px";
        if (this.heroBottom) {
          this.heroBottom.style.width = layoutWidth + "px";
          const heroArt = this.heroBottom.querySelector(".kc-desktop-hero-art");
          if (heroArt) heroArt.style.width = Wd + "px";
        }
        const stmt = this.aStage && this.aStage.firstElementChild;
        if (stmt) stmt.style.width = (Wd - 64) + "px";
        // the fact cards sit on the frame's own 12-column grid: a card is 3 columns wide and
        // the slots step 3 columns, so every gap between cards is the 24 gutter
        const GAPd = 24;
        const colD = (Wd - 64 - 11 * GAPd) / 12;
        const cardD = 3 * colD + 2 * GAPd;
        // The five About cards follow Figma's fixed 1440px composition grid.
        // The host stage still uses its existing desktop scale, but column
        // offsets must not expand with Wd while card widths remain 326px.
        const figmaCardLeft = { "0": 29.523, "1": 846.523, "2": 379.523, "3": 1082, "4": 32.5 };
        const aboutCardD = 326;
        (this.cards || []).forEach((el) => {
          if (!el) return;
          // Behance belongs to the rightmost grid column. The desktop stage
          // expands to Wd, so anchor its right edge to that stage's 32px inset.
          // Other card positions stay as previously approved.
          const left = el.dataset.i === "3" ? Wd - 32 - aboutCardD : figmaCardLeft[el.dataset.i];
          el.style.left = left.toFixed(1) + "px";
          el.style.width = aboutCardD + "px";
          el.style.height = aboutCardD + "px";
        });
        this.CARD_H = aboutCardD;
        // Hero preview remains image-only art; clamp its visible width while keeping its
        // 326:204 ratio and existing bottom/right anchor.
        const hPlate = this.heroBottom && this.heroBottom.querySelector("[data-hplate]");
        if (hPlate) {
          fitHeroPreview(hPlate, cardD * s, s, 32 * s, 32 * s,
            this.heroTop && this.heroTop.querySelector(".kc-desktop-hero-title"));
        }
      }
      if (this.tHero) this.tHero.style.display = tablet ? "block" : "none";
      if (this.tRoot) this.tRoot.style.display = tablet ? "block" : "none";
      if (this.mHero) this.mHero.style.display = mobile ? "block" : "none";
      if (this.mRoot) this.mRoot.style.display = mobile ? "block" : "none";
      // no floor here: short phone viewports (browser chrome eats ~200px) must still
      // fit the whole 390x844 frame, otherwise the hero and cards get cropped
      // the phone frame is fitted by WIDTH (390 design width = the device width) and
      // grows/shrinks vertically with the real viewport, so type keeps its designed size
      // forced phone: fit the whole device box into the window so nothing is cropped,
      // while the frame still measures 390 design px across
      // iOS grows/shrinks this.vhNow() as the address bar hides on scroll. Measuring
      // the phone frame off it made the whole layout re-tier mid-scroll (the wordmark
      // switching between MES PROJETS / PROJETS, tickets changing height). The svh probe
      // is the SMALL viewport height: it never moves while scrolling, so all phone
      // geometry is measured against it and the layout holds still.
      const stableH = this.vh || this.vhNow();
      const fullH = this.lvhNow();
      // the device-preview fit must follow the window LIVE: the cached "stable" height can
      // be left over from a shorter window, which shrank the frame and clipped the content
      const kFit = this.devW ? Math.min(1, window.innerWidth / this.devW, Math.max(stableH, fullH, this.vhNow()) / this.devH) : 1;
      this.kFit = kFit;
      const viewW = this.devW || window.innerWidth;
      // the hero is the one block read with the address bar still showing, so it alone is
      // measured on the small viewport; projets/about/footer fill the whole screen
      const heroViewH = this.devH || stableH;
      const viewH = this.devH || fullH;
      let sm = (viewW / 390) * kFit;
      const mHeroFrameH = Math.round(heroViewH / (viewW / 390));
      const mFrameH = Math.round(viewH / (viewW / 390));
      this.sm = sm; this.mFrameH = mFrameH; this.mHeroFrameH = mHeroFrameH;
      if (this.mHero) this.mHero.style.height = mHeroFrameH + "px";
      [this.mAStage].forEach((el) => { if (el) el.style.height = mFrameH + "px"; });
      if (mobile) {
        [this.mHero, this.mAStage].forEach((el) => {
          if (el) el.style.transform = "translate(-50%,-50%) scale(" + sm + ")";
        });
        const bw = (this.devW || window.innerWidth) * kFit;
        const bh = (this.devH || fullH) * kFit;
        const bl = (window.innerWidth - bw) / 2;
        const bt = Math.max(0, (fullH - bh) / 2);
        // the sticky panel IS the phone screen: it pins at the frame's top edge and is
        // exactly one screen tall, so the project photo is cropped to the handset's
        // aspect and never paints a band above or below the frame
        const aPanel = this.mAStage && this.mAStage.parentElement;
        if (aPanel) {
          this.mAPanel = aPanel;
          aPanel.style.background = "#ffffff";
          aPanel.style.zIndex = "";
          if (aPanel.parentElement) {
            aPanel.parentElement.style.zIndex = "3";
            // the section's own background is the letterbox around the phone frame — it has
            // to be the dark field, not white, or the frame sits in a white slab that reads
            // as dead space between the cards and the footer
            aPanel.parentElement.style.background = "#08080a";
          }
        }
        const panels = [aPanel];
        panels.forEach((el) => {
          if (!el) return;
          Object.assign(el.style, { top: bt.toFixed(1) + "px", height: bh.toFixed(1) + "px",
            width: bw.toFixed(1) + "px", marginLeft: bl.toFixed(1) + "px" });
        });
        // the phone runs the desktop projets carousel, so the About block does not start
        // where the 7-screen constant assumed — measure it instead of trusting a number
        const ab = mobile && this.root && this.root.querySelector("#apropos-m");
        if (ab) {
          const r = ab.getBoundingClientRect();
          const stepH = mobile ? fullH : this.vh;
          this.ABOUT_TOP = (r.top + window.scrollY) / stepH;
          this.ABOUT_RANGE = Math.max(1, (r.height - stepH) / stepH);
        }
        // the projets section becomes the phone screen itself, so the word, the deck and
        // the captions all sit on the frame instead of on the window
        if (this.dProj) Object.assign(this.dProj.style, { top: bt.toFixed(1) + "px",
          height: bh.toFixed(1) + "px", width: bw.toFixed(1) + "px", marginLeft: bl.toFixed(1) + "px",
          marginTop: (-bt).toFixed(1) + "px" });

        const showGrid = !!(this.props && this.props.grid);
        (this.mGrids || []).forEach((el) => { if (el) el.style.display = showGrid ? "flex" : "none"; });
      }
      if (!mobile && this.mAPanel && this.mAPanel.parentElement) this.mAPanel.parentElement.style.background = "#ffffff";
      clearTimeout(this._pruneT);
      this._pruneT = setTimeout(() => this.pruneEmbeds(), 120);
      // the whole tablet frame scales with the window WIDTH off the 834 baseline, so a wide
      // iPad grows heading + ticket together instead of leaving a hard 88 title in dead space.
      // capped at 1.25 so type stays readable rather than poster-sized.
      const ST_MAX = 1;
      // ...and the window HEIGHT caps it too: a short landscape window (a narrowed desktop
      // window now lands on the tablet tier) used to keep st at 1, so the 64px hero title
      // stayed full size on a 600-tall screen and read as oversized. 900 is the reference
      // height at which the tablet type is shown at 100%.
      let st = Math.min(ST_MAX, window.innerWidth / 834, Math.max(0.62, this.vhNow() / 900));
      if (force !== "auto" && this.devW) st = Math.min(ST_MAX, this.devW / 834, Math.max(0.62, this.devH / 900));
      this.st = st;
      // Shared tablet design-to-screen scale for the active portfolio block.
      window.__kcTabletScale = st;
      // the tablet stage height follows the window too, so the ticket is centred on the
      // SCREEN rather than inside a 1112 frame that may be taller than the viewport
      const tFrameH = Math.max(200, Math.round(this.vhNow() / st));
      this.tFrameH = tFrameH;
      if (tablet) {
        // same treatment as desktop: the bar spans the window, so the content frames span it
        // too and their 24px margin lands on the bar's. The forced preview keeps the real
        // 834 frame so the tablet can still be reviewed at its designed width.
        const Wt = force === "auto" ? Math.round(window.innerWidth / st) : 834;
        const layoutWidth = document.documentElement.clientWidth || window.innerWidth;
        // the projets frame spans the window like the hero's, so its 32 margin lands on the
        // same real pixels as the navbar's K and the drag caption sits on the window edges
        if (this.tAStage) this.tAStage.style.width = Wt + "px";
        // The Hero art still uses its viewport-aware image geometry, but the surrounding
        // frame is now in screen CSS pixels. This keeps its portrait and 12px cue out of
        // the tablet design-fit scale used by the animated About stage.
        if (this.tHero) {
          this.tHero.style.width = layoutWidth + "px";
          this.tHero.style.height = this.vhNow() + "px";
          this.tHero.style.transform = "translate(-50%,-50%)";
        }
        this.tFrameW = Wt;
        // the statement keeps a real margin off both edges instead of running to the frame
        const tStmt = this.tAStage && this.tAStage.firstElementChild;
        if (tStmt) { tStmt.style.left = "32px"; tStmt.style.width = (Wt - 64) + "px"; }
        // the projector plate is the heaviest thing on an iPad: a smaller blur radius on the
        // beam mask is what lets the walk run at frame rate instead of stepping
        if (this.beamBlur) {
          // a fixed radius: growing it with a tall portrait plate is pure cost on a device
          // that blurs in software
          const sdT = "15";
          if (this._sd !== sdT) { this._sd = sdT; this.beamBlur.setAttribute("stdDeviation", sdT); }
        }
        // the About cards' left/size is owned by renderAbout (grid-driven). Writing a
        // second set of positions here beat it: renderAbout caches el._l, so once fit()
        // overwrote left the grid never restored it and 450k stayed on top of Mastère.
        // the hero frame follows the window height too, so its bottom cluster (portrait +
        // scroll cue) rides the window edge instead of a fixed 1112 frame that can overflow
        if (this.tAStage) this.tAStage.style.height = tFrameH + "px";
        // Active tablet layout and About frame.
        try { this.renderAbout(); } catch (e) {}
        this.fitProjLabels(st, force);
        this.showTGrid(st, force);
        if (this.tAStage) this.tAStage.style.transform = "translate(-50%,-50%) scale(" + st + ")";
      }
      // navbar rides whichever frame is active
      if (this.nav) {
        this.nav.classList.toggle("kc-tablet-nav", tablet);
        // The navigation frame fills the viewport directly. Keep its spacing in the
        // previous effective layout units while typography remains independently sized.
        const navScale = mobile ? sm : tablet ? st : s;
        this.nav.style.setProperty("--kc-nav-scale", String(navScale));
        this.nav.style.setProperty("--kc-nav-gutter", ((mobile ? 16 : 32) * navScale).toFixed(3) + "px");
        this.nav.style.setProperty("--kc-nav-block-padding", ((mobile ? 12 : 15) * navScale).toFixed(3) + "px");
        // the phone / tablet frame is centred in the window — the navbar has to ride
        // its top edge, not the window's, otherwise it floats above the design
        const boxH = mobile ? (this.devH ? this.devH * kFit : this.vhNow())
          : tablet && force !== "auto" ? 1112 * st : 0;
        this.nav.style.top = boxH ? Math.max(0, (this.vhNow() - boxH) / 2).toFixed(1) + "px" : "0px";
        const p = this.nav.querySelector("a[href^='#projets']"), a = this.nav.querySelector("a[href^='#apropos']");
        const suffix = mobile ? "-m" : tablet ? "-t" : "";
        if (p) p.setAttribute("href", "#projets" + suffix);
        if (a) a.setAttribute("href", "#apropos" + suffix);
        // no room for the section links on a phone: logo + Hire me only
        const links = this.nav.querySelector(":scope > div");
        if (links) links.style.display = mobile || tablet ? "none" : "flex";
        const cdi = this.nav.querySelector("[data-fixed-ink] > [data-fixed-ink]");
        const pill = cdi ? cdi.parentElement : null;
        if (pill) pill.style.display = mobile ? "none" : "inline-flex";
        const cta = this.nav.querySelector("a[href^='mailto'] > span");
        if (cta) cta.style.fontSize = "var(--kc-type-body, 14px)";
      }
      if (tablet && this.tHero && this.nav) {
        // Reuse the navbar's resolved page gutter, including its measured narrow-tablet
        // variant, so every Hero anchor follows the same responsive shell policy.
        const layoutWidth = document.documentElement.clientWidth || window.innerWidth;
        const navGutter = parseFloat(getComputedStyle(this.nav).getPropertyValue("--kc-nav-gutter")) || 32;
        const tPlate = this.tHero.firstElementChild;
        const tabletHeroTitle = document.querySelector("[data-kc-tablet-hero-title]");
        if (tPlate) {
          const pw = Math.max(0, 4 * ((layoutWidth - 2 * navGutter - 11 * 24) / 12) + 3 * 24);
          fitHeroPreview(tPlate, pw, 1, navGutter, 32, tabletHeroTitle);
        }
        const tControls = this.tHero.querySelector("[data-kc-tablet-hero-controls]");
        if (tControls) {
          tControls.style.left = navGutter.toFixed(2) + "px";
          tControls.style.bottom = navGutter.toFixed(2) + "px";
        }
        if (tabletHeroTitle) {
          tabletHeroTitle.style.left = navGutter.toFixed(2) + "px";
          tabletHeroTitle.style.top = "128px";
          tabletHeroTitle.style.width = Math.max(0, layoutWidth - 2 * navGutter).toFixed(2) + "px";
        }
      }
      // the scrim has to ride the phone frame too, otherwise the white wordmark sits
      // on bare photo and disappears over the light project shots
      if (this.navScrim) {
        this.navScrim.style.display = "none";
        if (mobile) {
          const bw = (this.devW || window.innerWidth) * kFit;
          const bh = (this.devH || this.lvhNow()) * kFit;
          Object.assign(this.navScrim.style, {
            left: ((window.innerWidth - bw) / 2).toFixed(1) + "px",
            width: bw.toFixed(1) + "px",
            top: Math.max(0, (this.vhNow() - bh) / 2).toFixed(1) + "px",
            height: (132 * sm).toFixed(1) + "px",
            background: "linear-gradient(to bottom, rgba(8,8,10,0.82) 0%, rgba(8,8,10,0.5) 48%, rgba(8,8,10,0) 100%)",
          });
        } else {
          Object.assign(this.navScrim.style, {
            left: "0px", width: "100vw", top: "0px", height: "128px",
            background: "linear-gradient(to bottom, rgba(8,8,10,0.62) 0%, rgba(8,8,10,0.34) 45%, rgba(8,8,10,0) 100%)",
          });
        }
      }
      // Tweaks preview: mask everything outside the forced frame so the phone / tablet
      // version reads as a device viewport instead of a column on a wide background
      if (!this._mask) {
        this._mask = document.createElement("div");
        Object.assign(this._mask.style, { position: "fixed", zIndex: "480", pointerEvents: "none", display: "none", borderRadius: "4px", boxShadow: "0 0 0 9999px rgb(10,10,12)", outline: "1px solid rgba(255,255,255,0.16)" });
        document.body.appendChild(this._mask);
      }
      const fw2 = this.devW ? this.devW * kFit : tablet ? 834 * st : 0;
      const fh2 = this.devH ? this.devH * kFit : tablet ? 1112 * st : 0;
      if (force === "auto" || !fw2) {
        this._mask.style.display = "none";
      } else {
        Object.assign(this._mask.style, {
          display: "block",
          width: fw2.toFixed(1) + "px", left: ((window.innerWidth - fw2) / 2).toFixed(1) + "px",
          height: fh2.toFixed(1) + "px",
          top: Math.max(0, (this.vhNow() - fh2) / 2).toFixed(1) + "px",
        });
      }
      this._tabletMode = tablet;
      if (!tablet) this.showTGrid(1, force);
      this.fitFooter(tablet);
      // cache footer/nav geometry here (resize-time only) so renderFooter() and
      // surfaceIsLight() can do pure arithmetic every frame instead of
      // getBoundingClientRect() every frame — see the note above _measureAbout for why.
      if (this.footer) {
        const fr = this.footer.getBoundingClientRect();
        this._footerTopDoc = fr.top + window.scrollY;
        this._footerHeight = fr.height;
      }
      if (this.nav) {
        const nr = this.nav.getBoundingClientRect();
        // the nav is position:fixed, so unlike the footer its rect does not move with
        // scroll at all — caching it here is exact, not an approximation
        this._navRect = { left: nr.left, top: nr.top, height: nr.height };
        const nl = Math.round(nr.left);
        if (nl !== this._navL) { this._navL = nl; this.fitFooter(this.tablet); }
      }
      if (this._measureAbout) this._measureAbout();
      // Publish the completed shared tablet viewport policy. Projects owns its own
      // geometry and consumes this only after the controller has written the Hero,
      // About frame, and navigation dimensions for this layout pass.
      const tabletLayout = {
        tablet,
        scale: st,
        width: window.innerWidth,
        height: window.innerHeight,
      };
      window.__kcTabletLayout = tabletLayout;
      const tabletLayoutKey = [tablet, st, tabletLayout.width, tabletLayout.height].join(':');
      if (this._tabletLayoutKey !== tabletLayoutKey) {
        this._tabletLayoutKey = tabletLayoutKey;
        window.dispatchEvent(new CustomEvent('kc:tablet-layout-change', { detail: tabletLayout }));
      }
    };
    this.fit();
    // Safari keeps the page in its freeze/back-forward cache: coming back from another app
    // restores it WITHOUT a resize event, so every measured layout (the projets block, the
    // wordmark) is still sized for the viewport it was laid out in — which is what cropped
    // the deck and left the word in an arbitrary spot. Re-fit whenever the page comes back,
    // and reset the latched footer height only when the viewport really changed.
    this._revive = () => {
      const vp = window.innerWidth + "x" + Math.round(this.lvhNow());
      if (this._lastVP !== vp) { this._lastVP = vp; this._fhT = 0; }
      if (this.fit) this.fit();
      // fonts and the address bar settle a beat later
    };
    window.addEventListener("pageshow", this._revive);
    // no focus listener: it fires on every tap into the page and duplicates visibilitychange
    try {
      const back = sessionStorage.getItem("kc-scroll");
      if (back != null) {
        sessionStorage.removeItem("kc-scroll");
        const y = parseInt(back, 10) || 0;
        [60, 300, 800].forEach((t) => setTimeout(() => window.scrollTo(0, y), t));
      }
    } catch (e) {}
    window.addEventListener("orientationchange", () => setTimeout(this._revive, 250));
    document.addEventListener("visibilitychange", () => { if (!document.hidden) setTimeout(this._revive, 80); });
    if (window.visualViewport) window.visualViewport.addEventListener("resize", this._revive);
    window.addEventListener("resize", this.fit);
    [200, 800, 2000].forEach((t) => setTimeout(() => this.fit && this.fit(), t));
    window.addEventListener("load", () => this.fit && this.fit());

    this.tick = this.tick.bind(this);
    if (this.raf) cancelAnimationFrame(this.raf);
    this._gen = (window.__kcGen = (window.__kcGen || 0) + 1);
    this.raf = requestAnimationFrame(this.tick);
    // animation frames are suspended while the document is hidden (background tab, an
    // offscreen preview frame). The scroll-linked sections must not depend on that: place
    // them straight from the scroll event too, so they are always correct on arrival.
    this._onScroll = () => {
      if (this._gen !== window.__kcGen) return;
      try { this.renderAbout(); this.renderFooter(); } catch (e) {}
      // mobile needs this on scroll just as much as tablet does: without it, anything
      // gated by nearness (like the footer walk clip) only ever gets checked at page load,
      // long before the user has scrolled anywhere near it, and never again after that.
      if (this.tablet || this.mobile) {
        clearTimeout(this._pruneS);
        this._pruneS = setTimeout(() => this.pruneEmbeds(), 250);
      }
    };
    window.addEventListener("scroll", this._onScroll, { passive: true });
  }
  fitFooter(tablet) {
    if (!this.footer) return;
    const mob = this.mobile;
    const sc = (mob ? this.sm : tablet ? this.st : this.s) || 1;
    const margin = mob ? 16 : 32;
    const nr = this.nav ? this.nav.getBoundingClientRect() : null;
    const edgeL = nr ? nr.left + margin * sc : margin * sc;
    const edgeR = nr ? window.innerWidth - nr.right + margin * sc : margin * sc;
    const edge = edgeL;
    const px = (v) => (v * sc).toFixed(1) + "px";
    const q = (sel) => this.footer.querySelector(sel);
    if (mob) {
      // phone: one left-aligned column inside the phone frame — headline, contact
      // details, gif, then the address pinned to the frame's bottom edge
      const kFit = this.kFit || 1;
      const boxW = (this.devW || window.innerWidth) * kFit;
      const boxH = (this.devH || this.lvhNow()) * kFit;
      // the panel stays in flow at full window size — pulling it up with a negative top
      // made it ride over the About block. The phone screen is a centred box inside it.
      const bl = (window.innerWidth - boxW) / 2;
      // the footer block matches the viewport, exactly like the hero and projets sections, and
      // the curtain is stretched across the WHOLE block so no field of bare background is ever
      // visible; the text still sits inside the phone frame box
      // same height basis as the About section (frame box + letterbox), so the footer can
      // never be shorter than the block above it and leave a slab of field between them
      const scrH = Math.round(boxH + 2 * Math.max(0, (this.lvhNow() - boxH) / 2));
      const bt = Math.max(0, (scrH - boxH) / 2);
      const bb = Math.max(0, scrH - bt - boxH);
      Object.assign(this.footer.style, {
        position: "relative", left: "0px", top: "0px", width: "100vw", height: scrH + "px",
        backgroundColor: "#000000",
      });
      // the panel spans the window so it can't ride over the About block, but the footer
      // surface is only the phone screen: the black lives on the box, and the surround is the
      // same dark field as every other section's letterbox — never white, or it reads as a
      // slab of dead space between the last card and the curtain
      if (this.cloth) this.cloth.style.backgroundColor = "#000000";
      const contH = Math.min(boxH, this.vhNow() * kFit);
      const L = (bl + 16 * sc).toFixed(1) + "px";
      if (this.cloth) {
        Object.assign(this.cloth.style, { left: "0px", top: "0px",
          width: "100vw", height: scrH + "px" });
        if (this.clothEl && this.clothEl.resize) this.clothEl.resize();
      }
      this.showCookies();
      this.fitSheets({ left: bl, top: bt, w: boxW, h: boxH, sc: sc });
      const head = q("[data-c='0']"), info = q("[data-c='1']"), gif = q("[data-c='3']"), legal = q("[data-c='4']");
      // gif at the top under the navbar, headline and email as one 32px block below it,
      // contacts and legal links pinned to the bottom edge
      // the head group hangs off the NAVBAR's real bottom edge, not off the box top: on a
      // short screen the box top can sit level with the bar, which is what put the gif
      // right under the links. A measured gap keeps clear of it at any screen height.
      const navB = this.nav ? this.nav.getBoundingClientRect().bottom : 0;
      const headTop = Math.max(bt + 96 * sc, navB + 24 * sc);
      if (gif) Object.assign(gif.style, { left: L, right: "auto", top: headTop.toFixed(1) + "px",
        bottom: "auto", width: px(48), height: px(48) });
      if (head) Object.assign(head.style, { left: L, right: "auto", top: (headTop + 72 * sc).toFixed(1) + "px",
        bottom: "auto", fontSize: px(32), width: px(358) });
      if (legal) {
        Object.assign(legal.style, { left: L, right: L, top: "auto",
          bottom: (bb + 14 * sc).toFixed(1) + "px",
          flexDirection: "row", alignItems: "flex-end", gap: px(16) });
        // the footer sits outside the mobile root, so the phone type-scale rule there
        // never reached it: body copy 14, labels 11
        [legal, info].forEach((box) => {
          if (!box) return;
          box.querySelectorAll("span, a").forEach((el) => {
            const w = getComputedStyle(el).fontWeight;
            const body = w === "400" || w === "normal";
            el.style.fontSize = px(body ? 14 : 11);
          });
        });
        const cr = legal.querySelector(":scope > span");
        if (cr) cr.style.display = "none";
        const row = legal.querySelector(":scope > div");
        if (row) { row.style.flex = "0 0 auto"; row.style.flexDirection = "row"; row.style.justifyContent = "flex-start"; row.style.alignItems = "flex-end"; row.style.gap = px(16); }
        legal.querySelectorAll("a").forEach((el) => { el.style.fontSize = px(11); });
      }
      if (info) {
        Object.assign(info.style, { left: L, right: "auto", top: "auto",
          bottom: (bb + 64 * sc).toFixed(1) + "px", alignItems: "flex-start", gap: px(8) });
        info.querySelectorAll("span").forEach((el) => { el.style.fontSize = Math.max(14, 16 * sc).toFixed(1) + "px"; el.style.textAlign = "left"; });
      }
      return;
    }
    // iPad Safari: 100svh is the SHORT viewport (address bar showing) — once the bar hides a
    // strip of the section above shows through above the curtain. The tall viewport is used
    // instead, and it is LATCHED: re-assigning the height mid-scroll re-inits the cloth,
    // which is what made the curtain open again after it had closed.
    if (tablet) this._fhT = Math.max(this._fhT || 0, this.lvhNow(), this.vhNow());
    const fH = tablet ? this._fhT + "px" : "100svh";
    Object.assign(this.footer.style, { position: "relative", left: "0px", top: "0px", width: "100vw", height: fH, margin: "0", backgroundColor: "#000000" });
    if (this.cloth) {
      const same = this._clothH === fH;
      this._clothH = fH;
      Object.assign(this.cloth.style, { left: "0px", top: "0px", width: "100vw", height: fH, backgroundColor: "#000000" });
      if (!same && this.clothEl && this.clothEl.resize) this.clothEl.resize();
    }
    this.fitSheets(null);
    this.showCookies();
    // laid out on the 1440x813 footer frame from the file: 64 italic headline at the
    // top, contacts bottom-left, legal links at x 583, gif bottom-right
    const head = q("[data-c='0']"), info = q("[data-c='1']"), gif = q("[data-c='3']"), legal = q("[data-c='4']");
    const X = (v) => (edgeL + (v - 33) * sc).toFixed(1) + "px";
    if (head) Object.assign(head.style, { left: edgeL.toFixed(1) + "px", right: "auto", bottom: "auto",
      top: px(tablet ? 128 : 118), fontSize: px(tablet ? 48 : 56), width: "auto" });
    if (info) {
      Object.assign(info.style, { left: edgeL.toFixed(1) + "px", right: "auto", top: "auto",
        bottom: px(21), alignItems: "flex-start", gap: px(8) });
      info.querySelectorAll("span").forEach((el) => { el.style.fontSize = px(14); el.style.textAlign = "left"; });
    }
    // the gif's right edge is taken from the Hire me pill itself, not recomputed from the
    // margin: whatever the bar's own edge is, the corner element lands on it exactly.
    // The bar has two mailto links (the Contact nav item first), so pick the LAST one.
    const hires = this.nav ? this.nav.querySelectorAll("a[href^='mailto']") : null;
    const hire = hires && hires.length ? hires[hires.length - 1] : null;
    const pr = hire ? hire.getBoundingClientRect() : null;
    const edgeR2 = pr && pr.width ? Math.max(0, window.innerWidth - pr.right) : edgeR;
    if (gif) Object.assign(gif.style, { left: "auto", right: edgeR2.toFixed(1) + "px", top: "auto",
      bottom: px(27), width: px(48), height: px(48) });
    if (legal) {
      Object.assign(legal.style, { left: X(583), right: "auto", top: "auto", bottom: px(22),
        flexDirection: "row", alignItems: "flex-start", gap: px(32) });
      // desktop: the legal column starts on the PROJETS link in the navbar, measured
      const np = this.nav && this.nav.querySelector("a[href^='#projets']");
      const fr = this.footer.getBoundingClientRect();
      if (!tablet && !mob && np) {
        const nl2 = np.getBoundingClientRect().left - fr.left;
        if (nl2 > 0) legal.style.left = nl2.toFixed(1) + "px";
      }
      const row = legal.querySelector(":scope > div");
      if (row) { row.style.flex = "0 0 auto"; row.style.gap = px(32); }
      legal.querySelectorAll("a").forEach((el) => { el.style.fontSize = px(12); });
    }
    // tablet: one left column at the bottom — contacts, then the legal links under them;
    // the gif keeps the opposite corner
    if (tablet) {
      // left column: phone + city, then each legal link on its own line. Gif keeps the
      // opposite corner. Steps are 8, 16, 32 off the base unit.
      if (legal) {
        Object.assign(legal.style, { left: edgeL.toFixed(1) + "px", right: "auto", bottom: px(32),
          flexDirection: "column", alignItems: "flex-start", gap: px(8) });
        const row = legal.querySelector(":scope > div");
        if (row) { row.style.flexDirection = "column"; row.style.alignItems = "flex-start"; row.style.gap = px(8); }
      }
      const lh = legal ? legal.offsetHeight : 0;
      if (info) Object.assign(info.style, { bottom: (32 * sc + lh + 32 * sc).toFixed(1) + "px", gap: px(8) });
      // gif: smaller square, bottom edge flush with the bottom of the privacy line
      // (32 base + the 12/1.5 half-leading of that line)
      if (gif) Object.assign(gif.style, { left: "auto", right: edgeR2.toFixed(1) + "px", top: "auto",
        bottom: px(35), width: px(64), height: px(64) });
    }
  }

  componentWillUnmount() {
    if (this._onScroll) window.removeEventListener("scroll", this._onScroll);
    if (this._onMail) document.removeEventListener("click", this._onMail, true);
    if (this._onLegal) document.removeEventListener("click", this._onLegal, true);
    if (this._onKey) document.removeEventListener("keydown", this._onKey);
    if (this.raf) cancelAnimationFrame(this.raf);
    if (this.heroTimer) clearInterval(this.heroTimer);
    if (this.pSlideTimer) clearInterval(this.pSlideTimer);
    window.removeEventListener("resize", this.fit);
  }

  // ===================== HERO =====================
  initDust() {
    this.dust = [];
    for (let i = 0; i < 0; i++) {
      const z = 0.35 + Math.random() * 0.65;
      this.dust.push({ x: Math.random() * 1440, y: Math.random() * 900, z: z,
        vy: 0.12 + z * 0.4, sway: 6 + Math.random() * 14, ph: Math.random() * 6.28, tw: 1.2 + Math.random() * 2.6 });
    }
  }
  drawDust() {
    if (!this.heroCanvas) return;
    if (!this.hctx) this.hctx = this.heroCanvas.getContext("2d");
    const ctx = this.hctx, b = this.beam;
    ctx.clearRect(0, 0, 1440, this.heroH || 813);
    if (!b || b.a < 0.02) return;
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = "#fff";
    const span = b.mode === "cone" ? (b.cy - b.ay) : 0;
    for (let i = 0; i < this.dust.length; i++) {
      const p = this.dust[i];
      p.y -= p.vy;
      p.x += Math.sin(this.time * 0.6 + p.ph) * p.sway * 0.012;
      if (p.y < -20) { p.y = 840; p.x = Math.random() * 1440; }
      let lum = 0;
      if (b.mode === "circle") {
        const dist = Math.hypot(p.x - b.cx, p.y - b.cy);
        if (dist < b.R) { const across = 1 - dist / b.R; lum = across * across; }
      } else {
        const t = (p.y - b.ay) / span;
        if (t > 0.04 && t < 1.12) {
          const centerX = b.ax + (b.cx - b.ax) * t;
          const halfW = b.apexHW + (b.baseHW - b.apexHW) * t;
          const dx = Math.abs(p.x - centerX);
          if (dx < halfW) {
            const across = 1 - dx / halfW;
            const vert = Math.min(1, t * 1.6) * (1 - Math.max(0, t - 0.92) / 0.22);
            lum = across * across * Math.max(0, vert);
          }
        }
      }
      lum *= b.a * p.z * (0.55 + 0.45 * Math.sin(p.ph + this.time * p.tw));
      if (lum <= 0.02) continue;
      const rad = 0.7 + p.z * 1.7;
      ctx.globalAlpha = Math.min(0.9, lum);
      ctx.beginPath();
      ctx.arc(p.x, p.y, rad, 0, 6.2832);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  }
  heroApply() {
    if (!this.heroImg) return;
    const a = Math.max(0, Math.min(1, this.ci));
    const w = this._heroW || 1440;
    const shape = (this.props && this.props.beamShape) || "cone";
    // the phone shows the same 1440-wide projector plate cropped to 390 — the beam has
    // to shrink with it, otherwise it floods the whole screen. But the plate's HEIGHT
    // (heroH) grows a lot on tall narrow phones, so that same shrink also has to grow
    // back with it or the beam reads as a pinprick against a much taller canvas.
    const HHpre = this.heroH || 813;
    // The plate is always 1440 design px wide and is scaled to cover the screen width, so
    // these width terms are ALREADY proportional to the screen; the shaft's length grows on
    // its own because cy scales with the plate height. A tall portrait plate still reads a
    // little thin, so it gets a modest bump — CLAMPED, because feeding the raw height ratio
    // into width terms inflates the pool past the screen edges and turns the spotlight into
    // a flat wash that kills the lit/dark seat contrast.
    const mobileBeam = this.mHero && this.mHero.style.display === 'block';
    const tabletBeam = this.tHero && this.tHero.style.display === 'block';
    const touchBeam = mobileBeam || tabletBeam;
    const k = Math.min(1.6, Math.max(1, HHpre / 813));
    if (shape === "circle") {
      const R = w * 0.105 * k;
      if (this.maskShaft) this.maskShaft.setAttribute("points", "0,0 0,0 0,0 0,0");
      if (this.glowShaft) this.glowShaft.setAttribute("points", "0,0 0,0 0,0 0,0");
      [this.maskPool, this.glowPool].forEach((el) => {
        if (!el) return;
        el.setAttribute("cx", this.cx); el.setAttribute("cy", this.cy);
        el.setAttribute("rx", R); el.setAttribute("ry", R);
        // a plain round spotlight: tight falloff, no perspective tilt, and none of the
        // long projector-throw gradient the cone uses
        el.setAttribute("transform", "");
        el.setAttribute("fill", "url(#poolRound)");
        // a hard-edged disc: the 24px blur of the projector cone is what smeared this into
        // a wedge, so the round spotlight gets its own tight blur
        el.setAttribute("filter", "url(#beamCrisp)");
      });
      this.beam = { mode: "circle", cx: this.cx, cy: this.cy, R: R, a: a * 0.7 };
    } else {
      const ax = 720 + (this.cx - 720) * 0.14;
      const HH = this.heroH || 813;
      // a real projector head: the further down and out it points, the longer the throw,
      // so the pool spreads, flattens into perspective and tilts along the beam
      const throwY = Math.max(0.12, Math.min(1.25, this.cy / (HH * 0.72)));
      const off = (this.cx - ax) / (720 * 0.9);
      // The projector plate is 1440 design pixels wide and scales down to the phone.
      // Make the visible pool about 90% of the real phone width, rather than
      // multiplying a desktop-sized cone that becomes tiny after scaling.
      const baseHalfWidth = (118 + 74 * throwY) * k;
      const baseHW = touchBeam ? Math.max(baseHalfWidth, w * 0.45) : baseHalfWidth;
      const ay = -40, apexHW = touchBeam ? 24 * k : 16 * k;
      const shaft = (ax - apexHW) + "," + ay + " " + (ax + apexHW) + "," + ay + " " +
        (this.cx + baseHW) + "," + this.cy + " " + (this.cx - baseHW) + "," + this.cy;
      const prx = baseHW * (1.18 + 0.26 * throwY), pry = baseHW * (0.52 - 0.20 * throwY);
      const rot = (off * 13).toFixed(2);
      if (this.maskShaft) { this.maskShaft.setAttribute("points", shaft); this.maskShaft.setAttribute("filter", "url(#beamSoft)"); }
      if (this.glowShaft) { this.glowShaft.setAttribute("points", shaft); this.glowShaft.setAttribute("filter", "url(#beamSoft)"); }
      // single-pass blur only: a second filtered pass over the whole plate was needless
      // main-thread cost in every browser for a difference nobody could see
      const shaftBlur = touchBeam ? "31" : "15";
      if (this.beamBlur && this._sd !== shaftBlur) { this._sd = shaftBlur; this.beamBlur.setAttribute("stdDeviation", shaftBlur); }
      [this.maskPool, this.glowPool].forEach((el) => {
        if (!el) return;
        el.setAttribute("cx", this.cx); el.setAttribute("cy", this.cy);
        el.setAttribute("rx", prx); el.setAttribute("ry", pry);
        el.setAttribute("fill", "url(#poolGrad)");
        el.setAttribute("filter", "none");
        el.setAttribute("transform", "rotate(" + rot + " " + this.cx.toFixed(1) + " " + this.cy.toFixed(1) + ")");
      });
      this.beam = { mode: "cone", ax: ax, ay: ay, apexHW: apexHW, baseHW: baseHW, cx: this.cx, cy: this.cy, a: a };
    }
    // lamp flicker: a tungsten bulb never sits perfectly still, and the light falls off
    // as the head reaches for the far corners of the room
    const tm = this.time || 0;
    const flick = 0.955 + 0.045 * Math.sin(tm * 11.3) * Math.sin(tm * 4.1) + 0.012 * Math.sin(tm * 27.7);
    const reach = 1 - 0.16 * Math.min(1, Math.abs(this.cx - 720) / 720);
    this.heroImg.style.opacity = a * flick * reach * (shape === "circle" ? 0.44 : 0.72);
    // the duplicate glow group (a second/third blurred pass over the whole plate) stays
    // off permanently now — it never added enough to be worth its per-frame cost
    if (this.heroGlow && !this._glowOff) { this._glowOff = true; this.heroGlow.style.opacity = "0"; this.heroGlow.style.display = "none"; }
  }
  heroTarget(e) {
    if (!this.heroContainer) return;
    const rect = this.heroContainer.getBoundingClientRect();
    this.tx = (e.clientX - rect.left) * (this.heroContainer.offsetWidth / rect.width);
    this.ty = (e.clientY - rect.top) * (this.heroContainer.offsetHeight / rect.height);
  }

  // ===================== PROJETS =====================
  // the real barcode, taken bar-for-bar from the supplied artwork (89 x 352) and
  // scaled to whatever span the slot needs
  buildBarcode(horizontal, span) {
    const SRC = 352;
    const bars = [[0,6.57066],[11.2637,16.896],[32.8516,7.50933],[45.0547,4.69333],[51.627,2.816],[59.1348,6.57066],[70.3984,16.896],[91.9902,7.50933],[104.193,4.69333],[110.764,2.816],[115.457,13.1413],[130.697,3.20729],[134.707,6.41457],[143.527,17.6401],[163.572,10.4237],[180.225,15.0187],[203.689,9.38666],[216.832,5.632],[227.156,6.57066],[237.482,15.0187],[257.193,7.50933],[268.459,3.75466],[274.09,2.816],[280.66,9.38666],[295.68,21.5893],[323.842,10.3253],[339.797,5.632],[348.246,3.75466]];
    const H = span || (horizontal ? 400 : 352);
    const k = H / SRC;
    let cur = 0;
    const stops = [];
    bars.forEach(([y, h]) => {
      const a = y * k, b = Math.min(H, (y + h) * k);
      if (a > cur) stops.push("transparent " + cur.toFixed(2) + "px " + a.toFixed(2) + "px");
      stops.push("rgb(43,59,55) " + a.toFixed(2) + "px " + b.toFixed(2) + "px");
      cur = b;
    });
    if (cur < H) stops.push("transparent " + cur.toFixed(2) + "px " + H.toFixed(2) + "px");
    return "linear-gradient(to " + (horizontal ? "right" : "bottom") + ", " + stops.join(",") + ")";
  }
  ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

  // desktop, tablet and phone each carry their own copy of the ticket deck, so all six
  // YouTube players used to boot at once — on a phone that alone eats the frame budget.
  // Only the embeds inside the layout actually on screen keep a src.
  pruneEmbeds() {
    if (!this.root) this.root = document.querySelector("[data-kc-root]") || document.body;
    this.root.querySelectorAll("iframe[src], iframe[data-src]").forEach((f) => {
      const live = f.offsetParent !== null;
      if (!live && f.src) { f.dataset.src = f.src; f.removeAttribute("src"); }
      else if (live && !f.getAttribute("src") && f.dataset.src) { f.src = f.dataset.src; }
    });
    // same for video: the desktop / tablet / phone copies share the same files, so a
    // plain src on all 13 tags made the browser download every clip up to six times
    // iPadOS gives a page only a handful of hardware video decoders. Every clip in the
    // layout is "live" by offsetParent even when it is four screens away, and the ones that
    // asked last (the About avatar, the footer gif) then never decoded at all. On tablet and
    // mobile a clip counts as live only while its own card is near the viewport (both axes,
    // since the tablet deck and the mobile ticket rail scroll horizontally) — this is what
    // keeps mobile from starting every project's mp4 the moment the ticket rail exists.
    const near = (this.tablet || this.mobile) ? (el) => {
      const r = el.getBoundingClientRect(), vh = window.innerHeight || 0, vw = window.innerWidth || 0;
      return r.bottom > -0.5 * vh && r.top < 1.5 * vh && r.right > -0.5 * vw && r.left < 1.5 * vw;
    } : null;
    this.root.querySelectorAll("video").forEach((v) => {
      // The three active tablet portfolio clips have their own unconditional
      // looping player; the general near-viewport manager must not pause,
      // unload, or restart them (including while the tablet root is hidden).
      if (v.matches("#kc-tablet-projets video.motion")) return;
      // the tiny About avatar clip is marked data-eager: it's small enough that starting
      // its download right away (instead of waiting for the section to scroll near) removes
      // the multi-second blank gap it otherwise leaves the first time that section is seen
      const eager = v.dataset.eager === "1";
      const live = v.offsetParent !== null && (eager || !near || near(v));
      // Mobile project tickets keep their authored positions in the scaled canvas. Pause
      // offscreen clips without unloading their source so returning to a card does not restart
      // its media request; larger carousel clips are still evicted when they leave the viewport.
      const isMobileTicket = !!v.dataset.poster && !v.dataset.hover && !v.dataset.gate;
      if (!live) {
        if (!v.paused) v.pause();
        if (isMobileTicket) return;
        if (v.getAttribute("src")) { v.dataset.src = v.getAttribute("src"); v.removeAttribute("src"); v.load(); }
        return;
      }
      if (!v.getAttribute("src") && v.dataset.src) { v.src = this.resolveRes(v.dataset.src); v.load(); }
      // the poster is gated the same way as src: a native poster="" attribute gets
      // fetched by the browser the moment the element is parsed, regardless of where it
      // sits off-canvas, so setting it eagerly for all six mobile tickets was quietly
      // pulling in three extra images on page load. Only the ticket that's actually near
      // gets one now.
      if (!v.getAttribute("poster") && v.dataset.poster) { v.poster = this.resolveRes(v.dataset.poster); }
      // iOS Safari does not clip a <video> to its parent's border-radius — the corners have
      // to be on the element itself
      if (!v._rad) {
        const p = v.parentElement;
        const r = p && getComputedStyle(p).borderRadius;
        if (r && r !== "0px") { v._rad = r; v.style.borderRadius = r; }
      }
      // hover clips stay paused until pointerenter — and setting src on an <video autoplay>
      // starts it on its own, so pause anything that is not actually being hovered
      // the tablet deck owns its own clips: only the card in the middle plays
      if (v.dataset.gate) {
        if (v._gateOn) { if (v.paused) { const q = v.play(); if (q && q.catch) q.catch(() => {}); } }
        else if (!v.paused) { v.pause(); try { v.currentTime = 0; } catch (e) {} }
        return;
      }
      if (v.dataset.hover) {
        const card = v.closest("a[data-i]");
        if (!(card && card._hoverOn) && !v.paused) { v.pause(); try { v.currentTime = 0; } catch (e) {} }
        return;
      }
      if (v.paused) { const p = v.play(); if (p && p.catch) p.catch(() => {}); }
    });
  }
  // the tablet frame keeps its 834 design width but its height follows the window, so a
  // landscape iPad leaves ~620 design px of height. A portrait ticket does not fit there:
  // below ~860 the card turns into two columns and the wordmark steps down with it.
  // in the forced-tablet preview the window is far wider than the 834 frame, so the edge
  // labels and the big wordmark have to hang off the FRAME, not the window
  fitProjLabels(st, force) {
    const boxW = force !== "auto" ? 834 * st : window.innerWidth;
    const boxH = force !== "auto" ? 1112 * st : this.vhNow();
    const boxL = (window.innerWidth - boxW) / 2;
    // the preview masks everything outside the frame vertically too, so the bottom edge
    // of the frame — not of the window — is what these sit on
    const boxB = Math.max(0, (this.vhNow() - boxH) / 2);
    const ckT = this.cookies && this.cookies.desktop;
    if (ckT) {
      // the banner sits on the same grid line as FAIRE GLISSER, on the frame's edge
      ckT.style.left = (boxL + 32 * st).toFixed(1) + "px";
      ckT.style.bottom = (boxB + 32 * st).toFixed(1) + "px";
      ckT.style.right = "auto";
    }
  }

  showTGrid(st, force) {
    const on = !!(this.props && this.props.grid) && !this.mobile;
    let g = this._tGrid;
    if (!on) { if (g) g.style.display = "none"; return; }
    if (!g) {
      g = this._tGrid = document.createElement("div");
      Object.assign(g.style, { position: "fixed", top: "0px", height: "100%", zIndex: "496", pointerEvents: "none" });
      document.body.appendChild(g);
    }
    const tab = !!this.tablet;
    const sc = tab ? st : window.innerWidth / 1440;
    const boxW = tab && force !== "auto" ? 834 * st : window.innerWidth;
    const boxL = (window.innerWidth - boxW) / 2;
    const M = 32 * sc, GAP = 24 * sc;
    const contentW = boxW - 2 * M;
    const colW = (contentW - 11 * GAP) / 12;
    const period = colW + GAP;
    Object.assign(g.style, {
      display: "block",
      left: (boxL + M).toFixed(1) + "px",
      width: contentW.toFixed(1) + "px",
      backgroundImage: "repeating-linear-gradient(to right, rgba(202,229,108,0.34) 0px, rgba(202,229,108,0.34) "
        + colW.toFixed(2) + "px, rgba(202,229,108,0) " + colW.toFixed(2) + "px, rgba(202,229,108,0) "
        + period.toFixed(2) + "px)",
    });
  }
  // the landscape wordmark is drawn as SVG and cropped to its own measured geometry: the
  // box comes from the same getBBox as the crop, so the word fills the width and its
  // baseline sits on the bottom edge whatever the font metrics report.


  // ink-flush metrics for the big wordmark: the size at which the INK measures targetW, and
  // the left offset that puts that ink on x = 0. Safari's canvas ignores letterSpacing, so
  // the -0.04em tracking is taken off by hand where that support is missing.

  // phone: the ticket gives up a little everywhere — media height, inner gaps and the
  // barcode — as the frame gets shorter. u = 0 tightest, u = 1 full desktop metrics.

  // Figtree metrics for a word scaled so its ink measures targetInkW across


  consentValue() {
    try { return localStorage.getItem("kc-cookie-consent"); } catch (e) { return "deny"; }
  }
  setConsent(allow) {
    try { localStorage.setItem("kc-cookie-consent", allow ? "allow" : "deny"); } catch (e) {}
    if (allow && typeof window.gtag === "function") {
      window.gtag("consent", "update", { analytics_storage: "granted" });
    }
    this.showCookies();
  }
  showCookies() {
    // let the visitor take in the page first; the banner arrives after 5s
    if (!this._cookieDue) {
      this._cookieDue = true;
      setTimeout(() => { this._cookieReady = true; this.showCookies(); }, 5000);
    }
    const decided = !!this.consentValue() || !this._cookieReady;
    Object.entries(this.cookies || {}).forEach(([k, el]) => {
      const wanted = !decided && (this.mobile ? k === "mobile" : k === "desktop");
      el.style.display = wanted ? "flex" : "none";
      if (wanted) requestAnimationFrame(() => { el.style.opacity = "1"; });
      else el.style.opacity = "0";
    });
    // keep the phone bar inside the handset frame rather than the browser window
    const m = this.cookies && this.cookies.mobile;
    if (m && this.mobile) {
      const k = this.kFit || 1;
      // a real handset reports no device preset, so fall back to the window: both the
      // forced preview and an actual phone get the same centred, grid-width banner
      const bw = (this.devW || window.innerWidth) * k, bh = (this.devH || this.lvhNow()) * k;
      const sc = bw / (this.devW || window.innerWidth);
      // on a phone both edges carry the name, so the banner sits in the middle of the
      // screen — clear of the wordmark above and the headline below
      const bb = Math.max(0, (this.vhNow() - bh) / 2);
      Object.assign(m.style, {
        top: "auto",
        right: "auto",
        left: ((window.innerWidth - bw) / 2 + 16 * sc).toFixed(1) + "px",
        bottom: (bb + 16 * sc).toFixed(1) + "px",
        width: (bw - 32 * sc).toFixed(1) + "px",
        padding: (16 * sc).toFixed(1) + "px",
      });
    }
  }
  // the legal dialogs live outside the footer, so they need the same frame treatment:
  // on a phone they fill the handset screen and step the type down a notch
  fitSheets(box) {
    Object.values(this.sheets || {}).forEach((el) => {
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
          const lh = 25.6, n = Math.round(Math.max(180, Math.min(300, this.vhNow() * 0.44 - 132)) / lh);
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
  openSheet(key) {
    const el = this.sheets && this.sheets[key];
    if (!el) return;
    const sc2 = el.querySelector("[data-scroll]");
    if (sc2) sc2.scrollTop = 0;
    if (el._fade) requestAnimationFrame(el._fade);
    Object.values(this.sheets).forEach((s2) => { s2.style.display = "none"; });
    el.style.display = "flex";
    const btn = el.querySelector("[data-close]");
    if (btn) btn.focus();
  }
  closeSheet() {
    Object.values(this.sheets || {}).forEach((el) => { el.style.display = "none"; });
  }
  // one link per project, keyed by the ticket index. Everything except Longread is a
  // placeholder for now — swap the URL here and all three breakpoints follow.
  ticketLinks() {
    return {
      0: "https://www.behance.net/gallery/254535151/Reform-pilates-studio-for-men",     // Pilates
      1: "https://www.behance.net/gallery/254618097/Tour-de-parole-Negotiation-school-for-GenZ",     // Tour de parole
      2: "https://readymag.website/u1448912666/perfectionism/",                            // Longread
      3: "https://www.behance.net/gallery/257282669/Napoli-caffe-branding",             // Napoli
      4: "https://www.youtube.com/watch?v=NG0HM9ApyP8&time_continue=1&source_ve_path=MjM4NTE&embeds_referring_euri=https%3A%2F%2Freadymag.website%2F&embeds_referring_origin=https%3A%2F%2Freadymag.website",    // Inside out
      5: "https://www.behance.net/gallery/255872777/Climax-3D-product-website",                                  // Celimax
    };
  }
  wireTicket(el) {
    if (!el || el._link) return;
    const url = this.ticketLinks()[+el.dataset.i];
    if (!url) return;
    el._link = url;
    el.setAttribute("role", "link");
    el.setAttribute("tabindex", "0");
    const title = el.querySelector("span");
    el.setAttribute("aria-label", "Voir le projet " + (title ? title.textContent : ""));
    const open = () => window.open(url, "_blank", "noopener,noreferrer");
    // the phone tickets carry a full-size <a> on top (so Safari can show its own long-press
    // preview); a tap on that link navigates by itself and must not open a second tab
    el.addEventListener("click", (e) => {
      if (e.target && e.target.closest && e.target.closest("[data-hit]")) return;
      open();
    });
    el.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } });
    if (el.style.cursor !== "none") el.style.cursor = "pointer";
    // a press anywhere on the ticket has to reach the link: without this, holding over the
    // name or the description starts a text selection instead of Safari's link preview
    el.style.userSelect = "none";
    el.style.webkitUserSelect = "none";
  }
  // phone: the ticket is centred in whatever the handset's frame height is, with at
  // least 15% of the frame empty above and below (never less than the 16px side
  // margin). If the content can't fit, the media block gives up height first.


  // ===================== ABOUT + FOOTER =====================
  // desktop: each fact card rises from below into its slot in the 2-row grid and
  // stays there — the block ends on the Figma composition, not on a random slice
  A_ROWS = [0, 0, 0, 1, 1];
  A_ORDER = [0, 2, 1, 4, 3];
  renderAbout() {
    // FIX: the desktop About block (#apropos) sits right after the sticky Projects section
    // and, per the comment above syncHover(), its incoming edge can visually creep over the
    // Projets carousel while scrolling between the two. That overlap swallowed real clicks on
    // the ticket <a> links even though the fix in syncHover() only ever protected the CURSOR,
    // not the actual click. Gate pointer-events on #apropos so it can't steal clicks until it
    // has genuinely started becoming the active section.
    // both branches below used to read a live getBoundingClientRect() every frame; the
    // "else" formula here is mathematically the same value (ABOUT_TOP is exactly that
    // rect's top, in screens, cached by _measureAbout() at resize time) so it can just be
    // the only formula — no live read needed at all in the render loop.
    if (!this.mobile && !this.tablet && this.about) {
      const sHx = this.stepH();
      const progX = (window.scrollY - this.ABOUT_TOP * sHx) / sHx;
      const pe = progX >= 0 ? "" : "none";
      if (this.about.style.pointerEvents !== pe) this.about.style.pointerEvents = pe;
    }
    const cards = this.mobile ? this.mCards : this.tablet ? this.tCards : this.cards;
    if (!cards || !cards.length) return;
    const sH = this.stepH();
    // how far the section has travelled past the top of the viewport, in screens
    const prog = (window.scrollY - this.ABOUT_TOP * sH) / sH;
    if (!this.mobile && !this.tablet) {
      // Desktop sticky-card experiment. Keep the approved 326px cards,
      // grid positions, type styles, and host scale; change only vertical motion.
      // Screenshot's final arrangement: Mastère / 450k / Behance on the
      // upper row, 3 langues / Greenly on the lower row.
      const frameH = this.frameH || 844;
      const H = this.CARD_H;
      const gap = 24;
      const gridHeight = 2 * H + gap;
      const firstRow = Math.max(24, (frameH - gridHeight) / 2);
      const targetTops = [firstRow, firstRow + H + gap, firstRow,
                          firstRow, firstRow + H + gap];
      const entryY = frameH + 60;
      // Each card rises, parks at its destination, and stays parked.
      // Leave a short uncluttered introduction and a settled final hold.
      const firstArrival = 0.48, stagger = 1.05, travelScreens = 0.82;
      // Arrival sequence: Mastère, 450k, Behance, 3 langues, Greenly.
      const arrivalOrder = [0, 4, 1, 2, 3];
      cards.forEach((el, i) => {
        if (!el) return;
        let e = (prog - firstArrival - arrivalOrder[i] * stagger) / travelScreens;
        e = Math.max(0, Math.min(1, e));
        e = e * e * (3 - 2 * e);
        const top = entryY + (targetTops[i] - entryY) * e;
        const t = "translateY(" + top.toFixed(1) + "px)";
        if (el._t !== t) { el._t = t; el.style.transform = t; }
      });
      return;
    }
    if (this.tablet) {
      // same behaviour as desktop, on a 2-column / 3-row grid centred in the frame
      const GAP = 24, fh = this.tFrameH || 1112;
      const Wt = (this.tAStage && this.tAStage.offsetWidth) || 834;
      // the frame's own 12-column grid: 32 margin, 24 gutter, and that gutter is the gap
      // vertically too — the same 24 between every pair of cards in both directions.
      // Portrait: a card is 4 columns wide, three rows of three slots. Landscape has no
      // height for that, so there the card keeps its 3-column width over two rows.
      const colW = (Wt - 64 - 11 * GAP) / 12;
      const span4 = 4 * colW + 3 * GAP;
      const span3 = 3 * colW + 2 * GAP;
      const tall = fh >= 3 * span4 + 2 * GAP + 24;
      // portrait: cards 4 columns wide on three slots (columns 1 / 5 / 9), three rows.
      // landscape: 4 columns would make them huge, so a card is 3 columns wide and the
      // slots step every 3 columns (1 / 4 / 7 / 10) — the last one ends on the right margin.
      const step = (tall ? 4 : 3) * (colW + GAP);
      const span = tall ? span4 : span3;
      const ROWS = tall ? [0, 0, 1, 2, 2] : [0, 0, 1, 1, 1];
      const COLS = tall ? [0, 1, 0, 2, 1] : [0, 2, 0, 3, 1];
      const nR = tall ? 3 : 2;
      const fit = Math.max(180, (fh - 24 - (nR - 1) * GAP) / nR);
      const H = Math.min(span, fit);
      const gridTop = Math.max(12, Math.round((fh - (nR * H + (nR - 1) * GAP)) / 2));
      const START = fh + 80, STEP = 0.34;
      cards.forEach((el, i) => {
        if (!el) return;
        const left = 32 + COLS[i] * step;
        if (el._sq !== H) { el._sq = H; el.style.width = H.toFixed(1) + "px"; el.style.height = H.toFixed(1) + "px"; }
        if (el._l !== left) { el._l = left; el.style.left = left + "px"; }
        const target = gridTop + ROWS[i] * (H + GAP);
        let e = prog + 0.45 - this.A_ORDER[i] * STEP;
        e = e < 0 ? 0 : e > 1 ? 1 : e;
        e = this.ease ? this.ease(e) : e;
        const top = START + (target - START) * e;
        const t = "translateY(" + top.toFixed(1) + "px)";
        if (el._t !== t) { el._t = t; el.style.transform = t; }
      });
      return;
    }
    // Mobile About: one pinned screen. The introduction stays centered while
    // five square cards rise from below and layer in the middle of the screen.
    const H = this.mFrameH || 844;
    const CARD = Math.min(264, Math.max(196, H - 144));
    const n = cards.length;
    const stackStep = 10;
    const stackTop = Math.max(24, (H - CARD - (n - 1) * stackStep) / 2);
    const start = H + 40;
    const span = Math.max(1, this.ABOUT_RANGE || 2.7);
    const step = span * 0.72 / n;
    cards.forEach((el, i) => {
      if (!el) return;
      el.style.left = ((390 - CARD) / 2).toFixed(1) + "px";
      el.style.width = CARD.toFixed(1) + "px";
      if (el._h !== CARD) { el._h = CARD; el.style.height = CARD.toFixed(1) + "px"; }
      let e = (prog - span * 0.06 - i * step) / (step * 1.8);
      e = e < 0 ? 0 : e > 1 ? 1 : e;
      e = this.ease ? this.ease(e) : e;
      const top = start + (stackTop + i * stackStep - start) * e;
      const t = "translateY(" + top.toFixed(1) + "px)";
      if (el._t !== t) { el._t = t; el.style.transform = t; }
    });
  }
  renderFooter() {
    // both reads below used to be getBoundingClientRect() on every single frame — the nav
    // is position:fixed (its rect never moves with scroll, only resize, and that's already
    // re-cached in fit()) and the footer's document position only needs an arithmetic
    // scrollY subtraction from the value fit() already cached. Neither needs a live DOM read
    // in the render loop.
    const H = this.vh || this.vhNow();
    // how much of the footer block has entered the viewport, 0 -> 1
    let t = 0;
    if (this._footerHeight) {
      const top = this._footerTopDoc - window.scrollY;
      t = (H - top) / Math.max(1, this._footerHeight);
      t = t < 0 ? 0 : t > 1 ? 1 : t;
    }
    // the footer IS the end of the page, so the track can't ask for more scroll: the
    // curtain follows the last screen in, then draws itself shut once you arrive
    // the curtain closes with the scroll and nothing else: the old timed "auto close" part
    // reset itself whenever t dipped back under its threshold, which made the cloth open
    // again mid-scroll. Fully shut by the time 80% of the footer is in.
    let p = (t - 0.02) / 0.78;
    p = p < 0 ? 0 : p > 1 ? 1 : p;
    if (this.clothEl) this.clothEl.progress = p * p * (3 - 2 * p);
    // navbar ink follows what is actually painted under the bar, not which section we
    // are in: sample the surface at a few points along the strip and flip on luminance
    this.setNavInk(this.surfaceIsLight() ? "rgb(34,32,34)" : "rgb(255,255,255)");
  }
  // luminance of whatever sits under the navbar. Any photo / video / gradient under a
  // sample point counts as dark, since the scrim is what keeps white text legible there.
  surfaceIsLight() {
    if (!this._navRect) return false;
    // The approved projects surface is white. A cross-document iframe is opaque
    // to elementsFromPoint(), which otherwise incorrectly classifies it as dark.
    // Use the current layout's section bounds instead of sampling inside the iframe.
    // About has a white surface, even when its nested imagery or the
    // section below confuses the luminance samples. Test section bounds before
    // sampling so the nav text cannot remain white against the white About.
    // Footer is full-bleed black and takes precedence when it reaches the nav.
    const navY = this._navRect.top + this._navRect.height * 0.55;
    const isAtNav = (el) => {
      if (!el || getComputedStyle(el).display === "none") return false;
      const rect = el.getBoundingClientRect();
      return rect.top <= navY && rect.bottom > navY;
    };
    if (isAtNav(document.getElementById("contact"))) return false;
    const aboutId = this.mobile ? "apropos-m" : this.tablet ? "apropos-t" : "apropos";
    if (isAtNav(document.getElementById(aboutId))) return true;
    const projectId = this.mobile ? "projets-m" : this.tablet ? "projets-t" : "projets";
    const projectSection = document.getElementById(projectId);
    if (projectSection) {
      const rect = projectSection.getBoundingClientRect();
      const navY = this._navRect.top + this._navRect.height * 0.55;
      if (rect.top <= navY && rect.bottom > navY) return true;
    }
    const r = this._navRect;
    const y = Math.max(2, Math.min((this.vh || this.vhNow()) - 2, r.top + r.height * 0.55));
    // on a phone preview the surrounding letterbox still shows the window-wide white
    // About panel, so sample across the phone box rather than across the window
    const bw = this.mobile ? (this.devW || window.innerWidth) * (this.kFit || 1) : window.innerWidth;
    const bl = (window.innerWidth - bw) / 2;
    const xs = [0.08, 0.3, 0.5, 0.7, 0.92].map((f) => Math.round(bl + bw * f));
    let lum = 0, n = 0;
    for (const x of xs) {
      const v = this.pointLum(x, y);
      if (v === null) continue;
      lum += v; n++;
    }
    if (!n) return false;
    return lum / n > 0.62;
  }
  pointLum(x, y) {
    const stack = document.elementsFromPoint(x, y);
    for (const el of stack) {
      if (this.nav && this.nav.contains(el)) continue;
      if (this.navScrim === el) continue;
      const cs = getComputedStyle(el);
      if (cs.visibility === "hidden" || +cs.opacity === 0) continue;
      const tag = el.tagName;
      if (tag === "IMG" || tag === "VIDEO" || tag === "CANVAS" || tag === "IFRAME") return 0;
      if (cs.backgroundImage && cs.backgroundImage !== "none") return 0;
      const m = cs.backgroundColor.match(/[\d.]+/g);
      if (!m) continue;
      const a = m.length > 3 ? +m[3] : 1;
      if (a < 0.55) continue;
      const [rr, gg, bb] = m.map(Number);
      return (0.2126 * rr + 0.7152 * gg + 0.0722 * bb) / 255;
    }
    return 1; // nothing painted: the page background is white
  }
  setNavInk(color) {
    if (!this.nav || this._navInk === color) return;
    this._navInk = color;
    if (this.navScrim) { this.navScrim.style.opacity = "0"; this.navScrim.style.display = "none"; }
    this.nav.querySelectorAll("span, a").forEach((el) => {
      if (el.closest("[data-fixed-ink]")) return;
      el.style.color = color;
    });
    // over the white section the status pill flips to the light surface, glass intact
    if (this.pill) {
      const light = color !== "rgb(255,255,255)";
      this.pill.style.backgroundColor = light ? "rgba(246,244,246,0.62)" : "rgba(34,32,34,0.55)";
      this.pill.style.borderColor = light ? "rgba(34,32,34,0.10)" : "rgba(255,255,255,0.14)";
      const t = this.pill.lastElementChild;
      if (t) t.style.color = light ? "rgb(34,32,34)" : "rgb(189,183,189)";
    }
  }

  tick() {
    if (this._gen !== window.__kcGen) return; // a newer instance owns the loop now
    // the whole frame is guarded, not just the render calls: a throw in the beam or cloth
    // maths used to kill the chain outright, because the reschedule sits at the end. One
    // bad frame should cost a frame, not the rest of the page's motion.
    try { this.frame(); }
    catch (err) { if (!this._warned) { this._warned = true; console.error("frame failed", err); } }
    this.raf = requestAnimationFrame(this.tick);
  }
  frame() {
    const now = performance.now();
    this._dt = Math.min(0.05, (now - (this._last || now - 16)) / 1000);
    this.time += this._dt;
    this._last = now;
    const dtF = Math.min(0.05, this._dt || 0.016);
    const lag = 1 - Math.exp(-(this.tablet || this.mobile ? 7 : 10) * dtF);
    this.cx += (this.tx - this.cx) * lag;
    this.cy += (this.ty - this.cy) * lag;
    if (this.intro) {
      const t = this.time - this.introStart;
      let target;
      if (t < 0.01) target = 0;
      else if (t < 0.13) {
        const seq = [0.55, 0.12, 0.95, 0.3, 1, 0.5, 1];
        target = seq[Math.floor((t - 0.01) / 0.017)];
        if (target === undefined) target = 1;
      } else target = 1;
      this.ci = target;
      if (t > 0.2) this.intro = false;
    } else {
      // frame-rate independent: on an iPad running at 20fps a per-frame 0.09 step made the
      // lamp take three times as long to come up as it does on desktop, which read as a hang
      this.ci += (this.ti - this.ci) * (1 - Math.exp(-6 * dtF));
    }
    // the projector plate is the most expensive thing on the page (two blurred SVG masks
     // over a full-screen image). On a tablet it walks at half rate so each frame lands
     // whole instead of tearing — the motion itself is time-based, so the speed is the same.
    // the beam runs at full frame rate everywhere: the half-rate update this used to do on
    // tablets is exactly what read as stepping. The frame budget comes from dropping the
    // dust canvas there instead (see below) — a flourish, not the beam itself.
    this.heroApply();
    if (this.touch || this.tablet || this.mobile) {
      // no hover on touch: the projector walks the room on its own
      const HHw = this.heroH || 813;
      // the tablet walk is the phone's, unchanged: same speed, same reach
      const sp = 0.62;
      this.tx = 720 + Math.sin(this.time * sp) * 330 + Math.sin(this.time * sp * 0.4) * 90;
      this.ty = HHw * (470 / 813) + Math.cos(this.time * sp * 0.76) * HHw * (130 / 813);
      this.ti = 1;
      if (this.clothEl && this.clothEl.mouse) {
        const m = this.clothEl.mouse;
        if (!this._gust || this.time > this._gust.until) {
          const r = Math.random;
          this._gust = {
            x: (r() * 2 - 1) * 0.8, y: (r() * 2 - 1) * 0.5,
            force: 0.22 + r() * 0.3,
            until: this.time + 1.6 + r() * 2.6,
            fade: 0.9 + r() * 1.2,
          };
          this._gustStart = this.time;
          this._gustDrift = (Math.random() * 2 - 1) * 0.12;
        }
        const g = this._gust;
        const k = Math.min(1, (this.time - this._gustStart) / (g.until - this._gustStart));
        // a gust is born where it is: no travel, just a swell that fades out
        // ease into the new gust's position instead of teleporting the pull point across
        // the cloth — a jump there is what made the curtain look like it snapped
        const gx = g.x + this._gustDrift * k;
        m.x = m.x == null ? gx : m.x + (gx - m.x) * 0.12;
        m.y = g.y + Math.sin(this.time * 1.7) * 0.02;
        m.force = g.force * Math.sin(Math.PI * k) * (0.85 + 0.15 * Math.sin(this.time * 5.3));
        m.active = k < 1;
      }
    }
    // phones: the projector dust canvas and a full scroll re-layout on every frame is
    // what made the ticket scroll stutter. Dust is a desktop-only flourish, and the
    // scroll-driven sections only need work while the page is actually moving.
    try {
      if (!this.touch && !this.mobile && !this.tablet) {
        if (this._dustOff && this.heroCanvas) this.heroCanvas.style.display = "block";
        this._dustOff = false; this.drawDust();
      } else if (!this._dustOff && this.heroCanvas) {
        this._dustOff = true;
        const c = this.hctx || (this.hctx = this.heroCanvas.getContext("2d"));
        c.clearRect(0, 0, 1440, this.heroH || 813);
        // mix-blend-mode: screen over the plate forces an unaccelerated blend layer on iOS
        this.heroCanvas.style.display = "none";
      }
      this.renderAbout();
      this.renderFooter();
    } catch (err) {
      if (!this._warned) { this._warned = true; console.error("frame work failed", err); }
    }
  }

  componentDidUpdate() { if (this.fit) this.fit(); }
  renderVals() {
    return {
      // hero
      heroTopRef: (el) => { this.heroTop = el; if (this.fit) this.fit(); },
      heroBottomRef: (el) => { this.heroBottom = el; if (this.fit) this.fit(); },
      heroContainerRef: (el) => { this.heroContainer = el; },
      heroSlideRef: (el) => { if (!this.heroSlides) this.heroSlides = []; if (el && !this.heroSlides.includes(el)) this.heroSlides.push(el); },
      tHeroSlideRef: (el) => { if (!this.tHeroSlides) this.tHeroSlides = []; if (el && !this.tHeroSlides.includes(el)) this.tHeroSlides.push(el); },
      beamBlurRef: (el) => { this.beamBlur = el; },
      heroCanvasRef: (el) => { this.heroCanvas = el; this.hctx = null; },
      heroImgRef: (el) => { this.heroImg = el; },
      heroGlowRef: (el) => { this.heroGlow = el; },
      maskShaftRef: (el) => { this.maskShaft = el; },
      maskPoolRef: (el) => { this.maskPool = el; },
      glowShaftRef: (el) => { this.glowShaft = el; },
      glowPoolRef: (el) => { this.glowPool = el; },
      heroMove: (e) => { this.heroTarget(e); this.ti = 1; },
      heroEnter: (e) => { this.heroTarget(e); this.ti = 1; },
      heroLeave: () => { this.ti = 0; },
      // projets
      // The old Projects carousel template callbacks were removed.
      pillRef: (el) => { this.pill = el; },
      ticketCursorRef: (el) => { this.ticketCursor = el; },
      ticketCursorImgRef: (el) => { this.ticketCursorImg = el; if (this.fit) this.fit(); },
      // about
      aStageRef: (el) => { this.aStage = el; if (this.fit) this.fit(); },
      lvhProbeRef: (el) => { this.lvhProbe = el; if (this.fit) this.fit(); },
      navRef: (el) => { this.nav = el; if (this.fit) this.fit(); },
      heroSvgRef: (el) => { this.heroSvg = el; },
      maskRectRef: (el) => { this.maskRect = el; },
      navScrimRef: (el) => { this.navScrim = el; },
      dRootRef: (el) => { this.dRoot = el; if (this.fit) this.fit(); },
      tRootRef: (el) => { this.tRoot = el; if (this.fit) this.fit(); },
      tHeroRef: (el) => { this.tHero = el; if (this.fit) this.fit(); },
      mHeroRef: (el) => { this.mHero = el; if (this.fit) this.fit(); },
      mRootRef: (el) => { this.mRoot = el; if (this.fit) this.fit(); },
      mHeroSlideRef: (el) => { if (!this.mHeroSlides) this.mHeroSlides = []; if (el && !this.mHeroSlides.includes(el)) this.mHeroSlides.push(el); },
      mAStageRef: (el) => { this.mAStage = el; if (this.fit) this.fit(); },
      mGridRef: (el) => { if (!el) return; if (!this.mGrids) this.mGrids = []; if (!this.mGrids.includes(el)) this.mGrids.push(el); if (this.fit) this.fit(); },
      mCardRef: (el) => { if (!el) return; if (!this.mCards) this.mCards = []; this.mCards[+el.dataset.i] = el; },
      tBarcodeRef: (el) => { if (!el) return; if (!this._bch) this._bch = this.buildBarcode(true); el.style.backgroundImage = this._bch; el.style.backgroundRepeat = "no-repeat"; },
      dProjRef: (el) => { this.dProj = el; },
      tAStageRef: (el) => { this.tAStage = el; if (this.fit) this.fit(); },
      tCardRef: (el) => { if (!el) return; if (!this.tCards) this.tCards = []; this.tCards[+el.dataset.i] = el; this.renderAbout(); },
      wordmarkRef: (el) => { this.wordmark = el; if (this.fit) this.fit(); },
      cardRef: (el) => { if (!el) return; if (!this.cards) this.cards = []; this.cards[+el.dataset.i] = el; this.renderAbout(); },
      loopVideo: (e) => { const v = e.target; v.currentTime = 0; const pr = v.play(); if (pr && pr.catch) pr.catch(() => {}); },
      footerRef: (el) => { this.footer = el; if (this.fit) this.fit(); },
      aboutRef: (el) => { this.about = el; if (this.fit) this.fit(); },
      footSpacerRef: (el) => { this.footSpacer = el; },
      creditRef: () => {},
      vhProbeRef: (el) => { this.vhProbe = el; if (this.fit) this.fit(); },
      cookieRef: (el) => {
        if (!el || el._wired) return;
        el._wired = true;
        if (!this.cookies) this.cookies = {};
        this.cookies[el.dataset.cookie] = el;
        el.querySelectorAll("[data-consent]").forEach((b) => {
          b.addEventListener("click", () => this.setConsent(b.dataset.consent === "allow"));
        });
        this.showCookies();
      },
      legalRef: (el) => {
        if (!el || el._wired) return;
        el._wired = true;
        if (!this.sheets) this.sheets = {};
        this.sheets[el.dataset.sheet] = el;
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
        el.querySelector("[data-close]").addEventListener("click", () => this.closeSheet());
        el.addEventListener("click", (e) => { if (e.target === el) this.closeSheet(); });
      },
      // bare boolean attributes are dropped by the template runtime, so muted/loop are
      // set as properties here — without muted the browser refuses background playback
      vidRef: (el) => {
        if (!el || el._kcLoop) return;
        el._kcLoop = true;
        el.muted = true; el.defaultMuted = true; el.loop = true; el.playsInline = true;
        el.setAttribute("muted", ""); el.setAttribute("loop", "");
        const go = () => { const p = el.play(); if (p && p.catch) p.catch(() => {}); };
        // hover clips stay parked on frame one: decoding six streams behind hidden layers
        // is what made playback stutter, so they only run while the card is hovered
        if (el.dataset.hover) {
          if (!el.getAttribute("src") && el.dataset.src) el.src = this.resolveRes(el.dataset.src);
          el.preload = "auto";
          el.load();
          // a dropped request leaves the element in a permanent error state, so retry the
          // load a few times with backoff — otherwise that card never plays for the session
          el._tries = 0;
          el.addEventListener("error", () => {
            if (el._tries >= 4) return;
            el._tries++;
            setTimeout(() => { try { el.load(); } catch (e) {} }, 400 * el._tries);
          });
          // warm-up: run the clip for exactly one decoded frame, then park it back on zero.
          // A cold video element needs that first decode before it can render anything, and
          // doing it up front is why the swap on hover is instant.
          const park = () => { el.pause(); try { el.currentTime = 0; } catch (e) {} };
          const warm = () => {
            if (el.requestVideoFrameCallback) el.requestVideoFrameCallback(park);
            else setTimeout(park, 90);
            const p = el.play(); if (p && p.catch) p.catch(() => {});
          };
          if (el.readyState >= 2) warm(); else el.addEventListener("loadeddata", warm, { once: true });
          return;
        }
        const isMobileTicketVideo = !!el.dataset.poster && !el.dataset.hover && !el.dataset.gate;
        if ((el.dataset.eager === "1" || isMobileTicketVideo) && !el.getAttribute("src") && el.dataset.src) {
          el.src = this.resolveRes(el.dataset.src);
        }
        if (!el.getAttribute("poster") && el.dataset.poster) {
          el.poster = this.resolveRes(el.dataset.poster);
        }
        el.addEventListener("ended", () => { el.currentTime = 0; go(); });
        // gated clips (the tablet deck) must stay paused when they are not the middle card,
        // so they get no auto-restart on pause
        if (el.dataset.gate) { el.preload = "auto"; return; }
        el.addEventListener("pause", () => { if (!document.hidden) go(); });
        if (el.readyState >= 2) go(); else el.addEventListener("loadeddata", go, { once: true });
      },
      clothRef: (el) => {
        if (!el || this.cloth === el) return;
        this.cloth = el;
        // the standalone/offline build inlines curtain-cloth.js and the curtain image as
        // blob URLs (see the ext-resource-dependency meta tags in <head>) so both still
        // load when this page is hosted with no assets/ folder alongside it
        const url = this.resolveRes("./curtain-cloth.js");
        // a bare relative specifier fails to import from some hosting contexts, so resolve it
        // against the document first and keep the raw path as a second try
        let abs = url;
        try { abs = new URL(url, document.baseURI).href; } catch (e) {}
        const mount = (m) => { this.clothEl = m.mountCurtain(el, this.resolveRes("assets/about/footer-curtain.webp")); };
        import(abs)
          .then(mount)
          .catch(() => import(url).then(mount))
          .catch((err) => console.error("curtain load failed", err && (err.message || err)));
      },
    };
  }
}

  return Component;
};
