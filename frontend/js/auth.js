// Auth Utilities & Route Guarding

const Auth = {
  // Check if admin is authenticated
  isAuthenticated() {
    return !!localStorage.getItem('smart_bus_token');
  },

  // Get current admin info
  getAdmin() {
    const adminStr = localStorage.getItem('smart_bus_admin');
    if (!adminStr) return null;
    try {
      return JSON.parse(adminStr);
    } catch (e) {
      return null;
    }
  },

  // Save token and admin details on successful login
  login(token, admin, redirectUrl = '/pages/dashboard.html') {
    localStorage.setItem('smart_bus_token', token);
    localStorage.setItem('smart_bus_admin', JSON.stringify(admin));
    window.location.href = redirectUrl;
  },

  // Log out admin
  logout(redirectUrl = '/pages/login.html') {
    localStorage.removeItem('smart_bus_token');
    localStorage.removeItem('smart_bus_admin');
    window.location.href = redirectUrl;
  },

  // Guard current route based on auth status
  guard() {
    const path = window.location.pathname.toLowerCase();
    const isLoginPage = path.includes('login.html');
    const isPassengerPage = path.includes('passenger.html');
    const isLandingPage = path.endsWith('/') || path.includes('index.html');
    
    // Admin dashboard routes
    const isAdminRoute = !isLoginPage && !isPassengerPage && !isLandingPage;

    if (isAdminRoute && !this.isAuthenticated()) {
      console.log('[Auth Guard] Access denied. Redirecting to Login.');
      // If we are opening via file:// protocol
      if (window.location.protocol === 'file:') {
        // Find relative path to login.html
        window.location.href = 'login.html';
      } else {
        window.location.href = '/pages/login.html';
      }
    } else if (isLoginPage && this.isAuthenticated()) {
      console.log('[Auth Guard] Already logged in. Redirecting to Dashboard.');
      if (window.location.protocol === 'file:') {
        window.location.href = 'dashboard.html';
      } else {
        window.location.href = '/pages/dashboard.html';
      }
    }
  }
};

// Execute route guard immediately when this file is loaded
Auth.guard();

// Export globally
window.Auth = Auth;
