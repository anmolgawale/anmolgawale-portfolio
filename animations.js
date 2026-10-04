/**
 * animations.js
 * -----------------------------------------------------------------------
 * Floating pill navbar behavior, active-section highlighting, scroll
 * reveal, premium custom cursor (morphs on links/buttons/cards), magnetic
 * buttons with a traveling light reflection, mouse-following card glow,
 * back-to-top, and scroll progress. Respects prefers-reduced-motion.
 * -----------------------------------------------------------------------
 */
(function animationsModule() {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches;

  /* ---------------- Navbar scroll state ---------------- */
  const navbar = document.getElementById('navbar');
  const scrollProgress = document.getElementById('scrollProgress');
  const backToTop = document.getElementById('backToTop');

  function onScroll() {
    const y = window.scrollY;
    navbar.classList.toggle('is-scrolled', y > 20);
    backToTop.classList.toggle('is-visible', y > 600);

    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? (y / docHeight) * 100 : 0;
    scrollProgress.style.width = pct + '%';
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  });

  /* ---------------- Mobile nav ---------------- */
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');

  hamburger.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('is-open');
    hamburger.setAttribute('aria-expanded', String(isOpen));
    hamburger.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
  });

  navLinks.querySelectorAll('.nav-link').forEach((link) => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('is-open');
      hamburger.setAttribute('aria-expanded', 'false');
      hamburger.setAttribute('aria-label', 'Open menu');
    });
  });

  /* ---------------- Active section highlighting + sliding pill ---------------- */
  const sections = document.querySelectorAll('main section[id]');
  const navLinkEls = document.querySelectorAll('.nav-link');
  const navIndicator = document.getElementById('navIndicator');

  function moveIndicatorTo(link) {
    if (!navIndicator || !link) return;
    const linkRect = link.getBoundingClientRect();
    const parentRect = link.closest('.nav-links').getBoundingClientRect();
    navIndicator.style.width = linkRect.width + 'px';
    navIndicator.style.transform = `translateX(${linkRect.left - parentRect.left}px)`;
    navIndicator.style.opacity = '1';
  }

  if ('IntersectionObserver' in window) {
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            navLinkEls.forEach((link) => {
              const active = link.dataset.section === id;
              link.classList.toggle('is-active', active);
              if (active) moveIndicatorTo(link);
            });
          }
        });
      },
      { rootMargin: '-40% 0px -50% 0px', threshold: 0 }
    );
    sections.forEach((s) => sectionObserver.observe(s));
  }
  window.addEventListener('resize', () => {
    const active = document.querySelector('.nav-link.is-active');
    if (active) moveIndicatorTo(active);
  });

  /* ---------------- Scroll reveal ---------------- */
  let revealObserver = null;
  if ('IntersectionObserver' in window) {
    revealObserver = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));
  } else {
    document.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-visible'));
  }
  // Exposed so dynamically-injected cards (skills, repos, projects) can opt in.
  window.observeReveals = function observeReveals(nodeList) {
    if (!revealObserver) {
      nodeList.forEach((el) => el.classList.add('is-visible'));
      return;
    }
    nodeList.forEach((el) => revealObserver.observe(el));
  };

  /* ---------------- Premium custom cursor ---------------- */
  if (!isTouch && !reduceMotion) {
    document.body.classList.add('cursor-active');
    const dot = document.getElementById('cursorDot');
    const ring = document.getElementById('cursorRing');

    let dotX = 0, dotY = 0, ringX = 0, ringY = 0;
    let mouseX = 0, mouseY = 0;

    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });

    function raf() {
      dotX += (mouseX - dotX) * 0.55;
      dotY += (mouseY - dotY) * 0.55;
      ringX += (mouseX - ringX) * 0.16;
      ringY += (mouseY - ringY) * 0.16;

      dot.style.transform = `translate(${dotX}px, ${dotY}px) translate(-50%, -50%)`;
      ring.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`;

      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    const linkTargets = 'a, .btn, [data-cursor="link"]';
    const cardTargets = '.glass-card, input, textarea';

    document.addEventListener('mouseover', (e) => {
      if (e.target.closest(linkTargets)) ring.classList.add('is-hover-link');
      else if (e.target.closest(cardTargets)) ring.classList.add('is-hover-card');
    });
    document.addEventListener('mouseout', (e) => {
      if (e.target.closest(linkTargets)) ring.classList.remove('is-hover-link');
      if (e.target.closest(cardTargets)) ring.classList.remove('is-hover-card');
    });
  }

  /* ---------------- Magnetic buttons (proximity-based, max ~8px) + traveling reflection ---------------- */
  if (!isTouch && !reduceMotion) {
    const magneticButtons = Array.from(document.querySelectorAll('.btn-glass')).map((btn) => ({
      el: btn,
      x: 0, y: 0, tx: 0, ty: 0, scale: 1,
      hovering: false
    }));
    const MAGNETIC_RADIUS = 90; // px — cursor must be within this distance to pull the button
    const MAX_PULL = 8; // px — matches the 5–8px spec ceiling
    const HOVER_LIFT = 2; // px — the "move upward 1–2px" hover state from the spec

    let lastMouseX = -9999, lastMouseY = -9999;
    window.addEventListener('mousemove', (e) => {
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
    }, { passive: true });

    magneticButtons.forEach((btn) => {
      btn.el.addEventListener('mouseenter', () => { btn.hovering = true; });
      btn.el.addEventListener('mouseleave', () => { btn.hovering = false; });
    });

    function magneticRaf() {
      magneticButtons.forEach((btn) => {
        const rect = btn.el.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = lastMouseX - cx;
        const dy = lastMouseY - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < MAGNETIC_RADIUS) {
          const pull = 1 - dist / MAGNETIC_RADIUS;
          btn.tx = (dx / MAGNETIC_RADIUS) * MAX_PULL * pull;
          btn.ty = (dy / MAGNETIC_RADIUS) * MAX_PULL * pull;
        } else {
          btn.tx = 0;
          btn.ty = 0;
        }

        const liftTarget = btn.ty - (btn.hovering ? HOVER_LIFT : 0);
        btn.x += (btn.tx - btn.x) * 0.18;
        btn.y += (liftTarget - btn.y) * 0.18;
        btn.scale += ((btn.hovering ? 1.02 : 1) - btn.scale) * 0.18;
        btn.el.style.transform = `translate(${btn.x.toFixed(2)}px, ${btn.y.toFixed(2)}px) scale(${btn.scale.toFixed(3)})`;
      });
      requestAnimationFrame(magneticRaf);
    }
    requestAnimationFrame(magneticRaf);

    // Sheen reflection still tracks the exact cursor position while directly over a button.
    magneticButtons.forEach(({ el }) => {
      el.addEventListener('mousemove', (e) => {
        const rect = el.getBoundingClientRect();
        const relX = e.clientX - rect.left;
        const relY = e.clientY - rect.top;
        el.style.setProperty('--sheen-x', (relX / rect.width) * 100 + '%');
        el.style.setProperty('--sheen-y', (relY / rect.height) * 100 + '%');
      });
    });
  }

  /* ---------------- Mouse-following card highlight (no rotation — per brief, cards stay flat) ---------------- */
  if (!isTouch) {
    document.addEventListener('mousemove', (e) => {
      const card = e.target.closest('[data-glow], .glass-card');
      if (!card) return;
      const rect = card.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      card.style.setProperty('--glow-x', x + '%');
      card.style.setProperty('--glow-y', y + '%');

      if (!reduceMotion) {
        card.style.transform = 'translateY(-4px) scale(1.005)';
      }
    });

    if (!reduceMotion) {
      document.addEventListener('mouseout', (e) => {
        const card = e.target.closest('[data-glow], .glass-card');
        if (card && !e.relatedTarget?.closest('[data-glow], .glass-card')) {
          card.style.transform = '';
        }
      });
    }
  }

  /* ---------------- Smooth scroll for in-page anchors ---------------- */
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const targetId = anchor.getAttribute('href');
      if (targetId.length < 2) return;
      const target = document.querySelector(targetId);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    });
  });
})();