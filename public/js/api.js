/**
 * API Client — handles all HTTP requests to the backend
 */
const API = {
  BASE: '',

  async request(url, options = {}) {
    try {
      const res = await fetch(this.BASE + url, {
        headers: { 'Content-Type': 'application/json', ...options.headers },
        ...options,
        body: options.body ? JSON.stringify(options.body) : undefined
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `Request failed (${res.status})`);
      }
      return data;
    } catch (err) {
      throw err;
    }
  },

  // ── Auth ──
  auth: {
    connect(token) {
      return API.request('/api/auth/connect', { method: 'POST', body: { token } });
    },
    status() {
      return API.request('/api/auth/status');
    },
    disconnect() {
      return API.request('/api/auth/disconnect', { method: 'POST' });
    }
  },

  // ── GitHub ──
  github: {
    createRepo({ name, description, isPrivate }) {
      return API.request('/api/github/create-repo', {
        method: 'POST',
        body: { name, description, isPrivate }
      });
    },
    listRepos(page = 1) {
      return API.request(`/api/github/repos?page=${page}`);
    },
    checkName(name) {
      return API.request('/api/github/check-name', { method: 'POST', body: { name } });
    },
    getUser() {
      return API.request('/api/github/user');
    }
  },

  // ── Git ──
  git: {
    status(directory) {
      return API.request('/api/git/status', { method: 'POST', body: { directory } });
    },
    push({ directory, repoUrl, commitMessage, branch, gitignoreContent }) {
      return API.request('/api/git/push', {
        method: 'POST',
        body: { directory, repoUrl, commitMessage, branch, gitignoreContent }
      });
    }
  },

  // ── Filesystem ──
  fs: {
    scan(directory) {
      return API.request('/api/fs/scan', { method: 'POST', body: { directory } });
    },
    browse(directory) {
      return API.request('/api/fs/browse', { method: 'POST', body: { directory } });
    },
    gitignoreTemplates() {
      return API.request('/api/fs/gitignore-templates');
    },
    gitignoreTemplate(key) {
      return API.request(`/api/fs/gitignore-template/${key}`);
    },
    resolvePath(relativePath) {
      return API.request('/api/fs/resolve-path', { method: 'POST', body: { relativePath } });
    }
  }
};
