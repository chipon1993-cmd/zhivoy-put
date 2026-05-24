/* ============================================================
   Panel: Live Preview with Device Switching
   Route: preview | Section: site
   ============================================================ */
(function() {
  'use strict';

  var PAGES = [
    { label: 'Главная', src: '../index.html' },
    { label: 'Путь', src: '../pages/triptych.html' },
    { label: 'Карта', src: '../pages/atlas.html' },
    { label: 'Триггеры', src: '../pages/triggers.html' },
    { label: 'Навигатор', src: '../pages/navigator.html' },
    { label: 'Система', src: '../pages/roadmap.html' }
  ];

  var DEVICES = [
    { label: 'Десктоп', width: '100%' },
    { label: 'Планшет', width: '768px' },
    { label: 'Телефон', width: '375px' }
  ];

  function cacheBust(url) {
    var separator = url.indexOf('?') === -1 ? '?' : '&';
    return url + separator + '_t=' + Date.now();
  }

  function render(container) {
    container.innerHTML = '';

    // Toolbar
    var toolbar = document.createElement('div');
    toolbar.style.cssText = 'display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:16px;';

    // Page selector
    var pageSelect = document.createElement('select');
    pageSelect.className = 'form-input form-select';
    pageSelect.style.cssText = 'width:auto;min-width:160px;';
    PAGES.forEach(function(p) {
      var opt = document.createElement('option');
      opt.value = p.src;
      opt.textContent = p.label;
      pageSelect.appendChild(opt);
    });
    toolbar.appendChild(pageSelect);

    // Device buttons
    var deviceWrap = document.createElement('div');
    deviceWrap.style.cssText = 'display:flex;gap:6px;';
    DEVICES.forEach(function(d, i) {
      var btn = document.createElement('button');
      btn.className = 'btn btn-sm' + (i === 0 ? ' btn-primary' : ' btn-secondary');
      btn.textContent = d.label;
      btn.dataset.deviceWidth = d.width;
      deviceWrap.appendChild(btn);
    });
    toolbar.appendChild(deviceWrap);

    // Refresh button
    var refreshBtn = document.createElement('button');
    refreshBtn.className = 'btn btn-sm btn-secondary';
    refreshBtn.textContent = '↻ Обновить';
    toolbar.appendChild(refreshBtn);

    var hint = document.createElement('span');
    hint.style.cssText = 'color:var(--muted);font-size:12px;margin-left:auto;';
    hint.textContent = 'Сохраните изменения перед обновлением';
    toolbar.appendChild(hint);

    // Frame container
    var frameContainer = document.createElement('div');
    frameContainer.style.cssText = 'height:calc(100vh - 200px);border:1px solid rgba(255,255,255,0.1);border-radius:12px;overflow:hidden;margin:0 auto;transition:max-width 0.3s ease;max-width:100%;';

    var iframe = document.createElement('iframe');
    iframe.src = cacheBust(PAGES[0].src);
    iframe.style.cssText = 'width:100%;height:100%;border:none;display:block;';
    iframe.title = 'Предпросмотр сайта';
    frameContainer.appendChild(iframe);

    // Wrap in card
    var cardBody = document.createElement('div');
    cardBody.appendChild(toolbar);
    cardBody.appendChild(frameContainer);

    container.appendChild(
      AdminUI.card('Предпросмотр', [cardBody])
    );

    // Bind events
    var deviceBtns = deviceWrap.querySelectorAll('button');
    deviceBtns.forEach(function(btn) {
      btn.addEventListener('click', function() {
        deviceBtns.forEach(function(b) { b.className = 'btn btn-sm btn-secondary'; });
        btn.className = 'btn btn-sm btn-primary';
        var width = btn.dataset.deviceWidth;
        frameContainer.style.maxWidth = width === '100%' ? '100%' : width;
      });
    });

    pageSelect.addEventListener('change', function() {
      iframe.src = cacheBust(pageSelect.value);
    });

    refreshBtn.addEventListener('click', function() {
      iframe.src = cacheBust(pageSelect.value);
    });

    AdminStore.on('save', function() {
      iframe.src = cacheBust(pageSelect.value);
    });
  }

  AdminRouter.register('preview', {
    section: 'site',
    title: 'Предпросмотр',
    icon: '👁',
    render: render
  });

})();
