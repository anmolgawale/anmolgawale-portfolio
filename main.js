/**
 * main.js
 * -----------------------------------------------------------------------
 * Theme switching, cinematic hero entrance sequence, skills rendering,
 * resume-button handling, and toast messages. Contact form submission
 * now lives in js/contact-emailjs.js (EmailJS, no backend required).
 * -----------------------------------------------------------------------
 */
document.addEventListener('DOMContentLoaded', () => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ================= Premium page load (~800ms-1.3s) ================= */
  const loader = document.getElementById('pageLoader');
  function finishLoad() {
    if (!loader) return;
    loader.classList.add('is-done');
    setTimeout(() => loader.remove(), 500);
    document.body.classList.add('is-loaded');
    runHeroSequence();
  }
  if (reduceMotion) {
    if (loader) loader.remove();
    document.body.classList.add('is-loaded');
    runHeroSequence();
  } else {
    setTimeout(finishLoad, 800);
  }

  /* ================= Theme (dark / light) ================= */
  const THEME_KEY = 'portfolio-theme';
  const themeToggle = document.getElementById('themeToggle');

  function applyTheme(theme) {
    document.body.setAttribute('data-theme', theme);
    themeToggle.setAttribute('aria-pressed', String(theme === 'light'));
  }

  function initTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved) { applyTheme(saved); return; }
    const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
    applyTheme(prefersLight ? 'light' : 'dark');
  }

  themeToggle.addEventListener('click', () => {
    const current = document.body.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    localStorage.setItem(THEME_KEY, next);
  });

  initTheme();

  /* ================= Skills rendering (glass tiles, grouped by category) ================= */
  const skillsGridFrontend = document.getElementById('skillsGridFrontend');
  const skillsGridBackend = document.getElementById('skillsGridBackend');
  if (skillsGridFrontend && skillsGridBackend && typeof SKILLS !== 'undefined' && SKILLS.length) {
    skillsGridFrontend.innerHTML = '';
    skillsGridBackend.innerHTML = '';
    SKILLS.forEach((skill) => {
      const card = document.createElement('article');
      card.className = 'glass-card skill-card reveal';
      card.setAttribute('data-glow', '');
      card.innerHTML = `
        <div class="skill-icon-wrap"><span class="skill-icon">${skill.icon}</span></div>
        <h3 class="skill-name">${skill.name}</h3>
        <span class="skill-category">${skill.category}</span>
        <p class="skill-role">${skill.role}</p>
        <span class="card-sheen" aria-hidden="true"></span>
      `;
      const target = skill.category === 'Backend' ? skillsGridBackend : skillsGridFrontend;
      target.appendChild(card);
    });
    if (window.observeReveals) {
      window.observeReveals(skillsGridFrontend.querySelectorAll('.reveal'));
      window.observeReveals(skillsGridBackend.querySelectorAll('.reveal'));
    }
  }

  /* ================= Cinematic hero entrance ================= */
  function runHeroSequence() {
    const hero = document.querySelector('.hero');
    if (!hero) return;
    if (reduceMotion) {
      hero.classList.add('hero-sequence-done');
      return;
    }
    const steps = hero.querySelectorAll('[data-hero-step]');
    steps.forEach((el, i) => {
      const delay = parseFloat(el.dataset.heroStep) || i * 0.12;
      setTimeout(() => el.classList.add('is-in'), delay * 1000);
    });
    setTimeout(() => hero.classList.add('hero-sequence-done'), 1600);
  }

  /* ================= Resume button availability check ================= */
  const resumePath = 'assets/resume/Anmol-Gawale-Resume.pdf';
  const resumeButtons = [document.getElementById('heroResumeBtn'), document.getElementById('contactResumeBtn')].filter(Boolean);

  fetch(resumePath, { method: 'HEAD' })
    .then((res) => { if (!res.ok) throw new Error('missing'); })
    .catch(() => {
      resumeButtons.forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          showToast('Resume not uploaded yet. Add it at assets/resume/Anmol-Gawale-Resume.pdf.', 'error');
        });
      });
    });

  /* ================= Toasts ================= */
  const toastStack = document.getElementById('toastStack');
  function showToast(message, type = 'success', duration = 4500) {
    const toast = document.createElement('div');
    toast.className = `toast is-${type}`;
    toast.textContent = message;
    toastStack.appendChild(toast);
    setTimeout(() => {
      toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(8px)';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }
  window.showToast = showToast;
});