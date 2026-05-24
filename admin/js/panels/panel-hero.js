/* ============================================================
   Panel: Hero — Landing page content editor
   Route: 'hero' | Section: 'content'
   ============================================================ */
;(function () {
  'use strict';

  AdminRouter.register('hero', {
    title: 'Главный экран',
    icon: '🏠',
    section: 'content',

    render(container) {
      const { field, card, row, alert } = AdminUI;
      const get = id => AdminStore.get(id);

      // Info alert
      container.appendChild(
        alert('info', 'Редактируйте тексты главного экрана. Изменения применяются после «Сохранить».')
      );

      // Card: Заголовок и описание
      container.appendChild(
        card('Заголовок и описание', [
          field('text', { id: 'hero-kicker', label: 'Кикер (маленькая надпись)', value: get('hero-kicker') }),
          field('text', { id: 'hero-title-1', label: 'Заголовок (строка 1)', value: get('hero-title-1') }),
          field('text', { id: 'hero-title-2', label: 'Заголовок (акцентная часть)', value: get('hero-title-2') }),
          field('richtext', { id: 'hero-desc', label: 'Описание', value: get('hero-desc') })
        ], { badge: 'Hero' })
      );

      // Card: Кнопки действий
      container.appendChild(
        card('Кнопки действий', [
          row([
            field('text', { id: 'hero-btn1-text', label: 'Текст кнопки 1', value: get('hero-btn1-text') }),
            field('text', { id: 'hero-btn1-href', label: 'Ссылка кнопки 1', value: get('hero-btn1-href') })
          ]),
          row([
            field('text', { id: 'hero-btn2-text', label: 'Текст кнопки 2', value: get('hero-btn2-text') }),
            field('text', { id: 'hero-btn2-href', label: 'Ссылка кнопки 2', value: get('hero-btn2-href') })
          ])
        ])
      );

      // Card: Карточка «Суть системы»
      container.appendChild(
        card('Карточка «Суть системы»', [
          field('text', { id: 'hero-card-title', label: 'Заголовок карточки', value: get('hero-card-title') }),
          field('richtext', { id: 'hero-card-text', label: 'Текст карточки', value: get('hero-card-text') })
        ])
      );
    }
  });
})();
