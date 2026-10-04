/**
 * hero-photo-tilt.js
 * -----------------------------------------------------------------------
 * Auto-floating hero photo (via CSS animation) + mouse-driven 3D tilt on
 * hover. While the mouse is moving over the card, the CSS float animation
 * pauses and JS takes over rotateX/rotateY directly. When the mouse
 * leaves, JS clears the inline transform and the CSS float resumes.
 * Disabled on touch devices and when prefers-reduced-motion is set.
 * -----------------------------------------------------------------------
 */
(function heroPhotoTiltModule() {
  const card = document.getElementById('heroPhotoTilt');
  if (!card) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches;
  if (reduceMotion || isTouch) return;

  const MAX_TILT = 16; // degrees
  let currentX = 0, currentY = 0, targetX = 0, targetY = 0;
  let rafId = null;

  function onMove(e) {
    card.classList.add('is-interacting');

    const rect = card.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width;
    const relY = (e.clientY - rect.top) / rect.height;

    targetY = (relX - 0.5) * MAX_TILT * 2;   // rotateY from left-right
    targetX = -(relY - 0.5) * MAX_TILT * 2;  // rotateX from up-down

    card.style.setProperty('--sx', (relX * 100).toFixed(1) + '%');
    card.style.setProperty('--sy', (relY * 100).toFixed(1) + '%');
  }

  function onLeave() {
    card.classList.remove('is-interacting');
    card.style.transform = ''; // hand control back to the CSS float animation
  }

  function raf() {
    if (card.classList.contains('is-interacting')) {
      currentX += (targetX - currentX) * 0.12;
      currentY += (targetY - currentY) * 0.12;
      card.style.transform = `rotateX(${currentX}deg) rotateY(${currentY}deg)`;
    }
    rafId = requestAnimationFrame(raf);
  }

  card.addEventListener('mousemove', onMove);
  card.addEventListener('mouseleave', onLeave);

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          if (!rafId) rafId = requestAnimationFrame(raf);
        } else {
          if (rafId) cancelAnimationFrame(rafId);
          rafId = null;
        }
      });
    }, { threshold: 0.05 });
    io.observe(card);
  } else {
    rafId = requestAnimationFrame(raf);
  }
})();