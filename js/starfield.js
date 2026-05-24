/**
 * starfield.js — CSS-based starfield (no continuous animation loop)
 * Creates star elements once, CSS handles the twinkle animation.
 * Zero impact on scroll performance.
 */
(function() {
  const canvas = document.getElementById('starfield');
  if (!canvas) return;

  // Replace canvas with a div container for CSS stars
  const container = document.createElement('div');
  container.id = 'starfield';
  container.style.cssText = canvas.style.cssText || '';
  container.setAttribute('class', canvas.getAttribute('class') || '');
  canvas.parentNode.replaceChild(container, canvas);

  Object.assign(container.style, {
    position: 'fixed',
    inset: '0',
    zIndex: '0',
    pointerEvents: 'none',
    overflow: 'hidden'
  });

  const w = window.innerWidth;
  const h = window.innerHeight;
  const count = Math.min(Math.floor(w * h / 4000), 200);

  // Create stars as small divs with CSS animation
  const fragment = document.createDocumentFragment();
  for (let i = 0; i < count; i++) {
    const star = document.createElement('div');
    const size = Math.random() * 2.5 + 0.5;
    const x = Math.random() * 100;
    const y = Math.random() * 100;
    const delay = Math.random() * 4;
    const duration = Math.random() * 3 + 2;

    star.style.cssText = `
      position:absolute;
      left:${x}%;
      top:${y}%;
      width:${size}px;
      height:${size}px;
      border-radius:50%;
      background:rgba(255,248,230,${Math.random() * 0.6 + 0.2});
      animation:star-twinkle ${duration}s ease-in-out ${delay}s infinite;
      will-change:opacity;
    `;
    fragment.appendChild(star);
  }
  container.appendChild(fragment);

  // Add keyframes if not already present
  if (!document.getElementById('starfield-keyframes')) {
    const style = document.createElement('style');
    style.id = 'starfield-keyframes';
    style.textContent = `
      @keyframes star-twinkle {
        0%, 100% { opacity: 0.3; }
        50% { opacity: 1; }
      }
    `;
    document.head.appendChild(style);
  }
})();
