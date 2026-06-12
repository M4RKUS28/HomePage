'use client';
// Client component for Footer with SSR initial data
import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTranslations } from 'next-intl';
import { Github, Linkedin, Mail, Globe, Twitter, Languages } from 'lucide-react';

const LOCALE_LABELS = {
  en: 'English',
  de: 'Deutsch',
  vi: 'Tiếng Việt',
  fr: 'Français',
  it: 'Italiano',
  zh: '中文',
  ja: '日本語',
  es: 'Español',
  pt: 'Português',
};

const Footer = ({
  headerText = "Portfolio",
  socialLinks = [],
  ownerName = "Portfolio"
}) => {
  const { currentUser } = useAuth();
  const { locale, locales, changeLocale, isPending } = useLanguage();
  const t = useTranslations('footer');
  const currentYear = new Date().getFullYear();

  // Map platform names to Lucide icons
  const getIconForPlatform = (platform) => {
    switch (platform.toLowerCase()) {
      case 'github':
        return Github;
      case 'linkedin':
        return Linkedin;
      case 'email':
        return Mail;
      case 'twitter':
        return Twitter;
      case 'website':
      default:
        return Globe;
    }
  };

  // Create social link components
  const socialLinkComponents = socialLinks.map((link) => {
    const Icon = getIconForPlatform(link.platform);
    // Coerce url to string - Pydantic v2 HttpUrl objects serialize as non-primitives
    const href = link.url ? String(link.url) : '#';
    return {
      icon: Icon,
      href,
      label: link.platform
    };
  });

  const handleLocaleChange = (newLocale) => {
    changeLocale(newLocale, { userId: currentUser?.id });
  };

  return (
    <footer className="relative z-10 border-t border-line bg-band">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="inline-flex items-center gap-2.5">
            <span className="status-dot" />
            <motion.div
              initial={false}
              whileHover={{ scale: 1.04 }}
              className="font-display text-lg font-bold tracking-tight text-ink"
            >
              {headerText}
            </motion.div>
          </div>

          <div className="flex items-center gap-2">
            {socialLinkComponents.length > 0 ? (
              socialLinkComponents.map((social, index) => {
                const Icon = social.icon;
                return (
                  <motion.a
                    key={`social-${social.label}-${index}`}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ y: -3 }}
                    whileTap={{ scale: 0.92 }}
                    className="p-2.5 rounded-lg border border-line text-ink-2 hover:text-accent hover:border-accent transition-colors"
                    aria-label={social.label}
                  >
                    <Icon size={16} />
                  </motion.a>
                );
              })
            ) : (
              <span className="font-data text-xs text-ink-3">{t('noSocialLinks')}</span>
            )}
          </div>
        </div>

        {/* Language selector + copyright */}
        <div className="mt-10 pt-6 border-t border-line">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            {/* Language selector */}
            <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-2">
              <span className="inline-flex items-center gap-1.5 font-data text-[0.68rem] uppercase tracking-[0.18em] text-ink-3 mr-1">
                <Languages size={13} />
                {t('language')}
              </span>
              <div className="flex flex-wrap justify-center gap-1">
                {locales.map((loc) => (
                  <button
                    key={loc}
                    onClick={() => handleLocaleChange(loc)}
                    disabled={isPending}
                    className={`px-2.5 py-1 font-data text-xs rounded-md border transition-colors ${
                      locale === loc
                        ? 'bg-[var(--app-accent-fill)] text-[var(--app-on-accent-fill)] border-transparent font-semibold'
                        : 'border-line text-ink-3 hover:text-ink hover:border-line-strong'
                    } ${isPending ? 'opacity-50 cursor-wait' : ''}`}
                  >
                    {LOCALE_LABELS[loc] || loc.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Copyright */}
            <p className="font-data text-xs text-ink-3 text-center">
              © {currentYear} {ownerName} — {t('allRightsReserved')}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
