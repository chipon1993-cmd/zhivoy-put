/* ============================================================
   Panel: Typography — Font Picker + Typography Controls
   Route: 'typography' | Section: 'management'
   ============================================================ */
;(function () {
  'use strict';

  AdminRouter.register('typography', {
    title: 'Типографика',
    icon: '🔤',
    section: 'management',

    render(container) {
      const { field, card, row, alert, divider } = AdminUI;

      // ---- Alert ----
      container.appendChild(
        alert('info', 'Выберите шрифты и настройте размеры текста. Изменения применяются ко всему сайту.')
      );

      // ---- Card: Шрифты ----
      const fontHeadingField = field({ type: 'font', id: 'style-font-heading', label: 'Шрифт заголовков (H1, H2, H3)' });
      const fontBodyField = field({ type: 'font', id: 'style-font-body', label: 'Шрифт основного текста' });

      const weightHeadingField = field({
        type: 'select',
        id: 'style-font-weight-heading',
        label: 'Жирность заголовков',
        options: [
          { value: '400', label: '400 — Regular' },
          { value: '500', label: '500 — Medium' },
          { value: '600', label: '600 — Semi-Bold' },
          { value: '700', label: '700 — Bold' },
          { value: '800', label: '800 — Extra-Bold' },
          { value: '900', label: '900 — Black' }
        ]
      });

      const weightBodyField = field({
        type: 'select',
        id: 'style-font-weight-body',
        label: 'Жирность текста',
        options: [
          { value: '300', label: '300 — Light' },
          { value: '400', label: '400 — Regular' },
          { value: '500', label: '500 — Medium' },
          { value: '600', label: '600 — Semi-Bold' }
        ]
      });

      container.appendChild(
        card('Шрифты', [
          fontHeadingField,
          fontBodyField,
          divider(),
          row([weightHeadingField, weightBodyField])
        ], { badge: 'Google Fonts' })
      );

      // ---- Card: Размеры текста ----
      const h1SizeField = field({ type: 'range', id: 'style-h1-size', label: 'Заголовок H1 (px)', min: 32, max: 140, step: 2 });
      const h2SizeField = field({ type: 'range', id: 'style-h2-size', label: 'Заголовок H2 (px)', min: 24, max: 100, step: 2 });
      const bodySizeField = field({ type: 'range', id: 'style-body-size', label: 'Основной текст (px)', min: 12, max: 24, step: 1 });

      container.appendChild(
        card('Размеры текста', [
          row([h1SizeField, h2SizeField, bodySizeField])
        ])
      );

      // ---- Card: Интервалы ----
      const lineHeightField = field({ type: 'range', id: 'style-line-height', label: 'Межстрочный интервал', min: 1.0, max: 2.5, step: 0.05 });
      const letterSpacingField = field({ type: 'range', id: 'style-letter-spacing', label: 'Межбуквенный интервал (em)', min: -0.05, max: 0.15, step: 0.005 });

      container.appendChild(
        card('Интервалы', [
          row([lineHeightField, letterSpacingField])
        ])
      );

      // ---- Card: Предпросмотр типографики ----
      const previewEl = buildPreview();
      container.appendChild(
        card('Предпросмотр типографики', [previewEl])
      );

      // ---- Live preview logic ----
      function updatePreview() {
        const headingFont = AdminStore.get('style-font-heading') || 'Inter';
        const bodyFont = AdminStore.get('style-font-body') || 'Inter';
        const headingWeight = AdminStore.get('style-font-weight-heading') || '700';
        const bodyWeight = AdminStore.get('style-font-weight-body') || '400';
        const h1Size = AdminStore.get('style-h1-size') || 48;
        const h2Size = AdminStore.get('style-h2-size') || 36;
        const bodySize = AdminStore.get('style-body-size') || 16;
        const lineHeight = AdminStore.get('style-line-height') || 1.6;
        const letterSpacing = AdminStore.get('style-letter-spacing') || 0;

        // Load Google Fonts
        loadGoogleFont(headingFont);
        loadGoogleFont(bodyFont);

        // Apply styles to preview elements
        const h1El = previewEl.querySelector('.typo-preview-h1');
        const h2El = previewEl.querySelector('.typo-preview-h2');
        const bodyEl = previewEl.querySelector('.typo-preview-body');

        if (h1El) {
          h1El.style.fontFamily = "'" + headingFont + "', sans-serif";
          h1El.style.fontSize = h1Size + 'px';
          h1El.style.fontWeight = headingWeight;
        }
        if (h2El) {
          h2El.style.fontFamily = "'" + headingFont + "', sans-serif";
          h2El.style.fontSize = h2Size + 'px';
          h2El.style.fontWeight = headingWeight;
        }
        if (bodyEl) {
          bodyEl.style.fontFamily = "'" + bodyFont + "', sans-serif";
          bodyEl.style.fontSize = bodySize + 'px';
          bodyEl.style.fontWeight = bodyWeight;
          bodyEl.style.lineHeight = lineHeight;
          bodyEl.style.letterSpacing = letterSpacing + 'em';
        }
      }

      // Attach onChange listeners to all fields
      const allFields = [
        fontHeadingField, fontBodyField,
        weightHeadingField, weightBodyField,
        h1SizeField, h2SizeField, bodySizeField,
        lineHeightField, letterSpacingField
      ];

      allFields.forEach(function (fieldEl) {
        fieldEl.addEventListener('input', updatePreview);
        fieldEl.addEventListener('change', updatePreview);
      });

      // Initial preview render
      updatePreview();
    }
  });

  /* ---- Helper: Build preview DOM ---- */
  function buildPreview() {
    const wrap = document.createElement('div');
    wrap.className = 'typo-preview';

    // Inject scoped styles
    const style = document.createElement('style');
    style.textContent = [
      '.typo-preview {',
      '  background: #1a1a2e;',
      '  border-radius: 12px;',
      '  padding: 32px;',
      '  color: #e0e0e0;',
      '  overflow: hidden;',
      '}',
      '.typo-preview-h1 {',
      '  margin: 0 0 16px;',
      '  color: #ffffff;',
      '  transition: all .2s ease;',
      '}',
      '.typo-preview-h2 {',
      '  margin: 0 0 16px;',
      '  color: #c4b5fd;',
      '  transition: all .2s ease;',
      '}',
      '.typo-preview-body {',
      '  margin: 0;',
      '  color: #d1d5db;',
      '  max-width: 640px;',
      '  transition: all .2s ease;',
      '}',
      '.typo-preview-label {',
      '  font-size: 11px;',
      '  text-transform: uppercase;',
      '  letter-spacing: 0.08em;',
      '  color: #6b7280;',
      '  margin-bottom: 4px;',
      '}'
    ].join('\n');
    wrap.appendChild(style);

    // H1 sample
    const h1Label = document.createElement('div');
    h1Label.className = 'typo-preview-label';
    h1Label.textContent = 'H1';
    wrap.appendChild(h1Label);

    const h1 = document.createElement('div');
    h1.className = 'typo-preview-h1';
    h1.textContent = 'Живой путь';
    wrap.appendChild(h1);

    // H2 sample
    const h2Label = document.createElement('div');
    h2Label.className = 'typo-preview-label';
    h2Label.textContent = 'H2';
    wrap.appendChild(h2Label);

    const h2 = document.createElement('div');
    h2.className = 'typo-preview-h2';
    h2.textContent = 'Атлас территорий';
    wrap.appendChild(h2);

    // Body sample
    const bodyLabel = document.createElement('div');
    bodyLabel.className = 'typo-preview-label';
    bodyLabel.textContent = 'Body';
    wrap.appendChild(bodyLabel);

    const body = document.createElement('p');
    body.className = 'typo-preview-body';
    body.textContent = 'Каждая территория — это уникальное пространство, где сочетаются знания, практика и живое взаимодействие участников. Здесь рождаются идеи и формируются навыки для осознанной жизни.';
    wrap.appendChild(body);

    return wrap;
  }

  /* ---- Helper: Load Google Font dynamically ---- */
  const loadedFonts = {};

  function loadGoogleFont(fontName) {
    if (!fontName || loadedFonts[fontName]) return;
    loadedFonts[fontName] = true;

    const encoded = fontName.replace(/\s+/g, '+');
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=' + encoded + ':wght@400;500;600;700;800;900&display=swap';
    document.head.appendChild(link);
  }

})();
