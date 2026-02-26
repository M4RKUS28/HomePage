/**
 * Auth API – calls NextJS API routes (which proxy to FastAPI /internal/*).
 *
 * Login / register go through NextJS server-side routes so the shared secret
 * never leaves the server.  The returned access_token is also set as an
 * httpOnly cookie by the NextJS route handler.
 */
import axios from 'axios';
import apiClient from './index';

// Direct axios instance for auth routes (no /api prefix rewriting needed –
// the NextJS API routes live at /api/auth/*)
const authClient = axios.create({ baseURL: '' });

export const loginUserApi = async (username, password) => {
    const response = await authClient.post('/api/auth/login', { username, password });
    return response.data; // { access_token, token_type, user }
};

export const registerUserApi = async (username, email, password) => {
    const response = await authClient.post('/api/auth/register', { username, email, password });
    return response.data; // { access_token, token_type, user }
};

export const fetchCurrentUserApi = async () => {
    const response = await apiClient.get('/users/me');
    return response.data;
};

export const logoutApi = async () => {
    await authClient.post('/api/auth/logout');
};
