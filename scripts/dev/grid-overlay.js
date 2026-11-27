/* Development tool: the layout grid overlay. Press G to show or hide it.
   Desktop and tablet: 12 columns, 32px margins, 24px gutters. Mobile (under 500px): 4 columns, 16px margins, 16px gutters.
   Red columns at 15% opacity. It draws one fixed, click-through layer and never changes the page layout.
   It is not part of any page: nothing in templates/ or the generated HTML loads it. The local server
   injects it only when started with `npm run dev:grid`. It also refuses to run unless the address is
   localhost, 127.0.0.1 or [::1], or the address has ?grid=1. */
(function () {
  'use strict';
  var host = location.hostname;
  var local = host === 'localhost' || host === '127.0.0.1' || host === '[::1]' || host === '::1';
  var asked = /(?:^|[?&])grid=1(?:&|$)/.test(location.search);
  if (!local && !asked) return;
  if (window.__kcGridOverlay) return;
  window.__kcGridOverlay = true;

  var layer = null;
  function spec() {
    var mobile = document.documentElement.clientWidth < 500;
    return mobile ? { columns: 4, margin: 16, gutter: 16 } : { columns: 12, margin: 32, gutter: 24 };
  }
  function draw() {
    if (!layer) return;
    var s = spec();
    layer.style.padding = '0 ' + s.margin + 'px';
    layer.style.gap = s.gutter + 'px';
    while (layer.children.length > s.columns) layer.removeChild(layer.lastChild);
    while (layer.children.length < s.columns) {
      var column = document.createElement('div');
      column.style.cssText = 'flex:1 1 0;min-width:0;height:100%;background:rgba(255,0,0,0.15)';
      layer.appendChild(column);
    }
  }
  function toggle() {
    if (layer) { layer.remove(); layer = null; return; }
    layer = document.createElement('div');
    layer.setAttribute('aria-hidden', 'true');
    layer.setAttribute('data-kc-grid-overlay', '');
    layer.style.cssText = 'position:fixed;top:0;bottom:0;left:0;right:0;z-index:2147483647;display:flex;box-sizing:border-box;pointer-events:none';
    document.body.appendChild(layer);
    draw();
  }
  addEventListener('keydown', function (event) {
    if (event.key !== 'g' && event.key !== 'G') return;
    if (event.ctrlKey || event.metaKey || event.altKey || event.repeat) return;
    var t = event.target;
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
    toggle();
  });
  addEventListener('resize', draw);
})();
