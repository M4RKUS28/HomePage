// frontend/src/components/Auth/RegisterForm.jsx (fixed error display)
'use client';

import React, { useState, useEffect, useContext } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { UserPlus, Eye, EyeOff, Check, X, AlertCircle } from 'lucide-react';
import { ThemeContext } from '../../contexts/ThemeContext';
import { useToast } from '../../contexts/ToastContext';
import LoadingButton from '../UI/LoadingButton';
import ErrorMessage from '../UI/ErrorMessage';

const RegisterForm = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formError, setFormError] = useState('');
  const { register, loadingAuth, authError, clearAuthError } = useAuth();
  const { theme } = useContext(ThemeContext);
  const { showToast } = useToast();
  const router = useRouter();

  useEffect(() => {
    clearAuthError();
    return () => clearAuthError();
  }, [clearAuthError]);

  // Password strength requirements
  const passwordLength = password.length >= 3;
  const passwordsMatch = password === confirmPassword && confirmPassword !== '';

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    
    // Client-side validation
    if (!username.trim()) {
      setFormError("Username is required.");
      return;
    }

    if (!email.trim()) {
      setFormError("Email is required.");
      return;
    }

    if (!validateEmail(email)) {
      setFormError("Please enter a valid email address.");
      return;
    }
    
    if (password !== confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }
    
    if (password.length < 3) { // Match backend MIN_PASSWORD_LENGTH
      setFormError("Password must be at least 3 characters long.");
      return;
    }

    try {
      await register(username, email, password);
      showToast({ 
        type: 'success', 
        message: 'Registration successful! You can now log in.' 
      });
      router.push('/login');
    } catch (err) {
      console.error("Registration failed:", err);
      
      // Error handling for display in UI
      if (err.response) {
        if (err.response.status === 400) {
          // Common 400 errors are duplicate username/email
          setFormError(err.response.data.detail || "Username or email already exists.");
        } else if (err.response.data && err.response.data.detail) {
          // Handle server response details
          if (typeof err.response.data.detail === 'string') {
            setFormError(err.response.data.detail);
          } else if (Array.isArray(err.response.data.detail)) {
            const errorMessages = err.response.data.detail
              .map(e => {
                const field = e.loc && e.loc.length > 1 ? e.loc[1] : '';
                return `${field ? field + ': ' : ''}${e.msg}`;
              })
              .join('\n');
            setFormError(errorMessages);
          }
        } else {
          setFormError('Registration failed. Please try again.');
        }
      } else if (err.request) {
        // The request was made but no response was received
        setFormError('No response from server. Please check your internet connection.');
      } else {
        // Something happened in setting up the request that triggered an Error
        setFormError('An error occurred during registration. Please try again.');
      }
    }
  };

  const toggleShowPassword = () => setShowPassword(!showPassword);
  const toggleShowConfirmPassword = () => setShowConfirmPassword(!showConfirmPassword);

  // This visible error message combines both sources of errors
  const visibleError = formError || authError;

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
          <UserPlus className={`h-12 w-auto ${theme === 'dark' ? 'text-primary' : 'text-secondary'}`} />
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
          Create your account
        </motion.h2>
      </div>
      <motion.form 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="mt-8 space-y-5" 
        onSubmit={handleSubmit}
      >
        {/* IMPORTANT: Display error message prominently */}
        {visibleError && (
          <div className="error-text flex items-start">
            <AlertCircle size={18} className="text-red-500 mr-2 flex-shrink-0 mt-0.5" />
            <div className="flex-1 mr-2 whitespace-pre-line">{visibleError}</div>
            <button 
              onClick={() => {
                clearAuthError();
                setFormError('');
              }} 
              className="flex-shrink-0 p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
              aria-label="Dismiss error"
            >
              <X size={16} />
            </button>
          </div>
        )}

        <div>
          <label htmlFor="username-register" className={`block text-sm font-medium ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
          }`}>Username</label>
          <input
            id="username-register"
            name="username"
            type="text"
            autoComplete="username"
            required
            className={`input-field mt-1 ${!username.trim() && visibleError ? 'border-red-500 dark:border-red-500' : ''}`}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="email-register" className={`block text-sm font-medium ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
          }`}>Email address</label>
          <input
            id="email-register"
            name="email"
            type="email"
            autoComplete="email"
            required
            className={`input-field mt-1 ${(!email.trim() || !validateEmail(email)) && visibleError ? 'border-red-500 dark:border-red-500' : ''}`}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="password-register" className={`block text-sm font-medium ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
          }`}>Password</label>
          <div className="relative mt-1">
            <input
              id="password-register"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              className={`input-field pr-10 ${password.length < 3 && visibleError ? 'border-red-500 dark:border-red-500' : ''}`}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-describedby="password-requirements"
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
           <div className="mt-1.5 flex items-center">
            <div className={`flex items-center text-xs ${passwordLength ? 'text-green-500' : 'text-gray-400'}`}>
              {passwordLength ? <Check size={14} className="mr-1" /> : <X size={14} className="mr-1" />}
              Minimum 3 characters
            </div>
          </div>
        </div>
        <div>
          <label htmlFor="confirm-password-register" className={`block text-sm font-medium ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
          }`}>Confirm Password</label>
          <div className="relative mt-1">
            <input
              id="confirm-password-register"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              className={`input-field pr-10 ${confirmPassword && !passwordsMatch ? 'border-red-500 dark:border-red-500' : ''}`}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={toggleShowConfirmPassword}
              className={`absolute inset-y-0 right-0 pr-3 flex items-center ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              } hover:text-primary transition-colors`}
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {confirmPassword && (
            <div className="mt-1.5 flex items-center">
              <div className={`flex items-center text-xs ${passwordsMatch ? 'text-green-500' : 'text-red-500'}`}>
                {passwordsMatch ? <Check size={14} className="mr-1" /> : <X size={14} className="mr-1" />}
                Passwords {passwordsMatch ? 'match' : 'do not match'}
              </div>
            </div>
          )}
        </div>
        <div>
          <LoadingButton
            type="submit"
            className="w-full btn-primary"
            isLoading={loadingAuth}
            loadingText="Creating account..."
          >
            <UserPlus size={18} className="mr-2" /> Create account
          </LoadingButton>
        </div>
      </motion.form>
      <p className={`mt-6 text-center text-sm ${
        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
      }`}>
        Already a member?{' '}
        <Link href="/login" className={`font-medium ${
          theme === 'dark' 
            ? 'text-primary hover:text-emerald-400' 
            : 'text-secondary hover:text-blue-700'
        } transition-colors`}>
          Sign in
        </Link>
      </p>
      
      {/* Add explanation about registration */}
      <div className={`mt-4 p-4 rounded-lg text-sm ${
        theme === 'dark' ? 'bg-gray-700/50 text-gray-300' : 'bg-gray-100 text-gray-600'
      }`}>
        <div className="flex items-start">
          <AlertCircle size={16} className="text-primary mt-0.5 mr-2 flex-shrink-0" />
          <p>
            Creating an account lets you send me direct messages. This is great for project 
            inquiries, collaboration opportunities, or any questions about my work.
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default RegisterForm;