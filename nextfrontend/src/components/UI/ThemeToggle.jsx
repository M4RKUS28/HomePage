// frontend/frontend/src/components/UI/ThemeToggle.jsx
import React, { useContext } from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { ThemeContext } from '../../contexts/ThemeContext';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useContext(ThemeContext);
  
  return (
    <motion.button
      onClick={toggleTheme}
      className={`p-2 rounded-full ${
        theme === 'dark' 
          ? 'bg-gray-700 text-yellow-300' 
          : 'bg-blue-100 text-blue-800'
      } transition-colors`}
      whileTap={{ scale: 0.9 }}
      whileHover={{ 
        scale: 1.1,
        boxShadow: theme === 'dark' 
          ? '0 0 8px rgba(250, 204, 21, 0.6)' 
          : '0 0 8px rgba(59, 130, 246, 0.6)' 
      }}
      initial={{ opacity: 0, rotate: -30 }}
      animate={{ opacity: 1, rotate: 0 }}
      transition={{ duration: 0.3 }}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      <motion.div
        initial={false}
        animate={{ rotate: theme === 'dark' ? 180 : 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
      </motion.div>
    </motion.button>
  );
};

export default ThemeToggle;