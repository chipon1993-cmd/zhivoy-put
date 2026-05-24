/* ============================================================
   Panel: Atlas — Территории editor
   Route: 'atlas' | Section: 'content'
   ============================================================ */
;(function () {
  'use strict';

  AdminRouter.register('atlas', {
    title: 'Атлас территорий',
    icon: '🗺️',
    section: 'content',

    render(container) {
      const { field, card, row, alert } = AdminUI;
      const get = id => AdminStore.get(id);

      // Card: Секция
      container.appendChild(
        card('Секция', [
          field('text', { id: 'atlas-title', label: 'Заголовок секции', value: get('atlas-title') }),
          field('textarea', { id: 'atlas-desc', label: 'Описание секции', value: get('atlas-desc') })
        ])
      );

      // Dynamic territories container
      const territoriesWrap = document.createElement('div');
      territoriesWrap.className = 'territories-dynamic';
      container.appendChild(territoriesWrap);

      function renderTerritories() {
        territoriesWrap.innerHTML = '';
        const territories = AdminStore.data.territories || [];

        territories.forEach((territory, i) => {
          const deleteBtn = document.createElement('button');
          deleteBtn.className = 'btn btn-sm btn-danger';
          deleteBtn.textContent = '✕ Удалить';
          deleteBtn.addEventListener('click', () => {
            AdminStore.data.territories.splice(i, 1);
            renderTerritories();
          });

          const headerEl = document.createElement('div');
          headerEl.className = 'card-header-extra';
          headerEl.appendChild(deleteBtn);

          const iconField = field('text', {
            id: 'atlas-terr-' + i + '-icon',
            label: 'Иконка',
            value: territory.icon || '',
            attrs: { style: 'text-align:center;max-width:80px' }
          });
          iconField.querySelector('input').addEventListener('input', (e) => {
            AdminStore.data.territories[i].icon = e.target.value;
          });

          const nameField = field('text', {
            id: 'atlas-terr-' + i + '-name',
            label: 'Название',
            value: territory.name || ''
          });
          nameField.querySelector('input').addEventListener('input', (e) => {
            AdminStore.data.territories[i].name = e.target.value;
          });

          const descField = field('textarea', {
            id: 'atlas-terr-' + i + '-desc',
            label: 'Описание',
            value: territory.desc || ''
          });
          descField.querySelector('textarea').addEventListener('input', (e) => {
            AdminStore.data.territories[i].description = e.target.value;
          });

          const cardTitle = (territory.icon || '📍') + ' ' + (territory.name || 'Территория ' + (i + 1));
          const cardEl = card(cardTitle, [
            headerEl,
            row([iconField, nameField]),
            descField
          ]);

          territoriesWrap.appendChild(cardEl);
        });

        // Add button
        const addBtn = document.createElement('button');
        addBtn.className = 'btn btn-outline btn-add';
        addBtn.textContent = '+ Добавить территорию';
        addBtn.addEventListener('click', () => {
          if (!AdminStore.data.territories) AdminStore.data.territories = [];
          AdminStore.data.territories.push({ icon: '', name: '', description: '' });
          renderTerritories();
        });
        territoriesWrap.appendChild(addBtn);
      }

      renderTerritories();
    }
  });
})();
