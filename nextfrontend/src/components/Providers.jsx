/**
 * Client-side provider tree.
 *
 * Wraps the app in all context / session providers.
 * Extracted as a client component so that the root layout can stay
 * a React Server Component.
 */
'use client';

import { SessionProvider } from 'next-auth/react';
import { MotionConfig } from 'framer-motion';
import { ThemeProvider } from '../contexts/ThemeContext';
import { ToastProvider } from '../contexts/ToastContext';
import { LanguageProvider } from '../contexts/LanguageContext';

export default function Providers({ children }) {
  return (
    <SessionProvider>
      <MotionConfig reducedMotion="user">
        <ThemeProvider>
          <ToastProvider>
            <LanguageProvider>
              {children}
            </LanguageProvider>
          </ToastProvider>
        </ThemeProvider>
      </MotionConfig>
    </SessionProvider>
  );
}
