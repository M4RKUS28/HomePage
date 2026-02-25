'use client';
import React, { useContext, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { ThemeContext } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import ProtectedRoute from '../../components/Auth/ProtectedRoute';
import { createMessageApi } from '../../api/messages';
import Link from 'next/link';
import { Send, Home, User, Mail, Shield, MessageSquare, ExternalLink, Loader2 } from 'lucide-react';

// ── Animation variants ────────────────────────────────────────────────────────
const containerVariants = {
  initial: { opacity: 0 },
  in: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
};

const itemVariants = {
  initial: { opacity: 0, y: 24 },
  in: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } },
};

// ── Helper: User avatar (initials circle) ────────────────────────────────────
const UserAvatar = ({ username }) => {
  const initials = username
    ? username.slice(0, 2).toUpperCase()
    : '??';
  return (
    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg select-none">
      {initials}
    </div>
  );
};

// ── Stat / info card ─────────────────────────────────────────────────────────
const InfoRow = ({ icon: Icon, label, value, theme }) => (
  <div className={`flex items-center gap-3 py-3 border-b last:border-0 ${
    theme === 'dark' ? 'border-gray-700' : 'border-gray-100'
  }`}>
    <div className={`p-2 rounded-lg ${
      theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
    }`}>
      <Icon size={16} className={theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'} />
    </div>
    <div className="flex-1 min-w-0">
      <p className={`text-xs font-medium uppercase tracking-wide ${
        theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
      }`}>{label}</p>
      <p className={`text-sm font-semibold truncate ${
        theme === 'dark' ? 'text-gray-100' : 'text-gray-800'
      }`}>{value}</p>
    </div>
  </div>
);

// ── Section card wrapper ──────────────────────────────────────────────────────
const DashCard = ({ children, className = '' }) => {
  const { theme } = useContext(ThemeContext);
  return (
    <motion.div
      variants={itemVariants}
      className={`rounded-2xl shadow-lg ${
        theme === 'dark'
          ? 'bg-gray-800/80 border border-gray-700/60'
          : 'bg-white border border-gray-200'
      } ${className}`}
    >
      {children}
    </motion.div>
  );
};

// ── Message form (inline, no separate component) ──────────────────────────────
const DashMessageForm = ({ t, theme }) => {
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) { setError(t('dashboard', 'messageEmpty')); return; }
    setIsLoading(true); setError(''); setSuccess('');
    try {
      await createMessageApi(content);
      setSuccess(t('dashboard', 'messageSent'));
      setContent('');
    } catch (err) {
      setError(err.response?.data?.detail || t('dashboard', 'messageFailed'));
    } finally {
      setIsLoading(false);
      setTimeout(() => { setSuccess(''); setError(''); }, 4000);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className={`p-2.5 rounded-xl ${
          theme === 'dark' ? 'bg-emerald-900/40' : 'bg-emerald-50'
        }`}>
          <MessageSquare size={20} className={theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'} />
        </div>
        <div>
          <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            {t('dashboard', 'sendMessage')}
          </h3>
          <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            {t('dashboard', 'sendMessageDesc')}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {error && (
          <p className={`text-sm p-3 rounded-lg ${
            theme === 'dark' ? 'text-red-300 bg-red-900/30' : 'text-red-700 bg-red-50'
          }`}>{error}</p>
        )}
        {success && (
          <p className={`text-sm p-3 rounded-lg ${
            theme === 'dark' ? 'text-green-300 bg-green-900/30' : 'text-green-700 bg-green-50'
          }`}>{success}</p>
        )}
        <div>
          <label className={`block text-sm font-medium mb-1.5 ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
          }`}>{t('dashboard', 'yourMessage')}</label>
          <textarea
            rows="4"
            className="input-field w-full resize-none"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t('dashboard', 'messagePlaceholder')}
            required
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="btn btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {isLoading ? (
            <><Loader2 size={18} className="animate-spin" /> {t('dashboard', 'sending')}</>
          ) : (
            <><Send size={18} /> {t('dashboard', 'send')}</>
          )}
        </button>
      </form>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
