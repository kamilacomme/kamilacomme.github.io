(() => {
  if (document.documentElement.lang !== 'en') return;

  // The English tablet tickets include their horizontal padding inside the
  // measured width, matching the English layout's established geometry rule.
  const tabletGeometryStyle = document.createElement('style');
  tabletGeometryStyle.textContent = '#kc-tablet-projets .ticket{box-sizing:border-box}';
  document.head.appendChild(tabletGeometryStyle);

  // English's footer content aligns to the centered tablet About frame. Keep
  // this responsibility local to the Footer rather than coupling it to the
  // translation loader.
  let frameRaf = 0;
  function fitTabletFooter() {
    frameRaf = 0;
    if (window.innerWidth < 500 || window.innerWidth > 1080 || window.innerWidth >= window.innerHeight) return;

    const about = document.querySelector('#apropos-t > div > div');
    if (!about) return;
    const scale = window.__kcTabletScale || 1;
    const width = about.offsetWidth || 834;
    const frameLeft = (window.innerWidth - width * scale) / 2;
    const head = document.querySelector('[data-c="0"]');
    const footer = head?.parentElement;
    if (!footer || !footer.querySelector('[data-c="1"]')) return;

    const left = frameLeft + 32 * scale;
    const right = window.innerWidth - (frameLeft + (width - 32) * scale);
    for (const element of [head, footer.querySelector('[data-c="1"]'), footer.querySelector('[data-c="4"]')]) {
      if (element && element !== footer.querySelector('[data-c="4"]') && element.style.left !== `${left}px`) {
        element.style.left = `${left}px`;
      }
    }
    const gif = footer.querySelector('[data-c="3"]');
    if (gif && gif.style.right !== `${right}px`) gif.style.right = `${right}px`;
  }

  function queueFit() {
    if (frameRaf) return;
    frameRaf = requestAnimationFrame(fitTabletFooter);
  }

  window.addEventListener('resize', queueFit);
  window.addEventListener('load', queueFit);

  const frameObserver = new MutationObserver(queueFit);
  function attachFrameObserver() {
    const stage = document.getElementById('kc-t-stage');
    const head = document.querySelector('[data-c="0"]');
    if (!stage || !head) return false;

    frameObserver.disconnect();
    frameObserver.observe(stage, { attributes: true, attributeFilter: ['style'] });
    const about = document.querySelector('#apropos-t > div > div');
    if (about) frameObserver.observe(about, { attributes: true, attributeFilter: ['style'] });
    frameObserver.observe(head, { attributes: true, attributeFilter: ['style'] });
    const info = head.parentElement?.querySelector('[data-c="1"]');
    if (info) frameObserver.observe(info, { attributes: true, attributeFilter: ['style'] });
    queueFit();
    return true;
  }

  const mountObserver = new MutationObserver(() => {
    if (attachFrameObserver()) mountObserver.disconnect();
  });
  mountObserver.observe(document.documentElement, { childList: true, subtree: true });
  attachFrameObserver();
})();
