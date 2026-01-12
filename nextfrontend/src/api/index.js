import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.NODE_ENV === 'production' 
    ? (typeof window === 'undefined' ? 'http://homepagebackend:8000/api' : 'https://www.m4rkus28.de/api')
    : 'http://127.0.0.1:8000/api',
  headers: {
    'Content-Type': 'application/json',
  }
});

// Helper function to get token from cookies or localStorage
const getToken = () => {
  if (typeof window !== 'undefined') {
    // First try to get from cookies
    const getCookie = (name) => {
      const nameEQ = name + "=";
      const ca = document.cookie.split(';');
      for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
      }
      return null;
    };
    
    return getCookie('accessToken') || localStorage.getItem('accessToken');
  }
  return null;
};

apiClient.interceptors.request.use(config => {
  const token = getToken();
  console.log(`[Axios Interceptor] Request to ${config.url}. Token found: ${token ? 'YES' : 'NO'}`);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log(`[Axios Interceptor] Authorization header set for ${config.url}`);
  } else {
    console.warn(`[Axios Interceptor] No token found in cookies or localStorage for ${config.url}`);
  }
  return config;
}, error => {
  console.error('[Axios Interceptor] Request error:', error);
  return Promise.reject(error);
});

// Optional: Add a response interceptor for global error handling or token refresh
apiClient.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401) {
      // Handle unauthorized errors, e.g., redirect to login
      console.error("Unauthorized access - 401");
      if (typeof window !== 'undefined') {
        // Clean up both storage methods
        localStorage.removeItem('accessToken');
        // Remove cookie
        document.cookie = 'accessToken=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;';
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
