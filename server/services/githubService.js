const { Octokit } = require('octokit');

class GitHubService {
  constructor() {
    this.octokit = null;
    this.user = null;
  }

  /**
   * Initialize Octokit with a token
   */
  init(token) {
    this.octokit = new Octokit({ auth: token });
    this.user = null;
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
    if (!this.octokit) throw new Error('Not authenticated');
    if (this.user) {
      return {
        login: this.user.login,
        name: this.user.name,
        avatar_url: this.user.avatar_url,
        html_url: this.user.html_url,
        public_repos: this.user.public_repos,
        total_private_repos: this.user.total_private_repos,
        bio: this.user.bio,
        followers: this.user.followers,
        following: this.user.following
      };
    }
    const result = await this.validateToken();
    return result.user;
  }

  /**
   * Create a new repository on GitHub
   */
  async createRepo({ name, description = '', isPrivate = false, autoInit = false }) {
    if (!this.octokit) throw new Error('Not authenticated');

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
      if (err.status === 422) {
        // Repo already exists — fetch its info and return it
        try {
          const { data } = await this.octokit.rest.repos.get({
            owner: this.user.login,
            repo: name
          });
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
        } catch {
          return {
            success: false,
            error: `Repository '${name}' already exists but could not fetch its details.`
          };
        }
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
    if (!this.octokit || !this.user) throw new Error('Not authenticated');

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
  getCloneUrl(repoName) {
    if (!this.user) throw new Error('Not authenticated');
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
