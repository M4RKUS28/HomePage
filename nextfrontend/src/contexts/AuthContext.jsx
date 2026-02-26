'use client';
import React, { createContext, useState, useEffect, useCallback } from 'react';
import { loginUserApi, registerUserApi, fetchCurrentUserApi, logoutApi } from '../api/auth';
import { parseApiError } from '../lib/error-utils';

export const AuthContext = createContext(null);

/**
 * Auth provider — pure session-based.
 *
 * The browser never sees a JWT.  All state comes from calling
 * /api/users/me (which reads the encrypted iron-session cookie via proxy).
 */
export const AuthProvider = ({ children, initialUser = null }) => {
  const [currentUser, setCurrentUser] = useState(initialUser);
  const [loadingAuth, setLoadingAuth] = useState(!initialUser);
  const [authError, setAuthError] = useState(null);

  const clearAuthError = useCallback(() => setAuthError(null), []);

  // ------------------------------------------------------------------
  // Load user from session on mount (skip if SSR already provided one)
  // ------------------------------------------------------------------
  const loadUser = useCallback(async () => {
    if (currentUser) {
      setLoadingAuth(false);
      return;
    }
    try {
      const userData = await fetchCurrentUserApi();
      setCurrentUser(userData);
    } catch {
      setCurrentUser(null);
    } finally {
      setLoadingAuth(false);
    }
  }, [currentUser]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  // ------------------------------------------------------------------
  // Login
  // ------------------------------------------------------------------
  const login = async (username, password) => {
    try {
      setAuthError(null);
      setLoadingAuth(true);
      const data = await loginUserApi(username, password);
      setCurrentUser(data.user);
      return data.user;
    } catch (err) {
      const message = parseApiError(err, 'Login failed. Please check your credentials.');
      setAuthError(message);
      throw err;
    } finally {
      setLoadingAuth(false);
    }
  };

  // ------------------------------------------------------------------
  // Register
  // ------------------------------------------------------------------
  const register = async (username, email, password) => {
    try {
      setAuthError(null);
      setLoadingAuth(true);
      const data = await registerUserApi(username, email, password);
      setCurrentUser(data.user);
      return data.user;
    } catch (err) {
      const message = parseApiError(err, 'Registration failed. Please try again.');
      setAuthError(message);
      throw err;
    } finally {
      setLoadingAuth(false);
    }
  };

  // ------------------------------------------------------------------
  // Logout — destroys the iron-session server-side
  // ------------------------------------------------------------------
  const logout = async () => {
    try { await logoutApi(); } catch { /* best-effort */ }
    setCurrentUser(null);
  };

  /** Re-fetch the current user from the API and update state. */
  const refreshUser = useCallback(async () => {
    try {
      const userData = await fetchCurrentUserApi();
      setCurrentUser(userData);
      return userData;
    } catch (err) {
      console.error('refreshUser failed:', err);
    }
  }, []);

  return (
    <AuthContext.Provider value={{
      currentUser,
      loadingAuth,
      login,
      register,
      logout,
      authError,
      clearAuthError,
      loadUser,
      refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
