
/* Mobile image tickets: viewport-triggered loops, mounted like the working videos. */
(function () {
  const sets = {
    'Tour de parole': ['p3-bg.webp','p3-b.webp','p3-c.webp'],
    'Celimax': ['p6-bg.webp','p6-b.webp','p6-c.webp'],
    'Napoli': ['p2-a.webp','p2-b.webp','p2-bg.webp']
  };
  const base = 'assets/projets/opt/';
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
  const io = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if(entry.isIntersecting && entry.intersectionRatio >= .32 && !document.hidden) start(entry.target);
      else stop(entry.target);
    });
  }, {threshold:[0,.32,.6]});
  function bindImages() {
    document.querySelectorAll('#kc-mobile-projets .project').forEach(function(ticket) {
      const name = ticket.querySelector('h2')?.textContent.trim();
      const set = sets[name], visual = ticket.querySelector('.visual');
      if (!set || !visual || bound.has(visual)) return;
      const poster = visual.querySelector('img.poster');
      if (!poster) return;
      bound.add(visual);
      const layers = [poster];
      poster.style.transition = 'opacity .32s ease';
      set.slice(1).forEach(function(filename) {
        const img = document.createElement('img');
        img.className='poster kc-mobile-slide';
        img.src=base+filename;
        img.alt='';
        img.decoding='async';
        img.loading='eager';
        img.style.opacity='0';
        img.style.transition='opacity .32s ease';
        img.style.pointerEvents='none';
        visual.appendChild(img);
        layers.push(img);
      });
      states.set(visual,{layers:layers,index:0,timer:null});
      targets.add(visual);
      io.observe(visual);
    });
  }
  const mounts = new MutationObserver(bindImages);
  mounts.observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener('DOMContentLoaded',bindImages,{once:true});
  document.addEventListener('visibilitychange',function() {
    targets.forEach(function(visual) {
      if (document.hidden) stop(visual);
      else if (visual.getBoundingClientRect().bottom > 0 &&
        visual.getBoundingClientRect().top < innerHeight) start(visual);
    });
  });
  reduced.addEventListener?.('change',function() {
    targets.forEach(stop);
  });
  bindImages();
})();
