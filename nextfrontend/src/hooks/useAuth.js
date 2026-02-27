/**
 * Auth hook — thin wrapper around NextAuth.js v5.
 *
 * Provides the same API surface (`currentUser`, `login`, `register`,
 * `logout`, `refreshUser`, `loadingAuth`, `authError`, `clearAuthError`)
 * that consumer components expect, but delegates all heavy lifting to
 * NextAuth's `useSession`, `signIn`, and `signOut`.
 */
'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { useState, useCallback } from 'react';
import { parseApiError } from '../lib/error-utils';
import apiClient from '../api/client';

export const useAuth = () => {
  const { data: session, status, update } = useSession();
  const [authError, setAuthError] = useState(null);

  const clearAuthError = useCallback(() => setAuthError(null), []);

  // ---------------------------------------------------------------------------
  // Map NextAuth session → legacy `currentUser` shape
  // ---------------------------------------------------------------------------
  const currentUser =
    status === 'authenticated' && session?.user
      ? {
          id: session.user.id,
          username: session.user.username,
          email: session.user.email,
          is_admin: session.user.isAdmin,
          is_active: session.user.isActive,
          profile_image_url: session.user.avatarUrl,
          created_at: session.user.createdAt,
        }
      : null;

  const loadingAuth = status === 'loading';

  // ---------------------------------------------------------------------------
  // Login — calls NextAuth signIn with credentials
  // ---------------------------------------------------------------------------
  const login = async (username, password) => {
    try {
      setAuthError(null);

      const result = await signIn('credentials', {
        username,
        password,
        redirect: false,
      });

      // Auth.js v5 returns the raw Response (HTTP 200 even on auth failure).
      // We must verify a session was actually created.
      const res = await fetch('/api/auth/session');
      const sess = await res.json();

      if (!sess?.user) {
        const message = 'Login failed. Please check your credentials.';
        setAuthError(message);
        throw new Error(message);
      }

      return {
        id: sess.user.id,
        username: sess.user.username,
        email: sess.user.email,
        is_admin: sess.user.isAdmin,
        is_active: sess.user.isActive,
        profile_image_url: sess.user.avatarUrl,
        language: sess.user.language,
      };
    } catch (err) {
      if (!authError) {
        const message = parseApiError(err, 'Login failed. Please check your credentials.');
        setAuthError(message);
      }
      throw err;
    }
  };

  // ---------------------------------------------------------------------------
  // Register — custom route + NextAuth signIn
  // ---------------------------------------------------------------------------
  const register = async (username, email, password, language) => {
    try {
      setAuthError(null);

      // 1. Create the account via our custom register endpoint
      await apiClient.post('/auth/register', { username, email, password, language });

      // 2. Immediately sign in so a session is created
      await signIn('credentials', {
        username,
        password,
        redirect: false,
      });

      // 3. Verify session was created (Auth.js v5 returns 200 even on failure)
      const res = await fetch('/api/auth/session');
      const sess = await res.json();

      if (!sess?.user) {
        throw new Error('Registration succeeded but sign-in failed.');
      }

      return {
        id: sess.user.id,
        username: sess.user.username,
        email: sess.user.email,
        is_admin: sess.user.isAdmin,
      };
    } catch (err) {
      const message = parseApiError(err, 'Registration failed. Please try again.');
      setAuthError(message);
      throw err;
    }
  };

  // ---------------------------------------------------------------------------
  // Logout — destroys the NextAuth session
  // ---------------------------------------------------------------------------
  const logout = async () => {
    try {
      await signOut({ redirect: false });
    } catch {
      /* best-effort */
    }
  };

  // ---------------------------------------------------------------------------
  // Refresh — fetches fresh user data from backend, updates session JWT
  // ---------------------------------------------------------------------------
  const refreshUser = useCallback(async () => {
    try {
      const { data: freshUser } = await apiClient.get('/users/me');
      await update({
        id: freshUser.id,
        username: freshUser.username,
        email: freshUser.email,
        isAdmin: freshUser.is_admin,
        isActive: freshUser.is_active,
        avatarUrl: freshUser.profile_image_url || null,
        createdAt: freshUser.created_at || null,
      });
      return freshUser;
    } catch (err) {
      console.error('refreshUser failed:', err);
    }
  }, [update]);

  return {
    currentUser,
    loadingAuth,
    login,
    register,
    logout,
    authError,
    clearAuthError,
    loadUser: refreshUser,
    refreshUser,
  };
};
