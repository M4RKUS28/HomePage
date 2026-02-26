'use client';
import React, { createContext, useState, useEffect, useCallback } from 'react';
import { loginUserApi, registerUserApi, fetchCurrentUserApi, logoutApi } from '../api/auth';
import { jwtDecode } from 'jwt-decode';
import { setCookie, getCookie, removeCookie } from '../lib/cookies';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children, initialUser = null }) => {
  // Ermöglicht Initialisierung mit SSR-User
  const [currentUser, setCurrentUser] = useState(initialUser);
  const [loadingAuth, setLoadingAuth] = useState(!initialUser);
  const [authError, setAuthError] = useState(null);

  const clearAuthError = useCallback(() => setAuthError(null), []);

  const loadUserFromToken = useCallback(async () => {
    // Wenn initialUser gesetzt ist (SSR), nicht erneut laden
    if (currentUser) {
      setLoadingAuth(false);
      return;
    }
    
    // Try cookies first, then localStorage
    let token = getCookie('accessToken') || (typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null);
    
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        if (decodedToken.exp * 1000 < Date.now()) {
          // Token expired – clean up
          removeCookie('accessToken');
          if (typeof window !== 'undefined') localStorage.removeItem('accessToken');
          setCurrentUser(null);
          setLoadingAuth(false);
          return;
        }
        const userData = await fetchCurrentUserApi();
        setCurrentUser(userData);
      } catch (err) {
        console.error('Failed to load user from token', err);
        removeCookie('accessToken');
        if (typeof window !== 'undefined') localStorage.removeItem('accessToken');
        setCurrentUser(null);
      }
    }
    setLoadingAuth(false);
  }, [currentUser]);

  useEffect(() => {
    loadUserFromToken();
  }, [loadUserFromToken]);

  // -----------------------------------------------------------------------
  // Login – /api/auth/login returns { access_token, token_type, user }
  // -----------------------------------------------------------------------
  const login = async (username, password) => {
    try {
      setAuthError(null);
      setLoadingAuth(true);
      const data = await loginUserApi(username, password);

      // Store token (non-httpOnly cookie + localStorage for client-side access)
      if (typeof window !== 'undefined') {
        localStorage.setItem('accessToken', data.access_token);
      }
      setCookie('accessToken', data.access_token, 7);

      // User data is already included in the response – no extra fetch needed
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

  // -----------------------------------------------------------------------
  // Register – /api/auth/register returns { access_token, token_type, user }
  // -----------------------------------------------------------------------
  const register = async (username, email, password) => {
    try {
      setAuthError(null);
      setLoadingAuth(true);

      // Single call – server creates user AND returns token + user data
      const data = await registerUserApi(username, email, password);

      if (typeof window !== 'undefined') {
        localStorage.setItem('accessToken', data.access_token);
      }
      setCookie('accessToken', data.access_token, 7);

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

  // -----------------------------------------------------------------------
  // Logout – clears httpOnly cookie via server route + client storage
  // -----------------------------------------------------------------------
  const logout = async () => {
    try {
      await logoutApi(); // clears httpOnly cookie server-side
    } catch {
      // ignore – best-effort
    }
    removeCookie('accessToken');
    if (typeof window !== 'undefined') localStorage.removeItem('accessToken');
    setCurrentUser(null);
  };

  /** Re-fetch the current user from the API and update state (call after profile edits). */
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
      loadUserFromToken,
      refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
