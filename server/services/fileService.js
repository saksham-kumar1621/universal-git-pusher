const fs = require('fs');
const path = require('path');

class FileService {
  /**
   * Check if a path exists and is a directory
   */
  isDirectory(dirPath) {
    try {
      return fs.statSync(dirPath).isDirectory();
    } catch {
      return false;
    }
  }

  /**
   * Get directory contents as a tree structure
   */
  getDirectoryTree(dirPath, maxDepth = 3, currentDepth = 0, ignoreDirs = null) {
    if (!ignoreDirs) {
      ignoreDirs = new Set([
        'node_modules', '.git', '__pycache__', '.venv', 'venv',
        'dist', 'build', '.next', '.nuxt', 'target', 'bin', 'obj',
        '.idea', '.vscode', '.vs', 'coverage', '.cache'
      ]);
    }

    if (currentDepth >= maxDepth) return [];

    const items = [];
    try {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.name.startsWith('.') && currentDepth === 0 && entry.name !== '.gitignore') {
          // Skip hidden files at root except .gitignore
        }

        const fullPath = path.join(dirPath, entry.name);
        const item = {
          name: entry.name,
          path: fullPath,
          isDirectory: entry.isDirectory()
        };

        if (entry.isDirectory()) {
          if (ignoreDirs.has(entry.name)) {
            item.children = [];
            item.skipped = true;
          } else {
            item.children = this.getDirectoryTree(fullPath, maxDepth, currentDepth + 1, ignoreDirs);
          }
        } else {
          try {
            const stats = fs.statSync(fullPath);
            item.size = stats.size;
          } catch {
            item.size = 0;
          }
        }

        items.push(item);
      }
    } catch {
      // Permission denied or other error
    }

    // Sort: directories first, then files, alphabetically
    items.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return a.name.localeCompare(b.name);
    });

    return items;
  }

  /**
   * Get summary stats for a directory
   */
  getDirectoryStats(dirPath) {
    let totalFiles = 0;
    let totalSize = 0;
    const extensions = {};

    const ignoreDirs = new Set([
      'node_modules', '.git', '__pycache__', '.venv', 'venv',
      'dist', 'build', '.next', 'target', 'bin', 'obj'
    ]);

    const walk = (dir) => {
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            if (!ignoreDirs.has(entry.name)) {
              walk(fullPath);
            }
          } else {
            totalFiles++;
            try {
              const stats = fs.statSync(fullPath);
              totalSize += stats.size;
            } catch { /* skip */ }
            const ext = path.extname(entry.name).toLowerCase();
            if (ext) {
              extensions[ext] = (extensions[ext] || 0) + 1;
            }
          }
        }
      } catch { /* skip */ }
    };

    walk(dirPath);

    return {
      totalFiles,
      totalSize,
      totalSizeFormatted: this.formatBytes(totalSize),
      extensions: Object.entries(extensions)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([ext, count]) => ({ ext, count }))
    };
  }

  /**
   * Check if a .gitignore exists in the directory
   */
  hasGitignore(dirPath) {
    return fs.existsSync(path.join(dirPath, '.gitignore'));
  }

  /**
   * Read existing .gitignore
   */
  readGitignore(dirPath) {
    const gitignorePath = path.join(dirPath, '.gitignore');
    if (fs.existsSync(gitignorePath)) {
      return fs.readFileSync(gitignorePath, 'utf-8');
    }
    return null;
  }

  /**
   * Format bytes to human readable
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Browse drives/root directories (Windows-aware)
   */
  getRoots() {
    if (process.platform === 'win32') {
      // List available drive letters
      const drives = [];
      for (let i = 65; i <= 90; i++) {
        const drive = String.fromCharCode(i) + ':\\';
        if (fs.existsSync(drive)) {
          drives.push({ name: drive, path: drive, isDirectory: true });
        }
      }
      return drives;
    }
    return [{ name: '/', path: '/', isDirectory: true }];
  }

  /**
   * List immediate children of a directory (for browsing)
   */
  listDirectory(dirPath) {
    try {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });
      return entries
        .filter(e => e.isDirectory())
        .map(e => ({
          name: e.name,
          path: path.join(dirPath, e.name),
          isDirectory: true
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
    } catch {
      return [];
    }
  }
}

module.exports = new FileService();
