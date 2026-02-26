export const getApiBaseUrl = () => {
  // Server-side (SSR / Node.js process): call the backend directly.
  // BACKEND_URL is injected by docker-compose (e.g. http://homepagebackend:8000).
  // Fall back to localhost for non-Docker local development.
  if (typeof window === 'undefined') {
    return process.env.BACKEND_URL || 'http://127.0.0.1:8000';
  }

  // Client-side (browser): always use the relative /api path.
  // In dev, Next.js rewrites forward /api/* → backend.
  // In prod, nginx forwards /api/* → backend.
  return '/api';
};
