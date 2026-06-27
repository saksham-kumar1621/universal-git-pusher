/**
 * Dashboard Component — profile and recent pushes
 */
const DashboardComponent = {
  init() {
    document.getElementById('btn-new-push').addEventListener('click', () => {
      App.showPage('wizard');
      WizardComponent.reset();
    });

    document.getElementById('btn-disconnect').addEventListener('click', () => this.disconnect());
  },

  render(user) {
    // Profile card
    document.getElementById('profile-avatar').src = user.avatar_url;
    document.getElementById('profile-name').textContent = user.name || user.login;
    document.getElementById('profile-username').textContent = `@${user.login}`;
    document.getElementById('profile-repos').textContent = (user.public_repos || 0) + (user.total_private_repos || 0);
    document.getElementById('profile-followers').textContent = user.followers || 0;
    document.getElementById('profile-following').textContent = user.following || 0;

    // Header user
    document.getElementById('header-avatar').src = user.avatar_url;
    document.getElementById('header-username').textContent = `@${user.login}`;
    document.getElementById('header-user').style.display = 'flex';

    // Recent pushes
    this.loadRecentPushes();
  },

  loadRecentPushes() {
    const list = document.getElementById('recent-list');
    const pushes = JSON.parse(localStorage.getItem('recentPushes') || '[]');

    if (pushes.length === 0) {
      list.innerHTML = `
        <li class="empty-state">
          <span class="empty-state-icon"><i data-lucide="inbox" class="lucide-icon-lg"></i></span>
          No pushes yet. Start by pushing your first project!
        </li>
      `;
      if (typeof lucide !== 'undefined') lucide.createIcons();
      return;
    }

    list.innerHTML = pushes.slice(0, 8).map(p => `
      <li class="recent-item">
        <div class="recent-item-info">
          <div class="recent-item-icon"><i data-lucide="package" class="lucide-icon-sm"></i></div>
          <div>
            <div class="recent-item-name">${this.escapeHtml(p.repoName)}</div>
            <div class="recent-item-path">${this.escapeHtml(p.directory)}</div>
          </div>
        </div>
        <div class="recent-item-time">${this.timeAgo(p.timestamp)}</div>
      </li>
    `).join('');

    if (typeof lucide !== 'undefined') lucide.createIcons();
  },

  addRecentPush(repoName, directory, repoUrl) {
    const pushes = JSON.parse(localStorage.getItem('recentPushes') || '[]');
    pushes.unshift({
      repoName,
      directory,
      repoUrl,
      timestamp: Date.now()
    });
    // Keep only last 20
    localStorage.setItem('recentPushes', JSON.stringify(pushes.slice(0, 20)));
    this.loadRecentPushes();
  },

  async disconnect() {
    try {
      await API.auth.disconnect();
      App.user = null;
      document.getElementById('header-user').style.display = 'none';
      App.showPage('auth');
      Toast.info('Disconnected from GitHub');
    } catch (err) {
      Toast.error('Failed to disconnect');
    }
  },

  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },

  timeAgo(timestamp) {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return new Date(timestamp).toLocaleDateString();
  }
};
