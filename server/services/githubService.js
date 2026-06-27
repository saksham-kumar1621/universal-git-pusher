const { Octokit } = require('octokit');

class GitHubService {
  constructor() {
    this.octokit = null;
    this.user = null;
    // Bootstrap: re-init from saved token on startup so server restarts don't log users out
    this._bootstrap();
  }

  _bootstrap() {
    const token = process.env.GITHUB_TOKEN;
    if (token && !token.startsWith('ghp_xxx') && token.length > 10) {
      this.octokit = new Octokit({ auth: token });
      // user will be lazy-loaded on first request via ensureUser()
    }
  }

  /**
   * Initialize Octokit with a token
   */
  init(token) {
    this.octokit = new Octokit({ auth: token });
    this.user = null; // will be loaded lazily
  }

  /**
   * Ensure this.user is populated — lazy-loads from GitHub if null.
   * Throws if not authenticated at all.
   */
  async ensureUser() {
    if (!this.octokit) throw new Error('Not authenticated');
    if (!this.user) {
      const { data } = await this.octokit.rest.users.getAuthenticated();
      this.user = data;
    }
    return this.user;
  }

  /**
   * Validate token and get authenticated user info
   */
  async validateToken(token) {
    try {
      this.init(token);
      const { data } = await this.octokit.rest.users.getAuthenticated();
      this.user = data;
      return {
        valid: true,
        user: {
          login: data.login,
          name: data.name,
          avatar_url: data.avatar_url,
          html_url: data.html_url,
          public_repos: data.public_repos,
          total_private_repos: data.total_private_repos,
          bio: data.bio,
          followers: data.followers,
          following: data.following
        }
      };
    } catch (err) {
      this.octokit = null;
      return {
        valid: false,
        error: err.message || 'Invalid token'
      };
    }
  }

  /**
   * Get current authenticated user
   */
  async getUser() {
    const user = await this.ensureUser();
    return {
      login: user.login,
      name: user.name,
      avatar_url: user.avatar_url,
      html_url: user.html_url,
      public_repos: user.public_repos,
      total_private_repos: user.total_private_repos,
      bio: user.bio,
      followers: user.followers,
      following: user.following
    };
  }

  /**
   * Create a new repository on GitHub
   */
  async createRepo({ name, description = '', isPrivate = false, autoInit = false }) {
    await this.ensureUser();

    try {
      const { data } = await this.octokit.rest.repos.createForAuthenticatedUser({
        name,
        description,
        private: isPrivate,
        auto_init: autoInit
      });

      return {
        success: true,
        created: true,
        repo: {
          name: data.name,
          full_name: data.full_name,
          html_url: data.html_url,
          clone_url: data.clone_url,
          ssh_url: data.ssh_url,
          private: data.private
        }
      };
    } catch (err) {
      // 422 = Unprocessable — extract GitHub's real error reason
      if (err.status === 422) {
        // Pull the actual message from GitHub's error response
        const ghErrors = err.response?.data?.errors || [];
        const ghMessage = err.response?.data?.message || '';
        const isNameTaken = ghErrors.some(e =>
          (e.message || '').toLowerCase().includes('already exist') ||
          (e.field === 'name' && e.code === 'custom')
        ) || ghMessage.toLowerCase().includes('already exist');

        if (isNameTaken) {
          // Repo name is taken — try fetching it from *this* user's account
          try {
            const { data } = await this.octokit.rest.repos.get({
              owner: this.user.login,
              repo: name
            });
            // Confirmed on this account — safe to push to it
            return {
              success: true,
              created: false,
              existed: true,
              repo: {
                name: data.name,
                full_name: data.full_name,
                html_url: data.html_url,
                clone_url: data.clone_url,
                ssh_url: data.ssh_url,
                private: data.private
              }
            };
          } catch (fetchErr) {
            if (fetchErr.status === 404) {
              // Name is taken but repo doesn't show on this account —
              // likely recently deleted (GitHub reserves names for ~5 min)
              return {
                success: false,
                error: `Repository '${name}' was recently deleted. GitHub reserves deleted repo names for a few minutes. Please wait a moment and try again, or use a different name.`
              };
            }
            return {
              success: false,
              error: `Repository '${name}' appears to be taken. Try a different name.`
            };
          }
        }

        // Some other 422 reason — show GitHub's actual message
        const reason = ghErrors.map(e => e.message).filter(Boolean).join(', ')
          || ghMessage
          || 'Repository name may be invalid.';
        return {
          success: false,
          error: `GitHub rejected the repository name '${name}': ${reason}`
        };
      }
      throw err;
    }
  }

  /**
   * List user repositories
   */
  async listRepos(page = 1, perPage = 30, sort = 'updated') {
    if (!this.octokit) throw new Error('Not authenticated');

    const { data } = await this.octokit.rest.repos.listForAuthenticatedUser({
      page,
      per_page: perPage,
      sort,
      direction: 'desc'
    });

    return data.map(repo => ({
      name: repo.name,
      full_name: repo.full_name,
      html_url: repo.html_url,
      clone_url: repo.clone_url,
      private: repo.private,
      description: repo.description,
      language: repo.language,
      updated_at: repo.updated_at,
      stargazers_count: repo.stargazers_count
    }));
  }

  /**
   * Check if a repository name is available
   */
  async checkRepoName(name) {
    await this.ensureUser();

    try {
      await this.octokit.rest.repos.get({
        owner: this.user.login,
        repo: name
      });
      return { available: false, message: `Repository '${name}' already exists` };
    } catch (err) {
      if (err.status === 404) {
        return { available: true, message: `Repository '${name}' is available` };
      }
      throw err;
    }
  }

  /**
   * Get the clone URL for a repo
   */
  async getCloneUrl(repoName) {
    await this.ensureUser();
    return `https://github.com/${this.user.login}/${repoName}.git`;
  }

  /**
   * Disconnect / clear auth
   */
  disconnect() {
    this.octokit = null;
    this.user = null;
  }
}

module.exports = new GitHubService();
