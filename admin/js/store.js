/**
 * AdminStore — Centralized State Management
 *
 * Provides a single source of truth for all admin panel data.
 * Persists to localStorage and emits events on changes.
 *
 * @global window.AdminStore
 */
(function () {
  'use strict';

  /* ─── Default Data ─────────────────────────────────────────────────── */

  const DEFAULTS = {
    content: {
      'hero-kicker': 'Личный атлас · не список задач',
      'hero-title-1': 'Карта жизни,',
      'hero-title-2': 'не давит',
      'hero-desc': 'Визуальная система для человека, который движется через состояние, образ, смысл и внутренний отклик.',
      'hero-btn1-text': 'Начать с состояния', 'hero-btn1-href': '#agent',
      'hero-btn2-text': 'Посмотреть карту', 'hero-btn2-href': '#map',
      'hero-card-title': 'Суть системы',
      'hero-card-text': 'Не «что я должен сделать?», а «где я сейчас, что меня держит, что зовёт, и какой один шаг возвращает контакт?»',
      'trip-title': 'До · Во время · После',
      'trip-desc': 'Одна жизнь, три состояния. Не резкий скачок, а путь от тумана к присутствию.',
      'trip-1-title': 'ДО', 'trip-1-desc': 'Тяжесть, ступор, прошлое, страх.', 'trip-1-tags': 'страх, сомнения, туман, ступор, прошлое',
      'trip-2-title': 'ВО ВРЕМЯ', 'trip-2-desc': 'Ты учишься видеть свой механизм.', 'trip-2-tags': 'выбор, путь, голос, дисциплина, рост',
      'trip-3-title': 'ПОСЛЕ', 'trip-3-desc': 'Больше ясности, опоры и своего голоса.', 'trip-3-tags': 'свобода, мастерство, смысл, опора, служение',
      'atlas-title': 'Атлас жизни',
      'atlas-desc': 'Вместо «целей» — живые области.',
      'trig-title': 'Триггеры и выходы',
      'trig-desc': 'Что включает, что выключает и как возвращаться.',
      'nav-title': 'Навигатор состояния',
      'nav-desc': 'Ты пишешь поток, а система возвращает отражение.',
      'nav-input-title': 'Запиши состояние',
      'nav-placeholder': 'Пиши потоком: что чувствуешь, что давит, где туман...',
      'road-title': 'Как это станет AI-системой',
      'road-desc': 'Сначала зеркало. Потом — память, дневник, карта повторений.',
      'cta-line1': 'Это не контроль над собой.',
      'cta-line2': 'возвращение к себе',
      'cta-desc': 'Карта, по которой можно находить своё направление.',
      'footer-text': 'Персональный атлас жизни. Движение через состояние, смысл и внутренний отклик.',
      'footer-note': '✦ 2024 — настоящее',
      'menu-cta-text': 'Начать',
      'menu-cta-href': 'pages/navigator.html',
      // Style
      'style-bg': '#05070d', 'style-gold': '#f2c96d', 'style-text': '#f0ebe1',
      'style-muted': '#a8a196', 'style-blue': '#81c7ff', 'style-green': '#8ff0b6',
      'style-radius': '28',
      'style-max-width': '1280', 'style-hero-height': '100',
      'style-h1-size': '96', 'style-h2-size': '68', 'style-body-size': '17',
      'style-stars': 'on', 'style-aurora': 'on', 'style-grid': 'on', 'style-noise': 'on',
      // Typography
      'style-font-heading': 'Playfair Display',
      'style-font-body': 'Inter',
      'style-font-weight-heading': '800',
      'style-font-weight-body': '400',
      'style-line-height': '1.75',
      'style-letter-spacing': '0',
    },
    menu: [
      { name: 'Путь', href: 'pages/triptych.html' },
      { name: 'Карта', href: 'pages/atlas.html' },
      { name: 'Триггеры', href: 'pages/triggers.html' },
      { name: 'Навигатор', href: 'pages/navigator.html' },
      { name: 'Система', href: 'pages/roadmap.html' }
    ],
    territories: [
      { icon: '🧭', name: 'Я в центре', desc: 'Не объект системы, а живой человек.' },
      { icon: '🏠', name: 'Опора', desc: 'Работа, деньги, документы, быт, стабильность.' },
      { icon: '🫁', name: 'Тело', desc: 'Энергия, усталость, напряжение, сон, дыхание.' },
      { icon: '🗣️', name: 'Голос', desc: 'Язык, сообщения, способность звучать.' },
      { icon: '🛠️', name: 'Рост', desc: 'Профессия, практика, мастерство.' },
      { icon: '✨', name: 'Выражение', desc: 'Сайт, тексты, философия, идеи.' },
      { icon: '🤝', name: 'Связь', desc: 'Люди, отношения, тепло, контакт.' }
    ],
    triggers: [
      { icon: '🔥', title: 'Включает', items: ['Живая беседа', 'Большая картина', 'Образ и метафора', 'Реальное действие'] },
      { icon: '❄️', title: 'Замораживает', items: ['Списки без отклика', 'Слишком много пунктов', '«Надо» без смысла', 'Чужая форма'] },
      { icon: '🚪', title: 'Выводит', items: ['Проговорить хаос', 'Снять один «камень»', 'Вернуться к телу', 'Один живой шаг'] }
    ],
    principles: [
      { title: '1. Хаос — это сырьё', desc: 'Пиши как есть — туман, обрывки, честность.' },
      { title: '2. Смысл важнее списка', desc: 'Что на самом деле происходит, а не что «надо».' },
      { title: '3. Один шаг лучше плана', desc: 'Действие вернёт контакт с собой.' }
    ],
    roadmap: [
      { title: 'Сайт-атлас', desc: 'Визуальная карта: территории, триггеры, состояния.' },
      { title: 'Дневник состояний', desc: 'Каждый день короткий поток.' },
      { title: 'AI-зеркало', desc: 'Модель распознаёт петли, темы, импульсы.' },
      { title: 'Живой агент', desc: 'Помнит карту, предлагает шаг.' }
    ],
    pages: [],
    themes: []
  };

  /* ─── localStorage Keys ────────────────────────────────────────────── */

  const STORAGE_KEYS = {
    content: 'cms_content',
    menu: 'cms_menu',
    territories: 'cms_territories',
    triggers: 'cms_triggers',
    principles: 'cms_principles',
    roadmap: 'cms_roadmap',
    pages: 'cms_pages',
    themes: 'cms_themes'
  };

  /* ─── Helpers ──────────────────────────────────────────────────────── */

  /**
   * Deep clone an object (JSON-safe values only).
   * @param {*} obj
   * @returns {*}
   */
  function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  /* ─── Store Implementation ─────────────────────────────────────────── */

  const listeners = {};

  const AdminStore = {
    /** @type {Object} Live state object containing all panel data */
    data: null,

    /**
     * Load state from localStorage, falling back to DEFAULTS for missing keys.
     * Initializes AdminStore.data with a deep clone of defaults merged with persisted data.
     */
    load: function () {
      this.data = deepClone(DEFAULTS);

      Object.keys(STORAGE_KEYS).forEach(function (section) {
        var stored = localStorage.getItem(STORAGE_KEYS[section]);
        if (stored) {
          try {
            var parsed = JSON.parse(stored);
            if (section === 'content' && typeof parsed === 'object' && !Array.isArray(parsed)) {
              // Merge stored content on top of defaults so new keys are preserved
              Object.keys(parsed).forEach(function (key) {
                AdminStore.data.content[key] = parsed[key];
              });
            } else {
              AdminStore.data[section] = parsed;
            }
          } catch (e) {
            console.warn('[AdminStore] Failed to parse localStorage key:', STORAGE_KEYS[section], e);
          }
        }
      });
    },

    /**
     * Persist all current data to localStorage + Supabase, and emit 'save' event.
     */
    save: function () {
      var self = this;
      Object.keys(STORAGE_KEYS).forEach(function (section) {
        var json = JSON.stringify(AdminStore.data[section]);
        localStorage.setItem(STORAGE_KEYS[section], json);
        if (window.SupabaseClient && window.SupabaseClient.isConnected()) {
          window.SupabaseClient.set(STORAGE_KEYS[section], AdminStore.data[section]);
        }
      });
      this.emit('save');
    },

    /**
     * Clear all localStorage keys, reload defaults, and emit 'reset' event.
     */
    reset: function () {
      Object.keys(STORAGE_KEYS).forEach(function (section) {
        localStorage.removeItem(STORAGE_KEYS[section]);
      });
      this.data = deepClone(DEFAULTS);
      this.emit('reset');
    },

    /**
     * Get a content field value by key.
     * @param {string} key — The content field key (e.g. 'hero-kicker')
     * @returns {string|undefined}
     */
    get: function (key) {
      return this.data.content[key];
    },

    /**
     * Set a content field value and emit 'change' event.
     * @param {string} key — The content field key
     * @param {*} value — New value
     */
    set: function (key, value) {
      this.data.content[key] = value;
      this.emit('change');
    },

    /**
     * Register an event listener.
     * @param {string} event — Event name: 'save' | 'reset' | 'change'
     * @param {Function} callback — Handler function
     */
    on: function (event, callback) {
      if (!listeners[event]) {
        listeners[event] = [];
      }
      listeners[event].push(callback);
    },

    /**
     * Emit an event, calling all registered listeners.
     * @param {string} event — Event name
     */
    emit: function (event) {
      if (listeners[event]) {
        listeners[event].forEach(function (cb) {
          try {
            cb();
          } catch (e) {
            console.error('[AdminStore] Listener error on "' + event + '":', e);
          }
        });
      }
    },

    /**
     * Load from Supabase (if available), merge into current state,
     * and update localStorage cache. Called after initial load.
     */
    loadFromCloud: function () {
      if (!window.SupabaseClient || !window.SupabaseClient.isConnected()) return;
      var self = this;
      window.SupabaseClient.getAll().then(function (cloudData) {
        if (!cloudData || Object.keys(cloudData).length === 0) return;
        var changed = false;
        Object.keys(STORAGE_KEYS).forEach(function (section) {
          var storageKey = STORAGE_KEYS[section];
          if (cloudData[storageKey] !== undefined && cloudData[storageKey] !== null) {
            if (section === 'content' && typeof cloudData[storageKey] === 'object') {
              Object.keys(cloudData[storageKey]).forEach(function (k) {
                self.data.content[k] = cloudData[storageKey][k];
              });
            } else {
              self.data[section] = cloudData[storageKey];
            }
            localStorage.setItem(storageKey, JSON.stringify(self.data[section]));
            changed = true;
          }
        });
        if (changed) {
          self.emit('cloud-loaded');
          console.log('[AdminStore] Cloud data synced');
        }
      });
    }
  };

  /* ─── Auto-initialize ──────────────────────────────────────────────── */

  AdminStore.load();

  /* ─── Expose globally ──────────────────────────────────────────────── */

  window.AdminStore = AdminStore;

})();
