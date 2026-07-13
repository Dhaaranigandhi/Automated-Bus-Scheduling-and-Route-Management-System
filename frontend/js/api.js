// Smart Bus Routing API Client

const API_BASE_URL = (() => {
  // If running from file:// protocol (direct HTML open), connect to localhost:5000
  if (window.location.protocol === 'file:') {
    return 'http://localhost:5000/api';
  }
  // Otherwise, use relative API route
  return '/api';
})();

/**
 * Perform an authenticated API request
 * @param {string} endpoint - API endpoint (e.g., '/buses')
 * @param {object} options - Fetch options
 */
async function apiFetch(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Set headers
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  // Add JWT Auth Token if present in local storage
  const token = localStorage.getItem('smart_bus_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      // If unauthorized (401) and not trying to log in, clear credentials & redirect to login
      if (response.status === 401 && !endpoint.includes('/auth/login')) {
        localStorage.removeItem('smart_bus_token');
        localStorage.removeItem('smart_bus_admin');
        window.location.href = '/pages/login.html';
      }
      throw new Error(data.message || `Request failed with status ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error(`[API Error] ${endpoint}:`, error);
    throw error;
  }
}

// Export API functions to global window namespace
window.API_BASE_URL = API_BASE_URL;
window.apiFetch = apiFetch;
