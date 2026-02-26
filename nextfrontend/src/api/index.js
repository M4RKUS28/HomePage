/**
 * Shared Axios client for all backend API calls.
 *
 * All requests go through Next.js rewrites:
 *   /api/:path* → BACKEND_URL/:path*
 *
 * The interceptor attaches the Bearer token from cookie / localStorage.
 */
import axios from 'axios';
import { getApiBaseUrl } from '../lib/api-config';

const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// ---------------------------------------------------------------------------
// Token helper
// ---------------------------------------------------------------------------

const getToken = () => {
  if (typeof window === 'undefined') return null;

  // Cookie first, then localStorage
  const getCookie = (name) => {
    const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
    return match ? decodeURIComponent(match[1]) : null;
  };

  return getCookie('accessToken') || localStorage.getItem('accessToken');
};

// ---------------------------------------------------------------------------
// Request interceptor – attach Bearer token
// ---------------------------------------------------------------------------

apiClient.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ---------------------------------------------------------------------------
// Response interceptor – handle 401 globally
// ---------------------------------------------------------------------------

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      // Don't redirect if the 401 came from the login/register routes themselves
      const url = error.config?.url || '';
      const isAuthRoute = url.includes('/auth/login') || url.includes('/auth/register');

      if (!isAuthRoute) {
        localStorage.removeItem('accessToken');
        document.cookie = 'accessToken=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;';
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

export default apiClient;
