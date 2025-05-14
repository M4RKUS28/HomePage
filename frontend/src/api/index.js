import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api', // Proxied by Vite
  headers: {
    'Content-Type': 'application/json',
  }
});

apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('accessToken');
  console.log(`[Axios Interceptor] Request to ${config.url}. Token found: ${token ? 'YES' : 'NO'}`); // ADD THIS
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log(`[Axios Interceptor] Authorization header set for ${config.url}`); // ADD THIS
  } else {
    console.warn(`[Axios Interceptor] No token found in localStorage for ${config.url}`); // ADD THIS
  }
  return config;
}, error => {
  console.error('[Axios Interceptor] Request error:', error); // ADD THIS
  return Promise.reject(error);
});

// Optional: Add a response interceptor for global error handling or token refresh
apiClient.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401) {
      // Handle unauthorized errors, e.g., redirect to login
      console.error("Unauthorized access - 401");
      // localStorage.removeItem('accessToken');
      // window.location.href = '/login'; // Or use React Router navigate
    }
    return Promise.reject(error);
  }
);

export default apiClient;