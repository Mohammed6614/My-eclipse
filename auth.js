// Lightweight Auth helper (client-side token manager)
class AuthManager {
  constructor() {
    this.token = localStorage.getItem('authToken');
    this.user = JSON.parse(localStorage.getItem('authUser') || 'null');
  }

  setSession(token, user) {
    if (token) localStorage.setItem('authToken', token);
    if (user) localStorage.setItem('authUser', JSON.stringify(user));
    this.token = token;
    this.user = user;
  }

  logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    this.token = null;
    this.user = null;
  }

  isLoggedIn() {
    return !!localStorage.getItem('authToken');
  }

  getUser() {
    try {
      return JSON.parse(localStorage.getItem('authUser') || 'null');
    } catch (e) {
      return null;
    }
  }
}

// Global auth instance
const auth = new AuthManager();

// Export for use (if needed)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = auth;
}