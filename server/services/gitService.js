const simpleGit = require('simple-git');
const path = require('path');
const fs = require('fs');

class GitService {
  /**
   * Get a simple-git instance for a given directory
   */
  getGit(directory) {
    return simpleGit(directory);
  }

  /**
   * Check if a directory is already a git repository
   */
  async isGitRepo(directory) {
    try {
      const git = this.getGit(directory);
      const isRepo = await git.checkIsRepo();
      return isRepo;
    } catch {
      return false;
    }
  }

  /**
   * Initialize a new git repository
   */
  async initRepo(directory, defaultBranch = 'main') {
    const git = this.getGit(directory);
    await git.init();
    // Set default branch
    try {
      await git.raw(['branch', '-M', defaultBranch]);
    } catch {
      // Branch rename may fail if no commits yet — that's fine
    }
    return { success: true, message: `Initialized git repository in ${directory}` };
  }

  /**
   * Get repository status
   */
  async getStatus(directory) {
    const git = this.getGit(directory);
    const status = await git.status();
    return {
      current: status.current,
      tracking: status.tracking,
      files: status.files.map(f => ({
        path: f.path,
        status: f.working_dir || f.index,
        staged: f.index !== ' ' && f.index !== '?'
      })),
      staged: status.staged,
      modified: status.modified,
      not_added: status.not_added,
      created: status.created,
      deleted: status.deleted,
      isClean: status.isClean()
    };
  }

  /**
   * Stage files
   */
  async addFiles(directory, files = ['.']) {
    const git = this.getGit(directory);
    await git.add(files);
    return { success: true, message: `Staged ${files.length === 1 && files[0] === '.' ? 'all' : files.length} files` };
  }

  /**
   * Create a commit
   */
  async commit(directory, message) {
    const git = this.getGit(directory);
    const result = await git.commit(message);
    return {
      success: true,
      commit: result.commit,
      summary: {
        changes: result.summary.changes,
        insertions: result.summary.insertions,
        deletions: result.summary.deletions
      }
    };
  }

  /**
   * Add a remote origin
   */
  async addRemote(directory, url, name = 'origin') {
    const git = this.getGit(directory);
    try {
      await git.addRemote(name, url);
    } catch (err) {
      // Remote might already exist — update it
      if (err.message.includes('already exists')) {
        await git.remote(['set-url', name, url]);
      } else {
        throw err;
      }
    }
    // Mask token from log output
    const displayUrl = url.replace(/\/\/[^@]+@/, '//***@');
    return { success: true, message: `Remote '${name}' set to ${displayUrl}` };
  }

  /**
   * Push to remote
   */
  async push(directory, remote = 'origin', branch = 'main', setUpstream = true) {
    const git = this.getGit(directory);
    const args = setUpstream ? ['-u', remote, branch] : [remote, branch];
    const result = await git.push(args);
    return {
      success: true,
      message: `Pushed to ${remote}/${branch}`,
      result
    };
  }

  /**
   * Get list of remotes
   */
  async getRemotes(directory) {
    const git = this.getGit(directory);
    const remotes = await git.getRemotes(true);
    return remotes;
  }

  /**
   * Get list of branches
   */
  async getBranches(directory) {
    const git = this.getGit(directory);
    const branches = await git.branchLocal();
    return {
      current: branches.current,
      all: branches.all,
      branches: branches.branches
    };
  }

  /**
   * Create and checkout a new branch
   */
  async createBranch(directory, branchName) {
    const git = this.getGit(directory);
    await git.checkoutLocalBranch(branchName);
    return { success: true, message: `Created and switched to branch '${branchName}'` };
  }

  /**
   * Get git log
   */
  async getLog(directory, maxCount = 10) {
    const git = this.getGit(directory);
    try {
      const log = await git.log({ maxCount });
      return log.all;
    } catch {
      return [];
    }
  }

  /**
   * Write a .gitignore file
   */
  async writeGitignore(directory, content) {
    const gitignorePath = path.join(directory, '.gitignore');
    fs.writeFileSync(gitignorePath, content, 'utf-8');
    return { success: true, message: '.gitignore created' };
  }

  /**
   * Full push flow: init → add → commit → remote → push
   */
  async fullPush({ directory, repoUrl, commitMessage, branch = 'main', gitignoreContent = null, token = null }) {
    const steps = [];
    const git = this.getGit(directory);

    // Build authenticated URL if token is provided
    let authUrl = repoUrl;
    if (token && repoUrl.startsWith('https://')) {
      // Embed token in URL: https://TOKEN@github.com/user/repo.git
      authUrl = repoUrl.replace('https://', `https://${token}@`);
    }

    // Step 1: Write .gitignore if provided
    if (gitignoreContent) {
      await this.writeGitignore(directory, gitignoreContent);
      steps.push({ step: 'gitignore', status: 'done', message: '.gitignore created' });
    }

    // Step 2: Init if needed
    const isRepo = await this.isGitRepo(directory);
    if (!isRepo) {
      await this.initRepo(directory, branch);
      steps.push({ step: 'init', status: 'done', message: 'Repository initialized' });
    } else {
      steps.push({ step: 'init', status: 'skipped', message: 'Already a git repository' });
    }

    // Step 3: Add all files
    await this.addFiles(directory);
    steps.push({ step: 'add', status: 'done', message: 'All files staged' });

    // Step 4: Commit
    try {
      const commitResult = await this.commit(directory, commitMessage);
      steps.push({ step: 'commit', status: 'done', message: `Committed: ${commitResult.commit}` });
    } catch (err) {
      if (err.message.includes('nothing to commit')) {
        steps.push({ step: 'commit', status: 'skipped', message: 'Nothing new to commit' });
      } else {
        throw err;
      }
    }

    // Step 5: Ensure branch name
    try {
      await git.raw(['branch', '-M', branch]);
    } catch {
      // ignore
    }

    // Step 6: Set remote with authenticated URL
    await this.addRemote(directory, authUrl);
    steps.push({ step: 'remote', status: 'done', message: `Remote set` });

    // Step 7: Push (force-push to handle existing repos with different history)
    try {
      const pushResult = await this.push(directory, 'origin', branch, true);
      steps.push({ step: 'push', status: 'done', message: pushResult.message });
    } finally {
      // Clean up: replace token URL with clean URL to avoid leaking token in .git/config
      if (token && authUrl !== repoUrl) {
        try {
          await git.remote(['set-url', 'origin', repoUrl]);
        } catch {
          // best effort cleanup
        }
      }
    }

    return { success: true, steps };
  }
}

module.exports = new GitService();
