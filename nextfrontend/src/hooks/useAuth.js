import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../contexts/AuthContext';

export const useAuth = () => {
  const context = useContext(AuthContext);
  const [isHydrated, setIsHydrated] = useState(false);
  
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  if (!context) {
    // During SSR or before hydration, return a safe default
    if (!isHydrated || typeof window === 'undefined') {
      return {
        currentUser: null,
        loadingAuth: true,
        authError: null,
        login: async () => {},
        register: async () => {},
        logout: async () => {},
        clearAuthError: () => {}
      };
    }
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
