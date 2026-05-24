/**
 * counters.js — Animated stat counters and meter fills
 * Triggered by IntersectionObserver when elements scroll into view.
 */

/* ═══════════ STAT COUNTER ═══════════ */
(function() {
  const nums = document.querySelectorAll('.stat-num[data-count]');
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const el = e.target;
        const target = parseInt(el.dataset.count);
        let current = 0;
        const step = () => {
          current++;
          el.textContent = current;
          if (current < target) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
        obs.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  nums.forEach(n => obs.observe(n));
})();

/* ═══════════ METER ANIMATION ═══════════ */
(function() {
  const fills = document.querySelectorAll('.meter-fill[data-target]');
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.style.width = e.target.dataset.target + '%';
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.5 });

  fills.forEach(f => obs.observe(f));
})();
