/* ============================================================
   AdminRouter — Hash-based Panel Router
   Manages panel registration, sidebar building, navigation.
   Depends on: AdminStore, AdminUI (already on window)
   ============================================================ */
;(function () {
  'use strict';

  const SECTION_LABELS = {
    content: 'Контент',
    management: 'Управление',
    site: 'Сайт'
  };

  const panels = new Map();        // route → config
  const rendered = new Set();      // routes that have been rendered

  const AdminRouter = {

    /* ----------------------------------------------------------
       register(route, config)
       Called by each panel file to self-register.
       config: { title, icon, section, render(container) }
    ---------------------------------------------------------- */
    register(route, config) {
      panels.set(route, config);
    },

    /* ----------------------------------------------------------
       init()
       Called once after all panels have registered.
    ---------------------------------------------------------- */
    init() {
      this._buildSidebar();
      this._wireTopbar();
      this._wireMobileToggle();
      this._wireKeyboard();

      window.addEventListener('hashchange', () => {
        const route = window.location.hash.replace('#', '') || this._defaultRoute();
        this.navigate(route);
      });

      const initial = window.location.hash.replace('#', '') || this._defaultRoute();
      this.navigate(initial);
    },

    /* ----------------------------------------------------------
       navigate(route)
    ---------------------------------------------------------- */
    navigate(route) {
      const config = panels.get(route);
      if (!config) return;

      // Hide all panels
      document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));

      // Show / create target panel
      let container = document.getElementById('panel-' + route);
      if (!container) {
        container = document.createElement('div');
        container.id = 'panel-' + route;
        container.className = 'panel';
        const main = document.getElementById('panels-container') || document.querySelector('.content') || document.querySelector('main');
        if (main) main.appendChild(container);
      }
      container.classList.add('active');

      // Lazy render
      if (!rendered.has(route)) {
        config.render(container);
        rendered.add(route);
      }

      // Update topbar title
      const topTitle = document.getElementById('topbarTitle');
      if (topTitle) topTitle.textContent = config.title;

      // Update sidebar active
      document.querySelectorAll('.sidebar-nav button').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.route === route);
      });

      // Update hash (silent if already correct)
      if (window.location.hash !== '#' + route) {
        window.location.hash = route;
      }

      // Close mobile sidebar
      const sidebar = document.querySelector('.sidebar');
      if (sidebar) sidebar.classList.remove('open');
    },

    /* ----------------------------------------------------------
       refresh(route)
       Force re-render a panel.
    ---------------------------------------------------------- */
    refresh(route) {
      const config = panels.get(route);
      if (!config) return;
      const container = document.getElementById('panel-' + route);
      if (container) {
        container.innerHTML = '';
        config.render(container);
        rendered.add(route);
      }
    },

    /* ------ Private helpers ------ */

    _defaultRoute() {
      const first = panels.keys().next();
      return first.value || '';
    },

    _buildSidebar() {
      const sidebar = document.querySelector('.sidebar');
      if (!sidebar) return;

      // Group panels by section preserving insertion order
      const sections = new Map();
      panels.forEach((config, route) => {
        const sec = config.section || 'content';
        if (!sections.has(sec)) sections.set(sec, []);
        sections.get(sec).push({ route, config });
      });

      // Build DOM
      const fragment = document.createDocumentFragment();

      sections.forEach((items, sectionKey) => {
        const label = document.createElement('div');
        label.className = 'sidebar-section';
        label.textContent = SECTION_LABELS[sectionKey] || sectionKey;
        fragment.appendChild(label);

        const nav = document.createElement('nav');
        nav.className = 'sidebar-nav';

        items.forEach(({ route, config }) => {
          const btn = document.createElement('button');
          btn.className = 'sidebar-btn';
          btn.dataset.route = route;
          btn.innerHTML = '<span class="sidebar-btn-icon">' + config.icon + '</span><span class="sidebar-btn-label">' + config.title + '</span>';
          btn.addEventListener('click', () => {
            window.location.hash = route;
          });
          nav.appendChild(btn);
        });

        fragment.appendChild(nav);
      });

      const navContainer = document.getElementById('sidebar-nav-container');
      if (navContainer) {
        navContainer.appendChild(fragment);
      } else {
        const footer = sidebar.querySelector('.sidebar-footer');
        if (footer) sidebar.insertBefore(fragment, footer);
        else sidebar.appendChild(fragment);
      }
    },

    _wireTopbar() {
      const saveBtn = document.getElementById('btn-save');
      if (saveBtn) {
        saveBtn.addEventListener('click', () => {
          AdminStore.save();
          AdminUI.toast('✓ Все изменения сохранены');
        });
      }

      const resetBtn = document.getElementById('btn-reset');
      if (resetBtn) {
        resetBtn.addEventListener('click', () => {
          AdminUI.confirm('Сбросить все изменения?').then(yes => {
            if (yes) {
              AdminStore.reset();
              location.reload();
            }
          });
        });
      }
    },

    _wireMobileToggle() {
      const toggle = document.querySelector('.sidebar-toggle');
      const sidebar = document.querySelector('.sidebar');
      if (toggle && sidebar) {
        toggle.addEventListener('click', () => {
          sidebar.classList.toggle('open');
        });
      }
    },

    _wireKeyboard() {
      document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
          e.preventDefault();
          AdminStore.save();
          AdminUI.toast('✓ Все изменения сохранены');
        }
      });
    }
  };

  window.AdminRouter = AdminRouter;
})();
