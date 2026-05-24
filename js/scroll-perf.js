/**
 * scroll-perf.js — Force all wheel/touch listeners to be passive
 * Prevents any third-party script from blocking scroll.
 */
(function() {
  // Override addEventListener to force passive on scroll-blocking events
  var origAdd = EventTarget.prototype.addEventListener;
  EventTarget.prototype.addEventListener = function(type, listener, options) {
    if (type === 'wheel' || type === 'mousewheel' || type === 'touchstart' || type === 'touchmove') {
      if (typeof options === 'object') {
        options.passive = true;
      } else if (typeof options === 'undefined' || options === false) {
        options = { passive: true };
      }
    }
    return origAdd.call(this, type, listener, options);
  };
})();
