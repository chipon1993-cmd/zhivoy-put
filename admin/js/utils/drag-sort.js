/**
 * DragSort — Generic Drag-and-Drop Sorting
 *
 * Makes a container's direct children sortable via HTML5 Drag API
 * with basic touch device support.
 *
 * Usage:
 *   DragSort(containerElement, function(newOrder) {
 *     // newOrder is an array of original indices in new positions
 *   });
 *
 * Requirements:
 *   - Each sortable child must have [draggable="true"]
 *   - Each child should contain a .drag-handle element
 *
 * @param {HTMLElement} container — Parent element whose children are sortable
 * @param {Function} onReorder — Callback receiving array of new index order
 * @global window.DragSort
 */
(function () {
  'use strict';

  /**
   * Initialize drag-and-drop sorting on a container.
   *
   * @param {HTMLElement} container — The parent element
   * @param {Function} onReorder — Called with new index order after drop
   */
  function DragSort(container, onReorder) {
    if (!container) return;

    var draggedEl = null;
    var draggedIndex = -1;
    var placeholder = null;

    /* ─── Helpers ──────────────────────────────────────────────────── */

    /**
     * Get the sortable children as an array.
     * @returns {HTMLElement[]}
     */
    function getChildren() {
      return Array.prototype.slice.call(container.children).filter(function (child) {
        return child.getAttribute('draggable') === 'true';
      });
    }

    /**
     * Get the index of an element among sortable siblings.
     * @param {HTMLElement} el
     * @returns {number}
     */
    function getIndex(el) {
      var children = getChildren();
      return children.indexOf(el);
    }

    /**
     * Find the closest draggable parent of a given element.
     * @param {HTMLElement} target
     * @returns {HTMLElement|null}
     */
    function findDraggableParent(target) {
      var current = target;
      while (current && current !== container) {
        if (current.getAttribute('draggable') === 'true') return current;
        current = current.parentElement;
      }
      return null;
    }

    /**
     * Determine the insertion reference element based on mouse Y position.
     * @param {number} y — Mouse/touch Y coordinate
     * @returns {HTMLElement|null}
     */
    function getInsertBefore(y) {
      var children = getChildren();
      for (var i = 0; i < children.length; i++) {
        var child = children[i];
        if (child === draggedEl) continue;
        var rect = child.getBoundingClientRect();
        var midY = rect.top + rect.height / 2;
        if (y < midY) return child;
      }
      return null;
    }

    /**
     * Remove all drag-related CSS classes from children.
     */
    function cleanupClasses() {
      var children = getChildren();
      children.forEach(function (child) {
        child.classList.remove('dragging', 'drag-over');
      });
    }

    /**
     * Build the new order array (original indices in new positions).
     * @returns {number[]}
     */
    function buildNewOrder() {
      var children = getChildren();
      return children.map(function (child) {
        return parseInt(child.dataset.sortIndex, 10);
      });
    }

    /**
     * Assign data-sort-index to all children for tracking original positions.
     */
    function assignIndices() {
      var children = getChildren();
      children.forEach(function (child, i) {
        child.dataset.sortIndex = i;
      });
    }

    /* ─── HTML5 Drag Events ───────────────────────────────────────── */

    container.addEventListener('dragstart', function (e) {
      var target = findDraggableParent(e.target);
      if (!target) return;

      draggedEl = target;
      draggedIndex = getIndex(target);
      draggedEl.classList.add('dragging');

      // Required for Firefox
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', '');
    });

    container.addEventListener('dragover', function (e) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';

      if (!draggedEl) return;

      // Clear previous drag-over indicators
      var children = getChildren();
      children.forEach(function (child) {
        child.classList.remove('drag-over');
      });

      // Find insertion point and highlight
      var insertBefore = getInsertBefore(e.clientY);
      if (insertBefore && insertBefore !== draggedEl) {
        insertBefore.classList.add('drag-over');
      }
    });

    container.addEventListener('dragenter', function (e) {
      e.preventDefault();
    });

    container.addEventListener('dragleave', function (e) {
      var target = findDraggableParent(e.target);
      if (target) {
        target.classList.remove('drag-over');
      }
    });

    container.addEventListener('drop', function (e) {
      e.preventDefault();
      if (!draggedEl) return;

      var insertBefore = getInsertBefore(e.clientY);

      if (insertBefore) {
        container.insertBefore(draggedEl, insertBefore);
      } else {
        container.appendChild(draggedEl);
      }

      cleanupClasses();

      var newOrder = buildNewOrder();
      draggedEl = null;
      draggedIndex = -1;

      if (onReorder) onReorder(newOrder);
    });

    container.addEventListener('dragend', function () {
      cleanupClasses();
      draggedEl = null;
      draggedIndex = -1;
    });

    /* ─── Touch Support (Basic Polyfill) ──────────────────────────── */

    var touchEl = null;
    var touchClone = null;
    var touchStartY = 0;
    var touchStartX = 0;

    container.addEventListener('touchstart', function (e) {
      // Only start drag from .drag-handle
      var handle = e.target.closest('.drag-handle');
      if (!handle) return;

      var target = findDraggableParent(handle);
      if (!target) return;

      e.preventDefault();

      touchEl = target;
      draggedEl = target;
      draggedIndex = getIndex(target);

      var touch = e.touches[0];
      touchStartY = touch.clientY;
      touchStartX = touch.clientX;

      // Create visual clone for dragging
      var rect = target.getBoundingClientRect();
      touchClone = target.cloneNode(true);
      touchClone.classList.add('drag-clone');
      touchClone.style.position = 'fixed';
      touchClone.style.top = rect.top + 'px';
      touchClone.style.left = rect.left + 'px';
      touchClone.style.width = rect.width + 'px';
      touchClone.style.height = rect.height + 'px';
      touchClone.style.zIndex = '9999';
      touchClone.style.opacity = '0.85';
      touchClone.style.pointerEvents = 'none';
      touchClone.style.transition = 'none';
      document.body.appendChild(touchClone);

      target.classList.add('dragging');
    }, { passive: false });

    container.addEventListener('touchmove', function (e) {
      if (!touchEl || !touchClone) return;
      e.preventDefault();

      var touch = e.touches[0];
      var dy = touch.clientY - touchStartY;
      var dx = touch.clientX - touchStartX;

      var rect = touchEl.getBoundingClientRect();
      touchClone.style.top = (rect.top + dy) + 'px';
      touchClone.style.left = (rect.left + dx) + 'px';

      // Clear drag-over
      var children = getChildren();
      children.forEach(function (child) {
        child.classList.remove('drag-over');
      });

      // Highlight insertion target
      var insertBefore = getInsertBefore(touch.clientY);
      if (insertBefore && insertBefore !== draggedEl) {
        insertBefore.classList.add('drag-over');
      }
    }, { passive: false });

    container.addEventListener('touchend', function (e) {
      if (!touchEl) return;

      // Determine final position
      var touch = e.changedTouches[0];
      var insertBefore = getInsertBefore(touch.clientY);

      if (insertBefore) {
        container.insertBefore(draggedEl, insertBefore);
      } else {
        container.appendChild(draggedEl);
      }

      // Remove clone
      if (touchClone && touchClone.parentNode) {
        touchClone.parentNode.removeChild(touchClone);
      }

      cleanupClasses();

      var newOrder = buildNewOrder();

      touchEl = null;
      touchClone = null;
      draggedEl = null;
      draggedIndex = -1;

      if (onReorder) onReorder(newOrder);
    });

    /* ─── Initialize ──────────────────────────────────────────────── */

    assignIndices();

    // Re-assign indices when DOM changes (MutationObserver)
    if (window.MutationObserver) {
      var observer = new MutationObserver(function () {
        assignIndices();
      });
      observer.observe(container, { childList: true });
    }
  }

  /* ─── Expose globally ──────────────────────────────────────────────── */

  window.DragSort = DragSort;

})();
