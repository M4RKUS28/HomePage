/**
 * Server-side API utilities for SSR.
 *
 * Reads the access token from cookies (httpOnly `access_token` set by
 * NextJS API routes, or client-set `accessToken`).
 */
import { cookies } from 'next/headers';

// Server-side always talks directly to the backend container
const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:8000';

/**
 * Resolve the access token from SSR cookies.
 * Prefers the httpOnly `access_token` cookie set by the NextJS auth routes.
 */
async function getSSRToken() {
  const cookieStore = await cookies();
  return (
    cookieStore.get('access_token')?.value ||
    cookieStore.get('accessToken')?.value ||
    null
  );
}

export const fetchCVDataSSR = async () => {
  try {
    const token = await getSSRToken();

    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;

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
    const token = await getSSRToken();
    if (!token) return null;

    const response = await fetch(`${BACKEND_URL}/users/me`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
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
