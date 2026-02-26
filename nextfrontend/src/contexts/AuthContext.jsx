'use client';
import React, { createContext, useState, useEffect, useCallback } from 'react';
import { loginUserApi, registerUserApi, fetchCurrentUserApi, logoutApi } from '../api/auth';

export const AuthContext = createContext(null);

/**
 * Auth provider - pure session-based.
 *
 * The browser never sees a JWT.  All state comes from calling
 * /api/auth/me (which reads the encrypted iron-session cookie).
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
      // No session or session expired - stay logged out
      setCurrentUser(null);
    } finally {
      setLoadingAuth(false);
    }
  }, [currentUser]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  // ------------------------------------------------------------------
  // Login - POST /api/auth/login → iron-session cookie set by server
  // ------------------------------------------------------------------
  const login = async (username, password) => {
    try {
      setAuthError(null);
      setLoadingAuth(true);
      const data = await loginUserApi(username, password);
      setCurrentUser(data.user);
      return data.user;
    } catch (err) {
      console.error('Login error:', err);

      if (err.response) {
        if (err.response.status === 401) {
          setAuthError('Invalid username or password. Please try again.');
        } else if (err.response.data?.detail) {
          const detail = err.response.data.detail;
          if (typeof detail === 'string') {
            setAuthError(detail);
          } else if (Array.isArray(detail)) {
            setAuthError(detail.map(e => {
              const field = e.loc?.length > 1 ? e.loc[1] : '';
              return `${field}: ${e.msg}`;
            }).join('\n'));
          }
        } else {
          setAuthError('Login failed. Please check your credentials.');
        }
      } else if (err.request) {
        setAuthError('No response from server. Please check your internet connection.');
      } else {
        setAuthError('An error occurred during login. Please try again.');
      }

      throw err;
    } finally {
      setLoadingAuth(false);
    }
  };

  // ------------------------------------------------------------------
  // Register - POST /api/auth/register → iron-session cookie set by server
  // ------------------------------------------------------------------
  const register = async (username, email, password) => {
    try {
      setAuthError(null);
      setLoadingAuth(true);
      const data = await registerUserApi(username, email, password);
      setCurrentUser(data.user);
      return data.user;
    } catch (err) {
      console.error('Registration error:', err);

      if (err.response) {
        if ((err.response.status === 400 || err.response.status === 422) && err.response.data?.detail) {
          const detail = err.response.data.detail;
          if (typeof detail === 'string') {
            setAuthError(detail);
          } else if (Array.isArray(detail)) {
            setAuthError(detail.map(e => {
              const field = e.loc?.length > 1 ? e.loc[1] : '';
              return `${field ? field + ': ' : ''}${e.msg}`;
            }).join('\n'));
          } else {
            setAuthError('Validation error. Please check your inputs.');
          }
        } else {
          setAuthError('Registration failed. Please try again.');
        }
      } else if (err.request) {
        setAuthError('No response from server. Please check your internet connection.');
      } else {
        setAuthError('An error occurred during registration. Please try again.');
      }

      throw err;
    } finally {
      setLoadingAuth(false);
    }
  };

  // ------------------------------------------------------------------
  // Logout - destroys the iron-session server-side
  // ------------------------------------------------------------------
  const logout = async () => {
    try {
      await logoutApi();
    } catch {
      // ignore - best-effort
    }
    setCurrentUser(null);
  };

  /** Re-fetch the current user from the API and update state. */
  const refreshUser = useCallback(async () => {
    try {
      const userData = await fetchCurrentUserApi();
      setCurrentUser(userData);
      return userData;
    } catch (err) {
      console.error('refreshUser failed', err);
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
