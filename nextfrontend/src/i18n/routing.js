import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'de', 'vi', 'fr', 'it', 'zh', 'ja', 'es', 'pt'],
  defaultLocale: 'en',
  localeDetection: true,
  localePrefix: 'always',
});
