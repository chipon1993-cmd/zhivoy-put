/* ═══ CMS Loader — reads Supabase/localStorage data, applies to current page ═══ */

(function() {
  function applyContent(c, source) {

      const setText = (sel, val) => { const el = document.querySelector(sel); if (el && val !== undefined) el.textContent = val; };

      const currentPage = window.location.pathname.split('/').pop() || 'index.html';

      /* ═══ STYLE OVERRIDES (apply on every page) ═══ */
      const root = document.documentElement;
      if (c['style-bg']) root.style.setProperty('--bg', c['style-bg']);
      if (c['style-gold']) root.style.setProperty('--gold', c['style-gold']);
      if (c['style-text']) root.style.setProperty('--text', c['style-text']);
      if (c['style-muted']) root.style.setProperty('--muted', c['style-muted']);
      if (c['style-blue']) root.style.setProperty('--blue', c['style-blue']);
      if (c['style-green']) root.style.setProperty('--green', c['style-green']);
      if (c['style-radius']) root.style.setProperty('--radius', c['style-radius'] + 'px');
      if (c['style-stars'] === 'off') { const cv = document.getElementById('starfield'); if (cv) cv.style.display = 'none'; }
      if (c['style-aurora'] === 'off') document.querySelectorAll('.aurora').forEach(el => el.style.display = 'none');
      if (c['style-grid'] === 'off') document.querySelectorAll('.grid-overlay').forEach(el => el.style.display = 'none');
      if (c['style-noise'] === 'off') document.querySelectorAll('.noise').forEach(el => el.style.display = 'none');
      if (c['style-amber']) root.style.setProperty('--amber', c['style-amber']);
      if (c['style-violet']) root.style.setProperty('--violet', c['style-violet']);
      if (c['style-cyan']) root.style.setProperty('--cyan', c['style-cyan']);

      /* ═══ TYPOGRAPHY OVERRIDES ═══ */
      // Font families
      if (c['style-font-heading']) {
        root.style.setProperty('--font-heading', "'" + c['style-font-heading'] + "', Georgia, serif");
        // Dynamically load the Google Font
        const fontName = c['style-font-heading'].replace(/ /g, '+');
        if (!document.querySelector('link[href*="' + fontName + '"]')) {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = 'https://fonts.googleapis.com/css2?family=' + fontName + ':wght@400;500;600;700;800;900&display=swap';
          document.head.appendChild(link);
        }
      }
      if (c['style-font-body']) {
        root.style.setProperty('--font-body', "'" + c['style-font-body'] + "', system-ui, sans-serif");
        const fontName = c['style-font-body'].replace(/ /g, '+');
        if (!document.querySelector('link[href*="' + fontName + '"]')) {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = 'https://fonts.googleapis.com/css2?family=' + fontName + ':wght@300;400;500;600;700&display=swap';
          document.head.appendChild(link);
        }
      }

      // Font sizes
      if (c['style-h1-size']) {
        document.querySelectorAll('h1').forEach(el => el.style.fontSize = c['style-h1-size'] + 'px');
      }
      if (c['style-h2-size']) {
        document.querySelectorAll('.section-head h2, h2').forEach(el => el.style.fontSize = c['style-h2-size'] + 'px');
      }
      if (c['style-body-size']) {
        root.style.setProperty('font-size', c['style-body-size'] + 'px');
      }

      // Font weights
      if (c['style-font-weight-heading']) {
        document.querySelectorAll('h1, h2, h3').forEach(el => el.style.fontWeight = c['style-font-weight-heading']);
      }
      if (c['style-font-weight-body']) {
        document.body.style.fontWeight = c['style-font-weight-body'];
      }

      // Line height and letter spacing
      if (c['style-line-height']) {
        document.body.style.lineHeight = c['style-line-height'];
      }
      if (c['style-letter-spacing']) {
        document.body.style.letterSpacing = c['style-letter-spacing'] + 'em';
      }

      // Content width
      if (c['style-max-width']) {
        document.querySelectorAll('.page').forEach(el => el.style.maxWidth = c['style-max-width'] + 'px');
      }

      /* ═══ MENU OVERRIDES (apply on every page) ═══ */
      const menuData = localStorage.getItem('cms_menu');
      if (menuData) { try {
        const items = JSON.parse(menuData);
        const nav = document.getElementById('mainNav');
        if (nav && items.length) {
          const ctaLink = nav.querySelector('.nav-cta');
          const authSlot = document.getElementById('auth-nav-slot');
          nav.innerHTML = '';

          const path = window.location.pathname;
          const inSubfolder = path.includes('/pages/') || path.includes('/admin/');
          const rootPrefix = inSubfolder ? '../' : '';

          items.forEach(m => {
            const a = document.createElement('a');
            let href = m.href;
            if (href.startsWith('#')) href = rootPrefix + 'pages/' + href.slice(1) + '.html';
            else if (!href.startsWith('http') && !href.startsWith('/')) href = rootPrefix + href;
            a.href = href;
            a.textContent = m.name;
            nav.appendChild(a);
          });

          if (authSlot) nav.appendChild(authSlot);
          if (ctaLink) {
            if (c['menu-cta-text']) ctaLink.textContent = c['menu-cta-text'];
            if (c['menu-cta-href']) ctaLink.href = c['menu-cta-href'];
            nav.appendChild(ctaLink);
          }
        }
      } catch(e) { console.warn('CMS menu parse error:', e); } }

      /* ═══ FOOTER OVERRIDES (apply on every page) ═══ */
      if (c['footer-text']) setText('footer p', c['footer-text']);
      if (c['footer-note']) setText('.footer-note', c['footer-note']);

      /* ═══ PAGE-SPECIFIC CONTENT ═══ */

      if (currentPage === 'index.html' || currentPage === '') {
        // Landing page
        if (c['hero-title-1']) setText('.landing-title', c['hero-title-1']);
        if (c['hero-desc']) setText('.landing-tagline', c['hero-desc']);
      }

      if (currentPage === 'triptych.html') {
        // Path page — journey phases (rebuilt structure)
        const journeyNodes = document.querySelectorAll('.journey-node');
        [1,2,3].forEach((n, i) => {
          if (!journeyNodes[i]) return;
          const content = journeyNodes[i].querySelector('.journey-node-content');
          if (!content) return;
          if (c['trip-'+n+'-title']) { const h3 = content.querySelector('h3'); if (h3) h3.textContent = c['trip-'+n+'-title']; }
          if (c['trip-'+n+'-desc']) { const p = content.querySelector('p'); if (p) p.textContent = c['trip-'+n+'-desc']; }
          if (c['trip-'+n+'-tags']) {
            const tagsEl = content.querySelector('.journey-tags');
            if (tagsEl) tagsEl.innerHTML = c['trip-'+n+'-tags'].split(',').map(t => '<span>' + t.trim() + '</span>').join('');
          }
        });
      }

      if (currentPage === 'atlas.html') {
        if (c['atlas-title']) setText('.section-head h2', c['atlas-title']);
        if (c['atlas-desc']) setText('.section-head p', c['atlas-desc']);

        const terrData = localStorage.getItem('cms_territories');
        if (terrData) { try {
          const terrs = JSON.parse(terrData);
          const atlas = document.querySelector('.atlas');
          if (atlas && terrs.length) {
            atlas.querySelectorAll('.territory').forEach(t => t.remove());
            const posClasses = ['t-center','t-work','t-body','t-voice','t-growth','t-expression','t-connection'];
            terrs.forEach((t, i) => {
              const div = document.createElement('div');
              div.className = 'territory ' + (posClasses[i] || '');
              div.innerHTML = '<div class="t-icon">' + t.icon + '</div><strong>' + t.name + '</strong><p>' + t.desc + '</p>';
              atlas.appendChild(div);
            });
          }
        } catch(e) { console.warn('CMS territories parse error:', e); } }
      }

      if (currentPage === 'triggers.html') {
        if (c['trig-title']) setText('.section-head h2', c['trig-title']);
        if (c['trig-desc']) setText('.section-head p', c['trig-desc']);

        const trigData = localStorage.getItem('cms_triggers');
        if (trigData) { try {
          const trigs = JSON.parse(trigData);
          const container = document.querySelector('.cards-3');
          if (container && trigs.length) {
            container.innerHTML = '';
            trigs.forEach(t => {
              const article = document.createElement('article');
              article.className = 'glass info-card reveal visible';
              article.innerHTML = '<div class="card-icon">' + t.icon + '</div><h3>' + t.title + '</h3><ul>' + t.items.map(item => '<li>' + item + '</li>').join('') + '</ul>';
              container.appendChild(article);
            });
          }
        } catch(e) { console.warn('CMS triggers parse error:', e); } }
      }

      if (currentPage === 'navigator.html') {
        if (c['nav-title']) setText('.practices-header h2', c['nav-title']);
        if (c['nav-desc']) setText('.practices-header p', c['nav-desc']);
        if (c['nav-placeholder']) { const ta = document.getElementById('stateInput'); if (ta) ta.placeholder = c['nav-placeholder']; }

        const prinData = localStorage.getItem('cms_principles');
        if (prinData) { try {
          const prins = JSON.parse(prinData);
          const list = document.querySelector('.principles-list');
          if (list && prins.length) {
            list.innerHTML = '';
            prins.forEach(p => {
              const div = document.createElement('div');
              div.className = 'principle';
              div.innerHTML = '<strong>' + p.title + '</strong><span>' + p.desc + '</span>';
              list.appendChild(div);
            });
          }
        } catch(e) { console.warn('CMS principles parse error:', e); } }
      }

      if (currentPage === 'roadmap.html') {
        if (c['road-title']) setText('.section-head h2', c['road-title']);
        if (c['road-desc']) setText('.section-head p', c['road-desc']);

        const roadData = localStorage.getItem('cms_roadmap');
        if (roadData) { try {
          const steps = JSON.parse(roadData);
          const timeline = document.querySelector('.timeline');
          if (timeline && steps.length) {
            timeline.innerHTML = '';
            steps.forEach((s, i) => {
              const div = document.createElement('div');
              div.className = 'step reveal visible';
              div.innerHTML = '<div class="step-num">' + String(i+1).padStart(2,'0') + '</div><h3>' + s.title + '</h3><p>' + s.desc + '</p>';
              timeline.appendChild(div);
            });
          }
        } catch(e) { console.warn('CMS roadmap parse error:', e); } }

        if (c['cta-line1'] || c['cta-line2']) {
          const ctaH = document.querySelector('.cta-section h2');
          if (ctaH) ctaH.innerHTML = (c['cta-line1'] || 'Это не контроль над собой.') + '<br>Это <span class="accent">' + (c['cta-line2'] || 'возвращение к себе') + '</span>.';
        }
        if (c['cta-desc']) setText('.cta-section p', c['cta-desc']);
      }

    } catch(e) { console.warn('CMS load error:', e); }
  }

  function loadLocal() {
    try {
      var raw = localStorage.getItem('cms_content');
      return raw ? JSON.parse(raw) : {};
    } catch(e) { console.warn('CMS loadLocal parse error:', e); return {}; }
  }

  /** Load published CMS data from /data/cms-data.json */
  function loadPublished() {
    var base = window.location.pathname.includes('/pages/') ? '../' : '';
    return fetch(base + 'data/cms-data.json?_t=' + Date.now())
      .then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; });
  }

  /** Apply list data (menu, territories, etc.) from published JSON */
  function applyListData(data) {
    if (!data) return;
    ['cms_menu', 'cms_territories', 'cms_triggers', 'cms_principles', 'cms_roadmap'].forEach(function (key) {
      var section = key.replace('cms_', '');
      if (data[section] && data[section].length) {
        localStorage.setItem(key, JSON.stringify(data[section]));
      }
    });
  }

  function applyOnReady() {
    // 1. Apply local data first (instant)
    var localContent = loadLocal();
    applyContent(localContent, 'local');

    // 2. Try published JSON file (authoritative for all visitors)
    loadPublished().then(function (published) {
      if (published && published.content && Object.keys(published.content).length > 0) {
        // Cache in localStorage
        localStorage.setItem('cms_content', JSON.stringify(published.content));
        applyContent(published.content, 'published');
        applyListData(published);
      }
    });

    // 3. Also check Supabase for real-time updates
    if (window.SupabaseClient && window.SupabaseClient.isConnected()) {
      window.SupabaseClient.get('cms_content').then(function (cloudContent) {
        if (cloudContent && Object.keys(cloudContent).length > 0) {
          localStorage.setItem('cms_content', JSON.stringify(cloudContent));
          applyContent(cloudContent, 'cloud');
        }
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('components-loaded', applyOnReady);
  } else {
    applyOnReady();
  }
})();
