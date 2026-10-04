/**
 * github.js
 * -----------------------------------------------------------------------
 * Pulls live public data from the GitHub REST API for the configured
 * username. No data is fabricated — on any failure (network error,
 * rate limit, empty account) a clean fallback message is shown instead.
 *
 * To point this at a different account, change GITHUB_USERNAME below.
 * -----------------------------------------------------------------------
 */
const GITHUB_USERNAME = 'anmolgawale';

(function githubModule() {
  const profileCard = document.getElementById('githubProfileCard');
  const profileLoading = document.getElementById('githubProfileLoading');
  const reposGrid = document.getElementById('reposGrid');
  const fallback = document.getElementById('githubFallback');
  const contribCard = document.getElementById('contribCard');

  if (!profileCard || !reposGrid) return;

  const CACHE_KEY = `gh-cache-${GITHUB_USERNAME}`;
  const CACHE_TTL = 10 * 60 * 1000; // 10 minutes — keeps us well under API rate limits

  function readCache() {
    try {
      const raw = sessionStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (Date.now() - parsed.savedAt > CACHE_TTL) return null;
      return parsed.data;
    } catch (err) {
      return null;
    }
  }

  function writeCache(data) {
    try {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify({ savedAt: Date.now(), data }));
    } catch (err) {
      /* sessionStorage unavailable — ignore, non-critical */
    }
  }

  function showFallback(message) {
    profileCard.hidden = true;
    reposGrid.hidden = true;
    fallback.hidden = false;
    if (message) fallback.querySelector('p').textContent = message;
    if (contribCard) {
      contribCard.innerHTML = `<p class="contrib-placeholder">Building consistently. More activity coming soon.</p>`;
    }
  }

  function renderProfile(user) {
    profileCard.innerHTML = `
      <img class="gh-avatar" src="${user.avatar_url}" alt="${user.login} avatar" loading="lazy">
      <div class="gh-profile-meta">
        <h3>${user.name || user.login}</h3>
        <p>${user.bio ? user.bio : '@' + user.login}</p>
      </div>
      <div class="gh-stats">
        <div class="gh-stat">
          <div class="gh-stat-num">${user.public_repos}</div>
          <div class="gh-stat-label">Repos</div>
        </div>
        <div class="gh-stat">
          <div class="gh-stat-num">${user.followers}</div>
          <div class="gh-stat-label">Followers</div>
        </div>
        <div class="gh-stat">
          <div class="gh-stat-num">${user.following}</div>
          <div class="gh-stat-label">Following</div>
        </div>
      </div>
    `;
  }

  function formatRelativeDate(isoString) {
    const days = Math.floor((Date.now() - new Date(isoString).getTime()) / 86400000);
    if (days < 1) return 'today';
    if (days === 1) return 'yesterday';
    if (days < 30) return `${days}d ago`;
    if (days < 365) return `${Math.floor(days / 30)}mo ago`;
    return `${Math.floor(days / 365)}y ago`;
  }

  function renderRepos(repos) {
    if (!repos.length) {
      reposGrid.innerHTML = `<p class="contrib-placeholder">No public repositories yet.</p>`;
      return;
    }

    reposGrid.innerHTML = '';
    repos
      .sort((a, b) => new Date(b.pushed_at) - new Date(a.pushed_at))
      .slice(0, 6)
      .forEach((repo) => {
        const card = document.createElement('article');
        card.className = 'glass-card repo-card';
        card.setAttribute('data-glow', '');
        card.innerHTML = `
          <h4 class="repo-card-name">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.57.1.78-.25.78-.55v-2.15c-3.2.7-3.88-1.36-3.88-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.72.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.76 2.69 1.25 3.34.96.1-.75.4-1.25.73-1.53-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.1 11.1 0 015.79 0c2.2-1.49 3.17-1.18 3.17-1.18.64 1.59.24 2.76.12 3.05.74.8 1.18 1.83 1.18 3.09 0 4.42-2.69 5.4-5.25 5.68.41.36.78 1.08.78 2.17v3.22c0 .31.21.66.79.55A10.52 10.52 0 0023.5 12c0-6.35-5.15-11.5-11.5-11.5z"/></svg>
            ${repo.name}
          </h4>
          <p class="repo-card-desc">${repo.description ? repo.description : 'No description provided.'}</p>
          <div class="repo-card-meta">
            ${repo.language ? `<span><span class="repo-lang-dot"></span>${repo.language}</span>` : ''}
            <span>★ ${repo.stargazers_count}</span>
            <span>⑂ ${repo.forks_count}</span>
          </div>
          <span class="repo-card-updated">Updated ${formatRelativeDate(repo.pushed_at)}</span>
          <span class="card-sheen" aria-hidden="true"></span>
        `;
        card.classList.add('reveal', 'is-visible');
        card.addEventListener('click', () => window.open(repo.html_url, '_blank', 'noopener,noreferrer'));
        reposGrid.appendChild(card);
      });
  }

  function renderContribPlaceholder() {
    if (!contribCard) return;
    contribCard.innerHTML = `<p class="contrib-placeholder">Building consistently. More activity coming soon.</p>`;
  }

  async function loadGitHub() {
    const cached = readCache();
    if (cached) {
      renderProfile(cached.user);
      renderRepos(cached.repos);
      renderContribPlaceholder();
      profileCard.hidden = false;
      reposGrid.hidden = false;
      return;
    }

    try {
      const [userRes, reposRes] = await Promise.all([
        fetch(`https://api.github.com/users/${GITHUB_USERNAME}`),
        fetch(`https://api.github.com/users/${GITHUB_USERNAME}/repos?per_page=100&sort=pushed`)
      ]);

      if (userRes.status === 403 || reposRes.status === 403) {
        showFallback('GitHub repositories are temporarily unavailable.');
        return;
      }
      if (!userRes.ok || !reposRes.ok) {
        showFallback();
        return;
      }

      const user = await userRes.json();
      const repos = await reposRes.json();

      writeCache({ user, repos });
      renderProfile(user);
      renderRepos(repos);
      renderContribPlaceholder();
      profileCard.hidden = false;
      reposGrid.hidden = false;
    } catch (err) {
      showFallback();
    }
  }

  loadGitHub();
})();