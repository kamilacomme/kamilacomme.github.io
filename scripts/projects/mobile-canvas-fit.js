
/* Apply the 393px Figma canvas scaling whenever the rendered component is mounted or resized. */
(function () {
  let observedViewport = null;
  let resizeObserver = null;
  function fitMobileProjects() {
    const viewport = document.getElementById('kc-m-viewport');
    const canvas = document.getElementById('kc-m-canvas');
    if (!viewport || !canvas) return;
    const width = document.documentElement.clientWidth || window.innerWidth;
    const scale = width / 393;
    viewport.style.width = width + 'px';
    viewport.style.height = (3589 * scale) + 'px';
    canvas.style.transformOrigin = 'top left';
    canvas.style.transform = 'scale(' + scale + ')';
    if (viewport !== observedViewport) {
      if (resizeObserver) resizeObserver.disconnect();
      observedViewport = viewport;
      if (typeof ResizeObserver !== 'undefined') {
        resizeObserver = new ResizeObserver(fitMobileProjects);
        resizeObserver.observe(document.documentElement);
      }
    }
  }
  const mountObserver = new MutationObserver(function () {
    if (document.getElementById('kc-m-canvas') !== observedViewport?.querySelector('#kc-m-canvas')) fitMobileProjects();
  });
  mountObserver.observe(document.documentElement, {childList:true,subtree:true});
  document.addEventListener('DOMContentLoaded',fitMobileProjects,{once:true});
  window.addEventListener('resize',fitMobileProjects,{passive:true});
  window.addEventListener('pageshow',fitMobileProjects);
  fitMobileProjects();
})();
