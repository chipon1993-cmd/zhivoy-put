/* panel-navigator.js — Navigator + Principles Editor */
(function() {
  'use strict';

  AdminRouter.register('navigator', {
    section: 'content',
    title: 'Навигатор',
    icon: '🧭',
    render: renderNavigatorPanel
  });

  function renderNavigatorPanel(container) {
    // Card: Секция «Навигатор»
    container.appendChild(
      AdminUI.card('Секция «Навигатор»', [
        AdminUI.field({ type: 'text', key: 'nav-title', label: 'Заголовок' }),
        AdminUI.field({ type: 'richtext', key: 'nav-desc', label: 'Описание' }),
        AdminUI.field({ type: 'text', key: 'nav-input-title', label: 'Заголовок текстовой области' }),
        AdminUI.field({ type: 'text', key: 'nav-placeholder', label: 'Placeholder' })
      ])
    );

    // Card: Принципы
    var principlesList = document.createElement('div');
    principlesList.id = 'principles-list';

    var addBtn = document.createElement('button');
    addBtn.className = 'btn btn-secondary';
    addBtn.textContent = 'Добавить принцип';
    addBtn.addEventListener('click', function() {
      var principles = AdminStore.data.principles;
      principles.push({ title: 'Новый принцип', desc: 'Описание принципа' });
      AdminStore.data.principles = principles;
      renderPrinciplesList(principlesList);
    });

    container.appendChild(
      AdminUI.card('Принципы', [principlesList, addBtn])
    );

    renderPrinciplesList(principlesList);
  }

  function renderPrinciplesList(listEl) {
    listEl.innerHTML = '';
    var principles = AdminStore.data.principles || [];

    principles.forEach(function(principle, index) {
      var item = AdminUI.listItem({
        name: principle.title || '',
        sub: principle.desc || '',
        actions: [
          { icon: '🗑', title: 'Удалить', onClick: function() { removePrinciple(index, listEl); } }
        ]
      });

      // Replace static text with inline inputs
      var content = item.querySelector('.list-item-content') || item;
      var nameEl = content.querySelector('.list-item-name') || content.querySelector('[class*="name"]');
      var subEl = content.querySelector('.list-item-sub') || content.querySelector('[class*="sub"]');

      if (nameEl) {
        var titleInput = document.createElement('input');
        titleInput.type = 'text';
        titleInput.className = 'input input-sm';
        titleInput.value = principle.title || '';
        titleInput.placeholder = 'Заголовок принципа';
        titleInput.addEventListener('input', function() {
          AdminStore.data.principles[index].title = this.value;
          AdminStore.set('principles', AdminStore.data.principles);
        });
        nameEl.parentNode.replaceChild(titleInput, nameEl);
      }

      if (subEl) {
        var descInput = document.createElement('input');
        descInput.type = 'text';
        descInput.className = 'input input-sm';
        descInput.value = principle.desc || '';
        descInput.placeholder = 'Описание принципа';
        descInput.addEventListener('input', function() {
          AdminStore.data.principles[index].desc = this.value;
          AdminStore.set('principles', AdminStore.data.principles);
        });
        subEl.parentNode.replaceChild(descInput, subEl);
      }

      listEl.appendChild(item);
    });
  }

  function removePrinciple(index, listEl) {
    var principles = AdminStore.data.principles;
    principles.splice(index, 1);
    AdminStore.set('principles', principles);
    renderPrinciplesList(listEl);
  }

})();
