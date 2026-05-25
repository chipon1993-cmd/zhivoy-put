/* ============================================================
   GitHubSync — Push/Pull CMS data to GitHub repository

   Uses GitHub Contents API to commit cms-data.json directly,
   which triggers Vercel auto-deploy. No terminal needed.

   Token is stored in localStorage (never committed to repo).
   ============================================================ */
(function () {
  'use strict';

  var REPO_OWNER = 'chipon1993-cmd';
  var REPO_NAME  = 'zhivoy-put';
  var DATA_FILE  = 'data/cms-data.json';
  var API_BASE   = 'https://api.github.com';
  var TOKEN_KEY  = 'github_pat';

  /* ─── Token Management ───────────────────────────────────────────── */

  function getToken() {
    return localStorage.getItem(TOKEN_KEY) || '';
  }

  function setToken(token) {
    localStorage.setItem(TOKEN_KEY, token.trim());
  }

  function clearToken() {
    localStorage.removeItem(TOKEN_KEY);
  }

  function isConfigured() {
    return getToken().length > 10;
  }

  /* ─── API Helpers ────────────────────────────────────────────────── */

  function apiHeaders() {
    return {
      'Authorization': 'Bearer ' + getToken(),
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28'
    };
  }

  function apiUrl(path) {
    return API_BASE + '/repos/' + REPO_OWNER + '/' + REPO_NAME + '/' + path;
  }

  /* ─── Get file SHA (needed to update existing file) ──────────────── */

  function getFileSHA() {
    return fetch(apiUrl('contents/' + DATA_FILE), {
      headers: apiHeaders()
    })
    .then(function (res) {
      if (res.status === 404) return null;
      if (!res.ok) throw new Error('GitHub API: ' + res.status);
      return res.json();
    })
    .then(function (data) {
      return data ? data.sha : null;
    });
  }

  /* ─── Publish (push all CMS data to repo) ────────────────────────── */

  function publish(commitMessage) {
    if (!isConfigured()) {
      return Promise.reject(new Error('GitHub токен не настроен'));
    }

    var store = window.AdminStore;
    if (!store || !store.data) {
      return Promise.reject(new Error('AdminStore не инициализирован'));
    }

    // Collect all CMS data
    var payload = {
      _meta: {
        version: 1,
        updatedAt: new Date().toISOString(),
        source: 'admin-panel'
      },
      content: store.data.content,
      menu: store.data.menu,
      territories: store.data.territories,
      triggers: store.data.triggers,
      principles: store.data.principles,
      roadmap: store.data.roadmap,
      pages: store.data.pages,
      themes: store.data.themes
    };

    var jsonStr = JSON.stringify(payload, null, 2);
    // Base64 encode (handle UTF-8)
    var encoded = btoa(unescape(encodeURIComponent(jsonStr)));

    return getFileSHA().then(function (sha) {
      var body = {
        message: commitMessage || '📝 Обновление контента из админки',
        content: encoded,
        branch: 'master'
      };
      if (sha) body.sha = sha;

      return fetch(apiUrl('contents/' + DATA_FILE), {
        method: 'PUT',
        headers: apiHeaders(),
        body: JSON.stringify(body)
      });
    })
    .then(function (res) {
      if (!res.ok) {
        return res.json().then(function (err) {
          throw new Error(err.message || 'Ошибка публикации');
        });
      }
      return res.json();
    })
    .then(function (result) {
      // Save last publish timestamp
      localStorage.setItem('last_publish', new Date().toISOString());
      return result;
    });
  }

  /* ─── Pull (read CMS data from repo) ─────────────────────────────── */

  function pull() {
    if (!isConfigured()) {
      return Promise.reject(new Error('GitHub токен не настроен'));
    }

    return fetch(apiUrl('contents/' + DATA_FILE), {
      headers: apiHeaders()
    })
    .then(function (res) {
      if (res.status === 404) return null;
      if (!res.ok) throw new Error('GitHub API: ' + res.status);
      return res.json();
    })
    .then(function (data) {
      if (!data || !data.content) return null;
      // Decode base64
      var decoded = decodeURIComponent(escape(atob(data.content.replace(/\n/g, ''))));
      return JSON.parse(decoded);
    });
  }

  /* ─── Verify token works ─────────────────────────────────────────── */

  function verifyToken() {
    if (!isConfigured()) {
      return Promise.resolve({ ok: false, error: 'Токен не задан' });
    }

    return fetch(apiUrl(''), {
      headers: apiHeaders()
    })
    .then(function (res) {
      if (res.ok) {
        return res.json().then(function (repo) {
          return {
            ok: true,
            repo: repo.full_name,
            private: repo.private,
            permissions: repo.permissions
          };
        });
      }
      return { ok: false, error: 'Статус ' + res.status };
    })
    .catch(function (err) {
      return { ok: false, error: err.message };
    });
  }

  /* ─── Get latest commits ─────────────────────────────────────────── */

  function getRecentCommits(count) {
    return fetch(apiUrl('commits?per_page=' + (count || 5)), {
      headers: apiHeaders()
    })
    .then(function (res) {
      if (!res.ok) return [];
      return res.json();
    })
    .then(function (commits) {
      return commits.map(function (c) {
        return {
          sha: c.sha.substring(0, 7),
          message: c.commit.message,
          date: c.commit.author.date,
          author: c.commit.author.name
        };
      });
    })
    .catch(function () { return []; });
  }

  /* ─── Expose globally ────────────────────────────────────────────── */

  window.GitHubSync = {
    getToken: getToken,
    setToken: setToken,
    clearToken: clearToken,
    isConfigured: isConfigured,
    publish: publish,
    pull: pull,
    verifyToken: verifyToken,
    getRecentCommits: getRecentCommits
  };

})();
