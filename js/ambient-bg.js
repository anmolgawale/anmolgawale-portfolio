/**
 * ambient-bg.js
 * -----------------------------------------------------------------------
 * Cinematic ambient background: deep gradient base, slow-drifting blurred
 * light orbs (blue/violet/cyan), a faint grid, and a soft mouse-reactive
 * glow layer. Pure CSS/DOM — no canvas, so it stays cheap and composites
 * on the GPU. Respects prefers-reduced-motion (orbs freeze, mouse glow
 * still updates instantly with no easing).
 * -----------------------------------------------------------------------
 */
(function ambientBgModule() {
  const layer = document.getElementById('ambientBg');
  if (!layer) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches;

  const glow = document.getElementById('ambientMouseGlow');
  if (glow && !isTouch) {
    let gx = 0.5, gy = 0.3, tx = 0.5, ty = 0.3;

    window.addEventListener('mousemove', (e) => {
      tx = e.clientX / window.innerWidth;
      ty = e.clientY / window.innerHeight;
    }, { passive: true });

    function raf() {
      gx += (tx - gx) * 0.06;
      gy += (ty - gy) * 0.06;
      glow.style.setProperty('--mx', (gx * 100).toFixed(2) + '%');
      glow.style.setProperty('--my', (gy * 100).toFixed(2) + '%');
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
  }

  if (reduceMotion) {
    layer.classList.add('is-static');
  }
})();