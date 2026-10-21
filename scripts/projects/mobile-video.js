
/* Mobile Projects: restore standalone-preview autoplay and looping on dynamic mounts. */
(function () {
  const observed = new WeakSet();
  const io = new IntersectionObserver(function (entries) {
    for (const entry of entries) {
      const video = entry.target;
      const ticket = video.closest('.project');
      if (!ticket) continue;
      if (entry.isIntersecting && entry.intersectionRatio >= 0.32 && !document.hidden) {
        if (!video.getAttribute('src') && video.dataset.src) {
          video.src = video.dataset.src;
          video.load();
        }
        video.muted = true;
        video.loop = true;
        video.playsInline = true;
        const result = video.play();
        if (result && result.catch) result.catch(function () { ticket.classList.remove('playing'); });
        ticket.classList.add('playing');
      } else {
        video.pause();
        ticket.classList.remove('playing');
      }
    }
  }, { threshold: [0, 0.32, 0.6] });
  function bindVideos() {
    document.querySelectorAll('#kc-mobile-projets video.motion').forEach(function (video) {
      if (observed.has(video)) return;
      observed.add(video);
      io.observe(video);
    });
  }
  const mounts = new MutationObserver(bindVideos);
  mounts.observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener('DOMContentLoaded', bindVideos, { once: true });
  document.addEventListener('visibilitychange', function () {
    document.querySelectorAll('#kc-mobile-projets video.motion').forEach(function (video) {
      if (document.hidden) video.pause();
      else if (video.closest('.project')?.classList.contains('playing')) video.play().catch(function () {});
    });
  });
  bindVideos();
})();
