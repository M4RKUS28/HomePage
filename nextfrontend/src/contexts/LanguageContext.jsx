/**
 * Language context — syncs locale between:
 * - next-intl URL-based routing
 * - User account language preference (backend)
 * - Footer language selector
 *
 * On login: applies the user's stored language.
 * On register: saves the current locale as the user's language.
 * On footer change: updates URL locale + syncs to backend if logged in.
 */
'use client';

import { createContext, useContext, useCallback, useTransition } from 'react';
import { useRouter, usePathname } from '../i18n/navigation';
import { useLocale } from 'next-intl';
import { routing } from '../i18n/routing';
import { updateUserApi } from '../api/users';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  /**
   * Change the locale — updates the URL and optionally syncs to backend.
   * @param {string} newLocale - 'en' or 'de'
   * @param {object} [options]
   * @param {number} [options.userId] - If provided, also update the backend user record.
   */
  const changeLocale = useCallback(
    async (newLocale, { userId } = {}) => {
      if (!routing.locales.includes(newLocale) || newLocale === locale) return;

      // Update URL via next-intl navigation
      startTransition(() => {
        router.replace(pathname, { locale: newLocale });
      });

      // Sync to backend if user is logged in
      if (userId) {
        try {
          await updateUserApi(userId, { language: newLocale });
        } catch (err) {
          console.error('Failed to sync language to backend:', err);
        }
      }
    },
    [locale, router, pathname],
  );

  return (
    <LanguageContext.Provider
      value={{
        locale,
        locales: routing.locales,
        changeLocale,
        isPending,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within a LanguageProvider');
  return ctx;
}
