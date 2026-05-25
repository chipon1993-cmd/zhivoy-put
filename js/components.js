/**
 * Shared Components System — Живой путь
 * Builds and injects header/footer HTML for pages at any depth.
 * Includes orbital navigation (planets around compass).
 * Fires 'components-loaded' event when done so other scripts can react.
 */
(function () {
  'use strict';

  // ─── Detect subfolder depth ───────────────────────────────────────────────
  const path = window.location.pathname;
  const inSubfolder = path.includes('/pages/') || path.includes('/admin/');
  const root = inSubfolder ? '../' : '';

  // ─── Planets data ─────────────────────────────────────────────────────────
  const planets = [
    // Inner orbit (daily tools)
    { id: 'dashboard', icon: '🏠', label: 'Главная', href: root + 'pages/dashboard.html', orbit: 1, angle: 0 },
    { id: 'navigator', icon: '🧘', label: 'Практики', href: root + 'pages/navigator.html', orbit: 1, angle: 120 },
    { id: 'mirror', icon: '🪞', label: 'Зеркало', href: root + 'pages/mirror.html', orbit: 1, angle: 240 },
    // Outer orbit (deeper pages)
    { id: 'programs', icon: '🌀', label: 'Спирали', href: root + 'pages/programs.html', orbit: 2, angle: 0 },
    { id: 'stats', icon: '📊', label: 'Наблюдение', href: root + 'pages/stats.html', orbit: 2, angle: 90 },
    { id: 'triptych', icon: '✦', label: 'Путь', href: root + 'pages/triptych.html', orbit: 2, angle: 180 },
    { id: 'atlas', icon: '🗺️', label: 'Карта', href: root + 'pages/atlas.html', orbit: 2, angle: 270 }
  ];

  // ─── Build header HTML ────────────────────────────────────────────────────
  const headerHTML = `
    <header id="header">
      <a href="${root}index.html" class="brand">
        <div class="brand-mark" id="orbit-trigger">✦</div>
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

  // ─── Build orbital nav overlay ────────────────────────────────────────────
  const orbitalHTML = `
    <div class="orbit-overlay" id="orbit-overlay">
      <div class="orbit-system" id="orbit-system">
        <div class="orbit-ring orbit-ring-1"></div>
        <div class="orbit-ring orbit-ring-2"></div>
        <div class="orbit-sun" id="orbit-sun">✦</div>
        ${planets.map(function(p) {
          return '<a href="' + p.href + '" class="orbit-planet" data-orbit="' + p.orbit + '" data-angle="' + p.angle + '" data-id="' + p.id + '">' +
            '<span class="orbit-planet-icon">' + p.icon + '</span>' +
            '<span class="orbit-planet-label">' + p.label + '</span>' +
          '</a>';
        }).join('')}
      </div>
      <div class="orbit-hint">Нажми на планету</div>
    </div>`;

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

  // Inject orbital overlay into body
  var orbDiv = document.createElement('div');
  orbDiv.innerHTML = orbitalHTML;
  document.body.appendChild(orbDiv.firstElementChild);

  // ─── Highlight current page in nav ────────────────────────────────────────
  const currentPage = path.split('/').pop() || 'index.html';
  document.querySelectorAll('#mainNav a').forEach(function (a) {
    var href = a.getAttribute('href') || '';
    if (href.includes(currentPage) && !a.classList.contains('nav-cta') && !a.classList.contains('nav-dropdown-trigger')) {
      a.classList.add('active');
    }
  });
  document.querySelectorAll('.nav-dropdown-menu a.active').forEach(function(a) {
    var parent = a.closest('.nav-dropdown');
    if (parent) {
      var trigger = parent.querySelector('.nav-dropdown-trigger');
      if (trigger) trigger.classList.add('active');
    }
  });

  // ─── Orbital Navigation Logic ─────────────────────────────────────────────
  var overlay = document.getElementById('orbit-overlay');
  var trigger = document.getElementById('orbit-trigger');
  var orbitSystem = document.getElementById('orbit-system');
  var isOpen = false;
  var animFrame = null;
  var rotationAngle1 = 0;
  var rotationAngle2 = 0;

  function positionPlanets() {
    var vw = window.innerWidth;
    var vh = window.innerHeight;
    var centerX = vw / 2;
    var centerY = vh / 2;
    var radius1 = Math.min(vw, vh) * 0.22; // inner orbit
    var radius2 = Math.min(vw, vh) * 0.38; // outer orbit

    var planetEls = overlay.querySelectorAll('.orbit-planet');
    planetEls.forEach(function(el) {
      var orbit = parseInt(el.getAttribute('data-orbit'));
      var baseAngle = parseInt(el.getAttribute('data-angle'));
      var rotation = orbit === 1 ? rotationAngle1 : rotationAngle2;
      var angle = (baseAngle + rotation) * (Math.PI / 180);
      var radius = orbit === 1 ? radius1 : radius2;

      var x = centerX + radius * Math.cos(angle);
      var y = centerY + radius * Math.sin(angle);

      el.style.left = x + 'px';
      el.style.top = y + 'px';
    });
  }

  function animate() {
    if (!isOpen) return;
    rotationAngle1 += 0.15; // inner orbit speed
    rotationAngle2 -= 0.08; // outer orbit counter-rotation
    positionPlanets();
    animFrame = requestAnimationFrame(animate);
  }

  function openOrbit(e) {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    isOpen = true;
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    positionPlanets();
    animate();
  }

  function closeOrbit() {
    isOpen = false;
    overlay.classList.remove('active');
    document.body.style.overflow = '';
    if (animFrame) cancelAnimationFrame(animFrame);
  }

  if (trigger) {
    trigger.addEventListener('click', function(e) {
      openOrbit(e);
    });
    // Prevent brand link from navigating when clicking the mark
    var brandLink = trigger.closest('.brand');
    if (brandLink) {
      brandLink.addEventListener('click', function(e) {
        if (e.target === trigger || trigger.contains(e.target)) {
          e.preventDefault();
        }
      });
    }
  }

  // Close on overlay background click (not on planets)
  if (overlay) {
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay || e.target.classList.contains('orbit-hint')) {
        closeOrbit();
      }
    });
  }

  // Close on Escape
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && isOpen) {
      closeOrbit();
    }
  });

  // Sun closes orbit
  var sun = document.getElementById('orbit-sun');
  if (sun) {
    sun.addEventListener('click', function() {
      closeOrbit();
    });
  }

  // Reposition on resize
  window.addEventListener('resize', function() {
    if (isOpen) positionPlanets();
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
