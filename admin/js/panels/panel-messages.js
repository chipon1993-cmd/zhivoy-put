/* ============================================================
   Panel: Messages — Contact form submissions viewer
   Route: 'messages' | Section: 'management'
   ============================================================ */
;(function () {
  'use strict';

  AdminRouter.register('messages', {
    title: 'Сообщения',
    icon: '✉',
    section: 'management',

    render: function (container) {
      container.appendChild(
        AdminUI.alert('info', 'Сообщения с формы «Связаться». Данные хранятся в Supabase.')
      );

      var listEl = document.createElement('div');
      listEl.id = 'messages-list';
      container.appendChild(listEl);

      var loading = document.createElement('p');
      loading.style.cssText = 'color:var(--muted);font-size:14px;padding:20px 0;';
      loading.textContent = 'Загрузка сообщений...';
      listEl.appendChild(loading);

      if (window.SupabaseClient && window.SupabaseClient.isConnected()) {
        window.SupabaseClient.get('contact_messages').then(function (msgs) {
          listEl.innerHTML = '';

          if (!msgs || !Array.isArray(msgs) || msgs.length === 0) {
            var empty = document.createElement('div');
            empty.style.cssText = 'text-align:center;padding:3rem;color:var(--muted);';
            empty.innerHTML = '<div style="font-size:3rem;margin-bottom:1rem;">✉</div><p>Пока нет сообщений</p>';
            listEl.appendChild(empty);
            return;
          }

          var sorted = msgs.slice().reverse();

          var countBadge = document.createElement('div');
          countBadge.style.cssText = 'font-size:13px;color:var(--muted);margin-bottom:16px;';
          countBadge.textContent = 'Всего: ' + msgs.length + ' сообщений';
          listEl.appendChild(countBadge);

          sorted.forEach(function (msg, i) {
            var date = msg.date ? new Date(msg.date) : null;
            var dateStr = date ? date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';

            var card = AdminUI.card((msg.subject || 'Без темы'), [
              createInfoRow('От', msg.name || '—'),
              createInfoRow('Email', msg.email || '—'),
              createInfoRow('Дата', dateStr),
              createMessageBody(msg.message || '')
            ], {
              badge: dateStr ? date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }) : '',
              actions: [
                {
                  icon: '🗑',
                  title: 'Удалить',
                  danger: true,
                  onClick: function () {
                    AdminUI.confirm('Удалить это сообщение?').then(function (yes) {
                      if (!yes) return;
                      var remaining = msgs.filter(function (m) { return m !== msg; });
                      window.SupabaseClient.set('contact_messages', remaining).then(function () {
                        AdminUI.toast('Сообщение удалено');
                        AdminRouter.navigate('messages');
                      });
                    });
                  }
                }
              ]
            });

            listEl.appendChild(card);
          });
        });
      } else {
        listEl.innerHTML = '';
        var noConn = document.createElement('div');
        noConn.style.cssText = 'text-align:center;padding:3rem;color:var(--muted);';
        noConn.innerHTML = '<p>Нет подключения к Supabase</p>';
        listEl.appendChild(noConn);
      }
    }
  });

  function createInfoRow(label, value) {
    var row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:8px;font-size:13px;margin-bottom:6px;';
    var lbl = document.createElement('span');
    lbl.style.cssText = 'color:var(--muted);min-width:60px;';
    lbl.textContent = label + ':';
    var val = document.createElement('span');
    val.style.color = 'var(--text)';
    val.textContent = value;
    row.appendChild(lbl);
    row.appendChild(val);
    return row;
  }

  function createMessageBody(text) {
    var wrap = document.createElement('div');
    wrap.style.cssText = 'margin-top:12px;padding:12px;background:var(--bg);border-radius:8px;border:1px solid var(--border);font-size:14px;line-height:1.6;color:var(--text);white-space:pre-wrap;';
    wrap.textContent = text;
    return wrap;
  }

})();
