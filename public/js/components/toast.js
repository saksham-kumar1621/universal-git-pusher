/**
 * Toast Notification System
 */
const Toast = {
  container: null,

  init() {
    this.container = document.getElementById('toast-container');
  },

  show(message, type = 'info', duration = 4000) {
    if (!this.container) this.init();

    const iconMap = {
      success: 'check-circle',
      error: 'x-circle',
      warning: 'alert-triangle',
      info: 'info'
    };

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <span class="toast-icon"><i data-lucide="${iconMap[type] || iconMap.info}" class="lucide-icon-sm"></i></span>
      <span class="toast-message">${message}</span>
      <button class="toast-close" onclick="this.closest('.toast').remove()"><i data-lucide="x" style="width:14px;height:14px;"></i></button>
    `;

    this.container.appendChild(toast);

    // Re-initialize Lucide icons for dynamically added content
    if (typeof lucide !== 'undefined') lucide.createIcons();

    // Auto-remove
    setTimeout(() => {
      toast.classList.add('hiding');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },

  success(msg) { this.show(msg, 'success'); },
  error(msg) { this.show(msg, 'error'); },
  warning(msg) { this.show(msg, 'warning'); },
  info(msg) { this.show(msg, 'info'); }
};
