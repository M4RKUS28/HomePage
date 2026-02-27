'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { Link } from '../../i18n/navigation';
import { AlertTriangle, Home } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { useTranslations } from 'next-intl';

const pageVariants = {
    initial: { opacity: 0, scale: 0.8 },
    in: { opacity: 1, scale: 1 },
    out: { opacity: 0, scale: 0.8 }
};
const pageTransition = { type: "spring", stiffness: 200, damping: 20, duration: 0.5 };

export default function NotFound() {
  const { theme } = useTheme();
  const t = useTranslations('notFound');
  return (
    <motion.div
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        transition={pageTransition}
        className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center px-4 py-12"
    >
      <AlertTriangle className="w-24 h-24 text-yellow-400 mb-8 animate-bounce" />
      <h1 className={`text-6xl font-extrabold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>404</h1>
      <h2 className={`text-3xl font-semibold mb-6 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>{t('title')}</h2>
      <p className={`text-lg mb-8 max-w-md ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
        {t('description')}
      </p>
      <Link
        href="/"
        className="btn btn-primary inline-flex items-center text-lg px-8 py-3"
      >
        <Home size={20} className="mr-2" />
        {t('backHome')}
      </Link>
    </motion.div>
  );
}
