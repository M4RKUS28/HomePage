'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useRouter } from 'next/navigation';
import { Link } from '../../i18n/navigation';
import { motion } from 'framer-motion';
import { LogIn, Eye, EyeOff, AlertCircle, X } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTranslations } from 'next-intl';
import { parseApiError } from '../../lib/error-utils';
import LoadingButton from '../UI/LoadingButton';

const LoginForm = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');
  const { login, loadingAuth, authError, clearAuthError } = useAuth();
  const { showToast } = useToast();
  const { changeLocale } = useLanguage();
  const t = useTranslations();
  const router = useRouter();

  useEffect(() => {
    clearAuthError();
    return () => clearAuthError();
  }, [clearAuthError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!username.trim()) {
      setFormError(t('auth.errors.usernameRequired'));
      return;
    }

    if (!password) {
      setFormError(t('auth.errors.loginFailed'));
      return;
    }

    try {
      const userData = await login(username, password);
      if (userData?.language) {
        changeLocale(userData.language);
      }
      showToast({ type: 'success', message: t('auth.login.submit') });
      router.push(userData?.is_admin ? '/admin' : '/dashboard');
    } catch (err) {
      setFormError(parseApiError(err, t('auth.errors.loginFailed')));
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
          <LogIn className="h-12 w-auto text-accent" />
        </motion.div>
        <motion.h2
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="mt-6 text-3xl font-display font-bold text-ink"
        >
          {t('auth.login.title')}
        </motion.h2>
      </div>

      <motion.form
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="mt-8 space-y-6"
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
          <label htmlFor="username" className="block text-sm font-medium text-ink-2">
            {t('auth.login.username')}
          </label>
          <input
            id="username"
            name="username"
            type="text"
            autoComplete="username"
            required
            className={`input-field mt-1 ${username.trim() === '' && visibleError ? 'border-[var(--app-red)]' : ''}`}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="password-login" className="block text-sm font-medium text-ink-2">
            {t('auth.login.password')}
          </label>
          <div className="relative mt-1">
            <input
              id="password-login"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              className={`input-field pr-10 ${password === '' && visibleError ? 'border-[var(--app-red)]' : ''}`}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-ink-3 hover:text-accent transition-colors"
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
            loadingText={t('auth.login.signingIn')}
          >
            <LogIn size={18} className="mr-2" /> {t('auth.login.submit')}
          </LoadingButton>
        </div>
      </motion.form>

      <p className="mt-6 text-center text-sm text-ink-2">
        {t('auth.login.noAccount')}{' '}
        <Link href="/register" className="font-medium text-accent hover:brightness-110 transition-all">
          {t('auth.login.registerLink')}
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

export default LoginForm;
