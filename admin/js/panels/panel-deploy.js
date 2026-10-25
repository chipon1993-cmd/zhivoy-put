/* ============================================================
   Panel: Deploy & Publish
   Route: deploy | Section: site

   One-click publish: saves all CMS data to GitHub → Vercel
   auto-deploys. No terminal, no git commands.
   ============================================================ */
(function () {
  'use strict';

  AdminRouter.register('deploy', {
    section: 'site',
    title: 'Публикация',
    icon: '🚀',
    render: render
  });

  function render(container) {
    container.innerHTML = '';

    var statusText = document.createElement('span');
    statusText.textContent = 'Проверка серверного подключения...';
    var statusDot = document.createElement('span');
    var verifyBtn = document.createElement('button');
    verifyBtn.className = 'btn btn-sm btn-secondary';
    verifyBtn.textContent = 'Проверить подключение';
    verifyBtn.addEventListener('click', verifyConnection);
    container.appendChild(AdminUI.card('Серверная публикация', [
      AdminUI.alert('info', 'Публикация выполняется сервером после проверки прав. Настройки подключения задаются в Vercel.'),
      statusDot, statusText, verifyBtn
    ]));
    verifyConnection();

    /* ─── 2. Publish Card ──────────────────────────────────────────── */

    var publishBtn = document.createElement('button');
    publishBtn.className = 'btn btn-primary';
    publishBtn.style.cssText = 'font-size:15px;padding:12px 32px;';
    publishBtn.innerHTML = '🚀 Опубликовать на сайт';
    publishBtn.addEventListener('click', doPublish);

    var lastPublish = localStorage.getItem('last_publish');
    var lastInfo = document.createElement('div');
    lastInfo.id = 'last-publish-info';
    lastInfo.style.cssText = 'font-size:12px;color:var(--muted);margin-top:12px;';
    lastInfo.textContent = lastPublish
      ? 'Последняя публикация: ' + new Date(lastPublish).toLocaleString('ru-RU')
      : 'Ещё не публиковалось';

    var progressBar = document.createElement('div');
    progressBar.id = 'publish-progress';
    progressBar.style.cssText = 'display:none;margin-top:12px;';

    container.appendChild(AdminUI.card('Публикация', [
      AdminUI.alert('warning',
        'Нажмите кнопку чтобы опубликовать все изменения. Сайт обновится через 1-2 минуты.'
      ),
      publishBtn,
      progressBar,
      lastInfo
    ]));

    /* ─── 3. Pull Card ─────────────────────────────────────────────── */

    var pullBtn = document.createElement('button');
    pullBtn.className = 'btn btn-sm btn-secondary';
    pullBtn.innerHTML = '📥 Загрузить данные с GitHub';
    pullBtn.addEventListener('click', doPull);

    container.appendChild(AdminUI.card('Загрузка с сервера', [
      AdminUI.alert('info',
        'Загрузите последнюю версию контента из репозитория. Перезапишет локальные данные.'
      ),
      pullBtn
    ]));

    /* ─── 4. Recent Activity ───────────────────────────────────────── */

    var historyList = document.createElement('div');
    historyList.id = 'deploy-history';
    historyList.style.cssText = 'display:flex;flex-direction:column;gap:8px;';
    historyList.innerHTML = '<span style="color:var(--muted);font-size:13px;">Загрузка...</span>';

    container.appendChild(AdminUI.card('Последние коммиты', [historyList]));

    loadHistory();

    /* ─── Functions ────────────────────────────────────────────────── */

    function verifyConnection() {
      statusText.textContent = 'Проверка...';
      statusDot.style.background = '#f2c96d';

      GitHubSync.verifyConnection().then(function (result) {
        if (result.ok) {
          statusDot.style.background = '#56d364';
          statusText.textContent = '✓ Подключено: ' + result.repo;
          AdminUI.toast('✓ GitHub подключён');
          loadHistory();
        } else {
          statusDot.style.background = '#f85149';
          statusText.textContent = '✗ Ошибка: ' + result.error;
          AdminUI.toast('Ошибка подключения: ' + result.error);
        }
      });
    }

    function doPublish() {
      if (!GitHubSync.isConfigured()) {
        AdminUI.toast('Проверьте серверное подключение к GitHub');
        return;
      }

      // Save to AdminStore first
      publishBtn.disabled = true;
      publishBtn.textContent = '⏳ Публикация...';
      progressBar.style.display = 'block';
      progressBar.innerHTML = '<div style="background:var(--gold-dim);border-radius:8px;overflow:hidden;height:6px;">' +
        '<div style="background:var(--gold);height:100%;width:0%;border-radius:8px;transition:width 0.5s;" id="pub-bar"></div></div>' +
        '<div style="font-size:12px;color:var(--muted);margin-top:6px;" id="pub-status">Сохранение данных...</div>';

      var bar = document.getElementById('pub-bar');
      var status = document.getElementById('pub-status');

      if (bar) bar.style.width = '30%';
      if (status) status.textContent = 'Отправка на GitHub...';

      AdminStore.save().then(function (saved) {
        if (!saved) throw new Error('Облачное сохранение не подтверждено');
        return GitHubSync.publish();
      }).then(function (result) {
        if (bar) bar.style.width = '100%';
        if (status) status.textContent = '✓ Опубликовано! Vercel деплоит...';
        publishBtn.textContent = '✓ Опубликовано';
        publishBtn.disabled = false;

        lastInfo.textContent = 'Последняя публикация: ' + new Date().toLocaleString('ru-RU');
        AdminUI.toast('🚀 Опубликовано! Сайт обновится через 1-2 минуты');

        setTimeout(function () {
          publishBtn.innerHTML = '🚀 Опубликовать на сайт';
          progressBar.style.display = 'none';
        }, 4000);

        loadHistory();
      }).catch(function (err) {
        if (bar) bar.style.width = '0%';
        if (status) status.textContent = '✗ Ошибка: ' + err.message;
        publishBtn.textContent = '🚀 Опубликовать на сайт';
        publishBtn.disabled = false;
        AdminUI.toast('Ошибка публикации: ' + err.message);
      });
    }

    function doPull() {
      if (!GitHubSync.isConfigured()) {
        AdminUI.toast('Проверьте серверное подключение к GitHub');
        return;
      }

      pullBtn.disabled = true;
      pullBtn.textContent = '⏳ Загрузка...';

      GitHubSync.pull().then(function (data) {
        if (!data) {
          AdminUI.toast('Данные на GitHub не найдены');
          pullBtn.textContent = '📥 Загрузить данные с GitHub';
          pullBtn.disabled = false;
          return;
        }

        // Apply to AdminStore
        var store = AdminStore;
        if (data.content) {
          Object.keys(data.content).forEach(function (k) {
            store.data.content[k] = data.content[k];
          });
        }
        if (data.menu) store.data.menu = data.menu;
        if (data.territories) store.data.territories = data.territories;
        if (data.triggers) store.data.triggers = data.triggers;
        if (data.principles) store.data.principles = data.principles;
        if (data.roadmap) store.data.roadmap = data.roadmap;
        if (data.pages) store.data.pages = data.pages;
        if (data.themes) store.data.themes = data.themes;

        return store.save().then(function (saved) {
        if (!saved) throw new Error('Облачное сохранение не подтверждено');
        AdminUI.toast('✓ Данные загружены и применены');
        pullBtn.textContent = '✓ Загружено';
        pullBtn.disabled = false;

        setTimeout(function () {
          pullBtn.textContent = '📥 Загрузить данные с GitHub';
          location.reload();
        }, 1500);
        });
      }).catch(function (err) {
        AdminUI.toast('Ошибка: ' + err.message);
        pullBtn.textContent = '📥 Загрузить данные с GitHub';
        pullBtn.disabled = false;
      });
    }

    function loadHistory() {
      if (!GitHubSync.isConfigured()) {
        historyList.innerHTML = '<span style="color:var(--muted);font-size:13px;">Серверное подключение проверяется</span>';
        return;
      }

      GitHubSync.getRecentCommits(6).then(function (commits) {
        if (!commits.length) {
          historyList.innerHTML = '<span style="color:var(--muted);font-size:13px;">Нет коммитов</span>';
          return;
        }

        historyList.innerHTML = '';
        commits.forEach(function (c) {
          var row = document.createElement('div');
          row.style.cssText = 'display:flex;align-items:center;gap:10px;padding:8px 12px;' +
            'background:rgba(255,255,255,0.03);border-radius:8px;font-size:13px;';

          var sha = document.createElement('code');
          sha.style.cssText = 'color:var(--gold);font-size:11px;font-family:monospace;flex-shrink:0;';
          sha.textContent = c.sha;

          var msg = document.createElement('span');
          msg.style.cssText = 'flex:1;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
          msg.textContent = c.message.split('\n')[0];

          var date = document.createElement('span');
          date.style.cssText = 'color:var(--muted);font-size:11px;flex-shrink:0;';
          date.textContent = new Date(c.date).toLocaleString('ru-RU', {
            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
          });

          row.appendChild(sha);
          row.appendChild(msg);
          row.appendChild(date);
          historyList.appendChild(row);
        });
      }).catch(function (err) { historyList.textContent = err.message; });
    }
  }

})();
