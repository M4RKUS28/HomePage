/**
 * Server-side API utilities for SSR (React Server Components).
 *
 * Reads the iron-session, signs a fresh short-lived JWT, and calls
 * FastAPI directly (server → server, no browser involved).
 */
import { getSession } from './session';
import { signInternalJWT } from './internal-jwt';

// Server-side always talks directly to the backend container
const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:8000';

/**
 * Build Authorization header from the current iron-session.
 * Returns null if no session exists.
 */
async function getSSRAuthHeaders() {
  try {
    const session = await getSession();
    if (!session.userId) return null;
    const token = signInternalJWT(session);
    return { Authorization: `Bearer ${token}` };
  } catch {
    return null;
  }
}

export const fetchCVDataSSR = async () => {
  try {
    const authHeaders = await getSSRAuthHeaders();

    const headers = { 'Content-Type': 'application/json' };
    if (authHeaders) Object.assign(headers, authHeaders);

    const response = await fetch(`${BACKEND_URL}/cv/`, {
      headers,
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error('Failed to fetch CV data:', response.status);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching CV data on server:', error);
    return null;
  }
};

export const fetchCurrentUserSSR = async () => {
  try {
    const authHeaders = await getSSRAuthHeaders();
    if (!authHeaders) return null;

    const response = await fetch(`${BACKEND_URL}/users/me`, {
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error('Failed to fetch user data:', response.status);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching user data on server:', error);
    return null;
  }
};
