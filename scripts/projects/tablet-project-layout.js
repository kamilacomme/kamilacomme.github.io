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

    const scale = window.__kcTabletScale || 1;
    setStyle(stage, 'width', (window.innerWidth / scale) + 'px');
    setStyle(stage, 'transform', 'scale(' + scale + ')');
    setStyle(viewport, 'width', '100%');
    if (!preserveLandscapeFrame) {
      setStyle(stage, 'height', '1655px');
      setStyle(viewport, 'height', (1655 * scale) + 'px');
    }

    // Match the rendered tablet Hero title while retaining the original sizing formula.
    const projectTitle = stage.querySelector('h1');
    const projectLine = projectTitle && projectTitle.querySelector('.kc-title-line');
    const hero = document.querySelector('[data-kc-tablet-hero-title]');
    const heroLine = hero && hero.querySelector('span');
    if (projectTitle && projectLine && heroLine) {
      setStyle(projectTitle, 'fontSize', '48px');
      const target = heroLine.getBoundingClientRect().height;
      const current = projectLine.getBoundingClientRect().height;
      if (target > 0 && current > 0) {
        const ratio = Math.max(0.4, Math.min(1.4, target / current));
        setStyle(projectTitle, 'fontSize', (48 * ratio).toFixed(3) + 'px');
      }
    }
    return true;
  }

  function fitPortraitGeometry() {
    if (window.innerWidth < 500 || window.innerWidth > 1080 || window.innerWidth >= window.innerHeight) return;
    const stage = $('kc-t-stage');
    const viewport = $('kc-t-viewport');
    const aboutFrame = document.querySelector('#apropos-t > div > div');
    if (!stage || !viewport || !aboutFrame) return;

    const scale = window.__kcTabletScale || 1;
    const width = aboutFrame.offsetWidth || 834;
    const aboutRect = aboutFrame.getBoundingClientRect();
    const viewportRect = viewport.getBoundingClientRect();
    if (!aboutRect.width || !viewportRect.width) return;

    // Align Projects to About's actual centered frame, excluding scrollbar width.
    setStyle(stage, 'width', width + 'px');
    setStyle(stage, 'position', 'relative');
    setStyle(stage, 'left', (aboutRect.left - viewportRect.left) + 'px');
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
    const scale = window.__kcTabletScale || 1;
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
    const hireButton = document.querySelector('a[data-fixed-ink][href^="mailto:"]');
    const buttonRect = hireButton?.getBoundingClientRect();
    const viewportRect = viewport.getBoundingClientRect();
    const rightInset = buttonRect && buttonRect.width
      ? Math.max(0, viewportRect.right - buttonRect.right) / scrollScale
      : 32;
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

  function scheduleFit() {
    if (layoutFrame) return;
    layoutFrame = requestAnimationFrame(function () {
      layoutFrame = 0;
      fitTabletProjectGeometry();
    });
  }

  window.__kcTabletProjectFit = fitTabletProjectGeometry;
  window.addEventListener('resize', scheduleFit, { passive: true });
  window.addEventListener('pageshow', scheduleFit);
  window.addEventListener('scroll', updateLandscapeScroll, { passive: true });
  document.addEventListener('DOMContentLoaded', scheduleFit, { once: true });

  const mountObserver = new MutationObserver(function () {
    const stage = $('kc-t-stage');
    if (!stage || !fitTabletProjectGeometry()) return;
    mountObserver.disconnect();
    watchTabletFrame(stage);
  });
  function watchTabletFrame(stage) {
    const aboutFrame = document.querySelector('#apropos-t > div > div');
    const head = document.querySelector('[data-c="0"]');
    if (!head) return;
    const observer = new MutationObserver(scheduleFit);
    observer.observe(stage, { attributes: true, attributeFilter: ['style'] });
    if (aboutFrame) observer.observe(aboutFrame, { attributes: true, attributeFilter: ['style'] });
    observer.observe(head, { attributes: true, attributeFilter: ['style'] });
    const info = head.parentElement?.querySelector('[data-c="1"]');
    if (info) observer.observe(info, { attributes: true, attributeFilter: ['style'] });

    const root = $('kc-tablet-projets')?.parentElement;
    if (root) {
      const visibilityObserver = new MutationObserver(scheduleFit);
      visibilityObserver.observe(root, { attributes: true, attributeFilter: ['style', 'class'] });
    }
  }
  mountObserver.observe(document.documentElement, { childList: true, subtree: true });
  if (fitTabletProjectGeometry()) {
    mountObserver.disconnect();
    watchTabletFrame($('kc-t-stage'));
  }
})();
