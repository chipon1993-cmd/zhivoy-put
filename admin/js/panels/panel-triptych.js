/* ============================================================
   Panel: Triptych — До / Во время / После editor
   Route: 'triptych' | Section: 'content'
   ============================================================ */
;(function () {
  'use strict';

  AdminRouter.register('triptych', {
    title: 'До / Во время / После',
    icon: '🔮',
    section: 'content',

    render(container) {
      const { field, card } = AdminUI;
      const get = id => AdminStore.get(id);

      // Card: Секция
      container.appendChild(
        card('Секция', [
          field('text', { id: 'trip-title', label: 'Заголовок секции', value: get('trip-title') }),
          field('richtext', { id: 'trip-desc', label: 'Описание секции', value: get('trip-desc') })
        ])
      );

      // Cards for stages 1–3
      const badges = ['01', '02', '03'];
      for (let n = 1; n <= 3; n++) {
        container.appendChild(
          card('Этап ' + n, [
            field('text', { id: 'trip-' + n + '-title', label: 'Заголовок', value: get('trip-' + n + '-title') }),
            field('richtext', { id: 'trip-' + n + '-desc', label: 'Описание', value: get('trip-' + n + '-desc') }),
            field('text', { id: 'trip-' + n + '-tags', label: 'Теги (через запятую)', value: get('trip-' + n + '-tags') })
          ], { badge: badges[n - 1] })
        );
      }
    }
  });
})();
