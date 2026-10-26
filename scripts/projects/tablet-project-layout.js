/* Tablet Projects geometry owner: base, portrait alignment, landscape rail. */
(function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  let frame = null;
  let activeLandscape = false;
  let activeFlow = false;
  let lastActiveProjectIndex = null;
  let preservingResizeAnchor = false;
  let lastViewportAnchor = null;
  let hasLayout = false;
  let travel = 0;
  let scrollLength = 0;
  let introShift = 0;
  let scrollScale = 1;
  let layoutFrame = 0;
  let lastLayoutKey = '';
  let forceLayout = false;
  let resizeAnchor = null;

  function setStyle(element, name, value) {
    if (element && element.style[name] !== value) element.style[name] = value;
  }

  function setImportantStyle(element, name, value) {
    if (!element || (element.style.getPropertyValue(name) === value
      && element.style.getPropertyPriority(name) === 'important')) return;
    element.style.setProperty(name, value, 'important');
  }

  function resetLandscape() {
    if (!frame) return;
    const viewport = $('kc-t-viewport');
    const stage = $('kc-t-stage');
    const rail = stage?.querySelector('.tickets');
    frame.classList.remove('kc-landscape-rail');
    frame.classList.remove('kc-projects-flow', 'kc-projects-compact');
    frame.classList.remove('kc-narrow-ticket');
    frame.style.height = '';
    if (viewport) {
      viewport.style.position = '';
      viewport.style.top = '';
      viewport.style.height = '';
      viewport.style.overflow = '';
    }
    if (rail) {
      rail.style.position = '';
      rail.style.transform = '';
      rail.style.width = '';
      rail.style.top = '';
      rail.style.bottom = '';
      rail.style.left = '';
      rail.style.gap = '';
      [...rail.children].forEach((card) => {
        card.style.width = '';
        card.style.height = '';
      });
    }
    const heading = stage?.querySelector('h1');
    if (heading) heading.style.transform = '';
    if (stage) {
      stage.style.removeProperty('height');
      stage.style.position = '';
      stage.style.left = '';
      stage.style.top = '';
      stage.style.overflow = '';
    }
    introShift = 0;
    activeLandscape = false;
    activeFlow = false;
    heading?.classList.remove('kc-projects-heading-hidden');
    const nav = document.querySelector('.kc-responsive-nav');
    if (nav) nav.style.position = window.__kcHeroNaturalFlow ? 'absolute' : 'fixed';
  }

  function captureViewportAnchor() {
    if (!hasLayout || !frame) return null;
    const about = $('apropos-t');
    const aboutRect = about?.getBoundingClientRect();
    // About may peek into view while the pinned Projects rail is still active.
    // Preserve About only after the visitor has reached its document start.
    if (aboutRect && aboutRect.top <= 1 && aboutRect.bottom > 0) return { kind: 'about', top: aboutRect.top };
    if (lastViewportAnchor) return { ...lastViewportAnchor };
    const sectionRect = frame.getBoundingClientRect();
    const sectionDocumentTop = sectionRect.top + window.scrollY;
    const aboutTop = $('apropos-t')?.getBoundingClientRect().top + window.scrollY;
    const inProjectsDocumentRange = window.scrollY >= sectionDocumentTop && (!Number.isFinite(aboutTop) || window.scrollY < aboutTop);
    if ((sectionRect.top >= innerHeight || sectionRect.bottom <= 0) && !inProjectsDocumentRange) return null;
    const cards = [...( $('kc-t-stage')?.querySelectorAll('.ticket') || [] )];
    const centerX = innerWidth / 2;
    const centerY = innerHeight / 2;
    let best = null;
    cards.forEach((card, index) => {
      // Ignore decorative ticket overhang when choosing the current project;
      // the readable panel is the meaningful visible content.
      const r = (card.querySelector('.ticket-panel') || card).getBoundingClientRect();
      const width = Math.max(0, Math.min(r.right, innerWidth) - Math.max(r.left, 0));
      const height = Math.max(0, Math.min(r.bottom, innerHeight) - Math.max(r.top, 0));
      const area = width * height;
      const centerDistance = activeLandscape ? Math.abs((r.left + r.right) / 2 - centerX)
        : Math.hypot((r.left + r.right) / 2 - centerX, (r.top + r.bottom) / 2 - centerY);
      if (area > 0 && (!best || centerDistance < best.centerDistance - 0.5
        || (Math.abs(centerDistance - best.centerDistance) <= 0.5 && area > best.area))) {
        best = { index, area, centerDistance };
      }
    });
    return best ? { kind: 'project', index: lastActiveProjectIndex ?? best.index } : null;
  }

  function restoreViewportAnchor(anchor) {
    if (!anchor || !frame) return;
    if (anchor.kind === 'about') {
      const about = $('apropos-t');
      if (about) {
        const rect = about.getBoundingClientRect();
        const documentTop = rect.top + window.scrollY;
        const travel = Math.max(0, rect.height - window.innerHeight);
        window.scrollTo(0, documentTop + travel * anchor.progress);
      }
      return;
    }
    const cards = [...($('kc-t-stage')?.querySelectorAll('.ticket') || [])];
    const card = cards[anchor.index];
    if (!card) return;
    if (activeFlow || !activeLandscape) {
      const panel = card.querySelector('.ticket-panel') || card;
      const r = panel.getBoundingClientRect();
      window.scrollTo(0, Math.max(0, window.scrollY + r.top + r.height / 2 - innerHeight / 2));
      return;
    }
    const sectionTop = frame.getBoundingClientRect().top + window.scrollY;
    const panel = card.querySelector('.ticket-panel') || card;
    const panelCenter = card.offsetLeft + panel.offsetLeft + panel.getBoundingClientRect().width / 2;
    const horizontal = Math.max(0, Math.min(travel, panelCenter - (innerWidth / 2 - 32)));
    window.scrollTo(0, sectionTop + introShift + horizontal);
  }

  function setNavbarFlow(flow) {
    const nav = document.querySelector('.kc-responsive-nav');
    if (nav) nav.style.position = (flow || window.__kcHeroNaturalFlow) ? 'absolute' : 'fixed';
  }

  function fitExtremeFlow(section, viewport, stage, rail, cards, width, gap, narrowTickets) {
    section.classList.remove('kc-landscape-rail', 'kc-projects-compact');
    section.classList.add('kc-projects-flow');
    section.dataset.kcProjectsMode = 'flow';
    section.classList.toggle('kc-narrow-ticket', narrowTickets);
    activeLandscape = false;
    activeFlow = true;
    stage.querySelector('h1')?.classList.add('kc-projects-heading-hidden');
    setNavbarFlow(true);

    setStyle(section, 'height', 'auto');
    setStyle(viewport, 'position', 'relative');
    setStyle(viewport, 'top', 'auto');
    setStyle(viewport, 'height', 'auto');
    setStyle(viewport, 'overflow', 'visible');
    setStyle(stage, 'position', 'relative');
    setStyle(stage, 'left', '0px');
    setStyle(stage, 'top', '0px');
    setStyle(stage, 'height', 'auto');
    setStyle(stage, 'overflow', 'visible');
    setStyle(rail, 'position', 'relative');
    setStyle(rail, 'left', '32px');
    setStyle(rail, 'top', '32px');
    setStyle(rail, 'bottom', 'auto');
    setStyle(rail, 'width', 'calc(100% - 64px)');
    setStyle(rail, 'gap', '32px');
    setStyle(rail, 'flexDirection', 'column');
    setStyle(rail, 'transform', 'none');
    cards.forEach((card) => {
      setStyle(card, 'width', width + 'px');
      setStyle(card, 'height', narrowTickets ? 'auto' : '310px');
    });
    const contentHeight = 64 + cards.reduce((sum, card) => sum + card.getBoundingClientRect().height, 0)
      + Math.max(0, cards.length - 1) * gap;
    setStyle(stage, 'height', contentHeight + 'px');
    setStyle(viewport, 'height', contentHeight + 'px');
    setStyle(section, 'height', contentHeight + 'px');
    introShift = 0;
    travel = 0;
    scrollLength = 0;
  }

  function fitBaseGeometry(preserveLandscapeFrame) {
    frame = $('kc-tablet-projets');
    const viewport = $('kc-t-viewport');
    const stage = $('kc-t-stage');
    if (!frame || !viewport || !stage) return false;

    setStyle(stage, 'width', window.innerWidth + 'px');
    setStyle(stage, 'transform', 'none');
    setStyle(viewport, 'width', '100%');
    if (!preserveLandscapeFrame) {
      setStyle(stage, 'height', '1655px');
      setStyle(viewport, 'height', '1655px');
    }

    return true;
  }

  function fitPortraitGeometry() {
    if (window.innerWidth < 500 || window.innerWidth > 1080 || window.innerWidth >= window.innerHeight) return;
    const stage = $('kc-t-stage');
    const viewport = $('kc-t-viewport');
    if (!stage || !viewport) return;
    frame.dataset.kcProjectsMode = 'normal';
    frame.classList.remove('kc-projects-flow', 'kc-projects-compact');
    stage.querySelector('h1')?.classList.remove('kc-projects-heading-hidden');
    setNavbarFlow(false);

    // Keep tablet ticket geometry in CSS pixels so Figma dimensions and type are
    // effective rendered sizes, independent of the Hero/About viewport scale.
    setStyle(stage, 'width', window.innerWidth + 'px');
    setStyle(stage, 'position', 'relative');
    setStyle(stage, 'left', '0px');
    setStyle(stage, 'transform', 'none');
    // Portrait cards fill the content width between the established 32px gutters.
    // Landscape intentionally retains its separate 770px Figma composition below.
    const cardWidth = Math.max(0, window.innerWidth - 64);
    const narrowTickets = window.innerWidth < 687;
    frame.classList.toggle('kc-narrow-ticket', narrowTickets);
    const cardHeight = 310;
    const cardGap = 32;
    const railTop = 269;
    const heading = stage.querySelector('h1');
    const rail = stage.querySelector('.tickets');
    if (heading) {
      setStyle(heading, 'left', '32px');
      setStyle(heading, 'top', '85px');
      setStyle(heading, 'width', (window.innerWidth - 64) + 'px');
    }
    if (rail) {
      setStyle(rail, 'left', '32px');
      setStyle(rail, 'top', railTop + 'px');
      setStyle(rail, 'width', cardWidth + 'px');
      setStyle(rail, 'gap', cardGap + 'px');
      [...rail.children].forEach((card) => {
        setStyle(card, 'width', '100%');
        setStyle(card, 'height', narrowTickets ? 'auto' : cardHeight + 'px');
      });
    }
    const cardHeights = rail ? [...rail.children].map((card) => card.getBoundingClientRect().height) : [];
    const sectionHeight = railTop + cardHeights.reduce((sum, height) => sum + height, 0)
      + Math.max(0, cardHeights.length - 1) * cardGap + 32;
    setStyle(stage, 'height', sectionHeight + 'px');
    setStyle(viewport, 'height', sectionHeight + 'px');
  }

  function fitLandscapeGeometry() {
    const section = $('kc-tablet-projets');
    const viewport = $('kc-t-viewport');
    const stage = $('kc-t-stage');
    const rail = stage?.querySelector('.tickets');
    if (!section || !viewport || !stage || !rail) return false;
    const tabletRoot = section.parentElement;
    const shouldRun = !!tabletRoot && getComputedStyle(tabletRoot).display !== 'none'
      && window.innerWidth > window.innerHeight && window.innerWidth >= 500;
    if (!shouldRun) return false;

    section.classList.remove('kc-projects-flow', 'kc-projects-compact');
    stage.querySelector('h1')?.classList.remove('kc-projects-heading-hidden');
    setNavbarFlow(false);
    activeFlow = false;
    activeLandscape = true;
    frame = section;
    section.classList.add('kc-landscape-rail');
    const width = window.innerWidth;
    const height = window.innerHeight;
    setImportantStyle(stage, 'height', height + 'px');
    setStyle(viewport, 'width', '100%');
    setStyle(viewport, 'height', window.innerHeight + 'px');

    const cardWidth = Math.min(770, Math.max(0, width - 64));
    const narrowTickets = width < 687;
    section.classList.toggle('kc-narrow-ticket', narrowTickets);
    const fixedCardHeight = 310;
    const cardGap = 32;
    const cards = [...rail.querySelectorAll('.ticket')];
    setStyle(rail, 'position', '');
    setStyle(rail, 'top', '');
    setStyle(rail, 'bottom', '');
    setStyle(rail, 'flexDirection', '');
    setStyle(rail, 'transform', '');
    setStyle(stage, 'position', '');
    setStyle(stage, 'left', '0px');
    setStyle(stage, 'top', '0px');
    setStyle(stage, 'overflow', '');
    setStyle(viewport, 'position', '');
    setStyle(viewport, 'top', '');
    setStyle(viewport, 'overflow', '');
    cards.forEach((card) => {
      setStyle(card, 'width', cardWidth + 'px');
      setStyle(card, 'height', narrowTickets ? 'auto' : fixedCardHeight + 'px');
    });
    setStyle(rail, 'width', 'max-content');
    setStyle(rail, 'left', '32px');
    setStyle(rail, 'gap', cardGap + 'px');

    const visibleBottom = viewport.getBoundingClientRect().bottom;
    const stageTop = stage.getBoundingClientRect().top;
    const cardHeight = Math.max(...cards.map((card) => card.getBoundingClientRect().height));
    const heading = stage.querySelector('h1');
    const headingBottom = heading ? heading.offsetTop + heading.offsetHeight : 0;
    const safeRailTop = headingBottom + 24;
    const bottomRailTop = visibleBottom - stageTop - 32 - cardHeight;
    const navBottom = document.querySelector('.kc-responsive-nav')?.getBoundingClientRect().bottom || 0;
    const ticketFits = cardHeight <= height - navBottom - 24 - 32;
    if (!ticketFits) {
      fitExtremeFlow(section, viewport, stage, rail, cards, cardWidth, cardGap, narrowTickets);
      return true;
    }
    const nextMode = safeRailTop <= bottomRailTop ? 'normal' : 'compact';
    section.dataset.kcProjectsMode = nextMode;
    section.classList.toggle('kc-projects-compact', nextMode === 'compact');
    heading?.classList.toggle('kc-projects-heading-hidden', nextMode === 'compact');
    const rowTop = nextMode === 'compact' ? bottomRailTop : Math.max(bottomRailTop, safeRailTop);
    introShift = nextMode === 'normal' ? Math.max(0, safeRailTop - bottomRailTop) : 0;
    setImportantStyle(rail, 'top', rowTop.toFixed(2) + 'px');
    setImportantStyle(rail, 'bottom', 'auto');

    const fullWidth = cards.length * cardWidth + (cards.length - 1) * cardGap;
    scrollScale = 1;
    const visibleWidth = viewport.getBoundingClientRect().width;
    const sideMargin = 32;
    travel = Math.max(0, sideMargin + fullWidth + sideMargin - visibleWidth);
    // The leading part of the existing rail scroll clears the heading on short
    // landscape viewports; horizontal travel starts once the full ticket fits.
    scrollLength = introShift + travel;
    setStyle(section, 'height', (height + scrollLength) + 'px');
    updateLandscapeScroll();
    return true;
  }

  function updateLandscapeScroll() {
    if (!frame) return;
    const rail = $('kc-t-stage')?.querySelector('.tickets');
    if (!rail) return;
    const rememberVisibleProject = () => {
      if (preservingResizeAnchor) return;
      const about = $('apropos-t');
      const aboutRect = about?.getBoundingClientRect();
      if (aboutRect && aboutRect.top <= 1 && aboutRect.bottom > 0) {
        lastViewportAnchor = { kind: 'about', top: aboutRect.top };
        return;
      }
      const sectionRect = frame.getBoundingClientRect();
      if (sectionRect.top >= innerHeight || sectionRect.bottom <= 0) { lastViewportAnchor = null; return; }
      const cards = [...rail.querySelectorAll('.ticket')];
      const centerX = innerWidth / 2, centerY = innerHeight / 2;
      let best = null;
      cards.forEach((card, index) => {
        const r = (card.querySelector('.ticket-panel') || card).getBoundingClientRect();
        const width = Math.max(0, Math.min(r.right, innerWidth) - Math.max(r.left, 0));
        const height = Math.max(0, Math.min(r.bottom, innerHeight) - Math.max(r.top, 0));
        const area = width * height;
        const centerDistance = activeLandscape ? Math.abs((r.left + r.right) / 2 - centerX)
          : Math.hypot((r.left + r.right) / 2 - centerX, (r.top + r.bottom) / 2 - centerY);
        if (area > 0 && (!best || centerDistance < best.centerDistance - 0.5
          || (Math.abs(centerDistance - best.centerDistance) <= 0.5 && area > best.area))) best = { index, area, centerDistance };
      });
      if (best) {
        lastActiveProjectIndex = best.index;
        window.__kcFocusedProjectIndex = best.index;
        lastViewportAnchor = { kind: 'project', index: best.index };
      } else lastViewportAnchor = null;
    };
    if (activeFlow) { rememberVisibleProject(); return; }
    if (!activeLandscape) { rememberVisibleProject(); return; }
    const rect = frame.getBoundingClientRect();
    const moved = Math.max(0, Math.min(scrollLength, -rect.top));
    const vertical = Math.min(introShift, moved);
    const horizontal = Math.max(0, moved - introShift) / scrollScale;
    const heading = $('kc-t-stage')?.querySelector('h1');
    if (heading) heading.style.transform = 'translate3d(0,' + (-vertical).toFixed(2) + 'px,0)';
    rail.style.transform = 'translate3d(' + (-horizontal).toFixed(2) + 'px,' + (-vertical).toFixed(2) + 'px,0)';
    rememberVisibleProject();
  }

  function fitTabletProjectGeometry() {
    if (activeLandscape || activeFlow) {
      if (fitBaseGeometry(true) && fitLandscapeGeometry()) return;
      resetLandscape();
      if (!fitBaseGeometry()) return;
    } else if (!fitBaseGeometry()) {
      return;
    }
    if (fitLandscapeGeometry()) return;
    fitPortraitGeometry();
  }

  function scheduleFit(force = false) {
    forceLayout = forceLayout || force;
    if (layoutFrame) return;
    layoutFrame = requestAnimationFrame(function () {
      layoutFrame = 0;
      const forced = forceLayout;
      forceLayout = false;
      const policy = window.__kcTabletLayout;
      const key = policy
        ? [policy.tablet, policy.scale, policy.width, policy.height].join(':')
        : [window.innerWidth, window.innerHeight, window.__kcTabletScale || 1].join(':');
      if (!forced && key === lastLayoutKey) return;
      lastLayoutKey = key;
      if (policy && !policy.tablet) {
        resetLandscape();
        hasLayout = false;
        resizeAnchor = null;
        window.__kcPendingAboutAnchor = null;
        return;
      }
      const usedPendingProjectAnchor = window.__kcPendingProjectAnchor != null;
      const usedPendingAboutAnchor = Number.isFinite(window.__kcPendingAboutAnchor?.progress);
      const anchor = usedPendingAboutAnchor
        ? { kind: 'about', progress: window.__kcPendingAboutAnchor.progress }
        : resizeAnchor || (usedPendingProjectAnchor
        ? { kind: 'project', index: window.__kcPendingProjectAnchor }
        : captureViewportAnchor());
      resizeAnchor = null;
      preservingResizeAnchor = !!anchor;
      if (anchor) lastViewportAnchor = { ...anchor };
      fitTabletProjectGeometry();
      restoreViewportAnchor(anchor);
      if (usedPendingProjectAnchor) window.__kcPendingProjectAnchor = null;
      if (usedPendingAboutAnchor) window.__kcPendingAboutAnchor = null;
      if (preservingResizeAnchor) window.setTimeout(() => { preservingResizeAnchor = false; }, 120);
      hasLayout = true;
    });
  }

  window.addEventListener('kc:tablet-layout-change', () => scheduleFit());
  // Snapshot before the profile controller writes new geometry. Chromium can emit a
  // scroll event while applying a resize, and that event must not replace the prior
  // focused project with a ticket selected by the intermediate viewport.
  window.addEventListener('resize', () => {
    if (!hasLayout) return;
    resizeAnchor = captureViewportAnchor();
    if (resizeAnchor) {
      preservingResizeAnchor = true;
      lastViewportAnchor = { ...resizeAnchor };
    }
    scheduleFit();
  }, { passive: true, capture: true });
  window.addEventListener('resize', () => scheduleFit(), { passive: true });
  window.addEventListener('orientationchange', () => scheduleFit(), { passive: true });
  window.addEventListener('pageshow', () => scheduleFit(true));
  window.addEventListener('load', () => scheduleFit(true), { once: true });
  window.addEventListener('scroll', updateLandscapeScroll, { passive: true });
  document.addEventListener('DOMContentLoaded', () => scheduleFit(), { once: true });
  if (document.fonts) {
    document.fonts.ready.then(() => scheduleFit(true)).catch(function () {});
    document.fonts.addEventListener?.('loadingdone', () => scheduleFit(true));
  }

  const projectsRoot = $('kc-tablet-projets');
  const mountObserver = projectsRoot && new MutationObserver(function () {
    if (!$('kc-t-stage')) return;
    mountObserver.disconnect();
    scheduleFit();
  });
  if (projectsRoot && !$('kc-t-stage')) {
    mountObserver.observe(projectsRoot, { childList: true, subtree: true });
  }
  if ($('kc-t-stage')) scheduleFit();
})();
