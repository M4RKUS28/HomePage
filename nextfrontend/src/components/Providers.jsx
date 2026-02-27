/**
 * Client-side provider tree.
 *
 * Wraps the app in all context / session providers.
 * Extracted as a client component so that the root layout can stay
 * a React Server Component.
 */
'use client';

import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from '../contexts/ThemeContext';
import { ToastProvider } from '../contexts/ToastContext';

export default function Providers({ children }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <ToastProvider>
          {children}
        </ToastProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
