'use client';
import React, { createContext, useState, useEffect, useCallback } from 'react';
import { loginUserApi, registerUserApi, fetchCurrentUserApi } from '../api/auth';
import { jwtDecode } from 'jwt-decode';
import { setCookie, getCookie, removeCookie } from '../lib/cookies';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children, initialUser = null }) => {
  // Ermöglicht Initialisierung mit SSR-User
  const [currentUser, setCurrentUser] = useState(initialUser);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);

  const clearAuthError = () => setAuthError(null);

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
          // Token expired - clean up both storage methods
          removeCookie('accessToken');
          if (typeof window !== 'undefined') {
            localStorage.removeItem('accessToken');
          }
          setCurrentUser(null);
          setLoadingAuth(false);
          return;
        }
        const userData = await fetchCurrentUserApi();
        setCurrentUser(userData);
      } catch (err) {
        console.error("Failed to load user from token", err);
        // Clean up both storage methods on error
        removeCookie('accessToken');
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
        }
        setCurrentUser(null);
      }
    }
    setLoadingAuth(false);
  }, [currentUser]);

  useEffect(() => {
    loadUserFromToken();
  }, [loadUserFromToken]);

  const login = async (username, password) => {
    try {
      setAuthError(null);
      setLoadingAuth(true);
      const data = await loginUserApi(username, password);
      
      // Set token in both localStorage and cookies for SSR compatibility
      if (typeof window !== 'undefined') {
        localStorage.setItem('accessToken', data.access_token);
      }
      setCookie('accessToken', data.access_token, 7); // 7 days
      
      // Fetch user details after login to ensure fresh data
      const userData = await fetchCurrentUserApi();
      setCurrentUser(userData);
      return userData;
    } catch (err) {
      // Enhanced error handling - set error message directly on AuthContext
      console.error("Login error:", err);
      
      if (err.response) {
        // Direct 401 Unauthorized error handling
        if (err.response.status === 401) {
          setAuthError('Invalid username or password. Please try again.');
        }
        // Other server response error handling
        else if (err.response.data && err.response.data.detail) {
          if (typeof err.response.data.detail === 'string') {
            setAuthError(err.response.data.detail);
          } else if (Array.isArray(err.response.data.detail)) {
            // Format validation errors
            const errorMessage = err.response.data.detail
              .map(e => {
                const field = e.loc && e.loc.length > 1 ? e.loc[1] : '';
                return `${field}: ${e.msg}`;
              })
              .join('\n');
            setAuthError(errorMessage);
          }
        } else {
          setAuthError('Login failed. Please check your credentials.');
        }
      } else if (err.request) {
        // The request was made but no response was received
        setAuthError('No response from server. Please check your internet connection.');
      } else {
        // Something happened in setting up the request
        setAuthError('An error occurred during login. Please try again.');
      }
      
      // Re-throw error for component-level handling if needed
      throw err;
    } finally {
      setLoadingAuth(false);
    }
  };

  const register = async (username, email, password) => {
    try {
      setAuthError(null);
      setLoadingAuth(true);
      const data = await registerUserApi(username, email, password);
      return data;
    } catch (err) {
      console.error("Registration error:", err);
      
      if (err.response) {
        // Direct 400 Bad Request error handling (common for duplicate username/email)
        if (err.response.status === 400 && err.response.data && err.response.data.detail) {
          setAuthError(err.response.data.detail);
        }
        // Validation error handling
        else if (err.response.status === 422 && err.response.data && err.response.data.detail) {
          if (Array.isArray(err.response.data.detail)) {
            const errorMessage = err.response.data.detail
              .map(e => {
                const field = e.loc && e.loc.length > 1 ? e.loc[1] : '';
                return `${field}: ${e.msg}`;
              })
              .join('\n');
            setAuthError(errorMessage);
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

  const logout = () => {
    // Clean up both storage methods
    removeCookie('accessToken');
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
    }
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider value={{ 
      currentUser, 
      loadingAuth, 
      login, 
      register, 
      logout, 
      authError, 
      clearAuthError, 
      loadUserFromToken 
    }}>
      {children}
    </AuthContext.Provider>
  );
};
