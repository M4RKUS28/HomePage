/**
 * API base URL resolver.
 *
 * Client-side: all requests go to /api/* where the NextJS catch-all proxy
 * handles session → JWT → FastAPI forwarding automatically.
 *
 * Server-side (SSR in server-api.js): calls FastAPI directly. However the
 * apiClient (Axios) is only used from client components, so this branch
 * exists purely as a safety net.
 */
export const getApiBaseUrl = () => {
  if (typeof window === 'undefined') {
    return process.env.BACKEND_URL || 'http://127.0.0.1:8000';
  }

  // Client-side: the catch-all API route proxies everything
  return '/api';
};
