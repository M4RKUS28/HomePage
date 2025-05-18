// frontend/src/contexts/AuthContext.jsx (fixed error handling)
import React, { createContext, useState, useEffect, useCallback } from 'react';
import { loginUserApi, registerUserApi, fetchCurrentUserApi } from '../api/auth';
import { jwtDecode } from 'jwt-decode';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);

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
    localStorage.removeItem('accessToken');
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