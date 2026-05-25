/**
 * DragSort — SortableJS Wrapper
 *
 * Makes a container's direct children sortable via SortableJS.
 * Falls back gracefully if SortableJS is not loaded.
 *
 * Usage:
 *   DragSort(containerElement, function(newOrder) {
 *     // newOrder is an array of original indices in new positions
 *   });
 *
 * Requirements:
 *   - SortableJS loaded globally as window.Sortable
 *   - Each sortable child should contain a .drag-handle element
 *
 * @param {HTMLElement} container — Parent element whose children are sortable
 * @param {Function} onReorder — Callback receiving array of new index order
 * @global window.DragSort
 */
(function () {
  'use strict';

  /**
   * Initialize SortableJS-based sorting on a container.
   *
   * @param {HTMLElement} container — The parent element
   * @param {Function} onReorder — Called with new index order after drop
   */
  function DragSort(container, onReorder) {
    if (!container) return;

    // Graceful fallback if SortableJS is not available
    if (typeof Sortable === 'undefined') {
      console.warn('DragSort: SortableJS is not loaded. Drag sorting disabled.');
      return;
    }

    // Assign original indices to children for order tracking
    function assignIndices() {
      var children = Array.prototype.slice.call(container.children);
      children.forEach(function (child, i) {
        child.dataset.sortIndex = i;
      });
    }

    assignIndices();

    // Create SortableJS instance
    Sortable.create(container, {
      handle: '.drag-handle',
      animation: 150,
      ghostClass: 'dragging',
      chosenClass: 'drag-over',

      onEnd: function () {
        // Build newOrder: array of original indices in their new positions
        var children = Array.prototype.slice.call(container.children);
        var newOrder = children.map(function (child) {
          return parseInt(child.dataset.sortIndex, 10);
        });

        if (onReorder) onReorder(newOrder);
      }
    });

    // Re-assign indices when DOM changes externally
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
