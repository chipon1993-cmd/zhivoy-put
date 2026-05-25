/* ============================================================
   VisualEditor — Live Split-Screen Preview + Inline Editing

   Creates a WordPress Customizer-style experience:
   • Left side: admin panels with editing controls
   • Right side: live iframe preview of the actual page
   • Optional inline editing directly on the previewed page

   Depends on: AdminStore, AdminRouter, AdminUI
   ============================================================ */
(function () {
  'use strict';

  /* ─── Panel → Page URL Mapping ────────────────────────────────────── */

  var PANEL_PAGES = {
    hero:       '../index.html',
    triptych:   '../pages/triptych.html',
    atlas:      '../pages/atlas.html',
    triggers:   '../pages/triggers.html',
    navigator:  '../pages/navigator.html',
    roadmap:    '../pages/roadmap.html',
    typography: '../index.html',
    theme:      '../index.html',
    menu:       '../index.html',
    pages:      '../index.html'
  };

  /* ─── CMS Element Mapping (selector → store key) per page ────────── */
  /* Matches the selectors used in cms-loader.js so inline edits sync   */

  var CMS_MAP = {
    'atlas.html': [
      { key: 'atlas-title', sel: '.section-head h2', label: 'Заголовок' },
      { key: 'atlas-desc',  sel: '.section-head p',  label: 'Описание' }
    ],
    'triggers.html': [
      { key: 'trig-title', sel: '.section-head h2', label: 'Заголовок' },
      { key: 'trig-desc',  sel: '.section-head p',  label: 'Описание' }
    ],
    'navigator.html': [
      { key: 'nav-title',       sel: '.section-head h2', label: 'Заголовок' },
      { key: 'nav-desc',        sel: '.section-head p',  label: 'Описание' },
      { key: 'nav-input-title', sel: '.agent-panel h3',  label: 'Заголовок панели' }
    ],
    'roadmap.html': [
      { key: 'road-title', sel: '.section-head h2', label: 'Заголовок' },
      { key: 'road-desc',  sel: '.section-head p',  label: 'Описание' },
      { key: 'cta-desc',   sel: '.cta-section p',   label: 'CTA описание' }
    ]
  };

  /* Common elements present on every page */
  var COMMON_ELEMENTS = [
    { key: 'footer-text', sel: 'footer p',     label: 'Текст футера' },
    { key: 'footer-note', sel: '.footer-note',  label: 'Заметка' }
  ];

  /* ─── State ──────────────────────────────────────────────────────── */

  var isActive   = false;
  var editMode   = false;
  var iframe     = null;
  var currentRoute = null;
  var debounceTimer = null;

  /* DOM refs */
  var previewArea = null;
  var frameWrap   = null;
  var pageLabel   = null;
  var editBtn     = null;

  /* ─── Initialize ─────────────────────────────────────────────────── */

  function init() {
    buildPreviewArea();
    addToggleButton();
    wireStoreSync();

    /* Restore previous state */
    if (localStorage.getItem('visual-editor-active') === 'true') {
      activate();
    }
  }

  /* ─── Build Preview DOM ──────────────────────────────────────────── */

  function buildPreviewArea() {
    var content = document.querySelector('.content');
    if (!content) return;

    /* Create the visual-preview container */
    previewArea = document.createElement('div');
    previewArea.className = 'visual-preview';
    previewArea.id = 'visual-preview';

    /* --- Toolbar --- */
    var tb = document.createElement('div');
    tb.className = 'visual-toolbar';

    /* Device buttons */
    var devices = [
      { emoji: '🖥',  w: '100%',  title: 'Десктоп' },
      { emoji: '📱', w: '768px', title: 'Планшет' },
      { emoji: '📲', w: '375px', title: 'Телефон' }
    ];

    var devWrap = document.createElement('div');
    devWrap.className = 'device-btns';
    devices.forEach(function (d, i) {
      var btn = document.createElement('button');
      btn.className = 'vt-btn' + (i === 0 ? ' active' : '');
      btn.textContent = d.emoji;
      btn.title = d.title;
      btn.addEventListener('click', function () {
        devWrap.querySelectorAll('.vt-btn').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        if (iframe) iframe.style.maxWidth = d.w;
      });
      devWrap.appendChild(btn);
    });
    tb.appendChild(devWrap);

    /* Refresh */
    var refreshBtn = document.createElement('button');
    refreshBtn.className = 'vt-btn';
    refreshBtn.textContent = '↻';
    refreshBtn.title = 'Обновить превью';
    refreshBtn.addEventListener('click', reloadIframe);
    tb.appendChild(refreshBtn);

    /* Edit mode toggle */
    editBtn = document.createElement('button');
    editBtn.className = 'vt-btn';
    editBtn.textContent = '✏️ Редактирование';
    editBtn.title = 'Редактировать текст прямо на странице';
    editBtn.addEventListener('click', function () {
      editMode = !editMode;
      editBtn.classList.toggle('active', editMode);
      applyEditMode();
    });
    tb.appendChild(editBtn);

    /* Page label */
    pageLabel = document.createElement('span');
    pageLabel.className = 'page-info';
    tb.appendChild(pageLabel);

    previewArea.appendChild(tb);

    /* --- Iframe --- */
    frameWrap = document.createElement('div');
    frameWrap.className = 'visual-frame-wrap';

    iframe = document.createElement('iframe');
    iframe.id = 'visual-iframe';
    iframe.title = 'Визуальный предпросмотр';

    frameWrap.appendChild(iframe);
    previewArea.appendChild(frameWrap);

    /* Append to content area (after #panels-container) */
    content.appendChild(previewArea);
  }

  /* ─── Toggle Button in Topbar ────────────────────────────────────── */

  function addToggleButton() {
    var topActions = document.querySelector('.topbar-actions');
    if (!topActions) return;

    var btn = document.createElement('button');
    btn.className = 'visual-toggle';
    btn.id = 'visual-toggle';
    btn.innerHTML = '<span class="visual-toggle-dot"></span> Превью';
    btn.title = 'Показать/скрыть предпросмотр страницы';
    btn.addEventListener('click', function () {
      if (isActive) deactivate(); else activate();
    });

    topActions.insertBefore(btn, topActions.firstChild);
  }

  /* ─── Activate / Deactivate ──────────────────────────────────────── */

  function activate() {
    isActive = true;
    document.body.classList.add('visual-mode');
    var tb = document.getElementById('visual-toggle');
    if (tb) tb.classList.add('active');
    localStorage.setItem('visual-editor-active', 'true');

    if (currentRoute) navigateIframe(currentRoute);
  }

  function deactivate() {
    isActive = false;
    editMode = false;
    document.body.classList.remove('visual-mode');
    var tb = document.getElementById('visual-toggle');
    if (tb) tb.classList.remove('active');
    if (editBtn) editBtn.classList.remove('active');
    localStorage.setItem('visual-editor-active', 'false');
  }

  /* ─── Iframe Navigation ───────────────────────────────────────────── */

  function navigateIframe(route) {
    currentRoute = route;
    if (!isActive || !iframe) return;

    var pageUrl = PANEL_PAGES[route];
    if (!pageUrl) {
      if (pageLabel) pageLabel.textContent = '—';
      return;
    }

    /* Cache-bust */
    var sep = pageUrl.indexOf('?') === -1 ? '?' : '&';
    iframe.src = pageUrl + sep + '_t=' + Date.now();

    /* Update label */
    if (pageLabel) {
      var name = pageUrl.split('/').pop().split('?')[0];
      pageLabel.textContent = name;
    }

    /* After load → inject bridge */
    iframe.onload = function () {
      setTimeout(function () {
        injectBridgeCSS();
        markEditableElements();
        if (editMode) applyEditMode();
      }, 350);
    };
  }

  function reloadIframe() {
    if (currentRoute) navigateIframe(currentRoute);
  }

  /* ─── Bridge: Inject CSS into iframe ─────────────────────────────── */

  function getIframeDoc() {
    try { return iframe && iframe.contentDocument; }
    catch (e) { return null; }
  }

  function injectBridgeCSS() {
    var doc = getIframeDoc();
    if (!doc) return;
    if (doc.getElementById('ve-bridge-css')) return;

    var style = doc.createElement('style');
    style.id = 've-bridge-css';
    style.textContent = [
      /* Editable element outline */
      '[data-ve] {',
      '  position: relative;',
      '  outline: 2px dashed transparent;',
      '  outline-offset: 4px;',
      '  transition: outline-color .2s, box-shadow .2s;',
      '  border-radius: 4px;',
      '}',
      '[data-ve]:hover {',
      '  outline-color: rgba(242,201,109,0.45);',
      '}',
      '[data-ve][contenteditable="true"] {',
      '  cursor: text;',
      '}',
      '[data-ve][contenteditable="true"]:focus {',
      '  outline-color: #f2c96d;',
      '  outline-style: solid;',
      '  box-shadow: 0 0 0 4px rgba(242,201,109,0.1);',
      '}',

      /* Floating label on hover */
      '[data-ve]::after {',
      '  content: attr(data-ve-label);',
      '  position: absolute;',
      '  top: -22px; left: 0;',
      '  font: 700 9px/1 Inter, system-ui, sans-serif;',
      '  color: #f2c96d;',
      '  background: rgba(10,12,18,0.92);',
      '  padding: 3px 8px;',
      '  border-radius: 4px;',
      '  white-space: nowrap;',
      '  letter-spacing: .06em;',
      '  text-transform: uppercase;',
      '  pointer-events: none;',
      '  opacity: 0;',
      '  transition: opacity .2s;',
      '  z-index: 99999;',
      '}',
      '[data-ve]:hover::after,',
      '[data-ve]:focus::after {',
      '  opacity: 1;',
      '}',

      /* Toast */
      '.ve-toast {',
      '  position: fixed;',
      '  bottom: 20px;',
      '  left: 50%;',
      '  transform: translateX(-50%);',
      '  background: rgba(10,12,18,0.95);',
      '  color: #f2c96d;',
      '  padding: 10px 20px;',
      '  border-radius: 10px;',
      '  font: 600 12px Inter, sans-serif;',
      '  z-index: 100000;',
      '  pointer-events: none;',
      '  border: 1px solid rgba(242,201,109,0.25);',
      '  box-shadow: 0 10px 40px rgba(0,0,0,0.5);',
      '  animation: ve-fade 3s ease forwards;',
      '}',
      '@keyframes ve-fade {',
      '  0%,70% { opacity:1; }',
      '  100% { opacity:0; }',
      '}'
    ].join('\n');

    doc.head.appendChild(style);
  }

  /* ─── Bridge: Mark editable elements ─────────────────────────────── */

  function markEditableElements() {
    var doc = getIframeDoc();
    if (!doc) return;

    var pageName = (doc.location.pathname.split('/').pop() || 'index.html').split('?')[0];
    var entries = (CMS_MAP[pageName] || []).concat(COMMON_ELEMENTS);

    var count = 0;
    entries.forEach(function (entry) {
      var el = doc.querySelector(entry.sel);
      if (!el) return;
      el.setAttribute('data-ve', entry.key);
      el.setAttribute('data-ve-label', entry.label);
      count++;
    });

    /* Show toast */
    if (count > 0) {
      showIframeToast(doc, '✏️ ' + count + ' редактируемых элементов');
    }
  }

  function showIframeToast(doc, msg) {
    var toast = doc.createElement('div');
    toast.className = 've-toast';
    toast.textContent = msg;
    doc.body.appendChild(toast);
    setTimeout(function () {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 3200);
  }

  /* ─── Bridge: Toggle inline editing ──────────────────────────────── */

  function applyEditMode() {
    var doc = getIframeDoc();
    if (!doc) return;

    var els = doc.querySelectorAll('[data-ve]');
    els.forEach(function (el) {
      if (editMode) {
        el.contentEditable = 'true';
        el.addEventListener('input', onInlineInput);
        el.addEventListener('blur', onInlineBlur);
      } else {
        el.contentEditable = 'inherit';
        el.removeEventListener('input', onInlineInput);
        el.removeEventListener('blur', onInlineBlur);
      }
    });
  }

  function onInlineInput(e) {
    var key = e.target.getAttribute('data-ve');
    if (!key) return;

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(function () {
      AdminStore.set(key, e.target.textContent.trim());

      /* Update the corresponding field in the admin panel */
      syncFieldToPanel(key, e.target.textContent.trim());
    }, 400);
  }

  function onInlineBlur(e) {
    var key = e.target.getAttribute('data-ve');
    if (!key) return;
    var val = e.target.textContent.trim();
    AdminStore.set(key, val);
    syncFieldToPanel(key, val);
  }

  /** Try to update the admin panel's input field for this key */
  function syncFieldToPanel(key, value) {
    /* AdminUI.field() sets id on the wrapper; the input/textarea is inside */
    var group = document.getElementById('field-' + key);
    if (group) {
      var input = group.querySelector('input, textarea');
      if (input && input.value !== value) {
        input.value = value;
      }
    }
  }

  /* ─── Admin Panel → Iframe live sync ─────────────────────────────── */

  function wireStoreSync() {
    /* On field change, update iframe element in realtime */
    AdminStore.on('change', function () {
      pushToIframe();
    });

    /* On save, do a full reload for style/layout changes */
    AdminStore.on('save', function () {
      setTimeout(reloadIframe, 300);
    });
  }

  function pushToIframe() {
    var doc = getIframeDoc();
    if (!isActive || !doc) return;

    var els = doc.querySelectorAll('[data-ve]');
    els.forEach(function (el) {
      var key = el.getAttribute('data-ve');
      var val = AdminStore.get(key);
      /* Only update if not currently being edited */
      if (val !== undefined && doc.activeElement !== el) {
        if (el.textContent.trim() !== val) {
          el.textContent = val;
        }
      }
    });
  }

  /* ─── Public API ─────────────────────────────────────────────────── */

  window.VisualEditor = {
    init: init,
    navigate: navigateIframe,
    isActive: function () { return isActive; },
    activate: activate,
    deactivate: deactivate,
    refresh: reloadIframe
  };

})();
