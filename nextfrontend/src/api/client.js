/**
 * Shared Axios client for all backend API calls.
 *
 * All client-side requests go to /api/* which is handled by the NextJS
 * catch-all API route ([...path]/route.js).  The proxy reads the
 * encrypted iron-session cookie, signs a short-lived JWT, and forwards
 * the request to FastAPI.
 *
 * No Bearer token is needed on the client side.
 */
import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// ---------------------------------------------------------------------------
// Response interceptor — handle 401 globally
// ---------------------------------------------------------------------------
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      const url = error.config?.url || '';

      // Silent auth-check endpoints — never redirect, caller handles 401
      const isSilentCheck = url.includes('/users/me') || url.includes('/auth/me');
      const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/register');
      const isAuthPage = ['/login', '/register'].includes(window.location.pathname);

      if (!isSilentCheck && !isAuthEndpoint && !isAuthPage) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

export default apiClient;
