/* panel-pages.js — Page Manager with Templates */
(function() {
  'use strict';

  var STATIC_PAGES = [
    { name: '🏠 Главная', file: 'index.html', desc: 'index.html — основная страница', href: '../index.html' },
    { name: 'Путь', file: 'triptych.html', desc: 'triptych.html', href: '../triptych.html' },
    { name: 'Карта', file: 'atlas.html', desc: 'atlas.html', href: '../atlas.html' },
    { name: 'Триггеры', file: 'triggers.html', desc: 'triggers.html', href: '../triggers.html' },
    { name: 'Навигатор', file: 'navigator.html', desc: 'navigator.html', href: '../navigator.html' },
    { name: 'Система', file: 'roadmap.html', desc: 'roadmap.html', href: '../roadmap.html' }
  ];

  var TEMPLATES = [
    { value: 'blank', label: 'Пустая страница' },
    { value: 'text', label: 'Текстовая страница' },
    { value: 'gallery', label: 'Галерея / Карточки' }
  ];

  AdminRouter.register('pages', {
    section: 'management',
    title: 'Страницы',
    icon: '📄',
    render: renderPagesPanel
  });

  function renderPagesPanel(container) {
    // Alert
    container.appendChild(AdminUI.alert('info', 'Создавайте новые страницы. Страницы используют общие CSS и JS файлы сайта.'));

    // Card: Страницы сайта
    var pagesCard = AdminUI.card('Страницы сайта', {
      actions: [
        { icon: '+', text: 'Новая страница', onClick: function() { openNewPageModal(pagesList); } }
      ]
    });

    var pagesList = document.createElement('div');
    pagesList.id = 'pages-list';
    var cardBody = pagesCard.querySelector('.card-body');
    if (cardBody) cardBody.appendChild(pagesList);
    else pagesCard.appendChild(pagesList);
    container.appendChild(pagesCard);

    renderPagesList(pagesList);
  }

  function renderPagesList(listEl) {
    listEl.innerHTML = '';

    // Static pages
    STATIC_PAGES.forEach(function(page) {
      var item = AdminUI.listItem({
        name: page.name,
        sub: page.desc,
        actions: [
          { icon: '🔗', title: 'Открыть', onClick: function() { window.open(page.href, '_blank'); } }
        ]
      });
      listEl.appendChild(item);
    });

    // Dynamic pages
    var pages = AdminStore.data.pages || [];
    pages.forEach(function(page, index) {
      var item = AdminUI.listItem({
        name: page.name,
        sub: page.filename,
        actions: [
          { icon: '🔗', title: 'Открыть', onClick: function() { window.open('../' + page.filename, '_blank'); } },
          { icon: '🗑', title: 'Удалить', onClick: function() { removePage(index, listEl); } }
        ]
      });
      listEl.appendChild(item);
    });
  }

  function openNewPageModal(listEl) {
    var nameField = AdminUI.field({
      type: 'text',
      id: '_page-name',
      label: 'Название страницы',
      value: ''
    });

    var fileField = AdminUI.field({
      type: 'text',
      id: '_page-file',
      label: 'Имя файла (например, about.html)',
      value: ''
    });

    var templateField = AdminUI.field({
      type: 'select',
      id: '_page-template',
      label: 'Шаблон',
      options: TEMPLATES,
      value: 'blank'
    });

    var contentField = AdminUI.field({
      type: 'textarea',
      id: '_page-content',
      label: 'Начальный контент',
      value: ''
    });

    var content = document.createElement('div');
    content.appendChild(nameField);
    content.appendChild(fileField);
    content.appendChild(templateField);
    content.appendChild(contentField);

    AdminUI.modal({
      title: 'Новая страница',
      body: content,
      onSave: function() {
        var nameInput = nameField.querySelector('input');
        var fileInput = fileField.querySelector('input');
        var templateSelect = templateField.querySelector('select');
        var contentInput = contentField.querySelector('textarea');

        var pageName = nameInput ? nameInput.value.trim() : '';
        var filename = fileInput ? fileInput.value.trim() : '';
        var template = templateSelect ? templateSelect.value : 'blank';
        var initialContent = contentInput ? contentInput.value.trim() : '';

        if (!pageName || !filename) {
          AdminUI.toast('Укажите название и имя файла', 'error');
          return;
        }

        // Ensure .html extension
        if (filename.indexOf('.html') === -1) {
          filename += '.html';
        }

        // Generate HTML
        var html = generatePageHTML(pageName, template, initialContent);

        // Download as file
        downloadFile(filename, html);

        // Save to store (write to top-level data.pages, not data.content)
        var pages = AdminStore.data.pages || [];
        pages.push({ name: pageName, filename: filename, template: template });
        AdminStore.data.pages = pages;
        AdminStore.save();

        AdminUI.toast('Страница создана и скачана', 'success');
        renderPagesList(listEl);
      }
    });
  }

  function generatePageHTML(title, template, initialContent) {
    var bodyContent = '';

    switch (template) {
      case 'text':
        bodyContent =
          '    <article class="page-article">\n' +
          '      <h2>' + escapeHTML(title) + '</h2>\n' +
          '      <div class="article-content">\n' +
          '        ' + (initialContent ? '<p>' + escapeHTML(initialContent) + '</p>' : '<p>Содержимое страницы...</p>') + '\n' +
          '      </div>\n' +
          '    </article>';
        break;
      case 'gallery':
        bodyContent =
          '    <section class="page-gallery">\n' +
          '      <h2>' + escapeHTML(title) + '</h2>\n' +
          '      ' + (initialContent ? '<p>' + escapeHTML(initialContent) + '</p>' : '') + '\n' +
          '      <div class="card-grid card-grid--3">\n' +
          '        <div class="card"><h3>Карточка 1</h3><p>Описание</p></div>\n' +
          '        <div class="card"><h3>Карточка 2</h3><p>Описание</p></div>\n' +
          '        <div class="card"><h3>Карточка 3</h3><p>Описание</p></div>\n' +
          '      </div>\n' +
          '    </section>';
        break;
      default: // blank
        bodyContent =
          '    <section class="page-section">\n' +
          '      <h2>' + escapeHTML(title) + '</h2>\n' +
          '      ' + (initialContent ? '<p>' + escapeHTML(initialContent) + '</p>' : '<p>Содержимое страницы...</p>') + '\n' +
          '    </section>';
        break;
    }

    return '<!DOCTYPE html>\n' +
      '<html lang="ru">\n' +
      '<head>\n' +
      '  <meta charset="UTF-8">\n' +
      '  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
      '  <title>' + escapeHTML(title) + '</title>\n' +
      '  <link rel="stylesheet" href="../css/variables.css">\n' +
      '  <link rel="stylesheet" href="../css/base.css">\n' +
      '  <link rel="stylesheet" href="../css/atmosphere.css">\n' +
      '  <link rel="stylesheet" href="../css/layout.css">\n' +
      '  <link rel="stylesheet" href="../css/components.css">\n' +
      '  <link rel="stylesheet" href="../css/header.css">\n' +
      '  <link rel="stylesheet" href="../css/footer.css">\n' +
      '  <link rel="stylesheet" href="../css/responsive.css">\n' +
      '</head>\n' +
      '<body>\n' +
      '  <div id="site-header"></div>\n' +
      '\n' +
      '  <main>\n' +
      bodyContent + '\n' +
      '  </main>\n' +
      '\n' +
      '  <div id="site-footer"></div>\n' +
      '\n' +
      '  <script src="../js/components.js"><\/script>\n' +
      '  <script src="../js/auth.js"><\/script>\n' +
      '  <script src="../js/cms-loader.js"><\/script>\n' +
      '</body>\n' +
      '</html>';
  }

  function downloadFile(filename, content) {
    var blob = new Blob([content], { type: 'text/html;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function removePage(index, listEl) {
    AdminUI.confirm('Удалить эту страницу из списка?').then(function(yes) {
      if (!yes) return;
      var pages = AdminStore.data.pages;
      pages.splice(index, 1);
      AdminStore.data.pages = pages;
      AdminStore.save();
      renderPagesList(listEl);
    });
  }

  function escapeHTML(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

})();
