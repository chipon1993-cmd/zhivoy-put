/* ============================================================
   Panel: Theme Editor with Presets
   Route: theme | Section: management
   ============================================================ */
(function() {
  'use strict';

  var BUILT_IN_THEMES = [
    {
      name: 'Тёмный космос', builtin: true,
      colors: { 'style-bg': '#05070d', 'style-gold': '#f2c96d', 'style-text': '#f0ebe1', 'style-muted': '#a8a196', 'style-blue': '#81c7ff', 'style-green': '#8ff0b6' },
      fonts: { 'style-font-heading': 'Playfair Display', 'style-font-body': 'Inter' },
      effects: { 'style-stars': 'on', 'style-aurora': 'on', 'style-grid': 'on', 'style-noise': 'on' },
      radius: '28'
    },
    {
      name: 'Тёплая земля', builtin: true,
      colors: { 'style-bg': '#1a1410', 'style-gold': '#d4a855', 'style-text': '#e8dfd2', 'style-muted': '#9a8d7e', 'style-blue': '#7ab5d4', 'style-green': '#8cc49a' },
      fonts: { 'style-font-heading': 'Lora', 'style-font-body': 'Source Sans 3' },
      effects: { 'style-stars': 'off', 'style-aurora': 'on', 'style-grid': 'off', 'style-noise': 'on' },
      radius: '16'
    },
    {
      name: 'Глубокий океан', builtin: true,
      colors: { 'style-bg': '#0a1628', 'style-gold': '#4fc3f7', 'style-text': '#e0e8f0', 'style-muted': '#7a8da0', 'style-blue': '#4fc3f7', 'style-green': '#66d9a0' },
      fonts: { 'style-font-heading': 'Montserrat', 'style-font-body': 'DM Sans' },
      effects: { 'style-stars': 'on', 'style-aurora': 'on', 'style-grid': 'on', 'style-noise': 'off' },
      radius: '20'
    },
    {
      name: 'Светлый минимал', builtin: true,
      colors: { 'style-bg': '#f5f3ef', 'style-gold': '#b8860b', 'style-text': '#2d2a26', 'style-muted': '#6b6560', 'style-blue': '#3a7bd5', 'style-green': '#2d8a56' },
      fonts: { 'style-font-heading': 'Outfit', 'style-font-body': 'Inter' },
      effects: { 'style-stars': 'off', 'style-aurora': 'off', 'style-grid': 'off', 'style-noise': 'off' },
      radius: '12'
    },
    {
      name: 'Лесная тропа', builtin: true,
      colors: { 'style-bg': '#0d1a0f', 'style-gold': '#a8c256', 'style-text': '#dde8d0', 'style-muted': '#7d9470', 'style-blue': '#6bb5b5', 'style-green': '#a8c256' },
      fonts: { 'style-font-heading': 'Merriweather', 'style-font-body': 'Nunito' },
      effects: { 'style-stars': 'on', 'style-aurora': 'on', 'style-grid': 'off', 'style-noise': 'on' },
      radius: '24'
    },
    {
      name: 'Закат', builtin: true,
      colors: { 'style-bg': '#1a0f1e', 'style-gold': '#ff8a65', 'style-text': '#f0e6f0', 'style-muted': '#a08da0', 'style-blue': '#ce93d8', 'style-green': '#ffab91' },
      fonts: { 'style-font-heading': 'Cormorant Garamond', 'style-font-body': 'Raleway' },
      effects: { 'style-stars': 'on', 'style-aurora': 'on', 'style-grid': 'on', 'style-noise': 'on' },
      radius: '32'
    }
  ];

  function applyPreset(preset) {
    if (preset.colors) {
      Object.keys(preset.colors).forEach(function(key) {
        AdminStore.set(key, preset.colors[key]);
      });
    }
    if (preset.fonts) {
      Object.keys(preset.fonts).forEach(function(key) {
        AdminStore.set(key, preset.fonts[key]);
      });
    }
    if (preset.effects) {
      Object.keys(preset.effects).forEach(function(key) {
        AdminStore.set(key, preset.effects[key]);
      });
    }
    if (preset.radius) {
      AdminStore.set('style-radius', preset.radius);
    }
  }

  function snapshotCurrentTheme() {
    var snapshot = { colors: {}, fonts: {}, effects: {}, radius: '' };
    ['style-bg', 'style-gold', 'style-text', 'style-muted', 'style-blue', 'style-green'].forEach(function(k) {
      snapshot.colors[k] = AdminStore.get(k) || '';
    });
    ['style-font-heading', 'style-font-body'].forEach(function(k) {
      snapshot.fonts[k] = AdminStore.get(k) || '';
    });
    ['style-stars', 'style-aurora', 'style-grid', 'style-noise'].forEach(function(k) {
      snapshot.effects[k] = AdminStore.get(k) || 'off';
    });
    snapshot.radius = AdminStore.get('style-radius') || '0';
    return snapshot;
  }

  function createPresetCard(preset, isCustom, index, container) {
    var card = document.createElement('div');
    card.className = 'preset-card';
    card.style.cssText = 'background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:14px;display:flex;flex-direction:column;gap:8px;';

    var nameDiv = document.createElement('div');
    nameDiv.style.cssText = 'font-weight:600;font-size:14px;';
    nameDiv.textContent = preset.name;
    card.appendChild(nameDiv);

    var dotsDiv = document.createElement('div');
    dotsDiv.style.cssText = 'display:flex;align-items:center;gap:4px;';
    var mainColors = [
      preset.colors['style-bg'] || '#000',
      preset.colors['style-gold'] || '#ccc',
      preset.colors['style-text'] || '#fff'
    ];
    mainColors.forEach(function(c) {
      var dot = document.createElement('span');
      dot.style.cssText = 'display:inline-block;width:16px;height:16px;border-radius:50%;border:1px solid rgba(255,255,255,0.15);';
      dot.style.background = c;
      dotsDiv.appendChild(dot);
    });
    card.appendChild(dotsDiv);

    if (preset.fonts) {
      var heading = preset.fonts['style-font-heading'] || '';
      var body = preset.fonts['style-font-body'] || '';
      if (heading || body) {
        var fontDiv = document.createElement('div');
        fontDiv.style.cssText = 'font-size:11px;color:var(--muted);margin-top:2px;';
        fontDiv.textContent = heading + ' / ' + body;
        card.appendChild(fontDiv);
      }
    }

    var actionsDiv = document.createElement('div');
    actionsDiv.style.cssText = 'display:flex;align-items:center;gap:6px;margin-top:auto;padding-top:8px;';

    var applyBtn = document.createElement('button');
    applyBtn.className = 'btn btn-sm btn-primary';
    applyBtn.textContent = 'Применить';
    applyBtn.addEventListener('click', function() {
      applyPreset(preset);
      AdminUI.toast('Тема «' + preset.name + '» применена');
      render(container);
    });
    actionsDiv.appendChild(applyBtn);

    if (isCustom) {
      var deleteBtn = document.createElement('button');
      deleteBtn.className = 'btn btn-sm btn-danger';
      deleteBtn.textContent = 'Удалить';
      deleteBtn.addEventListener('click', function() {
        AdminUI.confirm('Удалить тему «' + preset.name + '»?').then(function(yes) {
          if (!yes) return;
          var themes = AdminStore.data.themes || [];
          themes.splice(index, 1);
          AdminStore.data.themes = themes;
          AdminStore.save();
          AdminUI.toast('Тема удалена');
          render(container);
        });
      });
      actionsDiv.appendChild(deleteBtn);
    }

    card.appendChild(actionsDiv);
    return card;
  }

  function render(container) {
    container.innerHTML = '';

    // A. Colors
    container.appendChild(
      AdminUI.card('Цвета', [
        AdminUI.row([
          AdminUI.field({ type: 'color', id: 'style-bg', label: 'Фон' }),
          AdminUI.field({ type: 'color', id: 'style-gold', label: 'Акцент' }),
          AdminUI.field({ type: 'color', id: 'style-text', label: 'Текст' })
        ], 3),
        AdminUI.row([
          AdminUI.field({ type: 'color', id: 'style-muted', label: 'Приглушённый' }),
          AdminUI.field({ type: 'color', id: 'style-blue', label: 'Голубой' }),
          AdminUI.field({ type: 'color', id: 'style-green', label: 'Зелёный' })
        ], 3)
      ], { badge: 'Тема' })
    );

    // B. Sizes and radii
    container.appendChild(
      AdminUI.card('Размеры и скругления', [
        AdminUI.row([
          AdminUI.field({ type: 'range', id: 'style-radius', label: 'Скругление (px)', min: 0, max: 60 }),
          AdminUI.field({ type: 'number', id: 'style-max-width', label: 'Ширина контента (px)' })
        ])
      ])
    );

    // C. Effects
    container.appendChild(
      AdminUI.card('Эффекты', [
        AdminUI.row([
          AdminUI.field({ type: 'select', id: 'style-stars', label: 'Звёзды', options: [{ value: 'on', label: 'Вкл' }, { value: 'off', label: 'Выкл' }] }),
          AdminUI.field({ type: 'select', id: 'style-aurora', label: 'Аврора', options: [{ value: 'on', label: 'Вкл' }, { value: 'off', label: 'Выкл' }] })
        ]),
        AdminUI.row([
          AdminUI.field({ type: 'select', id: 'style-grid', label: 'Сетка', options: [{ value: 'on', label: 'Вкл' }, { value: 'off', label: 'Выкл' }] }),
          AdminUI.field({ type: 'select', id: 'style-noise', label: 'Шум', options: [{ value: 'on', label: 'Вкл' }, { value: 'off', label: 'Выкл' }] })
        ])
      ])
    );

    // D. Presets
    var presetsGrid = document.createElement('div');
    presetsGrid.id = 'presetsGrid';
    presetsGrid.style.cssText = 'display:grid;grid-template-columns:repeat(3,1fr);gap:12px;';

    BUILT_IN_THEMES.forEach(function(preset, i) {
      presetsGrid.appendChild(createPresetCard(preset, false, i, container));
    });
    var userThemes = AdminStore.data.themes || [];
    userThemes.forEach(function(preset, i) {
      presetsGrid.appendChild(createPresetCard(preset, true, i, container));
    });

    var saveThemeBtn = document.createElement('button');
    saveThemeBtn.className = 'btn btn-primary';
    saveThemeBtn.textContent = 'Сохранить текущую тему';
    saveThemeBtn.style.marginTop = '16px';
    saveThemeBtn.addEventListener('click', function() {
      var bodyEl = document.createElement('div');
      var input = document.createElement('input');
      input.type = 'text';
      input.className = 'form-input';
      input.placeholder = 'Название темы';
      input.id = 'newThemeNameInput';
      bodyEl.appendChild(input);

      AdminUI.modal({
        title: 'Сохранить тему',
        body: bodyEl,
        onSave: function() {
          var nameInput = document.getElementById('newThemeNameInput');
          var name = nameInput ? nameInput.value.trim() : '';
          if (!name) {
            AdminUI.toast('Введите название темы');
            return;
          }
          var snapshot = snapshotCurrentTheme();
          snapshot.name = name;
          snapshot.builtin = false;
          if (!AdminStore.data.themes) AdminStore.data.themes = [];
          AdminStore.data.themes.push(snapshot);
          AdminStore.save();
          AdminUI.toast('Тема «' + name + '» сохранена');
          render(container);
        }
      });
    });

    container.appendChild(
      AdminUI.card('Готовые темы', [presetsGrid, AdminUI.divider(), saveThemeBtn], { badge: 'Пресеты' })
    );

    // E. Export / Import
    var exportBtn = document.createElement('button');
    exportBtn.className = 'btn btn-primary';
    exportBtn.textContent = 'Экспорт конфигурации';
    exportBtn.addEventListener('click', function() {
      var data = JSON.stringify(AdminStore.data, null, 2);
      var blob = new Blob([data], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'zhivoyput-config.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      AdminUI.toast('Конфигурация экспортирована');
    });

    var importBtn = document.createElement('button');
    importBtn.className = 'btn btn-secondary';
    importBtn.textContent = 'Импорт конфигурации';
    var importFile = document.createElement('input');
    importFile.type = 'file';
    importFile.accept = '.json';
    importFile.style.display = 'none';
    importBtn.addEventListener('click', function() { importFile.click(); });
    importFile.addEventListener('change', function(e) {
      var file = e.target.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function(ev) {
        try {
          var imported = JSON.parse(ev.target.result);
          AdminStore.data = imported;
          AdminStore.save();
          AdminUI.toast('Конфигурация импортирована. Перезагрузка...');
          setTimeout(function() { location.reload(); }, 800);
        } catch (err) {
          AdminUI.toast('Ошибка: неверный формат JSON');
        }
      };
      reader.readAsText(file);
    });

    var importWrap = document.createElement('div');
    importWrap.appendChild(importBtn);
    importWrap.appendChild(importFile);

    container.appendChild(
      AdminUI.card('Экспорт / Импорт', [
        AdminUI.row([exportBtn, importWrap])
      ])
    );
  }

  AdminRouter.register('theme', {
    section: 'management',
    title: 'Тема и стили',
    icon: '🎨',
    render: render
  });

})();
