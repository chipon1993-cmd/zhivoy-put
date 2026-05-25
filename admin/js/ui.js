/**
 * AdminUI — Reusable UI Component Factory
 *
 * Provides methods that return DOM elements for building admin panel interfaces.
 * All field components auto-bind to AdminStore for state persistence.
 *
 * @global window.AdminUI
 */
(function () {
  'use strict';

  /* ─── Inject Pickr-wrap CSS ────────────────────────────────────────── */

  if (!document.getElementById('adminui-pickr-css')) {
    var styleTag = document.createElement('style');
    styleTag.id = 'adminui-pickr-css';
    styleTag.textContent =
      '.pickr-wrap { display: flex; align-items: center; gap: 10px; }' +
      '.pickr-trigger { width: 36px; height: 36px; border-radius: 8px; border: 2px solid rgba(255,255,255,0.12); cursor: pointer; }' +
      '.color-hex { font-size: 13px; font-family: monospace; color: rgba(255,255,255,0.7); }';
    document.head.appendChild(styleTag);
  }

  /* ─── Google Fonts Catalogue ───────────────────────────────────────── */

  const FONT_GROUPS = [
    {
      label: 'Serif',
      fonts: [
        'Playfair Display', 'Lora', 'Merriweather', 'PT Serif', 'Noto Serif',
        'EB Garamond', 'Cormorant Garamond', 'Bitter', 'Vollkorn', 'Source Serif 4'
      ]
    },
    {
      label: 'Sans-Serif',
      fonts: [
        'Inter', 'Roboto', 'Open Sans', 'Montserrat', 'Nunito', 'Raleway',
        'PT Sans', 'Source Sans 3', 'Manrope', 'DM Sans', 'Plus Jakarta Sans', 'Outfit'
      ]
    },
    {
      label: 'Display',
      fonts: ['Oswald', 'Bebas Neue', 'Archivo Black', 'Russo One', 'Comfortaa', 'Pacifico']
    },
    {
      label: 'Monospace',
      fonts: ['JetBrains Mono', 'Fira Code', 'IBM Plex Mono', 'Source Code Pro']
    }
  ];

  /* ─── Helpers ──────────────────────────────────────────────────────── */

  /**
   * Create a DOM element with optional class and attributes.
   * @param {string} tag
   * @param {string} [className]
   * @param {Object} [attrs]
   * @returns {HTMLElement}
   */
  function el(tag, className, attrs) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (attrs) {
      Object.keys(attrs).forEach(function (key) {
        if (key === 'textContent' || key === 'innerHTML') {
          node[key] = attrs[key];
        } else {
          node.setAttribute(key, attrs[key]);
        }
      });
    }
    return node;
  }

  /**
   * Load a Google Font via link element if not already loaded.
   * @param {string} fontName
   */
  function loadGoogleFont(fontName) {
    var id = 'gfont-' + fontName.replace(/\s+/g, '-').toLowerCase();
    if (document.getElementById(id)) return;
    var link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=' + encodeURIComponent(fontName) + ':wght@400;700;800&display=swap';
    document.head.appendChild(link);
  }

  /* ─── AdminUI Implementation ───────────────────────────────────────── */

  var AdminUI = {

    /**
     * Create a form field with label and input, auto-bound to AdminStore.
     *
     * @param {Object} opts
     * @param {string} opts.type — 'text'|'textarea'|'number'|'color'|'select'|'range'|'toggle'|'font'
     * @param {string} opts.id — Field ID (doubles as AdminStore content key)
     * @param {string} opts.label — Label text
     * @param {*} [opts.value] — Initial value (reads from AdminStore if omitted)
     * @param {string} [opts.placeholder]
     * @param {Array} [opts.options] — For select: [{value, label}] or string[]
     * @param {number} [opts.min] — For number/range
     * @param {number} [opts.max] — For number/range
     * @param {number} [opts.step] — For number/range
     * @param {string} [opts.hint] — Help text below field
     * @param {Function} [opts.onChange] — Custom callback (receives new value)
     * @returns {HTMLElement}
     */
    field: function (arg1, arg2) {
      var opts;
      if (typeof arg1 === 'string') {
        opts = arg2 || {};
        opts.type = arg1;
      } else {
        opts = arg1 || {};
      }
      if (opts.key && !opts.id) opts.id = opts.key;

      var group = el('div', 'form-group');
      if (opts.id) group.id = 'field-' + opts.id;
      var value = opts.value !== undefined ? opts.value : (window.AdminStore ? window.AdminStore.get(opts.id) : '');
      if (value === undefined) value = '';

      // Label
      var labelEl = el('label', 'form-label', { for: opts.id, textContent: opts.label });

      // Range badge (shown next to label for range type)
      var badge = null;
      if (opts.type === 'range') {
        badge = el('span', 'range-badge', { textContent: value });
        labelEl.appendChild(document.createTextNode(' '));
        labelEl.appendChild(badge);
      }

      group.appendChild(labelEl);

      var inputEl;

      switch (opts.type) {
        case 'textarea':
          inputEl = el('textarea', 'form-input form-textarea', {
            id: opts.id,
            placeholder: opts.placeholder || ''
          });
          inputEl.value = value;
          inputEl.rows = 4;
          break;

        case 'color':
          if (typeof Pickr !== 'undefined') {
            // Pickr integration
            var pickrWrap = el('div', 'pickr-wrap');
            var pickrTrigger = el('button', 'pickr-trigger');
            pickrTrigger.style.backgroundColor = value || '#000000';
            var hexDisplay = el('span', 'color-hex', { textContent: value || '#000000' });
            // Hidden input for auto-bind compatibility
            inputEl = el('input', 'form-input form-color', {
              id: opts.id,
              type: 'hidden'
            });
            inputEl.value = value;

            pickrWrap.appendChild(pickrTrigger);
            pickrWrap.appendChild(hexDisplay);
            pickrWrap.appendChild(inputEl);
            group.appendChild(pickrWrap);

            // Initialize Pickr after DOM append
            (function (trigger, hiddenInput, hexSpan, fieldId, fieldOpts) {
              setTimeout(function () {
                var pickrInstance = Pickr.create({
                  el: trigger,
                  theme: 'nano',
                  default: hiddenInput.value || '#000000',
                  components: {
                    preview: true,
                    opacity: true,
                    hue: true,
                    interaction: {
                      hex: true,
                      input: true,
                      save: true,
                      clear: true
                    }
                  }
                });

                pickrInstance.on('save', function (color) {
                  var hex = color ? color.toHEXA().toString() : '';
                  hiddenInput.value = hex;
                  hexSpan.textContent = hex;
                  trigger.style.backgroundColor = hex || 'transparent';
                  if (window.AdminStore) {
                    window.AdminStore.set(fieldId, hex);
                  }
                  if (fieldOpts.onChange) {
                    fieldOpts.onChange(hex);
                  }
                  pickrInstance.hide();
                });

                pickrInstance.on('clear', function () {
                  hiddenInput.value = '';
                  hexSpan.textContent = '';
                  trigger.style.backgroundColor = 'transparent';
                  if (window.AdminStore) {
                    window.AdminStore.set(fieldId, '');
                  }
                  if (fieldOpts.onChange) {
                    fieldOpts.onChange('');
                  }
                  pickrInstance.hide();
                });
              }, 0);
            })(pickrTrigger, inputEl, hexDisplay, opts.id, opts);

            inputEl._wrapper = pickrWrap;
          } else {
            // Fallback to native color input
            var colorWrap = el('div', 'color-input-wrap');
            inputEl = el('input', 'form-input form-color', {
              id: opts.id,
              type: 'color'
            });
            inputEl.value = value;
            var colorText = el('span', 'color-value', { textContent: value });
            colorWrap.appendChild(inputEl);
            colorWrap.appendChild(colorText);
            inputEl.addEventListener('input', function () {
              colorText.textContent = inputEl.value;
            });
            group.appendChild(colorWrap);
            inputEl._wrapper = colorWrap;
          }
          break;

        case 'select':
          inputEl = el('select', 'form-input form-select', { id: opts.id });
          if (opts.options) {
            opts.options.forEach(function (opt) {
              var optEl = document.createElement('option');
              if (typeof opt === 'string') {
                optEl.value = opt;
                optEl.textContent = opt;
              } else {
                optEl.value = opt.value;
                optEl.textContent = opt.label;
              }
              if (String(optEl.value) === String(value)) optEl.selected = true;
              inputEl.appendChild(optEl);
            });
          }
          break;

        case 'number':
          inputEl = el('input', 'form-input form-number', {
            id: opts.id,
            type: 'number'
          });
          if (opts.min !== undefined) inputEl.min = opts.min;
          if (opts.max !== undefined) inputEl.max = opts.max;
          if (opts.step !== undefined) inputEl.step = opts.step;
          inputEl.value = value;
          break;

        case 'range':
          inputEl = el('input', 'form-input form-range', {
            id: opts.id,
            type: 'range'
          });
          if (opts.min !== undefined) inputEl.min = opts.min;
          if (opts.max !== undefined) inputEl.max = opts.max;
          if (opts.step !== undefined) inputEl.step = opts.step;
          inputEl.value = value;
          inputEl.addEventListener('input', function () {
            if (badge) badge.textContent = inputEl.value;
          });
          break;

        case 'toggle':
          var toggleWrap = el('div', 'toggle-wrap');
          inputEl = el('input', 'toggle-input', { id: opts.id, type: 'checkbox' });
          inputEl.checked = (value === 'on' || value === true || value === 'true');
          var toggleTrack = el('label', 'toggle-track', { for: opts.id });
          toggleWrap.appendChild(inputEl);
          toggleWrap.appendChild(toggleTrack);
          group.appendChild(toggleWrap);
          inputEl._wrapper = toggleWrap;
          break;

        case 'richtext':
          var editorWrap = el('div', 'richtext-wrap');
          var editorId = 'quill-' + opts.id + '-' + Date.now();
          var editorDiv = el('div', 'richtext-editor');
          editorDiv.id = editorId;
          editorDiv.innerHTML = value || '';
          editorWrap.appendChild(editorDiv);
          group.appendChild(editorWrap);

          setTimeout(function () {
            var quill = new Quill('#' + editorId, {
              theme: 'snow',
              modules: {
                toolbar: [
                  ['bold', 'italic', 'underline', 'strike'],
                  [{ list: 'ordered' }, { list: 'bullet' }],
                  ['link', 'blockquote'],
                  ['clean']
                ]
              },
              placeholder: opts.placeholder || 'Начните писать...'
            });
            quill.on('text-change', function () {
              var html = quill.root.innerHTML;
              if (html === '<p><br></p>') html = '';
              if (window.AdminStore) {
                window.AdminStore.set(opts.id, html);
              }
              if (opts.onChange) {
                opts.onChange(html);
              }
            });
          }, 50);

          inputEl = editorDiv;
          inputEl._wrapper = editorWrap;
          break;

        case 'font':
          inputEl = el('select', 'form-input form-select form-font-select', { id: opts.id });
          FONT_GROUPS.forEach(function (grp) {
            var optgroup = document.createElement('optgroup');
            optgroup.label = grp.label;
            grp.fonts.forEach(function (font) {
              var optEl = document.createElement('option');
              optEl.value = font;
              optEl.textContent = font;
              if (font === value) optEl.selected = true;
              optgroup.appendChild(optEl);
            });
            inputEl.appendChild(optgroup);
          });
          // Font preview
          var preview = el('div', 'font-preview', {
            textContent: 'Быстрая бурая лиса — The quick brown fox'
          });
          if (value) {
            loadGoogleFont(value);
            preview.style.fontFamily = '"' + value + '", sans-serif';
          }
          inputEl.addEventListener('change', function () {
            loadGoogleFont(inputEl.value);
            preview.style.fontFamily = '"' + inputEl.value + '", sans-serif';
          });
          group.appendChild(inputEl);
          group.appendChild(preview);
          inputEl._hasPreview = true;
          break;

        default: // text
          inputEl = el('input', 'form-input', {
            id: opts.id,
            type: 'text',
            placeholder: opts.placeholder || ''
          });
          inputEl.value = value;
      }

      // Append input (unless already appended via wrapper)
      if (!inputEl._wrapper && !inputEl._hasPreview) {
        group.appendChild(inputEl);
      }

      // Hint
      if (opts.hint) {
        group.appendChild(el('div', 'form-hint', { textContent: opts.hint }));
      }

      // Auto-bind to AdminStore
      var eventName = (opts.type === 'color' || opts.type === 'range') ? 'input' : 'change';
      if (opts.type === 'toggle') eventName = 'change';

      inputEl.addEventListener(eventName, function () {
        var newValue;
        if (opts.type === 'toggle') {
          newValue = inputEl.checked ? 'on' : 'off';
        } else {
          newValue = inputEl.value;
        }
        if (window.AdminStore) {
          window.AdminStore.set(opts.id, newValue);
        }
        if (opts.onChange) {
          opts.onChange(newValue);
        }
      });

      // Also bind 'input' for text/textarea for real-time updates
      if (opts.type === 'text' || opts.type === 'textarea') {
        inputEl.addEventListener('input', function () {
          if (window.AdminStore) {
            window.AdminStore.set(opts.id, inputEl.value);
          }
          if (opts.onChange) {
            opts.onChange(inputEl.value);
          }
        });
      }

      return group;
    },

    /**
     * Create a card container.
     *
     * @param {Object} opts
     * @param {string} opts.title — Card header title
     * @param {string} [opts.badge] — Optional badge text
     * @param {Array} [opts.actions] — Button configs [{icon, title, onClick, danger?}]
     * @param {Array} [opts.children] — DOM elements to append inside card body
     * @returns {HTMLElement}
     */
    card: function (arg1, arg2, arg3) {
      var opts;
      if (typeof arg1 === 'string') {
        opts = (arg3 && typeof arg3 === 'object') ? arg3 : (arg2 && typeof arg2 === 'object' && !Array.isArray(arg2)) ? arg2 : {};
        opts.title = arg1;
        if (Array.isArray(arg2)) opts.children = arg2;
      } else {
        opts = arg1 || {};
      }

      var card = el('div', 'card');

      // Header
      var header = el('div', 'card-header');
      var titleWrap = el('div', 'card-title-wrap');
      var title = el('h3', 'card-title', { textContent: opts.title || '' });
      titleWrap.appendChild(title);

      if (opts.badge) {
        var badgeEl = el('span', 'card-badge', { textContent: opts.badge });
        titleWrap.appendChild(badgeEl);
      }
      header.appendChild(titleWrap);

      if (opts.actions && opts.actions.length) {
        var actionsWrap = el('div', 'card-actions');
        opts.actions.forEach(function (action) {
          var btn = el('button', 'btn btn-sm' + (action.danger ? ' btn-danger' : ''), {
            title: action.title || ''
          });
          btn.innerHTML = action.icon || '';
          if (action.text) btn.appendChild(document.createTextNode(' ' + action.text));
          if (action.onClick) btn.addEventListener('click', action.onClick);
          actionsWrap.appendChild(btn);
        });
        header.appendChild(actionsWrap);
      }

      card.appendChild(header);

      // Body
      var body = el('div', 'card-body');
      if (opts.children && opts.children.length) {
        opts.children.forEach(function (child) {
          if (child) body.appendChild(child);
        });
      }
      card.appendChild(body);

      return card;
    },

    /**
     * Create a list item element (for sortable lists, menus, etc.).
     *
     * @param {Object} opts
     * @param {string} [opts.icon] — Drag handle or icon HTML
     * @param {string} opts.name — Item name
     * @param {string} [opts.sub] — Subtitle
     * @param {Array} [opts.actions] — [{icon, title, onClick, danger?}]
     * @param {boolean} [opts.draggable] — Adds drag handle and draggable attribute
     * @returns {HTMLElement}
     */
    listItem: function (opts) {
      var item = el('div', 'list-item');

      if (opts.draggable) {
        item.setAttribute('draggable', 'true');
        var handle = el('span', 'drag-handle', { innerHTML: '⠿' });
        item.appendChild(handle);
      } else if (opts.icon) {
        var iconEl = el('span', 'list-item-icon', { innerHTML: opts.icon });
        item.appendChild(iconEl);
      }

      var info = el('div', 'list-item-info');
      var nameEl = el('span', 'list-item-name', { textContent: opts.name });
      info.appendChild(nameEl);
      if (opts.sub) {
        var subEl = el('span', 'list-item-sub', { textContent: opts.sub });
        info.appendChild(subEl);
      }
      item.appendChild(info);

      if (opts.actions && opts.actions.length) {
        var actionsWrap = el('div', 'list-item-actions');
        opts.actions.forEach(function (action) {
          var btn = el('button', 'btn btn-icon' + (action.danger ? ' btn-danger' : ''), {
            title: action.title || ''
          });
          btn.innerHTML = action.icon || '';
          if (action.onClick) btn.addEventListener('click', action.onClick);
          actionsWrap.appendChild(btn);
        });
        item.appendChild(actionsWrap);
      }

      return item;
    },

    /**
     * Create an alert/notification banner.
     *
     * @param {'info'|'success'|'warning'} type
     * @param {string} text
     * @returns {HTMLElement}
     */
    alert: function (type, text) {
      var alertEl = el('div', 'alert alert-' + type, { textContent: text });
      return alertEl;
    },

    /**
     * Show a toast notification.
     * Uses the #toast element in the DOM.
     *
     * @param {string} msg — Toast message
     */
    toast: function (msg) {
      var toastEl = document.getElementById('toast');
      if (!toastEl) {
        // Create toast element if missing
        toastEl = el('div', 'toast', { id: 'toast' });
        document.body.appendChild(toastEl);
      }
      toastEl.textContent = msg;
      toastEl.classList.add('show');
      setTimeout(function () {
        toastEl.classList.remove('show');
      }, 2800);
    },

    /**
     * Open a modal dialog.
     *
     * @param {Object} opts
     * @param {string} opts.title — Header text
     * @param {HTMLElement|string} opts.body — Body content (DOM element or HTML string)
     * @param {Function} [opts.onSave] — Save button callback
     * @param {string} [opts.saveText='Сохранить'] — Save button label
     * @returns {Function} close — Function to close the modal
     */
    modal: function (opts) {
      // Create or reuse overlay
      var overlay = document.querySelector('.modal-overlay');
      if (!overlay) {
        overlay = el('div', 'modal-overlay');
        document.body.appendChild(overlay);
      }
      overlay.innerHTML = '';

      var modal = el('div', 'modal');

      // Header
      var header = el('div', 'modal-header');
      var title = el('h3', 'modal-title', { textContent: opts.title });
      var closeBtn = el('button', 'modal-close', { innerHTML: '&times;', title: 'Закрыть' });
      header.appendChild(title);
      header.appendChild(closeBtn);
      modal.appendChild(header);

      // Body
      var body = el('div', 'modal-body');
      if (typeof opts.body === 'string') {
        body.innerHTML = opts.body;
      } else if (opts.body) {
        body.appendChild(opts.body);
      }
      modal.appendChild(body);

      // Footer
      var footer = el('div', 'modal-footer');
      var cancelBtn = el('button', 'btn btn-secondary', { textContent: 'Отмена' });
      var saveBtn = el('button', 'btn btn-primary', { textContent: opts.saveText || 'Сохранить' });
      footer.appendChild(cancelBtn);
      footer.appendChild(saveBtn);
      modal.appendChild(footer);

      overlay.appendChild(modal);

      // Close function
      function close() {
        overlay.classList.remove('open');
        setTimeout(function () {
          overlay.innerHTML = '';
        }, 200);
      }

      closeBtn.addEventListener('click', close);
      cancelBtn.addEventListener('click', close);
      overlay.addEventListener('click', function (e) {
        if (e.target === overlay) close();
      });
      saveBtn.addEventListener('click', function () {
        if (opts.onSave) opts.onSave();
        close();
      });

      // Open
      requestAnimationFrame(function () {
        overlay.classList.add('open');
      });

      return close;
    },

    /**
     * Show a confirmation dialog.
     *
     * @param {string} msg — Confirmation message
     * @returns {Promise<boolean>} Resolves true if confirmed, false if cancelled
     */
    confirm: function (msg) {
      return new Promise(function (resolve) {
        var body = el('p', 'confirm-message', { textContent: msg });

        var overlay = document.querySelector('.modal-overlay');
        if (!overlay) {
          overlay = el('div', 'modal-overlay');
          document.body.appendChild(overlay);
        }
        overlay.innerHTML = '';

        var modal = el('div', 'modal modal-confirm');

        var modalBody = el('div', 'modal-body');
        modalBody.appendChild(body);
        modal.appendChild(modalBody);

        var footer = el('div', 'modal-footer');
        var cancelBtn = el('button', 'btn btn-secondary', { textContent: 'Отмена' });
        var confirmBtn = el('button', 'btn btn-primary', { textContent: 'Да' });
        footer.appendChild(cancelBtn);
        footer.appendChild(confirmBtn);
        modal.appendChild(footer);

        overlay.appendChild(modal);

        function close(result) {
          overlay.classList.remove('open');
          setTimeout(function () {
            overlay.innerHTML = '';
          }, 200);
          resolve(result);
        }

        cancelBtn.addEventListener('click', function () { close(false); });
        confirmBtn.addEventListener('click', function () { close(true); });
        overlay.addEventListener('click', function (e) {
          if (e.target === overlay) close(false);
        });

        requestAnimationFrame(function () {
          overlay.classList.add('open');
        });
      });
    },

    /**
     * Wrap children in a grid row.
     *
     * @param {Array<HTMLElement>} children — Elements to place in columns
     * @param {number} [cols=2] — Number of columns (2 or 3)
     * @returns {HTMLElement}
     */
    row: function (children, cols) {
      cols = cols || 2;
      var row = el('div', cols === 3 ? 'form-row-3' : 'form-row');
      if (children && children.length) {
        children.forEach(function (child) {
          if (child) row.appendChild(child);
        });
      }
      return row;
    },

    /**
     * Create a visual divider element.
     * @returns {HTMLElement}
     */
    divider: function () {
      return el('div', 'form-divider');
    }
  };

  /* ─── Expose globally ──────────────────────────────────────────────── */

  window.AdminUI = AdminUI;

})();
