/**
 * Auth API - calls NextJS API routes which manage the iron-session.
 *
 * Login / register create an encrypted session cookie server-side.
 * The browser NEVER sees a JWT - only the opaque hp_session cookie.
 */
import axios from 'axios';
import apiClient from './index';

// Direct axios instance for auth routes (they live at /api/auth/*)
const authClient = axios.create({ baseURL: '', withCredentials: true });

export const loginUserApi = async (username, password) => {
    const response = await authClient.post('/api/auth/login', { username, password });
    return response.data; // { user }
};

export const registerUserApi = async (username, email, password) => {
    const response = await authClient.post('/api/auth/register', { username, email, password });
    return response.data; // { user }
};

export const fetchCurrentUserApi = async () => {
    // Goes through the catch-all proxy → FastAPI /users/me
    const response = await apiClient.get('/users/me');
    return response.data;
};

export const logoutApi = async () => {
    await authClient.post('/api/auth/logout');
};
