import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002/api';

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Inject token interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('syncspace_token');
    const isPublicRoute = config.url.includes('/auth/login') || config.url.includes('/auth/register');
    if (!token && !isPublicRoute) {
      const cancelError = new Error('No token provided');
      cancelError.status = 401;
      cancelError.isCustomAuthError = true;
      return Promise.reject(cancelError);
    }
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response error handler interceptor
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.isCustomAuthError) {
      return Promise.reject(error);
    }
    const status = error.response?.status;
    const msg = error.response?.data?.error || error.response?.data?.message || error.message || 'API request error';
    const err = new Error(msg);
    if (error.response) {
      err.status = status;
      err.response = error.response;
    }
    // Timeout errors
    if (error.code === 'ECONNABORTED') {
      err.message = 'Request timed out — server is taking too long to respond';
    }
    return Promise.reject(err);
  }
);

export default apiClient;

