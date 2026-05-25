/**
 * Authentication System — Живой путь
 * localStorage-based auth with SHA-256 hashing via Web Crypto API.
 *
 * Storage keys:
 *   zhivoyput_users   — Array of user objects
 *   zhivoyput_session — Current session object (7-day expiry)
 */
(function () {
  'use strict';

  var USERS_KEY = 'zhivoyput_users';
  var SESSION_KEY = 'zhivoyput_session';
  var SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

  // ─── Utilities ────────────────────────────────────────────────────────────

  /**
   * Hash a password string with SHA-256, returns hex.
   */
  async function hashPassword(password) {
    var encoder = new TextEncoder();
    var data = encoder.encode(password);
    var buffer = await crypto.subtle.digest('SHA-256', data);
    var bytes = new Uint8Array(buffer);
    var hex = '';
    for (var i = 0; i < bytes.length; i++) {
      hex += bytes[i].toString(16).padStart(2, '0');
    }
    return hex;
  }

  /**
   * Generate a random token for sessions.
   */
  function generateToken() {
    var arr = new Uint8Array(32);
    crypto.getRandomValues(arr);
    var token = '';
    for (var i = 0; i < arr.length; i++) {
      token += arr[i].toString(16).padStart(2, '0');
    }
    return token;
  }

  /**
   * Get all users from storage.
   */
  function getUsers() {
    try {
      var raw = localStorage.getItem(USERS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  /**
   * Save users array to storage.
   */
  function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  // ─── Default admin bootstrap ──────────────────────────────────────────────

  async function ensureDefaultAdmin() {
    var users = getUsers();
    var adminExists = users.some(function (u) {
      return u.email === 'admin@zhivoyput.ru';
    });
    if (!adminExists) {
      var passwordHash = await hashPassword('admin123');
      users.push({
        email: 'admin@zhivoyput.ru',
        name: 'Админ',
        passwordHash: passwordHash,
        isAdmin: true,
        createdAt: new Date().toISOString()
      });
      saveUsers(users);
    }
  }

  // ─── Public API ───────────────────────────────────────────────────────────

  /**
   * Register a new user.
   * Returns {success: true} or {success: false, error: string}.
   */
  async function register(email, name, password) {
    email = (email || '').trim().toLowerCase();
    name = (name || '').trim();
    password = password || '';

    if (!email || !name || !password) {
      return { success: false, error: 'Заполните все поля' };
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { success: false, error: 'Некорректный email' };
    }

    if (password.length < 6) {
      return { success: false, error: 'Пароль должен быть не менее 6 символов' };
    }

    var users = getUsers();
    var exists = users.some(function (u) {
      return u.email === email;
    });
    if (exists) {
      return { success: false, error: 'Пользователь с таким email уже существует' };
    }

    var passwordHash = await hashPassword(password);
    var user = {
      email: email,
      name: name,
      passwordHash: passwordHash,
      isAdmin: false,
      createdAt: new Date().toISOString()
    };

    users.push(user);
    saveUsers(users);

    // Auto-login after registration
    var session = {
      email: user.email,
      name: user.name,
      isAdmin: user.isAdmin,
      token: generateToken(),
      expiresAt: new Date(Date.now() + SESSION_DURATION_MS).toISOString()
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));

    updateAuthUI();
    return { success: true };
  }

  /**
   * Login with email and password.
   * Returns {success: true} or {success: false, error: string}.
   */
  async function login(email, password) {
    email = (email || '').trim().toLowerCase();
    password = password || '';

    if (!email || !password) {
      return { success: false, error: 'Введите email и пароль' };
    }

    var users = getUsers();
    var user = users.find(function (u) {
      return u.email === email;
    });

    if (!user) {
      return { success: false, error: 'Пользователь не найден' };
    }

    var passwordHash = await hashPassword(password);
    if (passwordHash !== user.passwordHash) {
      return { success: false, error: 'Неверный пароль' };
    }

    var session = {
      email: user.email,
      name: user.name,
      isAdmin: user.isAdmin,
      token: generateToken(),
      expiresAt: new Date(Date.now() + SESSION_DURATION_MS).toISOString()
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));

    updateAuthUI();
    return { success: true };
  }

  /**
   * Logout — clear session.
   */
  function logout() {
    localStorage.removeItem(SESSION_KEY);
    updateAuthUI();
  }

  /**
   * Get current session or null if expired/absent.
   */
  function getSession() {
    try {
      var raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      var session = JSON.parse(raw);
      if (new Date(session.expiresAt) <= new Date()) {
        localStorage.removeItem(SESSION_KEY);
        return null;
      }
      return session;
    } catch (e) {
      return null;
    }
  }

  /**
   * Check if current user has admin flag.
   */
  function isAdmin() {
    var session = getSession();
    return session ? !!session.isAdmin : false;
  }

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
          logout();
          window.location.reload();
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

  // ─── Init ─────────────────────────────────────────────────────────────────

  // Ensure default admin exists on first load
  ensureDefaultAdmin().catch(function(e) { console.warn('Auth: default admin bootstrap error:', e); });

  // When components are injected (via components.js), update the auth UI
  document.addEventListener('components-loaded', function () {
    updateAuthUI();
  });

  // If header already exists (e.g. inline header on index.html), run immediately
  if (document.getElementById('auth-nav-slot')) {
    updateAuthUI();
  }

  // ─── Expose global API ────────────────────────────────────────────────────
  window.ZhivoyAuth = {
    register: register,
    login: login,
    logout: logout,
    getSession: getSession,
    isAdmin: isAdmin,
    hashPassword: hashPassword,
    updateAuthUI: updateAuthUI
  };
})();
