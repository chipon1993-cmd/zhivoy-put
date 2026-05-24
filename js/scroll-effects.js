/**
 * scroll-effects.js — Scroll-driven UI effects
 * Includes: scroll reveal, header scroll state, nav active tracking, chip interaction.
 */

/* ═══════════ SCROLL REVEAL ═══════════ */
(function() {
  const els = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale');
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  els.forEach(el => obs.observe(el));
})();

/* ═══════════ HEADER SCROLL STATE ═══════════ */
(function() {
  const header = document.getElementById('header');
  let ticking = false;

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        header.classList.toggle('scrolled', window.scrollY > 60);
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
})();

/* ═══════════ NAV ACTIVE STATE ═══════════ */
(function() {
  const links = document.querySelectorAll('#mainNav a[data-section]');
  const sections = [];

  links.forEach(link => {
    const id = link.getAttribute('data-section');
    const sec = document.getElementById(id);
    if (sec) sections.push({ el: sec, link: link });
  });

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      const item = sections.find(s => s.el === e.target);
      if (item) {
        if (e.isIntersecting) item.link.classList.add('active');
        else item.link.classList.remove('active');
      }
    });
  }, { threshold: 0.25 });

  sections.forEach(s => obs.observe(s.el));
})();

/* ═══════════ CHIP INTERACTION ═══════════ */
document.querySelectorAll('.chips').forEach(group => {
  group.addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    group.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
  });
});
