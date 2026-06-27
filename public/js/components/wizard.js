/**
 * Wizard Component — multi-step push flow
 */
const WizardComponent = {
  currentStep: 1,
  scanData: null,
  selectedGitignoreKey: null,
  selectedGitignoreContent: null,
  isPrivate: false,
  repoNameAvailable: false,
  browsingPath: '',

  init() {
    // Step 1
    document.getElementById('btn-scan').addEventListener('click', () => this.scanFolder());
    document.getElementById('input-folder').addEventListener('input', () => {
      document.getElementById('btn-scan').style.display = 'inline-flex';
      document.getElementById('scan-results').style.display = 'none';
      document.getElementById('btn-step1-next').disabled = true;
    });
    document.getElementById('input-folder').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.scanFolder();
    });
    document.getElementById('btn-step1-next').addEventListener('click', () => this.goToStep(2));
    document.getElementById('btn-wizard-cancel').addEventListener('click', () => {
      App.showPage('dashboard');
    });

    // Folder browser
    document.getElementById('btn-browse').addEventListener('click', () => this.openBrowser());
    document.getElementById('modal-close').addEventListener('click', () => this.closeBrowser());
    document.getElementById('modal-up').addEventListener('click', () => this.browserUp());
    document.getElementById('modal-select').addEventListener('click', () => this.browserSelect());

    // ── Drag & Drop ──
    this.initDragAndDrop();

    // Step 2
    document.getElementById('btn-step2-back').addEventListener('click', () => this.goToStep(1));
    document.getElementById('btn-step2-next').addEventListener('click', () => this.goToStep(3));
    document.getElementById('input-repo-name').addEventListener('input', () => this.debounceCheckName());

    // Visibility toggle
    document.getElementById('visibility-toggle').addEventListener('click', (e) => {
      const option = e.target.closest('.visibility-option');
      if (!option) return;
      document.querySelectorAll('.visibility-option').forEach(o => o.classList.remove('active'));
      option.classList.add('active');
      this.isPrivate = option.dataset.visibility === 'private';
    });

    // Step 3
    document.getElementById('btn-step3-back').addEventListener('click', () => this.goToStep(2));
    document.getElementById('btn-step3-next').addEventListener('click', () => this.goToStep(4));

    // Step 4
    document.getElementById('btn-step4-back').addEventListener('click', () => this.goToStep(3));
    document.getElementById('btn-push').addEventListener('click', () => this.executePush());

    // Step 5
    document.getElementById('btn-back-dashboard').addEventListener('click', () => {
      App.showPage('dashboard');
    });
    document.getElementById('btn-push-another').addEventListener('click', () => {
      this.reset();
    });
  },

  reset() {
    this.currentStep = 1;
    this.scanData = null;
    this.selectedGitignoreKey = null;
    this.selectedGitignoreContent = null;
    this.isPrivate = false;
    this.repoNameAvailable = false;

    // Reset UI
    document.getElementById('input-folder').value = '';
    document.getElementById('scan-results').style.display = 'none';
    document.getElementById('btn-scan').style.display = 'none';
    document.getElementById('btn-step1-next').disabled = true;
    document.getElementById('input-repo-name').value = '';
    document.getElementById('input-repo-desc').value = '';
    document.getElementById('name-check').innerHTML = '';
    document.getElementById('btn-step2-next').disabled = true;
    document.getElementById('input-commit-msg').value = 'Initial commit';
    document.getElementById('input-branch').value = 'main';
    document.getElementById('push-success').style.display = 'none';
    document.getElementById('push-error').style.display = 'none';
    document.getElementById('push-final-buttons').style.display = 'none';
    document.getElementById('push-progress').style.display = 'block';
    document.getElementById('push-title').innerHTML = '<i data-lucide="loader" class="lucide-icon-sm lucide-spin"></i> Pushing to GitHub...';
    document.getElementById('push-subtitle').textContent = 'Please wait while we push your project.';

    // Reset visibility
    document.querySelectorAll('.visibility-option').forEach(o => o.classList.remove('active'));
    document.querySelector('.visibility-option[data-visibility="public"]').classList.add('active');

    // Reset push step icons
    document.querySelectorAll('.push-step-icon').forEach(icon => {
      icon.className = 'push-step-icon pending';
    });
    document.querySelectorAll('[id^="ps-detail-"]').forEach(d => {
      d.textContent = 'Waiting...';
    });

    // Reset drop zone
    const wizardDrop = document.getElementById('wizard-drop-zone');
    if (wizardDrop) {
      const icon = document.getElementById('wizard-drop-icon');
      const text = wizardDrop.querySelector('.drop-zone-text');
      const subtext = wizardDrop.querySelector('.drop-zone-subtext');
      if (icon) icon.innerHTML = '<i data-lucide="folder-down" class="lucide-icon-lg"></i>';
      if (text) text.textContent = 'Drag & drop a project folder here';
      if (subtext) subtext.textContent = 'or use the input below';
    }

    this.goToStep(1);
    if (typeof lucide !== 'undefined') lucide.createIcons();
  },

  goToStep(step) {
    this.currentStep = step;

    // Hide all steps
    document.querySelectorAll('.wizard-step').forEach(s => s.style.display = 'none');
    document.getElementById(`wizard-step-${step}`).style.display = 'block';

    // Update progress dots
    document.querySelectorAll('.wizard-dot').forEach(dot => {
      const dotStep = parseInt(dot.dataset.step);
      dot.className = 'wizard-dot';
      if (dotStep < step) dot.classList.add('completed');
      else if (dotStep === step) dot.classList.add('active');
    });

    document.querySelectorAll('.wizard-line').forEach(line => {
      const lineStep = parseInt(line.dataset.line);
      line.className = 'wizard-line';
      if (lineStep < step) line.classList.add('completed');
    });

    // Step-specific setup
    if (step === 2) this.setupStep2();
    if (step === 3) this.setupStep3();
  },

  // ── Step 1: Scan folder ──
  async scanFolder() {
    const folder = document.getElementById('input-folder').value.trim();
    if (!folder) {
      Toast.warning('Please enter a folder path');
      return;
    }

    const btnScan = document.getElementById('btn-scan');
    btnScan.disabled = true;
    btnScan.innerHTML = '<span class="spinner spinner-sm"></span> Scanning...';

    try {
      const data = await API.fs.scan(folder);
      this.scanData = data;

      // Show results
      document.getElementById('scan-results').style.display = 'block';
      document.getElementById('btn-scan').style.display = 'none';

      // Project detection
      document.getElementById('project-icon').innerHTML = '<i data-lucide="folder-code" class="lucide-icon-md"></i>';
      document.getElementById('project-name').textContent = data.project.name;
      const frameworkText = data.project.framework ? ` • ${data.project.framework}` : '';
      document.getElementById('project-detail').textContent = `${data.project.language}${frameworkText}`;

      // Stats
      document.getElementById('stat-files').textContent = data.stats.totalFiles.toLocaleString();
      document.getElementById('stat-size').textContent = data.stats.totalSizeFormatted;
      document.getElementById('stat-extensions').textContent = data.stats.extensions.length;

      // File tree
      this.renderFileTree(data.tree);

      // Enable next
      document.getElementById('btn-step1-next').disabled = false;

      Toast.success('Folder scanned successfully!');
    } catch (err) {
      Toast.error(err.message || 'Failed to scan folder');
    } finally {
      btnScan.disabled = false;
      btnScan.innerHTML = '<i data-lucide="scan" class="lucide-icon-sm"></i> Scan Folder';
      if (typeof lucide !== 'undefined') lucide.createIcons();
    }
  },

  renderFileTree(tree, depth = 0) {
    const container = document.getElementById('file-tree');
    if (depth === 0) container.innerHTML = '';

    tree.forEach(item => {
      const indent = '  '.repeat(depth);
      const prefix = item.isDirectory ? '<i data-lucide="folder" style="width:14px;height:14px;display:inline;vertical-align:middle;"></i> ' : '<i data-lucide="file" style="width:14px;height:14px;display:inline;vertical-align:middle;"></i> ';
      const sizeText = !item.isDirectory && item.size !== undefined
        ? ` <span class="size">(${this.formatSize(item.size)})</span>` : '';
      const skippedText = item.skipped ? ' <span class="size">[skipped]</span>' : '';

      const div = document.createElement('div');
      div.className = `file-tree-item ${item.isDirectory ? 'dir' : ''}`;
      div.innerHTML = `${indent}${prefix}${item.name}${sizeText}${skippedText}`;
      container.appendChild(div);

      if (item.children && item.children.length > 0 && !item.skipped) {
        this.renderFileTree(item.children, depth + 1);
      }
    });
  },

  formatSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  },

  // ── Drag & Drop ──
  initDragAndDrop() {
    // Prevent default drag behavior on the whole page
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(evt => {
      document.body.addEventListener(evt, (e) => {
        e.preventDefault();
        e.stopPropagation();
      });
    });

    // Wizard drop zone
    const wizardDrop = document.getElementById('wizard-drop-zone');
    if (wizardDrop) {
      this.setupDropZone(wizardDrop, (path) => this.handleDroppedPath(path));
      wizardDrop.addEventListener('click', () => {
        document.getElementById('folder-input-native').click();
      });
    }

    // Dashboard push card drop zone
    const dashboardDrop = document.getElementById('btn-new-push');
    if (dashboardDrop) {
      this.setupDropZone(dashboardDrop, (path) => {
        App.showPage('wizard');
        this.reset();
        document.getElementById('input-folder').value = path;
        this.scanFolder();
      });
    }

    // Native folder picker (hidden input)
    const nativeInput = document.getElementById('folder-input-native');
    if (nativeInput) {
      nativeInput.addEventListener('change', (e) => {
        this.handleNativeFolderSelect(e);
      });
    }
  },

  setupDropZone(element, onPathResolved) {
    let dragCounter = 0;

    element.addEventListener('dragenter', (e) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter++;
      element.classList.add('drag-over');
    });

    element.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = 'copy';
    });

    element.addEventListener('dragleave', (e) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter--;
      if (dragCounter <= 0) {
        dragCounter = 0;
        element.classList.remove('drag-over');
      }
    });

    element.addEventListener('drop', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter = 0;
      element.classList.remove('drag-over');

      // Try to get folder path from dropped items
      const path = await this.extractPathFromDrop(e);
      if (path) {
        onPathResolved(path);
      }
    });
  },

  async extractPathFromDrop(event) {
    const dt = event.dataTransfer;

    // Method 1: Check for a text/plain drop (dragged from address bar or terminal)
    const textData = dt.getData('text/plain') || dt.getData('text');
    if (textData) {
      const cleaned = textData.trim().replace(/^["']|["']$/g, '');
      // Check if it looks like a file path (has backslash or starts with /)
      if (cleaned.match(/^[A-Za-z]:\\/) || cleaned.startsWith('/') || cleaned.startsWith('\\')) {
        Toast.info(`Dropped path: ${cleaned}`);
        return cleaned;
      }
    }

    // Method 2: Files dropped with webkitRelativePath (folder drop)
    const files = dt.files;
    if (files && files.length > 0) {
      // Check for webkitRelativePath on any file
      const firstFile = files[0];
      const relativePath = firstFile.webkitRelativePath || '';

      if (relativePath) {
        // webkitRelativePath = "folderName/subdir/file.txt"
        Toast.info('Resolving folder location...');
        try {
          const result = await API.fs.resolvePath(relativePath);
          if (result.resolved) {
            Toast.success(`Found: ${result.directory}`);
            return result.directory;
          } else {
            Toast.warning(result.message || 'Could not resolve folder path. Please enter it manually.');
            return null;
          }
        } catch (err) {
          Toast.error('Failed to resolve dropped folder');
          return null;
        }
      }

      // Fallback: try using the file's name to construct a path hint
      // For items API (gives us directory entries)
      if (dt.items && dt.items.length > 0) {
        const item = dt.items[0];
        const entry = item.webkitGetAsEntry ? item.webkitGetAsEntry() : null;
        if (entry && entry.isDirectory) {
          Toast.info(`Detected folder: "${entry.name}". Searching on disk...`);
          try {
            const result = await API.fs.resolvePath(entry.name + '/placeholder');
            if (result.resolved) {
              Toast.success(`Found: ${result.directory}`);
              return result.directory;
            } else {
              Toast.warning(`Folder "${entry.name}" found but path unknown. Please enter the full path.`);
              // Pre-fill the input with the folder name as a hint
              document.getElementById('input-folder').value = entry.name;
              return null;
            }
          } catch {
            Toast.warning(`Please enter the path to "${entry.name}" manually.`);
            document.getElementById('input-folder').value = entry.name;
            return null;
          }
        }
      }

      // Last resort: just show what we got
      Toast.warning('Could not determine folder path from drop. Please enter it manually.');
      return null;
    }

    Toast.warning('No folder detected in drop. Try dragging a folder from File Explorer.');
    return null;
  },

  handleDroppedPath(path) {
    document.getElementById('input-folder').value = path;
    // Hide the drop zone visual feedback
    const wizardDrop = document.getElementById('wizard-drop-zone');
    if (wizardDrop) {
      const icon = document.getElementById('wizard-drop-icon');
      const text = wizardDrop.querySelector('.drop-zone-text');
      const subtext = wizardDrop.querySelector('.drop-zone-subtext');
      if (icon) icon.innerHTML = '<i data-lucide="check-circle" class="lucide-icon-lg"></i>';
      if (text) text.textContent = 'Folder selected!';
      if (subtext) subtext.textContent = path;
    }
    if (typeof lucide !== 'undefined') lucide.createIcons();
    this.scanFolder();
  },

  async handleNativeFolderSelect(event) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Get the first file's webkitRelativePath to determine folder
    const relativePath = files[0].webkitRelativePath;
    if (relativePath) {
      Toast.info('Resolving folder location...');
      try {
        const result = await API.fs.resolvePath(relativePath);
        if (result.resolved) {
          Toast.success(`Found: ${result.directory}`);

          // If we're on the dashboard, navigate to wizard
          if (!document.getElementById('page-wizard').classList.contains('active')) {
            App.showPage('wizard');
            this.reset();
          }

          document.getElementById('input-folder').value = result.directory;
          this.handleDroppedPath(result.directory);
        } else {
          Toast.warning(result.message || 'Could not resolve folder. Please enter path manually.');
          App.showPage('wizard');
          this.reset();
        }
      } catch (err) {
        Toast.error('Failed to resolve folder path');
      }
    }

    // Reset the input so the same folder can be selected again
    event.target.value = '';
  },

  // ── Folder Browser ──
  async openBrowser() {
    document.getElementById('folder-modal').style.display = 'flex';
    this.browsingPath = '';
    await this.loadBrowserDir('');
  },

  closeBrowser() {
    document.getElementById('folder-modal').style.display = 'none';
  },

  async loadBrowserDir(dirPath) {
    const list = document.getElementById('folder-list');
    const pathDisplay = document.getElementById('modal-path');

    list.innerHTML = '<li style="padding: 20px; text-align: center; color: var(--text-muted);">Loading...</li>';
    pathDisplay.textContent = dirPath || 'Root';

    try {
      const data = await API.fs.browse(dirPath || undefined);
      this.browsingPath = data.path || '';

      if (data.items.length === 0) {
        list.innerHTML = '<li style="padding: 20px; text-align: center; color: var(--text-muted);">Empty folder</li>';
        return;
      }

      list.innerHTML = data.items.map(item => `
        <li class="folder-list-item" data-path="${this.escapeAttr(item.path)}">
          <span class="folder-list-item-icon"><i data-lucide="folder" class="lucide-icon-sm"></i></span>
          ${this.escapeHtml(item.name)}
        </li>
      `).join('');

      // Click handlers
      list.querySelectorAll('.folder-list-item').forEach(li => {
        li.addEventListener('click', () => {
          this.loadBrowserDir(li.dataset.path);
        });
      });

      if (typeof lucide !== 'undefined') lucide.createIcons();
    } catch (err) {
      list.innerHTML = `<li style="padding: 20px; text-align: center; color: var(--accent-red);">${err.message}</li>`;
    }
  },

  browserUp() {
    if (!this.browsingPath) return;
    const parts = this.browsingPath.replace(/\\/g, '/').split('/');
    parts.pop();
    const parent = parts.join('/') || (this.browsingPath.includes(':') ? '' : '/');
    this.loadBrowserDir(parent);
  },

  browserSelect() {
    if (!this.browsingPath) {
      Toast.warning('Navigate into a folder first');
      return;
    }
    document.getElementById('input-folder').value = this.browsingPath;
    this.closeBrowser();
    document.getElementById('btn-scan').style.display = 'inline-flex';
    this.scanFolder();
  },

  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },

  escapeAttr(str) {
    return str.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  },

  // ── Step 2: Repo config ──
  setupStep2() {
    if (this.scanData && !document.getElementById('input-repo-name').value) {
      // Auto-fill repo name from folder name
      const name = this.scanData.project.name
        .toLowerCase()
        .replace(/[^a-z0-9-_]/g, '-')
        .replace(/--+/g, '-')
        .replace(/^-|-$/g, '');
      document.getElementById('input-repo-name').value = name;
      this.checkRepoName(name);
    }
  },

  _checkNameTimer: null,
  debounceCheckName() {
    clearTimeout(this._checkNameTimer);
    const name = document.getElementById('input-repo-name').value.trim();
    if (!name) {
      document.getElementById('name-check').innerHTML = '';
      document.getElementById('btn-step2-next').disabled = true;
      return;
    }
    document.getElementById('name-check').innerHTML = '<span class="checking">Checking...</span>';
    this._checkNameTimer = setTimeout(() => this.checkRepoName(name), 500);
  },

  async checkRepoName(name) {
    try {
      const data = await API.github.checkName(name);
      const el = document.getElementById('name-check');
      if (data.available) {
        el.innerHTML = `<span class="available"><i data-lucide="check" style="width:14px;height:14px;display:inline;vertical-align:middle;"></i> ${data.message} — will create new repo</span>`;
        this.repoNameAvailable = true;
        document.getElementById('btn-step2-next').disabled = false;
      } else {
        el.innerHTML = `<span class="available" style="color: var(--accent-amber)"><i data-lucide="alert-triangle" style="width:14px;height:14px;display:inline;vertical-align:middle;"></i> ${data.message} — will push to existing repo</span>`;
        this.repoNameAvailable = true;
        document.getElementById('btn-step2-next').disabled = false;
      }
      if (typeof lucide !== 'undefined') lucide.createIcons();
    } catch (err) {
      document.getElementById('name-check').innerHTML = `<span class="taken">Error checking name</span>`;
      // Still allow proceeding — the push might work if the error is transient
      document.getElementById('btn-step2-next').disabled = false;
      this.repoNameAvailable = true;
    }
  },

  // ── Step 3: Gitignore ──
  async setupStep3() {
    const container = document.getElementById('gitignore-templates');

    // Load templates if not already loaded
    if (container.children.length === 0) {
      try {
        const data = await API.fs.gitignoreTemplates();
        container.innerHTML = data.templates.map(t => `
          <div class="gitignore-template-card" data-key="${t.key}">
            <span class="gitignore-template-icon">${t.icon}</span>
            <div class="gitignore-template-name">${t.name}</div>
          </div>
        `).join('');

        container.querySelectorAll('.gitignore-template-card').forEach(card => {
          card.addEventListener('click', () => this.selectGitignoreTemplate(card.dataset.key));
        });

        if (typeof lucide !== 'undefined') lucide.createIcons();
      } catch (err) {
        Toast.error('Failed to load .gitignore templates');
      }
    }

    // Auto-select based on detected project
    if (this.scanData && !this.selectedGitignoreKey) {
      const key = this.scanData.project.gitignoreKey || 'generic';
      this.selectGitignoreTemplate(key);
    }

    // If project already has .gitignore, show it
    if (this.scanData && this.scanData.existingGitignore && !this.selectedGitignoreKey) {
      document.getElementById('gitignore-preview').textContent = this.scanData.existingGitignore;
      this.selectedGitignoreContent = this.scanData.existingGitignore;
    }
  },

  async selectGitignoreTemplate(key) {
    this.selectedGitignoreKey = key;

    // Highlight selected
    document.querySelectorAll('.gitignore-template-card').forEach(c => c.classList.remove('active'));
    const card = document.querySelector(`.gitignore-template-card[data-key="${key}"]`);
    if (card) card.classList.add('active');

    // Load content
    try {
      const data = await API.fs.gitignoreTemplate(key);
      this.selectedGitignoreContent = data.template.content;
      document.getElementById('gitignore-preview').textContent = data.template.content;
    } catch {
      Toast.error('Failed to load template');
    }
  },

  // ── Step 5: Execute push ──
  async executePush() {
    this.goToStep(5);

    const repoName = document.getElementById('input-repo-name').value.trim();
    const repoDesc = document.getElementById('input-repo-desc').value.trim();
    const commitMsg = document.getElementById('input-commit-msg').value.trim() || 'Initial commit';
    const branch = document.getElementById('input-branch').value.trim() || 'main';
    const directory = document.getElementById('input-folder').value.trim();

    try {
      // Step: Create GitHub repo
      this.updatePushStep('create-repo', 'running', 'Creating repository...');

      const repoResult = await API.github.createRepo({
        name: repoName,
        description: repoDesc,
        isPrivate: this.isPrivate
      });

      if (!repoResult.success) {
        throw new Error(repoResult.error || 'Failed to create repository');
      }

      const repoUrl = repoResult.repo.clone_url;
      if (repoResult.existed) {
        this.updatePushStep('create-repo', 'done', `Using existing: ${repoResult.repo.full_name}`);
      } else {
        this.updatePushStep('create-repo', 'done', `Created: ${repoResult.repo.full_name}`);
      }

      // Step: Git operations (init, add, commit, push)
      this.updatePushStep('gitignore', 'running', 'Writing .gitignore...');

      const pushResult = await API.git.push({
        directory,
        repoUrl,
        commitMessage: commitMsg,
        branch,
        gitignoreContent: this.selectedGitignoreContent
      });

      // Update all step statuses from result
      if (pushResult.steps) {
        pushResult.steps.forEach(s => {
          this.updatePushStep(s.step, s.status, s.message);
        });
      }

      // Update remaining steps that weren't in the response
      this.updatePushStep('gitignore', 'done', '.gitignore created');
      this.updatePushStep('init', 'done', 'Repository ready');
      this.updatePushStep('add', 'done', 'All files staged');
      this.updatePushStep('commit', 'done', 'Changes committed');
      this.updatePushStep('push', 'done', 'Pushed successfully!');

      // Show success
      document.getElementById('push-progress').style.display = 'none';
      document.getElementById('push-title').innerHTML = '<i data-lucide="check-circle-2" class="lucide-icon-sm"></i> Success!';
      document.getElementById('push-subtitle').textContent = 'Your project has been pushed to GitHub.';
      document.getElementById('push-success').style.display = 'block';
      document.getElementById('push-success-desc').textContent =
        `${repoResult.repo.full_name} is now live on GitHub!`;
      document.getElementById('push-success-link').href = repoResult.repo.html_url;
      document.getElementById('push-final-buttons').style.display = 'flex';

      // Save to recent pushes
      DashboardComponent.addRecentPush(repoName, directory, repoResult.repo.html_url);

      Toast.success('Project pushed to GitHub successfully!');
      if (typeof lucide !== 'undefined') lucide.createIcons();
    } catch (err) {
      // Show error
      document.getElementById('push-title').innerHTML = '<i data-lucide="alert-circle" class="lucide-icon-sm"></i> Push Failed';
      document.getElementById('push-subtitle').textContent = 'Something went wrong during the push.';
      document.getElementById('push-error').style.display = 'block';
      document.getElementById('push-error-message').textContent = err.message;
      document.getElementById('push-final-buttons').style.display = 'flex';

      Toast.error(err.message || 'Push failed');
    }
  },

  updatePushStep(stepName, status, detail) {
    const iconEl = document.getElementById(`ps-icon-${stepName}`);
    const detailEl = document.getElementById(`ps-detail-${stepName}`);

    if (iconEl) {
      iconEl.className = `push-step-icon ${status === 'done' ? 'done' : status === 'skipped' ? 'skipped' : status === 'running' ? 'running' : status === 'error' ? 'error' : 'pending'}`;
    }
    if (detailEl) {
      detailEl.textContent = detail;
    }
  }
};
