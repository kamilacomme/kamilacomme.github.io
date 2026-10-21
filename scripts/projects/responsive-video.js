/* Shared tablet/mobile project video lifecycle with layout-specific thresholds. */
(function () {
  function bindProjectVideos(config) {
    const observed = new WeakSet();
    const io = new IntersectionObserver(function (entries) {
      for (const entry of entries) {
        const video = entry.target;
        const ticket = video.closest(config.ticketSelector);
        if (!ticket) continue;
        if (entry.isIntersecting && entry.intersectionRatio >= config.playRatio && !document.hidden) {
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
    }, { threshold: config.thresholds });

    function bindVideos() {
      document.querySelectorAll(config.containerSelector + ' video.motion').forEach(function (video) {
        if (observed.has(video)) return;
        observed.add(video);
        io.observe(video);
      });
    }

    const mounts = new MutationObserver(bindVideos);
    mounts.observe(document.documentElement, { childList: true, subtree: true });
    document.addEventListener('DOMContentLoaded', bindVideos, { once: true });
    document.addEventListener('visibilitychange', function () {
      document.querySelectorAll(config.containerSelector + ' video.motion').forEach(function (video) {
        if (document.hidden) video.pause();
        else if (video.closest(config.ticketSelector)?.classList.contains('playing')) video.play().catch(function () {});
      });
    });
    bindVideos();
  }

  // Separate observers retain the original thresholds and notification behavior.
  bindProjectVideos({
    containerSelector: '#kc-tablet-projets',
    ticketSelector: '#kc-tablet-projets .ticket',
    playRatio: 0.4,
    thresholds: [0, 0.4, 0.7]
  });
  bindProjectVideos({
    containerSelector: '#kc-mobile-projets',
    ticketSelector: '#kc-mobile-projets .project',
    playRatio: 0.32,
    thresholds: [0, 0.32, 0.6]
  });
})();