export default function UserDashboardPage() {
  const { currentUser } = useAuth();
  const { theme } = useContext(ThemeContext);
  const { t } = useLanguage();

  // Format member-since date (just use a readable string of an approximate join time)
  const joinedDate = currentUser?.created_at
    ? new Date(currentUser.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })
    : null;

  return (
    <ProtectedRoute>
      <motion.div
        variants={containerVariants}
        initial="initial"
        animate="in"
        className="max-w-5xl mx-auto px-4 py-10"
      >
        {/* ── Hero / Welcome banner ─────────────────────────────────────────── */}
        <motion.div variants={itemVariants} className="mb-10">
          <div className={`relative rounded-3xl overflow-hidden px-8 py-10 ${
            theme === 'dark'
              ? 'bg-gradient-to-br from-gray-800/90 via-gray-800 to-gray-900 border border-gray-700'
              : 'bg-gradient-to-br from-emerald-50 via-white to-blue-50 border border-gray-200'
          } shadow-xl`}>
            {/* Decorative blobs */}
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-gradient-to-br from-emerald-500/10 to-blue-600/10 -translate-y-16 translate-x-16 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-gradient-to-tr from-blue-500/10 to-emerald-400/10 translate-y-12 -translate-x-12 pointer-events-none" />

            <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-6">
              <UserAvatar username={currentUser?.username} />
              <div className="text-center sm:text-left">
                <p className={`text-sm font-medium uppercase tracking-widest mb-1 ${
                  theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'
                }`}>{t('dashboard', 'welcome')}</p>
                <h1 className={`text-3xl md:text-4xl font-extrabold ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  {currentUser?.username}
                  {currentUser?.is_admin && (
                    <span className="ml-3 inline-flex items-center gap-1 text-sm font-semibold px-2.5 py-0.5 rounded-full bg-gradient-to-r from-emerald-500 to-blue-600 text-white align-middle">
                      <Shield size={12} /> Admin
                    </span>
                  )}
                </h1>
                <p className={`mt-2 text-base ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`}>{t('dashboard', 'subtitle')}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── 2-column grid ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Account Info */}
          <DashCard>
            <div className={`px-6 py-4 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-100'}`}>
              <h2 className={`text-base font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {t('dashboard', 'accountInfo')}
              </h2>
            </div>
            <div className="px-6 py-2">
              <InfoRow icon={User} label={t('dashboard', 'username')} value={currentUser?.username ?? '—'} theme={theme} />
              <InfoRow icon={Mail} label={t('dashboard', 'email')} value={currentUser?.email ?? '—'} theme={theme} />
              <InfoRow
                icon={Shield}
                label={t('dashboard', 'accountType')}
                value={currentUser?.is_admin ? t('dashboard', 'administrator') : t('dashboard', 'user')}
                theme={theme}
              />
              {joinedDate && (
                <InfoRow icon={User} label={t('dashboard', 'memberSince')} value={joinedDate} theme={theme} />
              )}
            </div>
          </DashCard>

          {/* Quick Links */}
          <DashCard>
            <div className={`px-6 py-4 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-100'}`}>
              <h2 className={`text-base font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {t('dashboard', 'quickLinks')}
              </h2>
            </div>
            <div className="p-6 flex flex-col gap-3">
              <Link
                href="/"
                className={`flex items-center gap-3 p-4 rounded-xl transition-all group border ${
                  theme === 'dark'
                    ? 'border-gray-700 hover:border-emerald-500/50 hover:bg-emerald-900/20'
                    : 'border-gray-200 hover:border-emerald-400 hover:bg-emerald-50/60'
                }`}
              >
                <div className={`p-2 rounded-lg transition-colors ${
                  theme === 'dark'
                    ? 'bg-gray-700 group-hover:bg-emerald-900/50'
                    : 'bg-gray-100 group-hover:bg-emerald-100'
                }`}>
                  <Home size={18} className={theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'} />
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-semibold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>
                    {t('dashboard', 'visitPortfolio')}
                  </p>
                  <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                    {t('dashboard', 'visitPortfolioDesc')}
                  </p>
                </div>
                <ExternalLink size={14} className={theme === 'dark' ? 'text-gray-600' : 'text-gray-400'} />
              </Link>
            </div>
          </DashCard>

          {/* Message Form – spans full width */}
          <DashCard className="md:col-span-2">
            <DashMessageForm t={t} theme={theme} />
          </DashCard>

        </div>
      </motion.div>
    </ProtectedRoute>
  );
}

