'use client';
import { useAuth } from '../../hooks/useAuth';
import { useEffect, useState } from 'react';

// Client wrapper to handle auth context loading
export default function withAuth(WrappedComponent) {
  return function WithAuthComponent(props) {
    const [mounted, setMounted] = useState(false);
    
    useEffect(() => {
      setMounted(true);
    }, []);
    
    if (!mounted) {
      // Return a minimal fallback during server/client hydration
      return <div style={{ visibility: 'hidden' }}>Loading...</div>;
    }
    
    try {
      const auth = useAuth();
      return <WrappedComponent {...props} auth={auth} />;
    } catch (error) {
      // Fallback if auth context is not available
      console.error('Auth context error:', error);
      return <WrappedComponent {...props} auth={{ currentUser: null, loadingAuth: false }} />;
    }
  };
}
