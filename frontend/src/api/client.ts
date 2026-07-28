import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const client = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Enables sending HTTPOnly refresh cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach Access Token
client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('transitflow_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Invalidate session or handle silent refreshes
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If token expired (401) and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry && originalRequest.url !== '/auth/login') {
      originalRequest._retry = true;
      try {
        // Attempt silent refresh
        const res = await axios.post(`${API_BASE_URL}/auth/refresh`, {}, { withCredentials: true });
        if (res.data.success && res.data.accessToken) {
          localStorage.setItem('transitflow_token', res.data.accessToken);
          originalRequest.headers.Authorization = `Bearer ${res.data.accessToken}`;
          return client(originalRequest);
        }
      } catch (refreshError) {
        // Clear auth and force log out if refresh fails
        localStorage.removeItem('transitflow_token');
        localStorage.removeItem('transitflow_user');
        window.dispatchEvent(new Event('auth-logout'));
      }
    }
    return Promise.reject(error.response?.data || error);
  }
);

export default client;
