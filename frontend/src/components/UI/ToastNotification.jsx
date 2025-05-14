// frontend/frontend/src/components/UI/ToastNotification.jsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';

const ToastItem = ({ toast, onClose }) => {
  const { id, type, message } = toast;
  
  // Set icon and colors based on toast type
  let Icon, bgColor;
  
  switch (type) {
    case 'success':
      Icon = CheckCircle;
      bgColor = 'bg-green-500/90';
      break;
    case 'error':
      Icon = AlertCircle;
      bgColor = 'bg-red-500/90';
      break;
    case 'warning':
      Icon = AlertTriangle;
      bgColor = 'bg-yellow-500/90';
      break;
    case 'info':
    default:
      Icon = Info;
      bgColor = 'bg-blue-500/90';
  }
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 50, scale: 0.3 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
      className={`${bgColor} text-white p-3 rounded-lg shadow-lg mb-2 flex items-center max-w-xs sm:max-w-md`}
    >
      <Icon size={18} className="flex-shrink-0 mr-2" />
      <div className="flex-1 mr-2">{message}</div>
      <button 
        onClick={() => onClose(id)} 
        className="p-1 rounded-full hover:bg-white/20 transition-colors"
        aria-label="Close notification"
      >
        <X size={16} />
      </button>
    </motion.div>
  );
};

const ToastNotification = () => {
  const { toasts, hideToast } = useToast();
  
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end">
      <AnimatePresence>
        {toasts.map(toast => (
          <ToastItem key={toast.id} toast={toast} onClose={hideToast} />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default ToastNotification;