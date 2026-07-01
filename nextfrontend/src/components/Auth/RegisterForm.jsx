'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useRouter } from 'next/navigation';
import { Link } from '../../i18n/navigation';
import { motion } from 'framer-motion';
import { UserPlus, Eye, EyeOff, Check, X, AlertCircle } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTranslations } from 'next-intl';
import { parseApiError } from '../../lib/error-utils';
import LoadingButton from '../UI/LoadingButton';

const RegisterForm = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formError, setFormError] = useState('');
  const { register, loadingAuth, authError, clearAuthError } = useAuth();
  const { showToast } = useToast();
  const { locale } = useLanguage();
  const t = useTranslations();
  const router = useRouter();

  useEffect(() => {
    clearAuthError();
    return () => clearAuthError();
  }, [clearAuthError]);

  const passwordLength = password.length >= 3;
  const passwordsMatch = password === confirmPassword && confirmPassword !== '';

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!username.trim()) { setFormError(t('auth.errors.usernameRequired')); return; }
    if (!email.trim()) { setFormError(t('auth.errors.emailRequired')); return; }
    if (!validateEmail(email)) { setFormError(t('auth.errors.emailInvalid')); return; }
    if (password !== confirmPassword) { setFormError(t('auth.errors.passwordsNoMatch')); return; }
    if (password.length < 3) { setFormError(t('auth.errors.passwordTooShort')); return; }

    try {
      await register(username, email, password, locale);
      showToast({ type: 'success', message: t('auth.register.success') });
      router.push('/dashboard');
    } catch (err) {
      setFormError(parseApiError(err, t('auth.errors.registerFailed')));
    }
  };

  const visibleError = formError || authError;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className="panel w-full max-w-md p-8 space-y-6 shadow-2xl"
    >
      <div className="text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="flex justify-center"
        >
          <UserPlus className="h-12 w-auto text-accent" />
        </motion.div>
        <motion.h2
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="mt-6 text-3xl font-display font-bold text-ink"
        >
          {t('auth.register.title')}
        </motion.h2>
      </div>

      <motion.form
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="mt-8 space-y-5"
        onSubmit={handleSubmit}
      >
        {visibleError && (
          <div className="error-text flex items-start">
            <AlertCircle size={18} className="text-[var(--app-red)] mr-2 flex-shrink-0 mt-0.5" />
            <div className="flex-1 mr-2 whitespace-pre-line">{visibleError}</div>
            <button
              onClick={() => { clearAuthError(); setFormError(''); }}
              className="flex-shrink-0 p-1 rounded-full hover:bg-accent-soft transition-colors"
              aria-label={t('common.close')}
            >
              <X size={16} />
            </button>
          </div>
        )}

        <div>
          <label htmlFor="username-register" className="block text-sm font-medium text-ink-2">
            {t('auth.register.username')}
          </label>
          <input
            id="username-register"
            name="username"
            type="text"
            autoComplete="username"
            required
            className={`input-field mt-1 ${!username.trim() && visibleError ? 'border-[var(--app-red)]' : ''}`}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="email-register" className="block text-sm font-medium text-ink-2">
            {t('auth.register.email')}
          </label>
          <input
            id="email-register"
            name="email"
            type="email"
            autoComplete="email"
            required
            className={`input-field mt-1 ${(!email.trim() || !validateEmail(email)) && visibleError ? 'border-[var(--app-red)]' : ''}`}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="password-register" className="block text-sm font-medium text-ink-2">
            {t('auth.register.password')}
          </label>
          <div className="relative mt-1">
            <input
              id="password-register"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              className={`input-field pr-10 ${password.length < 3 && visibleError ? 'border-[var(--app-red)]' : ''}`}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-describedby="password-requirements"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-ink-3 hover:text-accent transition-colors"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <div className="mt-1.5 flex items-center">
            <div className={`flex items-center text-xs ${passwordLength ? 'text-[var(--app-green)]' : 'text-ink-3'}`}>
              {passwordLength ? <Check size={14} className="mr-1" /> : <X size={14} className="mr-1" />}
              {t('auth.register.passwordMinLength')}
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="confirm-password-register" className="block text-sm font-medium text-ink-2">
            {t('auth.register.confirmPassword')}
          </label>
          <div className="relative mt-1">
            <input
              id="confirm-password-register"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              className={`input-field pr-10 ${confirmPassword && !passwordsMatch ? 'border-[var(--app-red)]' : ''}`}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-ink-3 hover:text-accent transition-colors"
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {confirmPassword && (
            <div className="mt-1.5 flex items-center">
              <div className={`flex items-center text-xs ${passwordsMatch ? 'text-[var(--app-green)]' : 'text-[var(--app-red)]'}`}>
                {passwordsMatch ? <Check size={14} className="mr-1" /> : <X size={14} className="mr-1" />}
                {passwordsMatch ? t('auth.register.passwordsMatch') : t('auth.register.passwordsNoMatch')}
              </div>
            </div>
          )}
        </div>

        <div>
          <LoadingButton
            type="submit"
            className="w-full btn-primary"
            isLoading={loadingAuth}
            loadingText={t('auth.register.creating')}
          >
            <UserPlus size={18} className="mr-2" /> {t('auth.register.submit')}
          </LoadingButton>
        </div>
      </motion.form>

      <p className="mt-6 text-center text-sm text-ink-2">
        Already a member?{' '}
        <Link href="/login" className="font-medium text-accent hover:brightness-110 transition-all">
          {t('auth.register.loginLink')}
        </Link>
      </p>

      <div className="mt-4 p-4 rounded-lg text-sm bg-raised border border-line text-ink-2">
        <div className="flex items-start gap-2">
          <AlertCircle size={16} className="text-accent mt-0.5 flex-shrink-0" />
          <p>{t('registerCallout.description')}</p>
        </div>
      </div>
    </motion.div>
  );
};

export default RegisterForm;
