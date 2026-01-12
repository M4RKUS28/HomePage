// Server-side API utilities for SSR
import { cookies } from 'next/headers';
import { getApiBaseUrl } from './api-config';

const getBaseUrl = () => {
  return getApiBaseUrl();
};

export const fetchCVDataSSR = async () => {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;
    
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    const response = await fetch(`${getBaseUrl()}/cv/`, {
      headers,
      cache: 'no-store', // Ensure fresh data on each request
    });
    
    if (!response.ok) {
      console.error('Failed to fetch CV data:', response.status);
      return null;
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching CV data on server:', error);
    return null;
  }
};

export const fetchCurrentUserSSR = async () => {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;
    
    if (!token) {
      return null;
    }
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
    
    const response = await fetch(`${getBaseUrl()}/users/me`, {
      headers,
      cache: 'no-store',
    });
    
    if (!response.ok) {
      console.error('Failed to fetch user data:', response.status);
      return null;
    }
    
    const userData = await response.json();
    return userData;
  } catch (error) {
    console.error('Error fetching user data on server:', error);
    return null;
  }
};
