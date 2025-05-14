import React, { createContext, useState, useEffect, useCallback } from 'react';
import { loginUserApi, registerUserApi, fetchCurrentUserApi } from '../api/auth';
import { jwtDecode } from 'jwt-decode';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true); // Changed from 'loading'
  const [authError, setAuthError] = useState(null);   // Changed from 'error'

  const clearAuthError = () => setAuthError(null);

  const loadUserFromToken = useCallback(async () => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      try {
        // Check if token is expired
        const decodedToken = jwtDecode(token);
        if (decodedToken.exp * 1000 < Date.now()) {
          localStorage.removeItem('accessToken');
          setCurrentUser(null);
          setLoadingAuth(false);
          return;
        }
        // If you store user details in token, you can set it here,
        // but it's better to fetch from /users/me for up-to-date info
        const userData = await fetchCurrentUserApi(); // Assumes API client handles token
        setCurrentUser(userData);
      } catch (err) {
        console.error("Failed to load user from token", err);
        localStorage.removeItem('accessToken'); // Invalid token
        setCurrentUser(null);
      }
    }
    setLoadingAuth(false);
  }, []);

  useEffect(() => {
    loadUserFromToken();
  }, [loadUserFromToken]);

  const login = async (username, password) => {
    try {
      setAuthError(null);
      setLoadingAuth(true);
      const data = await loginUserApi(username, password);
      localStorage.setItem('accessToken', data.access_token);
      // Fetch user details after login to ensure fresh data
      const userData = await fetchCurrentUserApi();
      setCurrentUser(userData);
      return userData;
    } catch (err) {
      setAuthError(err.response?.data?.detail || 'Login failed. Please check your credentials.');
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
      // Optionally auto-login or prompt user to login
      // For now, just return data and let user log in separately
      return data;
    } catch (err) {
      setAuthError(err.response?.data?.detail || 'Registration failed. Please try again.');
      throw err;
    } finally {
      setLoadingAuth(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    setCurrentUser(null);
    // Optionally redirect to home or login page via navigate from react-router-dom
  };

  return (
    <AuthContext.Provider value={{ currentUser, loadingAuth, login, register, logout, authError, clearAuthError, loadUserFromToken }}>
      {children}
    </AuthContext.Provider>
  );
};