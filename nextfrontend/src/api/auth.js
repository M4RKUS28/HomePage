/**
 * Auth API — calls NextJS API routes which manage the iron-session.
 *
 * Login / register create an encrypted session cookie server-side.
 * The browser NEVER sees a JWT — only the opaque hp_session cookie.
 */
import apiClient from './client';

/** POST /api/auth/login → iron-session cookie set by server */
export const loginUserApi = async (username, password) => {
  const { data } = await apiClient.post('/auth/login', { username, password });
  return data; // { user }
};

/** POST /api/auth/register → iron-session cookie set by server */
export const registerUserApi = async (username, email, password) => {
  const { data } = await apiClient.post('/auth/register', { username, email, password });
  return data; // { user }
};

/** GET /api/users/me → current user from session (proxied through catch-all) */
export const fetchCurrentUserApi = async () => {
  const { data } = await apiClient.get('/users/me');
  return data;
};

/** POST /api/auth/logout → destroys iron-session */
export const logoutApi = async () => {
  await apiClient.post('/auth/logout');
};
