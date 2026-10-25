/** Server-verified session. Browser state is presentation only. */
(function () {
  'use strict';
  var current = null;
  ['zhivoyput_users', 'zhivoyput_session', 'github_pat'].forEach(function (key) {
    try { localStorage.removeItem(key); } catch (_) {}
  });
  async function request(path, options) {
    options = options || {};
    var response = await fetch(path, Object.assign({}, options, {
      credentials: 'same-origin', cache: 'no-store',
      headers: Object.assign({ 'Content-Type': 'application/json', 'X-Requested-With': 'zhivoy-put' }, options.headers || {})
    }));
    var result = await response.json();
    if (!response.ok) {
      if (response.status === 401) { current = null; updateAuthUI(); }
      throw new Error(result.error || 'Ошибка сервера');
    }
    return result;
  }
  async function refresh() {
    var result = await request('/api/auth');
    current = result.session;
    updateAuthUI();
    return current;
  }
  async function action(payload) {
    try { return await request('/api/auth', { method: 'POST', body: JSON.stringify(payload) }); }
    catch (err) { return { success: false, error: err.message }; }
  }
  async function login(email, password) {
    var result = await action({ action: 'login', email: email, password: password });
    if (result.success) {
      try { await refresh(); } catch (err) { return { success: false, error: err.message }; }
    }
    return result;
  }
  function register(email, name, password) {
    return action({ action: 'register', email: email, name: name, password: password });
  }
  async function logout() {
    var result = await action({ action: 'logout' });
    if (!result.success) throw new Error(result.error);
    current = null; updateAuthUI();
  }
  function getSession() { return current; }
  function isAdmin() { return !!(current && current.isAdmin); }
  // ─── UI Update ────────────────────────────────────────────────────────────

  /**
   * Update the #auth-nav-slot in the header to show
   * login/register links OR the user name + logout.
   */
  function updateAuthUI() {
    var slot = document.getElementById('auth-nav-slot');
    if (!slot) return;

    var path = window.location.pathname;
    var inSubfolder = path.includes('/pages/') || path.includes('/admin/');
    var root = inSubfolder ? '../' : '';

    var session = getSession();

    if (session) {
      var adminLink = '';
      if (session.isAdmin) {
        adminLink = '<a href="' + root + 'admin/" class="auth-link-nav auth-admin">⚙</a>';
      }
      slot.innerHTML =
        '<span class="auth-user-nav">' +
          '<span class="auth-user-name">' + escapeHTML(session.name) + '</span>' +
          adminLink +
          '<a href="#" class="auth-link-nav auth-logout" id="auth-logout-btn">Выйти</a>' +
        '</span>';

      var logoutBtn = document.getElementById('auth-logout-btn');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', function (e) {
          e.preventDefault();
          logout().then(function () { window.location.reload(); }).catch(function (err) { alert(err.message); });
        });
      }
    } else {
      slot.innerHTML =
        '<a href="' + root + 'pages/login.html" class="auth-link-nav">Войти</a>' +
        '<a href="' + root + 'pages/register.html" class="auth-link-nav">Регистрация</a>';
    }
  }

  /**
   * Simple HTML escape for user-provided strings.
   */
  function escapeHTML(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }


  document.addEventListener('components-loaded', updateAuthUI);
  window.ZhivoyAuth = { register: register, login: login, logout: logout,
    getSession: getSession, isAdmin: isAdmin, updateAuthUI: updateAuthUI,
    request: request, refresh: refresh };
  window.ZhivoyAuth.ready = refresh().catch(function () { current = null; updateAuthUI(); return null; });
})();
