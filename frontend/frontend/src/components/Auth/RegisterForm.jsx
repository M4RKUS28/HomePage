import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import Spinner from '../UI/Spinner';
import { UserPlus } from 'lucide-react';

const RegisterForm = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] = useState(''); // For client-side validation like password match
  const { register, loadingAuth, authError, clearAuthError } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    clearAuthError();
    return () => clearAuthError();
  }, [clearAuthError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
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
      // On successful registration, you might want to auto-login or redirect to login
      alert("Registration successful! Please log in."); // Simple alert for now
      navigate('/login');
    } catch (err) {
      // authError will be set by the AuthContext
      console.error("Registration failed:", err);
    }
  };

  return (
    <div className="w-full max-w-md p-8 space-y-6 bg-gray-800 rounded-xl shadow-2xl">
      <div className="text-center">
        <UserPlus className="mx-auto h-12 w-auto text-primary" />
        <h2 className="mt-6 text-3xl font-extrabold text-white">
          Create your account
        </h2>
      </div>
      <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
        {(authError || formError) && (
            <div className="p-3 bg-red-500/20 border border-red-500/50 text-red-300 text-sm rounded-md">
                {authError || formError}
            </div>
        )}
        <div>
          <label htmlFor="username-register" className="block text-sm font-medium text-gray-300">Username</label>
          <input
            id="username-register"
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
          <label htmlFor="email-register" className="block text-sm font-medium text-gray-300">Email address</label>
          <input
            id="email-register"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="input-field mt-1"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="password-register" className="block text-sm font-medium text-gray-300">Password</label>
          <input
            id="password-register"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            className="input-field mt-1"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-describedby="password-requirements"
          />
           <p id="password-requirements" className="mt-1 text-xs text-gray-400">
            Minimum 3 characters. (More complex rules can be added here if backend changes)
          </p>
        </div>
        <div>
          <label htmlFor="confirm-password-register" className="block text-sm font-medium text-gray-300">Confirm Password</label>
          <input
            id="confirm-password-register"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            className="input-field mt-1"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>
        <div>
          <button
            type="submit"
            className="w-full btn btn-primary flex justify-center items-center"
            disabled={loadingAuth}
          >
            {loadingAuth ? <Spinner size="h-5 w-5" color="text-white" /> : 'Create account'}
          </button>
        </div>
      </form>
      <p className="mt-6 text-center text-sm text-gray-400">
        Already a member?{' '}
        <Link to="/login" className="font-medium text-primary hover:text-emerald-400">
          Sign in
        </Link>
      </p>
    </div>
  );
};

export default RegisterForm;