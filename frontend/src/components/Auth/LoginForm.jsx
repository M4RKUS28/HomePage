// frontend/frontend/src/components/Auth/LoginForm.jsx (updated)
import React, { useState, useEffect, useContext } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogIn, Eye, EyeOff } from 'lucide-react';
import { ThemeContext } from '../../contexts/ThemeContext';
import { useToast } from '../../contexts/ToastContext';
import LoadingButton from '../UI/LoadingButton';
import ErrorMessage from '../UI/ErrorMessage';

const LoginForm = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, loadingAuth, authError, clearAuthError } = useAuth();
  const { theme } = useContext(ThemeContext);
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    clearAuthError(); // Clear previous errors when component mounts
    return () => clearAuthError(); // Clear on unmount
  }, [clearAuthError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(username, password);
      showToast({ 
        type: 'success', 
        message: 'Login successful! Welcome back.' 
      });
      navigate('/dashboard'); // Or wherever you want to redirect after login
    } catch (err) {
      // Error is handled by authError state
      console.error("Login failed:", err);
    }
  };

  const toggleShowPassword = () => setShowPassword(!showPassword);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className={`w-full max-w-md p-8 space-y-6 rounded-xl shadow-2xl ${
        theme === 'dark' 
          ? 'bg-gray-800' 
          : 'bg-white'
      }`}
    >
      <div className="text-center">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="flex justify-center"
        >
          <LogIn className={`h-12 w-auto ${theme === 'dark' ? 'text-primary' : 'text-secondary'}`} />
        </motion.div>
        <motion.h2 
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className={`mt-6 text-3xl font-extrabold ${
            theme === 'dark' 
              ? 'text-white' 
              : 'text-gray-900'
          }`}
        >
          Sign in to your account
        </motion.h2>
      </div>
      <motion.form 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="mt-8 space-y-6" 
        onSubmit={handleSubmit}
      >
        <ErrorMessage 
          message={authError} 
          onClose={clearAuthError}
        />
        
        <div>
          <label htmlFor="username" className={`block text-sm font-medium ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
          }`}>Username</label>
          <input
            id="username"
            name="username"
            type="text"
            autoComplete="username"
            required
            className="input-field mt-1"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="password-login" className={`block text-sm font-medium ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
          }`}>Password</label>
          <div className="relative mt-1">
            <input
              id="password-login"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              className="input-field pr-10"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={toggleShowPassword}
              className={`absolute inset-y-0 right-0 pr-3 flex items-center ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              } hover:text-primary transition-colors`}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div>
          <LoadingButton
            type="submit"
            className="w-full btn-primary"
            isLoading={loadingAuth}
            loadingText="Signing in..."
          >
            <LogIn size={18} className="mr-2" /> Sign in
          </LoadingButton>
        </div>
      </motion.form>
      <p className={`mt-6 text-center text-sm ${
        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
      }`}>
        Not a member?{' '}
        <Link to="/register" className={`font-medium ${
          theme === 'dark' 
            ? 'text-primary hover:text-emerald-400' 
            : 'text-secondary hover:text-blue-700'
        } transition-colors`}>
          Create an account
        </Link>
      </p>
    </motion.div>
  );
};

export default LoginForm;