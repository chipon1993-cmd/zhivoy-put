/** Same-origin API adapter. Supabase credentials and writes stay on the server. */
(function () {
  'use strict';
  async function request(path, method, payload) {
    var response = await fetch(path, { method: method || 'GET', credentials: 'same-origin', cache: 'no-store',
      headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'zhivoy-put' },
      body: payload === undefined ? undefined : JSON.stringify(payload) });
    var result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Не удалось сохранить данные');
    return result;
  }
  window.SupabaseClient = {
    get: async function (key) {
      // Legacy navigator data had no owner. Keep personal entries on this device.
      if (key === 'navigator_data') return null;
      if (key === 'contact_messages') return (await request('/api/contact')).messages;
      try { return (await request('/api/content?key=' + encodeURIComponent(key))).data[key] || null; }
      catch (_) { return null; } // Public CMS loader falls back to published JSON.
    },
    set: async function (key, value) {
      if (key === 'navigator_data') return false;
      var data = {}; data[key] = value;
      await request('/api/content', 'PUT', { data: data });
      return true;
    },
    saveAll: function (data) { return request('/api/content', 'PUT', { data: data }); },
    getAll: async function () { return (await request('/api/content')).data; },
    submitMessage: function (message) { return request('/api/contact', 'POST', message); },
    deleteMessage: function (id) { return request('/api/contact', 'DELETE', { id: id }); },
    isConnected: function () { return true; } // Adapter available; requests report real errors.
  };
})();
