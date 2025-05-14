// frontend/frontend/src/components/UI/ErrorMessage.jsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, X } from 'lucide-react';

const ErrorMessage = ({ 
  message, 
  onClose, 
  className = '', 
  type = 'error',
  autoHideDuration = 0 // 0 means don't auto-hide
}) => {
  
  React.useEffect(() => {
    if (message && autoHideDuration > 0) {
      const timer = setTimeout(() => {
        if (onClose) onClose();
      }, autoHideDuration);
      
      return () => clearTimeout(timer);
    }
  }, [message, autoHideDuration, onClose]);
  
  if (!message) return null;
  
  // Determine icon and colors based on type
  let Icon = AlertCircle;
  let iconColor = 'text-red-500';
  
  if (type === 'warning') {
    iconColor = 'text-yellow-500';
  } else if (type === 'info') {
    iconColor = 'text-blue-500';
  }
  
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, y: -10, height: 0 }}
          transition={{ duration: 0.3 }}
          className={`error-text flex items-start ${className}`}
        >
          <Icon size={18} className={`mr-2 flex-shrink-0 mt-0.5 ${iconColor}`} />
          <div className="flex-1 mr-2 whitespace-pre-line">{message}</div>
          {onClose && (
            <button 
              onClick={onClose} 
              className="flex-shrink-0 p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
              aria-label="Dismiss error"
            >
              <X size={16} />
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ErrorMessage;