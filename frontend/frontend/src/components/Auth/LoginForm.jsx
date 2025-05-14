import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import Spinner from '../UI/Spinner';
import { LogIn } from 'lucide-react';

const LoginForm = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login, loadingAuth, authError, clearAuthError } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    clearAuthError(); // Clear previous errors when component mounts
    return () => clearAuthError(); // Clear on unmount
  }, [clearAuthError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(username, password);
      navigate('/dashboard'); // Or wherever you want to redirect after login
    } catch (err) {
      // Error is handled by authError state
      console.error("Login failed:", err);
    }
  };

  return (
    <div className="w-full max-w-md p-8 space-y-6 bg-gray-800 rounded-xl shadow-2xl">
      <div className="text-center">
        <LogIn className="mx-auto h-12 w-auto text-primary" />
        <h2 className="mt-6 text-3xl font-extrabold text-white">
          Sign in to your account
        </h2>
      </div>
      <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
        {authError && (
            <div className="p-3 bg-red-500/20 border border-red-500/50 text-red-300 text-sm rounded-md">
                {authError}
            </div>
        )}
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-300">Username</label>
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
          <label htmlFor="password-login" className="block text-sm font-medium text-gray-300">Password</label>
          <input
            id="password-login" // Unique ID
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="input-field mt-1"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        
        <div className="flex items-center justify-between text-sm">
            {/* <div className="flex items-center">
                <input id="remember-me" name="remember-me" type="checkbox" className="h-4 w-4 text-primary bg-gray-700 border-gray-600 rounded focus:ring-primary" />
                <label htmlFor="remember-me" className="ml-2 block text-gray-400"> Remember me </label>
            </div> */}
            {/* <a href="#" className="font-medium text-primary hover:text-emerald-400"> Forgot your password? </a> */}
        </div>

        <div>
          <button
            type="submit"
            className="w-full btn btn-primary flex justify-center items-center"
            disabled={loadingAuth}
          >
            {loadingAuth ? <Spinner size="h-5 w-5" color="text-white" /> : 'Sign in'}
          </button>
        </div>
      </form>
      <p className="mt-6 text-center text-sm text-gray-400">
        Not a member?{' '}
        <Link to="/register" className="font-medium text-primary hover:text-emerald-400">
          Create an account
        </Link>
      </p>
    </div>
  );
};

export default LoginForm;