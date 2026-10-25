/** Browser facade for the authorized publication API. No GitHub credentials. */
(function () {
  'use strict';
  var configured = false;
  var contentSha;
  var pageShas = {};
  try { localStorage.removeItem('github_pat'); } catch (_) {}
  function request(action, method, payload) {
    return ZhivoyAuth.request('/api/github' + (method ? '' : '?action=' + action), method ? {
      method: method, body: JSON.stringify(Object.assign({ action: action }, payload || {}))
    } : undefined);
  }
  async function verifyConnection() {
    try {
      var result = await request('status');
      configured = result.ok && result.publishEnabled;
      return Object.assign({}, result, { ok: configured, error: configured ? null : 'Публикация отключена на сервере' });
    } catch (err) { configured = false; return { ok: false, error: err.message }; }
  }
  window.GitHubSync = {
    isConfigured: function () { return configured; },
    verifyConnection: verifyConnection,
    publish: async function () {
      if (!window.AdminStore || !AdminStore.data) throw new Error('Контент не загружен');
      var result = await request('publish', 'POST', { data: AdminStore.data, expectedSha: contentSha });
      contentSha = result.sha;
      localStorage.setItem('last_publish', new Date().toISOString());
      return result;
    },
    publishPage: async function (slug, title, html, css) {
      var result = await request('page', 'POST', { slug: slug, title: title, html: html, css: css, expectedSha: pageShas[slug] });
      pageShas[slug] = result.sha;
      return result;
    },
    pull: async function () { var result = await request('pull'); contentSha = result.sha; return result.data; },
    getRecentCommits: async function () { return (await request('history')).commits; }
  };
  ZhivoyAuth.ready.then(verifyConnection);
})();
