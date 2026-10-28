
/* Mobile image tickets: viewport-triggered loops, mounted like the working videos. */
(function () {
  const bound = new WeakSet(), states = new WeakMap(), targets = new Set();
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  function show(state, n) {
    state.index = n;
    state.layers.forEach(function (img,i) {
      img.style.opacity = i === n ? '1' : '0';
    });
  }
  function stop(visual) {
    const state = states.get(visual);
    if (!state) return;
    if (state.timer) clearInterval(state.timer);
    state.timer = null;
    show(state,0);
  }
  function start(visual) {
    const state = states.get(visual);
    if (!state || state.timer || document.hidden || reduced.matches) return;
    // The poster remains visible until the next image has loaded.
    const advance = function () {
      const next = (state.index + 1) % state.layers.length;
      if (state.layers[next].complete && state.layers[next].naturalWidth) show(state,next);
    };
    advance();
    state.timer = setInterval(advance,1900);
  }
  function inPlaybackRegion(visual) {
    const rect = visual.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return false;
    const width = Math.max(0, Math.min(rect.right, innerWidth) - Math.max(rect.left, 0));
    const height = Math.max(0, Math.min(rect.bottom, innerHeight) - Math.max(rect.top, 0));
    return width * height / (rect.width * rect.height) >= .32;
  }
  function loadSequence(visual) {
    const state = states.get(visual);
    if (!state || state.loaded) return;
    state.loaded = true;
    state.layers.slice(1).forEach(function(img) {
      const src = img.dataset.sequenceSrc;
      if (!src) return;
      img.loading = 'eager';
      img.src = src;
      delete img.dataset.sequenceSrc;
    });
  }
  function syncPlayback(visual) {
    const state = states.get(visual);
    if (!state || !state.loaded) return;
    if (!document.hidden && inPlaybackRegion(visual)) start(visual);
    else stop(visual);
  }
  let syncFrame = 0;
  function schedulePlaybackSync() {
    if (syncFrame) return;
    syncFrame = requestAnimationFrame(function() {
      syncFrame = 0;
      targets.forEach(syncPlayback);
    });
  }
  const io = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) loadSequence(entry.target);
      syncPlayback(entry.target);
    });
  }, {rootMargin:'100% 0px',threshold:0});
  function bindImages() {
    document.querySelectorAll('#kc-mobile-projets .project').forEach(function(ticket) {
      const sequence = (ticket.dataset.sequence || '').split(/\s+/).filter(Boolean);
      const visual = ticket.querySelector('.visual');
      if (sequence.length < 2 || !visual || bound.has(visual)) return;
      const poster = visual.querySelector('img.poster');
      if (!poster) return;
      bound.add(visual);
      const layers = [poster];
      poster.style.transition = 'opacity .32s ease';
      sequence.slice(1).forEach(function(src) {
        const img = document.createElement('img');
        img.className='poster kc-mobile-slide';
        img.dataset.sequenceSrc=src;
        img.alt='';
        img.decoding='async';
        img.style.opacity='0';
        img.style.transition='opacity .32s ease';
        img.style.pointerEvents='none';
        visual.appendChild(img);
        layers.push(img);
      });
      states.set(visual,{layers:layers,index:0,timer:null,loaded:false});
      targets.add(visual);
      io.observe(visual);
    });
  }
  const mounts = new MutationObserver(bindImages);
  mounts.observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener('DOMContentLoaded',bindImages,{once:true});
  document.addEventListener('visibilitychange',function() {
    if (document.hidden) targets.forEach(stop);
    else schedulePlaybackSync();
  });
  reduced.addEventListener?.('change',function() {
    if (reduced.matches) targets.forEach(stop);
    else schedulePlaybackSync();
  });
  window.addEventListener('scroll',schedulePlaybackSync,{passive:true});
  window.addEventListener('resize',schedulePlaybackSync,{passive:true});
  bindImages();
})();
