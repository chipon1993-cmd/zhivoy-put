/**
 * Supabase Client — Живой путь
 * Initializes the Supabase client for CMS data persistence.
 * Used by both admin store (read/write) and public CMS loader (read).
 */
(function () {
  'use strict';

  var SUPABASE_URL = 'https://peitlntcakztniaeynrc.supabase.co';
  var SUPABASE_KEY = 'sb_publishable_Ipyiy5-WcvyACFjm6LFOew_dqaz48ZZ';

  var client = null;

  try {
    if (window.supabase && window.supabase.createClient) {
      client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    }
  } catch (e) {
    console.warn('Supabase init failed:', e);
  }

  window.SupabaseClient = {
    /**
     * Get a value by key from site_data table.
     * @param {string} key
     * @returns {Promise<*>} parsed value or null
     */
    get: function (key) {
      if (!client) return Promise.resolve(null);
      return client
        .from('site_data')
        .select('value')
        .eq('key', key)
        .single()
        .then(function (res) {
          if (res.error || !res.data) return null;
          return res.data.value;
        })
        .catch(function () { return null; });
    },

    /**
     * Save a value by key (upsert).
     * @param {string} key
     * @param {*} value
     * @returns {Promise<boolean>} success
     */
    set: function (key, value) {
      if (!client) return Promise.resolve(false);
      return client
        .from('site_data')
        .upsert({ key: key, value: value, updated_at: new Date().toISOString() }, { onConflict: 'key' })
        .then(function (res) {
          return !res.error;
        })
        .catch(function () { return false; });
    },

    /**
     * Load all keys from site_data.
     * @returns {Promise<Object>} map of key→value
     */
    getAll: function () {
      if (!client) return Promise.resolve({});
      return client
        .from('site_data')
        .select('key, value')
        .then(function (res) {
          if (res.error || !res.data) return {};
          var map = {};
          res.data.forEach(function (row) {
            map[row.key] = row.value;
          });
          return map;
        })
        .catch(function () { return {}; });
    },

    /** Check if Supabase is connected */
    isConnected: function () {
      return !!client;
    }
  };
})();
