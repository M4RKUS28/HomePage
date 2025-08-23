import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

const Modal = ({ children, title, onClose, isOpen = true }) => { // Assume isOpen is controlled from parent for ProjectGrid
  const { theme } = useTheme();
  
  if (!isOpen) return null;

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  const modalVariants = {
    hidden: { y: "-50px", opacity: 0, scale: 0.9 },
    visible: { y: "0", opacity: 1, scale: 1, transition: { type: "spring", stiffness: 300, damping: 30 } },
    exit: { y: "50px", opacity: 0, scale: 0.9, transition: { duration: 0.2 } },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] bg-black/70 flex items-center justify-center p-4"
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          onClick={onClose} // Close on backdrop click
        >
          <motion.div
            className={`rounded-lg shadow-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto relative ${
              theme === 'dark' 
                ? 'bg-gray-800' 
                : 'bg-white'
            }`}
            variants={modalVariants}
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-xl font-semibold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>{title}</h3>
              <button
                onClick={onClose}
                className={`transition-colors p-1 rounded-full ${
                  theme === 'dark' 
                    ? 'text-gray-400 hover:text-white hover:bg-gray-700' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <X size={24} />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Modal;