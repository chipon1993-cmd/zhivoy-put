/* panel-roadmap.js — Roadmap + CTA + Footer Editor */
(function() {
  'use strict';

  AdminRouter.register('roadmap', {
    section: 'content',
    title: 'Дорожная карта',
    icon: '🛤',
    render: renderRoadmapPanel
  });

  function renderRoadmapPanel(container) {
    container.appendChild(
      AdminUI.card('Секция «Дорожная карта»', [
        AdminUI.field({ type: 'text', key: 'road-title', label: 'Заголовок' }),
        AdminUI.field({ type: 'richtext', key: 'road-desc', label: 'Описание' })
      ])
    );

    var stepsContainer = document.createElement('div');
    stepsContainer.id = 'roadmap-steps';

    var addStepBtn = document.createElement('button');
    addStepBtn.className = 'btn btn-secondary';
    addStepBtn.textContent = 'Добавить шаг';
    addStepBtn.style.marginTop = '12px';
    addStepBtn.addEventListener('click', function() {
      var roadmap = AdminStore.data.roadmap;
      roadmap.push({ title: 'Новый шаг', desc: 'Описание шага' });
      AdminStore.data.roadmap = roadmap;
      renderSteps(stepsContainer);
    });

    container.appendChild(stepsContainer);
    container.appendChild(addStepBtn);
    container.appendChild(AdminUI.divider());

    container.appendChild(
      AdminUI.card('CTA-секция (перед подвалом)', [
        AdminUI.field({ type: 'text', key: 'cta-line1', label: 'Заголовок (строка 1)' }),
        AdminUI.field({ type: 'text', key: 'cta-line2', label: 'Заголовок (акцентная строка 2)' }),
        AdminUI.field({ type: 'richtext', key: 'cta-desc', label: 'Описание' })
      ])
    );

    container.appendChild(
      AdminUI.card('Подвал (Footer)', [
        AdminUI.field({ type: 'textarea', key: 'footer-text', label: 'Текст подвала' }),
        AdminUI.field({ type: 'text', key: 'footer-note', label: 'Подпись' })
      ])
    );

    renderSteps(stepsContainer);
  }

  function renderSteps(stepsContainer) {
    stepsContainer.innerHTML = '';
    var roadmap = AdminStore.data.roadmap || [];

    roadmap.forEach(function(step, index) {
      var stepNum = String(index + 1).padStart(2, '0');
      var titleField = AdminUI.field({
        type: 'text',
        id: '_road-step-title-' + index,
        label: 'Заголовок',
        value: step.title || '',
        onChange: function(val) {
          AdminStore.data.roadmap[index].title = val;
        }
      });
      var descField = AdminUI.field({
        type: 'textarea',
        id: '_road-step-desc-' + index,
        label: 'Описание',
        value: step.desc || '',
        onChange: function(val) {
          AdminStore.data.roadmap[index].desc = val;
        }
      });

      stepsContainer.appendChild(
        AdminUI.card('Шаг ' + stepNum, [titleField, descField], {
          badge: 'Шаг ' + stepNum,
          actions: [
            { icon: '🗑', title: 'Удалить шаг', onClick: function() { removeStep(index, stepsContainer); } }
          ]
        })
      );
    });
  }

  function removeStep(index, stepsContainer) {
    var roadmap = AdminStore.data.roadmap;
    roadmap.splice(index, 1);
    AdminStore.data.roadmap = roadmap;
    renderSteps(stepsContainer);
  }

})();
