export const getApiBaseUrl = () => {
  if (process.env.NODE_ENV === 'development') {
    return 'http://127.0.0.1:8000/api';
  }

  // Production logic
  // If running on server (SSR), use internal Docker network name
  if (typeof window === 'undefined') {
    // Backend listens on root now (proxied by nginx from /api/ to /)
    // But direct docker connection goes to container port 8000 which has everything at root?
    // Wait, backend container has app at root. Nginx proxies /api/ -> /.
    // So server-side call should go to http://homepagebackend:8000/
    // BUT we stripped /api in nginx.
    // If backend expects requests at / (which it does), then SSR code needs to NOT use /api prefix if calling directly?
    // Wait, I configured Nginx to proxy /api/ to http://homepagebackend:8000/.
    // So client calls /api/users -> Nginx -> http://homepagebackend:8000/users.
    // SSR calls http://homepagebackend:8000...
    // The previous SSR code used `http://homepagebackend:8000/api`.
    // If I change SSR to use `http://homepagebackend:8000`, then calls to `/users` work.
    // Let's check where the /api comes from.
    // In main.py: `app = FastAPI(root_path="/api")`. This tells FastAPI "I am served at /api".
    // It does NOT change the internal routing. `include_router` puts routes at `/`.
    // So internally, routes are at `/`.
    // So `http://homepagebackend:8000/users` is correct.
    // Making SSR call `http://homepagebackend:8000` is correct.
    return 'http://homepagebackend:8000';
  }

  // If running on client (Browser) behind Nginx
  return '/api';
};
