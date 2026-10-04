/**
 * projects.js
 * -----------------------------------------------------------------------
 * Project data + rendering/filtering logic.
 *
 * HOW TO ADD A PROJECT:
 * Add one object to the `PROJECTS` array below. That's it — the grid,
 * filters, and empty state all update automatically. No other file
 * needs to change.
 *
 *   {
 *     title: "Project name",
 *     description: "One or two sentence summary.",
 *     image: "assets/images/your-image.jpg", // optional, leave "" for placeholder
 *     technologies: ["HTML5", "CSS3", "JavaScript"],
 *     category: "Web", // one of: Web, PHP, JavaScript, Other
 *     github: "https://github.com/anmolgawale/your-repo", // optional
 *     live: "" // optional live demo URL
 *   }
 * -----------------------------------------------------------------------
 */
const PROJECTS = [
  // No projects added yet — this array intentionally starts empty.
  // See the comment block above for the object shape to use.
];

(function projectsModule() {
  const grid = document.getElementById('projectsGrid');
  const emptyState = document.getElementById('projectsEmpty');
  const filterBar = document.getElementById('filterBar');
  if (!grid) return;

  let activeFilter = 'All';

  function techIconLabel(tech) {
    return tech;
  }

  function renderCard(project) {
    const card = document.createElement('article');
    card.className = 'glass-card project-card reveal is-visible';
    card.setAttribute('data-glow', '');
    card.dataset.category = project.category || 'Other';

    const imageHtml = project.image
      ? `<img src="${project.image}" alt="${project.title} preview" loading="lazy">`
      : `<span>Preview coming soon</span>`;

    const techHtml = (project.technologies || [])
      .map((t) => `<span class="tech-pill">${techIconLabel(t)}</span>`)
      .join('');

    const linksHtml = [
      project.github
        ? `<a href="${project.github}" target="_blank" rel="noopener noreferrer">Code →</a>`
        : '',
      project.live
        ? `<a href="${project.live}" target="_blank" rel="noopener noreferrer">Live Demo →</a>`
        : ''
    ].join('');

    card.innerHTML = `
      <div class="project-card-image">${imageHtml}</div>
      <div class="project-card-body">
        <h3 class="project-card-title">${project.title}</h3>
        <p class="project-card-desc">${project.description || ''}</p>
        <div class="project-card-tech">${techHtml}</div>
        <div class="project-card-links">${linksHtml}</div>
      </div>
      <span class="card-sheen" aria-hidden="true"></span>
    `;
    return card;
  }

  function render() {
    grid.innerHTML = '';

    const filtered = activeFilter === 'All'
      ? PROJECTS
      : PROJECTS.filter((p) => p.category === activeFilter);

    if (!PROJECTS.length) {
      grid.hidden = true;
      if (filterBar) filterBar.hidden = true;
      emptyState.hidden = false;
      return;
    }

    grid.hidden = false;
    if (filterBar) filterBar.hidden = false;

    if (!filtered.length) {
      emptyState.hidden = false;
      grid.style.display = 'none';
      return;
    }

    emptyState.hidden = true;
    grid.style.display = 'grid';
    filtered.forEach((project) => grid.appendChild(renderCard(project)));
  }

  if (filterBar) {
    filterBar.addEventListener('click', (e) => {
      const btn = e.target.closest('.filter-btn');
      if (!btn) return;

      filterBar.querySelectorAll('.filter-btn').forEach((b) => {
        b.classList.remove('is-active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('is-active');
      btn.setAttribute('aria-selected', 'true');

      activeFilter = btn.dataset.filter;
      render();
    });
  }

  render();
})();