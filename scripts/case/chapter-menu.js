/*
 * Sticky chapter menu of case-study pages (owner of its behavior).
 * Markup: scripts/content/case-render.mjs. Styles: styles/case-content.css.
 *
 * - Places the menu under the fixed Navbar and publishes the anchor offset
 *   (--kc-case-menu-top, --kc-case-menu-offset).
 * - Compact mode when the chapter titles do not fit on one row (measured, not a
 *   breakpoint): one row with the current chapter that opens the list.
 * - Marks the current chapter (aria-current="location").
 * Profile and gutters come from scripts/shared/responsive-profile.js ("kc:profile").
 */
(function () {
  "use strict";
  const menu = document.querySelector("[data-kc-case-menu]");
  if (!menu) return;
  const root = document.documentElement;
  const list = menu.querySelector("[data-kc-case-menu-list]");
  const toggle = menu.querySelector("[data-kc-case-menu-toggle]");
  const current = menu.querySelector("[data-kc-case-menu-current]");
  const action = menu.querySelector("[data-kc-case-menu-action]");
  const links = Array.from(menu.querySelectorAll("[data-kc-case-menu-link]"));
  const sections = links.map((link) => document.getElementById(link.getAttribute("href").slice(1)));
  const navbar = document.querySelector(".kc-responsive-nav");

  function setOpen(open) {
    if (open) menu.setAttribute("data-kc-open", ""); else menu.removeAttribute("data-kc-open");
    toggle.setAttribute("aria-expanded", String(open));
    action.textContent = open ? action.dataset.close : action.dataset.open;
  }

  function layout() {
    const top = navbar ? Math.max(0, navbar.getBoundingClientRect().bottom) : 0;
    root.style.setProperty("--kc-case-menu-top", top.toFixed(3) + "px");
    // Compact when the titles do not fit on one row at their approved size.
    menu.removeAttribute("data-kc-compact");
    toggle.hidden = true;
    menu.setAttribute("data-kc-measuring", "");
    // Compare edges, not rounded scroll widths: a fraction of a pixel already wraps the row.
    const last = list.lastElementChild;
    const compact = !!last && last.getBoundingClientRect().right > list.getBoundingClientRect().right - 0.5;
    menu.removeAttribute("data-kc-measuring");
    if (compact) {
      menu.setAttribute("data-kc-compact", "");
      toggle.hidden = false;
    } else {
      setOpen(false);
    }
    root.style.setProperty("--kc-case-menu-offset", (top + menu.offsetHeight).toFixed(3) + "px");
    update();
  }

  let active = null;
  function update() {
    // The current chapter is the last one whose top has reached the menu's bottom edge.
    const line = menu.getBoundingClientRect().bottom + 1;
    let index = -1;
    sections.forEach((section, i) => { if (section && section.getBoundingClientRect().top <= line) index = i; });
    const next = index >= 0 ? links[index] : null;
    if (next === active) return;
    if (active) active.removeAttribute("aria-current");
    active = next;
    if (active) active.setAttribute("aria-current", "location");
    current.textContent = active ? active.textContent : current.dataset.default;
    if (active && active.lang) current.lang = active.lang; else current.removeAttribute("lang");
  }

  toggle.addEventListener("click", () => setOpen(toggle.getAttribute("aria-expanded") !== "true"));
  links.forEach((link) => link.addEventListener("click", () => { if (menu.hasAttribute("data-kc-compact")) setOpen(false); }));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && menu.hasAttribute("data-kc-open")) { setOpen(false); toggle.focus(); }
  });
  document.addEventListener("click", (e) => {
    if (menu.hasAttribute("data-kc-open") && !menu.contains(e.target)) setOpen(false);
  });
  // Keyboard focus leaving the open list closes it.
  menu.addEventListener("focusout", (e) => {
    if (menu.hasAttribute("data-kc-open") && e.relatedTarget && !menu.contains(e.relatedTarget)) setOpen(false);
  });

  let raf = 0;
  window.addEventListener("scroll", () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; update(); }); }, { passive: true });
  window.addEventListener("resize", layout);
  document.addEventListener("kc:profile", layout);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
  layout();
})();
