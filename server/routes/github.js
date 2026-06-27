const express = require('express');
const router = express.Router();
const githubService = require('../services/githubService');

/**
 * POST /api/github/create-repo
 * Create a new repository on GitHub
 */
router.post('/create-repo', async (req, res) => {
  try {
    const { name, description, isPrivate } = req.body;
    if (!name) return res.status(400).json({ error: 'Repository name is required' });

    const result = await githubService.createRepo({
      name,
      description: description || '',
      isPrivate: isPrivate || false,
      autoInit: false
    });

    // Surface service-level errors as HTTP errors so frontend handles them properly
    if (!result.success) {
      return res.status(422).json({ error: result.error });
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/github/repos
 * List user repositories
 */
router.get('/repos', async (req, res) => {
  try {
    const { page, perPage } = req.query;
    const repos = await githubService.listRepos(
      parseInt(page) || 1,
      parseInt(perPage) || 30
    );
    res.json({ repos });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/github/check-name
 * Check if a repo name is available
 */
router.post('/check-name', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });

    const result = await githubService.checkRepoName(name);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/github/user
 * Get authenticated user info
 */
router.get('/user', async (req, res) => {
  try {
    const user = await githubService.getUser();
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
