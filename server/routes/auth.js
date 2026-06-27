const express = require('express');
const router = express.Router();
const githubService = require('../services/githubService');
const fs = require('fs');
const path = require('path');

/**
 * POST /api/auth/connect
 * Validate and store a GitHub PAT
 */
router.post('/connect', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    const result = await githubService.validateToken(token);
    if (result.valid) {
      // Save token to .env file
      const envPath = path.join(process.cwd(), '.env');
      let envContent = '';
      if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, 'utf-8');
        // Replace existing GITHUB_TOKEN line
        if (envContent.includes('GITHUB_TOKEN=')) {
          envContent = envContent.replace(/GITHUB_TOKEN=.*/g, `GITHUB_TOKEN=${token}`);
        } else {
          envContent += `\nGITHUB_TOKEN=${token}`;
        }
      } else {
        envContent = `GITHUB_TOKEN=${token}\nPORT=3000\n`;
      }
      fs.writeFileSync(envPath, envContent);

      // Update process env
      process.env.GITHUB_TOKEN = token;

      res.json({ success: true, user: result.user });
    } else {
      res.status(401).json({ success: false, error: result.error });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/auth/status
 * Check current auth status
 */
router.get('/status', async (req, res) => {
  try {
    const token = process.env.GITHUB_TOKEN;
    if (!token || token.startsWith('ghp_xxx')) {
      return res.json({ authenticated: false });
    }

    const result = await githubService.validateToken(token);
    if (result.valid) {
      res.json({ authenticated: true, user: result.user });
    } else {
      res.json({ authenticated: false });
    }
  } catch {
    res.json({ authenticated: false });
  }
});

/**
 * POST /api/auth/disconnect
 * Clear stored token
 */
router.post('/disconnect', (req, res) => {
  githubService.disconnect();
  // Remove from .env
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    let envContent = fs.readFileSync(envPath, 'utf-8');
    envContent = envContent.replace(/GITHUB_TOKEN=.*/g, 'GITHUB_TOKEN=');
    fs.writeFileSync(envPath, envContent);
  }
  process.env.GITHUB_TOKEN = '';
  res.json({ success: true });
});

module.exports = router;
