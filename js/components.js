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
        <div class="nav-dropdown">
          <a href="${root}pages/triptych.html" class="nav-dropdown-trigger">О проекте <span class="nav-arrow">▾</span></a>
          <div class="nav-dropdown-menu">
            <a href="${root}pages/triptych.html"><span class="nav-item-icon">✦</span> Путь</a>
            <a href="${root}pages/atlas.html"><span class="nav-item-icon">🗺️</span> Карта жизни</a>
            <a href="${root}pages/contact.html"><span class="nav-item-icon">💬</span> Связаться</a>
          </div>
        </div>
        <div class="nav-dropdown">
          <a href="${root}pages/dashboard.html" class="nav-dropdown-trigger">Практика <span class="nav-arrow">▾</span></a>
          <div class="nav-dropdown-menu nav-dropdown-wide">
            <a href="${root}pages/dashboard.html"><span class="nav-item-icon">🏠</span> Главная</a>
            <a href="${root}pages/navigator.html"><span class="nav-item-icon">🧘</span> Практики</a>
            <a href="${root}pages/mirror.html"><span class="nav-item-icon">🪞</span> Зеркало</a>
            <a href="${root}pages/programs.html"><span class="nav-item-icon">🌀</span> Спирали</a>
            <a href="${root}pages/stats.html"><span class="nav-item-icon">📊</span> Наблюдение</a>
          </div>
        </div>
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
    if (href.includes(currentPage) && !a.classList.contains('nav-cta') && !a.classList.contains('nav-dropdown-trigger')) {
      a.classList.add('active');
    }
  });
  // Also highlight parent dropdown trigger if child is active
  document.querySelectorAll('.nav-dropdown-menu a.active').forEach(function(a) {
    var parent = a.closest('.nav-dropdown');
    if (parent) {
      var trigger = parent.querySelector('.nav-dropdown-trigger');
      if (trigger) trigger.classList.add('active');
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
