/* ============================================================
   GrapesJS Configuration — Живой путь Page Builder

   Custom blocks, storage adapter, page loading,
   and integration with the site's design system.
   ============================================================ */
(function () {
  'use strict';

  /* ─── Constants ──────────────────────────────────────────── */

  var STORAGE_KEY = 'gjs_pages';
  var SITE_CSS_FILES = [
    '../css/variables.css',
    '../css/base.css',
    '../css/atmosphere.css',
    '../css/layout.css',
    '../css/components.css',
    '../css/header.css',
    '../css/footer.css',
    '../css/responsive.css'
  ];
  var GOOGLE_FONTS_URL = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Playfair+Display:ital,wght@0,700;0,800;0,900;1,700&display=swap';

  var PAGE_MAP = {
    'index':     { file: '../index.html',           name: 'Главная' },
    'triptych':  { file: '../pages/triptych.html',  name: 'Путь' },
    'atlas':     { file: '../pages/atlas.html',     name: 'Атлас' },
    'triggers':  { file: '../pages/triggers.html',  name: 'Триггеры' },
    'navigator': { file: '../pages/navigator.html', name: 'Навигатор' },
    'roadmap':   { file: '../pages/roadmap.html',   name: 'Развитие' }
  };

  var currentPageId = null;
  var editor = null;

  /* ─── Initialize GrapesJS ───────────────────────────────── */

  function initEditor() {
    editor = grapesjs.init({
      container: '#gjs',
      height: '100%',
      width: 'auto',
      fromElement: false,

      /* Storage — localStorage per page */
      storageManager: {
        type: 'local',
        autosave: true,
        autoload: false,
        stepsBeforeSave: 3
      },

      /* Devices */
      deviceManager: {
        devices: [
          { name: 'Desktop', width: '' },
          { name: 'Tablet', width: '768px', widthMedia: '992px' },
          { name: 'Mobile', width: '375px', widthMedia: '480px' }
        ]
      },

      /* Canvas — inject site CSS */
      canvas: {
        styles: [GOOGLE_FONTS_URL].concat(SITE_CSS_FILES),
        scripts: []
      },

      /* Plugins — loaded via CDN, pass global references */
      plugins: [
        typeof window['grapesjs-blocks-basic'] !== 'undefined' ? window['grapesjs-blocks-basic'] : 'gjs-blocks-basic',
        typeof window['grapesjs-preset-webpage'] !== 'undefined' ? window['grapesjs-preset-webpage'] : 'gjs-preset-webpage',
        typeof window['grapesjs-plugin-forms'] !== 'undefined' ? window['grapesjs-plugin-forms'] : 'gjs-plugin-forms'
      ],
      pluginsOpts: {
        /* String keys still work for pluginsOpts regardless of how plugin is referenced */
        'gjs-blocks-basic': {
          blocks: ['column1', 'column2', 'column3', 'column3-7', 'text', 'link', 'image', 'video', 'map'],
          flexGrid: true,
          addBasicStyle: true
        },
        'gjs-preset-webpage': {
          modalImportTitle: 'Импорт HTML',
          modalImportLabel: 'Вставьте HTML код',
          modalImportContent: '',
          importViewerRecursive: 1,
          filestackOpts: null,
          aviaryOpts: false,
          blocksBasicOpts: false,
          customStyleManager: []
        },
        'gjs-plugin-forms': {
          blocks: ['form', 'input', 'textarea', 'select', 'button', 'label', 'checkbox', 'radio']
        }
      },

      /* Style manager sectors */
      styleManager: {
        sectors: [
          {
            name: 'Основное',
            open: true,
            properties: [
              { extend: 'font-family', label: 'Шрифт' },
              { extend: 'font-size', label: 'Размер' },
              { extend: 'font-weight', label: 'Жирность' },
              { extend: 'letter-spacing', label: 'Межбуквенный' },
              { extend: 'color', label: 'Цвет текста' },
              { extend: 'line-height', label: 'Высота строки' },
              { extend: 'text-align', label: 'Выравнивание' },
              {
                extend: 'text-decoration',
                label: 'Оформление'
              }
            ]
          },
          {
            name: 'Отступы',
            open: false,
            properties: [
              { extend: 'margin', label: 'Внешние отступы' },
              { extend: 'padding', label: 'Внутренние отступы' }
            ]
          },
          {
            name: 'Размеры',
            open: false,
            properties: [
              { extend: 'width', label: 'Ширина' },
              { extend: 'min-width', label: 'Мин. ширина' },
              { extend: 'max-width', label: 'Макс. ширина' },
              { extend: 'height', label: 'Высота' },
              { extend: 'min-height', label: 'Мин. высота' }
            ]
          },
          {
            name: 'Фон',
            open: false,
            properties: [
              { extend: 'background-color', label: 'Цвет фона' },
              { extend: 'background', label: 'Фон' },
              { extend: 'background-image', label: 'Изображение' }
            ]
          },
          {
            name: 'Рамка',
            open: false,
            properties: [
              { extend: 'border-radius', label: 'Скругление' },
              { extend: 'border', label: 'Рамка' },
              { extend: 'box-shadow', label: 'Тень' }
            ]
          },
          {
            name: 'Flexbox',
            open: false,
            properties: [
              { extend: 'display', label: 'Отображение' },
              { extend: 'flex-direction', label: 'Направление' },
              { extend: 'justify-content', label: 'По горизонтали' },
              { extend: 'align-items', label: 'По вертикали' },
              { extend: 'gap', label: 'Зазор (gap)' },
              { extend: 'flex-wrap', label: 'Перенос' }
            ]
          },
          {
            name: 'Дополнительно',
            open: false,
            properties: [
              { extend: 'opacity', label: 'Прозрачность' },
              { extend: 'overflow', label: 'Переполнение' },
              { extend: 'position', label: 'Позиция' },
              { extend: 'cursor', label: 'Курсор' },
              { extend: 'transition', label: 'Анимация' }
            ]
          }
        ]
      },

      /* Panels */
      panels: {
        defaults: []
      }
    });

    /* Remove default panels we don't need (we use custom topbar) */
    editor.Panels.removePanel('devices-c');

    addCustomBlocks();
    wireToolbar();
    wirePageSelector();

    /* Show welcome state */
    editor.setComponents('<div style="display:grid;place-items:center;min-height:80vh;text-align:center;font-family:Inter,sans-serif;color:#a8a196;"><div><div style="font-size:48px;margin-bottom:16px;">&#10022;</div><h2 style="font-size:22px;font-weight:800;color:#f0ebe1;margin-bottom:8px;">Конструктор страниц</h2><p style="font-size:14px;line-height:1.6;max-width:380px;">Выберите страницу из списка сверху,<br>или создайте новую. Перетаскивайте блоки<br>из панели справа.</p></div></div>');
  }

  /* ─── Custom Blocks — Site Components ─────────────────── */

  function addCustomBlocks() {
    var bm = editor.BlockManager;

    /* ── Section Head ── */
    bm.add('section-head', {
      label: 'Заголовок секции',
      category: 'Живой путь',
      content: '<div class="section-head reveal"><div><div class="section-label">Секция</div><h2>Заголовок секции</h2></div><p>Описание секции — коротко и по делу.</p></div>',
      attributes: { class: 'gjs-block-section' }
    });

    /* ── Hero Section ── */
    bm.add('hero-section', {
      label: 'Герой (Hero)',
      category: 'Живой путь',
      content: '<section style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:80vh;text-align:center;padding:2rem;"><h1 class="landing-title" style="font-family:var(--font-heading);font-size:clamp(2rem,5vw,3.2rem);font-weight:900;color:var(--text);margin-bottom:1rem;">Заголовок</h1><p class="landing-tagline" style="color:var(--muted);font-size:clamp(1rem,2.5vw,1.2rem);max-width:500px;line-height:1.6;">Подзаголовок или описание вашего проекта</p><a href="#" style="display:inline-block;margin-top:2rem;padding:14px 32px;background:var(--gold);color:#0a0c12;border-radius:var(--radius-sm);font-weight:700;text-decoration:none;">Начать</a></section>'
    });

    /* ── Glass Card ── */
    bm.add('glass-card', {
      label: 'Стеклянная карточка',
      category: 'Живой путь',
      content: '<article class="glass info-card" style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);border-radius:24px;padding:28px;backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);"><div style="font-size:28px;margin-bottom:12px;">&#9733;</div><h3 style="font-size:18px;font-weight:800;margin-bottom:8px;color:var(--text);">Заголовок карточки</h3><p style="color:var(--muted);font-size:14px;line-height:1.6;">Описание карточки. Этот текст можно редактировать.</p></article>'
    });

    /* ── Card Grid (3 columns) ── */
    bm.add('card-grid-3', {
      label: 'Сетка карточек 3x',
      category: 'Живой путь',
      content: '<div class="cards-3" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:20px;">' +
        '<article class="glass info-card" style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);border-radius:24px;padding:28px;"><div style="font-size:28px;margin-bottom:12px;">&#128293;</div><h3 style="font-size:18px;font-weight:800;margin-bottom:8px;">Карточка 1</h3><p style="color:var(--muted);font-size:14px;line-height:1.6;">Описание первой карточки</p></article>' +
        '<article class="glass info-card" style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);border-radius:24px;padding:28px;"><div style="font-size:28px;margin-bottom:12px;">&#10024;</div><h3 style="font-size:18px;font-weight:800;margin-bottom:8px;">Карточка 2</h3><p style="color:var(--muted);font-size:14px;line-height:1.6;">Описание второй карточки</p></article>' +
        '<article class="glass info-card" style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);border-radius:24px;padding:28px;"><div style="font-size:28px;margin-bottom:12px;">&#127919;</div><h3 style="font-size:18px;font-weight:800;margin-bottom:8px;">Карточка 3</h3><p style="color:var(--muted);font-size:14px;line-height:1.6;">Описание третьей карточки</p></article>' +
        '</div>'
    });

    /* ── Timeline Step ── */
    bm.add('timeline-step', {
      label: 'Шаг таймлайна',
      category: 'Живой путь',
      content: '<div class="step" style="display:flex;gap:20px;align-items:flex-start;padding:24px 0;border-bottom:1px solid rgba(255,255,255,0.06);"><div class="step-num" style="font-family:var(--font-heading);font-size:36px;font-weight:900;color:var(--gold);opacity:0.3;min-width:50px;">01</div><div><h3 style="font-size:18px;font-weight:800;margin-bottom:6px;color:var(--text);">Название шага</h3><p style="color:var(--muted);font-size:14px;line-height:1.6;">Описание шага — что происходит на этом этапе.</p></div></div>'
    });

    /* ── Timeline Section ── */
    bm.add('timeline-section', {
      label: 'Таймлайн (секция)',
      category: 'Живой путь',
      content: '<section style="padding:80px 5%;max-width:900px;margin:0 auto;"><div class="section-head"><div><div class="section-label">Этапы</div><h2>Название секции</h2></div><p>Описание секции</p></div><div class="timeline">' +
        '<div class="step" style="display:flex;gap:20px;align-items:flex-start;padding:24px 0;border-bottom:1px solid rgba(255,255,255,0.06);"><div style="font-family:var(--font-heading);font-size:36px;font-weight:900;color:var(--gold);opacity:0.3;min-width:50px;">01</div><div><h3 style="font-size:18px;font-weight:800;margin-bottom:6px;">Этап первый</h3><p style="color:var(--muted);font-size:14px;line-height:1.6;">Описание этапа</p></div></div>' +
        '<div class="step" style="display:flex;gap:20px;align-items:flex-start;padding:24px 0;border-bottom:1px solid rgba(255,255,255,0.06);"><div style="font-family:var(--font-heading);font-size:36px;font-weight:900;color:var(--gold);opacity:0.3;min-width:50px;">02</div><div><h3 style="font-size:18px;font-weight:800;margin-bottom:6px;">Этап второй</h3><p style="color:var(--muted);font-size:14px;line-height:1.6;">Описание этапа</p></div></div>' +
        '<div class="step" style="display:flex;gap:20px;align-items:flex-start;padding:24px 0;"><div style="font-family:var(--font-heading);font-size:36px;font-weight:900;color:var(--gold);opacity:0.3;min-width:50px;">03</div><div><h3 style="font-size:18px;font-weight:800;margin-bottom:6px;">Этап третий</h3><p style="color:var(--muted);font-size:14px;line-height:1.6;">Описание этапа</p></div></div>' +
        '</div></section>'
    });

    /* ── Testimonial Card ── */
    bm.add('testimonial', {
      label: 'Отзыв',
      category: 'Живой путь',
      content: '<div class="glass testimonial-card" style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);border-radius:24px;padding:28px;"><p style="font-size:15px;line-height:1.7;color:var(--text);margin-bottom:16px;font-style:italic;">Текст отзыва — что сказал пользователь о вашем проекте.</p><div style="display:flex;align-items:center;gap:12px;"><div style="width:40px;height:40px;border-radius:50%;background:var(--gold);display:grid;place-items:center;color:#0a0c12;font-weight:800;font-size:16px;">А</div><div><div style="font-weight:700;font-size:14px;color:var(--text);">Имя</div><div style="font-size:12px;color:var(--muted);">Роль</div></div></div></div>'
    });

    /* ── CTA Section ── */
    bm.add('cta-section', {
      label: 'CTA (призыв)',
      category: 'Живой путь',
      content: '<section style="text-align:center;padding:80px 5%;"><h2 style="font-family:var(--font-heading);font-size:clamp(1.6rem,4vw,2.4rem);font-weight:900;color:var(--text);margin-bottom:12px;">Призыв к действию</h2><p style="color:var(--muted);font-size:16px;line-height:1.6;max-width:500px;margin:0 auto 28px;">Описание — почему стоит нажать на кнопку.</p><a href="#" style="display:inline-block;padding:16px 40px;background:var(--gold);color:#0a0c12;border-radius:var(--radius-sm);font-weight:700;font-size:16px;text-decoration:none;">Начать сейчас</a></section>'
    });

    /* ── Territory Card ── */
    bm.add('territory-card', {
      label: 'Территория',
      category: 'Живой путь',
      content: '<div class="territory" style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:20px;padding:24px;text-align:center;"><div style="font-size:32px;margin-bottom:8px;">&#127758;</div><strong style="display:block;font-size:15px;font-weight:700;margin-bottom:6px;color:var(--text);">Территория</strong><p style="color:var(--muted);font-size:13px;line-height:1.5;">Описание территории жизни</p></div>'
    });

    /* ── Divider ── */
    bm.add('divider', {
      label: 'Разделитель',
      category: 'Живой путь',
      content: '<hr style="border:none;border-top:1px solid rgba(255,255,255,0.08);margin:40px 0;" />'
    });

    /* ── Spacer ── */
    bm.add('spacer', {
      label: 'Отступ',
      category: 'Живой путь',
      content: '<div style="height:60px;"></div>'
    });

    /* ── Page Section (wrapper) ── */
    bm.add('page-section', {
      label: 'Секция страницы',
      category: 'Живой путь',
      content: '<section class="page" style="max-width:var(--max-width,1100px);margin:0 auto;padding:80px 5%;"><h2 style="font-family:var(--font-heading);font-size:clamp(1.6rem,3.5vw,2.2rem);font-weight:900;margin-bottom:16px;color:var(--text);">Секция</h2><p style="color:var(--muted);font-size:15px;line-height:1.7;">Содержимое секции. Перетаскивайте блоки сюда.</p></section>'
    });

    /* ── Badge / Label ── */
    bm.add('badge-label', {
      label: 'Бейдж / Метка',
      category: 'Живой путь',
      content: '<span class="section-label" style="display:inline-block;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:var(--gold);background:rgba(242,201,109,0.1);padding:4px 12px;border-radius:20px;margin-bottom:12px;">Метка</span>'
    });

    /* ── Two-Column Layout ── */
    bm.add('two-col-section', {
      label: '2 колонки',
      category: 'Живой путь',
      content: '<section style="display:grid;grid-template-columns:1fr 1fr;gap:40px;padding:60px 5%;max-width:1100px;margin:0 auto;align-items:center;"><div><h2 style="font-family:var(--font-heading);font-size:clamp(1.4rem,3vw,2rem);font-weight:900;margin-bottom:12px;color:var(--text);">Заголовок</h2><p style="color:var(--muted);font-size:15px;line-height:1.7;">Текст левой колонки. Описание, детали, контекст.</p></div><div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:24px;padding:40px;text-align:center;min-height:200px;display:grid;place-items:center;"><span style="font-size:48px;">&#128444;</span><p style="color:var(--muted);font-size:13px;margin-top:8px;">Изображение или контент</p></div></section>'
    });

    /* ── Footer ── */
    bm.add('footer-block', {
      label: 'Футер',
      category: 'Живой путь',
      content: '<footer style="text-align:center;padding:40px 20px;border-top:1px solid rgba(255,255,255,0.06);"><p style="color:var(--muted);font-size:13px;">Живой путь &copy; 2025</p></footer>'
    });
  }

  /* ─── Toolbar Wiring ────────────────────────────────────── */

  function wireToolbar() {
    /* Undo / Redo */
    var undoBtn = document.getElementById('btn-undo');
    var redoBtn = document.getElementById('btn-redo');
    if (undoBtn) undoBtn.addEventListener('click', function () { editor.UndoManager.undo(); });
    if (redoBtn) redoBtn.addEventListener('click', function () { editor.UndoManager.redo(); });

    /* Device buttons */
    var deviceBtns = document.querySelectorAll('.ge-device-btn');
    deviceBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        deviceBtns.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        editor.setDevice(btn.dataset.device);
      });
    });

    /* Code modal */
    var codeBtn = document.getElementById('btn-code');
    if (codeBtn) {
      codeBtn.addEventListener('click', function () {
        var html = editor.getHtml();
        var css = editor.getCss();
        var modal = editor.Modal;
        modal.setTitle('HTML / CSS');
        modal.setContent(
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;height:60vh;">' +
          '<div><h4 style="margin:0 0 8px;font-size:12px;color:#a8a196;text-transform:uppercase;">HTML</h4><textarea readonly style="width:100%;height:calc(100% - 30px);background:#0a0c12;color:#f0ebe1;border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:12px;font-family:monospace;font-size:12px;resize:none;">' + escapeHtml(html) + '</textarea></div>' +
          '<div><h4 style="margin:0 0 8px;font-size:12px;color:#a8a196;text-transform:uppercase;">CSS</h4><textarea readonly style="width:100%;height:calc(100% - 30px);background:#0a0c12;color:#f0ebe1;border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:12px;font-family:monospace;font-size:12px;resize:none;">' + escapeHtml(css) + '</textarea></div>' +
          '</div>'
        );
        modal.open();
      });
    }

    /* Clear canvas */
    var clearBtn = document.getElementById('btn-clear');
    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        if (confirm('Очистить холст? Все несохранённые изменения будут потеряны.')) {
          editor.DomComponents.clear();
          editor.CssComposer.clear();
        }
      });
    }

    /* Save */
    var saveBtn = document.getElementById('btn-save-page');
    if (saveBtn) {
      saveBtn.addEventListener('click', function () {
        savePage();
      });
    }

    /* Publish */
    var pubBtn = document.getElementById('btn-publish-page');
    if (pubBtn) {
      pubBtn.addEventListener('click', function () {
        publishPage();
      });
    }
  }

  /* ─── Page Selector ─────────────────────────────────────── */

  function wirePageSelector() {
    var sel = document.getElementById('page-selector');
    if (!sel) return;

    sel.addEventListener('change', function () {
      var val = sel.value;
      if (!val) return;

      if (val === '_new') {
        createNewPage();
        return;
      }

      loadPage(val);
    });
  }

  /* ─── Load Existing Page ────────────────────────────────── */

  function loadPage(pageId) {
    var pageInfo = PAGE_MAP[pageId];
    if (!pageInfo) return;

    /* Check for saved version first */
    var saved = getSavedPage(pageId);
    if (saved) {
      currentPageId = pageId;
      editor.loadProjectData(saved);
      showToast('Загружена сохранённая версия: ' + pageInfo.name);
      return;
    }

    /* Fetch the original file */
    showLoading('Загрузка ' + pageInfo.name + '...');

    fetch(pageInfo.file + '?_t=' + Date.now())
      .then(function (res) {
        if (!res.ok) throw new Error('Не удалось загрузить: ' + res.status);
        return res.text();
      })
      .then(function (html) {
        currentPageId = pageId;
        var parsed = extractBodyContent(html);
        editor.setComponents(parsed.body);
        if (parsed.styles) {
          editor.setStyle(parsed.styles);
        }
        hideLoading();
        showToast('Загружена: ' + pageInfo.name);
      })
      .catch(function (err) {
        hideLoading();
        showToast('Ошибка: ' + err.message, true);
        console.error('[PageBuilder] Load error:', err);
      });
  }

  /* ─── Extract body content from full HTML ───────────────── */

  function extractBodyContent(html) {
    var parser = new DOMParser();
    var doc = parser.parseFromString(html, 'text/html');

    /* Remove scripts (they'll cause issues in the editor) */
    doc.querySelectorAll('script').forEach(function (s) { s.remove(); });

    /* Extract inline styles from <head> */
    var styles = '';
    doc.querySelectorAll('head style').forEach(function (s) {
      styles += s.textContent + '\n';
    });

    /* Get the main content — prefer .page or body */
    var main = doc.querySelector('.page') || doc.querySelector('main') || doc.body;
    var bodyHtml = main ? main.innerHTML : doc.body.innerHTML;

    /* Clean up component placeholders */
    var tempDiv = document.createElement('div');
    tempDiv.innerHTML = bodyHtml;

    /* Remove component include divs (header, footer loaded via JS) */
    tempDiv.querySelectorAll('#site-header, #site-footer, #site-nav').forEach(function (el) {
      el.remove();
    });

    return {
      body: tempDiv.innerHTML.trim(),
      styles: styles
    };
  }

  /* ─── Create New Page ───────────────────────────────────── */

  function createNewPage() {
    var name = prompt('Имя новой страницы (латиницей, без пробелов):');
    if (!name) {
      document.getElementById('page-selector').value = currentPageId || '';
      return;
    }

    name = name.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
    var pageId = 'custom-' + name;

    /* Add to dropdown */
    var sel = document.getElementById('page-selector');
    var option = document.createElement('option');
    option.value = pageId;
    option.textContent = name + ' (новая)';
    sel.insertBefore(option, sel.querySelector('option[value="_new"]'));
    sel.value = pageId;

    /* Set up editor with blank template */
    currentPageId = pageId;
    editor.DomComponents.clear();
    editor.CssComposer.clear();
    editor.setComponents(
      '<section style="max-width:1100px;margin:0 auto;padding:80px 5%;">' +
      '<h1 style="font-family:var(--font-heading);font-size:clamp(2rem,5vw,2.8rem);font-weight:900;color:var(--text);margin-bottom:16px;">Новая страница</h1>' +
      '<p style="color:var(--muted);font-size:16px;line-height:1.7;">Перетаскивайте блоки из панели справа, чтобы создать страницу.</p>' +
      '</section>'
    );

    showToast('Создана новая страница: ' + name);
  }

  /* ─── Save / Load ───────────────────────────────────────── */

  function savePage() {
    if (!currentPageId) {
      showToast('Сначала выберите страницу', true);
      return;
    }

    var data = editor.getProjectData();
    var all = getAllSavedPages();
    all[currentPageId] = {
      data: data,
      html: editor.getHtml(),
      css: editor.getCss(),
      savedAt: new Date().toISOString()
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
      showToast('Сохранено: ' + (PAGE_MAP[currentPageId] ? PAGE_MAP[currentPageId].name : currentPageId));
    } catch (e) {
      showToast('Ошибка сохранения: ' + e.message, true);
    }
  }

  function getSavedPage(pageId) {
    var all = getAllSavedPages();
    return all[pageId] ? all[pageId].data : null;
  }

  function getAllSavedPages() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  /* ─── Publish to GitHub ─────────────────────────────────── */

  function publishPage() {
    if (!currentPageId) {
      showToast('Сначала выберите страницу', true);
      return;
    }

    if (!window.GitHubSync || !window.GitHubSync.isConfigured()) {
      showToast('GitHub токен не настроен. Настройте в админке > Публикация.', true);
      return;
    }

    /* Save first */
    savePage();

    var html = editor.getHtml();
    var css = editor.getCss();

    /* Build a full page */
    var pageInfo = PAGE_MAP[currentPageId];
    var isCustom = !pageInfo;
    var pageName = isCustom ? currentPageId.replace('custom-', '') : currentPageId;

    var fullHtml = buildFullPage(pageName, html, css);

    /* Determine file path in repo */
    var filePath;
    if (currentPageId === 'index') {
      filePath = 'index.html';
    } else if (isCustom) {
      filePath = 'pages/' + pageName + '.html';
    } else {
      filePath = 'pages/' + currentPageId + '.html';
    }

    showLoading('Публикация...');

    /* Push to GitHub via Contents API */
    var token = GitHubSync.getToken();
    var apiUrl = 'https://api.github.com/repos/chipon1993-cmd/zhivoy-put/contents/' + filePath;

    /* First get SHA if file exists */
    fetch(apiUrl, {
      headers: {
        'Authorization': 'Bearer ' + token,
        'Accept': 'application/vnd.github.v3+json'
      }
    })
    .then(function (res) {
      if (res.status === 404) return null;
      if (!res.ok) throw new Error('GitHub API: ' + res.status);
      return res.json();
    })
    .then(function (existing) {
      var body = {
        message: 'Update ' + filePath + ' via page builder',
        content: btoa(unescape(encodeURIComponent(fullHtml))),
        branch: 'master'
      };
      if (existing && existing.sha) body.sha = existing.sha;

      return fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Authorization': 'Bearer ' + token,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
    })
    .then(function (res) {
      if (!res.ok) {
        return res.json().then(function (err) {
          throw new Error(err.message || 'Ошибка публикации');
        });
      }
      return res.json();
    })
    .then(function () {
      hideLoading();
      showToast('Опубликовано! Vercel развернёт через ~30 сек.');
    })
    .catch(function (err) {
      hideLoading();
      showToast('Ошибка: ' + err.message, true);
      console.error('[PageBuilder] Publish error:', err);
    });
  }

  /* ─── Build Full HTML Page ──────────────────────────────── */

  function buildFullPage(pageName, bodyHtml, customCss) {
    var isIndex = (currentPageId === 'index');
    var cssPrefix = isIndex ? '' : '../';

    return '<!DOCTYPE html>\n' +
      '<html lang="ru">\n' +
      '<head>\n' +
      '  <meta charset="UTF-8" />\n' +
      '  <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n' +
      '  <title>' + escapeHtml(pageName) + ' — Живой путь</title>\n' +
      '  <link rel="icon" type="image/svg+xml" href="' + cssPrefix + 'favicon.svg" />\n' +
      '  <link rel="preconnect" href="https://fonts.googleapis.com" />\n' +
      '  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />\n' +
      '  <link href="' + GOOGLE_FONTS_URL + '" rel="stylesheet" />\n' +
      '  <link rel="stylesheet" href="' + cssPrefix + 'css/variables.css" />\n' +
      '  <link rel="stylesheet" href="' + cssPrefix + 'css/base.css" />\n' +
      '  <link rel="stylesheet" href="' + cssPrefix + 'css/atmosphere.css" />\n' +
      '  <link rel="stylesheet" href="' + cssPrefix + 'css/layout.css" />\n' +
      '  <link rel="stylesheet" href="' + cssPrefix + 'css/components.css" />\n' +
      '  <link rel="stylesheet" href="' + cssPrefix + 'css/header.css" />\n' +
      '  <link rel="stylesheet" href="' + cssPrefix + 'css/footer.css" />\n' +
      '  <link rel="stylesheet" href="' + cssPrefix + 'css/responsive.css" />\n' +
      (customCss ? '  <style>\n' + customCss + '\n  </style>\n' : '') +
      '</head>\n' +
      '<body>\n' +
      '  <div id="site-header"></div>\n' +
      '  <canvas id="starfield"></canvas>\n' +
      '  <div class="aurora"></div>\n' +
      '  <div class="noise"></div>\n' +
      '  <div class="grid-overlay"></div>\n\n' +
      '  <div class="page">\n' +
      bodyHtml + '\n' +
      '  </div>\n\n' +
      '  <div id="site-footer"></div>\n\n' +
      '  <script src="' + cssPrefix + 'js/components.js"><\/script>\n' +
      '  <script src="' + cssPrefix + 'js/starfield.js"><\/script>\n' +
      '  <script src="' + cssPrefix + 'js/reveal.js"><\/script>\n' +
      '  <script src="' + cssPrefix + 'js/cms-loader.js"><\/script>\n' +
      '</body>\n' +
      '</html>';
  }

  /* ─── Helpers ───────────────────────────────────────────── */

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  var toastEl = null;
  var toastTimer = null;

  function showToast(msg, isError) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'ge-toast';
      document.body.appendChild(toastEl);
    }

    toastEl.textContent = msg;
    toastEl.classList.toggle('error', !!isError);

    clearTimeout(toastTimer);
    /* Force reflow */
    toastEl.classList.remove('show');
    void toastEl.offsetWidth;
    toastEl.classList.add('show');

    toastTimer = setTimeout(function () {
      toastEl.classList.remove('show');
    }, 3500);
  }

  var loadingEl = null;

  function showLoading(text) {
    if (!loadingEl) {
      loadingEl = document.createElement('div');
      loadingEl.className = 'ge-loading';
      loadingEl.innerHTML = '<div class="ge-loading-inner"><div class="ge-loading-spinner"></div><div class="ge-loading-text"></div></div>';
      document.body.appendChild(loadingEl);
    }
    loadingEl.querySelector('.ge-loading-text').textContent = text || 'Загрузка...';
    loadingEl.style.display = 'grid';
  }

  function hideLoading() {
    if (loadingEl) loadingEl.style.display = 'none';
  }

  /* ─── Boot ──────────────────────────────────────────────── */

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEditor);
  } else {
    initEditor();
  }

})();
