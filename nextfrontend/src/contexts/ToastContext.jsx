'use client';
import React, { createContext, useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

export const ToastContext = createContext({
  showToast: () => {},
  hideToast: () => {},
  toasts: []
});

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback(({ type = 'info', message, duration = 5000 }) => {
    const id = uuidv4();
    
    setToasts(prev => [...prev, { id, type, message }]);
    
    if (duration) {
      setTimeout(() => {
        hideToast(id);
      }, duration);
    }
    
    return id;
  }, []);

  const hideToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, hideToast, toasts }}>
      {children}
    </ToastContext.Provider>
  );
};

// Custom hook for easier toast usage
export const useToast = () => {
  const context = React.useContext(ToastContext);
  
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  
  return context;
};

export default ToastProvider;
