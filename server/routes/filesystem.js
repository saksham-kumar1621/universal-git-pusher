const express = require('express');
const router = express.Router();
const fileService = require('../services/fileService');
const { detectProject } = require('../utils/detectProject');
const { listTemplates, getTemplate } = require('../utils/gitignoreTemplates');

/**
 * POST /api/fs/scan
 * Scan a directory — get tree, stats, and project type
 */
router.post('/scan', (req, res) => {
  try {
    const { directory } = req.body;
    if (!directory) return res.status(400).json({ error: 'Directory is required' });
    if (!fileService.isDirectory(directory)) {
      return res.status(400).json({ error: 'Path is not a valid directory' });
    }

    const tree = fileService.getDirectoryTree(directory, 3);
    const stats = fileService.getDirectoryStats(directory);
    const project = detectProject(directory);
    const hasGitignore = fileService.hasGitignore(directory);
    const existingGitignore = fileService.readGitignore(directory);

    res.json({
      directory,
      tree,
      stats,
      project,
      hasGitignore,
      existingGitignore
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/fs/browse
 * Browse directories for folder picker
 */
router.post('/browse', (req, res) => {
  try {
    const { directory } = req.body;

    if (!directory) {
      // Return root drives/directories
      const roots = fileService.getRoots();
      return res.json({ items: roots, path: '' });
    }

    const items = fileService.listDirectory(directory);
    res.json({ items, path: directory });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/fs/gitignore-templates
 * List all available .gitignore templates
 */
router.get('/gitignore-templates', (req, res) => {
  res.json({ templates: listTemplates() });
});

/**
 * GET /api/fs/gitignore-template/:key
 * Get a specific template content
 */
router.get('/gitignore-template/:key', (req, res) => {
  const template = getTemplate(req.params.key);
  res.json({ template });
});

/**
 * POST /api/fs/resolve-path
 * Resolve a dropped file's webkitRelativePath to a real directory path
 * Browser drag & drop gives us relative paths — this finds the real folder
 */
router.post('/resolve-path', (req, res) => {
  try {
    const { relativePath } = req.body;
    if (!relativePath) {
      return res.status(400).json({ error: 'relativePath is required' });
    }

    // The webkitRelativePath looks like "folderName/subdir/file.txt"
    // We need to find this folder on disk. Try common project locations.
    const path = require('path');
    const fs = require('fs');
    const os = require('os');

    // Extract the top-level folder name from the relative path
    const topFolder = relativePath.split('/')[0] || relativePath.split('\\')[0];

    // Search common parent directories
    const searchDirs = [
      path.join(os.homedir(), 'Desktop'),
      path.join(os.homedir(), 'Desktop', 'Projects'),
      path.join(os.homedir(), 'Documents'),
      path.join(os.homedir(), 'OneDrive', 'Desktop'),
      path.join(os.homedir(), 'OneDrive', 'Desktop', 'Projects'),
      path.join(os.homedir(), 'projects'),
      path.join(os.homedir(), 'repos'),
      path.join(os.homedir(), 'code'),
      os.homedir(),
      'C:\\',
      'D:\\'
    ];

    for (const searchDir of searchDirs) {
      const candidate = path.join(searchDir, topFolder);
      if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) {
        return res.json({ resolved: true, directory: candidate });
      }
    }

    // Fallback: couldn't resolve
    res.json({ resolved: false, topFolder, message: `Could not locate "${topFolder}" on disk. Please enter the path manually.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
