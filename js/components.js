/**
 * Shared Components System — Живой путь
 * Builds and injects header/footer HTML for pages at any depth.
 * Fires 'components-loaded' event when done so other scripts can react.
 */
(function () {
  'use strict';

  // ─── Detect subfolder depth ───────────────────────────────────────────────
  const path = window.location.pathname;
  const inSubfolder = path.includes('/pages/') || path.includes('/admin/');
  const root = inSubfolder ? '../' : '';

  // ─── Build header HTML ────────────────────────────────────────────────────
  const headerHTML = `
    <header id="header">
      <a href="${root}index.html" class="brand">
        <div class="brand-mark">✦</div>
        Живой путь
      </a>
      <nav id="mainNav">
        <a href="${root}pages/triptych.html">Путь</a>
        <a href="${root}pages/atlas.html">Карта</a>
        <a href="${root}pages/triggers.html">Триггеры</a>
        <a href="${root}pages/navigator.html">Навигатор</a>
        <a href="${root}pages/roadmap.html">Система</a>
        <a href="${root}pages/contact.html">Связаться</a>
        <span id="auth-nav-slot"></span>
        <a href="${root}pages/dashboard.html" class="nav-cta">Начать</a>
      </nav>
    </header>`;

  // ─── Build footer HTML ────────────────────────────────────────────────────
  const footerHTML = `
    <footer>
      <div class="footer-brand">
        <div class="brand-mark">✦</div>
        Живой путь
      </div>
      <p>Персональный атлас жизни. Не продуктивность ради галочек — движение через состояние, смысл и внутренний отклик.</p>
      <div class="footer-note">✦ 2024 — настоящее</div>
    </footer>`;

  // ─── Inject into placeholders ─────────────────────────────────────────────
  const headerEl = document.getElementById('site-header');
  const footerEl = document.getElementById('site-footer');

  if (headerEl) headerEl.innerHTML = headerHTML;
  if (footerEl) footerEl.innerHTML = footerHTML;

  // ─── Highlight current page in nav ────────────────────────────────────────
  const currentPage = path.split('/').pop() || 'index.html';
  document.querySelectorAll('#mainNav a').forEach(function (a) {
    var href = a.getAttribute('href') || '';
    if (href.includes(currentPage) && !a.classList.contains('nav-cta')) {
      a.classList.add('active');
    }
  });

  // ─── Header scroll effect ─────────────────────────────────────────────────
  var header = document.getElementById('header');
  if (header) {
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (!ticking) {
        requestAnimationFrame(function () {
          header.classList.toggle('scrolled', window.scrollY > 60);
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  // ─── Fire event so auth.js and other scripts know components are ready ────
  document.dispatchEvent(new CustomEvent('components-loaded'));
})();
