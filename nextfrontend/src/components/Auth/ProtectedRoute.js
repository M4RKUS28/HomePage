'use client';
import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Spinner from '../UI/Spinner';

export default function ProtectedRoute({ children }) {
  const { currentUser, loadingAuth } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    if (!loadingAuth && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, loadingAuth, router]);
  
  if (loadingAuth) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spinner size="h-10 w-10" color="text-primary" />
      </div>
    );
  }
  
  if (!currentUser) {
    return null; // Router.push is handling the redirect
  }
  
  return children;
}
