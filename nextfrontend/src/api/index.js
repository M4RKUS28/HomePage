import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.NODE_ENV === 'production' 
    ? 'https://your-backend-domain.com/api' 
    : 'http://127.0.0.1:8000/api',
  headers: {
    'Content-Type': 'application/json',
  }
});

apiClient.interceptors.request.use(config => {
  // Check if we're in the browser before accessing localStorage
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    console.log(`[Axios Interceptor] Request to ${config.url}. Token found: ${token ? 'YES' : 'NO'}`);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log(`[Axios Interceptor] Authorization header set for ${config.url}`);
    } else {
      console.warn(`[Axios Interceptor] No token found in localStorage for ${config.url}`);
    }
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
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
