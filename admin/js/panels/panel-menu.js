/* panel-menu.js — Menu Editor with Drag-Drop */
(function() {
  'use strict';

  AdminRouter.register('menu', {
    section: 'management',
    title: 'Меню и навигация',
    icon: '☰',
    render: renderMenuPanel
  });

  function renderMenuPanel(container) {
    container.appendChild(AdminUI.alert('info', 'Управляйте пунктами меню. Перетаскивайте для изменения порядка.'));

    var menuList = document.createElement('div');
    menuList.id = 'menu-items-list';

    var addBtn = document.createElement('button');
    addBtn.className = 'btn btn-secondary';
    addBtn.textContent = 'Добавить пункт меню';
    addBtn.addEventListener('click', function() {
      var menu = AdminStore.data.menu;
      menu.push({ name: 'Новый пункт', href: '#' });
      AdminStore.data.menu = menu;
      renderMenuList(menuList);
    });

    container.appendChild(
      AdminUI.card('Пункты меню', [menuList, addBtn])
    );

    container.appendChild(
      AdminUI.card('Кнопка CTA в меню', [
        AdminUI.row([
          AdminUI.field({ type: 'text', key: 'menu-cta-text', label: 'Текст CTA' }),
          AdminUI.field({ type: 'text', key: 'menu-cta-href', label: 'Ссылка CTA' })
        ])
      ])
    );

    renderMenuList(menuList);
  }

  function renderMenuList(listEl) {
    listEl.innerHTML = '';
    var menu = AdminStore.data.menu || [];

    menu.forEach(function(item, index) {
      var listItem = AdminUI.listItem({
        draggable: true,
        name: item.name,
        sub: item.href,
        actions: [
          { icon: '✏', title: 'Редактировать', onClick: function() { editMenuItem(index, listEl); } },
          { icon: '↑', title: 'Вверх', onClick: function() { moveItem(index, -1, listEl); } },
          { icon: '↓', title: 'Вниз', onClick: function() { moveItem(index, 1, listEl); } },
          { icon: '🗑', title: 'Удалить', onClick: function() { removeMenuItem(index, listEl); } }
        ]
      });
      listEl.appendChild(listItem);
    });

    if (typeof DragSort === 'function') {
      DragSort(listEl, function(newOrder) {
        var menu = AdminStore.data.menu;
        var reordered = newOrder.map(function(oldIndex) {
          return menu[oldIndex];
        });
        AdminStore.data.menu = reordered;
      });
    }
  }

  function editMenuItem(index, listEl) {
    var menu = AdminStore.data.menu;
    var item = menu[index];

    var nameField = AdminUI.field({
      type: 'text',
      id: '_menu-edit-name',
      label: 'Название пункта',
      value: item.name || ''
    });

    var hrefField = AdminUI.field({
      type: 'text',
      id: '_menu-edit-href',
      label: 'Ссылка (href)',
      value: item.href || ''
    });

    var body = document.createElement('div');
    body.appendChild(nameField);
    body.appendChild(hrefField);

    AdminUI.modal({
      title: 'Редактировать пункт меню',
      body: body,
      onSave: function() {
        var nameInput = nameField.querySelector('input');
        var hrefInput = hrefField.querySelector('input');
        AdminStore.data.menu[index].name = nameInput ? nameInput.value : item.name;
        AdminStore.data.menu[index].href = hrefInput ? hrefInput.value : item.href;
        renderMenuList(listEl);
      }
    });
  }

  function moveItem(index, direction, listEl) {
    var menu = AdminStore.data.menu;
    var newIndex = index + direction;
    if (newIndex < 0 || newIndex >= menu.length) return;

    var temp = menu[index];
    menu[index] = menu[newIndex];
    menu[newIndex] = temp;
    AdminStore.data.menu = menu;
    renderMenuList(listEl);
  }

  function removeMenuItem(index, listEl) {
    AdminUI.confirm('Удалить этот пункт меню?').then(function(yes) {
      if (!yes) return;
      var menu = AdminStore.data.menu;
      menu.splice(index, 1);
      AdminStore.data.menu = menu;
      renderMenuList(listEl);
    });
  }

})();
