/* ============================================================
   Panel: Custom Code Editor (CSS / JavaScript)
   Route: code | Section: site
   Monaco Editor with dark theme, debounced save
   ============================================================ */
(function() {
  'use strict';

  var MONACO_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min';
  var LOAD_TIMEOUT = 10000;
  var DEBOUNCE_MS = 500;

  var TAB_STYLE = 'display:inline-block;padding:8px 20px;margin-right:4px;border:none;' +
    'border-radius:8px 8px 0 0;font-size:14px;font-weight:600;cursor:pointer;' +
    'transition:background .2s,color .2s;font-family:inherit;';
  var TAB_ACTIVE = 'background:#f2c96d;color:#1a1a1a;';
  var TAB_INACTIVE = 'background:rgba(255,255,255,0.06);color:#aaa;';

  var EDITOR_OPTS = {
    minimap: { enabled: false },
    fontSize: 14,
    fontFamily: 'JetBrains Mono, monospace',
    scrollBeyondLastLine: false,
    automaticLayout: false,
    tabSize: 2,
    lineNumbers: 'on',
    roundedSelection: true,
    padding: { top: 12 }
  };

  function debounce(fn, ms) {
    var timer;
    return function() {
      clearTimeout(timer);
      timer = setTimeout(fn, ms);
    };
  }

  function buildTabBar(onSwitch) {
    var bar = document.createElement('div');
    bar.style.cssText = 'margin-bottom:0;display:flex;align-items:flex-end;';

    var btnCSS = document.createElement('button');
    btnCSS.textContent = 'CSS';
    btnCSS.style.cssText = TAB_STYLE + TAB_ACTIVE;

    var btnJS = document.createElement('button');
    btnJS.textContent = 'JavaScript';
    btnJS.style.cssText = TAB_STYLE + TAB_INACTIVE;

    function activate(active, inactive) {
      active.style.cssText = TAB_STYLE + TAB_ACTIVE;
      inactive.style.cssText = TAB_STYLE + TAB_INACTIVE;
    }

    btnCSS.addEventListener('click', function() {
      activate(btnCSS, btnJS);
      onSwitch('css');
    });
    btnJS.addEventListener('click', function() {
      activate(btnJS, btnCSS);
      onSwitch('js');
    });

    bar.appendChild(btnCSS);
    bar.appendChild(btnJS);
    return bar;
  }

  function createEditorContainer() {
    var el = document.createElement('div');
    el.style.cssText = 'width:100%;height:400px;border:1px solid rgba(255,255,255,0.1);' +
      'border-radius:0 8px 8px 8px;overflow:hidden;';
    return el;
  }

  function createFallbackTextarea(storeKey) {
    var ta = document.createElement('textarea');
    ta.style.cssText = 'width:100%;height:400px;background:#1e1e1e;color:#d4d4d4;' +
      'border:1px solid rgba(255,255,255,0.1);border-radius:0 8px 8px 8px;padding:12px;' +
      'font-family:JetBrains Mono,monospace;font-size:14px;resize:vertical;' +
      'tab-size:2;line-height:1.5;box-sizing:border-box;';
    ta.value = AdminStore.get(storeKey) || '';
    ta.spellcheck = false;
    var save = debounce(function() {
      AdminStore.set(storeKey, ta.value);
    }, DEBOUNCE_MS);
    ta.addEventListener('input', save);
    return ta;
  }

  function loadMonaco(cssContainer, jsContainer) {
    var resolved = false;

    require.config({ paths: { vs: MONACO_CDN + '/vs' } });

    var timeout = setTimeout(function() {
      if (resolved) return;
      resolved = true;
      fallback(cssContainer, jsContainer);
    }, LOAD_TIMEOUT);

    require(['vs/editor/editor.main'], function(monaco) {
      if (resolved) return;
      resolved = true;
      clearTimeout(timeout);
      initEditors(monaco, cssContainer, jsContainer);
    });
  }

  function fallback(cssContainer, jsContainer) {
    AdminUI.toast('Monaco Editor не загрузился. Используется простой редактор.');
    cssContainer.innerHTML = '';
    jsContainer.innerHTML = '';
    cssContainer.appendChild(createFallbackTextarea('custom-css'));
    jsContainer.appendChild(createFallbackTextarea('custom-js'));
    cssContainer.style.border = 'none';
    jsContainer.style.border = 'none';
  }

  var editors = { css: null, js: null };

  function initEditors(monaco, cssContainer, jsContainer) {
    editors.css = monaco.editor.create(cssContainer, Object.assign({}, EDITOR_OPTS, {
      value: AdminStore.get('custom-css') || '',
      language: 'css',
      theme: 'vs-dark'
    }));

    editors.js = monaco.editor.create(jsContainer, Object.assign({}, EDITOR_OPTS, {
      value: AdminStore.get('custom-js') || '',
      language: 'javascript',
      theme: 'vs-dark'
    }));

    var saveCSS = debounce(function() {
      AdminStore.set('custom-css', editors.css.getValue());
    }, DEBOUNCE_MS);

    var saveJS = debounce(function() {
      AdminStore.set('custom-js', editors.js.getValue());
    }, DEBOUNCE_MS);

    editors.css.onDidChangeModelContent(saveCSS);
    editors.js.onDidChangeModelContent(saveJS);
  }

  function render(container) {
    container.innerHTML = '';
    editors.css = null;
    editors.js = null;

    // Warning alert
    container.appendChild(
      AdminUI.alert('warning',
        'Кастомный код применяется на всех страницах сайта. Будьте осторожны с JavaScript.')
    );

    // Editor containers
    var cssWrap = createEditorContainer();
    var jsWrap = createEditorContainer();
    jsWrap.style.display = 'none';

    var activeTab = 'css';

    var tabBar = buildTabBar(function(tab) {
      activeTab = tab;
      if (tab === 'css') {
        cssWrap.style.display = '';
        jsWrap.style.display = 'none';
        if (editors.css) editors.css.layout();
      } else {
        cssWrap.style.display = 'none';
        jsWrap.style.display = '';
        if (editors.js) editors.js.layout();
      }
    });

    // Card with tab bar + editors
    var editorArea = document.createElement('div');
    editorArea.appendChild(tabBar);
    editorArea.appendChild(cssWrap);
    editorArea.appendChild(jsWrap);

    container.appendChild(
      AdminUI.card('Редактор кода', [editorArea])
    );

    // Load Monaco or fall back
    if (typeof require !== 'undefined' && typeof require.config === 'function') {
      loadMonaco(cssWrap, jsWrap);
    } else {
      fallback(cssWrap, jsWrap);
    }
  }

  AdminRouter.register('code', {
    section: 'site',
    title: 'Свой код',
    icon: '💻',
    render: render
  });

  // Ensure defaults exist
  if (AdminStore.get('custom-css') === undefined) AdminStore.set('custom-css', '');
  if (AdminStore.get('custom-js') === undefined) AdminStore.set('custom-js', '');

})();
