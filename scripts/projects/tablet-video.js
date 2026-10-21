
/* Tablet Projects: standalone-preview video playback, safe for dynamic mounting. */
(function () {
  const observed = new WeakSet();
  const io = new IntersectionObserver(function (entries) {
    for (const entry of entries) {
      const video = entry.target;
      const ticket = video.closest('#kc-tablet-projets .ticket');
      if (!ticket) continue;
      if (entry.isIntersecting && entry.intersectionRatio >= 0.4 && !document.hidden) {
        if (!video.getAttribute('src') && video.dataset.src) {
          video.src = video.dataset.src;
          video.load();
        }
        video.muted = true;
        video.loop = true;
        video.playsInline = true;
        const playback = video.play();
        if (playback && playback.catch) playback.catch(function () { ticket.classList.remove('playing'); });
        ticket.classList.add('playing');
      } else {
        video.pause();
        ticket.classList.remove('playing');
      }
    }
  }, {threshold:[0,0.4,0.7]});
  function bindVideos() {
    document.querySelectorAll('#kc-tablet-projets video.motion').forEach(function (video) {
      if (observed.has(video)) return;
      observed.add(video);
      io.observe(video);
    });
  }
  const mounts = new MutationObserver(bindVideos);
  mounts.observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener('DOMContentLoaded',bindVideos,{once:true});
  document.addEventListener('visibilitychange',function () {
    document.querySelectorAll('#kc-tablet-projets video.motion').forEach(function (video) {
      if (document.hidden) video.pause();
      else if (video.closest('.ticket')?.classList.contains('playing')) video.play().catch(function () {});
    });
  });
  bindVideos();
})();
