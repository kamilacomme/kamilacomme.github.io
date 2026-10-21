
/* Vertical page scroll drives horizontal tablet Projects tickets in landscape only.
   Portrait keeps the approved six-row layout and its existing sizing controller. */
(function () {
  let lastFrame = null, active = false, travel = 0, scrollLength = 0, scale = 1;
  const $ = id => document.getElementById(id);
  function layout() {
    const section = $('kc-tablet-projets'), viewport = $('kc-t-viewport'),
      stage = $('kc-t-stage'), rail = stage?.querySelector('.tickets');
    if (!section || !viewport || !stage || !rail) return;
    const tabletRoot = section.parentElement;
    const shouldRun = !!tabletRoot && getComputedStyle(tabletRoot).display !== 'none'
      && window.innerWidth > window.innerHeight && window.innerWidth >= 500;
    if (!shouldRun) {
      if (active) {
        active = false;
        section.classList.remove('kc-landscape-rail');
        section.style.height = '';
        viewport.style.position = ''; viewport.style.top = ''; viewport.style.height = '';
        rail.style.transform = ''; rail.style.width = ''; rail.style.top = ''; rail.style.bottom = '';
        stage.style.removeProperty('height');
        rail.style.left = '';
        [...rail.children].forEach(el => { el.style.width = ''; el.style.height = ''; });
        if (window.__kcTabletProjectFit) window.__kcTabletProjectFit();
      }
      return;
    }
    active = true;
    section.classList.add('kc-landscape-rail');
    scale = window.__kcTabletScale || 1;
    const vw = window.innerWidth / scale, vh = window.innerHeight / scale;
    stage.style.setProperty('height', vh + 'px', 'important');
    viewport.style.width = '100%';
    viewport.style.height = window.innerHeight + 'px';
    const cardWidth = Math.min(574, vw - 64);
    const cards = [...rail.querySelectorAll('.ticket')];
    cards.forEach(el => { el.style.width = cardWidth + 'px'; el.style.height = '220px'; });
    rail.style.left = '32px';
    const visibleBottom = viewport.getBoundingClientRect().bottom;
    const stageTop = stage.getBoundingClientRect().top;
    const stageRect = stage.getBoundingClientRect();
    const actualScale = stage.offsetWidth ? stageRect.width / stage.offsetWidth : 1;
    const rowTop = (visibleBottom - stageTop - 32) / actualScale - 220;
    rail.style.setProperty('top', Math.max(0, rowTop).toFixed(2) + 'px', 'important');
    rail.style.setProperty('bottom', 'auto', 'important');
    const fullWidth = cards.length * cardWidth + (cards.length - 1) * 18;
    // Measure the rendered stage rather than the nominal tablet scale; account for both 32px gutters.
    scale = actualScale || 1;
    const visibleWidth = viewport.getBoundingClientRect().width / scale;
    const hireButton = document.querySelector('a[data-fixed-ink][href^="mailto:"]');
    const buttonRect = hireButton?.getBoundingClientRect();
    const viewportRect = viewport.getBoundingClientRect();
    const rightInset = buttonRect && buttonRect.width ? Math.max(0, viewportRect.right - buttonRect.right) / scale : 32;
    travel = Math.max(0, 32 + fullWidth + rightInset - visibleWidth);
    scrollLength = travel * scale;
    section.style.height = (window.innerHeight + scrollLength) + 'px';
    lastFrame = section;
    update();
  }
  function update() {
    if (!active || !lastFrame) return;
    const rail = lastFrame.querySelector('.tickets');
    if (!rail) return;
    const rect = lastFrame.getBoundingClientRect();
    const moved = Math.max(0, Math.min(scrollLength, -rect.top));
    rail.style.transform = 'translate3d(' + (-moved / scale).toFixed(2) + 'px,0,0)';
  }
  let scheduled = false;
  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(function () { scheduled = false; layout(); });
  }
  window.addEventListener('scroll', update, {passive:true});
  window.addEventListener('resize', schedule, {passive:true});
  window.addEventListener('pageshow', schedule);
  document.addEventListener('DOMContentLoaded', schedule, {once:true});
  const mounts = new MutationObserver(function () {
    const section = $('kc-tablet-projets');
    if (section && section !== lastFrame) schedule();
  });
  mounts.observe(document.documentElement,{childList:true,subtree:true});
  function watchTabletVisibility() {
    const root = $('kc-tablet-projets')?.parentElement;
    if (!root) return;
    const visibilityObserver = new MutationObserver(schedule);
    visibilityObserver.observe(root, {attributes:true,attributeFilter:['style','class']});
    schedule();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', watchTabletVisibility, {once:true});
  else watchTabletVisibility();
  schedule();
})();
