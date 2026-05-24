/* ============================================================
   Panel: Triggers — Триггеры editor
   Route: 'triggers' | Section: 'content'
   ============================================================ */
;(function () {
  'use strict';

  AdminRouter.register('triggers', {
    title: 'Триггеры',
    icon: '⚡',
    section: 'content',

    render(container) {
      const { field, card, row } = AdminUI;
      const get = id => AdminStore.get(id);

      // Card: Секция
      container.appendChild(
        card('Секция', [
          field('text', { id: 'trig-title', label: 'Заголовок секции', value: get('trig-title') }),
          field('textarea', { id: 'trig-desc', label: 'Описание секции', value: get('trig-desc') })
        ])
      );

      // Dynamic triggers container
      const triggersWrap = document.createElement('div');
      triggersWrap.className = 'triggers-dynamic';
      container.appendChild(triggersWrap);

      function renderTriggers() {
        triggersWrap.innerHTML = '';
        const triggers = AdminStore.data.triggers || [];

        triggers.forEach((trigger, i) => {
          const deleteBtn = document.createElement('button');
          deleteBtn.className = 'btn btn-sm btn-danger';
          deleteBtn.textContent = '✕ Удалить';
          deleteBtn.addEventListener('click', () => {
            AdminStore.data.triggers.splice(i, 1);
            renderTriggers();
          });

          const headerEl = document.createElement('div');
          headerEl.className = 'card-header-extra';
          headerEl.appendChild(deleteBtn);

          const iconField = field('text', {
            id: 'trig-item-' + i + '-icon',
            label: 'Иконка',
            value: trigger.icon || ''
          });
          iconField.querySelector('input').addEventListener('input', (e) => {
            AdminStore.data.triggers[i].icon = e.target.value;
          });

          const titleField = field('text', {
            id: 'trig-item-' + i + '-title',
            label: 'Заголовок',
            value: trigger.title || ''
          });
          titleField.querySelector('input').addEventListener('input', (e) => {
            AdminStore.data.triggers[i].title = e.target.value;
          });

          const itemsValue = Array.isArray(trigger.items) ? trigger.items.join('\n') : '';
          const itemsField = field('textarea', {
            id: 'trig-item-' + i + '-items',
            label: 'Пункты (каждый с новой строки)',
            value: itemsValue
          });
          itemsField.querySelector('textarea').addEventListener('input', (e) => {
            AdminStore.data.triggers[i].items = e.target.value.split('\n').filter(s => s.trim() !== '');
          });

          const cardTitle = (trigger.icon || '⚡') + ' ' + (trigger.title || 'Триггер ' + (i + 1));
          const cardEl = card(cardTitle, [
            headerEl,
            row([iconField, titleField]),
            itemsField
          ]);

          triggersWrap.appendChild(cardEl);
        });

        // Add button
        const addBtn = document.createElement('button');
        addBtn.className = 'btn btn-outline btn-add';
        addBtn.textContent = '+ Добавить карточку';
        addBtn.addEventListener('click', () => {
          if (!AdminStore.data.triggers) AdminStore.data.triggers = [];
          AdminStore.data.triggers.push({ icon: '', title: '', items: [] });
          renderTriggers();
        });
        triggersWrap.appendChild(addBtn);
      }

      renderTriggers();
    }
  });
})();
