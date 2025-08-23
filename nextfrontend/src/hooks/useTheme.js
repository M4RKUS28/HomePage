import { useContext, useEffect, useState } from 'react';
import { ThemeContext } from '../contexts/ThemeContext';

export const useTheme = () => {
  const context = useContext(ThemeContext);
  const [isHydrated, setIsHydrated] = useState(false);
  
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  if (!context) {
    // During SSR or before hydration, return a safe default
    if (!isHydrated || typeof window === 'undefined') {
      return {
        theme: 'light',
        toggleTheme: () => {}
      };
    }
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  
  return context;
};
