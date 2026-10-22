/* Tablet Projects geometry owner: base, portrait alignment, landscape rail. */
(function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  let frame = null;
  let activeLandscape = false;
  let travel = 0;
  let scrollLength = 0;
  let scrollScale = 1;
  let layoutFrame = 0;
  let lastLayoutKey = '';
  let forceLayout = false;

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
    frame.style.height = '';
    if (viewport) {
      viewport.style.position = '';
      viewport.style.top = '';
      viewport.style.height = '';
    }
    if (rail) {
      rail.style.transform = '';
      rail.style.width = '';
      rail.style.top = '';
      rail.style.bottom = '';
      rail.style.left = '';
      [...rail.children].forEach((card) => {
        card.style.width = '';
        card.style.height = '';
      });
    }
    if (stage) stage.style.removeProperty('height');
    activeLandscape = false;
  }

  function fitBaseGeometry(preserveLandscapeFrame) {
    frame = $('kc-tablet-projets');
    const viewport = $('kc-t-viewport');
    const stage = $('kc-t-stage');
    if (!frame || !viewport || !stage) return false;

    const scale = window.__kcTabletLayout?.scale || window.__kcTabletScale || 1;
    setStyle(stage, 'width', (window.innerWidth / scale) + 'px');
    setStyle(stage, 'transform', 'scale(' + scale + ')');
    setStyle(viewport, 'width', '100%');
    if (!preserveLandscapeFrame) {
      setStyle(stage, 'height', '1655px');
      setStyle(viewport, 'height', (1655 * scale) + 'px');
    }

    return true;
  }

  function fitPortraitGeometry() {
    if (window.innerWidth < 500 || window.innerWidth > 1080 || window.innerWidth >= window.innerHeight) return;
    const stage = $('kc-t-stage');
    const viewport = $('kc-t-viewport');
    if (!stage || !viewport) return;

    const scale = window.__kcTabletLayout?.scale || window.__kcTabletScale || 1;
    const width = Math.round(window.innerWidth / scale);
    // The shared tablet frame is centered on the viewport; derive its position from
    // that policy instead of measuring the unrelated About section.
    setStyle(stage, 'width', width + 'px');
    setStyle(stage, 'position', 'relative');
    setStyle(stage, 'left', '0px');
    setStyle(stage, 'transform', 'scale(' + scale + ')');
    setStyle(viewport, 'height', (1655 * scale) + 'px');
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

    activeLandscape = true;
    frame = section;
    section.classList.add('kc-landscape-rail');
    const scale = window.__kcTabletLayout?.scale || window.__kcTabletScale || 1;
    const width = window.innerWidth / scale;
    const height = window.innerHeight / scale;
    setImportantStyle(stage, 'height', height + 'px');
    setStyle(viewport, 'width', '100%');
    setStyle(viewport, 'height', window.innerHeight + 'px');

    const cardWidth = Math.min(574, width - 64);
    const cards = [...rail.querySelectorAll('.ticket')];
    cards.forEach((card) => {
      setStyle(card, 'width', cardWidth + 'px');
      setStyle(card, 'height', '220px');
    });
    setStyle(rail, 'left', '32px');

    const visibleBottom = viewport.getBoundingClientRect().bottom;
    const stageTop = stage.getBoundingClientRect().top;
    const stageRect = stage.getBoundingClientRect();
    const actualScale = stage.offsetWidth ? stageRect.width / stage.offsetWidth : 1;
    const rowTop = (visibleBottom - stageTop - 32) / actualScale - 220;
    setImportantStyle(rail, 'top', Math.max(0, rowTop).toFixed(2) + 'px');
    setImportantStyle(rail, 'bottom', 'auto');

    const fullWidth = cards.length * cardWidth + (cards.length - 1) * 18;
    scrollScale = actualScale || 1;
    const visibleWidth = viewport.getBoundingClientRect().width / scrollScale;
    // Match the fixed 32-design-pixel frame gutter; do not infer rail length from
    // the navigation CTA, whose position is written by another controller.
    const rightInset = 32;
    travel = Math.max(0, 32 + fullWidth + rightInset - visibleWidth);
    scrollLength = travel * scrollScale;
    setStyle(section, 'height', (window.innerHeight + scrollLength) + 'px');
    updateLandscapeScroll();
    return true;
  }

  function updateLandscapeScroll() {
    if (!activeLandscape || !frame) return;
    const rail = $('kc-t-stage')?.querySelector('.tickets');
    if (!rail) return;
    const rect = frame.getBoundingClientRect();
    const moved = Math.max(0, Math.min(scrollLength, -rect.top));
    rail.style.transform = 'translate3d(' + (-moved / scrollScale).toFixed(2) + 'px,0,0)';
  }

  function fitTabletProjectGeometry() {
    if (activeLandscape) {
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
      fitTabletProjectGeometry();
    });
  }

  window.addEventListener('kc:tablet-layout-change', () => scheduleFit());
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
