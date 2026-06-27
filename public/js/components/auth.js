/**
 * Auth Component — handles GitHub token connection
 */
const AuthComponent = {
  init() {
    const btnConnect = document.getElementById('btn-connect');
    const inputToken = document.getElementById('input-token');

    btnConnect.addEventListener('click', () => this.connect());
    inputToken.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.connect();
    });
  },

  async connect() {
    const inputToken = document.getElementById('input-token');
    const btnConnect = document.getElementById('btn-connect');
    const token = inputToken.value.trim();

    if (!token) {
      Toast.warning('Please enter a GitHub Personal Access Token');
      return;
    }

    // Loading state
    btnConnect.disabled = true;
    btnConnect.innerHTML = '<span class="spinner"></span> Connecting...';

    try {
      const data = await API.auth.connect(token);
      if (data.success) {
        Toast.success(`Connected as ${data.user.login}!`);
        App.setUser(data.user);
        App.showPage('dashboard');
      } else {
        Toast.error('Invalid token. Please check and try again.');
      }
    } catch (err) {
      Toast.error(err.message || 'Failed to connect');
    } finally {
      btnConnect.disabled = false;
      btnConnect.innerHTML = 'Connect';
    }
  },

  async checkExistingAuth() {
    try {
      const data = await API.auth.status();
      if (data.authenticated) {
        App.setUser(data.user);
        App.showPage('dashboard');
        return true;
      }
    } catch {
      // Not authenticated
    }
    return false;
  }
};
