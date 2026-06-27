const express = require('express');
const router = express.Router();
const gitService = require('../services/gitService');

/**
 * POST /api/git/status
 * Get git status of a directory
 */
router.post('/status', async (req, res) => {
  try {
    const { directory } = req.body;
    if (!directory) return res.status(400).json({ error: 'Directory is required' });

    const isRepo = await gitService.isGitRepo(directory);
    if (!isRepo) {
      return res.json({ isRepo: false });
    }

    const status = await gitService.getStatus(directory);
    const remotes = await gitService.getRemotes(directory);
    const branches = await gitService.getBranches(directory);

    res.json({
      isRepo: true,
      status,
      remotes,
      branches
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/git/init
 * Initialize a git repo
 */
router.post('/init', async (req, res) => {
  try {
    const { directory, branch } = req.body;
    if (!directory) return res.status(400).json({ error: 'Directory is required' });

    const result = await gitService.initRepo(directory, branch || 'main');
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/git/push
 * Full push flow
 */
router.post('/push', async (req, res) => {
  try {
    const { directory, repoUrl, commitMessage, branch, gitignoreContent } = req.body;
    if (!directory || !repoUrl || !commitMessage) {
      return res.status(400).json({ error: 'directory, repoUrl, and commitMessage are required' });
    }

    // Get the token for authenticated push
    const token = process.env.GITHUB_TOKEN || null;

    const result = await gitService.fullPush({
      directory,
      repoUrl,
      commitMessage,
      branch: branch || 'main',
      gitignoreContent,
      token
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/git/log
 * Get git log
 */
router.post('/log', async (req, res) => {
  try {
    const { directory } = req.body;
    if (!directory) return res.status(400).json({ error: 'Directory is required' });

    const log = await gitService.getLog(directory);
    res.json({ log });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
