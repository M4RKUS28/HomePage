/**
 * Shared Axios client for all backend API calls.
 *
 * All client-side requests go to /api/* which is handled by the NextJS
 * catch-all API route ([...path]/route.js).  The proxy reads the
 * encrypted iron-session cookie, signs a short-lived JWT, and forwards
 * the request to FastAPI.
 *
 * ⇒ No Bearer token is needed on the client side.
 */
import axios from 'axios';
import { getApiBaseUrl } from '../lib/api-config';

const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
  // The session cookie is sent automatically (same-origin, httpOnly)
  withCredentials: true,
});

// ---------------------------------------------------------------------------
// Response interceptor - handle 401 globally
// ---------------------------------------------------------------------------

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      const url = error.config?.url || '';
      const isAuthRoute = url.includes('/auth/login') || url.includes('/auth/register');

      if (!isAuthRoute) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

export default apiClient;

export default apiClient;
